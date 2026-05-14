// Pure sprite-paint functions — no DOM imports.
// Used by render.js and the map editor (which has no #game canvas).

const ROCK_PTS = [
  [ 0, -12], [ 8, -9], [13, -3], [11,  7],
  [ 4, 12], [-6, 11], [-13,  5], [-12, -4], [-6, -11]
];

const ROCK_HI_PTS = [
  [ 0, -12], [ 8, -9], [13, -3], [-2, -6]
];

export function paintShrub(ctx, cx, cy, hue, flip, scale) {
  const dark  = `hsl(${hue}, 60%, 18%)`;
  const mid   = `hsl(${hue}, 62%, 34%)`;
  const lite  = `hsl(${hue + 10}, 70%, 55%)`;
  const phase = flip ? Math.PI / 9 : 0;
  const spikes  = 9;
  const outerR  = 13 * scale;
  const innerR  = 7  * scale;

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

export function paintRock(ctx, cx, cy) {
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
