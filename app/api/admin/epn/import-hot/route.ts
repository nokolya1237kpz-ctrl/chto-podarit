import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { delayEpnRequest, finishEpnImportJob, getEpnHotGoods, mapEpnGoodToProduct, searchEpnOffers, tryStartEpnImportJob } from '@/lib/epn';
import { importNormalizedProduct } from '@/lib/importProduct';

export async function POST(request: NextRequest) {
  let started = false;
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    started = tryStartEpnImportJob();
    if (!started) {
      return NextResponse.json({ success: false, error: 'Уже запущен ePN импорт. Дождитесь завершения.' }, { status: 409 });
    }

    const limit = Math.min(Number(body.limit || 10), 10);
    const q = body.query || body.q || undefined;
    const offerId = body.offerId || undefined;

    let offerIds: string[] = offerId ? [String(offerId)] : [];
    if (!offerId && body.withOffers) {
      const offers = await searchEpnOffers(q || '', 20);
      offerIds = offers.offers.filter((offer) => offer.exportSupport || offer.creativePlacement).map((offer) => offer.id).slice(0, 2);
    }

    const goodsBatches = [];
    if (offerIds.length > 0) {
      for (const id of offerIds) {
        await delayEpnRequest();
        goodsBatches.push(await getEpnHotGoods({ q, offerId: id, limit: Math.ceil(limit / offerIds.length) }));
      }
    } else {
      await delayEpnRequest();
      goodsBatches.push(await getEpnHotGoods({ q, limit }));
    }

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
      await delayEpnRequest();
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
      { status: (error as any)?.status === 429 ? 429 : 500 }
    );
  } finally {
    if (started) finishEpnImportJob();
  }
}
