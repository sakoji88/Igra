import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { assignments, eventLog, players } from '@/lib/data/mock';

export default async function AdminPage() {
  return (
    <AppLayout>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-6">
          <Card>
            <h2 className="text-2xl font-black">Панель judge/admin</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {['Изменить счёт', 'Сдвинуть позицию', 'Выдать предмет', 'Снять предмет', 'Откатить safe action', 'Сменить активного игрока'].map((label) => (
                <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <p className="font-semibold">{label}</p>
                  <Button variant="ghost" className="mt-3 w-full">Открыть</Button>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Игроки</h3>
            <div className="mt-4 grid gap-3">{players.map((player) => <div key={player.id} className="flex items-center justify-between rounded-2xl bg-zinc-900/80 px-4 py-3"><span>{player.displayName}</span><span className="text-sm text-zinc-400">Порядок хода: {player.turnOrder}</span></div>)}</div>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card>
            <h3 className="text-xl font-bold">Спорные и активные ранa</h3>
            <div className="mt-4 grid gap-3 text-sm">{assignments.map((assignment) => <div key={assignment.id} className="rounded-2xl bg-zinc-900/80 p-4"><p className="font-semibold">{assignment.title}</p><p className="text-zinc-400">{assignment.status}</p></div>)}</div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Импорт CSV</h3>
            <p className="mt-3 text-sm text-zinc-400">Форматы и пример-файлы лежат в samples/legacy и docs/legacy-import.md.</p>
            <div className="mt-4 flex gap-3"><Button>Импорт игроков</Button><Button variant="secondary">Импорт ранoв</Button></div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Журнал действий</h3>
            <div className="mt-3 grid gap-3 text-sm">{eventLog.map((event) => <div key={event.id} className="rounded-xl bg-zinc-900/80 p-3">{event.summary}</div>)}</div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
