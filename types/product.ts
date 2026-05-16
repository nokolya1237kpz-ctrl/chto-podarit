export type MarketplaceId = 
  | 'ozon'
  | 'wildberries'
  | 'yandex_market'
  | 'aliexpress'
  | 'amazon'
  | 'other';

export type RiskLevel = 'low' | 'medium' | 'high';

export type SourceType = 'manual' | 'admitad' | 'api' | 'mock';

export type AffiliateSourceType = 'manual' | 'admitad' | 'cityads' | 'direct_api';

export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  oldPrice?: number;
  currency: string;
  marketplace: MarketplaceId | string;
  originalUrl: string;
  affiliateUrl?: string;
  admitadDeeplink?: string;
  admitadCampaignId?: string;
  admitadOfferId?: string;
  externalProductId?: string;
  imageUrl?: string;
  recipients: string[];
  budget: string;
  interests: string[];
  occasions: string[];
  giftTypes: string[];
  wowRating: number;
  riskLevel: RiskLevel;
  tags: string[];
  isBestPrice?: boolean;
  discountPercent?: number;
  isActive: boolean;
  sourceType: SourceType;
  lastPriceCheckedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AffiliateSource {
  id: string;
  name: string;
  type: AffiliateSourceType;
  marketplace?: string;
  baseUrl?: string;
  apiBaseUrl?: string;
  isEnabled: boolean;
  admitadCampaignId?: string;
  admitadWebsiteId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// For database row transformation
export interface ProductRow {
  id: string;
  title: string;
  description: string | null;
  price: number;
  old_price: number | null;
  currency: string;
  marketplace: string;
  original_url: string;
  affiliate_url: string | null;
  admitad_deeplink: string | null;
  admitad_campaign_id: string | null;
  admitad_offer_id: string | null;
  external_product_id: string | null;
  image_url: string | null;
  recipients: string[];
  budget: string;
  interests: string[];
  occasions: string[];
  gift_types: string[];
  wow_rating: number;
  risk_level: string;
  tags: string[];
  is_best_price: boolean;
  discount_percent: number | null;
  is_active: boolean;
  source_type: string;
  last_price_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateSourceRow {
  id: string;
  name: string;
  type: string;
  marketplace: string | null;
  base_url: string | null;
  api_base_url: string | null;
  is_enabled: boolean;
  admitad_campaign_id: string | null;
  admitad_website_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
