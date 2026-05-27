import type { Product } from '@entities/product/types';
import { applyAutoFillToProduct } from '@entities/product/lib/productAutoFill';
import { cleanupTitle, getDedupeKey, isPublishableProduct, normalizeMarketplace, normalizeProductUrl } from '@entities/product/lib/productNormalize';
import { upsertProductByExternalId, supabaseAdmin } from '@lib/supabase';
import { browserParser } from '@server/parsers/browserParser';

export type ImportProductInput = Partial<Product> & {
  category?: string;
};

async function enrichProduct(input: ImportProductInput) {
  const needsEnrichment = Boolean(input.originalUrl && (!input.imageUrl || !input.description || !Number(input.price || 0)));
  if (!needsEnrichment) return { input, enriched: false, errors: [] as string[] };
  try {
    const parsed = await browserParser(input.originalUrl as string, { allowAnyPublicDomain: true });
    return {
      input: {
        ...input,
        title: input.title || parsed.title,
        description: input.description || parsed.description,
        imageUrl: input.imageUrl || parsed.imageUrl,
        price: Number(input.price || 0) || parsed.price,
        currency: input.currency || parsed.currency,
        originalUrl: input.originalUrl || parsed.originalUrl,
      },
      enriched: true,
      errors: [] as string[],
    };
  } catch (error) {
    return { input, enriched: false, errors: [error instanceof Error ? error.message : String(error)] };
  }
}

export async function importNormalizedProduct(input: ImportProductInput): Promise<Product | null> {
  const enrichment = await enrichProduct(input);
  input = enrichment.input;
  const cleanedTitle = cleanupTitle(input.title);
  if (!cleanedTitle) return null;

  const normalized = applyAutoFillToProduct({
    ...input,
    title: cleanedTitle,
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
    priceLastCheckedAt: input.priceLastCheckedAt || new Date().toISOString(),
    priceCheckStatus: input.priceCheckStatus || 'fresh',
    priceStale: input.priceStale || false,
    importStatus: input.importStatus || 'imported',
    enrichmentStatus: enrichment.enriched ? 'enriched' : enrichment.errors.length ? 'failed' : 'not_needed',
    sourceFeedId: input.sourceFeedId,
    parseErrors: [...(input.parseErrors || []), ...enrichment.errors],
  } as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);

  const publishable = isPublishableProduct(normalized);
  const product = {
    ...normalized,
    externalProductId: normalized.externalProductId || getDedupeKey(normalized),
    status: publishable ? normalized.status : 'draft',
    isActive: publishable ? normalized.isActive : false,
    importStatus: publishable ? 'active_ready' : 'draft_incomplete',
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
