import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { generateEpnDeeplink } from '@/lib/epn';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json();
    const url = body?.originalUrl || body?.url;
    const offerId = body?.offerId;
    const placementId = body?.placementId;
    const subId = body?.subId;
    const deeplinkSupport = body?.deeplinkSupport;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid url' }, { status: 400 });
    }
    if (!offerId) {
      return NextResponse.json({ success: false, error: 'Не указан offerId' }, { status: 400 });
    }
    if (deeplinkSupport === false) {
      return NextResponse.json(
        { success: false, error: 'Для этого оффера недоступна генерация deeplink' },
        { status: 400 }
      );
    }

    const result = await generateEpnDeeplink(url, { offerId, placementId, subId });

    return NextResponse.json({
      success: true,
      affiliateUrl: result.affiliateUrl,
      creativeId: result.creativeId,
      originalUrl: result.originalUrl,
      offerId: result.offerId,
      placementId: result.placementId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка создания deeplink';
    const details = (error as any)?.details;
    const status = (error as any)?.status === 405 ? 405 : 500;
    return NextResponse.json(
      {
        success: false,
        error: (error as any)?.status === 405
          ? 'Неверный метод или endpoint deeplink. Проверьте интеграцию API.'
          : message,
        details,
      },
      { status }
    );
  }
}
