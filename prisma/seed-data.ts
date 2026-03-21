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
  name: 'Колесо мемных артефактов',
  description: 'Основное колесо сезона. Сервер выбирает результат по весам, клиент анимируется под уже выбранный сектор.',
  imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  active: true,
};

export const defaultWheelEntries = wheelEntriesContent;

export const boardCells = [
  ['Старт x Финиш', 'START'],
  ['Инди-разогрев', 'REGULAR'],
  ['Подлянка', 'PODLYANKA'],
  ['Рогалик-квартал', 'REGULAR'],
  ['Колесо мемов', 'WHEEL'],
  ['Кооп-угол', 'REGULAR'],
  ['Случайный ран', 'RANDOM'],
  ['Хоррор-сектор', 'REGULAR'],
  ['Кайфарик', 'KAIFARIK'],
  ['JRPG-линия', 'REGULAR'],
  ['Тюрьма', 'JAIL'],
  ['Инди-подвал', 'REGULAR'],
  ['Колесо бустов', 'WHEEL'],
  ['Аркадный зал', 'REGULAR'],
  ['Подлянка+', 'PODLYANKA'],
  ['Метроидвания', 'REGULAR'],
  ['Случайный жанр', 'RANDOM'],
  ['Кооп-рейд', 'REGULAR'],
  ['Кайфарик+', 'KAIFARIK'],
  ['Шутерная улица', 'REGULAR'],
  ['Аукционная', 'AUCTION'],
  ['Инди-переулок', 'REGULAR'],
  ['Колесо боли', 'WHEEL'],
  ['Выживач-клетка', 'REGULAR'],
  ['Подлянка XXL', 'PODLYANKA'],
  ['Стратегический блок', 'REGULAR'],
  ['Случайный челлендж', 'RANDOM'],
  ['Пиксель-нора', 'REGULAR'],
  ['Кайфарик deluxe', 'KAIFARIK'],
  ['Соулс-авеню', 'REGULAR'],
  ['Лотерея', 'LOTTERY'],
  ['Инди-ярмарка', 'REGULAR'],
  ['Колесо угара', 'WHEEL'],
  ['Файтинг-угол', 'REGULAR'],
  ['Подлянка turbo', 'PODLYANKA'],
  ['Платформерная', 'REGULAR'],
  ['Случайный боссфайт', 'RANDOM'],
  ['Хаос-клетка', 'REGULAR'],
  ['Кайфарик finale', 'KAIFARIK'],
  ['Финишная прямая', 'REGULAR'],
] as const;
