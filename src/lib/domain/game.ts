export type EffectCategory = 'BUFF' | 'DEBUFF' | 'TRAP' | 'NEUTRAL';
export type Effect = { code: string; category: EffectCategory; conflictKey?: string | null };
export type TransitionStatus = 'PENDING' | 'ACTIVE' | 'WON' | 'DROPPED' | 'DISPUTED' | 'RESOLVED';

export function roll2d6(sequence: [number, number] = [1, 1]) {
  const [die1, die2] = sequence;
  return { die1, die2, total: die1 + die2 };
}

export function moveOnBoard(position: number, roll: number, boardSize: number) {
  const nextPosition = (position + roll) % boardSize;
  const passedStart = position + roll >= boardSize;
  return { nextPosition, passedStart };
}

export function applyEffects(existing: Effect[], incoming: Effect) {
  const sameCode = existing.find((effect) => effect.code === incoming.code);
  if (sameCode) return existing;

  if (incoming.conflictKey) {
    const conflictIndex = existing.findIndex((effect) => effect.conflictKey === incoming.conflictKey && effect.category !== incoming.category);
    if (conflictIndex >= 0) {
      return existing.filter((_, index) => index !== conflictIndex);
    }
  }

  if (incoming.category === 'BUFF' && existing.some((effect) => effect.category === 'DEBUFF')) return existing;
  if (incoming.category === 'DEBUFF') {
    return [...existing.filter((effect) => effect.category !== 'BUFF'), incoming];
  }

  return [...existing, incoming];
}

export function calculateScore(basePoints: number, conditionType: 'BASE' | 'GENRE', didPassStart = false) {
  const multiplier = conditionType === 'GENRE' ? 2 : 1;
  return Math.round(basePoints * multiplier + (didPassStart ? 3 : 0));
}

export function transitionAssignment(current: TransitionStatus, next: TransitionStatus, actorRole: 'ADMIN' | 'JUDGE' | 'PLAYER') {
  const allowed: Record<TransitionStatus, TransitionStatus[]> = {
    PENDING: ['ACTIVE'],
    ACTIVE: ['WON', 'DROPPED', 'DISPUTED'],
    WON: ['RESOLVED'],
    DROPPED: ['RESOLVED', 'DISPUTED'],
    DISPUTED: ['RESOLVED'],
    RESOLVED: [],
  };

  if (!allowed[current].includes(next)) return false;
  if (next === 'DISPUTED' || next === 'RESOLVED') return actorRole !== 'PLAYER';
  return true;
}

export function pickWeightedValue<T extends { weight: number }>(entries: T[], randomValue = Math.random()) {
  const total = entries.reduce((sum, entry) => sum + Math.max(entry.weight, 0), 0);
  let cursor = randomValue * total;
  for (const entry of entries) {
    cursor -= Math.max(entry.weight, 0);
    if (cursor <= 0) return entry;
  }
  return entries[entries.length - 1];
}
