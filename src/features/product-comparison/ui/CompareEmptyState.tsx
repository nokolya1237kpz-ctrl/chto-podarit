export function CompareEmptyState() {
  return (
    <section className="mt-8">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center text-slate-300">
        <p className="text-lg font-semibold text-white">Пока ничего не найдено</p>
        <p className="mt-2 text-sm text-slate-400">Попробуйте изменить запрос или вернитесь позже: часть источников может временно ограничивать запросы.</p>
      </div>
    </section>
  );
}
