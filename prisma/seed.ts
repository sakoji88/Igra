import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.ts';
import { createBoardSlotSeed } from '../src/lib/server/board.ts';
import { currentSeason, defaultItemDefinitions, defaultRules, seedAdmin } from './seed-data.ts';

async function main() {
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
      seasonStates: {
        create: { seasonId: season.id, boardPosition: 0, score: 0 },
      },
    },
  });

  await prisma.boardSlot.createMany({ data: createBoardSlotSeed(season.id) });
  await prisma.itemDefinition.createMany({ data: defaultItemDefinitions });
  await prisma.ruleSection.createMany({ data: defaultRules });
  await prisma.eventLog.create({
    data: {
      seasonId: season.id,
      userId: admin.id,
      type: 'SYSTEM',
      summary: 'База сезона и админ-аккаунт подготовлены.',
      payload: { admin: seedAdmin.nickname },
    },
  });

  console.log(`Seeded season ${season.name} and admin ${seedAdmin.nickname}/${seedAdmin.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
