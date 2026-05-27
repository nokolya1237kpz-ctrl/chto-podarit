import type { Product } from '../types';

export function calculateTrendScore(product: Partial<Product>) {
  const text = [product.title, product.description, ...(product.tags || [])].join(' ').toLowerCase();
  let score = Number(product.trendScore || 0);
  if (/tiktok|viral|trend|хит|популяр/i.test(text)) score += 35;
  if ((product.wowRating || 0) >= 8) score += 20;
  if ((product.discountPercent || 0) >= 20) score += 10;
  return Math.min(100, Math.max(0, score || 35));
}
