import { boardCells, conditionTemplates, currentSeason, itemDefinitions, users, wheels } from '../../../prisma/seed-data';

export type Role = 'ADMIN' | 'JUDGE' | 'PLAYER';
export type AssignmentStatus = 'PENDING' | 'ACTIVE' | 'WON' | 'DROPPED' | 'DISPUTED' | 'RESOLVED';
export type ConditionType = 'BASE' | 'GENRE';

export const season = { ...currentSeason, id: 'season-1' };

export const players = users.filter((user) => user.role === 'PLAYER').map((user, index) => ({
  id: user.id,
  userId: user.id,
  displayName: user.name,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  score: 8 + index * 3,
  boardPosition: index * 2,
  turnOrder: index + 1,
  isActivePlayer: index === 0,
  drops: index,
  completedRuns: 2 + index,
  inventory: index % 2 === 0 ? ['energy_drink'] : ['doom_scroll'],
  activeEffects: index % 2 === 0 ? ['energy_drink'] : ['doom_scroll'],
  activeAssignment: index === 0 ? {
    id: 'assign-live',
    title: 'Turbo Chicken Horse',
    status: 'ACTIVE' as AssignmentStatus,
    conditionType: 'BASE' as ConditionType,
    pointsAwarded: 0,
  } : null,
}));

export const board = boardCells.map(([label, type, points], index) => ({ id: `cell-${index}`, index, label, type, points }));
export const conditions = conditionTemplates;
export const items = itemDefinitions;
export const wheelDefinitions = wheels;

export const eventLog = [
  { id: 'ev-1', summary: 'Крабовый Рыцарь бросил 8 и дошёл до «Колесо мемов».', type: 'TURN', actorId: 'player-1', createdAt: '2026-03-20T17:10:00Z' },
  { id: 'ev-2', summary: 'Судья Жесть перевёл ран в спорный статус.', type: 'ADMIN', actorId: 'judge-1', targetId: 'player-2', createdAt: '2026-03-20T17:16:00Z' },
  { id: 'ev-3', summary: 'Дедлайн Самурай выиграл жанровый ран и получил 9 очков.', type: 'ASSIGNMENT', actorId: 'player-4', createdAt: '2026-03-20T17:40:00Z' },
];

export const assignments = [
  { id: 'assign-live', userId: 'player-1', title: 'Turbo Chicken Horse', conditionType: 'BASE' as ConditionType, status: 'ACTIVE' as AssignmentStatus, pointsAwarded: 0 },
  { id: 'assign-2', userId: 'player-2', title: 'Slay the Spire', conditionType: 'GENRE' as ConditionType, status: 'DISPUTED' as AssignmentStatus, pointsAwarded: 6 },
  { id: 'assign-3', userId: 'player-4', title: 'Brotato', conditionType: 'GENRE' as ConditionType, status: 'WON' as AssignmentStatus, pointsAwarded: 9 },
];
