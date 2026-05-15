# Grass Slasher — Completed Items

- [x] [ux] sprite facing direction — up-facing distinct from front/side via eye-skip (no separate hat band branch). Hat triangle, face, body, belt drawn unconditionally; eyes wrapped in `if (!facingUp)`. Anime-sized head (14×9 face) + bigger eyes (3×3). Hat + body + belt recolored royal purple (`#5a3a8c` / `#7a52b0`) so player no longer blends with grass.

- [x] [ux] sword z-order + tail origin — sword draws BEFORE body parts for up/left/right (renders behind player), conditionally AFTER body for down-slash (`slashCardinal === 1`). Tail extended toward player center (`(0, -3, swordLen+9, 6)`) for up/left/right; original `(9, -3, swordLen, 6)` retained for down-slash so tail starts at hand.
- [x] [feature] debug free-upgrade mode — new `src/debug.js` with `debugMode` + `setDebugMode`. While debug on (backtick), `buyUpgrade` bypasses gem-cost check. updateUI also disables-gate respects debug mode so buttons remain clickable.
- [x] [refactor] cap all upgrades at lv20 — `gemMult`/`slashRange`/`autoSlash` now `maxLevel: 20`. magnet bumped 5 → 20.
- [x] [bug] shop buttons active on intro screen — `#shop` hidden during intro, shown when `introShown` flips at all four sites. (Follow-up: user prefers visible-but-disabled — separate TODO.)

- [x] [bug] Z/Space dismiss win screen — extended win-screen keydown guard from Enter only to Enter/KeyZ/Space with preventDefault.
- [x] [bug] `Press E to pay debt` prompt shown when poor — added `gemCount >= debtRemaining` to prompt-display condition.

- [x] [bug] auto-slash blocks E key pay-debt — removed `player.slashState === 'idle'` gate from E handler.
- [x] [ux] debt counter format — dropped ` / 500` suffix from display + initial HTML.
- [x] [bug] partial debt payment allowed — added `gemCount >= debtRemaining` gate to E handler.

- [x] [feature] editor right-click erases — right-button paints with `'empty'`. Right-drag erases across stroke. `contextmenu` suppressed. `mousemove` guard via `e.buttons` bitmask.

- [x] [feature] editor click-and-drag paint — mousedown locks `strokeTarget` to current paint mode, mousemove paints idempotently while held, mouseup/mouseleave ends stroke. Event delegation on `#tile-grid`. `paintTile` gained bounds-check + optional `mode` param.

- [x] [feature] magnet upgrade — gems within range pulled toward player; existing pickupDist=14 still grants pickup. `magnet: { level: 0, baseCost: 25, costMult: 1.6, maxLevel: 5 }` in `src/upgrades.js`. Range = `level * 25` px (lv5 = 125). Pull = `0.5*(1-dist/range) + 0.15` toward player, overcomes damping. Resting gems unset `rest` when in range. Shop button `btn-magnet` (🧲). Note: circular import gems↔upgrades introduced; tracked as separate refactor TODO.

- [x] [feature] TDD test harness — Playwright + in-page `window.__test` hooks (`?test=1` gate). `installTestHooks` in `src/test-hooks.js`, called conditionally from `src/main.js` after `update()` defined. Exposes direct refs (`player`, `grasses`, `gems`, `upgrades`), getters for `export let` bindings, input helpers (`keydown`/`keyup`/`press`), `tick(n)` calling `update()` directly, mutation helpers (`teleport`, `clearGrasses`, `setUpgradeLevel`, `addGems`, `spawnGem`, `buyUpgrade`, `payDebt`, `skipIntro`). Playwright + http-server (port 8080) added as devDeps. Example spec green. See `plans/test-harness.md`.

- [x] [feature] single `npm start` runs editor + esbuild watch — `scripts/dev.js` spawns both with `stdio:'inherit'`, kills subtrees via `taskkill /T /F` on win32 / `process.kill(-pid)` elsewhere; `killing` flag guards re-entry. `package.json` gains `"start"`.
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
- [x] [refactor] modular split — see `tasks/refactor-modular.md`.
- [x] [bug] slash misses grass until player moves — player spawned at exact tile boundary; fixed by centering spawn at tile center.
- [x] [bug] gem physics wrong for top-down — removed gravity and y-bias; radial 2D spread + friction only.
- [x] [bug] player gets stuck in respawned grass — defer respawn 10 frames if player within 18px.
- [x] [bug] slashRange upgrade purely visual — checkSlashHits now extends tile ring at Lv2+.
- [x] [bug] SE arc shown instead of SW arc — SLASH_ARCS[1] never mutated in startSweep.
- [x] [bug] SW slash never fires — lastHorizDir added to player; startSweep uses it instead of Math.cos check.
- [x] [ux] debug overlay + log — backtick toggle; overlay shows facing/cardinal/slashState/tiles; download log button.
- [x] [feature] editor rocks paint + real sprites — Empty/Grass/Rock radio paint mode; tile cells render real game sprites via new `src/sprites.js` (pure paint fns, no DOM coupling) imported by both render.js and editor. Connector strips reduced to decorative dividers. Editor server adds `/src/sprites.js` route. Bundled in same commit: fix `initGrass()` to load room (1,2) instead of (0,2) by importing `roomX, roomY` from world.js — pre-existing mismatch that hid bottom-row grass and caused row-6 col-3 grass+rock overlap in start room.
- [x] [feature] gem tiers + drop upgrade — 4 tiers (green/blue/yellow/red, 1/5/10/20); gemTier upgrade shifts probabilities.
- [x] [feature] gem yield as pickup multiplier — gemMult applied at pickup, not spawn; formula: baseValue * floor(1.5^level).
- [x] [feature] movement speed upgrade — moveSpeed upgrade; base 2.8 + 0.4/level, max Lv5.
- [x] [bug] slash hitbox misses grass on diagonal swings — replaced SLASH_TILES lookup with arc-geometry test in checkSlashHits; distance scales with slashRange upgrade.
- [x] [ux] forgiving slash hitbox — expanded distance test to reach + TILE/2; arc angle bounds expanded by atan2(TILE/2, dist) per grass.
- [x] [bug] slash hitbox misses grass on left/down due to angle wraparound + single-shot check — wraparound-safe angle check (normalize d to [-π,π]); moved checkSlashHits into game loop, fires every sweep frame.
- [x] [feature] debug money cheat — M key in debug mode adds 100 gems.
- [x] [feature] slash debug recorder — per-frame sweep data logged to debugLog when debug active; exported via Download Log button.
- [x] [ux] auto-slash disable toggle — toggle button in shop panel; `autoSlashEnabled` bool gates auto-slash fire.
- [x] [bug] sword visual and debug arc don't match hitbox — sword visual used `TILE + level*10`, divergent from slashRange formula; debug arc drawn at `slashRange + 13` (grass-sprite-radius buffer). Fixed in src/render.js: swordLen = `player.slashRange - 9` (sweeping + retracting branches), debug arc radius = `player.slashRange`. Sword tip + arc edge now coincide at all levels.
- [x] [feature] world system (phases 1–4) — 1×3 multi-room world (rooms 0,0/0,1/0,2); `src/world.js` with room layouts, adjacency map, camera, transition state machine; `loadRoom(rx,ry)` + `clearGems()` for room loading; `drawTransition()` slide animation; edge detection, `startTransition`/`repositionPlayer`/`commitTransition` wired in `src/main.js`. Grass respawn, gem despawn, and screen transitions all verified working.
- [x] [bug] player starts in top room instead of bottom — initGrass() changed to loadRoom(0,2); world.js initial roomY=2.
- [x] [bug] gems disappear at transition start instead of end — clearGems() moved from startTransition() to update() just before commitTransition().
- [x] [bug] player and gems not rendered during transition slide — drawPlayer() given optional px/py params; drawTransition() now draws gems with old-room offset and player (at entry coords) with new-room offset.
- [x] [feature] debug grass spawn toggle — grassSpawnEnabled bool in main.js gates spawnGrass(); toggle button in debug overlay.
- [x] [feature] rock wall tiles on dead-end edges — getRockTiles(rx,ry) in world.js; drawRocks() in render.js (jagged polygon boulders); blockedAt() collision in main.js; rocks rendered in drawTransition() via oldRocks snapshot.
- [x] [ux] remove slash-count and grass-alive from main HUD — only gem count remains.
- [x] [feature] debt module + HUD (story phase 1) — src/debt.js with DEBT_TOTAL=500, debtRemaining, payDebt(), isDebtCleared(); "Debt: X / 500" shown in HUD.
- [x] [feature] intro flavor cutscene (story phase 2) — static black overlay on start; title + flavor lines + dismiss prompt; keydown/click sets introShown=true; game loop early-returns until dismissed.
- [x] [bug] pay-debt prompt reappears after win dismissed — condition now includes `!isDebtCleared()`.
- [x] [feature] payment zone in top room (story phase 3) — pulsing gold zone at room 0,0 center; proximity shows "Press E to pay debt" prompt; E key calls payDebt() → sets gameWon=true if debt cleared.
- [x] [bug] E re-triggers win screen after debt cleared — E handler now gates on `nearZone && !gameWon && !isDebtCleared()`; pressing E after win dismissed can no longer re-set gameWon.
- [x] [bug] win screen z-order + movement + slash leak — movement input, autoSlash trySlash(), and keydown Space/Z branch all wrapped in `if (!gameWon)`; drawDebug() moved after drawWinScreen().
- [x] [bug] stale debug arc when idle — drawDebug uses snapCardinal(player.facing) during idle state; slashCardinal only used during sweep/retract.
- [x] [bug] red arc angular bounds expanded to match sword extent — arc endpoints expanded by atan2(3, slashRange) on each side.
- [x] [bug] debug arc teleports during room transition — skips drawing arc when transition.active.
- [x] [bug] slash fires during win screen — Space/Z keydown handler wrapped in `if (!gameWon)`.
- [x] [refactor] hitbox system — src/hitbox.js with testPoint + drawHitbox; compound hitbox (wedge + rect end-caps); getSlashHitbox in player.js; grass.js uses testPoint; fixes close-range misses and down-facing arc direction.
- [x] [bug] auto-slash ignores facing direction — auto-slash now calls trySlash() on cooldown tick using player.cardinal, same as manual input. Removed nearest-grass search loop.
- [x] [refactor] remove density upgrade — grassCapacity/spawnGrass removed from grass.js; density removed from upgrades.js; btn-density removed from index.html and updateUI() defs.
- [x] [refactor] expand world to 3×3, rooms 10×8 — 9 rooms in src/world.js with full adjacency; tile-unit layouts, TILE-agnostic. (commit 4273fb7)
- [x] [refactor] separate logical viewport from render via SCALE — TILE=32, COLS=10, ROWS=8, W=320, H=256, SCALE=2 in src/constants.js; canvas DOM = W*SCALE × H*SCALE = 640×512; single `ctx.setTransform(SCALE,0,0,SCALE,0,0)` at top of loop() upscales all draw paths. PAYMENT_ZONE coords now W/2,H/2. Sim and sprite hardcodes stay logical px. (commit 72dc083)
- [x] [bug] rocks overlap and half-size after SCALE refactor — getRockTiles in src/world.js reverted to one rock per tile centered (pre-814a1bf form); half-tile-density was a TILE=64 workaround. (commit d413cfc)
- [x] [bug] intro screen text drew in top-left — ctx.setTransform was placed after the intro early-return; moved to first statement of loop() so drawIntro path also gets SCALE. (commit d413cfc)
- [x] [bug] intro text oversized for logical viewport — drawIntro in src/render.js: fonts halved (48/18/14 → 24/12/10) and y positions halved (140/230/262/360 → 70/115/131/180) to fit 320×256. (commit 32f88df)
- [x] [refactor] remove dark ground patches in drawGround — deleted 5-entry patches array, the `rgba(0,0,0,0.08)` fillStyle line, and the ellipse loop. Ground is base fill + gridlines only. (commit 32f88df)
- [x] [feature] per-tile ground color variation — splitmix32 hash of (roomX, roomY, c, r) drives per-tile `hsl(95±1.5°, 49±2%, 25±1.5%)` fillRect in drawGround. drawGround now accepts optional (rx, ry) params; transition draws old screen with `transition.oldRX/oldRY` (captured in world.js triggerTransition) and new screen with `transition.toRX/toRY` so tints are correct from frame 0 on both sides. (commits 6aed6ac, c0d8ef4, 4276140, f7c899c)
- [x] [feature] mobile controls (touch) — free-angle virtual joystick on left half (state struct with unit vector, NOT keys[]), tap-to-slash on right half (no aim). `drawJoystick()` overlay in src/render.js (base ring + thumb dot, screen-space). `@media (max-width: 720px)` responsive CSS bump. `touch-action: none` + `preventDefault()` with `{passive:false}` to suppress synthetic-click double-fire. v1 8-way snap was rejected; v2 final. See `plans/mobile-controls.md`.
- [x] [bug] mobile text small on phones — missing `<meta name="viewport" content="width=device-width, initial-scale=1">` in `<head>`; without it mobile layout viewport defaults to ~980 CSS px so `max-width: 720px` media query never matched. Added meta tag.
- [x] [bug] joystick visual disappears during room transitions — `drawJoystick(joystick)` call only existed in non-transition branch of `loop()`; added second call inside `if (transition.active)` branch after `drawFloats()`.
- [x] [feature] map editor tool — Node.js editor at `localhost:5173`. Phase 1: world data extracted to `src/world-data.json`; `src/world.js` imports it. Phase 2: `editor/server.js` vanilla Node http module, serves `editor/index.html` + `GET /world-data.json` + `POST /save` writing back to disk; `npm run editor` script. Phase 3: vanilla HTML/JS editor UI — 3×3 room selector, 10×8 tile grid (click toggles grass), border strips (auto-symmetric connection toggle), dirty tracking, Save button with timestamped status. Follow-up work in TODO (rocks-as-data + real sprite render).
- [x] [refactor] rocks as data, delete worldMap — rocks now explicit `{col,row}[]` per room in `src/world-data.json`; `worldMap` deleted. `getNeighbor` derives adjacency from room key presence in 3×3 grid; `getRockTiles` reads explicit `rocks` array. Public signatures preserved → `src/main.js` and `src/render.js` untouched. All 9 rooms backfilled (counts: corners 17, single-side walls 8 or 10, room 1,1 has 0). Editor patched (commit cb0ecaa) to no-op connection toggle without crash. Gameplay verified byte-identical. Border-grass-invisible bug fix is logical consequence — acceptance test rides on editor rocks-paint feature.
