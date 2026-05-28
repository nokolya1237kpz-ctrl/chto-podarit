import type { Product } from '../types';

export type CategorySlug =
  | 'auto'
  | 'auto_accessories'
  | 'car_fragrance'
  | 'electronics'
  | 'gadgets'
  | 'gaming'
  | 'beauty'
  | 'cosmetics'
  | 'perfume'
  | 'fashion'
  | 'women_fashion'
  | 'men_fashion'
  | 'jewelry'
  | 'accessories'
  | 'home'
  | 'kitchen'
  | 'decor'
  | 'books'
  | 'toys'
  | 'kids'
  | 'sport'
  | 'tools'
  | 'garden'
  | 'health'
  | 'office'
  | 'sweets'
  | 'gift_sets'
  | 'unknown';

export type TaxonomyCategory = {
  slug: CategorySlug;
  label: string;
  group: string;
  patterns: RegExp[];
};

export const CATEGORY_TAXONOMY: TaxonomyCategory[] = [
  { slug: 'car_fragrance', label: 'Автомобильные ароматизаторы', group: 'auto', patterns: [/ароматизатор/i, /освежител[ья]/i, /вонючк/i] },
  { slug: 'auto_accessories', label: 'Автоаксессуары', group: 'auto', patterns: [/fm[-\s]?модулятор/i, /держател[ьи]/i, /зарядк.*авто/i, /автоаксесс/i, /прикуривател/i, /коврик.*авто/i] },
  { slug: 'auto', label: 'Автотовары', group: 'auto', patterns: [/автотовар/i, /автомоб/i, /машин/i, /oem/i, /запчаст/i, /авто/i, /car/i] },
  { slug: 'cosmetics', label: 'Косметика', group: 'beauty', patterns: [/помад/i, /тушь/i, /макияж/i, /космет/i, /тональ/i, /лак для ног/i] },
  { slug: 'perfume', label: 'Парфюм', group: 'beauty', patterns: [/парфюм/i, /духи/i, /туалетн.*вод/i, /аромат жен/i] },
  { slug: 'beauty', label: 'Красота и уход', group: 'beauty', patterns: [/уход/i, /крем/i, /сыворот/i, /beauty/i, /маск.*лиц/i] },
  { slug: 'jewelry', label: 'Украшения', group: 'fashion', patterns: [/украшен/i, /кольц/i, /серьг/i, /браслет/i, /цепоч/i, /бижутер/i] },
  { slug: 'women_fashion', label: 'Женская одежда', group: 'fashion', patterns: [/женск/i, /плать/i, /юбк/i, /блуз/i, /лиф/i, /бель[её]/i] },
  { slug: 'men_fashion', label: 'Мужская одежда', group: 'fashion', patterns: [/мужск/i, /галстук/i, /бритв/i, /бород/i] },
  { slug: 'fashion', label: 'Одежда', group: 'fashion', patterns: [/одежд/i, /футболк/i, /брюк/i, /обув/i, /куртк/i, /размер/i] },
  { slug: 'gaming', label: 'Игры и гейминг', group: 'electronics', patterns: [/игров/i, /gaming/i, /гейм/i, /playstation/i, /xbox/i, /джойст/i] },
  { slug: 'gadgets', label: 'Гаджеты', group: 'electronics', patterns: [/iphone/i, /айфон/i, /смартфон/i, /планшет/i, /умн.*час/i, /powerbank/i] },
  { slug: 'electronics', label: 'Электроника', group: 'electronics', patterns: [/наушник/i, /колонк/i, /электрон/i, /кабель/i, /заряд/i, /адаптер/i] },
  { slug: 'kitchen', label: 'Кухня', group: 'home', patterns: [/кухн/i, /мультиварк/i, /кофемаш/i, /сковород/i, /посуда/i, /готовк/i] },
  { slug: 'decor', label: 'Декор', group: 'home', patterns: [/декор/i, /свеч/i, /ваза/i, /интерьер/i, /картина/i] },
  { slug: 'home', label: 'Дом и быт', group: 'home', patterns: [/дом/i, /быт/i, /текстиль/i, /хранен/i, /плед/i, /подуш/i] },
  { slug: 'toys', label: 'Игрушки', group: 'kids', patterns: [/lego/i, /лего/i, /игруш/i, /конструктор/i, /кукл/i] },
  { slug: 'kids', label: 'Детские товары', group: 'kids', patterns: [/детск/i, /реб[её]н/i, /школ/i, /малыш/i] },
  { slug: 'sport', label: 'Спорт', group: 'sport', patterns: [/спорт/i, /фитнес/i, /йога/i, /тренаж/i, /массаж[её]р/i] },
  { slug: 'tools', label: 'Инструменты', group: 'tools', patterns: [/дрель/i, /инструмент/i, /набор ключ/i, /отв[её]ртк/i, /шуруповерт/i] },
  { slug: 'garden', label: 'Сад', group: 'home', patterns: [/сад/i, /дач/i, /огород/i, /растен/i] },
  { slug: 'health', label: 'Здоровье', group: 'health', patterns: [/здоров/i, /массаж/i, /ортопед/i, /витамин/i] },
  { slug: 'office', label: 'Офис', group: 'office', patterns: [/офис/i, /ежедневник/i, /ручк/i, /канцеляр/i] },
  { slug: 'sweets', label: 'Сладости', group: 'gifts', patterns: [/слад/i, /шоколад/i, /конфет/i, /чай|кофе/i] },
  { slug: 'gift_sets', label: 'Подарочные наборы', group: 'gifts', patterns: [/подарочн.*набор/i, /gift set/i, /набор/i, /сувенир/i] },
];

export const PUBLIC_CATEGORIES = [
  { slug: 'auto', label: 'Автотовары', group: 'auto' },
  { slug: 'auto_accessories', label: 'Автоаксессуары', group: 'auto' },
  { slug: 'electronics', label: 'Электроника', group: 'electronics' },
  { slug: 'gadgets', label: 'Гаджеты', group: 'electronics' },
  { slug: 'beauty', label: 'Красота и уход', group: 'beauty' },
  { slug: 'cosmetics', label: 'Косметика', group: 'beauty' },
  { slug: 'fashion', label: 'Одежда', group: 'fashion' },
  { slug: 'home', label: 'Дом и быт', group: 'home' },
  { slug: 'kitchen', label: 'Кухня', group: 'home' },
  { slug: 'toys', label: 'Игрушки', group: 'kids' },
  { slug: 'sport', label: 'Спорт', group: 'sport' },
  { slug: 'books', label: 'Книги', group: 'books' },
  { slug: 'gift_sets', label: 'Подарочные наборы', group: 'gifts' },
] as const;

const DIRECT_LABELS: Record<string, CategorySlug> = {
  автотовары: 'auto',
  'fm-модуляторы': 'auto_accessories',
  'fm модуляторы': 'auto_accessories',
  'автомобильные ароматизаторы': 'car_fragrance',
  электроника: 'electronics',
  косметика: 'cosmetics',
  'дом и быт': 'home',
  одежда: 'fashion',
  игрушки: 'toys',
  подарки: 'gift_sets',
  кухня: 'kitchen',
  спорт: 'sport',
  книги: 'books',
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

export function detectCategorySlug(product: Partial<Product> & { category?: string | null }): CategorySlug {
  const rawCategory = normalizeText(String(product.category || ''));
  const tags = Array.isArray(product.tags) ? product.tags.join(' ') : '';
  const text = normalizeText([
    rawCategory,
    tags,
    product.title,
    product.description,
    product.marketplace,
    product.sourceProvider,
    product.originalUrl,
    product.affiliateUrl,
  ].filter(Boolean).join(' '));

  const direct = DIRECT_LABELS[rawCategory] || DIRECT_LABELS[normalizeText(tags)];
  if (direct) return direct;
  const matched = CATEGORY_TAXONOMY.find((category) => category.patterns.some((pattern) => pattern.test(text)));
  return matched?.slug || 'unknown';
}

export function getCategoryMeta(slug: string) {
  const category = CATEGORY_TAXONOMY.find((item) => item.slug === slug);
  if (category) return { slug: category.slug, label: category.label, group: category.group };
  if (slug === 'books') return { slug: 'books' as CategorySlug, label: 'Книги', group: 'books' };
  return { slug: 'unknown' as CategorySlug, label: 'Без категории', group: 'unknown' };
}
