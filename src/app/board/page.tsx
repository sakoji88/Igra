import { AppLayout } from '@/components/layout';
import { BoardView } from '@/components/sections';

export default async function BoardPage() {
  return (
    <AppLayout>
      <BoardView />
    </AppLayout>
  );
}
