type EpnOffersSearchProps = {
  query: string;
  loading?: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function EpnOffersSearch({ query, loading, onQueryChange, onSubmit }: EpnOffersSearchProps) {
  return (
    <section className="glass rounded-3xl p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-white/50">Офферы</p>
      <h3 className="text-xl font-semibold text-white mt-2">Поиск офферов</h3>
      <p className="text-sm text-slate-400">Найдите ePN офферы по ключевым словам.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="block text-sm font-medium text-slate-200">Запрос</label>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Например: наушники"
          className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Поиск...' : 'Найти офферы'}
        </button>
      </form>
    </section>
  );
}
