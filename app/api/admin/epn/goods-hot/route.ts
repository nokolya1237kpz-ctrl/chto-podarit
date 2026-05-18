import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getEpnHotGoods } from '@/lib/epn';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const limit = Number(searchParams.get('limit') || '20');
    const offset = Number(searchParams.get('offset') || '0');
    const categoryId = searchParams.get('categoryId') || undefined;
    const offerId = searchParams.get('offerId') || undefined;
    const priceMin = searchParams.get('priceMin')
      ? Number(searchParams.get('priceMin'))
      : undefined;
    const priceMax = searchParams.get('priceMax')
      ? Number(searchParams.get('priceMax'))
      : undefined;

    const goods = await getEpnHotGoods({
      q,
      limit,
      offset,
      categoryId,
      offerId,
      priceMin,
      priceMax,
    });

    return NextResponse.json({
      success: true,
      goods,
      count: goods.length,
    });
  } catch (error) {
    console.error('Error loading ePN hot goods:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки горячих товаров',
      },
      { status: 500 }
    );
  }
}
