import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getEpnRuntimeStatus, refreshEpnTokenIfNeeded } from '@/lib/epn';

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

    let runtime = getEpnRuntimeStatus();
    let authError: string | undefined;
    let authDetails: any;

    if (!runtime.tokenCached && !runtime.captchaRequired && !runtime.cooldownUntil) {
      try {
        await refreshEpnTokenIfNeeded();
      } catch (error) {
        authError = error instanceof Error ? error.message : String(error);
        authDetails = (error as any)?.details;
      }
      runtime = getEpnRuntimeStatus();
    }

    return NextResponse.json({
      success: runtime.tokenCached,
      connected: runtime.tokenCached && !runtime.captchaRequired,
      hasClientId: true,
      hasClientSecret: true,
      ssidReceived: runtime.ssidCached,
      tokenReceived: runtime.tokenCached,
      tokenCached: runtime.tokenCached,
      cooldownUntil: runtime.cooldownUntil,
      captchaRequired: runtime.captchaRequired,
      ssidExpiresAt: runtime.ssidExpiresAt,
      tokenExpiresAt: runtime.tokenExpiresAt,
      lastAuthDebug: runtime.lastAuthDebug,
      message: runtime.captchaRequired
        ? 'ePN временно требует капчу. Остановите импорт и попробуйте позже.'
        : runtime.tokenCached
          ? 'ePN API подключен, токен получен'
          : 'ePN credentials настроены, но токен не получен',
      error: authError,
      details: authDetails,
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
        tokenCached: false,
        cooldownUntil: null,
        captchaRequired: false,
        lastAuthDebug: getEpnRuntimeStatus().lastAuthDebug,
        message: 'Не удалось проверить ePN API',
        error: errorMessage,
        details,
      },
      { status: 500 }
    );
  }
}
