import { createClient } from '@supabase/supabase-js';
import type {
  Product,
  ProductRow,
  ProductSourceRow,
  ProductSourceWithStats,
  ProductSyncLog,
  ProductSyncLogRow,
} from '@/types/product';
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

function normalizeSourceProvider(value: string | null | undefined): Product['sourceProvider'] {
  return (value || 'manual') as Product['sourceProvider'];
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
    epnToken: row.epn_token || undefined,
    advertiserName: row.advertiser_name || undefined,
    externalProductId: row.external_product_id || undefined,
    imageUrl: row.image_url || undefined,
    recipients: row.recipients || [],
    budget: row.budget,
    interests: row.interests || [],
    occasions: row.occasions || [],
    giftTypes: row.gift_types || [],
    tags: row.tags || [],
    wowRating: row.wow_rating,
    riskLevel: row.risk_level as any,
    isBestPrice: row.is_best_price,
    discountPercent: row.discount_percent || undefined,
    isActive: row.is_active,
    status: (row.status === 'draft' ? 'draft' : 'active'),
    sourceProvider: normalizeSourceProvider(row.source_provider),
    sourceType: (row.source_type || normalizeSourceProvider(row.source_provider)) as Product['sourceType'],
    lastSyncedAt: row.last_synced_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActiveProducts(
  supabase = supabaseClient,
  options?: { throwOnError?: boolean }
): Promise<Product[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      if (options?.throwOnError) {
        throw error;
      }
      return [];
    }

    return (data as ProductRow[]).map(rowToProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    if (options?.throwOnError) {
      throw error;
    }
    return [];
  }
}

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

export async function searchProducts(
  filters: {
    query?: string;
    marketplace?: string;
    sourceProvider?: string;
    status?: string;
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

    if (filters.sourceProvider) {
      query = query.eq('source_provider', filters.sourceProvider);
    }

    if (typeof filters.isActive === 'boolean') {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
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

export async function createProduct(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  supabase = supabaseAdmin
): Promise<Product | null> {
  if (!supabase) return null;

  const sourceProvider = product.sourceProvider || product.sourceType || 'manual';

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
        epn_token: product.epnToken,
        advertiser_name: product.advertiserName,
        external_product_id: product.externalProductId,
        image_url: product.imageUrl,
        recipients: product.recipients,
        budget: product.budget,
        interests: product.interests,
        occasions: product.occasions,
        gift_types: product.giftTypes,
        tags: product.tags,
        wow_rating: product.wowRating,
        risk_level: product.riskLevel,
        is_best_price: product.isBestPrice,
        discount_percent: product.discountPercent,
        is_active: product.isActive,
        status: product.status || 'active',
        source_provider: sourceProvider,
        source_type: product.sourceType || sourceProvider,
        last_synced_at: product.lastSyncedAt,
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

export async function upsertProductByExternalId(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  supabase = supabaseAdmin
): Promise<Product | null> {
  if (!supabase) return null;

  if (!product.externalProductId || !product.sourceProvider) {
    return createProduct(product, supabase);
  }

  try {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('external_product_id', product.externalProductId)
      .eq('source_provider', product.sourceProvider)
      .maybeSingle();

    if (existing?.id) {
      return updateProduct(existing.id, product, supabase);
    }

    return createProduct(product, supabase);
  } catch (error) {
    console.error('Error upserting product:', error);
    return null;
  }
}

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
        ...(updates.epnToken !== undefined && { epn_token: updates.epnToken }),
        ...(updates.advertiserName !== undefined && {
          advertiser_name: updates.advertiserName,
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
        ...(updates.tags !== undefined && { tags: updates.tags }),
        ...(updates.wowRating !== undefined && {
          wow_rating: updates.wowRating,
        }),
        ...(updates.riskLevel !== undefined && {
          risk_level: updates.riskLevel,
        }),
        ...(updates.isBestPrice !== undefined && {
          is_best_price: updates.isBestPrice,
        }),
        ...(updates.discountPercent !== undefined && {
          discount_percent: updates.discountPercent,
        }),
        ...(updates.isActive !== undefined && { is_active: updates.isActive }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.sourceProvider !== undefined && {
          source_provider: updates.sourceProvider,
        }),
        ...(updates.sourceType !== undefined && {
          source_type: updates.sourceType,
        }),
        ...(updates.lastSyncedAt !== undefined && {
          last_synced_at: updates.lastSyncedAt,
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

export async function getProductSources(
  supabase = supabaseAdmin
): Promise<ProductSourceRow[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('product_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching product sources:', error);
      return [];
    }

    return (data as ProductSourceRow[]) || [];
  } catch (error) {
    console.error('Error fetching product sources:', error);
    return [];
  }
}

export async function getProductSourcesWithStats(
  supabase = supabaseAdmin
): Promise<ProductSourceWithStats[]> {
  if (!supabase) return [];

  const sources = await getProductSources(supabase);
  return Promise.all(
    sources.map(async (source) => {
      const [{ count } = { count: 0 }, { data: lastLog }] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('source_provider', source.provider_id),
        supabase
          .from('product_sync_logs')
          .select('*')
          .eq('provider_id', source.provider_id)
          .order('created_at', { ascending: false })
          .limit(1),
      ] as any);

      const latest = Array.isArray(lastLog) && lastLog.length > 0 ? lastLog[0] : null;

      return {
        id: source.id,
        providerId: source.provider_id as any,
        name: source.name,
        enabled: source.enabled,
        apiBaseUrl: source.api_base_url || undefined,
        affiliateId: source.affiliate_id || undefined,
        campaignId: source.campaign_id || undefined,
        notes: source.notes || undefined,
        createdAt: source.created_at,
        updatedAt: source.updated_at,
        productCount: typeof count === 'number' ? count : 0,
        lastSyncAt: latest?.created_at || null,
        syncStatus: latest?.status || null,
        syncMessage: latest?.message || null,
        syncedCount: latest?.synced_count ?? null,
        failedCount: latest?.failed_count ?? null,
        durationMs: latest?.duration_ms ?? null,
      };
    })
  );
}

export async function getProductSyncLogs(
  supabase = supabaseAdmin
): Promise<ProductSyncLog[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('product_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching sync logs:', error);
      return [];
    }

    return (data as ProductSyncLogRow[]).map((row) => ({
      id: row.id,
      providerId: row.provider_id as any,
      status: row.status,
      message: row.message,
      syncedCount: row.synced_count,
      failedCount: row.failed_count,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return [];
  }
}

export async function updateProductSource(
  id: string,
  updates: Partial<Omit<ProductSourceRow, 'id' | 'created_at' | 'updated_at'>>,
  supabase = supabaseAdmin
): Promise<ProductSourceRow | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('product_sources')
      .update({
        ...(updates.provider_id !== undefined && { provider_id: updates.provider_id }),
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        ...(updates.api_base_url !== undefined && { api_base_url: updates.api_base_url }),
        ...(updates.affiliate_id !== undefined && { affiliate_id: updates.affiliate_id }),
        ...(updates.campaign_id !== undefined && { campaign_id: updates.campaign_id }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product source:', error);
      return null;
    }

    return data as ProductSourceRow;
  } catch (error) {
    console.error('Error updating product source:', error);
    return null;
  }
}

export async function createProductSource(
  source: Omit<ProductSourceRow, 'id' | 'created_at' | 'updated_at'>,
  supabase = supabaseAdmin
): Promise<ProductSourceRow | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('product_sources')
      .insert({
        provider_id: source.provider_id,
        name: source.name,
        enabled: source.enabled,
        api_base_url: source.api_base_url,
        affiliate_id: source.affiliate_id,
        campaign_id: source.campaign_id,
        notes: source.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product source:', error);
      return null;
    }

    return data as ProductSourceRow;
  } catch (error) {
    console.error('Error creating product source:', error);
    return null;
  }
}

export async function logProductSync(
  providerId: string,
  status: 'success' | 'warning' | 'error',
  message: string,
  syncedCount?: number | null,
  failedCount?: number | null,
  durationMs?: number | null,
  supabase = supabaseAdmin
): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from('product_sync_logs').insert({
      provider_id: providerId,
      status,
      message,
      synced_count: syncedCount,
      failed_count: failedCount,
      duration_ms: durationMs,
    });
  } catch (error) {
    console.error('Error logging sync event:', error);
  }
}
