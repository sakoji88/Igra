import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEffects, calculateScore, moveOnBoard, pickWeightedValue, roll2d6, transitionAssignment } from '../src/lib/domain/game.ts';
import { resolveActiveGameEffects, resolveConditionSelectionEffects, resolveDropEffects, resolveRollEffects, resolveRollMode, resolveScoreEffects } from '../src/lib/domain/effect-engine.ts';

const runtimeItems = [
  { inventoryItemId: 'i14', chargesCurrent: 2, itemDefinition: { id: '14', number: 14, name: 'Тухлая шаурма', type: 'TRAP' as const } },
  { inventoryItemId: 'i16', chargesCurrent: 1, itemDefinition: { id: '16', number: 16, name: 'Чокер боли', type: 'TRAP' as const } },
  { inventoryItemId: 'i4', chargesCurrent: 2, itemDefinition: { id: '4', number: 4, name: 'Повязка Рэмбо', type: 'DEBUFF' as const } },
];

test('roll and move around board', () => {
  const rolled = roll2d6([3, 4]);
  assert.equal(rolled.total, 7);
  const moved = moveOnBoard(37, rolled.total, 40);
  assert.equal(moved.nextPosition, 4);
  assert.equal(moved.passedStart, true);
});

test('conflicting effects annihilate each other', () => {
  const effects = applyEffects([{ code: 'focus+', category: 'BUFF', conflictKey: 'focus' }], { code: 'focus-', category: 'DEBUFF', conflictKey: 'focus' });
  assert.equal(effects.length, 0);
});

test('debuff priority blocks buff', () => {
  const effects = applyEffects([{ code: 'tilt-', category: 'DEBUFF', conflictKey: 'tilt' }], { code: 'focus+', category: 'BUFF', conflictKey: 'focus' });
  assert.equal(effects.length, 1);
  assert.equal(effects[0].category, 'DEBUFF');
});

test('no stacking keeps single effect', () => {
  const effects = applyEffects([{ code: 'eyes+', category: 'BUFF', conflictKey: 'eyes' }], { code: 'eyes+', category: 'BUFF', conflictKey: 'eyes' });
  assert.equal(effects.length, 1);
});

test('assignment transitions follow judge/admin restrictions', () => {
  assert.equal(transitionAssignment('ACTIVE', 'WON', 'PLAYER'), true);
  assert.equal(transitionAssignment('ACTIVE', 'DISPUTED', 'PLAYER'), false);
  assert.equal(transitionAssignment('DISPUTED', 'RESOLVED', 'ADMIN'), true);
});

test('score update logic supports genre and lap bonus', () => {
  assert.equal(calculateScore(2, 'BASE', false), 2);
  assert.equal(calculateScore(3, 'GENRE', true), 9);
});

test('weighted wheel selection is server-deterministic for a provided random value', () => {
  const entries = [{ value: 'A', weight: 1 }, { value: 'B', weight: 3 }, { value: 'C', weight: 1 }];
  const selected = pickWeightedValue(entries, 0.5);
  assert.equal(selected.value, 'B');
});

test('effect engine resolves roll modifiers deterministically', () => {
  const result = resolveRollEffects({ items: runtimeItems, die1: 2, die2: 3 });
  assert.equal(result.die1, 1);
  assert.equal(result.die2, 2);
  assert.equal(result.rawRollTotal, 3);
  assert.equal(result.finalMoveTotal, 3);
  assert.deepEqual(result.consumedItemIds, ['i14']);
});

test('effect engine enforces genre-only condition locks', () => {
  const result = resolveConditionSelectionEffects(runtimeItems);
  assert.equal(result.lockedConditionType, 'GENRE');
  assert.deepEqual(result.consumedItemIds, ['i16']);
});

test('effect engine exposes active-game notes for manual items', () => {
  const result = resolveActiveGameEffects(runtimeItems);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.itemName, 'Повязка Рэмбо');
});


test('effect engine applies huebik and notebook rules deterministically', () => {
  const result = resolveRollEffects({
    items: [
      { inventoryItemId: 'i2', chargesCurrent: 1, itemDefinition: { id: '2', number: 2, name: 'Кубик хуёбика', type: 'DEBUFF' as const } },
      { inventoryItemId: 'i25', chargesCurrent: 1, itemDefinition: { id: '25', number: 25, name: 'Плюсовый блокнот', type: 'BUFF' as const } },
    ],
    die1: 6,
    die2: 6,
  });
  assert.equal(result.die1, 1);
  assert.equal(result.die2, 6);
  assert.equal(result.finalMoveTotal, 7);
});

test('effect engine selects special roll modes', () => {
  assert.equal(resolveRollMode([{ inventoryItemId: 'i42', chargesCurrent: 1, itemDefinition: { id: '42', number: 42, name: 'Бог любит троицу', type: 'BUFF' as const } }]).rollMode, 'THREE_D6_KEEP_BEST_TWO');
  assert.equal(resolveRollMode([{ inventoryItemId: 'i58', chargesCurrent: 1, itemDefinition: { id: '58', number: 58, name: 'Кроссовки без подошвы', type: 'DEBUFF' as const } }]).rollMode, 'REVERSE_2D6');
});

test('effect engine handles genre flatten and double-six score bonus', () => {
  const condition = resolveConditionSelectionEffects([{ inventoryItemId: 'i55', chargesCurrent: 1, itemDefinition: { id: '55', number: 55, name: 'УВЫ', type: 'DEBUFF' as const } }]);
  assert.equal(condition.scorePreviewOverride, 'BASE_POINTS_FOR_GENRE');

  const score = resolveScoreEffects({
    items: [{ inventoryItemId: 'i25', chargesCurrent: 1, itemDefinition: { id: '25', number: 25, name: 'Плюсовый блокнот', type: 'BUFF' as const } }],
    baseScore: 4,
    lastDie1: 6,
    lastDie2: 6,
  });
  assert.equal(score.finalScore, 5);
});

test('effect engine resolves drop redirects', () => {
  const toilet = resolveDropEffects({
    items: [{ inventoryItemId: 'i19', chargesCurrent: 1, itemDefinition: { id: '19', number: 19, name: 'Туалетка', type: 'BUFF' as const } }],
    previousBoardPosition: 12,
    jailSlotNumber: 10,
  });
  assert.equal(toilet.destination, 12);
  assert.equal(toilet.jailReason, null);

  const parachute = resolveDropEffects({
    items: [{ inventoryItemId: 'i21', chargesCurrent: 1, itemDefinition: { id: '21', number: 21, name: 'Дырявый парашют', type: 'DEBUFF' as const } }],
    previousBoardPosition: 12,
    jailSlotNumber: 10,
  });
  assert.equal(parachute.destination, 0);
  assert.equal(parachute.jailReason, null);
});
