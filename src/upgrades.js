import { spendGems, gemCount } from './gems.js';
import { debugMode } from './debug.js';

export const upgrades = {
  gemMult:    { level: 0, baseCost: 10,  costMult: 1.6, maxLevel: 20 },
  slashRange: { level: 0, baseCost: 20,  costMult: 1.7, maxLevel: 20 },
  autoSlash:  { level: 0, baseCost: 50,  costMult: 2.2, maxLevel: 20 },
  gemTier:    { level: 0, baseCost: 30,  costMult: 2.0, maxLevel: 3 },
  moveSpeed:  { level: 0, baseCost: 25,  costMult: 1.8, maxLevel: 5 },
  magnet:     { level: 0, baseCost: 25,  costMult: 1.6, maxLevel: 10 },
  regrowth:     { level: 0, baseCost: 60,  costMult: 1.0, maxLevel: 1 },
  magnetSword:  { level: 0, baseCost: 30,  costMult: 1.7, maxLevel: 5 },
};

export function getUpgradeCost(id) {
  const u = upgrades[id];
  return Math.floor(u.baseCost * Math.pow(u.costMult, u.level));
}

export function buyUpgrade(id) {
  const u = upgrades[id];
  if (u.maxLevel !== undefined && u.level >= u.maxLevel) return;
  const cost = getUpgradeCost(id);
  if (gemCount < cost && !debugMode) return;
  if (gemCount >= cost) spendGems(cost);
  upgrades[id].level++;
}
