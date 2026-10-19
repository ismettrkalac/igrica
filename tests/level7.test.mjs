// Level 7 "Grand Machine": scripted playthrough from the spawns to both doors.
import { World, Driver, ok, feet, cx, walkTo, hopTo, waitFor, hold, seq } from './sim.mjs';
import level from '../src/levels/level7.js';
const w = new World(level), d = new Driver(w);
const [fb, wg] = w.chars; const [fanW, fanF, fanC] = w.fans; const box = w.boxes[0]; const [bridge] = w.elevators;
const stage = (name, cond) => { const r = ok(name, cond, `t=${w.time.toFixed(1)} fb ${cx(fb)},${feet(fb)} wg ${cx(wg)},${feet(wg)} box ${box.x},${box.y + box.h} bridge ${bridge.x} fans ${w.fans.map((f) => +f.on).join('')} status ${w.status} dead ${w.deadType}`); if (!r) process.exit(1); };
// steer to the centre of the central fan while it carries you up
const rise = () => (c) => (feet(c) < 145 ? true : { right: cx(c) < 318, left: cx(c) > 322 });
const driftTo = (x, y) => (c) => (c.grounded && feet(c) === y && Math.abs(cx(c) - x) < 6 ? true : feet(c) < y + 2 ? { right: x > cx(c), left: x < cx(c) } : {});

// 1. Watergirl crosses the water and flips the cyan lever; Fireboy waits on his fan beyond the lava
d.tasks.water = seq(walkTo(30));
d.tasks.fire = seq(walkTo(545), hold());
d.run(900, () => !d.tasks.water);
stage('cyan lever flipped, Fireboy\'s fan on', w.levers[0].state !== w.levers[0].initial && fanF.on);
// 2. Fireboy rides up and steps onto the orange timed button; Watergirl rides her fan up
d.tasks.water = seq(walkTo(95), hold());
d.tasks.fire = seq(waitFor(() => feet(fb) < 305), driftTo(595, 300), hold());
d.run(900, () => w.plates[0].pressed && feet(wg) < 305);
stage('Fireboy on the timed button, Watergirl rising', w.plates[0].pressed && fanW.on);
d.tasks.water = seq(driftTo(56, 300));
d.run(600, () => !d.tasks.water);
stage('Watergirl on the ledge beside her fan', feet(wg) === 300 && cx(wg) < 67);
// 3. Fireboy hops back over his fan and pushes the box onto the bridge, then steps back
d.tasks.fire = seq(walkTo(580), hopTo(505, 80, 300), walkTo(500), (c) => (box.x + box.w / 2 <= 362 ? true : { left: true }), walkTo(440), hold());
d.run(1200, () => !d.tasks.fire || (d.tasks.fire && box.x + 13 <= 362 && cx(fb) > 435));
stage('box on the bridge, Fireboy back on the right balcony', box.x >= bridge.x && box.x + box.w <= bridge.x + bridge.w && cx(fb) > 430);
// 4. Watergirl flips the yellow lever: the bridge brings the box across
d.tasks.water = seq(walkTo(36), waitFor(() => !w.fans[0].on), hopTo(150, 85, 300));
d.run(400, () => !d.tasks.water);
d.run(400, () => bridge.x === 220);
stage('bridge docked at the left balcony with the box', bridge.x === 220 && feet(wg) === 300);
// 5. she hops over the box onto the bridge and pushes it onto the purple button
d.tasks.water = seq(walkTo(200), hopTo(278, 75, 300), walkTo(279), (c) => (box.x + box.w / 2 <= 166 ? true : { left: true }));
d.run(900, () => !d.tasks.water);
d.run(30);
stage('box on the purple button, central fan on', w.plates[1].pressed && fanC.on);
// 6. both ride the central fan up to their doors
d.tasks.water = seq(walkTo(280), (c) => (cx(c) >= 316 || !c.grounded ? true : { right: true }), rise(), driftTo(375, 140));
d.tasks.fire = seq((c) => (cx(c) < 405 && !c.grounded ? true : { left: true }), waitFor(() => feet(fb) >= 455), walkTo(322), rise(), driftTo(265, 140));
d.run(1800, (w) => w.status === 'won');
stage('level 7 completed', w.status === 'won');
console.log('gems', w.collected);
