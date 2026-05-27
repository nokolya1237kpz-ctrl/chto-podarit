export function ImportReport({ report }: { report: any | null }) {
  if (!report) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold">Отчёт импорта</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Строк всего" value={report.parsedRows || report.total} />
        <Stat label="Нормализовано" value={report.normalizedRows || report.detectedRows} />
        <Stat label="Активных" value={report.createdActive ?? report.importedActive} />
        <Stat label="Черновиков" value={report.createdDraft ?? report.importedDraft} />
        <Stat label="Обновлено" value={report.updatedExisting} />
        <Stat label="Удалённые пропущены" value={report.skippedSoftDeleted} />
        <Stat label="Дубли в batch" value={report.skippedAlreadyInBatch} />
        <Stat label="Дубли в базе" value={report.skippedDuplicate ?? report.duplicates} />
        <Stat label="Без названия" value={report.skippedNoTitle} />
        <Stat label="Без картинки" value={report.skippedNoImage} />
        <Stat label="Без цены" value={report.skippedNoPrice} />
        <Stat label="Ошибки сохранения" value={report.saveErrors ?? report.errors} />
        <Stat label="Готовы к публикации" value={report.activeReady} />
      </div>
      {report.reports?.length ? (
        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs text-slate-300">{JSON.stringify(report.reports, null, 2)}</pre>
      ) : null}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value ?? 0}</p>
    </div>
  );
}
