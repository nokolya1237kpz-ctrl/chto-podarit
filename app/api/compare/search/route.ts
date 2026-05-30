import { NextRequest, NextResponse } from 'next/server';
import { runComparePipeline } from '@features/product-comparison/lib/comparePipeline';
import { savePriceSnapshot } from '@/lib/priceSnapshots';
import { ANALYTICS_EVENTS, trackEvent } from '@server/analytics';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || searchParams.get('query') || '';
  const marketplace = searchParams.get('marketplace') || '';
  const sort = searchParams.get('sort') || 'price_asc';
  const minPrice = Number(searchParams.get('minPrice') || 0);
  const maxPrice = Number(searchParams.get('maxPrice') || 0);

  try {
    const result = await runComparePipeline({ query, marketplace, sort, minPrice, maxPrice });
    void Promise.allSettled(result.items.slice(0, 50).map((product) => savePriceSnapshot({ ...product, query, sourcePage: 'compare' })));
    void trackEvent(ANALYTICS_EVENTS.searchCompare, {
      query,
      marketplace: marketplace || null,
      metadata: {
        query,
        local_results_count: result.sourceStats.local?.count || 0,
        provider_results_count: Math.max(0, result.count - (result.sourceStats.local?.count || 0)),
        total_results_count: result.count,
        providers_status: result.sourceStats,
        filters: { marketplace, sort, minPrice, maxPrice },
      },
    });

    return NextResponse.json({ success: true, ...result, data: result.items });
  } catch (error) {
    return NextResponse.json(
      { success: false, query, count: 0, items: [], data: [], groups: [], sourceStats: {}, diagnostics: [], error: error instanceof Error ? error.message : 'Ошибка поиска' },
      { status: 500 }
    );
  }
}
