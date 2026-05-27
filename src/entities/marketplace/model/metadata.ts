import type { MarketplaceId } from '../types';

export type MarketplaceMetadata = {
  id: MarketplaceId | string;
  label: string;
  color: string;
  logo?: string;
  deliveryLabel: string;
  trustScore: number;
};

export const marketplaceMetadata: Record<string, MarketplaceMetadata> = {
  ozon: { id: 'ozon', label: 'Ozon', color: 'bg-blue-500/15 text-blue-100', deliveryLabel: 'Быстрая доставка', trustScore: 82 },
  wildberries: { id: 'wildberries', label: 'Wildberries', color: 'bg-fuchsia-500/15 text-fuchsia-100', deliveryLabel: 'Пункты выдачи', trustScore: 80 },
  aliexpress: { id: 'aliexpress', label: 'AliExpress', color: 'bg-orange-500/15 text-orange-100', deliveryLabel: 'Международная доставка', trustScore: 72 },
  yandex_market: { id: 'yandex_market', label: 'Яндекс Маркет', color: 'bg-yellow-500/15 text-yellow-100', deliveryLabel: 'Маркет-доставка', trustScore: 84 },
  dns_shop: { id: 'dns_shop', label: 'DNS', color: 'bg-amber-500/15 text-amber-100', deliveryLabel: 'Самовывоз и доставка', trustScore: 78 },
  other: { id: 'other', label: 'Другой', color: 'bg-white/8 text-white/75', deliveryLabel: 'Уточнить у продавца', trustScore: 50 },
};

export function getMarketplaceMetadata(id?: string) {
  return marketplaceMetadata[id || 'other'] || marketplaceMetadata.other;
}
