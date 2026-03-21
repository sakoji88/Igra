export const dynamic = 'force-dynamic';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';

export default async function RulesPage() {
  const sections = await prisma.ruleSection.findMany({ where: { published: true }, orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }] });

  return (
    <AppLayout>
      <div className="grid gap-6">
        <Card>
          <h2 className="text-3xl font-black">Энциклопедия правил MVP</h2>
          <p className="mt-3 max-w-3xl text-zinc-400">Правила теперь читаются из базы и правятся через админку, а не хардкодятся прямо в page component.</p>
        </Card>
        {sections.map((section) => (
          <Card key={section.id}>
            <h3 className="text-xl font-bold">{section.title}</h3>
            <p className="mt-4 whitespace-pre-wrap text-zinc-300">{section.content}</p>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
