import { Card } from '@/components/ui/card';

export function DashboardView() {
  return (
    <Card>
      <h2 className="text-2xl font-black">Старый demo dashboard снят с использования</h2>
      <p className="mt-3 text-zinc-400">Текущие страницы теперь читают реальные данные через Prisma и server actions.</p>
    </Card>
  );
}

export function BoardView() {
  return (
    <Card>
      <h2 className="text-2xl font-black">Старый demo board снят с использования</h2>
      <p className="mt-3 text-zinc-400">Актуальное игровое поле теперь рендерится напрямую на странице /board.</p>
    </Card>
  );
}
