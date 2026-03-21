import { prisma } from '@/lib/prisma';
import { getCurrentSeason } from '@/lib/server/auth';
import { getSideBasePoints } from '@/lib/server/board';

export async function getCurrentUserState(userId: string) {
  const season = await getCurrentSeason();
  return prisma.playerSeasonState.findUnique({
    where: { userId_seasonId: { userId, seasonId: season.id } },
    include: {
      user: {
        include: {
          profile: true,
          upcoming: true,
          runs: { where: { seasonId: season.id }, orderBy: { assignedAt: 'desc' } },
        },
      },
      season: true,
      inventoryItems: { include: { itemDefinition: true }, orderBy: { obtainedAt: 'desc' } },
      wheelSpins: { include: { wheelEntry: true }, orderBy: { createdAt: 'desc' }, take: 12 },
      receivedSpinGrants: { include: { giverState: { include: { user: true } } }, orderBy: { createdAt: 'desc' }, take: 6 },
    },
  });
}

export async function getBoardViewData() {
  const season = await getCurrentSeason();
  const [slots, states, logs] = await Promise.all([
    prisma.boardSlot.findMany({ where: { seasonId: season.id, isPublished: true }, orderBy: { slotNumber: 'asc' } }),
    prisma.playerSeasonState.findMany({ where: { seasonId: season.id }, include: { user: { include: { profile: true } } } }),
    prisma.eventLog.findMany({ where: { seasonId: season.id }, orderBy: { createdAt: 'desc' }, take: 12 }),
  ]);

  return { season, slots, states, logs };
}

export async function getPlayersList() {
  const season = await getCurrentSeason();
  return prisma.playerSeasonState.findMany({
    where: { seasonId: season.id, user: { role: 'PLAYER' } },
    include: {
      user: { include: { profile: true, runs: { where: { seasonId: season.id }, orderBy: { assignedAt: 'desc' }, take: 1 } } },
      inventoryItems: { include: { itemDefinition: true }, take: 3, orderBy: { obtainedAt: 'desc' } },
    },
    orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
  });
}

export async function getProfileByUserId(userId: string) {
  const season = await getCurrentSeason();
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      upcoming: { orderBy: { createdAt: 'desc' } },
      runs: { where: { seasonId: season.id }, orderBy: { assignedAt: 'desc' } },
      seasonStates: {
        where: { seasonId: season.id },
        include: {
          inventoryItems: { include: { itemDefinition: true }, orderBy: { obtainedAt: 'desc' } },
          wheelSpins: { include: { wheelEntry: { include: { itemDefinition: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
          receivedSpinGrants: { include: { giverState: { include: { user: true } } }, orderBy: { createdAt: 'desc' }, take: 6 },
        },
      },
    },
  });
}

export async function getDashboardData() {
  const season = await getCurrentSeason();
  const [states, logs, wheel] = await Promise.all([
    prisma.playerSeasonState.findMany({ where: { seasonId: season.id, user: { role: 'PLAYER' } }, include: { user: { include: { profile: true } } }, orderBy: { score: 'desc' } }),
    prisma.eventLog.findMany({ where: { seasonId: season.id }, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.wheelDefinition.findFirst({ where: { seasonId: season.id, active: true }, include: { entries: { where: { active: true } } } }),
  ]);
  return { season, states, logs, wheel };
}

export async function getAdminData() {
  const season = await getCurrentSeason();
  const [players, items, rules, logs, slots, wheels] = await Promise.all([
    prisma.playerSeasonState.findMany({
      where: { seasonId: season.id },
      include: {
        user: { include: { profile: true } },
        inventoryItems: { include: { itemDefinition: true }, orderBy: { obtainedAt: 'desc' } },
        wheelSpins: { include: { wheelEntry: true }, orderBy: { createdAt: 'desc' }, take: 6 },
      },
      orderBy: { score: 'desc' },
    }),
    prisma.itemDefinition.findMany({ orderBy: { number: 'asc' } }),
    prisma.ruleSection.findMany({ orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }] }),
    prisma.eventLog.findMany({ where: { seasonId: season.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.boardSlot.findMany({ where: { seasonId: season.id }, orderBy: { slotNumber: 'asc' } }),
    prisma.wheelDefinition.findMany({ where: { seasonId: season.id }, include: { entries: { include: { itemDefinition: true }, orderBy: { createdAt: 'asc' } } }, orderBy: { updatedAt: 'desc' } }),
  ]);

  return { season, players, items, rules, logs, slots, wheels };
}

export async function getItemsCatalog() {
  return prisma.itemDefinition.findMany({ orderBy: { number: 'asc' } });
}

export async function getWheelPageData(userId: string) {
  const season = await getCurrentSeason();
  const [state, wheel, logs] = await Promise.all([
    prisma.playerSeasonState.findUnique({
      where: { userId_seasonId: { userId, seasonId: season.id } },
      include: {
        user: { include: { profile: true } },
        wheelSpins: { include: { wheelEntry: { include: { itemDefinition: true } } }, orderBy: { createdAt: 'desc' }, take: 8 },
      },
    }),
    prisma.wheelDefinition.findFirst({ where: { seasonId: season.id, active: true }, include: { entries: { where: { active: true }, include: { itemDefinition: true } } } }),
    prisma.eventLog.findMany({ where: { seasonId: season.id, type: 'WHEEL', userId }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);

  return { season, state, wheel, logs };
}

export function getPotentialPoints(side: 'BOTTOM' | 'LEFT' | 'TOP' | 'RIGHT', conditionType: 'BASE' | 'GENRE') {
  const base = getSideBasePoints(side);
  return conditionType === 'GENRE' ? base * 2 : base;
}
