import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_18px_50px_rgba(168,85,247,0.25)] hover:brightness-110',
        secondary: 'border border-white/12 bg-white/8 text-white hover:bg-white/12',
        ghost: 'text-white/75 hover:bg-white/8 hover:text-white',
        danger: 'border border-rose-400/30 bg-rose-500/14 text-rose-100 hover:bg-rose-500/22',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-5',
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...props} />
  ),
);

Button.displayName = 'Button';

export { buttonVariants };
