export function UrlImportReport({ reports }: { reports: any[] }) {
  if (!reports.length) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold">Отчёт</h2>
      <div className="table-shell mt-4">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="p-2">URL</th>
              <th className="p-2">Маркетплейс</th>
              <th className="p-2">Название</th>
              <th className="p-2">Картинка</th>
              <th className="p-2">Цена</th>
              <th className="p-2">Активен</th>
              <th className="p-2">Черновик</th>
              <th className="p-2">Ошибка</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((row, index) => (
              <tr key={index} className="border-t border-white/10">
                <td className="max-w-xs truncate p-2">{row.url}</td>
                <td className="p-2">{row.marketplace}</td>
                <td className="p-2">{row.titleFound ? 'да' : 'нет'}</td>
                <td className="p-2">{row.imageFound ? 'да' : 'нет'}</td>
                <td className="p-2">{row.priceFound ? 'да' : 'нет'}</td>
                <td className="p-2">{row.createdActive ? 'да' : 'нет'}</td>
                <td className="p-2">{row.createdDraft ? 'да' : 'нет'}</td>
                <td className="p-2 text-rose-200">{row.error || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
