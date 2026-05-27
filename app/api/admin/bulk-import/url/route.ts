import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { browserParser } from '@server/parsers/browserParser';
import { normalizeParsedProduct } from '@server/parsers/normalizeParsedProduct';
import { importNormalizedProduct } from '@/lib/importProduct';
import { detectMarketplaceFromProductUrl } from '@/lib/epn';

function titleFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const raw = segments.reverse().find((segment) => !/^\d+$/.test(segment) && !/(product|catalog|detail|item)/i.test(segment)) || parsed.hostname;
    return decodeURIComponent(raw)
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return 'Товар по ссылке';
  }
}

function classifyFetchError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const statusMatch = message.match(/\b(403|404|429|500|502|503|504)\b/);
  const reason = /captcha|limited|429|403/i.test(message) ? 'source_blocked' : /network|fetch failed/i.test(message) ? 'fetch_failed' : 'fetch_failed';
  return {
    stage: 'fetch',
    reason,
    httpStatus: statusMatch ? Number(statusMatch[1]) : undefined,
    error: message,
  };
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json();
    const urls = Array.isArray(body.urls) ? body.urls : String(body.url || '').split(/\s+/).filter(Boolean);
    if (urls.length === 0) {
      return NextResponse.json({ success: false, error: 'Не указан URL' }, { status: 400 });
    }

    let imported = 0;
    let active = 0;
    let drafted = 0;
    let failed = 0;
    const reports: any[] = [];

    for (const url of urls.slice(0, 100)) {
      try {
        const parsed = await browserParser(url, { allowAnyPublicDomain: true });
        const marketplace = detectMarketplaceFromProductUrl(parsed.originalUrl || url);
        const saved = await importNormalizedProduct({
          ...normalizeParsedProduct({ ...parsed, originalUrl: parsed.originalUrl || url, marketplace }, 'manual'),
          marketplace,
        });
        const report = {
          url,
          marketplace,
          fetched: true,
          titleFound: Boolean(parsed.title),
          imageFound: Boolean(parsed.imageUrl),
          priceFound: Number(parsed.price || 0) > 0,
          created: Boolean(saved),
          createdActive: saved?.status === 'active',
          createdDraft: saved?.status === 'draft',
          status: saved?.status || 'skipped',
        };
        reports.push(report);
        if (saved?.status === 'active') active += 1;
        if (saved?.status === 'draft') drafted += 1;
        if (saved) imported += 1;
      } catch (error) {
        console.error('URL import failed:', error);
        const marketplace = detectMarketplaceFromProductUrl(url);
        const details = classifyFetchError(error);
        const fallbackTitle = titleFromUrl(url);
        let saved = null;
        try {
          saved = await importNormalizedProduct({
            title: fallbackTitle || 'Товар по ссылке',
            description: '',
            price: 0,
            imageUrl: '',
            originalUrl: url,
            affiliateUrl: url,
            marketplace,
            status: 'draft',
            isActive: false,
            sourceProvider: 'url_import' as any,
            sourceType: 'parser',
            importStatus: details.reason,
            enrichmentStatus: 'failed',
            parseErrors: [details.error],
            tags: ['url_import', marketplace].filter(Boolean),
          });
        } catch (fallbackError) {
          reports.push({
            url,
            marketplace,
            fetched: false,
            titleFound: Boolean(fallbackTitle),
            imageFound: false,
            priceFound: false,
            created: false,
            createdActive: false,
            createdDraft: false,
            status: 'error',
            stage: 'save',
            reason: 'draft_save_failed',
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
            fetchError: details,
          });
          failed += 1;
          continue;
        }
        reports.push({
          url,
          marketplace,
          fetched: false,
          titleFound: Boolean(fallbackTitle),
          imageFound: false,
          priceFound: false,
          created: Boolean(saved),
          createdActive: false,
          createdDraft: saved?.status === 'draft',
          status: saved?.status || 'draft',
          stage: details.stage,
          reason: details.reason,
          httpStatus: details.httpStatus,
          responseBody: null,
          error: details.error,
          message: saved ? 'создан черновик' : 'черновик не создан',
        });
        if (saved) {
          imported += 1;
          drafted += 1;
        } else {
          failed += 1;
        }
      }
    }

    if (imported === 0) {
      const reason = reports[0]?.reason || 'fetch_failed';
      return NextResponse.json({ success: false, error: reason, reason, imported, active, drafted, failed, total: Math.min(urls.length, 100), reports }, { status: 400 });
    }

    return NextResponse.json({ success: true, imported, active, drafted, failed, total: Math.min(urls.length, 100), reports });
  } catch (error) {
    console.error('URL bulk import error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка импорта URL' },
      { status: 500 }
    );
  }
}
