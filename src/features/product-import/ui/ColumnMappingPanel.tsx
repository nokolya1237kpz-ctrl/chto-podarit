type ColumnMappingPanelProps = {
  fields: string[];
  fieldLabels: Record<string, string>;
  columns: string[];
  mapping: Record<string, string>;
  loading: boolean;
  onMappingChange: (field: string, column: string) => void;
  onImport: () => void;
};

export function ColumnMappingPanel({ fields, fieldLabels, columns, mapping, loading, onMappingChange, onImport }: ColumnMappingPanelProps) {
  if (!columns.length) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold">Сопоставление колонок</h2>
      <p className="mt-2 text-sm text-slate-400">Определены колонки: {columns.join(', ')}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <label key={field} className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{fieldLabels[field] || field}</span>
            <select value={mapping[field] || ''} onChange={(event) => onMappingChange(field, event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white">
              <option value="">Не использовать</option>
              {columns.map((column) => <option key={column} value={column}>{column}</option>)}
            </select>
          </label>
        ))}
      </div>
      <button disabled={loading} onClick={onImport} className="mt-5 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? 'Импортируем...' : 'Импортировать товары'}
      </button>
    </section>
  );
}
