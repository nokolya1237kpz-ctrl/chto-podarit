import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getEpnOffers, searchEpnOffers } from '@/lib/epn';

const apiBaseUrl = process.env.EPN_API_BASE_URL || 'https://app.epn.bz';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || undefined;
  const limit = Number(searchParams.get('limit') || '20');

  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const result = query ? await searchEpnOffers(query, limit) : await getEpnOffers();

    const requestUrl = new URL('/offers/list', apiBaseUrl);
    Object.entries(result.requestParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        requestUrl.searchParams.set(key, String(value));
      }
    });

    return NextResponse.json({
      success: true,
      offers: result.offers,
      count: result.offers.length,
      debug: {
        requestUrl: requestUrl.toString(),
        requestParams: result.requestParams,
        responseBody: result.responseBody,
        successfulViewRules: result.successfulViewRules,
        triedViewRules: result.triedViewRules,
      },
    });
  } catch (error) {
    console.error('Error loading ePN offers:', error);
    const message = error instanceof Error ? error.message : 'Ошибка загрузки офферов';
    const details = (error as any)?.details;
    const lowerMessage = message.toLowerCase();
    const status = lowerMessage.includes('lang') || lowerMessage.includes('viewrules') || lowerMessage.includes('view_rules') ? 422 : 500;

    const triedViewRules = (error as any)?.details?.triedViewRules || [];

    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
        debug: {
          requestUrl: request?.url || '',
          requestParams: { q: query?.trim() || undefined, limit, lang: 'ru' },
          responseBody: details || null,
          successfulViewRules: null,
          triedViewRules,
        },
      },
      { status }
    );
  }
}
