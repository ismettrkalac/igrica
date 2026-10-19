// Level 5 "Wind Tunnel": scripted playthrough from the spawns to both doors.
import { World, Driver, ok, feet, cx, walkTo, hopTo, waitFor, hold, seq } from './sim.mjs';
import level from '../src/levels/level5.js';
const w = new World(level), d = new Driver(w);
const [fb, wg] = w.chars; const [fanF, fanW, fanT] = w.fans; const box = w.boxes[0];
const stage = (name, cond) => { const r = ok(name, cond, `t=${w.time.toFixed(1)} fb ${cx(fb)},${feet(fb)} wg ${cx(wg)},${feet(wg)} box ${box.x} fans ${w.fans.map((f) => +f.on).join('')} status ${w.status} dead ${w.deadType}`); if (!r) process.exit(1); };
// jump right into a fan's wind (done once airborne past x)
const intoWind = (x) => { let jumped = false; return (c) => { if (cx(c) > x && !c.grounded) return true; const inp = { right: true, up: !jumped && c.grounded }; if (inp.up) jumped = true; return inp; }; };
// while hovering in a fan column, drift sideways onto a ledge at y
const driftTo = (x, y) => (c) => (c.grounded && feet(c) === y && Math.abs(cx(c) - x) < 6 ? true : feet(c) < y + 2 ? { right: x > cx(c), left: x < cx(c) } : {});

// 1. Fireboy presses his timed button past the lava; Watergirl rides her fan up
d.tasks.water = seq(walkTo(358), hold());
d.tasks.fire = seq(walkTo(585));
d.run(600, () => !d.tasks.fire);
stage('Fireboy on his timed button', w.plates[1].pressed && fanW.on);
d.tasks.water = seq(waitFor(() => feet(wg) < 255), driftTo(455, 250));
d.run(600, () => !d.tasks.water);
stage('Watergirl blown up to the upper floor', feet(wg) === 250);
// 2. she hops the box and flips the lever: Fireboy's fan runs for good
d.tasks.water = seq(hopTo(560, 100, 250), walkTo(605));
d.run(600, () => !d.tasks.water);
stage('lever powers Fireboy\'s fan', w.levers[0].state !== w.levers[0].initial && fanF.on);
d.tasks.fire = seq(walkTo(282), waitFor(() => feet(fb) < 255), driftTo(200, 250));
d.run(900, () => !d.tasks.fire);
stage('Fireboy blown up to the upper floor', feet(fb) === 250 && cx(fb) < 252);
// 3. Watergirl hops back over the box and pushes it onto the purple button: the door fan starts
d.tasks.water = seq(hopTo(458, 120, 250), walkTo(458), (c) => (box.x + 13 >= 558 ? true : { right: true }));
d.run(900, () => !d.tasks.water);
stage('box on the purple button, door fan on', w.plates[2].pressed && fanT.on);
// 4. both ride the door fan up and walk to their doors
d.tasks.water = seq(walkTo(423), waitFor(() => feet(wg) < 150), driftTo(300, 140), walkTo(310));
d.tasks.fire = seq(walkTo(215), hopTo(320, 85, 250), walkTo(320), intoWind(405), waitFor(() => feet(fb) < 150), driftTo(260, 140));
d.run(1500, (w) => w.status === 'won');
stage('level 5 completed', w.status === 'won');
console.log('gems', w.collected);
