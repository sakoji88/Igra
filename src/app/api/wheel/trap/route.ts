export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { grantItemToState } from '@/lib/server/items';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const spinId = String(body?.spinId ?? '');
  const targetUserId = String(body?.targetUserId ?? '');
  if (!spinId || !targetUserId) return NextResponse.json({ error: 'Нужны spinId и targetUserId.' }, { status: 400 });

  const spin = await prisma.wheelSpin.findUnique({
    where: { id: spinId },
    include: {
      playerSeasonState: true,
      wheelEntry: { include: { itemDefinition: true } },
      season: true,
    },
  });

  if (!spin || spin.playerSeasonState.userId !== session.user.id) return NextResponse.json({ error: 'Спин не найден.' }, { status: 404 });
  if (!spin.wheelEntry.itemDefinition || spin.wheelEntry.itemDefinition.type !== 'TRAP') {
    return NextResponse.json({ error: 'Этот предмет не является ловушкой.' }, { status: 400 });
  }

  const targetState = await prisma.playerSeasonState.findUnique({ where: { userId_seasonId: { userId: targetUserId, seasonId: spin.seasonId } } });
  if (!targetState) return NextResponse.json({ error: 'Цель не найдена в текущем сезоне.' }, { status: 404 });

  const ownerTrap = await prisma.playerInventoryItem.findFirst({
    where: {
      playerSeasonStateId: spin.playerSeasonStateId,
      sourceReferenceId: spin.id,
      itemDefinitionId: spin.wheelEntry.itemDefinition.id,
    },
    include: { itemDefinition: true },
  });
  if (!ownerTrap) return NextResponse.json({ error: 'Ловушка уже передана или недоступна.' }, { status: 400 });

  await prisma.playerInventoryItem.delete({ where: { id: ownerTrap.id } });
  const outcome = await grantItemToState({
    playerSeasonStateId: targetState.id,
    itemDefinition: {
      id: ownerTrap.itemDefinition.id,
      name: ownerTrap.itemDefinition.name,
      type: ownerTrap.itemDefinition.type,
      conflictKey: ownerTrap.itemDefinition.conflictKey,
      chargesDefault: ownerTrap.itemDefinition.chargesDefault,
    },
    sourceType: 'TRAP_THROW',
    sourceReferenceId: spin.id,
    seasonId: spin.seasonId,
    userId: targetUserId,
  });

  await prisma.eventLog.create({
    data: {
      seasonId: spin.seasonId,
      userId: session.user.id,
      type: 'ITEM',
      summary: `${session.user.name} кинул ловушку «${ownerTrap.itemDefinition.name}» игроку ${targetUserId}.`,
      payload: { spinId: spin.id, targetUserId, outcome: outcome.outcome },
    },
  });

  return NextResponse.json({ ok: true, message: `Ловушка «${ownerTrap.itemDefinition.name}» передана выбранному игроку.` });
}
