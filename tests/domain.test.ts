import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEffects, calculateScore, moveOnBoard, pickWeightedValue, roll2d6, transitionAssignment } from '../src/lib/domain/game.ts';
import { resolveActiveGameEffects, resolveConditionSelectionEffects, resolveRollEffects } from '../src/lib/domain/effect-engine.ts';

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
  assert.equal(result.rawRollTotal, 5);
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
