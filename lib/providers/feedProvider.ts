import type { Product, RiskLevel } from '@/types/product';
import type { ProductProvider, ProductSearchFilters } from './types';
import { normalizeFeedItem } from '@/lib/feedImport';

export class FeedProvider implements ProductProvider {
  id = 'feed';
  name = 'Product Feed';

  async searchProducts(_filters: ProductSearchFilters): Promise<Product[]> {
    return [];
  }

  async getProductPrice(_productId: string): Promise<number | null> {
    return null;
  }

  normalizeProduct(raw: unknown): Product {
    const normalized = normalizeFeedItem(raw as Record<string, any>);
    return {
      id: '',
      title: normalized.title || '',
      description: normalized.description,
      price: normalized.price || 0,
      oldPrice: normalized.oldPrice,
      currency: normalized.currency || 'RUB',
      marketplace: normalized.marketplace || 'other',
      originalUrl: normalized.originalUrl || '',
      affiliateUrl: normalized.affiliateUrl,
      externalProductId: normalized.externalProductId,
      imageUrl: normalized.imageUrl,
      recipients: [],
      budget: '',
      interests: [],
      occasions: [],
      giftTypes: [],
      tags: normalized.tags || [],
      wowRating: 7,
      riskLevel: 'low' as RiskLevel,
      isActive: true,
      status: 'active',
      sourceProvider: 'manual',
      sourceType: 'feed',
    };
  }
}
