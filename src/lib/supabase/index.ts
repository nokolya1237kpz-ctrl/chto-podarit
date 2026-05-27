import { createClient } from '@supabase/supabase-js';
import type {
  Product,
  ProductRow,
  ProductSourceRow,
  ProductSourceWithStats,
  ProductSyncLog,
  ProductSyncLogRow,
} from '@entities/product/types';
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

function isMissingDeletedAtColumn(error: any) {
  const text = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
  return Boolean(text.includes('deleted_at') && (error?.code === '42703' || error?.code === 'PGRST204' || text));
}

export type ProductSaveError = {
  operation: 'insert' | 'update';
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  missingColumns?: string[];
  payload: Record<string, any>;
};

function compactPayload(payload: Record<string, any>) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function findMissingColumns(error: any) {
  const text = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
  const patterns = [
    /Could not find the ['"]([a-z_]+)['"] column/gi,
    /column ['"]([a-z_]+)['"]/gi,
    /['"]([a-z_]+)['"] column/gi,
  ];
  const matches = patterns.flatMap((pattern) =>
    Array.from(text.matchAll(pattern)).map((match) => match[1]).filter(Boolean)
  );
  return Array.from(new Set(matches));
}

function serializeProductSaveError(
  operation: ProductSaveError['operation'],
  error: any,
  payload: Record<string, any>,
  missingColumns: string[] = []
): ProductSaveError {
  return {
    operation,
    message: error?.message || String(error),
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    missingColumns: Array.from(new Set([...missingColumns, ...findMissingColumns(error)])),
    payload,
  };
}

async function writeProductWithMissingColumnRetry<T>(
  operation: ProductSaveError['operation'],
  initialPayload: Record<string, any>,
  write: (payload: Record<string, any>) => Promise<{ data: T | null; error: any }>
) {
  const payload = { ...initialPayload };
  const missingColumns: string[] = [];

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await write(payload);
    if (!error) return { data, error: null, payload, missingColumns };

    const removableColumns = findMissingColumns(error).filter((column) => column in payload);
    if (removableColumns.length > 0) {
      for (const column of removableColumns) {
        delete payload[column];
        missingColumns.push(column);
      }
      continue;
    }

    return {
      data: null,
      error: serializeProductSaveError(operation, error, payload, missingColumns),
      payload,
      missingColumns,
    };
  }

  return {
    data: null,
    error: {
      operation,
      message: 'Supabase write failed after removing unsupported columns',
      missingColumns,
      payload,
    } satisfies ProductSaveError,
    payload,
    missingColumns,
  };
}

export function mapProductToSupabaseInsert(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const sourceProvider = product.sourceProvider || product.sourceType || 'manual';
  const originalUrl = product.originalUrl || product.affiliateUrl || '';

  return compactPayload({
    title: product.title,
    description: product.description || '',
    price: Number(product.price || 0),
    old_price: product.oldPrice ?? null,
    currency: product.currency || 'RUB',
    marketplace: product.marketplace || 'other',
    original_url: originalUrl,
    affiliate_url: product.affiliateUrl || null,
    admitad_deeplink: product.admitadDeeplink || null,
    admitad_campaign_id: product.admitadCampaignId || null,
    admitad_offer_id: product.admitadOfferId || null,
    epn_token: product.epnToken || null,
    advertiser_name: product.advertiserName || null,
    external_product_id: product.externalProductId || null,
    image_url: product.imageUrl || null,
    recipients: product.recipients || [],
    budget: product.budget || '',
    interests: product.interests || [],
    occasions: product.occasions || [],
    gift_types: product.giftTypes || [],
    tags: product.tags || [],
    wow_rating: product.wowRating || 7,
    risk_level: product.riskLevel || 'low',
    is_best_price: product.isBestPrice || false,
    discount_percent: product.discountPercent ?? null,
    is_active: product.isActive ?? true,
    status: product.status || 'active',
    source_provider: sourceProvider,
    source_type: product.sourceType || sourceProvider,
    last_synced_at: product.lastSyncedAt || null,
  });
}

function mapProductToSupabaseUpdate(
  updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const sourceProvider = updates.sourceProvider || updates.sourceType;
  return compactPayload({
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.description !== undefined && { description: updates.description || '' }),
    ...(updates.price !== undefined && { price: Number(updates.price || 0) }),
    ...(updates.oldPrice !== undefined && { old_price: updates.oldPrice ?? null }),
    ...(updates.currency !== undefined && { currency: updates.currency || 'RUB' }),
    ...(updates.marketplace !== undefined && { marketplace: updates.marketplace || 'other' }),
    ...(updates.originalUrl !== undefined && { original_url: updates.originalUrl || updates.affiliateUrl || '' }),
    ...(updates.affiliateUrl !== undefined && { affiliate_url: updates.affiliateUrl || null }),
    ...(updates.admitadDeeplink !== undefined && { admitad_deeplink: updates.admitadDeeplink || null }),
    ...(updates.admitadCampaignId !== undefined && { admitad_campaign_id: updates.admitadCampaignId || null }),
    ...(updates.admitadOfferId !== undefined && { admitad_offer_id: updates.admitadOfferId || null }),
    ...(updates.epnToken !== undefined && { epn_token: updates.epnToken || null }),
    ...(updates.advertiserName !== undefined && { advertiser_name: updates.advertiserName || null }),
    ...(updates.externalProductId !== undefined && { external_product_id: updates.externalProductId || null }),
    ...(updates.imageUrl !== undefined && { image_url: updates.imageUrl || null }),
    ...(updates.recipients !== undefined && { recipients: updates.recipients || [] }),
    ...(updates.budget !== undefined && { budget: updates.budget || '' }),
    ...(updates.interests !== undefined && { interests: updates.interests || [] }),
    ...(updates.occasions !== undefined && { occasions: updates.occasions || [] }),
    ...(updates.giftTypes !== undefined && { gift_types: updates.giftTypes || [] }),
    ...(updates.tags !== undefined && { tags: updates.tags || [] }),
    ...(updates.wowRating !== undefined && { wow_rating: updates.wowRating || 7 }),
    ...(updates.riskLevel !== undefined && { risk_level: updates.riskLevel || 'low' }),
    ...(updates.isBestPrice !== undefined && { is_best_price: updates.isBestPrice || false }),
    ...(updates.discountPercent !== undefined && { discount_percent: updates.discountPercent ?? null }),
    ...(updates.isActive !== undefined && { is_active: updates.isActive }),
    ...(updates.status !== undefined && { status: updates.status || 'active' }),
    ...(sourceProvider !== undefined && { source_provider: sourceProvider }),
    ...(updates.sourceType !== undefined && { source_type: updates.sourceType || sourceProvider }),
    ...(updates.lastSyncedAt !== undefined && { last_synced_at: updates.lastSyncedAt || null }),
  });
}

async function createProductDetailed(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  supabase = supabaseAdmin
): Promise<{ product: Product | null; error: ProductSaveError | null }> {
  if (!supabase) {
    return {
      product: null,
      error: {
        operation: 'insert',
        message: 'Supabase service client is not configured',
        payload: mapProductToSupabaseInsert(product),
      },
    };
  }

  const payload = mapProductToSupabaseInsert(product);
  const { data, error } = await writeProductWithMissingColumnRetry('insert', payload, async (nextPayload) => {
    const result = await supabase
      .from('products')
      .insert(nextPayload)
      .select()
      .single();
    return { data: result.data, error: result.error };
  });

  if (error) {
    return { product: null, error };
  }

  return { product: rowToProduct(data as ProductRow), error: null };
}

async function updateProductDetailed(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>,
  supabase = supabaseAdmin
): Promise<{ product: Product | null; error: ProductSaveError | null }> {
  if (!supabase) {
    return {
      product: null,
      error: {
        operation: 'update',
        message: 'Supabase service client is not configured',
        payload: mapProductToSupabaseUpdate(updates),
      },
    };
  }

  const payload = mapProductToSupabaseUpdate(updates);
  const { data, error } = await writeProductWithMissingColumnRetry('update', payload, async (nextPayload) => {
    const result = await supabase
      .from('products')
      .update(nextPayload)
      .eq('id', id)
      .select()
      .single();
    return { data: result.data, error: result.error };
  });

  if (error) {
    return { product: null, error };
  }

  return { product: rowToProduct(data as ProductRow), error: null };
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
    originalityScore: row.originality_score || undefined,
    professions: row.professions || undefined,
    ageGroups: row.age_groups || undefined,
    trendSource: row.trend_source || undefined,
    trendLabel: row.trend_label || undefined,
    trendScore: row.trend_score || undefined,
    isActive: row.is_active,
    status: (row.status === 'draft' || row.status === 'archived' ? row.status : 'active'),
    sourceProvider: normalizeSourceProvider(row.source_provider),
    sourceType: (row.source_type || normalizeSourceProvider(row.source_provider)) as Product['sourceType'],
    lastSyncedAt: row.last_synced_at || undefined,
    lastPriceCheckedAt: row.last_price_checked_at || undefined,
    priceLastCheckedAt: row.price_last_checked_at || row.last_price_checked_at || undefined,
    priceCheckStatus: row.price_check_status || undefined,
    priceStale: row.price_stale || undefined,
    importStatus: row.import_status || undefined,
    enrichmentStatus: row.enrichment_status || undefined,
    sourceFeedId: row.source_feed_id || undefined,
    parseErrors: row.parse_errors || undefined,
    deletedAt: row.deleted_at || undefined,
    deletedReason: row.deleted_reason || undefined,
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
    let request = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    let { data, error } = await request.is('deleted_at', null);
    if (isMissingDeletedAtColumn(error)) {
      ({ data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false }));
    }

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
    includeArchived?: boolean;
  },
  supabase = supabaseAdmin
): Promise<Product[]> {
  if (!supabase) return [];

  try {
    const buildQuery = (withDeletedFilter: boolean) => {
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
      } else if (!filters.includeArchived) {
        query = query.neq('status', 'archived');
      }

      if (withDeletedFilter && !filters.includeArchived) {
        query = query.is('deleted_at', null);
      }

      if (filters.query) {
        query = query.ilike('title', `%${filters.query}%`);
      }

      return query;
    };

    let { data, error } = await buildQuery(true).order('created_at', {
      ascending: false,
    });
    if (isMissingDeletedAtColumn(error)) {
      ({ data, error } = await buildQuery(false).order('created_at', {
        ascending: false,
      }));
    }

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
  try {
    const result = await createProductDetailed(product, supabase);
    if (result.error) console.error('Error creating product:', result.error);
    return result.product;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

export async function upsertProductByExternalId(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  supabase = supabaseAdmin
): Promise<Product | null> {
  const result = await upsertProductWithDedupe(product, supabase);
  return result.product;
}

export type ProductDedupeReason =
  | 'created_new'
  | 'updated_existing'
  | 'soft_deleted'
  | 'same_external_id'
  | 'same_product_url'
  | 'same_title_price_image'
  | 'not_saved'
  | 'supabase_not_configured';

export type ProductUpsertDedupeResult = {
  product: Product | null;
  action: 'created' | 'updated' | 'skipped';
  reason: ProductDedupeReason;
  saveError?: ProductSaveError | null;
  matchedBy?: 'source_external_id' | 'marketplace_external_id' | 'product_url' | 'title_price_image';
  duplicateMatch?: {
    matchedBy?: string;
    existingId?: string;
    existingTitle?: string;
    existingExternalProductId?: string | null;
    existingProductUrl?: string | null;
    existingDeletedAt?: string | null;
    existingStatus?: string | null;
    existingSourceProvider?: string | null;
  } | null;
};

export async function upsertProductWithDedupe(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  supabase = supabaseAdmin
): Promise<ProductUpsertDedupeResult> {
  if (!supabase) {
    return {
      product: null,
      action: 'skipped',
      reason: 'supabase_not_configured',
      duplicateMatch: null,
    };
  }

  try {
    const normalizedUrl = product.originalUrl || product.affiliateUrl || '';
    let existing: any = null;
    let existingError: any = null;
    let matchedBy: ProductUpsertDedupeResult['matchedBy'] | undefined;
    const selectFields = 'id, title, external_product_id, original_url, affiliate_url, deleted_at, deleted_reason, status, source_provider';

    if (product.externalProductId && product.sourceProvider) {
      const result = await supabase
        .from('products')
        .select(selectFields)
        .eq('external_product_id', product.externalProductId)
        .eq('source_provider', product.sourceProvider)
        .maybeSingle();
      existing = result.data;
      existingError = result.error;
      if (existing) matchedBy = 'source_external_id';
    }

    if (!existing && product.externalProductId && product.marketplace) {
      const result = await supabase
        .from('products')
        .select(selectFields)
        .eq('external_product_id', product.externalProductId)
        .eq('marketplace', product.marketplace)
        .maybeSingle();
      existing = result.data;
      existingError = result.error || existingError;
      if (existing) matchedBy = 'marketplace_external_id';
    }

    if (!existing && normalizedUrl) {
      const byUrl = await supabase
        .from('products')
        .select(selectFields)
        .or(`original_url.eq.${normalizedUrl},affiliate_url.eq.${normalizedUrl}`)
        .maybeSingle();
      existing = byUrl.data;
      existingError = byUrl.error || existingError;
      if (existing) matchedBy = 'product_url';
    }

    if (!existing && product.title && product.price && product.imageUrl) {
      const byTitlePriceImage = await supabase
        .from('products')
        .select(selectFields)
        .eq('title', product.title)
        .eq('price', product.price)
        .eq('image_url', product.imageUrl)
        .maybeSingle();
      existing = byTitlePriceImage.data;
      existingError = byTitlePriceImage.error || existingError;
      if (existing) matchedBy = 'title_price_image';
    }

    if (isMissingDeletedAtColumn(existingError)) {
      const fallback = await supabase
        .from('products')
        .select('id')
        .eq('external_product_id', product.externalProductId || '')
        .eq('source_provider', product.sourceProvider || '')
        .maybeSingle();
      existing = fallback.data as any;
      existingError = fallback.error;
      if (existing) matchedBy = 'source_external_id';
    }

    if (existing?.id) {
      const reasonByMatch: Record<string, ProductDedupeReason> = {
        source_external_id: 'same_external_id',
        marketplace_external_id: 'same_external_id',
        product_url: 'same_product_url',
        title_price_image: 'same_title_price_image',
      };
      const duplicateMatch = {
        matchedBy,
        existingId: existing.id,
        existingTitle: existing.title,
        existingExternalProductId: existing.external_product_id,
        existingProductUrl: existing.original_url || existing.affiliate_url,
        existingDeletedAt: existing.deleted_at,
        existingStatus: existing.status,
        existingSourceProvider: existing.source_provider,
      };
      if ((existing as any).deleted_at) {
        console.warn('Import skipped because matching product is soft-deleted:', product.externalProductId);
        return {
          product: null,
          action: 'skipped',
          reason: 'soft_deleted',
          matchedBy,
          duplicateMatch,
        };
      }
      const updateResult = await updateProductDetailed(existing.id, product, supabase);
      return {
        product: updateResult.product,
        action: updateResult.product ? 'updated' : 'skipped',
        reason: updateResult.product ? 'updated_existing' : 'not_saved',
        saveError: updateResult.error,
        matchedBy,
        duplicateMatch,
      };
    }

    const createResult = await createProductDetailed(product, supabase);
    return {
      product: createResult.product,
      action: createResult.product ? 'created' : 'skipped',
      reason: createResult.product ? 'created_new' : 'not_saved',
      saveError: createResult.error,
      duplicateMatch: null,
    };
  } catch (error) {
    console.error('Error upserting product:', error);
    return {
      product: null,
      action: 'skipped',
      reason: 'not_saved',
      duplicateMatch: null,
    };
  }
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>,
  supabase = supabaseAdmin
): Promise<Product | null> {
  try {
    const result = await updateProductDetailed(id, updates, supabase);
    if (result.error) console.error('Error updating product:', result.error);
    return result.product;
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

async function deleteRelatedProductData(id: string, supabase: typeof supabaseAdmin) {
  if (!supabase) return;
  for (const table of ['price_history', 'product_clicks', 'price_search_results', 'trend_snapshots']) {
    try {
      await supabase.from(table).delete().eq('product_id', id);
    } catch {
      // Optional tables may not exist.
    }
  }
}

export async function deleteProduct(
  id: string,
  options: { force?: boolean; reason?: string } = {},
  supabase = supabaseAdmin
): Promise<boolean> {
  if (!supabase) return false;

  try {
    if (options.force) {
      await deleteRelatedProductData(id, supabase);
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Error hard deleting product:', error);
        return false;
      }
      return true;
    }

    let { error } = await supabase
      .from('products')
      .update({
        status: 'archived',
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_reason: options.reason || 'admin_delete',
      })
      .eq('id', id);

    if (isMissingDeletedAtColumn(error)) {
      ({ error } = await supabase
        .from('products')
        .update({
          status: 'archived',
          is_active: false,
        })
        .eq('id', id));
    }

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
