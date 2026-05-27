import { getMarketplaceMetadata } from '../model/metadata';

export function MarketplaceBadge({ marketplace }: { marketplace?: string }) {
  const meta = getMarketplaceMetadata(marketplace);
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${meta.color}`}>{meta.label}</span>;
}
