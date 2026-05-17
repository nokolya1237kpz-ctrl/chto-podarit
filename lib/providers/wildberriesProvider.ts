import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';

export class WildberriesProvider implements ProductProvider {
  id = 'wildberries';
  name = 'Wildberries API';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    const apiKey = process.env.WILDBERRIES_API_KEY;
    if (!apiKey) {
      console.warn('Wildberries API not configured');
      return [];
    }

    try {
      // TODO: Implement Wildberries API integration using official catalog or affiliate metadata.
      return [];
    } catch (error) {
      console.error('Error searching Wildberries API:', error);
      return [];
    }
  }

  async getProductPrice(_productId: string): Promise<number | null> {
    return null;
  }

  normalizeProduct(raw: unknown): Product {
    return normalizeAffiliateProduct(raw);
  }
}
