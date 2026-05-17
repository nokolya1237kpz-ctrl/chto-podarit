import type { SourceProvider } from '@/types/product';

export interface AdminProviderInfo {
  id: SourceProvider;
  label: string;
  description: string;
  icon: string;
  exampleMarketplace?: string;
}

export const ADMIN_PROVIDERS: AdminProviderInfo[] = [
  { id: 'manual', label: 'Manual', description: 'Ручной источник товаров', icon: '📝' },
  { id: 'admitad', label: 'Admitad', description: 'Партнёрская сеть Admitad', icon: '🚀' },
  { id: 'epn', label: 'ePN', description: 'Партнёрская сеть ePN', icon: '⚡' },
  { id: 'cityads', label: 'CityAds', description: 'Партнёрская сеть CityAds', icon: '🏙️' },
  { id: 'aliexpress', label: 'AliExpress', description: 'Международный маркетплейс AliExpress', icon: '🌏' },
  { id: 'yandex_market', label: 'Yandex Market', description: 'Яндекс.Маркет', icon: '🔍' },
  { id: 'ozon', label: 'Ozon', description: 'Маркетплейс Ozon', icon: '📦' },
  { id: 'wildberries', label: 'Wildberries', description: 'Маркетплейс Wildberries', icon: '🌺' },
  { id: 'direct_api', label: 'Direct API', description: 'Произвольный прямой API', icon: '🧠' },
];

export function getProviderLabel(id: string): string {
  return ADMIN_PROVIDERS.find((provider) => provider.id === id)?.label || id;
}

export function getProviderIcon(id: string): string {
  return ADMIN_PROVIDERS.find((provider) => provider.id === id)?.icon || '❔';
}
