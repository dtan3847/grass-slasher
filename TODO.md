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

- [~] [ux] magnetSword pull tuning — one-shot impulse (`1.5 + level*0.8`), skip slash-revealed gems, ±0.2 rad jitter. `tests/magnet.spec.js` now 8 tests. verify: mixed — E2E done (tests 6+8); visual: arc feel + jitter look correct in browser. (priority: high)
- [ ] [feature] split auto-slash and slash-speed upgrades — currently `autoSlash` upgrade governs both: enables auto-trigger AND reduces cooldown via `Math.max(10, 46 - lvl*10)`. Player `sweepDur=8`, `retractDur=5` are hardcoded. Split: keep `autoSlash` as triggers-per-second (existing cooldown formula, max 20), add new `slashSpeed` upgrade (maxLevel 20, baseCost ~30, costMult ~1.7). `slashSpeed` reduces (a) animation duration: `sweepDur = max(2, 8 - slashSpeed.level * 0.3)`, `retractDur = max(1, 5 - slashSpeed.level * 0.2)` (dev to tune); (b) cooldown floor: change autoSlash formula to `Math.max(2, 46 - autoSlash.level * 10 - slashSpeed.level * 2)` so high slashSpeed allows faster auto-trigger than current floor of 10. `sweepDur`/`retractDur` become getters on `player` (like `slashRange`) reading from `upgrades.slashSpeed.level`. Files: `src/upgrades.js`, `src/player.js`, `src/main.js` (auto-slash cooldown line ~211), `index.html` (new shop button), updateUI defs entry. (priority: med)
- [ ] [ux] intro screen shop should be visible-but-disabled, not hidden — current fix hides `#shop` div during intro, which shifts canvas position. Prefer: shop stays visible but all buttons disabled (greyed) until intro dismissed. Fix: in `src/main.js` at all four `introShown = true` sites, REMOVE the `document.getElementById('shop').style.display = ''` line (no longer needed). In `index.html`, remove `style="display:none"` from `#shop` div. Instead: in `updateUI()`, add a check: `if (!introShown) btn.disabled = true;` after the existing `btn.disabled = ...` line in the upgrade-button loop. Also disable `#btn-autoslash-toggle` while `!introShown`. Files: `src/main.js`, `index.html`. (priority: med)
- [ ] [feature] host visual-review video for in-browser viewing — current flow requires downloading zip artifact from Actions tab + extracting + opening `.webm` locally. Friction. Want clickable URL that plays video inline. Options: (a) push video to a `visual-reviews` branch under `videos/<sha>.webm`, configure GH Pages to serve that branch — URL `https://dtan3847.github.io/.../videos/<sha>.webm`. Conflicts with current GH Pages serving game build from main → needs separate domain path or sub-branch. (b) Cloudflare R2 + public bucket — workflow uploads via wrangler/curl, URL printed in step summary. Requires R2 account + secret. (c) Just embed video in `$GITHUB_STEP_SUMMARY` as base64 data URI — works inline in Actions UI, no external hosting, but only viewable in Actions tab not phone. (d) Use GitHub artifact then a tiny redirector page that fetches+unzips client-side. Decide approach when picking up. Files: `.github/workflows/visual-review.yml` + maybe gh-pages config. verify: visual (verify URL plays in browser). (priority: med)


- [ ] [bug] player sprite/shadow renders over bottom rocks — symptom: player drawn on top of rock sprites at room edges, looks like walking on rocks. diagnosis (pre-existing): `blockedAt` in `src/main.js` uses `halfSum = 7 + 11 = 18` for both grass and rocks; rock sprite radius is ~13 logical px and player visible extent reaches ~14 below center, so collision stops player only after sprites already visually overlap. fix: separate rock collision from grass — in `blockedAt`, use `halfSum = 18` for grasses but `halfSum = 25` (= ~12 player + ~13 rock) for rocks. Or alternatively introduce named constants `PLAYER_HALF = 11`, `GRASS_HALF = 7`, `ROCK_HALF = 13` for clarity. (priority: low)


- [ ] [ux] hide auto-slash toggle until auto-slash is purchased — toggle button `btn-autoslash-toggle` always visible even at level 0. Fix: in `updateUI()` (`src/main.js` ~line 248), add `toggleBtn.style.display = upgrades.autoSlash.level > 0 ? '' : 'none';`. Also set `style="display:none"` on the button in `index.html` as initial state. Files: `src/main.js`, `index.html`. (priority: med)

- [ ] [ux] differentiate repeatable vs one-time upgrades visually in shop. (priority: low)
- [ ] [refactor] unused DEBT_TOTAL import — `src/main.js` line 6 still imports `DEBT_TOTAL` from `./debt.js`; after debt counter format change (`Debt: ${debtRemaining}` only), `DEBT_TOTAL` is no longer used in main.js. esbuild tree-shakes so no bundle impact, but lint would flag. Remove from import line. Files: `src/main.js`. (priority: low)
- [ ] [refactor] break circular imports — two cycles: (1) `gems.js ↔ upgrades.js`: `gems.js` imports `upgrades`, `upgrades.js` imports `spendGems/gemCount` from gems. (2) `gems.js ↔ player.js`: `player.js` imports `gems` (added in magnetSword startSweep reset), `gems.js` imports `player`. Both safe in esbuild (live bindings, reads inside function bodies only) but fragile — top-level read in either side breaks at runtime. esbuild handles ES module cycle via live bindings (works because both sides only read inside function bodies, not at module init), but cycle is fragile — moving a read to module top-level breaks at runtime, and ordering changes in either file can silently introduce that. Fix options: (a) extract `gemCount`/`addGems`/`spendGems`/`clearGems` into new `src/gemBank.js`; both `gems.js` and `upgrades.js` import from `gemBank.js`. (b) Pass `upgrades` into `updateGems(upgrades, mult)` from caller in `src/main.js` instead of importing at module level — keeps gems.js dep-free. (a) is cleaner separation; (b) is smaller diff. Recommend (a). Files: new `src/gemBank.js`, `src/gems.js`, `src/upgrades.js`, plus all consumers of `gemCount`/`addGems`/`spendGems`/`clearGems` updated to import from new module (`src/main.js`, `src/grass.js` if any, etc — grep first). (priority: low)

- [ ] [config] itch.io project page — review and configure all settings. Enumerate every field on the edit page (Title, Short description, Classification, Kind of project, Pricing, Uploads, Embed options, Genre, Tags, App store links, Custom noun, Community, Visibility, Cover image, Screenshots, Trailer, etc.) and decide value for each. Specifically known: embed canvas currently 1200×1000 — set to match game viewport (DOM canvas is 640×512 + UI/shop vertical chrome, so ~720×680 min). "This file will be played in the browser" toggle on. Un-draft / set visibility to Public when ready. Add cover image + at least one screenshot (itch requires for discovery). Pick genre + tags for search. Decide pricing model (free / paid / pay-what-you-want). Done in itch.io dashboard, no code change. (priority: low)

- [ ] [refactor] bump GH Actions to Node 24-compatible versions — current workflow uses `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`. GitHub warns these run on Node 20 internally; forced Node 24 starts June 2026, Node 20 removed September 2026. Watch for new major versions of these actions (e.g. `@v5`) and bump. Or set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` env var to opt in early. Non-blocking until mid-2026. Files: `.github/workflows/deploy.yml`. (priority: low)

## Known intentional quirks (do not fix)

- slash-during-room-transition allowed by design — feels fine, kept as unintended feature

## Proposals (need decision)

- ? hold-to-slash vs charge slash tech tree — two separate upgrade paths rather than one linear tree?
