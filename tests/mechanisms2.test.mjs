// Fans, portals, timed buttons and inverted mechanisms on small test stages.
import { World, ok, feet, cx, place } from './sim.mjs';
import { buildLevel } from '../src/levels/build.js';

const stage = (extra) => buildLevel({
  id: 98, gems: [], doors: { fire: { x: 500, y: 58, w: 40, h: 42 }, water: { x: 550, y: 58, w: 40, h: 42 } },
  spawns: { fire: { x: 60, y: 455 }, water: { x: 580, y: 455 } }, ...extra,
});
const run = (w, n, inp = {}) => { for (let i = 0; i < n; i++) w.step(inp); };

// fan lifts a character and lets it hover near the top of the column
{
  const w = new World(stage({ fans: [{ x: 200, w: 50, y: 455, top: 300 }] }));
  const [fb] = w.chars; place(w, fb, 225, 455);
  run(w, 240);
  ok('fan lifts and holds a character near the column top', feet(fb) > 290 && feet(fb) < 345, `feet ${feet(fb)}`);
  run(w, 90, { fire: { right: true } });
  ok('character can steer out of the wind and fall', feet(fb) === 455 && cx(fb) > 250, `x ${cx(fb)} feet ${feet(fb)}`);
}
// box on the grate blocks the fan; pushing it off restores the wind
{
  const w = new World(stage({ fans: [{ x: 200, w: 50, y: 455, top: 300 }], boxes: [{ x: 212, y: 429, size: 26 }] }));
  const [fb] = w.chars; run(w, 5);
  ok('box on the grate blocks the fan', !w.fans[0].on && w.fans[0].blocked);
  place(w, fb, 180, 455); run(w, 200, { fire: { right: true } });
  ok('pushing the box off restores the wind', w.fans[0].on, `box x ${w.boxes[0].x}`);
}
// fan switched by a plate, and an inverted fan
{
  const w = new World(stage({ plates: [{ x: 100, y: 455, group: 'g' }], fans: [{ x: 200, w: 50, y: 455, top: 300, group: 'g' }, { x: 300, w: 50, y: 455, top: 300, group: 'g', invert: true }] }));
  const [fb] = w.chars; run(w, 3);
  ok('switched fan starts off, inverted fan starts on', !w.fans[0].on && w.fans[1].on);
  place(w, fb, 100, 455); run(w, 3);
  ok('plate turns switched fan on and inverted fan off', w.fans[0].on && !w.fans[1].on);
}
// two-way portal carries characters both ways; one-way only forward; boxes travel too
{
  const w = new World(stage({ portals: [{ a: { x: 150, y: 455 }, b: { x: 450, y: 455 } }, { a: { x: 250, y: 455 }, b: { x: 560, y: 360 }, oneWay: true }],
    platforms: [[520, 614, 360]] }));
  const [fb, wg] = w.chars; place(w, wg, 600, 455); place(w, fb, 120, 455);
  run(w, 40, { fire: { right: true } });
  ok('two-way portal a→b', cx(fb) > 440, `x ${cx(fb)}`);
  run(w, 20, { fire: { right: true } }); run(w, 60, { fire: { left: true } });
  ok('two-way portal b→a', cx(fb) < 200, `x ${cx(fb)}`);
  const w2 = new World(stage({ portals: [{ a: { x: 250, y: 455 }, b: { x: 560, y: 360 }, oneWay: true }], platforms: [[520, 614, 360]], boxes: [{ x: 190, y: 429, size: 26 }] }));
  const [fb2, wg2] = w2.chars; place(w2, wg2, 600, 455); place(w2, fb2, 170, 455);
  run(w2, 120, { fire: { right: true } });
  ok('box pushed into a one-way portal comes out at the far end', w2.boxes[0].x > 520 && w2.boxes[0].y + 26 === 360, `box ${w2.boxes[0].x},${w2.boxes[0].y + 26}`);
  place(w2, wg2, 560, 360); run(w2, 3); place(w2, wg2, 580, 360); run(w2, 40, { water: { left: true } });
  ok('one-way portal does not carry back', cx(wg2) > 500, `wg x ${cx(wg2)}`);
}
// timed plate stays on after release, then switches off
{
  const w = new World(stage({ plates: [{ x: 100, y: 455, group: 't', timer: 2 }], elevators: [{ group: 't', kind: 'gate', x: 300, y: 375, w: 12, h: 80, toY: 290, speed: 200 }] }));
  const [fb] = w.chars; place(w, fb, 100, 455); run(w, 10);
  place(w, fb, 40, 455); run(w, 60);
  ok('timed plate still on 1 s after release', w.plates[0].pressed && w.elevators[0].y === 290);
  run(w, 90);
  ok('timed plate off after its timer', !w.plates[0].pressed && w.elevators[0].y === 375, `left ${w.plates[0].left}`);
}
// inverted gate: open by default, closes while its plate is held
{
  const w = new World(stage({ plates: [{ x: 100, y: 455, group: 'i' }], elevators: [{ group: 'i', invert: true, kind: 'gate', x: 300, y: 375, w: 12, h: 80, toY: 290, speed: 200 }] }));
  const [fb] = w.chars; run(w, 60);
  ok('inverted gate starts open', w.elevators[0].y === 290);
  place(w, fb, 100, 455); run(w, 60);
  ok('inverted gate closes while held', w.elevators[0].y === 375);
}
