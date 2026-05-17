import type { Product } from '@/types/product';

export interface ProductSearchFilters {
  query?: string;
  recipient?: string;
  budget?: string;
  interests?: string[];
  occasions?: string[];
  giftTypes?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  marketplace?: string;
  limit?: number;
  offset?: number;
}

export interface ProductProvider {
  id: string;
  name: string;
  searchProducts(filters: ProductSearchFilters): Promise<Product[]>;
  getProductPrice(productId: string): Promise<number | null>;
  normalizeProduct(raw: unknown): Product;
}
