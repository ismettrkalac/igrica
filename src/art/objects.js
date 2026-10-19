import { COLORS } from '../config.js';
import { makeTexture, makeFrames, glow, shade, rgba } from './util.js';

export function drawGem(ctx, cx, cy, color, scale = 1) {
  const base = color === 'fire' ? COLORS.red : color === 'water' ? COLORS.blue : color === 'green' ? '#3fbf3a' : '#5a5a5a';
  const light = color === 'fire' ? '#ff7a5c' : color === 'water' ? '#c4f2ff' : color === 'green' ? '#a8f59a' : '#9a9a9a';
  const dark = shade(base, -0.55);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(-4.5, -5); ctx.lineTo(4.5, -5); ctx.lineTo(8, -1.2); ctx.lineTo(0, 7); ctx.lineTo(-8, -1.2); ctx.closePath();
  };
  outline();
  ctx.fillStyle = base; ctx.fill();
  // facets
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.moveTo(-4.5, -5); ctx.lineTo(4.5, -5); ctx.lineTo(2.5, -1.2); ctx.lineTo(-2.5, -1.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(light, 0.55);
  ctx.beginPath(); ctx.moveTo(-8, -1.2); ctx.lineTo(-2.5, -1.2); ctx.lineTo(0, 7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(8, -1.2); ctx.lineTo(2.5, -1.2); ctx.lineTo(0, 7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.8);
  ctx.beginPath(); ctx.moveTo(-3.2, -4); ctx.lineTo(-0.8, -4); ctx.lineTo(-2.2, -2); ctx.closePath(); ctx.fill();
  outline();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.3; ctx.strokeStyle = '#0a0a0a'; ctx.stroke();
  ctx.restore();
}

function marsSymbol(ctx, x, y, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x - 1.5, y + 2, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 2, y - 1.5); ctx.lineTo(x + 7, y - 6.5);
  ctx.moveTo(x + 2.5, y - 6.8); ctx.lineTo(x + 7.2, y - 6.8); ctx.lineTo(x + 7.2, y - 2.2); ctx.stroke();
}
function venusSymbol(ctx, x, y, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y - 3, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x, y + 10); ctx.moveTo(x - 3.8, y + 6.5); ctx.lineTo(x + 3.8, y + 6.5); ctx.stroke();
}

export function buildObjectTextures(scene) {
  for (const t of ['fire', 'water']) {
    makeTexture(scene, `gem-${t}`, 28, 26, (ctx) => {
      glow(ctx, 14, 13, 13, t === 'fire' ? '#ff2a10' : '#40c8ff', 0.55);
      drawGem(ctx, 14, 12, t);
    });
  }

  // door frame (stone) and the sliding panel with its glowing symbol
  makeTexture(scene, 'door-frame', 48, 46, (ctx) => {
    ctx.fillStyle = '#05050a';
    ctx.fillRect(7, 6, 34, 40);
    ctx.fillStyle = '#7d7650';
    ctx.strokeStyle = COLORS.outline; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.rect(2, 2, 44, 44); ctx.rect(7, 7, 34, 39); ctx.fill('evenodd'); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,220,0.18)'; ctx.fillRect(3, 3, 42, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(41, 7, 4, 38);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = rgba(COLORS.mossDark, 0.7);
      ctx.beginPath(); ctx.ellipse(4 + Math.random() * 40, 4 + Math.random() * 40, 1.6, 1, Math.random() * 3, 0, Math.PI * 2); ctx.fill();
    }
  });
  for (const t of ['fire', 'water']) {
    makeTexture(scene, `door-panel-${t}`, 34, 39, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 39);
      g.addColorStop(0, '#6c6a4a'); g.addColorStop(1, '#4d4b31');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 34, 39);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(2.5, 2.5, 29, 36);
      const col = t === 'fire' ? '#ff2a14' : '#3ec8ff';
      glow(ctx, 17, 19, 15, col, 0.6);
      if (t === 'fire') marsSymbol(ctx, 17, 19, col); else venusSymbol(ctx, 17, 19, col);
    });
  }

  // pressure plate: gold base + purple button
  makeTexture(scene, 'plate-base', 26, 6, (ctx) => {
    ctx.fillStyle = '#b8962e'; ctx.strokeStyle = COLORS.outline; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(1, 5.5); ctx.lineTo(4, 1); ctx.lineTo(22, 1); ctx.lineTo(25, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f0d266'; ctx.fillRect(5, 1.6, 16, 1);
  });
  makeTexture(scene, 'plate-button', 16, 6, (ctx) => {
    ctx.fillStyle = COLORS.purple; ctx.strokeStyle = '#2a0838'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(8, 4, 6.5, 2.6, 0, Math.PI, 0); ctx.lineTo(14.5, 5.5); ctx.lineTo(1.5, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e2a2ff'; ctx.fillRect(5, 2.2, 5, 1);
  });

  // lever: base and handle (pivot at the bottom of the handle)
  makeTexture(scene, 'lever-base', 20, 9, (ctx) => {
    ctx.fillStyle = '#c4a63c'; ctx.strokeStyle = COLORS.outline; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(1, 8.5); ctx.lineTo(4, 2); ctx.lineTo(16, 2); ctx.lineTo(19, 8.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2dc78'; ctx.fillRect(5, 3, 10, 1.2);
  });
  makeTexture(scene, 'lever-handle', 8, 20, (ctx) => {
    ctx.strokeStyle = COLORS.outline; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4, 19); ctx.lineTo(4, 5); ctx.stroke();
    ctx.strokeStyle = '#d9bd50'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(4, 19); ctx.lineTo(4, 5); ctx.stroke();
    ctx.fillStyle = '#e8cf62'; ctx.strokeStyle = COLORS.outline; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });

  // elevators
  for (const [key, inner] of [['purple', COLORS.purple], ['yellow', null]]) {
    makeTexture(scene, `elevator-${key}`, 60, 14, (ctx) => {
      ctx.fillStyle = '#c9a93a'; ctx.strokeStyle = COLORS.outline; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.rect(0.6, 0.6, 58.8, 12.8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f3dc7a'; ctx.fillRect(1.5, 1.5, 57, 1.5);
      ctx.fillStyle = '#8a6c18'; ctx.fillRect(1.5, 11, 57, 1.6);
      if (inner) {
        ctx.fillStyle = shade(inner, -0.35); ctx.fillRect(4, 4.5, 52, 5);
        ctx.fillStyle = inner; ctx.fillRect(4, 4.5, 52, 2.4);
      } else {
        ctx.fillStyle = '#e2c64a'; ctx.fillRect(4, 4.5, 52, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(4, 4.5, 52, 1.5);
      }
    });
  }

  // push box: grey stone with gold corner caps
  makeTexture(scene, 'box', 26, 26, (ctx) => {
    const g = ctx.createRadialGradient(13, 13, 2, 13, 13, 16);
    g.addColorStop(0, '#d6ddd6'); g.addColorStop(1, '#8e978f');
    ctx.fillStyle = g; ctx.strokeStyle = COLORS.outline; ctx.lineWidth = 1.4;
    ctx.fillRect(0.7, 0.7, 24.6, 24.6); ctx.strokeRect(0.7, 0.7, 24.6, 24.6);
    ctx.fillStyle = '#e2c055';
    for (const [x, y, sx, sy] of [[0, 0, 1, 1], [26, 0, -1, 1], [0, 26, 1, -1], [26, 26, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sx * 7, y); ctx.lineTo(x, y + sy * 7); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 0.8; ctx.stroke();
    }
  });

  // death smoke puff, 8 frames
  makeFrames(scene, 'smoke', 48, 48, 8, (ctx, i) => {
    const t = i / 7;
    const puffs = [[0, 0], [-7, -4], [7, -5], [-4, -11], [5, -12], [0, -17]];
    for (const [px, py] of puffs) {
      const r = 6 + t * 7;
      const g = ctx.createRadialGradient(24 + px * (1 + t), 34 + py * (1 + t * 0.8), 0, 24 + px * (1 + t), 34 + py * (1 + t * 0.8), r);
      g.addColorStop(0, `rgba(255,255,255,${0.85 * (1 - t)})`);
      g.addColorStop(1, 'rgba(230,230,230,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 48, 48);
    }
  });

  // soft light mote
  makeTexture(scene, 'mote', 24, 24, (ctx) => glow(ctx, 12, 12, 12, '#ffffff', 0.55));

  // sparkle for gem pickup
  makeTexture(scene, 'sparkle', 10, 10, (ctx) => {
    glow(ctx, 5, 5, 5, '#ffffff', 0.9);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(5, 10); ctx.moveTo(0, 5); ctx.lineTo(10, 5); ctx.stroke();
  });

  buildHudTextures(scene);
}

export function drawVine(ctx, pts, rnd, leafEvery = 7) {
  ctx.strokeStyle = '#1d4a0c'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let t = 0; t < len; t += leafEvery) {
      const x = x0 + ((x1 - x0) * t) / len, y = y0 + ((y1 - y0) * t) / len;
      const a = Math.atan2(y1 - y0, x1 - x0) + (rnd() < 0.5 ? 1 : -1) * (0.6 + rnd() * 0.6);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = rnd() < 0.5 ? '#3f9a22' : '#2d7a16';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -3.2, 8, 0); ctx.quadraticCurveTo(4, 3.2, 0, 0); ctx.fill();
      ctx.strokeStyle = '#0b2004'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.restore();
    }
  }
}

export function woodBoard(ctx, x, y, w, h, opts = {}) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#8d7a44'); g.addColorStop(1, '#6f5f30');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#1a1406'; ctx.lineWidth = opts.line || 2.4; ctx.lineJoin = 'round';
  ctx.beginPath();
  const r = opts.r ?? 4;
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // grain
  ctx.save(); ctx.clip();
  for (let i = 0; i < h / 3; i++) {
    ctx.strokeStyle = `rgba(40,28,8,${0.08 + (i % 3) * 0.04})`; ctx.lineWidth = 0.7;
    ctx.beginPath();
    const yy = y + 2 + i * 3 + Math.sin(i) * 0.6;
    ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * 0.3, yy + 1.2, x + w * 0.6, yy - 1.2, x + w, yy + 0.5); ctx.stroke();
  }
  // inner bevel
  ctx.strokeStyle = 'rgba(30,20,4,0.55)'; ctx.lineWidth = opts.bevel || 3;
  ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
  ctx.restore();
}

function cornerCap(ctx, x, y, sx, sy) {
  ctx.fillStyle = '#e8c652'; ctx.strokeStyle = '#2a1e04'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sx * 14, y); ctx.lineTo(x + sx * 14, y + sy * 4);
  ctx.lineTo(x + sx * 4, y + sy * 4); ctx.lineTo(x + sx * 4, y + sy * 14); ctx.lineTo(x, y + sy * 14); ctx.closePath();
  ctx.fill(); ctx.stroke();
}

export function crack(ctx, x, y, len, ang, rnd) {
  ctx.strokeStyle = 'rgba(20,14,4,0.85)'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(x, y);
  let cx = x, cy = y;
  for (let i = 0; i < 4; i++) { cx += Math.cos(ang) * len / 4 + (rnd() - 0.5) * 4; cy += Math.sin(ang) * len / 4 + (rnd() - 0.5) * 4; ctx.lineTo(cx, cy); }
  ctx.stroke();
}

// Large wooden panel used by menus, instructions, pause and game over (ref 02/04/20/21).
export function drawPanel(ctx, w, h, opts = {}) {
  woodBoard(ctx, 4, 4, w - 8, h - 8, { r: 6, line: 3, bevel: 4 });
  const r = Math.random;
  crack(ctx, w * 0.12, 8, 20, 1.2, r);
  crack(ctx, w - 30, h - 8, 22, -2.2, r);
  crack(ctx, 8, h * 0.45, 26, 0.1, r);
  if (opts.caps !== false) {
    cornerCap(ctx, 2, 2, 1, 1); cornerCap(ctx, w - 2, 2, -1, 1); cornerCap(ctx, 2, h - 2, 1, -1); cornerCap(ctx, w - 2, h - 2, -1, -1);
  }
  if (opts.vines) {
    let s = 9;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    drawVine(ctx, [[-2, h * 0.15], [6, h * 0.3], [0, h * 0.5], [8, h * 0.7], [2, h * 0.92]], rnd);
    drawVine(ctx, [[w + 2, h * 0.1], [w - 6, h * 0.3], [w + 1, h * 0.5], [w - 7, h * 0.72], [w, h * 0.9]], rnd);
  }
}

function buildHudTextures(scene) {
  // timer plaque with vines (top centre)
  makeTexture(scene, 'hud-timer', 140, 40, (ctx) => {
    let s = 5;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    ctx.fillStyle = '#4a3a12'; ctx.strokeStyle = '#140e02'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(114, 0); ctx.lineTo(108, 28); ctx.quadraticCurveTo(70, 34, 32, 28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a6430';
    ctx.beginPath(); ctx.moveTo(32, 2); ctx.lineTo(108, 2); ctx.lineTo(104, 24); ctx.quadraticCurveTo(70, 29, 36, 24); ctx.closePath(); ctx.fill();
    drawVine(ctx, [[8, 0], [20, 8], [30, 24], [40, 32]], rnd, 6);
    drawVine(ctx, [[132, 0], [120, 10], [110, 24], [100, 32]], rnd, 6);
  });
  makeTexture(scene, 'hud-sound', 20, 18, (ctx) => {
    ctx.fillStyle = '#e6c95a'; ctx.strokeStyle = '#2a1e04'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(2, 6); ctx.lineTo(6, 6); ctx.lineTo(11, 2); ctx.lineTo(11, 16); ctx.lineTo(6, 12); ctx.lineTo(2, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#e6c95a'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(11, 9, 4, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(11, 9, 7, -0.9, 0.9); ctx.stroke();
  });
  makeTexture(scene, 'hud-sound-off', 20, 18, (ctx) => {
    ctx.fillStyle = '#e6c95a'; ctx.strokeStyle = '#2a1e04'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(2, 6); ctx.lineTo(6, 6); ctx.lineTo(11, 2); ctx.lineTo(11, 16); ctx.lineTo(6, 12); ctx.lineTo(2, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c03018'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(13, 5); ctx.lineTo(19, 13); ctx.moveTo(19, 5); ctx.lineTo(13, 13); ctx.stroke();
  });
  // pause orb: green gem in a gold ring (bottom centre)
  makeTexture(scene, 'hud-orb', 30, 30, (ctx) => {
    ctx.fillStyle = '#d9b84a'; ctx.strokeStyle = '#2a1e04'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(15, 15, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const g = ctx.createRadialGradient(12, 11, 1, 15, 15, 9);
    g.addColorStop(0, '#d6ffb0'); g.addColorStop(0.5, '#5fd02a'); g.addColorStop(1, '#22700c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(15, 15, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });
}
