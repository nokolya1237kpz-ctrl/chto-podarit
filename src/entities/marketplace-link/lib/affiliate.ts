import type { Product } from '@entities/product/types';

/**
 * Get the final URL for a product, preferring affiliate links
 * Priority: affiliateUrl > admitadDeeplink > originalUrl
 */
export function getProductFinalUrl(product: Product): string {
  if (product.affiliateUrl) {
    return product.affiliateUrl;
  }
  if (product.admitadDeeplink) {
    return product.admitadDeeplink;
  }
  return product.originalUrl || '';
}

/**
 * Build an Admitad deeplink
 * TODO: Implement actual Admitad deeplink construction when API is available
 */
export function buildAdmitadDeeplink(
  originalUrl: string,
  campaignId?: string,
  websiteId?: string
): string {
  // Placeholder implementation - will be replaced with real Admitad API calls
  if (!campaignId || !websiteId) {
    return originalUrl;
  }
  
  // This is a placeholder format
  // Real implementation will use Admitad API: https://api.admitad.com/deeplink/
  return originalUrl;
}

/**
 * Normalize a product from various sources to our Product interface
 */
export function normalizeAffiliateProduct(raw: any): Product {
  return {
    id: raw.id || '',
    title: raw.title || '',
    description: raw.description,
    price: typeof raw.price === 'number' ? raw.price : 0,
    oldPrice: raw.oldPrice || raw.old_price,
    currency: raw.currency || 'RUB',
    marketplace: raw.marketplace || 'other',
    originalUrl: raw.originalUrl || raw.original_url || '',
    affiliateUrl: raw.affiliateUrl || raw.affiliate_url,
    admitadDeeplink: raw.admitadDeeplink || raw.admitad_deeplink,
    admitadCampaignId: raw.admitadCampaignId || raw.admitad_campaign_id,
    admitadOfferId: raw.admitadOfferId || raw.admitad_offer_id,
    externalProductId: raw.externalProductId || raw.external_product_id,
    imageUrl: raw.imageUrl || raw.image_url,
    recipients: Array.isArray(raw.recipients) ? raw.recipients : [],
    budget: raw.budget || '',
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    occasions: Array.isArray(raw.occasions) ? raw.occasions : [],
    giftTypes: Array.isArray(raw.giftTypes) ? raw.giftTypes : raw.gift_types || [],
    wowRating: typeof raw.wowRating === 'number' ? raw.wowRating : (raw.wow_rating || 7),
    riskLevel: raw.riskLevel || raw.risk_level || 'medium',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    isBestPrice: raw.isBestPrice || raw.is_best_price || false,
    discountPercent: raw.discountPercent || raw.discount_percent,
    isActive: raw.isActive !== false && raw.is_active !== false,
    status: raw.status || 'draft',
    sourceProvider: raw.sourceProvider || raw.source_provider || 'manual',
    sourceType: raw.sourceType || raw.source_type || 'manual',
    lastSyncedAt: raw.lastSyncedAt || raw.last_synced_at,
    lastPriceCheckedAt: raw.lastPriceCheckedAt || raw.last_price_checked_at,
    createdAt: raw.createdAt || raw.created_at,
    updatedAt: raw.updatedAt || raw.updated_at,
  };
}

/**
 * Check if a product has any affiliate URL configured
 */
export function hasAffiliateUrl(product: Product): boolean {
  return !!(product.affiliateUrl || product.admitadDeeplink);
}
