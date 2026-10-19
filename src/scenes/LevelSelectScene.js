import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { LEVELS, MAP_NODES } from '../levels/index.js';
import { sfx } from '../game/sfx.js';
import { setupCamera, img, txt, button, fadeTo, loadProgress, formatTime } from './helpers.js';

// Branching level map on a wooden board (ref 05).
export default class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelect'); }

  init(data) {
    this.mode = data?.mode || 'local';
    this.net = data?.net || null;
    this.myType = data?.myType || null;
  }

  create() {
    setupCamera(this);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    img(this, 320, 240, 'map-bg');
    const progress = loadProgress();
    const done = (id) => !!progress.levels[id];
    const byId = Object.fromEntries(MAP_NODES.map((n) => [n.id, n]));

    // paths
    const g = this.add.graphics();
    for (const n of MAP_NODES) {
      if (!n.from) continue;
      const p = byId[n.from];
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(p.x, p.y),
        new Phaser.Math.Vector2((p.x + n.x) / 2 + (n.y - p.y) * 0.15, (p.y + n.y) / 2 - (n.x - p.x) * 0.15),
        new Phaser.Math.Vector2(n.x, n.y),
      );
      g.lineStyle(7, 0x2a1d06, 1); curve.draw(g, 24);
      g.lineStyle(3.5, 0xa2852f, 1); curve.draw(g, 24);
    }

    const isOpen = (n) => n.id === 1 || (n.from && done(n.from));
    for (const n of MAP_NODES) {
      const playable = !!LEVELS[n.id];
      const state = done(n.id) ? 'done' : isOpen(n) && playable ? 'open' : 'locked';
      if (state === 'open') {
        const ring = img(this, n.x, n.y, 'node-ring');
        this.tweens.add({ targets: ring, alpha: 0.35, yoyo: true, repeat: -1, duration: 700 });
      }
      const s = img(this, n.x, n.y, `node-${n.kind}-${state}`).setInteractive({ useHandCursor: true });
      s.on('pointerover', () => { s.setScale(0.56); this.showInfo(n, progress.levels[n.id], playable, isOpen(n)); });
      s.on('pointerout', () => s.setScale(0.5));
      s.on('pointerup', () => {
        if (this.mode === 'guest') return;
        if (!playable) { this.showInfo(n, null, false, isOpen(n)); return; }
        if (!isOpen(n) && !done(n.id)) return;
        sfx.click();
        this.start(n.id);
      });
    }

    this.info = txt(this, 320, 470, '', 12, '#f3e2a6', { strokeThickness: 3 });
    button(this, 80, 420, 'Main Menu', 18, () => this.back());

    if (this.mode === 'guest') {
      this.info.setText('Waiting for the host to pick a level…');
    }
    if (this.net) {
      this.net.onMessage = (m) => {
        if (m.t === 'start' && this.mode === 'guest') this.scene.start('Game', { levelId: m.level, mode: 'guest', net: this.net, myType: this.myType });
        else if (m.t === 'leave') { this.info.setText('Your partner left.'); this.net.close(); this.net = null; this.mode = 'local'; }
      };
    }
  }

  start(id) {
    if (this.mode === 'host') this.net.send({ t: 'start', level: id });
    fadeTo(this, 'Game', { levelId: id, mode: this.mode, net: this.net, myType: this.myType });
  }

  showInfo(n, result, playable, open) {
    if (!playable) this.info.setText(`Level ${n.id} – not recreated yet`);
    else if (result) this.info.setText(`Level ${n.id}   best ${formatTime(result.time)}   rating ${result.rating}`);
    else this.info.setText(open ? `Level ${n.id}` : `Level ${n.id} – locked`);
  }

  back() {
    if (this.net) { this.net.send({ t: 'leave' }); this.net.close(); }
    fadeTo(this, 'Menu');
  }
}
