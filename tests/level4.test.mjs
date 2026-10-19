import { World, Driver, ok, feet, cx, walkTo, hopTo, waitFor, hold, seq } from './sim.mjs';
import level from '../src/levels/level4.js';
const w = new World(level), d = new Driver(w);
const [fb, wg] = w.chars; const [mid, left, right, gateL, gateR] = w.elevators;
const stage = (name, cond) => { const r = ok(name, cond, `t=${w.time.toFixed(1)} fb ${cx(fb)},${feet(fb)} wg ${cx(wg)},${feet(wg)} mid ${mid.y} L ${left.y} R ${right.y} status ${w.status} dead ${w.deadType}`); if (!r) process.exit(1); };
const at = (e, y) => () => e.y === y;
// 1. both ride the shared lift up
d.tasks.fire = seq(waitFor(at(mid, 443)), hopTo(306, 70, 443), waitFor(at(mid, 300)), walkTo(240));
d.tasks.water = seq(waitFor(at(mid, 443)), hopTo(334, 70, 443), waitFor(at(mid, 300)), walkTo(400));
d.run(1200);
stage('both reached the middle floor', feet(fb) >= 300 && feet(fb) <= 307 && feet(wg) >= 300 && feet(wg) <= 307);
// 2. separate climbs on the side lifts, then onto the purple buttons
d.tasks.fire = seq(walkTo(125), waitFor(at(left, 300)), walkTo(70), waitFor(at(left, 160)), walkTo(200), hold());
d.tasks.water = seq(walkTo(515), waitFor(at(right, 300)), walkTo(570), waitFor(at(right, 160)), walkTo(440), hold());
d.run(2000, () => w.plates.every((p) => p.pressed));
stage('both buttons held together', w.plates.every((p) => p.pressed));
d.run(200, () => gateL.y === -62 && gateR.y === -62);
stage('gates opened', gateL.y === -62 && gateR.y === -62);
// 3. cross over to the opposite doors (gates stay latched open)
d.tasks.fire = seq(walkTo(225), hopTo(300, 60, 110), walkTo(346));
d.tasks.water = seq(walkTo(415), hopTo(340, 60, 110), walkTo(294));
d.run(1200, (w) => w.status === 'won');
stage('level 4 completed', w.status === 'won');
console.log('gems', w.collected);
