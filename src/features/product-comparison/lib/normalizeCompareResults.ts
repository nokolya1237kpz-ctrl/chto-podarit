import type { CompareSearchResponse } from '../model/types';

export function normalizeCompareResults(response: CompareSearchResponse | null) {
  return {
    groups: response?.groups || [],
    sourceStats: response?.sourceStats || {},
    diagnostics: response?.diagnostics || [],
    hasLimitedSources: Object.values(response?.sourceStats || {}).some((stat) => stat.status === 'limited'),
  };
}
