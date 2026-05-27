import type { ImportProductInput } from '@features/product-import/lib/importProduct';
import { normalizeProduct } from './normalizeProduct';

export function mapImportedProduct(input: ImportProductInput) {
  const productUrl = 'productUrl' in input ? String(input.productUrl || '') : '';
  return normalizeProduct({
    ...input,
    originalUrl: input.originalUrl || productUrl,
    sourceProvider: input.sourceProvider || 'manual',
    sourceType: input.sourceType || input.sourceProvider || 'manual',
  } as ImportProductInput);
}
