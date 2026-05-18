import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { epnFetch, normalizeEpnOfferList } from '@/lib/epn';

const apiBaseUrl = process.env.EPN_API_BASE_URL || 'https://app.epn.bz';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || undefined;
  const limit = Number(searchParams.get('limit') || '20');

  const requestParams = {
    v: '2',
    lang: 'ru',
    viewRules: 1,
    locale: 'ru',
    q: query?.trim() || undefined,
    limit,
  };

  const requestUrl = new URL('/offers/list', apiBaseUrl);
  Object.entries(requestParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      requestUrl.searchParams.set(key, String(value));
    }
  });

  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const responseBody = await epnFetch('/offers/list', {
      query: requestParams,
    });
    const offers = normalizeEpnOfferList(responseBody);

    return NextResponse.json({
      success: true,
      offers,
      count: offers.length,
      debug: {
        requestUrl: requestUrl.toString(),
        requestParams,
        responseBody,
      },
    });
  } catch (error) {
    console.error('Error loading ePN offers:', error);
    const message = error instanceof Error ? error.message : 'Ошибка загрузки офферов';
    const details = (error as any)?.details;
    const lowerMessage = message.toLowerCase();
    const status = lowerMessage.includes('lang') || lowerMessage.includes('viewrules') || lowerMessage.includes('view_rules') ? 422 : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
        debug: {
          requestUrl: requestUrl.toString(),
          requestParams,
          responseBody: details || null,
        },
      },
      { status }
    );
  }
}
