import { ActionBar } from '@components/common';

type SyncControlsProps = {
  running?: boolean;
  onSyncAll: () => void;
  onRefresh: () => void;
};

export function SyncControls({ running, onSyncAll, onRefresh }: SyncControlsProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
      <h2 className="text-xl font-semibold">Центр синхронизации</h2>
      <p className="mt-3 text-sm text-white/60">Запускайте синхронизацию по всем провайдерам или обновляйте журнал событий.</p>
      <ActionBar className="mt-6">
        <button
          onClick={onSyncAll}
          disabled={running}
          className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {running ? 'Синхронизируем...' : 'Синхронизировать всё'}
        </button>
        <button
          onClick={onRefresh}
          disabled={running}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Обновить журнал
        </button>
      </ActionBar>
    </div>
  );
}
