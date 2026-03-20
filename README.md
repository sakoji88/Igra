# Igra MVP v1

Закрытая MVP-платформа для сезонного игрового ивента между друзьями: с логином по учёткам, полем, профилями игроков, инвентарём, событиями, правилами и базовой админкой.

## Стек

- Next.js App Router + TypeScript
- Tailwind CSS
- Auth.js credentials auth
- Prisma + PostgreSQL schema
- Zod validation

## Что уже есть в MVP

- логин `/login` с демо-учётками из seed data
- сезонный дашборд `/`
- поле `/board` с периметром, клетками, текущим активным игроком и UI для броска / выбора условий / Win / Drop
- список и профиль игроков `/players`, `/players/[id]`
- энциклопедия правил `/rules`
- панель judge/admin `/admin`
- Prisma schema и seed data
- sample CSV import files
- базовые тесты доменной логики

## Быстрый старт

1. Установить зависимости:
   ```bash
   pnpm install
   ```
2. Поднять PostgreSQL и создать `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/igra"
   AUTH_SECRET="replace-me"
   AUTH_TRUST_HOST="true"
   ```
3. Сгенерировать Prisma client и применить схему:
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```
4. Подготовить seed preview:
   ```bash
   pnpm seed
   ```
5. Запустить приложение:
   ```bash
   pnpm dev
   ```
6. Прогнать тесты:
   ```bash
   pnpm test
   ```

## Демо-логины

- `admin@igra.local / admin123`
- `judge@igra.local / judge123`
- `p1@igra.local / player123`
- `p2@igra.local / player123`
- `p3@igra.local / player123`
- `p4@igra.local / player123`

## Структура

- `src/app` — страницы App Router
- `src/lib/domain` — доменная логика движения, эффектов, очков и переходов статусов
- `prisma/schema.prisma` — стартовая схема БД
- `prisma/seed-data.ts` — конфиг сезона, клеток, предметов, колёс и пользователей
- `samples/legacy` — примеры CSV для legacy import
- `docs` — документация по области и форматам

## Намеренно отложено

- реальные server actions с записью в БД для каждого хода
- полноценный rollback selector
- настоящий импорт в БД из UI
- полная автоматизация всех edge-case правил старого Excel-ивента
