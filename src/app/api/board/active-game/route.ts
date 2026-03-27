export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { resolveActiveGameConsumptions } from '@/lib/domain/effect-engine';
import { consumeInventoryItems, mapInventoryItemsForEffects } from '@/lib/server/items';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const runId = String(body.runId ?? '');
  const gameTitle = String(body.gameTitle ?? '').trim();
  const gameUrl = String(body.gameUrl ?? '').trim();
  const playerComment = String(body.playerComment ?? '').trim();

  if (!gameTitle) return NextResponse.json({ error: 'Нужно указать назначенную игру.' }, { status: 400 });

  const run = await prisma.runAssignment.findUnique({ where: { id: runId } });
  if (!run || run.userId !== session.user.id) return NextResponse.json({ error: 'Активная игра не найдена.' }, { status: 404 });
  if (run.status !== 'ACTIVE') return NextResponse.json({ error: 'Эта запись уже не является активной игрой.' }, { status: 400 });
  const actor = await prisma.user.findUnique({ where: { id: run.userId }, select: { nickname: true } });

  const updated = await prisma.runAssignment.update({
    where: { id: run.id },
    data: {
      gameTitle,
      gameUrl: gameUrl || null,
      playerComment: playerComment || null,
    },
  });

  const state = await prisma.playerSeasonState.findUnique({
    where: { userId_seasonId: { userId: run.userId, seasonId: run.seasonId } },
    include: { inventoryItems: { include: { itemDefinition: true }, orderBy: { obtainedAt: 'asc' } } },
  });
  if (state) {
    const consumedItems = resolveActiveGameConsumptions(mapInventoryItemsForEffects(state.inventoryItems));
    await consumeInventoryItems(consumedItems);
  }

  await prisma.eventLog.create({
    data: {
      seasonId: run.seasonId,
      userId: run.userId,
      type: 'RUN',
      summary: `${actor?.nickname ?? 'Игрок'} зафиксировал активную игру «${gameTitle}».`,
      payload: { runId: run.id, gameTitle, gameUrl: gameUrl || null },
    },
  });

  return NextResponse.json({ run: updated });
}
