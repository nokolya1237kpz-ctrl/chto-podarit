import { getActiveProducts, isSupabaseConfigured } from '@/lib/supabase';
import { dedupeProducts } from '@entities/product/lib/dedupeProducts';
import { matchProducts } from '@/lib/productMatcher';

export async function getGiftSeoProducts(filter: { recipient?: string; budget?: string; maxPrice?: number; occasion?: string; trend?: boolean }) {
  const products = dedupeProducts(isSupabaseConfigured() ? await getActiveProducts() : []);
  const filtered = products.filter((product) => {
    if (filter.recipient && !product.recipients?.includes(filter.recipient)) return false;
    if (filter.budget && product.budget !== filter.budget) return false;
    if (filter.maxPrice && product.price > filter.maxPrice) return false;
    if (filter.trend && !`${product.tags?.join(' ')} ${product.title} ${product.trendLabel || ''}`.toLowerCase().match(/trend|viral|hit|хит|tiktok|популяр/)) return false;
    return true;
  });
  if (filter.recipient || filter.occasion || filter.maxPrice) {
    return matchProducts(filtered.length ? filtered : products, {
      recipient: filter.recipient,
      budget: filter.maxPrice ? `до ${filter.maxPrice} ₽` : filter.budget,
      occasions: filter.occasion ? [filter.occasion] : undefined,
    }).slice(0, 24);
  }
  return filtered.slice(0, 24);
}
