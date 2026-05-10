import { W, H, TILE } from './constants.js';
import { upgrades } from './upgrades.js';

export const SLASH_ARCS = [
  { start: -Math.PI/2, delta:  Math.PI/2 }, // right
  { start:  Math.PI,   delta: -Math.PI/2 }, // down
  { start: -Math.PI/2, delta: -Math.PI/2 }, // left
  { start:  0,         delta: -Math.PI/2 }, // up
];


export function snapCardinal(angle) {
  const a = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (a > -Math.PI*3/4 && a <= -Math.PI/4) return 3;
  if (a > -Math.PI/4   && a <=  Math.PI/4) return 0;
  if (a >  Math.PI/4   && a <=  Math.PI*3/4) return 1;
  return 2;
}

export const player = {
  x: Math.floor(W / 2 / TILE) * TILE + TILE / 2,
  y: Math.floor(H / 2 / TILE) * TILE + TILE / 2,
  facing: 0,
  prevFacing: 0,
  slashCardinal: 0,
  slashState: 'idle',
  slashTimer: 0,
  sweepDur: 8,
  retractDur: 5,
  autoSlashCooldown: 0,
  lastHorizDir: 1,
  get speed()      { return 2.8 + upgrades.moveSpeed.level * 0.4; },
  get slashRange() { return 44 + upgrades.slashRange.level * 12; },
};

export let slashQueued = false;

export function setSlashQueued(val) {
  slashQueued = val;
}

export let slashCount = 0;

export function trySlash() {
  if (player.slashState === 'idle' || player.slashState === 'retracting') {
    startSweep(snapCardinal(player.facing));
  } else {
    slashQueued = true;
  }
}

export function startSweep(cardinal) {
  player.slashState    = 'sweeping';
  player.slashTimer    = player.sweepDur;
  player.slashCardinal = cardinal;
  if (cardinal === 1) {
    if (player.lastHorizDir >= 0) {
      SLASH_ARCS[1] = { start: 0, delta: Math.PI / 2 };
    } else {
      SLASH_ARCS[1] = { start: Math.PI, delta: -Math.PI / 2 };
    }
  }
  slashCount++;
}

export function startRetract() {
  player.slashState = 'retracting';
  player.slashTimer = player.retractDur;
}
