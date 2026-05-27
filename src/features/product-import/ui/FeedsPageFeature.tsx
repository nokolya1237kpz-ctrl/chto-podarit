'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { FeedImportForm } from './FeedImportForm';
import { FeedImportReport } from './FeedImportReport';

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
          <FeedImportForm url={url} format={format} marketplace={marketplace} scheduleDaily={scheduleDaily} loading={loading} onUrlChange={setUrl} onFormatChange={setFormat} onMarketplaceChange={setMarketplace} onScheduleChange={setScheduleDaily} onImport={importFeed} />
          <FeedImportReport error={error} message={message} lastLoad={lastLoad} scheduleDaily={scheduleDaily} />
        </section>
      </div>
    </AdminShell>
  );
}
