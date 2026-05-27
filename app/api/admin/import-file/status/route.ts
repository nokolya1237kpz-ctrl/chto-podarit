import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getImportJob } from '@features/product-import/lib/importJobs';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id') || '';
  if (!id) return NextResponse.json({ success: false, error: 'Не передан ID импорта' }, { status: 400 });

  const job = await getImportJob(id);
  if (!job) return NextResponse.json({ success: false, error: 'Задача импорта не найдена' }, { status: 404 });

  return NextResponse.json({ success: true, job });
}
