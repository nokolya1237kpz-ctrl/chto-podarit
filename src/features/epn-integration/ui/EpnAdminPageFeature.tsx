'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AdminShell from '@/components/admin/AdminShell';
import { EpnDebugPanel } from './EpnDebugPanel';
import { EpnOffersSearch } from './EpnOffersSearch';
import { EpnStatusCard } from './EpnStatusCard';

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
  tokenCached?: boolean;
  cooldownUntil?: string | null;
  captchaRequired?: boolean;
  ssidExpiresAt?: string | null;
  tokenExpiresAt?: string | null;
  lastAuthDebug?: any;
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
  epnUrl?: string;
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

type EpnCreative = {
  id: string;
  title: string;
  originalUrl: string;
  affiliateUrl: string;
  deeplinkUrl: string;
  token: string;
  offerName?: string;
  offerId?: string;
  marketplace: string;
  createdAt?: string;
  type?: string;
};

type OfferActionState = {
  loadingImport?: boolean;
  importError?: string;
  importMessage?: string;
  loadingDeeplink?: boolean;
  deeplinkError?: string;
  deeplinkMessage?: string;
  deeplinkUrl?: string;
  inputUrl?: string;
  debug?: any;
  debugOpen?: boolean;
};

type CreativeActionState = {
  loading?: boolean;
  error?: string;
  message?: string;
};

async function fetchEpnStatus() {
  const res = await fetch('/api/admin/epn/status');
  const data: EpnStatus = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка проверки статуса');
  }
  return data;
}

async function fetchEpnOffers(query: string) {
  const res = await fetch(`/api/admin/epn/offers?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка поиска офферов');
  }
  return {
    ...data,
    responseUrl: res.url,
  };
}

export default function EpnAdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<EpnStatus | null>(null);
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
  const [offerActions, setOfferActions] = useState<Record<string, OfferActionState>>({});
  const [creatives, setCreatives] = useState<EpnCreative[]>([]);
  const [creativesLoading, setCreativesLoading] = useState(false);
  const [creativeActions, setCreativeActions] = useState<Record<string, CreativeActionState>>({});
  const [creativesMessage, setCreativesMessage] = useState('');
  const [creativesError, setCreativesError] = useState('');
  const [selectedGood, setSelectedGood] = useState<EpnGood | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const statusQuery = useQuery({
    queryKey: ['epn-status'],
    queryFn: fetchEpnStatus,
    staleTime: 60 * 1000,
    retry: false,
  });

  const offersQuery = useQuery({
    queryKey: ['epn-offers', offerQuery],
    queryFn: () => fetchEpnOffers(offerQuery),
    enabled: false,
    retry: false,
  });

  useEffect(() => {
    if (statusQuery.data) {
      setStatus(statusQuery.data);
      setMessage(statusQuery.data.message || 'Статус получен');
      setError(statusQuery.data.error || '');
    }
  }, [statusQuery.data]);

  useEffect(() => {
    if (statusQuery.error) {
      setStatus(null);
      setError(statusQuery.error instanceof Error ? statusQuery.error.message : 'Не удалось проверить статус');
    }
  }, [statusQuery.error]);

  const refreshStatus = async () => {
    setError('');
    setMessage('');
    await statusQuery.refetch();
  };

  const searchOffers = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffers([]);
    setError('');
    setMessage('');
    setOffersLoading(true);

    try {
      const result = await offersQuery.refetch();
      if (result.error) {
        throw result.error;
      }
      const data = result.data || {};
      setRequestUrl(data.debug?.requestUrl || data.responseUrl || '');
      setRequestParams(data.debug?.requestParams || { q: offerQuery.trim(), limit: 20 });
      setResponseBody(data.debug || data);
      setDebugOpen(false);

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
      setRequestUrl(data.debug?.requestUrl || res.url);
      setRequestParams(data.debug?.requestParams || { q: goodsQuery.trim(), limit: 20 });
      setResponseBody(data.debug || data);
      setDebugOpen(false);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка поиска товаров');
      }
      setGoods(data.goods || []);
      setMessage(data.count > 0 ? `Найдено ${data.count || 0} товаров` : 'ePN API не вернул товары по запросу. Используйте approved offers, creatives или feed.');
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

  const loadCreatives = async () => {
    setCreativesLoading(true);
    setCreativesError('');
    setCreativesMessage('');

    try {
      const res = await fetch('/api/admin/epn/creatives?limit=100');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Не удалось загрузить креативы');
      }
      setCreatives(data.creatives || []);
      setCreativesMessage(`Загружено ${data.count || 0} креативов`);
    } catch (err) {
      setCreativesError(err instanceof Error ? err.message : 'Ошибка загрузки креативов');
    } finally {
      setCreativesLoading(false);
    }
  };

  const importCreative = async (creative: EpnCreative) => {
    updateCreativeAction(creative.id, { loading: true, error: '', message: '' });

    try {
      const res = await fetch('/api/admin/epn/import-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creative }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Не удалось импортировать креатив');
      }
      updateCreativeAction(creative.id, {
        message: data.metadataFound ? 'Товар импортирован' : 'Товар импортирован как черновик',
      });
    } catch (err) {
      updateCreativeAction(creative.id, {
        error: err instanceof Error ? err.message : 'Ошибка импорта креатива',
      });
    } finally {
      updateCreativeAction(creative.id, { loading: false });
    }
  };

  const importAllCreatives = async () => {
    setCreativesError('');
    setCreativesMessage('');
    let importedCount = 0;

    for (const creative of creatives) {
      updateCreativeAction(creative.id, { loading: true, error: '', message: '' });
      try {
        const res = await fetch('/api/admin/epn/import-creative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creative }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Не удалось импортировать креатив');
        }
        importedCount += 1;
        updateCreativeAction(creative.id, {
          loading: false,
          message: data.metadataFound ? 'Товар импортирован' : 'Товар импортирован как черновик',
        });
      } catch (err) {
        updateCreativeAction(creative.id, {
          loading: false,
          error: err instanceof Error ? err.message : 'Ошибка импорта креатива',
        });
      }
    }

    setCreativesMessage(`Импортировано ${importedCount} из ${creatives.length} креативов`);
  };

  const importOfferProducts = async (offer: EpnOffer) => {
    updateOfferAction(offer.id, {
      loadingImport: true,
      importError: '',
      importMessage: '',
      debug: undefined,
    });

    try {
      const params = new URLSearchParams({
        offerId: offer.id,
        limit: '20',
      });
      const goodsRes = await fetch(`/api/admin/epn/goods-hot?${params.toString()}`);
      const goodsData = await goodsRes.json();
      if (goodsData.reason === 'NO_GOODS') {
        updateOfferAction(offer.id, {
          importError: 'У этого оффера нет товаров для импорта',
          debug: {
            method: 'GET',
            url: `/api/admin/epn/goods-hot?${params.toString()}`,
            responseBody: goodsData,
            reason: 'NO_GOODS',
          },
        });
        return;
      }
      if (!goodsRes.ok || !goodsData.success) {
        throw new Error(goodsData.error || 'Не удалось получить товары оффера');
      }

      const offerGoods: EpnGood[] = goodsData.goods || [];
      if (offerGoods.length === 0) {
        updateOfferAction(offer.id, {
          importError: 'У этого оффера нет товаров для импорта',
          debug: {
            method: 'GET',
            url: `/api/admin/epn/goods-hot?${params.toString()}`,
            responseBody: goodsData,
            reason: 'NO_GOODS',
          },
        });
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
      updateOfferAction(offer.id, {
        importMessage: `Импортировано ${importedCount} из ${offerGoods.length} товаров оффера`,
        debug: {
          method: 'GET',
          url: `/api/admin/epn/goods-hot?${params.toString()}`,
          responseBody: goodsData,
        },
      });
    } catch (err) {
      updateOfferAction(offer.id, {
        importError: err instanceof Error ? err.message : 'Ошибка импорта товаров оффера',
      });
    } finally {
      updateOfferAction(offer.id, { loadingImport: false });
    }
  };

  const getOfferUrl = (offer: EpnOffer) => {
    if (offer.directUrl) return offer.directUrl;
    const host = offer.hosts?.[0];
    if (!host) return '';
    const trimmed = host.trim();
    if (!trimmed || trimmed.startsWith('/') || !trimmed.includes('.')) return '';
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  };

  const getEpnOfferUrl = (offer: EpnOffer) => {
    return offer.epnUrl || (offer.id ? `https://app.epn.bz/offers/${offer.id}` : '');
  };

  const createOfferDeeplink = async (offer: EpnOffer) => {
    const action = offerActions[offer.id] || {};
    const url = action.inputUrl?.trim() || '';
    if (!url) {
      updateOfferAction(offer.id, { deeplinkError: 'Вставьте URL товара', deeplinkMessage: '' });
      return;
    }
    if (!offer.deeplinkSupport) {
      updateOfferAction(offer.id, {
        deeplinkError: 'Для этого оффера недоступна генерация deeplink',
        deeplinkMessage: '',
      });
      return;
    }

    const requestBody = {
      offerId: offer.id,
      originalUrl: url,
      deeplinkSupport: Boolean(offer.deeplinkSupport),
    };

    updateOfferAction(offer.id, {
      loadingDeeplink: true,
      deeplinkError: '',
      deeplinkMessage: '',
      deeplinkUrl: '',
      debug: {
        method: 'POST',
        url: '/api/admin/epn/deeplink',
        body: requestBody,
      },
    });

    try {
      const res = await fetch('/api/admin/epn/deeplink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMessage = res.status === 405
          ? 'Неверный метод или endpoint deeplink. Проверьте интеграцию API.'
          : data.error || 'Не удалось создать deeplink';
        updateOfferAction(offer.id, {
          deeplinkError: errorMessage,
          debug: {
            method: 'POST',
            url: '/api/admin/epn/deeplink',
            body: requestBody,
            responseBody: data,
          },
        });
        return;
      }
      updateOfferAction(offer.id, {
        deeplinkMessage: 'Диплинк создан',
        deeplinkUrl: data.affiliateUrl || '',
        debug: {
          method: 'POST',
          url: '/api/admin/epn/deeplink',
          body: requestBody,
          responseBody: data,
        },
      });
    } catch (err) {
      updateOfferAction(offer.id, {
        deeplinkError: err instanceof Error ? err.message : 'Ошибка создания диплинка',
      });
    } finally {
      updateOfferAction(offer.id, { loadingDeeplink: false });
    }
  };

  const updateOfferAction = (offerId: string, updates: OfferActionState) => {
    setOfferActions((current) => ({
      ...current,
      [offerId]: {
        ...current[offerId],
        ...updates,
      },
    }));
  };

  const updateCreativeAction = (creativeId: string, updates: CreativeActionState) => {
    setCreativeActions((current) => ({
      ...current,
      [creativeId]: {
        ...current[creativeId],
        ...updates,
      },
    }));
  };

  return (
    <AdminShell title="ePN API">
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <EpnStatusCard
            status={status}
            loading={statusQuery.isFetching}
            message={message}
            error={error}
            onRefresh={refreshStatus}
          />

          <EpnOffersSearch
            query={offerQuery}
            loading={offersLoading}
            onQueryChange={setOfferQuery}
            onSubmit={searchOffers}
          />
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
              {offers.map((offer) => {
                const action = offerActions[offer.id] || {};
                return (
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
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-xs text-slate-500">Лого</div>
                      )}
                      <span className="rounded-full border border-white/10 bg-slate-950/90 px-3 py-1 text-xs font-semibold text-white">
                        {offer.marketplace || 'другое'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white line-clamp-2">{offer.name}</h4>
                      <p className="mt-1 text-xs text-slate-400">{offer.category || 'Без категории'}</p>
                      <p className="mt-1 text-xs text-slate-500">ID оффера: {offer.id}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <InfoCell label="Рейтинг" value={offer.rating ?? '—'} />
                      <InfoCell label="Срок cookie" value={offer.cookieLive ?? '—'} />
                      <InfoCell label="CR" value={offer.cr ?? '—'} />
                      <InfoCell label="Confirm" value={offer.confirm ?? '—'} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusPill label="Креативы" active={Boolean(offer.creativePlacement)} />
                      <StatusPill label="Экспорт" active={Boolean(offer.exportSupport)} />
                      <StatusPill label="Диплинк" active={Boolean(offer.deeplinkSupport)} />
                      <StatusPill label="Доступен" active={Boolean(offer.available)} />
                    </div>

                    <div className="mt-3 grid gap-1 text-xs text-slate-400">
                      <div>Статус экспорта: {offer.exportSupport ? 'Да' : 'Нет'}</div>
                      <div>Поддержка креативов: {offer.creativePlacement ? 'Да' : 'Нет'}</div>
                      <div>Поддержка диплинка: {offer.deeplinkSupport ? 'Да' : 'Нет'}</div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-slate-300">URL товара или страницы</label>
                      <input
                        value={action.inputUrl || ''}
                        onChange={(event) => updateOfferAction(offer.id, { inputUrl: event.target.value, deeplinkError: '' })}
                        placeholder="https://www.aliexpress.ru/item/..."
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    {(action.importError || action.deeplinkError || action.importMessage || action.deeplinkMessage) ? (
                      <div className={`mt-3 rounded-2xl border p-3 text-xs ${action.importError || action.deeplinkError ? 'border-red-500/20 bg-red-500/10 text-red-200' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'}`}>
                        {action.importError || action.deeplinkError || action.importMessage || action.deeplinkMessage}
                        {action.deeplinkUrl ? (
                          <a href={action.deeplinkUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all font-semibold text-cyan-100">
                            {action.deeplinkUrl}
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    {action.debug ? (
                      <details
                        open={Boolean(action.debugOpen)}
                        onToggle={(event) => updateOfferAction(offer.id, { debugOpen: event.currentTarget.open })}
                        className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300"
                      >
                        <summary className="cursor-pointer select-none font-semibold text-slate-100">Показать технические детали</summary>
                        <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-900 p-3">
                          {JSON.stringify(action.debug, null, 2)}
                        </pre>
                      </details>
                    ) : null}

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-4 sm:grid-cols-4">
                      {getOfferUrl(offer) ? (
                        <a
                          href={getOfferUrl(offer)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          Открыть оффер
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-slate-500"
                        >
                          Открыть оффер
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => importOfferProducts(offer)}
                        disabled={Boolean(action.loadingImport)}
                        className="rounded-2xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
                      >
                        {action.loadingImport ? 'Импорт...' : 'Импортировать'}
                      </button>
                      <button
                        type="button"
                        onClick={() => createOfferDeeplink(offer)}
                        disabled={Boolean(action.loadingDeeplink)}
                        className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                          {action.loadingDeeplink ? '...' : 'Диплинк'}
                      </button>
                      {getEpnOfferUrl(offer) ? (
                        <a
                          href={getEpnOfferUrl(offer)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          Открыть в ePN
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-slate-500"
                        >
                          Открыть в ePN
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
          <EpnDebugPanel requestUrl={requestUrl} requestParams={requestParams} responseBody={responseBody} />
        </section>

        <section className="glass rounded-3xl p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">Deeplink-креативы</p>
              <h3 className="text-xl font-semibold text-white">Мои креативы ePN</h3>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={loadCreatives}
                disabled={creativesLoading}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
              >
                {creativesLoading ? 'Загрузка...' : 'Загрузить мои креативы'}
              </button>
              <button
                type="button"
                onClick={importAllCreatives}
                disabled={creatives.length === 0 || Object.values(creativeActions).some((action) => action.loading)}
                className="rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
              >
                Импортировать все
              </button>
            </div>
          </div>

          {creativesMessage ? (
            <div className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{creativesMessage}</div>
          ) : null}
          {creativesError ? (
            <div className="mt-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{creativesError}</div>
          ) : null}

          {creatives.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 p-6 text-center text-slate-400">Креативы появятся после загрузки</div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
              {creatives.map((creative) => {
                const action = creativeActions[creative.id] || {};
                return (
                  <div key={creative.id} className="flex w-full max-w-[520px] flex-col justify-self-center rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">{creative.marketplace || 'другое'}</span>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">{creative.type || 'deeplink'}</span>
                    </div>
                    <h4 className="mt-3 text-sm font-semibold text-white line-clamp-2">{creative.title || 'Креатив ePN'}</h4>
                    <div className="mt-3 grid gap-2 text-xs text-slate-400">
                      <div>Токен: <span className="text-slate-200">{creative.token || '—'}</span></div>
                      <div>Оффер: <span className="text-slate-200">{creative.offerName || creative.offerId || '—'}</span></div>
                      <div>Создан: <span className="text-slate-200">{creative.createdAt || '—'}</span></div>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      <a href={creative.originalUrl} target="_blank" rel="noreferrer" className="block break-all rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 hover:bg-white/10">
                        {creative.originalUrl || 'Нет исходного URL'}
                      </a>
                      <a href={creative.affiliateUrl || creative.deeplinkUrl} target="_blank" rel="noreferrer" className="block break-all rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-100 hover:bg-cyan-400/20">
                        {creative.affiliateUrl || creative.deeplinkUrl || 'Нет URL диплинка'}
                      </a>
                    </div>
                    {(action.error || action.message) ? (
                      <div className={`mt-3 rounded-2xl border p-3 text-xs ${action.error ? 'border-red-500/20 bg-red-500/10 text-red-200' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'}`}>
                        {action.error || action.message}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => importCreative(creative)}
                      disabled={Boolean(action.loading)}
                      className="mt-auto rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
                    >
                      {action.loading ? 'Импорт...' : 'Импортировать товар'}
                    </button>
                  </div>
                );
              })}
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
