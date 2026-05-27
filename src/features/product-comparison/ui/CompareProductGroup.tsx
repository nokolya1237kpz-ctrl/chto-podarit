import type { Product } from '@entities/product/types';
import type { CompareGroup } from '../model/types';
import { CompareOfferCard } from './CompareOfferCard';

type CompareProductGroupProps = {
  group: CompareGroup;
  favorites: string[];
  watchlist: string[];
  onImport: (product: Product) => void;
  onLogClick: (product: Product) => void;
  onToggleStored: (key: 'favoriteProducts' | 'priceWatchlist', product: Product) => void;
  getPriceNote: (product: Product) => string;
};

export function CompareProductGroup(props: CompareProductGroupProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">{props.group.title}</h2>
        <span className="text-sm text-slate-400">{props.group.items.length} предложений</span>
      </div>
      <div className="mt-4 grid gap-4">
        {props.group.items.map((product, index) => (
          <CompareOfferCard key={`${props.group.id}-${product.id}-${index}`} product={product} index={index} {...props} />
        ))}
      </div>
    </div>
  );
}
