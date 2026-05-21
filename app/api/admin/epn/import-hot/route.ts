import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getEpnHotGoods, mapEpnGoodToProduct, searchEpnOffers } from '@/lib/epn';
import { importNormalizedProduct } from '@/lib/importProduct';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit || 50), 200);
    const q = body.query || body.q || undefined;
    const offerId = body.offerId || undefined;

    let offerIds: string[] = offerId ? [String(offerId)] : [];
    if (!offerId && body.withOffers) {
      const offers = await searchEpnOffers(q || '', 20);
      offerIds = offers.offers.filter((offer) => offer.exportSupport || offer.creativePlacement).map((offer) => offer.id).slice(0, 5);
    }

    const goodsBatches = offerIds.length > 0
      ? await Promise.all(offerIds.map((id) => getEpnHotGoods({ q, offerId: id, limit: Math.ceil(limit / offerIds.length) })))
      : [await getEpnHotGoods({ q, limit })];

    const goods = goodsBatches.flat().slice(0, limit);
    let imported = 0;
    let drafted = 0;
    let failed = 0;

    for (const good of goods) {
      try {
        const mapped = mapEpnGoodToProduct(good);
        const saved = await importNormalizedProduct({
          ...mapped,
          imageUrl: mapped.imageUrl,
          sourceProvider: 'epn',
          sourceType: 'epn',
          tags: ['epn', mapped.category, mapped.marketplace].filter(Boolean),
          currency: mapped.currency || 'RUB',
        });
        if (saved?.status === 'draft') drafted += 1;
        if (saved) imported += 1;
      } catch (error) {
        console.error('ePN hot import item failed:', error);
        failed += 1;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      drafted,
      failed,
      total: goods.length,
    });
  } catch (error) {
    console.error('Error importing ePN hot goods:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка массового импорта ePN' },
      { status: 500 }
    );
  }
}
