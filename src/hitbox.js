export function testPoint(part, dx, dy, sweepAngle) {
  if (part.type === 'wedge') {
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx);
    const halfAngTol = dist > 0 ? Math.atan2(13, dist) : Math.PI;
    let d = angle - sweepAngle;
    while (d >  Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d) <= halfAngTol && dist <= part.reach + 13;
  }
  if (part.type === 'rect') {
    const ca = Math.cos(part.angle), sa = Math.sin(part.angle);
    const along = dx * ca + dy * sa;
    const perp  = Math.abs(-dx * sa + dy * ca);
    return along >= -13 && along <= part.length + 13 && perp <= part.halfWidth + 13;
  }
  return false;
}

export function drawHitbox(parts, ctx, ox, oy) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,0,0,0.7)';
  ctx.fillStyle   = 'rgba(255,0,0,0.12)';
  ctx.lineWidth   = 1;
  for (const part of parts) {
    if (part.type === 'wedge') {
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.arc(ox, oy, part.reach, part.start, part.start + part.delta, part.delta < 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (part.type === 'rect') {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(part.angle);
      ctx.beginPath();
      ctx.rect(0, -part.halfWidth, part.length, part.halfWidth * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}
