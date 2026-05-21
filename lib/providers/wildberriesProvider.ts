import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';
import { makeSearchUrl, toProviderProduct } from './marketplaceSearch';

export class WildberriesProvider implements ProductProvider {
  id = 'wildberries';
  name = 'Wildberries';
  searchUrlTemplate = 'https://search.wb.ru/exactmatch/ru/common/v18/search?query={query}&resultset=catalog&sort=popular&spp=30';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    try {
      const response = await fetch(makeSearchUrl(this.searchUrlTemplate, filters.query), {
        headers: {
          'User-Agent': 'ChtoPodaritBot/1.0 (+https://что-подарить.online/contacts)',
          Accept: 'application/json',
        },
      });
      if (!response.ok) return [];
      const body = await response.json();
      const products = body?.data?.products || [];
      return products.slice(0, Math.min(filters.limit || 20, 20)).map((item: any) => {
        const price = Number(item.salePriceU || item.priceU || 0) / 100;
        const id = String(item.id || item.root || item.nmId);
        return toProviderProduct({
          idSeed: `wb:${id}`,
          title: item.name || item.brand || 'Wildberries товар',
          price,
          oldPrice: item.priceU ? Number(item.priceU) / 100 : undefined,
          imageUrl: item.id ? `https://basket-01.wbbasket.ru/vol${String(item.id).slice(0, -5)}/part${String(item.id).slice(0, -3)}/${item.id}/images/c516x688/1.webp` : undefined,
          originalUrl: `https://www.wildberries.ru/catalog/${id}/detail.aspx`,
          marketplace: 'wildberries',
          sourceProvider: 'wildberries',
          sourceType: 'api',
          externalProductId: id,
          tags: ['wildberries', filters.query || ''],
        });
      });
    } catch (error) {
      console.error('Error searching Wildberries:', error);
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
