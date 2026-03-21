export type EffectStage =
  | 'before_roll'
  | 'after_roll'
  | 'before_move'
  | 'after_move'
  | 'before_condition_select'
  | 'after_condition_select'
  | 'on_game_assigned'
  | 'while_game_active'
  | 'on_score_calculation';

export type EffectType =
  | 'move_modifier'
  | 'conditional_move_modifier'
  | 'score_modifier'
  | 'condition_lock'
  | 'active_game_note';

export type ItemEffectConfig = {
  id: string;
  triggerStage: EffectStage;
  effectType: EffectType;
  value: number | string;
  priority: number;
  stackable: boolean;
  oneTime: boolean;
  consumption: 'on_trigger' | 'on_assignment_created' | 'on_run_resolved' | 'manual';
  applicationText: string;
  conditions?: { maxRawRoll?: number };
};

export type ContentItemDefinition = {
  id: string;
  number: number;
  name: string;
  type: 'BUFF' | 'DEBUFF' | 'TRAP' | 'NEUTRAL';
  description: string;
  shortLabel: string;
  imageUrl: string;
  chargesDefault: number;
  allowedTargets: string;
  conflictKey: string | null;
  active: boolean;
  manualReview: boolean;
  rawTextSource: string;
  mechanics: ItemEffectConfig[];
};

export type RuleSectionContent = {
  slug: string;
  title: string;
  order: number;
  published: boolean;
  manualReview: boolean;
  rawTextSource: string;
  content: string;
};

export const coreRuleSections: RuleSectionContent[] = [
  {
    slug: 'core-turn-flow',
    title: 'Поток хода игрока',
    order: 1,
    published: true,
    manualReview: true,
    rawTextSource: 'docs/rules-and-items.md',
    content: 'Игрок ходит только если у него нет активной игры. Ход начинается с броска двух d6, затем сервер применяет все автоматические эффекты предметов, рассчитывает итоговое перемещение, двигает фишку и только после этого разрешает клетку. На игровой клетке игрок выбирает тип условий и сразу фиксирует активную игру для профиля.',
  },
  {
    slug: 'active-game-lock',
    title: 'Активная игра блокирует новый бросок',
    order: 2,
    published: true,
    manualReview: true,
    rawTextSource: 'docs/rules-and-items.md',
    content: 'Пока активная игра не завершена, не дропнута и не очищена судьёй или админом, новый бросок запрещён и в интерфейсе, и на сервере. Профиль и поле обязаны показывать, какая именно игра сейчас блокирует следующий ход.',
  },
  {
    slug: 'conditions-and-assignment',
    title: 'Условия и назначение игры',
    order: 3,
    published: true,
    manualReview: true,
    rawTextSource: 'docs/rules-and-items.md',
    content: 'После перемещения игрок сначала читает последствия клетки, затем выбирает Base или Genre условия, если клетка это допускает. Сразу после выбора открывается следующий шаг: ссылка на настройки GameGauntlets и форма, в которой игрок фиксирует назначенную игру. Эта запись становится активной игрой сезона.',
  },
  {
    slug: 'items-and-effects',
    title: 'Предметы и автоматические эффекты',
    order: 4,
    published: true,
    manualReview: true,
    rawTextSource: 'docs/rules-and-items.md',
    content: 'Предметы обрабатываются по стадиям: before_roll, after_roll, before_move, after_move, before_condition_select, after_condition_select, on_game_assigned, while_game_active и on_score_calculation. Эффекты применяются в детерминированном порядке по приоритету, показываются в разборе хода и могут автоматически тратиться, если так описано в их конфиге.',
  },
  {
    slug: 'wheel-and-inventory',
    title: 'Колесо, инвентарь и конфликты',
    order: 5,
    published: true,
    manualReview: true,
    rawTextSource: 'docs/rules-and-items.md',
    content: 'Колесо определяется сервером, а клиент только анимирует уже выбранный сектор. Награды попадают в инвентарь игрока или аннигилируются при конфликте по conflictKey. Завершённый ран один раз позволяет подарить другому игроку три спина колеса.',
  },
  {
    slug: 'score-resolution',
    title: 'Подсчёт очков',
    order: 6,
    published: true,
    manualReview: true,
    rawTextSource: 'docs/rules-and-items.md',
    content: 'Очки всегда считаются на сервере. Базовая стоимость стороны поля умножается на 2 для Genre-условий, а затем к результату применяются эффекты предметов стадии on_score_calculation. Если ход замкнул круг, бонус за проход через старт тоже считается сервером.',
  },
];

export const glossaryEntries = [
  { term: 'Активная игра', description: 'Текущая назначенная игра игрока. Пока она активна, новый бросок запрещён.', manualReview: true },
  { term: 'Base', description: 'Базовые условия клетки. Обычно дают базовую стоимость стороны поля.', manualReview: true },
  { term: 'Genre', description: 'Жанровые условия клетки. Обычно дают x2 к базовой стоимости стороны поля.', manualReview: true },
  { term: 'Разбор хода', description: 'Человеко-читаемый список: исходный бросок, активные предметы, модификаторы и итоговое перемещение.', manualReview: true },
  { term: 'Эффект стадии', description: 'Правило предмета, которое срабатывает в конкретный момент пайплайна хода или активной игры.', manualReview: true },
] as const;

export const specialMechanics = [
  { id: 'effect-pipeline', title: 'Пайплайн эффектов', description: 'Система последовательно обрабатывает активные предметы по стадиям и логирует все изменения в понятном виде.', manualReview: true },
  { id: 'condition-lock', title: 'Блокировка типа условий', description: 'Некоторые эффекты могут ограничить следующий выбор условий только Base или только Genre. Ограничение применяется сервером и показывается на поле.', manualReview: true },
  { id: 'active-game-score-effects', title: 'Эффекты активной игры', description: 'Часть предметов живёт до завершения активной игры и меняет финальный подсчёт очков или описание активного задания.', manualReview: true },
] as const;

export const contentItemDefinitions: ContentItemDefinition[] = [
  {
    id: 'easy-eyes', number: 1, name: 'Лёгкие глаза', type: 'BUFF', description: 'Следующий ход ощущается комфортнее: итоговое перемещение игрока увеличивается на 1.', shortLabel: '+1 ход', imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=400&q=80', chargesDefault: 1, allowedTargets: 'self', conflictKey: 'eyes', active: true, manualReview: true, rawTextSource: 'docs/rules-and-items.md', mechanics: [{ id: 'easy-eyes-move', triggerStage: 'after_roll', effectType: 'move_modifier', value: 1, priority: 80, stackable: false, oneTime: true, consumption: 'on_trigger', applicationText: 'Лёгкие глаза добавляют +1 к итоговому перемещению.' }],
  },
  {
    id: 'blindfold-curse', number: 2, name: 'Проклятие слепой повязки', type: 'DEBUFF', description: 'Следующий ход становится тяжелее: итоговое перемещение игрока уменьшается на 1.', shortLabel: '-1 ход', imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', chargesDefault: 1, allowedTargets: 'self,other', conflictKey: 'eyes', active: true, manualReview: true, rawTextSource: 'docs/rules-and-items.md', mechanics: [{ id: 'blindfold-curse-move', triggerStage: 'after_roll', effectType: 'move_modifier', value: -1, priority: 85, stackable: false, oneTime: true, consumption: 'on_trigger', applicationText: 'Проклятие слепой повязки отнимает 1 клетку от итогового перемещения.' }],
  },
  {
    id: 'chill-playlist', number: 3, name: 'Чилловый плейлист', type: 'BUFF', description: 'Помогает держать темп до конца активной игры: после победы игрок получает +1 очко сверху.', shortLabel: '+1 очко', imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80', chargesDefault: 1, allowedTargets: 'self', conflictKey: 'focus', active: true, manualReview: true, rawTextSource: 'docs/rules-and-items.md', mechanics: [{ id: 'chill-playlist-active-tag', triggerStage: 'while_game_active', effectType: 'active_game_note', value: 'Чилловый плейлист помогает не тильтовать и обещает +1 очко за победу.', priority: 40, stackable: false, oneTime: false, consumption: 'on_run_resolved', applicationText: 'Чилловый плейлист активен до завершения текущей игры.' }, { id: 'chill-playlist-score', triggerStage: 'on_score_calculation', effectType: 'score_modifier', value: 1, priority: 70, stackable: false, oneTime: true, consumption: 'on_run_resolved', applicationText: 'Чилловый плейлист добавляет +1 очко к награде за активную игру.' }],
  },
  {
    id: 'doomscroll-storm', number: 4, name: 'Думскролл-шторм', type: 'DEBUFF', description: 'Съедает концентрацию: завершённая игра приносит на 1 очко меньше.', shortLabel: '-1 очко', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', chargesDefault: 1, allowedTargets: 'self,other', conflictKey: 'focus', active: true, manualReview: true, rawTextSource: 'docs/rules-and-items.md', mechanics: [{ id: 'doomscroll-active-tag', triggerStage: 'while_game_active', effectType: 'active_game_note', value: 'Думскролл-шторм мешает сконцентрироваться и готовит -1 очко при завершении.', priority: 45, stackable: false, oneTime: false, consumption: 'on_run_resolved', applicationText: 'Думскролл-шторм висит до конца активной игры.' }, { id: 'doomscroll-score', triggerStage: 'on_score_calculation', effectType: 'score_modifier', value: -1, priority: 75, stackable: false, oneTime: true, consumption: 'on_run_resolved', applicationText: 'Думскролл-шторм отнимает 1 очко от награды за игру.' }],
  },
  {
    id: 'banana-mine', number: 5, name: 'Банановая мина', type: 'TRAP', description: 'Ловушка на следующий ход: игрок делает на 2 клетки меньше.', shortLabel: '-2 ход', imageUrl: 'https://images.unsplash.com/photo-1574226516831-e1dff420e37f?auto=format&fit=crop&w=400&q=80', chargesDefault: 1, allowedTargets: 'other', conflictKey: null, active: true, manualReview: true, rawTextSource: 'docs/rules-and-items.md', mechanics: [{ id: 'banana-mine-move', triggerStage: 'before_move', effectType: 'move_modifier', value: -2, priority: 90, stackable: false, oneTime: true, consumption: 'on_trigger', applicationText: 'Банановая мина заставляет потерять 2 клетки движения.' }],
  },
  {
    id: 'toxic-spoiler', number: 6, name: 'Токсичный спойлер', type: 'TRAP', description: 'Следующее назначение можно взять только по Base-условиям.', shortLabel: 'Только Base', imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=400&q=80', chargesDefault: 1, allowedTargets: 'other', conflictKey: null, active: true, manualReview: true, rawTextSource: 'docs/rules-and-items.md', mechanics: [{ id: 'toxic-spoiler-lock', triggerStage: 'before_condition_select', effectType: 'condition_lock', value: 'BASE', priority: 95, stackable: false, oneTime: true, consumption: 'on_assignment_created', applicationText: 'Токсичный спойлер оставляет игроку только Base-условия для следующего назначения.' }],
  },
  {
    id: 'clean-reroll-vibe', number: 7, name: 'Чистый реролл вайба', type: 'NEUTRAL', description: 'Если сумма двух d6 получилась 5 или меньше, предмет добавляет ещё +2 клетки движения.', shortLabel: '+2 при 5-', imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=80', chargesDefault: 1, allowedTargets: 'self', conflictKey: null, active: true, manualReview: true, rawTextSource: 'docs/rules-and-items.md', mechanics: [{ id: 'clean-reroll-vibe-move', triggerStage: 'after_roll', effectType: 'conditional_move_modifier', value: 2, priority: 60, stackable: false, oneTime: true, consumption: 'on_trigger', applicationText: 'Чистый реролл вайба добавляет +2, потому что бросок был 5 или меньше.', conditions: { maxRawRoll: 5 } }],
  },
];

export const wheelEntriesContent = [
  { label: 'Лёгкие глаза', description: 'Быстрый бафф на следующий ход.', rewardType: 'ITEM', itemNumber: 1, weight: 3, imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=400&q=80', active: true, manualReview: true },
  { label: 'Проклятие слепой повязки', description: 'Дебафф на следующий ход.', rewardType: 'ITEM', itemNumber: 2, weight: 2, imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', active: true, manualReview: true },
  { label: 'Чилловый плейлист', description: 'Помогает добрать очки за активную игру.', rewardType: 'ITEM', itemNumber: 3, weight: 3, imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80', active: true, manualReview: true },
  { label: 'Думскролл-шторм', description: 'Портит финальную награду за активную игру.', rewardType: 'ITEM', itemNumber: 4, weight: 2, imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', active: true, manualReview: true },
  { label: 'Банановая мина', description: 'Ловушка на следующее перемещение.', rewardType: 'ITEM', itemNumber: 5, weight: 2, imageUrl: 'https://images.unsplash.com/photo-1574226516831-e1dff420e37f?auto=format&fit=crop&w=400&q=80', active: true, manualReview: true },
  { label: 'Токсичный спойлер', description: 'Следующее назначение только через Base.', rewardType: 'ITEM', itemNumber: 6, weight: 1, imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=400&q=80', active: true, manualReview: true },
  { label: 'Чистый реролл вайба', description: 'Спасает плохой бросок и добавляет хода.', rewardType: 'ITEM', itemNumber: 7, weight: 2, imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=80', active: true, manualReview: true },
  { label: '+1 дополнительный спин', description: 'Колесо даёт ещё одну попытку.', rewardType: 'SPINS', rewardSpins: 1, weight: 1, imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=80', active: true, manualReview: true },
  { label: 'Ничего, кроме вайба', description: 'Пустой сектор без награды, но с настроением.', rewardType: 'NOTHING', weight: 1, imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80', active: true, manualReview: true },
] as const;

const itemsByNumber = new Map(contentItemDefinitions.map((item) => [item.number, item]));

export function getContentItemDefinitionByNumber(number: number) {
  return itemsByNumber.get(number) ?? null;
}
