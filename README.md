# Igra MVP v1.5 — Items + Wheel

Закрытая MVP-платформа для сезонного игрового ивента между друзьями. На этой фазе поверх board/profile/auth flow добавлены полноценные предметы, wheel spins, серверный розыгрыш наград, аннигиляция конфликтных эффектов и отдельные страницы `/items` и `/wheel`.

## Что теперь умеет проект

- локальная регистрация `/register` и логин `/login`
- board `/board` с серверным броском 2d6 и сохранённой текущей геометрией поля
- slot modal для выбора `base` / `genre` условий
- inline admin-edit slot flow прямо из slot modal на поле
- профиль игрока `/players/[id]` с runs, inventory, spins, spin history и выдачей `3` wheel spins после completed run
- standalone `/items` как энциклопедия всех предметов
- standalone `/wheel` как полноценная механика кручения
- серверное wheel resolution: клиент анимирует, сервер выбирает сектор
- conflict annihilation по `conflictKey` для противоположных `BUFF/DEBUFF`
- admin CRUD для items, wheel definitions, wheel entries, rules и slot content
- event log сезона для gameplay/admin действий

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

## Как работает колесо

### Архитектура

- фронтенд показывает wheel animation
- клиент делает `POST /api/wheel/spin`
- сервер выбирает winning sector по `weight`
- сервер сохраняет `WheelSpin`, уменьшает `availableWheelSpins`, выдаёт reward и пишет event log
- клиент доезжает анимацией до уже выбранного сервером сектора

Это значит, что **результат колеса всегда authoritative на backend**.

### Получение спинов

1. игрок завершает run
2. на странице профиля completed run получает action `Give 3 spins`
3. игрок выбирает другого игрока
4. target получает ровно `3` спина
5. grant можно сделать только один раз на completed run

## Как работает аннигиляция предметов

У item definitions есть `conflictKey`.

Если новый предмет:
- имеет `conflictKey`
- и у игрока уже есть предмет с тем же `conflictKey`
- и типы противоположные (`BUFF` vs `DEBUFF`)

то:
- старый предмет удаляется
- новый не добавляется как обычный предмет
- в event log пишется запись об аннигиляции

Пример:
- `Лёгкие глаза` → `BUFF`, `conflictKey = eyes`
- `Проклятие слепой повязки` → `DEBUFF`, `conflictKey = eyes`

Если один приходит при наличии другого — они взаимно уничтожаются.

## Структура предметов

Item definition хранит:
- number
- name
- type
- description
- imageUrl
- chargesDefault
- allowedTargets
- conflictKey
- active

В inventory игрока хранятся:
- linked season state
- item definition
- current charges
- source type (`WHEEL`, `ADMIN`, `SEED` ...)
- obtainedAt

## Что и где теперь редактирует админ

### `/admin`

Админ может:
- создавать и редактировать item definitions
- указывать `conflictKey`, image URL, target metadata и active flag
- создавать и редактировать wheel definitions
- создавать и редактировать wheel sectors / entries
- управлять reward type (`ITEM / SPINS / NOTHING`) и weights
- менять spins / score / boardPosition игрока
- редактировать slot content напрямую в админке
- редактировать slot content прямо из board modal через `Edit Slot`
- создавать и редактировать rule sections

### `/board`

Если открыт админом:
- slot modal показывает `Edit Slot`
- можно менять name, type, side, imageUrl, conditions, description, publish/play flags
- layout поля при этом не ломается и остаётся тем же

## Standalone страницы

### `/items`
Показывает:
- image
- number
- name
- type
- description
- charges default
- allowed targets
- conflict info

Есть фильтры:
- all
- buffs
- debuffs
- traps

### `/wheel`
Показывает:
- wheel UI
- available spins
- spin button
- last message / result
- recent spin history
- список возможных outcomes

## Полезные команды

```bash
pnpm test
pnpm build
pnpm prisma generate
pnpm prisma db push
pnpm seed
pnpm dev
```
