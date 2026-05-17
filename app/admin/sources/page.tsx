'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { ADMIN_PROVIDERS, getProviderIcon, getProviderLabel } from '@/lib/adminProviders';
import type { ProductSourceWithStats } from '@/types/product';

const initialState = ADMIN_PROVIDERS.map((provider) => ({
  id: '',
  providerId: provider.id,
  name: provider.label,
  enabled: false,
  apiBaseUrl: '',
  affiliateId: '',
  campaignId: '',
  notes: '',
  createdAt: undefined,
  updatedAt: undefined,
  productCount: 0,
  lastSyncAt: null,
  syncStatus: null,
  syncMessage: null,
  syncedCount: null,
  failedCount: null,
  durationMs: null,
} as ProductSourceWithStats));

export default function AdminProductSourcesPage() {
  const [sources, setSources] = useState<ProductSourceWithStats[]>(initialState);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/product-sources');
      const data = await res.json();
      if (res.ok && data.success) {
        const map = data.data.reduce((acc: Record<string, ProductSourceWithStats>, source: any) => {
          acc[source.provider_id] = {
            ...source,
            providerId: source.provider_id,
            apiBaseUrl: source.api_base_url || '',
            affiliateId: source.affiliate_id || '',
            campaignId: source.campaign_id || '',
            notes: source.notes || '',
            productCount: source.productCount ?? 0,
            lastSyncAt: source.lastSyncAt ?? null,
            syncStatus: source.syncStatus ?? null,
            syncMessage: source.syncMessage ?? null,
            syncedCount: source.syncedCount ?? null,
            failedCount: source.failedCount ?? null,
            durationMs: source.durationMs ?? null,
          };
          return acc;
        }, {} as Record<string, ProductSourceWithStats>);

        setSources(
          ADMIN_PROVIDERS.map((provider) => {
            return {
              ...initialState.find((item) => item.providerId === provider.id)!,
              ...(map[provider.id] || {}),
              name: map[provider.id]?.name || provider.label,
            };
          })
        );
      } else {
        setMessage(data.error || 'Не удалось загрузить источники');
      }
    } catch (error) {
      console.error(error);
      setMessage('Ошибка загрузки источников');
    } finally {
      setLoading(false);
    }
  }

  function updateSourceField(id: string, field: keyof ProductSourceWithStats, value: string | boolean) {
    setSources((prev) =>
      prev.map((source) =>
        source.providerId === id
          ? {
              ...source,
              [field]: value,
            }
          : source
      )
    );
  }

  async function saveSource(source: ProductSourceWithStats) {
    setMessage('');
    try {
      const payload = {
        id: source.id || undefined,
        provider_id: source.providerId,
        name: source.name,
        enabled: source.enabled,
        api_base_url: source.apiBaseUrl,
        affiliate_id: source.affiliateId,
        campaign_id: source.campaignId,
        notes: source.notes,
      };

      const method = source.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/product-sources', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Сохранено успешно');
        loadSources();
      } else {
        setMessage(data.error || 'Не удалось сохранить источник');
      }
    } catch (error) {
      console.error(error);
      setMessage('Ошибка сохранения источника');
    }
  }

  return (
    <AdminShell title="Источники товаров">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Панель источников</h2>
            <p className="mt-2 text-sm text-white/60">
              Управляйте провайдерами, настройками affiliate, API и синхронизацией товаров.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Статистика</h2>
            <p className="mt-2 text-sm text-white/60">Каждый провайдер отображает количество товаров, время последней синхронизации и статус.</p>
          </div>
        </div>

        {message && <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{message}</div>}

        <div className="grid gap-6">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center text-white/60">Загрузка...</div>
          ) : (
            sources.map((source) => {
              const provider = ADMIN_PROVIDERS.find((item) => item.id === source.providerId);
              return (
                <div key={source.providerId} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white/90">
                        <span>{provider?.icon}</span>
                        <span>{provider?.label}</span>
                      </div>
                      <p className="mt-3 text-sm text-white/60">{provider?.description}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-white/70">
                        <div className="text-xs uppercase text-white/40">Товары</div>
                        <div className="mt-2 text-xl font-semibold">{source.productCount ?? 0}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-white/70">
                        <div className="text-xs uppercase text-white/40">Состояние</div>
                        <div className="mt-2 text-base font-semibold">{source.syncStatus || 'Нет данных'}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-white/70">
                        <div className="text-xs uppercase text-white/40">Последняя синхронизация</div>
                        <div className="mt-2 text-base font-semibold">{source.lastSyncAt ? new Date(source.lastSyncAt).toLocaleString('ru-RU') : 'Н/Д'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2 text-sm text-white/70">
                      Название
                      <input
                        value={source.name}
                        onChange={(e) => updateSourceField(source.providerId, 'name', e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
                      />
                    </label>
                    <label className="block space-y-2 text-sm text-white/70">
                      API base URL
                      <input
                        value={source.apiBaseUrl}
                        onChange={(e) => updateSourceField(source.providerId, 'apiBaseUrl', e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
                      />
                    </label>
                    <label className="block space-y-2 text-sm text-white/70">
                      Affiliate ID
                      <input
                        value={source.affiliateId}
                        onChange={(e) => updateSourceField(source.providerId, 'affiliateId', e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
                      />
                    </label>
                    <label className="block space-y-2 text-sm text-white/70">
                      Campaign ID
                      <input
                        value={source.campaignId}
                        onChange={(e) => updateSourceField(source.providerId, 'campaignId', e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
                      />
                    </label>
                  </div>

                  <div className="mt-4 space-y-4">
                    <label className="block space-y-2 text-sm text-white/70">
                      Заметки
                      <textarea
                        value={source.notes}
                        onChange={(e) => updateSourceField(source.providerId, 'notes', e.target.value)}
                        className="w-full min-h-[120px] rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
                      />
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="inline-flex items-center gap-3 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={source.enabled}
                          onChange={(e) => updateSourceField(source.providerId, 'enabled', e.target.checked)}
                          className="h-5 w-5 rounded border border-white/10 bg-slate-950 text-white"
                        />
                        Включено
                      </label>
                      <button
                        type="button"
                        onClick={() => saveSource(source)}
                        className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110 transition"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>

                  {source.syncMessage && (
                    <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-white/75">
                      <div className="text-white/40">Последнее сообщение:</div>
                      <p className="mt-2">{source.syncMessage}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminShell>
  );
}
