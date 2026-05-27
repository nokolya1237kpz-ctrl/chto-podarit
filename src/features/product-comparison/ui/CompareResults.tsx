import type { Product } from '@entities/product/types';
import type { CompareGroup } from '../model/types';
import { CompareEmptyState } from './CompareEmptyState';
import { CompareProductGroup } from './CompareProductGroup';

type CompareResultsProps = {
  groups: CompareGroup[];
  dataLoaded: boolean;
  loading: boolean;
  favorites: string[];
  watchlist: string[];
  onImport: (product: Product) => void;
  onLogClick: (product: Product) => void;
  onToggleStored: (key: 'favoriteProducts' | 'priceWatchlist', product: Product) => void;
  getPriceNote: (product: Product) => string;
};

export function CompareResults(props: CompareResultsProps) {
  if (!props.loading && props.dataLoaded && props.groups.length === 0) {
    return <CompareEmptyState />;
  }

  return (
    <section className="mt-8 space-y-6">
      {props.groups.map((group) => (
        <CompareProductGroup key={group.id} group={group} {...props} />
      ))}
    </section>
  );
}
