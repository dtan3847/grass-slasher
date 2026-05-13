import { ctx, W, H, TILE } from './constants.js';
import { player, SLASH_ARCS, snapCardinal, getSlashHitbox } from './player.js';
import { drawHitbox } from './hitbox.js';
import { grasses } from './grass.js';
import { gems } from './gems.js';
import { upgrades } from './upgrades.js';
import { transition, camera, getRockTiles, PAYMENT_ZONE } from './world.js';

export const particles = [];
export const floats    = [];

export function addCutParticles(x, y, hue) {
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1.2 + Math.random() * 2.5;
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 1,
      life: 22 + Math.random() * 18,
      maxLife: 40,
      hue,
      size: 2 + Math.random() * 3,
    });
  }
}

export function addFloat(x, y, amount) {
  floats.push({ x: x - 8, y: y - 10, vy: -0.9, life: 55, amount });
}

export function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.y += f.vy; f.life--;
    if (f.life <= 0) floats.splice(i, 1);
  }
}

export function drawGround() {
  ctx.fillStyle = '#3a5e20';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)';
  ctx.lineWidth   = 0.5;
  for (let x = 0; x <= W; x += TILE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += TILE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

export function drawGrass(g) {
  if (!g.alive) {
    const prog = 1 - g.respawnTimer / g.respawnTime;
    if (prog > 0.7) {
      ctx.globalAlpha = (prog - 0.7) / 0.3 * 0.85;
      drawShrub(g, 0.55);
      ctx.globalAlpha = 1;
    }
    return;
  }
  drawShrub(g, 1);
}

export function drawShrub(g, scale) {
  const cx = g.x, cy = g.y, h = g.hue;
  const dark = `hsl(${h}, 60%, 18%)`;
  const mid  = `hsl(${h}, 62%, 34%)`;
  const lite = `hsl(${h + 10}, 70%, 55%)`;
  const phase = g.flip ? Math.PI / 9 : 0;
  const spikes = 9;
  const outerR = 13 * scale;
  const innerR = 7  * scale;
  function spikePath(grow) {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = (i % 2 === 0 ? outerR : innerR) + grow;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2 + phase;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.fillStyle = dark; spikePath(1.5); ctx.fill();
  ctx.fillStyle = mid;  spikePath(0);   ctx.fill();
  ctx.fillStyle = lite;
  ctx.beginPath();
  ctx.arc(cx - 3 * scale, cy - 4 * scale, 2.5 * scale, 0, Math.PI * 2);
  ctx.fill();
}

const ROCK_PTS = [
  [ 0, -12], [ 8, -9], [13, -3], [11,  7],
  [ 4, 12], [-6, 11], [-13,  5], [-12, -4], [-6, -11]
];

const ROCK_HI_PTS = [
  [ 0, -12], [ 8, -9], [13, -3], [-2, -6]
];

export function drawRocks(rocks) {
  for (const r of rocks) {
    const cx = r.x, cy = r.y;
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(cx + ROCK_PTS[0][0] + 1, cy + ROCK_PTS[0][1] + 2);
    for (let i = 1; i < ROCK_PTS.length; i++) {
      ctx.lineTo(cx + ROCK_PTS[i][0] + 1, cy + ROCK_PTS[i][1] + 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(cx + ROCK_PTS[0][0], cy + ROCK_PTS[0][1]);
    for (let i = 1; i < ROCK_PTS.length; i++) {
      ctx.lineTo(cx + ROCK_PTS[i][0], cy + ROCK_PTS[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.moveTo(cx + ROCK_HI_PTS[0][0], cy + ROCK_HI_PTS[0][1]);
    for (let i = 1; i < ROCK_HI_PTS.length; i++) {
      ctx.lineTo(cx + ROCK_HI_PTS[i][0], cy + ROCK_HI_PTS[i][1]);
    }
    ctx.closePath();
    ctx.fill();
  }
}

export function drawPlayer(px = player.x, py = player.y) {
  ctx.save();
  ctx.translate(px, py);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d6b2d';
  ctx.beginPath();
  ctx.moveTo(-7, -10); ctx.lineTo( 7, -10); ctx.lineTo( 0, -16);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8c46a';
  ctx.fillRect(-6, -10, 12, 8);
  ctx.fillStyle = '#3d8b3d';
  ctx.fillRect(-7, -2, 14, 14);
  ctx.fillStyle = '#2d6b2d';
  ctx.fillRect(-7, 10, 14, 2);
  ctx.fillStyle = '#222';
  const ex = Math.cos(player.facing) * 2;
  ctx.fillRect(-3 + ex, -7, 2, 2);
  ctx.fillRect( 1 + ex, -7, 2, 2);
  if (player.slashState !== 'idle') {
    const arc = SLASH_ARCS[player.slashCardinal];
    let angle, swordLen;
    if (player.slashState === 'sweeping') {
      const t = 1 - player.slashTimer / player.sweepDur;
      angle    = arc.start + t * arc.delta;
      swordLen = player.slashRange - 9;
    } else {
      angle    = arc.start + arc.delta;
      const t  = player.slashTimer / player.retractDur;
      swordLen = (player.slashRange - 9) * t;
    }
    if (swordLen > 1) {
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(220, 235, 255, 0.92)';
      ctx.fillRect(9, -3, swordLen, 6);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(9, -3, swordLen, 2);
      ctx.restore();
    }
  }
  ctx.restore();
}

export function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = (p.life / p.maxLife) * 0.9;
    ctx.fillStyle   = `hsl(${p.hue},70%,55%)`;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

export function drawFloats() {
  ctx.font = 'bold 12px monospace';
  for (const f of floats) {
    ctx.globalAlpha = Math.min(1, f.life / 30);
    ctx.fillStyle   = '#7fff60';
    ctx.fillText(`+${f.amount}`, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

const GEM_FILL   = ['#22c860', '#3090ff', '#ffe030', '#ff3030'];
const GEM_STROKE = ['#0a4020', '#003880', '#806000', '#800000'];

export function drawGems() {
  for (const gm of gems) {
    const yOff = gm.rest ? Math.sin(gm.bob) * 1.2 : 0;
    const blink = gm.life < 240 && (Math.floor(gm.life / 8) % 2 === 0);
    if (blink) continue;
    const tier = gm.tier ?? 0;
    ctx.save();
    ctx.translate(gm.x, gm.y + yOff);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 6 - yOff, 4, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = GEM_FILL[tier];
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = GEM_STROKE[tier];
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(-2, -1); ctx.lineTo(0, -3); ctx.lineTo(0, 1);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

const CARDINAL_NAMES = ['right', 'down', 'left', 'up'];

export function drawDebug(enabled, frame) {
  if (!enabled) return;
  if (transition.active) return;

  const sc = snapCardinal(player.facing);
  const facingDeg = Math.round(player.facing * 180 / Math.PI);
  const prevDeg   = Math.round(player.prevFacing * 180 / Math.PI);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(4, 4, 220, 145);

  ctx.font      = '12px monospace';
  ctx.fillStyle = '#fff';
  const lines = [
    `frame: ${frame}`,
    `facing: ${facingDeg}° (raw: ${player.facing.toFixed(2)})`,
    `prevFacing: ${prevDeg}°`,
    `lastHorizDir: ${player.lastHorizDir}`,
    `snapCardinal: ${sc} (${CARDINAL_NAMES[sc]})`,
    `slashState: ${player.slashState}`,
    `slashCardinal: ${player.slashCardinal}`,
    `slashRange: ${player.slashRange}px`,
  ];
  lines.forEach((line, i) => ctx.fillText(line, 10, 22 + i * 16));

  const arcCardinal = (player.slashState === 'idle' || player.slashState === 'retracting')
    ? snapCardinal(player.facing)
    : player.slashCardinal;
  const px = transition.active ? transition.playerEntryX : player.x;
  const py = transition.active ? transition.playerEntryY : player.y;
  drawHitbox(getSlashHitbox(arcCardinal), ctx, px, py);
}

export function drawDebugButton(enabled, grassSpawnEnabled) {
  if (!enabled) return;
  ctx.fillStyle = grassSpawnEnabled ? 'rgba(40,80,40,0.9)' : 'rgba(80,40,40,0.9)';
  ctx.fillRect(W - 130, H - 70, 120, 28);
  ctx.font      = '12px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText(grassSpawnEnabled ? 'Grass: ON' : 'Grass: OFF', W - 122, H - 51);
  ctx.fillStyle = 'rgba(40,40,40,0.9)';
  ctx.fillRect(W - 130, H - 36, 120, 28);
  ctx.fillStyle = '#fff';
  ctx.fillText('Download Log', W - 122, H - 17);
}

export function drawPaymentZone(frameCount) {
  const { px, py, radius } = PAYMENT_ZONE;
  const pulse = 0.55 + 0.35 * Math.sin(frameCount * 0.06);
  const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
  grad.addColorStop(0,   `rgba(255, 215, 0, ${(pulse * 0.55).toFixed(3)})`);
  grad.addColorStop(0.6, `rgba(200, 160, 0, ${(pulse * 0.35).toFixed(3)})`);
  grad.addColorStop(1,   'rgba(150, 100, 0, 0)');
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 215, 0, ${pulse.toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = `rgba(255, 215, 0, ${pulse.toFixed(3)})`;
  ctx.fillText('GRASS BARON', px, py - radius - 6);
  ctx.textAlign = 'left';
}

export const winContinueBtn = { x: 0, y: 0, w: 0, h: 0 };

export function drawWinScreen(gameWon) {
  if (!gameWon) return;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('Debt repaid.', W / 2, H / 2 - 80);

  ctx.fillStyle = '#ccc';
  ctx.font = '18px monospace';
  ctx.fillText('The Grass Baron nods slowly.', W / 2, H / 2 - 36);

  ctx.fillStyle = '#aaa';
  ctx.font = 'italic 16px monospace';
  ctx.fillText('"You are free... for now."', W / 2, H / 2 + 2);

  const btnW = 240, btnH = 40;
  const btnX = W / 2 - btnW / 2;
  const btnY = H / 2 + 44;
  winContinueBtn.x = btnX; winContinueBtn.y = btnY;
  winContinueBtn.w = btnW; winContinueBtn.h = btnH;

  ctx.fillStyle = 'rgba(255,215,0,0.18)';
  ctx.strokeStyle = 'rgba(255,215,0,0.85)';
  ctx.lineWidth = 2;
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('[ Continue exploring ]', W / 2, btnY + 26);

  ctx.textAlign = 'left';
}

export function drawIntro() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7fff60';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('GRASS SLASHER', W / 2, 70);

  ctx.fillStyle = '#ccc';
  ctx.font = '12px monospace';
  ctx.fillText('You owe 500 gems to the Grass Baron.', W / 2, 115);
  ctx.fillText('Slash grass. Collect gems. Repay your debt.', W / 2, 131);

  ctx.fillStyle = '#888';
  ctx.font = '10px monospace';
  ctx.fillText('Click or press any key to begin.', W / 2, 180);

  ctx.textAlign = 'left';
}

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

export function drawTransition() {
  const t = easeInOut(transition.frame / transition.duration);
  let ox = 0, oy = 0, nx = 0, ny = 0;
  switch (transition.direction) {
    case 'right': ox = -W*t;    nx = W*(1-t);  break;
    case 'left':  ox =  W*t;    nx = -W*(1-t); break;
    case 'down':  oy = -H*t;    ny = H*(1-t);  break;
    case 'up':    oy =  H*t;    ny = -H*(1-t); break;
  }

  // Old screen sliding out
  ctx.save();
  ctx.translate(ox - transition.oldCamX, oy - transition.oldCamY);
  drawGround();
  drawRocks(transition.oldRocks);
  for (const g of transition.oldGrasses) drawGrass(g);
  drawGems();
  ctx.restore();

  // New screen sliding in
  ctx.save();
  ctx.translate(nx - camera.x, ny - camera.y);
  drawGround();
  drawRocks(getRockTiles(transition.toRX, transition.toRY));
  for (const g of grasses) drawGrass(g);
  drawPlayer(transition.playerEntryX, transition.playerEntryY);
  ctx.restore();
}
