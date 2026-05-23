'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

export default function FeedsPage() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('auto');
  const [marketplace, setMarketplace] = useState('feed');
  const [scheduleDaily, setScheduleDaily] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastLoad, setLastLoad] = useState('');

  async function importFeed() {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/feeds/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format, marketplace, scheduleDaily }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Импорт фида не выполнен');
      setLastLoad(data.lastSuccessfulLoadAt || '');
      setMessage(`Импортировано ${data.imported || 0}, черновиков ${data.drafted || 0}, ошибок ${data.failed || 0}. Синхронизация: ${data.schedule === 'daily' ? 'ежедневно' : 'вручную'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта фида');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell title="Фиды">
      <div className="space-y-6">
        {message ? <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold">Фиды товаров</h2>
          <p className="mt-2 text-sm text-slate-400">YML/XML/CSV/JSON фид — самый стабильный источник для большого каталога.</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/feed.xml" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
            <input value={marketplace} onChange={(event) => setMarketplace(event.target.value)} placeholder="Маркетплейс: ozon, wb, shop..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
            <select value={format} onChange={(event) => setFormat(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
              <option value="auto">Авто</option>
              <option value="xml">YML/XML</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" checked={scheduleDaily} onChange={(event) => setScheduleDaily(event.target.checked)} />
              Ежедневная синхронизация
            </label>
          </div>
          <button disabled={loading} onClick={importFeed} className="mt-5 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? 'Импортируем...' : 'Запустить импорт'}
          </button>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Status label="Статус" value={error ? 'Ошибка' : message ? 'Работает' : 'Требуется фид'} />
            <Status label="Последняя успешная загрузка" value={lastLoad || '—'} />
            <Status label="Расписание" value={scheduleDaily ? 'ежедневно' : 'вручную'} />
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
