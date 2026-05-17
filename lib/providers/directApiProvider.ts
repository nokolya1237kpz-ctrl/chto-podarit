import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';

export class DirectApiProvider implements ProductProvider {
  id = 'direct_api';
  name = 'Direct API';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    const apiKey = process.env.DIRECT_API_KEY;
    if (!apiKey) {
      console.warn('Direct API not configured');
      return [];
    }

    try {
      // TODO: Implement direct API integration for partner catalogs.
      return [];
    } catch (error) {
      console.error('Error searching direct API:', error);
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
