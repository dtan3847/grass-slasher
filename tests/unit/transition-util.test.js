import { describe, it, expect } from 'vitest';
import { snapEntryPosition } from '../../src/transition-util.js';

const TILE = 32;
const W = 320; // 10 cols * 32
const H = 256; // 8 rows * 32
const EDGE = 14;
const NEVER_BLOCKED = () => false;

describe('snapEntryPosition', () => {
  it('returns intended position when nothing is blocked', () => {
    const result = snapEntryPosition(EDGE + 1, 128, 'right', W, H, NEVER_BLOCKED);
    expect(result.x).toBe(EDGE + 1);
    expect(result.y).toBe(128);
  });

  it('snaps y to nearest unblocked tile center when entry tile is blocked (right entry)', () => {
    // Player intended to enter at x=15, y=112 (tile center for row 3)
    // Block that tile center on the perpendicular (y) axis
    const intendedY = 3 * TILE + TILE / 2; // 112
    const fixedX = EDGE + 1; // 15
    const blocked = (x, y) => Math.abs(y - intendedY) < TILE / 2;

    const result = snapEntryPosition(fixedX, intendedY, 'right', W, H, blocked);
    expect(result.x).toBe(fixedX);
    // Should snap to either tile 2 (y=80) or tile 4 (y=144) — nearest unblocked
    expect(result.y).not.toBe(intendedY);
    expect(blocked(result.x, result.y)).toBe(false);
    // Nearest neighbours are 80 and 144; distance from 112 is equal, so expect 80 (first searched upward)
    expect([80, 144]).toContain(result.y);
  });

  it('snaps y upward when lower tile center is blocked too (right entry)', () => {
    const intendedY = 3 * TILE + TILE / 2; // 112
    const fixedX = EDGE + 1;
    // Block row 3 (y=112) and row 4 (y=144)
    const blocked = (x, y) =>
      Math.abs(y - (3 * TILE + TILE / 2)) < TILE / 2 ||
      Math.abs(y - (4 * TILE + TILE / 2)) < TILE / 2;

    const result = snapEntryPosition(fixedX, intendedY, 'right', W, H, blocked);
    expect(result.x).toBe(fixedX);
    expect(blocked(result.x, result.y)).toBe(false);
  });

  it('snaps x to nearest unblocked tile center when entry tile is blocked (down entry)', () => {
    const intendedX = 5 * TILE + TILE / 2; // 176
    const fixedY = EDGE + 1; // 15
    const blocked = (x, y) => Math.abs(x - intendedX) < TILE / 2;

    const result = snapEntryPosition(intendedX, fixedY, 'down', W, H, blocked);
    expect(result.y).toBe(fixedY);
    expect(result.x).not.toBe(intendedX);
    expect(blocked(result.x, result.y)).toBe(false);
  });

  it('snaps x for up entry', () => {
    const intendedX = 4 * TILE + TILE / 2; // 144
    const fixedY = H - EDGE - 1; // 241
    const blocked = (x, y) => Math.abs(x - intendedX) < TILE / 2;

    const result = snapEntryPosition(intendedX, fixedY, 'up', W, H, blocked);
    expect(result.y).toBe(fixedY);
    expect(blocked(result.x, result.y)).toBe(false);
  });

  it('snaps y for left entry', () => {
    const intendedY = 2 * TILE + TILE / 2; // 80
    const fixedX = W - EDGE - 1; // 305
    const blocked = (x, y) => Math.abs(y - intendedY) < TILE / 2;

    const result = snapEntryPosition(fixedX, intendedY, 'left', W, H, blocked);
    expect(result.x).toBe(fixedX);
    expect(blocked(result.x, result.y)).toBe(false);
  });

  it('falls back to intended position when all tile centers are blocked', () => {
    const intendedX = EDGE + 1;
    const intendedY = 128;
    const allBlocked = () => true;

    const result = snapEntryPosition(intendedX, intendedY, 'right', W, H, allBlocked);
    expect(result.x).toBe(intendedX);
    expect(result.y).toBe(intendedY);
  });
});
