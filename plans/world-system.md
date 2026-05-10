# Plan: World System with Screen Transitions

## Context
Game currently has one infinite screen with random grass. User wants a BoI-style world: grid of rooms, each room has fixed authored grass, slide-transition between rooms when player hits edge. Rooms can span multiple grid cells (a 1×2 room = 640×960 px gameplay area) with a camera that follows the player within a large room. Initial world: 1 col × 3 rows of 1×1 rooms (no camera movement yet, but system supports large rooms).

## Architecture Overview

New module `src/world.js` sits at the base of the dep graph (imports nothing from other game modules). Everything else imports from it.

```
world.js  ← grass.js, render.js, main.js
```

---

## New file: `src/world.js`

Owns: room definitions, world map adjacency, current room state, camera, transition state.

```js
// Room definitions
// widthCells/heightCells: how many 640×480 cells this room spans
// layout: {col, row}[] — room-local grid coords
const ROOMS = {
  '0,0': {
    widthCells: 1, heightCells: 1,
    layout: [
      {col:2,row:1},{col:3,row:1},{col:2,row:2},{col:4,row:2},{col:3,row:3},
      {col:15,row:1},{col:16,row:1},{col:17,row:2},{col:15,row:3},{col:16,row:3},
      {col:1,row:5},{col:2,row:6},{col:1,row:7},{col:3,row:7},
      {col:17,row:5},{col:18,row:6},{col:17,row:7},{col:16,row:8},
      {col:5,row:6},{col:6,row:7},{col:5,row:8},
      {col:13,row:6},{col:14,row:7},{col:13,row:8},
      {col:3,row:11},{col:4,row:12},{col:15,row:11},{col:16,row:12},
      {col:8,row:12},{col:11,row:12},
    ]
  },
  '0,1': {
    widthCells: 1, heightCells: 1,
    layout: [
      {col:1,row:2},{col:2,row:3},{col:1,row:4},{col:3,row:2},
      {col:17,row:2},{col:16,row:3},{col:18,row:3},{col:17,row:4},
      {col:4,row:5},{col:5,row:5},{col:6,row:6},{col:7,row:5},
      {col:12,row:5},{col:13,row:5},{col:14,row:6},{col:13,row:7},
      {col:2,row:9},{col:3,row:10},{col:2,row:11},
      {col:16,row:9},{col:17,row:10},{col:16,row:11},
      {col:7,row:10},{col:8,row:11},{col:11,row:10},{col:12,row:11},
      {col:9,row:13},{col:10,row:13},
    ]
  },
  '0,2': {
    widthCells: 1, heightCells: 1,
    layout: [
      {col:1,row:1},{col:2,row:1},{col:1,row:2},{col:3,row:2},{col:2,row:3},{col:1,row:4},
      {col:17,row:1},{col:18,row:1},{col:17,row:2},{col:16,row:3},{col:18,row:3},{col:17,row:4},
      {col:5,row:4},{col:6,row:5},{col:5,row:6},{col:4,row:7},
      {col:14,row:4},{col:13,row:5},{col:14,row:6},{col:15,row:7},
      {col:3,row:9},{col:4,row:10},{col:3,row:11},{col:5,row:11},
      {col:15,row:9},{col:16,row:10},{col:15,row:11},{col:14,row:11},
      {col:7,row:12},{col:8,row:13},{col:11,row:13},{col:12,row:12},
    ]
  },
};

// World map adjacency. null = wall.
const WORLD_MAP = {
  '0,0': { up: null,   down: [0,1], left: null, right: null },
  '0,1': { up: [0,0],  down: [0,2], left: null, right: null },
  '0,2': { up: [0,1],  down: null,  left: null, right: null },
};

export let roomX = 0, roomY = 0;

// Camera (top-left of viewport in room-pixel space)
export const camera = { x: 0, y: 0 };

// Transition state
export const transition = {
  active: false,
  direction: null,   // 'up'|'down'|'left'|'right'
  frame: 0,
  duration: 40,
  toRX: 0, toRY: 0,
  oldGrasses: [],
  // camera offset at moment transition started (for old screen draw)
  oldCamX: 0, oldCamY: 0,
};

export function getCurrentRoom() { return ROOMS[`${roomX},${roomY}`]; }

export function getNeighbor(dir) {
  return (WORLD_MAP[`${roomX},${roomY}`] ?? {})[dir] ?? null;
}

export function getRoomPixelSize(rx, ry) {
  const r = ROOMS[`${rx},${ry}`];
  return r ? { w: r.widthCells * 640, h: r.heightCells * 480 } : { w: 640, h: 480 };
}

export function getLayout(rx, ry) { return ROOMS[`${rx},${ry}`]?.layout ?? []; }

export function triggerTransition(dir, oldGrassesSnapshot) {
  const nb = getNeighbor(dir);
  if (!nb || transition.active) return false;
  transition.active    = true;
  transition.direction = dir;
  transition.frame     = 0;
  transition.toRX      = nb[0];
  transition.toRY      = nb[1];
  transition.oldGrasses = oldGrassesSnapshot;
  transition.oldCamX   = camera.x;
  transition.oldCamY   = camera.y;
  return true;
}

export function advanceTransition() {
  if (!transition.active) return;
  transition.frame++;
  if (transition.frame >= transition.duration) {
    transition.active     = false;
    transition.oldGrasses = [];
  }
}

export function commitTransition() {
  roomX = transition.toRX;
  roomY = transition.toRY;
}

export function updateCamera(px, py, roomPxW, roomPxH) {
  camera.x = Math.max(0, Math.min(roomPxW - 640, px - 320));
  camera.y = Math.max(0, Math.min(roomPxH - 480, py - 240));
}
```

---

## `src/gems.js` — add `clearGems()`

One line after `export const gems = []`:
```js
export function clearGems() { gems.length = 0; }
```

---

## `src/grass.js` — add `loadRoom(rx, ry)`

**New import:**
```js
import { getLayout } from './world.js';
```

**New export:**
```js
export function loadRoom(rx, ry) {
  grasses.length = 0;
  occupiedCells.clear();
  for (const { col, row } of getLayout(rx, ry)) {
    const key = cellKey(col, row);
    occupiedCells.add(key);
    grasses.push({
      x: col * TILE + TILE / 2,
      y: row * TILE + TILE / 2,
      alive: true,
      respawnTimer: 0,
      respawnTime: 300 + Math.random() * 180,
      hue: 100 + Math.random() * 35,
      flip: Math.random() < 0.5,
    });
  }
}
```

**Modify `initGrass()`:**
```js
export function initGrass() { loadRoom(0, 0); }
```

`spawnGrass()` unchanged (density upgrade still uses it within a session).

---

## `src/main.js` — edge detection, transition, camera update

**New/modified imports:**
```js
import { grasses, initGrass, checkSlashHits, loadRoom } from './grass.js';
import { gemCount, addGems, updateGems, clearGems } from './gems.js';
import {
  transition, camera, getNeighbor, triggerTransition, advanceTransition,
  commitTransition, updateCamera, getCurrentRoom, getRoomPixelSize
} from './world.js';
// render.js import: add drawTransition to existing import list
```

**Replace hard-clamp bounds with `applyMovement(stepX, stepY)`:**

```js
const EDGE = 14;

function applyMovement(stepX, stepY) {
  const room = getCurrentRoom();
  const roomPxW = room.widthCells * W;
  const roomPxH = room.heightCells * H;

  const nx = player.x + stepX;
  if (nx < EDGE) {
    if (getNeighbor('left')) { startTransition('left'); return; }
    else player.x = EDGE;
  } else if (nx > roomPxW - EDGE) {
    if (getNeighbor('right')) { startTransition('right'); return; }
    else player.x = roomPxW - EDGE;
  } else {
    if (!blockedAt(nx, player.y)) player.x = nx;
  }

  const ny = player.y + stepY;
  if (ny < EDGE) {
    if (getNeighbor('up')) { startTransition('up'); return; }
    else player.y = EDGE;
  } else if (ny > roomPxH - EDGE) {
    if (getNeighbor('down')) { startTransition('down'); return; }
    else player.y = roomPxH - EDGE;
  } else {
    if (!blockedAt(player.x, ny)) player.y = ny;
  }
}
```

**`startTransition(dir)`:**
```js
function startTransition(dir) {
  if (transition.active) return;
  const snapshot = [...grasses];
  if (!triggerTransition(dir, snapshot)) return;
  clearGems();
  loadRoom(transition.toRX, transition.toRY);
}
```

**`repositionPlayer(dir)`** — called one frame before transition ends:
```js
function repositionPlayer(dir) {
  const { w: nw, h: nh } = getRoomPixelSize(transition.toRX, transition.toRY);
  switch (dir) {
    case 'up':    player.y = nh - EDGE - 1; break;
    case 'down':  player.y = EDGE + 1;      break;
    case 'left':  player.x = nw - EDGE - 1; break;
    case 'right': player.x = EDGE + 1;      break;
  }
}
```

**Top of `update()`:**
```js
function update() {
  frameCount++;

  if (transition.active) {
    if (transition.frame === transition.duration - 1) {
      repositionPlayer(transition.direction);
      commitTransition();
    }
    advanceTransition();
    return;  // block all input
  }

  // Camera update each frame
  const room = getCurrentRoom();
  updateCamera(player.x, player.y, room.widthCells * W, room.heightCells * H);

  // ... rest of update unchanged
}
```

**Modified `loop()`:**
```js
function loop() {
  update();
  if (transition.active) {
    drawTransition();
    drawFloats();
    drawDebug(debugMode, frameCount);
    drawDebugButton(debugMode, grassSpawnEnabled);
  } else {
    drawGround();
    // World-space draws wrapped in camera transform
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    for (const g of grasses) drawGrass(g);
    drawGems();
    drawPlayer();
    drawParticles();
    drawFloats();
    ctx.restore();
    // Viewport-space draws (no camera offset)
    drawDebug(debugMode, frameCount);
    drawDebugButton(debugMode, grassSpawnEnabled);
  }
  updateUI();
  requestAnimationFrame(loop);
}
```

> Note: `drawFloats` renders floating gem text which should follow world-space position. Keep inside camera transform. Debug UI is viewport-relative — keep outside.

---

## `src/render.js` — slide animation + camera awareness

**New import:**
```js
import { transition, camera } from './world.js';
import { grasses } from './grass.js';  // already imported
```

**Easing (module-level, not exported):**
```js
function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
```

**`drawTransition()` export:**
```js
export function drawTransition() {
  const t = easeInOut(transition.frame / transition.duration);
  let ox = 0, oy = 0, nx = 0, ny = 0;
  switch (transition.direction) {
    case 'right': ox = -W*t;    nx = W*(1-t);  break;
    case 'left':  ox =  W*t;    nx = -W*(1-t); break;
    case 'down':  oy = -H*t;    ny = H*(1-t);  break;
    case 'up':    oy =  H*t;    ny = -H*(1-t); break;
  }

  // Old screen sliding out
  ctx.save();
  ctx.translate(ox - transition.oldCamX, oy - transition.oldCamY);
  drawGround();
  for (const g of transition.oldGrasses) drawGrass(g);
  ctx.restore();

  // New screen sliding in
  ctx.save();
  ctx.translate(nx - camera.x, ny - camera.y);
  drawGround();
  for (const g of grasses) drawGrass(g);
  ctx.restore();
}
```

---

## Implementation Order

1. `src/world.js` — create (no game imports)
2. `src/gems.js` — add `clearGems()`
3. `src/grass.js` — add `loadRoom`, modify `initGrass`  *(phases 1-3 can run in parallel)*
4. `src/render.js` — add `drawTransition`, import world state
5. `src/main.js` — wire everything; camera transform in `loop()`
6. Build: `npm run build --prefix "E:\Claude-work\grass-slasher"`

Steps 1-4 touch different files → can be dispatched as parallel agents after world.js exists.
Step 5 (main.js) must be last.

---

## Verification

1. Open `index.html` in browser.
2. Start screen: grass in authored positions (not random scatter).
3. Walk south to bottom edge → slide animation (~0.67s), new screen appears.
4. Walk back north → slide to screen (0,0), grass regrown (all alive).
5. Walk north from (0,0) → hard wall, no transition.
6. Walk south from (0,2) → hard wall, no transition.
7. Left/right edges all screens → hard walls.
8. No console errors.

---

## Files Modified
- `src/world.js` — **new**
- `src/gems.js` — add `clearGems`
- `src/grass.js` — add `loadRoom`, import `getLayout`
- `src/render.js` — add `drawTransition`, import world state
- `src/main.js` — edge detection, transition logic, camera, new imports
