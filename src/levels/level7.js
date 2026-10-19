import { buildLevel } from './build.js';

// Level 7 "Grand Machine" (original). Every switch helps your partner, never yourself:
//  1. Watergirl wades through the water and flips the cyan lever: Fireboy's fan starts.
//  2. Fireboy rides it up and steps on the orange timed button: Watergirl's fan starts.
//  3. Fireboy pushes the box onto the bridge; Watergirl's yellow lever (on the ledge past her fan) slides
//     the bridge across the gap.
//  4. Watergirl hops behind the box and pushes it onto the purple button: the great central fan starts.
//  5. Each player drops into their own element below and rides the central fan up to the doors.
export default buildLevel({
  id: 7,
  name: 'Grand Machine',
  targetTime: 90,

  platforms: [
    [26, 67, 300],    // left ledge, beside Watergirl's fan (openings are wider than the fans)
    [123, 220, 300],  // left balcony
    [410, 517, 300],  // right balcony
    [573, 614, 300],  // right ledge, beside Fireboy's fan
    [240, 290, 140],  // door ledge, left (the opening is wider than the fan)
    [350, 400, 140],  // door ledge, right
  ],
  pools: [
    { type: 'water', x: 120, w: 150, y: 455 },
    { type: 'lava', x: 370, w: 150, y: 455 },
  ],

  fans: [
    { x: 75, w: 40, y: 455, top: 282, group: 'orange' }, // Watergirl's fan
    { x: 525, w: 40, y: 455, top: 282, group: 'cyan' },  // Fireboy's fan
    { x: 300, w: 40, y: 455, top: 122, group: 'purple' }, // great central fan
  ],
  boxes: [{ x: 455, y: 274, size: 26 }],
  plates: [
    { x: 595, y: 300, group: 'orange', color: 'orange', timer: 1.5 },
    { x: 165, y: 300, group: 'purple', color: 'purple' },
  ],
  levers: [
    { x: 45, y: 455, group: 'cyan', color: 'cyan' },
    { x: 40, y: 300, group: 'yellow', color: 'yellow' }, // on the ledge beyond Watergirl's fan
  ],
  elevators: [
    { group: 'yellow', color: 'yellow', x: 340, y: 300, w: 70, h: 12, toX: 220, speed: 45 }, // bridge
  ],

  gems: [
    { type: 'fire', x: 445, y: 437 },
    { type: 'fire', x: 545, y: 340 },
    { type: 'fire', x: 600, y: 278 },
    { type: 'fire', x: 312, y: 104 },
    { type: 'water', x: 195, y: 437 },
    { type: 'water', x: 95, y: 340 },
    { type: 'water', x: 50, y: 278 },
    { type: 'water', x: 328, y: 104 },
  ],
  doors: {
    fire: { x: 245, y: 98, w: 40, h: 42 },
    water: { x: 355, y: 98, w: 40, h: 42 },
  },
  spawns: { fire: { x: 285, y: 455 }, water: { x: 355, y: 455 } },
  texts: [
    { x: 320, y: 60, size: 12, parts: [['Every switch helps your ', 'gold'], ['partner', 'purple']] },
  ],
});
