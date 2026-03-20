export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { moveOnBoard } from '@/lib/domain/game';
import { getCurrentSeason } from '@/lib/server/auth';
import { isPlayableSlot } from '@/lib/server/board';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const season = await getCurrentSeason();
  const state = await prisma.playerSeasonState.findUnique({
    where: { userId_seasonId: { userId: session.user.id, seasonId: season.id } },
  });

  if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;
  const boardSize = await prisma.boardSlot.count({ where: { seasonId: season.id } });
  const moved = moveOnBoard(state.boardPosition, total, boardSize);
  const slot = await prisma.boardSlot.findUnique({ where: { seasonId_slotNumber: { seasonId: season.id, slotNumber: moved.nextPosition } } });

  const updated = await prisma.playerSeasonState.update({
    where: { id: state.id },
    data: {
      boardPosition: moved.nextPosition,
      lastDie1: die1,
      lastDie2: die2,
      lastRollTotal: total,
    },
  });

  await prisma.eventLog.createMany({
    data: [
      {
        seasonId: season.id,
        userId: session.user.id,
        type: 'TURN',
        summary: `${session.user.name} бросил кубы: ${die1} + ${die2} = ${total}.`,
        payload: { die1, die2, total },
      },
      {
        seasonId: season.id,
        userId: session.user.id,
        type: 'TURN',
        summary: `${session.user.name} переместился на слот ${moved.nextPosition}${slot ? ` — ${slot.name}` : ''}.`,
        payload: { from: state.boardPosition, to: moved.nextPosition, passedStart: moved.passedStart },
      },
    ],
  });

  return NextResponse.json({
    die1,
    die2,
    total,
    state: updated,
    landedSlot: slot ? {
      id: slot.id,
      slotNumber: slot.slotNumber,
      name: slot.name,
      playable: isPlayableSlot(slot),
    } : null,
  });
}
