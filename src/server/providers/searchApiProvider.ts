import type { Product } from '@entities/product/types';
import type { ProductProvider, ProductSearchFilters } from './types';
import { normalizeAffiliateProduct } from '@/lib/affiliate';
import { browserParser } from '@server/parsers/browserParser';
import { normalizeParsedProduct } from '@server/parsers/normalizeParsedProduct';
import { importNormalizedProduct } from '@features/product-import/lib/importProduct';
import { diagnostic, type ProviderDiagnostic, type ProviderSearchResult } from '@/lib/diagnostics/providerDiagnostics';

const productDomains = ['ozon.ru', 'wildberries.ru', 'market.yandex.ru', 'dns-shop.ru', 'mvideo.ru', 'eldorado.ru', 'citilink.ru', 'aliexpress.ru'];

function buildSearchQuery(query: string) {
  return `${query} (${productDomains.map((domain) => `site:${domain}`).join(' OR ')})`;
}

function isLikelyProductUrl(url: string) {
  return /\/product|\/catalog|\/item|\/detail|\/p\/|\/search\/catalog|\/goods/i.test(url) || productDomains.some((domain) => url.includes(domain));
}

async function fetchSerpApi(query: string): Promise<string[]> {
  if (!process.env.SERPAPI_KEY) return [];
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('q', buildSearchQuery(query));
  url.searchParams.set('hl', 'ru');
  url.searchParams.set('api_key', process.env.SERPAPI_KEY);
  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`SerpAPI error ${response.status}`);
  const body = await response.json();
  return (body.organic_results || []).map((item: any) => item.link).filter(Boolean);
}

async function fetchGoogleCse(query: string): Promise<string[]> {
  if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID) return [];
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', process.env.GOOGLE_API_KEY);
  url.searchParams.set('cx', process.env.GOOGLE_CSE_ID);
  url.searchParams.set('q', buildSearchQuery(query));
  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Google CSE error ${response.status}`);
  const body = await response.json();
  return (body.items || []).map((item: any) => item.link).filter(Boolean);
}

async function fetchBing(query: string): Promise<string[]> {
  if (!process.env.BING_SEARCH_API_KEY) return [];
  const url = new URL('https://api.bing.microsoft.com/v7.0/search');
  url.searchParams.set('q', buildSearchQuery(query));
  url.searchParams.set('mkt', 'ru-RU');
  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_API_KEY,
    },
  });
  if (!response.ok) throw new Error(`Bing Search error ${response.status}`);
  const body = await response.json();
  return (body.webPages?.value || []).map((item: any) => item.url).filter(Boolean);
}

export class SearchApiProvider implements ProductProvider {
  id = 'search_api';
  name = 'Search API';

  async findUrls(query: string, limit = 10) {
    const urls = new Set<string>();
    const errors: string[] = [];
    for (const fetcher of [fetchSerpApi, fetchGoogleCse, fetchBing]) {
      try {
        const found = await fetcher(query);
        found.filter(isLikelyProductUrl).forEach((url: string) => urls.add(url));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
      if (urls.size >= limit) break;
    }
    return { urls: [...urls].slice(0, limit), errors };
  }

  async searchWithDiagnostics(filters: ProductSearchFilters): Promise<ProviderSearchResult<Product>> {
    const query = filters.query || '';
    const diagnostics: ProviderDiagnostic[] = [];
    const { urls, errors } = await this.findUrls(query, filters.limit || 8);
    diagnostics.push(diagnostic({
      provider: this.id,
      query,
      stage: 'fetch',
      status: urls.length ? 'success' : 'warning',
      foundRaw: urls.length,
      error: urls.length ? undefined : errors[0] || 'Search API keys are not configured',
      details: { urls, errors },
    }));

    const products: Product[] = [];
    for (const url of urls) {
      try {
        const parsed = await browserParser(url, { allowAnyPublicDomain: true });
        const normalized = normalizeParsedProduct(parsed, 'search_api') as Product;
        const saved = await importNormalizedProduct({ ...normalized, sourceProvider: 'search_api' as any, sourceType: 'api' as any });
        products.push((saved || normalized) as Product);
      } catch (error) {
        diagnostics.push(diagnostic({ provider: this.id, query, url, stage: 'normalize', status: 'warning', error: error instanceof Error ? error.message : String(error) }));
      }
    }

    diagnostics.push(diagnostic({ provider: this.id, query, stage: 'normalize', status: products.length ? 'success' : 'warning', normalized: products.length }));
    return { products, diagnostics };
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
