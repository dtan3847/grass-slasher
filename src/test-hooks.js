import { player } from './player.js';
import { grasses } from './grass.js';
import { gems, gemCount, addGems, spawnGem } from './gems.js';
import { upgrades, buyUpgrade } from './upgrades.js';
import { debtRemaining, DEBT_TOTAL, payDebt } from './debt.js';
import { roomX, roomY } from './world.js';

export function installTestHooks({ tick, skipIntro, getFrameCount, getGameWon }) {
  window.__test = {
    // direct refs (objects/arrays — safe to mutate)
    player, grasses, gems, upgrades,

    // live-read getters for `let`-bound state
    get gemCount()      { return gemCount; },
    get debtRemaining() { return debtRemaining; },
    get debtTotal()     { return DEBT_TOTAL; },
    get roomX()         { return roomX; },
    get roomY()         { return roomY; },
    get gameWon()       { return getGameWon(); },
    get frame()         { return getFrameCount(); },

    // input
    keydown(code) { document.dispatchEvent(new KeyboardEvent('keydown', { code })); },
    keyup(code)   { document.dispatchEvent(new KeyboardEvent('keyup',   { code })); },
    press(code)   { this.keydown(code); this.keyup(code); },

    // time
    tick(n = 1) { for (let i = 0; i < n; i++) tick(); },

    // helpers
    skipIntro,
    addGems,
    spawnGem,
    buyUpgrade,
    payDebt,
    teleport(x, y) { player.x = x; player.y = y; },
    clearGrasses() { grasses.length = 0; },
    setUpgradeLevel(id, lvl) { upgrades[id].level = lvl; },
  };
}
