import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { applyColumnMapping, normalizeMappedRow, parseImportFile } from '@/lib/fileImport';
import { importNormalizedProduct } from '@/lib/importProduct';

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  try {
    let rows: Record<string, any>[] = [];
    let mapping: Record<string, string> = {};

    if (request.headers.get('content-type')?.includes('application/json')) {
      const body = await request.json();
      rows = Array.isArray(body.items) ? body.items : [];
      mapping = body.columnMapping || body.mapping || {};
    } else {
      const form = await request.formData();
      const file = form.get('file');
      mapping = JSON.parse(String(form.get('mapping') || '{}'));
      if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'Файл не загружен' }, { status: 400 });
      rows = parseImportFile(new Uint8Array(await file.arrayBuffer()), file.name, file.type).slice(0, 3000);
    }

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'no_items_in_file',
        reason: 'no_items_in_file',
        total: 0,
        detectedRows: 0,
      }, { status: 400 });
    }

    let imported = 0;
    let importedActive = 0;
    let importedDraft = 0;
    let skipped = 0;
    let errors = 0;
    const reports: any[] = [];

    for (const row of rows.slice(0, 3000)) {
      try {
        const mapped = applyColumnMapping(row, mapping);
        if (!mapped.title && !row.title && !row.name) {
          skipped += 1;
          if (reports.length < 100) reports.push({ row, status: 'skipped', reason: 'missing_title' });
          continue;
        }
        const saved = await importNormalizedProduct(normalizeMappedRow(mapped, 'feed'));
        if (saved) imported += 1;
        if (saved?.status === 'active') importedActive += 1;
        if (saved?.status === 'draft') importedDraft += 1;
        if (!saved) {
          skipped += 1;
          if (reports.length < 100) reports.push({ row, status: 'skipped', reason: 'not_saved' });
        } else if (reports.length < 100) {
          reports.push({ title: saved.title, status: saved.status, reason: saved.importStatus });
        }
      } catch (error) {
        errors += 1;
        if (reports.length < 100) reports.push({ row, status: 'error', reason: error instanceof Error ? error.message : String(error) });
      }
    }

    if (imported === 0) {
      const reason = reports[0]?.reason || 'no_items_imported';
      return NextResponse.json({
        success: false,
        error: reason,
        reason,
        imported,
        importedActive,
        importedDraft,
        skipped,
        errors,
        total: rows.length,
        detectedRows: rows.length,
        reports,
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, imported, importedActive, importedDraft, skipped, errors, total: rows.length, detectedRows: rows.length, reports });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Ошибка импорта файла' }, { status: 500 });
  }
}
