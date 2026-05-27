export type BulkImportPreset = {
  label: string;
  queries: string[];
};

export function BulkImportPresetButtons({ presets, loading, onRun }: { presets: BulkImportPreset[]; loading: string; onRun: (preset: BulkImportPreset) => void }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {presets.map((preset) => (
        <button
          key={preset.label}
          disabled={loading === preset.label}
          onClick={() => onRun(preset)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
