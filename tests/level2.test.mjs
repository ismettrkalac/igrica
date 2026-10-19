import { World, Driver, ok, feet, cx, walkTo, hopTo, waitFor, hold, seq } from './sim.mjs';
import level from '../src/levels/level2.js';

// ride the auto shuttle (elevator #idx) and leap onto a ledge at ledgeY toward `dir` once shuttle centre passes leapX
const shuttle = (idx, fromY, ledgeY, dir, leapX, near = 26) => {
  let phase = 'wait';
  return (c, w) => {
    const sh = w.elevators[idx], scx = sh.x + sh.w / 2;
    if (phase === 'wait') { if (feet(c) === fromY && c.grounded && Math.abs(scx - cx(c)) < near && sh.y < fromY) { phase = 'board'; return { up: true }; } return {}; }
    if (phase === 'board') { if (c.grounded && feet(c) === sh.y) phase = 'ride'; else if (c.grounded && feet(c) === fromY) phase = 'wait'; const d = scx - cx(c); return { right: d > 3, left: d < -3 }; }
    if (phase === 'ride') { const d = scx - cx(c); if ((dir < 0 && scx <= leapX) || (dir > 0 && scx >= leapX)) { phase = 'leap'; return { up: true, [dir > 0 ? 'right' : 'left']: true }; } return { right: d > 3, left: d < -3 }; }
    if (phase === 'leap') { if (c.grounded && feet(c) === ledgeY) return true; if (c.grounded && feet(c) !== ledgeY && feet(c) !== sh.y) phase = 'wait'; return { [dir > 0 ? 'right' : 'left']: true }; }
    return {};
  };
};

function play(leapF, leapW) {
  const w = new World(level), d = new Driver(w);
  const [fb, wg] = w.chars; const cyanLift = w.elevators[0], greenLift = w.elevators[1];
  d.tasks.water = seq(waitFor((w) => feet(w.chars[0]) === w.elevators[0].y && w.chars[0].grounded), walkTo(470));
  d.tasks.fire = seq(hopTo(65, 55, 443), waitFor((w) => w.elevators[0].y === 265), walkTo(190));
  if (!d.run(900)) return { stage: 'fire up', w };
  d.tasks.fire = seq(waitFor((w) => feet(w.chars[1]) === w.elevators[1].y && w.chars[1].grounded), walkTo(232), hold());
  d.tasks.water = seq(hopTo(578, 55, 443), waitFor((w) => w.elevators[1].y === 265), walkTo(455));
  if (!d.run(900, () => !d.tasks.water)) return { stage: 'water up', w };
  const docked = (x) => (w) => w.elevators[2].x === x;
  d.tasks.fire = seq(walkTo(135), hopTo(80, 60, 218), walkTo(70), waitFor(docked(110)), walkTo(150), hopTo(225, leapF, 170), walkTo(260));
  d.tasks.water = seq(walkTo(505), hopTo(560, 60, 218), walkTo(570), waitFor(docked(470)), walkTo(490), hopTo(415, leapW, 170), walkTo(380));
  if (!d.run(3000, (w) => w.status === 'won')) return { stage: 'shuttle', w };
  d.run(200, (w) => w.finished);
  return { stage: w.finished ? 'won' : 'doors', w };
}
let best = null;
for (const lf of [60, 70, 80, 90]) for (const lw of [60, 70, 80, 90]) {
  const r = play(lf, lw);
  if (r.stage === 'won') { best = { lf, lw, r }; break; }
  if (!best || ['fire up', 'water up', 'shuttle', 'doors'].indexOf(r.stage) > ['fire up', 'water up', 'shuttle', 'doors'].indexOf(best.r.stage)) best = { lf, lw, r };
}
const w = best.r.w;
ok('level 2 completed by scripted play', best.r.stage === 'won', `stage=${best.r.stage} leapF=${best.lf} leapW=${best.lw} t=${w.time.toFixed(1)}s gems f${w.collected.fire}/w${w.collected.water} status=${w.status} dead=${w.deadType}`);
const [fb, wg] = w.chars;
console.log('fb', cx(fb), feet(fb), 'wg', cx(wg), feet(wg), 'elevs', w.elevators.map((e) => `${e.x},${e.y}`).join(' '));
