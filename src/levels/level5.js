import { buildLevel } from './build.js';

// Level 5 "Wind Tunnel" (original).
//  1. Each fan in the middle is powered by the *other* player's timed button, and each button lies
//     beyond a pool only its owner can cross. Fireboy presses his button and Watergirl rides her fan up.
//  2. Up top, Watergirl's lever powers Fireboy's fan for good.
//  3. The fan to the door ledge only runs while the purple button is held: push the box onto it.
export default buildLevel({
  id: 5,
  name: 'Wind Tunnel',
  targetTime: 70,

  platforms: [
    [26, 252, 250],  // upper floor, left (openings are wider than the fans)
    [312, 328, 250], // stepping stone between the two fan shafts
    [388, 614, 250], // upper floor, right
    [230, 388, 140], // door ledge
  ],
  pools: [
    { type: 'water', x: 100, w: 150, y: 455 },
    { type: 'lava', x: 390, w: 150, y: 455 },
  ],

  fans: [
    { x: 262, w: 40, y: 455, top: 232, group: 'green' },  // Fireboy's fan
    { x: 338, w: 40, y: 455, top: 232, group: 'orange' }, // Watergirl's fan
    { x: 398, w: 50, y: 250, top: 122, group: 'purple' }, // to the door ledge
  ],
  boxes: [{ x: 470, y: 224, size: 26 }],
  plates: [
    { x: 55, y: 455, group: 'green', color: 'green', timer: 1.5 },  // Watergirl's button (past the water)
    { x: 585, y: 455, group: 'orange', color: 'orange', timer: 1.5 }, // Fireboy's button (past the lava)
    { x: 560, y: 250, group: 'purple', color: 'purple' },           // box goes here
  ],
  levers: [{ x: 592, y: 250, group: 'green', color: 'green', state: -1 }],

  gems: [
    { type: 'fire', x: 470, y: 437 },
    { type: 'fire', x: 282, y: 330 },
    { type: 'fire', x: 130, y: 230 },
    { type: 'fire', x: 378, y: 112 },
    { type: 'water', x: 175, y: 437 },
    { type: 'water', x: 358, y: 330 },
    { type: 'water', x: 595, y: 230 },
    { type: 'water', x: 348, y: 112 },
  ],
  doors: {
    fire: { x: 240, y: 98, w: 40, h: 42 },
    water: { x: 290, y: 98, w: 40, h: 42 },
  },
  spawns: { fire: { x: 315, y: 455 }, water: { x: 325, y: 455 } },
  texts: [
    { x: 140, y: 300, size: 11, parts: [['Timed buttons keep going', 'gold']] },
    { x: 140, y: 316, size: 11, parts: [['for a moment', 'gold']] },
    { x: 520, y: 188, size: 11, parts: [['The box powers', 'gold']] },
    { x: 520, y: 204, size: 11, parts: [['the fan', 'gold']] },
  ],
});
