import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ANALYTICS_EVENTS, trackEvent } from '@server/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (supabaseAdmin) {
      await supabaseAdmin.from('product_clicks').insert({
        product_id: body.productId || null,
        marketplace: body.marketplace || null,
        url: body.url || '',
        source_page: body.sourcePage || 'unknown',
        clicked_at: new Date().toISOString(),
      });
    }
    await trackEvent(ANALYTICS_EVENTS.productClick, {
      productId: body.productId,
      marketplace: body.marketplace,
      category: body.category,
      metadata: {
        url: body.url || '',
        source_page: body.sourcePage || 'unknown',
        position: body.position,
        query: body.query,
        price: body.price,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
