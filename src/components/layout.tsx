import Link from 'next/link';
import { auth } from '@/lib/auth/config';

const links = [
  ['Дашборд', '/'],
  ['Поле', '/board'],
  ['Игроки', '/players'],
  ['Правила', '/rules'],
  ['Админка', '/admin'],
];

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6">
      <header className="meme-border flex flex-wrap items-center justify-between rounded-3xl bg-zinc-950/90 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Igra MVP v1</p>
          <h1 className="text-2xl font-black">Сезонный хаос для своих</h1>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm text-zinc-200">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full border border-zinc-700 px-3 py-1 hover:border-pink-400">
              {label}
            </Link>
          ))}
        </nav>
        <div className="text-right text-sm text-zinc-400">
          <p>{session?.user?.name ?? 'Гость'}</p>
          <p>{session?.user?.role ?? 'anon'}</p>
        </div>
      </header>
      {children}
    </div>
  );
}
