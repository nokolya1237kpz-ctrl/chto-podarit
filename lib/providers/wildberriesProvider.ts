import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';
import { countQuality, diagnostic, type ProviderDiagnostic, type ProviderSearchResult } from '@/lib/diagnostics/providerDiagnostics';
import { fetchWithAdaptiveRetry, getJsonHeaders } from '@/lib/providerHttp';

const WB_VERSIONS = ['v18', 'v17', 'v16', 'v15', 'v14', 'v13'];
const WB_ENDPOINTS = [
  'https://search.wb.ru/exactmatch/ru/common/{version}/search?query={query}&resultset=catalog&sort=popular&spp=30',
  'https://search.wb.ru/exactmatch/ru/common/{version}/search?appType=1&curr=rub&dest=-1257786&query={query}&resultset=catalog&sort=popular&spp=30',
  'https://search.wb.ru/exactmatch/ru/common/{version}/search?appType=1&curr=rub&query={query}&resultset=catalog&sort=popular&spp=30',
];

export function buildWildberriesImageUrl(productId: number) {
  const id = Number(productId);
  const vol = Math.floor(id / 100000);
  const part = Math.floor(id / 1000);
  const basketNum = Math.max(1, Math.min(20, Math.floor(vol / 143) + 1));
  const basket = String(basketNum).padStart(2, '0');
  return `https://basket-${basket}.wbbasket.ru/vol${vol}/part${part}/${id}/images/big/1.webp`;
}

function buildWbSearchUrl(query: string, version = 'v18') {
  return WB_ENDPOINTS[0].replace('{version}', version).replace('{query}', encodeURIComponent(query));
}

function buildWbUrls(query: string) {
  return WB_VERSIONS.flatMap((version) => WB_ENDPOINTS.map((template) => template.replace('{version}', version).replace('{query}', encodeURIComponent(query))));
}

function wbReason(status?: number, error?: string) {
  if (status === 429) return 'rate_limit';
  if (status === 403) return 'blocked';
  if (status && status >= 500) return 'server_error';
  if (String(error || '').toLowerCase().includes('timeout')) return 'timeout';
  return 'unknown';
}

function normalizeWbProduct(item: any, query?: string): Product {
  const id = Number(item.id || item.root || item.nmId);
  const price = Number(item.salePriceU || item.salePrice || item.price || 0) / (item.salePriceU ? 100 : 1);
  const oldPrice = item.priceU ? Number(item.priceU) / 100 : undefined;
  const title = [item.brand, item.name].filter(Boolean).join(' ').trim() || 'Wildberries товар';

  return {
    id: `wb:${id}`,
    title,
    description: [item.supplier, item.colors?.[0]?.name].filter(Boolean).join(' · '),
    price,
    oldPrice,
    currency: 'RUB',
    marketplace: 'wildberries',
    originalUrl: `https://www.wildberries.ru/catalog/${id}/detail.aspx`,
    affiliateUrl: `https://www.wildberries.ru/catalog/${id}/detail.aspx`,
    externalProductId: String(id),
    imageUrl: id ? buildWildberriesImageUrl(id) : undefined,
    recipients: [],
    budget: '',
    interests: [],
    occasions: [],
    giftTypes: [],
    tags: ['wildberries', query || '', item.brand || ''].filter(Boolean),
    wowRating: Math.min(10, Math.max(6, Math.round(Number(item.rating || 4) * 2))),
    riskLevel: 'low',
    isActive: true,
    status: 'active',
    sourceProvider: 'wildberries',
    sourceType: 'api',
  };
}

export class WildberriesProvider implements ProductProvider {
  id = 'wildberries';
  name = 'Wildberries';

  async searchWithDiagnostics(filters: ProductSearchFilters): Promise<ProviderSearchResult<Product>> {
    const query = filters.query || '';
    const diagnostics: ProviderDiagnostic[] = [];
    diagnostics.push(diagnostic({ provider: this.id, query, stage: 'build_url', status: 'success', url: buildWbSearchUrl(query) }));

    for (const url of buildWbUrls(query)) {
      try {
        const result = await fetchWithAdaptiveRetry(url, {
          headers: getJsonHeaders(),
          redirect: 'follow',
        }, { maxRetries: 2, timeoutMs: 9000 });
        result.warnings.forEach((warning) => {
          diagnostics.push(diagnostic({
            provider: this.id,
            query,
            url,
            stage: 'fetch',
            status: 'warning',
            error: 'Non-ASCII header value was sanitized before fetch',
            details: warning,
          }));
        });
        if (!result.response) {
          diagnostics.push(diagnostic({ provider: this.id, query, url, stage: 'fetch', status: 'error', error: result.error || result.reason, details: { reason: result.reason, attempts: result.attempts } }));
          continue;
        }
        const response = result.response;
        const reason = wbReason(response.status);
        diagnostics.push(diagnostic({
          provider: this.id,
          query,
          url,
          stage: 'fetch',
          status: response.ok ? 'success' : 'warning',
          httpStatus: response.status,
          error: response.ok ? undefined : 'Источник временно ограничил публичный запрос',
          details: { reason, attempts: result.attempts },
        }));
        if (!response.ok) continue;

        const body = await response.json();
        const raw = body?.data?.products || [];
        diagnostics.push(diagnostic({ provider: this.id, query, url, stage: 'parse_json', status: 'success', foundRaw: raw.length }));

        const products: Product[] = raw.slice(0, Math.min(filters.limit || 20, 20)).map((item: any) => normalizeWbProduct(item, query));
        const quality = countQuality(products);
        diagnostics.push(diagnostic({
          provider: this.id,
          query,
          url,
          stage: 'normalize',
          status: products.length ? 'success' : 'warning',
          normalized: products.length,
          ...quality,
          details: { first: products.slice(0, 3).map((p) => ({ title: p.title, price: p.price, imageUrl: p.imageUrl })) },
        }));

        return { products, diagnostics };
      } catch (error) {
        diagnostics.push(diagnostic({ provider: this.id, query, url, stage: 'fetch', status: 'error', error: error instanceof Error ? error.message : String(error) }));
      }
    }

    return { products: [], diagnostics };
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
