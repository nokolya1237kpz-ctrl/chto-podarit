import { DebugDetails } from '@components/common';

type ProviderDiagnosticsPanelProps = {
  diagnostics: unknown[];
  samples?: Array<{ title?: string; price?: number | string; marketplace?: string }>;
  statusInfo?: unknown;
};

export function ProviderDiagnosticsPanel({ diagnostics, samples = [], statusInfo }: ProviderDiagnosticsPanelProps) {
  return (
    <div className="mt-4">
      <DebugDetails title="Показать технические детали">
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(
            {
              statusInfo,
              diagnostics,
              samples: samples.slice(0, 3),
            },
            null,
            2
          )}
        </pre>
      </DebugDetails>
    </div>
  );
}
