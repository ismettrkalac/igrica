import Phaser from 'phaser';
import { sfx } from '../game/sfx.js';
import { setupCamera, img, button, fadeTo } from './helpers.js';

// Black intro screen with the logo and drifting sparkles (ref 01).
export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    setupCamera(this);
    this.cameras.main.fadeIn(500, 0, 0, 0);
    img(this, 320, 196, 'logo');
    button(this, 324, 430, 'Play ▸', 34, () => { sfx.unlock(); fadeTo(this, 'Menu'); });
    this.sparks = [];
    for (let i = 0; i < 6; i++) {
      const s = img(this, 220 + Math.random() * 200, 330 + Math.random() * 140, 'sparkle');
      s.vy = -6 - Math.random() * 8; s.ph = Math.random() * 6;
      this.sparks.push(s);
    }
    this.input.keyboard.once('keydown-ENTER', () => fadeTo(this, 'Menu'));
    this.input.keyboard.once('keydown-SPACE', () => fadeTo(this, 'Menu'));
  }

  update(_, dms) {
    const dt = dms / 1000;
    for (const s of this.sparks) {
      s.y += s.vy * dt; s.ph += dt * 3;
      s.setAlpha(0.4 + Math.sin(s.ph) * 0.4);
      if (s.y < 320) { s.y = 470; s.x = 220 + Math.random() * 200; }
    }
  }
}
