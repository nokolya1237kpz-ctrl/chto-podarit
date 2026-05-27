import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { parseImportFile } from '@/lib/fileImport';
import { processImportBatch } from '@features/product-import/lib/processImportBatch';

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  try {
    let rows: Record<string, any>[] = [];
    let mapping: Record<string, string> = {};
    let detectedDelimiter = '';

    if (request.headers.get('content-type')?.includes('application/json')) {
      const body = await request.json();
      rows = Array.isArray(body.items) ? body.items : [];
      mapping = body.columnMapping || body.mapping || {};
      detectedDelimiter = body.detectedDelimiter || '';
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
        error: 'В файле не найдены товары',
        reason: 'no_items_in_file',
        total: 0,
        detectedRows: 0,
      }, { status: 400 });
    }

    const report = await processImportBatch({
      rows,
      mapping,
      detectedDelimiter,
    });

    const response = {
      success: report.imported > 0,
      ...report,
      total: rows.length,
      detectedRows: rows.length,
      imported: report.imported,
      importedActive: report.importedActive,
      importedDraft: report.importedDraft,
      skipped: report.skipped,
      errors: report.errors,
    };

    if (report.imported === 0) {
      const reason = report.reports[0]?.reason || report.debug.firstSaveError || 'Не удалось сохранить товары';
      return NextResponse.json({
        ...response,
        success: false,
        error: humanizeImportReason(reason),
        reason,
      }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Ошибка импорта файла' }, { status: 500 });
  }
}

function humanizeImportReason(reason: string) {
  if (reason === 'missing_title') return 'В строках не найдено название товара';
  if (reason === 'soft_deleted') return 'Товар был удалён ранее и не восстановлен автоматически';
  if (reason === 'updated_existing') return 'Товар уже был в базе и обновлён';
  if (reason === 'already_in_batch') return 'Дубликат внутри текущего файла';
  if (reason === 'same_external_id') return 'Товар найден по внешнему ID';
  if (reason === 'same_product_url') return 'Товар найден по URL';
  if (reason === 'same_title_price_image') return 'Товар найден по названию, цене и картинке';
  if (reason === 'no_items_imported') return 'Не удалось импортировать товары';
  return reason;
}
