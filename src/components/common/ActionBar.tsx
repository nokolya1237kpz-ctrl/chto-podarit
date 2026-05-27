import type { ReactNode } from 'react';
import { cn } from '@lib/utils/cn';

export function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>;
}
