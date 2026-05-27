export function LoadingOverlay({ visible, label = 'Загрузка...' }: { visible: boolean; label?: string }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-slate-950/70 text-sm font-semibold text-white backdrop-blur-sm">
      {label}
    </div>
  );
}
