export type MarketplaceId = 
  | 'ozon'
  | 'wildberries'
  | 'yandex_market'
  | 'aliexpress'
  | 'amazon'
  | 'other';

export interface Marketplace {
  id: MarketplaceId;
  name: string;
  baseUrl: string;
  supportsAffiliate: boolean;
  supportsPriceMonitoring: boolean;
  supportsApi: boolean;
  logo?: string;
}
