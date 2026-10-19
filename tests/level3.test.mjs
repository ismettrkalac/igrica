import { World, Driver, ok, feet, cx, walkTo, hopTo, waitFor, hold, seq } from './sim.mjs';
import level from '../src/levels/level3.js';
const w = new World(level), d = new Driver(w);
const [fb, wg] = w.chars; const raft = w.elevators[0], gate = w.elevators[1], lift = w.elevators[2]; const box = w.boxes[0];
const onRaft = (c) => c.grounded && feet(c) === raft.y && cx(c) > raft.x && cx(c) < raft.x + raft.w;
const pushBoxLeftTo = (x) => (c) => (box.x + box.w / 2 <= x + 1 ? true : { left: true });
const stage = (name, okNow) => { const r = ok(name, okNow, `t=${w.time.toFixed(1)} fb ${cx(fb)},${feet(fb)} wg ${cx(wg)},${feet(wg)} raft ${raft.x} status ${w.status}`); if (!r) process.exit(1); };

// 1. Fireboy boards the raft, Watergirl pulls the left lever
d.tasks.fire = seq(hopTo(215, 85, 443), hold());
d.tasks.water = seq(waitFor((w) => onRaft(fb)), walkTo(44));
d.run(600, () => !d.tasks.water);
stage('left lever sends the raft', w.levers[0].state !== w.levers[0].initial);
d.run(600, () => raft.x === 340);
stage('raft carried Fireboy across the poison', raft.x === 340 && onRaft(fb));
// 2. Fireboy steps off, clears the water, flips the right lever to send the raft back
d.tasks.fire = seq(walkTo(468), hopTo(530, 55, 455), walkTo(550), walkTo(527));
d.run(600, () => !d.tasks.fire);
stage('right lever calls the raft back', w.levers[1].state !== w.levers[1].initial);
d.run(600, () => raft.x === 150);
stage('raft back at the left bank', raft.x === 150);
// 3. Watergirl boards, Fireboy flips the right lever again
d.tasks.water = seq(hopTo(215, 85, 443), hold());
d.run(400, () => onRaft(wg));
d.tasks.fire = seq(walkTo(518), walkTo(549));
d.run(400, () => !d.tasks.fire);
d.run(600, () => raft.x === 340);
console.log('levers', w.levers.map((l) => l.state), 'raft', raft.x, raft.phase, 'wg', cx(wg), feet(wg), wg.grounded);
stage('raft carried Watergirl across', raft.x === 340 && onRaft(wg));
// 4. both climb the step and the walkway
d.tasks.water = seq(walkTo(468), walkTo(545), hopTo(590, 60, 407), hopTo(535, 60, 360), walkTo(540));
d.run(800, () => !d.tasks.water);
d.tasks.fire = seq(walkTo(545), hopTo(590, 60, 407), hopTo(535, 60, 360), walkTo(522));
d.run(800, () => !d.tasks.fire);
stage('both on the upper walkway', feet(fb) === 360 && feet(wg) === 360);
// 5. push the box onto the button
d.tasks.fire = seq(pushBoxLeftTo(400));
d.run(800, () => !d.tasks.fire);
d.run(300, () => gate.y === 200);
stage('box holds the button, gate open', w.plates[0].pressed && gate.y === 200);
// 6. both hop over the box, go through the gate, ride the lift, walk to the doors
const toLift = () => seq(walkTo(445), hopTo(350, 95, 360), walkTo(215), waitFor(() => lift.y === 360), walkTo(160), waitFor(() => lift.y === 200), walkTo(105));
d.tasks.fire = seq(toLift(), walkTo(50));
d.run(1500, () => !d.tasks.fire);
console.log('gate', gate.y, 'plate', w.plates[0].pressed, 'box', box.x, box.y, 'lift', lift.y);
stage('Fireboy reached the door ledge', feet(fb) === 200 && fb.atDoor);
d.tasks.water = seq(toLift(), walkTo(100));
d.run(1800, (w) => w.status === 'won');
stage('level 3 completed', w.status === 'won');
console.log('gems', w.collected);
