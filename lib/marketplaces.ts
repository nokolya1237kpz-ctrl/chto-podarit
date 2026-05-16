import type { MarketplaceId, Marketplace } from '@/types/marketplace';

export const MARKETPLACES: Record<MarketplaceId, Marketplace> = {
  ozon: {
    id: 'ozon',
    name: 'Ozon',
    baseUrl: 'https://www.ozon.ru',
    supportsAffiliate: true,
    supportsPriceMonitoring: true,
    supportsApi: true,
    logo: '🎯',
  },
  wildberries: {
    id: 'wildberries',
    name: 'Wildberries',
    baseUrl: 'https://www.wildberries.ru',
    supportsAffiliate: true,
    supportsPriceMonitoring: true,
    supportsApi: true,
    logo: '📦',
  },
  yandex_market: {
    id: 'yandex_market',
    name: 'Яндекс.Маркет',
    baseUrl: 'https://market.yandex.ru',
    supportsAffiliate: true,
    supportsPriceMonitoring: true,
    supportsApi: true,
    logo: '🔍',
  },
  aliexpress: {
    id: 'aliexpress',
    name: 'AliExpress',
    baseUrl: 'https://www.aliexpress.com',
    supportsAffiliate: true,
    supportsPriceMonitoring: true,
    supportsApi: false,
    logo: '🌏',
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    baseUrl: 'https://www.amazon.com',
    supportsAffiliate: true,
    supportsPriceMonitoring: true,
    supportsApi: false,
    logo: '🛒',
  },
  other: {
    id: 'other',
    name: 'Другой маркетплейс',
    baseUrl: '',
    supportsAffiliate: true,
    supportsPriceMonitoring: false,
    supportsApi: false,
    logo: '🏪',
  },
};

export function getMarketplace(id: string): Marketplace | null {
  return MARKETPLACES[id as MarketplaceId] || null;
}

export function getMarketplaceName(id: string): string {
  return MARKETPLACES[id as MarketplaceId]?.name || id;
}

export const MARKETPLACE_OPTIONS = Object.values(MARKETPLACES).map((m) => ({
  id: m.id,
  name: m.name,
}));
