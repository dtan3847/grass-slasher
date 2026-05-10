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

export let roomX = 0, roomY = 2;

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
  playerEntryX: 0, playerEntryY: 0,
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
