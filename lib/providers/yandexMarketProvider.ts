import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';

export class YandexMarketProvider implements ProductProvider {
  id = 'yandex_market';
  name = 'Yandex Market API';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    const apiKey = process.env.YANDEX_MARKET_API_KEY;
    if (!apiKey) {
      console.warn('Yandex Market API not configured');
      return [];
    }

    try {
      // TODO: Implement Yandex Market API integration.
      return [];
    } catch (error) {
      console.error('Error searching Yandex Market API:', error);
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
