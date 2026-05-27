export function FeedImportReport({ error, message, lastLoad, scheduleDaily }: { error: string; message: string; lastLoad: string; scheduleDaily: boolean }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <Status label="Статус" value={error ? 'Ошибка' : message ? 'Работает' : 'Требуется фид'} />
      <Status label="Последняя успешная загрузка" value={lastLoad || '—'} />
      <Status label="Расписание" value={scheduleDaily ? 'ежедневно' : 'вручную'} />
    </div>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
