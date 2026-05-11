# Plan: Story / Debt Arc (Phases 1–4)

## Context

Player owes 500 gems to the "Grass Baron". Game starts with flavor cutscene explaining the premise. Debt tracked as a win condition: when repaid, win screen appears with option to continue. Payment done manually by walking to a zone in room 0,0 (top room) and pressing E. Dialogue system is future work — phases here use canvas overlays for story delivery.

---

## Phase 1 — Debt module + HUD

### New file: `src/debt.js`

Sits at base of dep graph. Imports `addGems` from `gems.js` to deduct gems on payment.

```js
import { gemCount, addGems } from './gems.js';

export const DEBT_TOTAL = 500;
export let debtRemaining = DEBT_TOTAL;

// Pay up to `amount` gems toward debt. Deducts from both gemCount and debtRemaining.
// Returns actual amount paid.
export function payDebt(amount) {
  const pay = Math.min(amount, gemCount, debtRemaining);
  if (pay <= 0) return 0;
  addGems(-pay);
  debtRemaining -= pay;
  if (debtRemaining < 0) debtRemaining = 0;
  return pay;
}

export function isDebtCleared() { return debtRemaining <= 0; }
```

### `src/main.js` — import + updateUI

Add import:
```js
import { debtRemaining, DEBT_TOTAL } from './debt.js';
```

In `updateUI()`, update the debt display:
```js
document.getElementById('debt-display').textContent = `Debt: ${debtRemaining} / ${DEBT_TOTAL}`;
```

### `index.html` — HUD element

Add debt display alongside gem count in HUD. Exact placement: below or beside `#gem-count`. Example:
```html
<div id="debt-display">Debt: 500 / 500</div>
```

Style to match existing HUD (dark background, light text).

---

## Phase 2 — Intro flavor cutscene

### State in `src/main.js`

```js
let introShown = false;
```

Block game loop until dismissed:
```js
function loop() {
  if (!introShown) {
    drawIntro();
    requestAnimationFrame(loop);
    return;
  }
  update();
  // ... rest of loop unchanged
}
```

Dismiss on any keydown or click (add listeners once, remove after):
```js
function dismissIntro() {
  introShown = true;
  document.removeEventListener('keydown', dismissIntro);
  canvas.removeEventListener('click', dismissIntro);
}
document.addEventListener('keydown', dismissIntro);
canvas.addEventListener('click', dismissIntro);
```

Add `drawIntro` to render.js import list.

### `src/render.js` — `drawIntro()`

```js
export function drawIntro() {
  ctx.fillStyle = 'rgba(0,0,0,0.92)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#e8c84a';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('GRASS SLASHER', W / 2, H / 2 - 80);

  ctx.fillStyle = '#cccccc';
  ctx.font = '16px monospace';
  ctx.fillText('You owe 500 gems to the Grass Baron.', W / 2, H / 2 - 20);
  ctx.fillText('Slash grass. Collect gems. Repay your debt.', W / 2, H / 2 + 10);

  ctx.fillStyle = '#888888';
  ctx.font = '13px monospace';
  ctx.fillText('Click or press any key to begin.', W / 2, H / 2 + 70);

  ctx.textAlign = 'left';
}
```

---

## Phase 3 — Payment zone in room 0,0

### `src/world.js` — export zone constant

```js
export const PAYMENT_ZONE = { rx: 0, ry: 0, px: 320, py: 224, radius: 40 };
```

(col 10, row 7 in 20×15 grid → pixel center 320, 224)

### `src/render.js` — `drawPaymentZone(frameCount)`

Import `PAYMENT_ZONE` from world.js.

```js
export function drawPaymentZone(frameCount) {
  const { px, py, radius } = PAYMENT_ZONE;
  const pulse = 0.35 + 0.15 * Math.sin(frameCount * 0.06);
  const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
  grad.addColorStop(0, `rgba(255, 210, 50, ${pulse})`);
  grad.addColorStop(1, 'rgba(255, 180, 0, 0)');
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = '#e8c84a';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GRASS BARON', px, py - radius - 6);
  ctx.textAlign = 'left';
}
```

Draw inside camera translate block in `loop()`, only when in room 0,0:
```js
if (roomX === 0 && roomY === 0) drawPaymentZone(frameCount);
```

### `src/main.js` — proximity check + E key

Import:
```js
import { PAYMENT_ZONE, roomX, roomY } from './world.js';
import { payDebt, isDebtCleared } from './debt.js';
```

State:
```js
let nearPayZone = false;
let gameWon = false;
```

In `update()`, after movement (skip during transition):
```js
if (roomX === PAYMENT_ZONE.rx && roomY === PAYMENT_ZONE.ry) {
  const dx = player.x - PAYMENT_ZONE.px;
  const dy = player.y - PAYMENT_ZONE.py;
  nearPayZone = Math.sqrt(dx*dx + dy*dy) <= PAYMENT_ZONE.radius;
} else {
  nearPayZone = false;
}
```

E key handler (add alongside existing keydown handling):
```js
if (e.key === 'e' || e.key === 'E') {
  if (nearPayZone && !gameWon) {
    payDebt(gemCount);
    if (isDebtCleared()) gameWon = true;
  }
}
```

HUD prompt: in `updateUI()`:
```js
document.getElementById('pay-prompt').style.display = nearPayZone && !gameWon ? 'block' : 'none';
```

Add `index.html`:
```html
<div id="pay-prompt" style="display:none">Press E to pay debt</div>
```

---

## Phase 4 — Win screen

### State in `src/main.js`

`gameWon` bool (declared in phase 3). When true, draw win overlay after normal frame.

In `loop()`, after normal draw:
```js
if (gameWon) {
  drawWinScreen();
}
```

Dismiss on Enter or click on "Continue" button rect (track in mousedown):
```js
canvas.addEventListener('mousedown', e => {
  if (!gameWon) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  // button rect: centered W/2±90, H/2+60 to H/2+90
  if (mx >= W/2 - 90 && mx <= W/2 + 90 && my >= H/2 + 60 && my <= H/2 + 90) {
    gameWon = false;
  }
});
document.addEventListener('keydown', e => {
  if (gameWon && e.key === 'Enter') gameWon = false;
});
```

### `src/render.js` — `drawWinScreen()`

```js
export function drawWinScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#e8c84a';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('Debt repaid.', W / 2, H / 2 - 60);

  ctx.fillStyle = '#cccccc';
  ctx.font = '16px monospace';
  ctx.fillText('The Grass Baron nods slowly.', W / 2, H / 2 - 20);
  ctx.fillText('"You are free... for now."', W / 2, H / 2 + 10);

  // Continue button
  ctx.fillStyle = '#333';
  ctx.fillRect(W / 2 - 90, H / 2 + 60, 180, 30);
  ctx.strokeStyle = '#e8c84a';
  ctx.lineWidth = 1;
  ctx.strokeRect(W / 2 - 90, H / 2 + 60, 180, 30);
  ctx.fillStyle = '#e8c84a';
  ctx.font = '14px monospace';
  ctx.fillText('[ Continue exploring ]', W / 2, H / 2 + 80);

  ctx.textAlign = 'left';
}
```

Game state not reset on continue — world, gems, upgrades persist.

---

## Dependency graph

```
Phase 1 (debt.js + HUD)
  └─ Phase 2 (intro cutscene) — independent of 1, can be done in parallel
  └─ Phase 3 (payment zone) — requires Phase 1
       └─ Phase 4 (win screen) — requires Phase 3
```

Phases 1 and 2 touch different files → can be dispatched to parallel agents.
Phases 3 and 4 must be sequential (4 depends on `gameWon` state from 3).

---

## Implementation order

1. `src/debt.js` — create
2. `src/main.js` + `index.html` — HUD wiring (phase 1)
   `src/render.js` + `src/main.js` — intro cutscene (phase 2)
   *(1 and 2 can be parallel agents if they split files carefully — but main.js is shared, so sequential is safer)*
3. `src/world.js` — add `PAYMENT_ZONE` export
4. `src/render.js` — add `drawPaymentZone`, `drawWinScreen`
5. `src/main.js` — proximity logic, E key, gameWon, win dismiss listeners
6. `index.html` — pay-prompt element
7. Build: `npm run build`

---

## Files modified

- `src/debt.js` — **new**
- `src/world.js` — add `PAYMENT_ZONE` export
- `src/render.js` — add `drawIntro`, `drawPaymentZone`, `drawWinScreen`
- `src/main.js` — import debt + zone, intro state, proximity, E key, gameWon, win dismiss
- `index.html` — debt HUD element, pay-prompt element

---

## Verification

1. Game start → intro overlay appears. Click/keypress → dismissed, game runs.
2. HUD shows "Debt: 500 / 500".
3. Collect gems → gem count rises, debt display unchanged.
4. Walk to room 0,0 (top). Gold pulsing zone visible at center with "GRASS BARON" label.
5. Walk into zone → "Press E to pay debt" prompt appears.
6. Press E with 0 gems → nothing changes.
7. Collect gems, enter zone, press E → gems deducted, debt decreases.
8. Repeat until debt = 0 → win screen appears.
9. Win screen: correct text, "Continue exploring" button clickable.
10. Click Continue / press Enter → overlay dismissed, game continues, upgrades/position preserved.
11. No console errors throughout.
