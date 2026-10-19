import { buildLevel } from './build.js';

// Level 6 "Portal Puzzle" (original).
//  1. A box sits on Fireboy's fan past the lava. Pushing it left clears the fan *and* shoves it into a
//     one-way portal, which drops it onto the purple button in a sealed chamber: the door gate opens.
//     Walking into that portal yourself is a trap: the chamber's only exit drops into the water,
//     fine for Watergirl, fatal for Fireboy.
//  2. Watergirl wades through the water to a two-way portal up to the middle ledge, then holds the
//     orange button that powers Fireboy's fan.
//  3. Both ride the cycling lift over the lava drop to the door ledge.
export default buildLevel({
  id: 6,
  name: 'Portal Puzzle',
  targetTime: 75,

  platforms: [
    [108, 205, 290],  // middle ledge, left (Fireboy arrives from the fan)
    [265, 420, 290],  // middle ledge, right (portal exit and orange button)
    [26, 195, 120],   // door ledge
    [494, 614, 200],  // sealed chamber floor (the gap at its left drops into the water below)
  ],
  blocks: [[460, 26, 10, 189]], // sealed chamber wall
  pools: [
    { type: 'lava', x: 130, w: 150, y: 455 },
    { type: 'water', x: 380, w: 150, y: 455 },
  ],

  fans: [{ x: 50, w: 50, y: 455, top: 272, group: 'orange' }],
  boxes: [{ x: 62, y: 429, size: 26 }],
  portals: [
    { a: { x: 38, y: 455 }, b: { x: 530, y: 200 }, oneWay: true, color: 'violet' },
    { a: { x: 580, y: 455 }, b: { x: 395, y: 290 }, color: 'teal' },
  ],
  plates: [
    { x: 530, y: 200, group: 'purple', color: 'purple' }, // inside the sealed chamber
    { x: 300, y: 290, group: 'orange', color: 'orange' },  // powers the fan
  ],
  elevators: [
    { auto: true, color: 'white', x: 205, y: 290, w: 60, h: 12, toY: 120, speed: 40, pause: 1.3 },
    { group: 'purple', kind: 'gate', color: 'purple', x: 195, y: 40, w: 10, h: 80, toY: -45, speed: 90 },
  ],

  gems: [
    { type: 'fire', x: 75, y: 340 },
    { type: 'fire', x: 205, y: 437 },
    { type: 'fire', x: 150, y: 270 },
    { type: 'fire', x: 235, y: 190 },
    { type: 'water', x: 455, y: 437 },
    { type: 'water', x: 602, y: 424 },
    { type: 'water', x: 350, y: 270 },
    { type: 'water', x: 235, y: 150 },
  ],
  doors: {
    fire: { x: 40, y: 78, w: 40, h: 42 },
    water: { x: 100, y: 78, w: 40, h: 42 },
  },
  spawns: { fire: { x: 300, y: 455 }, water: { x: 330, y: 455 } },
  texts: [
    { x: 330, y: 70, size: 12, parts: [['Some portals only go ', 'gold'], ['one way', 'purple']] },
    { x: 205, y: 395, size: 11, parts: [['Boxes travel through', 'gold']] },
    { x: 205, y: 411, size: 11, parts: [['portals too', 'gold']] },
  ],
});
