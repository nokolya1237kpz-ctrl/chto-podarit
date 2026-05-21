'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Product } from '@/types/product';

type SearchResponse = {
  success: boolean;
  query: string;
  sourceStats: Record<string, { count: number; status: string; error?: string }>;
  data: Product[];
  groups: Array<{ id: string; title: string; imageUrl?: string; items: Product[]; cheapest?: Product }>;
  cheapest?: Product;
  count: number;
  diagnostics?: any[];
  error?: string;
};

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareShellFallback />}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [marketplace, setMarketplace] = useState('');
  const [sort, setSort] = useState('price_asc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function runSearch(nextQuery = query) {
    if (!nextQuery.trim()) {
      setMessage('Введите название товара для сравнения');
      return;
    }
    setLoading(true);
    setMessage('');
    const params = new URLSearchParams({ q: nextQuery, sort });
    if (marketplace) params.set('marketplace', marketplace);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    try {
      const res = await fetch(`/api/compare/search?${params.toString()}`);
      const body = await res.json();
      setData(body);
      if (!body.success) setMessage(body.error || 'Ошибка поиска');
    } finally {
      setLoading(false);
    }
  }

  async function search(event?: React.FormEvent) {
    event?.preventDefault();
    window.history.replaceState(null, '', `/compare?q=${encodeURIComponent(query)}`);
    await runSearch(query);
  }

  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (!urlQuery) return;
    setQuery(urlQuery);
    void runSearch(urlQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function importProduct(product: Product) {
    setMessage('');
    const res = await fetch('/api/compare/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    });
    const body = await res.json();
    setMessage(body.success ? `Добавлено: ${body.data?.title || product.title}` : body.error || 'Не удалось добавить товар');
  }

  async function logClick(product: Product) {
    const url = product.affiliateUrl || product.originalUrl || '';
    await fetch('/api/analytics/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, marketplace: product.marketplace, url, sourcePage: '/compare' }),
    }).catch(() => {});
  }

  const groups = useMemo(() => data?.groups || [], [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Compare</p>
          <h1 className="mt-3 text-4xl font-bold">Сравнение цен</h1>
          <form onSubmit={search} className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_140px_140px_160px_auto]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Наушники, косметика, автоаксессуары..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" />
            <select value={marketplace} onChange={(event) => setMarketplace(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
              <option value="">Все</option>
              <option value="wildberries">WB</option>
              <option value="ozon">Ozon</option>
              <option value="aliexpress">AliExpress</option>
              <option value="yandex_market">Маркет</option>
            </select>
            <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="от" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" />
            <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="до" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" />
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
              <option value="price_asc">Сначала дешевые</option>
              <option value="relevance">Релевантность</option>
            </select>
            <button disabled={loading} className="rounded-2xl bg-purple-600 px-5 py-3 font-semibold disabled:opacity-50">{loading ? 'Поиск...' : 'Найти'}</button>
          </form>
          {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">{message}</div> : null}
          {data?.sourceStats ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(data.sourceStats).map(([source, stat]) => (
                <span key={source} className={`rounded-full px-3 py-1 text-xs font-semibold ${stat.status === 'limited' ? 'bg-amber-500/15 text-amber-100' : stat.status === 'error' ? 'bg-red-500/15 text-red-100' : 'bg-white/5 text-cyan-100'}`}>
                  {source}: {stat.count} {stat.status}
                </span>
              ))}
            </div>
          ) : null}
          {data?.diagnostics?.length ? (
            <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4">
              <summary className="cursor-pointer text-sm font-semibold">Source stats и diagnostics</summary>
              <pre className="mt-3 max-h-72 max-w-full overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">{JSON.stringify({ sourceStats: data.sourceStats, diagnostics: data.diagnostics }, null, 2)}</pre>
            </details>
          ) : null}
        </section>

        {loading ? <Skeleton /> : null}

        <section className="mt-8 space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold">{group.title}</h2>
                <span className="text-sm text-slate-400">{group.items.length} предложений</span>
              </div>
              <div className="mt-4 grid gap-4">
                {group.items.map((product, index) => {
                  const url = product.affiliateUrl || product.originalUrl || '#';
                  return (
                    <article key={`${group.id}-${product.id}-${index}`} className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 md:grid-cols-[120px_1fr_auto]">
                      <div className="flex h-28 items-center justify-center rounded-2xl bg-white">
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="h-full w-full object-contain p-2" /> : null}
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {index === 0 ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">Лучшая цена</span> : null}
                          {product.affiliateUrl ? <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-100">Партнёрская ссылка</span> : null}
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-100">{product.marketplace}</span>
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">Быстрая доставка</span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold">{product.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-400">{product.description || 'Описание появится после импорта.'}</p>
                      </div>
                      <div className="flex flex-col justify-center gap-3 md:items-end">
                        <div className="text-2xl font-bold">{Math.round(product.price || 0).toLocaleString('ru-RU')} ₽</div>
                        {product.oldPrice ? <div className="text-sm text-slate-500 line-through">{Math.round(product.oldPrice).toLocaleString('ru-RU')} ₽</div> : null}
                        <a onClick={() => logClick(product)} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-5 py-3 text-sm font-semibold">
                          Купить дешевле
                        </a>
                        <button onClick={() => importProduct(product)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-100">
                          Добавить в товары
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
          {!loading && data && groups.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center text-slate-300">
              <p className="text-lg font-semibold text-white">Пока ничего не найдено</p>
              <p className="mt-2 text-sm text-slate-400">Если внешний источник ограничил запрос, причина будет в diagnostics. Локальные товары появятся здесь, когда совпадут с запросом.</p>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CompareShellFallback() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28">
        <div className="h-56 animate-pulse rounded-[2rem] bg-white/5" />
      </main>
      <Footer />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-8 grid gap-4">
      {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-3xl bg-white/5" />)}
    </div>
  );
}
