import Phaser from 'phaser';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/uncial-antiqua/400.css';
import { WIDTH, HEIGHT, RES } from './config.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import MenuScene from './scenes/MenuScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import GameScene from './scenes/GameScene.js';
import LobbyScene from './scenes/LobbyScene.js';
import { setTouchLayout } from './game/touch.js';

setTouchLayout('none'); // installs the "rotate to landscape" prompt for phones

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH * RES,
  height: HEIGHT * RES,
  backgroundColor: '#000000',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER }, // #game (flexbox) centres the canvas
  input: { activePointers: 4 },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, TitleScene, MenuScene, LevelSelectScene, GameScene, LobbyScene],
});

// Exposed for debugging and automated testing in the browser.
window.__game = game;
// Advance the game by `ms` of simulated time even when the tab is hidden (rAF paused).
window.__advance = (ms, dt = 1000 / 60) => {
  for (let t = 0; t < ms; t += dt) {
    game.loop.now += dt;
    game.step(game.loop.now, dt);
  }
};
