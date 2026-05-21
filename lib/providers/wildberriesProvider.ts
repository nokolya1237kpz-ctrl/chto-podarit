import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';
import { countQuality, diagnostic, type ProviderDiagnostic, type ProviderSearchResult } from '@/lib/diagnostics/providerDiagnostics';

const WB_VERSIONS = ['v18', 'v17', 'v16', 'v15', 'v14', 'v13'];

export function buildWildberriesImageUrl(productId: number) {
  const id = Number(productId);
  const vol = Math.floor(id / 100000);
  const part = Math.floor(id / 1000);
  const basketNum = Math.max(1, Math.min(20, Math.floor(vol / 143) + 1));
  const basket = String(basketNum).padStart(2, '0');
  return `https://basket-${basket}.wbbasket.ru/vol${vol}/part${part}/${id}/images/big/1.webp`;
}

function buildWbSearchUrl(query: string, version = 'v18') {
  return `https://search.wb.ru/exactmatch/ru/common/${version}/search?query=${encodeURIComponent(query)}&resultset=catalog&sort=popular&spp=30`;
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

    for (const version of WB_VERSIONS) {
      const url = buildWbSearchUrl(query, version);
      try {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'ChtoPodaritBot/1.0 (+https://что-подарить.online/contacts)',
          },
        });
        diagnostics.push(diagnostic({ provider: this.id, query, url, stage: 'fetch', status: response.ok ? 'success' : 'warning', httpStatus: response.status }));
        if (!response.ok) continue;

        const body = await response.json();
        const raw = body?.data?.products || [];
        diagnostics.push(diagnostic({ provider: this.id, query, url, stage: 'parse_json', status: 'success', foundRaw: raw.length, details: { version } }));

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
