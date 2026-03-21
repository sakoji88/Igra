export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { moveOnBoard } from '@/lib/domain/game';
import { resolveRollEffects } from '@/lib/domain/effect-engine';
import { getCurrentSeason } from '@/lib/server/auth';
import { isPlayableSlot } from '@/lib/server/board';
import { consumeInventoryItems, mapInventoryItemsForEffects } from '@/lib/server/items';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const season = await getCurrentSeason();
  const state = await prisma.playerSeasonState.findUnique({
    where: { userId_seasonId: { userId: session.user.id, seasonId: season.id } },
    include: { inventoryItems: { include: { itemDefinition: true }, orderBy: { obtainedAt: 'asc' } } },
  });

  if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });

  const activeRun = await prisma.runAssignment.findFirst({
    where: { userId: session.user.id, seasonId: season.id, status: 'ACTIVE' },
    orderBy: { assignedAt: 'desc' },
  });
  if (activeRun) {
    return NextResponse.json({
      error: `Сначала заверши активную игру «${activeRun.gameTitle ?? activeRun.slotName}». Пока она активна, новый бросок запрещён.`,
      activeRun: {
        id: activeRun.id,
        slotName: activeRun.slotName,
        gameTitle: activeRun.gameTitle,
      },
    }, { status: 400 });
  }

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const effectResolution = resolveRollEffects({
    items: mapInventoryItemsForEffects(state.inventoryItems),
    die1,
    die2,
  });
  const boardSize = await prisma.boardSlot.count({ where: { seasonId: season.id } });
  const moved = moveOnBoard(state.boardPosition, effectResolution.finalMoveTotal, boardSize);
  const slot = await prisma.boardSlot.findUnique({ where: { seasonId_slotNumber: { seasonId: season.id, slotNumber: moved.nextPosition } } });

  const updated = await prisma.playerSeasonState.update({
    where: { id: state.id },
    data: {
      boardPosition: moved.nextPosition,
      lastDie1: die1,
      lastDie2: die2,
      lastRollTotal: effectResolution.finalMoveTotal,
    },
  });

  await consumeInventoryItems(effectResolution.consumedItemIds);

  await prisma.eventLog.create({
    data: {
      seasonId: season.id,
      userId: session.user.id,
      type: 'TURN',
      summary: `${session.user.name} бросил ${die1} + ${die2} и дошёл до слота ${moved.nextPosition}${slot ? ` — ${slot.name}` : ''}.`,
      payload: {
        kind: 'ROLL_RESULT',
        from: state.boardPosition,
        to: moved.nextPosition,
        passedStart: moved.passedStart,
        die1,
        die2,
        rawRollTotal: effectResolution.rawRollTotal,
        finalMoveTotal: effectResolution.finalMoveTotal,
        breakdown: effectResolution.breakdown,
      },
    },
  });

  return NextResponse.json({
    die1,
    die2,
    total: effectResolution.rawRollTotal,
    finalMoveTotal: effectResolution.finalMoveTotal,
    breakdown: effectResolution.breakdown,
    state: updated,
    landedSlot: slot ? {
      id: slot.id,
      slotNumber: slot.slotNumber,
      name: slot.name,
      playable: isPlayableSlot(slot),
      type: slot.type,
    } : null,
  });
}
