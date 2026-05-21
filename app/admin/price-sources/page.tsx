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
    setMessage(`${id}: найдено ${found}, stage ${latest?.stage || '—'}, status ${latest?.status || 'unknown'}`);
  }

  return (
    <AdminShell title="Price sources">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6">
          <label className="text-sm text-slate-300">Test query</label>
          <input value={testQuery} onChange={(event) => setTestQuery(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          {message ? <div className="mt-4 rounded-2xl bg-white/5 p-3 text-sm text-slate-200">{message}</div> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {sources.map((source) => (
            <div key={source.id} className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold">{source.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">status: {source.enabled ? source.status : 'disabled'}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setSources((prev) => prev.map((item) => item.id === source.id ? { ...item, enabled: !item.enabled } : item))} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                    {source.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => testSource(source.id)} className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold">
                    Test parser
                  </button>
                </div>
              </div>
              <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
                <Field label="allowedDomains" value={source.allowedDomains} />
                <Field label="searchUrlTemplate" value={source.searchUrlTemplate} />
                <Field label="selectors" value="metadata/json/public endpoint" />
                <Field label="crawlDelaySeconds" value={String(source.crawlDelaySeconds)} />
                <Field label="maxRequestsPerHour" value={String(source.maxRequestsPerHour)} />
                <Field label="cacheTtlMinutes" value={String(source.cacheTtlMinutes)} />
                <Field label="last error" value="—" />
              </div>
              <details className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-4">
                <summary className="cursor-pointer text-sm font-semibold">Diagnostics</summary>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input readOnly value={value} className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200" />
    </label>
  );
}
