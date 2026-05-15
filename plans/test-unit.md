# Unit Test Layer

Status: **decisions locked.** Ready to dispatch when manager picks up the implementation TODO.

## Goal

Fast (ms-range) test layer for pure-logic modules. Today every "assertion test" in this repo is Playwright E2E (~2-5s each, boots Chromium). Unit layer covers pure functions (math, lookups, state-machine transitions) at ms cost, with bias toward keeping liberally.

## Decisions (locked)

| Decision | Value |
|---|---|
| Runner | Vitest |
| DOM environment | **No jsdom** — force pure-function discipline; refactor `src/constants.js` to defer DOM lookup |
| `npm test` | Unit (industry convention; break existing `npm test` = Playwright) |
| `npm run e2e` | Playwright default project |
| `npm run review` | Playwright visual project |
| CI gate | Unit tests gate deploy — fail fast |
| Default lifetime | Always keep |
| Dev may delete? | **No** — manager only |
| Dev may update? | Yes |

## Three-tier overview (full policy in CLAUDE.md)

| Tier | Per-test cost | Default lifetime | Dev delete? |
|---|---|---|---|
| Unit (Vitest, Node) | ~1-10 ms | Always keep | No |
| E2E (Playwright) | ~1-5 s | Default keep | No |
| Visual (Playwright + video) | ~10-30 s | Default delete | No (dev recommends, manager actions) |

## Refactor: split `src/constants.js`

Today `src/constants.js` does `canvas = document.getElementById('game')` and `ctx = canvas.getContext('2d')` at module top. Every module that imports constants triggers DOM lookup on import. Blocks pure-Node unit tests.

**Split:**

```js
// src/geometry.js (new, pure data, no DOM)
export const TILE = 32;
export const COLS = 10;
export const ROWS = 8;
export const W = COLS * TILE;
export const H = ROWS * TILE;
export const SCALE = 2;
```

```js
// src/canvas.js (new, DOM init, called from main only)
import { W, H, SCALE } from './geometry.js';
export let canvas, ctx;
export function bootCanvas() {
  canvas = document.getElementById('game');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  ctx = canvas.getContext('2d');
  return { canvas, ctx };
}
```

Update all `import { ... } from './constants.js'` callsites:
- Pure geometry users (player.js, grass.js, etc.) → import from `./geometry.js`
- Canvas/ctx users (render.js, main.js) → import `bootCanvas` from `./canvas.js`, call once at boot

`src/constants.js` becomes empty / deleted (or kept as re-export shim during transition).

Dispatch as a refactor-only TODO first; unit tests follow once geometry is importable in Node.

## File list (after refactor)

### `vitest.config.js` (new)

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
  },
});
```

### `package.json` — script changes

```json
"scripts": {
  "start": "node scripts/dev.js",
  "dev": "npx esbuild src/main.js --bundle --outfile=bundle.js --watch",
  "build": "npx esbuild src/main.js --bundle --outfile=bundle.js",
  "editor": "node editor/server.js",
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test --project=default",
  "e2e:headed": "playwright test --project=default --headed",
  "e2e:debug": "playwright test --project=default --debug",
  "review": "playwright test --project=visual"
}
```

Old `"test": "playwright test"` and friends move to `e2e:*`.

DevDeps: add `vitest`.

### `tests/unit/example.test.js` — template

```js
import { describe, it, expect } from 'vitest';
import { upgrades, getUpgradeCost } from '../../src/upgrades.js';

describe('getUpgradeCost', () => {
  it('returns baseCost at level 0', () => {
    upgrades.gemMult.level = 0;
    expect(getUpgradeCost('gemMult')).toBe(upgrades.gemMult.baseCost);
  });

  it('scales by costMult per level', () => {
    upgrades.gemMult.level = 2;
    const expected = Math.floor(
      upgrades.gemMult.baseCost * upgrades.gemMult.costMult ** 2
    );
    expect(getUpgradeCost('gemMult')).toBe(expected);
  });
});
```

(Final shape depends on what `getUpgradeCost` actually exports — dev verifies during impl.)

### `.github/workflows/deploy.yml` — gate

Add unit-test step before build:

```yaml
- run: npm ci
- run: npm test
- run: npm run build
- ...deploy...
```

## Initial unit-test targets (suggested, not mandatory)

Pure-logic modules safe to test once `geometry.js` is split:

- `src/upgrades.js` — `getUpgradeCost`, level math, cap enforcement
- `src/debt.js` — `payDebt`, `isDebtCleared`
- `src/player.js` `snapCardinal(angle)` — 8-way → cardinal mapping
- `src/hitbox.js` `testPoint` — geometry, deterministic
- `SLASH_ARCS` / `SLASH_TILES` lookups — array shape sanity

Defer DOM-touching modules (grass.js, gems.js, main.js, render.js) to E2E layer.

## Dispatch sequence

1. **Refactor: split constants.js → geometry.js + canvas.js.** Manager dispatches dev. `verify: test` slice = build still works (existing E2E covers full boot); could add a unit test asserting `geometry.js` exports W/H/SCALE/TILE numeric values. Risk: every `import { ... } from './constants.js'` needs updating. Use `Grep` to enumerate before edit.
2. **Add Vitest config + script split.** Manager dispatches dev. Add `vitest.config.js`, rename Playwright scripts, add `tests/unit/example.test.js`, update `.github/workflows/deploy.yml` to gate on `npm test`. `verify: test` = the example unit test itself passes.
3. **Backfill unit tests opportunistically** as new TODOs touch pure-logic modules. No bulk-add pass.

## Out of scope

- Mocks for DOM/canvas (no jsdom = no mocks).
- Coverage targets.
- Cross-runtime (Deno, Bun).
- Property-based / fuzz testing.

## Open Qs (deferrable)

- **Should we run unit tests on every push, or only on PR?** Lean every push — they're ms, cost is zero.
- **Should `npm run all` exist?** (unit + E2E sequential.) Defer until someone wants it.

## Dependencies

None blocking. Test harness is already shipped (commit `39a31a7`). This plan is independent.
