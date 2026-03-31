import { prisma } from '@/lib/prisma';
import type { InventoryRuntimeItem } from '@/lib/domain/effect-engine';
import { contentItemDefinitions } from '@/lib/content/game-content';

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

export async function consumeInventoryItems(inventoryItemIds: string[]) {
  if (inventoryItemIds.length === 0) return;
  const grouped = inventoryItemIds.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  for (const [id, consumeCount] of Object.entries(grouped)) {
    const item = await prisma.playerInventoryItem.findUnique({ where: { id } });
    if (!item) continue;
    const nextCharges = item.chargesCurrent - consumeCount;
    if (nextCharges > 0) {
      await prisma.playerInventoryItem.update({ where: { id }, data: { chargesCurrent: nextCharges } });
      continue;
    }
    await prisma.playerInventoryItem.delete({ where: { id } });
  }
}

export function mapInventoryItemsForEffects(
  inventoryItems: Array<{
    id: string;
    chargesCurrent: number;
    itemDefinition: { id: string; number: number; name: string; type: ItemType };
  }>,
): InventoryRuntimeItem[] {
  return inventoryItems.map((item) => ({
    inventoryItemId: item.id,
    chargesCurrent: item.chargesCurrent,
    itemDefinition: item.itemDefinition,
  }));
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

export function getItemStageLabel(stage: string) {
  if (stage === 'before_roll') return 'Перед броском';
  if (stage === 'after_roll') return 'После броска';
  if (stage === 'before_move') return 'Перед движением';
  if (stage === 'after_move') return 'После движения';
  if (stage === 'before_condition_select') return 'Перед выбором условий';
  if (stage === 'after_condition_select') return 'После выбора условий';
  if (stage === 'on_game_assigned') return 'При назначении игры';
  if (stage === 'while_game_active') return 'Пока игра активна';
  if (stage === 'on_score_calculation') return 'При подсчёте очков';
  return stage;
}

export function getContentItemMetadata(number: number) {
  return contentItemDefinitions.find((item) => item.number === number) ?? null;
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
