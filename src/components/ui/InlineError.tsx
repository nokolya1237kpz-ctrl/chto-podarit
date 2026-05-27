export function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-100">{message}</div>;
}
