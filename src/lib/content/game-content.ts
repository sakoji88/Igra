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
  targetType: string;
  duration: string;
  conflictKey: string | null;
  active: boolean;
  manualReview: boolean;
  rawTextSource: string;
  sourceType: 'DOCS';
  stackable: boolean;
  consumable: boolean;
  priority: number;
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

const rawTextSource = 'docs/rules-and-items.md';

function itemImage(number: number) {
  return `https://placehold.co/320x320/18181b/f8fafc?text=UPG+${number}`;
}

function makeItem(params: {
  number: number;
  name: string;
  type: ContentItemDefinition['type'];
  description: string;
  chargesDefault?: number;
  allowedTargets?: string;
  conflictKey?: string | null;
  duration?: string;
  shortLabel?: string;
  mechanics?: ItemEffectConfig[];
}) {
  return {
    id: `item-${params.number}`,
    number: params.number,
    name: params.name,
    type: params.type,
    description: params.description,
    shortLabel: params.shortLabel ?? params.name,
    imageUrl: itemImage(params.number),
    chargesDefault: params.chargesDefault ?? 1,
    allowedTargets: params.allowedTargets ?? 'self',
    targetType: params.allowedTargets ?? 'self',
    duration: params.duration ?? 'manual',
    conflictKey: params.conflictKey ?? null,
    active: true,
    manualReview: false,
    rawTextSource,
    sourceType: 'DOCS' as const,
    stackable: false,
    consumable: false,
    priority: 50,
    mechanics: params.mechanics ?? [],
  } satisfies ContentItemDefinition;
}

function manualNote(id: string, text: string): ItemEffectConfig {
  return {
    id,
    triggerStage: 'while_game_active',
    effectType: 'active_game_note',
    value: text,
    priority: 10,
    stackable: false,
    oneTime: false,
    consumption: 'manual',
    applicationText: text,
  };
}

export const glossaryEntries = [
  { term: 'Бафф', description: 'Предмет или событие с положительным эффектом.', manualReview: false },
  { term: 'Дебафф', description: 'Предмет или событие с отрицательным эффектом.', manualReview: false },
  { term: 'Предмет с пометкой «дебафф»', description: 'Не может быть сброшен стримером по собственному желанию.', manualReview: false },
  { term: 'Нейтральный', description: 'Предмет или событие с нейтральным или опциональным эффектом, который может быть положительным или отрицательным.', manualReview: false },
] as const;

export const specialMechanics = [
  { id: 'mechanic-item-types', title: 'Виды предметов', description: 'Бафф усиливает стримера, дебафф мешает ему, нейтралка зависит от контекста, а ловушка может быть предметом или событием и передаваться другому участнику.', manualReview: false },
  { id: 'mechanic-inventory-priority', title: 'Приоритет инвентаря', description: 'Дебаффы считаются сильнее баффов и нейтралок. При полном инвентаре замены и рероллы зависят от сочетания типов предметов в слотах.', manualReview: false },
  { id: 'mechanic-wheel-visibility', title: 'Колесо приколов', description: 'Колесо видно всем, но крутить его можно только за доступные крутки игрока. После прохождения игры другой стример может выдать игроку ещё 3 крутки, а максимум хранения — 6.', manualReview: false },
  { id: 'mechanic-server-authority', title: 'Серверное разрешение', description: 'Страница и API создают сезонное состояние и активное колесо автоматически, если они ещё не были подготовлены сидом.', manualReview: false },
] as const;

export const coreRuleSections: RuleSectionContent[] = [
  { slug: 'goal', title: '2.1 Общая цель', order: 1, published: true, manualReview: false, rawTextSource, content: 'Стримеры соревнуются на игровом поле и пытаются заработать как можно больше поинтов. Забег длится 14 дней. Победителем становится тот, у кого больше всего поинтов по истечении 14 дней. Победитель получает nothing.' },
  { slug: 'turn-rules', title: '2.2 Правила хода', order: 2, published: true, manualReview: false, rawTextSource, content: 'Каждый стример бросает два кубика d6. Выпавшее значение — количество клеток, которое он проходит. Чтобы совершить следующий ход, в большинстве случаев нужно пройти игру на клетке остановки по указанным условиям или выбрать альтернативные условия для удвоенного количества поинтов. Стример не ждёт других участников: как только игра пройдена или условие клетки выполнено, он может снова бросать кубики. Ограничений на ходы в день или неделю нет.' },
  { slug: 'wheel-rules', title: '2.3 Колесо приколов', order: 3, published: true, manualReview: false, rawTextSource, content: 'В начале игры у всех есть по 3 крутки колеса. За каждую пройденную игру стример получает ещё 3 крутки, а максимум накопления — 6. Свои колёса стример сам не крутит: он просит другого стримера крутить его крутки, но списываются они у владельца. За один ход можно прокрутить максимум 6 колёс. Предметы попадают в инвентарь, где максимум 6 слотов. Если событие нельзя применить, выполняется реролл колеса.' },
  { slug: 'reroll-rules', title: '2.4 Правила реролла игр', order: 4, published: true, manualReview: false, rawTextSource, content: 'Легитимный реролл возможен для игр без концовки, VR-игр, проектов с техническими проблемами захвата, DLC без основы, игр с некорректной ценой, игр без допустимого языка или стриминга, повторов в допустимых сезонах, visual novels и текстовых RPG, раннего доступа в первые 30 минут, сборников и спортивных / гоночных симуляторов по указанным оговоркам.' },
  { slug: 'completion-rules', title: '2.5 Игра считается пройденной, если', order: 5, published: true, manualReview: false, rawTextSource, content: 'Прохождение засчитывается при достижении финала, альтернативной валидной концовки, выполнении требований для бессюжетных игр с уровнями, побитии High Score там, где это основной критерий, а также по отдельным договорённостям для rogue-like, стратегий с несколькими кампаниями и игр с несколькими историями. Если есть сомнения в честности зачёта, вопрос нужно заранее обсудить с другими участниками.' },
  { slug: 'bans', title: '2.6 Запреты', order: 6, published: true, manualReview: false, rawTextSource, content: 'Запрещено использование чит-кодов, трейнеров и сторонних программ, облегчающих прохождение. Баги и гличи на скип уровней разрешены.' },
  { slug: 'difficulty', title: '2.7 Сложность', order: 7, published: true, manualReview: false, rawTextSource, content: 'По умолчанию используется стандартная сложность, предлагаемая игрой. Если игру нужно настраивать вручную, стример выбирает сложность сам, но не самый лёгкий режим и его аналоги. Если вместо сложности есть режимы, выбирается их аналог, а спорные случаи обсуждаются отдельно. Настройки, влияющие на сложность прохождения, запрещены.' },
  { slug: 'drop', title: '2.8 Дроп', order: 8, published: true, manualReview: false, rawTextSource, content: 'При дропе игры стример отправляется в Тюрьму и проходит там игру по правилам клетки. При дропе прямо на клетке Тюрьма стример теряет 2 поинта. Уход в минус по поинтам разрешён.' },
  { slug: 'inventory', title: '2.9 Инвентарь', order: 9, published: true, manualReview: false, rawTextSource, content: 'Каждый стример может носить максимум 6 предметов. Увеличить или уменьшить размер инвентаря никакими способами нельзя.' },
  { slug: 'watching-guides', title: '2.10 Просмотр прохождения', order: 10, published: true, manualReview: false, rawTextSource, content: 'Смотреть прохождение игры запрещено. Подсказки из чата разрешены, если это не копипаста гайдов, не помощь со спидранными абузами и не искажение честного прохождения.' },
  { slug: 'unexpected-cases', title: '2.11 Непредвиденные моменты', order: 11, published: true, manualReview: false, rawTextSource, content: 'Любые непредвиденные моменты, не прописанные в правилах, решаются стримером по его усмотрению при отсутствии свидетелей.' },
  { slug: 'event-drop', title: '2.12 Дроп ивента', order: 12, published: true, manualReview: false, rawTextSource, content: 'Если один из стримеров дропает ивент, то он какашка.' },
  { slug: 'where-to-roll', title: '2.13 Где можно роллить', order: 13, published: true, manualReview: false, rawTextSource, content: 'Ролл игр производится только на известном стримерам сайте с роллом игр, колесо приколов — в Wheel of Pepega или аналогичном сайте, монетка и d6 кидаются в Google через coin flip и roll dice, а чатовые голосования проходят в Twitch через /poll.' },
  { slug: 'goty-edition', title: '2.14 GOTY Edition', order: 14, published: true, manualReview: false, rawTextSource, content: 'Если выпадает GOTY-версия со всеми DLC, для зачёта достаточно пройти только основную игру без побочных DLC. Если кампании доступны сразу, хватает одной; если они открываются последовательно, нужно пройти все.' },
  { slug: 'start-points-exceptions', title: '2.15 Когда не дают 5 поинтов за преодоление клетки «Старт»', order: 15, published: true, manualReview: false, rawTextSource, content: 'Бонус за Старт не начисляется в ситуациях с обратным движением, отменой прохождения Старт после возврата, а также при особых перемещениях между частями поля, где сам эффект не считается честным пересечением клетки. В спорных случаях нужно обращаться к судье.' },
  { slug: 'leave-jail', title: '2.16 Как выйти из Тюрьмы после дропа', order: 16, published: true, manualReview: false, rawTextSource, content: 'Из Тюрьмы после дропа можно выйти либо за 3 поинта, пытаясь выбросить дублет на двух кубиках без модификаторов, либо коллективным побегом трёх и более стримеров раз в 24 часа. Во втором случае совпавший у всех бросок отправляет их на Naughty Boy, но замеченный судьёй побег карается штрафом в 2 поинта для всех заключённых.' },
];

export const contentItemDefinitions: ContentItemDefinition[] = [
  makeItem({ number: 1, name: 'Читерский кубик', type: 'BUFF', chargesDefault: 1, conflictKey: 'dice-rig', description: 'После броска кубиков заменяет значение на одном из них на то, которое выберет стример. За один ход можно использовать только один заряд.', mechanics: [manualNote('cheater-dice-note', 'После броска можно вручную подменить одно значение кубика.')]}),
  makeItem({ number: 2, name: 'Кубик хуёбика', type: 'DEBUFF', chargesDefault: 1, conflictKey: 'dice-rig', description: 'После следующего броска кубиков большее значение меняется на 1.', mechanics: [manualNote('huebik-note', 'На следующем броске большее значение кубика вручную заменяется на 1.')]}),
  makeItem({ number: 3, name: 'Очки EZ', type: 'BUFF', chargesDefault: 2, conflictKey: 'difficulty', description: 'Следующие два хода, не считая текущий, игры проходятся на самом лёгком уровне сложности.', mechanics: [manualNote('ez-glasses-note', 'Следующие две игры можно проходить на самом лёгком уровне сложности.')]}),
  makeItem({ number: 4, name: 'Повязка Рэмбо', type: 'DEBUFF', chargesDefault: 2, conflictKey: 'difficulty', description: 'Следующие два хода, не считая текущий, игры проходятся на самом высоком уровне сложности.', mechanics: [manualNote('rambo-note', 'Следующие две игры нужно проходить на самой высокой сложности.')]}),
  makeItem({ number: 5, name: 'Свиток реролла', type: 'BUFF', chargesDefault: 1, description: 'Позволяет сделать реролл игры и по желанию снять эффекты, влияющие на ролл колеса.', mechanics: [manualNote('reroll-scroll-note', 'Предмет даёт ручной реролл игры.')]}),
  makeItem({ number: 6, name: 'Шар всезнания', type: 'BUFF', chargesDefault: 1, description: 'При использовании можно воспользоваться гайдом, видеопрохождением или спидраном игры.', mechanics: [manualNote('omniscience-note', 'Этот предмет вручную разрешает пользоваться гайдом или видеопрохождением.')]}),
  makeItem({ number: 7, name: 'Взрывчатка', type: 'DEBUFF', chargesDefault: 2, description: 'При попытке использования положительных свойств предметов бросьте монетку. Заряд тратится в любом случае.', mechanics: [manualNote('explosives-note', 'Использование положительных свойств предметов требует ручной проверки монеткой.')]}),
  makeItem({ number: 8, name: 'Корона колесного короля', type: 'BUFF', chargesDefault: 1, description: 'После прокрута колеса можно выбрать между двумя соседними играми. Не работает на Аукошной и Лотерее.', mechanics: [manualNote('crown-note', 'После ролла колеса можно вручную выбрать один из соседних пунктов.')]}),
  makeItem({ number: 9, name: 'Ремонтный набор', type: 'BUFF', chargesDefault: 1, description: 'Увеличивает количество зарядов у любого вашего предмета на 1. Не работает на Шоколад.', mechanics: [manualNote('repair-kit-note', 'Можно вручную увеличить заряд выбранного предмета на 1.')]}),
  makeItem({ number: 10, name: 'Красочная манга', type: 'BUFF', chargesDefault: 1, description: 'Позволяет проходить визуальную новеллу, но запрещает автоскип сцен.', mechanics: [manualNote('manga-note', 'Этот предмет вручную разрешает визуальные новеллы без автоскипа.')]}),
  makeItem({ number: 11, name: 'Рука мидаса', type: 'NEUTRAL', chargesDefault: 3, description: 'Следующие три игры имеют обязательную стоимость от 15 долларов. Не работает на аукционной и лотерее.', mechanics: [manualNote('midas-note', 'Следующие три игры должны удовлетворять ценовому фильтру от 15 долларов.')]}),
  makeItem({ number: 12, name: 'Реверсивные сапоги', type: 'DEBUFF', chargesDefault: 1, description: 'Во время следующего хода бросьте один кубик вместо двух и отступите назад на выпавшее значение.', mechanics: [manualNote('reverse-boots-note', 'Следующий ход выполняется вручную одним кубиком назад без дополнительных эффектов.')]}),
  makeItem({ number: 13, name: 'Парные кольца времени', type: 'BUFF', chargesDefault: 4, description: 'Связывает двух стримеров общими зарядами и уменьшает временные условия на 2 часа при использовании.', mechanics: [manualNote('rings-note', 'Предмет требует ручного связывания двух игроков и общего счётчика зарядов.')]}),
  makeItem({ number: 14, name: 'Тухлая шаурма', type: 'TRAP', chargesDefault: 2, allowedTargets: 'other', description: 'Следующие два хода цель отнимает от каждого значения кубика 1. Значение на кубике не может быть меньше 1.', mechanics: [{ id: 'shawarma-move', triggerStage: 'after_roll', effectType: 'move_modifier', value: -2, priority: 80, stackable: false, oneTime: true, consumption: 'on_trigger', applicationText: 'Тухлая шаурма уменьшает следующий бросок на 2 клетки суммарно.' }]}),
  makeItem({ number: 15, name: 'Четырёхлистный клевер', type: 'BUFF', chargesDefault: 1, description: 'Можно отбить любую ловушку. На Аукционе и Лотерее можно договориться на +2 поинта или пройти игру на лёгком уровне сложности.', mechanics: [manualNote('clover-note', 'Клевер вручную отражает ловушку или даёт особый бонус на Аукционе и Лотерее.')]}),
  makeItem({ number: 16, name: 'Чокер боли', type: 'TRAP', chargesDefault: 1, allowedTargets: 'other', description: 'Во время следующего прохождения игры на обычной клетке цель может проходить её только по жанровым правилам.', mechanics: [{ id: 'pain-choker-lock', triggerStage: 'before_condition_select', effectType: 'condition_lock', value: 'GENRE', priority: 95, stackable: false, oneTime: true, consumption: 'on_assignment_created', applicationText: 'Чокер боли заставляет выбрать только жанровые условия.' }]}),
  makeItem({ number: 17, name: 'Полукаловая монета', type: 'TRAP', chargesDefault: 1, allowedTargets: 'other', description: 'На следующей клетке с временным условием цель подбрасывает монетку: одна сторона даёт -2 часа, вторая +3 часа.', mechanics: [manualNote('coin-note', 'Эффект временного окна определяется вручную монеткой на следующей подходящей клетке.')]}),
  makeItem({ number: 18, name: 'Шоколад', type: 'BUFF', chargesDefault: 1, description: 'Уменьшает верхнее и нижнее значение времени на клетке на 1 час и может копиться до плитки.', mechanics: [manualNote('chocolate-note', 'Шоколад вручную меняет временные рамки клетки и умеет копиться до плитки.')]}),
  makeItem({ number: 19, name: 'Туалетка', type: 'BUFF', chargesDefault: 1, description: 'При дропе вместо Тюрьмы возвращает на клетку предыдущего хода. Не может заблокировать эффект Дырявого парашюта.', mechanics: [manualNote('toilet-note', 'При дропе можно вручную вернуться на предыдущую клетку вместо Тюрьмы.')]}),
  makeItem({ number: 20, name: 'Штрафная квитанция', type: 'DEBUFF', chargesDefault: 1, description: 'На следующей клетке с временем повышает верхний и нижний порог на 3 часа.', mechanics: [manualNote('fine-note', 'Следующее временное условие нужно вручную увеличить на 3 часа.')]}),
  makeItem({ number: 21, name: 'Дырявый парашют', type: 'DEBUFF', chargesDefault: 1, description: 'При дропе перемещает на Старт и повышает временные пороги на 3 часа.', mechanics: [manualNote('parachute-note', 'При дропе вручную переносит игрока на Старт и увеличивает временные пороги.')]}),
  makeItem({ number: 22, name: 'Наперсток удачи', type: 'BUFF', chargesDefault: 1, description: 'Перед каждым роллом колеса позволяет заменить один нежелательный сектор на нужный.', mechanics: [manualNote('thimble-note', 'Перед прокрутом колеса можно вручную объявить замену одного сектора.')]}),
  makeItem({ number: 23, name: 'Рука для fisting', type: 'TRAP', chargesDefault: 5, allowedTargets: 'other', description: 'Делает другого стримера slave: каждый пятый заработанный им point уходит владельцу предмета до суммарной выплаты 5 поинтов.', mechanics: [manualNote('fisting-note', 'Предмет требует ручного учёта передачи поинтов между двумя игроками.')]}),
  makeItem({ number: 24, name: 'Тотем мощны', type: 'BUFF', chargesDefault: 2, description: 'Защищает на текущий и следующий ход от ловушек-событий.', mechanics: [manualNote('totem-note', 'Тотем вручную защищает игрока от ловушек-событий на текущий и следующий ход.')]}),
  makeItem({ number: 25, name: 'Плюсовый блокнот', type: 'BUFF', chargesDefault: 1, description: 'Если оба кубика совпали, даёт +2 к движению. На двух шестёрках вместо этого даёт +1 поинт.', mechanics: [manualNote('notebook-note', 'При дубле бонус рассчитывается вручную: +2 к движению, а на двух шестёрках — +1 поинт.')]}),
  makeItem({ number: 26, name: 'Интрига', type: 'NEUTRAL', description: 'Событие: произведите реролл колеса.' }),
  makeItem({ number: 27, name: 'Два по цене одного', type: 'NEUTRAL', description: 'Событие: реролл колеса и выполнение двух соседних пунктов от выпавшего сектора.' }),
  makeItem({ number: 28, name: 'По магазинам с чатом', type: 'NEUTRAL', description: 'Событие: реролл колеса с выбором между выпавшим пунктом и соседями через голосование чата.' }),
  makeItem({ number: 29, name: 'По магазинам с Лепреконом', type: 'BUFF', description: 'Событие: реролл колеса с выбором главного судьи или самого стримера при его отсутствии.' }),
  makeItem({ number: 30, name: 'Однорукий бандит', type: 'DEBUFF', description: 'Событие: сбросьте весь инвентарь и прокрутите колесо за каждый сброшенный предмет.' }),
  makeItem({ number: 31, name: 'Грязнулькин', type: 'DEBUFF', description: 'Событие: съедает случайный предмет типа бафф.' }),
  makeItem({ number: 32, name: 'Рокировочка', type: 'NEUTRAL', description: 'Событие: меняет тип предмета с дебаффа на бафф и наоборот по желанию стримера.' }),
  makeItem({ number: 33, name: 'Лепреконий схрон', type: 'BUFF', description: 'Событие: покрутите колесо только из баффов и положительных событий.' }),
  makeItem({ number: 34, name: 'Заначка Старыги', type: 'DEBUFF', description: 'Событие: покрутите колесо только из дебаффов и отрицательных событий.' }),
  makeItem({ number: 35, name: 'Стример не тупой', type: 'NEUTRAL', description: 'Событие: ответьте на 7 случайных вопросов и получите от -2 до +2 поинтов.' }),
  makeItem({ number: 36, name: 'Аптечка', type: 'NEUTRAL', description: 'Событие: можно сбросить дебафф за -1 поинт или бафф за +1 поинт.' }),
  makeItem({ number: 37, name: 'Ой, извините', type: 'NEUTRAL', description: 'Событие: выберите один из четырёх соседних пунктов.' }),
  makeItem({ number: 38, name: 'Mine now TriHard', type: 'NEUTRAL', description: 'Событие: обменяйтесь инвентарями со случайным стримером.' }),
  makeItem({ number: 39, name: 'Помощь отстающему', type: 'NEUTRAL', description: 'Событие: модификатор следующего броска зависит от текущего места по поинтам.' }),
  makeItem({ number: 40, name: 'Удачный неудачник', type: 'BUFF', description: 'Событие: следующий бросок усиливается количеством дебаффов в инвентаре.' }),
  makeItem({ number: 41, name: 'Торопыга', type: 'BUFF', description: 'Событие: следующая клетка со временем снижает верхний и нижний порог на 1 час.' }),
  makeItem({ number: 42, name: 'Бог любит троицу', type: 'BUFF', description: 'Событие: на следующем ходу бросьте три кубика вместо двух и выберите два из них.' }),
  makeItem({ number: 43, name: 'Орел или решка', type: 'NEUTRAL', description: 'Событие: монетка даёт +2 или -2 к следующему броску на передвижение.' }),
  makeItem({ number: 44, name: 'А где это я?', type: 'NEUTRAL', description: 'Событие: крутите колесо баффов или дебаффов в зависимости от позиции на поле.' }),
  makeItem({ number: 45, name: 'Чат здесь закон', type: 'BUFF', description: 'Событие: следующая игра выбирается голосованием чата из 6 вариантов.' }),
  makeItem({ number: 46, name: 'Я здесь закон', type: 'BUFF', description: 'Событие: следующая игра выбирается самим стримером из 6 вариантов.' }),
  makeItem({ number: 47, name: 'Выбор бумера', type: 'NEUTRAL', description: 'Событие: следующая игра должна выйти до декабря 2010 года.' }),
  makeItem({ number: 48, name: 'Выбор зумера', type: 'NEUTRAL', description: 'Событие: следующая игра должна выйти от января 2011 года.' }),
  makeItem({ number: 49, name: 'Мистер Ржавчик', type: 'TRAP', allowedTargets: 'other', description: 'Ловушка-событие: съедает у выбранного стримера случайный предмет-бафф.' }),
  makeItem({ number: 50, name: 'Всепоглощающий свин', type: 'TRAP', allowedTargets: 'other', description: 'Ловушка-событие: съедает у выбранного стримера случайный предмет.' }),
  makeItem({ number: 51, name: 'Грабли', type: 'TRAP', allowedTargets: 'other', description: 'Ловушка-событие: выбранный стример получает -1 к следующему броску движения.' }),
  makeItem({ number: 52, name: 'Липкая жижа', type: 'TRAP', allowedTargets: 'other', description: 'Ловушка-событие: даёт -1 к следующему броску и оставляет след на клетке.' }),
  makeItem({ number: 53, name: 'Тормознутый', type: 'TRAP', allowedTargets: 'other', description: 'Ловушка-событие: увеличивает временные пороги следующей клетки на 1 час.' }),
  makeItem({ number: 54, name: 'Крыса', type: 'TRAP', allowedTargets: 'other', description: 'Ловушка-событие: цель получает -3 к следующему броску, а владелец -1.' }),
  makeItem({ number: 55, name: 'УВЫ', type: 'DEBUFF', description: 'Событие: жанровые условия на следующей игре дают обычные поинты.' }),
  makeItem({ number: 56, name: 'Часовой рост', type: 'DEBUFF', description: 'Событие: следующая клетка со временем увеличивает верхний и нижний порог на 1 час.' }),
  makeItem({ number: 57, name: 'Прыжок веры', type: 'NEUTRAL', description: 'Событие: перемещение на клетку Старт, с которой начинается новый ход.' }),
  makeItem({ number: 58, name: 'Кроссовки без подошвы', type: 'DEBUFF', chargesDefault: 1, description: 'Супердебафф: действует как реверсивные сапоги, но с двумя кубами D6.', mechanics: [manualNote('soleless-note', 'Следующий ход нужно вручную отыграть как реверсивные сапоги на двух D6.')]}),
  makeItem({ number: 59, name: 'Кубы с рынка', type: 'NEUTRAL', description: 'Событие: до перехода игрового поля в ход роллятся кубы D4. Не работает на отрицательные эффекты, но влияет на положительные.' }),
  makeItem({ number: 60, name: 'Очки Рэмбо', type: 'DEBUFF', chargesDefault: 3, description: 'Супердебафф: та же самая логика, что и повязка Рэмбо, но на три следующие клетки.', mechanics: [manualNote('rambo-glasses-note', 'Три следующие клетки нужно вручную проходить на самой высокой сложности.')]}),
  makeItem({ number: 61, name: 'Ладно, ребят', type: 'BUFF', description: 'Событие: прохождение игрового поля даёт 5 пунктов в течение одного полного прохода поля.' }),
  makeItem({ number: 62, name: 'Бомбермэн', type: 'DEBUFF', description: 'Супердебафф: каждое использование бафф-предмета имеет 20% шанс не прокнуть, а сам Бомбермэн не уходит из инвентаря.', mechanics: [manualNote('bomberman-note', 'Использование баффов под Бомбермэном нужно вручную проверять шансом 20%.')]}),
  makeItem({ number: 63, name: 'Штрафная повестка', type: 'DEBUFF', chargesDefault: 1, description: 'Супердебафф: убирает верхний временной порог и добавляет +3 часа к нижнему. Если верхнего порога нет, предмет не тратится.', mechanics: [manualNote('summons-note', 'Следующее временное условие нужно вручную переразметить по правилам штрафной повестки.')]}),
  makeItem({ number: 64, name: 'Куртизанка', type: 'NEUTRAL', description: 'Событие: до перехода игрового поля игры роллятся по желанию чатика.' }),
  makeItem({ number: 65, name: 'Орда грязнулькиных', type: 'DEBUFF', description: 'Событие: съедает все баффы в инвентаре. Если баффов 2 или меньше, производится реролл.' }),
  makeItem({ number: 66, name: 'Самый умный', type: 'DEBUFF', description: 'Событие: аналог «Стример не тупой», но на 10 вопросов и с более жёсткой шкалой поинтов.' }),
  makeItem({ number: 67, name: 'Трусы Вайбу', type: 'DEBUFF', chargesDefault: 1, description: 'Супердебафф: следующая клетка идёт без верхнего временного порога или без обязательного тега JRPG only.', mechanics: [manualNote('vaibu-note', 'Следующие клеточные условия нужно вручную урезать по правилам трусов Вайбу.')]}),
  makeItem({ number: 68, name: 'Спонсор', type: 'NEUTRAL', description: 'Событие: раздать сидящим с тобой в Discord людям по одному поинту со своих очков.' }),
];

export const wheelEntriesContent = contentItemDefinitions.map((item) => ({
  id: `wheel-${item.number}`,
  number: item.number,
  name: item.name,
  fullText: item.name,
  category: item.number >= 57 ? 'BREDIK' : 'ITEM',
  linkedItemId: item.id,
  linkedEffectId: null,
  resultType: 'ITEM',
  targetingRules: item.targetType,
  manualReview: false,
  label: item.name,
  description: item.description,
  rewardType: 'ITEM',
  itemNumber: item.number,
  weight: 1,
  imageUrl: item.imageUrl,
  active: true,
}));

const itemsByNumber = new Map(contentItemDefinitions.map((item) => [item.number, item]));

export function getContentItemDefinitionByNumber(number: number) {
  return itemsByNumber.get(number) ?? null;
}
