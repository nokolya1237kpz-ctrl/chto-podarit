'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';

type EpnStatus = {
  success: boolean;
  connected: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  ssidReceived: boolean;
  tokenReceived: boolean;
  message: string;
  error?: string;
  details?: any;
};

type EpnOffer = {
  id: string;
  name: string;
  logo?: string;
  status?: string;
  category?: string;
  commission?: number;
  allowed?: boolean;
  available?: boolean;
  directUrl?: string;
};

type EpnGood = {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
  directUrl?: string;
  cashback?: number;
  cashbackPercent?: number;
  category?: string;
  offerId?: string;
  originalUrl?: string;
  affiliateUrl?: string;
  marketplace?: string;
  offerStatus?: string;
};

export default function EpnAdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<EpnStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [offerQuery, setOfferQuery] = useState('');
  const [offers, setOffers] = useState<EpnOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [goodsQuery, setGoodsQuery] = useState('');
  const [goods, setGoods] = useState<EpnGood[]>([]);
  const [goodsLoading, setGoodsLoading] = useState(false);
  const [selectedGood, setSelectedGood] = useState<EpnGood | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    setStatusLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/epn/status');
      const data: EpnStatus = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка проверки статуса');
      }
      setStatus(data);
      setMessage(data.message || 'Статус получен');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Не удалось проверить статус');
    } finally {
      setStatusLoading(false);
    }
  };

  const searchOffers = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffers([]);
    setError('');
    setMessage('');
    setOffersLoading(true);

    try {
      const res = await fetch(`/api/admin/epn/offers?q=${encodeURIComponent(offerQuery)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка поиска офферов');
      }
      setOffers(data.offers || []);
      setMessage(`Найдено ${data.count || 0} офферов`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось получить офферы');
    } finally {
      setOffersLoading(false);
    }
  };

  const searchGoods = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGoods([]);
    setError('');
    setMessage('');
    setGoodsLoading(true);

    try {
      const res = await fetch(`/api/admin/epn/goods-hot?q=${encodeURIComponent(goodsQuery)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка поиска товаров');
      }
      setGoods(data.goods || []);
      setMessage(`Найдено ${data.count || 0} товаров`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось получить товары');
    } finally {
      setGoodsLoading(false);
    }
  };

  const importGood = async (good: EpnGood) => {
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/epn/import-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          good,
          recipients: [],
          interests: [],
          occasions: [],
          giftTypes: [],
          tags: [],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Не удалось импортировать товар');
      }
      setMessage('Товар импортирован успешно');
      if (data.data?.id) {
        router.push(`/admin/products/${data.data.id}/edit`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта');
    }
  };

  return (
    <AdminShell title="ePN API">
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <section className="glass rounded-3xl p-6 space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">Статус подключения</p>
              <h2 className="text-2xl font-semibold text-white mt-2">ePN API</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatusRow label="Client ID" value={status?.hasClientId ? 'найден' : 'не найден'} />
              <StatusRow label="Client Secret" value={status?.hasClientSecret ? 'найден' : 'не найден'} />
              <StatusRow label="SSID" value={status?.ssidReceived ? 'получен' : 'не получен'} />
              <StatusRow label="Token" value={status?.tokenReceived ? 'получен' : 'не получен'} />
              <StatusRow label="Подключение" value={status?.connected ? 'успешно' : 'отключено'} />
            </div>
            <button
              type="button"
              onClick={refreshStatus}
              disabled={statusLoading}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
            >
              {statusLoading ? 'Проверка...' : 'Проверить подключение'}
            </button>
            {message && <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</div>}
            {error && <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
            {status?.details && !error && (
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">{JSON.stringify(status.details)}</div>
            )}
          </section>

          <section className="glass rounded-3xl p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Офферы</p>
            <h3 className="text-xl font-semibold text-white mt-2">Поиск офферов</h3>
            <p className="text-sm text-slate-400">Найдите ePN офферы по ключевым словам.</p>
            <form onSubmit={searchOffers} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-200">Запрос</label>
              <input
                value={offerQuery}
                onChange={(e) => setOfferQuery(e.target.value)}
                placeholder="Например: наушники"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={offersLoading}
                className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:opacity-90 transition disabled:opacity-50"
              >
                {offersLoading ? 'Поиск...' : 'Найти офферы'}
              </button>
            </form>
          </section>
        </div>

        <section className="glass rounded-3xl p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">Результаты</p>
              <h3 className="text-xl font-semibold text-white">Офферы ePN</h3>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">{offers.length} офферов</span>
          </div>
          {offers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-slate-400">Результаты появятся после поиска</div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <div className="flex items-center gap-3">
                    {offer.logo ? (
                      <img src={offer.logo} alt={offer.name} className="h-14 w-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-sm text-slate-400">No</div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-white">{offer.name}</h4>
                      <p className="text-xs text-slate-400">{offer.category || 'Категория не указана'}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300">
                    <div>Статус: {offer.status || '—'}</div>
                    <div>Комиссия: {offer.commission ?? '—'}</div>
                    <div>Доступен: {offer.available ? 'Да' : 'Нет'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass rounded-3xl p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">Горячие товары</p>
              <h3 className="text-xl font-semibold text-white">Товары ePN</h3>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">{goods.length} товаров</span>
          </div>
          <form onSubmit={searchGoods} className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
            <input
              value={goodsQuery}
              onChange={(e) => setGoodsQuery(e.target.value)}
              placeholder="Поиск по товарам"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={goodsLoading}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:opacity-90 transition disabled:opacity-50"
            >
              {goodsLoading ? 'Идёт поиск...' : 'Загрузить товары'}
            </button>
          </form>

          {goods.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 p-6 text-center text-slate-400">Товары будут показаны после поиска</div>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {goods.map((good) => (
                <div key={good.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <div className="h-48 overflow-hidden rounded-3xl bg-slate-900/60">
                    {good.image ? (
                      <img src={good.image} alt={good.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500">Нет изображения</div>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-semibold text-white line-clamp-2">{good.title}</h4>
                    <div className="text-sm text-slate-400">{good.category || good.marketplace || 'Категория не указана'}</div>
                    <div className="text-sm font-semibold text-white">{good.price.toLocaleString('ru-RU')} {good.currency}</div>
                    <div className="text-sm text-slate-300">Кэшбек: {good.cashback ?? '—'} ({good.cashbackPercent ?? '—'}%)</div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => importGood(good)}
                      className="rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-500 transition"
                    >
                      Импортировать
                    </button>
                    {good.directUrl && (
                      <a
                        href={good.directUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white text-center hover:bg-white/10 transition"
                      >
                        Открыть ссылку
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
