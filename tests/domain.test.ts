import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEffects, calculateScore, moveOnBoard, roll2d6, transitionAssignment } from '../src/lib/domain/game.ts';

test('roll and move around board', () => {
  const roll = roll2d6([4, 3]);
  const moved = moveOnBoard(9, roll.total, 12);
  assert.equal(roll.total, 7);
  assert.equal(moved.nextPosition, 4);
  assert.equal(moved.passedStart, true);
});

test('conflicting effects annihilate each other', () => {
  const state = applyEffects([{ code: 'energy', category: 'BUFF', conflictKey: 'focus' }], { code: 'doom', category: 'DEBUFF', conflictKey: 'focus' });
  assert.deepEqual(state, []);
});

test('debuff priority blocks buff', () => {
  const state = applyEffects([{ code: 'doom', category: 'DEBUFF', conflictKey: 'focus' }], { code: 'energy', category: 'BUFF', conflictKey: 'focus' });
  assert.deepEqual(state, []);
});

test('no stacking keeps single effect', () => {
  const state = applyEffects([{ code: 'energy', category: 'BUFF', conflictKey: 'focus' }], { code: 'energy', category: 'BUFF', conflictKey: 'focus' });
  assert.equal(state.length, 1);
});

test('assignment transitions follow judge/admin restrictions', () => {
  assert.equal(transitionAssignment('ACTIVE', 'WON', 'PLAYER'), true);
  assert.equal(transitionAssignment('ACTIVE', 'DISPUTED', 'PLAYER'), false);
  assert.equal(transitionAssignment('ACTIVE', 'DISPUTED', 'JUDGE'), true);
  assert.equal(transitionAssignment('DISPUTED', 'RESOLVED', 'ADMIN'), true);
});

test('score update logic supports genre and lap bonus', () => {
  assert.equal(calculateScore(4, 'BASE', false), 4);
  assert.equal(calculateScore(4, 'GENRE', false), 8);
  assert.equal(calculateScore(4, 'GENRE', true), 11);
});
