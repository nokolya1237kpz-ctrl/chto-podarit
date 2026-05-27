import type { CompareFiltersState } from '../model/types';

type CompareFiltersProps = {
  filters: CompareFiltersState;
  onChange: <K extends keyof CompareFiltersState>(key: K, value: CompareFiltersState[K]) => void;
};

export function CompareFilters({ filters, onChange }: CompareFiltersProps) {
  return (
    <>
      <select value={filters.marketplace} onChange={(event) => onChange('marketplace', event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
        <option value="">Все</option>
        <option value="wildberries">WB</option>
        <option value="ozon">Ozon</option>
        <option value="aliexpress">AliExpress</option>
        <option value="yandex_market">Яндекс Маркет</option>
      </select>
      <input value={filters.minPrice} onChange={(event) => onChange('minPrice', event.target.value)} placeholder="от" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" />
      <input value={filters.maxPrice} onChange={(event) => onChange('maxPrice', event.target.value)} placeholder="до" type="number" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" />
      <select value={filters.sort} onChange={(event) => onChange('sort', event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
        <option value="price_asc">Сначала дешёвые</option>
        <option value="relevance">Релевантность</option>
      </select>
    </>
  );
}
