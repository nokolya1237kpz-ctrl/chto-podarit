import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-white/14 bg-white/[0.04] p-8 text-center text-white">
      <h3 className="text-xl font-bold">{title}</h3>
      {description ? <p className="mx-auto mt-3 max-w-lg text-sm text-white/58">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button type="button" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
