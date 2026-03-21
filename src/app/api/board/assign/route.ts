export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { resolveConditionSelectionEffects } from '@/lib/domain/effect-engine';
import { getCurrentSeason } from '@/lib/server/auth';
import { getSideBasePoints, isPlayableSlot } from '@/lib/server/board';
import { consumeInventoryItems, mapInventoryItemsForEffects } from '@/lib/server/items';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const slotId = String(body.slotId ?? '');
  const requestedConditionType = body.conditionType === 'GENRE' ? 'GENRE' : 'BASE';
  const season = await getCurrentSeason();

  const activeRun = await prisma.runAssignment.findFirst({
    where: { userId: session.user.id, seasonId: season.id, status: 'ACTIVE' },
  });
  if (activeRun) return NextResponse.json({ error: 'У игрока уже есть активная игра.' }, { status: 400 });

  const [slot, state] = await Promise.all([
    prisma.boardSlot.findUnique({ where: { id: slotId } }),
    prisma.playerSeasonState.findUnique({
      where: { userId_seasonId: { userId: session.user.id, seasonId: season.id } },
      include: { inventoryItems: { include: { itemDefinition: true }, orderBy: { obtainedAt: 'asc' } } },
    }),
  ]);

  if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });
  if (!slot || slot.seasonId !== season.id || !isPlayableSlot(slot)) {
    return NextResponse.json({ error: 'Слот недоступен для обычного рана.' }, { status: 400 });
  }

  const conditionEffects = resolveConditionSelectionEffects(mapInventoryItemsForEffects(state.inventoryItems));
  const conditionType = conditionEffects.lockedConditionType ?? requestedConditionType;
  const expectedPoints = conditionType === 'GENRE' ? getSideBasePoints(slot.side) * 2 : getSideBasePoints(slot.side);

  const run = await prisma.runAssignment.create({
    data: {
      userId: session.user.id,
      seasonId: season.id,
      slotId: slot.id,
      slotNumber: slot.slotNumber,
      slotName: slot.name,
      side: slot.side,
      conditionType,
      expectedPoints,
    },
  });

  await consumeInventoryItems(conditionEffects.consumedItemIds);

  await prisma.eventLog.create({
    data: {
      seasonId: season.id,
      userId: session.user.id,
      type: 'RUN',
      summary: `${session.user.name} выбрал ${conditionType === 'BASE' ? 'Base' : 'Genre'} условия для слота ${slot.slotNumber}.`,
      payload: { slotId: slot.id, conditionType, expectedPoints, conditionEffects: conditionEffects.breakdown },
    },
  });

  return NextResponse.json({ run, conditionType, conditionEffects: conditionEffects.breakdown });
}
