// Helpers for writing levels as readable shapes instead of raw polygons.
//   platforms: [x0, x1, y, h = 15]       flat slab whose top surface is at y
//   ramps:     [x0, y0, x1, y1, h = 15]  sloped slab from (x0, y0) to (x1, y1) along its top
//   blocks:    [x, y, w, h]             solid rectangle
//   pools:     { type, x, w, y, depth } notched automatically into the platform (or floor) whose top is y
// The outer frame (walls, ceiling, floor at y = 455) is added for every level.

export const FLOOR_Y = 455;
const FRAME = [
  [16, 16, 630, 16, 630, 26, 16, 26],
  [16, 26, 26, 26, 26, 455, 16, 455],
  [614, 26, 630, 26, 630, 455, 614, 455],
];

function slab(x0, x1, y, h, pools) {
  const top = [[x0, y]];
  for (const p of pools.filter((q) => q.y === y && q.x >= x0 && q.x + q.w <= x1).sort((a, b) => a.x - b.x)) {
    const d = p.depth ?? 7;
    top.push([p.x, y], [p.x + 4, y + d], [p.x + p.w - 4, y + d], [p.x + p.w, y]);
  }
  top.push([x1, y]);
  const poly = [];
  for (const [x, yy] of top) poly.push(x, yy);
  poly.push(x1, y + h, x0, y + h);
  return poly;
}

export function buildLevel(def) {
  const pools = (def.pools || []).map((p) => ({ depth: 7, ...p }));
  const solids = [...FRAME, slab(16, 630, FLOOR_Y, 15, pools)];
  for (const [x0, x1, y, h = 15] of def.platforms || []) solids.push(slab(x0, x1, y, h, pools));
  for (const [x0, y0, x1, y1, h = 15] of def.ramps || []) solids.push([x0, y0, x1, y1, x1, y1 + h, x0, y0 + h]);
  for (const [x, y, w, h] of def.blocks || []) solids.push([x, y, x + w, y, x + w, y + h, x, y + h]);
  const { platforms, ramps, blocks, ...rest } = def;
  return { ...rest, pools, solids };
}
