import type { ImportItemInput } from '../schema';

export function dedupeImportItems(items: ImportItemInput[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = String(item.productUrl || item.originalUrl || item.affiliateUrl || item.title || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
