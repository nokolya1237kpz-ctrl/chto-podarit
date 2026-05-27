import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@entities/product/types';
import { normalizeAffiliateProduct } from '@/lib/affiliate';
import { makeSearchUrl, parseSearchPageAsSingleProduct } from './marketplaceSearch';

export class OzonProvider implements ProductProvider {
  id = 'ozon';
  name = 'Ozon';
  searchUrlTemplate = 'https://www.ozon.ru/search/?text={query}';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    const clientId = process.env.OZON_CLIENT_ID;
    const apiKey = process.env.OZON_API_KEY;
    if (!clientId || !apiKey) {
      return parseSearchPageAsSingleProduct(makeSearchUrl(this.searchUrlTemplate, filters.query), 'ozon', filters.query);
    }

    try {
      // TODO: Implement Ozon API integration using official feed or product metadata endpoints.
      return [];
    } catch (error) {
      console.error('Error searching Ozon API:', error);
      return [];
    }
  }

  search(filters: ProductSearchFilters) {
    return this.searchProducts(filters);
  }

  async getProductPrice(_productId: string): Promise<number | null> {
    return null;
  }

  normalizeProduct(raw: unknown): Product {
    return normalizeAffiliateProduct(raw);
  }
}
