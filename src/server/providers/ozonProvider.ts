import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@entities/product/types';
import { normalizeAffiliateProduct } from '@/lib/affiliate';
import { makeSearchUrl, parseSearchPageAsSingleProduct } from './marketplaceSearch';
import { diagnostic, type ProviderDiagnostic, type ProviderSearchResult } from '@/lib/diagnostics/providerDiagnostics';

export class OzonProvider implements ProductProvider {
  id = 'ozon';
  name = 'Ozon';
  searchUrlTemplate = 'https://www.ozon.ru/search/?text={query}';

  async searchWithDiagnostics(filters: ProductSearchFilters): Promise<ProviderSearchResult<Product>> {
    const query = filters.query || '';
    const url = makeSearchUrl(this.searchUrlTemplate, query);
    const diagnostics: ProviderDiagnostic[] = [
      diagnostic({ provider: this.id, query, url, stage: 'build_url', status: 'success' }),
    ];

    try {
      const products = await this.searchProducts(filters);
      diagnostics.push(diagnostic({
        provider: this.id,
        query,
        url,
        stage: 'normalize',
        status: products.length ? 'success' : 'warning',
        normalized: products.length,
        error: products.length ? undefined : 'Ozon часто ограничивает публичный поиск. Используйте импорт URL/фиды.',
        details: { reason: products.length ? 'searchable' : 'empty_or_limited' },
      }));
      return { products, diagnostics };
    } catch (error) {
      diagnostics.push(diagnostic({
        provider: this.id,
        query,
        url,
        stage: 'fetch',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        details: { reason: 'blocked_or_failed' },
      }));
      return { products: [], diagnostics };
    }
  }

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
