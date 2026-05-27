import Link from 'next/link';
import type { Product } from '@entities/product/types';

type ProductActionsMenuProps = {
  product: Product;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onPublish: (id: string) => void;
  onMarkTrend: (product: Product) => void;
};

export function ProductActionsMenu({ product, onDelete, onArchive, onRestore, onPublish, onMarkTrend }: ProductActionsMenuProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/admin/products/${product.id}/edit`} className="text-purple-400 hover:text-purple-300">
        Редактировать
      </Link>
      {product.status === 'archived' ? (
        <button onClick={() => onRestore(product.id)} className="text-emerald-400 hover:text-emerald-300">
          Восстановить
        </button>
      ) : null}
      {product.status !== 'archived' && (!product.isActive || product.status !== 'active') ? (
        <button onClick={() => onPublish(product.id)} className="text-emerald-400 hover:text-emerald-300">
          Опубликовать
        </button>
      ) : null}
      {product.status !== 'archived' ? (
        <button onClick={() => onArchive(product.id)} className="text-amber-300 hover:text-amber-200">
          В архив
        </button>
      ) : null}
      {product.status !== 'archived' ? (
        <button onClick={() => onMarkTrend(product)} className="text-cyan-300 hover:text-cyan-200">
          Тренд
        </button>
      ) : null}
      <button onClick={() => onDelete(product.id)} className="text-red-400 hover:text-red-300">
        Удалить навсегда
      </button>
    </div>
  );
}
