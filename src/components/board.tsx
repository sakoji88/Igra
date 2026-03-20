import { cn } from '@/lib/utils';

type BoardCellData = {
  id: string;
  index: number;
  label: string | number;
  type: string | number;
  points: string | number;
};

type BoardPlayerData = {
  id: string;
  displayName: string;
  avatarUrl: string;
  boardPosition: number;
  isActivePlayer: boolean;
};

type BoardProps = {
  board: BoardCellData[];
  players: BoardPlayerData[];
  activePlayer: BoardPlayerData;
  seasonName: string;
};

type CellSide = 'bottom' | 'left' | 'top' | 'right';

const boardTypeStyles: Record<string, string> = {
  START: 'border-cyan-300/80 bg-cyan-500/18 text-cyan-50',
  REGULAR: 'border-zinc-700 bg-zinc-950 text-white',
  PODLYANKA: 'border-red-400/80 bg-red-500/18 text-red-50',
  WHEEL: 'border-fuchsia-400/80 bg-fuchsia-500/18 text-fuchsia-50',
  JAIL: 'border-orange-300/80 bg-orange-500/18 text-orange-50',
  LOTTERY: 'border-emerald-300/80 bg-emerald-500/18 text-emerald-50',
  AUCTION: 'border-yellow-200/80 bg-yellow-400/18 text-yellow-50',
  RANDOM: 'border-violet-300/80 bg-violet-500/18 text-violet-50',
  KAIFARIK: 'border-lime-300/80 bg-lime-500/18 text-lime-50',
};

function getCellMeta(index: number) {
  if (index === 0) {
    return { gridColumn: 11, gridRow: 11, side: 'bottom' as CellSide, isCorner: true };
  }

  if (index > 0 && index < 10) {
    return { gridColumn: 11 - index, gridRow: 11, side: 'bottom' as CellSide, isCorner: false };
  }

  if (index === 10) {
    return { gridColumn: 1, gridRow: 11, side: 'left' as CellSide, isCorner: true };
  }

  if (index > 10 && index < 20) {
    return { gridColumn: 1, gridRow: 21 - index, side: 'left' as CellSide, isCorner: false };
  }

  if (index === 20) {
    return { gridColumn: 1, gridRow: 1, side: 'top' as CellSide, isCorner: true };
  }

  if (index > 20 && index < 30) {
    return { gridColumn: index - 19, gridRow: 1, side: 'top' as CellSide, isCorner: false };
  }

  if (index === 30) {
    return { gridColumn: 11, gridRow: 1, side: 'right' as CellSide, isCorner: true };
  }

  return { gridColumn: 11, gridRow: index - 29, side: 'right' as CellSide, isCorner: false };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getMarkerPlacementClasses(side: CellSide, isCorner: boolean) {
  if (side === 'bottom') {
    return cn('left-1/2 top-full -translate-x-1/2 flex-col pt-2', isCorner && 'items-end pr-1');
  }

  if (side === 'top') {
    return cn('bottom-full left-1/2 -translate-x-1/2 flex-col-reverse pb-2', isCorner && 'items-start pl-1');
  }

  if (side === 'left') {
    return cn('right-full top-1/2 -translate-y-1/2 flex-row-reverse pr-2', isCorner && 'items-end');
  }

  return cn('left-full top-1/2 -translate-y-1/2 flex-row pl-2', isCorner && 'items-start');
}

function getMarkerTailClasses(side: CellSide) {
  if (side === 'bottom' || side === 'top') {
    return 'h-4 w-px';
  }

  return 'h-px w-4';
}

function PlayerToken({ player }: { player: BoardPlayerData }) {
  return (
    <div className="group relative flex flex-col items-center">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 text-[10px] font-black uppercase shadow-[0_8px_20px_rgba(0,0,0,0.45)]',
          player.isActivePlayer
            ? 'border-cyan-300 bg-cyan-300/25 text-cyan-50 ring-2 ring-cyan-300/40'
            : 'border-pink-300/70 bg-pink-300/15 text-pink-50',
        )}
        style={{
          backgroundImage: `linear-gradient(rgba(10,10,15,0.16), rgba(10,10,15,0.32)), url(${player.avatarUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        title={player.displayName}
      >
        <span className="rounded-full bg-black/45 px-1.5 py-0.5 backdrop-blur-sm">{getInitials(player.displayName)}</span>
      </div>
      <span className="pointer-events-none absolute top-full z-30 mt-1 whitespace-nowrap rounded-full bg-black/75 px-2 py-1 text-[10px] text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100">
        {player.displayName}
      </span>
    </div>
  );
}

function CellPlayerMarkers({ players, side, isCorner }: { players: BoardPlayerData[]; side: CellSide; isCorner: boolean }) {
  if (players.length === 0) return null;

  return (
    <div className={cn('pointer-events-none absolute z-30 flex items-center gap-2', getMarkerPlacementClasses(side, isCorner))}>
      {(side === 'bottom' || side === 'right') && (
        <span className={cn('shrink-0 rounded-full bg-white/55', getMarkerTailClasses(side))} />
      )}
      <div className={cn('pointer-events-auto flex max-w-28 flex-wrap justify-center gap-1.5', side === 'left' || side === 'right' ? 'max-w-20' : 'max-w-28')}>
        {players.map((player) => (
          <PlayerToken key={player.id} player={player} />
        ))}
      </div>
      {(side === 'top' || side === 'left') && (
        <span className={cn('shrink-0 rounded-full bg-white/55', getMarkerTailClasses(side))} />
      )}
    </div>
  );
}

function BoardCell({ cell, side, playersOnCell }: { cell: BoardCellData; side: CellSide; playersOnCell: BoardPlayerData[] }) {
  const cellType = String(cell.type);
  const points = Number(cell.points);

  return (
    <div
      className={cn(
        'relative flex aspect-square flex-col justify-between rounded-[1.55rem] border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_25px_rgba(0,0,0,0.24)]',
        boardTypeStyles[cellType] ?? boardTypeStyles.REGULAR,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-black/35 px-2 py-1 text-[10px] font-bold tracking-[0.25em] text-white/85">
          {cell.index}
        </span>
        <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/80">
          {cellType}
        </span>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-black uppercase leading-tight tracking-[0.04em]">{cell.label}</h4>
        <p className="text-[11px] text-white/70">
          {points === 0 ? 'Спец-клетка' : `База: ${points} очк.`}
        </p>
      </div>
      <CellPlayerMarkers players={playersOnCell} side={side} isCorner={false} />
    </div>
  );
}

function CornerCell({ cell, side, playersOnCell }: { cell: BoardCellData; side: CellSide; playersOnCell: BoardPlayerData[] }) {
  const cellType = String(cell.type);
  const points = Number(cell.points);
  const displayIndex = cell.index === 0 ? '0 / 40' : String(cell.index);

  return (
    <div
      className={cn(
        'relative z-10 flex aspect-square flex-col justify-between rounded-[1.8rem] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_24px_38px_rgba(0,0,0,0.32)] ring-1 ring-white/10',
        'scale-[1.06]',
        boardTypeStyles[cellType] ?? boardTypeStyles.REGULAR,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-black tracking-[0.28em] text-white/90">
          {displayIndex}
        </span>
        <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
          {cellType}
        </span>
      </div>
      <div className="space-y-2">
        <h4 className="text-base font-black uppercase leading-tight">{cell.label}</h4>
        <p className="text-xs text-white/72">
          {points === 0 ? 'Ключевая спец-клетка' : `База: ${points} очк.`}
        </p>
      </div>
      <CellPlayerMarkers players={playersOnCell} side={side} isCorner />
    </div>
  );
}

export function PerimeterBoard({ board, players, activePlayer, seasonName }: BoardProps) {
  return (
    <div className="relative mx-auto w-full max-w-[1120px]">
      <div className="rounded-[2.25rem] border border-zinc-700/80 bg-[linear-gradient(135deg,rgba(24,24,27,0.98),rgba(9,9,11,0.99))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="grid aspect-square grid-cols-11 grid-rows-11 gap-3">
          {board.map((cell) => {
            const meta = getCellMeta(cell.index);
            const playersOnCell = players.filter((player) => player.boardPosition === cell.index);
            const CellComponent = meta.isCorner ? CornerCell : BoardCell;

            return (
              <div key={cell.id} style={{ gridColumn: meta.gridColumn, gridRow: meta.gridRow }}>
                <CellComponent cell={cell} side={meta.side} playersOnCell={playersOnCell} />
              </div>
            );
          })}

          <div className="col-[4_/_9] row-[4_/_9] flex items-center justify-center">
            <div className="w-full max-w-[320px] rounded-[1.8rem] border border-zinc-700/70 bg-black/55 p-5 text-center shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300">Igra board</p>
              <h3 className="mt-2 text-2xl font-black uppercase leading-tight text-white">{seasonName}</h3>
              <p className="mt-3 text-sm text-zinc-300">
                Настольное поле на 40 клеток. Главный акцент — движение по рамке, а центр держит только краткий статус сезона.
              </p>
              <div className="mt-4 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-left">
                <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-200">Сейчас ходит</p>
                <div className="mt-2 flex items-center gap-3">
                  <PlayerToken player={activePlayer} />
                  <div>
                    <p className="font-black text-white">{activePlayer.displayName}</p>
                    <p className="text-xs text-zinc-300">Клетка {activePlayer.boardPosition}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
