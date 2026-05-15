import { canvas, ctx, W, H, SCALE } from './constants.js';
import { player, SLASH_ARCS, slashQueued, setSlashQueued, trySlash, startSweep, startRetract, snapCardinal, getSlashHitbox } from './player.js';
import { grasses, initGrass, checkSlashHits, checkSlashCap, loadRoom } from './grass.js';
import { gemCount, addGems, updateGems, clearGems } from './gems.js';
import { upgrades, getUpgradeCost, buyUpgrade } from './upgrades.js';
import { debtRemaining, DEBT_TOTAL, payDebt, isDebtCleared } from './debt.js';
import { transition, camera, getNeighbor, triggerTransition, advanceTransition, commitTransition, updateCamera, getCurrentRoom, getRoomPixelSize, getRockTiles, roomX, roomY, PAYMENT_ZONE } from './world.js';
import { drawGround, drawGrass, drawGems, drawPlayer, drawRocks, drawParticles, drawFloats, drawTransition, updateParticles, drawDebug, drawDebugButton, drawIntro, drawPaymentZone, drawWinScreen, winContinueBtn, drawJoystick } from './render.js';
import { installTestHooks } from './test-hooks.js';
import { debugMode, setDebugMode } from './debug.js';

window.buyUpgrade = buyUpgrade;
window.toggleAutoSlash = function() { autoSlashEnabled = !autoSlashEnabled; };

let introShown = false;
let debugLog  = [];
let slashRecords = [];
let currentSlashRecord = null;
let frameCount = 0;
let autoSlashEnabled = true;
let grassSpawnEnabled = true;
export let gameWon = false;

const keys = {};

const JOYSTICK_DEADZONE = 10; // logical px
const JOYSTICK_RADIUS   = 28; // logical px — matches visual ring radius
let joystick = null;
// when active: { identifier, anchorX, anchorY, thumbX, thumbY, dirX, dirY, magnitude }
// all coords in logical px. dirX/dirY = unit vector when magnitude >= DEADZONE, else (0,0).

function blockedAt(nx, ny) {
  const halfSum = 7 + 11;
  for (const g of grasses) {
    if (!g.alive) continue;
    if (Math.abs(g.x - nx) < halfSum && Math.abs(g.y - ny) < halfSum) return true;
  }
  const rocks = getRockTiles(roomX, roomY);
  for (const r of rocks) {
    if (Math.abs(r.x - nx) < halfSum && Math.abs(r.y - ny) < halfSum) return true;
  }
  return false;
}

const EDGE = 14;

function applyMovement(stepX, stepY) {
  const room = getCurrentRoom();
  const roomPxW = room.widthCells * W;
  const roomPxH = room.heightCells * H;

  const nx = player.x + stepX;
  if (nx < EDGE) {
    if (getNeighbor('left')) { startTransition('left'); return; }
    else player.x = EDGE;
  } else if (nx > roomPxW - EDGE) {
    if (getNeighbor('right')) { startTransition('right'); return; }
    else player.x = roomPxW - EDGE;
  } else {
    if (!blockedAt(nx, player.y)) player.x = nx;
  }

  const ny = player.y + stepY;
  if (ny < EDGE) {
    if (getNeighbor('up')) { startTransition('up'); return; }
    else player.y = EDGE;
  } else if (ny > roomPxH - EDGE) {
    if (getNeighbor('down')) { startTransition('down'); return; }
    else player.y = roomPxH - EDGE;
  } else {
    if (!blockedAt(player.x, ny)) player.y = ny;
  }
}

function startTransition(dir) {
  if (transition.active) return;
  const snapshot = [...grasses];
  if (!triggerTransition(dir, snapshot)) return;
  loadRoom(transition.toRX, transition.toRY);
  const { w: nw, h: nh } = getRoomPixelSize(transition.toRX, transition.toRY);
  transition.playerEntryX = player.x;
  transition.playerEntryY = player.y;
  switch (dir) {
    case 'up':    transition.playerEntryY = nh - EDGE - 1; break;
    case 'down':  transition.playerEntryY = EDGE + 1;      break;
    case 'left':  transition.playerEntryX = nw - EDGE - 1; break;
    case 'right': transition.playerEntryX = EDGE + 1;      break;
  }
}

function repositionPlayer(dir) {
  const { w: nw, h: nh } = getRoomPixelSize(transition.toRX, transition.toRY);
  switch (dir) {
    case 'up':    player.y = nh - EDGE - 1; break;
    case 'down':  player.y = EDGE + 1;      break;
    case 'left':  player.x = nw - EDGE - 1; break;
    case 'right': player.x = EDGE + 1;      break;
  }
}

function update() {
  frameCount++;

  if (transition.active) {
    if (transition.frame === transition.duration - 1) {
      repositionPlayer(transition.direction);
      clearGems();
      commitTransition();
    }
    advanceTransition();
    return;
  }

  const room = getCurrentRoom();
  updateCamera(player.x, player.y, room.widthCells * W, room.heightCells * H);

  const inPaymentRoom = roomX === PAYMENT_ZONE.rx && roomY === PAYMENT_ZONE.ry;
  const nearPaymentZone = inPaymentRoom &&
    Math.hypot(player.x - PAYMENT_ZONE.px, player.y - PAYMENT_ZONE.py) <= PAYMENT_ZONE.radius;
  const promptEl = document.getElementById('debt-prompt');
  if (promptEl) promptEl.style.display = (nearPaymentZone && !gameWon && !isDebtCleared() && gemCount >= debtRemaining) ? 'block' : 'none';

  if (!gameWon) {
    let dx = 0, dy = 0;
    if (joystick && (joystick.dirX !== 0 || joystick.dirY !== 0)) {
      dx = joystick.dirX;
      dy = joystick.dirY;
    } else {
      if (keys['ArrowLeft']  || keys['KeyA']) dx -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
      if (keys['ArrowUp']    || keys['KeyW']) dy -= 1;
      if (keys['ArrowDown']  || keys['KeyS']) dy += 1;
    }

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      const newFacing = Math.atan2(dy, dx);
      if (newFacing !== player.facing) player.prevFacing = player.facing;
      player.facing = newFacing;
      if (dx > 0) player.lastHorizDir = 1;
      else if (dx < 0) player.lastHorizDir = -1;
      const stepX = (dx / len) * player.speed;
      const stepY = (dy / len) * player.speed;
      applyMovement(stepX, stepY);
    }
  }

  if (player.slashState === 'sweeping') {
    const arc = SLASH_ARCS[player.slashCardinal];
    const t = 1 - player.slashTimer / player.sweepDur;
    const currentAngle = arc.start + t * arc.delta;

    // open record on first frame of this sweep
    if (debugMode && player.slashTimer === player.sweepDur) {
      currentSlashRecord = {
        slashN: slashRecords.length,
        frame: frameCount,
        playerX: Math.round(player.x), playerY: Math.round(player.y),
        cardinal: player.slashCardinal,
        slashRange: player.slashRange,
        arcStart: +arc.start.toFixed(3), arcDelta: +arc.delta.toFixed(3),
        grassSnapshot: grasses
          .filter(g => g.alive)
          .map(g => ({ x: Math.round(g.x), y: Math.round(g.y) })),
        frames: [],
      };
    }

    if (player.slashTimer === player.sweepDur) {
      checkSlashCap(getSlashHitbox(player.slashCardinal)[1]);
    }

    let frameRecord = null;
    if (debugMode && currentSlashRecord) {
      frameRecord = { frame: frameCount, t: +t.toFixed(3), currentAngle: +currentAngle.toFixed(3), grasses: [] };
    }
    checkSlashHits(currentAngle, frameRecord);
    if (frameRecord) currentSlashRecord.frames.push(frameRecord);
  }

  if (player.slashTimer > 0) {
    player.slashTimer--;
    if (player.slashTimer === 0) {
      if (player.slashState === 'sweeping') {
        const arc = SLASH_ARCS[player.slashCardinal];
        let finalFrame = null;
        if (debugMode && currentSlashRecord) {
          finalFrame = { frame: frameCount, t: 1.0, currentAngle: +(arc.start + arc.delta).toFixed(3), grasses: [] };
        }
        checkSlashHits(arc.start + arc.delta, finalFrame);
        if (debugMode && currentSlashRecord) {
          if (finalFrame) currentSlashRecord.frames.push(finalFrame);
          slashRecords.push(currentSlashRecord);
          debugLog.push({ type: 'slash', ...currentSlashRecord });
          currentSlashRecord = null;
        }
        checkSlashCap(getSlashHitbox(player.slashCardinal)[2]);
        if (slashQueued) {
          setSlashQueued(false);
          startSweep(snapCardinal(player.facing));
        } else {
          startRetract();
        }
      } else if (player.slashState === 'retracting') {
        player.slashState = 'idle';
      }
    }
  }

  if (player.autoSlashCooldown > 0) player.autoSlashCooldown--;
  if (!gameWon && autoSlashEnabled && upgrades.autoSlash.level > 0 && player.slashState === 'idle' && player.autoSlashCooldown <= 0) {
    player.autoSlashCooldown = Math.max(10, 46 - upgrades.autoSlash.level * 10);
    trySlash();
  }

  for (const g of grasses) {
    if (!g.alive) {
      if (g.cutAnim > 0) g.cutAnim -= 0.05;
      if (grassSpawnEnabled) {
        g.respawnTimer--;
        if (g.respawnTimer <= 0) {
          if (Math.hypot(player.x - g.x, player.y - g.y) < 18) {
            g.respawnTimer = 10;
          } else {
            g.alive = true;
          }
        }
      }
    }
  }

  updateParticles();
  updateGems(Math.max(1, Math.floor(Math.pow(1.5, upgrades.gemMult.level))));
}

if (new URLSearchParams(location.search).has('test')) {
  installTestHooks({
    tick: update,
    skipIntro: () => { introShown = true; },
    getFrameCount: () => frameCount,
    getGameWon: () => gameWon,
  });
}

function updateUI() {
  document.getElementById('gem-count').textContent = gemCount;
  document.getElementById('debt-display').textContent = `Debt: ${debtRemaining}`;

  const defs = [
    ['btn-gems',     'gemMult',    lvl => `&#128142; +Yield Lv${lvl+1}`,      20],
    ['btn-range',    'slashRange', lvl => `&#128207; Sword Size Lv${lvl+1}`,  20],
    ['btn-auto',     'autoSlash',  lvl => `&#129302; Auto-Slash Lv${lvl+1}`,  20],
    ['btn-gemtier',   'gemTier',    lvl => `&#128081; Gem Tier Lv${lvl+1}`,    3],
    ['btn-movespeed', 'moveSpeed',  lvl => `&#128070; Move Speed Lv${lvl+1}`,  5],
    ['btn-magnet',    'magnet',     lvl => `&#129516; Magnet Lv${lvl+1}`,      20],
  ];

  for (const [btnId, id, label, maxLevel] of defs) {
    const cost = getUpgradeCost(id);
    const lvl  = upgrades[id].level;
    const btn  = document.getElementById(btnId);
    if (maxLevel !== null && lvl >= maxLevel) {
      btn.innerHTML = `${label(lvl - 1).replace(/Lv\d+/, 'MAX')}`;
      btn.disabled  = true;
    } else {
      btn.innerHTML = `${label(lvl)} (${cost})`;
      btn.disabled  = gemCount < cost;
    }
    if (lvl > 0) btn.classList.add('leveled');
  }

  const toggleBtn = document.getElementById('btn-autoslash-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = autoSlashEnabled ? 'Auto-slash: ON' : 'Auto-slash: OFF';
    toggleBtn.classList.toggle('autoslash-on',  autoSlashEnabled);
    toggleBtn.classList.toggle('autoslash-off', !autoSlashEnabled);
  }
}

function loop() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  if (!introShown) {
    drawIntro();
    requestAnimationFrame(loop);
    return;
  }
  update();
  if (transition.active) {
    drawTransition();
    drawFloats();
    drawJoystick(joystick);
    drawDebugButton(debugMode, grassSpawnEnabled);
  } else {
    drawGround();
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    drawRocks(getRockTiles(roomX, roomY));
    if (roomX === PAYMENT_ZONE.rx && roomY === PAYMENT_ZONE.ry) drawPaymentZone(frameCount);
    for (const g of grasses) drawGrass(g);
    drawGems();
    drawPlayer();
    drawParticles();
    drawFloats();
    ctx.restore();
    drawJoystick(joystick);
    drawDebugButton(debugMode, grassSpawnEnabled);
  }
  drawWinScreen(gameWon);
  drawDebug(debugMode, frameCount);
  updateUI();
  requestAnimationFrame(loop);
}

function logSlash() {
  if (!debugMode) return;
  debugLog.push({
    frame:        frameCount,
    facing:       player.facing,
    facingDeg:    Math.round(player.facing * 180 / Math.PI),
    snapResult:   snapCardinal(player.facing),
    prevFacing:   player.prevFacing,
    prevFacingDeg: Math.round(player.prevFacing * 180 / Math.PI),
    slashState:   player.slashState,
  });
}

function downloadLog() {
  const blob = new Blob([JSON.stringify(debugLog, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'slash-log.json';
  a.click();
}

document.addEventListener('keydown', e => {
  if (!introShown) { introShown = true; return; }
  if (gameWon && (e.code === 'Enter' || e.code === 'KeyZ' || e.code === 'Space')) { gameWon = false; e.preventDefault(); return; }
  keys[e.code] = true;
  if (e.code === 'Backquote') {
    setDebugMode(!debugMode);
    return;
  }
  if (e.code === 'KeyM' && debugMode) {
    addGems(100);
    return;
  }
  if (e.code === 'KeyE' && !e.repeat) {
    const nearZone = roomX === PAYMENT_ZONE.rx && roomY === PAYMENT_ZONE.ry &&
      Math.hypot(player.x - PAYMENT_ZONE.px, player.y - PAYMENT_ZONE.py) <= PAYMENT_ZONE.radius;
    if (nearZone && !gameWon && !isDebtCleared() && gemCount >= debtRemaining) {
      payDebt(gemCount);
      if (isDebtCleared()) gameWon = true;
    }
    return;
  }
  if ((e.code === 'Space' || e.code === 'KeyZ') && !e.repeat) {
    e.preventDefault();
    if (!gameWon) trySlash();
    logSlash();
  }
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('click', e => {
  if (!introShown) { introShown = true; return; }
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (W / rect.width);
  const my = (e.clientY - rect.top)  * (H / rect.height);

  if (gameWon) {
    const b = winContinueBtn;
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      gameWon = false;
    }
    return;
  }

  if (debugMode && mx >= W - 130 && mx <= W - 10 && my >= H - 70 && my <= H - 42) {
    grassSpawnEnabled = !grassSpawnEnabled;
    return;
  }
  if (debugMode && mx >= W - 130 && mx <= W - 10 && my >= H - 36 && my <= H - 8) {
    downloadLog();
    return;
  }

  player.facing = Math.atan2(my - player.y, mx - player.x);
  trySlash();
  logSlash();
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const midX = rect.width / 2;

  for (const touch of e.changedTouches) {
    const rawX = touch.clientX - rect.left;
    const rawY = touch.clientY - rect.top;

    if (rawX < midX) {
      // Left half: joystick
      if (!introShown) { introShown = true; continue; }
      if (joystick === null) {
        const ax = rawX * scaleX;
        const ay = rawY * scaleY;
        joystick = { identifier: touch.identifier, anchorX: ax, anchorY: ay, thumbX: ax, thumbY: ay, dirX: 0, dirY: 0, magnitude: 0 };
      }
    } else {
      // Right half: slash
      if (!introShown) { introShown = true; continue; }
      if (gameWon) continue;
      trySlash();
      logSlash();
    }
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (joystick === null) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;

  for (const touch of e.changedTouches) {
    if (touch.identifier !== joystick.identifier) continue;
    const tx = (touch.clientX - rect.left) * scaleX;
    const ty = (touch.clientY - rect.top)  * scaleY;
    const dx = tx - joystick.anchorX;
    const dy = ty - joystick.anchorY;
    const mag = Math.hypot(dx, dy);
    joystick.magnitude = mag;
    if (mag < JOYSTICK_DEADZONE) {
      joystick.dirX = 0;
      joystick.dirY = 0;
      joystick.thumbX = joystick.anchorX + dx;
      joystick.thumbY = joystick.anchorY + dy;
    } else {
      joystick.dirX = dx / mag;
      joystick.dirY = dy / mag;
      if (mag > JOYSTICK_RADIUS) {
        joystick.thumbX = joystick.anchorX + joystick.dirX * JOYSTICK_RADIUS;
        joystick.thumbY = joystick.anchorY + joystick.dirY * JOYSTICK_RADIUS;
      } else {
        joystick.thumbX = tx;
        joystick.thumbY = ty;
      }
    }
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  if (joystick === null) return;
  for (const touch of e.changedTouches) {
    if (touch.identifier === joystick.identifier) {
      joystick = null;
      break;
    }
  }
}, { passive: false });

canvas.addEventListener('touchcancel', e => {
  e.preventDefault();
  if (joystick === null) return;
  for (const touch of e.changedTouches) {
    if (touch.identifier === joystick.identifier) {
      joystick = null;
      break;
    }
  }
}, { passive: false });

initGrass();
loop();
