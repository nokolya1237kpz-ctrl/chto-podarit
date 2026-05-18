'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

type AdmitadStatus = {
  success: boolean;
  connected: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  tokenReceived: boolean;
  message: string;
  error?: string;
};

type SearchResult = {
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalUrl: string;
  affiliateUrl: string;
  marketplace: string;
  brand?: string;
  currency: string;
  wowRating: number;
  sourceProductId: string;
};

export default function AdmitadStatusPage() {
  const [status, setStatus] = useState<AdmitadStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    setIsChecking(true);
    setError('');
    setInfo('');

    try {
      const res = await fetch('/api/admin/admitad/status');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка проверки статуса');
      }

      setStatus(data);
      setInfo(data.message || 'Статус получен');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Не удалось проверить статус');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setSearchResults([]);

    if (!searchQuery.trim()) {
      setError('Введите поисковой запрос');
      return;
    }

    setIsSearching(true);

    try {
      const res = await fetch(`/api/admin/admitad/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка поиска');
      }

      setSearchResults(data.products || []);
      setInfo(data.count ? `Найдено ${data.count} товаров` : 'Результаты поиска получены');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Поиск не удался');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AdminShell title="Admitad API">
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="glass rounded-3xl p-6 space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">Проверка подключения</p>
              <h2 className="text-2xl font-semibold text-white mt-2">Статус Admitad</h2>
            </div>

            {status ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <StatusRow label="Client ID" value={status.hasClientId ? 'ключ найден' : 'ключ отсутствует'} />
                <StatusRow label="Client Secret" value={status.hasClientSecret ? 'ключ найден' : 'ключ отсутствует'} />
                <StatusRow label="Токен" value={status.tokenReceived ? 'получен' : 'не получен'} />
                <StatusRow label="Подключение" value={status.connected ? 'успешно' : 'отключено'} />
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-slate-300">Статус подключения будет показан здесь.</div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={refreshStatus}
                disabled={isChecking}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isChecking ? 'Проверка...' : 'Проверить подключение'}
              </button>
            </div>

            <div className="space-y-3">
              {info && <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-200">{info}</div>}
              {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
              {status?.error && !error && (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">{status.error}</div>
              )}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Тестовый поиск</p>
            <h3 className="text-xl font-semibold text-white mt-2">Поиск товаров</h3>
            <p className="text-sm text-slate-400">Введите запрос и выполните тестовый поиск через Admitad API.</p>

            <form onSubmit={handleSearch} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-200">Поисковый запрос</label>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Например: наушники"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isSearching ? 'Идёт поиск...' : 'Поиск'}
              </button>
            </form>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-slate-400">Результаты поиска</p>
              <h3 className="text-xl font-semibold text-white">Товары Admitad</h3>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Первые 5 результатов</span>
          </div>

          {isSearching ? (
            <div className="rounded-3xl border border-white/10 p-6 text-center text-slate-300">Загрузка...</div>
          ) : searchResults.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-slate-400">Результаты поиска будут показаны здесь.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((product) => (
                <div key={product.sourceProductId} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <div className="mb-3 h-40 overflow-hidden rounded-2xl bg-slate-900/50">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500">Нет изображения</div>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-white line-clamp-2">{product.title}</h4>
                  <p className="mt-2 text-sm text-slate-400">{product.marketplace}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{product.price.toLocaleString('ru-RU')} {product.currency}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
