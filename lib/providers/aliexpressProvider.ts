import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';

export class AliExpressProvider implements ProductProvider {
  id = 'aliexpress';
  name = 'AliExpress API';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;
    if (!appKey || !appSecret) {
      console.warn('AliExpress API not configured');
      return [];
    }

    try {
      // TODO: Implement AliExpress API integration.
      return [];
    } catch (error) {
      console.error('Error searching AliExpress API:', error);
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
