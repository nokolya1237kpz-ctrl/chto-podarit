import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';
import { makeSearchUrl, parseSearchPageAsSingleProduct } from './marketplaceSearch';

export class AliExpressProvider implements ProductProvider {
  id = 'aliexpress';
  name = 'AliExpress';
  searchUrlTemplate = 'https://aliexpress.ru/wholesale?SearchText={query}';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;
    if (!appKey || !appSecret) {
      return parseSearchPageAsSingleProduct(makeSearchUrl(this.searchUrlTemplate, filters.query), 'aliexpress', filters.query);
    }

    try {
      // TODO: Implement AliExpress API integration.
      return [];
    } catch (error) {
      console.error('Error searching AliExpress API:', error);
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
