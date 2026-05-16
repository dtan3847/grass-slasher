import { TILE } from './geometry.js';

/**
 * After a room transition, the player's entry coordinate on the fixed axis
 * (perpendicular to travel) may land inside a rock. This function scans
 * tile centers along that perpendicular axis, searching outward from the
 * intended position, and returns the nearest unblocked spawn point.
 *
 * @param {number} intendedX
 * @param {number} intendedY
 * @param {'right'|'left'|'up'|'down'} dir  - direction of travel (entry side)
 * @param {number} roomPxW  - room pixel width
 * @param {number} roomPxH  - room pixel height
 * @param {(x:number, y:number) => boolean} blockedFn
 * @returns {{ x: number, y: number }}
 */
export function snapEntryPosition(intendedX, intendedY, dir, roomPxW, roomPxH, blockedFn) {
  if (!blockedFn(intendedX, intendedY)) {
    return { x: intendedX, y: intendedY };
  }

  // For 'right'/'left' travel, x is fixed; scan along y.
  // For 'up'/'down' travel, y is fixed; scan along x.
  const scanAlongY = dir === 'right' || dir === 'left';

  if (scanAlongY) {
    const numRows = Math.round(roomPxH / TILE);
    const centers = [];
    for (let r = 0; r < numRows; r++) {
      centers.push(r * TILE + TILE / 2);
    }
    centers.sort((a, b) => Math.abs(a - intendedY) - Math.abs(b - intendedY));
    for (const cy of centers) {
      if (!blockedFn(intendedX, cy)) {
        return { x: intendedX, y: cy };
      }
    }
  } else {
    const numCols = Math.round(roomPxW / TILE);
    const centers = [];
    for (let c = 0; c < numCols; c++) {
      centers.push(c * TILE + TILE / 2);
    }
    centers.sort((a, b) => Math.abs(a - intendedX) - Math.abs(b - intendedX));
    for (const cx of centers) {
      if (!blockedFn(cx, intendedY)) {
        return { x: cx, y: intendedY };
      }
    }
  }

  // All tile centers are blocked — fall back to intended position.
  return { x: intendedX, y: intendedY };
}
