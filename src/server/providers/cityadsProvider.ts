import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@entities/product/types';
import { normalizeAffiliateProduct } from '@/lib/affiliate';

export class CityAdsProvider implements ProductProvider {
  id = 'cityads';
  name = 'CityAds API';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    const apiKey = process.env.CITYADS_API_KEY;
    if (!apiKey) {
      console.warn('CityAds API not configured');
      return [];
    }

    try {
      // TODO: Implement CityAds API integration.
      return [];
    } catch (error) {
      console.error('Error searching CityAds API:', error);
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
