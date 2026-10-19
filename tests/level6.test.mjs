// Level 6 "Portal Puzzle": scripted playthrough from the spawns to both doors.
import { World, Driver, ok, feet, cx, walkTo, waitFor, hold, seq } from './sim.mjs';
import level from '../src/levels/level6.js';
const w = new World(level), d = new Driver(w);
const [fb, wg] = w.chars; const [fan] = w.fans; const box = w.boxes[0]; const [lift, gate] = w.elevators;
const stage = (name, cond) => { const r = ok(name, cond, `t=${w.time.toFixed(1)} fb ${cx(fb)},${feet(fb)} wg ${cx(wg)},${feet(wg)} box ${box.x},${box.y + box.h} fan ${+fan.on} lift ${lift.y} status ${w.status} dead ${w.deadType}`); if (!r) process.exit(1); };
const driftTo = (x, y) => (c) => (c.grounded && feet(c) === y && Math.abs(cx(c) - x) < 6 ? true : feet(c) < y + 2 ? { right: x > cx(c), left: x < cx(c) } : {});

// 1. Fireboy wades through the lava and pushes the box off his fan into the one-way portal
d.tasks.fire = seq(walkTo(110), (c) => (box.y + box.h === 200 ? true : { left: true }), walkTo(75), hold());
d.run(900, () => box.y + box.h === 200 && feet(fb) === 455 && Math.abs(cx(fb) - 75) < 4);
stage('box delivered into the sealed chamber onto the purple button', w.plates[0].pressed && !fan.blocked);
d.run(200, () => gate.y === -45);
stage('door gate opened', gate.y === -45);
// 2. Watergirl wades through the water into the teal portal, then holds the orange button
d.tasks.water = seq((c) => (feet(c) === 290 ? true : { right: true }), walkTo(300), hold());
d.run(900, () => w.plates[1].pressed);
stage('Watergirl holds the orange button on the middle ledge', w.plates[1].pressed && fan.on);
// 3. the fan lifts Fireboy; he drifts onto the middle ledge
d.tasks.fire = seq(waitFor(() => feet(fb) < 295), driftTo(150, 290));
d.run(900, () => !d.tasks.fire);
stage('Fireboy blown up to the middle ledge', feet(fb) === 290 && cx(fb) > 100);
// 4. both ride the cycling lift up and walk through the open gate to their doors
const ride = (startX, doorX) => seq(walkTo(startX), waitFor(() => lift.y === 290), walkTo(235), waitFor(() => lift.y === 120), walkTo(doorX));
d.tasks.fire = ride(190, 60);
d.tasks.water = ride(280, 120);
d.run(2400, (w) => w.status === 'won');
stage('level 6 completed', w.status === 'won');
console.log('gems', w.collected);
