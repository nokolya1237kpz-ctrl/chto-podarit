import type { Product } from '../types';
import { normalizeProductUrl } from './productNormalize';

export function normalizeProductTitle(title?: string) {
  return String(title || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\bкод\s*\d+\b/gi, ' ')
    .replace(/\bарт(?:икул)?\.?\s*\d+\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function imageBasename(url?: string) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.pathname.split('/').filter(Boolean).at(-1) || '';
  } catch {
    return url.split('/').filter(Boolean).at(-1) || '';
  }
}

export function getProductFingerprint(product: Partial<Product>) {
  const sourceProvider = String(product.sourceProvider || product.marketplace || 'unknown').toLowerCase();
  const externalProductId = String(product.externalProductId || '').trim().toLowerCase();
  if (sourceProvider === 'sadovod' && externalProductId) return `sadovod:${externalProductId.replace(/^sadovod:/, '')}`;
  if (externalProductId) return `${sourceProvider}:${externalProductId}`;

  const url = normalizeProductUrl(product.originalUrl || product.affiliateUrl);
  if (url) return `url:${url.toLowerCase()}`;

  return [
    'title-price-image',
    normalizeProductTitle(product.title),
    Math.round(Number(product.price || 0)),
    imageBasename(product.imageUrl).toLowerCase(),
  ].join(':');
}

export function isSameProduct(a: Partial<Product>, b: Partial<Product>) {
  return getProductFingerprint(a) === getProductFingerprint(b);
}

function productRank(product: Product) {
  let score = 0;
  if (product.status === 'active') score += 100;
  if (product.imageUrl) score += 20;
  if (Number(product.price || 0) > 0) score += 20;
  if (product.affiliateUrl || product.originalUrl) score += 15;
  if (product.description) score += 5;
  score += new Date(product.updatedAt || product.createdAt || 0).getTime() / 1_000_000_000_000;
  return score;
}

export function dedupeProducts<T extends Product>(products: T[]) {
  const byFingerprint = new Map<string, T>();
  for (const product of products) {
    const key = getProductFingerprint(product);
    const current = byFingerprint.get(key);
    if (!current || productRank(product) > productRank(current)) {
      byFingerprint.set(key, product);
    }
  }
  return Array.from(byFingerprint.values());
}

export function groupDuplicateProducts<T extends Product>(products: T[]) {
  const groups = new Map<string, T[]>();
  for (const product of products) {
    const key = getProductFingerprint(product);
    groups.set(key, [...(groups.get(key) || []), product]);
  }
  return Array.from(groups.entries())
    .map(([fingerprint, items]) => ({
      fingerprint,
      count: items.length,
      best: dedupeProducts(items)[0],
      items,
    }))
    .filter((group) => group.count > 1)
    .sort((a, b) => b.count - a.count);
}
