'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

const defaultCategories = [
  'Наушники',
  'Косметика',
  'Подарки девушке',
  'Техника для кухни',
  'Игровые аксессуары',
  'Спорт',
  'Товары для авто',
  'Автоаксессуары',
  'Игрушки',
  'Дом и уют',
  'Гаджеты',
  'Книги',
];

const presetButtons = [
  { label: 'Импортировать косметику', queries: ['помада', 'косметика', 'уход за лицом', 'тушь', 'крем'] },
  { label: 'Импортировать электронику', queries: ['наушники', 'смарт часы', 'гаджеты', 'колонка bluetooth', 'power bank'] },
  { label: 'Импортировать товары TikTok', queries: ['tiktok тренд', 'viral beauty', 'популярный массажер', 'необычный подарок', 'хит продаж'] },
  { label: 'Импортировать товары Ozon', queries: ['ozon наушники', 'ozon кухня', 'ozon подарок'] },
  { label: 'Импортировать товары WB', queries: ['wildberries косметика', 'wildberries фитнес', 'wildberries подарок'] },
];

export default function BulkImportPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [query, setQuery] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [manualUrls, setManualUrls] = useState('');
  const [categories, setCategories] = useState(defaultCategories.join('\n'));
  const [reportRows, setReportRows] = useState<any[]>([]);

  async function runImport(name: string, url: string, body: any) {
    setLoading(name);
    setMessage('');
    setError('');

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Импорт не выполнен');
      }
      setMessage(`${name}: импортировано ${data.imported || 0}, обновлено ${data.updated || 0}, active ${data.importedActive || 0}, draft ${data.importedDraft || data.drafted || 0}, skipped duplicates ${data.skippedDuplicate || 0}, ошибок ${data.errors || data.failed || 0}`);
      setReportRows(data.rows || data.reports || []);
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Ошибка импорта';
      setError(text.includes('captcha') || text.includes('капчу') ? 'ePN временно требует капчу. Остановите импорт и попробуйте позже.' : text);
    } finally {
      setLoading('');
    }
  }

  return (
    <AdminShell title="Bulk import">
      <div className="space-y-6">
        {message ? <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">ePN mass import</h2>
            <p className="mt-2 text-sm text-slate-400">API-first импорт hot/trending товаров с dedupe и авторазметкой.</p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="search query: наушники, косметика..."
              className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                disabled={loading === 'ePN hot'}
                onClick={() => runImport('ePN hot', '/api/admin/epn/import-hot', { query, limit: 10, withOffers: true })}
                className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Импортировать ePN hot
              </button>
              <button
                disabled={loading === 'ePN trending'}
                onClick={() => runImport('ePN trending', '/api/admin/epn/import-hot', { query: query || 'подарок', limit: 10 })}
                className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                Hot/trending
              </button>
              <button
                disabled={loading === '10 товаров'}
                onClick={() => runImport('10 товаров', '/api/admin/bulk-import/preset', { queries: defaultCategories, limit: 10 })}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                Импортировать 10 товаров
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {presetButtons.map((preset) => (
                <button
                  key={preset.label}
                  disabled={loading === preset.label}
                  onClick={() => runImport(preset.label, '/api/admin/bulk-import/preset', { queries: preset.queries, limit: 10 })}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Feeds</h2>
            <p className="mt-2 text-sm text-slate-400">JSON, CSV, XML, YML, Google Merchant и RSS-like feeds.</p>
            <input
              value={feedUrl}
              onChange={(event) => setFeedUrl(event.target.value)}
              placeholder="https://example.com/feed.xml"
              className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            />
            <button
              disabled={loading === 'feed'}
              onClick={() => runImport('feed', '/api/admin/bulk-import/feed', { url: feedUrl, sourceProvider: 'feed' })}
              className="mt-4 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Импортировать feed URL
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Manual URL fallback</h2>
            <p className="mt-2 text-sm text-slate-400">Только публичные страницы из allowlist, с cache и crawl delay.</p>
            <textarea
              value={manualUrls}
              onChange={(event) => setManualUrls(event.target.value)}
              placeholder="Один URL на строку"
              className="mt-4 min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            />
            <button
              disabled={loading === 'URL'}
              onClick={() => runImport('URL', '/api/admin/bulk-import/url', { urls: manualUrls.split(/\s+/).filter(Boolean) })}
              className="mt-4 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Импортировать URL
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Импортировать категории</h2>
            <p className="mt-2 text-sm text-slate-400">Массовая генерация ассортимента через ePN hot goods.</p>
            <textarea
              value={categories}
              onChange={(event) => setCategories(event.target.value)}
              className="mt-4 min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            />
            <button
              disabled={loading === 'categories'}
              onClick={() => runImport('categories', '/api/admin/bulk-import/categories', { categories: categories.split('\n').map((item) => item.trim()).filter(Boolean), perCategory: 1 })}
              className="mt-4 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              Импортировать категории
            </button>
          </div>
        </section>
        {reportRows.length > 0 ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Отчёт импорта</h2>
              <div className="flex gap-3">
                <a href="/admin/products" className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white">Открыть товары</a>
                <a href="/admin/drafts" className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white">Открыть черновики</a>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-400">
                  <tr>
                    <th className="p-2">source</th>
                    <th className="p-2">query/url</th>
                    <th className="p-2">found</th>
                    <th className="p-2">active</th>
                    <th className="p-2">draft</th>
                    <th className="p-2">skipped</th>
                    <th className="p-2">error</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, index) => (
                    <tr key={index} className="border-t border-white/10">
                      <td className="p-2">{row.source || row.status || 'manual'}</td>
                      <td className="p-2">{row.query || row.url}</td>
                      <td className="p-2">{row.found ?? row.foundRaw ?? '—'}</td>
                      <td className="p-2">{row.active ?? row.importedActive ?? (row.status === 'active' ? 1 : 0)}</td>
                      <td className="p-2">{row.draft ?? row.importedDraft ?? (row.status === 'draft' ? 1 : 0)}</td>
                      <td className="p-2">{(row.skippedDuplicate || 0) + (row.skippedQuality || 0)}</td>
                      <td className="p-2 text-rose-200">{row.error || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
