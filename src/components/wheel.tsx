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
  const [lastMessage, setLastMessage] = useState<string>('');
  const router = useRouter();
  const segments = useMemo(() => entries.map((entry, index) => ({ ...entry, rotation: (360 / Math.max(entries.length, 1)) * index })), [entries]);

  const handleSpin = () => startTransition(async () => {
    const response = await fetch('/api/wheel/spin', { method: 'POST' });
    const payload = await response.json();
    if (!response.ok) {
      setLastMessage(payload.error ?? 'Колесо не докрутилось.');
      return;
    }

    setSelectedEntryId(payload.entry.id);
    const rewardLabel = payload.entry.rewardType === 'ITEM' ? payload.entry.itemName ?? payload.entry.label : payload.entry.label;
    setLastMessage(`Сервер выбрал сектор «${payload.entry.label}». Награда: ${rewardLabel}.`);
    setTimeout(() => router.refresh(), 1200);
  });

  const activeIndex = Math.max(0, segments.findIndex((entry) => entry.id === selectedEntryId));
  const wheelRotation = 1440 + activeIndex * (360 / Math.max(entries.length, 1));

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/90 p-6">
        <div className="mx-auto flex max-w-[420px] flex-col items-center">
          <div className="mb-4 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-100">Доступные спины: {availableSpins}</div>
          <div className="relative h-[360px] w-[360px]">
            <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 border-x-[18px] border-b-[30px] border-x-transparent border-b-cyan-300" />
            <div className="absolute inset-0 rounded-full border-[10px] border-zinc-800 bg-zinc-900 shadow-[0_30px_60px_rgba(0,0,0,0.45)]" style={{ transform: `rotate(${wheelRotation}deg)`, transition: isPending ? 'transform 3.2s cubic-bezier(.15,.9,.15,1)' : 'transform 1s ease-out' }}>
              {segments.map((entry) => (
                <div key={entry.id} className="absolute left-1/2 top-1/2 h-1/2 w-[44%] origin-bottom -translate-x-1/2 -translate-y-full" style={{ transform: `rotate(${entry.rotation}deg)` }}>
                  <div className={cn('flex h-full w-full flex-col items-center justify-start rounded-t-full border border-zinc-700/70 px-3 pt-6 text-center text-[11px] font-bold', selectedEntryId === entry.id ? 'bg-fuchsia-500/40 text-white' : 'bg-gradient-to-b from-fuchsia-500/20 to-zinc-950 text-zinc-100')}>
                    <span className="line-clamp-2">{entry.label}</span>
                    <span className="mt-2 text-[10px] text-zinc-300">{entry.itemName ?? entry.rewardType}</span>
                  </div>
                </div>
              ))}
              <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-zinc-800 bg-black/80" />
            </div>
          </div>
          <button type="button" disabled={availableSpins <= 0 || isPending} onClick={handleSpin} className="mt-6 w-full max-w-[320px] rounded-2xl border border-pink-400/40 bg-pink-500/10 px-4 py-4 text-sm font-semibold text-pink-100 disabled:cursor-not-allowed disabled:opacity-40">
            {availableSpins <= 0 ? 'Спинов нет' : isPending ? 'Крутим...' : 'Крутить колесо'}
          </button>
          <p className="mt-4 text-center text-sm text-zinc-300">{lastMessage || 'Клиент показывает анимацию, но итоговый сектор всегда выбирает сервер.'}</p>
        </div>
      </div>
      <div className="grid gap-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
          <h3 className="text-xl font-black">Что может выпасть</h3>
          <div className="mt-4 grid gap-3 text-sm">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="font-semibold">{entry.label}</p>
                <p className="text-zinc-400">{entry.description ?? entry.itemName ?? entry.rewardType}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
          <h3 className="text-xl font-black">Последние спины</h3>
          <div className="mt-4 grid gap-3 text-sm">
            {history.length === 0 ? <p className="text-zinc-500">История пока пустая.</p> : history.map((spin) => (
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
