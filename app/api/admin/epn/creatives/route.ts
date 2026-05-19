import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getEpnCreatives } from '@/lib/epn';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '100');
    const offset = Number(searchParams.get('offset') || '0');
    const offerId = searchParams.get('offerId') || undefined;
    const description = searchParams.get('description') || undefined;

    const creatives = await getEpnCreatives({
      limit,
      offset,
      offerId,
      description,
    });

    return NextResponse.json({
      success: true,
      creatives,
      count: creatives.length,
    });
  } catch (error) {
    console.error('Error loading ePN creatives:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки креативов ePN',
        details: (error as any)?.details,
      },
      { status: 500 }
    );
  }
}
