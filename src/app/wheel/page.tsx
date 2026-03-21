export const dynamic = 'force-dynamic';
import { AppLayout } from '@/components/layout';
import { WheelSpinner } from '@/components/wheel';
import { requireSession } from '@/lib/server/auth';
import { getWheelPageData } from '@/lib/server/data';

export default async function WheelPage() {
  const session = await requireSession();
  const { season, state, wheel, logs } = await getWheelPageData(session.user.id!);
  if (!state || !wheel) throw new Error('Активное колесо не настроено');

  return (
    <AppLayout>
      <div className="grid gap-6">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-300">Колесо сезона</p>
          <h2 className="mt-2 text-3xl font-black">{wheel.name}</h2>
          <p className="mt-3 max-w-3xl text-zinc-400">{wheel.description ?? 'Сервер выбирает награду, клиент красиво доезжает до выбранного сектора.'}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-300">
            <div className="rounded-full border border-zinc-700 px-4 py-2">Сезон: {season.name}</div>
            <div className="rounded-full border border-zinc-700 px-4 py-2">Спины: {state.availableWheelSpins}</div>
          </div>
        </section>
        <WheelSpinner
          availableSpins={state.availableWheelSpins}
          entries={wheel.entries.map((entry) => ({ id: entry.id, label: entry.label, description: entry.description, rewardType: entry.rewardType, imageUrl: entry.imageUrl, itemName: entry.itemDefinition?.name ?? null }))}
          history={state.wheelSpins.map((spin) => ({ id: spin.id, createdAt: spin.createdAt.toISOString(), label: spin.wheelEntry.label, itemName: spin.wheelEntry.itemDefinition?.name ?? null }))}
        />
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6">
          <h3 className="text-xl font-black">Wheel log</h3>
          <div className="mt-4 grid gap-3 text-sm">
            {logs.map((event) => <div key={event.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">{event.summary}</div>)}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
