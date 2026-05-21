'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

const initialSources = [
  { id: 'ozon', name: 'Ozon', enabled: true, allowedDomains: 'ozon.ru', searchUrlTemplate: 'https://www.ozon.ru/search/?text={query}', crawlDelaySeconds: 2, maxRequestsPerHour: 30, cacheTtlMinutes: 30, status: 'active' },
  { id: 'wildberries', name: 'Wildberries', enabled: true, allowedDomains: 'search.wb.ru, wildberries.ru, wb.ru', searchUrlTemplate: 'https://search.wb.ru/exactmatch/ru/common/v18/search?query={query}&resultset=catalog&sort=popular&spp=30', crawlDelaySeconds: 1, maxRequestsPerHour: 120, cacheTtlMinutes: 15, status: 'active' },
  { id: 'aliexpress', name: 'AliExpress', enabled: true, allowedDomains: 'aliexpress.ru', searchUrlTemplate: 'https://aliexpress.ru/wholesale?SearchText={query}', crawlDelaySeconds: 2, maxRequestsPerHour: 30, cacheTtlMinutes: 30, status: 'active' },
  { id: 'yandex_market', name: 'Яндекс Маркет', enabled: true, allowedDomains: 'market.yandex.ru', searchUrlTemplate: 'https://market.yandex.ru/search?text={query}', crawlDelaySeconds: 2, maxRequestsPerHour: 30, cacheTtlMinutes: 30, status: 'active' },
];

export default function PriceSourcesPage() {
  const [sources, setSources] = useState(initialSources);
  const [testQuery, setTestQuery] = useState('наушники');
  const [message, setMessage] = useState('');

  async function testSource(id: string) {
    setMessage('Тестируем источник...');
    const res = await fetch(`/api/compare/search?q=${encodeURIComponent(testQuery)}&marketplace=${id}`);
    const data = await res.json();
    setMessage(`${id}: найдено ${data.count || 0}, статус ${data.sourceStats?.[id]?.status || 'unknown'}`);
  }

  return (
    <AdminShell title="Price sources">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <label className="text-sm text-slate-300">Test query</label>
          <input value={testQuery} onChange={(event) => setTestQuery(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          {message ? <div className="mt-4 rounded-2xl bg-white/5 p-3 text-sm text-slate-200">{message}</div> : null}
        </div>

        <div className="grid gap-6">
          {sources.map((source) => (
            <div key={source.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{source.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">status: {source.enabled ? source.status : 'disabled'}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSources((prev) => prev.map((item) => item.id === source.id ? { ...item, enabled: !item.enabled } : item))} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                    {source.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => testSource(source.id)} className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold">
                    Test parser
                  </button>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Field label="allowedDomains" value={source.allowedDomains} />
                <Field label="searchUrlTemplate" value={source.searchUrlTemplate} />
                <Field label="selectors" value="metadata/json/public endpoint" />
                <Field label="crawlDelaySeconds" value={String(source.crawlDelaySeconds)} />
                <Field label="maxRequestsPerHour" value={String(source.maxRequestsPerHour)} />
                <Field label="cacheTtlMinutes" value={String(source.cacheTtlMinutes)} />
                <Field label="last error" value="—" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input readOnly value={value} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200" />
    </label>
  );
}
