export function FilePreviewTable({ sample, columns }: { sample: any[]; columns: string[] }) {
  if (!sample.length) return null;

  return (
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
  );
}
