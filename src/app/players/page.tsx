export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { getPlayersList } from '@/lib/server/data';

export default async function PlayersPage() {
  const players = await getPlayersList();

  return (
    <AppLayout>
      <div className="grid gap-6">
        <Card>
          <h2 className="text-3xl font-black">Игроки сезона</h2>
          <p className="mt-3 text-zinc-400">Только реальные зарегистрированные игроки текущего сезона.</p>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => (
            <Link key={player.id} href={`/players/${player.user.id}`} className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5 hover:border-cyan-400/40">
              <div className="flex items-center gap-4">
                <img src={player.user.avatarUrl ?? `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(player.user.nickname)}`} alt="avatar" className="h-16 w-16 rounded-full border border-zinc-700 object-cover" />
                <div>
                  <h3 className="text-lg font-bold">{player.user.profile?.displayName ?? player.user.nickname}</h3>
                  <p className="text-sm text-zinc-500">Счёт: {player.score}</p>
                  <p className="text-sm text-zinc-500">Позиция: {player.boardPosition}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
