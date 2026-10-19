import Phaser from 'phaser';
import { buildCharacterTextures } from '../art/characters.js';
import { buildObjectTextures } from '../art/objects.js';
import { buildMenuTextures } from '../art/menu.js';
import { setupCamera, txt } from './helpers.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  async create() {
    setupCamera(this);
    const loading = txt(this, 320, 240, 'Loading…', 16);
    try {
      await Promise.race([
        Promise.all([document.fonts.load('700 20px Cinzel'), document.fonts.load('400 20px Cinzel'), document.fonts.load('20px "Uncial Antiqua"')]),
        new Promise((r) => setTimeout(r, 3000)),
      ]);
    } catch { /* fall back to system serif */ }
    buildCharacterTextures(this);
    buildObjectTextures(this);
    buildMenuTextures(this);
    loading.destroy();

    // Deep links for testing: ?level=1 jumps straight into a level, ?scene=Menu etc.
    const q = new URLSearchParams(location.search);
    if (q.get('level')) this.scene.start('Game', { levelId: +q.get('level'), mode: 'local' });
    else if (q.get('scene')) this.scene.start(q.get('scene'));
    else this.scene.start('Title');
  }
}
