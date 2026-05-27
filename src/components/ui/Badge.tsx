import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'border-white/10 bg-white/8 text-white/75',
      success: 'border-emerald-300/25 bg-emerald-400/12 text-emerald-100',
      warning: 'border-amber-300/25 bg-amber-400/12 text-amber-100',
      danger: 'border-rose-300/25 bg-rose-400/12 text-rose-100',
      accent: 'border-purple-300/25 bg-purple-400/12 text-purple-100',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
