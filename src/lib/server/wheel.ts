import { prisma } from '@/lib/prisma';
import { pickWeightedValue } from '@/lib/domain/game';
import { ensureActiveWheelDefinition } from '@/lib/server/data';
import { grantItemToState } from '@/lib/server/items';

export type WheelPool = 'PRIKOLY' | 'BUFFS' | 'DEBUFFS' | 'BREDIK';

function getPoolEntries(
  wheel: Awaited<ReturnType<typeof ensureActiveWheelDefinition>>,
  pool: WheelPool,
) {
  const linked = wheel.entries.filter((entry) => entry.itemDefinition);

  if (pool === 'PRIKOLY') {
    return linked.filter((entry) => (entry.itemDefinition?.number ?? 0) <= 56);
  }
  if (pool === 'BUFFS') {
    return linked.filter((entry) => (entry.itemDefinition?.number ?? 0) <= 56 && entry.itemDefinition?.type === 'BUFF');
  }
  if (pool === 'DEBUFFS') {
    return linked.filter((entry) => (entry.itemDefinition?.number ?? 0) <= 56 && (entry.itemDefinition?.type === 'DEBUFF' || entry.itemDefinition?.type === 'TRAP'));
  }
  return linked.filter((entry) => (entry.itemDefinition?.number ?? 0) >= 57);
}

export async function spinWheelForState(playerSeasonStateId: string, pool: WheelPool = 'PRIKOLY') {
  const state = await prisma.playerSeasonState.findUnique({
    where: { id: playerSeasonStateId },
    include: { user: true, season: true },
  });
  if (!state) throw new Error('Состояние игрока не найдено.');
  if (pool === 'PRIKOLY' && state.availableWheelSpins <= 0) throw new Error('Нет доступных круток приколов.');

  const wheel = await ensureActiveWheelDefinition();
  if (!wheel || wheel.entries.length === 0) throw new Error('Активное колесо не настроено.');

  const poolEntries = getPoolEntries(wheel, pool);
  if (poolEntries.length === 0) throw new Error('Для выбранного раздела пока нет доступных пунктов.');

  const selected = pickWeightedValue<typeof poolEntries[number]>(poolEntries);

  const spin = await prisma.$transaction(async (tx) => {
    const freshState = await tx.playerSeasonState.findUnique({ where: { id: state.id } });
    if (!freshState) throw new Error('Состояние игрока пропало во время запроса.');
    if (pool === 'PRIKOLY' && freshState.availableWheelSpins <= 0) throw new Error('Крутки закончились раньше, чем завершился запрос.');

    if (pool === 'PRIKOLY') {
      await tx.playerSeasonState.update({
        where: { id: state.id },
        data: { availableWheelSpins: { decrement: 1 } },
      });
    }

    return tx.wheelSpin.create({
      data: {
        seasonId: state.seasonId,
        playerSeasonStateId: state.id,
        wheelDefinitionId: wheel.id,
        wheelEntryId: selected.id,
      },
      include: { wheelEntry: { include: { itemDefinition: true } }, wheelDefinition: true },
    });
  });

  const inventoryOutcome = await grantItemToState({
    playerSeasonStateId: state.id,
    itemDefinition: selected.itemDefinition!,
    sourceType: pool,
    sourceReferenceId: spin.id,
    seasonId: state.seasonId,
    userId: state.userId,
  });

  await prisma.eventLog.create({
    data: {
      seasonId: state.seasonId,
      userId: state.userId,
      type: 'WHEEL',
      summary: `${state.user.nickname} получил пункт «${selected.label}» из раздела ${pool}.`,
      payload: {
        pool,
        wheelId: wheel.id,
        wheelEntryId: selected.id,
        itemDefinitionId: selected.itemDefinition?.id ?? null,
        inventoryOutcome: inventoryOutcome?.outcome ?? null,
      },
    },
  });

  return {
    spinId: spin.id,
    wheel,
    entry: selected,
    inventoryOutcome,
    pool,
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

    const nextSpins = Math.min(6, receiverState.availableWheelSpins + 3);
    if (nextSpins === receiverState.availableWheelSpins) throw new Error('У получателя уже максимум круток.');

    await tx.playerSeasonState.update({ where: { id: receiverState.id }, data: { availableWheelSpins: nextSpins } });
    const grant = await tx.wheelSpinGrant.create({
      data: {
        seasonId,
        giverStateId: giverState.id,
        receiverStateId: receiverState.id,
        runAssignmentId: run.id,
        spinsGranted: nextSpins - receiverState.availableWheelSpins,
      },
    });
    await tx.runAssignment.update({ where: { id: run.id }, data: { wheelSpinsGrantedAt: new Date() } });
    await tx.eventLog.create({
      data: {
        seasonId,
        userId: giverUserId,
        type: 'WHEEL',
        summary: `${giverState.user.nickname} подарил ${receiverState.user.nickname} крутки колеса за ран ${run.slotName}.`,
        payload: { runId: run.id, grantId: grant.id, receiverUserId, spinsGranted: grant.spinsGranted, cappedAtSix: true },
      },
    });
    return grant;
  });
}
