import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  compact?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  getRowKey: (row: T, index: number) => string;
};

export function DataTable<T>({ data, columns, loading, compact, emptyTitle = 'Нет данных', emptyDescription, getRowKey }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-16" />)}
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm text-white">
          <thead className="sticky top-0 bg-slate-950/90 text-left text-xs uppercase tracking-[0.22em] text-white/45">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.className || (compact ? 'px-3 py-2' : 'px-4 py-3')}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/35">
            {data.map((row, index) => (
              <tr key={getRowKey(row, index)} className="align-top transition hover:bg-white/[0.03]">
                {columns.map((column) => (
                  <td key={column.key} className={column.className || (compact ? 'px-3 py-2' : 'px-4 py-3')}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
