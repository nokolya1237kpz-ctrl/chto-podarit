'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminShell from '@/components/admin/AdminShell';
import { ProviderCard, type PriceSourceConfig } from './ProviderCard';
import { ProviderTestForm } from './ProviderTestForm';

const initialSources: PriceSourceConfig[] = [
  { id: 'ozon', name: 'Ozon', enabled: true, allowedDomains: 'ozon.ru', searchUrlTemplate: 'https://www.ozon.ru/search/?text={query}', crawlDelaySeconds: 2, maxRequestsPerHour: 30, cacheTtlMinutes: 30, status: 'active' },
  { id: 'wildberries', name: 'Wildberries', enabled: true, allowedDomains: 'search.wb.ru, wildberries.ru, wb.ru', searchUrlTemplate: 'https://search.wb.ru/exactmatch/ru/common/v18/search?query={query}&resultset=catalog&sort=popular&spp=30', crawlDelaySeconds: 1, maxRequestsPerHour: 120, cacheTtlMinutes: 15, status: 'active' },
  { id: 'aliexpress', name: 'AliExpress', enabled: true, allowedDomains: 'aliexpress.ru', searchUrlTemplate: 'https://aliexpress.ru/wholesale?SearchText={query}', crawlDelaySeconds: 2, maxRequestsPerHour: 30, cacheTtlMinutes: 30, status: 'active' },
  { id: 'yandex_market', name: 'Яндекс Маркет', enabled: true, allowedDomains: 'market.yandex.ru', searchUrlTemplate: 'https://market.yandex.ru/search?text={query}', crawlDelaySeconds: 2, maxRequestsPerHour: 30, cacheTtlMinutes: 30, status: 'active' },
  { id: 'dns_shop', name: 'DNS', enabled: true, allowedDomains: 'dns-shop.ru', searchUrlTemplate: 'https://www.dns-shop.ru/search/?q={query}', crawlDelaySeconds: 3, maxRequestsPerHour: 10, cacheTtlMinutes: 60, status: 'active' },
  { id: 'citilink', name: 'Citilink', enabled: true, allowedDomains: 'citilink.ru', searchUrlTemplate: 'https://www.citilink.ru/search/?text={query}', crawlDelaySeconds: 3, maxRequestsPerHour: 10, cacheTtlMinutes: 60, status: 'active' },
  { id: 'megamarket', name: 'Мегамаркет', enabled: true, allowedDomains: 'megamarket.ru', searchUrlTemplate: 'https://megamarket.ru/catalog/?q={query}', crawlDelaySeconds: 3, maxRequestsPerHour: 10, cacheTtlMinutes: 60, status: 'active' },
  { id: 'mvideo', name: 'М.Видео', enabled: true, allowedDomains: 'mvideo.ru', searchUrlTemplate: 'https://www.mvideo.ru/product-list-page?q={query}', crawlDelaySeconds: 3, maxRequestsPerHour: 10, cacheTtlMinutes: 60, status: 'active' },
  { id: 'eldorado', name: 'Эльдорадо', enabled: true, allowedDomains: 'eldorado.ru', searchUrlTemplate: 'https://www.eldorado.ru/search/catalog.php?q={query}', crawlDelaySeconds: 3, maxRequestsPerHour: 10, cacheTtlMinutes: 60, status: 'active' },
];

async function fetchPriceSources() {
  return initialSources;
}

async function fetchProviderDiagnostics(query: string) {
  const res = await fetch(`/api/admin/debug/providers?q=${encodeURIComponent(query)}`);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(text || 'Источник вернул ответ в неизвестном формате');
  }

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'Не удалось проверить источник');
  }

  return data as {
    diagnostics?: Array<{ provider?: string; stage?: string; status?: string }>;
    samples?: Record<string, Array<{ title?: string; price?: number | string; marketplace?: string }>>;
    providerStatuses?: Record<string, any>;
  };
}

export default function PriceSourcesPageFeature() {
  const [testQuery, setTestQuery] = useState('наушники');
  const [activeSourceId, setActiveSourceId] = useState('');
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({});

  const sourcesQuery = useQuery({
    queryKey: ['price-sources'],
    queryFn: fetchPriceSources,
    staleTime: 5 * 60 * 1000,
  });

  const diagnosticsQuery = useQuery({
    queryKey: ['provider-debug', activeSourceId, testQuery],
    queryFn: () => fetchProviderDiagnostics(testQuery),
    enabled: Boolean(activeSourceId),
    retry: 1,
  });

  const sources = useMemo(
    () =>
      (sourcesQuery.data || []).map((source) => ({
        ...source,
        enabled: localToggles[source.id] ?? source.enabled,
      })),
    [localToggles, sourcesQuery.data]
  );

  const diagnostics = diagnosticsQuery.data?.diagnostics || [];
  const message = activeSourceId
    ? buildMessage(activeSourceId, diagnostics, diagnosticsQuery.data?.samples)
    : 'Выберите источник и запустите проверку.';

  return (
    <AdminShell title="Источники цен">
      <div className="space-y-6">
        <ProviderTestForm query={testQuery} message={diagnosticsQuery.isError ? getErrorMessage(diagnosticsQuery.error) : message} onQueryChange={setTestQuery} />

        <div className="grid gap-6 lg:grid-cols-2">
          {sources.map((source) => (
            <ProviderCard
              key={source.id}
              source={source}
              statusInfo={diagnosticsQuery.data?.providerStatuses?.[source.id]}
              testing={activeSourceId === source.id && diagnosticsQuery.isFetching}
              diagnostics={diagnostics.filter((item) => item.provider === source.id)}
              samples={diagnosticsQuery.data?.samples?.[source.id] || []}
              onToggle={() => setLocalToggles((prev) => ({ ...prev, [source.id]: !(prev[source.id] ?? source.enabled) }))}
              onTest={() => {
                setActiveSourceId(source.id);
                if (activeSourceId === source.id) {
                  diagnosticsQuery.refetch();
                }
              }}
            />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

function buildMessage(sourceId: string, diagnostics: Array<{ provider?: string; stage?: string; status?: string }>, samples?: Record<string, unknown[]>) {
  const latest = diagnostics.filter((item) => item.provider === sourceId).at(-1);
  const found = samples?.[sourceId]?.length || 0;
  if (found === 0) return `${sourceId}: нет товаров по запросу. Это не значит, что источник работает для поиска. Этап ${latest?.stage || '—'}, статус ${latest?.status || 'нет данных'}`;
  return `${sourceId}: найдено ${found}, этап ${latest?.stage || '—'}, статус ${latest?.status || 'нет данных'}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Не удалось получить диагностику источника';
}
