import type { Product } from '../types';

export function calculateQualityScore(product: Partial<Product>) {
  let score = 0;
  if (product.title) score += 25;
  if (product.imageUrl) score += 25;
  if (Number(product.price || 0) > 0) score += 25;
  if (product.description) score += 10;
  if (product.affiliateUrl || product.originalUrl) score += 10;
  if (product.marketplace && product.marketplace !== 'other') score += 5;
  return Math.min(100, score);
}
