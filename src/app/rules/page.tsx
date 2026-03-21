export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentSeason } from '@/lib/server/auth';
import { ruleSectionSchema } from '@/lib/validation/forms';
import { glossaryEntries, specialMechanics } from '@/lib/content/game-content';

type Params = { edit?: string; create?: string };

function RuleEditor({
  rule,
  onSubmit,
  cancelHref,
}: {
  rule?: { id: string; title: string; slug: string; content: string; order: number; published: boolean };
  onSubmit: (formData: FormData) => Promise<void>;
  cancelHref: string;
}) {
  return (
    <form action={onSubmit} className="grid gap-3 rounded-3xl border border-cyan-400/30 bg-zinc-950/95 p-5">
      {rule ? <input type="hidden" name="ruleId" value={rule.id} /> : null}
      <input name="title" defaultValue={rule?.title ?? ''} placeholder="Заголовок раздела" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
      <input name="slug" defaultValue={rule?.slug ?? ''} placeholder="slug" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
      <input name="order" type="number" defaultValue={rule?.order ?? 1} placeholder="Порядок" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
      <select name="published" defaultValue={String(rule?.published ?? true)} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"><option value="true">Опубликован</option><option value="false">Скрыт</option></select>
      <textarea name="content" defaultValue={rule?.content ?? ''} placeholder="Текст раздела" className="min-h-40 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
      <div className="flex flex-wrap gap-3">
        <Button type="submit">{rule ? 'Сохранить раздел' : 'Добавить раздел'}</Button>
        <a href={cancelHref} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200">Отмена</a>
      </div>
    </form>
  );
}

export default async function RulesPage({ searchParams }: { searchParams?: Promise<Params> }) {
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';
  const params = await searchParams;
  const sections = await prisma.ruleSection.findMany({ where: isAdmin ? undefined : { published: true }, orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }] });
  const editingRule = params?.edit ? sections.find((section) => section.id === params.edit) : undefined;

  async function createRuleAction(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;
    const season = await getCurrentSeason();
    const parsed = ruleSectionSchema.parse(Object.fromEntries(formData));
    const rule = await prisma.ruleSection.create({ data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'RULE', userId: session.user.id, summary: `Создан раздел правил ${rule.title}.`, payload: { ruleId: rule.id } } });
    revalidatePath('/rules');
  }

  async function updateRuleAction(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;
    const season = await getCurrentSeason();
    const ruleId = String(formData.get('ruleId'));
    const parsed = ruleSectionSchema.parse(Object.fromEntries(formData));
    const rule = await prisma.ruleSection.update({ where: { id: ruleId }, data: parsed });
    await prisma.eventLog.create({ data: { seasonId: season.id, type: 'RULE', userId: session.user.id, summary: `Обновлён раздел правил ${rule.title}.`, payload: { ruleId } } });
    revalidatePath('/rules');
  }

  async function toggleRuleAction(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;
    const ruleId = String(formData.get('ruleId'));
    const published = String(formData.get('published')) === 'true';
    await prisma.ruleSection.update({ where: { id: ruleId }, data: { published } });
    revalidatePath('/rules');
  }

  async function moveRuleAction(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;
    const ruleId = String(formData.get('ruleId'));
    const direction = String(formData.get('direction'));
    const rule = await prisma.ruleSection.findUnique({ where: { id: ruleId } });
    if (!rule) return;
    const swapWith = await prisma.ruleSection.findFirst({
      where: direction === 'up' ? { order: { lt: rule.order } } : { order: { gt: rule.order } },
      orderBy: { order: direction === 'up' ? 'desc' : 'asc' },
    });
    if (!swapWith) return;
    await prisma.$transaction([
      prisma.ruleSection.update({ where: { id: rule.id }, data: { order: swapWith.order } }),
      prisma.ruleSection.update({ where: { id: swapWith.id }, data: { order: rule.order } }),
    ]);
    revalidatePath('/rules');
  }

  async function deleteRuleAction(formData: FormData) {
    'use server';
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return;
    const ruleId = String(formData.get('ruleId'));
    await prisma.ruleSection.delete({ where: { id: ruleId } });
    revalidatePath('/rules');
  }

  return (
    <AppLayout>
      <div className="grid gap-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Энциклопедия правил</h2>
              <p className="mt-3 max-w-3xl text-zinc-400">Основной справочник сезона. Игроки читают опубликованные разделы, а админ редактирует правила прямо здесь, в той же среде просмотра.</p>
            </div>
            {isAdmin ? <Link href="/rules?create=1" className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100">Добавить раздел</Link> : null}
          </div>
        </Card>

        {isAdmin && params?.create ? <RuleEditor onSubmit={createRuleAction} cancelHref="/rules" /> : null}
        {isAdmin && editingRule ? <RuleEditor rule={editingRule} onSubmit={updateRuleAction} cancelHref="/rules" /> : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <h3 className="text-xl font-bold">Глоссарий</h3>
            <div className="mt-4 grid gap-3 text-sm">
              {glossaryEntries.map((entry) => <div key={entry.term} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="font-semibold text-white">{entry.term}</p><p className="mt-2 text-zinc-300">{entry.description}</p></div>)}
            </div>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Особые механики MVP</h3>
            <div className="mt-4 grid gap-3 text-sm">
              {specialMechanics.map((entry) => <div key={entry.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="font-semibold text-white">{entry.title}</p><p className="mt-2 text-zinc-300">{entry.description}</p></div>)}
            </div>
          </Card>
        </div>

        {sections.map((section: any) => (
          <Card key={section.id} className="select-text">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold">{section.title}</h3>
                  {!section.published ? <span className="rounded-full border border-red-400/40 bg-red-500/10 px-2 py-1 text-[11px] text-red-100">Скрыт</span> : null}
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-500">Порядок: {section.order} • slug: {section.slug}</p>
              </div>
              {isAdmin ? (
                <div className="flex flex-wrap gap-2 text-sm">
                  <a href={`/rules?edit=${section.id}`} className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200">Редактировать</a>
                  <form action={moveRuleAction}><input type="hidden" name="ruleId" value={section.id} /><input type="hidden" name="direction" value="up" /><button type="submit" className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200">Поднять</button></form>
                  <form action={moveRuleAction}><input type="hidden" name="ruleId" value={section.id} /><input type="hidden" name="direction" value="down" /><button type="submit" className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200">Опустить</button></form>
                  <form action={toggleRuleAction}><input type="hidden" name="ruleId" value={section.id} /><input type="hidden" name="published" value={String(!section.published)} /><button type="submit" className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200">{section.published ? 'Скрыть' : 'Опубликовать'}</button></form>
                  <form action={deleteRuleAction}><input type="hidden" name="ruleId" value={section.id} /><button type="submit" className="rounded-full border border-red-500/40 px-3 py-1 text-red-100">Удалить</button></form>
                </div>
              ) : null}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-zinc-300">{section.content}</p>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
