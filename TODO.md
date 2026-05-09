# Grass Slasher — Discussion Queue

Append items here. Mark `[x]` when handled. Use `?` for proposals to debate.

## Format
```
- [ ] [type] short title — context/why. (priority: low/med/high)
```
Types: `bug` `feature` `ux` `refactor`

---

## Open

- [ ] [refactor] modular split — see `tasks/refactor-modular.md`. (priority: high)

- [x] [bug] slash misses grass until player moves — symptom: cuts don't register on fresh load until player moves. diagnosis: player spawns at `(320,240)` — exact tile boundary; `checkSlashHits` hit centers land on tile edges, exactly `TILE/2` from grass centers → borderline miss. fix: init player at tile center `x: Math.floor(W/2/TILE)*TILE+TILE/2, y: Math.floor(H/2/TILE)*TILE+TILE/2`. (priority: high)
- [ ] [ux] differentiate repeatable vs one-time upgrades visually in shop. (priority: low)
- [ ] [feature] gem drop chance upgrade — base drop rate low (e.g. 30%), upgrade increases chance per level. (priority: med)
- [ ] [feature] magnet upgrade — gems within range auto-collected; upgrade increases range. (priority: low)

## Proposals (need decision)

- ? hold-to-slash vs charge slash tech tree — two separate upgrade paths rather than one linear tree?

## Done

- [x] tile-based hitbox
- [x] arc sweep cardinal→cardinal
- [x] retract cancellable by new slash
- [x] grid-aligned shrub grass
- [x] player sprite shrunk to 32×32
- [x] fix auto-slasher idle-frame loop — added `autoSlashCooldown`, scales 36f→10f with level
- [x] rename slashRange → "Sword Size"
- [x] repeatable upgrades feel flat — rupeeMult yield now compounds `floor(1.5^level)`
- [x] physical gem drops — `gems[]` array, pop physics + bounds bounce, pickup on overlap (14px), 30s lifetime with end-of-life blink, no auto-rupee on cut
- [x] allow turning/moving while slashing — removed `slashState === 'idle'` gate around movement; arc still locks to `slashCardinal` at swing start, `player.facing` updates from WASD mid-swing → next queued slash chains in new direction
