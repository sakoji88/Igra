import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { assignments, eventLog, items, players } from '@/lib/data/mock';

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = players.find((entry) => entry.id === id);
  if (!player) notFound();

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="text-3xl font-black">{player.displayName}</h2>
          <p className="mt-2 text-zinc-400">{player.bio}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Stat label="Сезонный счёт" value={player.score} />
            <Stat label="Позиция" value={player.boardPosition} />
            <Stat label="Дропы" value={player.drops} />
            <Stat label="Победы" value={player.completedRuns} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="bg-zinc-900/90">
              <h3 className="font-bold">Инвентарь</h3>
              <div className="mt-3 flex flex-wrap gap-2">{player.inventory.map((code) => <Badge key={code}>{items.find((item) => item.code === code)?.name ?? code}</Badge>)}</div>
            </Card>
            <Card className="bg-zinc-900/90">
              <h3 className="font-bold">Активные эффекты</h3>
              <div className="mt-3 flex flex-wrap gap-2">{player.activeEffects.map((code) => <Badge key={code}>{items.find((item) => item.code === code)?.name ?? code}</Badge>)}</div>
            </Card>
          </div>
        </Card>
        <div className="grid gap-6">
          <Card>
            <h3 className="font-bold">Активный ран</h3>
            <p className="mt-3 text-sm text-zinc-300">{player.activeAssignment?.title ?? 'Нет активного рана'}</p>
          </Card>
          <Card>
            <h3 className="font-bold">Последние события</h3>
            <div className="mt-3 grid gap-3 text-sm">{eventLog.filter((event) => event.actorId === player.id).map((event) => <div key={event.id} className="rounded-xl bg-zinc-900/80 p-3">{event.summary}</div>)}</div>
          </Card>
          <Card>
            <h3 className="font-bold">История ранoв</h3>
            <div className="mt-3 grid gap-3 text-sm">{assignments.filter((entry) => entry.userId === player.id).map((assignment) => <div key={assignment.id} className="rounded-xl bg-zinc-900/80 p-3">{assignment.title} — {assignment.status}</div>)}</div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm text-cyan-200">{children}</span>;
}
