import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@entities/product/types';
import { MOCK_PRODUCTS } from '@/data/products';
import { normalizeAffiliateProduct } from '@/lib/affiliate';

export class MockProvider implements ProductProvider {
  id = 'mock';
  name = 'Mock Products';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    let results = [...MOCK_PRODUCTS];

    // Filter by query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.description?.toLowerCase().includes(query) ?? false)
      );
    }

    // Filter by budget
    if (filters.budget) {
      results = results.filter((p) => p.budget === filters.budget);
    }

    // Filter by recipient
    if (filters.recipient) {
      results = results.filter((p) =>
        p.recipients.some((r) =>
          r.toLowerCase().includes(filters.recipient!.toLowerCase())
        )
      );
    }

    // Filter by interests
    if (filters.interests && filters.interests.length > 0) {
      results = results.filter((p) =>
        p.interests.some((i) =>
          filters.interests!.some((f) =>
            i.toLowerCase().includes(f.toLowerCase())
          )
        )
      );
    }

    // Filter by occasions
    if (filters.occasions && filters.occasions.length > 0) {
      results = results.filter((p) =>
        p.occasions.some((o) =>
          filters.occasions!.some((f) =>
            o.toLowerCase().includes(f.toLowerCase())
          )
        )
      );
    }

    // Filter by gift types
    if (filters.giftTypes && filters.giftTypes.length > 0) {
      results = results.filter((p) =>
        p.giftTypes.some((g) =>
          filters.giftTypes!.some((f) =>
            g.toLowerCase().includes(f.toLowerCase())
          )
        )
      );
    }

    // Filter by price range
    if (typeof filters.minPrice === 'number') {
      results = results.filter((p) => p.price >= filters.minPrice!);
    }
    if (typeof filters.maxPrice === 'number') {
      results = results.filter((p) => p.price <= filters.maxPrice!);
    }

    // Filter by marketplace
    if (filters.marketplace) {
      results = results.filter((p) => p.marketplace === filters.marketplace);
    }

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 10;
    results = results.slice(offset, offset + limit);

    return results;
  }

  async getProductPrice(productId: string): Promise<number | null> {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    return product?.price || null;
  }

  normalizeProduct(raw: unknown): Product {
    return normalizeAffiliateProduct(raw);
  }
}

export const mockProvider = new MockProvider();
