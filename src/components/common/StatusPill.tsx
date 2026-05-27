export function StatusPill({ status, label }: { status?: string; label?: string }) {
  const normalized = status || 'unknown';
  const color = normalized === 'active' || normalized === 'success' || normalized === 'connected'
    ? 'border-emerald-300/20 bg-emerald-500/12 text-emerald-100'
    : normalized === 'limited' || normalized === 'warning'
      ? 'border-amber-300/20 bg-amber-500/12 text-amber-100'
      : normalized === 'error' || normalized === 'disabled'
        ? 'border-rose-300/20 bg-rose-500/12 text-rose-100'
        : 'border-white/10 bg-white/8 text-white/70';

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>{label || translateStatus(normalized)}</span>;
}

function translateStatus(status: string) {
  if (status === 'active') return 'работает';
  if (status === 'success') return 'успешно';
  if (status === 'connected') return 'подключено';
  if (status === 'limited') return 'ограничен';
  if (status === 'warning') return 'внимание';
  if (status === 'error') return 'ошибка';
  if (status === 'disabled') return 'выключен';
  return 'неизвестно';
}
