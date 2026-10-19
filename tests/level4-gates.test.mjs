import { World, Driver, ok, feet, cx, place, walkTo, hopTo, hold, seq } from './sim.mjs';
import level from '../src/levels/level4.js';
for (const [who, from, target] of [['water', 415, 340], ['fire', 225, 300]]) {
  const w = new World(level), d = new Driver(w); const [fb, wg] = w.chars;
  place(w, fb, 200, 160); place(w, wg, 418, 160); // fb on left button only if who==='water'
  if (who === 'water') { d.tasks.fire = hold(); d.tasks.water = seq(walkTo(from), hopTo(target, 60, 110)); }
  else { place(w, wg, 500, 160); d.tasks.water = hold(); d.tasks.fire = seq(walkTo(from), hopTo(target, 60, 110)); }
  d.run(600);
  const c = who === 'fire' ? fb : wg;
  ok(`${who} cannot reach the door ledge with only one button held`, feet(c) > 110, `feet ${feet(c)} gates ${w.elevators[3].y},${w.elevators[4].y}`);
}
