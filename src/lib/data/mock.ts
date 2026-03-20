import { boardCells, conditionTemplates, currentSeason, itemDefinitions, users, wheels } from '../../../prisma/seed-data';

export type Role = 'ADMIN' | 'JUDGE' | 'PLAYER';
export type AssignmentStatus = 'PENDING' | 'ACTIVE' | 'WON' | 'DROPPED' | 'DISPUTED' | 'RESOLVED';
export type ConditionType = 'BASE' | 'GENRE';
export type BoardSlotSide = 'bottom' | 'left' | 'top' | 'right';

function getBoardSide(index: number): BoardSlotSide {
  if (index >= 0 && index <= 10) return 'bottom';
  if (index >= 11 && index <= 20) return 'left';
  if (index >= 21 && index <= 30) return 'top';
  return 'right';
}

function getSideBasePoints(side: BoardSlotSide) {
  if (side === 'bottom') return 1;
  if (side === 'left') return 2;
  if (side === 'top') return 3;
  return 4;
}

function getSlotArt(type: string) {
  if (type === 'START') return '🏁';
  if (type === 'JAIL') return '🚓';
  if (type === 'LOTTERY') return '🎰';
  if (type === 'AUCTION') return '🔨';
  if (type === 'WHEEL') return '🎡';
  if (type === 'PODLYANKA') return '😈';
  if (type === 'KAIFARIK') return '✨';
  if (type === 'RANDOM') return '🎲';
  return '🎮';
}

function getBaseConditions(label: string, side: BoardSlotSide, type: string) {
  const sideLabel = side === 'bottom' ? 'нижней' : side === 'left' ? 'левой' : side === 'top' ? 'верхней' : 'правой';
  const conditions = [
    `Закрыть слот «${label}» по основным условиям ${sideLabel} стороны.`,
    'Подтвердить результат стандартной кнопкой Win или Drop.',
  ];

  if (type === 'WHEEL') conditions.push('После приземления прокрутить wheel и принять результат.');
  if (type === 'JAIL') conditions.push('Сначала разрулить тюремный эффект, затем вернуться в обычный цикл.');
  if (type === 'LOTTERY' || type === 'AUCTION') conditions.push('Согласовать ручной спец-ивент с судьёй или админом.');
  if (type === 'PODLYANKA' || type === 'KAIFARIK') conditions.push('Применить эффект клетки перед созданием нового рана.');

  return conditions;
}

function getGenreConditions(label: string, type: string) {
  const conditions = [
    `Выбрать жанровое условие для слота «${label}».`,
    'Закрыть слот в рамках выбранного жанрового ограничения.',
  ];

  if (type === 'REGULAR') conditions.push('Сделать жанровый проход без отката на базовые требования.');
  if (type === 'RANDOM') conditions.push('Жанр определяется после разрешения случайного события клетки.');
  if (type === 'WHEEL') conditions.push('Жанровый слот можно брать только после результата колеса.');

  return conditions;
}

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

export const board = boardCells.map(([label, type], index) => {
  const side = getBoardSide(index);
  const basePoints = getSideBasePoints(side);

  return {
    id: `cell-${index}`,
    index,
    slotNumber: index,
    name: String(label),
    label: String(label),
    type: String(type),
    side,
    points: basePoints,
    imageUrl: null,
    imageFallback: getSlotArt(String(type)),
    description: `Слот ${index} на ${side} стороне поля.`,
    baseConditions: getBaseConditions(String(label), side, String(type)),
    genreConditions: getGenreConditions(String(label), String(type)),
  };
});
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
