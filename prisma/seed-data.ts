import { contentItemDefinitions, coreRuleSections, wheelEntriesContent } from '../src/lib/content/game-content.ts';

export const currentSeason = { slug: 'spring-2026', name: 'Весенний мемомес 2026' };

export const seedAdmin = {
  nickname: 'admin',
  password: 'admin123',
  role: 'ADMIN' as const,
  avatarUrl: 'https://i.pravatar.cc/150?img=12',
  displayName: 'Главмем',
};

export const defaultRules = coreRuleSections.map((section) => ({
  title: section.title,
  slug: section.slug,
  order: section.order,
  published: section.published,
  content: section.content,
}));

export const defaultItemDefinitions = contentItemDefinitions.map((item) => ({
  number: item.number,
  name: item.name,
  type: item.type,
  description: item.description,
  imageUrl: item.imageUrl,
  chargesDefault: item.chargesDefault,
  allowedTargets: item.allowedTargets,
  conflictKey: item.conflictKey,
  active: item.active,
}));

export const defaultWheel = {
  name: 'Колесо приколов',
  description: 'Актуальное колесо сезона с предметами и событиями. Все видят колесо, а сервер тратит крутки владельца и сохраняет выпавший сектор.',
  imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  active: true,
};

export const defaultWheelEntries = wheelEntriesContent;

export const boardCells = [
  ['Старт x Финиш', 'START'],
  ['Инди-разогрев', 'REGULAR'],
  ['Крутка подлянок и кайфариков', 'WHEEL'],
  ['Рогалик-квартал', 'REGULAR'],
  ['Колесо мемов', 'WHEEL'],
  ['Клетка вопросика', 'RANDOM'],
  ['Случайный ран', 'RANDOM'],
  ['Хоррор-сектор', 'REGULAR'],
  ['Обычный игровой слот', 'REGULAR'],
  ['JRPG-линия', 'REGULAR'],
  ['Тюрьма', 'JAIL'],
  ['Инди-подвал', 'REGULAR'],
  ['Крутка подлянок и кайфариков', 'WHEEL'],
  ['Аркадный зал', 'REGULAR'],
  ['Клетка вопросика', 'RANDOM'],
  ['Метроидвания', 'REGULAR'],
  ['Случайный жанр', 'RANDOM'],
  ['Кооп-рейд', 'REGULAR'],
  ['Кайфарик+', 'KAIFARIK'],
  ['Шутерная улица', 'REGULAR'],
  ['Аукционная', 'AUCTION'],
  ['Инди-переулок', 'REGULAR'],
  ['Крутка подлянок и кайфариков', 'WHEEL'],
  ['Выживач-клетка', 'REGULAR'],
  ['Клетка вопросика', 'RANDOM'],
  ['Стратегический блок', 'REGULAR'],
  ['Случайный челлендж', 'RANDOM'],
  ['Пиксель-нора', 'REGULAR'],
  ['Кайфарик deluxe', 'KAIFARIK'],
  ['Соулс-авеню', 'REGULAR'],
  ['Лотерея', 'LOTTERY'],
  ['Инди-ярмарка', 'REGULAR'],
  ['Крутка подлянок и кайфариков', 'WHEEL'],
  ['Файтинг-угол', 'REGULAR'],
  ['Клетка вопросика', 'RANDOM'],
  ['Платформерная', 'REGULAR'],
  ['Случайный боссфайт', 'RANDOM'],
  ['Хаос-клетка', 'REGULAR'],
  ['Кайфарик finale', 'KAIFARIK'],
  ['Финишная прямая', 'REGULAR'],
] as const;
