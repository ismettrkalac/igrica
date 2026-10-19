import { WIDTH, HEIGHT, RES, FONT, COLORS } from '../config.js';
import { makeTexture } from '../art/util.js';
import { drawPanel } from '../art/objects.js';

// Every scene works in native 640x480 coordinates; the camera zooms by RES.
export function setupCamera(scene) {
  scene.cameras.main.setZoom(RES).centerOn(WIDTH / 2, HEIGHT / 2);
}

export const img = (scene, x, y, key, frame) => scene.add.image(x, y, key, frame).setScale(1 / RES);
export const spr = (scene, x, y, key, frame) => scene.add.sprite(x, y, key, frame).setScale(1 / RES);

export function txt(scene, x, y, str, size = 16, color = COLORS.gold, opts = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: opts.font || FONT,
    fontSize: `${size}px`,
    fontStyle: opts.bold === false ? 'normal' : 'bold',
    color,
    stroke: opts.stroke ?? '#1a1204',
    strokeThickness: opts.strokeThickness ?? Math.max(2, size / 6),
    align: opts.align || 'center',
    shadow: opts.shadow === false ? undefined : { offsetX: 0, offsetY: 1, color: '#000', blur: 3, fill: true },
    ...opts.style,
  });
  t.setResolution(RES * 1.5);
  t.setOrigin(opts.ox ?? 0.5, opts.oy ?? 0.5);
  return t;
}

// Gold menu text that brightens on hover and calls `fn` on click/tap.
export function button(scene, x, y, str, size, fn, opts = {}) {
  const t = txt(scene, x, y, str, size, opts.color || COLORS.gold, opts);
  t.setInteractive({ useHandCursor: true });
  // enlarge the hit area for fingers
  const pad = Math.max(6, size * 0.4);
  t.input.hitArea.setTo(-pad, -pad / 2, t.width + pad * 2, t.height + pad);
  t.on('pointerover', () => t.setColor('#fff3b8').setScale(1.06));
  t.on('pointerout', () => t.setColor(opts.color || COLORS.gold).setScale(1));
  t.on('pointerup', () => fn());
  return t;
}

export function panelTexture(scene, key, w, h, opts) {
  if (!scene.textures.exists(key)) makeTexture(scene, key, w, h, (ctx) => drawPanel(ctx, w, h, opts));
  return key;
}

export function fadeTo(scene, key, data) {
  scene.cameras.main.fadeOut(250, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}

const STORE = 'fbwg-forest-progress';
export function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORE)) || { levels: {} }; } catch { return { levels: {} }; }
}
export function saveLevelResult(id, rating, time) {
  const p = loadProgress();
  const prev = p.levels[id];
  const rank = (r) => ({ A: 3, B: 2, C: 1 })[r] || 0;
  if (!prev || rank(rating) > rank(prev.rating) || (rank(rating) === rank(prev.rating) && time < prev.time)) p.levels[id] = { rating, time };
  try { localStorage.setItem(STORE, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

export const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
