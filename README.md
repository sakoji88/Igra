# Igra MVP v1

Закрытая MVP-платформа для сезонного игрового ивента между друзьями. Теперь проект работает как локальный private MVP: игроки регистрируются сами, появляются на старте, кидают кубы на поле, создают ран по слоту и ведут свой профиль с событиями и инвентарём.

## Что уже есть

- регистрация `/register` по `nickname + password + optional avatar URL`
- логин `/login` через local credentials
- один seeded admin-аккаунт для управления
- board `/board` с серверным броском 2d6, перемещением и выбором base/genre условий
- профиль игрока `/players/[id]` с текущим раном, историей ранoв, upcoming events и inventory
- rules `/rules`, которые читаются из БД
- admin `/admin` для правок игроков, CRUD предметов и CRUD правил
- event log сезона

## Быстрый старт

1. Установить зависимости:
   ```bash
   pnpm install
   ```
2. Скопировать env:
   ```bash
   cp .env.example .env
   ```
3. Поднять PostgreSQL и прописать `DATABASE_URL` в `.env`.
4. Сгенерировать Prisma client и применить схему:
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```
5. Засидить базу:
   ```bash
   pnpm seed
   ```
6. Запустить приложение:
   ```bash
   pnpm dev
   ```

## Seeded admin

После `pnpm seed` доступен локальный админ:

- `nickname`: `admin`
- `password`: `admin123`

## Регистрация игроков

Обычные игроки больше не захардкожены как demo users.

Теперь поток такой:

1. открыть `/register`
2. ввести nickname, password и optional avatar URL
3. после регистрации автоматически создаются:
   - `User`
   - `PlayerProfile`
   - `PlayerSeasonState`
4. игрок появляется на Start со счётом `0`

## Как работает бросок кубов

- кнопка `Roll Dice` находится прямо на поле
- клиент вызывает серверный route handler
- сервер генерирует `die1`, `die2`, `total`
- сервер обновляет позицию игрока и event log
- если игрок попал на игровой слот, можно выбрать `Base` или `Genre`

## Как работает ран / assignment

После выбора условий создаётся `RunAssignment` со следующими данными:

- slot number / slot id
- side of board
- selected condition type
- assignedAt
- expected points
- status = `ACTIVE`

Дальше игрок в профиле может:

- заполнить `gameTitle`
- добавить `gameUrl`
- написать `playerComment`
- пометить ран как `completed` или `dropped`

## Система поинтов по сторонам

- нижняя сторона = base `1`
- левая сторона = base `2`
- верхняя сторона = base `3`
- правая сторона = base `4`
- genre всегда = `base * 2`

## Admin flow

В `/admin` доступны:

- просмотр игроков
- ручная правка score / position
- выдача и снятие предметов
- CRUD item definitions
- CRUD rule sections

## Полезные команды

```bash
pnpm test
pnpm build
pnpm prisma generate
pnpm prisma db push
pnpm seed
pnpm dev
```
