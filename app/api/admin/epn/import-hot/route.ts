import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { delayEpnRequest, finishEpnImportJob, getEpnHotGoodsWithDebug, mapEpnGoodToProduct, searchEpnOffers, tryStartEpnImportJob } from '@/lib/epn';
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
    const debugBatches: any[] = [];
    if (offerIds.length > 0) {
      for (const id of offerIds) {
        await delayEpnRequest();
        const result = await getEpnHotGoodsWithDebug({ q, offerId: id, limit: Math.ceil(limit / offerIds.length) });
        goodsBatches.push(result.goods);
        debugBatches.push(result.debug);
      }
    } else {
      await delayEpnRequest();
      const result = await getEpnHotGoodsWithDebug({ q, limit });
      goodsBatches.push(result.goods);
      debugBatches.push(result.debug);
    }

    const goods = goodsBatches.flat().slice(0, limit);
    if (goods.length === 0) {
      return NextResponse.json({
        success: false,
        reason: 'no_epn_goods_endpoint',
        error: 'ePN API не вернул товары по запросу. Используйте approved offers, creatives или feed.',
        imported: 0,
        drafted: 0,
        failed: 0,
        total: 0,
        debug: {
          batches: debugBatches,
          foundRaw: debugBatches.reduce((sum, item) => sum + Number(item?.foundRaw || 0), 0),
          normalized: 0,
          imported: 0,
        },
      }, { status: 400 });
    }
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
      debug: {
        batches: debugBatches,
        foundRaw: debugBatches.reduce((sum, item) => sum + Number(item?.foundRaw || 0), 0),
        normalized: goods.length,
        imported,
      },
    });
  } catch (error) {
    console.error('Error importing ePN hot goods:', error);
    return NextResponse.json(
      {
        success: false,
        reason: (error as any)?.status === 429 ? 'epn_captcha' : (error as any)?.status === 401 ? 'epn_unauthorized' : 'epn_import_failed',
        error: error instanceof Error ? error.message : 'Ошибка массового импорта ePN',
        debug: (error as any)?.details,
      },
      { status: (error as any)?.status === 429 ? 429 : 500 }
    );
  } finally {
    if (started) finishEpnImportJob();
  }
}
