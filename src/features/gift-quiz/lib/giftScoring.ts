import type { Product } from '@entities/product/types';
import { getProductCategory } from '@entities/product/lib/categoryMapper';
import { detectProductGender } from '@entities/product/lib/detectProductGender';
import { RECIPIENT_RULES, hasExplicitInterest, normalizeRecipient } from './recipientRules';

export type GiftQuizAnswers = {
  recipient?: string;
  budget?: string;
  interests?: string[];
  occasions?: string[];
  giftTypes?: string[];
};

export type GiftScoreResult = {
  score: number;
  reasons: string[];
  penalties: string[];
  blocked: boolean;
};

export type GiftScoringOptions = {
  budgetTolerancePct?: number;
};

function productText(product: Product) {
  return [
    product.title,
    product.description,
    product.categoryLabel,
    product.categorySlug,
    product.marketplace,
    ...(product.tags || []),
    ...(product.interests || []),
    ...(product.giftTypes || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function parseBudgetRange(budget?: string) {
  const text = String(budget || '').toLowerCase();
  if (!text) return null;
  if (text.includes('премиум')) return { min: 7001, max: Infinity };

  const numbers = text.match(/\d[\d\s]*/g)?.map((value) => Number(value.replace(/\s/g, ''))).filter(Boolean) || [];
  if (numbers.length >= 2) return { min: Math.min(numbers[0], numbers[1]), max: Math.max(numbers[0], numbers[1]) };
  if (numbers.length === 1) {
    const number = numbers[0];
    if (/до|</i.test(text)) return { min: 0, max: number };
    if (/\+|от/i.test(text)) return { min: number, max: Infinity };
    return { min: 0, max: number };
  }
  return null;
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value.toLowerCase()));
}

function categoryMatches(categorySlug: string, value: string) {
  if (value === categorySlug) return true;
  if (value === 'auto_parts' && ['auto', 'auto_parts', 'auto_accessories', 'car_fragrance'].includes(categorySlug)) return true;
  if (value === 'female_cosmetics' && ['beauty', 'cosmetics', 'perfume'].includes(categorySlug)) return true;
  if (value === 'neutral_gifts' && ['office', 'books', 'accessories', 'sweets', 'gift_sets', 'gadgets', 'home'].includes(categorySlug)) return true;
  if (value === 'flowers' && ['flowers', 'decor'].includes(categorySlug)) return true;
  if (value === 'creative' && ['toys', 'books', 'decor', 'gift_sets'].includes(categorySlug)) return true;
  if (value === 'hobby' && ['sport', 'books', 'tools', 'garden', 'auto_accessories', 'fishing'].includes(categorySlug)) return true;
  return false;
}

const MARCH_8_BOOST = ['flowers', 'beauty', 'cosmetics', 'perfume', 'jewelry', 'women_bags', 'accessories_female', 'sweets', 'gift_sets', 'decor'];
const MARCH_8_BLOCK = ['auto', 'auto_parts', 'auto_accessories', 'tools', 'men_fashion', 'belts_male', 'men_belts', 'car_fragrance'];
const SAFE_UNIVERSAL = ['home', 'decor', 'books', 'sweets', 'gift_sets', 'gadgets', 'electronics', 'accessories', 'office'];

function isMarch8(answers: GiftQuizAnswers) {
  return (answers.occasions || []).some((occasion) => /8\s*мар|восьм/i.test(occasion.toLowerCase()));
}

function reasonForRecipient(recipient: string) {
  const labels: Record<string, string> = {
    girlfriend: 'Подходит для девушки',
    boyfriend: 'Подходит для парня',
    mom: 'Подходит для мамы',
    dad: 'Подходит для папы',
    child: 'Подходит для ребёнка',
    colleague: 'Нейтральный подарок для коллеги',
    friend: 'Подходит для друга',
  };
  return labels[recipient] || 'Подходит получателю';
}

export function scoreProductForGift(product: Product, answers: GiftQuizAnswers, options: GiftScoringOptions = {}): GiftScoreResult {
  const category = getProductCategory(product);
  const categorySlug = category.slug;
  const gender = detectProductGender({ ...product, categorySlug });
  const text = productText(product);
  const reasons: string[] = [];
  const penalties: string[] = [];
  let score = 40;
  let blocked = false;

  if (!product.title || Number(product.price || 0) <= 0 || !product.imageUrl) {
    return { score: -100, reasons: [], penalties: ['Неполная карточка товара'], blocked: true };
  }

  const recipient = normalizeRecipient(answers.recipient);
  const rule = RECIPIENT_RULES[recipient];
  const interestText = [...(answers.interests || []), ...(product.interests || [])].join(' ').toLowerCase();
  const hasAutoInterest = hasExplicitInterest(interestText, ['авто', 'машин', 'водит', 'car']);
  const hasBeautyInterest = hasExplicitInterest(interestText, ['beauty', 'космет', 'макияж', 'уход']);
  const price = Number(product.price || 0);

  const budgetRange = parseBudgetRange(answers.budget);
  if (budgetRange) {
    const tolerance = options.budgetTolerancePct || 0;
    const min = Math.max(0, budgetRange.min * (1 - tolerance));
    const max = budgetRange.max === Infinity ? Infinity : budgetRange.max * (1 + tolerance);
    if (price < min) {
      blocked = true;
      score -= 150;
      penalties.push('price_below_budget');
    } else if (price > max) {
      blocked = true;
      score -= 150;
      penalties.push('price_above_budget');
    } else {
      score += 24;
      reasons.push('Подходит по бюджету');
    }
  }

  if (rule) {
    const allowed = rule.allow.some((value) => categoryMatches(categorySlug, value) || text.includes(value));
    const blockedByRule = rule.block.some((value) => categoryMatches(categorySlug, value) || text.includes(value));
    const allowedException =
      (['auto', 'auto_accessories', 'car_fragrance'].includes(categorySlug) && hasAutoInterest) ||
      (['beauty', 'cosmetics', 'perfume'].includes(categorySlug) && hasBeautyInterest);

    if (blockedByRule && !allowedException) {
      blocked = true;
      score -= 120;
      penalties.push('Категория не подходит получателю');
    } else if (allowed || allowedException) {
      score += 28;
      reasons.push(reasonForRecipient(recipient));
    } else {
      score -= 18;
      penalties.push('Категория не входит в типичные интересы получателя');
    }
  }

  if (recipient === 'girlfriend') {
    if (gender === 'male' || gender === 'kids') blocked = true;
    if (['men_fashion', 'male_accessories', 'accessories_male', 'men_belts', 'belts_male', 'auto_parts', 'car_fragrance', 'tools', 'fishing', 'hunting', 'industrial'].includes(categorySlug)) blocked = true;
    if (['auto', 'auto_accessories'].includes(categorySlug) && !hasAutoInterest) blocked = true;
  }
  if (recipient === 'boyfriend' && gender === 'female' && !hasBeautyInterest) blocked = true;
  if (recipient === 'mom' && ['auto', 'auto_parts', 'auto_accessories', 'car_fragrance'].includes(categorySlug) && !hasAutoInterest) blocked = true;
  if (recipient === 'dad' && ['cosmetics', 'beauty', 'perfume', 'women_fashion', 'women_bags', 'accessories_female', 'jewelry'].includes(categorySlug)) blocked = true;
  if (recipient === 'child' && (gender !== 'kids' && ['auto', 'auto_parts', 'auto_accessories', 'car_fragrance', 'tools', 'cosmetics', 'beauty', 'adult', 'alcohol', 'tobacco'].includes(categorySlug))) blocked = true;

  if (isMarch8(answers)) {
    if (MARCH_8_BLOCK.includes(categorySlug)) {
      blocked = true;
      score -= 80;
      penalties.push('Не подходит к 8 марта');
    } else if (MARCH_8_BOOST.includes(categorySlug)) {
      score += 24;
      reasons.push('Подходит к 8 марта');
    }
  }

  for (const interest of answers.interests || []) {
    if (text.includes(interest.toLowerCase())) {
      score += 22;
      reasons.push(`Совпадает с интересом: ${interest}`);
    }
  }

  for (const occasion of answers.occasions || []) {
    const normalized = occasion.toLowerCase();
    if (product.occasions?.some((item) => item.toLowerCase().includes(normalized)) || text.includes(normalized)) {
      score += 10;
      reasons.push(`Подходит к поводу: ${occasion}`);
    }
  }

  if (answers.giftTypes?.some((giftType) => text.includes(giftType.toLowerCase()))) {
    score += 10;
    reasons.push('Совпадает с типом подарка');
  }

  if (!product.description || product.description.length < 25) {
    score -= 8;
    penalties.push('Мало описания');
  }
  if (product.title.length < 10) score -= 6;
  if (categorySlug === 'unknown') {
    score = Math.min(score - 12, 30);
    penalties.push('Не определена категория');
  }
  if (includesAny(text, ['интим', '18+', 'алкоголь', 'табак'])) {
    score -= 100;
    blocked = true;
    penalties.push('Неподходящий товар для публичного подбора');
  }

  if (blocked) penalties.push('Заблокировано правилом получателя');

  score += Math.min(12, Number(product.wowRating || 0));
  if (product.discountPercent && product.discountPercent > 10) reasons.push('Есть заметная скидка');

  if (!blocked && reasons.length === 0 && SAFE_UNIVERSAL.includes(categorySlug)) {
    score += 8;
    reasons.push('Безопасная универсальная идея');
  }

  if (!blocked && category.label && categorySlug !== 'unknown') reasons.push(`Категория: ${category.label}`);

  return {
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 3),
    penalties: Array.from(new Set(penalties)),
    blocked,
  };
}
