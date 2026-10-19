import { buildLevel } from './build.js';

// Level 4 "Clockwork" (original). Everything moves on its own timer. A shared lift brings both players
// to the middle floor, where the paths split: a lava climb for Fireboy and a water climb for Watergirl,
// each on its own cycling lift. At the top, both purple buttons must be held *at the same time* to
// unlock the gates that guard the raised door ledge in the middle.
export default buildLevel({
  id: 4,
  name: 'Clockwork',
  targetTime: 45,

  platforms: [
    [110, 290, 300], // middle floor, left (lava)
    [350, 530, 300], // middle floor, right (water)
    [110, 290, 160], // top floor, left
    [350, 530, 160], // top floor, right
    [260, 380, 110], // raised door ledge
  ],
  pools: [
    { type: 'lava', x: 60, w: 140, y: 455 },
    { type: 'water', x: 440, w: 140, y: 455 },
    { type: 'lava', x: 120, w: 160, y: 300 },
    { type: 'water', x: 360, w: 160, y: 300 },
  ],

  plates: [
    { x: 200, y: 160, group: 'purple', color: 'purple' },
    { x: 440, y: 160, group: 'purple', color: 'purple' },
  ],
  elevators: [
    { auto: true, color: 'white', x: 290, y: 443, w: 60, h: 12, toY: 300, speed: 45, pause: 1.2 },  // shared lift
    { auto: true, color: 'cyan', x: 30, y: 300, w: 80, h: 12, toY: 160, speed: 40, pause: 1.2 },    // left climb
    { auto: true, color: 'orange', x: 530, y: 300, w: 80, h: 12, toY: 160, speed: 40, pause: 1.2 }, // right climb
    // gates in front of the doors: open only when both purple buttons are held together, then stay open
    { group: 'purple', require: 'all', latch: true, kind: 'gate', color: 'purple', x: 248, y: 30, w: 12, h: 80, toY: -62, speed: 90 },
    { group: 'purple', require: 'all', latch: true, kind: 'gate', color: 'purple', x: 380, y: 30, w: 12, h: 80, toY: -62, speed: 90 },
  ],

  gems: [
    { type: 'fire', x: 130, y: 432 },
    { type: 'fire', x: 200, y: 280 },
    { type: 'fire', x: 70, y: 230 },
    { type: 'fire', x: 150, y: 128 },
    { type: 'water', x: 510, y: 432 },
    { type: 'water', x: 440, y: 280 },
    { type: 'water', x: 570, y: 230 },
    { type: 'water', x: 490, y: 128 },
  ],
  doors: {
    water: { x: 274, y: 68, w: 40, h: 42 },
    fire: { x: 326, y: 68, w: 40, h: 42 },
  },
  spawns: { fire: { x: 250, y: 455 }, water: { x: 390, y: 455 } },
  texts: [
    { x: 320, y: 236, size: 12, parts: [['Hold both ', 'gold'], ['purple', 'purple'], [' buttons together', 'gold']] },
  ],
});
