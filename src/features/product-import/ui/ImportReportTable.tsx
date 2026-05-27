import type { ImportJobReport } from '@entities/import-job';

export function ImportReportTable({ reports }: { reports: ImportJobReport[] }) {
  if (!reports.length) return null;

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm text-white">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.22em] text-white/45">
          <tr>
            <th className="px-4 py-3">Источник</th>
            <th className="px-4 py-3">Всего</th>
            <th className="px-4 py-3">Активные</th>
            <th className="px-4 py-3">Черновики</th>
            <th className="px-4 py-3">Пропущено</th>
            <th className="px-4 py-3">Статус</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-slate-950/40">
          {reports.map((report) => (
            <tr key={`${report.source}-${report.status}`}>
              <td className="px-4 py-3">{report.source}</td>
              <td className="px-4 py-3">{report.total}</td>
              <td className="px-4 py-3">{report.importedActive}</td>
              <td className="px-4 py-3">{report.importedDraft}</td>
              <td className="px-4 py-3">{report.skipped}</td>
              <td className="px-4 py-3">{report.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
