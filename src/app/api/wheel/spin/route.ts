export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentSeason } from '@/lib/server/auth';
import { ensurePlayerSeasonState } from '@/lib/server/data';
import { spinWheelForState, type WheelPool } from '@/lib/server/wheel';

function normalizePool(value: unknown): WheelPool {
  if (value === 'BUFFS' || value === 'DEBUFFS' || value === 'BREDIK') return value;
  return 'PRIKOLY';
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const pool = normalizePool(body?.pool);

  const season = await getCurrentSeason();
  await ensurePlayerSeasonState(session.user.id);
  const state = await prisma.playerSeasonState.findUnique({ where: { userId_seasonId: { userId: session.user.id, seasonId: season.id } } });
  if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });

  try {
    const result = await spinWheelForState(state.id, pool);
    return NextResponse.json({
      spinId: result.spinId,
      wheelId: result.wheel.id,
      pool: result.pool,
      entry: {
        id: result.entry.id,
        label: result.entry.label,
        description: result.entry.description,
        rewardType: result.entry.rewardType,
        imageUrl: result.entry.imageUrl,
        rewardSpins: result.entry.rewardSpins,
        itemName: result.entry.itemDefinition?.name ?? null,
        itemType: result.entry.itemDefinition?.type ?? null,
        itemNumber: result.entry.itemDefinition?.number ?? null,
      },
      inventoryOutcome: result.inventoryOutcome,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Spin failed' }, { status: 400 });
  }
}
