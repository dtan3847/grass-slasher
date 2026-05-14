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

- [ ] [bug] player sprite/shadow renders over bottom rocks — symptom: player drawn on top of rock sprites at room edges, looks like walking on rocks. diagnosis (pre-existing): `blockedAt` in `src/main.js` uses `halfSum = 7 + 11 = 18` for both grass and rocks; rock sprite radius is ~13 logical px and player visible extent reaches ~14 below center, so collision stops player only after sprites already visually overlap. fix: separate rock collision from grass — in `blockedAt`, use `halfSum = 18` for grasses but `halfSum = 25` (= ~12 player + ~13 rock) for rocks. Or alternatively introduce named constants `PLAYER_HALF = 11`, `GRASS_HALF = 7`, `ROCK_HALF = 13` for clarity. (priority: low)

- [ ] [bug] auto-slash blocks E key pay-debt — symptom: pressing E near payment zone does nothing when auto-slash is active. diagnosis: E keydown handler (src/main.js line 322) gates on `player.slashState === 'idle'`; auto-slash keeps state in sweeping/retracting continuously so check never passes. fix: remove `player.slashState === 'idle'` from the E condition — debt payment has no slash-state dependency. src/main.js only. (priority: low)

- [ ] [feature] regrowth upgrade — grass currently regrows always; gate respawn on new upgrade. Add `regrowth: { level: 0, baseCost: 60, costMult: 1.0, maxLevel: 1 }` to `src/upgrades.js` (maxLevel 1 = one-time unlock, costMult irrelevant). In `src/main.js` respawn loop (around line 203), change condition to `if (grassSpawnEnabled && upgrades.regrowth.level > 0)`. Add shop button `id="btn-regrowth"` to `index.html` shop div (`onclick="buyUpgrade('regrowth')"`, label "🌱 Regrowth"). Add to `updateUI()` defs array: `['btn-regrowth', 'regrowth', lvl => '🌱 Regrowth', 1]`. Remove "Grass regrows automatically" from hints text in index.html (no replacement). Files: `src/upgrades.js`, `src/main.js`, `index.html`. (priority: med)

- [ ] [ux] hide auto-slash toggle until auto-slash is purchased — toggle button `btn-autoslash-toggle` always visible even at level 0. Fix: in `updateUI()` (`src/main.js` ~line 248), add `toggleBtn.style.display = upgrades.autoSlash.level > 0 ? '' : 'none';`. Also set `style="display:none"` on the button in `index.html` as initial state. Files: `src/main.js`, `index.html`. (priority: med)

- [ ] [feature] map editor tool — Node.js local server that lets you edit world layout and save directly to `src/world.js`. Approach: (1) Extract ROOMS + WORLD_MAP data out of `src/world.js` into `src/world-data.json`; update `world.js` to import and use it. (2) Create `editor/server.js` (Node.js, no framework) serving `editor/index.html` + a `POST /save` endpoint that writes `src/world-data.json`. (3) Editor UI: shows 3×3 room grid; click room to select; shows 10×8 tile grid where click toggles grass; click room borders to toggle neighbor connections. Save button POSTs updated JSON. (4) Add `"editor": "node editor/server.js"` to `package.json` scripts. Dev must not use any npm packages not already in the project; vanilla Node.js `http` module only. (priority: med)

- [ ] [ux] sprite facing direction — up and down look same; fix: when facing up (sin(facing) < -0.5) draw back of head (hat from behind, no eyes, hair bump visible). Separately: make head and eyes bigger, anime style, for all directions. Left/right already distinct via eye x-offset. (priority: low)
- [ ] [ux] differentiate repeatable vs one-time upgrades visually in shop. (priority: low)
- [ ] [feature] magnet upgrade — gems within range auto-collected; upgrade increases range. (priority: low)

- [ ] [ux] debt counter format — drop ` / 500` from display. symptom: `Debt: 500 / 500` reads awkward; total never changes. fix: in `src/main.js` line 226, change `Debt: ${debtRemaining} / ${DEBT_TOTAL}` → `Debt: ${debtRemaining}`. Also update initial text in `index.html` line 91 from `Debt: 500 / 500` to `Debt: 500`. Files: `src/main.js`, `index.html`. (priority: med)

- [ ] [bug] partial debt payment allowed — symptom: pressing E with fewer gems than debt pays partial amount. diagnosis: `src/main.js` line 327 calls `payDebt(gemCount)`; `payDebt` (src/debt.js:6-12) clamps to `Math.min(amount, gemCount, debtRemaining)` and applies any positive amount. No gameplay benefit to partial payment since only full clearance triggers win. fix: gate E handler on `gemCount >= debtRemaining` — same place that already checks `inPaymentRoom` + `nearZone` (src/main.js ~line 324-328). If not enough gems, no-op (or optional: brief float text "Need N more gems" — leave to dev's judgment, OK to omit). Files: `src/main.js`. (priority: med)

- [~] [feature] deploy to GH Pages + itch.io — see `plans/deploy-hosting.md` for full spec. Single GitHub Actions workflow on push to `main`: build with `npm run build`, deploy `index.html` + `bundle.js` to GH Pages via `actions/deploy-pages@v4` and to itch.io via butler. `bundle.js` stays gitignored (CI builds fresh). Requires one-time manual setup: enable Pages "from Actions", create itch.io project, add `BUTLER_API_KEY` secret + `ITCH_TARGET` repo var. New file: `.github/workflows/deploy.yml`. No source changes. (priority: med) — itch deploy verified working from first push. GH Pages blocked on user setting Pages source to "GitHub Actions" (currently set to "Deploy from a branch", which serves `main` root and 404s on gitignored `bundle.js`).

- [ ] [config] itch.io project page — review and configure all settings. Enumerate every field on the edit page (Title, Short description, Classification, Kind of project, Pricing, Uploads, Embed options, Genre, Tags, App store links, Custom noun, Community, Visibility, Cover image, Screenshots, Trailer, etc.) and decide value for each. Specifically known: embed canvas currently 1200×1000 — set to match game viewport (DOM canvas is 640×512 + UI/shop vertical chrome, so ~720×680 min). "This file will be played in the browser" toggle on. Un-draft / set visibility to Public when ready. Add cover image + at least one screenshot (itch requires for discovery). Pick genre + tags for search. Decide pricing model (free / paid / pay-what-you-want). Done in itch.io dashboard, no code change. (priority: low)

- [ ] [refactor] bump GH Actions to Node 24-compatible versions — current workflow uses `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`. GitHub warns these run on Node 20 internally; forced Node 24 starts June 2026, Node 20 removed September 2026. Watch for new major versions of these actions (e.g. `@v5`) and bump. Or set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` env var to opt in early. Non-blocking until mid-2026. Files: `.github/workflows/deploy.yml`. (priority: low)

## Known intentional quirks (do not fix)

- slash-during-room-transition allowed by design — feels fine, kept as unintended feature

## Proposals (need decision)

- ? hold-to-slash vs charge slash tech tree — two separate upgrade paths rather than one linear tree?
