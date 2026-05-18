import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getEpnAccessToken, getEpnSsidToken } from '@/lib/epn';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const hasClientId = Boolean(process.env.EPN_CLIENT_ID);
    const hasClientSecret = Boolean(process.env.EPN_CLIENT_SECRET);

    if (!hasClientId || !hasClientSecret) {
      return NextResponse.json({
        success: false,
        connected: false,
        hasClientId,
        hasClientSecret,
        ssidReceived: false,
        tokenReceived: false,
        message: 'EPN credentials not configured',
        error: 'Missing EPN_CLIENT_ID or EPN_CLIENT_SECRET',
      });
    }

    const ssidToken = await getEpnSsidToken();
    const accessToken = await getEpnAccessToken();

    return NextResponse.json({
      success: true,
      connected: true,
      hasClientId: true,
      hasClientSecret: true,
      ssidReceived: Boolean(ssidToken),
      tokenReceived: Boolean(accessToken),
      message: 'ePN API подключен',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const details = (error as any)?.details;

    return NextResponse.json(
      {
        success: false,
        connected: false,
        hasClientId: Boolean(process.env.EPN_CLIENT_ID),
        hasClientSecret: Boolean(process.env.EPN_CLIENT_SECRET),
        ssidReceived: false,
        tokenReceived: false,
        message: 'Не удалось проверить ePN API',
        error: errorMessage,
        details,
      },
      { status: 500 }
    );
  }
}
