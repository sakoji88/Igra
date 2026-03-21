export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { slotUpdateSchema } from '@/lib/validation/forms';

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = slotUpdateSchema.parse(await request.json());
  const slot = await prisma.boardSlot.update({
    where: { id: parsed.slotId },
    data: {
      slotNumber: parsed.slotNumber,
      name: parsed.name,
      type: parsed.type,
      side: parsed.side,
      imageUrl: parsed.imageUrl,
      imageFallback: parsed.imageFallback,
      baseConditions: parsed.baseConditions,
      genreConditions: parsed.genreConditions,
      description: parsed.description,
      isPlayable: parsed.isPlayable,
      isPublished: parsed.isPublished,
    },
  });

  await prisma.eventLog.create({
    data: {
      seasonId: slot.seasonId,
      userId: session.user.id,
      type: 'ADMIN',
      summary: `Админ обновил слот ${slot.slotNumber}: ${slot.name}.`,
      payload: { slotId: slot.id },
    },
  });

  return NextResponse.json({ slot });
}
