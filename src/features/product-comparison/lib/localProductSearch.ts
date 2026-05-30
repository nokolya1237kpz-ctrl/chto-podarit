import type { Product } from '@entities/product/types';
import { dedupeProducts } from '@entities/product/lib/dedupeProducts';

const STOP_WORDS = new Set(['купить', 'цена', 'товар', 'для', 'код', 'артикул', 'новый', 'оригинал', 'на', 'и', 'в']);
const SYNONYMS: Array<[RegExp, string]> = [
  [/\biphone\b/gi, 'iphone айфон'],
  [/\bайфон\b/gi, 'iphone айфон'],
  [/\bairpods\b/gi, 'airpods аирподс наушники гарнитура'],
  [/\bаирподс\b/gi, 'airpods аирподс наушники гарнитура'],
  [/\bнаушники\b/gi, 'наушники гарнитура'],
  [/\bгарнитура\b/gi, 'наушники гарнитура'],
  [/\bсумка\b/gi, 'сумка сумочка'],
  [/\bсумочка\b/gi, 'сумка сумочка'],
  [/\bтелефон\b/gi, 'телефон смартфон'],
  [/\bсмартфон\b/gi, 'телефон смартфон'],
  [/\bавтотовары\b/gi, 'автотовары авто'],
  [/\bавто\b/gi, 'автотовары авто'],
  [/\bдухи\b/gi, 'духи парфюм'],
  [/\bпарфюм\b/gi, 'духи парфюм'],
];

export function normalizeLocalSearchText(value?: string) {
  let normalized = String(value || '').toLowerCase().replace(/ё/g, 'е');
  for (const [pattern, replacement] of SYNONYMS) normalized = normalized.replace(pattern, replacement);
  return normalized
    .replace(/\bкод\s*\d+\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value?: string) {
  return normalizeLocalSearchText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function searchableText(product: Product) {
  return normalizeLocalSearchText([
    product.title,
    product.description,
    product.categoryLabel,
    product.categorySlug,
    product.externalProductId,
    product.sourceProvider,
    product.sourceType,
    product.marketplace,
    ...(product.tags || []),
    ...(product.interests || []),
    ...(product.giftTypes || []),
  ].filter(Boolean).join(' '));
}

export function calculateLocalRelevance(product: Product, query?: string) {
  if (!query?.trim()) return 1;
  const haystack = searchableText(product);
  const queryTokens = tokens(query);
  if (!queryTokens.length) return 1;
  const matched = queryTokens.filter((token) => haystack.includes(token)).length;
  const phraseBoost = haystack.includes(normalizeLocalSearchText(query)) ? 2 : 0;
  return (matched + phraseBoost) / queryTokens.length;
}

export function searchLocalProducts(products: Product[], query?: string) {
  return dedupeProducts(products)
    .map((product) => ({ product, relevance: calculateLocalRelevance(product, query) }))
    .filter((item) => !query?.trim() || item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.product.price - b.product.price)
    .map((item) => item.product);
}
