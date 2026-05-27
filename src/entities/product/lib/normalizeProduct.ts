import type { Product } from '../types';
import { cleanupTitle, normalizeMarketplace, normalizePrice, normalizeProductUrl } from './productNormalize';

export function normalizeProduct(input: Partial<Product>): Partial<Product> {
  return {
    ...input,
    title: cleanupTitle(input.title),
    price: normalizePrice(input.price),
    oldPrice: input.oldPrice ? normalizePrice(input.oldPrice) : undefined,
    marketplace: normalizeMarketplace(String(input.marketplace || 'other')),
    originalUrl: normalizeProductUrl(input.originalUrl),
    affiliateUrl: normalizeProductUrl(input.affiliateUrl),
    tags: input.tags || [],
  };
}
