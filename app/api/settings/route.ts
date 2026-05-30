import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { MARKETPLACE_SEARCH_LINKS_SETTING } from '@entities/marketplace/lib/buildMarketplaceSearchLinks';

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ enableMarketplaceSearchLinks: true });
  }

  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', MARKETPLACE_SEARCH_LINKS_SETTING)
    .maybeSingle();

  if (error || data?.value === undefined) {
    return NextResponse.json({ enableMarketplaceSearchLinks: true });
  }

  return NextResponse.json({ enableMarketplaceSearchLinks: data.value !== false });
}

