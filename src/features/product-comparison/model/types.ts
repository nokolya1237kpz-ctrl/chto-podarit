import type { Product } from '@entities/product/types';

export type CompareSourceStats = Record<string, { count: number; status: string; error?: string }>;

export type CompareGroup = {
  id: string;
  title: string;
  imageUrl?: string;
  items: Product[];
  cheapest?: Product;
};

export type CompareSearchResponse = {
  success: boolean;
  query: string;
  sourceStats: CompareSourceStats;
  data: Product[];
  groups: CompareGroup[];
  cheapest?: Product;
  count: number;
  diagnostics?: unknown[];
  error?: string;
};

export type CompareFiltersState = {
  query: string;
  marketplace: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
};
