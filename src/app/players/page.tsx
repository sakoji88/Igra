import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { players } from '@/lib/data/mock';

export default async function PlayersPage() {
  return (
    <AppLayout>
      <Card>
        <h2 className="text-2xl font-black">Игроки сезона</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => (
            <Link key={player.id} href={`/players/${player.id}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 hover:border-cyan-400">
              <p className="text-lg font-bold">{player.displayName}</p>
              <p className="mt-2 text-sm text-zinc-400">{player.bio}</p>
              <div className="mt-4 flex justify-between text-sm">
                <span>{player.score} очков</span>
                <span>{player.completedRuns} побед</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}
