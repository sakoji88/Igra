export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentSeason } from '@/lib/server/auth';
import { ensurePlayerSeasonState } from '@/lib/server/data';
import { spinWheelForState } from '@/lib/server/wheel';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const season = await getCurrentSeason();
  await ensurePlayerSeasonState(session.user.id);
  const state = await prisma.playerSeasonState.findUnique({ where: { userId_seasonId: { userId: session.user.id, seasonId: season.id } } });
  if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });

  try {
    const result = await spinWheelForState(state.id);
    return NextResponse.json({
      spinId: result.spinId,
      wheelId: result.wheel.id,
      entry: {
        id: result.entry.id,
        label: result.entry.label,
        description: result.entry.description,
        rewardType: result.entry.rewardType,
        imageUrl: result.entry.imageUrl,
        rewardSpins: result.entry.rewardSpins,
        itemName: result.entry.itemDefinition?.name ?? null,
      },
      inventoryOutcome: result.inventoryOutcome,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Spin failed' }, { status: 400 });
  }
}
