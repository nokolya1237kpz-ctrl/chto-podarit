import type { Product } from '@/types/product';
import { supabaseAdmin } from '@/lib/supabase';

export type TrendSignals = {
  localClicks?: number;
  compareSearches?: number;
  importedRecently?: boolean;
  manualTag?: boolean;
  epnHot?: boolean;
};

export function calculateTrendScore(product: Partial<Product>, signals: TrendSignals = {}) {
  let score = Number(product.trendScore || 0);
  if (signals.epnHot || product.sourceProvider === 'epn') score += 1.5;
  if (signals.importedRecently) score += 1;
  if (signals.manualTag || product.tags?.some((tag) => /trend|viral|tiktok|хит|популяр/i.test(tag))) score += 3;
  if (signals.localClicks) score += Math.min(3, Math.log10(signals.localClicks + 1) * 2);
  if (signals.compareSearches) score += Math.min(2, Math.log10(signals.compareSearches + 1) * 1.5);
  if ((product.wowRating || 0) >= 8) score += 1;
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

export function enrichTrendProduct(product: Product, signals: TrendSignals = {}): Product {
  const score = calculateTrendScore(product, signals);
  return {
    ...product,
    trendScore: score,
    trendSource: product.trendSource || (signals.epnHot ? 'epn_hot' : signals.localClicks ? 'popular_clicks' : signals.manualTag ? 'manual_tag' : 'catalog'),
    trendLabel: product.trendLabel || (score >= 8 ? 'Тренд' : score >= 6 ? 'Популярно' : undefined),
    isTrending: score >= 6,
    trendVelocity: signals.localClicks || signals.compareSearches || score,
  };
}

export async function getPopularClickCounts() {
  if (!supabaseAdmin) return new Map<string, number>();
  try {
    const { data } = await supabaseAdmin
      .from('product_clicks')
      .select('product_id')
      .gte('clicked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    const counts = new Map<string, number>();
    (data || []).forEach((row: any) => {
      if (row.product_id) counts.set(row.product_id, (counts.get(row.product_id) || 0) + 1);
    });
    return counts;
  } catch {
    return new Map<string, number>();
  }
}

export function shuffleProducts<T>(items: T[], limit = items.length) {
  return [...items]
    .map((item) => ({ item, score: Math.random() }))
    .sort((a, b) => a.score - b.score)
    .map(({ item }) => item)
    .slice(0, limit);
}
