# Hitbox System Refactor

## Problem

Slash hit detection (`checkSlashHits` in `grass.js`) and debug visualization (`drawDebug` in `render.js`) both independently derive the hitbox geometry. Adding a new hitbox shape requires updating both files separately — they are coupled without a shared source. The current hitbox is also a pure radial wedge with no rectangular end-caps, causing close-range misses near swing start/end edges.

## Design decisions (reached through discussion)

### Hitbox = array of shape parts

A slash hitbox is a compound shape. Each part is a plain data object:

```js
{ type: 'wedge', start, delta, reach }
{ type: 'rect',  angle, length, halfWidth }
```

A full slash hitbox:
```js
[
  { type: 'wedge', start, delta, reach },              // main sweep zone
  { type: 'rect', angle: start,         length: reach, halfWidth: 3 }, // start cap
  { type: 'rect', angle: start + delta, length: reach, halfWidth: 3 }, // end cap
]
```

### Timing lives outside hitbox.js

The hitbox module is pure shape math — no lifecycle, no timing. `main.js` owns when each part is tested:
- **Every sweep frame**: wedge test (`checkSlashHits`, existing call)
- **Sweep frame 1 only**: start cap rect (`checkSlashCap(parts[1])`)
- **Sweep last frame only**: end cap rect (`checkSlashCap(parts[2])`)

End cap must not fire on frame 1 (sword hasn't reached there yet). Start cap on frame 1 only (sword is there and then moves away). Every-frame rect testing would kill grass before the sword arrives — incorrect gameplay.

### Debug rendering — always full preview, no sweep angle

`drawHitbox` draws all parts at full extent regardless of current sweep state. No `sweepAngle` parameter.
- Wedge: draws full arc from `start` to `start + delta`
- Rect: draws the full rectangle at its fixed angle

Cardinal source for debug:
- `idle` / `retract`: `snapCardinal(player.facing)` — upcoming slash preview
- `sweep`: `player.slashCardinal` — locked-in cardinal
- `transition.active`: skip entirely (existing guard)

All parts drawn same color (red, low alpha). Overlapping regions appear slightly darker — acceptable.

### Down-facing arc direction

`SLASH_ARCS[1]` is currently mutated in `startSweep` based on `player.lastHorizDir`. With this refactor, `getSlashHitbox(cardinal)` computes the correct arc for cardinal 1 from `player.lastHorizDir` at call time — no mutation needed. This also fixes the stale-arc bug for down-facing debug preview (separate open TODO).

---

## New module: `src/hitbox.js`

```js
export function testPoint(part, dx, dy, sweepAngle) {
  if (part.type === 'wedge') {
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx);
    const halfAngTol = dist > 0 ? Math.atan2(13, dist) : Math.PI;
    let d = angle - sweepAngle;
    while (d >  Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d) <= halfAngTol && dist <= part.reach + 13;
  }
  if (part.type === 'rect') {
    const ca = Math.cos(part.angle), sa = Math.sin(part.angle);
    const along = dx * ca + dy * sa;
    const perp  = Math.abs(-dx * sa + dy * ca);
    return along >= -13 && along <= part.length + 13 && perp <= part.halfWidth + 13;
  }
  return false;
}

export function drawHitbox(parts, ctx, ox, oy) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,0,0,0.7)';
  ctx.fillStyle   = 'rgba(255,0,0,0.12)';
  ctx.lineWidth   = 1;
  for (const part of parts) {
    if (part.type === 'wedge') {
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.arc(ox, oy, part.reach, part.start, part.start + part.delta, part.delta < 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (part.type === 'rect') {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(part.angle);
      ctx.beginPath();
      ctx.rect(0, -part.halfWidth, part.length, part.halfWidth * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}
```

---

## Changes per file

### `src/player.js`
- Add `export function getSlashHitbox(cardinal)`:
  - For cardinal 1: compute arc from `player.lastHorizDir` (same logic as current `startSweep` mutation, but non-mutating)
  - For others: read `SLASH_ARCS[cardinal]`
  - Return compound array `[wedge, startRect, endRect]` using `player.slashRange`
- `startSweep` can stop mutating `SLASH_ARCS[1]` — `getSlashHitbox` handles it. Keep `SLASH_ARCS` as static defaults only.

### `src/grass.js`
- Import `testPoint` from `./hitbox.js`
- `checkSlashHits(sweepAngle)`: replace inline angle math with `testPoint(wedgePart, dx, dy, sweepAngle)`. Get `wedgePart` from `getSlashHitbox(player.slashCardinal)[0]`.
- Add `export function checkSlashCap(rectPart)`: iterate live grasses, call `testPoint(rectPart, dx, dy)` (no sweepAngle needed — rect ignores it), `cutGrass(g)` on hit.

### `src/main.js`
- Import `checkSlashCap`, `getSlashHitbox`
- Where sweep timer ticks: on first frame (`player.slashTimer === player.sweepDur` just after `startSweep`), call `checkSlashCap(getSlashHitbox(player.slashCardinal)[1])`.
- On last sweep frame (`player.slashTimer === 1`, just before `startRetract`), call `checkSlashCap(getSlashHitbox(player.slashCardinal)[2])`.

### `src/render.js`
- Import `drawHitbox` from `./hitbox.js`, `getSlashHitbox` from `./player.js`
- In `drawDebug`: compute `arcCardinal` (existing logic — `snapCardinal(player.facing)` during idle/retract, `player.slashCardinal` during sweep). Call `drawHitbox(getSlashHitbox(arcCardinal), ctx, px, py)`. Remove all old arc/debug drawing code.
- Down-arc direction bug is fixed automatically — `getSlashHitbox` computes arc from `lastHorizDir` at call time.

### `src/hitbox.js` (new file)
- `testPoint(part, dx, dy, sweepAngle)`
- `drawHitbox(parts, ctx, ox, oy)`

---

## TODO items to update after this plan is implemented

- Replace `[ux] quarter-stadium slash hitbox` TODO — caps are now part of this refactor
- Remove `[bug] debug arc wrong direction for down-facing idle` TODO — fixed by `getSlashHitbox` computing arc from `lastHorizDir`
- Add single `[refactor] hitbox system` TODO pointing at this plan

## Open questions (none — all resolved in discussion)

- Timing: main.js owns it, hitbox.js is stateless ✓
- Debug angle: no sweepAngle in drawHitbox, always full preview ✓
- Same color for all parts ✓
- Skip during transition.active ✓
