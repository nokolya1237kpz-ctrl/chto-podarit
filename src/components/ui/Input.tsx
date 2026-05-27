import * as React from 'react';
import { cn } from '@lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-11 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-purple-300/45 focus:ring-2 focus:ring-purple-400/15',
      className,
    )}
    {...props}
  />
));

Input.displayName = 'Input';
