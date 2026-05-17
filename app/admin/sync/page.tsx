'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { ADMIN_PROVIDERS, getProviderIcon, getProviderLabel } from '@/lib/adminProviders';

interface SyncLogItem {
  id: string;
  providerId: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  syncedCount?: number | null;
  failedCount?: number | null;
  durationMs?: number | null;
  createdAt: string;
}

export default function AdminSyncPage() {
  const [logs, setLogs] = useState<SyncLogItem[]>([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const res = await fetch('/api/admin/sync-logs');
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.data);
      } else {
        setMessage(data.error || 'Не удалось загрузить логи');
      }
    } catch (error) {
      console.error(error);
      setMessage('Ошибка загрузки логов');
    }
  }

  async function sync(providerId?: string) {
    setMessage('');
    setRunning(true);
    try {
      const res = await fetch('/api/admin/sync-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerId ? { providerId } : {}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Синхронизация завершена');
        await loadLogs();
      } else {
        setMessage(data.error || 'Ошибка синхронизации');
      }
    } catch (error) {
      console.error(error);
      setMessage('Ошибка синхронизации');
    } finally {
      setRunning(false);
    }
  }

  const lastSync = logs[0];

  return (
    <AdminShell title="Синхронизация">
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Центр синхронизации</h2>
            <p className="mt-3 text-sm text-white/60">Запускайте синхронизацию по всем провайдерам или по одному провайдеру.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => sync()}
                disabled={running}
                className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
              >
                Синхронизировать всё
              </button>
              <button
                onClick={() => loadLogs()}
                disabled={running}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
              >
                Обновить логи
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Последний запуск</h2>
            {lastSync ? (
              <div className="mt-5 space-y-3 text-sm text-white/70">
                <div className="rounded-3xl bg-slate-950/70 p-4">
                  <div className="text-white/40">Провайдер</div>
                  <div className="mt-1 font-semibold text-white">{getProviderLabel(lastSync.providerId)}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-950/70 p-4">
                    <div className="text-white/40">Статус</div>
                    <div className="mt-1 font-semibold">{lastSync.status}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-950/70 p-4">
                    <div className="text-white/40">Время</div>
                    <div className="mt-1 font-semibold">{new Date(lastSync.createdAt).toLocaleString('ru-RU')}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-950/70 p-4">
                    <div className="text-white/40">Импортировано</div>
                    <div className="mt-1 font-semibold">{lastSync.syncedCount ?? '—'}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-950/70 p-4">
                    <div className="text-white/40">Продолжительность</div>
                    <div className="mt-1 font-semibold">{lastSync.durationMs != null ? `${lastSync.durationMs} мс` : '—'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/60">История синхронизаций пока пуста.</p>
            )}
          </div>
        </div>

        {message && <div className="rounded-3xl border border-white/10 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div>}

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Журнал синхронизации</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm text-white/80">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-white/60">Провайдер</th>
                  <th className="px-4 py-3 text-white/60">Статус</th>
                  <th className="px-4 py-3 text-white/60">Импорт</th>
                  <th className="px-4 py-3 text-white/60">Ошибки</th>
                  <th className="px-4 py-3 text-white/60">Длительность</th>
                  <th className="px-4 py-3 text-white/60">Время</th>
                  <th className="px-4 py-3 text-white/60">Сообщение</th>
                  <th className="px-4 py-3 text-white/60">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">{getProviderLabel(log.providerId)}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{log.status}</td>
                    <td className="px-4 py-3">{log.syncedCount ?? '—'}</td>
                    <td className="px-4 py-3">{log.failedCount ?? '—'}</td>
                    <td className="px-4 py-3">{log.durationMs != null ? `${log.durationMs} мс` : '—'}</td>
                    <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3 text-white/70">{log.message}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => sync(log.providerId)}
                        disabled={running}
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
                      >
                        Перезапустить
                      </button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-white/50">
                      Логи не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
