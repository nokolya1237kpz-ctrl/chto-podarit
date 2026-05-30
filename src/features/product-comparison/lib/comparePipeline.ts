import 'server-only';

import type { Product } from '@entities/product/types';
import { dedupeProducts } from '@entities/product/lib/dedupeProducts';
import { groupSimilarProducts, normalizeMarketplace } from '@entities/product/lib/productNormalize';
import { getActiveProducts, supabaseAdmin } from '@lib/supabase';
import { withTimeout } from '@lib/utils/timeout';
import { providers } from '@server/providers';
import { searchLocalProducts } from './localProductSearch';

export type CompareProviderStatus = {
  status: 'configured' | 'reachable' | 'searchable' | 'empty' | 'limited' | 'failed';
  count: number;
  reason?: string;
  requestUrl?: string | null;
  httpStatus?: number | null;
};

type ComparePipelineInput = {
  query: string;
  marketplace?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  includeProviders?: boolean;
};

function asCompareProduct(product: any, sourceProvider?: string): Product {
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

function providerStatus(provider: string, diagnostics: any[], products: Product[]): CompareProviderStatus {
  const own = diagnostics.filter((item) => item.provider === provider);
  const last = own.at(-1);
  const fetch = [...own].reverse().find((item) => item.stage === 'fetch');
  const httpStatus = Number(fetch?.httpStatus || 0) || null;
  const limited = httpStatus === 403 || httpStatus === 429 || own.some((item) => /limit|blocked|captcha|огранич/i.test(String(item.error || item.details?.reason || '')));
  const timeout = own.some((item) => /timeout/i.test(String(item.error || item.details?.reason || '')));
  const failed = own.some((item) => item.status === 'error');
  const status = products.length ? 'searchable' : limited ? 'limited' : timeout || failed ? 'failed' : own.length ? 'empty' : 'configured';
  return {
    status,
    count: products.length,
    reason: status === 'empty' ? 'no_items' : status === 'limited' ? 'rate_limited_or_blocked' : timeout ? 'timeout' : status === 'failed' ? 'request_failed' : undefined,
    requestUrl: fetch?.url || last?.url || null,
    httpStatus,
  };
}

async function optionalProviderSearch(id: 'wildberries' | 'ozon', query: string, diagnostics: any[]) {
  try {
    const provider: any = providers[id];
    const result = provider?.searchWithDiagnostics
      ? await withTimeout(provider.searchWithDiagnostics({ query, limit: 8 }), 1500, { products: [], diagnostics: [{ provider: id, stage: 'fetch', status: 'warning', error: 'timeout', details: { reason: 'timeout' } }] })
      : { products: await withTimeout(provider.searchProducts({ query, limit: 8 }), 1500, []), diagnostics: [] };
    diagnostics.push(...(result.diagnostics || []));
    return (result.products || []).map((product: Product) => asCompareProduct(product, id));
  } catch (error) {
    diagnostics.push({ provider: id, query, stage: 'fetch', status: 'error', error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

export async function runComparePipeline(input: ComparePipelineInput) {
  const query = input.query.trim();
  const diagnostics: any[] = [];
  const sourceStats: Record<string, CompareProviderStatus> = {};
  const localCatalog = await withTimeout(getActiveProducts(supabaseAdmin as any), 4000, []);
  const local = searchLocalProducts(localCatalog, query);
  sourceStats.local = { status: local.length ? 'searchable' : 'empty', count: local.length, reason: local.length ? undefined : 'no_items' };
  diagnostics.push({ provider: 'local', query, stage: 'normalize', status: local.length ? 'success' : 'warning', normalized: local.length });

  const all: Product[] = local.map((product) => asCompareProduct(product, product.sourceProvider));
  if (input.includeProviders !== false) {
    const providerResults = await Promise.all((['wildberries', 'ozon'] as const).map(async (id) => ({ id, products: await optionalProviderSearch(id, query, diagnostics) })));
    for (const { id, products } of providerResults) {
      sourceStats[id] = providerStatus(id, diagnostics, products);
      all.push(...products);
    }
  }

  let items = dedupeProducts(all)
    .filter((product) => product.title)
    .filter((product) => !input.marketplace || product.marketplace === input.marketplace)
    .filter((product) => !input.minPrice || product.price >= input.minPrice)
    .filter((product) => !input.maxPrice || product.price <= input.maxPrice);

  items = items.sort((a, b) => {
    if (input.sort === 'price_desc') return b.price - a.price;
    if (input.sort === 'relevance') return searchLocalProducts([a, b], query)[0]?.id === a.id ? -1 : 1;
    return a.price - b.price;
  });

  return {
    query,
    count: items.length,
    items,
    groups: groupSimilarProducts(items),
    cheapest: items[0] || null,
    sourceStats,
    diagnostics,
  };
}
