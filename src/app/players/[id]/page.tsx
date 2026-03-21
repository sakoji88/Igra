export const dynamic = 'force-dynamic';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { requireSession, getCurrentSeason } from '@/lib/server/auth';
import { getProfileByUserId, getPlayersList } from '@/lib/server/data';
import { getItemTypeBadgeClasses, getItemTypeLabel, getItemStageLabel, getTargetLabel, mapInventoryItemsForEffects, consumeInventoryItems } from '@/lib/server/items';
import { grantThreeWheelSpins } from '@/lib/server/wheel';
import { upcomingEventSchema, runUpdateSchema } from '@/lib/validation/forms';
import { resolveActiveGameEffects, resolveScoreEffects } from '@/lib/domain/effect-engine';

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  if (session.user.id !== id && session.user.role !== 'ADMIN' && session.user.role !== 'JUDGE') redirect('/');

  const [user, players] = await Promise.all([getProfileByUserId(id), getPlayersList()]);
  if (!user) notFound();
  const playerNickname = user.nickname;
  const state = user.seasonStates[0];
  const activeRun = user.runs.find((run) => run.status === 'ACTIVE') ?? null;
  const completedWithoutGift = user.runs.filter((run) => run.status === 'COMPLETED' && !run.wheelSpinsGrantedAt);
  const runtimeItems = state ? mapInventoryItemsForEffects(state.inventoryItems.map((item) => ({ id: item.id, chargesCurrent: item.chargesCurrent, itemDefinition: { id: item.itemDefinition.id, number: item.itemDefinition.number, name: item.itemDefinition.name, type: item.itemDefinition.type } }))) : [];
  const activeGameEffects = resolveActiveGameEffects(runtimeItems);

  async function updateRunAction(formData: FormData) {
    'use server';
    const session = await requireSession();
    if (session.user.id !== id && session.user.role !== 'ADMIN' && session.user.role !== 'JUDGE') redirect('/');
    const runId = String(formData.get('runId'));
    const parsed = runUpdateSchema.parse({ gameTitle: formData.get('gameTitle'), gameUrl: formData.get('gameUrl'), playerComment: formData.get('playerComment') });
    await prisma.runAssignment.update({ where: { id: runId }, data: parsed });
    revalidatePath(`/players/${id}`);
    revalidatePath('/board');
  }

  async function completeRunAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const runId = String(formData.get('runId'));
    const run = await prisma.runAssignment.findUnique({ where: { id: runId } });
    if (!run) return;
    const state = await prisma.playerSeasonState.findUnique({
      where: { userId_seasonId: { userId: run.userId, seasonId: season.id } },
      include: { inventoryItems: { include: { itemDefinition: true }, orderBy: { obtainedAt: 'asc' } } },
    });
    if (!state) return;
    const scoreEffects = resolveScoreEffects({
      items: mapInventoryItemsForEffects(state.inventoryItems.map((item) => ({ id: item.id, chargesCurrent: item.chargesCurrent, itemDefinition: { id: item.itemDefinition.id, number: item.itemDefinition.number, name: item.itemDefinition.name, type: item.itemDefinition.type } }))),
      baseScore: run.expectedPoints,
    });
    await prisma.runAssignment.update({ where: { id: runId }, data: { status: 'COMPLETED', completedAt: new Date() } });
    await prisma.playerSeasonState.update({ where: { userId_seasonId: { userId: run.userId, seasonId: season.id } }, data: { score: { increment: scoreEffects.finalScore } } });
    await consumeInventoryItems(scoreEffects.consumedItemIds);
    await prisma.eventLog.create({ data: { seasonId: season.id, userId: run.userId, type: 'RUN', summary: `${playerNickname} завершил игру «${run.gameTitle ?? run.slotName}» и получил ${scoreEffects.finalScore} очков.`, payload: { runId, baseScore: run.expectedPoints, scoreEffects: scoreEffects.breakdown, finalScore: scoreEffects.finalScore } } });
    revalidatePath(`/players/${id}`);
    revalidatePath('/board');
  }

  async function grantSpinsAction(formData: FormData) {
    'use server';
    const session = await requireSession();
    if (session.user.id !== id && session.user.role !== 'ADMIN') redirect('/');
    const season = await getCurrentSeason();
    await grantThreeWheelSpins({
      giverRunId: String(formData.get('runId')),
      giverUserId: id,
      receiverUserId: String(formData.get('receiverUserId')),
      seasonId: season.id,
    });
    revalidatePath(`/players/${id}`);
    revalidatePath(`/players/${String(formData.get('receiverUserId'))}`);
    revalidatePath('/wheel');
    revalidatePath('/');
  }

  async function dropRunAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const runId = String(formData.get('runId'));
    const run = await prisma.runAssignment.findUnique({ where: { id: runId } });
    if (!run) return;
    await prisma.runAssignment.update({ where: { id: runId }, data: { status: 'DROPPED', droppedAt: new Date() } });
    await prisma.eventLog.create({ data: { seasonId: season.id, userId: run.userId, type: 'RUN', summary: `${playerNickname} дропнул игру «${run.gameTitle ?? run.slotName}».` } });
    revalidatePath(`/players/${id}`);
    revalidatePath('/board');
  }

  async function addEventAction(formData: FormData) {
    'use server';
    const parsed = upcomingEventSchema.parse({ title: formData.get('title'), description: formData.get('description'), eventDate: formData.get('eventDate'), status: formData.get('status') || 'PLANNED' });
    await prisma.upcomingEvent.create({ data: { userId: id, title: parsed.title, description: parsed.description || null, eventDate: parsed.eventDate ? new Date(parsed.eventDate) : null, status: parsed.status } });
    revalidatePath(`/players/${id}`);
  }

  async function deleteEventAction(formData: FormData) {
    'use server';
    await prisma.upcomingEvent.delete({ where: { id: String(formData.get('eventId')) } });
    revalidatePath(`/players/${id}`);
  }

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <div className="flex items-center gap-4">
            <img src={user.avatarUrl ?? `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user.nickname)}`} alt="avatar" className="h-20 w-20 rounded-full border border-zinc-700 object-cover" />
            <div>
              <h2 className="text-3xl font-black">{user.profile?.displayName ?? user.nickname}</h2>
              <p className="mt-1 text-zinc-400">{user.profile?.bio ?? 'Без био пока что.'}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Stat label="Счёт" value={state?.score ?? 0} />
            <Stat label="Позиция" value={state?.boardPosition ?? 0} />
            <Stat label="Активная игра" value={activeRun ? 'Есть' : 'Нет'} />
            <Stat label="Роль" value={user.role} />
            <Stat label="Спины" value={state?.availableWheelSpins ?? 0} />
          </div>

          <Card className="mt-6 bg-zinc-900/90">
            <h3 className="text-xl font-bold">Активная игра</h3>
            {activeRun ? (
              <>
                <div className="mt-4 rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-4">
                  <p className="text-2xl font-black text-white">{activeRun.gameTitle ?? 'Игра ещё не зафиксирована'}</p>
                  <p className="mt-2 text-sm text-zinc-200">Слот: {activeRun.slotName} • Условия: {activeRun.conditionType === 'BASE' ? 'Base' : 'Genre'} • Статус: {activeRun.status}</p>
                  <p className="mt-2 text-sm text-fuchsia-100">Пока эта запись активна, бросок на поле заблокирован и в UI, и на сервере.</p>
                  {activeGameEffects.length ? <div className="mt-4 grid gap-2">{activeGameEffects.map((effect, index) => <div key={`${effect.itemName}-${index}`} className="rounded-2xl border border-zinc-800 bg-black/25 p-3"><p className="font-semibold text-white">{effect.itemName}</p><p className="text-zinc-300">{effect.text}</p></div>)}</div> : null}
                </div>
                <form action={updateRunAction} className="mt-4 grid gap-3">
                  <input type="hidden" name="runId" value={activeRun.id} />
                  <input name="gameTitle" defaultValue={activeRun.gameTitle ?? ''} placeholder="Название игры" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="gameUrl" defaultValue={activeRun.gameUrl ?? ''} placeholder="Ссылка на игру / Steam / itch" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <textarea name="playerComment" defaultValue={activeRun.playerComment ?? ''} placeholder="Комментарий игрока" className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <div className="flex flex-wrap gap-3"><Button type="submit">Сохранить активную игру</Button></div>
                </form>
                <div className="mt-4 flex flex-wrap gap-3">
                  <form action={completeRunAction}><input type="hidden" name="runId" value={activeRun.id} /><Button type="submit">Отметить победу</Button></form>
                  <form action={dropRunAction}><input type="hidden" name="runId" value={activeRun.id} /><Button type="submit" variant="danger">Отметить дроп</Button></form>
                </div>
              </>
            ) : <p className="mt-4 text-sm text-zinc-400">Сейчас активной игры нет. Игрок может вернуться на поле и бросить кости.</p>}
          </Card>

          {completedWithoutGift.length > 0 ? (
            <Card className="mt-6 bg-zinc-900/90">
              <h3 className="text-xl font-bold">Выдать 3 спина колеса</h3>
              <p className="mt-2 text-sm text-zinc-400">После завершённой игры можно один раз подарить другому игроку ровно 3 спина.</p>
              <div className="mt-4 grid gap-4">
                {completedWithoutGift.map((run) => (
                  <form key={run.id} action={grantSpinsAction} className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 md:grid-cols-[1fr_260px_auto]">
                    <input type="hidden" name="runId" value={run.id} />
                    <div>
                      <p className="font-semibold">{run.gameTitle ?? run.slotName}</p>
                      <p className="text-sm text-zinc-400">Завершён {run.completedAt?.toLocaleString('ru-RU') ?? 'только что'}</p>
                    </div>
                    <select name="receiverUserId" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">
                      {players.filter((player) => player.user.id !== id).map((player) => <option key={player.user.id} value={player.user.id}>{player.user.profile?.displayName ?? player.user.nickname}</option>)}
                    </select>
                    <Button type="submit">Подарить 3 спина</Button>
                  </form>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="mt-6 bg-zinc-900/90">
            <h3 className="text-xl font-bold">История игр</h3>
            <div className="mt-4 grid gap-3 text-sm">
              {user.runs.map((run) => (
                <div key={run.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                  <p className="font-semibold">{run.gameTitle ?? `Слот ${run.slotNumber}: ${run.slotName}`}</p>
                  <p className="text-zinc-400">{run.conditionType} • {run.status} • {run.expectedPoints} базовых очков</p>
                  {run.playerComment ? <p className="mt-2 text-zinc-300">Комментарий: {run.playerComment}</p> : null}
                  <p className="mt-1 text-xs text-zinc-500">Спины уже подарены: {run.wheelSpinsGrantedAt ? 'да' : 'нет'}</p>
                </div>
              ))}
            </div>
          </Card>
        </Card>
        <div className="grid gap-6">
          <Card>
            <h3 className="text-xl font-bold">Сезонное состояние</h3>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">Доступные спины: {state?.availableWheelSpins ?? 0}</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="font-semibold">Активные эффекты для хода</p>
                <div className="mt-3 grid gap-2">
                  {runtimeItems.length ? runtimeItems.map((item) => <p key={item.inventoryItemId}>#{item.itemDefinition.number} {item.itemDefinition.name}</p>) : <p className="text-zinc-500">Активных предметов пока нет.</p>}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="font-semibold">Последние прокруты колеса</p>
                <div className="mt-3 grid gap-2">
                  {state?.wheelSpins.length ? state.wheelSpins.map((spin) => <p key={spin.id}>{spin.wheelEntry.label} • {spin.createdAt.toLocaleString('ru-RU')}</p>) : <p className="text-zinc-500">Спины ещё не крутили.</p>}
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Ближайшие события</h3>
            <form action={addEventAction} className="mt-4 grid gap-3">
              <input name="title" placeholder="Название события" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <textarea name="description" placeholder="Описание (необязательно)" className="min-h-24 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="eventDate" type="datetime-local" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <Button type="submit">Добавить событие</Button>
            </form>
            <div className="mt-4 grid gap-3 text-sm">{user.upcoming.map((event) => <div key={event.id} className="rounded-2xl bg-zinc-900/80 p-4"><p className="font-semibold">{event.title}</p><p className="text-zinc-400">{event.description ?? 'Без описания'}</p>{event.eventDate ? <p className="mt-1 text-xs text-zinc-500">{event.eventDate.toLocaleString('ru-RU')}</p> : null}<form action={deleteEventAction} className="mt-3"><input type="hidden" name="eventId" value={event.id} /><Button type="submit" variant="ghost">Удалить</Button></form></div>)}</div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Инвентарь</h3>
            <div className="mt-4 grid gap-3">
              {state?.inventoryItems.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <img src={item.itemDefinition.imageUrl ?? 'https://placehold.co/96x96/111/eee?text=Item'} alt="item" className="h-20 w-20 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">#{item.itemDefinition.number} {item.itemDefinition.name}</p><span className={`rounded-full border px-2 py-1 text-[11px] ${getItemTypeBadgeClasses(item.itemDefinition.type)}`}>{getItemTypeLabel(item.itemDefinition.type)}</span></div>
                    <p className="mt-2 text-sm text-zinc-400">{item.itemDefinition.description}</p>
                    <p className="mt-2 text-xs text-zinc-500">Заряды: {item.chargesCurrent} • откуда: {item.sourceType} • цели: {getTargetLabel(item.itemDefinition.allowedTargets)}</p>
                    <p className="mt-1 text-xs text-zinc-500">Получен: {item.obtainedAt.toLocaleString('ru-RU')} • conflictKey: {item.itemDefinition.conflictKey ?? 'нет'}</p>
                  </div>
                </div>
              ))}
              {state?.inventoryItems.length === 0 ? <p className="text-sm text-zinc-500">Инвентарь пока пуст.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}
