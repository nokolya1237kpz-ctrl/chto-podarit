import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '@/types/product';
import { getActiveProducts, supabaseAdmin } from '@/lib/supabase';
import { getEpnHotGoods, mapEpnGoodToProduct } from '@/lib/epn';
import { groupSimilarProducts, normalizeMarketplace } from '@/lib/productNormalize';
import { savePriceSnapshot } from '@/lib/priceSnapshots';
import { ANALYTICS_EVENTS, trackEvent } from '@server/analytics';
import { withTimeout } from '@lib/utils/timeout';
import { dedupeProducts } from '@entities/product/lib/dedupeProducts';

const marketplacePriority = ['local', 'sadovod', 'file_import', 'feed', 'epn', 'admitad', 'ozon', 'wildberries', 'manual'];
const STOP_WORDS = new Set(['купить', 'цена', 'товар', 'для', 'код', 'артикул', 'новый', 'оригинал', 'на', 'и', 'в']);

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\biphone\b/g, 'айфон iphone')
    .replace(/\bайфон\b/g, 'айфон iphone')
    .replace(/\bнаушники\b/g, 'наушники гарнитура')
    .replace(/\bгарнитура\b/g, 'наушники гарнитура')
    .replace(/\bсумка\b/g, 'сумка сумочка')
    .replace(/\bсумочка\b/g, 'сумка сумочка')
    .replace(/\bавтотовары\b/g, 'автотовары авто')
    .replace(/\bавто\b/g, 'автотовары авто')
    .replace(/\bсамсунг\b/g, 'samsung самсунг')
    .replace(/\bсяоми\b/g, 'xiaomi сяоми')
    .replace(/\bкод\s*\d+/gi, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value: string) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function compareSearchText(product: Product) {
  return normalizeSearchText([
    product.title,
    product.description,
    product.categoryLabel,
    product.categorySlug,
    product.externalProductId,
    product.marketplace,
    product.sourceProvider,
    product.sourceType,
    ...(product.tags || []),
    ...(product.interests || []),
    ...(product.giftTypes || []),
  ].filter(Boolean).join(' '));
}

function relevance(product: Product, query: string) {
  if (!query.trim()) return 1;
  const haystack = compareSearchText(product);
  const queryTokens = tokens(query);
  if (queryTokens.length === 0) return 1;
  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 1;
  }
  if (haystack.includes(normalizeSearchText(query))) score += 2;
  return score / queryTokens.length;
}

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
  const diagnostics: any[] = [];

  try {
    const localProducts = dedupeProducts(await withTimeout(getActiveProducts(supabaseAdmin as any), 4000, []));
    const local = localProducts
      .map((product) => ({ product, relevance: relevance(product, query) }))
      .filter((item) => (!query || item.relevance > 0) && (!marketplace || item.product.marketplace === marketplace))
      .sort((a, b) => b.relevance - a.relevance)
      .map((item) => item.product);
    sourceStats.local = { count: local.length, status: 'active' };
    sourceStats.catalog = { count: local.length, status: 'active' };

    const all: Product[] = local.map((product) => toCompareProduct(product, product.sourceProvider || 'local'));

    if (all.length < 8) {
      try {
        const goods = await withTimeout(getEpnHotGoods({ q: query, limit: 8 }), 3500, []);
        const epnProducts = goods.map((good) => toCompareProduct(mapEpnGoodToProduct(good), 'epn'));
        all.push(...epnProducts);
        sourceStats.epn = { count: epnProducts.length, status: epnProducts.length ? 'active' : 'optional' };
      } catch {
        sourceStats.epn = { count: 0, status: 'limited', error: 'Источник временно недоступен' };
      }
    }

    let data = all
      .filter((product) => product.title)
      .filter((product) => !marketplace || product.marketplace === marketplace)
      .filter((product) => !minPrice || product.price >= minPrice)
      .filter((product) => !maxPrice || product.price <= maxPrice);

    data = data.sort((a, b) => {
      if (sort === 'relevance') {
        const rel = relevance(b, query) - relevance(a, query);
        if (rel !== 0) return rel;
        return marketplacePriority.indexOf(String(a.sourceProvider)) - marketplacePriority.indexOf(String(b.sourceProvider));
      }
      if (sort === 'price_desc') return (b.price || 0) - (a.price || 0);
      return (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER);
    });

    const groups = groupSimilarProducts(data);
    await Promise.all(data.slice(0, 50).map((product) => savePriceSnapshot({ ...product, query, sourcePage: 'compare' })));
    await trackEvent(ANALYTICS_EVENTS.searchCompare, {
      query,
      marketplace: marketplace || null,
      metadata: {
        query,
        local_results_count: local.length,
        provider_results_count: Math.max(0, data.length - local.length),
        total_results_count: data.length,
        results_count: data.length,
        cheapest_marketplace: data[0]?.marketplace || null,
        min_price: data.length ? Math.min(...data.map((product) => Number(product.price || 0)).filter(Boolean)) : null,
        max_price: data.length ? Math.max(...data.map((product) => Number(product.price || 0)).filter(Boolean)) : null,
        filters: { marketplace, sort, minPrice, maxPrice },
        source_stats: sourceStats,
        providers_status: sourceStats,
      },
    });

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
