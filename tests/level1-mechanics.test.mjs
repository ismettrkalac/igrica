import { World } from '../src/game/World.js';
import level from '../src/levels/level1.js';
const run = (w, n, inp = {}) => { for (let i = 0; i < n; i++) w.step(typeof inp === 'function' ? inp(i) : inp); };
const place = (w, c, x, feetY) => { c.x = x - c.w / 2; c.y = feetY - c.h; c.vx = c.vy = 0; };
let w, fb, wg;
const fresh = () => { w = new World(level); [fb, wg] = w.chars; };
const ok = (name, cond, extra='') => console.log((cond ? 'PASS ' : 'FAIL ') + name, extra);

// 1. plate lowers purple elevator, release raises it
fresh(); place(w, wg, 183, 252); run(w, 5);
const purple = w.elevators[0];
ok('plate pressed', w.plates[0].pressed);
run(w, 150); ok('purple elevator lowered', purple.y === 249, `y=${purple.y}`);
place(w, wg, 100, 252); run(w, 150); ok('purple elevator returns', purple.y === 202, `y=${purple.y}`);

// 2. ride elevator: fireboy on lowered elevator gets carried up
fresh(); place(w, wg, 183, 252); run(w, 150);
place(w, fb, 580, 249); run(w, 5); ok('fb stands on elevator', w.grounded(fb), `fb y=${fb.y + fb.h}`);
place(w, wg, 100, 252); run(w, 150); ok('fb carried up', fb.y + fb.h === 202, `feet=${fb.y + fb.h}`);
// from elevator top (202) walk left onto plate shelf (top 180)? needs jump
run(w, 40, { fire: { left: true, up: true } }); ok('fb reaches tier-5 shelf', fb.y + fb.h <= 180 && fb.x < 550, `x=${fb.x} feet=${fb.y + fb.h}`);

// 3. lever: walking left into lever flips it and lowers the yellow elevator
fresh(); place(w, wg, 200, 327); run(w, 40, { water: { left: true } });
ok('lever flipped', w.levers[0].state === -1);
run(w, 220); ok('yellow elevator lowered', w.elevators[1].y === 314, `y=${w.elevators[1].y}`);

// 4. box can be pushed off the block and along tier 5
fresh(); place(w, fb, 360, 150); run(w, 5);
const box = w.boxes[0], bx0 = box.x;
run(w, 120, { fire: { left: true } }); ok('box pushed left & fell', box.x < bx0 - 20 && box.y + box.h === 183, `box=${box.x},${box.y + box.h}`);

// 5. gems: fireboy can't take blue gem, can take red
fresh(); place(w, fb, 464, 455); run(w, 3); ok('fb ignores blue gem', !w.gems[7].taken);
fresh(); place(w, fb, 336, 455); run(w, 3); ok('fb takes red gem', w.gems[3].taken);

// 6. hazards
fresh(); place(w, wg, 336, 462); run(w, 2); ok('watergirl dies in lava', w.status === 'dead' && w.deadType === 'water');
fresh(); place(w, wg, 464, 462); run(w, 2); ok('watergirl safe in water', w.status === 'playing');
fresh(); place(w, fb, 430, 366); run(w, 2); ok('fireboy dies in poison', w.status === 'dead');

// 7. win: both at doors
fresh(); place(w, fb, 527, 100); place(w, wg, 575, 100); run(w, 3); ok('win status', w.status === 'won');
run(w, 200); ok('finished after entering doors', w.finished);

// 8. climb: from tier-5 floor (183) onto left pillar (118) impossible without box; with box possible
fresh(); place(w, wg, 120, 183); run(w, 5); run(w, 60, (i) => ({ water: { left: true, up: i < 3 } }));
ok('cannot reach pillar top without box', wg.y + wg.h > 118, `feet=${wg.y + wg.h}`);
// slope walking: walk up the tier-3 ramp
fresh(); place(w, wg, 340, 360); run(w, 5); run(w, 150, { water: { left: true } }); ok('walk up ramp to lever area', wg.y + wg.h === 327 && wg.x < 250, `x=${wg.x} feet=${wg.y + wg.h}`);
