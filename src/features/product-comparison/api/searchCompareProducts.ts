import type { CompareFiltersState, CompareSearchResponse } from '../model/types';

export async function searchCompareProducts(filters: CompareFiltersState): Promise<CompareSearchResponse> {
  const params = new URLSearchParams({ q: filters.query, sort: filters.sort });
  if (filters.marketplace) params.set('marketplace', filters.marketplace);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);

  const response = await fetch(`/api/compare/search?${params.toString()}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(text.slice(0, 200) || 'Сервер вернул не JSON');
  }
  return response.json();
}
