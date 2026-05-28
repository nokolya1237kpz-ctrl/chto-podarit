import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { supabaseAdmin } from '@lib/supabase';
import { withTimeout } from '@lib/utils/timeout';

export const dynamic = 'force-dynamic';

async function checkSupabase() {
  if (!supabaseAdmin) return { ok: false, message: 'Supabase service client не настроен' };
  const started = Date.now();
  const result = await withTimeout(
    Promise.resolve(supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).limit(1)),
    3000,
    { error: new Error('timeout') } as any
  );
  return {
    ok: !result.error,
    latencyMs: Date.now() - started,
    message: result.error ? result.error.message : 'Подключение работает',
  };
}

export async function GET() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  const supabase = await checkSupabase();
  const env = {
    vercel: Boolean(process.env.VERCEL),
    nodeEnv: process.env.NODE_ENV,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    epnConfigured: Boolean(process.env.EPN_CLIENT_ID && process.env.EPN_CLIENT_SECRET),
    admitadConfigured: Boolean(process.env.ADMITAD_CLIENT_ID && process.env.ADMITAD_CLIENT_SECRET),
  };

  return NextResponse.json({
    success: true,
    data: {
      app: { ok: true, timestamp: new Date().toISOString() },
      supabase,
      env,
      apiHealth: { ok: true, endpoint: '/api/health' },
      providers: [
        { id: 'local_catalog', label: 'Локальный каталог', status: supabase.ok ? 'Работает' : 'Ограничен' },
        { id: 'epn', label: 'ePN', status: env.epnConfigured ? 'Настроен' : 'Требуется ENV' },
        { id: 'admitad', label: 'Admitad', status: env.admitadConfigured ? 'Настроен' : 'Требуется ENV' },
        { id: 'live_parsers', label: 'Live parser providers', status: 'Только в админке / optional' },
      ],
      lastErrors: supabase.ok ? [] : [supabase.message],
    },
  });
}
