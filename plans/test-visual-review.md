# Visual Review via Video Artifact

Status: **decisions locked.** Ready to dispatch when manager picks up the implementation TODO.

## Goal

User on phone, away from keyboard. For TODO items tagged `verify: visual` (or the visual slice of `verify: mixed`), dev produces a `.webm` video of the change in action. User watches video on phone, decides pass/fail, directs next step.

Claude does NOT consume video. Video is for the user only.

## Non-goals

- Not a regression suite. Specs exist primarily to capture *that* change, but stay around as cheap documentation + rerunnable baseline.
- Not auto-trigger on every push — only when `tests/visual/**` changes.
- Not local-run primary path. Local works (`npm run review`), but the canonical "user on phone" flow is GitHub Actions artifact.
- No screenshots, no PNG capture, no Claude-side visual inspection.

## Architecture (locked)

- Per-feature Playwright spec under `tests/visual/<feature-slug>.spec.js`.
- Spec uses same `window.__test` hooks as the TDD harness — same boot pattern (`page.goto('/?test=1')`, `waitForFunction(() => window.__test)`).
- Spec drives inputs through the scenario. **No `expect()` calls** — pure capture.
- Playwright `video: 'on'` records entire run as `.webm`.
- Viewport: full page (game canvas + DOM shop + debt prompt all visible).
- Header comment `// expect: <what user should see>` documents intent for future viewings.
- GitHub Actions workflow `.github/workflows/visual-review.yml` runs on push when `tests/visual/**` changes, or manual via `workflow_dispatch`. Workflow uploads `test-results/` as artifact.
- User opens GitHub Actions tab on phone → latest run → artifact ZIP → extract → watch.

## File list

### `playwright.config.js` — add `visual` project

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
    viewport: { width: 800, height: 700 }, // canvas 640x512 + shop chrome
  },
  webServer: {
    command: 'npx http-server -p 8080 -c-1 -s',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'default',
      testIgnore: ['**/visual/**'],
    },
    {
      name: 'visual',
      testMatch: ['**/visual/**'],
      use: { video: 'on' },
    },
  ],
  reporter: 'list',
});
```

Separate project ensures `npm test` (default) skips visual specs (faster, no video overhead) and `npm run review` runs only visual specs with video.

### `package.json` — add script

```json
"scripts": {
  ...existing...,
  "review": "playwright test --project=visual"
}
```

### `tests/visual/example.spec.js` — template

```js
import { test } from '@playwright/test';

// expect: player walks right, slashes a grass tile directly to its right.
// Grass should pop, gem spawns, gem flies into player and disappears (auto-magnet).

test('slash → grass cut → gem pickup', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.player.x = 100;
    t.player.y = 100;
    t.player.facing = 0; // right
    t.grasses.push({
      x: 130, y: 100, alive: true,
      respawnTimer: 0, respawnTime: 999999,
      hue: 100, flip: false,
    });
    t.setUpgradeLevel('magnet', 5);
  });

  // drive 60 frames of scene before slash so viewer can see setup
  await page.evaluate(() => window.__test.tick(60));
  await page.evaluate(() => window.__test.press('Space'));
  await page.evaluate(() => window.__test.tick(120));
});
```

Spec is short. Setup → optional warm-up ticks (so viewer sees the scene) → input → enough ticks for the consequence to play out.

### `.github/workflows/visual-review.yml`

```yaml
name: Visual Review

on:
  push:
    branches: [main]
    paths:
      - 'tests/visual/**'
      - 'src/**'
      - 'index.html'
      - 'playwright.config.js'
  workflow_dispatch:

jobs:
  capture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run review
        continue-on-error: true
      - uses: actions/upload-artifact@v4
        with:
          name: visual-review-${{ github.sha }}
          path: test-results/
          retention-days: 30
```

`continue-on-error` because visual specs have no `expect()` — they should always "pass" in Playwright's sense, but if something throws we still want the artifact (partial video) uploaded.

`src/**` + `index.html` triggers re-recording when game logic changes even if no new visual spec was added — so existing baselines stay current. Tradeoff: every src push gets a video run. If cost matters later, restrict to `tests/visual/**` only.

### `.gitignore`

Already covers `test-results/` (added with test harness).

## Workflow

1. Manager picks up a `verify: visual` (or mixed) TODO. Dispatches dev with item text.
2. Dev edits `src/` for the change.
3. Dev creates `tests/visual/<slug>.spec.js` with `// expect:` header + setup + drive + tick.
4. Dev does NOT run video locally (slow, requires playwright install). Dev runs `npm run build` to confirm no errors. Spec is shipped untested locally.
5. Dev commits src + visual spec together. Returns to manager.
6. User pushes (existing flow).
7. GitHub Actions `visual-review.yml` fires on push.
8. Manager reports to user: "Visual review run triggered, artifact will be at `https://github.com/dtan3847/grass-slasher/actions` in ~2 min."
9. User opens GitHub Actions on phone, downloads `visual-review-<sha>.zip`, watches `video.webm`.
10. User decides pass/fail. If fail: respawn dev with corrections. If pass: manager moves TODO to DONE.

## Spec lifetime

**Default: transient. Delete after user signs off.**

Visual specs are video-recorded — re-running gives a video, not a boolean signal, and nobody watches kept videos unless prompted. So the regression-baseline argument doesn't pay off automatically (unlike unit/E2E asserts which run as boolean checks on every push). Default is therefore delete, not keep.

**Keep when:**
- Setup is non-trivial to recreate manually (multi-room state, complex hook setup, scenario takes >20 lines of driving code).
- Spec captures a generic primitive (slash arc behavior, gem magnet) rather than a feature-specific scene — likely reused.
- User explicitly asks to keep as ongoing snapshot.

**Workflow:**
- Dev writes spec, implements, commits with src/.
- Dev returns summary with `lifetime: keep | delete | escalate. reason: <one line>` recommendation based on observed setup complexity.
- Manager actions deletion (or keep) during the verify → DONE-move commit. Dev never commits the deletion themselves.
- Override dev's recommendation when needed.

## Open Qs (parked, decide later if they bite)

- **Spec runtime cost.** Each spec adds ~10-30s to Actions run. If `tests/visual/` grows to 50 specs, run time bloats. Mitigations: matrix-parallelize specs, or split into `tests/visual/active/` (run every push) vs `tests/visual/archive/` (manual-only).
- **Diff-friendly review.** Currently user watches whole video. If they want side-by-side "before/after" they'd compare current artifact to prior run's artifact manually. Could ship a `tests/visual/<slug>.baseline.webm` checked into git (LFS) for diff anchoring, but adds complexity. Skip for now.
- **Audio.** Game is silent currently. Skip Playwright audio config.

## Dispatch checklist (when this plan ships)

Dev's spawn should:
- Edit `playwright.config.js` to add `projects` with `default` + `visual` split, viewport 800×700.
- Add `"review"` script to `package.json`.
- Create `tests/visual/example.spec.js` as template.
- Create `.github/workflows/visual-review.yml`.
- Run `npm run build` to confirm config still parses.
- Do NOT run `npm run review` locally (would require playwright install + ~2min run, no benefit).
- Commit. Manager updates dev agent prompt + CLAUDE.md separately to wire `verify: visual` into the workflow.

## Dependencies

Requires `test-harness.md` (shipped, commit `39a31a7`). Reuses `window.__test` hooks, http-server, Playwright base config.
