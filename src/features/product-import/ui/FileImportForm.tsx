type FileImportFormProps = {
  file: File | null;
  rowsCount: number;
  onFileChange: (file: File | null) => void;
};

export function FileImportForm({ file, rowsCount, onFileChange }: FileImportFormProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold">Импорт CSV / XLSX / JSON</h2>
      <p className="mt-2 text-sm text-slate-400">После предпросмотра можно сопоставить колонки и загрузить товары в каталог.</p>
      <input
        type="file"
        accept=".csv,.json,.xlsx,text/csv,application/json"
        onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
      />
      {file ? <p className="mt-3 text-sm text-slate-400">Файл: {file.name}. Найдено строк: {rowsCount || '—'}.</p> : null}
    </section>
  );
}
