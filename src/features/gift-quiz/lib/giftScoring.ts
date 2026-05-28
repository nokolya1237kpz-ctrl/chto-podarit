import type { Product } from '@entities/product/types';
import { getProductCategory } from '@entities/product/lib/categoryMapper';
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

function parseBudgetLimit(budget?: string) {
  const text = String(budget || '').toLowerCase();
  if (!text) return null;
  if (text.includes('1000')) return 1000;
  if (text.includes('3000')) return 3000;
  if (text.includes('7000')) return 7000;
  if (text.includes('15000')) return 15000;
  if (text.includes('премиум')) return Infinity;
  const number = Number(text.replace(/[^\d]/g, ''));
  return number > 0 ? number : null;
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value.toLowerCase()));
}

function categoryMatches(categorySlug: string, value: string) {
  if (value === categorySlug) return true;
  if (value === 'auto_parts' && ['auto', 'auto_accessories', 'car_fragrance'].includes(categorySlug)) return true;
  if (value === 'female_cosmetics' && ['beauty', 'cosmetics', 'perfume'].includes(categorySlug)) return true;
  if (value === 'neutral_gifts' && ['office', 'books', 'accessories', 'sweets', 'gift_sets', 'gadgets'].includes(categorySlug)) return true;
  if (value === 'flowers' && categorySlug === 'decor') return true;
  if (value === 'creative' && ['toys', 'books', 'decor', 'gift_sets'].includes(categorySlug)) return true;
  if (value === 'hobby' && ['sport', 'books', 'tools', 'garden', 'auto_accessories'].includes(categorySlug)) return true;
  return false;
}

export function scoreProductForGift(product: Product, answers: GiftQuizAnswers): GiftScoreResult {
  const category = getProductCategory(product);
  const categorySlug = category.slug;
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
      reasons.push(recipient === 'colleague' ? 'Нейтральный подарок для коллеги' : `Популярная категория для ${answers.recipient || 'получателя'}`);
    } else {
      score -= 18;
      penalties.push('Категория не входит в типичные интересы получателя');
    }
  }

  if (recipient === 'girlfriend' && ['auto', 'auto_accessories', 'car_fragrance', 'tools'].includes(categorySlug) && !hasAutoInterest) blocked = true;
  if (recipient === 'boyfriend' && ['cosmetics', 'beauty', 'perfume', 'women_fashion'].includes(categorySlug) && !hasBeautyInterest) blocked = true;
  if (recipient === 'mom' && ['auto', 'auto_accessories', 'car_fragrance'].includes(categorySlug) && !hasAutoInterest) blocked = true;
  if (recipient === 'dad' && ['cosmetics', 'beauty', 'perfume', 'women_fashion', 'jewelry'].includes(categorySlug)) blocked = true;
  if (recipient === 'child' && ['auto', 'auto_accessories', 'car_fragrance', 'tools', 'cosmetics', 'beauty'].includes(categorySlug)) blocked = true;

  const budgetLimit = parseBudgetLimit(answers.budget);
  if (budgetLimit) {
    if (budgetLimit === Infinity || product.price <= budgetLimit) {
      score += 18;
      reasons.push('Подходит по бюджету');
    } else if (product.price > budgetLimit * 1.5) {
      score -= 45;
      penalties.push('Сильно дороже бюджета');
    } else {
      score -= 18;
      penalties.push('Чуть выше бюджета');
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
    score -= 12;
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

  if (!blocked && reasons.length === 0 && ['home', 'books', 'sweets', 'gift_sets', 'gadgets', 'accessories'].includes(categorySlug)) {
    score += 8;
    reasons.push('Безопасная универсальная идея');
  }

  return {
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 3),
    penalties: Array.from(new Set(penalties)),
    blocked,
  };
}
