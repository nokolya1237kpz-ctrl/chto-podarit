import * as React from 'react';
import { cn } from '@lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-purple-300/45 focus:ring-2 focus:ring-purple-400/15',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = 'Select';
