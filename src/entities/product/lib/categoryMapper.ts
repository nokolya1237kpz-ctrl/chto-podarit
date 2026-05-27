import type { Product } from '../types';

export type ProductCategory = {
  slug: string;
  label: string;
  group: string;
};

const CATEGORY_RULES: Array<ProductCategory & { patterns: RegExp[] }> = [
  {
    slug: 'auto',
    label: 'Автотовары',
    group: 'auto',
    patterns: [/авто/i, /fm[-\s]?модулятор/i, /ароматизатор/i, /машин/i, /oem/i, /запчаст/i, /держатель/i],
  },
  { slug: 'electronics', label: 'Электроника', group: 'electronics', patterns: [/электрон/i, /наушник/i, /гаджет/i, /смартфон/i, /кабель/i, /заряд/i] },
  { slug: 'beauty', label: 'Косметика', group: 'beauty', patterns: [/космет/i, /помад/i, /макияж/i, /beauty/i, /уход/i, /крем/i] },
  { slug: 'home', label: 'Дом и быт', group: 'home', patterns: [/дом/i, /быт/i, /текстиль/i, /декор/i, /интерьер/i, /хранен/i] },
  { slug: 'fashion', label: 'Одежда', group: 'fashion', patterns: [/одежд/i, /плать/i, /футбол/i, /брюк/i, /обув/i, /размер/i] },
  { slug: 'toys', label: 'Игрушки', group: 'toys', patterns: [/игруш/i, /детск/i, /конструктор/i, /кукла/i] },
  { slug: 'kitchen', label: 'Кухня', group: 'kitchen', patterns: [/кухн/i, /посуда/i, /готовк/i, /мультиварк/i, /сковород/i] },
  { slug: 'sport', label: 'Спорт', group: 'sport', patterns: [/спорт/i, /фитнес/i, /йога/i, /тренаж/i, /массаж/i] },
  { slug: 'books', label: 'Книги', group: 'books', patterns: [/книг/i, /литрес/i, /чтен/i] },
  { slug: 'gifts', label: 'Подарки', group: 'gifts', patterns: [/подар/i, /сувенир/i, /набор/i, /аксессуар/i] },
];

const LABEL_TO_SLUG: Record<string, string> = {
  автотовары: 'auto',
  'fm-модуляторы': 'auto',
  'автомобильные ароматизаторы': 'auto',
  электроника: 'electronics',
  косметика: 'beauty',
  'дом и быт': 'home',
  одежда: 'fashion',
  игрушки: 'toys',
  подарки: 'gifts',
  кухня: 'kitchen',
  спорт: 'sport',
  книги: 'books',
};

export const PUBLIC_CATEGORIES = CATEGORY_RULES.map(({ slug, label, group }) => ({ slug, label, group }));

export function getProductCategory(product: Partial<Product> & { category?: string | null }) {
  const rawCategory = String(product.category || '').trim();
  const tags = Array.isArray(product.tags) ? product.tags.join(' ') : '';
  const text = [
    rawCategory,
    product.title,
    product.description,
    product.marketplace,
    product.sourceProvider,
    tags,
    product.originalUrl,
    product.affiliateUrl,
  ].filter(Boolean).join(' ');

  const directSlug = LABEL_TO_SLUG[rawCategory.toLowerCase()] || LABEL_TO_SLUG[tags.toLowerCase()];
  const matched = directSlug
    ? CATEGORY_RULES.find((category) => category.slug === directSlug)
    : CATEGORY_RULES.find((category) => category.patterns.some((pattern) => pattern.test(text)));

  const category = matched || CATEGORY_RULES.find((item) => item.slug === 'gifts')!;
  return {
    slug: category.slug,
    label: category.label,
    group: category.group,
  };
}

export function enrichProductCategory<T extends Partial<Product>>(product: T): T & {
  categorySlug: string;
  categoryLabel: string;
} {
  const category = getProductCategory(product);
  return {
    ...product,
    categorySlug: category.slug,
    categoryLabel: category.label,
  };
}
