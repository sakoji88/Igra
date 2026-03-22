import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.ts';
import { createBoardSlotSeed } from '../src/lib/server/board.ts';
import { currentSeason, defaultItemDefinitions, defaultRules, defaultWheel, defaultWheelEntries, seedAdmin } from './seed-data.ts';

async function main() {
  await prisma.wheelSpin.deleteMany();
  await prisma.wheelSpinGrant.deleteMany();
  await prisma.wheelEntry.deleteMany();
  await prisma.wheelDefinition.deleteMany();
  await prisma.playerInventoryItem.deleteMany();
  await prisma.upcomingEvent.deleteMany();
  await prisma.runAssignment.deleteMany();
  await prisma.playerSeasonState.deleteMany();
  await prisma.boardSlot.deleteMany();
  await prisma.ruleSection.deleteMany();
  await prisma.itemDefinition.deleteMany();
  await prisma.eventLog.deleteMany();
  await prisma.playerProfile.deleteMany();
  await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
  await prisma.season.deleteMany();

  const season = await prisma.season.create({
    data: {
      slug: currentSeason.slug,
      name: currentSeason.name,
      isActive: true,
    },
  });

  const adminPasswordHash = await bcrypt.hash(seedAdmin.password, 10);
  const admin = await prisma.user.upsert({
    where: { nickname: seedAdmin.nickname },
    update: {
      passwordHash: adminPasswordHash,
      avatarUrl: seedAdmin.avatarUrl,
      role: seedAdmin.role,
    },
    create: {
      nickname: seedAdmin.nickname,
      passwordHash: adminPasswordHash,
      avatarUrl: seedAdmin.avatarUrl,
      role: seedAdmin.role,
      profile: {
        create: { displayName: seedAdmin.displayName, bio: 'Главный управляющий локального хаоса.' },
      },
    },
  });

  const adminState = await prisma.playerSeasonState.create({
    data: { seasonId: season.id, userId: admin.id, boardPosition: 0, score: 0, availableWheelSpins: 3 },
  });

  await prisma.boardSlot.createMany({ data: createBoardSlotSeed(season.id) });
  await prisma.itemDefinition.createMany({ data: defaultItemDefinitions });
  await prisma.ruleSection.createMany({ data: defaultRules });

  const itemDefinitions = await prisma.itemDefinition.findMany();
  const itemByNumber = new Map<number, string>();
  for (const item of itemDefinitions) {
    itemByNumber.set(item.number, item.id);
  }

  const wheel = await prisma.wheelDefinition.create({
    data: {
      seasonId: season.id,
      name: defaultWheel.name,
      description: defaultWheel.description,
      imageUrl: defaultWheel.imageUrl,
      active: defaultWheel.active,
    },
  });

  await prisma.wheelEntry.createMany({
    data: defaultWheelEntries.map((entry) => ({
      wheelDefinitionId: wheel.id,
      label: entry.label,
      description: entry.description,
      rewardType: entry.rewardType,
      itemDefinitionId: entry.rewardType === 'ITEM' ? itemByNumber.get(entry.itemNumber!) ?? null : null,
      rewardSpins: null,
      weight: entry.weight,
      imageUrl: entry.imageUrl,
      active: entry.active,
    })),
  });

  await prisma.playerInventoryItem.create({
    data: {
      playerSeasonStateId: adminState.id,
      itemDefinitionId: itemByNumber.get(7)!,
      chargesCurrent: 1,
      sourceType: 'SEED',
    },
  });

  await prisma.eventLog.create({
    data: {
      seasonId: season.id,
      userId: admin.id,
      type: 'SYSTEM',
      summary: 'База сезона, колесо и админ-аккаунт подготовлены.',
      payload: { admin: seedAdmin.nickname, wheel: defaultWheel.name },
    },
  });

  console.log(`Seeded season ${season.name}, admin ${seedAdmin.nickname}/${seedAdmin.password} and wheel ${wheel.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
