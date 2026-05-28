'use client';

import { useQuery } from '@tanstack/react-query';
import AdminPageShell from '@widgets/admin-page-shell/AdminPageShell';
import { InlineError, RetryButton } from '@components/ui';

async function fetchStatus() {
  const response = await fetch('/api/admin/system-status');
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error || 'Не удалось загрузить статус');
  return body.data;
}

export default function SystemStatusPageFeature() {
  const query = useQuery({
    queryKey: ['system-status'],
    queryFn: fetchStatus,
    staleTime: 30_000,
    retry: 1,
  });
  const data = query.data;

  return (
    <AdminPageShell title="Статус системы">
      {query.error ? (
        <div className="mb-4 space-y-3">
          <InlineError message={query.error instanceof Error ? query.error.message : 'Ошибка диагностики'} />
          <RetryButton onRetry={() => query.refetch()} />
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard title="Приложение" ok={data?.app?.ok} text={data?.app?.timestamp || 'Проверка...'} />
        <StatusCard title="Supabase" ok={data?.supabase?.ok} text={data?.supabase?.message || 'Проверка...'} />
        <StatusCard title="API health" ok={data?.apiHealth?.ok} text="/api/health" />
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <h2 className="text-xl font-semibold text-white">ENV и домен</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.entries(data?.env || {}).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
              <span className="text-white/60">{key}</span>
              <span className="font-semibold text-white">{String(value)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <h2 className="text-xl font-semibold text-white">Источники</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(data?.providers || []).map((provider: any) => (
            <div key={provider.id} className="rounded-2xl bg-white/5 p-4">
              <div className="font-semibold text-white">{provider.label}</div>
              <div className="mt-2 text-sm text-white/60">{provider.status}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-cyan-300/15 bg-cyan-400/10 p-5 text-sm text-cyan-50">
        <h2 className="text-lg font-semibold">Рекомендация для РФ и нестабильных регионов</h2>
        <p className="mt-2 leading-6">
          Если сайт размещён на Vercel и без VPN открывается нестабильно, лучше подключить Cloudflare перед доменом:
          DNS proxy, HTTPS, cache для статических ресурсов и единый canonical-домен без смешанного контента.
        </p>
      </section>
    </AdminPageShell>
  );
}

function StatusCard({ title, ok, text }: { title: string; ok?: boolean; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold text-white">{title}</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ok ? 'bg-emerald-500/15 text-emerald-100' : 'bg-amber-500/15 text-amber-100'}`}>
          {ok ? 'Работает' : 'Ограничен'}
        </span>
      </div>
      <p className="mt-3 text-sm text-white/55">{text}</p>
    </div>
  );
}
