import { World } from '../src/game/World.js';
export { World };
export const ok = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, e); return c; };
export const feet = (c) => c.y + c.h;
export const cx = (c) => c.x + c.w / 2;
export const place = (w, c, x, feetY) => { c.x = Math.round(x - c.w / 2); c.y = feetY - c.h; c.vx = c.vy = 0; c.rx = c.ry = 0; };

// Drives a world with per-character "tasks"; each task is a generator-like function returning inputs
// until it reports done. Characters without a task stand still (or hold a plate, etc.).
export class Driver {
  constructor(w) { this.w = w; this.tasks = { fire: null, water: null }; this.frames = 0; }
  char(t) { return this.w.chars[t === 'fire' ? 0 : 1]; }
  step() {
    const inp = {};
    for (const t of ['fire', 'water']) {
      const task = this.tasks[t];
      if (!task) continue;
      const r = task(this.char(t), this.w);
      if (r === true) this.tasks[t] = null; else inp[t] = r || {};
    }
    this.w.step(inp);
    this.frames++;
  }
  // run until all tasks finish (or a predicate holds); returns false on death/timeout
  run(maxFrames = 1200, until = null) {
    for (let i = 0; i < maxFrames; i++) {
      if (this.w.status === 'dead') return false;
      if (until ? until(this.w) : !this.tasks.fire && !this.tasks.water) return true;
      this.step();
    }
    return until ? until(this.w) : !this.tasks.fire && !this.tasks.water;
  }
}

// ---- task factories -------------------------------------------------------
export const walkTo = (x, tol = 3) => (c) => {
  const d = x - cx(c);
  if (Math.abs(d) <= tol && Math.abs(c.vx) < 20) return true;
  if (Math.abs(d) <= tol) return {};
  return { right: d > 0, left: d < 0 };
};
// run toward x and jump when within `at` px horizontally (used to hop onto ledges/platforms)
export const hopTo = (x, at = 40, landY = null) => {
  let jumped = false;
  return (c) => {
    const d = x - cx(c);
    if (jumped && c.grounded && (landY === null || feet(c) <= landY)) return Math.abs(d) < 25 ? true : { right: d > 0, left: d < 0 };
    if (jumped && c.grounded && feet(c) > landY) jumped = false; // landed lower than intended: retry
    const inp = { right: d > 2, left: d < -2 };
    if (!jumped && c.grounded && Math.abs(d) <= at) { inp.up = true; jumped = true; }
    return inp;
  };
};
export const waitFor = (pred) => (c, w) => (pred(w, c) ? true : {});
export const hold = () => () => ({}); // stand still forever
export const seq = (...tasks) => { let i = 0; return (c, w) => { while (i < tasks.length) { const r = tasks[i](c, w); if (r === true) { i++; continue; } return r; } return true; }; };
