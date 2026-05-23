import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getEpnHotGoodsWithDebug } from '@/lib/epn';

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

    const result = await getEpnHotGoodsWithDebug({
      q,
      limit,
      offset,
      categoryId,
      offerId,
      priceMin,
      priceMax,
    });
    const goods = result.goods;

    if (goods.length === 0) {
      return NextResponse.json({
        success: false,
        reason: offerId ? 'NO_GOODS' : 'no_epn_goods_endpoint',
        error: offerId
          ? 'У этого оффера нет товаров для импорта'
          : 'ePN API не вернул товары по запросу. Используйте approved offers, creatives или feed.',
        goods,
        count: 0,
        debug: result.debug,
      });
    }

    return NextResponse.json({
      success: true,
      goods,
      count: goods.length,
      debug: result.debug,
    });
  } catch (error) {
    console.error('Error loading ePN hot goods:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки горячих товаров',
        debug: (error as any)?.details,
      },
      { status: 500 }
    );
  }
}
