import type { Product } from '@/types/product';
import type { ProductProvider, ProductSearchFilters } from './types';
import { normalizeAffiliateProduct } from '@/lib/affiliate';
import { countQuality, diagnostic, type ProviderDiagnostic, type ProviderSearchResult } from '@/lib/diagnostics/providerDiagnostics';
import { makeSearchUrl, parseSearchPageAsSingleProduct } from './marketplaceSearch';

export type RetailProviderConfig = {
  id: string;
  name: string;
  marketplace: string;
  searchUrlTemplate: string;
  sourceProvider: Product['sourceProvider'];
};

export class RetailProvider implements ProductProvider {
  id: string;
  name: string;
  searchUrlTemplate: string;
  marketplace: string;
  sourceProvider: Product['sourceProvider'];

  constructor(config: RetailProviderConfig) {
    this.id = config.id;
    this.name = config.name;
    this.searchUrlTemplate = config.searchUrlTemplate;
    this.marketplace = config.marketplace;
    this.sourceProvider = config.sourceProvider;
  }

  async searchWithDiagnostics(filters: ProductSearchFilters): Promise<ProviderSearchResult<Product>> {
    const query = filters.query || '';
    const url = makeSearchUrl(this.searchUrlTemplate, query);
    const diagnostics: ProviderDiagnostic[] = [
      diagnostic({ provider: this.id, query, url, stage: 'build_url', status: 'success' }),
    ];

    try {
      const products = await parseSearchPageAsSingleProduct(url, this.marketplace, query);
      const normalized = products.slice(0, filters.limit || 10).map((product) => ({
        ...product,
        marketplace: this.marketplace,
        sourceProvider: this.sourceProvider,
        sourceType: 'parser' as const,
      }));
      diagnostics.push(diagnostic({
        provider: this.id,
        query,
        url,
        stage: 'normalize',
        status: normalized.length ? 'success' : 'warning',
        normalized: normalized.length,
        ...countQuality(normalized),
        error: normalized.length ? undefined : 'Источник ограничил публичный парсинг или не отдал товарные метаданные',
        details: { first: normalized.slice(0, 3).map((item) => ({ title: item.title, price: item.price })) },
      }));
      return { products: normalized, diagnostics };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      diagnostics.push(diagnostic({
        provider: this.id,
        query,
        url,
        stage: 'fetch',
        status: message.includes('limited') ? 'warning' : 'error',
        error: message,
        details: {
          reason: message.includes('429') ? 'rate_limit' : message.includes('403') ? 'blocked' : message.includes('timeout') ? 'timeout' : 'unknown',
        },
      }));
      return { products: [], diagnostics };
    }
  }

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    return (await this.searchWithDiagnostics(filters)).products;
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
