import level1 from './level1.js';
import level2 from './level2.js';
import level3 from './level3.js';
import level4 from './level4.js';

// Level 1 is traced from the original; levels 2-4 are new designs in the same style.
// Other nodes on the map are shown but locked until they get a level.
export const LEVELS = { 1: level1, 2: level2, 3: level3, 4: level4 };

// Level-select map nodes (native px), traced from reference/05-level-select.jpg.
// kind: 'gem' (normal), 'tri' (move-together), 'big' (green diamond); `from` = parent node.
export const MAP_NODES = [
  { id: 1, x: 310, y: 453, kind: 'gem' },
  { id: 2, x: 330, y: 398, kind: 'gem', from: 1 },
  { id: 3, x: 318, y: 336, kind: 'tri', from: 2 },
  { id: 4, x: 320, y: 270, kind: 'gem', from: 3 },
  { id: 5, x: 226, y: 302, kind: 'gem', from: 4 },
  { id: 6, x: 158, y: 286, kind: 'tri', from: 5 },
  { id: 7, x: 80, y: 334, kind: 'big', from: 6 },
  { id: 8, x: 250, y: 232, kind: 'gem', from: 4 },
  { id: 9, x: 150, y: 234, kind: 'gem', from: 8 },
  { id: 10, x: 94, y: 197, kind: 'tri', from: 9 },
  { id: 11, x: 40, y: 166, kind: 'big', from: 10 },
  { id: 12, x: 94, y: 264, kind: 'gem', from: 9 },
  { id: 13, x: 36, y: 258, kind: 'big', from: 12 },
  { id: 14, x: 330, y: 195, kind: 'tri', from: 4 },
  { id: 15, x: 250, y: 155, kind: 'gem', from: 14 },
  { id: 16, x: 200, y: 110, kind: 'tri', from: 15 },
  { id: 17, x: 118, y: 84, kind: 'big', from: 16 },
  { id: 18, x: 325, y: 133, kind: 'gem', from: 14 },
  { id: 19, x: 354, y: 77, kind: 'gem', from: 18 },
  { id: 20, x: 325, y: 24, kind: 'big', from: 19 },
  { id: 21, x: 400, y: 165, kind: 'gem', from: 14 },
  { id: 22, x: 462, y: 112, kind: 'gem', from: 21 },
  { id: 23, x: 520, y: 68, kind: 'big', from: 22 },
  { id: 24, x: 395, y: 228, kind: 'gem', from: 4 },
  { id: 25, x: 484, y: 242, kind: 'gem', from: 24 },
  { id: 26, x: 516, y: 180, kind: 'tri', from: 25 },
  { id: 27, x: 590, y: 144, kind: 'big', from: 26 },
  { id: 28, x: 549, y: 214, kind: 'gem', from: 25 },
  { id: 29, x: 594, y: 226, kind: 'big', from: 28 },
  { id: 30, x: 397, y: 316, kind: 'gem', from: 3 },
  { id: 31, x: 494, y: 290, kind: 'gem', from: 30 },
  { id: 32, x: 570, y: 323, kind: 'big', from: 31 },
];
