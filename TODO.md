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

- [ ] [bug] red arc angular bounds don't match sword sweep edges — symptom: red debug arc edges at exact cardinal arc bounds, but sword visual (width 6, half-width 3) sweeps slightly past those bounds. Arc looks slightly narrower than where sword actually swings/hits. diagnosis: `drawDebug` uses raw `arc.start`/`arc.start + arc.delta`; sword rect has perpendicular width so its leading/trailing edges extend by `atan2(3, slashRange)` rad past the arc endpoints. fix: in `drawDebug`, expand arc angular bounds by `Math.atan2(3, player.slashRange)` on each end (subtract from start side, add on end side respecting `arc.delta` sign). file: src/render.js only. (priority: low)



- [ ] [bug] auto-slash ignores facing direction — auto-slash picks slash direction by targeting nearest grass rather than using player facing. fix: in auto-slash fire logic (`src/main.js`), call `trySlash(player.cardinal)` (same as manual input) instead of computing nearest-grass direction. Remove any nearest-grass targeting code. (priority: med)

- [ ] [ux] sprite facing direction — up and down look same; fix: when facing up (sin(facing) < -0.5) draw back of head (hat from behind, no eyes, hair bump visible). Separately: make head and eyes bigger, anime style, for all directions. Left/right already distinct via eye x-offset. (priority: low)
- [ ] [ux] differentiate repeatable vs one-time upgrades visually in shop. (priority: low)
- [ ] [feature] magnet upgrade — gems within range auto-collected; upgrade increases range. (priority: low)



## Known intentional quirks (do not fix)

- slash-during-room-transition allowed by design — feels fine, kept as unintended feature

## Proposals (need decision)

- ? hold-to-slash vs charge slash tech tree — two separate upgrade paths rather than one linear tree?
