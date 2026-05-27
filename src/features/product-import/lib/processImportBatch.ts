import 'server-only';

import { supabaseAdmin } from '@lib/supabase';
import { applyColumnMapping, normalizeMappedRow } from './fileImport';
import { importNormalizedProductWithDedupe } from './importProduct';
import { detectDatasetType, normalizeOzonDatasetItem } from '@/lib/scraperDataset';

export type ImportBatchReport = {
  imported: number;
  importedActive: number;
  importedDraft: number;
  skipped: number;
  errors: number;
  parsedRows: number;
  normalizedRows: number;
  activeReady: number;
  draftReady: number;
  skippedNoTitle: number;
  skippedNoImage: number;
  skippedNoPrice: number;
  saveErrors: number;
  createdActive: number;
  createdDraft: number;
  updatedExisting: number;
  skippedSoftDeleted: number;
  skippedAlreadyInBatch: number;
  skippedDuplicate: number;
  duplicates: number;
  reports: any[];
  debug: {
    detectedDatasetType: string;
    detectedDelimiter?: string;
    arrayLength: number;
    headers: string[];
    firstParsedRow: any;
    columnMapping: Record<string, string>;
    firstNormalizedItem: any;
    firstSaveError: any;
    firstDuplicateMatch: any;
    importPayloadSize: number;
  };
};

const CONCURRENCY = Number(process.env.IMPORT_CONCURRENCY || 4);

function detectImportDatasetType(rows: Record<string, any>[]) {
  const base = detectDatasetType(rows);
  if (base !== 'generic') return base;
  const headers = Object.keys(rows[0] || {});
  const normalized = headers.map((header) => header.toLowerCase().replace(/^\uFEFF/, '').trim());
  if (normalized.includes('название') && normalized.includes('изображения') && normalized.includes('артикул')) {
    return 'sadovod_qparser';
  }
  return base;
}

function getQualityStatus(item: Record<string, any>) {
  const hasTitle = Boolean(String(item.title || '').trim());
  const hasImage = Boolean(String(item.imageUrl || '').trim());
  const hasPrice = Number(item.price || 0) > 0;
  if (!hasTitle) return 'skip_no_title';
  if (hasTitle && hasPrice && hasImage) return 'active_ready';
  return 'draft_ready';
}

function detectBroadCategory(item: Record<string, any>) {
  const text = [item.title, item.description, item.category, Array.isArray(item.tags) ? item.tags.join(' ') : item.tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/авто|машин|oem|запчаст|шина|аккумулятор/.test(text)) return 'Автотовары';
  if (/наушник|смартфон|гаджет|электрон|кабель|заряд/.test(text)) return 'Электроника';
  if (/плать|одежд|футболк|брюк|куртк|обув|размер/.test(text)) return 'Одежда';
  if (/космет|помад|макияж|крем|уход|beauty/.test(text)) return 'Косметика';
  if (/дом|кухн|посуда|декор|интерьер|текстиль/.test(text)) return 'Дом';
  return item.category || 'Подарки';
}

function normalizeRow(row: Record<string, any>, mapping: Record<string, string>, datasetType: string) {
  const mapped = applyColumnMapping(row, mapping);
  const normalizedInput = datasetType === 'ozon_scraper'
    ? normalizeOzonDatasetItem({ ...row, ...mapped })
    : normalizeMappedRow(mapped, 'file_import');

  normalizedInput.sourceProvider = 'file_import' as any;
  normalizedInput.sourceType = 'feed' as any;
  if (datasetType === 'sadovod_qparser' || normalizedInput.marketplace === 'sadovod') {
    normalizedInput.marketplace = 'sadovod';
    normalizedInput.sourceProvider = 'sadovod' as any;
    normalizedInput.sourceType = 'file_import' as any;
    if (normalizedInput.externalProductId && !String(normalizedInput.externalProductId).startsWith('sadovod:')) {
      normalizedInput.externalProductId = `sadovod:${normalizedInput.externalProductId}`;
    }
  }
  normalizedInput.category = normalizedInput.category || detectBroadCategory(normalizedInput as any);
  normalizedInput.tags = Array.from(new Set([...(normalizedInput.tags || []), normalizedInput.category].filter(Boolean)));
  (normalizedInput as any).imageStatus = normalizedInput.imageUrl ? 'remote' : 'missing';
  (normalizedInput as any).searchText = [
    normalizedInput.title,
    normalizedInput.category,
    ...(normalizedInput.tags || []),
    (normalizedInput as any).brand,
  ].filter(Boolean).join(' ').toLowerCase();
  return normalizedInput;
}

async function savePriceSnapshot(product: any) {
  if (!supabaseAdmin || !product?.id || !product?.price) return;
  try {
    await supabaseAdmin.from('price_snapshots').insert({
      product_id: product.id,
      marketplace: product.marketplace || 'other',
      price: product.price,
      old_price: product.oldPrice || null,
      detected_at: new Date().toISOString(),
    });
  } catch {
    // Migration may not be applied yet. price_history is still written by importNormalizedProduct.
  }
}

async function runPool<T>(items: T[], worker: (item: T, index: number) => Promise<void>) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

export async function processImportBatch({
  rows,
  mapping,
  detectedDelimiter,
  maxReports = 100,
}: {
  rows: Record<string, any>[];
  mapping: Record<string, string>;
  detectedDelimiter?: string;
  maxReports?: number;
}): Promise<ImportBatchReport> {
  const datasetType = detectImportDatasetType(rows);
  const firstNormalizedItem = rows[0] ? normalizeRow(rows[0], mapping, datasetType) : null;
  const reports: any[] = [];
  let imported = 0;
  let importedActive = 0;
  let importedDraft = 0;
  let skipped = 0;
  let errors = 0;
  let normalizedRows = 0;
  let activeReady = 0;
  let draftReady = 0;
  let skippedNoTitle = 0;
  let skippedNoImage = 0;
  let skippedNoPrice = 0;
  let saveErrors = 0;
  let createdActive = 0;
  let createdDraft = 0;
  let updatedExisting = 0;
  let skippedSoftDeleted = 0;
  let skippedAlreadyInBatch = 0;
  let skippedDuplicate = 0;
  let duplicates = 0;
  let firstSaveError: any = null;
  let firstDuplicateMatch: any = null;
  const batchKeys = new Set<string>();

  await runPool(rows.slice(0, 3000), async (row) => {
    try {
      const normalizedInput = normalizeRow(row, mapping, datasetType);
      normalizedRows += 1;

      const qualityStatus = getQualityStatus(normalizedInput as Record<string, any>);
      if (qualityStatus === 'active_ready') activeReady += 1;
      if (qualityStatus === 'draft_ready') draftReady += 1;
      if (!normalizedInput.imageUrl) skippedNoImage += 1;
      if (!Number(normalizedInput.price || 0)) skippedNoPrice += 1;

      if (!normalizedInput.title) {
        skipped += 1;
        skippedNoTitle += 1;
        if (reports.length < maxReports) reports.push({ row, status: 'skipped', reason: 'missing_title' });
        return;
      }

      const batchKey = [
        normalizedInput.sourceProvider,
        normalizedInput.externalProductId,
        normalizedInput.originalUrl || normalizedInput.affiliateUrl,
        normalizedInput.title,
        normalizedInput.price,
        normalizedInput.imageUrl,
      ].filter(Boolean).join('|').toLowerCase();
      if (batchKeys.has(batchKey)) {
        skipped += 1;
        duplicates += 1;
        skippedAlreadyInBatch += 1;
        if (reports.length < maxReports) {
          reports.push({
            title: normalizedInput.title,
            status: 'skipped',
            reason: 'already_in_batch',
            dedupeDebug: buildInputDedupeDebug(normalizedInput),
          });
        }
        return;
      }
      batchKeys.add(batchKey);

      const upsert = await importNormalizedProductWithDedupe(normalizedInput as any);
      const saved = upsert.product;
      if (saved) {
        imported += 1;
        if (upsert.action === 'updated') {
          updatedExisting += 1;
        } else {
          if (saved.status === 'active') {
            importedActive += 1;
            createdActive += 1;
          }
          if (saved.status === 'draft') {
            importedDraft += 1;
            createdDraft += 1;
          }
        }
        await savePriceSnapshot(saved);
        if (reports.length < maxReports) reports.push({ title: saved.title, status: saved.status, reason: upsert.reason, matchedBy: upsert.matchedBy });
      } else {
        skipped += 1;
        if (upsert.reason === 'soft_deleted') {
          skippedSoftDeleted += 1;
        } else if (upsert.reason === 'not_saved' || upsert.reason === 'supabase_not_configured') {
          saveErrors += 1;
          errors += 1;
          firstSaveError ||= {
            reason: upsert.reason,
            ...upsert.saveError,
            row,
            productPayload: normalizedInput,
          };
        } else {
          duplicates += 1;
          skippedDuplicate += 1;
        }
        const duplicateDebug = {
          ...buildInputDedupeDebug(normalizedInput),
          matchedBy: upsert.matchedBy,
          existingProductId: upsert.duplicateMatch?.existingId,
          existingExternalProductId: upsert.duplicateMatch?.existingExternalProductId,
          existingProductUrl: upsert.duplicateMatch?.existingProductUrl,
          existingDeletedAt: upsert.duplicateMatch?.existingDeletedAt,
          existingStatus: upsert.duplicateMatch?.existingStatus,
          existingSourceProvider: upsert.duplicateMatch?.existingSourceProvider,
          existingTitle: upsert.duplicateMatch?.existingTitle,
        };
        firstDuplicateMatch ||= duplicateDebug;
        if (reports.length < maxReports) {
          reports.push({
            row,
            status: upsert.reason === 'not_saved' || upsert.reason === 'supabase_not_configured' ? 'error' : 'skipped',
            reason: upsert.reason,
            saveError: upsert.saveError || null,
            productPayload: normalizedInput,
            matchedBy: upsert.matchedBy,
            duplicateMatch: upsert.duplicateMatch,
            dedupeDebug: duplicateDebug,
          });
        }
      }
    } catch (error) {
      errors += 1;
      saveErrors += 1;
      const reason = error instanceof Error ? error.message : String(error);
      firstSaveError ||= { message: reason, row };
      if (/duplicate/i.test(reason)) duplicates += 1;
      if (reports.length < maxReports) reports.push({ row, status: 'error', reason });
    }
  });

  return {
    imported,
    importedActive,
    importedDraft,
    skipped,
    errors,
    parsedRows: rows.length,
    normalizedRows,
    activeReady,
    draftReady,
    skippedNoTitle,
    skippedNoImage,
    skippedNoPrice,
    saveErrors,
    createdActive,
    createdDraft,
    updatedExisting,
    skippedSoftDeleted,
    skippedAlreadyInBatch,
    skippedDuplicate,
    duplicates,
    reports,
    debug: {
      detectedDatasetType: datasetType,
      detectedDelimiter,
      arrayLength: rows.length,
      headers: Object.keys(rows[0] || {}),
      firstParsedRow: rows[0] || null,
      columnMapping: mapping,
      firstNormalizedItem,
      firstSaveError,
      firstDuplicateMatch,
      importPayloadSize: JSON.stringify({ items: rows, columnMapping: mapping }).length,
    },
  };
}

function buildInputDedupeDebug(input: any) {
  return {
    inputExternalProductId: input.externalProductId,
    normalizedExternalProductId: input.externalProductId,
    inputProductUrl: input.originalUrl || input.affiliateUrl || '',
    normalizedProductUrl: input.originalUrl || input.affiliateUrl || '',
    inputSourceProvider: input.sourceProvider,
    inputMarketplace: input.marketplace,
  };
}
