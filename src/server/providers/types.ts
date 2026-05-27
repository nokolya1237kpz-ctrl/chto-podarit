import type { Product } from '@entities/product/types';

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
  search?(filters: ProductSearchFilters): Promise<Product[]>;
  getProductPrice(productId: string): Promise<number | null>;
  normalizeProduct(raw: unknown): Product;
  normalize?(raw: unknown): Product;
  import?(raw: unknown): Promise<Product | null>;
  sync?(filters?: ProductSearchFilters): Promise<{ synced: number; failed: number }>;
  getPrice?(productId: string): Promise<number | null>;
  getAvailability?(productId: string): Promise<boolean | null>;
}
