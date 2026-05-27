import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { createImportJob } from '@features/product-import/lib/importJobs';

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  try {
    const body = await request.json();
    const totalRows = Number(body.totalRows || 0);
    if (!totalRows) {
      return NextResponse.json({ success: false, error: 'Не передано количество строк' }, { status: 400 });
    }

    const job = await createImportJob({
      totalRows,
      filename: String(body.filename || 'import.csv'),
      source: String(body.source || 'file_import'),
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Не удалось создать задачу импорта' }, { status: 500 });
  }
}
