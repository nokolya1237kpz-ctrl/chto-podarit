'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { UrlImportForm } from './UrlImportForm';
import { UrlImportReport } from './UrlImportReport';

export default function UrlImportPage() {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reports, setReports] = useState<any[]>([]);

  async function importUrls() {
    setLoading(true);
    setMessage('');
    setError('');
    setReports([]);
    try {
      const response = await fetch('/api/admin/bulk-import/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urls.split(/\s+/).map((item) => item.trim()).filter(Boolean) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Импорт ссылок не выполнен');
      setReports(data.reports || []);
      setMessage(`Готово: импортировано ${data.imported || 0}, активных ${data.active || 0}, черновиков ${data.drafted || 0}, ошибок ${data.failed || 0}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell title="Импорт по ссылкам">
      <div className="space-y-6">
        {message ? <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}
        <UrlImportForm urls={urls} loading={loading} onChange={setUrls} onImport={importUrls} />
        <UrlImportReport reports={reports} />
      </div>
    </AdminShell>
  );
}
