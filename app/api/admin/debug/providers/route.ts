import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { providers } from '@server/providers';
import { getEpnHotGoods } from '@/lib/epn';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'наушники';
  const diagnostics: any[] = [];
  const samples: Record<string, any[]> = {};
  const providerStatuses: Record<string, any> = {};

  function summarize(provider: string, providerDiagnostics: any[], products: any[] = []) {
    const last = [...providerDiagnostics].reverse().find((item) => item.provider === provider);
    const fetch = [...providerDiagnostics].reverse().find((item) => item.provider === provider && item.stage === 'fetch');
    const parse = [...providerDiagnostics].reverse().find((item) => item.provider === provider && ['parse_json', 'parse_html'].includes(item.stage));
    const normalized = products.length || Math.max(0, ...providerDiagnostics.filter((item) => item.provider === provider).map((item) => Number(item.normalized || 0)));
    const raw = Math.max(0, ...providerDiagnostics.filter((item) => item.provider === provider).map((item) => Number(item.foundRaw || 0)));
    const limited = providerDiagnostics.some((item) => item.provider === provider && (item.httpStatus === 403 || item.httpStatus === 429 || /limit|blocked|captcha|огранич/i.test(String(item.error || item.details?.reason || ''))));
    const failed = providerDiagnostics.some((item) => item.provider === provider && item.status === 'error');
    const status = normalized > 0 ? 'searchable' : limited ? 'limited' : failed ? 'failed' : (fetch || parse) ? 'empty' : 'configured';
    providerStatuses[provider] = {
      provider,
      query,
      requestUrl: fetch?.url || last?.url || null,
      httpStatus: fetch?.httpStatus || null,
      rawItemsCount: raw,
      normalizedItemsCount: normalized,
      configured: true,
      reachable: Boolean(fetch && fetch.status !== 'error'),
      searchable: normalized > 0,
      status,
      reason: status === 'empty' ? 'no_items' : status === 'limited' ? 'rate_limited_or_blocked' : status === 'failed' ? 'request_failed' : 'ok',
      lastError: last?.error || null,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  const wb: any = providers.wildberries;
  const wbResult = wb.searchWithDiagnostics
    ? await wb.searchWithDiagnostics({ query, limit: 5 })
    : { products: await wb.searchProducts({ query, limit: 5 }), diagnostics: [] };
  diagnostics.push(...wbResult.diagnostics);
  samples.wildberries = wbResult.products.slice(0, 3);
  summarize('wildberries', wbResult.diagnostics, wbResult.products);

  try {
    const epn = await getEpnHotGoods({ q: query, limit: 5 });
    diagnostics.push({ provider: 'epn', query, stage: 'fetch', status: 'success', foundRaw: epn.length });
    samples.epn = epn.slice(0, 3);
    summarize('epn', diagnostics, epn);
  } catch (error) {
    diagnostics.push({ provider: 'epn', query, stage: 'fetch', status: 'warning', error: error instanceof Error ? error.message : String(error), details: (error as any)?.details });
    summarize('epn', diagnostics, []);
  }

  for (const id of ['ozon', 'aliexpress', 'yandex_market', 'dns_shop', 'citilink', 'megamarket', 'mvideo', 'eldorado']) {
    try {
      const provider: any = providers[id];
      const result = provider?.searchWithDiagnostics
        ? await provider.searchWithDiagnostics({ query, limit: 3 })
        : { products: await provider.searchProducts({ query, limit: 3 }), diagnostics: [] };
      const products = result.products || [];
      diagnostics.push(...(result.diagnostics || []));
      diagnostics.push({ provider: id, query, stage: 'normalize', status: products.length ? 'success' : 'warning', normalized: products.length, error: products.length ? undefined : 'Источник ограничил публичный парсинг или требует JS/API' });
      samples[id] = products;
      summarize(id, diagnostics, products);
    } catch (error) {
      diagnostics.push({ provider: id, query, stage: 'fetch', status: 'error', error: error instanceof Error ? error.message : String(error) });
      summarize(id, diagnostics, []);
    }
  }

  return NextResponse.json({ success: true, query, diagnostics, samples, providerStatuses });
}
