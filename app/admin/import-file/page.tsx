'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

const fields = ['title', 'description', 'price', 'oldPrice', 'imageUrl', 'productUrl', 'affiliateUrl', 'marketplace', 'category', 'tags'];
const fieldLabels: Record<string, string> = {
  title: 'Название',
  description: 'Описание',
  price: 'Цена',
  oldPrice: 'Старая цена',
  imageUrl: 'Картинка',
  productUrl: 'URL товара',
  affiliateUrl: 'Партнёрский URL',
  marketplace: 'Маркетплейс',
  category: 'Категория',
  tags: 'Теги',
};

export default function ImportFilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [sample, setSample] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<any[]>([]);
  const [report, setReport] = useState<any | null>(null);
  const [debugText, setDebugText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function detectMapping(nextColumns: string[]) {
    const auto: Record<string, string> = {};
    fields.forEach((field) => {
      const lowerField = field.toLowerCase();
      const aliases: Record<string, string[]> = {
        title: ['title', 'name', 'product_name', 'model', 'название', 'товар'],
        description: ['description', 'desc', 'описание'],
        price: ['price', 'sale_price', 'current_price', 'pricerub', 'цена'],
        oldPrice: ['oldprice', 'old_price', 'original_price', 'старая цена'],
        imageUrl: ['imageurl', 'image_url', 'image', 'picture', 'картинка', 'фото'],
        productUrl: ['producturl', 'product_url', 'url', 'link', 'ссылка'],
        affiliateUrl: ['affiliateurl', 'affiliate_url', 'deeplink', 'партнерская ссылка'],
        marketplace: ['marketplace', 'shop', 'store', 'маркетплейс'],
        category: ['category', 'категория'],
        tags: ['tags', 'tag', 'теги'],
      };
      const match = nextColumns.find((column) => {
        const normalized = column.toLowerCase().replace(/[\s_-]/g, '');
        return normalized === lowerField || aliases[field]?.some((alias) => normalized.includes(alias.replace(/[\s_-]/g, '')));
      });
      if (match) auto[field] = match;
    });
    return auto;
  }

  function parseCsv(text: string) {
    const parsedRows: string[][] = [];
    let current = '';
    let row: string[] = [];
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const next = text[index + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if ((char === ',' || char === ';' || char === '\t') && !quoted) {
        row.push(current.trim());
        current = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') index += 1;
        row.push(current.trim());
        if (row.some(Boolean)) parsedRows.push(row);
        row = [];
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    if (row.some(Boolean)) parsedRows.push(row);
    const headers = (parsedRows.shift() || []).map((header) => header.trim());
    return parsedRows.map((values) => Object.fromEntries(headers.map((header, index) => [header || `column_${index + 1}`, values[index] || ''])));
  }

  function findJsonItems(parsed: any) {
    if (Array.isArray(parsed)) return parsed;
    if (!parsed || typeof parsed !== 'object') return [];
    for (const key of ['products', 'items', 'offers', 'data']) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
    return [];
  }

  function parseJsonl(text: string) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    return lines.map((line, index) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`Файл не похож на JSON/JSONL. Ошибка в строке ${index + 1}.`);
      }
    });
  }

  function parseJsonOrJsonl(text: string) {
    try {
      const parsed = JSON.parse(text);
      const items = findJsonItems(parsed);
      if (items.length === 0) throw new Error('unsupported_json_shape: не найден массив products/items/offers/data');
      return items;
    } catch (jsonError) {
      try {
        const items = parseJsonl(text);
        if (items.length === 0) throw new Error('empty_jsonl');
        return items;
      } catch {
        throw new Error(
          jsonError instanceof Error && jsonError.message.startsWith('unsupported_json_shape')
            ? jsonError.message
            : 'Файл не похож на JSON/JSONL. Проверьте формат.'
        );
      }
    }
  }

  async function readJsonResponse(response: Response) {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    if (!contentType.includes('application/json')) {
      throw new Error(`Сервер вернул не JSON (${response.status}). Ответ: ${text.slice(0, 200) || response.statusText}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Сервер вернул повреждённый JSON (${response.status}). Ответ: ${text.slice(0, 200)}`);
    }
  }

  async function preview(nextFile = file) {
    if (!nextFile) return;
    setLoading(true);
    setError('');
    setReport(null);
    setDebugText('');
    try {
      let parsedRows: any[] = [];
      if (nextFile.name.toLowerCase().endsWith('.xlsx')) {
        const form = new FormData();
        form.set('file', nextFile);
        const response = await fetch('/api/admin/import-file/preview', { method: 'POST', body: form });
        const data = await readJsonResponse(response);
        if (!response.ok || !data.success) throw new Error(data.error || 'Предпросмотр XLSX не выполнен');
        parsedRows = data.rows || data.sample || [];
      } else {
        const text = await nextFile.text();
        setDebugText(text.slice(0, 200));
        if (nextFile.name.toLowerCase().endsWith('.json') || nextFile.type.includes('json')) {
          parsedRows = parseJsonOrJsonl(text);
        } else {
          parsedRows = parseCsv(text);
        }
      }
      if (parsedRows.length === 0) throw new Error('no_items_in_file: в файле не найдены товары');
      const nextColumns = Array.from(new Set(parsedRows.flatMap((row) => Object.keys(row || {}))));
      setRows(parsedRows);
      setColumns(nextColumns);
      setSample(parsedRows.slice(0, 20));
      setMapping(detectMapping(nextColumns));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка предпросмотра');
      setRows([]);
      setColumns([]);
      setSample([]);
    } finally {
      setLoading(false);
    }
  }

  async function importFile() {
    if (rows.length === 0) {
      setError('no_items_in_file: сначала выберите файл с товарами');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    setReport(null);
    try {
      const response = await fetch('/api/admin/import-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows, columnMapping: mapping }),
      });
      const data = await readJsonResponse(response);
      if (!response.ok || !data.success) throw new Error(data.error || 'Импорт не выполнен');
      setReport(data);
      setMessage(`Строк: ${data.total || 0}, импортировано активных ${data.importedActive || 0}, черновиков ${data.importedDraft || 0}, пропущено ${data.skipped || 0}, ошибок ${data.errors || 0}`);
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
        {debugText && error ? (
          <details className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
            <summary className="cursor-pointer select-none font-semibold">Показать первые 200 символов файла</summary>
            <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-900 p-3 text-xs text-slate-300">{debugText}</pre>
          </details>
        ) : null}
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold">Импорт CSV / XLSX / JSON</h2>
          <p className="mt-2 text-sm text-slate-400">После предпросмотра можно сопоставить колонки и загрузить товары в каталог.</p>
          <input type="file" accept=".csv,.json,.xlsx,text/csv,application/json" onChange={(event) => { const next = event.target.files?.[0] || null; setFile(next); void preview(next); }} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" />
          {file ? <p className="mt-3 text-sm text-slate-400">Файл: {file.name}. Найдено строк: {rows.length || '—'}.</p> : null}
        </section>
        {columns.length ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Сопоставление колонок</h2>
            <p className="mt-2 text-sm text-slate-400">Определены колонки: {columns.join(', ')}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => (
                <label key={field} className="block">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{fieldLabels[field] || field}</span>
                  <select value={mapping[field] || ''} onChange={(event) => setMapping((prev) => ({ ...prev, [field]: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white">
                    <option value="">Не использовать</option>
                    {columns.map((column) => <option key={column} value={column}>{column}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <button disabled={loading} onClick={importFile} className="mt-5 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? 'Импортируем...' : 'Импортировать товары'}
            </button>
          </section>
        ) : null}
        {sample.length ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Предпросмотр первых 20 строк</h2>
            <div className="table-shell mt-4">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900 text-left text-slate-400">
                  <tr>{columns.slice(0, 8).map((column) => <th key={column} className="p-3">{column}</th>)}</tr>
                </thead>
                <tbody>
                  {sample.map((row, index) => (
                    <tr key={index} className="border-t border-white/10">
                      {columns.slice(0, 8).map((column) => <td key={column} className="max-w-xs truncate p-3">{String(row[column] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
        {report ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold">Отчёт импорта</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Stat label="Строк всего" value={report.total} />
              <Stat label="Определено" value={report.detectedRows} />
              <Stat label="Активных" value={report.importedActive} />
              <Stat label="Черновиков" value={report.importedDraft} />
              <Stat label="Пропущено" value={report.skipped} />
            </div>
            {report.reports?.length ? (
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs text-slate-300">{JSON.stringify(report.reports, null, 2)}</pre>
            ) : null}
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value ?? 0}</p>
    </div>
  );
}
