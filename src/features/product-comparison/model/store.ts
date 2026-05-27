import { create } from 'zustand';
import type { CompareFiltersState } from './types';

type CompareStore = CompareFiltersState & {
  setField: <K extends keyof CompareFiltersState>(key: K, value: CompareFiltersState[K]) => void;
};

export const useCompareStore = create<CompareStore>((set) => ({
  query: '',
  marketplace: '',
  sort: 'price_asc',
  minPrice: '',
  maxPrice: '',
  setField: (key, value) => set({ [key]: value } as Pick<CompareStore, typeof key>),
}));
