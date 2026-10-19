import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { NetClient } from '../net/NetClient.js';
import { setupCamera, img, spr, txt, button, panelTexture, fadeTo } from './helpers.js';

// Online duo: one player creates a room and shares the 4-letter code, the other joins it.
export default class LobbyScene extends Phaser.Scene {
  constructor() { super('Lobby'); }

  create() {
    setupCamera(this);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    img(this, 320, 240, 'menu-bg');
    img(this, 320, 240, panelTexture(this, 'panel-460x380v', 460, 380, { vines: true }));
    txt(this, 320, 84, 'Online Duo', 28);
    this.pick = 'fire';
    this.net = null;
    this.ui = this.add.container(0, 0);
    this.input.keyboard.on('keydown-ESC', () => this.back());
    this.events.once('shutdown', () => this.removeInput());
    this.home();
  }

  clear() { this.ui.removeAll(true); this.removeInput(); }

  home() {
    this.clear();
    const u = this.ui;
    u.add(txt(this, 320, 122, 'Play together on two devices', 14, '#e8dcb0'));
    u.add(txt(this, 320, 160, 'Choose your character', 15));
    this.fireIcon = spr(this, 270, 222, 'char-fire', 0).setInteractive({ useHandCursor: true }).on('pointerup', () => this.setPick('fire'));
    this.waterIcon = spr(this, 370, 222, 'char-water', 0).setInteractive({ useHandCursor: true }).on('pointerup', () => this.setPick('water'));
    u.add([this.fireIcon, this.waterIcon]);
    this.pickText = txt(this, 320, 252, '', 13, '#f3e2a6');
    u.add(this.pickText);
    this.setPick(this.pick);
    u.add(button(this, 320, 292, 'Create Room', 22, () => this.create_()));
    u.add(button(this, 320, 334, 'Join Room', 22, () => this.joinForm()));
    u.add(button(this, 320, 392, 'Back', 18, () => this.back()));
    this.status = txt(this, 320, 418, '', 12, '#ffb0a0');
    u.add(this.status);
  }

  setPick(t) {
    this.pick = t;
    this.fireIcon.setScale(t === 'fire' ? 0.75 : 0.5).setAlpha(t === 'fire' ? 1 : 0.55);
    this.waterIcon.setScale(t === 'water' ? 0.75 : 0.5).setAlpha(t === 'water' ? 1 : 0.55);
    this.pickText.setText(t === 'fire' ? 'Fireboy' : 'Watergirl');
  }

  async connect() {
    if (this.net) return this.net;
    const net = new NetClient();
    await net.connect();
    this.net = net;
    net.onMessage = (m) => this.onNet(m);
    return net;
  }

  async create_() {
    try {
      this.status.setText('Connecting…');
      const net = await this.connect();
      net.send({ t: 'create', pick: this.pick });
    } catch (e) { this.status.setText(`${e.message}. Try again in a moment.`); }
  }

  joinForm() {
    this.clear();
    const u = this.ui;
    u.add(txt(this, 320, 140, 'Enter the room code', 18));
    this.makeInput();
    u.add(button(this, 320, 300, 'Join ▸', 24, () => this.join()));
    u.add(button(this, 320, 360, 'Back', 18, () => { this.home(); }));
    this.status = txt(this, 320, 400, '', 12, '#ffb0a0');
    u.add(this.status);
  }

  makeInput() {
    const canvas = this.game.canvas.getBoundingClientRect();
    const el = document.createElement('input');
    el.maxLength = 4;
    el.autocapitalize = 'characters';
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.placeholder = 'ABCD';
    const h = canvas.height * 0.09;
    Object.assign(el.style, {
      position: 'fixed', left: `${canvas.left + canvas.width / 2 - h * 1.8}px`, top: `${canvas.top + canvas.height * 0.44}px`,
      width: `${h * 3.6}px`, height: `${h}px`, fontSize: `${h * 0.62}px`, textAlign: 'center', letterSpacing: '0.3em',
      fontFamily: 'Cinzel, Georgia, serif', fontWeight: '700', color: '#2a1e04', background: '#e8d9a0',
      border: '3px solid #3a2f12', borderRadius: '6px', zIndex: 15, textTransform: 'uppercase', outline: 'none',
    });
    el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') this.join(); });
    document.body.appendChild(el);
    el.focus();
    this.codeInput = el;
  }

  removeInput() { this.codeInput?.remove(); this.codeInput = null; }

  async join() {
    const code = (this.codeInput?.value || '').toUpperCase().trim();
    if (code.length !== 4) { this.status.setText('Codes have 4 letters'); return; }
    try {
      this.status.setText('Connecting…');
      const net = await this.connect();
      net.send({ t: 'join', code });
    } catch (e) { this.status.setText(`${e.message}.`); }
  }

  onNet(m) {
    if (m.t === 'created') {
      this.myType = m.you;
      this.clear();
      const u = this.ui;
      u.add(txt(this, 320, 140, 'Share this code with your partner', 15, '#e8dcb0'));
      u.add(txt(this, 320, 200, m.code, 54, '#fff0a8'));
      u.add(txt(this, 320, 262, `You are ${m.you === 'fire' ? 'Fireboy' : 'Watergirl'}`, 16, m.you === 'fire' ? '#ff8a6a' : '#7fd4ff'));
      const wait = txt(this, 320, 300, 'Waiting for partner…', 15);
      this.tweens.add({ targets: wait, alpha: 0.4, yoyo: true, repeat: -1, duration: 600 });
      u.add(wait);
      u.add(button(this, 320, 370, 'Cancel', 18, () => this.back()));
    } else if (m.t === 'peer-joined') {
      this.handOff('host');
    } else if (m.t === 'joined') {
      this.myType = m.you;
      this.handOff('guest');
    } else if (m.t === 'error') {
      this.status?.setText(m.msg);
    } else if (m.t === 'leave') {
      this.status?.setText('Disconnected');
    }
  }

  handOff(mode) {
    this.removeInput();
    const net = this.net;
    net.onMessage = null;
    fadeTo(this, 'LevelSelect', { mode, net, myType: this.myType });
  }

  back() {
    this.net?.close();
    this.net = null;
    fadeTo(this, 'Menu');
  }
}
