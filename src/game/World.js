import { WIDTH, HEIGHT, PHYS, STEP } from '../config.js';

// Deterministic platformer simulation for one level.
// Terrain is a 1-px collision mask rasterised from the level polygons, so ramps and
// odd shapes collide exactly like they are drawn. Dynamic solids (boxes, elevators) are AABBs.
// Positions are integers plus a sub-pixel remainder, moved one pixel at a time.

export function rasterize(polygons, w = WIDTH, h = HEIGHT) {
  const mask = new Uint8Array(w * h);
  for (const poly of polygons) {
    const n = poly.length / 2;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) { minY = Math.min(minY, poly[i * 2 + 1]); maxY = Math.max(maxY, poly[i * 2 + 1]); }
    for (let y = Math.max(0, Math.floor(minY)); y < Math.min(h, Math.ceil(maxY)); y++) {
      const sy = y + 0.5, xs = [];
      for (let i = 0; i < n; i++) {
        const x0 = poly[i * 2], y0 = poly[i * 2 + 1];
        const x1 = poly[((i + 1) % n) * 2], y1 = poly[((i + 1) % n) * 2 + 1];
        if ((y0 <= sy && y1 > sy) || (y1 <= sy && y0 > sy)) xs.push(x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const a = Math.max(0, Math.ceil(xs[k] - 0.5)), b = Math.min(w, Math.ceil(xs[k + 1] - 0.5));
        for (let x = a; x < b; x++) mask[y * w + x] = 1;
      }
    }
  }
  return mask;
}

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export class World {
  constructor(level) {
    this.level = level;
    this.mask = rasterize(level.solids);
    this.time = 0;
    this.status = 'playing'; // playing | dead | won
    this.deadType = null;
    this.events = []; // one-shot events for the renderer/audio: {type, ...}

    const { bodyW: w, bodyH: h } = PHYS;
    this.chars = ['fire', 'water'].map((type) => {
      const s = level.spawns[type];
      return {
        type, w, h, x: Math.round(s.x - w / 2), y: Math.round(s.y - h), rx: 0, ry: 0,
        vx: 0, vy: 0, grounded: true, facing: 1, pushing: false, alive: true, atDoor: false, inDoor: 0,
      };
    });
    this.boxes = (level.boxes || []).map((b) => ({ kind: 'box', x: b.x, y: b.y, w: b.size, h: b.size, rx: 0, ry: 0, vy: 0 }));
    // Elevators/platforms/gates: rest at (x, y), travel to (toX, toY) while their group is active.
    // `auto: true` makes them shuttle back and forth on their own (pausing `pause` seconds at each end).
    this.elevators = (level.elevators || []).map((e) => ({
      kind: 'elevator', ...e, x0: e.x, y0: e.y, toX: e.toX ?? e.x, toY: e.toY ?? e.y, rx: 0, ry: 0, phase: false, wait: 0,
    }));
    this.plates = (level.plates || []).map((p) => ({ ...p, w: 22, pressed: false, depth: 0 }));
    this.levers = (level.levers || []).map((l) => ({ ...l, state: l.state ?? 1, initial: l.state ?? 1, angle: l.state ?? 1, touching: new Set() }));
    this.gems = level.gems.map((g) => ({ ...g, taken: false }));
    this.doors = { fire: { ...level.doors.fire, open: 0 }, water: { ...level.doors.water, open: 0 } };
    this.collected = { fire: 0, water: 0 };
  }

  // ---- collision queries -------------------------------------------------
  maskHit(x, y, w, h) {
    const m = this.mask;
    if (x < 0 || y < 0 || x + w > WIDTH || y + h > HEIGHT) return true;
    for (let j = y; j < y + h; j++) {
      const row = j * WIDTH;
      for (let i = x; i < x + w; i++) if (m[row + i]) return true;
    }
    return false;
  }

  solidAt(x, y, w, h, self) {
    if (this.maskHit(x, y, w, h)) return true;
    const r = { x, y, w, h };
    for (const e of this.elevators) if (e !== self && overlap(r, e)) return true;
    for (const b of this.boxes) if (b !== self && overlap(r, b)) return true;
    return false;
  }

  boxAt(x, y, w, h, self) {
    const r = { x, y, w, h };
    return this.boxes.find((b) => b !== self && overlap(r, b));
  }

  // ---- movement ----------------------------------------------------------
  moveX(ent, amount, isChar) {
    ent.rx += amount;
    let move = Math.round(ent.rx);
    ent.rx -= move;
    const sign = Math.sign(move);
    let pushed = false;
    while (move !== 0) {
      const nx = ent.x + sign;
      if (!this.solidAt(nx, ent.y, ent.w, ent.h, ent)) { ent.x = nx; move -= sign; continue; }
      // climb slopes
      let climbed = false;
      if (isChar ? ent.grounded || ent.vy >= 0 : true) {
        for (let k = 1; k <= PHYS.stepUp; k++) {
          if (!this.solidAt(nx, ent.y - k, ent.w, ent.h, ent)) { ent.x = nx; ent.y -= k; climbed = true; break; }
        }
      }
      if (climbed) { move -= sign; continue; }
      // push a box
      if (isChar) {
        const box = this.boxAt(nx, ent.y, ent.w, ent.h, ent);
        if (box && box.y + box.h > ent.y + 4 && this.moveX(box, sign, false) !== 0) {
          pushed = true;
          if (!this.solidAt(nx, ent.y, ent.w, ent.h, ent)) { ent.x = nx; move -= sign; continue; }
        }
      }
      if (isChar) ent.vx = 0;
      ent.rx = 0;
      break;
    }
    if (isChar) ent.pushing = pushed;
    return sign * Math.abs(Math.round(amount)) - move;
  }

  moveY(ent, amount) {
    ent.ry += amount;
    let move = Math.round(ent.ry);
    ent.ry -= move;
    const sign = Math.sign(move);
    while (move !== 0) {
      if (!this.solidAt(ent.x, ent.y + sign, ent.w, ent.h, ent)) { ent.y += sign; move -= sign; continue; }
      ent.vy = 0;
      ent.ry = 0;
      return false;
    }
    return true;
  }

  grounded(ent) { return this.solidAt(ent.x, ent.y + 1, ent.w, ent.h, ent); }

  ridersOf(plat) {
    const out = [];
    for (const c of this.chars) if (c.alive && c.y + c.h === plat.y && c.x < plat.x + plat.w && c.x + c.w > plat.x) out.push(c);
    for (const b of this.boxes) if (b !== plat && b.y + b.h === plat.y && b.x < plat.x + plat.w && b.x + b.w > plat.x) out.push(b);
    return out;
  }

  // ---- step --------------------------------------------------------------
  step(inputs) {
    this.events.length = 0;
    if (this.status === 'won') { this.stepDoors(); return; }
    if (this.status === 'playing') this.time += STEP;

    this.stepMechanisms();

    for (const c of this.chars) {
      if (!c.alive || this.status !== 'playing') continue;
      this.stepChar(c, inputs[c.type] || {});
    }
    for (const b of this.boxes) {
      b.vy = Math.min(b.vy + PHYS.gravity * STEP, PHYS.maxFall);
      if (!this.moveY(b, b.vy * STEP)) b.vy = 0;
    }
    if (this.status === 'playing') this.checkInteractions();
    this.stepDoors();
  }

  stepChar(c, inp) {
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const g = c.grounded;
    const max = c.pushing ? PHYS.pushSpeed : PHYS.runSpeed;
    if (dir !== 0) {
      c.facing = dir;
      const reversing = Math.sign(c.vx) === -dir;
      const a = reversing ? PHYS.turnDecel : g ? PHYS.groundAccel : PHYS.airAccel;
      c.vx += dir * a * STEP;
      if (Math.abs(c.vx) > max) c.vx = Math.sign(c.vx) * Math.max(max, Math.abs(c.vx) - PHYS.groundDecel * STEP);
    } else {
      const d = (g ? PHYS.groundDecel : PHYS.airDecel) * STEP;
      c.vx = Math.abs(c.vx) <= d ? 0 : c.vx - Math.sign(c.vx) * d;
    }

    if (inp.up && g && c.vy >= 0) { c.vy = -PHYS.jumpSpeed; c.grounded = false; this.events.push({ type: 'jump', char: c.type }); }
    c.vy = Math.min(c.vy + PHYS.gravity * STEP, PHYS.maxFall);

    const wasGrounded = c.grounded;
    this.moveX(c, c.vx * STEP, true);
    const landedBefore = c.grounded;
    if (!this.moveY(c, c.vy * STEP) && c.vy === 0 && !landedBefore) this.events.push({ type: 'land', char: c.type });
    c.grounded = this.grounded(c);

    // stick to descending slopes
    if (wasGrounded && !c.grounded && c.vy >= 0) {
      for (let k = 1; k <= PHYS.snapDown; k++) {
        if (this.solidAt(c.x, c.y + k, c.w, c.h, c)) { c.y += k - 1; c.grounded = true; c.vy = 0; break; }
      }
    }
    if (c.grounded && c.vy > 0) c.vy = 0;
  }

  stepMechanisms() {
    // pressure plates: pressed while a character or box stands on them
    for (const p of this.plates) {
      const zone = { x: p.x - p.w / 2, y: p.y - 8, w: p.w, h: 9 };
      const was = p.pressed;
      p.pressed = this.chars.some((c) => c.alive && overlap(zone, c) && c.y + c.h >= p.y - 2)
        || this.boxes.some((b) => overlap(zone, b) && b.y + b.h >= p.y - 2);
      p.depth += ((p.pressed ? 1 : 0) - p.depth) * 0.35;
      if (p.pressed !== was) this.events.push({ type: p.pressed ? 'plateDown' : 'plateUp' });
    }
    // levers: walk into the handle to flip it
    for (const l of this.levers) {
      const zone = { x: l.x - 10, y: l.y - 12, w: 20, h: 12 }; // the handle: jumping over it leaves it alone
      for (const c of this.chars) {
        // a character flips a lever at most once per touch, so turning around on it doesn't undo the flip
        if (!c.alive || !overlap(zone, c)) { l.touching.delete(c.type); continue; }
        if (l.touching.has(c.type)) continue;
        if (c.vx > 15 && l.state === -1 && c.x + c.w / 2 < l.x + 4) { l.state = 1; l.touching.add(c.type); this.events.push({ type: 'lever' }); }
        else if (c.vx < -15 && l.state === 1 && c.x + c.w / 2 > l.x - 4) { l.state = -1; l.touching.add(c.type); this.events.push({ type: 'lever' }); }
      }
      l.angle += (l.state - l.angle) * 0.3;
    }
    // elevators follow their group's control (or shuttle on their own when `auto`)
    for (const e of this.elevators) {
      let active;
      if (e.auto) {
        const atEnd = (e.phase ? e.x === e.toX && e.y === e.toY : e.x === e.x0 && e.y === e.y0);
        if (atEnd) { e.wait += STEP; if (e.wait >= (e.pause ?? 1)) { e.phase = !e.phase; e.wait = 0; } }
        active = e.phase;
      } else {
        active = this.groupActive(e);
      }
      const tx = active ? e.toX : e.x0, ty = active ? e.toY : e.y0;
      const v = (e.speed || 40) * STEP;
      const px = e.x + e.rx, py = e.y + e.ry;
      const dist = Math.hypot(tx - px, ty - py);
      if (dist < 1e-6) continue;
      const k = Math.min(1, v / dist);
      this.moveElevatorX(e, (tx - px) * k);
      this.moveElevator(e, (ty - py) * k);
    }
  }

  // A group is driven by its plates (any one held, or every one with `require: 'all'`) and its levers,
  // which act like two-way switches: each flip toggles it. `latch: true` keeps it on once triggered.
  groupActive(e) {
    const plates = this.plates.filter((p) => p.group === e.group);
    const levers = this.levers.filter((l) => l.group === e.group);
    let on = e.require === 'all' ? plates.length > 0 && plates.every((p) => p.pressed) : plates.some((p) => p.pressed);
    if (levers.length) on = on || levers.filter((l) => l.state !== l.initial).length % 2 === 1; // each flip toggles
    if (e.latch) { e.latched = e.latched || on; on = e.latched; }
    return on;
  }

  // Sideways travel: carries riders and shoves characters/boxes standing in the way.
  moveElevatorX(e, dx) {
    e.rx += dx;
    let move = Math.round(e.rx);
    e.rx -= move;
    const sign = Math.sign(move);
    while (move !== 0) {
      const riders = this.ridersOf(e);
      const ahead = { x: sign > 0 ? e.x + e.w : e.x - 1, y: e.y, w: 1, h: e.h };
      if (this.maskHit(ahead.x, ahead.y, 1, ahead.h)) { e.rx = 0; return; }
      for (const o of [...this.chars.filter((c) => c.alive), ...this.boxes]) {
        if (riders.includes(o) || !overlap(ahead, o)) continue;
        if (this.solidAt(o.x + sign, o.y, o.w, o.h, o)) { e.rx = 0; return; } // pinned: the platform waits
        o.x += sign;
      }
      e.x += sign;
      for (const r of riders) if (!this.solidAt(r.x + sign, r.y, r.w, r.h, r)) r.x += sign;
      move -= sign;
    }
  }

  moveElevator(e, dy) {
    e.ry += dy;
    let move = Math.round(e.ry);
    e.ry -= move;
    const sign = Math.sign(move);
    while (move !== 0) {
      const riders = this.ridersOf(e);
      if (sign < 0) {
        // carry riders up first; stop if one is pinned against the ceiling
        for (const r of riders) if (this.solidAt(r.x, r.y - 1, r.w, r.h, r)) { e.ry = 0; return; }
        for (const r of riders) r.y -= 1;
        e.y -= 1;
      } else {
        const below = { x: e.x, y: e.y + e.h, w: e.w, h: 1 };
        if (this.maskHit(below.x, below.y, below.w, 1) || this.chars.some((c) => c.alive && overlap(below, c))
          || this.boxes.some((b) => overlap(below, b))) { e.ry = 0; return; }
        e.y += 1;
        for (const r of riders) if (!this.solidAt(r.x, r.y + 1, r.w, r.h, r)) r.y += 1;
      }
      move -= sign;
    }
  }

  checkInteractions() {
    for (const c of this.chars) {
      if (!c.alive) continue;
      const cx = c.x + c.w / 2, feet = c.y + c.h;
      // liquids
      for (const p of this.level.pools) {
        if (cx >= p.x && cx <= p.x + p.w && feet >= p.y + 2 && feet <= p.y + p.depth + 1) {
          const safe = (p.type === 'lava' && c.type === 'fire') || (p.type === 'water' && c.type === 'water');
          if (!safe) { this.kill(c); break; }
        }
      }
      if (!c.alive) continue;
      // gems
      for (const g of this.gems) {
        if (g.taken || g.type !== c.type) continue;
        if (g.x > c.x - 6 && g.x < c.x + c.w + 6 && g.y > c.y - 6 && g.y < c.y + c.h + 4) {
          g.taken = true;
          this.collected[c.type]++;
          this.events.push({ type: 'gem', gem: g.type, x: g.x, y: g.y });
        }
      }
      // doors
      const d = this.doors[c.type];
      c.atDoor = cx > d.x + 6 && cx < d.x + d.w - 6 && Math.abs(feet - (d.y + d.h)) <= 2;
    }
    if (this.status === 'playing' && this.chars.every((c) => c.alive && c.atDoor)) {
      this.status = 'won';
      this.events.push({ type: 'win' });
    }
  }

  stepDoors() {
    for (const c of this.chars) {
      const d = this.doors[c.type];
      const target = c.atDoor || this.status === 'won' ? 1 : 0;
      d.open += Math.sign(target - d.open) * Math.min(Math.abs(target - d.open), 2.2 * STEP);
      if (this.status === 'won' && d.open >= 1) c.inDoor = Math.min(1, c.inDoor + 1.6 * STEP);
    }
  }

  kill(c) {
    c.alive = false;
    this.status = 'dead';
    this.deadType = c.type;
    this.events.push({ type: 'death', char: c.type, x: c.x + c.w / 2, y: c.y + c.h / 2 });
  }

  get finished() { return this.status === 'won' && this.chars.every((c) => c.inDoor >= 1); }

  // ---- networking --------------------------------------------------------
  snapshot() {
    return {
      t: Math.round(this.time * 1000), s: this.status, d: this.deadType,
      c: this.chars.map((c) => [c.x, c.y, Math.round(c.vx), Math.round(c.vy), c.grounded ? 1 : 0, c.facing, c.alive ? 1 : 0, c.atDoor ? 1 : 0, +c.inDoor.toFixed(2), c.pushing ? 1 : 0]),
      b: this.boxes.map((b) => [b.x, b.y]),
      e: this.elevators.map((e) => [e.x, e.y]),
      p: this.plates.map((p) => (p.pressed ? 1 : 0)),
      l: this.levers.map((l) => l.state),
      g: this.gems.map((g) => (g.taken ? 1 : 0)),
      o: [+this.doors.fire.open.toFixed(2), +this.doors.water.open.toFixed(2)],
      ev: this.events.slice(),
    };
  }

  applySnapshot(s) {
    this.time = s.t / 1000; this.status = s.s; this.deadType = s.d;
    s.c.forEach((a, i) => {
      const c = this.chars[i];
      [c.x, c.y, c.vx, c.vy] = a; c.grounded = !!a[4]; c.facing = a[5]; c.alive = !!a[6]; c.atDoor = !!a[7]; c.inDoor = a[8]; c.pushing = !!a[9];
    });
    s.b.forEach((a, i) => { this.boxes[i].x = a[0]; this.boxes[i].y = a[1]; });
    s.e.forEach(([x, y], i) => { this.elevators[i].x = x; this.elevators[i].y = y; });
    s.p.forEach((v, i) => { const p = this.plates[i]; p.pressed = !!v; p.depth += ((v ? 1 : 0) - p.depth) * 0.35; });
    s.l.forEach((v, i) => { const l = this.levers[i]; l.state = v; l.angle += (v - l.angle) * 0.3; });
    let collected = { fire: 0, water: 0 };
    s.g.forEach((v, i) => { this.gems[i].taken = !!v; if (v) collected[this.gems[i].type]++; });
    this.collected = collected;
    this.doors.fire.open = s.o[0]; this.doors.water.open = s.o[1];
    this.events = s.ev || [];
  }
}
