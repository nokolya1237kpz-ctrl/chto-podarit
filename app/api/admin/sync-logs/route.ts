import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getProductSyncLogs } from '@/lib/supabase';

export async function GET() {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const logs = await getProductSyncLogs();
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json({ success: false, error: 'Ошибка загрузки логов' }, { status: 500 });
  }
}
