export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

  const updated = await prisma.runAssignment.update({
    where: { id: run.id },
    data: {
      gameTitle,
      gameUrl: gameUrl || null,
      playerComment: playerComment || null,
    },
  });

  await prisma.eventLog.create({
    data: {
      seasonId: run.seasonId,
      userId: run.userId,
      type: 'RUN',
      summary: `${session.user.name} зафиксировал активную игру «${gameTitle}».`,
      payload: { runId: run.id, gameTitle, gameUrl: gameUrl || null },
    },
  });

  return NextResponse.json({ run: updated });
}
