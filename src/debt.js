import { gemCount, addGems } from './gems.js';

export const DEBT_TOTAL = 500;
export let debtRemaining = DEBT_TOTAL;

export function payDebt(amount) {
  const pay = Math.min(amount, gemCount, debtRemaining);
  if (pay <= 0) return 0;
  addGems(-pay);
  debtRemaining -= pay;
  if (debtRemaining < 0) debtRemaining = 0;
  return pay;
}

export function isDebtCleared() { return debtRemaining <= 0; }
