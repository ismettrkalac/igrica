import { WIDTH, HEIGHT, COLORS } from '../config.js';
import { makeTexture, rng, glow, shade, rgba } from './util.js';
import { drawVine, woodBoard, crack, drawGem } from './objects.js';
import { drawBricks } from './level.js';

// Main menu background: round temple hall with rows of small fire/water doors (ref 03).
function drawTempleHall(ctx) {
  const r = rng(11);
  drawBricks(ctx, WIDTH, HEIGHT, 21);
  ctx.fillStyle = 'rgba(40,40,10,0.35)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const rows = [8, 108, 222, 334];
  rows.forEach((rowY, ri) => {
    const sag = [10, 6, -2, -10][ri];
    const curveY = (x) => rowY + sag * (1 - ((x - 320) / 360) ** 2);
    // doors along the curved wall
    const n = 9;
    for (let i = 0; i < n; i++) {
      const th = -1.25 + (2.5 * i) / (n - 1) + (ri % 2 ? 0.14 : 0);
      if (th > 1.3) continue;
      const x = 320 + Math.sin(th) * 360;
      const w = 32 * Math.cos(th) + 4, h = 46;
      const y = curveY(x) + 22;
      ctx.fillStyle = '#5f5a3a';
      ctx.strokeStyle = '#151405'; ctx.lineWidth = 1.4;
      ctx.fillRect(x - w / 2, y, w, h); ctx.strokeRect(x - w / 2, y, w, h);
      ctx.fillStyle = '#3e3c26';
      ctx.fillRect(x - w / 2 + 4, y + 5, w - 8, h - 5);
      const fire = (i + ri) % 2 === 0;
      const col = fire ? '#ff3a20' : '#40c4ff';
      glow(ctx, x, y + 25, 12, col, 0.5);
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round';
      const s = Math.max(0.4, Math.cos(th));
      ctx.beginPath();
      if (fire) {
        ctx.ellipse(x - 1, y + 27, 4 * s, 4, 0, 0, Math.PI * 2);
        ctx.moveTo(x + 2 * s, y + 24); ctx.lineTo(x + 6 * s, y + 19);
      } else {
        ctx.ellipse(x, y + 22, 4 * s, 4, 0, 0, Math.PI * 2);
        ctx.moveTo(x, y + 26); ctx.lineTo(x, y + 33); ctx.moveTo(x - 3 * s, y + 30); ctx.lineTo(x + 3 * s, y + 30);
      }
      ctx.stroke();
    }
    // balcony ledge
    ctx.beginPath();
    for (let x = -10; x <= 650; x += 10) ctx.lineTo(x, curveY(x) + 70);
    for (let x = 650; x >= -10; x -= 10) ctx.lineTo(x, curveY(x) + 77);
    ctx.closePath();
    ctx.fillStyle = '#6d6338'; ctx.fill();
    ctx.strokeStyle = '#141304'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    for (let x = -10; x <= 650; x += 10) ctx.lineTo(x, curveY(x) + 77);
    for (let x = 650; x >= -10; x -= 10) ctx.lineTo(x, curveY(x) + 83);
    ctx.fill();
  });

  // floor
  const fg = ctx.createRadialGradient(320, 470, 40, 320, 470, 340);
  fg.addColorStop(0, '#6f6a45'); fg.addColorStop(1, '#2f2c12');
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.ellipse(320, 486, 380, 86, 0, Math.PI, 0); ctx.lineTo(700, 480); ctx.lineTo(-60, 480); ctx.fill();
  ctx.strokeStyle = '#151405'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(320, 486, 380, 86, 0, Math.PI, 0); ctx.stroke();

  // vines
  for (let i = 0; i < 9; i++) {
    const pts = [];
    let x = r() * WIDTH, y = r() * 260;
    for (let k = 0; k < 8; k++) { pts.push([x, y]); x += (r() - 0.5) * 50; y += 12 + r() * 16; }
    drawVine(ctx, pts, r, 9);
  }
  // grass tufts on the floor
  for (let i = 0; i < 14; i++) {
    const x = 30 + r() * 580, y = 430 + r() * 45;
    ctx.strokeStyle = r() < 0.5 ? '#3f9a22' : '#2d7a16'; ctx.lineWidth = 1.6;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + k * 2, y - 5, x + k * 4, y - 8 - r() * 3); ctx.stroke(); }
  }

  // light shaft from the opening in the roof
  const beam = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  beam.addColorStop(0, 'rgba(255,255,230,0.42)');
  beam.addColorStop(0.7, 'rgba(255,255,220,0.12)');
  beam.addColorStop(1, 'rgba(255,255,220,0.02)');
  ctx.fillStyle = beam;
  ctx.beginPath(); ctx.moveTo(268, 0); ctx.lineTo(372, 0); ctx.lineTo(432, HEIGHT); ctx.lineTo(208, HEIGHT); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,230,0.12)';
  ctx.beginPath(); ctx.moveTo(296, 0); ctx.lineTo(344, 0); ctx.lineTo(372, HEIGHT); ctx.lineTo(268, HEIGHT); ctx.closePath(); ctx.fill();
}

// "Fireboy & Watergirl in The Forest Temple" logo (ref 01/03).
function drawLogo(ctx, w) {
  const cx = w / 2;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const word = (str, x, y, size, c0, c1, align = 'left', font = '"Uncial Antiqua", Georgia, serif') => {
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = align;
    const g = ctx.createLinearGradient(0, y - size, 0, y);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.lineWidth = size * 0.16; ctx.strokeStyle = '#140a02';
    ctx.strokeText(str, x, y);
    ctx.fillStyle = g;
    ctx.fillText(str, x, y);
  };
  ctx.font = '42px "Uncial Antiqua", Georgia, serif';
  const fw = ctx.measureText('Fireboy').width, ww = ctx.measureText('Watergirl').width;
  const amp = 46, gap = 12, total = fw + gap * 2 + amp + ww;
  const x0 = cx - total / 2;
  word('Fireboy', x0, 50, 42, '#ff8a2a', '#d81808');
  word('&', x0 + fw + gap + amp / 2, 50, 34, '#ffe9a0', '#d8a830', 'center', 'Cinzel, Georgia, serif');
  word('Watergirl', x0 + fw + gap * 2 + amp, 50, 42, '#a8ecff', '#3a9de8');
  word('IN', cx, 82, 20, '#ffe9a0', '#c8961e', 'center', 'Cinzel, Georgia, serif');
  ctx.font = '700 46px Cinzel, Georgia, serif';
  word('THE FOREST TEMPLE', cx, 134, 46, '#fff0a8', '#c8901a', 'center', '700 Cinzel, Georgia, serif');
  let s = 4;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const tw = ctx.measureText('THE FOREST TEMPLE').width;
  const pts = [];
  for (let i = 0; i <= 12; i++) pts.push([cx - tw / 2 - 8 + (tw + 16) * (i / 12), 122 + Math.sin(i * 1.3) * 10]);
  drawVine(ctx, pts, rnd, 8);
}

// Level select: wooden board with branching paths (ref 05).
function drawMapBoard(ctx) {
  woodBoard(ctx, -6, -6, WIDTH + 12, HEIGHT + 12, { r: 0, line: 0, bevel: 0 });
  ctx.fillStyle = 'rgba(82,58,8,0.5)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const r = rng(17);
  for (let i = 0; i < 6; i++) crack(ctx, r() * WIDTH, r() * HEIGHT, 30 + r() * 30, r() * 6, r);
  // corner vines
  drawVine(ctx, [[0, 10], [20, 22], [30, 46], [14, 70]], r, 7);
  drawVine(ctx, [[640, 6], [610, 20], [590, 40], [622, 60], [600, 76]], r, 7);
  drawVine(ctx, [[0, 470], [30, 460], [50, 480]], r, 7);
  drawVine(ctx, [[640, 360], [618, 390], [630, 420], [600, 450], [640, 470]], r, 7);
  ctx.fillStyle = rgba(COLORS.moss, 0.6);
  for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(230 + r() * 26, 395 + r() * 16, 1.5 + r() * 2, 0, Math.PI * 2); ctx.fill(); }
}

export function drawMapNode(ctx, kind, state) {
  // state: 'locked' | 'open' | 'done'
  const rFrame = kind === 'big' ? 21 : 15;
  ctx.save();
  ctx.fillStyle = '#4e3c12';
  ctx.strokeStyle = '#1a1206'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (kind === 'big') {
    ctx.moveTo(-20, -9); ctx.lineTo(-11, -16); ctx.lineTo(11, -16); ctx.lineTo(20, -9); ctx.lineTo(0, 17); ctx.closePath();
  } else {
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; ctx.lineTo(Math.cos(a) * rFrame, Math.sin(a) * rFrame); }
    ctx.closePath();
  }
  ctx.fill(); ctx.stroke();
  ctx.strokeStyle = shade('#b08a30', state === 'locked' ? -0.2 : 0.1); ctx.lineWidth = 1.6; ctx.stroke();
  const gemColor = state === 'done' ? 'green' : 'grey';
  if (kind === 'tri') {
    ctx.fillStyle = state === 'done' ? '#5ad040' : '#5d5d5d'; ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-2, -9); ctx.lineTo(9, 7); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(-2, -9); ctx.lineTo(1, 7); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill();
  } else if (kind === 'big') {
    drawGem(ctx, 0, -1, gemColor, 1.7);
  } else {
    ctx.fillStyle = state === 'done' ? '#5ad040' : '#5d5d5d'; ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 3; ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-7.8, -4.5); ctx.lineTo(-7.8, 4.5); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  }
  if (state === 'locked') { ctx.fillStyle = 'rgba(30,20,4,0.35)'; ctx.beginPath(); ctx.arc(0, 0, rFrame, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

export function buildMenuTextures(scene) {
  makeTexture(scene, 'menu-bg', WIDTH, HEIGHT, drawTempleHall);
  makeTexture(scene, 'logo', 600, 150, (ctx) => drawLogo(ctx, 600));
  makeTexture(scene, 'map-bg', WIDTH, HEIGHT, drawMapBoard);
  for (const kind of ['gem', 'tri', 'big']) {
    for (const state of ['locked', 'open', 'done']) {
      makeTexture(scene, `node-${kind}-${state}`, 48, 40, (ctx) => { ctx.translate(24, 20); drawMapNode(ctx, kind, state); });
    }
  }
  makeTexture(scene, 'node-ring', 48, 48, (ctx) => {
    glow(ctx, 24, 24, 24, '#ffd860', 0.45);
    ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 2.4;
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; ctx.lineTo(24 + Math.cos(a) * 18, 24 + Math.sin(a) * 18); } ctx.closePath(); ctx.stroke();
  });
  makeTexture(scene, 'play-plaque', 120, 46, (ctx) => {
    woodBoard(ctx, 3, 3, 114, 40, { r: 4, line: 2.4, bevel: 2 });
    ctx.fillStyle = '#e8c652'; ctx.strokeStyle = '#2a1e04'; ctx.lineWidth = 1;
    for (const [x, y, sx, sy] of [[2, 2, 1, 1], [118, 2, -1, 1], [2, 44, 1, -1], [118, 44, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sx * 9, y); ctx.lineTo(x + sx * 9, y + sy * 3); ctx.lineTo(x + sx * 3, y + sy * 3); ctx.lineTo(x + sx * 3, y + sy * 9); ctx.lineTo(x, y + sy * 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  });
}
