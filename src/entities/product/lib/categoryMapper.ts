import type { Product } from '../types';
import { detectCategorySlug, getCategoryMeta, PUBLIC_CATEGORIES } from './categoryTaxonomy';

export { PUBLIC_CATEGORIES };

export type ProductCategory = {
  slug: string;
  label: string;
  group: string;
};

export function getProductCategory(product: Partial<Product> & { category?: string | null }) {
  const detected = detectCategorySlug(product);
  return getCategoryMeta(detected === 'unknown' ? product.categorySlug || detected : detected);
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
