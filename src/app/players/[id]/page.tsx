export const dynamic = 'force-dynamic';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { requireSession, getCurrentSeason } from '@/lib/server/auth';
import { getProfileByUserId } from '@/lib/server/data';
import { upcomingEventSchema, runUpdateSchema } from '@/lib/validation/forms';

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  if (session.user.id !== id && session.user.role !== 'ADMIN' && session.user.role !== 'JUDGE') redirect('/');

  const user = await getProfileByUserId(id);
  if (!user) notFound();
  const state = user.seasonStates[0];
  const activeRun = user.runs.find((run) => run.status === 'ACTIVE');

  async function updateRunAction(formData: FormData) {
    'use server';
    const session = await requireSession();
    if (session.user.id !== id && session.user.role !== 'ADMIN' && session.user.role !== 'JUDGE') redirect('/');
    const runId = String(formData.get('runId'));
    const parsed = runUpdateSchema.parse({
      gameTitle: formData.get('gameTitle'),
      gameUrl: formData.get('gameUrl'),
      playerComment: formData.get('playerComment'),
    });
    await prisma.runAssignment.update({
      where: { id: runId },
      data: parsed,
    });
    revalidatePath(`/players/${id}`);
  }

  async function completeRunAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const runId = String(formData.get('runId'));
    const run = await prisma.runAssignment.findUnique({ where: { id: runId } });
    if (!run) return;
    await prisma.runAssignment.update({ where: { id: runId }, data: { status: 'COMPLETED', completedAt: new Date() } });
    await prisma.playerSeasonState.update({
      where: { userId_seasonId: { userId: run.userId, seasonId: season.id } },
      data: { score: { increment: run.expectedPoints } },
    });
    await prisma.eventLog.create({ data: { seasonId: season.id, userId: run.userId, type: 'RUN', summary: `${user?.nickname ?? 'Игрок'} завершил ран ${run.slotName} и получил ${run.expectedPoints} очков.` } });
    revalidatePath(`/players/${id}`);
    revalidatePath('/board');
  }

  async function dropRunAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const runId = String(formData.get('runId'));
    const run = await prisma.runAssignment.findUnique({ where: { id: runId } });
    if (!run) return;
    await prisma.runAssignment.update({ where: { id: runId }, data: { status: 'DROPPED', droppedAt: new Date() } });
    await prisma.eventLog.create({ data: { seasonId: season.id, userId: run.userId, type: 'RUN', summary: `${user?.nickname ?? 'Игрок'} дропнул ран ${run.slotName}.` } });
    revalidatePath(`/players/${id}`);
  }

  async function addEventAction(formData: FormData) {
    'use server';
    const parsed = upcomingEventSchema.parse({
      title: formData.get('title'),
      description: formData.get('description'),
      eventDate: formData.get('eventDate'),
      status: formData.get('status') || 'PLANNED',
    });
    await prisma.upcomingEvent.create({
      data: {
        userId: id,
        title: parsed.title,
        description: parsed.description || null,
        eventDate: parsed.eventDate ? new Date(parsed.eventDate) : null,
        status: parsed.status,
      },
    });
    revalidatePath(`/players/${id}`);
  }

  async function deleteEventAction(formData: FormData) {
    'use server';
    await prisma.upcomingEvent.delete({ where: { id: String(formData.get('eventId')) } });
    revalidatePath(`/players/${id}`);
  }

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-center gap-4">
            <img src={user.avatarUrl ?? `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user.nickname)}`} alt="avatar" className="h-20 w-20 rounded-full border border-zinc-700 object-cover" />
            <div>
              <h2 className="text-3xl font-black">{user.profile?.displayName ?? user.nickname}</h2>
              <p className="mt-1 text-zinc-400">{user.profile?.bio ?? 'Без био пока что.'}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Stat label="Счёт" value={state?.score ?? 0} />
            <Stat label="Позиция" value={state?.boardPosition ?? 0} />
            <Stat label="Активный ран" value={activeRun ? activeRun.slotName : 'Нет'} />
            <Stat label="Роль" value={user.role} />
          </div>

          {activeRun ? (
            <Card className="mt-6 bg-zinc-900/90">
              <h3 className="text-xl font-bold">Текущий ран</h3>
              <form action={updateRunAction} className="mt-4 grid gap-3">
                <input type="hidden" name="runId" value={activeRun.id} />
                <input name="gameTitle" defaultValue={activeRun.gameTitle ?? ''} placeholder="Название игры" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                <input name="gameUrl" defaultValue={activeRun.gameUrl ?? ''} placeholder="Ссылка на игру / Steam / itch" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                <textarea name="playerComment" defaultValue={activeRun.playerComment ?? ''} placeholder="Комментарий игрока" className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                <div className="flex flex-wrap gap-3">
                  <Button type="submit">Сохранить ран</Button>
                </div>
              </form>
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={completeRunAction}><input type="hidden" name="runId" value={activeRun.id} /><Button type="submit">Mark Completed</Button></form>
                <form action={dropRunAction}><input type="hidden" name="runId" value={activeRun.id} /><Button type="submit" variant="danger">Mark Dropped</Button></form>
              </div>
            </Card>
          ) : null}

          <Card className="mt-6 bg-zinc-900/90">
            <h3 className="text-xl font-bold">История ранoв</h3>
            <div className="mt-4 grid gap-3 text-sm">
              {user.runs.map((run) => (
                <div key={run.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                  <p className="font-semibold">Слот {run.slotNumber}: {run.slotName}</p>
                  <p className="text-zinc-400">{run.conditionType} • {run.status} • {run.expectedPoints} очков</p>
                  <p className="mt-2 text-zinc-300">Игра: {run.gameTitle ?? 'не заполнено'}</p>
                  {run.playerComment ? <p className="mt-1 text-zinc-400">Комментарий: {run.playerComment}</p> : null}
                </div>
              ))}
            </div>
          </Card>
        </Card>
        <div className="grid gap-6">
          <Card>
            <h3 className="text-xl font-bold">Ближайшие события</h3>
            <form action={addEventAction} className="mt-4 grid gap-3">
              <input name="title" placeholder="Название события" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <textarea name="description" placeholder="Описание (необязательно)" className="min-h-24 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="eventDate" type="datetime-local" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <Button type="submit">Добавить событие</Button>
            </form>
            <div className="mt-4 grid gap-3 text-sm">
              {user.upcoming.map((event) => (
                <div key={event.id} className="rounded-2xl bg-zinc-900/80 p-4">
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-zinc-400">{event.description ?? 'Без описания'}</p>
                  {event.eventDate ? <p className="mt-1 text-xs text-zinc-500">{event.eventDate.toLocaleString('ru-RU')}</p> : null}
                  <form action={deleteEventAction} className="mt-3"><input type="hidden" name="eventId" value={event.id} /><Button type="submit" variant="ghost">Удалить</Button></form>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Инвентарь</h3>
            <div className="mt-4 grid gap-3">
              {user.inventory.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl bg-zinc-900/80 p-4">
                  <img src={item.itemDefinition.imageUrl ?? 'https://placehold.co/96x96/111/eee?text=Item'} alt="item" className="h-16 w-16 rounded-2xl object-cover" />
                  <div>
                    <p className="font-semibold">#{item.itemDefinition.number} {item.itemDefinition.name}</p>
                    <p className="text-sm text-zinc-400">{item.itemDefinition.description}</p>
                    <p className="mt-1 text-xs text-zinc-500">Тип: {item.itemDefinition.type} • Заряды: {item.charges}</p>
                  </div>
                </div>
              ))}
              {user.inventory.length === 0 ? <p className="text-sm text-zinc-500">Инвентарь пока пуст.</p> : null}
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
