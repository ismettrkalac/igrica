// Native resolution of the original Flash stage (SWF header: 640x480 @ 25 fps).
export const WIDTH = 640;
export const HEIGHT = 480;

// Everything is rendered at 2x internally (camera zoom) so it stays crisp when scaled up.
export const RES = 2;

// Fixed simulation step. The original ran at 25 fps; we simulate at 60 Hz with the
// constants below tuned to the measured trajectories (see reference/NOTES.md).
export const STEP = 1 / 60;

export const PHYS = {
  gravity: 400,         // px/s²  (measured ≈ 400)
  jumpSpeed: 212,       // px/s   (measured ≈ 210 → ~55 px apex, ~1.05 s airtime)
  maxFall: 420,         // px/s
  runSpeed: 138,        // px/s   (measured 125–150)
  groundAccel: 420,     // px/s²  (reaches top speed in ~0.33 s)
  groundDecel: 2600,    // px/s²  (stops almost instantly on key-up)
  turnDecel: 1400,      // px/s²  when reversing direction
  airAccel: 380,
  airDecel: 900,
  stepUp: 2,            // px a character may climb per pixel of horizontal travel (slopes)
  snapDown: 4,          // px a grounded character sticks down to follow descending slopes
  pushSpeed: 70,        // px/s top speed while pushing a box
  bodyW: 20,
  bodyH: 30,           // collision body; flame/bun art pokes above it (ceiling gaps in level 1 are 32 px)
};

export const COLORS = {
  brick: '#222205',
  brickMortar: '#151502',
  brickLight: '#3c3b27',
  stone: '#6b6026',
  stoneLight: '#8a7d3a',
  stoneTop: '#7d7343',
  stoneDark: '#3f3a18',
  outline: '#0f0f02',
  moss: '#2d6d15',
  mossDark: '#1a400e',
  mossLight: '#4f9a2a',
  red: '#c52119',
  redLight: '#ff5a3a',
  blue: '#50cdff',
  blueLight: '#b8f0ff',
  lava: '#e5481b',
  lavaLight: '#ffb03a',
  water: '#3a8fd6',
  waterLight: '#9ad8ff',
  poison: '#3d9b22',
  poisonLight: '#8fe05a',
  gold: '#e8cf72',
  goldDark: '#7a5c14',
  wood: '#8a7740',
  woodDark: '#3a2f12',
  purple: '#a745cd',
  purpleDark: '#5d1a7c',
  yellow: '#c9b43a',
  yellowLight: '#f0d860',
};

export const FONT = 'Cinzel, Georgia, serif';
export const LOGO_FONT = '"Uncial Antiqua", Georgia, serif';
