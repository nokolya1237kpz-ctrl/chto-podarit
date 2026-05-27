import type { FormEvent } from 'react';
import type { CompareFiltersState } from '../model/types';
import { CompareFilters } from './CompareFilters';

type CompareSearchFormProps = {
  filters: CompareFiltersState;
  loading: boolean;
  onChange: <K extends keyof CompareFiltersState>(key: K, value: CompareFiltersState[K]) => void;
  onSubmit: (event?: FormEvent) => void;
};

export function CompareSearchForm({ filters, loading, onChange, onSubmit }: CompareSearchFormProps) {
  return (
    <section className="sticky top-24 z-20 rounded-[2rem] border border-white/10 bg-slate-900/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Сравнение цен</p>
      <h1 className="mt-3 text-4xl font-bold">Найдите выгодную цену</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_140px_140px_160px_auto]">
        <input
          value={filters.query}
          onChange={(event) => onChange('query', event.target.value)}
          placeholder="Наушники, косметика, автоаксессуары..."
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3"
        />
        <CompareFilters filters={filters} onChange={onChange} />
        <button disabled={loading} className="rounded-2xl bg-purple-600 px-5 py-3 font-semibold disabled:opacity-50">
          {loading ? 'Ищем...' : 'Найти'}
        </button>
      </form>
    </section>
  );
}
