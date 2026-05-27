type UrlImportFormProps = {
  urls: string;
  loading: boolean;
  onChange: (value: string) => void;
  onImport: () => void;
};

export function UrlImportForm({ urls, loading, onChange, onImport }: UrlImportFormProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold">Импорт по ссылкам</h2>
      <p className="mt-2 text-sm text-slate-400">До 100 публичных ссылок товаров за раз. Если нет цены или картинки, товар сохранится как черновик.</p>
      <textarea
        value={urls}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://www.ozon.ru/product/...\nhttps://www.wildberries.ru/catalog/.../detail.aspx"
        className="mt-4 min-h-72 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
      />
      <button disabled={loading} onClick={onImport} className="mt-4 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? 'Импортируем...' : 'Импортировать ссылки'}
      </button>
    </section>
  );
}
