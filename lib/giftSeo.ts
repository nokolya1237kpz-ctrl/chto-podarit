import { getActiveProducts, isSupabaseConfigured } from '@/lib/supabase';

export async function getGiftSeoProducts(filter: { recipient?: string; budget?: string; trend?: boolean }) {
  const products = isSupabaseConfigured() ? await getActiveProducts() : [];
  return products.filter((product) => {
    if (filter.recipient && !product.recipients?.includes(filter.recipient)) return false;
    if (filter.budget && product.budget !== filter.budget) return false;
    if (filter.trend && !`${product.tags?.join(' ')} ${product.title} ${product.trendLabel || ''}`.toLowerCase().match(/trend|viral|hit|хит|tiktok|популяр/)) return false;
    return true;
  }).slice(0, 24);
}
