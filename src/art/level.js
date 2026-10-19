import { COLORS, WIDTH, HEIGHT } from '../config.js';
import { makeTexture, polyPath, rng, shade, rgba } from './util.js';

// Dark olive temple brick wall behind every level.
export function drawBricks(ctx, w = WIDTH, h = HEIGHT, seed = 7) {
  const r = rng(seed);
  ctx.fillStyle = '#1a1a02';
  ctx.fillRect(0, 0, w, h);
  const bw = 30, bh = 15;
  for (let row = 0; row * bh < h; row++) {
    const off = row % 2 ? -bw / 2 : 0;
    for (let x = off; x < w; x += bw) {
      const tone = (r() - 0.5) * 0.22;
      ctx.fillStyle = shade('#282807', tone);
      ctx.fillRect(x + 1, row * bh + 1, bw - 1.5, bh - 1.5);
      // faint top highlight on each brick
      ctx.fillStyle = 'rgba(70,68,18,0.14)';
      ctx.fillRect(x + 1, row * bh + 1, bw - 1.5, 1.2);
      if (r() < 0.12) { // occasional crack
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        const cx = x + 4 + r() * (bw - 8);
        ctx.moveTo(cx, row * bh + 2);
        ctx.lineTo(cx + (r() - 0.5) * 6, row * bh + bh / 2);
        ctx.lineTo(cx + (r() - 0.5) * 8, row * bh + bh - 2);
        ctx.stroke();
      }
    }
  }
  // faint hanging vines on the wall
  for (let i = 0; i < 7; i++) {
    let x = r() * w, y = 20 + r() * 120;
    ctx.strokeStyle = rgba(COLORS.mossDark, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const len = 40 + r() * 90;
    for (let t = 0; t < len; t += 6) { x += (r() - 0.5) * 6; y += 6; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  // vignette: the temple is lit from the middle
  const g = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function leaf(ctx, x, y, s, a, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.quadraticCurveTo(0, -s * 0.75, s, 0);
  ctx.quadraticCurveTo(0, s * 0.75, -s, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#0b2004';
  ctx.stroke();
  ctx.restore();
}

function mossClump(ctx, r, x, y, size) {
  const n = 3 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const c = r() < 0.25 ? COLORS.mossLight : r() < 0.55 ? COLORS.moss : COLORS.mossDark;
    leaf(ctx, x + (r() - 0.5) * size, y + (r() - 0.5) * size * 0.6, 2.2 + r() * size * 0.34, r() * Math.PI, c);
  }
}

// Mossy olive stone for all solid geometry of a level.
export function drawStone(ctx, solids, seed = 3) {
  const r = rng(seed);
  // drop shadow under the stone onto the wall
  ctx.save();
  ctx.translate(2, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  for (const p of solids) { ctx.beginPath(); polyPath(ctx, p); ctx.fill(); }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  for (const p of solids) polyPath(ctx, p);
  ctx.clip('nonzero');

  // tan-olive base with soft tonal variation
  ctx.fillStyle = '#776a2a';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 1400; i++) {
    const x = r() * WIDTH, y = r() * HEIGHT, s = 3 + r() * 7;
    ctx.fillStyle = rgba(r() < 0.5 ? '#8a7c34' : '#665a22', 0.35);
    ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.7, r() * 3, 0, Math.PI * 2); ctx.fill();
  }
  // irregular darker worn patches with dark rims (as in the reference)
  for (let i = 0; i < 520; i++) {
    const x = r() * WIDTH, y = r() * HEIGHT, s = 2 + r() * 4.5;
    ctx.beginPath();
    const n = 6;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, rr = s * (0.6 + r() * 0.5);
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75);
    }
    ctx.closePath();
    ctx.fillStyle = rgba('#4c4519', 0.75);
    ctx.fill();
    ctx.lineWidth = 0.6; ctx.strokeStyle = 'rgba(25,22,5,0.55)'; ctx.stroke();
  }
  // dense dark-green moss clusters
  for (let i = 0; i < 1000; i++) mossClump(ctx, r, r() * WIDTH, r() * HEIGHT, 6 + r() * 8);
  ctx.restore();

  // lit top edges and inner dark rim
  for (const p of solids) {
    for (let i = 0; i < p.length; i += 2) {
      const x0 = p[i], y0 = p[i + 1], x1 = p[(i + 2) % p.length], y1 = p[(i + 3) % p.length];
      if (x1 > x0 && Math.abs(y1 - y0) <= (x1 - x0) * 1.2) { // edge facing up (clockwise polygons)
        ctx.strokeStyle = rgba(COLORS.stoneLight, 0.85);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, y0 + 1.5);
        ctx.lineTo(x1, y1 + 1.5);
        ctx.stroke();
      }
    }
  }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 1.6;
  for (const p of solids) { ctx.beginPath(); polyPath(ctx, p); ctx.stroke(); }

  // a few leaves spilling over the edges
  for (const p of solids) {
    for (let i = 0; i < p.length; i += 2) {
      const x0 = p[i], y0 = p[i + 1], x1 = p[(i + 2) % p.length], y1 = p[(i + 3) % p.length];
      const len = Math.hypot(x1 - x0, y1 - y0);
      for (let t = 0; t < len; t += 26 + r() * 30) {
        if (r() < 0.55) continue;
        mossClump(ctx, r, x0 + ((x1 - x0) * t) / len, y0 + ((y1 - y0) * t) / len, 5 + r() * 5);
      }
    }
  }
}

export function buildLevelTextures(scene, level) {
  makeTexture(scene, `bg`, WIDTH, HEIGHT, (ctx) => drawBricks(ctx));
  makeTexture(scene, `stone-${level.id}`, WIDTH, HEIGHT, (ctx) => drawStone(ctx, level.solids, level.id * 31 + 3));
}
