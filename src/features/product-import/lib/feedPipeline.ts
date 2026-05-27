import 'server-only';

import { importNormalizedProduct } from '@features/product-import/lib/importProduct';
import { normalizeFeedItem } from '@features/product-import/lib/feedImport';
import { cleanupTitle, getDedupeKey } from '@entities/product/lib/productNormalize';

export type FeedImportReport = {
  importedActive: number;
  importedDraft: number;
  enriched: number;
  skippedNoTitle: number;
  skippedDuplicates: number;
  skippedDeleted: number;
  errors: number;
  rows: any[];
};

export async function importFeedRows(rows: Record<string, any>[], sourceProvider = 'feed', marketplace?: string, sourceFeedId?: string): Promise<FeedImportReport> {
  const report: FeedImportReport = {
    importedActive: 0,
    importedDraft: 0,
    enriched: 0,
    skippedNoTitle: 0,
    skippedDuplicates: 0,
    skippedDeleted: 0,
    errors: 0,
    rows: [],
  };
  const seen = new Set<string>();

  for (const row of rows) {
    try {
      const normalized = { ...normalizeFeedItem(row, sourceProvider), ...(marketplace ? { marketplace } : {}), sourceFeedId };
      if (!cleanupTitle(normalized.title)) {
        report.skippedNoTitle += 1;
        report.rows.push({ status: 'skipped_no_title', title: '', url: normalized.originalUrl || '' });
        continue;
      }
      const key = getDedupeKey(normalized as any);
      if (seen.has(key)) {
        report.skippedDuplicates += 1;
        report.rows.push({ status: 'skipped_duplicate', title: normalized.title, url: normalized.originalUrl || '' });
        continue;
      }
      seen.add(key);

      const hadMissing = !normalized.imageUrl || !normalized.description || !Number(normalized.price || 0);
      const saved = await importNormalizedProduct(normalized);
      if (!saved) {
        report.skippedDeleted += 1;
        report.rows.push({ status: 'skipped_deleted_or_duplicate', title: normalized.title, url: normalized.originalUrl || '' });
        continue;
      }
      if (hadMissing && (saved.imageUrl || saved.description || Number(saved.price || 0) > 0)) report.enriched += 1;
      if (saved.status === 'active') report.importedActive += 1;
      else report.importedDraft += 1;
      report.rows.push({
        status: saved.status,
        title: saved.title,
        url: saved.originalUrl,
        imageFound: Boolean(saved.imageUrl),
        priceFound: Number(saved.price || 0) > 0,
      });
    } catch (error) {
      report.errors += 1;
      report.rows.push({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  }

  return report;
}
