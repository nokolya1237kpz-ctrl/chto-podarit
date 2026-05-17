import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';

export class OzonProvider implements ProductProvider {
  id = 'ozon';
  name = 'Ozon API';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    const clientId = process.env.OZON_CLIENT_ID;
    const apiKey = process.env.OZON_API_KEY;
    if (!clientId || !apiKey) {
      console.warn('Ozon API not configured');
      return [];
    }

    try {
      // TODO: Implement Ozon API integration using official feed or product metadata endpoints.
      return [];
    } catch (error) {
      console.error('Error searching Ozon API:', error);
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
