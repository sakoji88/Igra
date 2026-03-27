export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentSeason } from '@/lib/server/auth';
import { getSideBasePoints, isChaosWheelSlot, isQuestionSlot } from '@/lib/server/board';
import { runUpdateSchema } from '@/lib/validation/forms';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const season = await getCurrentSeason();
  const activeRun = await prisma.runAssignment.findFirst({ where: { userId: session.user.id, seasonId: season.id, status: 'ACTIVE' } });
  if (activeRun) return NextResponse.json({ error: 'Сначала заверши текущую активную игру.' }, { status: 400 });

  const body = await request.json();
  const slotId = String(body.slotId ?? '');
  const parsed = runUpdateSchema.safeParse({
    gameTitle: body.gameTitle,
    gameUrl: body.gameUrl,
    playerComment: body.playerComment,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Проверь форму игры.' }, { status: 400 });

  const [slot, state] = await Promise.all([
    prisma.boardSlot.findUnique({ where: { id: slotId } }),
    prisma.playerSeasonState.findUnique({ where: { userId_seasonId: { userId: session.user.id, seasonId: season.id } } }),
  ]);
  const actor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { nickname: true } });

  if (!slot || slot.seasonId !== season.id) return NextResponse.json({ error: 'Слот не найден.' }, { status: 404 });
  if (!state || state.boardPosition !== slot.slotNumber) {
    return NextResponse.json({ error: 'Спец-ран можно создать только на текущей позиции игрока.' }, { status: 400 });
  }

  const isAuction = slot.type === 'AUCTION' && slot.slotNumber === 20;
  const isLottery = slot.type === 'LOTTERY';
  const isQuestion = isQuestionSlot(slot.slotNumber);
  const isJail = slot.type === 'JAIL';

  if (!isAuction && !isLottery && !isQuestion && !isChaosWheelSlot(slot.slotNumber) && !isJail) {
    return NextResponse.json({ error: 'Этот слот не использует спец-ран.' }, { status: 400 });
  }

  const expectedPoints = isJail ? 0 : (isAuction || isLottery ? 3 : getSideBasePoints(slot.side));
  const run = await prisma.runAssignment.create({
    data: {
      userId: session.user.id,
      seasonId: season.id,
      slotId: slot.id,
      slotNumber: slot.slotNumber,
      slotName: slot.name,
      side: slot.side,
      conditionType: 'BASE',
      expectedPoints,
      gameTitle: parsed.data.gameTitle,
      gameUrl: parsed.data.gameUrl || null,
      playerComment: parsed.data.playerComment || null,
    },
  });

  await prisma.eventLog.create({
    data: {
      seasonId: season.id,
      userId: session.user.id,
      type: 'RUN',
      summary: `${actor?.nickname ?? 'Игрок'} создал спец-ран на слоте ${slot.slotNumber}: ${slot.name}.`,
      payload: { runId: run.id, slotId: slot.id, expectedPoints, type: isJail ? 'JAIL' : isAuction ? 'AUCTION' : isLottery ? 'LOTTERY' : isQuestion ? 'QUESTION' : 'CHAOS_WHEEL' },
    },
  });

  return NextResponse.json({ run });
}
