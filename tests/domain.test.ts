import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEffects, calculateScore, moveOnBoard, pickWeightedValue, roll2d6, transitionAssignment } from '../src/lib/domain/game.ts';
import { resolveConditionSelectionEffects, resolveRollEffects, resolveScoreEffects } from '../src/lib/domain/effect-engine.ts';

const runtimeItems = [
  { inventoryItemId: 'i1', chargesCurrent: 1, itemDefinition: { id: '1', number: 1, name: 'Лёгкие глаза', type: 'BUFF' as const } },
  { inventoryItemId: 'i2', chargesCurrent: 1, itemDefinition: { id: '2', number: 2, name: 'Проклятие слепой повязки', type: 'DEBUFF' as const } },
  { inventoryItemId: 'i6', chargesCurrent: 1, itemDefinition: { id: '6', number: 6, name: 'Токсичный спойлер', type: 'TRAP' as const } },
  { inventoryItemId: 'i7', chargesCurrent: 1, itemDefinition: { id: '7', number: 7, name: 'Чистый реролл вайба', type: 'NEUTRAL' as const } },
  { inventoryItemId: 'i3', chargesCurrent: 1, itemDefinition: { id: '3', number: 3, name: 'Чилловый плейлист', type: 'BUFF' as const } },
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
  assert.equal(result.rawRollTotal, 5);
  assert.equal(result.finalMoveTotal, 7);
  assert.deepEqual(result.consumedItemIds.sort(), ['i1', 'i2', 'i7'].sort());
});

test('effect engine enforces condition locks', () => {
  const result = resolveConditionSelectionEffects(runtimeItems);
  assert.equal(result.lockedConditionType, 'BASE');
  assert.deepEqual(result.consumedItemIds, ['i6']);
});

test('effect engine applies active-game score modifiers', () => {
  const result = resolveScoreEffects({ items: runtimeItems, baseScore: 4 });
  assert.equal(result.finalScore, 5);
  assert.deepEqual(result.consumedItemIds, ['i3']);
});
