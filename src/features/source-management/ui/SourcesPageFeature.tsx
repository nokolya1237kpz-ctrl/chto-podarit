'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminShell from '@/components/admin/AdminShell';
import { ADMIN_PROVIDERS } from '@/lib/adminProviders';
import type { ProductSourceWithStats } from '@/types/product';
import { SourceForm } from './SourceForm';
import { SourceTable } from './SourceTable';

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

async function fetchAffiliateSources() {
  const res = await fetch('/api/admin/product-sources');
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Не удалось загрузить источники');
  }

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

  return ADMIN_PROVIDERS.map((provider) => ({
    ...initialState.find((item) => item.providerId === provider.id)!,
    ...(map[provider.id] || {}),
    name: map[provider.id]?.name || provider.label,
  }));
}

async function saveAffiliateSource(source: ProductSourceWithStats) {
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

  const res = await fetch('/api/admin/product-sources', {
    method: source.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Не удалось сохранить источник');
  }

  return data;
}

export default function SourcesPageFeature() {
  const queryClient = useQueryClient();
  const [sources, setSources] = useState<ProductSourceWithStats[]>(initialState);
  const [message, setMessage] = useState('');

  const sourcesQuery = useQuery({
    queryKey: ['affiliate-sources'],
    queryFn: fetchAffiliateSources,
    staleTime: 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: saveAffiliateSource,
    onSuccess: () => {
      setMessage('Сохранено успешно');
      queryClient.invalidateQueries({ queryKey: ['affiliate-sources'] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : 'Ошибка сохранения источника'),
  });

  useEffect(() => {
    if (sourcesQuery.data) {
      setSources(sourcesQuery.data);
    }
  }, [sourcesQuery.data]);

  const activeSources = useMemo(() => sources.filter((source) => source.enabled), [sources]);

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

  return (
    <AdminShell title="Источники товаров">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Панель источников</h2>
            <p className="mt-2 text-sm text-white/60">Управляйте провайдерами, affiliate-настройками, API и синхронизацией товаров.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Статистика</h2>
            <p className="mt-2 text-sm text-white/60">Включено источников: {activeSources.length}. Всего товаров: {sources.reduce((sum, source) => sum + (source.productCount || 0), 0)}.</p>
          </div>
        </div>

        {(message || sourcesQuery.isError) && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            {message || (sourcesQuery.error instanceof Error ? sourcesQuery.error.message : 'Не удалось загрузить источники')}
          </div>
        )}

        <SourceTable sources={sources} loading={sourcesQuery.isLoading} />

        <div className="grid gap-6">
          {sources.map((source) => (
            <SourceForm
              key={source.providerId}
              source={source}
              saving={saveMutation.isPending && saveMutation.variables?.providerId === source.providerId}
              onChange={(field, value) => updateSourceField(source.providerId, field, value)}
              onSave={() => saveMutation.mutate(source)}
            />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
