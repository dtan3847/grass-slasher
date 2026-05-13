import { W, H, COLS, ROWS, TILE } from './constants.js';

// Room definitions
// widthCells/heightCells: how many 640×480 cells this room spans
// layout: {col, row}[] — room-local grid coords
const ROOMS = {
  '0,0': { widthCells:1, heightCells:1, layout: [
    {col:1,row:1},{col:2,row:2},{col:1,row:3},{col:3,row:1},
    {col:7,row:1},{col:8,row:2},{col:7,row:3},{col:6,row:1},
    {col:1,row:5},{col:2,row:6},{col:3,row:6},
    {col:7,row:5},{col:8,row:6},{col:6,row:6},
    {col:4,row:3},{col:5,row:4},
  ]},
  '1,0': { widthCells:1, heightCells:1, layout: [
    {col:1,row:1},{col:2,row:1},{col:1,row:2},
    {col:8,row:1},{col:7,row:1},{col:8,row:2},
    {col:1,row:5},{col:2,row:6},{col:1,row:6},
    {col:8,row:5},{col:7,row:6},{col:8,row:6},
    {col:2,row:3},{col:2,row:4},
    {col:7,row:3},{col:7,row:4},
  ]},
  '2,0': { widthCells:1, heightCells:1, layout: [
    {col:1,row:1},{col:2,row:2},{col:1,row:3},{col:3,row:2},
    {col:7,row:1},{col:8,row:2},{col:7,row:3},{col:6,row:2},
    {col:1,row:5},{col:2,row:6},{col:3,row:5},
    {col:7,row:5},{col:8,row:6},{col:6,row:5},
    {col:4,row:4},{col:5,row:3},
  ]},
  '0,1': { widthCells:1, heightCells:1, layout: [
    {col:1,row:1},{col:2,row:1},{col:1,row:2},{col:3,row:2},
    {col:7,row:1},{col:8,row:1},{col:8,row:2},{col:6,row:2},
    {col:1,row:4},{col:1,row:5},{col:2,row:6},
    {col:8,row:4},{col:8,row:5},{col:7,row:6},
    {col:4,row:3},{col:5,row:5},
  ]},
  '1,1': { widthCells:1, heightCells:1, layout: [
    {col:1,row:1},{col:2,row:2},{col:1,row:3},
    {col:8,row:1},{col:7,row:2},{col:8,row:3},
    {col:1,row:5},{col:2,row:6},{col:1,row:6},
    {col:8,row:5},{col:7,row:6},{col:8,row:6},
    {col:4,row:1},{col:5,row:1},{col:4,row:6},{col:5,row:6},
  ]},
  '2,1': { widthCells:1, heightCells:1, layout: [
    {col:1,row:1},{col:2,row:2},{col:3,row:1},{col:1,row:2},
    {col:7,row:1},{col:8,row:2},{col:6,row:1},{col:8,row:1},
    {col:1,row:5},{col:2,row:5},{col:1,row:6},
    {col:7,row:5},{col:8,row:5},{col:8,row:6},
    {col:4,row:3},{col:5,row:4},
  ]},
  '0,2': { widthCells:1, heightCells:1, layout: [
    {col:1,row:1},{col:2,row:2},{col:1,row:3},{col:3,row:1},
    {col:7,row:1},{col:8,row:2},{col:7,row:3},{col:6,row:1},
    {col:1,row:5},{col:2,row:6},{col:3,row:6},
    {col:7,row:5},{col:8,row:6},{col:6,row:6},
    {col:4,row:4},{col:5,row:3},
  ]},
  '1,2': { widthCells:1, heightCells:1, layout: [
    {col:1,row:1},{col:2,row:1},{col:1,row:2},
    {col:8,row:1},{col:7,row:1},{col:8,row:2},
    {col:1,row:5},{col:2,row:6},{col:1,row:6},
    {col:8,row:5},{col:7,row:6},{col:8,row:6},
    {col:2,row:3},{col:2,row:4},
    {col:7,row:3},{col:7,row:4},
  ]},
  '2,2': { widthCells:1, heightCells:1, layout: [
    {col:1,row:1},{col:2,row:2},{col:3,row:1},{col:1,row:2},
    {col:7,row:1},{col:8,row:2},{col:6,row:1},{col:8,row:1},
    {col:1,row:5},{col:2,row:5},{col:3,row:6},
    {col:7,row:5},{col:8,row:5},{col:6,row:6},
    {col:4,row:3},{col:5,row:4},
  ]},
};

// World map adjacency. null = wall.
const WORLD_MAP = {
  '0,0': { up:null,    down:[0,1], left:null,    right:[1,0] },
  '1,0': { up:null,    down:[1,1], left:[0,0],   right:[2,0] },
  '2,0': { up:null,    down:[2,1], left:[1,0],   right:null  },
  '0,1': { up:[0,0],   down:[0,2], left:null,    right:[1,1] },
  '1,1': { up:[1,0],   down:[1,2], left:[0,1],   right:[2,1] },
  '2,1': { up:[2,0],   down:[2,2], left:[1,1],   right:null  },
  '0,2': { up:[0,1],   down:null,  left:null,    right:[1,2] },
  '1,2': { up:[1,1],   down:null,  left:[0,2],   right:[2,2] },
  '2,2': { up:[2,1],   down:null,  left:[1,2],   right:null  },
};

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
  // camera offset at moment transition started (for old screen draw)
  oldCamX: 0, oldCamY: 0,
  playerEntryX: 0, playerEntryY: 0,
};

export const PAYMENT_ZONE = { rx:1, ry:0, px:W/2, py:H/2, radius:40 };

export function getCurrentRoom() { return ROOMS[`${roomX},${roomY}`]; }

export function getNeighbor(dir) {
  return (WORLD_MAP[`${roomX},${roomY}`] ?? {})[dir] ?? null;
}

export function getRoomPixelSize(rx, ry) {
  const r = ROOMS[`${rx},${ry}`];
  return r ? { w: r.widthCells * W, h: r.heightCells * H } : { w: W, h: H };
}

export function getLayout(rx, ry) { return ROOMS[`${rx},${ry}`]?.layout ?? []; }

export function getRockTiles(rx, ry) {
  const adj = WORLD_MAP[`${rx},${ry}`] ?? {};
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
