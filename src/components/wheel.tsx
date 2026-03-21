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

const segmentPalette = ['#ec4899', '#06b6d4', '#f59e0b', '#22c55e', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'];

function shortLabel(label: string) {
  return label.length > 16 ? `${label.slice(0, 14)}…` : label;
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeSlicePath(startAngle: number, endAngle: number, radius = 46) {
  const start = polarToCartesian(50, 50, radius, startAngle);
  const end = polarToCartesian(50, 50, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return [`M 50 50`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`, 'Z'].join(' ');
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
  const [lastMessage, setLastMessage] = useState<string>('Нажми на кнопку, и сервер выберет сектор, а колесо доедет до него под фиксированным указателем.');
  const router = useRouter();

  const segments = useMemo(() => {
    const size = 360 / Math.max(entries.length, 1);
    return entries.map((entry, index) => {
      const startAngle = -90 + index * size;
      const endAngle = startAngle + size;
      const midAngle = startAngle + size / 2;
      const labelPoint = polarToCartesian(50, 50, 30, midAngle);
      return {
        ...entry,
        index,
        startAngle,
        endAngle,
        midAngle,
        labelPoint,
        fill: segmentPalette[index % segmentPalette.length],
      };
    });
  }, [entries]);

  const selectedEntry = selectedEntryId ? entries.find((entry) => entry.id === selectedEntryId) ?? null : null;
  const selectedSegment = segments.find((entry) => entry.id === selectedEntryId) ?? null;
  const wheelRotation = selectedSegment ? 2160 + (270 - selectedSegment.midAngle) : 0;

  const handleSpin = () => startTransition(async () => {
    const response = await fetch('/api/wheel/spin', { method: 'POST' });
    const payload = await response.json();
    if (!response.ok) {
      setLastMessage(payload.error ?? 'Колесо застряло между мирами.');
      return;
    }

    setSelectedEntryId(payload.entry.id);
    const rewardLabel = payload.entry.rewardType === 'ITEM' ? payload.entry.itemName ?? payload.entry.label : payload.entry.label;
    setLastMessage(`Сервер выбрал «${payload.entry.label}». Игрок получает: ${rewardLabel}.`);
    setTimeout(() => router.refresh(), 1600);
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[2.25rem] border border-zinc-800 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.18),transparent_28%),linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,1))] p-6 shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
        <div className="mx-auto flex max-w-[620px] flex-col items-center">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-sm">
            <div className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-5 py-2 text-fuchsia-100">Доступные спины: {availableSpins}</div>
            <div className="rounded-full border border-zinc-700 bg-zinc-900/80 px-5 py-2 text-zinc-300">Секторов: {entries.length}</div>
          </div>

          <div className="relative h-[560px] w-[560px] max-w-full select-none">
            <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2">
              <div className="h-0 w-0 border-x-[24px] border-b-[44px] border-x-transparent border-b-cyan-300 drop-shadow-[0_12px_18px_rgba(34,211,238,0.55)]" />
              <div className="mx-auto h-6 w-2 rounded-b-full bg-cyan-300/90" />
            </div>
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_28%),linear-gradient(145deg,rgba(63,63,70,0.98),rgba(9,9,11,1))] p-5 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.05),0_28px_80px_rgba(0,0,0,0.5)]">
              <div
                className="relative h-full w-full rounded-full border-[12px] border-zinc-950 bg-zinc-950 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.04)]"
                style={{ transform: `rotate(${wheelRotation}deg)`, transition: isPending ? 'transform 4s cubic-bezier(.12,.88,.18,1)' : 'transform 1.1s ease-out' }}
              >
                <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible rounded-full">
                  <circle cx="50" cy="50" r="48" fill="#09090b" />
                  {segments.map((entry) => (
                    <g key={entry.id}>
                      <path d={describeSlicePath(entry.startAngle, entry.endAngle)} fill={entry.fill} stroke="rgba(9,9,11,0.85)" strokeWidth="1.25" className={cn(selectedEntryId === entry.id && 'drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]')} />
                      <text
                        x={entry.labelPoint.x}
                        y={entry.labelPoint.y}
                        fill="white"
                        fontSize="3.2"
                        fontWeight="800"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${entry.midAngle + 90} ${entry.labelPoint.x} ${entry.labelPoint.y})`}
                        style={{ paintOrder: 'stroke', stroke: 'rgba(9,9,11,0.85)', strokeWidth: '0.8px' }}
                      >
                        {shortLabel(entry.label)}
                      </text>
                    </g>
                  ))}
                  <circle cx="50" cy="50" r="14" fill="#111827" stroke="rgba(244,114,182,0.45)" strokeWidth="2" />
                  <circle cx="50" cy="50" r="8" fill="#0f172a" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fill="#f8fafc" fontSize="3.2" fontWeight="900">UPG</text>
                </svg>
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
            {entries.map((entry) => (
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
