import { W, H, COLS, ROWS, TILE } from './constants.js';
import worldData from './world-data.json';

export let roomX = 1, roomY = 2;

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
  oldRocks: [],
  oldCamX: 0, oldCamY: 0,
  oldRX: 0, oldRY: 0,
  playerEntryX: 0, playerEntryY: 0,
};

export const PAYMENT_ZONE = { rx:1, ry:0, px:W/2, py:H/2, radius:40 };

export function getCurrentRoom() { return worldData.rooms[`${roomX},${roomY}`]; }

export function getNeighbor(dir) {
  const dx = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
  const dy = dir === 'down'  ? 1 : dir === 'up'   ? -1 : 0;
  const nx = roomX + dx, ny = roomY + dy;
  return worldData.rooms[`${nx},${ny}`] ? [nx, ny] : null;
}

export function getRoomPixelSize(rx, ry) {
  const r = worldData.rooms[`${rx},${ry}`];
  return r ? { w: r.widthCells * W, h: r.heightCells * H } : { w: W, h: H };
}

export function getLayout(rx, ry) { return worldData.rooms[`${rx},${ry}`]?.layout ?? []; }

export function getRockTiles(rx, ry) {
  const half = TILE / 2;
  const rocks = worldData.rooms[`${rx},${ry}`]?.rocks ?? [];
  return rocks.map(({col, row}) => ({ x: col * TILE + half, y: row * TILE + half }));
}

export function triggerTransition(dir, oldGrassesSnapshot) {
  const nb = getNeighbor(dir);
  if (!nb || transition.active) return false;
  transition.active    = true;
  transition.direction = dir;
  transition.frame     = 0;
  transition.toRX      = nb[0];
  transition.toRY      = nb[1];
  transition.oldGrasses = oldGrassesSnapshot;
  transition.oldRocks  = getRockTiles(roomX, roomY);
  transition.oldCamX   = camera.x;
  transition.oldCamY   = camera.y;
  transition.oldRX     = roomX;
  transition.oldRY     = roomY;
  return true;
}

export function advanceTransition() {
  if (!transition.active) return;
  transition.frame++;
  if (transition.frame >= transition.duration) {
    transition.active     = false;
    transition.oldGrasses = [];
    transition.oldRocks   = [];
  }
}

export function commitTransition() {
  roomX = transition.toRX;
  roomY = transition.toRY;
}

export function updateCamera(px, py, roomPxW, roomPxH) {
  camera.x = Math.max(0, Math.min(roomPxW - W, px - W * 0.5));
  camera.y = Math.max(0, Math.min(roomPxH - H, py - H * 0.5));
}
