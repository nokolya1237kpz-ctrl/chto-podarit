import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { browserParser } from '@/lib/parsers/browserParser';
import { normalizeParsedProduct } from '@/lib/parsers/normalizeParsedProduct';
import { importNormalizedProduct } from '@/lib/importProduct';
import { detectMarketplaceFromProductUrl } from '@/lib/epn';

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
        reports.push({
          url,
          marketplace: detectMarketplaceFromProductUrl(url),
          fetched: false,
          titleFound: false,
          imageFound: false,
          priceFound: false,
          created: false,
          createdActive: false,
          createdDraft: false,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
        failed += 1;
      }
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
