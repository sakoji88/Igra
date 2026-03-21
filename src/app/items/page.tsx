export const dynamic = 'force-dynamic';
import { AppLayout } from '@/components/layout';
import { getItemsCatalog } from '@/lib/server/data';
import { getItemTypeBadgeClasses } from '@/lib/server/items';

export default async function ItemsPage({ searchParams }: { searchParams?: Promise<{ filter?: string; q?: string }> }) {
  const params = await searchParams;
  const filter = (params?.filter ?? 'ALL').toUpperCase();
  const query = (params?.q ?? '').trim().toLowerCase();
  const items = await getItemsCatalog();
  const filtered = items.filter((item) => {
    if (filter !== 'ALL' && item.type !== filter) return false;
    if (query && !`${item.number} ${item.name} ${item.description}`.toLowerCase().includes(query)) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="grid gap-6">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Каталог артефактов</p>
          <h2 className="mt-2 text-3xl font-black">/items</h2>
          <p className="mt-3 max-w-3xl text-zinc-400">Отдельная энциклопедия предметов сезона: изображения, типы, конфликтные пары, заряды и пригодность для таргета.</p>
          <form className="mt-5 flex flex-wrap gap-3">
            <input name="q" defaultValue={params?.q ?? ''} placeholder="Поиск по имени" className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm" />
            <select name="filter" defaultValue={filter} className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm">
              <option value="ALL">Все</option>
              <option value="BUFF">Buffs</option>
              <option value="DEBUFF">Debuffs</option>
              <option value="TRAP">Traps</option>
            </select>
            <button type="submit" className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100">Применить</button>
          </form>
        </section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5">
              <img src={item.imageUrl ?? 'https://placehold.co/512x320/111/eee?text=Item'} alt={item.name} className="h-48 w-full rounded-2xl object-cover" />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-lg font-black">#{item.number} {item.name}</p>
                <span className={`rounded-full border px-3 py-1 text-xs ${getItemTypeBadgeClasses(item.type)}`}>{item.type}</span>
              </div>
              <p className="mt-3 text-sm text-zinc-300">{item.description}</p>
              <div className="mt-4 grid gap-2 text-xs text-zinc-400">
                <p>Заряды по умолчанию: {item.chargesDefault}</p>
                <p>Цели: {item.allowedTargets}</p>
                <p>Conflict key: {item.conflictKey ?? 'нет'}</p>
                <p>{item.active ? 'Активен в пуле' : 'Архивный предмет'}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
