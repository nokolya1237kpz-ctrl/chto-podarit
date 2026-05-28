export type RecipientRule = {
  allow: string[];
  block: string[];
};

export const RECIPIENT_RULES: Record<string, RecipientRule> = {
  girlfriend: {
    allow: ['beauty', 'cosmetics', 'perfume', 'jewelry', 'accessories', 'fashion', 'women_fashion', 'flowers', 'home', 'decor', 'books', 'creative', 'gadgets', 'electronics', 'sweets', 'gift_sets'],
    block: ['auto', 'auto_accessories', 'car_fragrance', 'auto_parts', 'tools', 'fishing', 'hunting', 'industrial', 'car_chemistry', 'male_grooming', 'men_fashion'],
  },
  boyfriend: {
    allow: ['electronics', 'gadgets', 'gaming', 'auto', 'auto_accessories', 'sport', 'tools', 'accessories', 'men_fashion', 'fashion', 'books', 'hobby'],
    block: ['female_cosmetics', 'cosmetics', 'women_underwear', 'women_fashion', 'flowers_only', 'pregnancy', 'baby_care'],
  },
  mom: {
    allow: ['home', 'kitchen', 'beauty', 'cosmetics', 'perfume', 'health', 'books', 'flowers', 'decor', 'textile', 'hobby', 'gift_sets'],
    block: ['gaming_hardcore', 'auto', 'auto_accessories', 'car_fragrance', 'auto_parts', 'industrial', 'male_grooming'],
  },
  dad: {
    allow: ['tools', 'auto', 'auto_accessories', 'electronics', 'gadgets', 'sport', 'fishing', 'books', 'home', 'garden', 'hobby'],
    block: ['female_cosmetics', 'cosmetics', 'women_fashion', 'jewelry', 'flowers_only'],
  },
  child: {
    allow: ['toys', 'kids', 'books', 'creative', 'sport', 'school', 'kids_gadgets', 'gadgets'],
    block: ['auto', 'auto_accessories', 'car_fragrance', 'tools', 'cosmetics_adult', 'cosmetics', 'adult', 'alcohol', 'tobacco', 'car_chemistry'],
  },
  colleague: {
    allow: ['office', 'books', 'accessories', 'sweets', 'tea_coffee', 'neutral_gifts', 'gadgets', 'electronics', 'gift_sets'],
    block: ['intimate', 'romantic', 'underwear', 'personal_sensitive', 'women_fashion', 'cosmetics'],
  },
  friend: {
    allow: ['gadgets', 'electronics', 'hobby', 'sport', 'books', 'accessories', 'fun', 'gift_sets', 'home', 'sweets'],
    block: ['intimate', 'adult'],
  },
};

export const RECIPIENT_ALIASES: Record<string, string> = {
  девушка: 'girlfriend',
  девушке: 'girlfriend',
  girlfriend: 'girlfriend',
  жена: 'girlfriend',
  парень: 'boyfriend',
  парню: 'boyfriend',
  boyfriend: 'boyfriend',
  муж: 'boyfriend',
  мама: 'mom',
  маме: 'mom',
  mom: 'mom',
  папа: 'dad',
  папе: 'dad',
  dad: 'dad',
  ребенок: 'child',
  ребёнок: 'child',
  ребёнку: 'child',
  child: 'child',
  коллега: 'colleague',
  коллеге: 'colleague',
  colleague: 'colleague',
  друг: 'friend',
  другу: 'friend',
  friend: 'friend',
};

export function normalizeRecipient(value?: string) {
  return RECIPIENT_ALIASES[String(value || '').toLowerCase().trim()] || String(value || '').toLowerCase().trim();
}

export function hasExplicitInterest(words: string, interests: string[]) {
  const text = words.toLowerCase();
  return interests.some((interest) => text.includes(interest));
}
