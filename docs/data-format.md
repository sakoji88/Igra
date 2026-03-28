# Seed and config format

## Board cells

Each board cell has:
- `index`
- `label`
- `type`
- `points`
- optional payload for future cell-specific logic

## Items

Each item definition has:
- `code`
- `name`
- `category`
- `conflictKey`
- `charges`
- free-form payload/description

## Wheels

Wheel config stores:
- wheel code and name
- entries list
- per-entry weight
- action type
- action value
