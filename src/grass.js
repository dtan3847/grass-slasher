import { TILE } from './geometry.js';
import { player, getSlashHitbox } from './player.js';
import { upgrades } from './upgrades.js';
import { testPoint } from './hitbox.js';
import { gems, spawnGem, TIER_WEIGHTS } from './gems.js';
import { addCutParticles } from './render.js';
import { getLayout, roomX, roomY } from './world.js';

export const grasses = [];
export const occupiedCells = new Set();

export function cellKey(col, row) { return col * 1000 + row; }

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

export function initGrass() { loadRoom(roomX, roomY); }

export function checkSlashHits(sweepAngle, recordTarget, prevAngle) {
  const wedgePart = getSlashHitbox(player.slashCardinal)[0];
  const coarseReach = wedgePart.reach + 13;
  const gemCountBefore = gems.length;

  for (const g of grasses) {
    if (!g.alive) continue;
    const dx = g.x - player.x;
    const dy = g.y - player.y;
    if (dx * dx + dy * dy > coarseReach * coarseReach) continue;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    let hit;
    if (prevAngle !== null && prevAngle !== undefined) {
      // Swept-arc test: check if the tile angle falls anywhere in the interval
      // [prevAngle, sweepAngle] swept this frame, accounting for direction.
      hit = testSweptArc(wedgePart, dx, dy, prevAngle, sweepAngle, dist, angle);
    } else {
      hit = testPoint(wedgePart, dx, dy, sweepAngle);
    }

    if (hit) cutGrass(g);
    if (recordTarget) {
      const halfAngTol = dist > 0 ? Math.atan2(13, dist) : Math.PI;
      let d = angle - sweepAngle;
      while (d >  Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
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

  if (upgrades.magnetSword.level > 0) {
    for (let i = gemCountBefore - 1; i >= 0; i--) {
      const gm = gems[i];
      if (gm.magnetSwordHit) continue;
      const dx = gm.x - player.x;
      const dy = gm.y - player.y;
      if (dx * dx + dy * dy > coarseReach * coarseReach) continue;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      let hit;
      if (prevAngle !== null && prevAngle !== undefined) {
        hit = testSweptArc(wedgePart, dx, dy, prevAngle, sweepAngle, dist, angle);
      } else {
        hit = testPoint(wedgePart, dx, dy, sweepAngle);
      }
      if (hit && dist > 0) {
        gm.rest = false;
        gm.magnetSwordHit = true;
        const pull = 1.5 + upgrades.magnetSword.level * 0.8;
        const jitter = (Math.random() - 0.5) * 0.4;
        const cos = Math.cos(jitter), sin = Math.sin(jitter);
        const nx = (-dx / dist) * cos - (-dy / dist) * sin;
        const ny = (-dx / dist) * sin + (-dy / dist) * cos;
        gm.vx += nx * pull;
        gm.vy += ny * pull;
      }
    }
  }
}

// Test whether a point falls within the angular interval swept from prevAngle
// to sweepAngle (inclusive, with halfAngTol padding) and within radial reach.
function testSweptArc(wedgePart, dx, dy, prevAngle, sweepAngle, dist, angle) {
  if (dist > wedgePart.reach + 13) return false;
  const halfAngTol = dist > 0 ? Math.atan2(13, dist) : Math.PI;

  // Determine sweep direction from the sign of delta in the arc.
  // The swept interval goes from prevAngle toward sweepAngle.
  // Normalise to find the angular gap in sweep direction.
  let delta = sweepAngle - prevAngle;
  while (delta >  Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  // Offset from prevAngle to tile angle, in same direction as delta.
  let d = angle - prevAngle;
  while (d >  Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  if (delta < 0 && d > 0) d -= Math.PI * 2;
  if (delta > 0 && d < 0) d += Math.PI * 2;

  // Hit if tile angle (with tolerance) falls within [0, |delta|] offset from prevAngle.
  const absD = delta >= 0 ? d : -d;
  const absDelta = Math.abs(delta);
  return absD >= -halfAngTol && absD <= absDelta + halfAngTol;
}

export function checkSlashCap(rectPart) {
  for (const g of grasses) {
    if (!g.alive) continue;
    const dx = g.x - player.x;
    const dy = g.y - player.y;
    if (testPoint(rectPart, dx, dy, 0)) cutGrass(g);
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
