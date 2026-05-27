'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { BulkImportPresetButtons, type BulkImportPreset } from './BulkImportPresetButtons';
import { BulkImportReport } from './BulkImportReport';

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
  const [activeTab, setActiveTab] = useState('links');

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
      setReportRows(data.rows || data.reports || []);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Импорт не выполнен');
      }
      setMessage(`${name}: импортировано ${data.imported || 0}, обновлено ${data.updated || 0}, активных ${data.importedActive || 0}, черновиков ${data.importedDraft || data.drafted || 0}, дублей пропущено ${data.skippedDuplicate || 0}, ошибок ${data.errors || data.failed || 0}`);
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Ошибка импорта';
      setError(text.includes('captcha') || text.includes('капчу') ? 'ePN временно требует капчу. Остановите импорт и попробуйте позже.' : text);
    } finally {
      setLoading('');
    }
  }

  return (
    <AdminShell title="Массовый импорт">
      <div className="space-y-6">
        {message ? <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}

        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
          <div className="flex flex-wrap gap-2">
            {[
              ['links', 'По ссылкам'],
              ['file', 'Файл CSV/XLSX'],
              ['feed', 'Фид'],
              ['search', 'Поисковый API'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`rounded-2xl px-4 py-2 text-sm font-semibold ${activeTab === id ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {activeTab === 'search' ? <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Поисковый API / ePN</h2>
            <p className="mt-2 text-sm text-slate-400">Поисковый API растит базу из публичных ссылок. ePN используем аккуратно: одобренные офферы, креативы, горячие товары и пауза при ограничениях.</p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Запрос: наушники, косметика..."
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
                Горячие товары
              </button>
              <button
                disabled={loading === '10 товаров'}
                onClick={() => runImport('10 товаров', '/api/admin/bulk-import/preset', { queries: defaultCategories, limit: 10 })}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                Импортировать 10 товаров
              </button>
            </div>
            <BulkImportPresetButtons presets={presetButtons} loading={loading} onRun={(preset: BulkImportPreset) => runImport(preset.label, '/api/admin/bulk-import/preset', { queries: preset.queries, limit: 10 })} />
          </div> : null}

          {activeTab === 'feed' ? <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Фиды</h2>
            <p className="mt-2 text-sm text-slate-400">JSON, CSV, XML, YML, Google Merchant и RSS-подобные фиды.</p>
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
              Импортировать фид
            </button>
            <a href="/admin/feeds" className="ml-3 inline-flex rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-white">Открыть фиды</a>
          </div> : null}

          {activeTab === 'links' ? <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">По ссылкам</h2>
            <p className="mt-2 text-sm text-slate-400">Главный устойчивый путь: публичные страницы товаров, metadata/JSON-LD, черновик если не хватает цены или картинки.</p>
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
              Импортировать ссылки
            </button>
            <a href="/admin/url-import" className="ml-3 inline-flex rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-white">Открыть импорт по ссылкам</a>
          </div> : null}

          {activeTab === 'file' ? <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Файл CSV/XLSX/JSON</h2>
            <p className="mt-2 text-sm text-slate-400">Самый быстрый способ загрузить 1000+ товаров с предпросмотром и сопоставлением колонок.</p>
            <a href="/admin/import-file" className="mt-4 inline-flex rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white">Открыть импорт файла</a>
          </div> : null}

          {activeTab === 'search' ? <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Импортировать категории</h2>
            <p className="mt-2 text-sm text-slate-400">Для быстрого старта лучше поисковый API, фиды и импорт по ссылкам. Прямой парсер маркетплейсов необязателен.</p>
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
          </div> : null}

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Быстрый старт</h2>
            <p className="mt-2 text-sm text-slate-400">Подготовленный демо-каталог на 300 товаров: реальные названия и категории, без фейковых ссылок, всё сохраняется в черновики.</p>
            <button
              disabled={loading === 'demo catalog'}
              onClick={() => runImport('demo catalog', '/api/admin/demo-catalog', {})}
              className="mt-4 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              Загрузить демо-каталог 300 товаров
            </button>
          </div>
        </section>
        <BulkImportReport rows={reportRows} />
      </div>
    </AdminShell>
  );
}
