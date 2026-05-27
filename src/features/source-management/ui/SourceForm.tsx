import { ActionBar, StatusPill } from '@components/common';
import { ADMIN_PROVIDERS } from '@/lib/adminProviders';
import type { ProductSourceWithStats } from '@/types/product';

type SourceFormProps = {
  source: ProductSourceWithStats;
  saving?: boolean;
  onChange: (field: keyof ProductSourceWithStats, value: string | boolean) => void;
  onSave: () => void;
};

export function SourceForm({ source, saving, onChange, onSave }: SourceFormProps) {
  const provider = ADMIN_PROVIDERS.find((item) => item.id === source.providerId);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white/90">
            <span>{provider?.icon}</span>
            <span>{provider?.label}</span>
          </div>
          <p className="mt-3 text-sm text-white/60">{provider?.description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Товары" value={String(source.productCount ?? 0)} />
          <Metric label="Состояние" value={source.syncStatus || 'Нет данных'} />
          <Metric label="Последняя загрузка" value={source.lastSyncAt ? new Date(source.lastSyncAt).toLocaleString('ru-RU') : 'Н/Д'} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Input label="Название" value={source.name || ''} onChange={(value) => onChange('name', value)} />
        <Input label="API base URL" value={source.apiBaseUrl || ''} onChange={(value) => onChange('apiBaseUrl', value)} />
        <Input label="Affiliate ID" value={source.affiliateId || ''} onChange={(value) => onChange('affiliateId', value)} />
        <Input label="Campaign ID" value={source.campaignId || ''} onChange={(value) => onChange('campaignId', value)} />
      </div>

      <div className="mt-4 space-y-4">
        <label className="block space-y-2 text-sm text-white/70">
          Заметки
          <textarea
            value={source.notes || ''}
            onChange={(event) => onChange('notes', event.target.value)}
            className="min-h-[120px] w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={source.enabled}
              onChange={(event) => onChange('enabled', event.target.checked)}
              className="h-5 w-5 rounded border border-white/10 bg-slate-950 text-white"
            />
            Включено
            <StatusPill status={source.enabled ? 'active' : 'disabled'} label={source.enabled ? 'Активен' : 'Неактивен'} />
          </label>
          <ActionBar>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </ActionBar>
        </div>
      </div>

      {source.syncMessage ? (
        <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-white/75">
          <div className="text-white/40">Последнее сообщение:</div>
          <p className="mt-2">{source.syncMessage}</p>
        </div>
      ) : null}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2 text-sm text-white/70">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-white/70">
      <div className="text-xs uppercase text-white/40">{label}</div>
      <div className="mt-2 text-base font-semibold">{value}</div>
    </div>
  );
}
