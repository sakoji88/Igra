export const currentSeason = { slug: 'spring-2026', name: 'Весенний мемомес 2026' };

export const users = [
  { id: 'admin-1', email: 'admin@igra.local', name: 'Главмем', role: 'ADMIN', password: 'admin123', avatarUrl: 'https://i.pravatar.cc/150?img=12', bio: 'Держит хаос в узде.' },
  { id: 'judge-1', email: 'judge@igra.local', name: 'Судья Жесть', role: 'JUDGE', password: 'judge123', avatarUrl: 'https://i.pravatar.cc/150?img=14', bio: 'Решает споры и банит клоунаду.' },
  { id: 'player-1', email: 'p1@igra.local', name: 'Крабовый Рыцарь', role: 'PLAYER', password: 'player123', avatarUrl: 'https://i.pravatar.cc/150?img=32', bio: 'Фармит очки и страдает.' },
  { id: 'player-2', email: 'p2@igra.local', name: 'Локальный Босс', role: 'PLAYER', password: 'player123', avatarUrl: 'https://i.pravatar.cc/150?img=48', bio: 'Любит genre run и аукционы.' },
  { id: 'player-3', email: 'p3@igra.local', name: 'Тильтовая Чайка', role: 'PLAYER', password: 'player123', avatarUrl: 'https://i.pravatar.cc/150?img=24', bio: 'Постоянно падает в тюрьму.' },
  { id: 'player-4', email: 'p4@igra.local', name: 'Дедлайн Самурай', role: 'PLAYER', password: 'player123', avatarUrl: 'https://i.pravatar.cc/150?img=61', bio: 'Выигрывает на последней секунде.' },
];

export const boardCells = [
  ['Старт', 'START', 0], ['Инди-лоток', 'REGULAR', 2], ['Подлянка', 'PODLYANKA', 0], ['JRPG сектор', 'REGULAR', 3],
  ['Колесо мемов', 'WHEEL', 0], ['Тюрьма', 'JAIL', -2], ['Лотерея', 'LOTTERY', 0], ['Хоррор-зона', 'REGULAR', 4],
  ['Кайфарик', 'KAIFARIK', 0], ['Аукцион', 'AUCTION', 0], ['Случайный ран', 'RANDOM', 3], ['Финишный угол', 'REGULAR', 5],
];

export const conditionTemplates = [
  { code: 'base-default', type: 'BASE', name: 'Стандартный забег', multiplier: 1 },
  { code: 'genre-rush', type: 'GENRE', name: 'Жанровый челлендж', multiplier: 1.5 },
];

export const itemDefinitions = [
  { code: 'energy_drink', name: 'Энергос', category: 'BUFF', conflictKey: 'focus', charges: 1, description: '+1 к следующему выигрышу' },
  { code: 'doom_scroll', name: 'Думскролл', category: 'DEBUFF', conflictKey: 'focus', charges: 1, description: '-1 к следующему выигрышу' },
  { code: 'banana_trap', name: 'Банановая мина', category: 'TRAP', conflictKey: null, charges: 1, description: 'Подложить другому игроку' },
  { code: 'joker_pass', name: 'Мем-талон', category: 'NEUTRAL', conflictKey: null, charges: 1, description: 'Ручной сейв от судьи' },
];

export const wheels = [
  { code: 'fun-wheel', name: 'Колесо угара', entries: [
    { label: 'Получить Энергос', weight: 2, action: 'GRANT_ITEM', value: 'energy_drink' },
    { label: 'Словить Думскролл', weight: 2, action: 'GRANT_ITEM', value: 'doom_scroll' },
    { label: 'Бесплатный реролл', weight: 1, action: 'BONUS_MOVE', value: 2 },
  ] },
  { code: 'buff-wheel', name: 'Колесо бустов', entries: [
    { label: 'Энергос', weight: 3, action: 'GRANT_ITEM', value: 'energy_drink' },
    { label: 'Мем-талон', weight: 1, action: 'GRANT_ITEM', value: 'joker_pass' },
  ] },
  { code: 'debuff-wheel', name: 'Колесо боли', entries: [
    { label: 'Думскролл', weight: 3, action: 'GRANT_ITEM', value: 'doom_scroll' },
    { label: 'Банановая мина', weight: 1, action: 'GRANT_ITEM', value: 'banana_trap' },
  ] },
];
