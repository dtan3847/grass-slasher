# Deploy: GitHub Pages + itch.io

## Goal

Host built game at two URLs via single GitHub Actions workflow triggered on push to `master`. No manual builds. `bundle.js` stays out of git (current convention).

- **GitHub Pages:** `https://dtan3847.github.io/grass-slasher/` — canonical, free, auto-deploys.
- **itch.io:** project page (slug TBD by user, e.g. `dtan3847/grass-slasher`) — audience, ratings, embed player.

## Verified facts

- Repo remote: `https://github.com/dtan3847/grass-slasher.git` (user `dtan3847`).
- Build command: `npm run build` (from `package.json`) → emits `bundle.js` in repo root.
- Deploy artifact = exactly two files: `index.html` (repo root) and `bundle.js` (built). Confirmed via grep — only external reference is `<script src="bundle.js">` at `index.html:109`. No images, fonts, audio, or CDN imports anywhere in `*.html` or `src/*.js`.
- `bundle.js` is in `.gitignore` — must NOT be committed. CI builds fresh each deploy.
- Canvas DOM size = 640×512 (`src/constants.js:9-10`, `W*SCALE × H*SCALE` = 320×2 × 256×2). UI div + shop div add vertical chrome — itch.io viewport must be ≥ 720×680 to fit comfortably without scroll.
- No existing `.github/` directory — workflow is a new file.
- Sub-path hosting (`/grass-slasher/`) is safe: all asset refs are relative paths (`bundle.js`), no leading `/`.

## One-time manual setup (user, before workflow runs)

These are NOT automatable. User performs each once, then commits the workflow.

1. **Enable GitHub Pages "from Actions"** — Repo Settings → Pages → Source: `GitHub Actions`. (NOT "Deploy from a branch".) Required for `actions/deploy-pages` to work.
2. **Create itch.io project** — at https://itch.io/game/new. Title: "Grass Slasher". Kind: HTML. Note the slug (e.g. `grass-slasher`); full target = `<itch-username>/<slug>`. Embed dimensions: width 720, height 680 (or larger). Save as draft.
3. **Generate butler API key** — https://itch.io/user/settings/api-keys → New API key. Copy value.
4. **Add repo secret** — Repo Settings → Secrets and variables → Actions → New repository secret. Name: `BUTLER_API_KEY`. Value: the key from step 3.
5. **Add repo variable** for itch target (optional, keeps target out of workflow file) — same Settings page → Variables tab → `ITCH_TARGET` = `<itch-username>/<slug>`. Or hardcode in workflow.

Workflow will fail until steps 1, 4, and 5 (or hardcoded target) are done. Steps 2-3 are prerequisites for 4-5.

## Workflow file: `.github/workflows/deploy.yml`

Single workflow, three jobs. `build` runs once; `deploy-pages` and `deploy-itch` both depend on it and run in parallel.

```yaml
name: Deploy

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - name: Stage site
        run: |
          mkdir -p _site
          cp index.html bundle.js _site/
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - name: Upload zip for itch
        uses: actions/upload-artifact@v4
        with:
          name: itch-zip-src
          path: _site

  deploy-pages:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4

  deploy-itch:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: itch-zip-src
          path: _site
      - name: Zip
        run: cd _site && zip -r ../grass-slasher.zip .
      - name: Install butler
        run: |
          curl -L -o butler.zip https://broth.itch.zone/butler/linux-amd64/LATEST/archive/default
          unzip butler.zip
          chmod +x butler
          ./butler -V
      - name: Push to itch.io
        env:
          BUTLER_API_KEY: ${{ secrets.BUTLER_API_KEY }}
        run: ./butler push grass-slasher.zip ${{ vars.ITCH_TARGET }}:html5
```

### Notes on the workflow

- `permissions.pages: write` + `id-token: write` at the top level are required by `actions/deploy-pages@v4`.
- `concurrency` block prevents two pushes from racing; the later push cancels the earlier in-flight deploy.
- `actions/upload-pages-artifact@v3` packages `_site` as a tarball with the special format Pages requires; `actions/deploy-pages@v4` consumes it.
- itch.io leg uses a parallel plain `upload-artifact` since Pages artifact tarball isn't a normal zip.
- Butler channel `html5` is the standard channel name for browser builds.
- `vars.ITCH_TARGET` reads from repo variable. If user hardcodes instead, replace with literal `dtan3847/grass-slasher`.
- Node 20 is current LTS; matches esbuild support.
- No `package-lock.json` exists in repo (devDependency `esbuild: latest`). `npm install` is fine; if pinning is wanted later, generate a lockfile and switch to `npm ci`.

## Verifying the deploy

After first push to master with workflow in place:

1. Watch Actions tab — all three jobs green.
2. Open `https://dtan3847.github.io/grass-slasher/` — game loads, plays.
3. itch.io project page → Edit → check that a new build appeared on the `html5` channel. Publish (un-draft) when ready.
4. itch.io embed: verify "This file will be played in the browser" toggle is on, viewport matches 720×680 (or whatever you chose).

## Files

- `.github/workflows/deploy.yml` — new workflow file (the whole feature lives here).
- No source code changes.

## Out of scope

- Custom domain on GH Pages.
- Versioning / git tags / release notes.
- Pinning esbuild version (could add later via `package-lock.json`).
- Preview deploys for PRs.
- Discord / social embed metadata in `index.html` (`<meta property="og:*">` etc.) — separate TODO if user wants link unfurls.
- Cache headers / service worker.
