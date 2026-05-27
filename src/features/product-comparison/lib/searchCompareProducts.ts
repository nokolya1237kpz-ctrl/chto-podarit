import type { CompareSearchQuery } from '../schema';

export async function searchCompareProducts(query: CompareSearchQuery) {
  const params = new URLSearchParams({ q: query.q });
  const response = await fetch(`/api/compare/search?${params.toString()}`);
  return response.json();
}
