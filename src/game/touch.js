// On-screen touch controls (DOM overlay, multi-touch).
// Layouts:
//   'duo'    – two clusters: Watergirl on the left half, Fireboy on the right (same device)
//   'single' – one character: ◀ ▶ on the left, jump on the right (online play / one player)
//   'none'   – hidden (menus)

const state = { fire: { left: false, right: false, up: false }, water: { left: false, right: false, up: false }, any: { left: false, right: false, up: false } };
let root = null;
let layout = 'none';
let singleType = 'fire';

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  const forced = new URLSearchParams(location.search).get('touch');
  if (forced !== null) return forced === '1';
  return window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
};

const CSS = `
.tp-root{position:fixed;inset:0;pointer-events:none;z-index:10;user-select:none;-webkit-user-select:none;touch-action:none}
.tp-cluster{position:absolute;bottom:max(12px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;align-items:center;pointer-events:none}
.tp-row{display:flex;gap:10px}
.tp-btn{pointer-events:auto;width:clamp(48px,12vmin,82px);height:clamp(48px,12vmin,82px);border-radius:50%;opacity:.85;
  display:flex;align-items:center;justify-content:center;font:700 clamp(18px,5vmin,30px)/1 Georgia,serif;color:#f3e2a0;
  background:radial-gradient(circle at 40% 35%,rgba(140,120,60,.55),rgba(40,30,8,.55));border:2px solid rgba(230,200,90,.55);
  box-shadow:0 2px 8px rgba(0,0,0,.5);touch-action:none;-webkit-tap-highlight-color:transparent}
.tp-btn.on{background:radial-gradient(circle at 40% 35%,rgba(240,210,110,.75),rgba(110,80,20,.7))}
.tp-btn.fire{border-color:rgba(255,90,50,.8)} .tp-btn.water{border-color:rgba(80,200,255,.8)}
.tp-btn.jump{width:clamp(56px,14vmin,92px);height:clamp(56px,14vmin,92px)}
.tp-rotate{position:fixed;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;
  background:#0b0a02;color:#e8cf72;font:600 20px Cinzel,Georgia,serif;text-align:center;z-index:20;padding:24px}
@media (orientation:portrait) and (pointer:coarse){.tp-rotate{display:flex}}
`;

function button(label, cls, target, key) {
  const b = document.createElement('div');
  b.className = `tp-btn ${cls}`;
  b.textContent = label;
  const active = new Set();
  const set = (on) => { state[target][key] = on; b.classList.toggle('on', on); };
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { b.setPointerCapture(e.pointerId); } catch { /* capture is optional */ }
    active.add(e.pointerId);
    set(true);
  });
  const up = (e) => { active.delete(e.pointerId); if (!active.size) set(false); };
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, up);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
  return b;
}

// rows of buttons stacked bottom-up in one corner, sized to fit the bars beside a 4:3 game
function cluster(side, rows) {
  const c = document.createElement('div');
  c.className = 'tp-cluster';
  c.style[side] = 'max(12px, env(safe-area-inset-' + side + '))';
  for (const items of rows) {
    const r = document.createElement('div');
    r.className = 'tp-row';
    items.forEach((i) => r.appendChild(i));
    c.appendChild(r);
  }
  return c;
}

function build() {
  if (!root) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const rot = document.createElement('div');
    rot.className = 'tp-rotate';
    rot.innerHTML = '<div style="font-size:46px">⟳</div><div>Rotate your device to landscape</div>';
    document.body.appendChild(rot);
    root = document.createElement('div');
    root.className = 'tp-root';
    document.body.appendChild(root);
  }
  root.innerHTML = '';
  for (const t of Object.values(state)) t.left = t.right = t.up = false;
  if (layout === 'duo') {
    root.appendChild(cluster('left', [[button('▲', 'water jump', 'water', 'up')], [button('◀', 'water', 'water', 'left'), button('▶', 'water', 'water', 'right')]]));
    root.appendChild(cluster('right', [[button('▲', 'fire jump', 'fire', 'up')], [button('◀', 'fire', 'fire', 'left'), button('▶', 'fire', 'fire', 'right')]]));
  } else if (layout === 'single') {
    const cls = singleType;
    root.appendChild(cluster('left', [[button('◀', cls, 'any', 'left'), button('▶', cls, 'any', 'right')]]));
    root.appendChild(cluster('right', [[button('▲', `${cls} jump`, 'any', 'up')]]));
  }
}

export function setTouchLayout(next, type = 'fire') {
  if (typeof document === 'undefined') return;
  if (!isTouchDevice()) next = 'none';
  if (next === layout && type === singleType && root) return;
  layout = next;
  singleType = type;
  build();
}

export function touchState(type) {
  if (layout === 'duo') return state[type];
  if (layout === 'single' && type === singleType) return state.any;
  return null;
}
