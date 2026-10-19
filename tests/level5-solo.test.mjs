// Level 5: neither player can use their own timed button to ride the *other* fan alone.
import { World, Driver, ok, feet, cx, walkTo, seq } from './sim.mjs';
import level from '../src/levels/level5.js';
for (const [who, plateX, fanX] of [['fire', 585, 358], ['water', 55, 282]]) {
  const w = new World(level), d = new Driver(w);
  const c = w.chars[who === 'fire' ? 0 : 1];
  d.tasks[who] = seq(walkTo(plateX), walkTo(fanX));
  d.run(900);
  for (let i = 0; i < 240; i++) w.step({});
  ok(`${who} cannot ride the other fan alone`, feet(c) > 300, `feet ${feet(c)} status ${w.status}`);
}
