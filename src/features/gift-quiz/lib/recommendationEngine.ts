import type { Product } from '@entities/product/types';
import { scoreProductForGift, type GiftQuizAnswers, type GiftScoreResult } from './giftScoring';

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

export function filterProductsForGift(products: Product[], answers: GiftQuizAnswers) {
  const strict = rank(products, answers, 0);
  if (strict.length >= 5) return strict.slice(0, 20);

  const relaxed = rank(products, answers, 0.15);
  return relaxed.slice(0, 20);
}

export function getGiftRecommendations(products: Product[], answers: GiftQuizAnswers) {
  return filterProductsForGift(products, answers);
}

export { scoreProductForGift };
export type { GiftQuizAnswers };
