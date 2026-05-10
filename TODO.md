# Grass Slasher — TODO

Completed items → `DONE.md`

## Format
```
- [ ] [type] short title — context/why. (priority: low/med/high)
- [~] [type] short title — built, awaiting browser verify.
```
Types: `bug` `feature` `ux` `refactor`
States: `[ ]` open → `[~]` built/unverified → move to `DONE.md` when verified

---

## Open

- [~] [bug] player starts in top room instead of bottom — symptom: game starts in room 0,0 but desired start is room 0,2 (bottom). diagnosis: `grass.js:initGrass()` hardcodes `loadRoom(0,0)`; `world.js` exports `roomX=0, roomY=0`. fix: change `initGrass()` to call `loadRoom(0,2)`; change `world.js` initial exports to `roomY=2`. files: `src/grass.js`, `src/world.js`. (priority: high)

- [~] [bug] gems disappear at transition start instead of end — symptom: gems vanish as soon as player hits edge and transition begins, not after slide completes. diagnosis: `startTransition()` in `src/main.js:65` calls `clearGems()` immediately. fix: remove `clearGems()` from `startTransition()`; add `clearGems()` in `update()` just before the `commitTransition()` call (around line 85). file: `src/main.js` only. (priority: high)

- [ ] [feature] rock wall tiles on dead-end edges — each room edge where neighbor is null should have a row/column of rock tiles: visual obstacle rendered on canvas, solid for player collision. Rocks are static per-room, derived from world adjacency (not stored in grasses[]). approach: export a `getRockTiles(rx,ry)` from `src/world.js` that returns `{x,y}[]` for edge tiles on null-neighbor sides (full column col=0 for left=null, col=19 for right=null, full row row=0 for up=null, row=14 for down=null, all 15 or 20 tiles as appropriate); add `drawRocks(rocks)` in `src/render.js` (grey stone rectangle, 32×32); add rock collision check in `blockedAt()` in `src/main.js` (same half-sum check against current room's rock tiles). files: `src/world.js`, `src/render.js`, `src/main.js`. (priority: high)

- [ ] [bug] stale debug arc when idle — symptom: red debug arc shows previous slash direction during idle, not the upcoming slash direction. If player rotates facing between slashes, arc misleads about where next slash will land. diagnosis: `drawDebug` in src/render.js line 233 uses `SLASH_ARCS[player.slashCardinal]`; `player.slashCardinal` only updates inside `startSweep`, so during idle it holds the last slash's cardinal. fix: in `drawDebug`, when `player.slashState === 'idle'`, use `SLASH_ARCS[snapCardinal(player.facing)]` to preview the upcoming slash; during sweeping/retracting keep `player.slashCardinal`. file: src/render.js only. (priority: med)

- [ ] [bug] red arc angular bounds don't match sword sweep edges — symptom: red debug arc edges at exact cardinal arc bounds, but sword visual (width 6, half-width 3) sweeps slightly past those bounds. Arc looks slightly narrower than where sword actually swings/hits. diagnosis: `drawDebug` uses raw `arc.start`/`arc.start + arc.delta`; sword rect has perpendicular width so its leading/trailing edges extend by `atan2(3, slashRange)` rad past the arc endpoints. fix: in `drawDebug`, expand arc angular bounds by `Math.atan2(3, player.slashRange)` on each end (subtract from start side, add on end side respecting `arc.delta` sign). file: src/render.js only. (priority: low)


- [~] [feature] debug grass spawn toggle — button in debug overlay to enable/disable grass spawning; useful for testing without grass respawning mid-session. fix: add `grassSpawnEnabled` bool (default true) in `src/main.js`; gate `spawnGrass()` call in game loop behind it; add toggle button rendered in `drawDebug()` in `src/render.js` (same style as existing debug overlay), clicking sets `grassSpawnEnabled = !grassSpawnEnabled`; export the bool so render.js can read it for button label. Files: `src/main.js`, `src/render.js`. (priority: low)

- [ ] [bug] auto-slash ignores facing direction — auto-slash picks slash direction by targeting nearest grass rather than using player facing. fix: in auto-slash fire logic (`src/main.js`), call `trySlash(player.cardinal)` (same as manual input) instead of computing nearest-grass direction. Remove any nearest-grass targeting code. (priority: med)

- [ ] [ux] sprite facing direction — up and down look same; fix: when facing up (sin(facing) < -0.5) draw back of head (hat from behind, no eyes, hair bump visible). Separately: make head and eyes bigger, anime style, for all directions. Left/right already distinct via eye x-offset. (priority: low)
- [ ] [ux] differentiate repeatable vs one-time upgrades visually in shop. (priority: low)
- [ ] [feature] magnet upgrade — gems within range auto-collected; upgrade increases range. (priority: low)



## Proposals (need decision)

- ? hold-to-slash vs charge slash tech tree — two separate upgrade paths rather than one linear tree?
