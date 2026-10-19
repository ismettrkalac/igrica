import { buildLevel } from './build.js';

// Level 2 "Lift Swap" (original). The players start on opposite sides of a pillar. Each one's lift
// only rises while the *other* holds its button. Up top, a shuttle ferries between two docks under the
// door ledge; step aboard while it waits at a dock and leap up to the doors before it leaves.
export default buildLevel({
  id: 2,
  name: 'Lift Swap',
  targetTime: 50,

  blocks: [[300, 265, 40, 190]], // central pillar splitting the ground floor
  platforms: [
    [100, 250, 265], // left balcony (Fireboy's side)
    [390, 540, 265], // right balcony (Watergirl's side)
    [200, 440, 170], // door ledge
    [26, 110, 218],  // left shuttle dock (above Fireboy's lift)
    [530, 614, 218], // right shuttle dock (above Watergirl's lift)
  ],
  pools: [
    { type: 'lava', x: 200, w: 80, y: 455 },
    { type: 'water', x: 360, w: 80, y: 455 },
    { type: 'lava', x: 150, w: 60, y: 265 },
    { type: 'water', x: 430, w: 60, y: 265 },
  ],

  plates: [
    { x: 470, y: 455, group: 'cyan', color: 'cyan' },  // Watergirl holds this to lift Fireboy
    { x: 230, y: 265, group: 'green', color: 'green' }, // Fireboy holds this to lift Watergirl
  ],
  elevators: [
    { group: 'cyan', color: 'cyan', x: 30, y: 443, w: 70, h: 12, toY: 265, speed: 55 },
    { group: 'green', color: 'green', x: 540, y: 443, w: 70, h: 12, toY: 265, speed: 55 },
    { auto: true, color: 'white', x: 110, y: 218, w: 60, h: 12, toX: 470, speed: 48, pause: 1.1 }, // shuttle
  ],

  gems: [
    { type: 'fire', x: 240, y: 435 },
    { type: 'fire', x: 180, y: 245 },
    { type: 'fire', x: 150, y: 196 },
    { type: 'fire', x: 300, y: 104 },
    { type: 'water', x: 400, y: 435 },
    { type: 'water', x: 460, y: 245 },
    { type: 'water', x: 490, y: 196 },
    { type: 'water', x: 340, y: 104 },
  ],
  doors: {
    fire: { x: 240, y: 128, w: 40, h: 42 },
    water: { x: 360, y: 128, w: 40, h: 42 },
  },
  spawns: { fire: { x: 150, y: 455 }, water: { x: 520, y: 455 } },
  texts: [
    { x: 120, y: 60, size: 12, parts: [['Hold the button', 'gold']] },
    { x: 120, y: 78, size: 12, parts: [['for your partner', 'gold']] },
  ],
});
