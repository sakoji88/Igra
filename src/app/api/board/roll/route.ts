export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { moveOnBoard } from '@/lib/domain/game';
import { resolveRollEffects, resolveRollMode } from '@/lib/domain/effect-engine';
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

  if (state.jailReason) {
    return NextResponse.json({ error: 'Игрок сейчас в тюрьме после дропа. Сначала закрой тюремный слот или попроси судью/админа скорректировать состояние.' }, { status: 400 });
  }

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

  const runtimeItems = mapInventoryItemsForEffects(state.inventoryItems);
  const seasonStates = await prisma.playerSeasonState.findMany({ where: { seasonId: season.id, user: { role: 'PLAYER' } }, orderBy: [{ score: 'desc' }, { updatedAt: 'asc' }] });
  const playerRank = Math.max(1, seasonStates.findIndex((entry) => entry.id === state.id) + 1 || 1);
  const rollMode = resolveRollMode(runtimeItems);
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const die3 = rollMode.rollMode === 'THREE_D6_KEEP_BEST_TWO' ? Math.floor(Math.random() * 6) + 1 : null;
  const chosenDice = rollMode.rollMode === 'THREE_D6_KEEP_BEST_TWO' && die3 ? [die1, die2, die3].sort((a, b) => b - a).slice(0, 2) : [die1, die2];
  const effectResolution = resolveRollEffects({
    items: runtimeItems,
    die1: chosenDice[0]!,
    die2: chosenDice[1]!,
    die3,
    playerRank,
    totalPlayers: seasonStates.length,
    coinFlip: runtimeItems.some((item) => item.itemDefinition.number === 43) ? (Math.random() < 0.5 ? 'HEADS' : 'TAILS') : undefined,
  });
  const boardSize = await prisma.boardSlot.count({ where: { seasonId: season.id } });
  const movementValue = effectResolution.movedBackwards ? (boardSize - (effectResolution.finalMoveTotal % boardSize || boardSize)) : effectResolution.finalMoveTotal;
  const moved = moveOnBoard(state.boardPosition, movementValue, boardSize);
  let slot = await prisma.boardSlot.findUnique({ where: { seasonId_slotNumber: { seasonId: season.id, slotNumber: moved.nextPosition } } });
  let finalPosition = moved.nextPosition;
  let autoSkippedJail = false;
  if (slot?.type === 'JAIL' && !state.jailReason) {
    autoSkippedJail = true;
    finalPosition = (moved.nextPosition + 1) % boardSize;
    slot = await prisma.boardSlot.findUnique({ where: { seasonId_slotNumber: { seasonId: season.id, slotNumber: finalPosition } } });
  }

  const updated = await prisma.playerSeasonState.update({
    where: { id: state.id },
    data: {
      previousBoardPosition: state.boardPosition,
      boardPosition: finalPosition,
      lastDie1: effectResolution.die1,
      lastDie2: effectResolution.die2,
      lastRollTotal: effectResolution.finalMoveTotal,
    },
  });

  await consumeInventoryItems([...rollMode.consumedItemIds, ...effectResolution.consumedItemIds]);

  await prisma.eventLog.create({
    data: {
      seasonId: season.id,
      userId: session.user.id,
      type: 'TURN',
      summary: `${session.user.name} бросил ${effectResolution.die1} + ${effectResolution.die2}${die3 ? ` (+${die3}, взяты два лучших)` : ''}${effectResolution.movedBackwards ? ' и пошёл назад' : ''} до слота ${finalPosition}${slot ? ` — ${slot.name}` : ''}${autoSkippedJail ? ' (тюрьма пропущена автоматически).' : '.'}`,
      payload: {
        kind: 'ROLL_RESULT',
        from: state.boardPosition,
        to: finalPosition,
        passedStart: moved.passedStart,
        die1: effectResolution.die1,
        die2: effectResolution.die2,
        die3,
        rawRollTotal: effectResolution.rawRollTotal,
        finalMoveTotal: effectResolution.finalMoveTotal,
        movedBackwards: effectResolution.movedBackwards,
        breakdown: [...rollMode.breakdown, ...effectResolution.breakdown],
      },
    },
  });

  return NextResponse.json({
    die1: effectResolution.die1,
    die2: effectResolution.die2,
    die3,
    total: effectResolution.rawRollTotal,
    finalMoveTotal: effectResolution.finalMoveTotal,
    movedBackwards: effectResolution.movedBackwards,
    breakdown: [...rollMode.breakdown, ...effectResolution.breakdown],
    state: updated,
    autoSkippedJail,
    landedSlot: slot ? {
      id: slot.id,
      slotNumber: slot.slotNumber,
      name: slot.name,
      playable: isPlayableSlot(slot),
      type: slot.type,
    } : null,
  });
}
