# Test Harness — TDD utility

## Goal

Per-change test scaffold for TDD workflow. Dev writes one failing test before each code change, verifies test fails, makes change, verifies test passes. **Not** a regression suite — no CI auto-run, no broad coverage goal, tests live and die with the change they were written for (or get pruned).

Browser-driven via Playwright + Chromium headless. In-page hooks attached to `window.__test` so tests assert on real game state, not pixel diffs.

## Non-goals

- No CI integration on push.
- No regression suite — old tests may be deleted freely.
- No coverage targets.
- No visual diffing (sibling `test-visual-review.md` plan).
- No cross-browser, no mobile viewport, no perf benchmarks.

---

## Verified facts (read pass complete)

### Bundle / build

- `package.json` build = `npx esbuild src/main.js --bundle --outfile=bundle.js`. No `--format` flag → esbuild defaults to **IIFE** for browser entry. All `export`s wrap in closure — `window.player`, `window.grasses` etc. are **NOT** reachable from outside the bundle. Hooks must run *inside* the bundle.
- `index.html` loads `<script src="bundle.js">` from same dir. No HTTP server required — `file://index.html?test=1` opens game directly in any browser.
- Already on window from `main.js:10-11`: `window.buyUpgrade`, `window.toggleAutoSlash`. Same pattern works for `window.__test`.

### Game loop / time

- `main.js:269` `loop()` = `update(); ...draw...; requestAnimationFrame(loop)`. One `update()` per rAF tick. `frameCount` increments inside `update()` (line 101).
- No `dt` — every frame is one fixed-step sim tick. Real-time pacing only via rAF browser cadence (~16.7ms / 60fps, unstable when tab unfocused).
- `update()` is NOT exported. To drive sim deterministically from tests, we attach `update` to `window.__test.tick` from inside `main.js` where it's in scope.

### Input handlers (main.js:324-351)

- `document.addEventListener('keydown', e => ...)` reads `e.code` only (`'Space'`, `'KeyE'`, `'KeyZ'`, `'ArrowLeft'`, `'ArrowRight'`, `'ArrowUp'`, `'ArrowDown'`, `'KeyW'`, `'KeyA'`, `'KeyS'`, `'KeyD'`, `'Backquote'`, `'KeyM'`, `'Enter'`).
- Hold-to-move uses `keys[e.code] = true/false` flags read in `update()` line 128-131.
- `e.preventDefault()` only for `Space`/`KeyZ` — synthetic `KeyboardEvent` not cancellable, fine.
- Synthetic events: `document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))` triggers handler correctly. `e.repeat` defaults to `false` so `KeyE` and `Space` gates pass.
- `introShown` (main.js:13) blocks game until any keydown. Tests must dismiss before doing anything — either `__test.skipIntro()` helper or dispatch a no-op keydown first.

### Module state — mutability constraint (NEW finding)

`export let` bindings are live-read across modules but **NOT cross-module-assignable**. Affected vars:

- `gemCount` (gems.js:7)
- `debtRemaining` (debt.js:4)
- `roomX`, `roomY` (world.js — exported, used in main.js)
- `gameWon` (main.js:21)
- `slashQueued`, `slashCount` (player.js)
- `introShown` (main.js:13 — module-private, no export)

**Reading**: getter pattern works (`get gemCount() { return gemCount; }` inside the module that owns it, or from `main.js` for `gameWon` / `introShown`).

**Writing**: each module needs an explicit setter export, or tests rely on existing mutators (`addGems`, `payDebt`, `triggerTransition`).

For initial harness: ship getters only + reuse existing mutators (`addGems`, `spawnGem`, `buyUpgrade`). Setters added as TDD demand surfaces. Cheap to extend.

### Mutable object state — directly mutable

- `player` (player.js:37) is a `const` object — fields freely assignable: `player.x = 100`, `player.slashState = 'idle'` etc.
- `grasses` array (grass.js:9): `grasses.length = 0; grasses.push({...})` works.
- `gems` array (gems.js:5): same.
- `upgrades` object (upgrades.js:3): `upgrades.autoSlash.level = 3` works.

### Existing patterns to imitate

- Debug log download (main.js:316-322) — uses `Blob` + `URL.createObjectURL`. Test artifact dumps can follow.
- `keys` object (main.js:23) cleared on `keyup`. Tests should pair `keydown`/`keyup` or use `press()` helper.

---

## Architecture

### File 1: `src/test-hooks.js` (new)

Single function, no side effects unless called. `main.js` calls it conditionally.

```js
// src/test-hooks.js
import { player } from './player.js';
import { grasses } from './grass.js';
import { gems, gemCount, addGems, spawnGem } from './gems.js';
import { upgrades, buyUpgrade } from './upgrades.js';
import { debtRemaining, DEBT_TOTAL, payDebt } from './debt.js';
import { roomX, roomY } from './world.js';

export function installTestHooks({ tick, skipIntro, getFrameCount, getGameWon }) {
  window.__test = {
    // direct refs (objects/arrays — safe to mutate)
    player, grasses, gems, upgrades,

    // live-read getters for `let`-bound state
    get gemCount()      { return gemCount; },
    get debtRemaining() { return debtRemaining; },
    get debtTotal()     { return DEBT_TOTAL; },
    get roomX()         { return roomX; },
    get roomY()         { return roomY; },
    get gameWon()       { return getGameWon(); },
    get frame()         { return getFrameCount(); },

    // input
    keydown(code) { document.dispatchEvent(new KeyboardEvent('keydown', { code })); },
    keyup(code)   { document.dispatchEvent(new KeyboardEvent('keyup',   { code })); },
    press(code)   { this.keydown(code); this.keyup(code); },

    // time
    tick(n = 1) { for (let i = 0; i < n; i++) tick(); },

    // helpers
    skipIntro,
    addGems,
    spawnGem,
    buyUpgrade,
    payDebt,
    teleport(x, y) { player.x = x; player.y = y; },
    clearGrasses() { grasses.length = 0; },
    setUpgradeLevel(id, lvl) { upgrades[id].level = lvl; },
  };
}
```

### File 2: `src/main.js` edit

At top of file, after existing imports:

```js
import { installTestHooks } from './test-hooks.js';
```

After `update()` definition (line ~233), before `updateUI`:

```js
if (new URLSearchParams(location.search).has('test')) {
  installTestHooks({
    tick: update,
    skipIntro: () => { introShown = true; },
    getFrameCount: () => frameCount,
    getGameWon: () => gameWon,
  });
}
```

Esbuild tree-shakes nothing (no `--minify` or `--tree-shaking` flag, IIFE bundle), so `test-hooks.js` adds ~1KB to prod bundle. Acceptable. If size matters later, gate the import behind build-time `--define:TEST=true` and a `if (TEST)` wrapper.

### File 3: `playwright.config.js` (new)

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx http-server -p 8080 -c-1 -s',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
  },
  reporter: 'list',
});
```

`http-server` is one-line zero-config static. Add as devDep.

Alternative: `file://` URL, no server. Works for IIFE bundle. Drop `webServer` if we prefer that. **Lean http-server** — Playwright `baseURL` + path concat is cleaner than absolute `file://` paths, and Chromium has `file://` security quirks (no `URLSearchParams` issue, but `fetch` etc. break if game ever adds them).

### File 4: `tests/example.spec.js` (template)

```js
import { test, expect } from '@playwright/test';

test('slash kills grass directly to the right', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.player.x = 100;
    t.player.y = 100;
    t.player.facing = 0; // right
    t.player.slashState = 'idle';
    t.grasses.push({
      x: 130, y: 100, alive: true,
      respawnTimer: 0, respawnTime: 999999,
      hue: 100, flip: false,
    });
    t.press('Space');
    t.tick(20); // sweep is 8 frames + retract 5 — 20 is safe margin
  });

  const alive = await page.evaluate(() => window.__test.grasses[0].alive);
  expect(alive).toBe(false);
});
```

### File 5: `package.json` edits

Add devDeps + scripts:

```json
"devDependencies": {
  "esbuild": "latest",
  "@playwright/test": "^1.48.0",
  "http-server": "^14.1.1"
},
"scripts": {
  ...existing...,
  "test": "playwright test",
  "test:headed": "playwright test --headed",
  "test:debug": "playwright test --debug"
}
```

First-time install: `npm install` then `npx playwright install chromium` (downloads Chromium binary, ~150MB, one-time).

### File 6: `.gitignore`

Append:

```
playwright-report/
test-results/
/playwright/.cache/
```

---

## TDD workflow (the actual use case)

1. User: "fix bug X" / "add feature Y".
2. Manager spawns dev with TDD instruction in prompt.
3. Dev:
   - Writes `tests/bug-x.spec.js` asserting expected post-fix behavior.
   - Runs `npm test -- bug-x` → red (test fails as expected).
   - Edits `src/`.
   - Runs `npm test -- bug-x` → green.
   - Commits src + test together. May delete the test in same commit if it was a throwaway driver, OR keep if it's a useful regression anchor (dev's judgment).
4. Test may be deleted by any later dev that touches same code if no longer relevant.

`grass-slasher-dev` agent definition needs a one-line addition: "if you write tests, place them in `tests/` and use the `window.__test` hooks. Run `npm test -- <pattern>` to verify."

---

## Edge cases the harness must handle

- **Intro screen blocks all input until first keydown.** Hook exposes `skipIntro()` rather than dispatching a sacrificial keydown (which could collide with test setup state).
- **`requestAnimationFrame` still runs in background** while tests drive `tick()` directly. Means draw + UI update keep happening at ~60fps real-time. Side effects: `frameCount` increments via `tick()`, but `loop` does NOT call `update` directly — wait, **read again**: `loop()` (main.js:276) DOES call `update()`. So rAF triggers update too. Tests cannot pause rAF without instrumenting `loop`.
  - **Resolution**: For per-change TDD, this is fine. Tests set up state, fire input, then call `__test.tick(N)` to *advance further* deterministically; the rAF drift between setup and tick is negligible (1-2 frames). For perfectly deterministic tests, add a future `__test.pauseLoop()` that cancels rAF — defer until needed.
- **Auto-slash** (player.autoSlashCooldown ticks every frame) — tests that don't want auto-slash interfering must `upgrades.autoSlash.level = 0` or `autoSlashEnabled = false` (via toggle).
- **Grass respawn timers** — `respawnTime: 300 + Math.random()*180` per grass. Tests that need grass dead should set `respawnTime: 999999` on inserted grasses.
- **Player default spawn** is mid-screen (player.js:38). Tests usually want to teleport first.

---

## Open Qs

- **Server**: http-server (one devDep, ~5MB) vs `file://` (zero deps, weird quirks). **Lean http-server.**
- **Hook gating**: runtime `?test=1` (always in bundle, ~1KB cost) vs build-time `--define:TEST=true` (tree-shake out of prod). **Lean runtime** — cost is negligible, simpler.
- **Test deletion policy**: write-and-delete (pure throwaway) vs keep-as-regression-anchor. **Dev's judgment per test, no rule.**
- **`__test.pauseLoop()`** helper: ship now or defer? **Defer** until a test actually needs it.

---

## Out of scope

- Cross-browser (Chromium only).
- Mobile viewport / touch input tests.
- Visual snapshot diffs (see `test-visual-review.md`).
- Performance / FPS benchmarks.
- Editor tests (`editor/` is a separate tool).
- Setters for every `export let` — add as needed, not preemptively.

---

## Dispatch checklist (when this plan ships)

Dev's spawn should include:
- Add `@playwright/test` + `http-server` to devDeps, run `npm install` + `npx playwright install chromium`.
- Create `src/test-hooks.js` per spec above.
- Edit `src/main.js` to import + conditionally call `installTestHooks`.
- Create `playwright.config.js`, `tests/example.spec.js`, append to `.gitignore`.
- Add 3 scripts to `package.json`.
- Run `npm test` to verify example test passes.
- Run `npm run build` to verify prod bundle still works.
- Commit. Do NOT touch `grass-slasher-dev.md` agent prompt — manager will update separately if needed.
