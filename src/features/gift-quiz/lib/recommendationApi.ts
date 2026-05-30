import 'server-only';

import { getActiveProducts } from '@lib/supabase';
import { withTimeout } from '@lib/utils/timeout';
import { dedupeProducts } from '@entities/product/lib/dedupeProducts';
import { getGiftRecommendations, recommendationEngineVersion, type GiftQuizAnswers } from './recommendationEngine';

export function answersFromSearchParams(searchParams: URLSearchParams): GiftQuizAnswers {
  const list = (name: string) => searchParams.getAll(name).flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean);
  return {
    recipient: searchParams.get('recipient') || undefined,
    budget: searchParams.get('budget') || undefined,
    occasions: list('occasion'),
    interests: list('interest'),
    giftTypes: list('giftType'),
  };
}

export async function getRecommendationResponse(answers: GiftQuizAnswers) {
  const products = dedupeProducts(await withTimeout(getActiveProducts(), 4000, []));
  const items = getGiftRecommendations(products, answers);
  return { success: true, recommendationEngineVersion, count: items.length, items, data: items };
}
