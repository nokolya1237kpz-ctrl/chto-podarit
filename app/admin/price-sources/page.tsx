'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

const initialSources = [
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

export default function PriceSourcesPage() {
  const [sources, setSources] = useState(initialSources);
  const [testQuery, setTestQuery] = useState('наушники');
  const [message, setMessage] = useState('');
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [samples, setSamples] = useState<Record<string, any[]>>({});

  async function testSource(id: string) {
    setMessage('Тестируем источник...');
    const res = await fetch(`/api/admin/debug/providers?q=${encodeURIComponent(testQuery)}`);
    const data = await res.json();
    setDiagnostics((data.diagnostics || []).filter((item: any) => item.provider === id));
    setSamples(data.samples || {});
    const found = data.samples?.[id]?.length || 0;
    const latest = (data.diagnostics || []).filter((item: any) => item.provider === id).at(-1);
    setMessage(`${id}: найдено ${found}, этап ${latest?.stage || '—'}, статус ${latest?.status || 'неизвестно'}`);
  }

  return (
    <AdminShell title="Источники цен">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6">
          <label className="text-sm text-slate-300">Тестовый запрос</label>
          <input value={testQuery} onChange={(event) => setTestQuery(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          {message ? <div className="mt-4 rounded-2xl bg-white/5 p-3 text-sm text-slate-200">{message}</div> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {sources.map((source) => (
            <div key={source.id} className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold">{source.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">Статус: {source.enabled ? translateStatus(source.status) : 'выключен'}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setSources((prev) => prev.map((item) => item.id === source.id ? { ...item, enabled: !item.enabled } : item))} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                    {source.enabled ? 'Выключить' : 'Включить'}
                  </button>
                  <button onClick={() => testSource(source.id)} className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold">
                    Проверить источник
                  </button>
                </div>
              </div>
              <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
                <Field label="Разрешённые домены" value={source.allowedDomains} />
                <Field label="Шаблон поиска" value={source.searchUrlTemplate} />
                <Field label="Правила чтения" value="metadata/json/public endpoint" />
                <Field label="Пауза между запросами" value={String(source.crawlDelaySeconds)} />
                <Field label="Запросов в час" value={String(source.maxRequestsPerHour)} />
                <Field label="Кэш, минут" value={String(source.cacheTtlMinutes)} />
                <Field label="Последняя ошибка" value="—" />
              </div>
              <details className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-4">
                <summary className="cursor-pointer text-sm font-semibold">Показать технические детали</summary>
                <pre className="mt-3 max-h-64 max-w-full overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">{JSON.stringify(diagnostics.filter((item) => item.provider === source.id), null, 2)}</pre>
                <div className="mt-3 grid gap-2">
                  {(samples[source.id] || []).slice(0, 3).map((product, index) => (
                    <div key={index} className="rounded-xl bg-white/5 p-3 text-xs text-slate-200">
                      {product.title} · {product.price} ₽
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

function translateStatus(status: string) {
  if (status === 'active') return 'работает';
  if (status === 'limited') return 'ограничен';
  if (status === 'error') return 'ошибка';
  if (status === 'disabled') return 'выключен';
  return status;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input readOnly value={value} className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200" />
    </label>
  );
}
