export type MarketplaceId =
  | 'ozon'
  | 'wildberries'
  | 'yandex_market'
  | 'aliexpress'
  | 'amazon'
  | 'dns_shop'
  | 'citilink'
  | 'megamarket'
  | 'mvideo'
  | 'eldorado'
  | 'other';

export type RiskLevel = 'low' | 'medium' | 'high';

export type SourceProvider =
  | 'manual'
  | 'epn'
  | 'admitad'
  | 'cityads'
  | 'aliexpress'
  | 'yandex_market'
  | 'ozon'
  | 'wildberries'
  | 'dns_shop'
  | 'citilink'
  | 'megamarket'
  | 'mvideo'
  | 'eldorado'
  | 'sadovod'
  | 'file_import'
  | 'search_api'
  | 'feed'
  | 'direct_api';

export type SourceType = SourceProvider | 'api' | 'mock' | 'feed' | 'parser';

export type ProductStatus = 'draft' | 'active' | 'archived';

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
  epnToken?: string;
  advertiserName?: string;
  externalProductId?: string;
  imageUrl?: string;
  recipients: string[];
  budget: string;
  interests: string[];
  occasions: string[];
  giftTypes: string[];
  tags: string[];
  wowRating: number;
  riskLevel: RiskLevel;
  isBestPrice?: boolean;
  discountPercent?: number;
  originalityScore?: number;
  professions?: string[];
  ageGroups?: string[];
  trendSource?: string;
  trendLabel?: string;
  trendScore?: number;
  isTrending?: boolean;
  trendVelocity?: number;
  isActive: boolean;
  status: ProductStatus;
  sourceProvider: SourceProvider;
  sourceType?: SourceType;
  lastSyncedAt?: string;
  lastPriceCheckedAt?: string;
  priceLastCheckedAt?: string;
  priceCheckStatus?: string;
  priceStale?: boolean;
  importStatus?: string;
  enrichmentStatus?: string;
  sourceFeedId?: string;
  parseErrors?: string[];
  deletedAt?: string;
  deletedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSource {
  id: string;
  providerId: SourceProvider;
  name: string;
  enabled: boolean;
  apiBaseUrl?: string;
  affiliateId?: string;
  campaignId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSourceWithStats extends ProductSource {
  productCount?: number;
  lastSyncAt?: string | null;
  syncStatus?: string | null;
  syncMessage?: string | null;
  syncedCount?: number | null;
  failedCount?: number | null;
  durationMs?: number | null;
}

export interface ProductSyncLog {
  id: string;
  providerId: SourceProvider;
  status: 'success' | 'warning' | 'error';
  message: string;
  syncedCount?: number | null;
  failedCount?: number | null;
  durationMs?: number | null;
  createdAt: string;
}

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
  epn_token: string | null;
  advertiser_name: string | null;
  external_product_id: string | null;
  image_url: string | null;
  recipients: string[];
  budget: string;
  interests: string[];
  occasions: string[];
  gift_types: string[];
  tags: string[];
  wow_rating: number;
  risk_level: string;
  is_best_price: boolean;
  discount_percent: number | null;
  originality_score?: number | null;
  professions?: string[] | null;
  age_groups?: string[] | null;
  trend_source?: string | null;
  trend_label?: string | null;
  trend_score?: number | null;
  is_active: boolean;
  status: string;
  source_provider: string;
  source_type: string | null;
  last_synced_at: string | null;
  last_price_checked_at: string | null;
  price_last_checked_at?: string | null;
  price_check_status?: string | null;
  price_stale?: boolean | null;
  import_status?: string | null;
  enrichment_status?: string | null;
  source_feed_id?: string | null;
  parse_errors?: string[] | null;
  deleted_at?: string | null;
  deleted_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSourceRow {
  id: string;
  provider_id: string;
  name: string;
  enabled: boolean;
  api_base_url: string | null;
  affiliate_id: string | null;
  campaign_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSyncLogRow {
  id: string;
  provider_id: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  synced_count: number | null;
  failed_count: number | null;
  duration_ms: number | null;
  created_at: string;
}
