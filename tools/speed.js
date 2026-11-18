// Speed balance of maps (sim.js, no browser): node tools/speed.js [map…]   (no argument: all maps in MAPS; CAR='{…}' MAP='{…}' override the first map as in rpm.js)
// Drives the autopilot lap (the fastest clean lap the simulation drives: it brakes to vAllowed, never slides; a drifting player is slower in bends, so a player at the limit spends
// at least as much time at full speed on the straights, never much more) and reports, in TIME % / DISTANCE %: displayed speed >= spd[1] (effects full), >= spd[0] (effects starting),
// within 3 % of the lap's top speed (the car is often drag-limited under vg, its limiter speed in top gear), at the limiter in top gear; then the displayed speed (true x kmh) at p10/p50/p90/max.
const THREE = require('../vendor/three/three.module.js'); globalThis.window = globalThis;
require('../src/data/maps.js'); require('../src/data/gold-laps.js'); require('../src/engine/sim.js');
const H = 1 / 120, ids = process.argv.slice(2).length ? process.argv.slice(2) : MAPS.map(m => m.id), rows = [];
ids.forEach((id, k) => {
  const M = MAPS.find(m => m.id === id); if (!M) return console.log('unknown map: ' + id);
  if (!k && process.env.CAR) Object.assign(M.car, JSON.parse(process.env.CAR));
  if (!k && process.env.MAP) Object.assign(M, JSON.parse(process.env.MAP));
  const T = buildTrack(THREE, M), n = T.n, c = newCar(T), C = M.car, top = C.ratios.length - 1, kmh = M.kmh || 1, [s0, s1] = M.spd || [130, 200];
  const vg = C.red / 60 * 2 * Math.PI * C.wheel / (C.ratios[top] * C.final) * 3.6; // limiter in top gear, true km/h
  let t = 0, tl = 0, N = 0, D = 0, f = 0, fd = 0, s = 0, sd = 0, nr = 0, nrd = 0, lim = 0, limd = 0, last = c.dist; const sp = [], rec = [];
  while (c.dist < 2 * n && t < 900) {
    step(c, autopilot(c, T), T, H); t += H;
    if (c.dist < n) { last = c.dist; continue; }
    const v = Math.hypot(c.vx, c.vz) * 3.6, d = v * kmh, dd = Math.max(0, c.dist - last) || 0; last = c.dist; N++; D += dd; sp.push(d);
    if (d >= s1) { f++; fd += dd; } if (d >= s0) { s++; sd += dd; } rec.push([v, dd]);
    if (c.gear === top && c.rpm > 0.97 * C.red) { lim++; limd += dd; }
  }
  const vm = Math.max(...rec.map(r => r[0])); rec.forEach(r => { if (r[0] >= 0.97 * vm) { nr++; nrd += r[1]; } });
  const p = (a, b) => `${(100 * a / N).toFixed(0)}/${(100 * b / D).toFixed(0)}`, q = x => Math.round(sp.slice().sort((a, b) => a - b)[Math.floor(x * (sp.length - 1))]);
  rows.push({ id, kmh, spd: s0 + '-' + s1, vg: Math.round(vg), vgd: Math.round(vg * kmh), 'full t/d%': p(f, fd), 'start t/d%': p(s, sd), '3% of lap max t/d%': p(nr, nrd), 'limiter t/d%': p(lim, limd), 'disp p10/50/90/max': [q(.1), q(.5), q(.9), q(1)].join('/'), true: [q(.5), q(.9), q(1)].map(x => Math.round(x / kmh)).join('/') });
});
console.table(rows);
