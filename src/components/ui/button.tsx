import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'danger' | 'ghost';
};

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  const variants = {
    default: 'bg-pink-600 hover:bg-pink-500 text-white',
    secondary: 'bg-violet-600 hover:bg-violet-500 text-white',
    danger: 'bg-red-700 hover:bg-red-600 text-white',
    ghost: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700',
  };

  return (
    <button
      className={cn(
        'rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
