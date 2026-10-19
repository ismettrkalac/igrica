import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { sfx } from '../game/sfx.js';
import { setupCamera, img, spr, txt, button, panelTexture, fadeTo } from './helpers.js';

// Main menu in the temple hall (ref 03): Play / Instructions / Credits, plus Online Duo.
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    setupCamera(this);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    img(this, 320, 240, 'menu-bg');
    img(this, 320, 132, 'logo').setScale(0.5 * 0.92);

    const plaque = img(this, 320, 266, 'play-plaque').setInteractive({ useHandCursor: true });
    const play = txt(this, 322, 266, 'Play ▸', 28);
    plaque.on('pointerover', () => play.setColor('#fff3b8'));
    plaque.on('pointerout', () => play.setColor(COLORS.gold));
    plaque.on('pointerup', () => { sfx.click(); fadeTo(this, 'LevelSelect', { mode: 'local' }); });

    button(this, 320, 336, 'Online Duo', 22, () => fadeTo(this, 'Lobby'));
    button(this, 320, 380, 'Instructions', 22, () => this.showPanel('instructions'));
    button(this, 320, 420, 'Credits', 22, () => this.showPanel('credits'));

    spr(this, 78, 470, 'char-water', 0).setOrigin(0.5, 48 / 52);
    spr(this, 552, 470, 'char-fire', 0).setOrigin(0.5, 48 / 52);
    this.idleT = 0;
  }

  update(_, dms) {
    this.idleT += dms / 1000;
    const f = Math.floor(this.idleT * 7) % 4;
    this.children.list.filter((c) => c.texture && c.texture.key.startsWith('char-')).forEach((c) => c.setFrame(f));
  }

  showPanel(which) {
    if (this.panel) return;
    const dim = this.add.rectangle(320, 240, 640, 480, 0x000000, 0.3).setInteractive();
    const c = this.add.container(320, 240);
    c.add(img(this, 0, 0, panelTexture(this, 'panel-560x440', 560, 440)));
    const gold = COLORS.gold;
    if (which === 'instructions') {
      const lines = [
        ['· use ', gold, 'A,W,D', '#4cc0ff', ' to move WaterGirl', gold],
        ['· use the ', gold, 'arrow keys', '#ff4a2a', ' to move FireBoy', gold],
      ];
      lines.forEach((parts, i) => {
        const pieces = [];
        for (let k = 0; k < parts.length; k += 2) pieces.push(txt(this, 0, -170 + i * 28, parts[k], 17, parts[k + 1], { ox: 0 }));
        const w = pieces.reduce((a, p) => a + p.width, 0);
        let x = -w / 2;
        pieces.forEach((p) => { p.x = x; x += p.width; c.add(p); });
      });
      const body = [
        '· Fireboy is safe in lava, Watergirl in water.',
        'Both die in the green goo.',
        '· Grab the red and blue diamonds and get',
        'both of you to your exit doors.',
        '· Stand on buttons and push levers to move',
        'platforms, and push boxes to reach higher.',
        '· On touch screens use the on-screen buttons:',
        'left side = Watergirl, right side = Fireboy.',
        '· Esc or P pauses, R restarts the level.',
      ];
      body.forEach((l, i) => c.add(txt(this, 0, -96 + i * 26, l, 15, gold)));
    } else {
      c.add(txt(this, 0, -170, 'A fan recreation of', 15, gold));
      c.add(txt(this, 0, -138, 'Fireboy & Watergirl in the Forest Temple', 18, gold));
      c.add(txt(this, 0, -96, 'Original game © Oslo Albet 2009', 17, '#e04030'));
      c.add(txt(this, 0, -66, 'Level design: Jan Villanueva & Oslo Albet', 15, gold));
      c.add(txt(this, 0, -14, 'All graphics in this version are redrawn', 14, gold));
      c.add(txt(this, 0, 10, 'from scratch; no original assets are used.', 14, gold));
      c.add(txt(this, 0, 52, 'Built with Phaser 3 and Vite', 15, gold));
      c.add(txt(this, 0, 80, 'For personal, non-commercial use only.', 13, '#d8c890'));
    }
    const ok = txt(this, 0, 178, 'OK', 26).setInteractive({ useHandCursor: true });
    ok.on('pointerover', () => ok.setColor('#fff3b8'));
    ok.on('pointerout', () => ok.setColor(gold));
    ok.on('pointerup', () => { dim.destroy(); c.destroy(); this.panel = null; });
    c.add(ok);
    c.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out' });
    this.panel = c;
  }
}
