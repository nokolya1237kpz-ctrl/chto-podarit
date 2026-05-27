import type { ReactNode } from 'react';
import { ErrorState } from './ErrorState';
import { Skeleton } from './Skeleton';

type AsyncBoundaryProps = {
  loading?: boolean;
  error?: string;
  children: ReactNode;
};

export function AsyncBoundary({ loading, error, children }: AsyncBoundaryProps) {
  if (loading) return <Skeleton className="h-32" />;
  if (error) return <ErrorState message={error} />;
  return <>{children}</>;
}
