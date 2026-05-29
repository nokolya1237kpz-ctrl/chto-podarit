import type { Product } from '@/types/product';
import { getGiftRecommendations, type GiftQuizAnswers } from '@features/gift-quiz/lib/recommendationEngine';

export interface MatchFilters {
  recipient?: string;
  budget?: string;
  interests?: string[];
  occasions?: string[];
  giftTypes?: string[];
}

/**
 * Match products based on quiz answers
 */
export function matchProducts(products: Product[], filters: MatchFilters): Product[] {
  const answers: GiftQuizAnswers = filters;
  return getGiftRecommendations(products, answers).slice(0, 10);
}

/**
 * Get universal products (no specific filters)
 */
export function getUniversalProducts(products: Product[]): Product[] {
  const active = products.filter((p) => p.isActive);
  
  active.sort((a, b) => {
    // Best price products first
    if (a.isBestPrice && !b.isBestPrice) return -1;
    if (!a.isBestPrice && b.isBestPrice) return 1;
    // Then by wow rating
    return b.wowRating - a.wowRating;
  });

  return active.slice(0, 10);
}
