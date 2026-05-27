import type { ProviderRegistryItem } from './types';

export const providerRegistry: ProviderRegistryItem[] = [
  { id: 'local', displayName: 'Локальная база', supportsSearch: true, supportsImport: false, supportsPriceRefresh: false, health: 'active' },
  { id: 'feed', displayName: 'Фиды', supportsSearch: true, supportsImport: true, supportsPriceRefresh: true, health: 'active' },
  { id: 'search_api', displayName: 'Поисковый API', supportsSearch: true, supportsImport: true, supportsPriceRefresh: false, health: 'active' },
  { id: 'epn', displayName: 'ePN', supportsSearch: true, supportsImport: true, supportsPriceRefresh: false, rateLimit: { maxRequestsPerHour: 20, crawlDelaySeconds: 5 }, health: 'active' },
  { id: 'wildberries', displayName: 'Wildberries', supportsSearch: true, supportsImport: true, supportsPriceRefresh: true, rateLimit: { maxRequestsPerHour: 10, crawlDelaySeconds: 5 }, health: 'limited' },
  { id: 'ozon', displayName: 'Ozon', supportsSearch: false, supportsImport: true, supportsPriceRefresh: false, rateLimit: { maxRequestsPerHour: 10, crawlDelaySeconds: 6 }, health: 'limited' },
];

export function getProviderRegistryItem(id: string) {
  return providerRegistry.find((provider) => provider.id === id);
}
