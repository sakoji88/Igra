'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type BoardSlotSide = 'bottom' | 'left' | 'top' | 'right';
type BoardSlotType = 'START' | 'REGULAR' | 'RANDOM' | 'JAIL' | 'LOTTERY' | 'AUCTION' | 'PODLYANKA' | 'KAIFARIK' | 'WHEEL';

type BoardCellData = {
  id: string;
  index: number;
  slotNumber: number;
  name: string;
  type: BoardSlotType;
  side: BoardSlotSide;
  points: number;
  imageUrl: string | null;
  imageFallback: string;
  baseConditions: string[];
  genreConditions: string[];
  description?: string;
  playable?: boolean;
  isPublished?: boolean;
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
  currentPosition: number;
  hasActiveRun: boolean;
  isAdmin: boolean;
  initialRoll?: { die1: number | null; die2: number | null; total: number | null };
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

const slotTypeOptions: BoardSlotType[] = ['START', 'REGULAR', 'RANDOM', 'JAIL', 'LOTTERY', 'AUCTION', 'PODLYANKA', 'KAIFARIK', 'WHEEL'];
const slotSideOptions: Array<{ label: string; value: 'BOTTOM' | 'LEFT' | 'TOP' | 'RIGHT' }> = [
  { label: 'Низ', value: 'BOTTOM' },
  { label: 'Лево', value: 'LEFT' },
  { label: 'Верх', value: 'TOP' },
  { label: 'Право', value: 'RIGHT' },
];

function getCellMeta(index: number): CellMeta {
  if (index === 0) return { gridColumn: 11, gridRow: 11, side: 'bottom', isCorner: true };
  if (index > 0 && index < 10) return { gridColumn: 11 - index, gridRow: 11, side: 'bottom', isCorner: false };
  if (index === 10) return { gridColumn: 1, gridRow: 11, side: 'left', isCorner: true };
  if (index > 10 && index < 20) return { gridColumn: 1, gridRow: 21 - index, side: 'left', isCorner: false };
  if (index === 20) return { gridColumn: 1, gridRow: 1, side: 'top', isCorner: true };
  if (index > 20 && index < 30) return { gridColumn: index - 19, gridRow: 1, side: 'top', isCorner: false };
  if (index === 30) return { gridColumn: 11, gridRow: 1, side: 'right', isCorner: true };
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
  return name.split(' ').map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function getMarkerPlacementClasses(side: BoardSlotSide, isCorner: boolean) {
  if (side === 'bottom') return cn('left-1/2 top-full -translate-x-1/2 flex-col pt-2', isCorner && 'items-end pr-1');
  if (side === 'top') return cn('bottom-full left-1/2 -translate-x-1/2 flex-col-reverse pb-2', isCorner && 'items-start pl-1');
  if (side === 'left') return cn('right-full top-1/2 -translate-y-1/2 flex-row-reverse pr-2', isCorner && 'items-end');
  return cn('left-full top-1/2 -translate-y-1/2 flex-row pl-2', isCorner && 'items-start');
}

function getMarkerTailClasses(side: BoardSlotSide) {
  if (side === 'bottom' || side === 'top') return 'h-4 w-px';
  return 'h-px w-4';
}

function PlayerToken({ player }: { player: BoardPlayerData }) {
  return (
    <div className="group relative flex flex-col items-center">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 text-[10px] font-black uppercase shadow-[0_8px_20px_rgba(0,0,0,0.45)]',
          player.isActivePlayer ? 'border-cyan-300 bg-cyan-300/25 text-cyan-50 ring-2 ring-cyan-300/40' : 'border-pink-300/70 bg-pink-300/15 text-pink-50',
        )}
        style={{ backgroundImage: `linear-gradient(rgba(10,10,15,0.16), rgba(10,10,15,0.32)), url(${player.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        title={player.displayName}
      >
        <span className="rounded-full bg-black/45 px-1.5 py-0.5 backdrop-blur-sm">{getInitials(player.displayName)}</span>
      </div>
      <span className="pointer-events-none absolute top-full z-30 mt-1 whitespace-nowrap rounded-full bg-black/75 px-2 py-1 text-[10px] text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100">{player.displayName}</span>
    </div>
  );
}

function CellPlayerMarkers({ players, side, isCorner }: { players: BoardPlayerData[]; side: BoardSlotSide; isCorner: boolean }) {
  if (players.length === 0) return null;
  return (
    <div className={cn('pointer-events-none absolute z-30 flex items-center gap-2', getMarkerPlacementClasses(side, isCorner))}>
      {(side === 'bottom' || side === 'right') && <span className={cn('shrink-0 rounded-full bg-white/55', getMarkerTailClasses(side))} />}
      <div className={cn('pointer-events-auto flex max-w-28 flex-wrap justify-center gap-1.5', side === 'left' || side === 'right' ? 'max-w-20' : 'max-w-28')}>
        {players.map((player) => <PlayerToken key={player.id} player={player} />)}
      </div>
      {(side === 'top' || side === 'left') && <span className={cn('shrink-0 rounded-full bg-white/55', getMarkerTailClasses(side))} />}
    </div>
  );
}

function SlotArtwork({ cell, isCorner }: { cell: BoardCellData; isCorner: boolean }) {
  if (cell.imageUrl) {
    return <div className="h-full w-full rounded-[1rem] bg-cover bg-center" style={{ backgroundImage: `url(${cell.imageUrl})` }} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center rounded-[1rem] border border-white/10 bg-black/20">
      <span className={cn('drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]', isCorner ? 'text-5xl' : 'text-4xl')}>{cell.imageFallback}</span>
    </div>
  );
}

function BoardTile({ cell, meta, playersOnCell, onSelect }: { cell: BoardCellData; meta: CellMeta; playersOnCell: BoardPlayerData[]; onSelect: (cell: BoardCellData) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cell)}
      className={cn(
        'relative flex h-full w-full flex-col border border-black/35 bg-gradient-to-br p-2 text-left transition-transform hover:z-20 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-300/70',
        meta.isCorner ? cn('p-3 sm:p-4', getCornerClasses(cell.index), 'scale-[1.06]') : 'p-2.5 sm:p-3',
        !cell.isPublished && 'opacity-50 grayscale',
        boardTypeStyles[cell.type] ?? boardTypeStyles.REGULAR,
      )}
      aria-label={`Открыть слот ${cell.slotNumber}: ${cell.name}`}
    >
      <div className="flex items-start justify-between">
        <span className={cn('bg-black/45 px-2 py-1 font-black tracking-[0.28em] text-white/90', meta.isCorner ? 'text-[10px]' : 'text-[9px]')}>
          {cell.slotNumber === 0 ? '0 / 40' : cell.slotNumber}
        </span>
      </div>
      <div className="mt-2 flex-1"><SlotArtwork cell={cell} isCorner={meta.isCorner} /></div>
      <CellPlayerMarkers players={playersOnCell} side={meta.side} isCorner={meta.isCorner} />
    </button>
  );
}

function SlotDetailWindow({
  cell,
  onClose,
  canAssign,
  onAssign,
  isPending,
  isAdmin,
  onSave,
}: {
  cell: BoardCellData;
  onClose: () => void;
  canAssign: boolean;
  onAssign: (conditionType: 'BASE' | 'GENRE') => void;
  isPending: boolean;
  isAdmin: boolean;
  onSave: (payload: Record<string, string>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  type SlotEditState = {
    slotNumber: string;
    name: string;
    type: string;
    side: string;
    imageUrl: string;
    imageFallback: string;
    baseConditions: string;
    genreConditions: string;
    description: string;
    isPlayable: string;
    isPublished: string;
  };
  const [formState, setFormState] = useState<SlotEditState>({
    slotNumber: String(cell.slotNumber),
    name: cell.name,
    type: cell.type,
    side: cell.side.toUpperCase(),
    imageUrl: cell.imageUrl ?? '',
    imageFallback: cell.imageFallback,
    baseConditions: cell.baseConditions.join('\n'),
    genreConditions: cell.genreConditions.join('\n'),
    description: cell.description ?? '',
    isPlayable: String(Boolean(cell.playable)),
    isPublished: String(cell.isPublished ?? true),
  });
  const basePoints = getSideBasePoints(cell.side);
  const genrePoints = basePoints * 2;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-6">
      <div className="pointer-events-auto w-full max-w-[760px] rounded-[1.6rem] border border-zinc-700 bg-zinc-950/96 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300">Слот {cell.slotNumber === 0 ? '0 / 40' : cell.slotNumber}</p>
            <h4 className="mt-2 text-2xl font-black text-white">{cell.name}</h4>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-200">
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">Сторона: {getSideLabel(cell.side)}</span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">Основные: {basePoints}</span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">Жанровые: {genrePoints}</span>
              {!cell.isPublished ? <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-red-100">Скрыт</span> : null}
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin ? (
              <button type="button" onClick={() => setIsEditing((current) => !current)} className="rounded-full border border-fuchsia-400/40 px-3 py-1 text-xs text-fuchsia-100">
                {isEditing ? 'Cancel' : 'Edit Slot'}
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:border-cyan-300 hover:text-white">Закрыть</button>
          </div>
        </div>

        {!isEditing ? (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Основные условия</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-200">{cell.baseConditions.map((condition) => <li key={condition}>• {condition}</li>)}</ul>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-pink-300">Жанровые условия</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-200">{cell.genreConditions.map((condition) => <li key={condition}>• {condition}</li>)}</ul>
              </div>
            </div>
            {cell.description ? <p className="mt-4 text-xs text-zinc-400">{cell.description}</p> : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" disabled={!canAssign || isPending} onClick={() => onAssign('BASE')} className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40">Выбрать Base</button>
              <button type="button" disabled={!canAssign || isPending} onClick={() => onAssign('GENRE')} className="rounded-full border border-pink-400/40 bg-pink-500/10 px-4 py-2 text-sm text-pink-100 disabled:cursor-not-allowed disabled:opacity-40">Выбрать Genre</button>
              {!canAssign ? <p className="text-xs text-zinc-500">Ран можно создать только на текущей игровой клетке и только если у игрока нет активного рана.</p> : null}
            </div>
          </>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input value={formState.slotNumber} onChange={(event) => setFormState((current) => ({ ...current, slotNumber: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
            <input value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
            <select value={formState.type} onChange={(event) => setFormState((current) => ({ ...current, type: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">{slotTypeOptions.map((option) => <option key={option}>{option}</option>)}</select>
            <select value={formState.side} onChange={(event) => setFormState((current) => ({ ...current, side: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">{slotSideOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <input value={formState.imageUrl} onChange={(event) => setFormState((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Image URL" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 md:col-span-2" />
            <input value={formState.imageFallback} onChange={(event) => setFormState((current) => ({ ...current, imageFallback: event.target.value }))} placeholder="Fallback emoji" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 md:col-span-2" />
            <textarea value={formState.baseConditions} onChange={(event) => setFormState((current) => ({ ...current, baseConditions: event.target.value }))} className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
            <textarea value={formState.genreConditions} onChange={(event) => setFormState((current) => ({ ...current, genreConditions: event.target.value }))} className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
            <textarea value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} className="min-h-24 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 md:col-span-2" />
            <select value={formState.isPlayable} onChange={(event) => setFormState((current) => ({ ...current, isPlayable: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option value="true">Игровой слот</option><option value="false">Не игровой</option></select>
            <select value={formState.isPublished} onChange={(event) => setFormState((current) => ({ ...current, isPublished: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option value="true">Опубликован</option><option value="false">Скрыт</option></select>
            <button type="button" disabled={isPending} onClick={() => onSave({ slotId: cell.id, ...formState })} className="rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-100 md:col-span-2">{isPending ? 'Сохраняем...' : 'Save Changes'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PerimeterBoard({ board, players, activePlayer, seasonName, currentPosition, hasActiveRun, isAdmin, initialRoll }: BoardProps) {
  const [selectedCell, setSelectedCell] = useState<BoardCellData | null>(null);
  const [rollState, setRollState] = useState(initialRoll);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const wheelSlots = useMemo(() => board.filter((cell) => cell.type === 'WHEEL').length, [board]);

  const handleRoll = () => startTransition(async () => {
    const response = await fetch('/api/board/roll', { method: 'POST' });
    if (!response.ok) return;
    const payload = await response.json();
    setRollState({ die1: payload.die1, die2: payload.die2, total: payload.total });
    if (payload.landedSlot?.playable) {
      const nextCell = board.find((cell) => cell.id === payload.landedSlot.id);
      if (nextCell) setSelectedCell(nextCell);
    }
    router.refresh();
  });

  const handleAssign = (conditionType: 'BASE' | 'GENRE') => startTransition(async () => {
    if (!selectedCell) return;
    const response = await fetch('/api/board/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slotId: selectedCell.id, conditionType }) });
    if (response.ok) {
      setSelectedCell(null);
      router.refresh();
    }
  });

  const handleSaveSlot = (payload: Record<string, string>) => startTransition(async () => {
    const response = await fetch('/api/board/slot', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (response.ok) {
      setSelectedCell(null);
      router.refresh();
    }
  });

  return (
    <div className="relative mx-auto w-full max-w-[1120px]">
      <div className="rounded-[2.35rem] border-[10px] border-zinc-800 bg-[linear-gradient(135deg,rgba(39,39,42,0.98),rgba(10,10,12,1))] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="relative overflow-visible rounded-[1.7rem] border-2 border-zinc-600 bg-zinc-950 p-2">
          <div className="pointer-events-none absolute inset-[17.5%] rounded-[1.2rem] border-2 border-zinc-700/90" />
          <div className="grid aspect-square grid-cols-11 grid-rows-11 gap-px bg-zinc-800/90">
            {board.map((cell) => {
              const meta = getCellMeta(cell.slotNumber);
              const playersOnCell = players.filter((player) => player.boardPosition === cell.slotNumber);
              return <div key={cell.id} style={{ gridColumn: meta.gridColumn, gridRow: meta.gridRow }} className="bg-zinc-950"><BoardTile cell={cell} meta={meta} playersOnCell={playersOnCell} onSelect={setSelectedCell} /></div>;
            })}
            <div className="col-[4_/_9] row-[4_/_9] flex items-center justify-center p-4">
              <div className="w-full max-w-[300px] rounded-[1.3rem] border border-zinc-700/70 bg-black/60 p-4 text-center shadow-[0_18px_35px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300">Igra board</p>
                <h3 className="mt-2 text-xl font-black uppercase leading-tight text-white">{seasonName}</h3>
                <p className="mt-2 text-xs text-zinc-300">Текущая геометрия поля сохранена. Отсюда же видны wheel-слоты и редактура контента для админа.</p>
                <div className="mt-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-3 text-left">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-200">Сейчас ходит</p>
                  <div className="mt-2 flex items-center gap-3"><PlayerToken player={activePlayer} /><div><p className="font-black text-white">{activePlayer.displayName}</p><p className="text-xs text-zinc-300">Клетка {activePlayer.boardPosition}</p></div></div>
                </div>
                <div className="mt-3 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-3 text-left text-xs text-fuchsia-100">Wheel-слотов на поле: {wheelSlots}. На них по-прежнему можно кликать и редактировать контент без смены layout.</div>
                <button type="button" onClick={handleRoll} disabled={isPending} className="mt-3 w-full rounded-2xl border border-pink-400/40 bg-pink-500/10 px-4 py-3 text-sm font-semibold text-pink-100 disabled:cursor-not-allowed disabled:opacity-50">{isPending ? 'Бросаем...' : 'Roll Dice'}</button>
                {rollState?.total ? <div className="mt-3 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-3 py-3 text-left text-xs text-zinc-200"><p>Кости: {rollState.die1} + {rollState.die2}</p><p className="mt-1 font-bold text-white">Сумма: {rollState.total}</p></div> : null}
              </div>
            </div>
          </div>

          {selectedCell ? <SlotDetailWindow cell={selectedCell} onClose={() => setSelectedCell(null)} canAssign={Boolean(selectedCell.playable && selectedCell.slotNumber === currentPosition && !hasActiveRun)} onAssign={handleAssign} isPending={isPending} isAdmin={isAdmin} onSave={handleSaveSlot} /> : null}
        </div>
      </div>
    </div>
  );
}
