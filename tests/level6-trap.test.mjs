// Level 6: the one-way portal can't be used by Fireboy as a shortcut (its chamber drops into water),
// while Watergirl survives the drop.
import { World, ok, feet, place } from './sim.mjs';
import level from '../src/levels/level6.js';
for (const who of ['fire', 'water']) {
  const w = new World(level);
  const c = w.chars[who === 'fire' ? 0 : 1];
  place(w, c, 70, 455); w.boxes[0].x = 200; w.boxes[0].y = 429; // box out of the way
  let reachedChamber = false;
  for (let i = 0; i < 240 && w.status === 'playing'; i++) {
    w.step({ [who]: { left: i < 40 } }); // walk into the portal, then keep walking briefly inside the chamber
    if (feet(c) === 200) reachedChamber = true;
  }
  if (who === 'fire') ok('Fireboy taking the one-way portal ends in the water', reachedChamber && w.status === 'dead' && w.deadType === 'fire', `chamber ${reachedChamber} status ${w.status}`);
  else ok('Watergirl taking the one-way portal survives the drop', reachedChamber && w.status === 'playing' && feet(c) >= 455, `chamber ${reachedChamber} feet ${feet(c)} status ${w.status}`);
}
