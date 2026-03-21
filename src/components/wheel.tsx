'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type WheelHistoryView = {
  id: string;
  createdAt: string;
  label: string;
  itemName: string | null;
};

type WheelPool = 'PRIKOLY' | 'BUFFS' | 'DEBUFFS' | 'BREDIK';

const poolCards: Array<{
  id: WheelPool;
  title: string;
  description: string;
  accent: string;
}> = [
  { id: 'PRIKOLY', title: 'Приколы', description: 'Основное колесо. Тратит крутки игрока, максимум хранения — 6.', accent: 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-100' },
  { id: 'BUFFS', title: 'Баффы', description: 'Подборка положительных предметов и эффектов. Оставил без автоматического ограничения.', accent: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100' },
  { id: 'DEBUFFS', title: 'Дебаффы', description: 'Подборка дебаффов и ловушек. Оставил без автоматического ограничения.', accent: 'border-red-400/40 bg-red-500/10 text-red-100' },
  { id: 'BREDIK', title: 'Бредик', description: 'Отдельный набор наказаний и странных событий.', accent: 'border-amber-400/40 bg-amber-500/10 text-amber-100' },
];

export function WheelSpinner({ availableSpins, history }: { availableSpins: number; history: WheelHistoryView[] }) {
  const [isPending, startTransition] = useTransition();
  const [selectedPool, setSelectedPool] = useState<WheelPool | null>(null);
  const [lastMessage, setLastMessage] = useState<string>('Выбери одну из кнопок ниже. Для «Приколов» нужны реальные крутки игрока, остальные кнопки доступны как ручные сервисные роллы.');
  const router = useRouter();

  const handleSpin = (pool: WheelPool) => startTransition(async () => {
    setSelectedPool(pool);
    const response = await fetch('/api/wheel/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pool }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setLastMessage(payload.error ?? 'Ролл застрял между мирами.');
      return;
    }

    setLastMessage(`Раздел «${poolCards.find((card) => card.id === pool)?.title ?? pool}» выдал: ${payload.entry.itemName ?? payload.entry.label}.`);
    setTimeout(() => router.refresh(), 500);
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-2 text-fuchsia-100">Крутки приколов: {availableSpins}</div>
          <div className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300">Кнопки баффов / дебаффов / бредика оставлены без жёсткой серверной блокировки</div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {poolCards.map((pool) => {
            const disabled = isPending || (pool.id === 'PRIKOLY' && availableSpins <= 0);
            return (
              <button
                key={pool.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSpin(pool.id)}
                className={cn('rounded-3xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-40', pool.accent, selectedPool === pool.id && 'ring-2 ring-white/20')}
              >
                <p className="text-xs uppercase tracking-[0.3em] opacity-70">Раздел</p>
                <h3 className="mt-2 text-2xl font-black">{pool.title}</h3>
                <p className="mt-3 text-sm opacity-90">{pool.description}</p>
                <div className="mt-5 rounded-2xl border border-black/20 bg-black/20 px-4 py-3 text-sm font-semibold">
                  {pool.id === 'PRIKOLY' && availableSpins <= 0 ? 'Нет доступных круток' : isPending && selectedPool === pool.id ? 'Роллим...' : 'Нажать и получить результат'}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Последний результат</p>
          <p className="mt-2 text-sm text-zinc-200">{lastMessage}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
        <h3 className="text-xl font-black">Недавние роллы</h3>
        <div className="mt-4 grid gap-3 text-sm">
          {history.length === 0 ? <p className="text-zinc-500">История пока пустая.</p> : history.map((spin) => (
            <div key={spin.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
              <p className="font-semibold">{spin.label}</p>
              <p className="text-zinc-400">{spin.itemName ?? 'Без связанного предмета'}</p>
              <p className="mt-1 text-xs text-zinc-500">{new Date(spin.createdAt).toLocaleString('ru-RU')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
