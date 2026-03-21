export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getItemsCatalog } from '@/lib/server/data';
import { getCurrentSeason } from '@/lib/server/auth';
import { getItemTypeBadgeClasses, getItemTypeLabel, getTargetLabel, getItemStageLabel, getContentItemMetadata } from '@/lib/server/items';
import { itemDefinitionSchema } from '@/lib/validation/forms';

type Params = { filter?: string; q?: string; edit?: string; create?: string };

function ItemEditor({
  item,
  onSubmit,
  onCancelHref,
}: {
  item?: Awaited<ReturnType<typeof getItemsCatalog>>[number];
  onSubmit: (formData: FormData) => Promise<void>;
  onCancelHref: string;
}) {
  return (
    <form action={onSubmit} className="grid gap-3 rounded-3xl border border-fuchsia-400/30 bg-zinc-950/95 p-5 md:grid-cols-2">
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
      <input name="number" type="number" defaultValue={item?.number ?? ''} placeholder="Номер" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
      <input name="name" defaultValue={item?.name ?? ''} placeholder="Название" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
      <select name="type" defaultValue={item?.type ?? 'BUFF'} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option>BUFF</option><option>DEBUFF</option><option>TRAP</option><option>NEUTRAL</option></select>
      <input name="imageUrl" defaultValue={item?.imageUrl ?? ''} placeholder="Ссылка на изображение" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
      <input name="chargesDefault" type="number" defaultValue={item?.chargesDefault ?? 1} placeholder="Заряды" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
      <input name="allowedTargets" defaultValue={item?.allowedTargets ?? 'self'} placeholder="self / other / self,other" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
      <input name="conflictKey" defaultValue={item?.conflictKey ?? ''} placeholder="Ключ конфликта" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
      <select name="active" defaultValue={String(item?.active ?? true)} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option value="true">Показывать</option><option value="false">Скрыть</option></select>
      <textarea name="description" defaultValue={item?.description ?? ''} placeholder="Описание предмета" className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 md:col-span-2" />
      <div className="flex flex-wrap gap-3 md:col-span-2">
        <Button type="submit">{item ? 'Сохранить предмет' : 'Добавить предмет'}</Button>
        <a href={onCancelHref} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200">Отмена</a>
      </div>
    </form>
  );
}

export default async function ItemsPage({ searchParams }: { searchParams?: Promise<Params> }) {
  const params = await searchParams;
  const filter = (params?.filter ?? 'ALL').toUpperCase();
  const query = (params?.q ?? '').trim().toLowerCase();
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';
  const items = await getItemsCatalog();
  const editingItem = params?.edit ? items.find((item) => item.id === params.edit) : undefined;
  const filtered = items.filter((item) => {
    if (filter !== 'ALL' && item.type !== filter) return false;
    if (query && !`${item.number} ${item.name} ${item.description}`.toLowerCase().includes(query)) return false;
    return true;
  });

  async function createItemAction(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;
    const season = await getCurrentSeason();
    const parsed = itemDefinitionSchema.parse(Object.fromEntries(formData));
    const item = await prisma.itemDefinition.create({ data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', userId: session.user.id, summary: `Админ создал предмет ${item.name}.`, payload: { itemId: item.id } } });
    revalidatePath('/items');
    revalidatePath('/admin');
  }

  async function updateItemAction(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;
    const season = await getCurrentSeason();
    const itemId = String(formData.get('itemId'));
    const parsed = itemDefinitionSchema.parse(Object.fromEntries(formData));
    const item = await prisma.itemDefinition.update({ where: { id: itemId }, data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', userId: session.user.id, summary: `Админ обновил предмет ${item.name}.`, payload: { itemId: item.id } } });
    revalidatePath('/items');
    revalidatePath('/admin');
  }

  async function toggleItemAction(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;
    const season = await getCurrentSeason();
    const itemId = String(formData.get('itemId'));
    const active = String(formData.get('active')) === 'true';
    const item = await prisma.itemDefinition.update({ where: { id: itemId }, data: { active } });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'ADMIN', userId: session.user.id, summary: `Админ ${active ? 'показал' : 'скрыл'} предмет ${item.name}.`, payload: { itemId } } });
    revalidatePath('/items');
  }

  const baseHref = `/items${params?.filter || params?.q ? `?${new URLSearchParams({ ...(params?.filter ? { filter: params.filter } : {}), ...(params?.q ? { q: params.q } : {}) }).toString()}` : ''}`;

  return (
    <AppLayout>
      <div className="grid gap-6">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Энциклопедия сезона</p>
              <h2 className="mt-2 text-3xl font-black">Предметы и артефакты</h2>
              <p className="mt-3 max-w-3xl text-zinc-400">Каталог добычи сезона: изображения, типы, ключи конфликтов, цели и заряды. Для админа редактирование происходит прямо здесь, в контексте просмотра.</p>
            </div>
            {isAdmin ? <Link href="/items?create=1" className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-2 text-sm text-fuchsia-100">Добавить предмет</Link> : null}
          </div>
          <form className="mt-5 flex flex-wrap gap-3">
            <input name="q" defaultValue={params?.q ?? ''} placeholder="Поиск по названию" className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm" />
            <select name="filter" defaultValue={filter} className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm">
              <option value="ALL">Все типы</option>
              <option value="BUFF">Только баффы</option>
              <option value="DEBUFF">Только дебаффы</option>
              <option value="TRAP">Только ловушки</option>
            </select>
            <button type="submit" className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100">Применить фильтры</button>
          </form>
        </section>

        {isAdmin && params?.create ? <ItemEditor onSubmit={createItemAction} onCancelHref={baseHref} /> : null}
        {isAdmin && editingItem ? <ItemEditor item={editingItem} onSubmit={updateItemAction} onCancelHref={baseHref} /> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item: any) => {
            const meta = getContentItemMetadata(item.number);
            return (
            <article key={item.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5 select-text">
              <img src={item.imageUrl ?? 'https://placehold.co/512x320/111/eee?text=Item'} alt={item.name} className="h-48 w-full rounded-2xl object-cover" />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-lg font-black">#{item.number} {item.name}</p>
                <span className={`rounded-full border px-3 py-1 text-xs ${getItemTypeBadgeClasses(item.type)}`}>{getItemTypeLabel(item.type)}</span>
              </div>
              <p className="mt-3 text-sm text-zinc-300">{item.description}</p>
              <div className="mt-4 grid gap-2 text-xs text-zinc-400">
                <p>Заряды по умолчанию: {item.chargesDefault}</p>
                <p>Цели применения: {getTargetLabel(item.allowedTargets)}</p>
                <p>Ключ конфликта: {item.conflictKey ?? 'нет'}</p>
                <p>{item.active ? 'Показывается в пуле' : 'Скрыт из публичного пула'}</p>
              </div>
              {meta?.mechanics?.length ? (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Срабатывание</p>
                  <div className="mt-3 grid gap-2 text-xs text-zinc-300">
                    {meta.mechanics.map((effect) => <div key={effect.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3"><p className="font-semibold text-white">{getItemStageLabel(effect.triggerStage)}</p><p className="mt-1">{effect.applicationText}</p></div>)}
                  </div>
                </div>
              ) : null}
              {isAdmin ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/items?edit=${item.id}${params?.filter ? `&filter=${params.filter}` : ''}${params?.q ? `&q=${encodeURIComponent(params.q)}` : ''}`} className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-200">Редактировать</Link>
                  <form action={toggleItemAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="active" value={String(!item.active)} />
                    <button type="submit" className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-200">{item.active ? 'Скрыть' : 'Показать'}</button>
                  </form>
                </div>
              ) : null}
            </article>
          );})}
        </div>
      </div>
    </AppLayout>
  );
}
