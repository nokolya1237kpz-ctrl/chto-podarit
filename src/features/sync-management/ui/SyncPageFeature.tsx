'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminShell from '@/components/admin/AdminShell';
import { getProviderLabel } from '@/lib/adminProviders';
import { SyncControls } from './SyncControls';
import { SyncLogsTable, type SyncLogItem } from './SyncLogsTable';

async function fetchSyncLogs() {
  const res = await fetch('/api/admin/sync-logs');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Не удалось загрузить журнал синхронизации');
  }
  return data.data as SyncLogItem[];
}

async function runSync(providerId?: string) {
  const res = await fetch('/api/admin/sync-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(providerId ? { providerId } : {}),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Ошибка синхронизации');
  }
  return data;
}

export default function SyncPageFeature() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const logsQuery = useQuery({
    queryKey: ['sync-logs'],
    queryFn: fetchSyncLogs,
    staleTime: 30 * 1000,
  });

  const syncMutation = useMutation({
    mutationKey: ['sync-products'],
    mutationFn: runSync,
    onSuccess: () => {
      setMessage('Синхронизация завершена');
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : 'Ошибка синхронизации'),
  });

  const logs = logsQuery.data || [];
  const lastSync = logs[0];

  return (
    <AdminShell title="Синхронизация">
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <SyncControls
            running={syncMutation.isPending}
            onSyncAll={() => syncMutation.mutate(undefined)}
            onRefresh={() => logsQuery.refetch()}
          />

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Последний запуск</h2>
            {lastSync ? (
              <div className="mt-5 space-y-3 text-sm text-white/70">
                <div className="rounded-3xl bg-slate-950/70 p-4">
                  <div className="text-white/40">Провайдер</div>
                  <div className="mt-1 font-semibold text-white">{getProviderLabel(lastSync.providerId)}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric label="Статус" value={lastSync.status} />
                  <Metric label="Время" value={new Date(lastSync.createdAt).toLocaleString('ru-RU')} />
                  <Metric label="Импортировано" value={String(lastSync.syncedCount ?? '—')} />
                  <Metric label="Продолжительность" value={lastSync.durationMs != null ? `${lastSync.durationMs} мс` : '—'} />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/60">История синхронизаций пока пуста.</p>
            )}
          </div>
        </div>

        {(message || logsQuery.isError) && (
          <div className="rounded-3xl border border-white/10 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            {message || (logsQuery.error instanceof Error ? logsQuery.error.message : 'Не удалось загрузить журнал')}
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Журнал синхронизации</h2>
          <div className="mt-6">
            <SyncLogsTable
              logs={logs}
              loading={logsQuery.isLoading}
              running={syncMutation.isPending}
              onRestart={(providerId) => syncMutation.mutate(providerId)}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-950/70 p-4">
      <div className="text-white/40">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
