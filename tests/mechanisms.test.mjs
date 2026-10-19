import { World } from '../src/game/World.js';
const ok = (n, c, e = '') => console.log((c ? 'PASS ' : 'FAIL ') + n, e);
const frame = [[16,16,630,16,630,26,16,26],[16,26,26,26,26,455,16,455],[614,26,630,26,630,455,614,455],[16,455,630,455,630,470,16,470]];
const base = (extra) => ({ id: 99, solids: frame, pools: [], gems: [], doors: { fire: { x: 500, y: 58, w: 40, h: 42 }, water: { x: 550, y: 58, w: 40, h: 42 } },
  spawns: { fire: { x: 60, y: 455 }, water: { x: 560, y: 455 } }, ...extra });
// sideways platform carries a rider
{ const w = new World(base({ elevators: [{ auto: true, x: 200, y: 400, w: 60, h: 12, toX: 400, speed: 50, pause: 0.5 }] }));
  const [fb] = w.chars; fb.x = 220; fb.y = 400 - fb.h; for (let i = 0; i < 3; i++) w.step({});
  const x0 = fb.x; for (let i = 0; i < 200; i++) w.step({});
  ok('auto platform moved right and carried rider', w.elevators[0].x > 300 && fb.x - x0 > 90, `plat ${w.elevators[0].x} fb ${x0}->${fb.x}`);
  for (let i = 0; i < 600; i++) w.step({});
  ok('auto platform returns', w.elevators[0].x < 260 || w.elevators[0].phase === true, `plat ${w.elevators[0].x}`); }
// gate opens with plate and blocks when closed
{ const w = new World(base({ plates: [{ x: 120, y: 455, group: 'g', color: 'green' }], elevators: [{ group: 'g', kind: 'gate', x: 300, y: 375, w: 12, h: 80, toY: 290, speed: 80 }] }));
  const [fb, wg] = w.chars; for (let i = 0; i < 200; i++) w.step({ fire: { right: true } });
  ok('closed gate blocks', fb.x + fb.w <= 300, `fb right ${fb.x + fb.w}`);
  wg.x = 110; for (let i = 0; i < 90; i++) w.step({});
  ok('plate opens gate', w.elevators[0].y === 290, `gate y ${w.elevators[0].y}`);
  for (let i = 0; i < 120; i++) w.step({ fire: { right: true } });
  ok('fb passes open gate', fb.x > 320, `fb x ${fb.x}`); }
// sideways platform pushes a standing character out of its way
{ const w = new World(base({ elevators: [{ auto: true, x: 100, y: 425, w: 60, h: 30, toX: 300, speed: 40, pause: 0.2 }] }));
  const [fb, wg] = w.chars; fb.x = 200; fb.y = 455 - fb.h; wg.x = 500;
  for (let i = 0; i < 300; i++) w.step({});
  ok('pushed by moving block', fb.x >= 300 + 60 - 1 || fb.x > 240, `fb x ${fb.x} block ${w.elevators[0].x}`); }
