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

- [ ] [bug] stale debug arc when idle — symptom: red debug arc shows previous slash direction during idle, not the upcoming slash direction. If player rotates facing between slashes, arc misleads about where next slash will land. diagnosis: `drawDebug` in src/render.js line 233 uses `SLASH_ARCS[player.slashCardinal]`; `player.slashCardinal` only updates inside `startSweep`, so during idle it holds the last slash's cardinal. fix: in `drawDebug`, when `player.slashState === 'idle'`, use `SLASH_ARCS[snapCardinal(player.facing)]` to preview the upcoming slash; during sweeping/retracting keep `player.slashCardinal`. file: src/render.js only. (priority: med)

- [ ] [bug] debug arc stays at old position during room transition — symptom: red arc draws at old player.x/y while player sprite draws at transition.playerEntryX/Y during slide. diagnosis: drawDebug uses player.x/y directly; player coords not updated to new room until last transition frame; drawPlayer already takes explicit coords. fix: in drawDebug (src/render.js), resolve `px = transition.active ? transition.playerEntryX : player.x` (same for y), use px/py for arc origin instead of player.x/y. src/render.js only. (priority: low)

- [ ] [bug] red arc angular bounds don't match sword sweep edges — symptom: red debug arc edges at exact cardinal arc bounds, but sword visual (width 6, half-width 3) sweeps slightly past those bounds. Arc looks slightly narrower than where sword actually swings/hits. diagnosis: `drawDebug` uses raw `arc.start`/`arc.start + arc.delta`; sword rect has perpendicular width so its leading/trailing edges extend by `atan2(3, slashRange)` rad past the arc endpoints. fix: in `drawDebug`, expand arc angular bounds by `Math.atan2(3, player.slashRange)` on each end (subtract from start side, add on end side respecting `arc.delta` sign). file: src/render.js only. (priority: low)



- [ ] [bug] auto-slash ignores facing direction — auto-slash picks slash direction by targeting nearest grass rather than using player facing. fix: in auto-slash fire logic (`src/main.js`), call `trySlash(player.cardinal)` (same as manual input) instead of computing nearest-grass direction. Remove any nearest-grass targeting code. (priority: med)

- [ ] [ux] sprite facing direction — up and down look same; fix: when facing up (sin(facing) < -0.5) draw back of head (hat from behind, no eyes, hair bump visible). Separately: make head and eyes bigger, anime style, for all directions. Left/right already distinct via eye x-offset. (priority: low)
- [ ] [ux] differentiate repeatable vs one-time upgrades visually in shop. (priority: low)
- [ ] [feature] magnet upgrade — gems within range auto-collected; upgrade increases range. (priority: low)

## Story / debt arc (phases 1–4, sequential)

- [~] [feature] debt module + HUD (story phase 1) — new `src/debt.js`: export `DEBT_TOTAL = 500`, `let debtRemaining`, `payDebt(amount)` (deducts from gemCount via imported addGems(-n) and from debtRemaining, clamps to 0), `isDebtCleared()`. Import in `src/main.js`, show "Debt: X / 500" in `updateUI()`. Add debt display element to `index.html` HUD. No payment logic yet. (priority: med)

- [ ] [feature] intro flavor cutscene (story phase 2) — on game start (before first frame), show canvas overlay: title "GRASS SLASHER", then flavor lines "You owe 500 gems to the Grass Baron." / "Slash grass. Collect gems. Repay your debt." / "Click or press any key to begin." Dismiss on click or keydown → sets `introShown = true`, game loop starts. `introShown` flag in `src/main.js`; `drawIntro()` added to `src/render.js`; loop blocked until dismissed. (priority: med)

- [ ] [feature] payment zone in top room (story phase 3) — add payment zone at center of room 0,0 (col 10, row 7 → pixel 320, 224). In `src/world.js` export `PAYMENT_ZONE = { rx:0, ry:0, px:320, py:224, radius:40 }`. In `src/render.js` add `drawPaymentZone()`: glowing gold circle (radial gradient, pulsing alpha via frameCount) with label "GRASS BARON" above. In `src/main.js` update(): when current room is 0,0 and player within 40px of zone center, show HUD prompt "Press E to pay debt"; on E keydown call `payDebt(gemCount)` then check `isDebtCleared()` → set `gameWon = true`. Draw zone in loop (inside camera translate block, only when in room 0,0). (priority: med)

- [ ] [feature] win screen (story phase 4) — `gameWon` bool in `src/main.js`. When true, after normal draw, overlay `drawWinScreen()` from `src/render.js`: semi-transparent black fill, text "Debt repaid." / "The Grass Baron nods slowly." / '"You are free... for now."' / "[ Continue exploring ]" button rect. Click on button or press Enter → `gameWon = false`, game resumes. No state reset — world/gems/upgrades persist. (priority: med)

## Known intentional quirks (do not fix)

- slash-during-room-transition allowed by design — feels fine, kept as unintended feature

## Proposals (need decision)

- ? hold-to-slash vs charge slash tech tree — two separate upgrade paths rather than one linear tree?
