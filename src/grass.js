import { TILE, COLS, ROWS } from './constants.js';
import { player } from './player.js';
import { upgrades } from './upgrades.js';
import { spawnGem, TIER_WEIGHTS } from './gems.js';
import { addCutParticles } from './render.js';

export const GRASS_BASE = 60;
export const grasses = [];
export const occupiedCells = new Set();

export function cellKey(col, row) { return col * 1000 + row; }

export function grassCapacity() {
  return GRASS_BASE + upgrades.density.level * 15;
}

export function spawnGrass() {
  const playerCol = Math.floor(player.x / TILE);
  const playerRow = Math.floor(player.y / TILE);
  for (let attempts = 0; attempts < 80; attempts++) {
    const col = Math.floor(Math.random() * COLS);
    const row = Math.floor(Math.random() * ROWS);
    if (col === playerCol && row === playerRow) continue;
    const key = cellKey(col, row);
    if (occupiedCells.has(key)) continue;
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
    return true;
  }
  return false;
}

export function initGrass() {
  for (let i = 0; i < GRASS_BASE; i++) spawnGrass();
}

export function checkSlashHits(sweepAngle, recordTarget) {
  const reach = player.slashRange;
  const coarseReach = reach + 13;

  for (const g of grasses) {
    if (!g.alive) continue;
    const dx = g.x - player.x;
    const dy = g.y - player.y;
    if (dx * dx + dy * dy > coarseReach * coarseReach) continue;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const halfAngTol = dist > 0 ? Math.atan2(13, dist) : Math.PI;
    let d = angle - sweepAngle;
    while (d >  Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const hit = Math.abs(d) <= halfAngTol;
    if (hit) cutGrass(g);
    if (recordTarget) {
      recordTarget.grasses.push({
        gx: Math.round(g.x), gy: Math.round(g.y),
        dist: +dist.toFixed(1),
        angle: +angle.toFixed(3),
        d: +d.toFixed(3),
        halfAngTol: +halfAngTol.toFixed(3),
        hit,
      });
    }
  }
}

function pickGemTier() {
  const weights = TIER_WEIGHTS[upgrades.gemTier.level];
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 0;
}

export function cutGrass(g) {
  g.alive        = false;
  g.respawnTimer = g.respawnTime;
  g.cutAnim      = 1;
  addCutParticles(g.x, g.y, g.hue);
  spawnGem(g.x, g.y, 1, pickGemTier());
}
