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

  const wb: any = providers.wildberries;
  const wbResult = wb.searchWithDiagnostics
    ? await wb.searchWithDiagnostics({ query, limit: 5 })
    : { products: await wb.searchProducts({ query, limit: 5 }), diagnostics: [] };
  diagnostics.push(...wbResult.diagnostics);
  samples.wildberries = wbResult.products.slice(0, 3);

  try {
    const epn = await getEpnHotGoods({ q: query, limit: 5 });
    diagnostics.push({ provider: 'epn', query, stage: 'fetch', status: 'success', foundRaw: epn.length });
    samples.epn = epn.slice(0, 3);
  } catch (error) {
    diagnostics.push({ provider: 'epn', query, stage: 'fetch', status: 'warning', error: error instanceof Error ? error.message : String(error), details: (error as any)?.details });
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
    } catch (error) {
      diagnostics.push({ provider: id, query, stage: 'fetch', status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  }

  return NextResponse.json({ success: true, query, diagnostics, samples });
}
