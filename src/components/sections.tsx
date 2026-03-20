import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { assignments, board, eventLog, players, season, wheelDefinitions } from '@/lib/data/mock';
import { calculateScore } from '@/lib/domain/game';
import Link from 'next/link';

const boardTypeStyles: Record<string, string> = {
  START: 'border-cyan-400/70 bg-cyan-500/15 text-cyan-100',
  REGULAR: 'border-zinc-700 bg-zinc-900/95 text-white',
  PODLYANKA: 'border-red-500/70 bg-red-500/15 text-red-100',
  WHEEL: 'border-fuchsia-500/70 bg-fuchsia-500/15 text-fuchsia-100',
  JAIL: 'border-orange-400/70 bg-orange-500/15 text-orange-100',
  LOTTERY: 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100',
  AUCTION: 'border-yellow-300/70 bg-yellow-400/15 text-yellow-100',
  RANDOM: 'border-violet-400/70 bg-violet-500/15 text-violet-100',
  KAIFARIK: 'border-lime-400/70 bg-lime-500/15 text-lime-100',
};

const cornerIndexes = new Set([0, 10, 20, 30]);

function getBoardCellPlacement(index: number) {
  if (index >= 20 && index <= 30) {
    return { gridColumn: index - 19, gridRow: 1 };
  }

  if (index >= 31 && index <= 39) {
    return { gridColumn: 11, gridRow: index - 29 };
  }

  if (index >= 10 && index <= 19) {
    return { gridColumn: 21 - index, gridRow: 11 };
  }

  return { gridColumn: 1, gridRow: 11 - index };
}

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
            <h2 className="text-2xl font-black">Монопольное поле на 40 клеток</h2>
          </div>
          <div className="text-right text-sm text-zinc-400">
            <p>Активный ход</p>
            <p className="font-bold text-white">{activePlayer.displayName}</p>
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 p-3 shadow-[0_0_60px_rgba(244,114,182,0.12)]">
          <div className="grid aspect-square grid-cols-11 grid-rows-11 gap-2">
            {board.map((cell) => {
              const placement = getBoardCellPlacement(cell.index);
              const here = players.filter((player) => player.boardPosition === cell.index);
              const isCorner = cornerIndexes.has(cell.index);
              const cellStyle = boardTypeStyles[cell.type] ?? boardTypeStyles.REGULAR;
              const displayIndex = cell.index === 0 ? '0 / 40' : String(cell.index);

              return (
                <div
                  key={cell.id}
                  style={placement}
                  className={[
                    'flex min-h-0 flex-col justify-between overflow-hidden rounded-[1.35rem] border p-2 transition-transform',
                    isCorner ? 'p-3' : '',
                    cellStyle,
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.25em] opacity-70">{displayIndex}</p>
                      <p className={`${isCorner ? 'text-sm' : 'text-[11px]'} mt-1 font-black uppercase leading-tight`}>
                        {cell.label}
                      </p>
                    </div>
                    <span className="rounded-full bg-black/30 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em]">
                      {cell.type}
                    </span>
                  </div>

                  <div className="mt-2 space-y-2">
                    <p className="text-[10px] opacity-80">
                      {cell.points === 0 ? 'Спец-клетка' : `База: ${cell.points} очк.`}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {here.length > 0 ? here.map((player) => (
                        <span
                          key={player.id}
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            player.isActivePlayer
                              ? 'bg-cyan-300 text-zinc-950'
                              : 'bg-pink-500/20 text-pink-100'
                          }`}
                        >
                          {player.displayName}
                        </span>
                      )) : <span className="text-[10px] opacity-40">Пусто</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="col-[3_/_11] row-[3_/_11] flex flex-col justify-between rounded-[2rem] border border-dashed border-zinc-700 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_rgba(24,24,27,0.96),_rgba(9,9,11,0.98))] p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Igra board</p>
                <h3 className="mt-2 text-4xl font-black uppercase leading-none text-white">Monopoly style</h3>
                <p className="mt-4 max-w-md text-sm text-zinc-300">
                  40 клеток по периметру: старт совмещён с финишем, на 10-й клетке тюрьма,
                  на 20-й аукционная, на 30-й лотерея. Всё выглядит как настольное поле, а не просто сетка карточек.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Сейчас ходит</p>
                  <p className="mt-2 text-xl font-black">{activePlayer.displayName}</p>
                  <p className="mt-1 text-sm text-zinc-300">Позиция: клетка {activePlayer.boardPosition}</p>
                </div>
                <div className="rounded-2xl border border-pink-500/30 bg-pink-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-pink-200">Ключевые углы</p>
                  <p className="mt-2 text-sm text-zinc-200">0/40 — Старт, 10 — Тюрьма, 20 — Аукционная, 30 — Лотерея.</p>
                </div>
              </div>
            </div>
          </div>
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
        <p className="mt-4 text-xs text-zinc-500">Теперь поле визуально повторяет настолку: длинные рёбра, жирные углы и отдельный центр под сезонную инфу.</p>
      </Card>
    </div>
  );
}
