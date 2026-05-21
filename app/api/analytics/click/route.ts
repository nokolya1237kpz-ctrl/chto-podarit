import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
