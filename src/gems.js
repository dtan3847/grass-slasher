import { W, H } from './constants.js';
import { player } from './player.js';
import { addFloat } from './render.js';
import { upgrades } from './upgrades.js';

export const gems = [];
export function clearGems() { gems.length = 0; }
export let gemCount = 0;

export function addGems(n)   { gemCount += n; }
export function spendGems(n) { gemCount -= n; }

export const TIER_WEIGHTS = [
  [95, 5,  0,  0],
  [80, 15, 5,  0],
  [65, 20, 12, 3],
  [50, 25, 18, 7],
];
export const TIER_VALUES = [1, 5, 10, 20];

export function spawnGem(x, y, amount, tier) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.9 + Math.random() * 1.4;
  const t = tier ?? 0;
  gems.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    amount,
    tier: t,
    baseValue: TIER_VALUES[t],
    life: 1800,
    rest: false,
    bob: Math.random() * Math.PI * 2,
  });
}

export function updateGems(mult = 1) {
  const pickupDist = 14;
  const magnetRange = upgrades.magnet.level > 0 ? 44 + upgrades.magnet.level * 12 : 0;
  for (let i = gems.length - 1; i >= 0; i--) {
    const gm = gems[i];
    const dx = player.x - gm.x;
    const dy = player.y - gm.y;
    const dist = Math.hypot(dx, dy);
    const inMagnet = upgrades.magnet.level > 0 && dist < magnetRange && dist > 0;
    if (inMagnet && gm.rest) {
      gm.rest = false;
    }
    if (!gm.rest) {
      if (inMagnet) {
        const pull = 0.5 * (1 - dist / magnetRange) + 0.15;
        gm.vx += (dx / dist) * pull;
        gm.vy += (dy / dist) * pull;
      }
      gm.x += gm.vx;
      gm.y += gm.vy;
      gm.vx *= 0.88;
      gm.vy *= 0.94;
      if (gm.x < 8)     { gm.x = 8;     gm.vx *= -0.4; }
      if (gm.x > W - 8) { gm.x = W - 8; gm.vx *= -0.4; }
      if (gm.y < 8)     { gm.y = 8;     gm.vy *= -0.4; }
      if (gm.y > H - 8) { gm.y = H - 8; gm.vy *= -0.4; }
      if (!inMagnet && Math.abs(gm.vx) < 0.08 && Math.abs(gm.vy) < 0.08) {
        gm.rest = true;
        gm.vx = 0; gm.vy = 0;
      }
    } else {
      gm.bob += 0.08;
    }
    if (Math.abs(gm.x - player.x) < pickupDist && Math.abs(gm.y - player.y) < pickupDist) {
      const earned = gm.baseValue * gm.amount * mult;
      gemCount += earned;
      addFloat(gm.x, gm.y, earned);
      gems.splice(i, 1);
      continue;
    }
    gm.life--;
    if (gm.life <= 0) gems.splice(i, 1);
  }
}
