// Tiny WebAudio synth for sound effects (no original audio is used).
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('fbwg-muted') === '1'; } catch { /* ignore */ }

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ f0, f1 = f0, dur = 0.15, type = 'sine', vol = 0.15, delay = 0 }) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur = 0.5, vol = 0.2) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 1400;
  s.buffer = buf; g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination);
  s.start();
}

export const sfx = {
  jump: (who) => tone({ f0: who === 'fire' ? 300 : 360, f1: who === 'fire' ? 520 : 620, dur: 0.12, type: 'triangle', vol: 0.08 }),
  gem: () => { tone({ f0: 1046, dur: 0.12, vol: 0.09 }); tone({ f0: 1568, dur: 0.18, vol: 0.08, delay: 0.07 }); },
  death: () => noise(0.6, 0.25),
  lever: () => tone({ f0: 180, f1: 120, dur: 0.1, type: 'square', vol: 0.05 }),
  plate: () => tone({ f0: 220, f1: 160, dur: 0.08, type: 'square', vol: 0.04 }),
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone({ f0: f, dur: 0.25, vol: 0.08, delay: i * 0.11 })),
  click: () => tone({ f0: 600, f1: 500, dur: 0.05, type: 'triangle', vol: 0.05 }),
  get muted() { return muted; },
  toggle() { muted = !muted; try { localStorage.setItem('fbwg-muted', muted ? '1' : '0'); } catch { /* ignore */ } return muted; },
  unlock() { ac(); },
};
