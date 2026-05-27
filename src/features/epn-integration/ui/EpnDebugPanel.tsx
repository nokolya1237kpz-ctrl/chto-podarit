import { DebugDetails } from '@components/common';

type EpnDebugPanelProps = {
  requestUrl?: string;
  requestParams?: unknown;
  responseBody?: unknown;
};

export function EpnDebugPanel({ requestUrl, requestParams, responseBody }: EpnDebugPanelProps) {
  if (!requestUrl) {
    return null;
  }

  return (
    <div className="mt-6">
      <DebugDetails title="Показать технические детали API">
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-slate-100">URL запроса</div>
            <div className="break-all text-slate-300">{requestUrl}</div>
          </div>
          <div>
            <div className="font-semibold text-slate-100">Параметры запроса</div>
            <pre className="mt-2 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs text-slate-300">
              {JSON.stringify(requestParams, null, 2)}
            </pre>
          </div>
          <div>
            <div className="font-semibold text-slate-100">Ответ API</div>
            <pre className="mt-2 max-h-[400px] overflow-auto rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs text-slate-300">
              {JSON.stringify(responseBody, null, 2)}
            </pre>
          </div>
        </div>
      </DebugDetails>
    </div>
  );
}
