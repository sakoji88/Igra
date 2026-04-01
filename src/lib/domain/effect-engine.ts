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
  stage: EffectStage | 'pre_roll' | 'on_drop';
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

export type RollMode = 'NORMAL_2D6' | 'THREE_D6_KEEP_BEST_TWO' | 'REVERSE_2D6';

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

function countInventoryType(items: InventoryRuntimeItem[], type: InventoryRuntimeItem['itemDefinition']['type']) {
  return items.filter((item) => item.itemDefinition.type === type).length;
}

function getHighestTwo(values: number[]) {
  return [...values].sort((a, b) => b - a).slice(0, 2);
}

export function resolveRollMode(items: InventoryRuntimeItem[]) {
  const reverse = items.find((item) => item.itemDefinition.number === 58);
  if (reverse) {
    return {
      rollMode: 'REVERSE_2D6' as RollMode,
      consumedItemIds: [reverse.inventoryItemId],
      breakdown: [{
        stage: 'pre_roll' as const,
        inventoryItemId: reverse.inventoryItemId,
        itemNumber: 58,
        itemName: reverse.itemDefinition.name,
        effectId: 'soleless-reverse-roll',
        text: 'Кроссовки без подошвы превращают следующий ход в обратное движение на 2d6.',
      }],
    };
  }

  const triple = items.find((item) => item.itemDefinition.number === 42);
  if (triple) {
    return {
      rollMode: 'THREE_D6_KEEP_BEST_TWO' as RollMode,
      consumedItemIds: [triple.inventoryItemId],
      breakdown: [{
        stage: 'pre_roll' as const,
        inventoryItemId: triple.inventoryItemId,
        itemNumber: 42,
        itemName: triple.itemDefinition.name,
        effectId: 'holy-trinity-roll',
        text: 'Бог любит троицу: кидаем 3d6 и берём два лучших значения.',
      }],
    };
  }

  return { rollMode: 'NORMAL_2D6' as RollMode, consumedItemIds: [], breakdown: [] as EffectBreakdownEntry[] };
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
  die3?: number | null;
  playerRank?: number;
  totalPlayers?: number;
  coinFlip?: 'HEADS' | 'TAILS';
}) {
  const { items, playerRank = 1, totalPlayers = 1 } = params;
  let effectiveDie1 = params.die1;
  let effectiveDie2 = params.die2;
  const breakdown: EffectBreakdownEntry[] = [];
  const consumedItemIds: string[] = [];

  const huebik = items.find((item) => item.itemDefinition.number === 2);
  if (huebik) {
    if (effectiveDie1 >= effectiveDie2) effectiveDie1 = 1;
    else effectiveDie2 = 1;
    breakdown.push({ stage: 'after_roll', inventoryItemId: huebik.inventoryItemId, itemNumber: 2, itemName: huebik.itemDefinition.name, effectId: 'huebik-high-to-one', text: 'Кубик хуёбика превращает больший кубик в 1.' });
    consumedItemIds.push(huebik.inventoryItemId);
  }

  const shawarma = items.find((item) => item.itemDefinition.number === 14);
  if (shawarma) {
    const nextDie1 = Math.max(1, effectiveDie1 - 1);
    const nextDie2 = Math.max(1, effectiveDie2 - 1);
    const delta = nextDie1 + nextDie2 - (effectiveDie1 + effectiveDie2);
    effectiveDie1 = nextDie1;
    effectiveDie2 = nextDie2;
    breakdown.push({ stage: 'after_roll', inventoryItemId: shawarma.inventoryItemId, itemNumber: 14, itemName: shawarma.itemDefinition.name, effectId: 'shawarma-per-die-minus-one', text: 'Тухлая шаурма уменьшает каждый кубик на 1, но не ниже 1.', delta });
    consumedItemIds.push(shawarma.inventoryItemId);
  }

  let rawRollTotal = effectiveDie1 + effectiveDie2;
  let moveTotal = rawRollTotal;

  const unlucky = items.find((item) => item.itemDefinition.number === 40);
  if (unlucky) {
    const debuffBonus = countInventoryType(items, 'DEBUFF');
    moveTotal += debuffBonus;
    breakdown.push({ stage: 'before_move', inventoryItemId: unlucky.inventoryItemId, itemNumber: 40, itemName: unlucky.itemDefinition.name, effectId: 'lucky-loser-debuff-count', text: 'Удачный неудачник даёт бонус по числу дебаффов в инвентаре.', delta: debuffBonus });
    consumedItemIds.push(unlucky.inventoryItemId);
  }

  const helping = items.find((item) => item.itemDefinition.number === 39);
  if (helping && totalPlayers > 1) {
    const delta = Math.max(0, playerRank - 1);
    moveTotal += delta;
    breakdown.push({ stage: 'before_move', inventoryItemId: helping.inventoryItemId, itemNumber: 39, itemName: helping.itemDefinition.name, effectId: 'helping-underdog-rank-bonus', text: 'Помощь отстающему усиливает следующий бросок в зависимости от места в таблице.', delta });
  }

  const coin = items.find((item) => item.itemDefinition.number === 43);
  if (coin && params.coinFlip) {
    const delta = params.coinFlip === 'HEADS' ? 2 : -2;
    moveTotal += delta;
    breakdown.push({ stage: 'before_move', inventoryItemId: coin.inventoryItemId, itemNumber: 43, itemName: coin.itemDefinition.name, effectId: 'coinflip-roll-modifier', text: `Орел или решка даёт ${delta > 0 ? '+' : ''}${delta} к следующему броску.`, delta });
  }

  for (const staticTrap of items.filter((item) => item.itemDefinition.number === 51)) {
    moveTotal -= 1;
    breakdown.push({ stage: 'before_move', inventoryItemId: staticTrap.inventoryItemId, itemNumber: 51, itemName: staticTrap.itemDefinition.name, effectId: 'rake-minus-one', text: 'Грабли дают -1 к следующему броску.', delta: -1 });
    consumedItemIds.push(staticTrap.inventoryItemId);
  }

  for (const rat of items.filter((item) => item.itemDefinition.number === 54)) {
    moveTotal -= 3;
    breakdown.push({ stage: 'before_move', inventoryItemId: rat.inventoryItemId, itemNumber: 54, itemName: rat.itemDefinition.name, effectId: 'rat-minus-three', text: 'Крыса даёт -3 к следующему броску цели.', delta: -3 });
    consumedItemIds.push(rat.inventoryItemId);
  }

  const notebook = items.find((item) => item.itemDefinition.number === 25);
  if (notebook && effectiveDie1 === effectiveDie2 && !(effectiveDie1 === 6 && effectiveDie2 === 6)) {
    moveTotal += 2;
    breakdown.push({ stage: 'after_roll', inventoryItemId: notebook.inventoryItemId, itemNumber: 25, itemName: notebook.itemDefinition.name, effectId: 'notebook-double-bonus', text: 'Плюсовый блокнот даёт +2 к движению за дубль.', delta: 2 });
    consumedItemIds.push(notebook.inventoryItemId);
  }

  return {
    die1: effectiveDie1,
    die2: effectiveDie2,
    rawRollTotal,
    finalMoveTotal: Math.max(0, moveTotal),
    breakdown,
    consumedItemIds,
    grantsDoubleSixScoreBonus: Boolean(notebook && effectiveDie1 === 6 && effectiveDie2 === 6),
    movedBackwards: items.some((item) => item.itemDefinition.number === 58),
  };
}

export function resolveConditionSelectionEffects(items: InventoryRuntimeItem[]) {
  const breakdown: EffectBreakdownEntry[] = [];
  const consumedItemIds = new Set<string>();
  let lockedConditionType: 'BASE' | 'GENRE' | null = null;
  let scorePreviewOverride: 'BASE_POINTS_FOR_GENRE' | null = null;

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

  const uvy = items.find((item) => item.itemDefinition.number === 55);
  if (uvy) {
    scorePreviewOverride = 'BASE_POINTS_FOR_GENRE';
    breakdown.push({ stage: 'before_condition_select', inventoryItemId: uvy.inventoryItemId, itemNumber: 55, itemName: uvy.itemDefinition.name, effectId: 'uvy-genre-flatten', text: 'УВЫ убирает удвоение очков у следующего жанрового выбора.' });
    consumedItemIds.add(uvy.inventoryItemId);
  }

  return { lockedConditionType, scorePreviewOverride, breakdown, consumedItemIds: [...consumedItemIds] };
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

export function resolveActiveGameConsumptions(items: InventoryRuntimeItem[]) {
  const consumedItemIds = new Set<string>();

  for (const runtimeItem of items) {
    const config = getItemConfig(runtimeItem);
    if (!config) continue;
    for (const effect of getMatchingEffects(runtimeItem, 'while_game_active')) {
      if (effect.oneTime && effect.consumption !== 'manual') {
        consumedItemIds.add(runtimeItem.inventoryItemId);
      }
    }
  }

  return [...consumedItemIds];
}

export function resolveScoreEffects(params: { items: InventoryRuntimeItem[]; baseScore: number; lastDie1?: number | null; lastDie2?: number | null; passedStart?: boolean }) {
  const breakdown: EffectBreakdownEntry[] = [];
  const consumedItemIds = new Set<string>();
  let finalScore = params.baseScore;

  const notebook = params.items.find((item) => item.itemDefinition.number === 25);
  if (notebook && params.lastDie1 === 6 && params.lastDie2 === 6) {
    finalScore += 1;
    breakdown.push({ stage: 'on_score_calculation', inventoryItemId: notebook.inventoryItemId, itemNumber: 25, itemName: notebook.itemDefinition.name, effectId: 'notebook-double-six-score', text: 'Плюсовый блокнот даёт +1 очко за две шестёрки.', delta: 1 });
    consumedItemIds.add(notebook.inventoryItemId);
  }

  const lapBonus = params.items.find((item) => item.itemDefinition.number === 61);
  if (lapBonus && params.passedStart) {
    finalScore += 2;
    breakdown.push({ stage: 'on_score_calculation', inventoryItemId: lapBonus.inventoryItemId, itemNumber: 61, itemName: lapBonus.itemDefinition.name, effectId: 'ladno-rebyat-start-override', text: 'Ладно, ребят повышает бонус за пересечение старта до +5 суммарно.', delta: 2 });
  }

  const effects = params.items
    .flatMap((runtimeItem) =>
      getMatchingEffects(runtimeItem, 'on_score_calculation').map((effect) => ({ runtimeItem, effect, config: getItemConfig(runtimeItem)! })),
    )
    .sort((left, right) => right.effect.priority - left.effect.priority || left.config.number - right.config.number);

  for (const { runtimeItem, effect, config } of effects) {
    if (effect.effectType !== 'score_modifier') continue;
    const delta = Number(effect.value);
    finalScore += delta;
    breakdown.push({ stage: 'on_score_calculation', inventoryItemId: runtimeItem.inventoryItemId, itemNumber: config.number, itemName: config.name, effectId: effect.id, text: effect.applicationText, delta });
    if (effect.oneTime && effect.consumption === 'on_run_resolved') consumedItemIds.add(runtimeItem.inventoryItemId);
  }

  return { finalScore: Math.max(0, finalScore), breakdown, consumedItemIds: [...consumedItemIds] };
}

export function resolveDropEffects(params: { items: InventoryRuntimeItem[]; previousBoardPosition: number | null; jailSlotNumber: number; }) {
  const parachute = params.items.find((item) => item.itemDefinition.number === 21);
  if (parachute) {
    return {
      destination: 0,
      jailReason: null,
      consumedItemIds: [parachute.inventoryItemId],
      breakdown: [{ stage: 'on_drop' as const, inventoryItemId: parachute.inventoryItemId, itemNumber: 21, itemName: parachute.itemDefinition.name, effectId: 'parachute-drop-start', text: 'Дырявый парашют перебивает обычную тюрьму и отправляет игрока на Старт.' }],
    };
  }

  const toilet = params.items.find((item) => item.itemDefinition.number === 19);
  if (toilet && params.previousBoardPosition !== null) {
    return {
      destination: params.previousBoardPosition,
      jailReason: null,
      consumedItemIds: [toilet.inventoryItemId],
      breakdown: [{ stage: 'on_drop' as const, inventoryItemId: toilet.inventoryItemId, itemNumber: 19, itemName: toilet.itemDefinition.name, effectId: 'toilet-drop-redirect', text: 'Туалетка возвращает игрока на предыдущую клетку вместо тюрьмы.' }],
    };
  }

  return {
    destination: params.jailSlotNumber,
    jailReason: 'DROP',
    consumedItemIds: [],
    breakdown: [] as EffectBreakdownEntry[],
  };
}
