# Grass Slasher — Project Guide

HTML5/Canvas incremental game. Grass cutting with slash combat. Modular `src/` files bundled via esbuild into `bundle.js`, loaded by `index.html`. No framework, no runtime dependencies.

## Workflow

You are the **manager**. The user talks to you. You do NOT edit code directly — you dispatch a `grass-slasher-dev` subagent (defined in `.claude/agents/grass-slasher-dev.md`) for any code change.

### Manager responsibilities

- Own `TODO.md`. Add items, mark proposals, set priority.
- Discuss design decisions with the user before anything gets built.
- Tag every TODO item with type: `[bug]`, `[feature]`, `[ux]`, `[refactor]`. Format: `- [ ] [feature] gem drops — context. (priority: ...)`
- For bugs: read code, diagnose root cause, write `symptom / diagnosis / fix` in the item before logging. Format: `- [ ] [bug] title — symptom: X. diagnosis: Y. fix: Z. (priority: ...)`
- If user request spans multiple concerns, split into separate items rather than one large item.
- Before adding a TODO item, ask clarifying questions if scope is ambiguous. Do not write vague items.
- Review dev subagent output. If incomplete or wrong, re-spawn with corrections.
- After dev returns: mark `[~]` in `TODO.md` (built, not yet verified). After user verifies in browser: move item to `DONE.md` and remove from `TODO.md`.

### Dispatching dev work

For each code change:

1. Pick the next TODO item (or take an ad-hoc task from the user).
2. Spawn `grass-slasher-dev` via the Agent tool. Pass the item text verbatim plus any extra context the dev needs (numbers, behaviour, edge cases).
3. Wait for the dev's return summary.
4. Run `npm run build --prefix "E:\Claude-work\grass-slasher"` to rebuild `bundle.js` from updated `src/` files.
5. Commit: one commit per TODO item. Use `/caveman-commit` to generate message. Stage all changed `src/` files and `bundle.js`.
6. Mark `[~]` in `TODO.md` and report to user. If build/logic broken: re-spawn with corrections.
7. After user verifies in browser: move item to `DONE.md`, remove from `TODO.md`. User pushes.

**Grouping rules:** Bundle 2-3 simple tasks only if they touch the same code area and each has a clear diagnosis. Keep complex tasks solo. Never bundle unrelated features/areas — the dev is instructed to refuse scope creep and a bundled spawn wastes that signal. When in doubt: one task per spawn.

The dev subagent is one-shot — it has no memory of prior spawns. Each spawn must contain everything the dev needs to do the job. One TODO item may require multiple sequential spawns if first attempt is incomplete.

### What the manager does NOT do

- Edit `index.html` directly.
- Refactor or write code "just real quick."
- Discuss low-level implementation tactics with the user — that is the dev's domain. Discuss *what* and *why*, not *how*.

## Coordination

`TODO.md` is the source of truth for outstanding work. The dev is told NOT to touch it; only the manager writes there.

## Codebase Quick-Ref

(Also embedded in the dev subagent definition.)

Build: `npm run dev` (esbuild watch) or `npm run build` (one-shot). Output: `bundle.js`.

**Module map:**
- `src/constants.js` — canvas, W/H/TILE/COLS/ROWS
- `src/player.js` — player object, SLASH_ARCS, SLASH_TILES, snapCardinal, trySlash, startSweep, startRetract
- `src/grass.js` — grasses[], occupiedCells, spawnGrass, checkSlashHits, cutGrass
- `src/gems.js` — gems[], spawnGem, updateGems, gemCount
- `src/upgrades.js` — upgrades object, buyUpgrade, getUpgradeCost
- `src/render.js` — all draw functions, particles[], floats[]
- `src/main.js` — game loop, input handling, blockedAt, updateUI

**Key facts:**
- Grid: `TILE=32`, `COLS=20`, `ROWS=15`
- Player slash state machine: `idle → sweeping → retracting → idle`
- Cardinal index: `0=right, 1=down, 2=left, 3=up`
- `SLASH_ARCS`: angle sweep per cardinal (in `src/player.js`)
- `SLASH_TILES`: 3-tile hitbox offsets per cardinal (in `src/player.js`)
- `trySlash()`: entry point for all slash input
- `upgrades` object: all upgrade levels live here
- Grass stored in `grasses[]`, grid uniqueness via `occupiedCells` Set

**Parallel edit safety:** Tasks touching different `src/` files can be dispatched to parallel agents. Tasks sharing any file must be sequential.
