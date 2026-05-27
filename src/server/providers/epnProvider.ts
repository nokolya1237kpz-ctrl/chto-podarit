import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@entities/product/types';
import { normalizeAffiliateProduct } from '@/lib/affiliate';

export class EpnProvider implements ProductProvider {
  id = 'epn';
  name = 'ePN';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    const apiKey = process.env.EPN_API_KEY;
    const affiliateId = process.env.EPN_AFFILIATE_ID;
    if (!apiKey || !affiliateId) {
      console.warn('ePN API not configured');
      return [];
    }

    try {
      // TODO: Implement ePN API integration with partner metadata endpoints.
      return [];
    } catch (error) {
      console.error('Error searching ePN API:', error);
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
