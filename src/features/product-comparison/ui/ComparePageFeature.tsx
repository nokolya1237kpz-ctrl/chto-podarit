'use client';

import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Product } from '@entities/product/types';
import { InlineError, RetryButton } from '@components/ui';
import { normalizeCompareResults } from '../lib/normalizeCompareResults';
import { useCompareStore } from '../model/store';
import { searchCompareProducts } from '../api/searchCompareProducts';
import { CompareDiagnostics } from './CompareDiagnostics';
import { CompareLoadingState } from './CompareLoadingState';
import { CompareResults } from './CompareResults';
import { CompareSearchForm } from './CompareSearchForm';
import { useTrackEvent } from '@/src/hooks/useTrackEvent';
import { MarketplaceSearchLinks } from '@entities/marketplace/ui/MarketplaceSearchLinks';

export default function ComparePageFeature() {
  return (
    <Suspense fallback={<CompareShellFallback />}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const filters = useCompareStore();
  const { setField } = filters;
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [message, setMessage] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const trackEvent = useTrackEvent();

  const queryFilters = useMemo(() => ({ ...filters, query: submittedQuery }), [filters, submittedQuery]);
  const compareQuery = useQuery({
    queryKey: ['compare-search', queryFilters.query, queryFilters.marketplace, queryFilters.sort, queryFilters.minPrice, queryFilters.maxPrice],
    queryFn: () => searchCompareProducts(queryFilters),
    enabled: Boolean(submittedQuery.trim()),
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  const importMutation = useMutation({
    mutationFn: async (product: Product) => {
      const res = await fetch('/api/compare/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || 'Не удалось добавить товар');
      return body;
    },
    onSuccess: (body) => setMessage(`Добавлено: ${body.data?.title || 'товар'}`),
    onError: (error) => setMessage(error instanceof Error ? error.message : 'Не удалось добавить товар'),
  });

  async function search(event?: FormEvent) {
    event?.preventDefault();
    if (!filters.query.trim()) {
      setMessage('Введите название товара для сравнения');
      return;
    }
    setMessage('');
    window.history.replaceState(null, '', `/compare?q=${encodeURIComponent(filters.query)}`);
    setSubmittedQuery(filters.query);
    saveSearch(filters.query);
  }

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem('favoriteProducts') || '[]'));
    setWatchlist(JSON.parse(localStorage.getItem('priceWatchlist') || '[]'));
    const urlQuery = searchParams.get('q') || '';
    if (!urlQuery) return;
    setField('query', urlQuery);
    setSubmittedQuery(urlQuery);
    saveSearch(urlQuery);
  }, [searchParams, setField]);

  async function importProduct(product: Product) {
    setMessage('');
    importMutation.mutate(product);
  }

  async function logClick(product: Product) {
    const url = product.affiliateUrl || product.originalUrl || '';
    trackEvent('compare_result_click', {
      productId: product.id,
      query: submittedQuery,
      category: product.categorySlug || product.categoryLabel,
      marketplace: product.marketplace,
      metadata: {
        product_id: product.id,
        marketplace: product.marketplace,
        source_page: '/compare',
        query: submittedQuery,
        price: product.price,
      },
    });
    await fetch('/api/analytics/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, marketplace: product.marketplace, url, sourcePage: '/compare', query: submittedQuery, category: product.categorySlug || product.categoryLabel, price: product.price }),
    }).catch(() => {});
  }

  const data = compareQuery.data || null;
  const normalized = useMemo(() => normalizeCompareResults(data), [data]);
  const loading = compareQuery.isFetching;

  function saveSearch(value: string) {
    const stored = JSON.parse(localStorage.getItem('savedCompareSearches') || '[]') as string[];
    const next = [value, ...stored.filter((item) => item !== value)].slice(0, 20);
    localStorage.setItem('savedCompareSearches', JSON.stringify(next));
  }

  function toggleStored(key: 'favoriteProducts' | 'priceWatchlist', product: Product) {
    const id = String(product.id || product.externalProductId || product.originalUrl);
    const current = JSON.parse(localStorage.getItem(key) || '[]') as string[];
    const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current].slice(0, 200);
    localStorage.setItem(key, JSON.stringify(next));
    if (key === 'favoriteProducts') setFavorites(next);
    if (key === 'priceWatchlist') setWatchlist(next);
    trackEvent(key === 'favoriteProducts'
      ? next.includes(id) ? 'favorite_add' : 'favorite_remove'
      : next.includes(id) ? 'price_watch_add' : 'price_watch_remove', {
      productId: product.id,
      category: product.categorySlug || product.categoryLabel,
      marketplace: product.marketplace,
      metadata: {
        product_id: product.id,
        target_price: product.price,
        marketplace: product.marketplace,
        category: product.categoryLabel || product.categorySlug,
      },
    });
    localStorage.setItem(`priceSnapshot:${id}`, JSON.stringify({
      price: product.price,
      oldPrice: product.oldPrice,
      savedAt: new Date().toISOString(),
      title: product.title,
    }));
  }

  function priceNote(product: Product) {
    const id = String(product.id || product.externalProductId || product.originalUrl);
    const snapshot = JSON.parse(localStorage.getItem(`priceSnapshot:${id}`) || 'null');
    if (!snapshot?.price || !product.price || snapshot.price === product.price) return 'Следим за ценой';
    return product.price < snapshot.price ? 'Цена упала' : 'Цена выросла';
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="mx-auto max-w-7xl overflow-x-hidden px-4 pb-20 pt-28">
        <CompareSearchForm filters={filters} loading={loading} onChange={setField} onSubmit={search} />
        {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">{message}</div> : null}
        {compareQuery.error ? (
          <div className="mt-4 space-y-3">
            <InlineError message={friendlyError(compareQuery.error instanceof Error ? compareQuery.error.message : 'Ошибка поиска')} />
            <RetryButton onRetry={() => compareQuery.refetch()} />
          </div>
        ) : null}
        {normalized.hasLimitedSources ? (
          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm text-amber-100">
            Источник временно недоступен. Показываем доступные результаты из каталога.
          </div>
        ) : null}
        {normalized.hasOnlyCatalogSources ? (
          <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">
            Пока сравниваем по товарам из каталога. Добавьте больше источников или импортируйте фиды.
          </div>
        ) : null}
        <CompareDiagnostics data={data} />
        {loading ? <CompareLoadingState /> : null}
        <CompareResults
          groups={normalized.groups}
          dataLoaded={Boolean(data)}
          loading={loading}
          favorites={favorites}
          watchlist={watchlist}
          onImport={importProduct}
          onLogClick={logClick}
          onToggleStored={toggleStored}
          getPriceNote={priceNote}
        />
        {submittedQuery ? <MarketplaceSearchLinks query={submittedQuery} /> : null}
      </main>
      <Footer />
    </div>
  );
}

function friendlyError(error: string) {
  if (/failed to fetch|network|fetch/i.test(error)) {
    return 'Не удалось получить данные. Источник временно ограничил запросы или недоступен.';
  }
  return error;
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
