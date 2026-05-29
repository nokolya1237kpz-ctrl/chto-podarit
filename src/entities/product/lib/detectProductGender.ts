import type { Product } from '../types';
import { detectCategorySlug } from './categoryTaxonomy';

export type ProductGender = 'female' | 'male' | 'unisex' | 'kids' | 'unknown';

type ProductLike = Partial<Product> & { category?: string | null };

function textOf(product: ProductLike) {
  return [
    product.title,
    product.description,
    product.categorySlug,
    product.categoryLabel,
    product.category,
    ...(product.tags || []),
    ...(product.interests || []),
    ...(product.giftTypes || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/ё/g, 'е');
}

export function detectProductGender(product: ProductLike): ProductGender {
  const categorySlug = product.categorySlug || detectCategorySlug(product);
  const text = textOf(product);

  if (['kids', 'toys', 'baby'].includes(categorySlug)) return 'kids';
  if (/(детск|ребен|малыш|kids|baby)/i.test(text)) return 'kids';

  if (
    ['women_bags', 'women_fashion', 'accessories_female', 'cosmetics', 'beauty', 'perfume', 'jewelry', 'flowers'].includes(categorySlug) ||
    /(женск|для женщин|сумочк|помад|косметик|макияж|парфюм жен|духи жен)/i.test(text)
  ) {
    return 'female';
  }

  if (
    ['belts_male', 'men_belts', 'men_fashion', 'accessories_male', 'male_accessories'].includes(categorySlug) ||
    /(мужск|для мужчин|ремень муж|мужской ремень|бород|брить)/i.test(text)
  ) {
    return 'male';
  }

  if (
    ['electronics', 'gadgets', 'home', 'decor', 'books', 'sweets', 'gift_sets', 'kitchen', 'sport', 'office', 'accessories'].includes(categorySlug)
  ) {
    return 'unisex';
  }

  return 'unknown';
}
