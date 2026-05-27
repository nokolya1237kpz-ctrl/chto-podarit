import { DebugDetails } from '@components/common';

type EpnStatusCardProps = {
  status: any;
  loading?: boolean;
  message?: string;
  error?: string;
  onRefresh: () => void;
};

export function EpnStatusCard({ status, loading, message, error, onRefresh }: EpnStatusCardProps) {
  return (
    <section className="glass rounded-3xl p-6 space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Статус подключения</p>
        <h2 className="text-2xl font-semibold text-white mt-2">ePN API</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatusRow label="ID клиента" value={status?.hasClientId ? 'найден' : 'не найден'} />
        <StatusRow label="Секрет клиента" value={status?.hasClientSecret ? 'найден' : 'не найден'} />
        <StatusRow label="SSID" value={status?.ssidReceived ? 'получен' : 'не получен'} />
        <StatusRow label="Токен" value={status?.tokenReceived ? 'получен' : 'не получен'} />
        <StatusRow label="Кэш токена" value={status?.tokenCached ? 'есть' : 'пусто'} />
        <StatusRow label="Токен истекает" value={status?.tokenExpiresAt ? new Date(status.tokenExpiresAt).toLocaleString('ru-RU') : '—'} />
        <StatusRow label="Пауза" value={status?.cooldownUntil ? new Date(status.cooldownUntil).toLocaleTimeString('ru-RU') : 'нет'} />
        <StatusRow label="Подключение" value={status?.connected ? 'успешно' : 'отключено'} />
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Проверка...' : 'Проверить подключение'}
      </button>
      {message ? <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</div> : null}
      {error ? <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}
      {status?.captchaRequired ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">ePN временно требует капчу. Остановите импорт и попробуйте позже.</div>
      ) : null}
      {status?.details && !error ? (
        <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">{JSON.stringify(status.details)}</div>
      ) : null}
      {status?.lastAuthDebug ? (
        <DebugDetails title="Показать технические детали OAuth">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatusRow label="ENV ID клиента" value={status.lastAuthDebug.env?.hasClientId ? 'загружен' : 'нет'} />
            <StatusRow label="ENV секрет клиента" value={status.lastAuthDebug.env?.hasClientSecret ? 'загружен' : 'нет'} />
            <StatusRow label="OAuth endpoint" value={status.lastAuthDebug.env?.oauthBaseUrl || '—'} />
            <StatusRow label="API endpoint" value={status.lastAuthDebug.env?.apiBaseUrl || '—'} />
          </div>
          <div className="mt-4 space-y-3">
            <DebugBlock title="SSID endpoint" value={status.lastAuthDebug.ssid || null} />
            <DebugBlock title="Token endpoint" value={status.lastAuthDebug.token || null} />
            {status.lastAuthDebug.lastAuthError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                Последняя OAuth ошибка: {status.lastAuthDebug.lastAuthError}
              </div>
            ) : null}
          </div>
        </DebugDetails>
      ) : null}
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function DebugBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <div className="font-semibold text-slate-100">{title}</div>
      <pre className="mt-2 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
