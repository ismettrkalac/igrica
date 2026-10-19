import Phaser from 'phaser';
import { WIDTH, HEIGHT, STEP, COLORS, RES } from '../config.js';
import { World } from '../game/World.js';
import { Controls } from '../game/Controls.js';
import { setTouchLayout } from '../game/touch.js';
import { sfx } from '../game/sfx.js';
import { LEVELS } from '../levels/index.js';
import { buildLevelTextures } from '../art/level.js';
import { ANIMS, FEET_X, FEET_Y, FRAME_W, FRAME_H } from '../art/characters.js';
import { mechTexture } from '../art/objects.js';
import { setupCamera, img, spr, txt, button, panelTexture, fadeTo, saveLevelResult, formatTime } from './helpers.js';

const LIQUID = {
  lava: { base: '#c8300f', mid: COLORS.lava, top: COLORS.lavaLight, rim: '#5a0e02' },
  water: { base: '#1f62b0', mid: COLORS.water, top: COLORS.waterLight, rim: '#0a2a52' },
  poison: { base: '#1f6a12', mid: COLORS.poison, top: COLORS.poisonLight, rim: '#0b2a05' },
};
const hex = (c) => Phaser.Display.Color.HexStringToColor(c).color;

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  // data: { levelId, mode: 'local' | 'host' | 'guest', net?, myType? }
  init(data) {
    this.levelId = data.levelId || 1;
    this.mode = data.mode || 'local';
    this.net = data.net || null;
    this.myType = data.myType || (this.mode === 'guest' ? 'water' : this.mode === 'host' ? 'fire' : null);
    this.level = LEVELS[this.levelId];
  }

  create() {
    setupCamera(this);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    buildLevelTextures(this, this.level);
    this.world = new World(this.level);
    this.controls = new Controls(this, this.mode === 'local' ? 'local' : 'online', this.myType);
    this.acc = 0;
    this.paused = false;
    this.overlay = null;
    this.remoteInput = { left: false, right: false, up: false };
    this.stepCount = 0;
    this.deathTimer = 0;

    img(this, WIDTH / 2, HEIGHT / 2, 'bg');
    this.motes = [];
    for (let i = 0; i < 5; i++) {
      const m = img(this, 60 + Math.random() * 520, 40 + Math.random() * 400, 'mote').setAlpha(0.5);
      m.vx = (Math.random() - 0.5) * 6; m.vy = (Math.random() - 0.5) * 4; m.ph = Math.random() * 6;
      this.motes.push(m);
    }
    this.liquids = this.add.graphics();
    // gates sit behind the stone so they appear to slide into the wall
    const sprite = (e) => img(this, e.x, e.y, mechTexture(this, e.color || 'yellow', e.w, e.h, e.kind === 'gate' ? 'gate' : 'platform')).setOrigin(0, 0);
    const gateSprites = new Map(this.world.elevators.filter((e) => e.kind === 'gate').map((e) => [e, sprite(e)]));
    img(this, WIDTH / 2, HEIGHT / 2, `stone-${this.level.id}`);

    for (const t of this.level.texts || []) this.richText(t);

    // doors
    this.doorSprites = {};
    for (const type of ['fire', 'water']) {
      const d = this.world.doors[type];
      img(this, d.x + d.w / 2, d.y + d.h / 2 - 1, 'door-frame');
      const panel = img(this, d.x + d.w / 2, d.y + 4, `door-panel-${type}`).setOrigin(0.5, 0);
      this.doorSprites[type] = panel;
    }

    this.plateSprites = this.world.plates.map((p) => ({
      button: img(this, p.x, p.y - 5, `plate-button-${p.color || 'purple'}`).setOrigin(0.5, 0.5).setScale(0.65),
      base: img(this, p.x, p.y - 3, 'plate-base').setScale(0.55),
    }));
    this.leverSprites = this.world.levers.map((l) => ({
      handle: img(this, l.x, l.y - 4, 'lever-handle').setOrigin(0.5, 0.95),
      base: img(this, l.x, l.y - 4.5, `lever-base-${l.color || 'yellow'}`),
    }));
    this.elevatorSprites = this.world.elevators.map((e) => gateSprites.get(e) || sprite(e));
    this.boxSprites = this.world.boxes.map((b) => img(this, b.x, b.y, 'box').setOrigin(0, 0));
    this.gemSprites = this.world.gems.map((g, i) => {
      const s = img(this, g.x, g.y, `gem-${g.type}`).setScale(0.62);
      s.phase = i * 0.7;
      return s;
    });

    this.charSprites = {};
    for (const c of this.world.chars) {
      const s = spr(this, 0, 0, `char-${c.type}`, 0).setOrigin(FEET_X / FRAME_W, FEET_Y / FRAME_H).setScale(0.55);
      s.anim = 'idle'; s.animT = 0;
      this.charSprites[c.type] = s;
    }
    this.smoke = spr(this, 0, 0, 'smoke', 0).setVisible(false).setOrigin(0.5, 0.8);
    this.fx = this.add.group();

    this.buildHud();

    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-R', () => { if (this.mode === 'local' && this.world.status !== 'won') this.restart(); });
    this.input.on('pointerdown', () => sfx.unlock());

    if (this.net) this.bindNet();
    this.events.once('shutdown', () => this.cleanup());
    this.syncSprites(1);
  }

  cleanup() {
    this.controls?.destroy();
    if (this.net) { this.net.onMessage = null; }
  }

  richText({ x, y, size, parts }) {
    const colors = { gold: COLORS.gold, blue: '#4cc0ff', red: '#ff4a2a', purple: '#cf86f0', green: '#7fe060', cyan: '#5fe0f5', orange: '#ffaa50' };
    const pieces = parts.map(([s, c]) => (s === '← ↑ →' ? this.arrowGlyphs(y, size) : txt(this, 0, y, s, size, colors[c], { ox: 0, strokeThickness: 3 })));
    const total = pieces.reduce((a, p) => a + p.width, 0);
    let cx = x - total / 2;
    for (const p of pieces) { p.x = cx; cx += p.width; }
  }

  // bold red ← ↑ → arrows as drawn in the original tutorial text
  arrowGlyphs(y, size) {
    const g = this.add.graphics();
    const u = (size / 15) * 1.3;
    const arrow = (cx, cy, ang) => {
      const pts = [[-5.5, -1.9], [0.5, -1.9], [0.5, -4.6], [6, 0], [0.5, 4.6], [0.5, 1.9], [-5.5, 1.9]].map(([px, py]) => {
        const c = Math.cos(ang), s = Math.sin(ang);
        return { x: cx + (px * c - py * s) * u, y: cy + (px * s + py * c) * u };
      });
      g.fillStyle(0x2a0802, 1);
      g.fillPoints(pts.map((p) => ({ x: p.x + 0.6, y: p.y + 0.8 })), true);
      g.fillStyle(0xff3a1c, 1);
      g.fillPoints(pts, true);
      g.lineStyle(0.8, 0x2a0802, 1);
      g.strokePoints(pts, true);
    };
    arrow(7 * u, y, Math.PI);
    arrow(19 * u, y - u, -Math.PI / 2);
    arrow(31 * u, y, 0);
    // layout wrapper: richText only needs `width` and a settable `x`
    return { width: 41 * u, set x(v) { g.setPosition(v, 0); }, get x() { return g.x; } };
  }

  buildHud() {
    // black frame margin like the original stage
    const g = this.add.graphics();
    g.fillStyle(0x000000, 1);
    g.fillRect(0, 0, WIDTH, 16); g.fillRect(0, 470, WIDTH, 10); g.fillRect(0, 0, 16, HEIGHT); g.fillRect(630, 0, 10, HEIGHT);
    img(this, WIDTH / 2, 18, 'hud-timer');
    this.timerText = txt(this, WIDTH / 2, 13, '00:00', 15, '#f2e2a6', { strokeThickness: 3 });
    this.soundBtn = img(this, 620, 12, sfx.muted ? 'hud-sound-off' : 'hud-sound').setInteractive({ useHandCursor: true });
    this.soundBtn.on('pointerup', () => this.soundBtn.setTexture(sfx.toggle() ? 'hud-sound-off' : 'hud-sound'));
    this.orb = img(this, WIDTH / 2, 474, 'hud-orb').setInteractive({ useHandCursor: true });
    this.orb.on('pointerup', () => this.togglePause());
    if (this.mode !== 'local') {
      const label = this.mode === 'host' ? 'Online · Host' : 'Online · Guest';
      this.netText = txt(this, 24, 8, `${label} · you are ${this.myType === 'fire' ? 'Fireboy' : 'Watergirl'}`, 9, this.myType === 'fire' ? '#ff8a6a' : '#7fd4ff', { ox: 0, strokeThickness: 2 });
    }
  }

  // ---- networking ----------------------------------------------------------
  bindNet() {
    this.lastSent = '';
    this.net.onMessage = (m) => {
      if (m.t === 'input' && this.mode === 'host') this.remoteInput = m.i;
      else if (m.t === 'snap' && this.mode === 'guest') { this.world.applySnapshot(m.s); this.handleEvents(this.world.events); }
      else if (m.t === 'restart') this.restart(true);
      else if (m.t === 'leave') this.peerLeft();
      else if (m.t === 'menu') this.leave(true);
    };
  }

  peerLeft() {
    const net = this.net;
    this.net = null;
    net?.close();
    this.mode = 'local';
    this.paused = true;
    this.showMessage('Your partner left the game', [['Back To Menu', () => fadeTo(this, 'Menu')]]);
  }

  // ---- loop ----------------------------------------------------------------
  update(_, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.1);
    for (const m of this.motes) {
      m.x += m.vx * dt; m.y += m.vy * dt; m.ph += dt;
      m.setAlpha(0.3 + Math.sin(m.ph * 1.3) * 0.2);
      if (m.x < 30 || m.x > 610) m.vx *= -1;
      if (m.y < 30 || m.y > 450) m.vy *= -1;
    }

    if (this.mode === 'guest') {
      const i = this.controls.get(this.myType);
      const key = `${+i.left}${+i.right}${+i.up}`;
      if (key !== this.lastSent || (this.stepCount++ % 12) === 0) { this.net.send({ t: 'input', i }); this.lastSent = key; }
    } else if (!(this.paused && this.mode === 'local')) {
      this.acc += dt;
      while (this.acc >= STEP) {
        const inputs = {
          fire: this.inputFor('fire'),
          water: this.inputFor('water'),
        };
        this.world.step(inputs);
        this.handleEvents(this.world.events);
        if (this.mode === 'host') {
          this.pendingEvents = (this.pendingEvents || []).concat(this.world.events);
          if (++this.stepCount % 2 === 0) {
            const s = this.world.snapshot();
            s.ev = this.pendingEvents; this.pendingEvents = [];
            this.net.send({ t: 'snap', s });
          }
        }
        this.acc -= STEP;
      }
    }

    this.syncSprites(dt);
    this.timerText.setText(formatTime(this.world.time));

    if (this.world.status === 'dead' && !this.overlay) {
      this.deathTimer += dt;
      if (this.deathTimer > 1.1) this.showGameOver();
    }
    if (this.world.finished && !this.overlay) this.showComplete();
  }

  inputFor(type) {
    if (this.mode === 'host' && type !== this.myType) return this.remoteInput;
    return this.controls.get(type);
  }

  handleEvents(events) {
    for (const e of events) {
      if (e.type === 'jump') sfx.jump(e.char);
      else if (e.type === 'gem') { sfx.gem(); this.sparkle(e.x, e.y, e.gem); }
      else if (e.type === 'lever') sfx.lever();
      else if (e.type === 'plateDown') sfx.plate();
      else if (e.type === 'win') sfx.win();
      else if (e.type === 'death') {
        sfx.death();
        this.smoke.setPosition(e.x, e.y + 14).setVisible(true).setFrame(0);
        this.smoke.t = 0;
        this.deathTimer = 0;
      }
    }
  }

  sparkle(x, y, type) {
    for (let i = 0; i < 8; i++) {
      const s = img(this, x, y, 'sparkle').setTint(type === 'fire' ? 0xffb090 : 0xc0f0ff);
      const a = (i / 8) * Math.PI * 2;
      this.tweens.add({ targets: s, x: x + Math.cos(a) * 14, y: y + Math.sin(a) * 14, alpha: 0, scale: 0.2, duration: 450, onComplete: () => s.destroy() });
    }
  }

  // ---- rendering -----------------------------------------------------------
  syncSprites(dt) {
    const w = this.world;
    this.drawLiquids();

    for (const c of w.chars) {
      const s = this.charSprites[c.type];
      s.setVisible(c.alive && c.inDoor < 1);
      s.setAlpha(1 - c.inDoor);
      const tx = c.x + c.w / 2, ty = c.y + c.h;
      // guests receive 30 Hz snapshots; ease toward them for smooth motion
      if (this.mode === 'guest') { s.x += (tx - s.x) * Math.min(1, dt * 22); s.y += (ty - s.y) * Math.min(1, dt * 22); if (Math.abs(tx - s.x) > 30 || Math.abs(ty - s.y) > 30) s.setPosition(tx, ty); }
      else s.setPosition(tx, ty);
      s.setFlipX(c.facing < 0);
      let anim = 'idle';
      if (!c.grounded) anim = c.vy < 0 ? 'up' : 'fall';
      else if (Math.abs(c.vx) > 8) anim = 'run';
      if (anim !== s.anim) { s.anim = anim; s.animT = 0; }
      s.animT += dt;
      const [start, n] = ANIMS[anim];
      const fps = anim === 'run' ? 16 : anim === 'idle' ? 7 : 8;
      s.setFrame(start + (Math.floor(s.animT * fps) % n));
    }

    if (this.smoke.visible) {
      this.smoke.t += dt;
      const f = Math.floor(this.smoke.t * 10);
      if (f > 7) this.smoke.setVisible(false); else this.smoke.setFrame(f);
    }

    w.gems.forEach((g, i) => {
      const s = this.gemSprites[i];
      if (g.taken) { s.setVisible(false); return; }
      s.setVisible(true);
      s.phase += dt * 2.2;
      s.y = g.y + Math.sin(s.phase) * 0.8;
    });

    w.boxes.forEach((b, i) => this.boxSprites[i].setPosition(b.x, b.y));
    w.elevators.forEach((e, i) => this.elevatorSprites[i].setPosition(e.x, e.y));
    w.plates.forEach((p, i) => { this.plateSprites[i].button.y = p.y - 5 + p.depth * 3; });
    w.levers.forEach((l, i) => { this.leverSprites[i].handle.rotation = l.angle * 0.78; });

    for (const type of ['fire', 'water']) {
      const d = w.doors[type];
      const panel = this.doorSprites[type];
      const hRes = 39 * RES;
      const off = Math.round(d.open * hRes);
      panel.y = d.y + 4 - d.open * 39;
      panel.setCrop(0, off, 34 * RES, hRes - off);
    }
  }

  drawLiquids() {
    const g = this.liquids;
    g.clear();
    const t = this.time.now / 1000;
    for (const p of this.level.pools) {
      const c = LIQUID[p.type];
      const top = [];
      for (let x = 0; x <= p.w; x += 2) top.push({ x: p.x + x, y: p.y - 1.5 + Math.sin(x * 0.25 + t * 3.2) * 0.9 + Math.sin(x * 0.11 - t * 2) * 0.6 });
      const bottom = [
        { x: p.x + p.w + 2, y: p.y - 3 },
        { x: p.x + p.w - 3, y: p.y + p.depth },
        { x: p.x + 3, y: p.y + p.depth },
        { x: p.x - 2, y: p.y - 3 },
      ];
      g.fillStyle(hex(c.rim), 1);
      g.fillPoints([...top.map((q) => ({ x: q.x, y: q.y - 1 })), ...bottom.map((q) => ({ x: q.x + Math.sign(q.x - p.x - p.w / 2), y: q.y + 1 }))], true);
      g.fillStyle(hex(c.base), 1);
      g.fillPoints([...top, ...bottom], true);
      g.fillStyle(hex(c.mid), 1);
      g.fillPoints([...top, { x: p.x + p.w - 2, y: p.y + p.depth * 0.45 }, { x: p.x + 2, y: p.y + p.depth * 0.45 }], true);
      g.lineStyle(1.2, hex(c.top), 0.95);
      g.strokePoints(top, false);
    }
  }

  // ---- overlays ------------------------------------------------------------
  togglePause() {
    if (this.world.status !== 'playing') return;
    if (this.overlay && this.overlay.kind === 'pause') { this.closeOverlay(); this.paused = false; return; }
    if (this.overlay) return;
    this.paused = true;
    const o = this.openOverlay('pause', 300, 290, true);
    o.add(txt(this, 0, -94, 'Main Menu', 22).setInteractive({ useHandCursor: true }).on('pointerup', () => this.leave()));
    o.add(txt(this, 0, -60, 'Retry Level', 22).setInteractive({ useHandCursor: true }).on('pointerup', () => this.restart()));
    o.add(img(this, -26, -18, 'gem-water'));
    o.add(txt(this, 10, -18, `x ${this.world.collected.water}`, 18, COLORS.gold, { ox: 0 }));
    o.add(img(this, -26, 18, 'gem-fire'));
    o.add(txt(this, 10, 18, `x ${this.world.collected.fire}`, 18, COLORS.gold, { ox: 0 }));
    o.add(txt(this, 0, 74, 'Resume ▸', 26).setInteractive({ useHandCursor: true }).on('pointerup', () => this.togglePause()));
    if (this.mode !== 'local') o.add(txt(this, 0, 112, 'The game keeps running online', 9, '#d8c890', { strokeThickness: 2 }));
    this.hoverify(o);
  }

  showGameOver() {
    const o = this.openOverlay('over', 300, 290, true);
    o.add(txt(this, 0, -66, 'Game Over', 30));
    o.add(txt(this, 0, -4, 'Retry Level', 24).setInteractive({ useHandCursor: true }).on('pointerup', () => this.restart()));
    o.add(txt(this, 0, 58, 'Back To\nMenu', 22).setInteractive({ useHandCursor: true }).on('pointerup', () => this.leave()));
    this.hoverify(o);
  }

  showComplete() {
    const w = this.world;
    const total = w.gems.length, got = w.collected.fire + w.collected.water;
    const rating = got === total && w.time <= this.level.targetTime ? 'A' : got === total ? 'B' : 'C';
    if (this.mode !== 'guest') saveLevelResult(this.levelId, rating, w.time);
    const o = this.openOverlay('done', 320, 300, true);
    o.add(txt(this, 0, -100, 'Level Complete', 26));
    o.add(txt(this, -40, -52, 'Time', 18, COLORS.gold, { ox: 1 }));
    o.add(txt(this, -24, -52, formatTime(w.time), 18, '#f6e9b8', { ox: 0 }));
    o.add(img(this, -56, -16, 'gem-water'));
    o.add(txt(this, -40, -16, `${w.collected.water}/${w.gems.filter((g) => g.type === 'water').length}`, 16, '#f6e9b8', { ox: 0 }));
    o.add(img(this, 18, -16, 'gem-fire'));
    o.add(txt(this, 34, -16, `${w.collected.fire}/${w.gems.filter((g) => g.type === 'fire').length}`, 16, '#f6e9b8', { ox: 0 }));
    const ring = this.add.graphics();
    ring.lineStyle(3, 0xe8cf72, 1).strokeCircle(0, 32, 22).fillStyle(0x3a2f12, 0.6).fillCircle(0, 32, 20);
    o.add(ring);
    o.add(txt(this, 0, 32, rating, 28, rating === 'A' ? '#ffe680' : '#e8cf72'));
    o.add(txt(this, -64, 96, 'Retry', 20).setInteractive({ useHandCursor: true }).on('pointerup', () => this.restart()));
    o.add(txt(this, 60, 96, 'Continue ▸', 20).setInteractive({ useHandCursor: true }).on('pointerup', () => this.leave()));
    this.hoverify(o);
  }

  showMessage(msg, actions) {
    this.closeOverlay();
    const o = this.openOverlay('msg', 300, 200, true);
    o.add(txt(this, 0, -30, msg, 16, COLORS.gold, { style: { wordWrap: { width: 230 } } }));
    actions.forEach(([label, fn], i) => o.add(txt(this, 0, 30 + i * 32, label, 20).setInteractive({ useHandCursor: true }).on('pointerup', fn)));
    this.hoverify(o);
  }

  hoverify(container) {
    for (const t of container.list) {
      if (!t.input || !t.setColor) continue;
      t.on('pointerover', () => t.setColor('#fff3b8'));
      t.on('pointerout', () => t.setColor(COLORS.gold));
      t.on('pointerdown', () => sfx.click());
    }
  }

  openOverlay(kind, w, h, vines) {
    this.closeOverlay();
    const dim = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.45).setInteractive();
    const key = panelTexture(this, `panel-${w}x${h}${vines ? 'v' : ''}`, w, h, { vines });
    const c = this.add.container(WIDTH / 2, HEIGHT / 2);
    c.add(img(this, 0, 0, key));
    c.add(img(this, 0, -h / 2 + 6, 'hud-orb'));
    c.kind = kind;
    c.dim = dim;
    c.setScale(0.85).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });
    this.overlay = c;
    return c;
  }

  closeOverlay() {
    if (!this.overlay) return;
    this.overlay.dim.destroy();
    this.overlay.destroy();
    this.overlay = null;
  }

  restart(fromNet = false) {
    // guests ask the host; the host restarts and tells the guest to follow
    if (this.mode === 'guest' && !fromNet) { this.net.send({ t: 'restart' }); return; }
    if (this.mode === 'host') this.net.send({ t: 'restart' });
    this.scene.restart({ levelId: this.levelId, mode: this.mode, net: this.net, myType: this.myType });
  }

  leave(fromNet = false) {
    if (this.net && !fromNet) this.net.send({ t: 'menu' });
    setTouchLayout('none');
    fadeTo(this, 'LevelSelect', { net: this.net, mode: this.mode, myType: this.myType });
  }
}
