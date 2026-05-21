import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { providers } from '@/lib/providers';
import { importNormalizedProduct } from '@/lib/importProduct';
import { getDedupeKey, isPublishableProduct } from '@/lib/productNormalize';

const presetQueries = ['наушники', 'помада', 'мультиварка', 'массажер', 'косметика', 'подарок девушке', 'подарок парню', 'фитнес', 'кухня', 'гаджеты'];

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const maxTotal = Math.min(Number(body.limit || 100), 100);
  const queries = Array.isArray(body.queries) && body.queries.length ? body.queries : presetQueries;
  const seen = new Set<string>();
  const rows: any[] = [];
  let imported = 0;
  let importedActive = 0;
  let importedDraft = 0;
  let skippedDuplicate = 0;
  let skippedQuality = 0;
  let errors = 0;

  for (const query of queries) {
    if (imported >= maxTotal) break;
    const wb: any = providers.wildberries;
    const result = wb.searchWithDiagnostics
      ? await wb.searchWithDiagnostics({ query, limit: 10 })
      : { products: await wb.searchProducts({ query, limit: 10 }), diagnostics: [] };
    let queryImported = 0;
    let queryDraft = 0;
    let querySkippedDuplicate = 0;
    let querySkippedQuality = 0;
    let queryErrors = 0;

    for (const product of result.products) {
      if (imported >= maxTotal) break;
      const key = getDedupeKey(product);
      if (seen.has(key)) {
        skippedDuplicate += 1;
        querySkippedDuplicate += 1;
        continue;
      }
      seen.add(key);
      if (!product.title) {
        skippedQuality += 1;
        querySkippedQuality += 1;
        continue;
      }
      try {
        const saved = await importNormalizedProduct(product);
        if (saved) {
          imported += 1;
          queryImported += 1;
          if (saved.status === 'draft' || !isPublishableProduct(product)) {
            importedDraft += 1;
            queryDraft += 1;
          } else {
            importedActive += 1;
          }
        }
      } catch (error) {
        errors += 1;
        queryErrors += 1;
      }
    }

    rows.push({
      source: 'wildberries',
      query,
      found: result.products.length,
      active: queryImported - queryDraft,
      draft: queryDraft,
      skippedDuplicate: querySkippedDuplicate,
      skippedQuality: querySkippedQuality,
      error: queryErrors ? `${queryErrors} errors` : '',
      diagnostics: result.diagnostics,
    });
  }

  return NextResponse.json({
    success: true,
    imported,
    importedActive,
    importedDraft,
    skippedDuplicate,
    skippedQuality,
    errors,
    rows,
  });
}
