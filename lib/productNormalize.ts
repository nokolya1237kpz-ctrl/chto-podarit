import type { Product } from '@/types/product';

export function cleanupTitle(title?: string) {
  return (title || '')
    .normalize('NFKD')
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s.+-]/gu, ' ')
    .replace(/\b(ozon|wildberries|wb|aliexpress|яндекс\s*маркет|dns|citilink|мвидео|м\.видео|эльдорадо|megamarket)\b/gi, ' ')
    .replace(/\s*[|/\\-]\s*(купить|цена|доставка|официальный магазин).*$/i, '')
    .replace(/\s+/g, ' ')
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
  if (normalized.includes('dns')) return 'dns_shop';
  if (normalized.includes('citilink')) return 'citilink';
  if (normalized.includes('mega')) return 'megamarket';
  if (normalized.includes('mvideo') || normalized.includes('мвидео') || normalized.includes('м.видео')) return 'mvideo';
  if (normalized.includes('eldorado') || normalized.includes('эльдорадо')) return 'eldorado';
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
    .replace(/([a-zа-я]+)-?(\d+)/gi, '$1$2')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .filter((token) => !['для', 'with', 'and', 'the', 'купить', 'цена', 'товар', 'новый', 'оригинал'].includes(token));
}

function extractModel(title?: string) {
  const joined = tokenize(title).join(' ');
  const compact = joined.replace(/\s+/g, '');
  return compact.match(/[a-zа-я]{1,8}\d{2,}[a-zа-я0-9]*/i)?.[0] || tokenize(title).find((token) => /[a-zа-я]+\d+|\d+[a-zа-я]+/i.test(token));
}

function extractBrand(title?: string) {
  const tokens = tokenize(title);
  const knownBrands = ['sony', 'apple', 'samsung', 'xiaomi', 'huawei', 'honor', 'lg', 'bosch', 'philips', 'redmond', 'tefal', 'dyson', 'jbl'];
  return tokens.find((token) => knownBrands.includes(token)) || tokens[0] || '';
}

function hasVariantConflict(a?: string, b?: string) {
  const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', '128gb', '256gb', '512gb', '1tb'];
  const at = tokenize(a);
  const bt = tokenize(b);
  return sizes.some((word) => (at.includes(word) || bt.includes(word)) && at.includes(word) !== bt.includes(word));
}

export function calculateSimilarity(a?: string, b?: string) {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (left.size === 0 || right.size === 0) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const overlap = intersection / Math.max(left.size, right.size);
  const leftModel = extractModel(a);
  const rightModel = extractModel(b);
  if (leftModel && rightModel && leftModel === rightModel) return Math.max(overlap, 0.92);
  return overlap;
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
  if (aModel && bModel && aModel === bModel) return true;
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
