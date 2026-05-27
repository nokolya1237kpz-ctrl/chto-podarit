import type { Product } from '@entities/product/types';
import { getProductCategory } from '@entities/product/lib/categoryMapper';

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
};

const RECIPIENT_RULES: Record<string, { allow: string[]; block: string[] }> = {
  girlfriend: { allow: ['beauty', 'fashion', 'accessories', 'home', 'flowers', 'jewelry', 'electronics', 'books', 'gifts'], block: ['auto_parts', 'industrial'] },
  boyfriend: { allow: ['electronics', 'auto', 'sport', 'gaming', 'tools', 'gadgets', 'fashion', 'books', 'gifts'], block: [] },
  mom: { allow: ['home', 'beauty', 'kitchen', 'health', 'books', 'flowers', 'gifts'], block: ['gaming', 'auto_parts'] },
  dad: { allow: ['tools', 'auto', 'electronics', 'sport', 'books', 'home', 'gifts'], block: ['beauty'] },
  child: { allow: ['toys', 'books', 'sport', 'creative', 'electronics', 'gifts'], block: ['auto', 'beauty', 'adult', 'tools'] },
  friend: { allow: ['home', 'electronics', 'sport', 'books', 'fashion', 'gifts', 'auto', 'beauty'], block: [] },
  colleague: { allow: ['office', 'books', 'accessories', 'sweets', 'home', 'electronics', 'gifts'], block: ['intimate', 'romantic', 'personal_care_sensitive', 'beauty'] },
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  auto: ['auto', 'auto_parts', 'авто', 'машина'],
  electronics: ['electronics', 'gadgets', 'техника', 'электроника', 'гаджеты'],
  beauty: ['beauty', 'косметика', 'уход', 'красота'],
  home: ['home', 'дом', 'уют'],
  fashion: ['fashion', 'одежда', 'аксессуары'],
  toys: ['toys', 'дети', 'игрушки'],
  kitchen: ['kitchen', 'кухня'],
  sport: ['sport', 'спорт', 'фитнес'],
  books: ['books', 'книги'],
  gifts: ['gifts', 'подарки', 'набор'],
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

function parseBudgetLimit(budget?: string) {
  const text = String(budget || '').toLowerCase();
  if (!text) return null;
  if (text.includes('1000')) return 1000;
  if (text.includes('3000')) return 3000;
  if (text.includes('7000')) return 7000;
  if (text.includes('премиум')) return Infinity;
  const number = Number(text.replace(/[^\d]/g, ''));
  return number > 0 ? number : null;
}

function productText(product: Product) {
  return [
    product.title,
    product.description,
    product.marketplace,
    product.categoryLabel,
    ...(product.tags || []),
    ...(product.interests || []),
    ...(product.giftTypes || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function hasInterest(answers: GiftQuizAnswers, value: string) {
  const selected = [...(answers.interests || []), ...(answers.giftTypes || [])].join(' ').toLowerCase();
  return selected.includes(value);
}

export function scoreProductForGift(product: Product, answers: GiftQuizAnswers): GiftScoreResult {
  const category = getProductCategory(product);
  const text = productText(product);
  const reasons: string[] = [];
  let score = 35;

  if (!product.title || Number(product.price || 0) <= 0 || !product.imageUrl) {
    return { score: -100, reasons: [] };
  }

  const recipient = String(answers.recipient || '').toLowerCase();
  const rule = RECIPIENT_RULES[recipient];
  const categoryWords = CATEGORY_ALIASES[category.slug] || [category.slug];

  if (rule) {
    const isAllowed = rule.allow.some((allowed) => allowed === category.slug || categoryWords.includes(allowed));
    const isBlocked = rule.block.some((blocked) => blocked === category.slug || text.includes(blocked));
    if (isBlocked && !(category.slug === 'auto' && hasInterest(answers, 'авто')) && !(category.slug === 'beauty' && hasInterest(answers, 'beauty'))) {
      score -= 85;
    } else if (isAllowed) {
      score += 24;
      reasons.push('Популярная категория для подарка');
    } else {
      score -= 18;
    }
  }

  if (recipient === 'girlfriend' && category.slug === 'auto' && !hasInterest(answers, 'авто')) score -= 70;
  if (recipient === 'mom' && category.slug === 'auto' && !hasInterest(answers, 'авто')) score -= 45;
  if (recipient === 'child' && ['auto', 'beauty'].includes(category.slug)) score -= 90;
  if (recipient === 'colleague' && includesAny(text, ['романтик', 'свидан', 'интим'])) score -= 75;

  const budgetLimit = parseBudgetLimit(answers.budget);
  if (budgetLimit) {
    if (budgetLimit === Infinity || product.price <= budgetLimit) {
      score += 18;
      reasons.push('Подходит по бюджету');
    } else if (product.price > budgetLimit * 1.7) {
      score -= 45;
    } else {
      score -= 18;
    }
    if (budgetLimit !== Infinity && product.price < budgetLimit * 0.2) score -= 8;
  }

  for (const interest of answers.interests || []) {
    if (text.includes(interest.toLowerCase())) {
      score += 18;
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

  if (product.description && product.description.length > 40) score += 6;
  else score -= 8;
  if (product.title.length < 12) score -= 8;
  if (!product.categorySlug && category.slug === 'gifts') score -= 5;
  score += Math.min(12, Number(product.wowRating || 0));
  if (product.discountPercent && product.discountPercent > 10) {
    score += 6;
    reasons.push('Есть заметная скидка');
  }

  if (reasons.length === 0 && ['home', 'beauty', 'electronics', 'books', 'gifts'].includes(category.slug)) {
    reasons.push('Универсальная идея для подарка');
    score += 4;
  }

  return { score, reasons: Array.from(new Set(reasons)).slice(0, 3) };
}
