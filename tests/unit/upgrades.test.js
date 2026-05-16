import { describe, it, expect } from 'vitest';
import { upgrades, getUpgradeCost } from '../../src/upgrades.js';

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
