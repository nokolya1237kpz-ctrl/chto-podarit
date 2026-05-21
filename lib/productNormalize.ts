import type { Product } from '@/types/product';

export function cleanupTitle(title?: string) {
  return (title || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*[|/\\-]\s*(купить|цена|доставка).*$/i, '')
    .trim();
}

export function normalizeMarketplace(value?: string) {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('ozon')) return 'ozon';
  if (normalized.includes('wildberries') || normalized === 'wb' || normalized.includes('wb.ru')) return 'wildberries';
  if (normalized.includes('ali')) return 'aliexpress';
  if (normalized.includes('yandex')) return 'yandex_market';
  return normalized || 'other';
}

export function normalizeProductUrl(url?: string) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function getDedupeKey(input: Partial<Product>) {
  const external = `${input.sourceProvider || ''}:${input.externalProductId || ''}`;
  if (input.externalProductId) return external.toLowerCase();
  const url = normalizeProductUrl(input.originalUrl || input.affiliateUrl);
  if (url) return `${input.marketplace || 'other'}:${url}`.toLowerCase();
  return `${input.marketplace || 'other'}:${cleanupTitle(input.title).toLowerCase()}`;
}

export function isPublishableProduct(input: Partial<Product>) {
  return Boolean(input.title && input.imageUrl && Number(input.price || 0) > 0);
}
