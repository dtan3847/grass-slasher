# Mobile Controls (Touch Input)

## Goal

Always-on touch input alongside existing keyboard/mouse (no detection branch). Left half of canvas = **free-angle** virtual joystick for movement (any 360° direction, binary speed). Right half = tap-to-slash. Visible joystick overlay required. Responsive CSS so UI text isn't tiny on phones. Mobile playable without sacrificing desktop input.

## Revision history

- **v1** (built, rejected): 8-way snap, wrote to `keys[]` flags, no visual, no responsive CSS. User feedback: text tiny, prefer free direction, want visual.
- **v2** (this doc): free-angle joystick via dedicated state struct (NOT `keys[]`), visible base+thumb overlay, `@media` breakpoint for text.

## Verified hooks (do NOT improvise)

- **Flag map** = `keys` object at `src/main.js:23`, keyed by `e.code`. Movement branch at `src/main.js:118-121` reads `'KeyW'/'KeyA'/'KeyS'/'KeyD'` (and Arrow variants). v2 joystick does NOT write here — see "Free-angle wiring" below.
- **Slash is event-triggered, NOT flag-polled.** Z keydown handler `src/main.js:332-336` calls `trySlash()` then `logSlash()` once, gated by `!e.repeat` and `!gameWon`. Right-half tap mirrors this — call `trySlash()` + `logSlash()` directly on `touchstart`.
- **Intro dismissal:** first keydown at `src/main.js:312` and first canvas click at `:341` both do `introShown = true; return`. First `touchstart` while `!introShown` must do the same.
- **Synthetic-click hazard:** `canvas.addEventListener('click', ...)` at `src/main.js:340` reads mouse position, overwrites `player.facing`, then calls `trySlash()`. Touch events synthesize a `click` after `touchend` — without suppression this double-fires slash AND rotates aim. Every touch handler MUST call `e.preventDefault()` with `{ passive: false }` listener options.
- **Canvas DOM size** set by JS (`src/constants.js:9-10`, 640×512). Use `canvas.getBoundingClientRect()` for DOM-px coords; split halves by `rect.width / 2`. Convert DOM-px to logical-px (320×256) via `W / rect.width` and `H / rect.height` (same scale factors used at `main.js:343-344`).

## Left half — free-angle joystick

**State** (replace the current `let joystick = null` and `clearMovementKeys()` in `src/main.js`):

```js
const JOYSTICK_DEADZONE = 10;  // logical px
const JOYSTICK_RADIUS   = 28;  // logical px — visual ring radius + thumb clamp
let joystick = null;
// when active:
// { identifier, anchorX, anchorY, thumbX, thumbY, dirX, dirY, magnitude }
// all coords in LOGICAL px (post-rect-scale). dirX/dirY = unit vector
// when magnitude >= DEADZONE, else (0,0). magnitude itself is raw distance.
```

**touchstart** (left half, no joystick currently bound): convert touch to logical coords; set `joystick = { identifier, anchorX, anchorY, thumbX: anchorX, thumbY: anchorY, dirX: 0, dirY: 0, magnitude: 0 }`.

**touchmove** (matching identifier): convert touch to logical coords. Compute `dx = tx - anchorX`, `dy = ty - anchorY`, `mag = Math.hypot(dx, dy)`. Set `joystick.magnitude = mag`.
- If `mag < JOYSTICK_DEADZONE`: `dirX = dirY = 0`, `thumbX = anchorX + dx`, `thumbY = anchorY + dy` (free thumb inside deadzone for visual feel).
- Else: `dirX = dx / mag`, `dirY = dy / mag` (unit vector — direction free, 360°). Clamp thumb visually to ring: if `mag > JOYSTICK_RADIUS`, `thumbX = anchorX + dirX * JOYSTICK_RADIUS`, `thumbY = anchorY + dirY * JOYSTICK_RADIUS`; else thumb at raw touch point.

**touchend / touchcancel** (matching identifier): `joystick = null`.

## Free-angle wiring (do NOT write to keys[])

The current movement branch at `src/main.js:117-133` reads `keys[]` for `dx, dy`. Modify it:

```js
let dx = 0, dy = 0;
if (joystick && (joystick.dirX !== 0 || joystick.dirY !== 0)) {
  dx = joystick.dirX;
  dy = joystick.dirY;
} else {
  if (keys['ArrowLeft']  || keys['KeyA']) dx -= 1;
  if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
  if (keys['ArrowUp']    || keys['KeyW']) dy -= 1;
  if (keys['ArrowDown']  || keys['KeyS']) dy += 1;
}

if (dx !== 0 || dy !== 0) {
  const len = Math.hypot(dx, dy);  // joystick: len=1, keyboard: len ∈ {1, √2}
  const newFacing = Math.atan2(dy, dx);
  // ... rest unchanged
}
```

**Why this shape:** joystick `(dirX, dirY)` is already a unit vector when active, so `len = 1` and the existing `(dx/len) * player.speed` line produces full speed in the free direction. Keyboard path is unchanged. Joystick takes precedence when active and outside deadzone; when joystick is bound but inside deadzone, both `dirX` and `dirY` are 0 so the outer `if (dx !== 0 || dy !== 0)` short-circuits and no movement happens — AND no keyboard fallback either (finger-down means joystick has sole authority over the movement vector).

**Player facing** continues to derive from `Math.atan2(dy, dx)` at `main.js:125`, so free-angle joystick produces free-angle facing automatically. Slash still snaps to 4 cardinals inside `snapCardinal()` — leave that alone.

**Delete from current code:**
- `clearMovementKeys()` helper — no longer needed.
- All `keys['KeyW']/['KeyA']/['KeyS']/['KeyD'] = …` writes inside touch handlers.
- Sector snap math (`Math.round(angle / (Math.PI/4))` etc.).

## Right half — slash tap

Unchanged from v1. Implemented and works:
- If `!introShown` → dismiss intro, `preventDefault()`, return.
- Else if `gameWon` → `preventDefault()`, return.
- Else → `trySlash(); logSlash(); preventDefault();`.
- Do NOT modify `player.facing`.

## Multi-touch

Unchanged from v1. One joystick slot, unlimited slash stream, sticky half-binding by `Touch.identifier`, iterate `e.changedTouches`.

## Visual overlay — REQUIRED in v2

Add `drawJoystick(joystick)` export to `src/render.js`. Call from `src/main.js` `loop()` after world draw, before `drawDebug` — i.e. on top of game world but under debug overlay. Draw inside the existing `setTransform(SCALE, …)` transform so coords are logical px.

```js
// src/render.js
export function drawJoystick(j) {
  if (!j) return;
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(j.anchorX, j.anchorY, 28, 0, Math.PI * 2);  // base ring, radius = JOYSTICK_RADIUS
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(j.thumbX, j.thumbY, 9, 0, Math.PI * 2);     // thumb dot
  ctx.fill();
  ctx.restore();
}
```

Wire-up in `src/main.js` `loop()`:
- Import `drawJoystick` from `./render.js`.
- After `drawFloats()` inside both transition and non-transition branches (or unconditionally after `ctx.restore()` so it always renders on top regardless of camera state), call `drawJoystick(joystick)`.
- Joystick coords are screen-relative (anchor doesn't move with camera), so draw it OUTSIDE the `ctx.translate(-camera.x, -camera.y)` block. Look at `main.js:271-282` — call `drawJoystick(joystick)` after `ctx.restore()` on line 281.

No right-side visual. No idle "always-visible" joystick. Only shows when finger is down on left half.

## CSS — responsive text

In `index.html`, append a media query AFTER the existing `<style>` rules:

```css
@media (max-width: 720px) {
  #ui { font-size: 18px; padding: 12px 24px; gap: 28px; }
  #ui span { font-size: 18px; }
  .btn { font-size: 16px; padding: 10px 18px; }
  #hints { font-size: 14px; }
  #debt-prompt { font-size: 18px; padding: 12px 24px; bottom: 100px; }
}
```

Breakpoint = 720px (covers phone portrait + landscape; canvas itself is 640px wide so 720 leaves room for borders/margins). Desktop sizes unchanged.

Keep `touch-action: none` on canvas (already added in v1) and the `Touch: left = move, right = slash` hint text (already added).

## Files

- `src/main.js` — rewrite joystick state, touchmove, and the movement branch in `update()`. Remove `clearMovementKeys()` and keys[] writes. Add `drawJoystick(joystick)` call in `loop()`.
- `src/render.js` — add and export `drawJoystick`.
- `index.html` — add `@media (max-width: 720px)` block to `<style>`. Existing `touch-action: none` and hints stay.

## Out of scope

- Analog speed modulation (direction free, speed binary — confirmed with user).
- Responsive canvas sizing for very narrow phones (canvas may still overflow on <640px viewports; separate TODO if needed).
- Touch-accessible debug/win/shop UI.
- Pinch zoom, two-finger gestures, haptic feedback.
- Right-side tap pulse visual (deferred).
- Idle-visible joystick (deferred).
