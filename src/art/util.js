import { RES } from '../config.js';

// Seeded RNG so procedural art is identical on every load (and for both online players).
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Create a Phaser canvas texture drawn in native coordinates at RES× resolution.
// Sprites using it must be scaled by 1 / RES (see `img()` in scenes).
export function makeTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, Math.ceil(w * RES), Math.ceil(h * RES));
  const ctx = tex.getContext();
  ctx.save();
  ctx.scale(RES, RES);
  draw(ctx, w, h);
  ctx.restore();
  tex.refresh();
  return tex;
}

// Multi-frame texture laid out horizontally; frames are named 0..n-1.
export function makeFrames(scene, key, fw, fh, count, draw) {
  const tex = makeTexture(scene, key, fw * count, fh, (ctx) => {
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.translate(i * fw, 0);
      ctx.beginPath();
      ctx.rect(0, 0, fw, fh);
      ctx.clip();
      draw(ctx, i, fw, fh);
      ctx.restore();
    }
  });
  for (let i = 0; i < count; i++) tex.add(i, 0, i * fw * RES, 0, fw * RES, fh * RES);
  return tex;
}

export function polyPath(ctx, poly) {
  ctx.moveTo(poly[0], poly[1]);
  for (let i = 2; i < poly.length; i += 2) ctx.lineTo(poly[i], poly[i + 1]);
  ctx.closePath();
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

export function glow(ctx, x, y, r, color, alpha = 0.6) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
