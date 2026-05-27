import type { ReactNode } from 'react';

export function DebugDetails({ title = 'Показать технические детали', children }: { title?: string; children: ReactNode }) {
  return (
    <details className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <summary className="cursor-pointer select-none text-sm font-semibold text-white">{title}</summary>
      <div className="mt-3 max-h-96 overflow-auto text-xs text-slate-300">{children}</div>
    </details>
  );
}
