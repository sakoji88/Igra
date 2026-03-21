import { prisma } from '@/lib/prisma';
import { pickWeightedValue } from '@/lib/domain/game';
import { grantItemToState } from '@/lib/server/items';

export async function spinWheelForState(playerSeasonStateId: string) {
  const state = await prisma.playerSeasonState.findUnique({
    where: { id: playerSeasonStateId },
    include: { user: true, season: true },
  });
  if (!state) throw new Error('Состояние игрока не найдено.');
  if (state.availableWheelSpins <= 0) throw new Error('Нет доступных спинов.');

  const wheel = await prisma.wheelDefinition.findFirst({
    where: { seasonId: state.seasonId, active: true },
    include: { entries: { where: { active: true }, include: { itemDefinition: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  if (!wheel || wheel.entries.length === 0) throw new Error('Активное колесо не настроено.');

  const selected = pickWeightedValue<typeof wheel.entries[number]>(wheel.entries);

  const spin = await prisma.$transaction(async (tx) => {
    const freshState = await tx.playerSeasonState.findUnique({ where: { id: state.id } });
    if (!freshState || freshState.availableWheelSpins <= 0) throw new Error('Спины закончились раньше, чем завершился запрос.');

    await tx.playerSeasonState.update({
      where: { id: state.id },
      data: { availableWheelSpins: { decrement: 1 } },
    });

    const createdSpin = await tx.wheelSpin.create({
      data: {
        seasonId: state.seasonId,
        playerSeasonStateId: state.id,
        wheelDefinitionId: wheel.id,
        wheelEntryId: selected.id,
      },
      include: { wheelEntry: { include: { itemDefinition: true } }, wheelDefinition: true },
    });

    return createdSpin;
  });

  let inventoryOutcome: Awaited<ReturnType<typeof grantItemToState>> | null = null;
  if (selected.rewardType === 'ITEM' && selected.itemDefinition) {
    inventoryOutcome = await grantItemToState({
      playerSeasonStateId: state.id,
      itemDefinition: selected.itemDefinition,
      sourceType: 'WHEEL',
      sourceReferenceId: spin.id,
      seasonId: state.seasonId,
      userId: state.userId,
    });
  }

  if (selected.rewardType === 'SPINS' && selected.rewardSpins) {
    await prisma.playerSeasonState.update({ where: { id: state.id }, data: { availableWheelSpins: { increment: selected.rewardSpins } } });
  }

  await prisma.eventLog.create({
    data: {
      seasonId: state.seasonId,
      userId: state.userId,
      type: 'WHEEL',
      summary: `${state.user.nickname} прокрутил колесо и получил сектор «${selected.label}».`,
      payload: {
        wheelId: wheel.id,
        wheelEntryId: selected.id,
        rewardType: selected.rewardType,
        rewardSpins: selected.rewardSpins ?? null,
        inventoryOutcome: inventoryOutcome?.outcome ?? null,
      },
    },
  });

  return {
    spinId: spin.id,
    wheel,
    entry: selected,
    inventoryOutcome,
  };
}

export async function grantThreeWheelSpins(params: {
  giverRunId: string;
  giverUserId: string;
  receiverUserId: string;
  seasonId: string;
}) {
  const { giverRunId, giverUserId, receiverUserId, seasonId } = params;
  if (giverUserId === receiverUserId) throw new Error('Нельзя дарить спины самому себе.');

  return prisma.$transaction(async (tx) => {
    const run = await tx.runAssignment.findUnique({ where: { id: giverRunId } });
    if (!run || run.userId !== giverUserId || run.seasonId !== seasonId || run.status !== 'COMPLETED') {
      throw new Error('Спины можно дарить только после завершённого собственного рана.');
    }
    if (run.wheelSpinsGrantedAt) throw new Error('По этому рану спины уже были выданы.');

    const giverState = await tx.playerSeasonState.findUnique({ where: { userId_seasonId: { userId: giverUserId, seasonId } }, include: { user: true } });
    const receiverState = await tx.playerSeasonState.findUnique({ where: { userId_seasonId: { userId: receiverUserId, seasonId } }, include: { user: true } });
    if (!giverState || !receiverState) throw new Error('Не удалось найти игроков сезона.');

    await tx.playerSeasonState.update({ where: { id: receiverState.id }, data: { availableWheelSpins: { increment: 3 } } });
    const grant = await tx.wheelSpinGrant.create({
      data: {
        seasonId,
        giverStateId: giverState.id,
        receiverStateId: receiverState.id,
        runAssignmentId: run.id,
        spinsGranted: 3,
      },
    });
    await tx.runAssignment.update({ where: { id: run.id }, data: { wheelSpinsGrantedAt: new Date() } });
    await tx.eventLog.create({
      data: {
        seasonId,
        userId: giverUserId,
        type: 'WHEEL',
        summary: `${giverState.user.nickname} подарил ${receiverState.user.nickname} три спина колеса за ран ${run.slotName}.`,
        payload: { runId: run.id, grantId: grant.id, receiverUserId, spinsGranted: 3 },
      },
    });
    return grant;
  });
}
