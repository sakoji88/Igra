import { prisma } from '@/lib/prisma';
import { getCurrentSeason } from '@/lib/server/auth';
import { getSideBasePoints } from '@/lib/server/board';

export async function getCurrentUserState(userId: string) {
  const season = await getCurrentSeason();
  return prisma.playerSeasonState.findUnique({
    where: { userId_seasonId: { userId, seasonId: season.id } },
    include: {
      user: { include: { profile: true, inventory: { include: { itemDefinition: true } }, upcoming: true, runs: { orderBy: { assignedAt: 'desc' } } } },
      season: true,
    },
  });
}

export async function getBoardViewData() {
  const season = await getCurrentSeason();
  const [slots, states, logs] = await Promise.all([
    prisma.boardSlot.findMany({ where: { seasonId: season.id }, orderBy: { slotNumber: 'asc' } }),
    prisma.playerSeasonState.findMany({ where: { seasonId: season.id }, include: { user: { include: { profile: true } } } }),
    prisma.eventLog.findMany({ where: { seasonId: season.id }, orderBy: { createdAt: 'desc' }, take: 12 }),
  ]);

  return {
    season,
    slots,
    states,
    logs,
  };
}

export async function getPlayersList() {
  const season = await getCurrentSeason();
  return prisma.playerSeasonState.findMany({
    where: { seasonId: season.id, user: { role: 'PLAYER' } },
    include: { user: { include: { profile: true, runs: { orderBy: { assignedAt: 'desc' }, take: 1 } } } },
    orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
  });
}

export async function getProfileByUserId(userId: string) {
  const season = await getCurrentSeason();
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      inventory: { include: { itemDefinition: true } },
      upcoming: { orderBy: { createdAt: 'desc' } },
      runs: { where: { seasonId: season.id }, orderBy: { assignedAt: 'desc' } },
      seasonStates: { where: { seasonId: season.id } },
    },
  });
}

export async function getDashboardData() {
  const season = await getCurrentSeason();
  const [states, logs] = await Promise.all([
    prisma.playerSeasonState.findMany({ where: { seasonId: season.id, user: { role: 'PLAYER' } }, include: { user: { include: { profile: true } } }, orderBy: { score: 'desc' } }),
    prisma.eventLog.findMany({ where: { seasonId: season.id }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);
  return { season, states, logs };
}

export async function getAdminData() {
  const season = await getCurrentSeason();
  const [players, items, rules, logs] = await Promise.all([
    prisma.playerSeasonState.findMany({ where: { seasonId: season.id }, include: { user: { include: { profile: true, inventory: { include: { itemDefinition: true } } } } }, orderBy: { score: 'desc' } }),
    prisma.itemDefinition.findMany({ orderBy: { number: 'asc' } }),
    prisma.ruleSection.findMany({ orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }] }),
    prisma.eventLog.findMany({ where: { seasonId: season.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);

  return { season, players, items, rules, logs };
}

export function getPotentialPoints(side: 'BOTTOM' | 'LEFT' | 'TOP' | 'RIGHT', conditionType: 'BASE' | 'GENRE') {
  const base = getSideBasePoints(side);
  return conditionType === 'GENRE' ? base * 2 : base;
}
