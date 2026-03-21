'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type WheelEntryView = {
  id: string;
  label: string;
  description: string | null;
  rewardType: string;
  imageUrl: string | null;
  itemName: string | null;
};

type WheelHistoryView = {
  id: string;
  createdAt: string;
  label: string;
  itemName: string | null;
};

const segmentPalette = [
  'from-fuchsia-500 via-pink-500 to-rose-500',
  'from-cyan-500 via-sky-500 to-indigo-500',
  'from-amber-400 via-orange-500 to-red-500',
  'from-lime-400 via-emerald-500 to-teal-500',
  'from-violet-500 via-fuchsia-500 to-pink-500',
  'from-blue-500 via-cyan-500 to-teal-400',
];

function shortLabel(label: string) {
  return label.length > 18 ? `${label.slice(0, 16)}…` : label;
}

export function WheelSpinner({
  availableSpins,
  entries,
  history,
}: {
  availableSpins: number;
  entries: WheelEntryView[];
  history: WheelHistoryView[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string>('Нажми на кнопку, и сервер выберет сектор, а колесо красиво доедет до него.');
  const router = useRouter();

  const segments = useMemo(
    () => entries.map((entry, index) => ({ ...entry, rotation: (360 / Math.max(entries.length, 1)) * index, palette: segmentPalette[index % segmentPalette.length] })),
    [entries],
  );

  const selectedEntry = selectedEntryId ? entries.find((entry) => entry.id === selectedEntryId) ?? null : null;
  const activeIndex = Math.max(0, segments.findIndex((entry) => entry.id === selectedEntryId));
  const wheelRotation = 2160 + activeIndex * (360 / Math.max(entries.length, 1));

  const handleSpin = () => startTransition(async () => {
    const response = await fetch('/api/wheel/spin', { method: 'POST' });
    const payload = await response.json();
    if (!response.ok) {
      setLastMessage(payload.error ?? 'Колесо застряло между мирами.');
      return;
    }

    setSelectedEntryId(payload.entry.id);
    const rewardLabel = payload.entry.rewardType === 'ITEM' ? payload.entry.itemName ?? payload.entry.label : payload.entry.label;
    setLastMessage(`Сервер выбрал «${payload.entry.label}». Ты получил: ${rewardLabel}.`);
    setTimeout(() => router.refresh(), 1500);
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[2.25rem] border border-zinc-800 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.18),transparent_28%),linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,1))] p-6 shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
        <div className="mx-auto flex max-w-[560px] flex-col items-center">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-sm">
            <div className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-5 py-2 text-fuchsia-100">Доступные спины: {availableSpins}</div>
            <div className="rounded-full border border-zinc-700 bg-zinc-900/80 px-5 py-2 text-zinc-300">Секторов: {entries.length}</div>
          </div>

          <div className="relative h-[520px] w-[520px] max-w-full select-none">
            <div className="absolute left-1/2 top-1 z-30 h-0 w-0 -translate-x-1/2 border-x-[26px] border-b-[42px] border-x-transparent border-b-cyan-300 drop-shadow-[0_12px_18px_rgba(34,211,238,0.55)]" />
            <div className="absolute inset-0 rounded-full border-[14px] border-zinc-950 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_22%),linear-gradient(145deg,rgba(63,63,70,0.98),rgba(9,9,11,1))] shadow-[inset_0_0_0_3px_rgba(255,255,255,0.06),0_28px_70px_rgba(0,0,0,0.45)]" />
            <div className="absolute inset-[22px] overflow-hidden rounded-full border-[10px] border-zinc-800" style={{ transform: `rotate(${wheelRotation}deg)`, transition: isPending ? 'transform 3.6s cubic-bezier(.16,.95,.22,1)' : 'transform 1.2s ease-out' }}>
              {segments.map((entry) => (
                <div key={entry.id} className="absolute left-1/2 top-1/2 h-1/2 w-[42%] origin-bottom -translate-x-1/2 -translate-y-full" style={{ transform: `rotate(${entry.rotation}deg)` }}>
                  <div className={cn('relative h-full w-full rounded-t-full border border-white/10 bg-gradient-to-b px-4 pt-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]', entry.palette, selectedEntryId === entry.id && 'brightness-125 saturate-150')}>
                    <div className="mx-auto flex max-w-[110px] flex-col items-center gap-2 text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)]">
                      <span className="rounded-full bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.28em]">{entry.rewardType === 'ITEM' ? 'Предмет' : entry.rewardType === 'SPINS' ? 'Спины' : 'Пусто'}</span>
                      <span className="text-sm font-black leading-tight">{shortLabel(entry.label)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-[130px] z-20 rounded-full border-[14px] border-zinc-900 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(6,6,9,1))] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.05),0_16px_36px_rgba(0,0,0,0.5)]" />
            <div className="absolute inset-[185px] z-30 flex items-center justify-center rounded-full border-4 border-fuchsia-300/35 bg-black/80 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-fuchsia-200">Колесо</p>
                <p className="mt-2 text-lg font-black text-white">Удачи</p>
              </div>
            </div>
          </div>

          <button type="button" disabled={availableSpins <= 0 || isPending} onClick={handleSpin} className="mt-4 w-full max-w-[360px] rounded-2xl border border-pink-400/40 bg-pink-500/10 px-4 py-4 text-sm font-semibold text-pink-100 shadow-[0_16px_32px_rgba(190,24,93,0.22)] disabled:cursor-not-allowed disabled:opacity-40">
            {availableSpins <= 0 ? 'Спинов больше нет' : isPending ? 'Колесо крутится...' : 'Запустить колесо'}
          </button>

          <div className="mt-5 w-full max-w-[520px] rounded-3xl border border-zinc-800 bg-black/30 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Последний результат</p>
            <p className="mt-2 text-lg font-black text-white">{selectedEntry ? selectedEntry.label : 'Пока без результата'}</p>
            <p className="mt-2 text-sm text-zinc-300">{lastMessage}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
          <h3 className="text-xl font-black">Расшифровка секторов</h3>
          <div className="mt-4 grid gap-3 text-sm">
            {entries.map((entry: any) => (
              <div key={entry.id} className={cn('rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 transition-colors', selectedEntryId === entry.id && 'border-fuchsia-400/40 bg-fuchsia-500/10')}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{entry.label}</p>
                  <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-zinc-300">{entry.rewardType === 'ITEM' ? 'Предмет' : entry.rewardType === 'SPINS' ? 'Спины' : 'Ничего'}</span>
                </div>
                <p className="mt-2 text-zinc-400">{entry.description ?? entry.itemName ?? 'Сектор без дополнительного текста.'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
          <h3 className="text-xl font-black">Недавние прокруты</h3>
          <div className="mt-4 grid gap-3 text-sm">
            {history.length === 0 ? <p className="text-zinc-500">История пока пустая.</p> : history.map((spin: any) => (
              <div key={spin.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="font-semibold">{spin.label}</p>
                <p className="text-zinc-400">{spin.itemName ?? 'Без предмета'}</p>
                <p className="mt-1 text-xs text-zinc-500">{new Date(spin.createdAt).toLocaleString('ru-RU')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
