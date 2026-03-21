import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect('/login');

  return session;
}

export async function requireRole(roles: Array<'ADMIN' | 'JUDGE' | 'PLAYER'>) {
  const session = await requireSession();
  if (!roles.includes(session.user.role as 'ADMIN' | 'JUDGE' | 'PLAYER')) redirect('/');
  return session;
}

export async function getCurrentSeason() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) throw new Error('Active season not found');
  return season;
}

