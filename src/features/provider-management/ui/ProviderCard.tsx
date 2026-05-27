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
  diagnostics: unknown[];
  samples?: Array<{ title?: string; price?: number | string; marketplace?: string }>;
  testing?: boolean;
  onToggle: () => void;
  onTest: () => void;
};

export function ProviderCard({ source, diagnostics, samples, testing, onToggle, onTest }: ProviderCardProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{source.name}</h2>
            <ProviderHealthBadge status={source.status} enabled={source.enabled} />
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
        <Field label="Разрешённые домены" value={source.allowedDomains} />
        <Field label="Шаблон поиска" value={source.searchUrlTemplate} />
        <Field label="Правила чтения" value="metadata/json/public endpoint" />
        <Field label="Пауза между запросами" value={`${source.crawlDelaySeconds} сек.`} />
        <Field label="Запросов в час" value={String(source.maxRequestsPerHour)} />
        <Field label="Кэш" value={`${source.cacheTtlMinutes} мин.`} />
      </div>

      <ProviderDiagnosticsPanel diagnostics={diagnostics} samples={samples} />
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
