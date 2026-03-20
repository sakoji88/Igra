export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { getDashboardData } from '@/lib/server/data';

export default async function HomePage() {
  const { season, states, logs } = await getDashboardData();

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-6">
          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Текущий сезон</p>
            <h2 className="mt-2 text-3xl font-black">{season.name}</h2>
            <p className="mt-3 max-w-2xl text-zinc-400">Теперь это уже не mock-дашборд: игроки регистрируются сами, появляются на старте, кидают кубы с сервера и получают живые раны в профиль.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/board" className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100">На поле</Link>
              <Link href="/players" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200">Игроки</Link>
              <Link href="/rules" className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200">Правила</Link>
            </div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Лидерборд сезона</h3>
            <div className="mt-4 grid gap-3">
              {states.map((state, index) => (
                <div key={state.id} className="flex items-center justify-between rounded-2xl bg-zinc-900/80 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">#{index + 1}</p>
                    <p className="font-semibold">{state.user.profile?.displayName ?? state.user.nickname}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-pink-300">{state.score}</p>
                    <p className="text-xs text-zinc-500">очков</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card>
            <h3 className="text-xl font-bold">События</h3>
            <div className="mt-4 grid gap-3 text-sm">
              {logs.map((event) => (
                <div key={event.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
                  <p>{event.summary}</p>
                  <p className="mt-1 text-xs text-zinc-500">{event.createdAt.toLocaleString('ru-RU')}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
