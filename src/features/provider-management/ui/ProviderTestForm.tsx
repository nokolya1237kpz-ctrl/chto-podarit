type ProviderTestFormProps = {
  query: string;
  message?: string;
  onQueryChange: (value: string) => void;
};

export function ProviderTestForm({ query, message, onQueryChange }: ProviderTestFormProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-6">
      <label className="text-sm text-slate-300">
        Тестовый запрос
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-purple-400/60"
        />
      </label>
      {message ? <div className="mt-4 rounded-2xl bg-white/5 p-3 text-sm text-slate-200">{message}</div> : null}
    </div>
  );
}
