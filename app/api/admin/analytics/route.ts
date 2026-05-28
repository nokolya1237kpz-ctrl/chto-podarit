import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { supabaseAdmin } from '@lib/supabase';

function topBy<T extends Record<string, any>>(events: T[], key: (event: T) => string | null | undefined, limit = 10) {
  const map = new Map<string, number>();
  for (const event of events) {
    const value = key(event);
    if (!value) continue;
    map.set(value, (map.get(value) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function GET() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, data: emptyAnalytics('Supabase не настроен') });
    }

    const { data, error } = await supabaseAdmin
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json({ success: true, data: emptyAnalytics(error.message) });
    }

    const events = data || [];
    const byEvent = topBy(events, (event) => event.event, 20);
    const importErrors = events.filter((event) => event.event === 'import_error').slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        totalEvents: events.length,
        byEvent,
        topSearches: topBy(events.filter((event) => event.event === 'search_compare'), (event) => event.query || event.metadata?.query),
        topClickedProducts: topBy(events.filter((event) => event.event === 'product_click' || event.event === 'compare_result_click'), (event) => event.product_id || event.metadata?.product_id),
        topCategories: topBy(events, (event) => event.category || event.metadata?.category),
        topMarketplaces: topBy(events, (event) => event.marketplace || event.metadata?.marketplace),
        giftQuizStats: {
          count: events.filter((event) => event.event === 'gift_quiz_complete').length,
          recipients: topBy(events.filter((event) => event.event === 'gift_quiz_complete'), (event) => event.metadata?.recipient),
          budgets: topBy(events.filter((event) => event.event === 'gift_quiz_complete'), (event) => event.metadata?.budget),
        },
        favoritesCount: events.filter((event) => event.event === 'favorite_add').length,
        watchlistCount: events.filter((event) => event.event === 'price_watch_add').length,
        importErrors,
        recentEvents: events.slice(0, 50),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: true, data: emptyAnalytics(error instanceof Error ? error.message : 'Ошибка аналитики') });
  }
}

function emptyAnalytics(error?: string) {
  return {
    totalEvents: 0,
    byEvent: [],
    topSearches: [],
    topClickedProducts: [],
    topCategories: [],
    topMarketplaces: [],
    giftQuizStats: { count: 0, recipients: [], budgets: [] },
    favoritesCount: 0,
    watchlistCount: 0,
    importErrors: [],
    recentEvents: [],
    error,
  };
}
