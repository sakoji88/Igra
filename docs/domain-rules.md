# Domain rules

## Core board flow
- Turn = move by the sum of two d6.
- Condition choice happens only after movement resolves.
- One player may have only one active assignment at a time.
- Score is calculated server-side.

## Wheel flow
- Wheel results are decided server-side.
- Client animation must only visualize the already selected server result.
- Spins are usually obtained when a player completes a run and grants another player exactly 3 spins.
- A completed run may produce that grant only once.

## Item flow
- Buffs, debuffs and traps are regular item definitions.
- Inventory stores season-bound owned item instances with source metadata.
- Traps are targetable-capable inventory objects, even if the full future use engine is not implemented yet.

## Conflict annihilation
- If a newly received item has a `conflictKey` and the player already owns an opposite BUFF/DEBUFF item with the same `conflictKey`, both annihilate.
- The old item is removed and the new one is not kept as a regular inventory gain.
- The annihilation is logged in the event log.
