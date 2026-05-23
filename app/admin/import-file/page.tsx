'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

const fields = ['title', 'description', 'price', 'oldPrice', 'imageUrl', 'productUrl', 'affiliateUrl', 'marketplace', 'category', 'tags'];

export default function ImportFilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [sample, setSample] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function preview(nextFile = file) {
    if (!nextFile) return;
    setLoading(true);
    setError('');
    const form = new FormData();
    form.set('file', nextFile);
    try {
      const response = await fetch('/api/admin/import-file/preview', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Предпросмотр не выполнен');
      setColumns(data.columns || []);
      setSample(data.sample || []);
      const auto: Record<string, string> = {};
      fields.forEach((field) => {
        const match = (data.columns || []).find((column: string) => column.toLowerCase() === field.toLowerCase() || column.toLowerCase().includes(field.toLowerCase()));
        if (match) auto[field] = match;
      });
      setMapping(auto);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка предпросмотра');
    } finally {
      setLoading(false);
    }
  }

  async function importFile() {
    if (!file) return;
    setLoading(true);
    setError('');
    setMessage('');
    const form = new FormData();
    form.set('file', file);
    form.set('mapping', JSON.stringify(mapping));
    try {
      const response = await fetch('/api/admin/import-file', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Импорт не выполнен');
      setMessage(`Импортировано ${data.imported || 0}, черновиков ${data.drafted || 0}, ошибок ${data.failed || 0}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell title="Импорт CSV/XLSX">
      <div className="space-y-6">
        {message ? <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold">Импорт CSV / XLSX / JSON</h2>
          <p className="mt-2 text-sm text-slate-400">После предпросмотра можно сопоставить колонки и загрузить товары в каталог.</p>
          <input type="file" accept=".csv,.json,.xlsx,text/csv,application/json" onChange={(event) => { const next = event.target.files?.[0] || null; setFile(next); void preview(next); }} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" />
        </section>
        {columns.length ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Сопоставление колонок</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => (
                <label key={field} className="block">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{field}</span>
                  <select value={mapping[field] || ''} onChange={(event) => setMapping((prev) => ({ ...prev, [field]: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white">
                    <option value="">Не использовать</option>
                    {columns.map((column) => <option key={column} value={column}>{column}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <button disabled={loading} onClick={importFile} className="mt-5 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Импортировать файл</button>
          </section>
        ) : null}
        {sample.length ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Предпросмотр первых 20 строк</h2>
            <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs text-slate-300">{JSON.stringify(sample, null, 2)}</pre>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
