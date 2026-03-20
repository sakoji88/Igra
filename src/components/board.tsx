'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type BoardSlotSide = 'bottom' | 'left' | 'top' | 'right';

type BoardCellData = {
  id: string;
  index: number;
  slotNumber: number;
  name: string;
  type: string;
  side: BoardSlotSide;
  points: number;
  imageUrl: string | null;
  imageFallback: string;
  baseConditions: string[];
  genreConditions: string[];
  description?: string;
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

type CellMeta = {
  gridColumn: number;
  gridRow: number;
  side: BoardSlotSide;
  isCorner: boolean;
};

const boardTypeStyles: Record<string, string> = {
  START: 'from-cyan-500/28 to-cyan-950 text-cyan-50',
  REGULAR: 'from-zinc-900 to-zinc-950 text-white',
  PODLYANKA: 'from-red-500/26 to-zinc-950 text-red-50',
  WHEEL: 'from-fuchsia-500/26 to-zinc-950 text-fuchsia-50',
  JAIL: 'from-orange-500/26 to-zinc-950 text-orange-50',
  LOTTERY: 'from-emerald-500/26 to-zinc-950 text-emerald-50',
  AUCTION: 'from-yellow-400/26 to-zinc-950 text-yellow-50',
  RANDOM: 'from-violet-500/26 to-zinc-950 text-violet-50',
  KAIFARIK: 'from-lime-500/26 to-zinc-950 text-lime-50',
};

function getCellMeta(index: number): CellMeta {
  if (index === 0) {
    return { gridColumn: 11, gridRow: 11, side: 'bottom', isCorner: true };
  }

  if (index > 0 && index < 10) {
    return { gridColumn: 11 - index, gridRow: 11, side: 'bottom', isCorner: false };
  }

  if (index === 10) {
    return { gridColumn: 1, gridRow: 11, side: 'left', isCorner: true };
  }

  if (index > 10 && index < 20) {
    return { gridColumn: 1, gridRow: 21 - index, side: 'left', isCorner: false };
  }

  if (index === 20) {
    return { gridColumn: 1, gridRow: 1, side: 'top', isCorner: true };
  }

  if (index > 20 && index < 30) {
    return { gridColumn: index - 19, gridRow: 1, side: 'top', isCorner: false };
  }

  if (index === 30) {
    return { gridColumn: 11, gridRow: 1, side: 'right', isCorner: true };
  }

  return { gridColumn: 11, gridRow: index - 29, side: 'right', isCorner: false };
}

function getCornerClasses(index: number) {
  if (index === 0) return 'rounded-br-[1.35rem] origin-bottom-right';
  if (index === 10) return 'rounded-bl-[1.35rem] origin-bottom-left';
  if (index === 20) return 'rounded-tl-[1.35rem] origin-top-left';
  return 'rounded-tr-[1.35rem] origin-top-right';
}

function getSideLabel(side: BoardSlotSide) {
  if (side === 'bottom') return 'нижняя';
  if (side === 'left') return 'левая';
  if (side === 'top') return 'верхняя';
  return 'правая';
}

function getSideBasePoints(side: BoardSlotSide) {
  if (side === 'bottom') return 1;
  if (side === 'left') return 2;
  if (side === 'top') return 3;
  return 4;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getMarkerPlacementClasses(side: BoardSlotSide, isCorner: boolean) {
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

function getMarkerTailClasses(side: BoardSlotSide) {
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

function CellPlayerMarkers({ players, side, isCorner }: { players: BoardPlayerData[]; side: BoardSlotSide; isCorner: boolean }) {
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

function SlotArtwork({ cell, isCorner }: { cell: BoardCellData; isCorner: boolean }) {
  if (cell.imageUrl) {
    return (
      <div
        className="h-full w-full rounded-[1rem] bg-cover bg-center"
        style={{ backgroundImage: `url(${cell.imageUrl})` }}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center rounded-[1rem] border border-white/10 bg-black/20">
      <span className={cn('drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]', isCorner ? 'text-5xl' : 'text-4xl')}>
        {cell.imageFallback}
      </span>
    </div>
  );
}

function BoardTile({
  cell,
  meta,
  playersOnCell,
  onSelect,
}: {
  cell: BoardCellData;
  meta: CellMeta;
  playersOnCell: BoardPlayerData[];
  onSelect: (cell: BoardCellData) => void;
}) {
  const isCorner = meta.isCorner;

  return (
    <button
      type="button"
      onClick={() => onSelect(cell)}
      className={cn(
        'relative flex h-full w-full flex-col border border-black/35 bg-gradient-to-br p-2 text-left transition-transform hover:z-20 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-300/70',
        isCorner ? cn('p-3 sm:p-4', getCornerClasses(cell.index), 'scale-[1.06]') : 'p-2.5 sm:p-3',
        boardTypeStyles[cell.type] ?? boardTypeStyles.REGULAR,
      )}
      aria-label={`Открыть слот ${cell.slotNumber}: ${cell.name}`}
    >
      <div className="flex items-start justify-between">
        <span className={cn('bg-black/45 px-2 py-1 font-black tracking-[0.28em] text-white/90', isCorner ? 'text-[10px]' : 'text-[9px]')}>
          {cell.slotNumber === 0 ? '0 / 40' : cell.slotNumber}
        </span>
      </div>
      <div className="mt-2 flex-1">
        <SlotArtwork cell={cell} isCorner={isCorner} />
      </div>
      <CellPlayerMarkers players={playersOnCell} side={meta.side} isCorner={isCorner} />
    </button>
  );
}

function SlotDetailWindow({
  cell,
  onClose,
}: {
  cell: BoardCellData;
  onClose: () => void;
}) {
  const basePoints = getSideBasePoints(cell.side);
  const genrePoints = basePoints * 2;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-6">
      <div className="pointer-events-auto w-full max-w-[720px] rounded-[1.6rem] border border-zinc-700 bg-zinc-950/96 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300">Слот {cell.slotNumber === 0 ? '0 / 40' : cell.slotNumber}</p>
            <h4 className="mt-2 text-2xl font-black text-white">{cell.name}</h4>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-200">
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">Сторона: {getSideLabel(cell.side)}</span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">Основные: {basePoints}</span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">Жанровые: {genrePoints}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:border-cyan-300 hover:text-white"
          >
            Закрыть
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Основные условия</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-200">
              {cell.baseConditions.map((condition) => <li key={condition}>• {condition}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-pink-300">Жанровые условия</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-200">
              {cell.genreConditions.map((condition) => <li key={condition}>• {condition}</li>)}
            </ul>
          </div>
        </div>

        {cell.description && (
          <p className="mt-4 text-xs text-zinc-400">{cell.description}</p>
        )}
      </div>
    </div>
  );
}

export function PerimeterBoard({ board, players, activePlayer, seasonName }: BoardProps) {
  const [selectedCell, setSelectedCell] = useState<BoardCellData | null>(null);

  return (
    <div className="relative mx-auto w-full max-w-[1120px]">
      <div className="rounded-[2.35rem] border-[10px] border-zinc-800 bg-[linear-gradient(135deg,rgba(39,39,42,0.98),rgba(10,10,12,1))] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="relative overflow-visible rounded-[1.7rem] border-2 border-zinc-600 bg-zinc-950 p-2">
          <div className="pointer-events-none absolute inset-[17.5%] rounded-[1.2rem] border-2 border-zinc-700/90" />
          <div className="grid aspect-square grid-cols-11 grid-rows-11 gap-px bg-zinc-800/90">
            {board.map((cell) => {
              const meta = getCellMeta(cell.slotNumber);
              const playersOnCell = players.filter((player) => player.boardPosition === cell.slotNumber);

              return (
                <div key={cell.id} style={{ gridColumn: meta.gridColumn, gridRow: meta.gridRow }} className="bg-zinc-950">
                  <BoardTile cell={cell} meta={meta} playersOnCell={playersOnCell} onSelect={setSelectedCell} />
                </div>
              );
            })}

            <div className="col-[4_/_9] row-[4_/_9] flex items-center justify-center p-4">
              <div className="w-full max-w-[280px] rounded-[1.3rem] border border-zinc-700/70 bg-black/60 p-4 text-center shadow-[0_18px_35px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300">Igra board</p>
                <h3 className="mt-2 text-xl font-black uppercase leading-tight text-white">{seasonName}</h3>
                <p className="mt-2 text-xs text-zinc-300">Центр хранит только краткий статус. Вся детализация слота открывается по клику.</p>
                <div className="mt-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-3 text-left">
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

          {selectedCell ? <SlotDetailWindow cell={selectedCell} onClose={() => setSelectedCell(null)} /> : null}
        </div>
      </div>
    </div>
  );
}
