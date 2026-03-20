import { AppLayout } from '@/components/layout';
import { DashboardView } from '@/components/sections';

export default async function HomePage() {
  return (
    <AppLayout>
      <DashboardView />
    </AppLayout>
  );
}
