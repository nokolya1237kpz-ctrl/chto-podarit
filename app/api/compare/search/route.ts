import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '@/types/product';
import { getActiveProducts, supabaseAdmin } from '@/lib/supabase';
import { getEpnHotGoods, mapEpnGoodToProduct } from '@/lib/epn';
import { providers } from '@/lib/providers';
import { groupSimilarProducts, normalizeMarketplace } from '@/lib/productNormalize';
import { savePriceSnapshot } from '@/lib/priceSnapshots';

const marketplacePriority = ['epn', 'wildberries', 'ozon', 'aliexpress', 'yandex_market', 'feed', 'manual'];

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

  try {
    const local = (await getActiveProducts(supabaseAdmin as any)).filter((product) => {
      const text = `${product.title} ${product.description || ''}`.toLowerCase();
      return (!query || text.includes(query.toLowerCase())) && (!marketplace || product.marketplace === marketplace);
    });
    sourceStats.local = { count: local.length, status: 'active' };

    const all: Product[] = local.map((product) => toCompareProduct(product, 'manual'));

    try {
      const goods = await getEpnHotGoods({ q: query, limit: 20 });
      const epnProducts = goods.map((good) => toCompareProduct(mapEpnGoodToProduct(good), 'epn'));
      all.push(...epnProducts);
      sourceStats.epn = { count: epnProducts.length, status: 'active' };
    } catch (error) {
      sourceStats.epn = { count: 0, status: 'error', error: error instanceof Error ? error.message : String(error) };
    }

    for (const id of ['wildberries', 'ozon', 'aliexpress', 'yandex_market']) {
      try {
        const provider = providers[id];
        const results = provider ? await provider.searchProducts({ query, limit: 20 }) : [];
        all.push(...results.map((product) => toCompareProduct(product, id)));
        sourceStats[id] = { count: results.length, status: 'active' };
      } catch (error) {
        sourceStats[id] = { count: 0, status: String(error).includes('limited') ? 'limited' : 'error', error: error instanceof Error ? error.message : String(error) };
      }
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
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, query, sourceStats, error: error instanceof Error ? error.message : 'Ошибка поиска' },
      { status: 500 }
    );
  }
}
