import type { Product } from '@entities/product/types';
import { DataTable, type DataTableColumn } from '@components/ui';
import { getMarketplaceName } from '@/lib/marketplaces';
import { calculateQualityScore, getProductCategory } from '@entities/product';
import { ProductActionsMenu } from './ProductActionsMenu';
import { ProductStatusBadge } from './ProductStatusBadge';

type ProductTableProps = {
  products: Product[];
  loading: boolean;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onPublish: (id: string) => void;
  onMarkTrend: (product: Product) => void;
};

function translateSourceType(sourceType?: string) {
  if (sourceType === 'manual') return 'Вручную';
  if (sourceType === 'feed') return 'Фид';
  if (sourceType === 'search_api') return 'Поисковый API';
  if (sourceType === 'api') return 'API';
  return sourceType || '—';
}

export function ProductTable({ products, loading, onDelete, onArchive, onRestore, onPublish, onMarkTrend }: ProductTableProps) {
  const columns: DataTableColumn<Product>[] = [
    {
      key: 'title',
      header: 'Название',
      cell: (product) => (
        <div>
          <div>{product.title}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {product.sourceType === 'feed' ? <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] text-purple-100">импортирован</span> : null}
            {product.status === 'draft' ? <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-100">черновик</span> : null}
            {(!product.imageUrl || !product.price) ? <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] text-rose-100">неполный</span> : null}
            {product.enrichmentStatus === 'enriched' ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100">обогащён</span> : null}
          </div>
        </div>
      ),
    },
    { key: 'price', header: 'Цена', cell: (product) => `${product.price.toLocaleString('ru-RU')} ₽` },
    { key: 'category', header: 'Категория', cell: (product) => {
      const category = getProductCategory(product);
      return <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100">{category.label}</span>;
    } },
    { key: 'recipients', header: 'Получатели', cell: (product) => <span className="text-xs text-slate-300">{(product.recipients || []).slice(0, 3).join(', ') || '—'}</span> },
    { key: 'interests', header: 'Интересы', cell: (product) => <span className="text-xs text-slate-300">{(product.interests || []).slice(0, 3).join(', ') || '—'}</span> },
    { key: 'giftTypes', header: 'Типы', cell: (product) => <span className="text-xs text-slate-300">{(product.giftTypes || []).slice(0, 3).join(', ') || '—'}</span> },
    { key: 'quality', header: 'Качество', cell: (product) => `${calculateQualityScore(product)}%` },
    { key: 'marketplace', header: 'Маркетплейс', cell: (product) => getMarketplaceName(product.marketplace) },
    { key: 'source', header: 'Источник', cell: (product) => <span className="text-purple-300">{translateSourceType(product.sourceType)}</span> },
    { key: 'status', header: 'Статус', cell: (product) => <ProductStatusBadge product={product} /> },
    { key: 'active', header: 'Активность', cell: (product) => <span className={product.isActive ? 'text-green-400' : 'text-gray-400'}>{product.isActive ? 'Активен' : 'Неактивен'}</span> },
    {
      key: 'actions',
      header: 'Действия',
      cell: (product) => <ProductActionsMenu product={product} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onPublish={onPublish} onMarkTrend={onMarkTrend} />,
    },
  ];

  return (
    <DataTable
      data={products.filter((product) => product.title)}
      columns={columns}
      loading={loading}
      compact
      emptyTitle="Товары не найдены"
      emptyDescription="Измените фильтры или импортируйте товары из фида, файла или ссылок."
      getRowKey={(product) => product.id}
    />
  );
}
