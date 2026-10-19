import { makeFrames, glow } from './util.js';

// Character sheets: 16 frames of 40x52 native px, feet at (20, 48), facing right.
//   0-3 idle, 4-11 run, 12-13 rising, 14-15 falling
export const FRAME_W = 40;
export const FRAME_H = 52;
export const FEET_X = 20;
export const FEET_Y = 48;
export const ANIMS = { idle: [0, 4], run: [4, 8], up: [12, 2], fall: [14, 2] };

function poseFor(i) {
  if (i < 4) return { lean: 0, sweep: Math.sin((i / 4) * Math.PI * 2) * 1.2, flick: i, leg: 0, run: false, sy: 1 };
  if (i < 12) {
    const p = ((i - 4) / 8) * Math.PI * 2;
    return { lean: 0.2, sweep: -6.5 + Math.sin(p * 2) * 1.2, flick: i, leg: p, run: true, sy: 1 + Math.sin(p * 2) * 0.03 };
  }
  if (i < 14) return { lean: 0.08, sweep: -3, droop: 5 + (i - 12) * 2, flick: i, leg: 0.6, run: false, sy: 1.08, air: true };
  return { lean: 0.05, sweep: -2, droop: -5 - (i - 14) * 2, flick: i, leg: -0.6, run: false, sy: 0.97, air: true };
}

function body(ctx, pose, fill, outline) {
  // small tapered body that splits into two stubby legs (ref 14)
  const swing = pose.run ? Math.sin(pose.leg) * 3.2 : pose.air ? 1.6 : 0;
  ctx.fillStyle = fill; ctx.strokeStyle = outline; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-2.6, -15);
  ctx.quadraticCurveTo(-3, -9, -4.6 - swing * 0.4, -5);
  ctx.quadraticCurveTo(-5.2 - swing, -0.5, -2.4 - swing, -0.3);
  ctx.lineTo(-0.8 - swing * 0.3, -3.6);
  ctx.lineTo(0.8 + swing * 0.3, -3.6);
  ctx.lineTo(2.4 + swing, -0.3);
  ctx.quadraticCurveTo(5.2 + swing, -0.5, 4.6 + swing * 0.4, -5);
  ctx.quadraticCurveTo(3, -9, 2.6, -15);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}

function faceEyes(ctx, y, look = 0.6) {
  for (const ex of [-3.7, 3.7]) {
    ctx.fillStyle = '#f2efa6';
    ctx.strokeStyle = 'rgba(30,10,0,0.85)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(ex + look * 0.5, y, 2.5, 2.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a1a06';
    ctx.beginPath(); ctx.arc(ex + look * 1.1, y + 0.1, 0.95, 0, Math.PI * 2); ctx.fill();
  }
}

function smile(ctx, y, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0.8, y - 2.2, 2.8, 0.35, Math.PI - 0.35); ctx.stroke();
}

function drawFireboy(ctx, pose) {
  const s = pose.sweep, d = pose.droop || 0, f = pose.flick;
  const wob = (k) => Math.sin(f * 1.9 + k) * 0.9;
  const outline = '#3a0703';
  ctx.save();
  ctx.rotate(pose.lean);
  ctx.scale(1, pose.sy);
  body(ctx, pose, '#ef4424', outline);

  // flame head: round face with four pointed tongues (ref 14)
  const grad = ctx.createRadialGradient(0, -20, 2, 0, -24, 16);
  grad.addColorStop(0, '#ff7a48');
  grad.addColorStop(1, '#ee3c20');
  ctx.fillStyle = grad;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-10.5, -21);
  ctx.quadraticCurveTo(-10.5, -12, 0, -12);
  ctx.quadraticCurveTo(10.5, -12, 10.8, -21);
  ctx.quadraticCurveTo(11.6, -26, 10.6 + s * 0.55 + wob(1), -32.5 - d * 0.15); // right tongue
  ctx.quadraticCurveTo(8.6, -29, 7, -28.5);
  ctx.quadraticCurveTo(7 + s * 0.4, -35, 4.2 + s * 1.2 + wob(2), -39.5 - d * 0.3); // tallest
  ctx.quadraticCurveTo(1.6, -32, 0.8, -29.5);
  ctx.quadraticCurveTo(-1 + s * 0.3, -34, -3.2 + s * 1.05 + wob(3), -37 - d * 0.25); // centre-left
  ctx.quadraticCurveTo(-4.8, -30, -6, -28.4);
  ctx.quadraticCurveTo(-8 + s * 0.3, -30, -10 + s * 0.8 + wob(4), -31.5 - d * 0.15); // left tongue
  ctx.quadraticCurveTo(-11.6, -26, -10.5, -21);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  faceEyes(ctx, -20.5);
  smile(ctx, -14.2, outline);
  ctx.restore();
}

function drawWatergirl(ctx, pose) {
  const s = pose.sweep, d = pose.droop || 0;
  const outline = '#0b2c52';
  ctx.save();
  ctx.rotate(pose.lean);
  ctx.scale(1, pose.sy);
  body(ctx, pose, '#56b2f0', outline);

  // bun on top of the head (trails back while running)
  const bx = -2 + s * 0.45, by = -32.5 - d * 0.15;
  ctx.fillStyle = '#5ab4ee'; ctx.strokeStyle = outline; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(bx, by, 4.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(11,44,82,0.6)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(bx + 0.4, by + 0.3, 2.1, -2.4, 1.2); ctx.stroke();

  // round head
  const g = ctx.createRadialGradient(-1, -22, 2, 0, -21, 12);
  g.addColorStop(0, '#8ad2ff');
  g.addColorStop(1, '#56b2f0');
  ctx.fillStyle = g; ctx.strokeStyle = outline; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.ellipse(0, -21, 10.6, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // hair: covers the crown, fringe swept from right to left over the forehead
  ctx.fillStyle = '#62baf0';
  ctx.beginPath();
  ctx.moveTo(-10.4, -21.5);
  ctx.quadraticCurveTo(-10, -31.2, 0, -31.2);
  ctx.quadraticCurveTo(10, -31.2, 10.5, -21.5);
  ctx.quadraticCurveTo(7.5, -25.5, 3.5, -24.2);
  ctx.quadraticCurveTo(-1.5, -22.8, -4, -26);
  ctx.quadraticCurveTo(-7, -24.5, -10.4, -21.5);
  ctx.closePath();
  ctx.fill(); ctx.lineWidth = 1.1; ctx.stroke();
  ctx.strokeStyle = 'rgba(11,44,82,0.55)'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(-6, -29.5); ctx.quadraticCurveTo(-2, -27, 2, -29.8); ctx.moveTo(4, -29.5); ctx.quadraticCurveTo(7, -27.5, 8.5, -24.5); ctx.stroke();

  faceEyes(ctx, -19.5);
  smile(ctx, -13.6, outline);
  ctx.restore();
}

export function buildCharacterTextures(scene) {
  for (const type of ['fire', 'water']) {
    makeFrames(scene, `char-${type}`, FRAME_W, FRAME_H, 16, (ctx, i) => {
      const pose = poseFor(i);
      glow(ctx, FEET_X, FEET_Y - 21, 20, type === 'fire' ? '#ff5a20' : '#40b8ff', 0.42);
      ctx.save();
      ctx.translate(FEET_X, FEET_Y);
      if (type === 'fire') drawFireboy(ctx, pose); else drawWatergirl(ctx, pose);
      ctx.restore();
    });
  }
}
