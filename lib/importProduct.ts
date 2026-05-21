import type { Product } from '@/types/product';
import { applyAutoFillToProduct } from '@/lib/productAutoFill';
import { cleanupTitle, getDedupeKey, isPublishableProduct, normalizeMarketplace, normalizeProductUrl } from '@/lib/productNormalize';
import { upsertProductByExternalId, supabaseAdmin } from '@/lib/supabase';

export type ImportProductInput = Partial<Product> & {
  category?: string;
};

export async function importNormalizedProduct(input: ImportProductInput): Promise<Product | null> {
  const normalized = applyAutoFillToProduct({
    ...input,
    title: cleanupTitle(input.title),
    marketplace: normalizeMarketplace(String(input.marketplace || 'other')),
    originalUrl: normalizeProductUrl(input.originalUrl),
    affiliateUrl: normalizeProductUrl(input.affiliateUrl),
    currency: input.currency || 'RUB',
    price: Number(input.price || 0),
    oldPrice: input.oldPrice ? Number(input.oldPrice) : undefined,
    recipients: input.recipients || [],
    interests: input.interests || [],
    occasions: input.occasions || [],
    giftTypes: input.giftTypes || [],
    tags: input.tags || [],
    wowRating: input.wowRating || 7,
    riskLevel: input.riskLevel || 'low',
    sourceProvider: input.sourceProvider || 'manual',
    sourceType: input.sourceType || input.sourceProvider || 'manual',
    isBestPrice: input.isBestPrice || false,
    isActive: input.isActive ?? true,
    status: input.status || 'active',
    budget: input.budget || '',
  } as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);

  const publishable = isPublishableProduct(normalized);
  const product = {
    ...normalized,
    externalProductId: normalized.externalProductId || getDedupeKey(normalized),
    status: publishable ? normalized.status : 'draft',
    isActive: publishable ? normalized.isActive : false,
  } as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

  const saved = await upsertProductByExternalId(product);
  await recordPriceHistory(saved || product);
  return saved;
}

async function recordPriceHistory(product: Partial<Product>) {
  if (!supabaseAdmin || !product.id || !product.price) return;

  try {
    await supabaseAdmin.from('price_history').insert({
      product_id: product.id,
      current_price: product.price,
      old_price: product.oldPrice || null,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Price history write skipped:', error);
  }
}
