// Forest Temple — Level 1, traced from reference/10-level1-start.jpg.
// All coordinates are native stage pixels (640x480), y pointing down.
//   solids:    polygons [x0,y0, x1,y1, ...] that make up the stone
//   pools:     liquid surfaces; `y` is the surface line, the stone below is notched by `depth`
//   gems:      centre positions
//   doors:     exit door rectangles (x = left edge, y = top, door stands on y + h)
//   spawns:    feet position of each character
//   plates / levers drive elevators that share their `group`
export default {
  id: 1,
  name: 'Level 1',
  targetTime: 60, // seconds for an A rating with all gems

  solids: [
    // outer frame
    [16, 16, 630, 16, 630, 26, 16, 26],
    [16, 26, 26, 26, 26, 455, 16, 455],
    [614, 26, 630, 26, 630, 455, 614, 455],
    // floor with lava + water notches
    [16, 455, 298, 455, 302, 462, 372, 462, 376, 455, 424, 455, 428, 462, 500, 462, 504, 455, 630, 455, 630, 470, 16, 470],
    // bottom-right step
    [563, 420, 578, 405, 614, 405, 614, 455, 563, 455],
    // Watergirl's starting ledge
    [26, 392, 215, 392, 215, 407, 26, 407],
    // tier 3: long ramp with the poison pool and the lever
    [26, 327, 250, 327, 318, 360, 393, 360, 396, 366, 464, 366, 467, 360, 510, 360, 548, 377,
      546, 384, 505, 375, 412, 375, 404, 394, 390, 394, 380, 375, 312, 375, 246, 342, 26, 342],
    // tier 4: left run + right mass under the purple elevator
    [80, 252, 295, 252, 318, 260, 614, 260, 614, 332, 574, 332, 524, 280, 318, 280, 295, 266, 80, 266],
    // tier 5: left pillar, long run, box block, plate shelf
    [26, 118, 105, 118, 105, 183, 313, 183, 313, 150, 420, 150, 455, 180, 550, 180,
      550, 215, 455, 215, 432, 200, 26, 200],
    // tier 6: hump + door shelf
    [152, 90, 166, 73, 200, 71, 240, 100, 430, 100, 442, 88, 478, 88, 492, 100, 614, 100,
      614, 118, 265, 118, 265, 150, 183, 150, 183, 100],
  ],

  pools: [
    { type: 'lava', x: 299, w: 76, y: 455, depth: 7 },
    { type: 'water', x: 425, w: 78, y: 455, depth: 7 },
    { type: 'poison', x: 394, w: 72, y: 360, depth: 6 },
  ],

  gems: [
    { type: 'fire', x: 176, y: 48 },
    { type: 'fire', x: 304, y: 80 },
    { type: 'fire', x: 128, y: 224 },
    { type: 'fire', x: 336, y: 432 },
    { type: 'water', x: 48, y: 96 },
    { type: 'water', x: 368, y: 80 },
    { type: 'water', x: 384, y: 240 },
    { type: 'water', x: 464, y: 432 },
  ],

  doors: {
    fire: { x: 507, y: 58, w: 40, h: 42 },
    water: { x: 555, y: 58, w: 40, h: 42 },
  },

  spawns: {
    fire: { x: 48, y: 455 },
    water: { x: 48, y: 392 },
  },

  boxes: [{ x: 322, y: 124, size: 26 }],

  plates: [
    { x: 183, y: 252, group: 'purple' },
    { x: 513, y: 180, group: 'purple' },
  ],

  levers: [{ x: 180, y: 327, group: 'yellow' }],

  // y = resting position, toY = position while its plate/lever is active, speed in px/s
  elevators: [
    { group: 'purple', color: 'purple', x: 555, y: 202, w: 50, h: 11, toY: 249, speed: 30 },
    { group: 'yellow', color: 'yellow', x: 26, y: 250, w: 54, h: 12, toY: 314, speed: 20 }, // slow enough to flip the lever and still catch it
  ],

  texts: [
    { x: 139, y: 359, size: 15, parts: [['Use  ', 'gold'], ['A,W,D', 'blue'], [' to', 'gold']] },
    { x: 138, y: 379, size: 15, parts: [['move WaterGirl...', 'gold']] },
    { x: 131, y: 423, size: 15, parts: [['...Use ', 'gold'], ['← ↑ →', 'red'], ['to', 'gold']] },
    { x: 139, y: 444, size: 15, parts: [['move FireBoy', 'gold']] },
    { x: 416, y: 412, size: 15, parts: [['...Never Mix ', 'gold'], ['fire', 'red'], [' & ', 'gold'], ['water', 'blue'], [' !', 'gold']] },
  ],
};
