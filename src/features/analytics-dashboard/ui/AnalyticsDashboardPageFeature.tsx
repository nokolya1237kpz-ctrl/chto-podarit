'use client';

import { useQuery } from '@tanstack/react-query';
import AdminPageShell from '@widgets/admin-page-shell/AdminPageShell';
import { DataTable, InlineError, RetryButton } from '@components/ui';

async function fetchAnalytics() {
  const response = await fetch('/api/admin/analytics');
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error || 'Не удалось загрузить аналитику');
  return body.data;
}

export default function AnalyticsDashboardPageFeature() {
  const query = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: fetchAnalytics,
    staleTime: 60_000,
    retry: 1,
  });
  const data = query.data;

  return (
    <AdminPageShell title="Аналитика">
      {query.error ? (
        <div className="mb-4 space-y-3">
          <InlineError message={query.error instanceof Error ? query.error.message : 'Ошибка аналитики'} />
          <RetryButton onRetry={() => query.refetch()} />
        </div>
      ) : null}

      {data?.error ? (
        <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          {data.error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Stat title="События" value={data?.totalEvents || 0} />
        <Stat title="Квизы" value={data?.giftQuizStats?.count || 0} />
        <Stat title="Избранное" value={data?.favoritesCount || 0} />
        <Stat title="Watchlist" value={data?.watchlistCount || 0} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Топ поисков"><SimpleList items={data?.topSearches || []} /></Panel>
        <Panel title="Топ категорий"><SimpleList items={data?.topCategories || []} /></Panel>
        <Panel title="Маркетплейсы"><SimpleList items={data?.topMarketplaces || []} /></Panel>
        <Panel title="События"><SimpleList items={data?.byEvent || []} /></Panel>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-semibold text-white">Ошибки импорта</h2>
        <DataTable
          data={data?.importErrors || []}
          loading={query.isLoading}
          compact
          emptyTitle="Ошибок импорта нет"
          emptyDescription="Когда импорт вернёт ошибку, она появится здесь."
          getRowKey={(event: any) => event.id}
          columns={[
            { key: 'date', header: 'Дата', cell: (event: any) => new Date(event.created_at).toLocaleString('ru-RU') },
            { key: 'source', header: 'Источник', cell: (event: any) => event.metadata?.source || '—' },
            { key: 'reason', header: 'Причина', cell: (event: any) => event.metadata?.reason || '—' },
            { key: 'rows', header: 'Строки', cell: (event: any) => `${event.metadata?.rows_failed || 0}/${event.metadata?.rows_total || 0}` },
          ]}
        />
      </section>
    </AdminPageShell>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-white/45">{title}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value.toLocaleString('ru-RU')}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SimpleList({ items }: { items: Array<{ label: string; count: number }> }) {
  if (!items.length) return <p className="text-sm text-white/45">Пока нет данных</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
          <span className="min-w-0 truncate text-sm text-white/80">{item.label}</span>
          <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-100">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
