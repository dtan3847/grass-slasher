# Grass Slasher — TODO

Completed items → `DONE.md`

## Format
```
- [ ] [type] short title — context/why.
- [~] [type] short title — built, awaiting browser verify.
```
Types: `bug` `feature` `ux` `refactor`
States: `[ ]` open → `[~]` built/unverified → move to `DONE.md` when verified

---

## Open

- [ ] [feature] per-tile ground color variation — symptom: ground reads flat/dull after dark patches removed. fix: subtle deterministic per-tile tint overlay. In `src/render.js` `drawGround`, after the base `fillRect`, loop COLS×ROWS tiles and apply small `rgba` overlay (±~4% brightness) per tile. Use deterministic hash of `(roomX, roomY, c, r)` so tints stay stable per tile but differ across rooms. No state, no extra storage. Imports needed: add `COLS, ROWS` to constants.js import; add `roomX, roomY` to world.js import.

- [ ] [bug] player sprite/shadow renders over bottom rocks — symptom: player drawn on top of rock sprites at room edges, looks like walking on rocks. diagnosis (pre-existing): `blockedAt` in `src/main.js` uses `halfSum = 7 + 11 = 18` for both grass and rocks; rock sprite radius is ~13 logical px and player visible extent reaches ~14 below center, so collision stops player only after sprites already visually overlap. fix: separate rock collision from grass — in `blockedAt`, use `halfSum = 18` for grasses but `halfSum = 25` (= ~12 player + ~13 rock) for rocks. Or alternatively introduce named constants `PLAYER_HALF = 11`, `GRASS_HALF = 7`, `ROCK_HALF = 13` for clarity.

- [ ] [bug] auto-slash blocks E key pay-debt — symptom: pressing E near payment zone does nothing when auto-slash is active. diagnosis: E keydown handler (src/main.js line 322) gates on `player.slashState === 'idle'`; auto-slash keeps state in sweeping/retracting continuously so check never passes. fix: remove `player.slashState === 'idle'` from the E condition — debt payment has no slash-state dependency. src/main.js only.

- [ ] [feature] regrowth upgrade — grass currently regrows always; gate respawn on new upgrade. Add `regrowth: { level: 0, baseCost: 60, costMult: 1.0, maxLevel: 1 }` to `src/upgrades.js` (maxLevel 1 = one-time unlock, costMult irrelevant). In `src/main.js` respawn loop (around line 203), change condition to `if (grassSpawnEnabled && upgrades.regrowth.level > 0)`. Add shop button `id="btn-regrowth"` to `index.html` shop div (`onclick="buyUpgrade('regrowth')"`, label "🌱 Regrowth"). Add to `updateUI()` defs array: `['btn-regrowth', 'regrowth', lvl => '🌱 Regrowth', 1]`. Remove "Grass regrows automatically" from hints text in index.html (no replacement). Files: `src/upgrades.js`, `src/main.js`, `index.html`.

- [ ] [ux] hide auto-slash toggle until auto-slash is purchased — toggle button `btn-autoslash-toggle` always visible even at level 0. Fix: in `updateUI()` (`src/main.js` ~line 248), add `toggleBtn.style.display = upgrades.autoSlash.level > 0 ? '' : 'none';`. Also set `style="display:none"` on the button in `index.html` as initial state. Files: `src/main.js`, `index.html`.

- [ ] [feature] map editor tool — Node.js local server that lets you edit world layout and save directly to `src/world.js`. Approach: (1) Extract ROOMS + WORLD_MAP data out of `src/world.js` into `src/world-data.json`; update `world.js` to import and use it. (2) Create `editor/server.js` (Node.js, no framework) serving `editor/index.html` + a `POST /save` endpoint that writes `src/world-data.json`. (3) Editor UI: shows 3×3 room grid; click room to select; shows 10×8 tile grid where click toggles grass; click room borders to toggle neighbor connections. Save button POSTs updated JSON. (4) Add `"editor": "node editor/server.js"` to `package.json` scripts. Dev must not use any npm packages not already in the project; vanilla Node.js `http` module only.

- [ ] [ux] sprite facing direction — up and down look same; fix: when facing up (sin(facing) < -0.5) draw back of head (hat from behind, no eyes, hair bump visible). Separately: make head and eyes bigger, anime style, for all directions. Left/right already distinct via eye x-offset.
- [ ] [ux] differentiate repeatable vs one-time upgrades visually in shop.
- [ ] [feature] magnet upgrade — gems within range auto-collected; upgrade increases range.

## Known intentional quirks (do not fix)

- slash-during-room-transition allowed by design — feels fine, kept as unintended feature

## Proposals (need decision)

- ? hold-to-slash vs charge slash tech tree — two separate upgrade paths rather than one linear tree?
