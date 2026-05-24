import { detectMarketplaceFromProductUrl } from '@/lib/epn';
import type { ImportProductInput } from '@/lib/importProduct';

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function pick(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

export function normalizeDatasetPrice(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  return Number(String(value || '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}

export function normalizeDatasetImage(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  if (typeof raw === 'object') {
    return String(raw.url || raw.src || raw.imageUrl || '').trim();
  }
  return String(raw).trim();
}

export function detectDatasetType(items: Record<string, any>[]) {
  const first = items[0] || {};
  if ('sku' in first && ('cardPrice' in first || 'coverImageUrl' in first || 'priceDecimal' in first)) {
    return 'ozon_scraper';
  }
  if ('sku' in first && String(first.url || '').includes('ozon')) {
    return 'ozon_scraper';
  }
  return 'generic';
}

export function normalizeOzonDatasetItem(row: Record<string, any>): ImportProductInput {
  const originalUrl = String(pick(row, ['productUrl', 'url', 'link']) || '').trim();
  const imageUrl = normalizeDatasetImage(pick(row, ['imageUrl', 'coverImageUrl', 'image', 'images', 'picture']));
  const title = String(pick(row, ['title', 'name']) || '').trim();
  const brand = String(pick(row, ['brand']) || '').trim();
  const category = String(pick(row, ['category', 'categoryName']) || '').trim();
  const rating = normalizeDatasetPrice(pick(row, ['rating']));
  const marketplace = detectMarketplaceFromProductUrl(originalUrl);

  return {
    title,
    description: String(pick(row, ['description', 'richDescription']) || '').trim(),
    price: normalizeDatasetPrice(pick(row, ['cardPrice', 'price', 'priceDecimal'])),
    oldPrice: normalizeDatasetPrice(pick(row, ['originalPrice', 'oldPrice'])) || undefined,
    imageUrl,
    originalUrl,
    affiliateUrl: String(pick(row, ['affiliateUrl', 'deeplink']) || originalUrl).trim(),
    marketplace: marketplace === 'other' ? 'ozon' : marketplace,
    externalProductId: String(pick(row, ['externalProductId', 'sku', 'id']) || originalUrl || title).trim(),
    sourceProvider: 'feed',
    sourceType: 'feed',
    category,
    tags: ['ozon', brand, category].filter(Boolean),
    currency: 'RUB',
    wowRating: rating ? Math.min(10, Math.max(1, Math.round(rating * 2))) : 7,
    importStatus: imageUrl && title ? 'dataset_normalized' : 'dataset_incomplete',
  };
}
