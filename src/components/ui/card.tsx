import { cn } from '@/lib/utils';
import type { PropsWithChildren } from 'react';

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn('meme-border rounded-2xl bg-zinc-950/80 p-5', className)}>{children}</section>;
}
