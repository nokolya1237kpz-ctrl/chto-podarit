import { Button } from './Button';

export function RetryButton({ onRetry, label = 'Повторить' }: { onRetry: () => void; label?: string }) {
  return (
    <Button type="button" variant="secondary" onClick={onRetry}>
      {label}
    </Button>
  );
}
