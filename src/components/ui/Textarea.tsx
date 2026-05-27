import * as React from 'react';
import { cn } from '@lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-purple-300/45 focus:ring-2 focus:ring-purple-400/15',
      className,
    )}
    {...props}
  />
));

Textarea.displayName = 'Textarea';
