# Refactor: Single-file → esbuild modules

**Goal:** Split `index.html` monolith into per-system JS files so agents can work in parallel without file conflicts.

**Status:** Planned

---

## Tooling

- esbuild via npm (no config file)
- Dev: `npx esbuild src/main.js --bundle --outfile=bundle.js --watch`
- `bundle.js` gitignored
- `index.html` stripped to shell, references `<script src="bundle.js">`

---

## Target structure

```
src/
  constants.js   — TILE, COLS, ROWS, W, H, canvas, ctx
  player.js      — player object, movement, slash state machine, trySlash()
  grass.js       — grasses[], occupiedCells, spawning, checkSlashHits
  gems.js        — gems[], drop physics, pickup, lifetime
  upgrades.js    — upgrades object, shop logic
  render.js      — all draw* functions
  main.js        — game loop, init, event listeners
index.html       — shell only
bundle.js        — esbuild output (gitignored)
```

---

## Steps (ordered — each depends on prior)

- [ ] 1. Add esbuild to package.json, add `bundle.js` to .gitignore
- [ ] 2. Extract `src/constants.js` — all top-level consts (TILE, COLS, ROWS, W, H, canvas, ctx, colors)
- [ ] 3. Extract `src/player.js` — imports constants; exports player object + trySlash + movement handlers
- [ ] 4. Extract `src/grass.js` — imports constants; exports grasses[], occupiedCells, spawnGrass, checkSlashHits
- [ ] 5. Extract `src/gems.js` — imports constants; exports gems[], spawnGem, updateGems, checkPickup
- [ ] 6. Extract `src/upgrades.js` — imports constants; exports upgrades object, shop open/close, applyUpgrade
- [ ] 7. Extract `src/render.js` — imports all above; exports drawAll
- [ ] 8. Extract `src/main.js` — imports all; game loop, init, event listeners
- [ ] 9. Strip `index.html` to shell, add `<script src="bundle.js">`
- [ ] 10. Smoke test — game loads, slash works, gems drop, shop opens

---

## Notes

- Each step = one dev spawn. Do not bundle steps.
- After each step: verify game still runs before next spawn.
- Constants must export before anything else imports them.
- `render.js` imports latest module state — pass by reference, not copy.
