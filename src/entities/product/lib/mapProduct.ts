import type { Product, ProductRow } from '../types';

export function mapProduct(input: Product | ProductRow | Record<string, unknown>) {
  return input;
}

export function mapProductRow(row: ProductRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    price: row.price,
    oldPrice: row.old_price || undefined,
    currency: row.currency,
    marketplace: row.marketplace,
    originalUrl: row.original_url,
    affiliateUrl: row.affiliate_url || undefined,
    imageUrl: row.image_url || undefined,
    recipients: row.recipients || [],
    budget: row.budget,
    interests: row.interests || [],
    occasions: row.occasions || [],
    giftTypes: row.gift_types || [],
    tags: row.tags || [],
    wowRating: row.wow_rating,
    riskLevel: row.risk_level,
    isActive: row.is_active,
    status: row.status,
    sourceProvider: row.source_provider,
    sourceType: row.source_type || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
