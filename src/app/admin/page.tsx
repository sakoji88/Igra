export const dynamic = 'force-dynamic';
import { revalidatePath } from 'next/cache';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { requireRole, getCurrentSeason } from '@/lib/server/auth';
import { getAdminData } from '@/lib/server/data';
import { itemDefinitionSchema, ruleSectionSchema } from '@/lib/validation/forms';

export default async function AdminPage() {
  await requireRole(['ADMIN', 'JUDGE']);
  const { season, players, items, rules, logs } = await getAdminData();

  async function adjustPlayerAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const userId = String(formData.get('userId'));
    const score = Number(formData.get('scoreDelta') || 0);
    const position = Number(formData.get('boardPosition') || 0);
    await prisma.playerSeasonState.update({
      where: { userId_seasonId: { userId, seasonId: season.id } },
      data: { score, boardPosition: position },
    });
    await prisma.eventLog.create({ data: { seasonId: season.id, userId, type: 'ADMIN', summary: `Админ обновил счёт/позицию игрока.`, payload: { score, position } } });
    revalidatePath('/admin');
    revalidatePath('/players');
    revalidatePath(`/players/${userId}`);
    revalidatePath('/board');
  }

  async function createItemAction(formData: FormData) {
    'use server';
    const parsed = itemDefinitionSchema.parse({
      number: formData.get('number'),
      name: formData.get('name'),
      type: formData.get('type'),
      description: formData.get('description'),
      imageUrl: formData.get('imageUrl'),
      chargesDefault: formData.get('chargesDefault'),
      allowedTargets: formData.get('allowedTargets'),
      active: formData.get('active'),
    });
    await prisma.itemDefinition.create({ data: parsed });
    revalidatePath('/admin');
  }

  async function updateItemAction(formData: FormData) {
    'use server';
    const id = String(formData.get('itemId'));
    const parsed = itemDefinitionSchema.parse({
      number: formData.get('number'),
      name: formData.get('name'),
      type: formData.get('type'),
      description: formData.get('description'),
      imageUrl: formData.get('imageUrl'),
      chargesDefault: formData.get('chargesDefault'),
      allowedTargets: formData.get('allowedTargets'),
      active: formData.get('active'),
    });
    await prisma.itemDefinition.update({ where: { id }, data: parsed });
    revalidatePath('/admin');
  }

  async function assignItemAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const userId = String(formData.get('userId'));
    const itemDefinitionId = String(formData.get('itemDefinitionId'));
    const item = await prisma.itemDefinition.findUnique({ where: { id: itemDefinitionId } });
    if (!item) return;
    await prisma.playerInventoryItem.create({ data: { userId, itemDefinitionId, charges: item.chargesDefault } });
    await prisma.eventLog.create({ data: { seasonId: season.id, userId, type: 'ITEM', summary: `Игроку выдан предмет ${item.name}.` } });
    revalidatePath('/admin');
    revalidatePath(`/players/${userId}`);
  }

  async function removeInventoryAction(formData: FormData) {
    'use server';
    const inventoryId = String(formData.get('inventoryId'));
    const inventoryItem = await prisma.playerInventoryItem.findUnique({ where: { id: inventoryId }, include: { itemDefinition: true } });
    if (!inventoryItem) return;
    await prisma.playerInventoryItem.delete({ where: { id: inventoryId } });
    revalidatePath('/admin');
    revalidatePath(`/players/${inventoryItem.userId}`);
  }

  async function createRuleAction(formData: FormData) {
    'use server';
    const parsed = ruleSectionSchema.parse({
      title: formData.get('title'),
      slug: formData.get('slug'),
      content: formData.get('content'),
      order: formData.get('order'),
      published: formData.get('published'),
    });
    await prisma.ruleSection.create({ data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'RULE', summary: `Обновлён раздел правил ${parsed.title}.` } });
    revalidatePath('/admin');
    revalidatePath('/rules');
  }

  async function updateRuleAction(formData: FormData) {
    'use server';
    const id = String(formData.get('ruleId'));
    const parsed = ruleSectionSchema.parse({
      title: formData.get('title'),
      slug: formData.get('slug'),
      content: formData.get('content'),
      order: formData.get('order'),
      published: formData.get('published'),
    });
    await prisma.ruleSection.update({ where: { id }, data: parsed });
    revalidatePath('/admin');
    revalidatePath('/rules');
  }

  return (
    <AppLayout>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-6">
          <Card>
            <h2 className="text-2xl font-black">Панель управления</h2>
            <p className="mt-2 text-zinc-400">Активный сезон: {season.name}</p>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Игроки</h3>
            <div className="mt-4 grid gap-4">
              {players.map((player) => (
                <div key={player.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{player.user.profile?.displayName ?? player.user.nickname}</p>
                      <p className="text-sm text-zinc-400">Счёт: {player.score} • Позиция: {player.boardPosition}</p>
                    </div>
                  </div>
                  <form action={adjustPlayerAction} className="mt-4 grid gap-3 md:grid-cols-3">
                    <input type="hidden" name="userId" value={player.user.id} />
                    <input name="scoreDelta" defaultValue={player.score} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <input name="boardPosition" defaultValue={player.boardPosition} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <Button type="submit">Сохранить игрока</Button>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {items.map((item) => (
                      <form key={item.id} action={assignItemAction}>
                        <input type="hidden" name="userId" value={player.user.id} />
                        <input type="hidden" name="itemDefinitionId" value={item.id} />
                        <Button type="submit" variant="ghost">Выдать {item.name}</Button>
                      </form>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2">
                    {player.user.inventory.map((inventoryItem) => (
                      <div key={inventoryItem.id} className="flex items-center justify-between rounded-xl bg-zinc-950/70 px-3 py-2 text-sm">
                        <span>{inventoryItem.itemDefinition.name} • {inventoryItem.charges} зарядов</span>
                        <form action={removeInventoryAction}><input type="hidden" name="inventoryId" value={inventoryItem.id} /><Button type="submit" variant="danger">Снять</Button></form>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Предметы</h3>
            <form action={createItemAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input name="number" type="number" placeholder="Номер" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="name" placeholder="Название" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <select name="type" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option>BUFF</option><option>DEBUFF</option><option>TRAP</option><option>NEUTRAL</option></select>
              <input name="imageUrl" placeholder="Image URL" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="chargesDefault" type="number" defaultValue={1} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="allowedTargets" defaultValue="self" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <textarea name="description" placeholder="Описание" className="md:col-span-2 min-h-24 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <select name="active" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option value="true">Активен</option><option value="false">Выключен</option></select>
              <Button type="submit">Создать предмет</Button>
            </form>
            <div className="mt-5 grid gap-4">
              {items.map((item) => (
                <form key={item.id} action={updateItemAction} className="rounded-2xl bg-zinc-900/80 p-4 grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="itemId" value={item.id} />
                  <input name="number" defaultValue={item.number} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="name" defaultValue={item.name} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <select name="type" defaultValue={item.type} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option>BUFF</option><option>DEBUFF</option><option>TRAP</option><option>NEUTRAL</option></select>
                  <input name="imageUrl" defaultValue={item.imageUrl ?? ''} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="chargesDefault" defaultValue={item.chargesDefault} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="allowedTargets" defaultValue={item.allowedTargets} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <textarea name="description" defaultValue={item.description} className="md:col-span-2 min-h-20 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <select name="active" defaultValue={String(item.active)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="true">Активен</option><option value="false">Выключен</option></select>
                  <Button type="submit">Обновить предмет</Button>
                </form>
              ))}
            </div>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card>
            <h3 className="text-xl font-bold">Правила</h3>
            <form action={createRuleAction} className="mt-4 grid gap-3">
              <input name="title" placeholder="Заголовок" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="slug" placeholder="slug" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="order" defaultValue={rules.length + 1} type="number" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <select name="published" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option value="true">Опубликован</option><option value="false">Скрыт</option></select>
              <textarea name="content" placeholder="Текст правила" className="min-h-32 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <Button type="submit">Создать раздел правил</Button>
            </form>
            <div className="mt-5 grid gap-4">
              {rules.map((rule) => (
                <form key={rule.id} action={updateRuleAction} className="rounded-2xl bg-zinc-900/80 p-4 grid gap-3">
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <input name="title" defaultValue={rule.title} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="slug" defaultValue={rule.slug} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="order" defaultValue={rule.order} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <select name="published" defaultValue={String(rule.published)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="true">Опубликован</option><option value="false">Скрыт</option></select>
                  <textarea name="content" defaultValue={rule.content} className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <Button type="submit">Обновить правило</Button>
                </form>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Последние действия</h3>
            <div className="mt-4 grid gap-3 text-sm">
              {logs.map((event) => <div key={event.id} className="rounded-xl bg-zinc-900/80 p-3">{event.summary}</div>)}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
