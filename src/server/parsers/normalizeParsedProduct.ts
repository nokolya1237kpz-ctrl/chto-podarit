import { detectMarketplaceFromProductUrl } from '@/lib/epn';
import type { ImportProductInput } from '@features/product-import/lib/importProduct';

export function normalizeParsedProduct(parsed: any, source = 'parser'): ImportProductInput {
  return {
    title: parsed.title || parsed.name || 'Parsed product',
    description: parsed.description || '',
    imageUrl: parsed.imageUrl || parsed.image || '',
    price: Number(parsed.price || 0) || 0,
    oldPrice: parsed.oldPrice ? Number(parsed.oldPrice) : undefined,
    originalUrl: parsed.originalUrl || parsed.url || '',
    affiliateUrl: parsed.affiliateUrl || parsed.originalUrl || parsed.url || '',
    marketplace: parsed.marketplace || detectMarketplaceFromProductUrl(parsed.originalUrl || parsed.url),
    externalProductId: parsed.externalProductId || parsed.id || parsed.sku || parsed.url,
    sourceProvider: source as any,
    sourceType: source as any,
    tags: parsed.tags || [],
    currency: parsed.currency || 'RUB',
  };
}
