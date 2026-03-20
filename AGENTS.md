# AGENTS.md

## Project
Private invite-only web app for a chaotic meme-styled seasonal gaming event between friends.

This project is not a public SaaS and not a generic board game engine.
It is a closed internal platform for running one specific gaming event that previously existed in Excel.

## Primary goal
Build MVP v1 that allows:
- authentication
- roles (admin, judge, player)
- season dashboard
- board view
- player profiles
- inventory
- rolling 2d6 and moving on the board
- choosing condition type after movement
- creating an assignment/run
- marking win/drop
- event log
- rules encyclopedia
- admin/judge panel
- CSV legacy import

## Non-goals for MVP
Do not implement:
- Steam API
- Twitch API
- Discord API
- realtime sockets
- payments
- public registration
- bosses
- classes
- quests
- guilds
- chat
- mobile app
- microservices
- advanced animation engine

## Domain rules
- Turn = move by sum of two d6.
- Condition choice happens after movement is completed and destination cell is resolved.
- Debuffs override buffs.
- Conflicting items/effects annihilate each other.
- No effect stacking.
- If a run is disputed, it goes to disputed status and is resolved by judge/admin.
- Player confirms outcome using only two buttons: Win or Drop.
- Win is valid after credits/end of game or after manual judge/admin resolution.
- Only judge/admin may rollback.
- Progress is split into permanent and seasonal.
- One player may have only one active assignment at a time.
- Turn order is fixed and editable by admin.
- Scoring must be calculated server-side.

## Engineering rules
- Backend is authoritative.
- Validate all game actions server-side.
- Use TypeScript everywhere.
- Use Prisma with PostgreSQL.
- Use seed/config files for board cells, items, wheels, and condition templates.
- Keep UI text in Russian.
- Keep code, variable names, types, and comments in English.
- Add seed scripts.
- Add sample CSV import files.
- Add docs explaining extension points.
- Add basic tests for domain logic.

## UI direction
- Chaotic meme style, but still usable.
- Dark base UI.
- Strong visual identity.
- Funny local-energy feel.
- Cards, badges, event feed, inventory slots.
- The app should feel like a private streamer-friends event, not a corporate dashboard.
- Readability is still more important than chaos.

## Definition of done
MVP is done when:
- app starts locally
- seeded users can log in
- board works
- active player can roll 2d6 and move
- condition type can be chosen after movement
- assignment can be created and then marked Win/Drop
- scoring updates server-side
- inventory works for core cases
- admin/judge can resolve disputes and make corrections
- event log is visible
- rules page exists
- legacy CSV import works with sample files
