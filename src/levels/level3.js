import { buildLevel } from './build.js';

// Level 3 "Poison River" (original). A raft ferries players across a poison river. Its two levers
// (one on each bank) act like a two-way switch, so whoever is left behind can call the raft back.
// On the far side a gate blocks the way to the exit lift: push the box onto the green button to hold
// it open, then ride the lift up to the doors.
export default buildLevel({
  id: 3,
  name: 'Poison River',
  targetTime: 75,

  platforms: [
    [200, 560, 360], // upper walkway with the box, button and gate
    [26, 125, 200],  // door ledge
  ],
  blocks: [
    [560, 407, 54, 48],  // step up from the far bank
    [270, 190, 32, 90],  // gate housing (the gate slides up into it)
  ],
  pools: [
    { type: 'poison', x: 180, w: 280, y: 455, depth: 8 },
    { type: 'water', x: 475, w: 40, y: 455 },
  ],

  boxes: [{ x: 487, y: 334, size: 26 }],
  plates: [{ x: 400, y: 360, group: 'green', color: 'green' }],
  levers: [
    { x: 50, y: 455, group: 'orange', color: 'orange' },
    { x: 540, y: 455, group: 'orange', color: 'orange' },
  ],
  elevators: [
    { group: 'orange', color: 'orange', x: 150, y: 443, w: 120, h: 12, toX: 340, speed: 55 }, // raft
    { group: 'green', kind: 'gate', color: 'green', x: 280, y: 280, w: 12, h: 80, toY: 200, speed: 70 },
    { auto: true, color: 'cyan', x: 125, y: 360, w: 70, h: 12, toY: 200, speed: 40, pause: 1.3 }, // exit lift
  ],

  gems: [
    { type: 'fire', x: 220, y: 425 },
    { type: 'fire', x: 400, y: 425 },
    { type: 'fire', x: 245, y: 338 },
    { type: 'fire', x: 160, y: 282 },
    { type: 'water', x: 310, y: 425 },
    { type: 'water', x: 495, y: 437 },
    { type: 'water', x: 450, y: 338 },
    { type: 'water', x: 160, y: 242 },
  ],
  doors: {
    fire: { x: 30, y: 158, w: 40, h: 42 },
    water: { x: 80, y: 158, w: 40, h: 42 },
  },
  spawns: { fire: { x: 82, y: 455 }, water: { x: 114, y: 455 } },
  texts: [
    { x: 330, y: 70, size: 12, parts: [['Either lever moves the raft', 'gold']] },
    { x: 430, y: 300, size: 11, parts: [['Box on the button', 'gold']] },
    { x: 430, y: 316, size: 11, parts: [['keeps the gate open', 'gold']] },
  ],
});
