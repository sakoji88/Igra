export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentSeason } from '@/lib/server/auth';
import { getSideBasePoints, isPlayableSlot } from '@/lib/server/board';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const slotId = String(body.slotId ?? '');
  const conditionType = body.conditionType === 'GENRE' ? 'GENRE' : 'BASE';
  const season = await getCurrentSeason();

  const activeRun = await prisma.runAssignment.findFirst({
    where: { userId: session.user.id, seasonId: season.id, status: 'ACTIVE' },
  });
  if (activeRun) return NextResponse.json({ error: 'У тебя уже есть активный ран.' }, { status: 400 });

  const slot = await prisma.boardSlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.seasonId !== season.id || !isPlayableSlot(slot)) {
    return NextResponse.json({ error: 'Слот недоступен для обычного рана.' }, { status: 400 });
  }

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

  await prisma.eventLog.create({
    data: {
      seasonId: season.id,
      userId: session.user.id,
      type: 'RUN',
      summary: `${session.user.name} выбрал ${conditionType === 'BASE' ? 'base' : 'genre'} условия для слота ${slot.slotNumber}.`,
      payload: { slotId: slot.id, conditionType, expectedPoints },
    },
  });

  return NextResponse.json({ run });
}
