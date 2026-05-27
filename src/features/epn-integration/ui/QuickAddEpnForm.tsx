import { MARKETPLACE_OPTIONS } from '@/lib/marketplaces';

type QuickAddFormValue = {
  affiliateUrl: string;
  epnToken: string;
  advertiserName: string;
  marketplace: string;
  recipients: string;
  interests: string;
  occasions: string;
  giftTypes: string;
  tags: string;
};

type QuickAddEpnFormProps = {
  form: QuickAddFormValue;
  loading?: boolean;
  deeplinkLoading?: boolean;
  deeplinkOfferId: string;
  deeplinkPlacementId: string;
  message?: string;
  deeplinkMessage?: string;
  onFieldChange: (field: keyof QuickAddFormValue, value: string) => void;
  onOfferIdChange: (value: string) => void;
  onPlacementIdChange: (value: string) => void;
  onGenerateDeeplink: () => void;
  onFetchPreview: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function QuickAddEpnForm({
  form,
  loading,
  deeplinkLoading,
  deeplinkOfferId,
  deeplinkPlacementId,
  message,
  deeplinkMessage,
  onFieldChange,
  onOfferIdChange,
  onPlacementIdChange,
  onGenerateDeeplink,
  onFetchPreview,
  onSubmit,
}: QuickAddEpnFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
      <h2 className="text-xl font-semibold">Подтянуть товар из ePN</h2>
      <p className="mt-3 text-sm text-white/60">Введите ссылку и токен, чтобы автоматически получить метаданные ePN. Затем сохраните товар.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Field label="Ссылка на товар или ePN URL" type="url" value={form.affiliateUrl} onChange={(value) => onFieldChange('affiliateUrl', value)} />
        <Field label="ePN токен" value={form.epnToken} onChange={(value) => onFieldChange('epnToken', value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="offerId (опционально)"
          value={deeplinkOfferId}
          onChange={(event) => onOfferIdChange(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-white/40"
        />
        <input
          type="text"
          placeholder="placementId (опционально)"
          value={deeplinkPlacementId}
          onChange={(event) => onPlacementIdChange(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-white/40"
        />
      </div>

      <button
        type="button"
        onClick={onGenerateDeeplink}
        disabled={deeplinkLoading || !form.affiliateUrl}
        className="mt-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {deeplinkLoading ? 'Генерация...' : 'Сгенерировать партнёрскую ссылку'}
      </button>
      {deeplinkMessage ? <p className="mt-2 text-sm text-slate-300">{deeplinkMessage}</p> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Field label="Рекламодатель" value={form.advertiserName} onChange={(value) => onFieldChange('advertiserName', value)} />
        <label className="block space-y-2 text-sm text-white/70">
          Маркетплейс
          <select
            value={form.marketplace}
            onChange={(event) => onFieldChange('marketplace', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
          >
            {MARKETPLACE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Получатель" value={form.recipients} placeholder="girlfriend, boyfriend" onChange={(value) => onFieldChange('recipients', value)} />
        <Field label="Тэги" value={form.tags} placeholder="подарок, стиль" onChange={(value) => onFieldChange('tags', value)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Field label="Интересы" value={form.interests} placeholder="спорт, музыка" onChange={(value) => onFieldChange('interests', value)} />
        <Field label="Поводы" value={form.occasions} placeholder="день рождения, новый год" onChange={(value) => onFieldChange('occasions', value)} />
        <Field label="Типы подарков" value={form.giftTypes} placeholder="гаджет, книга" onChange={(value) => onFieldChange('giftTypes', value)} />
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onFetchPreview}
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          Подтянуть данные
        </button>
        <button
          type="submit"
          disabled={loading || !form.affiliateUrl}
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Создать товар
        </button>
      </div>

      {message ? <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-white/80">{message}</div> : null}
    </form>
  );
}

function Field({ label, value, type = 'text', placeholder, onChange }: { label: string; value: string; type?: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2 text-sm text-white/70">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-purple-500/50"
      />
    </label>
  );
}
