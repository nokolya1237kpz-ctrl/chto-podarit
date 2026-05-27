export function CompareLoadingState() {
  return (
    <div className="mt-8 grid gap-4">
      {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-3xl bg-white/5" />)}
    </div>
  );
}
