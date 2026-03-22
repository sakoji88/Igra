import { getContentItemDefinitionByNumber, type ContentItemDefinition, type EffectStage, type ItemEffectConfig } from '../content/game-content.ts';

export type InventoryRuntimeItem = {
  inventoryItemId: string;
  chargesCurrent: number;
  itemDefinition: {
    id: string;
    number: number;
    name: string;
    type: 'BUFF' | 'DEBUFF' | 'TRAP' | 'NEUTRAL';
  };
};

export type EffectBreakdownEntry = {
  stage: EffectStage;
  inventoryItemId: string;
  itemNumber: number;
  itemName: string;
  effectId: string;
  text: string;
  delta?: number;
  lockTo?: 'BASE' | 'GENRE';
};

export type ActiveEffectPreview = {
  inventoryItemId: string;
  itemNumber: number;
  itemName: string;
  stage: EffectStage;
  effectType: string;
  text: string;
};

function getItemConfig(runtimeItem: InventoryRuntimeItem): ContentItemDefinition | null {
  return getContentItemDefinitionByNumber(runtimeItem.itemDefinition.number);
}

function getMatchingEffects(runtimeItem: InventoryRuntimeItem, stage: EffectStage) {
  const itemConfig = getItemConfig(runtimeItem);
  if (!itemConfig) return [] as ItemEffectConfig[];
  return itemConfig.mechanics.filter((effect) => effect.triggerStage === stage);
}

function effectCanApply(effect: ItemEffectConfig, rawRollTotal: number) {
  if (effect.effectType === 'conditional_move_modifier' && effect.conditions?.maxRawRoll !== undefined) {
    return rawRollTotal <= effect.conditions.maxRawRoll;
  }
  return true;
}

export function getActiveEffectsPreview(items: InventoryRuntimeItem[]) {
  return items
    .flatMap((runtimeItem) => {
      const config = getItemConfig(runtimeItem);
      if (!config) return [] as ActiveEffectPreview[];
      return config.mechanics.map((effect) => ({
        inventoryItemId: runtimeItem.inventoryItemId,
        itemNumber: config.number,
        itemName: config.name,
        stage: effect.triggerStage,
        effectType: effect.effectType,
        text: effect.applicationText,
      }));
    })
    .sort((left, right) => left.itemNumber - right.itemNumber);
}

export function resolveRollEffects(params: {
  items: InventoryRuntimeItem[];
  die1: number;
  die2: number;
}) {
  const { items, die1, die2 } = params;
  const rawRollTotal = die1 + die2;
  let moveTotal = rawRollTotal;
  const breakdown: EffectBreakdownEntry[] = [];
  const consumedItemIds = new Set<string>();

  const stages: EffectStage[] = ['before_roll', 'after_roll', 'before_move', 'after_move'];
  for (const stage of stages) {
    const stageEffects = items
      .flatMap((runtimeItem) =>
        getMatchingEffects(runtimeItem, stage).map((effect) => ({ runtimeItem, effect, config: getItemConfig(runtimeItem)! })),
      )
      .sort((left, right) => right.effect.priority - left.effect.priority || left.config.number - right.config.number);

    for (const { runtimeItem, effect, config } of stageEffects) {
      if (!effectCanApply(effect, rawRollTotal)) continue;
      if (effect.effectType !== 'move_modifier' && effect.effectType !== 'conditional_move_modifier') continue;
      const delta = Number(effect.value);
      moveTotal += delta;
      breakdown.push({
        stage,
        inventoryItemId: runtimeItem.inventoryItemId,
        itemNumber: config.number,
        itemName: config.name,
        effectId: effect.id,
        text: effect.applicationText,
        delta,
      });
      if (effect.oneTime && effect.consumption === 'on_trigger') consumedItemIds.add(runtimeItem.inventoryItemId);
    }
  }

  return {
    rawRollTotal,
    finalMoveTotal: Math.max(0, moveTotal),
    breakdown,
    consumedItemIds: [...consumedItemIds],
  };
}

export function resolveConditionSelectionEffects(items: InventoryRuntimeItem[]) {
  const breakdown: EffectBreakdownEntry[] = [];
  const consumedItemIds = new Set<string>();
  let lockedConditionType: 'BASE' | 'GENRE' | null = null;

  const effects = items
    .flatMap((runtimeItem) =>
      getMatchingEffects(runtimeItem, 'before_condition_select').map((effect) => ({ runtimeItem, effect, config: getItemConfig(runtimeItem)! })),
    )
    .sort((left, right) => right.effect.priority - left.effect.priority || left.config.number - right.config.number);

  for (const { runtimeItem, effect, config } of effects) {
    if (effect.effectType !== 'condition_lock') continue;
    lockedConditionType = String(effect.value) === 'GENRE' ? 'GENRE' : 'BASE';
    breakdown.push({
      stage: 'before_condition_select',
      inventoryItemId: runtimeItem.inventoryItemId,
      itemNumber: config.number,
      itemName: config.name,
      effectId: effect.id,
      text: effect.applicationText,
      lockTo: lockedConditionType,
    });
    if (effect.oneTime && effect.consumption === 'on_assignment_created') consumedItemIds.add(runtimeItem.inventoryItemId);
  }

  return { lockedConditionType, breakdown, consumedItemIds: [...consumedItemIds] };
}

export function resolveActiveGameEffects(items: InventoryRuntimeItem[]) {
  return items
    .flatMap((runtimeItem) =>
      getMatchingEffects(runtimeItem, 'while_game_active').map((effect) => ({ runtimeItem, effect, config: getItemConfig(runtimeItem)! })),
    )
    .filter(({ effect }) => effect.effectType === 'active_game_note')
    .sort((left, right) => right.effect.priority - left.effect.priority || left.config.number - right.config.number)
    .map(({ runtimeItem, effect, config }) => ({
      inventoryItemId: runtimeItem.inventoryItemId,
      itemNumber: config.number,
      itemName: config.name,
      text: effect.applicationText,
    }));
}

export function resolveScoreEffects(params: { items: InventoryRuntimeItem[]; baseScore: number }) {
  const breakdown: EffectBreakdownEntry[] = [];
  const consumedItemIds = new Set<string>();
  let finalScore = params.baseScore;

  const effects = params.items
    .flatMap((runtimeItem) =>
      getMatchingEffects(runtimeItem, 'on_score_calculation').map((effect) => ({ runtimeItem, effect, config: getItemConfig(runtimeItem)! })),
    )
    .sort((left, right) => right.effect.priority - left.effect.priority || left.config.number - right.config.number);

  for (const { runtimeItem, effect, config } of effects) {
    if (effect.effectType !== 'score_modifier') continue;
    const delta = Number(effect.value);
    finalScore += delta;
    breakdown.push({
      stage: 'on_score_calculation',
      inventoryItemId: runtimeItem.inventoryItemId,
      itemNumber: config.number,
      itemName: config.name,
      effectId: effect.id,
      text: effect.applicationText,
      delta,
    });
    if (effect.oneTime && effect.consumption === 'on_run_resolved') consumedItemIds.add(runtimeItem.inventoryItemId);
  }

  return { finalScore: Math.max(0, finalScore), breakdown, consumedItemIds: [...consumedItemIds] };
}
