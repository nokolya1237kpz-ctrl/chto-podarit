import type { ProductProvider, ProductSearchFilters } from './types';
import type { Product } from '@entities/product/types';

export class ManualProvider implements ProductProvider {
  id = 'manual';
  name = 'Manual';

  async searchProducts(_filters: ProductSearchFilters): Promise<Product[]> {
    // Manual products are managed in Supabase by admins.
    // This provider exists to represent the manual source in the provider registry.
    return [];
  }

  async getProductPrice(_productId: string): Promise<number | null> {
    return null;
  }

  normalizeProduct(raw: unknown): Product {
    return raw as Product;
  }
}
