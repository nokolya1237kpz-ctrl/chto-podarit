import { ActionBar } from '@components/common';
import { ProviderDiagnosticsPanel } from './ProviderDiagnosticsPanel';
import { ProviderHealthBadge } from './ProviderHealthBadge';

export type PriceSourceConfig = {
  id: string;
  name: string;
  enabled: boolean;
  allowedDomains: string;
  searchUrlTemplate: string;
  crawlDelaySeconds: number;
  maxRequestsPerHour: number;
  cacheTtlMinutes: number;
  status: string;
};

type ProviderCardProps = {
  source: PriceSourceConfig;
  statusInfo?: {
    configured?: boolean;
    reachable?: boolean;
    searchable?: boolean;
    status?: string;
    normalizedItemsCount?: number;
    rawItemsCount?: number;
    httpStatus?: number | null;
    lastError?: string | null;
    lastCheckedAt?: string;
    reason?: string;
  };
  diagnostics: unknown[];
  samples?: Array<{ title?: string; price?: number | string; marketplace?: string }>;
  testing?: boolean;
  onToggle: () => void;
  onTest: () => void;
};

export function ProviderCard({ source, statusInfo, diagnostics, samples, testing, onToggle, onTest }: ProviderCardProps) {
  const effectiveStatus = statusInfo?.status || (source.enabled ? 'configured' : 'disabled');
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{source.name}</h2>
            <ProviderHealthBadge status={effectiveStatus} enabled={source.enabled} />
          </div>
          <p className="mt-2 break-words text-sm text-slate-400">{source.allowedDomains}</p>
        </div>
        <ActionBar>
          <button onClick={onToggle} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
            {source.enabled ? 'Выключить' : 'Включить'}
          </button>
          <button onClick={onTest} disabled={testing} className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {testing ? 'Проверяем...' : 'Проверить'}
          </button>
        </ActionBar>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
        <StatusLine label="Configured" value={statusInfo?.configured ?? source.enabled} />
        <StatusLine label="Reachable" value={statusInfo?.reachable} />
        <StatusLine label="Searchable" value={statusInfo?.searchable} />
        <Field label="Найдено за тест" value={String(statusInfo?.normalizedItemsCount ?? samples?.length ?? 0)} />
        {statusInfo?.lastError ? <Field label="Последняя ошибка" value={statusInfo.lastError} /> : null}
        {statusInfo?.lastCheckedAt ? <Field label="Последняя проверка" value={new Date(statusInfo.lastCheckedAt).toLocaleString('ru-RU')} /> : null}
        <Field label="Разрешённые домены" value={source.allowedDomains} />
        <Field label="Шаблон поиска" value={source.searchUrlTemplate} />
        <Field label="Правила чтения" value="metadata/json/public endpoint" />
        <Field label="Пауза между запросами" value={`${source.crawlDelaySeconds} сек.`} />
        <Field label="Запросов в час" value={String(source.maxRequestsPerHour)} />
        <Field label="Кэш" value={`${source.cacheTtlMinutes} мин.`} />
      </div>

      <ProviderDiagnosticsPanel diagnostics={diagnostics} samples={samples} statusInfo={statusInfo} />
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <div className={`mt-2 text-sm font-semibold ${value ? 'text-emerald-300' : value === false ? 'text-amber-300' : 'text-slate-400'}`}>
        {value ? 'Да' : value === false ? 'Нет' : 'Не проверено'}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input readOnly value={value} className="mt-2 w-full min-w-0 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-200" />
    </label>
  );
}
