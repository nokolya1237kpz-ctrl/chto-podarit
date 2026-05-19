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
  image?: string;
  logo?: string;
  logoSmall?: string;
  status?: string;
  category?: string;
  commission?: number | string;
  commissionText?: string;
  cashbackMaxRate?: string | number;
  cashbackRateSymbol?: string;
  allowed?: boolean;
  available?: boolean;
  creativePlacement?: boolean;
  exportSupport?: boolean;
  deeplinkSupport?: boolean;
  marketplace?: string;
  rating?: string | number;
  hosts?: string[];
  cookieLive?: string | number;
  cr?: string | number;
  confirm?: string | number;
  tag?: string | string[];
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
  const [requestUrl, setRequestUrl] = useState('');
  const [requestParams, setRequestParams] = useState<Record<string, any> | null>(null);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [goodsQuery, setGoodsQuery] = useState('');
  const [goods, setGoods] = useState<EpnGood[]>([]);
  const [goodsLoading, setGoodsLoading] = useState(false);
  const [importingOfferId, setImportingOfferId] = useState<string | null>(null);
  const [deeplinkingOfferId, setDeeplinkingOfferId] = useState<string | null>(null);
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
      setRequestUrl(data.debug?.requestUrl || res.url);
      setRequestParams(data.debug?.requestParams || { q: offerQuery.trim(), limit: 20 });
      setResponseBody(data.debug || data);
      setDebugOpen(false);

      if (!res.ok) {
        const errorMessage = data.error || 'Ошибка поиска офферов';
        throw new Error(errorMessage);
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

  const importOfferProducts = async (offer: EpnOffer) => {
    setError('');
    setMessage('');
    setImportingOfferId(offer.id);

    try {
      const params = new URLSearchParams({
        offerId: offer.id,
        limit: '20',
      });
      const goodsRes = await fetch(`/api/admin/epn/goods-hot?${params.toString()}`);
      const goodsData = await goodsRes.json();
      if (!goodsRes.ok || !goodsData.success) {
        throw new Error(goodsData.error || 'Не удалось получить товары оффера');
      }

      const offerGoods: EpnGood[] = goodsData.goods || [];
      if (offerGoods.length === 0) {
        setMessage('Для этого оффера товары не найдены');
        return;
      }

      let importedCount = 0;
      for (const good of offerGoods) {
        const importRes = await fetch('/api/admin/epn/import-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            good,
            recipients: [],
            interests: [],
            occasions: [],
            giftTypes: [],
            tags: [offer.marketplace || 'epn', offer.category || 'Без категории'],
          }),
        });
        const importData = await importRes.json();
        if (importRes.ok && importData.success) {
          importedCount += 1;
        }
      }

      setGoods(offerGoods);
      setMessage(`Импортировано ${importedCount} из ${offerGoods.length} товаров оффера`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта товаров оффера');
    } finally {
      setImportingOfferId(null);
    }
  };

  const getOfferUrl = (offer: EpnOffer) => {
    if (offer.directUrl) return offer.directUrl;
    const host = offer.hosts?.[0];
    if (!host) return '';
    return host.startsWith('http') ? host : `https://${host}`;
  };

  const createOfferDeeplink = async (offer: EpnOffer) => {
    const url = getOfferUrl(offer);
    if (!url) {
      setError('У оффера нет ссылки для deeplink');
      return;
    }

    setError('');
    setMessage('');
    setDeeplinkingOfferId(offer.id);

    try {
      const res = await fetch('/api/admin/epn/deeplink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          offerId: offer.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Не удалось создать deeplink');
      }
      setMessage('Deeplink создан');
      if (data.affiliateUrl) {
        window.open(data.affiliateUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания deeplink');
    } finally {
      setDeeplinkingOfferId(null);
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
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 p-6 text-center text-slate-400">Результаты появятся после поиска</div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
              {offers.map((offer) => (
                <div key={offer.id} className="flex w-full max-w-[520px] flex-col justify-self-center overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80">
                  <div className="relative h-32 bg-slate-900/70">
                    {offer.image ? (
                      <img src={offer.image} alt={offer.name} className="h-full w-full object-contain p-3" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">Нет изображения</div>
                    )}
                    <div className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-slate-950">
                      {offer.commissionText || offer.commission || 'Комиссия не указана'}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
                      {offer.logo || offer.logoSmall ? (
                        <img src={offer.logo || offer.logoSmall} alt={`${offer.name} logo`} className="h-10 w-10 shrink-0 rounded-2xl border border-white/20 bg-slate-950 object-contain p-1" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-xs text-slate-500">Logo</div>
                      )}
                      <span className="rounded-full border border-white/10 bg-slate-950/90 px-3 py-1 text-xs font-semibold text-white">
                        {offer.marketplace || 'other'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white line-clamp-2">{offer.name}</h4>
                      <p className="mt-1 text-xs text-slate-400">{offer.category || 'Без категории'}</p>
                      <p className="mt-1 text-xs text-slate-500">Offer ID: {offer.id}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <InfoCell label="Рейтинг" value={offer.rating ?? '—'} />
                      <InfoCell label="Cookie" value={offer.cookieLive ?? '—'} />
                      <InfoCell label="CR" value={offer.cr ?? '—'} />
                      <InfoCell label="Confirm" value={offer.confirm ?? '—'} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusPill label="Creative" active={Boolean(offer.creativePlacement)} />
                      <StatusPill label="Export" active={Boolean(offer.exportSupport)} />
                      <StatusPill label="Deeplink" active={Boolean(offer.deeplinkSupport)} />
                      <StatusPill label="Доступен" active={Boolean(offer.available)} />
                    </div>

                    <div className="mt-3 grid gap-1 text-xs text-slate-400">
                      <div>Статус экспорта: {offer.exportSupport ? 'Да' : 'Нет'}</div>
                      <div>Creative support: {offer.creativePlacement ? 'Да' : 'Нет'}</div>
                      <div>Available deeplink support: {offer.deeplinkSupport ? 'Да' : 'Нет'}</div>
                    </div>

                    <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
                      {getOfferUrl(offer) ? (
                        <a
                          href={getOfferUrl(offer)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          Открыть оффер
                        </a>
                      ) : (
                        <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-slate-500">Открыть оффер</span>
                      )}
                      <button
                        type="button"
                        onClick={() => importOfferProducts(offer)}
                        disabled={importingOfferId === offer.id}
                        className="rounded-2xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
                      >
                        {importingOfferId === offer.id ? 'Импорт...' : 'Импортировать'}
                      </button>
                      <button
                        type="button"
                        onClick={() => createOfferDeeplink(offer)}
                        disabled={!getOfferUrl(offer) || deeplinkingOfferId === offer.id}
                        className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        {deeplinkingOfferId === offer.id ? '...' : 'Deeplink'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {requestUrl ? (
            <details
              open={debugOpen}
              onToggle={(event) => setDebugOpen(event.currentTarget.open)}
              className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-200"
            >
              <summary className="cursor-pointer select-none font-semibold text-slate-100">Debug API Response</summary>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="font-semibold text-slate-100">Request URL</div>
                  <div className="break-all text-slate-300">{requestUrl}</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-100">Request params</div>
                  <pre className="mt-2 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs text-slate-300">
                    {JSON.stringify(requestParams, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="font-semibold text-slate-100">Response body</div>
                  <pre className="mt-2 max-h-[400px] overflow-auto rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs text-slate-300">
                    {JSON.stringify(responseBody, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          ) : null}
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

function InfoCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-white">{value}</div>
    </div>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/5 text-slate-400'}`}>
      {label}: {active ? 'Да' : 'Нет'}
    </span>
  );
}
