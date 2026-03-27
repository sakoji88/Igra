export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { requireRole, getCurrentSeason } from '@/lib/server/auth';
import { getAdminData } from '@/lib/server/data';

export default async function AdminPage() {
  await requireRole(['ADMIN']);
  const { season, players, logs, wheels } = await getAdminData();

  async function adjustPlayerAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const userId = String(formData.get('userId'));
    const score = Number(formData.get('score') || 0);
    const position = Number(formData.get('boardPosition') || 0);
    const availableWheelSpins = Number(formData.get('availableWheelSpins') || 0);
    await prisma.playerSeasonState.update({ where: { userId_seasonId: { userId, seasonId: season.id } }, data: { score, boardPosition: position, availableWheelSpins } });
    await prisma.eventLog.create({ data: { seasonId: season.id, userId, type: 'ADMIN', summary: 'Админ обновил счёт/позицию/spins игрока.', payload: { score, position, availableWheelSpins } } });
    revalidatePath('/admin'); revalidatePath('/players'); revalidatePath(`/players/${userId}`); revalidatePath('/board'); revalidatePath('/wheel');
  }

  async function updateWheelAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const wheelId = String(formData.get('wheelId'));
    const name = String(formData.get('name'));
    const description = String(formData.get('description') || '') || null;
    const imageUrl = String(formData.get('imageUrl') || '') || null;
    const active = String(formData.get('active')) === 'true';
    const wheel = await prisma.wheelDefinition.update({ where: { id: wheelId }, data: { name, description, imageUrl, active } });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', summary: `Админ обновил колесо ${wheel.name}.`, payload: { wheelId } } });
    revalidatePath('/admin'); revalidatePath('/wheel');
  }

  return (
    <AppLayout>
      <div className="grid gap-6">
        <Card>
          <h2 className="text-2xl font-black">Админ-панель сезона</h2>
          <p className="mt-2 text-zinc-400">Теперь это не giant CMS: контент редактируется в контексте просмотра. Предметы — на странице предметов, правила — на странице правил, слоты — из slot modal на поле.</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/items" className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-200">Редактировать предметы</Link>
            <Link href="/rules" className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-200">Редактировать правила</Link>
            <Link href="/board" className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-200">Открыть поле и править слоты</Link>
            <Link href="/wheel" className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-2 text-fuchsia-100">Открыть колесо</Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500">Активный сезон: {season.name}</p>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h3 className="text-xl font-bold">Игроки и сезонное состояние</h3>
            <div className="mt-4 grid gap-4">
              {players.map((player: any) => (
                <div key={player.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{player.user.profile?.displayName ?? player.user.nickname}</p>
                      <p className="text-sm text-zinc-400">Счёт: {player.score} • Позиция: {player.boardPosition} • Спины: {player.availableWheelSpins}</p>
                    </div>
                    <Link href={`/players/${player.user.id}`} className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-200">Профиль</Link>
                  </div>
                  <form action={adjustPlayerAction} className="mt-4 grid gap-3 md:grid-cols-4">
                    <input type="hidden" name="userId" value={player.user.id} />
                    <input name="score" defaultValue={player.score} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <input name="boardPosition" defaultValue={player.boardPosition} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <input name="availableWheelSpins" defaultValue={player.availableWheelSpins} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <Button type="submit">Сохранить</Button>
                  </form>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold">Техническое состояние колеса</h3>
            <div className="mt-4 grid gap-4">
              {wheels.map((wheel: any) => (
                <form key={wheel.id} action={updateWheelAction} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="wheelId" value={wheel.id} />
                  <input name="name" defaultValue={wheel.name} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="imageUrl" defaultValue={wheel.imageUrl ?? ''} placeholder="Ссылка на обложку" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <textarea name="description" defaultValue={wheel.description ?? ''} className="min-h-24 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
                  <select name="active" defaultValue={String(wheel.active)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="true">Активно</option><option value="false">Выключено</option></select>
                  <Button type="submit">Сохранить колесо</Button>
                  <div className="md:col-span-2 rounded-2xl border border-zinc-800 bg-black/20 p-4 text-sm text-zinc-400">Секторов: {wheel.entries.length}. Детальная правка sectors остаётся на логически связанной странице колеса и в БД, а админка оставляет только технический контроль.</div>
                </form>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="text-xl font-bold">Последние действия</h3>
          <div className="mt-4 grid gap-3 text-sm">{logs.map((event: any) => <div key={event.id} className="rounded-xl bg-zinc-900/80 p-3">{event.summary}</div>)}</div>
        </Card>
      </div>
    </AppLayout>
  );
}
