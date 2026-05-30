import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { MARKETPLACE_SEARCH_LINKS_SETTING } from '@entities/marketplace/lib/buildMarketplaceSearchLinks';

export async function GET() {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: true, data: { enableMarketplaceSearchLinks: true }, storage: 'fallback' });
  }

  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', MARKETPLACE_SEARCH_LINKS_SETTING)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: true, data: { enableMarketplaceSearchLinks: true }, storage: 'fallback' });
  }

  return NextResponse.json({
    success: true,
    data: { enableMarketplaceSearchLinks: data?.value !== false },
    storage: 'supabase',
  });
}

export async function PATCH(request: NextRequest) {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, error: 'База данных не настроена' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.enableMarketplaceSearchLinks !== 'boolean') {
    return NextResponse.json({ success: false, error: 'Некорректное значение настройки' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('app_settings')
    .upsert({
      key: MARKETPLACE_SEARCH_LINKS_SETTING,
      value: body.enableMarketplaceSearchLinks,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

  if (error) {
    return NextResponse.json({
      success: false,
      error: 'Не удалось сохранить настройку. Примените миграцию app_settings.',
    }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { enableMarketplaceSearchLinks: body.enableMarketplaceSearchLinks } });
}

