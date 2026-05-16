import { describe, it, expect } from 'vitest';
import { upgrades, getUpgradeCost, buyUpgrade } from '../../src/upgrades.js';

describe('getUpgradeCost', () => {
  it('returns baseCost at level 0', () => {
    upgrades.gemMult.level = 0;
    expect(getUpgradeCost('gemMult')).toBe(upgrades.gemMult.baseCost);
  });

  it('scales by costMult per level', () => {
    upgrades.gemMult.level = 2;
    const expected = Math.floor(
      upgrades.gemMult.baseCost * upgrades.gemMult.costMult ** 2
    );
    expect(getUpgradeCost('gemMult')).toBe(expected);
  });
});

describe('regrowth upgrade', () => {
  it('exists with baseCost 60', () => {
    expect(upgrades.regrowth).toBeDefined();
    expect(upgrades.regrowth.baseCost).toBe(60);
  });

  it('getUpgradeCost returns 60 at level 0', () => {
    upgrades.regrowth.level = 0;
    expect(getUpgradeCost('regrowth')).toBe(60);
  });

  it('maxLevel is 1', () => {
    expect(upgrades.regrowth.maxLevel).toBe(1);
  });

  it('buyUpgrade does not exceed maxLevel 1', () => {
    upgrades.regrowth.level = 1;
    buyUpgrade('regrowth');
    expect(upgrades.regrowth.level).toBe(1);
  });
});
