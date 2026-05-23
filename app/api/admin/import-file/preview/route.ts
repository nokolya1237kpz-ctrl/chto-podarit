import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { parseImportFile } from '@/lib/fileImport';

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'Файл не загружен' }, { status: 400 });
    const rows = parseImportFile(new Uint8Array(await file.arrayBuffer()), file.name, file.type);
    const sample = rows.slice(0, 20);
    const columns = Object.keys(rows[0] || {});
    return NextResponse.json({ success: true, total: rows.length, columns, sample, rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Ошибка preview файла' }, { status: 400 });
  }
}
