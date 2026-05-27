import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@entities/product/types';
import { normalizeAffiliateProduct } from '@/lib/affiliate';

export class AdmitadProvider implements ProductProvider {
  id = 'admitad';
  name = 'Admitad API';

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    // TODO: Implement Admitad API integration
    // This should:
    // 1. Check if ADMITAD_CLIENT_ID and ADMITAD_CLIENT_SECRET are set
    // 2. Authenticate with Admitad API
    // 3. Search for products with given filters
    // 4. Transform API response to Product[]
    // 5. Add Admitad deeplinks to results

    // For now, return empty array if not configured
    const clientId = process.env.ADMITAD_CLIENT_ID;
    const clientSecret = process.env.ADMITAD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('Admitad API not configured (missing credentials)');
      return [];
    }

    try {
      // Placeholder: Real implementation would:
      // const token = await authenticateWithAdmitad(clientId, clientSecret);
      // const results = await searchAdmitadApi(token, filters);
      // return results.map(r => this.normalizeProduct(r));

      console.info('Admitad API search not yet implemented');
      return [];
    } catch (error) {
      console.error('Error searching Admitad API:', error);
      return [];
    }
  }

  async getProductPrice(productId: string): Promise<number | null> {
    // TODO: Implement price checking from Admitad API
    return null;
  }

  normalizeProduct(raw: unknown): Product {
    return normalizeAffiliateProduct(raw);
  }
}

export const admitadProvider = new AdmitadProvider();
