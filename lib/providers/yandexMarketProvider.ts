import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';
import { makeSearchUrl, parseSearchPageAsSingleProduct } from './marketplaceSearch';

export class YandexMarketProvider implements ProductProvider {
  id = 'yandex_market';
  name = 'Yandex Market';
  searchUrlTemplate = 'https://market.yandex.ru/search?text={query}';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    const apiKey = process.env.YANDEX_MARKET_API_KEY;
    if (!apiKey) {
      return parseSearchPageAsSingleProduct(makeSearchUrl(this.searchUrlTemplate, filters.query), 'yandex_market', filters.query);
    }

    try {
      // TODO: Implement Yandex Market API integration.
      return [];
    } catch (error) {
      console.error('Error searching Yandex Market API:', error);
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
