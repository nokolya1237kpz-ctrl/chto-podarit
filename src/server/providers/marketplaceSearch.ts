import type { Product } from '@entities/product/types';
import { safeFetch } from '@server/parsers/safeFetch';
import { parseProductHtml } from '@server/parsers/htmlParser';
import { normalizePrice } from '@entities/product/lib/productNormalize';

export function makeSearchUrl(template: string, query?: string) {
  return template.replace('{query}', encodeURIComponent(query || ''));
}

export function toProviderProduct(input: Partial<Product> & { idSeed: string }): Product {
  return {
    id: input.idSeed,
    title: input.title || 'Товар',
    description: input.description || '',
    price: normalizePrice(input.price),
    oldPrice: input.oldPrice,
    currency: input.currency || 'RUB',
    marketplace: input.marketplace || 'other',
    originalUrl: input.originalUrl || '',
    affiliateUrl: input.affiliateUrl,
    externalProductId: input.externalProductId || input.idSeed,
    imageUrl: input.imageUrl,
    recipients: [],
    budget: '',
    interests: [],
    occasions: [],
    giftTypes: [],
    tags: input.tags || [],
    wowRating: input.wowRating || 7,
    riskLevel: input.riskLevel || 'low',
    isActive: true,
    status: 'active',
    sourceProvider: input.sourceProvider || 'manual',
    sourceType: input.sourceType || input.sourceProvider || 'manual',
  };
}

export async function parseSearchPageAsSingleProduct(url: string, marketplace: string, query?: string) {
  const html = await safeFetch(url, { ttlMs: 20 * 60 * 1000, crawlDelayMs: 1500, maxRequestsPerHour: 30 });
  const parsed = parseProductHtml(html, url);
  if (!parsed.title) return [];
  return [toProviderProduct({
    idSeed: `${marketplace}:${query || url}`,
    title: parsed.title,
    description: parsed.description,
    imageUrl: parsed.imageUrl,
    price: parsed.price,
    originalUrl: url,
    marketplace,
    sourceProvider: marketplace as any,
    sourceType: 'parser' as any,
    tags: [marketplace, query || 'search'].filter(Boolean),
  })];
}
