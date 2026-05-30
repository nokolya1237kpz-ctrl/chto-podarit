import type { Product } from '@entities/product/types';
import { normalizeProductTitle } from '@entities/product/lib/dedupeProducts';
import { scoreProductForGift, type GiftQuizAnswers, type GiftScoreResult } from './giftScoring';

export const recommendationEngineVersion = 'v2-strict';

export type RecommendedProduct = Product & {
  giftScorePreview: number;
  matchReasons: string[];
  recommendationDebug?: GiftScoreResult;
};

function isActiveProduct(product: Product) {
  return product.isActive && product.status === 'active' && !product.deletedAt;
}

function rank(products: Product[], answers: GiftQuizAnswers, budgetTolerancePct = 0) {
  return products
    .filter(isActiveProduct)
    .map((product) => {
      const result = scoreProductForGift(product, answers, { budgetTolerancePct });
      return {
        ...product,
        giftScorePreview: result.score,
        matchReasons: result.reasons,
        recommendationDebug: result,
      } as RecommendedProduct;
    })
    .filter((product) => !product.recommendationDebug?.blocked && product.giftScorePreview >= 50)
    .sort((a, b) => b.giftScorePreview - a.giftScorePreview);
}

function uniqueRecommendations(products: RecommendedProduct[]) {
  const keys = new Set<string>();
  return products.filter((product) => {
    const key = `${normalizeProductTitle(product.title)}:${Math.round(product.price)}`;
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}

export function filterProductsForGift(products: Product[], answers: GiftQuizAnswers) {
  const strict = uniqueRecommendations(rank(products, answers, 0));
  if (strict.length >= 5) return strict.slice(0, 20);

  const strictIds = new Set(strict.map((product) => product.id));
  const relaxed = uniqueRecommendations(rank(products, answers, 0.15)).filter((product) => !strictIds.has(product.id));
  return [...strict, ...relaxed].slice(0, 5);
}

export function getGiftRecommendations(products: Product[], answers: GiftQuizAnswers) {
  return filterProductsForGift(products, answers);
}

export { scoreProductForGift };
export type { GiftQuizAnswers };
