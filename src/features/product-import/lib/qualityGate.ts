import type { ImportItemInput } from '../schema';

export function getImportQualityStatus(item: ImportItemInput) {
  const title = Boolean(item.title?.trim());
  const price = Number(item.price || 0) > 0;
  const image = Boolean(item.imageUrl);
  const url = Boolean(item.productUrl || item.originalUrl || item.affiliateUrl);

  if (!title) return 'skip_no_title';
  if (title && price && image) return 'active_ready';
  if (title && url) return 'draft_ready';
  return 'draft_incomplete';
}
