import Phaser from 'phaser';
import { touchState, setTouchLayout } from './touch.js';

// Maps keyboard + touch to per-character inputs.
//   local:  Fireboy = arrow keys, Watergirl = W A D (original layout)
//   online: the local player drives `myType` with either key set
export class Controls {
  constructor(scene, mode = 'local', myType = null) {
    this.mode = mode;
    this.myType = myType;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, a: K.A, d: K.D, w: K.W,
    }, true, false);
    setTouchLayout(mode === 'local' ? 'duo' : 'single', myType || 'fire');
  }

  keyboard(type) {
    const k = this.keys;
    const arrows = { left: k.left.isDown, right: k.right.isDown, up: k.up.isDown };
    const wad = { left: k.a.isDown, right: k.d.isDown, up: k.w.isDown };
    if (this.mode === 'local') return type === 'fire' ? arrows : wad;
    if (type !== this.myType) return { left: false, right: false, up: false };
    return { left: arrows.left || wad.left, right: arrows.right || wad.right, up: arrows.up || wad.up };
  }

  get(type) {
    const k = this.keyboard(type);
    const t = touchState(type);
    if (!t) return k;
    return { left: k.left || t.left, right: k.right || t.right, up: k.up || t.up };
  }

  destroy() { setTouchLayout('none'); }
}
