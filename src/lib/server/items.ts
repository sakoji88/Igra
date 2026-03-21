import { prisma } from '@/lib/prisma';

type ItemType = 'BUFF' | 'DEBUFF' | 'TRAP' | 'NEUTRAL';
type ItemDefinitionLike = {
  id: string;
  name: string;
  type: ItemType;
  conflictKey: string | null;
  chargesDefault: number;
};

export async function grantItemToState(params: {
  playerSeasonStateId: string;
  itemDefinition: ItemDefinitionLike;
  sourceType: string;
  sourceReferenceId?: string | null;
  seasonId: string;
  userId: string;
}) {
  const { playerSeasonStateId, itemDefinition, sourceType, sourceReferenceId, seasonId, userId } = params;

  const existing = itemDefinition.conflictKey
    ? await prisma.playerInventoryItem.findFirst({
        where: {
          playerSeasonStateId,
          itemDefinition: {
            conflictKey: itemDefinition.conflictKey,
            type: itemDefinition.type === 'BUFF' ? 'DEBUFF' : itemDefinition.type === 'DEBUFF' ? 'BUFF' : undefined,
          },
        },
        include: { itemDefinition: true },
      })
    : null;

  if (existing && (itemDefinition.type === 'BUFF' || itemDefinition.type === 'DEBUFF')) {
    await prisma.playerInventoryItem.delete({ where: { id: existing.id } });
    await prisma.eventLog.create({
      data: {
        seasonId,
        userId,
        type: 'ITEM',
        summary: `Предмет ${itemDefinition.name} аннигилировал с ${existing.itemDefinition.name}.`,
        payload: { playerSeasonStateId, conflictKey: itemDefinition.conflictKey, removedInventoryId: existing.id },
      },
    });

    return {
      outcome: 'annihilated' as const,
      removed: existing.itemDefinition,
      added: null,
    };
  }

  const created = await prisma.playerInventoryItem.create({
    data: {
      playerSeasonStateId,
      itemDefinitionId: itemDefinition.id,
      chargesCurrent: itemDefinition.chargesDefault,
      sourceType,
      sourceReferenceId: sourceReferenceId ?? null,
    },
    include: { itemDefinition: true },
  });

  await prisma.eventLog.create({
    data: {
      seasonId,
      userId,
      type: 'ITEM',
      summary: `Игрок получил предмет ${itemDefinition.name}.`,
      payload: { playerSeasonStateId, itemDefinitionId: itemDefinition.id, sourceType },
    },
  });

  return {
    outcome: 'added' as const,
    removed: null,
    added: created,
  };
}

export function getItemTypeBadgeClasses(type: ItemType) {
  if (type === 'BUFF') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100';
  if (type === 'DEBUFF') return 'border-red-400/40 bg-red-500/10 text-red-100';
  if (type === 'TRAP') return 'border-amber-400/40 bg-amber-500/10 text-amber-100';
  return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100';
}

export function getItemTypeLabel(type: ItemType) {
  if (type === 'BUFF') return 'Бафф';
  if (type === 'DEBUFF') return 'Дебафф';
  if (type === 'TRAP') return 'Ловушка';
  return 'Нейтрал';
}

export function getTargetLabel(value: string) {
  if (value === 'self') return 'Себе';
  if (value === 'other') return 'Другому игроку';
  if (value === 'self,other') return 'Себе или другому';
  return value;
}

export function normalizeStringList(value: string) {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function serializeStringList(value: string[]) {
  return value.join('\n');
}
