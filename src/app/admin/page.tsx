export const dynamic = 'force-dynamic';
import { revalidatePath } from 'next/cache';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { requireRole, getCurrentSeason } from '@/lib/server/auth';
import { getAdminData } from '@/lib/server/data';
import { getItemTypeBadgeClasses, serializeStringList } from '@/lib/server/items';
import { itemDefinitionSchema, ruleSectionSchema, slotUpdateSchema, wheelDefinitionSchema, wheelEntrySchema } from '@/lib/validation/forms';

export default async function AdminPage() {
  await requireRole(['ADMIN']);
  const { season, players, items, rules, logs, slots, wheels } = await getAdminData();

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

  async function createItemAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const parsed = itemDefinitionSchema.parse(Object.fromEntries(formData));
    const item = await prisma.itemDefinition.create({ data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', summary: `Админ создал предмет ${item.name}.`, payload: { itemId: item.id } } });
    revalidatePath('/admin'); revalidatePath('/items');
  }

  async function updateItemAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const id = String(formData.get('itemId'));
    const parsed = itemDefinitionSchema.parse(Object.fromEntries(formData));
    const item = await prisma.itemDefinition.update({ where: { id }, data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', summary: `Админ обновил предмет ${item.name}.`, payload: { itemId: item.id } } });
    revalidatePath('/admin'); revalidatePath('/items');
  }

  async function createWheelAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const parsed = wheelDefinitionSchema.parse(Object.fromEntries(formData));
    const wheel = await prisma.wheelDefinition.create({ data: { ...parsed, seasonId: season.id } });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', summary: `Админ создал колесо ${wheel.name}.`, payload: { wheelId: wheel.id } } });
    revalidatePath('/admin'); revalidatePath('/wheel');
  }

  async function updateWheelAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const wheelId = String(formData.get('wheelId'));
    const parsed = wheelDefinitionSchema.parse(Object.fromEntries(formData));
    const wheel = await prisma.wheelDefinition.update({ where: { id: wheelId }, data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', summary: `Админ обновил колесо ${wheel.name}.`, payload: { wheelId } } });
    revalidatePath('/admin'); revalidatePath('/wheel');
  }

  async function createWheelEntryAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const wheelDefinitionId = String(formData.get('wheelDefinitionId'));
    const parsed = wheelEntrySchema.parse(Object.fromEntries(formData));
    const entry = await prisma.wheelEntry.create({ data: { ...parsed, wheelDefinitionId } });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', summary: `Админ создал сектор ${entry.label}.`, payload: { wheelEntryId: entry.id } } });
    revalidatePath('/admin'); revalidatePath('/wheel');
  }

  async function updateWheelEntryAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const entryId = String(formData.get('entryId'));
    const parsed = wheelEntrySchema.parse(Object.fromEntries(formData));
    const entry = await prisma.wheelEntry.update({ where: { id: entryId }, data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', summary: `Админ обновил сектор ${entry.label}.`, payload: { wheelEntryId: entry.id } } });
    revalidatePath('/admin'); revalidatePath('/wheel');
  }

  async function updateSlotAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const parsed = slotUpdateSchema.parse(Object.fromEntries(formData));
    const slot = await prisma.boardSlot.update({ where: { id: parsed.slotId }, data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', summary: `Админ обновил слот ${slot.slotNumber}: ${slot.name}.`, payload: { slotId: slot.id } } });
    revalidatePath('/admin'); revalidatePath('/board');
  }

  async function createRuleAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const parsed = ruleSectionSchema.parse(Object.fromEntries(formData));
    const rule = await prisma.ruleSection.create({ data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'RULE', summary: `Создан раздел правил ${rule.title}.`, payload: { ruleId: rule.id } } });
    revalidatePath('/admin'); revalidatePath('/rules');
  }

  async function updateRuleAction(formData: FormData) {
    'use server';
    const season = await getCurrentSeason();
    const id = String(formData.get('ruleId'));
    const parsed = ruleSectionSchema.parse(Object.fromEntries(formData));
    const rule = await prisma.ruleSection.update({ where: { id }, data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'RULE', summary: `Обновлён раздел правил ${rule.title}.`, payload: { ruleId: rule.id } } });
    revalidatePath('/admin'); revalidatePath('/rules');
  }

  return (
    <AppLayout>
      <div className="grid gap-6">
        <Card>
          <h2 className="text-2xl font-black">Панель управления</h2>
          <p className="mt-2 text-zinc-400">Активный сезон: {season.name}. Здесь правятся игроки, wheel, slots, items и rules без правки кода.</p>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h3 className="text-xl font-bold">Игроки и wheel state</h3>
            <div className="mt-4 grid gap-4">
              {players.map((player) => (
                <div key={player.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <p className="font-semibold">{player.user.profile?.displayName ?? player.user.nickname}</p>
                  <p className="mt-1 text-sm text-zinc-400">Счёт: {player.score} • Позиция: {player.boardPosition} • Spins: {player.availableWheelSpins}</p>
                  <form action={adjustPlayerAction} className="mt-4 grid gap-3 md:grid-cols-4">
                    <input type="hidden" name="userId" value={player.user.id} />
                    <input name="score" defaultValue={player.score} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <input name="boardPosition" defaultValue={player.boardPosition} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <input name="availableWheelSpins" defaultValue={player.availableWheelSpins} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <Button type="submit">Сохранить</Button>
                  </form>
                  <div className="mt-3 grid gap-2 text-xs text-zinc-400">
                    {player.wheelSpins.map((spin) => <div key={spin.id}>Spin: {spin.wheelEntry.label} • {spin.createdAt.toLocaleString('ru-RU')}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold">Item definitions</h3>
            <form action={createItemAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input name="number" type="number" placeholder="Номер" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="name" placeholder="Название" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <select name="type" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option>BUFF</option><option>DEBUFF</option><option>TRAP</option><option>NEUTRAL</option></select>
              <input name="imageUrl" placeholder="Image URL" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="chargesDefault" type="number" defaultValue={1} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="allowedTargets" defaultValue="self" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="conflictKey" placeholder="conflictKey" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <select name="active" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option value="true">Активен</option><option value="false">Архив</option></select>
              <textarea name="description" placeholder="Описание" className="min-h-24 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 md:col-span-2" />
              <Button type="submit">Создать предмет</Button>
            </form>
            <div className="mt-5 grid gap-4">
              {items.map((item) => (
                <form key={item.id} action={updateItemAction} className="rounded-2xl bg-zinc-900/80 p-4 grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="itemId" value={item.id} />
                  <div className="md:col-span-2 flex items-center gap-3"><span className={`rounded-full border px-3 py-1 text-xs ${getItemTypeBadgeClasses(item.type)}`}>{item.type}</span><span className="text-xs text-zinc-400">conflictKey: {item.conflictKey ?? 'нет'}</span></div>
                  <input name="number" defaultValue={item.number} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="name" defaultValue={item.name} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <select name="type" defaultValue={item.type} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option>BUFF</option><option>DEBUFF</option><option>TRAP</option><option>NEUTRAL</option></select>
                  <input name="imageUrl" defaultValue={item.imageUrl ?? ''} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="chargesDefault" defaultValue={item.chargesDefault} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="allowedTargets" defaultValue={item.allowedTargets} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="conflictKey" defaultValue={item.conflictKey ?? ''} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <select name="active" defaultValue={String(item.active)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="true">Активен</option><option value="false">Архив</option></select>
                  <textarea name="description" defaultValue={item.description} className="min-h-20 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
                  <Button type="submit">Обновить предмет</Button>
                </form>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h3 className="text-xl font-bold">Wheel management</h3>
            <form action={createWheelAction} className="mt-4 grid gap-3">
              <input name="name" placeholder="Название колеса" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <input name="imageUrl" placeholder="Image URL" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <textarea name="description" placeholder="Описание колеса" className="min-h-24 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
              <select name="active" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option value="true">Активно</option><option value="false">Выключено</option></select>
              <Button type="submit">Создать колесо</Button>
            </form>
            <div className="mt-5 grid gap-5">
              {wheels.map((wheel) => (
                <div key={wheel.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <form action={updateWheelAction} className="grid gap-3 md:grid-cols-2">
                    <input type="hidden" name="wheelId" value={wheel.id} />
                    <input name="name" defaultValue={wheel.name} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <input name="imageUrl" defaultValue={wheel.imageUrl ?? ''} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <textarea name="description" defaultValue={wheel.description ?? ''} className="min-h-20 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
                    <select name="active" defaultValue={String(wheel.active)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="true">Активно</option><option value="false">Выключено</option></select>
                    <Button type="submit">Обновить колесо</Button>
                  </form>
                  <form action={createWheelEntryAction} className="mt-5 grid gap-3 rounded-2xl border border-zinc-800 bg-black/20 p-4 md:grid-cols-2">
                    <input type="hidden" name="wheelDefinitionId" value={wheel.id} />
                    <input name="label" placeholder="Название сектора" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <input name="imageUrl" placeholder="Image URL" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <textarea name="description" placeholder="Описание" className="min-h-20 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
                    <select name="rewardType" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option>ITEM</option><option>SPINS</option><option>NOTHING</option></select>
                    <select name="itemDefinitionId" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="">Без предмета</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    <input name="rewardSpins" type="number" defaultValue={1} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <input name="weight" type="number" defaultValue={1} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                    <select name="active" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="true">Активен</option><option value="false">Скрыт</option></select>
                    <Button type="submit">Добавить сектор</Button>
                  </form>
                  <div className="mt-5 grid gap-4">
                    {wheel.entries.map((entry) => (
                      <form key={entry.id} action={updateWheelEntryAction} className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 md:grid-cols-2">
                        <input type="hidden" name="entryId" value={entry.id} />
                        <input name="label" defaultValue={entry.label} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                        <input name="imageUrl" defaultValue={entry.imageUrl ?? ''} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                        <textarea name="description" defaultValue={entry.description ?? ''} className="min-h-20 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
                        <select name="rewardType" defaultValue={entry.rewardType} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option>ITEM</option><option>SPINS</option><option>NOTHING</option></select>
                        <select name="itemDefinitionId" defaultValue={entry.itemDefinitionId ?? ''} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="">Без предмета</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                        <input name="rewardSpins" type="number" defaultValue={entry.rewardSpins ?? 1} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                        <input name="weight" type="number" defaultValue={entry.weight} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                        <select name="active" defaultValue={String(entry.active)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="true">Активен</option><option value="false">Скрыт</option></select>
                        <Button type="submit">Сохранить сектор</Button>
                      </form>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold">Slot content management</h3>
            <div className="mt-4 grid gap-4 max-h-[1200px] overflow-y-auto pr-1">
              {slots.map((slot) => (
                <form key={slot.id} action={updateSlotAction} className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 md:grid-cols-2">
                  <input type="hidden" name="slotId" value={slot.id} />
                  <input name="slotNumber" defaultValue={slot.slotNumber} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <input name="name" defaultValue={slot.name} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <select name="type" defaultValue={slot.type} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option>START</option><option>REGULAR</option><option>RANDOM</option><option>JAIL</option><option>LOTTERY</option><option>AUCTION</option><option>PODLYANKA</option><option>KAIFARIK</option><option>WHEEL</option></select>
                  <select name="side" defaultValue={slot.side} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option>BOTTOM</option><option>LEFT</option><option>TOP</option><option>RIGHT</option></select>
                  <input name="imageUrl" defaultValue={slot.imageUrl ?? ''} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
                  <input name="imageFallback" defaultValue={slot.imageFallback} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
                  <textarea name="baseConditions" defaultValue={serializeStringList(slot.baseConditions)} className="min-h-24 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <textarea name="genreConditions" defaultValue={serializeStringList(slot.genreConditions)} className="min-h-24 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                  <textarea name="description" defaultValue={slot.description ?? ''} className="min-h-20 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
                  <select name="isPlayable" defaultValue={String(slot.isPlayable)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="true">Игровой</option><option value="false">Не игровой</option></select>
                  <select name="isPublished" defaultValue={String(slot.isPublished)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="true">Опубликован</option><option value="false">Скрыт</option></select>
                  <Button type="submit">Сохранить слот</Button>
                </form>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
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
            <div className="mt-5 grid gap-4">{rules.map((rule) => <form key={rule.id} action={updateRuleAction} className="rounded-2xl bg-zinc-900/80 p-4 grid gap-3"><input type="hidden" name="ruleId" value={rule.id} /><input name="title" defaultValue={rule.title} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /><input name="slug" defaultValue={rule.slug} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /><input name="order" defaultValue={rule.order} type="number" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /><select name="published" defaultValue={String(rule.published)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="true">Опубликован</option><option value="false">Скрыт</option></select><textarea name="content" defaultValue={rule.content} className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /><Button type="submit">Обновить правило</Button></form>)}</div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Последние действия</h3>
            <div className="mt-4 grid gap-3 text-sm">{logs.map((event) => <div key={event.id} className="rounded-xl bg-zinc-900/80 p-3">{event.summary}</div>)}</div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
