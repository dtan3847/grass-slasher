# Visual Review via Claude — WIP

Status: **WIP, awaiting decisions.** Do not dispatch dev until open Qs resolved.

## Goal

User on phone, away from computer. Wants Claude to verify a visual/behavioral change in-browser that's hard to assert in code (e.g. "player sprite faces up looks like back of head", "particle burst feels right", "shop layout doesn't overflow"). User tells Claude "review feature X" → Claude triggers run → Claude reads output → Claude reports → user directs next step from phone.

## Non-goals

- Not a regression suite.
- Not auto-trigger on push.
- Not video playback for the *user* — user does not watch. Claude consumes output.

## Core architecture (locked)

- Playwright scripted playthrough (no assertions, just driven inputs).
- Captures **PNG screenshots** at scripted beats — Claude `Read` tool consumes PNGs natively. Video not used by Claude (no native video input).
- Manual trigger only.

## Open Qs

### 1. Where does the run happen?

- **(a) GitHub Actions `workflow_dispatch`** — Claude triggers via `gh workflow run`, waits, downloads artifact via `gh run download`, reads PNGs.
  - Pro: works even when user PC off.
  - Con: ~1-2min latency, requires `gh` CLI auth in Claude env, artifact retention costs (free tier OK).
- **(b) Local Playwright run from Claude's PowerShell** — Claude runs `npx playwright test --grep visual` locally, reads PNGs from `test-output/` directly in same session.
  - Pro: instant, no cloud, no auth.
  - Con: requires user PC on + Claude session alive. Defeats "away from computer" if user is the one telling Claude.

**Tension:** user is on phone, but Claude Code session runs *somewhere* — almost certainly user's PC. If PC is on, (b) works. If PC is off, user can't talk to Claude at all (no session).

**Resolution candidate:** (b) is sufficient. The "away from computer" use case = user away from keyboard, not PC off. PC stays on, Claude session running, user phones in via Claude mobile / web.

**User to confirm:** does Claude session run on your PC, or somewhere remote?

### 2. What does a "visual test" script look like?

Per-change, dev writes a Playwright spec that:
- boots game with seeded state
- drives inputs to reach the scenario
- takes screenshots at N beats
- writes labeled PNGs to `test-output/visual/<feature>/<beat>.png`

No `expect()` calls. Pure capture.

Open Q: how many beats per script? Lean 3-8. More = more for Claude to read = more tokens.

### 3. How does Claude know what to look for?

User says "review sprite facing direction fix" → Claude needs to know the spec.

- (a) Dev's playwright spec includes a comment block describing intent (`// expect: head back-of-skull visible from behind, no eyes`). Claude reads the spec + PNGs together.
- (b) User describes in chat each time. More flexible, more user effort.

Lean (a). Spec self-documents.

### 4. Cloud artifact storage — needed at all?

If architecture (b) above wins (local run), **no cloud needed**. Skip entirely.

If (a) wins, GH artifacts free tier is enough. No need for R2/S3.

### 5. Video — capture at all?

Even if Claude can't watch video, user *could* download artifact and watch on phone for hard-to-screenshot cases (animation timing, etc.). Playwright `video: 'on'` is one config line.

- (a) Yes, capture video alongside PNGs. ~few MB per test. Negligible cost.
- (b) No, PNGs only. Smaller artifact, faster run.

Lean (a). Cheap insurance.

### 6. Naming / convention

- Specs: `tests/visual/<feature>.spec.js`?
- Output: `test-output/visual/<feature>/<beat>.png`?
- npm script: `npm run review <feature>`?

TBD.

## Tentative file list (if approach b + local)

- `tests/visual/*.spec.js` — capture scripts
- `playwright.config.js` — adds `visual` project with `video: 'on'`, screenshot on demand
- `package.json` — script `"review": "playwright test --project=visual"`
- `.gitignore` — `test-output/`

Reuses test harness infra from `test-harness.md`. Do that plan first.

## Decision needed before dispatch

- Q1 confirm: is local-run sufficient (Claude session on user PC)?
- Q2: screenshot beat count guideline.
- Q3: spec self-document vs chat-describe.
- Q5: video alongside PNGs y/n.
- Q6: naming.

## Dependencies

Requires `test-harness.md` shipped first (shares Playwright config, in-page hooks, server setup).
