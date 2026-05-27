import { Button, type ButtonProps } from './Button';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({ loading, loadingText = 'Загрузка...', disabled, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? loadingText : children}
    </Button>
  );
}
