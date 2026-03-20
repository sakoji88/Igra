import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { assignments, board, eventLog, players, season, wheelDefinitions } from '@/lib/data/mock';
import { calculateScore } from '@/lib/domain/game';
import Link from 'next/link';

export function DashboardView() {
  const activePlayer = players.find((player) => player.isActivePlayer);
  const leaderboard = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="grid gap-6">
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Текущий сезон</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">{season.name}</h2>
              <p className="mt-2 max-w-2xl text-zinc-400">MVP держит базовый цикл: бросок, движение, выбор типа условий, запуск рана, Win/Drop, спорные кейсы, инвентарь и лог событий.</p>
            </div>
            <div className="rounded-2xl border border-pink-500/50 bg-pink-500/10 px-4 py-3 text-right">
              <p className="text-sm text-zinc-400">Активный игрок</p>
              <p className="text-xl font-bold">{activePlayer?.displayName}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/board"><Button>На поле</Button></Link>
            <Link href="/players"><Button variant="secondary">Профили</Button></Link>
            <Link href="/rules"><Button variant="ghost">Открыть правила</Button></Link>
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-bold">Лидерборд</h3>
          <div className="mt-4 grid gap-3">
            {leaderboard.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between rounded-2xl bg-zinc-900/80 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">#{index + 1}</p>
                  <p className="font-semibold">{player.displayName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-pink-300">{player.score}</p>
                  <p className="text-xs text-zinc-500">очков сезона</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid gap-6">
        <Card>
          <h3 className="text-xl font-bold">Свежий лог</h3>
          <div className="mt-4 grid gap-3 text-sm">
            {eventLog.map((event) => (
              <div key={event.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
                <p>{event.summary}</p>
                <p className="mt-1 text-xs text-zinc-500">{event.createdAt}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-bold">Конфиг MVP</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-300">
            <li>{board.length} клеток на периметре.</li>
            <li>{assignments.length} демонстрационных ранa.</li>
            <li>{wheelDefinitions.length} случайных колеса.</li>
            <li>Жанровый ран на клетке 4 очка даст {calculateScore(4, 'GENRE')} очков.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function BoardView() {
  const activePlayer = players.find((player) => player.isActivePlayer)!;
  return (
    <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Поле сезона</p>
            <h2 className="text-2xl font-black">Прямоугольный периметр MVP</h2>
          </div>
          <div className="text-right text-sm text-zinc-400">
            <p>Активный ход</p>
            <p className="font-bold text-white">{activePlayer.displayName}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-3">
          {board.map((cell) => {
            const here = players.filter((player) => player.boardPosition === cell.index);
            return (
              <div key={cell.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">#{cell.index}</p>
                    <p className="font-semibold">{cell.label}</p>
                  </div>
                  <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs">{cell.type}</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">Базовые очки: {cell.points}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {here.map((player) => (
                    <span key={player.id} className="rounded-full bg-pink-500/15 px-2 py-1 text-xs text-pink-200">{player.displayName}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <h3 className="text-xl font-bold">Ход игрока</h3>
        <div className="mt-4 space-y-4 text-sm text-zinc-300">
          <p>1. Бросок 2d6.</p>
          <p>2. Перемещение по сумме.</p>
          <p>3. Разрешение специальной клетки.</p>
          <p>4. Если клетка игровая — выбор типа условий после движения.</p>
        </div>
        <div className="mt-6 grid gap-3">
          <Button>Бросить 2d6</Button>
          <Button variant="secondary">Выбрать base-условие</Button>
          <Button variant="secondary">Выбрать genre-условие</Button>
          <Button variant="ghost">Win</Button>
          <Button variant="danger">Drop</Button>
        </div>
        <p className="mt-4 text-xs text-zinc-500">В MVP кнопки показывают полный сценарий и серверный контракт; подключение к реальным server actions — следующий слой без ломки домена.</p>
      </Card>
    </div>
  );
}
