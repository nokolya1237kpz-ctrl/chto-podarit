interface ErrorStateProps {
  title?: string;
  message: string;
}

export function ErrorState({ title = 'Не удалось выполнить действие', message }: ErrorStateProps) {
  return (
    <div className="rounded-3xl border border-rose-300/20 bg-rose-500/10 p-5 text-rose-50">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm text-rose-100/80">{message}</p>
    </div>
  );
}
