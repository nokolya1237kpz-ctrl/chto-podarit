import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ success: false, error: 'Supabase не настроен' }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '');
  let query = supabaseAdmin.from('products').delete();

  if (action === 'draft_feed') {
    query = query.eq('status', 'draft').eq('source_type', 'feed');
  } else if (action === 'no_image') {
    query = query.or('image_url.is.null,image_url.eq.');
  } else if (action === 'zero_price') {
    query = query.eq('price', 0);
  } else if (action === 'soft_deleted') {
    query = query.not('deleted_at', 'is', null);
  } else if (action === 'failed_imports') {
    query = query.eq('import_status', 'failed');
  } else {
    return NextResponse.json({ success: false, error: 'Unknown cleanup action' }, { status: 400 });
  }

  const { data, error } = await query.select('id');
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, deleted: data?.length || 0 });
}
