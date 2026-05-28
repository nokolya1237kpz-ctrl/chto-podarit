import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@lib/supabase';
import { withTimeout } from '@lib/utils/timeout';

export const dynamic = 'force-dynamic';

async function checkSupabase() {
  if (!supabaseAdmin) return false;
  const result = await withTimeout(
    Promise.resolve(supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).limit(1)),
    3000,
    { error: new Error('timeout') } as any
  );
  return !result.error;
}

export async function GET() {
  const supabase = await checkSupabase();
  return NextResponse.json({
    ok: true,
    app: true,
    supabase,
    timestamp: new Date().toISOString(),
  });
}
