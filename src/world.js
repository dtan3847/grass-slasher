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
  return (worldData.worldMap[`${roomX},${roomY}`] ?? {})[dir] ?? null;
}

export function getRoomPixelSize(rx, ry) {
  const r = worldData.rooms[`${rx},${ry}`];
  return r ? { w: r.widthCells * W, h: r.heightCells * H } : { w: W, h: H };
}

export function getLayout(rx, ry) { return worldData.rooms[`${rx},${ry}`]?.layout ?? []; }

export function getRockTiles(rx, ry) {
  const adj = worldData.worldMap[`${rx},${ry}`] ?? {};
  const half = TILE / 2;
  const tiles = [];
  if (adj.left === null) {
    for (let r = 0; r < ROWS; r++) tiles.push({ x: 0 * TILE + half, y: r * TILE + half });
  }
  if (adj.right === null) {
    for (let r = 0; r < ROWS; r++) tiles.push({ x: (COLS - 1) * TILE + half, y: r * TILE + half });
  }
  if (adj.up === null) {
    for (let c = 0; c < COLS; c++) tiles.push({ x: c * TILE + half, y: 0 * TILE + half });
  }
  if (adj.down === null) {
    for (let c = 0; c < COLS; c++) tiles.push({ x: c * TILE + half, y: (ROWS - 1) * TILE + half });
  }
  return tiles;
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
