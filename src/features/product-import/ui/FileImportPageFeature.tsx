'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import AdminShell from '@/components/admin/AdminShell';
import { ColumnMappingPanel } from './ColumnMappingPanel';
import { FileImportForm } from './FileImportForm';
import { FilePreviewTable } from './FilePreviewTable';
import { ImportReport } from './ImportReport';

const fields = ['title', 'description', 'price', 'oldPrice', 'imageUrl', 'productUrl', 'affiliateUrl', 'marketplace', 'category', 'tags', 'externalProductId', 'availability'];
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
  externalProductId: 'Внешний ID',
  availability: 'Наличие',
};

export default function ImportFilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [sample, setSample] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<any[]>([]);
  const [report, setReport] = useState<any | null>(null);
  const [debugText, setDebugText] = useState('');
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  const [detectedDelimiter, setDetectedDelimiter] = useState('');
  const [batchSize, setBatchSize] = useState(250);
  const [job, setJob] = useState<any | null>(null);
  const [jobReport, setJobReport] = useState<any | null>(null);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const cancelRef = useRef(false);
  const pauseRef = useRef(false);

  function detectMapping(nextColumns: string[]) {
    const auto: Record<string, string> = {};
    const exact = (name: string) => nextColumns.find((column) => normalizeHeader(column) === normalizeHeader(name));
    const sadovodMapping = {
      title: exact('Название'),
      description: exact('Описание'),
      price: exact('Цена'),
      imageUrl: exact('Изображения'),
      productUrl: exact('URL'),
      marketplace: 'sadovod',
      category: exact('Категория'),
      tags: exact('Подкатегория'),
      externalProductId: exact('Артикул'),
      availability: exact('Наличие'),
    };
    Object.entries(sadovodMapping).forEach(([field, column]) => {
      if (column) auto[field] = column;
    });

    fields.forEach((field) => {
      if (auto[field]) return;
      const lowerField = field.toLowerCase();
      const aliases: Record<string, string[]> = {
        title: ['title', 'name', 'product_name', 'model', 'название', 'товар'],
        description: ['description', 'richdescription', 'desc', 'описание'],
        price: ['cardprice', 'price', 'pricedecimal', 'sale_price', 'current_price', 'pricerub', 'цена'],
        oldPrice: ['originalprice', 'oldprice', 'old_price', 'original_price', 'старая цена'],
        imageUrl: ['coverimageurl', 'imageurl', 'image_url', 'image', 'images', 'picture', 'картинка', 'фото', 'изображения', 'изображение'],
        productUrl: ['producturl', 'product_url', 'url', 'link', 'ссылка', 'url'],
        affiliateUrl: ['affiliateurl', 'affiliate_url', 'deeplink', 'партнерская ссылка'],
        marketplace: ['marketplace', 'shop', 'store', 'маркетплейс'],
        category: ['category', 'категория'],
        tags: ['tags', 'tag', 'теги', 'подкатегория'],
        externalProductId: ['externalproductid', 'sku', 'id', 'артикул'],
        availability: ['availability', 'available', 'stock', 'наличие'],
      };
      const match = nextColumns.find((column) => {
        const normalized = normalizeHeader(column);
        return normalized === lowerField || aliases[field]?.some((alias) => normalized.includes(normalizeHeader(alias)));
      });
      if (match) auto[field] = match;
    });
    return auto;
  }

  function normalizeHeader(value: string) {
    return value.toLowerCase().replace(/^\uFEFF/, '').replace(/[\s_\-./]+/g, '').trim();
  }

  function detectDatasetType(items: any[]) {
    const first = items[0] || {};
    if ('sku' in first && ('cardPrice' in first || 'coverImageUrl' in first || 'priceDecimal' in first)) return 'ozon_scraper';
    if ('sku' in first && String(first.url || '').includes('ozon')) return 'ozon_scraper';
    return 'generic';
  }

  function normalizePrice(value: any) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const normalized = String(value || '')
      .replace(/\s+/g, '')
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    return Number(normalized) || 0;
  }

  function firstImage(value: any) {
    const raw = Array.isArray(value) ? value[0] : value;
    if (raw && typeof raw === 'object') return raw.url || raw.src || raw.imageUrl || '';
    return String(raw || '').split(/\r?\n|;|,\s*(?=https?:\/\/|\/\/)/).map((item) => item.trim()).find(Boolean) || '';
  }

  function getMappedValue(row: any, field: string) {
    const source = mapping[field];
    if (!source) return undefined;
    if (source === 'sadovod') return 'sadovod';
    return row[source];
  }

  function normalizePreviewItem(row: any) {
    const mapped = {
      title: getMappedValue(row, 'title'),
      description: getMappedValue(row, 'description'),
      price: getMappedValue(row, 'price'),
      oldPrice: getMappedValue(row, 'oldPrice'),
      imageUrl: getMappedValue(row, 'imageUrl'),
      productUrl: getMappedValue(row, 'productUrl'),
      marketplace: getMappedValue(row, 'marketplace'),
      category: getMappedValue(row, 'category'),
      tags: getMappedValue(row, 'tags'),
      externalProductId: getMappedValue(row, 'externalProductId'),
      availability: getMappedValue(row, 'availability'),
    };
    return {
      title: String(mapped.title ?? row.title ?? row.name ?? '').trim(),
      description: String(mapped.description ?? row.description ?? row.richDescription ?? '').trim(),
      price: normalizePrice(mapped.price ?? row.cardPrice ?? row.price ?? row.priceDecimal),
      oldPrice: normalizePrice(mapped.oldPrice ?? row.originalPrice ?? row.oldPrice),
      imageUrl: String(firstImage(mapped.imageUrl ?? row.coverImageUrl ?? row.image ?? row.images ?? row.imageUrl) || '').trim(),
      productUrl: String(mapped.productUrl ?? row.url ?? row.productUrl ?? '').trim(),
      marketplace: String(mapped.marketplace || row.marketplace || row.url || '').includes('ozon') ? 'ozon' : mapped.marketplace || row.marketplace || 'other',
      category: mapped.category || row.category || '',
      tags: mapped.tags || row.tags || '',
      externalProductId: mapped.externalProductId || row.sku || row.id || '',
      availability: mapped.availability || row.availability || '',
    };
  }

  function detectCsvDelimiter(text: string) {
    const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/)[0] || '';
    const candidates = [';', ',', '\t', '|'];
    const counts = Object.fromEntries(candidates.map((delimiter) => [delimiter, firstLine.split(delimiter).length - 1]));
    if ((counts[';'] || 0) > 3) return ';';
    return candidates.sort((left, right) => (counts[right] || 0) - (counts[left] || 0))[0] || ',';
  }

  function parseCsv(text: string) {
    const delimiter = detectCsvDelimiter(text);
    const result = Papa.parse<Record<string, any>>(text.replace(/^\uFEFF/, ''), {
      header: true,
      delimiter,
      skipEmptyLines: true,
      transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
      transform: (value) => typeof value === 'string' ? value.trim() : value,
    });
    if (result.errors.length && result.data.length === 0) {
      throw new Error(result.errors[0]?.message || 'Не удалось разобрать CSV');
    }
    return {
      delimiter,
      rows: result.data.filter((row) => Object.values(row || {}).some((value) => String(value || '').trim())),
    };
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
    setDebugInfo(null);
    setDetectedDelimiter('');
    try {
      let parsedRows: any[] = [];
      let delimiter = '';
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
          const csv = parseCsv(text);
          delimiter = csv.delimiter;
          parsedRows = csv.rows;
          setDetectedDelimiter(csv.delimiter);
        }
      }
      if (parsedRows.length === 0) throw new Error('no_items_in_file: в файле не найдены товары');
      const nextColumns = Array.from(new Set(parsedRows.flatMap((row) => Object.keys(row || {}))));
      const nextMapping = detectMapping(nextColumns);
      setRows(parsedRows);
      setColumns(nextColumns);
      setSample(parsedRows.slice(0, 20));
      setMapping(nextMapping);
      setDebugInfo({
        detectedDatasetType: detectDatasetType(parsedRows),
        detectedDelimiter: delimiter || detectedDelimiter,
        headers: nextColumns,
        arrayLength: parsedRows.length,
        firstParsedRow: parsedRows[0] || null,
        columnMapping: nextMapping,
        firstNormalizedItem: normalizePreviewItemWithMapping(parsedRows[0] || {}, nextMapping),
        importPayloadSize: JSON.stringify({ items: parsedRows, columnMapping: nextMapping }).length,
      });
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
    cancelRef.current = false;
    pauseRef.current = false;
    setPaused(false);
    setError('');
    setMessage('');
    setReport(null);
    setJobReport(null);
    try {
      const startResponse = await fetch('/api/admin/import-file/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalRows: rows.length,
          filename: file?.name || 'import.csv',
          source: detectDatasetType(rows),
        }),
      });
      const startData = await readJsonResponse(startResponse);
      if (!startResponse.ok || !startData.success) throw new Error(startData.error || 'Не удалось создать задачу импорта');
      setJob(startData.job);

      const startedAt = Date.now();
      let aggregate = {
        parsedRows: rows.length,
        normalizedRows: 0,
        activeReady: 0,
        draftReady: 0,
        skippedNoTitle: 0,
        skippedNoImage: 0,
        skippedNoPrice: 0,
        saveErrors: 0,
        createdActive: 0,
        createdDraft: 0,
        duplicates: 0,
        reports: [] as any[],
      };

      for (let offset = 0; offset < rows.length; offset += batchSize) {
        while (pauseRef.current) {
          await sleep(500);
        }
        if (cancelRef.current) {
          setMessage('Импорт остановлен на клиенте. Уже обработанные batch сохранены.');
          break;
        }

        const batch = rows.slice(offset, offset + batchSize);
        const response = await fetch('/api/admin/import-file/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: startData.job.id,
            items: batch,
            columnMapping: mapping,
            detectedDelimiter,
          }),
        });
        const data = await readJsonResponse(response);
        if (!response.ok || !data.success) throw new Error(data.error || 'Batch импорта не выполнен');

        aggregate = mergeImportReports(aggregate, data.report);
        const elapsedSeconds = Math.max(1, (Date.now() - startedAt) / 1000);
        const processedRows = data.job?.processedRows || Math.min(rows.length, offset + batch.length);
        const speed = Math.round(processedRows / elapsedSeconds);
        const remaining = Math.max(0, rows.length - processedRows);
        const etaSeconds = speed ? Math.ceil(remaining / speed) : 0;
        const nextJob = {
          ...data.job,
          speed,
          etaSeconds,
        };
        setJob(nextJob);
        setJobReport(aggregate);
        setMessage(`Обработано ${processedRows}/${rows.length}. Скорость: ${speed} строк/сек. Осталось примерно: ${formatEta(etaSeconds)}.`);

        if ((offset / batchSize) % 4 === 0) {
          void pollJobStatus(startData.job.id);
        }
      }

      setReport({
        success: true,
        ...aggregate,
        total: rows.length,
        detectedRows: rows.length,
        importedActive: aggregate.createdActive,
        importedDraft: aggregate.createdDraft,
        skipped: aggregate.skippedNoTitle,
        errors: aggregate.saveErrors,
      });
      setMessage(cancelRef.current ? 'Импорт остановлен' : `Импорт завершён. Активных: ${aggregate.createdActive}, черновиков: ${aggregate.createdDraft}, дублей: ${aggregate.duplicates}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта');
    } finally {
      setLoading(false);
      setPaused(false);
      pauseRef.current = false;
    }
  }

  async function pollJobStatus(id: string) {
    try {
      const response = await fetch(`/api/admin/import-file/status?id=${encodeURIComponent(id)}`);
      const data = await readJsonResponse(response);
      if (response.ok && data.success) setJob((current: any) => ({ ...current, ...data.job }));
    } catch {}
  }

  function pauseImport() {
    pauseRef.current = true;
    setPaused(true);
  }

  function resumeImport() {
    pauseRef.current = false;
    setPaused(false);
  }

  function cancelImport() {
    cancelRef.current = true;
    pauseRef.current = false;
    setPaused(false);
  }

  return (
    <AdminShell title="Импорт CSV/XLSX">
      <div className="space-y-6">
        {message ? <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}
        {(debugInfo || (debugText && error)) ? (
          <details className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
            <summary className="cursor-pointer select-none font-semibold">Показать debug импорта</summary>
            {debugInfo ? (
              <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-900 p-3 text-xs text-slate-300">{JSON.stringify(debugInfo, null, 2)}</pre>
            ) : null}
            {debugText && error ? (
              <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-900 p-3 text-xs text-slate-300">{debugText}</pre>
            ) : null}
          </details>
        ) : null}
        <FileImportForm file={file} rowsCount={rows.length} onFileChange={(next) => { setFile(next); void preview(next); }} />
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Задача импорта</h2>
              <p className="mt-2 text-sm text-slate-400">Большие файлы отправляются batch-ами, чтобы UI не зависал и сервер не получал один огромный запрос.</p>
            </div>
            <label className="text-sm text-slate-300">
              Размер batch
              <select
                value={batchSize}
                disabled={loading}
                onChange={(event) => setBatchSize(Number(event.target.value))}
                className="mt-2 block rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
              >
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
            </label>
          </div>
          {job ? (
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span>ID: {job.id}</span>
                <span>Статус: {translateJobStatus(job.status)}</span>
                <span>{job.processedRows || 0}/{job.totalRows || rows.length}</span>
                {job.speed ? <span>{job.speed} строк/сек</span> : null}
                {job.etaSeconds ? <span>ETA: {formatEta(job.etaSeconds)}</span> : null}
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-950">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{ width: `${Math.min(100, job.progress || 0)}%` }} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={!loading || paused} onClick={pauseImport} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50">Пауза</button>
                <button type="button" disabled={!loading || !paused} onClick={resumeImport} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50">Продолжить</button>
                <button type="button" disabled={!loading} onClick={cancelImport} className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 disabled:opacity-50">Отменить</button>
              </div>
            </div>
          ) : null}
        </section>
        <ColumnMappingPanel fields={fields} fieldLabels={fieldLabels} columns={columns} mapping={mapping} loading={loading} onMappingChange={(field, column) => setMapping((prev) => ({ ...prev, [field]: column }))} onImport={importFile} />
        <FilePreviewTable sample={sample} columns={columns} />
        <ImportReport report={report || jobReport} />
      </div>
    </AdminShell>
  );
}

function mergeImportReports(current: any, next: any) {
  return {
    ...current,
    normalizedRows: current.normalizedRows + (next.normalizedRows || 0),
    activeReady: current.activeReady + (next.activeReady || 0),
    draftReady: current.draftReady + (next.draftReady || 0),
    skippedNoTitle: current.skippedNoTitle + (next.skippedNoTitle || 0),
    skippedNoImage: current.skippedNoImage + (next.skippedNoImage || 0),
    skippedNoPrice: current.skippedNoPrice + (next.skippedNoPrice || 0),
    saveErrors: current.saveErrors + (next.saveErrors || 0),
    createdActive: current.createdActive + (next.createdActive || 0),
    createdDraft: current.createdDraft + (next.createdDraft || 0),
    duplicates: current.duplicates + (next.duplicates || 0),
    reports: [...current.reports, ...(next.reports || [])].slice(0, 100),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatEta(seconds: number) {
  if (!seconds) return '—';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes} мин ${rest} сек` : `${rest} сек`;
}

function translateJobStatus(status: string) {
  if (status === 'queued') return 'в очереди';
  if (status === 'processing') return 'обработка';
  if (status === 'completed') return 'завершён';
  if (status === 'failed') return 'ошибка';
  if (status === 'cancelled') return 'отменён';
  return status;
}

function normalizePreviewItemWithMapping(row: any, nextMapping: Record<string, string>) {
  const read = (field: string) => {
    const source = nextMapping[field];
    if (!source) return undefined;
    if (source === 'sadovod') return 'sadovod';
    return row[source];
  };
  const priceValue = String(read('price') ?? row.cardPrice ?? row.price ?? row.priceDecimal ?? '')
    .replace(/\s+/g, '')
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');
  const imageRaw = read('imageUrl') ?? row.coverImageUrl ?? row.image ?? row.images ?? row.imageUrl ?? '';
  const image = Array.isArray(imageRaw) ? imageRaw[0] : String(imageRaw).split(/\r?\n|;|,\s*(?=https?:\/\/|\/\/)/).map((item) => item.trim()).find(Boolean);
  return {
    title: String(read('title') ?? row.title ?? row.name ?? '').trim(),
    description: String(read('description') ?? row.description ?? row.richDescription ?? '').trim(),
    price: Number(priceValue) || 0,
    imageUrl: String(image || '').trim(),
    productUrl: String(read('productUrl') ?? row.url ?? row.productUrl ?? '').trim(),
    marketplace: read('marketplace') || row.marketplace || 'other',
    category: read('category') || row.category || '',
    tags: read('tags') || row.tags || '',
    externalProductId: read('externalProductId') || row.sku || row.id || '',
    availability: read('availability') || row.availability || '',
  };
}
