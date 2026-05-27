import type { CompareSearchResponse } from '../model/types';

export function CompareDiagnostics({ data }: { data: CompareSearchResponse | null }) {
  if (process.env.NODE_ENV === 'production' || !data?.diagnostics?.length) return null;

  return (
    <details className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4">
      <summary className="cursor-pointer text-sm font-semibold">Показать технические детали</summary>
      <pre className="mt-3 max-h-72 max-w-full overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
        {JSON.stringify({ sourceStats: data.sourceStats, diagnostics: data.diagnostics }, null, 2)}
      </pre>
    </details>
  );
}
