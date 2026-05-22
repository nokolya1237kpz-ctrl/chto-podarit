import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { applyColumnMapping, normalizeMappedRow, parseImportFile } from '@/lib/fileImport';
import { importNormalizedProduct } from '@/lib/importProduct';

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    const mapping = JSON.parse(String(form.get('mapping') || '{}'));
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'Файл не загружен' }, { status: 400 });

    const rows = parseImportFile(new Uint8Array(await file.arrayBuffer()), file.name, file.type).slice(0, 3000);
    let imported = 0;
    let drafted = 0;
    let failed = 0;
    const reports: any[] = [];

    for (const row of rows) {
      try {
        const mapped = applyColumnMapping(row, mapping);
        const saved = await importNormalizedProduct(normalizeMappedRow(mapped, 'feed'));
        if (saved) imported += 1;
        if (saved?.status === 'draft') drafted += 1;
      } catch (error) {
        failed += 1;
        if (reports.length < 50) reports.push({ row, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return NextResponse.json({ success: true, imported, drafted, failed, total: rows.length, reports });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Ошибка импорта файла' }, { status: 500 });
  }
}
