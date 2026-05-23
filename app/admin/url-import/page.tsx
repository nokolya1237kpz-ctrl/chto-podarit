'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

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
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold">Импорт по ссылкам</h2>
          <p className="mt-2 text-sm text-slate-400">До 100 публичных ссылок товаров за раз. Если нет цены или картинки, товар сохранится как черновик.</p>
          <textarea
            value={urls}
            onChange={(event) => setUrls(event.target.value)}
            placeholder="https://www.ozon.ru/product/...\nhttps://www.wildberries.ru/catalog/.../detail.aspx"
            className="mt-4 min-h-72 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
          />
          <button disabled={loading} onClick={importUrls} className="mt-4 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? 'Импортируем...' : 'Импортировать ссылки'}
          </button>
        </section>
        {reports.length ? <ReportTable reports={reports} /> : null}
      </div>
    </AdminShell>
  );
}

function ReportTable({ reports }: { reports: any[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold">Отчёт</h2>
      <div className="table-shell mt-4">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="p-2">URL</th>
              <th className="p-2">Маркетплейс</th>
              <th className="p-2">Название</th>
              <th className="p-2">Картинка</th>
              <th className="p-2">Цена</th>
              <th className="p-2">Активен</th>
              <th className="p-2">Черновик</th>
              <th className="p-2">Ошибка</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((row, index) => (
              <tr key={index} className="border-t border-white/10">
                <td className="max-w-xs truncate p-2">{row.url}</td>
                <td className="p-2">{row.marketplace}</td>
                <td className="p-2">{row.titleFound ? 'да' : 'нет'}</td>
                <td className="p-2">{row.imageFound ? 'да' : 'нет'}</td>
                <td className="p-2">{row.priceFound ? 'да' : 'нет'}</td>
                <td className="p-2">{row.createdActive ? 'да' : 'нет'}</td>
                <td className="p-2">{row.createdDraft ? 'да' : 'нет'}</td>
                <td className="p-2 text-rose-200">{row.error || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
