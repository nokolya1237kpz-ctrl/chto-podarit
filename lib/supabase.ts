import { createClient } from '@supabase/supabase-js';
import type { Product, ProductRow, AffiliateSourceRow } from '@/types/product';
import { normalizeAffiliateProduct } from '@/lib/affiliate';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side Supabase (anonymous, safe for browser)
export const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side Supabase (with service role, for admin operations)
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Transform database row to Product
 */
function rowToProduct(row: ProductRow): Product {
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
    admitadDeeplink: row.admitad_deeplink || undefined,
    admitadCampaignId: row.admitad_campaign_id || undefined,
    admitadOfferId: row.admitad_offer_id || undefined,
    externalProductId: row.external_product_id || undefined,
    imageUrl: row.image_url || undefined,
    recipients: row.recipients || [],
    budget: row.budget,
    interests: row.interests || [],
    occasions: row.occasions || [],
    giftTypes: row.gift_types || [],
    wowRating: row.wow_rating,
    riskLevel: row.risk_level as any,
    tags: row.tags || [],
    isBestPrice: row.is_best_price,
    discountPercent: row.discount_percent || undefined,
    isActive: row.is_active,
    sourceType: row.source_type as any,
    lastPriceCheckedAt: row.last_price_checked_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all active products from Supabase
 */
export async function getActiveProducts(
  supabase = supabaseClient
): Promise<Product[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return (data as ProductRow[]).map(rowToProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(
  id: string,
  supabase = supabaseClient
): Promise<Product | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return rowToProduct(data as ProductRow);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Search products (admin)
 */
export async function searchProducts(
  filters: {
    query?: string;
    marketplace?: string;
    sourceType?: string;
    isActive?: boolean;
  },
  supabase = supabaseAdmin
): Promise<Product[]> {
  if (!supabase) return [];

  try {
    let query = supabase.from('products').select('*');

    if (filters.marketplace) {
      query = query.eq('marketplace', filters.marketplace);
    }

    if (filters.sourceType) {
      query = query.eq('source_type', filters.sourceType);
    }

    if (typeof filters.isActive === 'boolean') {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.query) {
      query = query.ilike('title', `%${filters.query}%`);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error searching products:', error);
      return [];
    }

    return (data as ProductRow[]).map(rowToProduct);
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

/**
 * Create product (admin)
 */
export async function createProduct(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  supabase = supabaseAdmin
): Promise<Product | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        title: product.title,
        description: product.description,
        price: product.price,
        old_price: product.oldPrice,
        currency: product.currency,
        marketplace: product.marketplace,
        original_url: product.originalUrl,
        affiliate_url: product.affiliateUrl,
        admitad_deeplink: product.admitadDeeplink,
        admitad_campaign_id: product.admitadCampaignId,
        admitad_offer_id: product.admitadOfferId,
        external_product_id: product.externalProductId,
        image_url: product.imageUrl,
        recipients: product.recipients,
        budget: product.budget,
        interests: product.interests,
        occasions: product.occasions,
        gift_types: product.giftTypes,
        wow_rating: product.wowRating,
        risk_level: product.riskLevel,
        tags: product.tags,
        is_best_price: product.isBestPrice,
        discount_percent: product.discountPercent,
        is_active: product.isActive,
        source_type: product.sourceType,
        last_price_checked_at: product.lastPriceCheckedAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return null;
    }

    return rowToProduct(data as ProductRow);
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

/**
 * Update product (admin)
 */
export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>,
  supabase = supabaseAdmin
): Promise<Product | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && {
          description: updates.description,
        }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.oldPrice !== undefined && { old_price: updates.oldPrice }),
        ...(updates.currency !== undefined && { currency: updates.currency }),
        ...(updates.marketplace !== undefined && {
          marketplace: updates.marketplace,
        }),
        ...(updates.originalUrl !== undefined && {
          original_url: updates.originalUrl,
        }),
        ...(updates.affiliateUrl !== undefined && {
          affiliate_url: updates.affiliateUrl,
        }),
        ...(updates.admitadDeeplink !== undefined && {
          admitad_deeplink: updates.admitadDeeplink,
        }),
        ...(updates.admitadCampaignId !== undefined && {
          admitad_campaign_id: updates.admitadCampaignId,
        }),
        ...(updates.admitadOfferId !== undefined && {
          admitad_offer_id: updates.admitadOfferId,
        }),
        ...(updates.externalProductId !== undefined && {
          external_product_id: updates.externalProductId,
        }),
        ...(updates.imageUrl !== undefined && { image_url: updates.imageUrl }),
        ...(updates.recipients !== undefined && {
          recipients: updates.recipients,
        }),
        ...(updates.budget !== undefined && { budget: updates.budget }),
        ...(updates.interests !== undefined && { interests: updates.interests }),
        ...(updates.occasions !== undefined && { occasions: updates.occasions }),
        ...(updates.giftTypes !== undefined && {
          gift_types: updates.giftTypes,
        }),
        ...(updates.wowRating !== undefined && {
          wow_rating: updates.wowRating,
        }),
        ...(updates.riskLevel !== undefined && {
          risk_level: updates.riskLevel,
        }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
        ...(updates.isBestPrice !== undefined && {
          is_best_price: updates.isBestPrice,
        }),
        ...(updates.discountPercent !== undefined && {
          discount_percent: updates.discountPercent,
        }),
        ...(updates.isActive !== undefined && { is_active: updates.isActive }),
        ...(updates.sourceType !== undefined && {
          source_type: updates.sourceType,
        }),
        ...(updates.lastPriceCheckedAt !== undefined && {
          last_price_checked_at: updates.lastPriceCheckedAt,
        }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return null;
    }

    return rowToProduct(data as ProductRow);
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

/**
 * Soft delete product (set is_active to false)
 */
export async function deleteProduct(
  id: string,
  supabase = supabaseAdmin
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

/**
 * Get all affiliate sources
 */
export async function getAffiliateSources(
  supabase = supabaseAdmin
): Promise<any[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('affiliate_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching affiliate sources:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching affiliate sources:', error);
    return [];
  }
}
