import type { Product } from '@entities/product/types';

export function ProductStatusBadge({ product }: { product: Product }) {
  const color = product.status === 'active' ? 'text-green-400' : product.status === 'archived' ? 'text-slate-400' : 'text-yellow-300';
  const label = product.status === 'active' ? 'Опубликован' : product.status === 'archived' ? 'Архив' : 'Черновик';
  return <span className={color}>{label}</span>;
}
