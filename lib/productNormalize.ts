import type { Product } from '@/types/product';

export function cleanupTitle(title?: string) {
  return (title || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*[|/\\-]\s*(купить|цена|доставка).*$/i, '')
    .trim();
}

export const normalizeTitle = cleanupTitle;

export function normalizePrice(value?: string | number | null) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  return Number(String(value || '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
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

function tokenize(title?: string) {
  return cleanupTitle(title)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .filter((token) => !['для', 'with', 'and', 'the', 'купить', 'цена'].includes(token));
}

function extractModel(title?: string) {
  return tokenize(title).find((token) => /[a-zа-я]+\d+|\d+[a-zа-я]+/i.test(token));
}

function extractBrand(title?: string) {
  return tokenize(title)[0] || '';
}

function hasVariantConflict(a?: string, b?: string) {
  const colors = ['black', 'white', 'red', 'blue', 'green', 'черный', 'чёрный', 'белый', 'красный', 'синий', 'зелёный'];
  const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', '128gb', '256gb', '512gb', '1tb'];
  const at = tokenize(a);
  const bt = tokenize(b);
  const variantWords = [...colors, ...sizes];
  return variantWords.some((word) => (at.includes(word) || bt.includes(word)) && at.includes(word) !== bt.includes(word));
}

export function calculateSimilarity(a?: string, b?: string) {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (left.size === 0 || right.size === 0) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / Math.max(left.size, right.size);
}

export function detectSameProduct(a: Partial<Product>, b: Partial<Product>) {
  if (a.externalProductId && b.externalProductId && a.externalProductId === b.externalProductId) return true;
  if (normalizeProductUrl(a.originalUrl) && normalizeProductUrl(a.originalUrl) === normalizeProductUrl(b.originalUrl)) return true;
  if (hasVariantConflict(a.title, b.title)) return false;

  const aBrand = extractBrand(a.title);
  const bBrand = extractBrand(b.title);
  const aModel = extractModel(a.title);
  const bModel = extractModel(b.title);
  if (aBrand && bBrand && aModel && bModel && aBrand === bBrand && aModel === bModel) return true;
  return calculateSimilarity(a.title, b.title) > 0.72;
}

export type ProductGroup = {
  id: string;
  title: string;
  imageUrl?: string;
  items: Product[];
  cheapest?: Product;
};

export function groupSimilarProducts(products: Product[]): ProductGroup[] {
  const groups: ProductGroup[] = [];
  for (const product of products) {
    const existing = groups.find((group) => group.items.some((item) => detectSameProduct(item, product)));
    if (existing) {
      existing.items.push(product);
      existing.items.sort((a, b) => a.price - b.price);
      existing.cheapest = existing.items[0];
      if (!existing.imageUrl && product.imageUrl) existing.imageUrl = product.imageUrl;
    } else {
      groups.push({
        id: getDedupeKey(product),
        title: cleanupTitle(product.title),
        imageUrl: product.imageUrl,
        items: [product],
        cheapest: product,
      });
    }
  }
  return groups.sort((a, b) => (a.cheapest?.price || 0) - (b.cheapest?.price || 0));
}

export function isPublishableProduct(input: Partial<Product>) {
  return Boolean(input.title && input.imageUrl && Number(input.price || 0) > 0);
}
