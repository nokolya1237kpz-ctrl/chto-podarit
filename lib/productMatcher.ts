import type { Product } from '@/types/product';

export interface MatchFilters {
  recipient?: string;
  budget?: string;
  interests?: string[];
  occasions?: string[];
  giftTypes?: string[];
}

/**
 * Match products based on quiz answers
 */
export function matchProducts(products: Product[], filters: MatchFilters): Product[] {
  let matched = products.filter((p) => p.isActive);

  // Filter by recipient
  if (filters.recipient) {
    matched = matched.filter((p) =>
      p.recipients.some((r) => r.toLowerCase().includes(filters.recipient!.toLowerCase()))
    );
  }

  // Filter by budget
  if (filters.budget) {
    matched = matched.filter((p) => p.budget === filters.budget);
  }

  // Filter by interests (at least one match)
  if (filters.interests && filters.interests.length > 0) {
    matched = matched.filter((p) =>
      p.interests.some((i) =>
        filters.interests!.some((f) => i.toLowerCase().includes(f.toLowerCase()))
      )
    );
  }

  // Filter by occasions (at least one match)
  if (filters.occasions && filters.occasions.length > 0) {
    matched = matched.filter((p) =>
      p.occasions.some((o) =>
        filters.occasions!.some((f) => o.toLowerCase().includes(f.toLowerCase()))
      )
    );
  }

  // Filter by gift types (at least one match)
  if (filters.giftTypes && filters.giftTypes.length > 0) {
    matched = matched.filter((p) =>
      p.giftTypes.some((g) =>
        filters.giftTypes!.some((f) => g.toLowerCase().includes(f.toLowerCase()))
      )
    );
  }

  // Sort by wow rating (descending) and best price
  matched.sort((a, b) => {
    // Best price products first
    if (a.isBestPrice && !b.isBestPrice) return -1;
    if (!a.isBestPrice && b.isBestPrice) return 1;
    // Then by wow rating
    return b.wowRating - a.wowRating;
  });

  // Return top 10
  return matched.slice(0, 10);
}

/**
 * Get universal products (no specific filters)
 */
export function getUniversalProducts(products: Product[]): Product[] {
  const active = products.filter((p) => p.isActive);
  
  active.sort((a, b) => {
    // Best price products first
    if (a.isBestPrice && !b.isBestPrice) return -1;
    if (!a.isBestPrice && b.isBestPrice) return 1;
    // Then by wow rating
    return b.wowRating - a.wowRating;
  });

  return active.slice(0, 10);
}
