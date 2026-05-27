export function BulkImportReport({ rows }: { rows: any[] }) {
  if (!rows.length) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Отчёт импорта</h2>
        <div className="flex gap-3">
          <a href="/admin/products" className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white">Открыть товары</a>
          <a href="/admin/drafts" className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white">Открыть черновики</a>
        </div>
      </div>
      <div className="table-shell mt-4">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="p-2">Источник</th>
              <th className="p-2">Запрос/URL</th>
              <th className="p-2">Найдено</th>
              <th className="p-2">Активных</th>
              <th className="p-2">Черновиков</th>
              <th className="p-2">Пропущено</th>
              <th className="p-2">Ошибка</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-white/10">
                <td className="p-2">{row.source || row.status || 'manual'}</td>
                <td className="p-2">{row.query || row.url}</td>
                <td className="p-2">{row.found ?? row.foundRaw ?? '—'}</td>
                <td className="p-2">{row.active ?? row.importedActive ?? (row.status === 'active' ? 1 : 0)}</td>
                <td className="p-2">{row.draft ?? row.importedDraft ?? (row.status === 'draft' ? 1 : 0)}</td>
                <td className="p-2">{(row.skippedDuplicate || 0) + (row.skippedQuality || 0)}</td>
                <td className="p-2 text-rose-200">{row.error || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
