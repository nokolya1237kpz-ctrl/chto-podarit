import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '@/types/product';
import { getActiveProducts, supabaseAdmin } from '@/lib/supabase';
import { getEpnHotGoods, mapEpnGoodToProduct } from '@/lib/epn';
import { providers } from '@server/providers';
import { groupSimilarProducts, normalizeMarketplace } from '@/lib/productNormalize';
import { savePriceSnapshot } from '@/lib/priceSnapshots';
import type { ProviderDiagnostic } from '@/lib/diagnostics/providerDiagnostics';

const marketplacePriority = ['search_api', 'epn', 'wildberries', 'feed', 'manual'];

function toCompareProduct(product: any, sourceProvider?: string): Product {
  return {
    id: product.id || product.externalProductId || `${sourceProvider}:${product.title}:${product.price}`,
    title: product.title || product.name || 'Товар',
    description: product.description || '',
    price: Number(product.price || 0),
    oldPrice: product.oldPrice,
    currency: product.currency || 'RUB',
    marketplace: normalizeMarketplace(product.marketplace),
    originalUrl: product.originalUrl || product.directUrl || product.url || '',
    affiliateUrl: product.affiliateUrl,
    externalProductId: product.externalProductId || product.id,
    imageUrl: product.imageUrl || product.image,
    recipients: product.recipients || [],
    budget: product.budget || '',
    interests: product.interests || [],
    occasions: product.occasions || [],
    giftTypes: product.giftTypes || [],
    tags: product.tags || [],
    wowRating: product.wowRating || 7,
    riskLevel: product.riskLevel || 'low',
    isActive: product.isActive ?? true,
    status: product.status || 'active',
    sourceProvider: (sourceProvider || product.sourceProvider || 'manual') as any,
    sourceType: (product.sourceType || sourceProvider || 'manual') as any,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || searchParams.get('query') || '';
  const marketplace = searchParams.get('marketplace') || '';
  const sort = searchParams.get('sort') || 'price_asc';
  const minPrice = Number(searchParams.get('minPrice') || 0);
  const maxPrice = Number(searchParams.get('maxPrice') || 0);
  const sourceStats: Record<string, { count: number; status: string; error?: string }> = {};
  const diagnostics: ProviderDiagnostic[] = [];

  try {
    const local = (await getActiveProducts(supabaseAdmin as any)).filter((product) => {
      const text = `${product.title} ${product.description || ''} ${product.categoryLabel || ''} ${product.externalProductId || ''} ${(product.tags || []).join(' ')}`.toLowerCase();
      return (!query || text.includes(query.toLowerCase())) && (!marketplace || product.marketplace === marketplace);
    });
    sourceStats.local = { count: local.length, status: 'active' };

    const all: Product[] = local.map((product) => toCompareProduct(product, 'manual'));

    if (all.length < 5) {
      try {
        const provider: any = providers.search_api;
        const result = provider?.searchWithDiagnostics
          ? await provider.searchWithDiagnostics({ query, limit: 8 })
          : { products: [], diagnostics: [] };
        const results: Product[] = result.products || [];
        all.push(...results.map((product) => toCompareProduct(product, 'search_api')));
        diagnostics.push(...(result.diagnostics || []));
        sourceStats.search_api = {
          count: results.length,
          status: results.length ? 'active' : 'requires_api',
          error: results.length ? undefined : 'Настройте SERPAPI_KEY, GOOGLE_API_KEY/GOOGLE_CSE_ID или BING_SEARCH_API_KEY',
        };
      } catch (error) {
        sourceStats.search_api = { count: 0, status: 'error', error: error instanceof Error ? error.message : String(error) };
        diagnostics.push({ provider: 'search_api', query, stage: 'fetch', status: 'error', error: sourceStats.search_api.error });
      }
    }

    if (all.length < 5) {
      try {
        const wbProvider: any = providers.wildberries;
        const wbResult = wbProvider.searchWithDiagnostics
          ? await wbProvider.searchWithDiagnostics({ query, limit: 10 })
          : { products: await wbProvider.searchProducts({ query, limit: 10 }), diagnostics: [] };
        all.push(...wbResult.products.map((product: Product) => toCompareProduct(product, 'wildberries')));
        diagnostics.push(...wbResult.diagnostics);
        const wbLimited = wbResult.diagnostics?.some((item: ProviderDiagnostic) => item.httpStatus === 403 || item.httpStatus === 429 || String(item.error || '').includes('limited'));
        sourceStats.wildberries = {
          count: wbResult.products.length,
          status: wbResult.products.length ? 'active' : wbLimited ? 'limited' : 'optional',
          error: wbResult.products.length ? undefined : wbLimited ? 'Источник временно ограничил публичный запрос' : 'WB optional source did not return products',
        };
      } catch (error) {
        sourceStats.wildberries = { count: 0, status: 'limited', error: error instanceof Error ? error.message : String(error) };
      }
    }

    try {
      const goods = await getEpnHotGoods({ q: query, limit: 10 });
      const epnProducts = goods.map((good) => toCompareProduct(mapEpnGoodToProduct(good), 'epn'));
      all.push(...epnProducts);
      sourceStats.epn = { count: epnProducts.length, status: 'active' };
    } catch (error) {
      sourceStats.epn = { count: 0, status: (error as any)?.status === 429 ? 'limited' : 'optional', error: error instanceof Error ? error.message : String(error) };
      diagnostics.push({ provider: 'epn', query, stage: 'fetch', status: 'warning', error: sourceStats.epn.error, details: (error as any)?.details });
    }

    let data = all
      .filter((product) => product.title)
      .filter((product) => !marketplace || product.marketplace === marketplace)
      .filter((product) => !minPrice || product.price >= minPrice)
      .filter((product) => !maxPrice || product.price <= maxPrice);

    data = data.sort((a, b) => {
      if (sort === 'relevance') return marketplacePriority.indexOf(String(a.sourceProvider)) - marketplacePriority.indexOf(String(b.sourceProvider));
      return (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER);
    });

    const groups = groupSimilarProducts(data);
    await Promise.all(data.slice(0, 50).map((product) => savePriceSnapshot({ ...product, query, sourcePage: 'compare' })));

    return NextResponse.json({
      success: true,
      query,
      sourceStats,
      data,
      groups,
      cheapest: data[0] || null,
      count: data.length,
      diagnostics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, query, sourceStats, error: error instanceof Error ? error.message : 'Ошибка поиска' },
      { status: 500 }
    );
  }
}
