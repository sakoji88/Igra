import { prisma } from '@/lib/prisma';
import { getCurrentSeason } from '@/lib/server/auth';
import { getSideBasePoints } from '@/lib/server/board';
import { defaultWheel, defaultWheelEntries } from '../../../prisma/seed-data.ts';

export async function ensurePlayerSeasonState(userId: string) {
  const season = await getCurrentSeason();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return null;

  return prisma.playerSeasonState.upsert({
    where: { userId_seasonId: { userId, seasonId: season.id } },
    update: {},
    create: {
      userId,
      seasonId: season.id,
      boardPosition: 0,
      score: 0,
      availableWheelSpins: 3,
    },
  });
}

export async function ensureActiveWheelDefinition(): Promise<Awaited<ReturnType<typeof prisma.wheelDefinition.findFirst>> & { entries: Array<any> }> {
  const season = await getCurrentSeason();
  const existing = await prisma.wheelDefinition.findFirst({
    where: { seasonId: season.id, active: true },
    include: { entries: { where: { active: true }, include: { itemDefinition: true } } },
  });
  if (existing) return existing as Awaited<ReturnType<typeof ensureActiveWheelDefinition>>;

  const itemDefinitions = await prisma.itemDefinition.findMany();
  const itemByNumber = new Map(itemDefinitions.map((item) => [item.number, item.id]));
  const wheel = await prisma.wheelDefinition.create({
    data: {
      seasonId: season.id,
      name: defaultWheel.name,
      description: defaultWheel.description,
      imageUrl: defaultWheel.imageUrl,
      active: true,
      entries: {
        create: defaultWheelEntries.map((entry) => ({
          label: entry.label,
          description: entry.description,
          rewardType: entry.rewardType,
          itemDefinitionId: entry.rewardType === 'ITEM' && entry.itemNumber ? itemByNumber.get(entry.itemNumber) ?? null : null,
          rewardSpins: null,
          weight: entry.weight,
          imageUrl: entry.imageUrl,
          active: entry.active,
        })),
      },
    },
    include: { entries: { where: { active: true }, include: { itemDefinition: true } } },
  });

  await prisma.eventLog.create({
    data: {
      seasonId: season.id,
      type: 'SYSTEM',
      summary: `Автоматически создано активное колесо «${wheel.name}».`,
      payload: { wheelId: wheel.id, autoCreated: true },
    },
  });

  return wheel as Awaited<ReturnType<typeof ensureActiveWheelDefinition>>;
}

export async function getCurrentUserState(userId: string) {
  const season = await getCurrentSeason();
  await ensurePlayerSeasonState(userId);
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
    ensureActiveWheelDefinition(),
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
    ensurePlayerSeasonState(userId).then(() => prisma.playerSeasonState.findUnique({
      where: { userId_seasonId: { userId, seasonId: season.id } },
      include: {
        user: { include: { profile: true } },
        wheelSpins: { include: { wheelEntry: { include: { itemDefinition: true } } }, orderBy: { createdAt: 'desc' }, take: 8 },
      },
    })),
    ensureActiveWheelDefinition(),
    prisma.eventLog.findMany({ where: { seasonId: season.id, type: 'WHEEL', userId }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);

  return { season, state, wheel, logs };
}

export function getPotentialPoints(side: 'BOTTOM' | 'LEFT' | 'TOP' | 'RIGHT', conditionType: 'BASE' | 'GENRE') {
  const base = getSideBasePoints(side);
  return conditionType === 'GENRE' ? base * 2 : base;
}
