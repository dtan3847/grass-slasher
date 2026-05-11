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

- [x] [bug] slash fires during win screen — symptom: Space/Z keydown handler still calls trySlash() when gameWon is true despite movement being blocked. diagnosis: dev wrapped movement block and in-loop autoSlash trySlash() in `if (!gameWon)` but left the keydown Space/Z handler ungated. fix: find the Space/Z keydown branch in src/main.js and wrap the trySlash() call with `if (!gameWon)`. file: src/main.js only. (priority: med)

- [~] [bug] debug arc teleports during room transition — symptom: after dev fix (using transition.playerEntryX/Y), arc jumps position instead of sliding with player. diagnosis: transition slide is a canvas pan (ctx.translate) applied inside drawTransition(); drawDebug() runs after canvas restore so playerEntryX/Y is raw canvas coords, not panned coords — arc never matches sprite position during slide. fix: in drawDebug (src/render.js), skip drawing entirely when transition.active (arc during brief room slide has no gameplay value). src/render.js only. (priority: low)



- [ ] [refactor] hitbox system — new `src/hitbox.js` with `testPoint(part, dx, dy, sweepAngle)` + `drawHitbox(parts, ctx, ox, oy)`; hitbox = array of typed shape parts (wedge + rect); `getSlashHitbox(cardinal)` in player.js returns compound [wedge, startRect, endRect]; grass.js uses testPoint; main.js owns cap timing (frame 1 = start cap, last frame = end cap); render.js draws full preview via drawHitbox. Fixes close-range misses (caps) and down-facing arc direction (getSlashHitbox reads lastHorizDir at call time). See `plans/hitbox-system.md` for full spec. Files: src/hitbox.js (new), src/player.js, src/grass.js, src/main.js, src/render.js. (priority: med)

- [ ] [bug] auto-slash ignores facing direction — auto-slash picks slash direction by targeting nearest grass rather than using player facing. fix: in auto-slash fire logic (`src/main.js`), call `trySlash(player.cardinal)` (same as manual input) instead of computing nearest-grass direction. Remove any nearest-grass targeting code. (priority: med)

- [ ] [ux] sprite facing direction — up and down look same; fix: when facing up (sin(facing) < -0.5) draw back of head (hat from behind, no eyes, hair bump visible). Separately: make head and eyes bigger, anime style, for all directions. Left/right already distinct via eye x-offset. (priority: low)
- [ ] [ux] differentiate repeatable vs one-time upgrades visually in shop. (priority: low)
- [ ] [feature] magnet upgrade — gems within range auto-collected; upgrade increases range. (priority: low)

## Story / debt arc (phases 1–4, sequential)


 — on game start (before first frame), show canvas overlay: title "GRASS SLASHER", then flavor lines "You owe 500 gems to the Grass Baron." / "Slash grass. Collect gems. Repay your debt." / "Click or press any key to begin." Dismiss on click or keydown → sets `introShown = true`, game loop starts. `introShown` flag in `src/main.js`; `drawIntro()` added to `src/render.js`; loop blocked until dismissed. (priority: med)


- [ ] [feature] win screen (story phase 4) — `gameWon` bool in `src/main.js`. When true, after normal draw, overlay `drawWinScreen()` from `src/render.js`: semi-transparent black fill, text "Debt repaid." / "The Grass Baron nods slowly." / '"You are free... for now."' / "[ Continue exploring ]" button rect. Click on button or press Enter → `gameWon = false`, game resumes. No state reset — world/gems/upgrades persist. (priority: med)

- [ ] [feature] regrowth upgrade — grass currently regrows always; gate respawn on new upgrade. Add `regrowth: { level: 0, baseCost: 60, costMult: 1.0, maxLevel: 1 }` to `src/upgrades.js` (maxLevel 1 = one-time unlock, costMult irrelevant). In `src/main.js` respawn loop (around line 203), change condition to `if (grassSpawnEnabled && upgrades.regrowth.level > 0)`. Add shop button `id="btn-regrowth"` to `index.html` shop div (`onclick="buyUpgrade('regrowth')"`, label "🌱 Regrowth"). Add to `updateUI()` defs array: `['btn-regrowth', 'regrowth', lvl => '🌱 Regrowth', 1]`. Remove "Grass regrows automatically" from hints text in index.html (no replacement). Files: `src/upgrades.js`, `src/main.js`, `index.html`. (priority: med)

- [ ] [ux] hide auto-slash toggle until auto-slash is purchased — toggle button `btn-autoslash-toggle` always visible even at level 0. Fix: in `updateUI()` (`src/main.js` ~line 248), add `toggleBtn.style.display = upgrades.autoSlash.level > 0 ? '' : 'none';`. Also set `style="display:none"` on the button in `index.html` as initial state. Files: `src/main.js`, `index.html`. (priority: med)

## Known intentional quirks (do not fix)

- slash-during-room-transition allowed by design — feels fine, kept as unintended feature

## Proposals (need decision)

- ? hold-to-slash vs charge slash tech tree — two separate upgrade paths rather than one linear tree?
