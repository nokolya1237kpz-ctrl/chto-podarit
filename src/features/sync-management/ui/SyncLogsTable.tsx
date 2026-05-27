import { DataTable, type DataTableColumn } from '@components/ui/DataTable';
import { StatusPill } from '@components/common';
import { getProviderLabel } from '@/lib/adminProviders';

export interface SyncLogItem {
  id: string;
  providerId: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  syncedCount?: number | null;
  failedCount?: number | null;
  durationMs?: number | null;
  createdAt: string;
}

type SyncLogsTableProps = {
  logs: SyncLogItem[];
  loading?: boolean;
  running?: boolean;
  onRestart: (providerId: string) => void;
};

export function SyncLogsTable({ logs, loading, running, onRestart }: SyncLogsTableProps) {
  const columns: Array<DataTableColumn<SyncLogItem>> = [
    { key: 'provider', header: 'Провайдер', cell: (log) => getProviderLabel(log.providerId) },
    { key: 'status', header: 'Статус', cell: (log) => <StatusPill status={log.status} /> },
    { key: 'synced', header: 'Импорт', cell: (log) => log.syncedCount ?? '—' },
    { key: 'failed', header: 'Ошибки', cell: (log) => log.failedCount ?? '—' },
    { key: 'duration', header: 'Длительность', cell: (log) => log.durationMs != null ? `${log.durationMs} мс` : '—' },
    { key: 'time', header: 'Время', cell: (log) => new Date(log.createdAt).toLocaleString('ru-RU') },
    { key: 'message', header: 'Сообщение', cell: (log) => <span className="text-white/70">{log.message}</span> },
    {
      key: 'actions',
      header: 'Действие',
      cell: (log) => (
        <button
          type="button"
          onClick={() => onRestart(log.providerId)}
          disabled={running}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Перезапустить
        </button>
      ),
    },
  ];

  return (
    <DataTable
      data={logs}
      columns={columns}
      loading={loading}
      compact
      emptyTitle="Журнал пуст"
      emptyDescription="Синхронизации ещё не запускались."
      getRowKey={(log) => log.id}
    />
  );
}
