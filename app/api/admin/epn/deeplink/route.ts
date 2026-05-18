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
    const url = body?.url;
    const offerId = body?.offerId;
    const placementId = body?.placementId;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid url' }, { status: 400 });
    }

    const result = await generateEpnDeeplink(url, { offerId, placementId });

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
    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
      },
      { status: 500 }
    );
  }
}
