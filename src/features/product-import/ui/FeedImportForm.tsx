type FeedImportFormProps = {
  url: string;
  format: string;
  marketplace: string;
  scheduleDaily: boolean;
  loading: boolean;
  onUrlChange: (value: string) => void;
  onFormatChange: (value: string) => void;
  onMarketplaceChange: (value: string) => void;
  onScheduleChange: (value: boolean) => void;
  onImport: () => void;
};

export function FeedImportForm({ url, format, marketplace, scheduleDaily, loading, onUrlChange, onFormatChange, onMarketplaceChange, onScheduleChange, onImport }: FeedImportFormProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold">Фиды товаров</h2>
      <p className="mt-2 text-sm text-slate-400">YML/XML/CSV/JSON фид — самый стабильный источник для большого каталога.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <input value={url} onChange={(event) => onUrlChange(event.target.value)} placeholder="https://example.com/feed.xml" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
        <input value={marketplace} onChange={(event) => onMarketplaceChange(event.target.value)} placeholder="Маркетплейс: ozon, wb, shop..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
        <select value={format} onChange={(event) => onFormatChange(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
          <option value="auto">Авто</option>
          <option value="xml">YML/XML</option>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200">
          <input type="checkbox" checked={scheduleDaily} onChange={(event) => onScheduleChange(event.target.checked)} />
          Ежедневная синхронизация
        </label>
      </div>
      <button disabled={loading} onClick={onImport} className="mt-5 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? 'Импортируем...' : 'Запустить импорт'}
      </button>
    </section>
  );
}
