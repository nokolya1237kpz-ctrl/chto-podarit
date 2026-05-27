import type { CompareFiltersState } from '../model/types';
import { searchCompareProducts } from '../api/searchCompareProducts';
import { normalizeCompareResults } from './normalizeCompareResults';

export async function comparePipeline(filters: CompareFiltersState) {
  const response = await searchCompareProducts(filters);
  return {
    response,
    normalized: normalizeCompareResults(response),
  };
}
