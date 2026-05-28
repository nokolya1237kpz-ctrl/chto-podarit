import { detectCategorySlug, getCategoryMeta } from './categoryTaxonomy';

export function detectProductCategory(input: { title?: string; description?: string; category?: string; tags?: string[] }) {
  return getCategoryMeta(detectCategorySlug(input)).label;
}
