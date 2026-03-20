export const dynamic = 'force-dynamic';
import { AppLayout } from '@/components/layout';
import { PerimeterBoard } from '@/components/board';
import { requireSession } from '@/lib/server/auth';
import { getBoardViewData, getCurrentUserState } from '@/lib/server/data';

export default async function BoardPage() {
  const session = await requireSession();
  const { season, slots, states, logs } = await getBoardViewData();
  const current = await getCurrentUserState(session.user.id!);
  if (!current) throw new Error('Current player state not found');

  const board = slots.map((slot) => ({
    id: slot.id,
    index: slot.slotNumber,
    slotNumber: slot.slotNumber,
    name: slot.name,
    type: slot.type,
    side: slot.side.toLowerCase() as 'bottom' | 'left' | 'top' | 'right',
    points: slot.side === 'BOTTOM' ? 1 : slot.side === 'LEFT' ? 2 : slot.side === 'TOP' ? 3 : 4,
    imageUrl: slot.imageUrl,
    imageFallback: slot.imageFallback,
    baseConditions: slot.baseConditions,
    genreConditions: slot.genreConditions,
    description: slot.description ?? undefined,
    playable: slot.isPlayable,
  }));

  const players = states.map((state) => ({
    id: state.user.id,
    displayName: state.user.profile?.displayName ?? state.user.nickname,
    avatarUrl: state.user.avatarUrl ?? `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(state.user.nickname)}`,
    boardPosition: state.boardPosition,
    isActivePlayer: state.user.id === session.user.id,
  }));

  const activeRun = current.user.runs.find((run) => run.status === 'ACTIVE');

  return (
    <AppLayout>
      <div className="grid gap-6 xl:grid-cols-[2.15fr_0.85fr]">
        <CardShell title="Игровое поле" subtitle="Кликай по слоту, смотри условия, кидай кубы прямо на поле.">
          <PerimeterBoard
            board={board}
            players={players}
            activePlayer={players.find((player) => player.id === session.user.id)!}
            seasonName={season.name}
            currentPosition={current.boardPosition}
            hasActiveRun={Boolean(activeRun)}
            initialRoll={{ die1: current.lastDie1, die2: current.lastDie2, total: current.lastRollTotal }}
          />
        </CardShell>
        <div className="grid gap-6">
          <CardShell title="Текущий статус" subtitle="Сервер хранит твой бросок и позицию.">
            <div className="grid gap-3 text-sm text-zinc-300">
              <div className="rounded-2xl bg-zinc-900/70 p-4">Позиция: {current.boardPosition}</div>
              <div className="rounded-2xl bg-zinc-900/70 p-4">Счёт: {current.score}</div>
              <div className="rounded-2xl bg-zinc-900/70 p-4">Активный ран: {activeRun ? `${activeRun.slotName} (${activeRun.conditionType})` : 'Нет'}</div>
            </div>
          </CardShell>
          <CardShell title="Последние события" subtitle="Локальный event log сезона.">
            <div className="grid gap-3 text-sm">
              {logs.slice(0, 8).map((event) => (
                <div key={event.id} className="rounded-2xl bg-zinc-900/70 p-3">
                  <p>{event.summary}</p>
                </div>
              ))}
            </div>
          </CardShell>
        </div>
      </div>
    </AppLayout>
  );
}

function CardShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="meme-border rounded-3xl bg-zinc-950/90 p-5">
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}
