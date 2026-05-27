import type { Product, RiskLevel } from '@entities/product/types';
import type { ProductProvider, ProductSearchFilters } from './types';
import { browserParser } from '@server/parsers/browserParser';
import { normalizeParsedProduct } from '@server/parsers/normalizeParsedProduct';

export class ParserProvider implements ProductProvider {
  id = 'parser';
  name = 'Controlled Parser';

  async searchProducts(_filters: ProductSearchFilters): Promise<Product[]> {
    return [];
  }

  async getProductPrice(_productId: string): Promise<number | null> {
    return null;
  }

  async import(url: unknown): Promise<Product | null> {
    if (typeof url !== 'string') return null;
    const parsed = normalizeParsedProduct(await browserParser(url), 'manual');
    return this.normalizeProduct(parsed);
  }

  normalizeProduct(raw: unknown): Product {
    const normalized = normalizeParsedProduct(raw, 'manual');
    return {
      id: '',
      title: normalized.title || '',
      description: normalized.description,
      price: normalized.price || 0,
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
      sourceType: 'manual',
    };
  }
}
