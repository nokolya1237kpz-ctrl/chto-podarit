import { DataTable, type DataTableColumn } from '@components/ui/DataTable';
import { StatusPill } from '@components/common';
import { getProviderLabel } from '@/lib/adminProviders';
import type { ProductSourceWithStats } from '@/types/product';

type SourceTableProps = {
  sources: ProductSourceWithStats[];
  loading?: boolean;
};

export function SourceTable({ sources, loading }: SourceTableProps) {
  const columns: Array<DataTableColumn<ProductSourceWithStats>> = [
    {
      key: 'provider',
      header: 'Источник',
      cell: (source) => <span className="font-semibold">{getProviderLabel(source.providerId)}</span>,
    },
    {
      key: 'enabled',
      header: 'Статус',
      cell: (source) => <StatusPill status={source.enabled ? 'active' : 'disabled'} label={source.enabled ? 'Включён' : 'Выключен'} />,
    },
    {
      key: 'products',
      header: 'Товары',
      cell: (source) => source.productCount ?? 0,
    },
    {
      key: 'sync',
      header: 'Синхронизация',
      cell: (source) => source.syncStatus || 'Нет данных',
    },
    {
      key: 'last',
      header: 'Последняя загрузка',
      cell: (source) => source.lastSyncAt ? new Date(source.lastSyncAt).toLocaleString('ru-RU') : 'Н/Д',
    },
  ];

  return (
    <DataTable
      data={sources}
      columns={columns}
      loading={loading}
      compact
      emptyTitle="Пока нет источников"
      emptyDescription="Добавьте или включите источник товаров."
      getRowKey={(source) => source.providerId}
    />
  );
}
