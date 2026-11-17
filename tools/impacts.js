// Measures impacts in a real race, without screen: node tools/impacts.js [map]
// Each map: a 3-lap race (3 bots) per player profile, and the wangan time trial with its trucks (traffic).
// Each impact is logged as the game sees it (c.hit: wall or truck, c.bump: car; same reading as dmgStep in game.js), and the damage model is replayed on it
// of docs/PHYSICS.md ("Impact mechanics"): wear per zone [front, rear, left, right], capped outside CASSE mode (wear and WEAR of sim.js).
const THREE = require('../vendor/three/three.module.js'); require('../src/data/maps.js'); require('../src/engine/sim.js');
const H = 1 / 120;
const BINS = [4, 6, 10, 15, 20, 30, 1e9], binOf = v => BINS.findIndex(b => v < b);
const impact = (Z, lx, lz, vn, type, Z0) => wear(Z, Z0, lx, lz, vn, type); // the game's model (sim.js), outside CASSE mode
const stage = z => z < 0.1 ? 'perfect' : z < 0.25 ? 'hollow' : z < 0.45 ? 'rétro/optique' : z < 0.6 ? 'pare-chocs parti' : 'hood/door flapping';
function tracker(c) { return { c, Z: [0, 0, 0, 0], Z0: [0, 0, 0, 0], lap: 1, n: Array(BINS.length).fill(0), nbr: Array(BINS.length).fill(0), t: -1, lapRun: [], vx: 0, vz: 0, fric: 0 }; }
function note(o, t, truck) { // after a step: a hard impact (same reading as dmgStep: direction = change of speed, in the car's frame)
  const c = o.c; if ((c.lap || 1) !== o.lap) { o.lap = c.lap || 1; o.Z0 = o.Z.slice(); } const intoWall = c.hit || 0, vo = c.bump || 0; if (c.rub) o.fric += H;
  if (intoWall > 0) o.n[binOf(intoWall)]++; if (vo > 0) o.nbr[binOf(vo)]++;
  const f = Math.max(intoWall, vo); if (f > 3 && t - o.t >= 0.15) { o.t = t; // (like dmgStep; against a wall, sim.js only reports a fresh impact every 0.4 s: wallT)
    let dx = o.vx - c.vx, dz = o.vz - c.vz, l = Math.hypot(dx, dz); if (l < 0.5) { dx = c.vx; dz = c.vz; l = Math.hypot(dx, dz) || 1; }
    const fx = Math.cos(c.th), fz = Math.sin(c.th); impact(o.Z, (dx * fx + dz * fz) / l, (dz * fx - dx * fz) / l, f, vo > intoWall ? 'vehicle' : truck ? 'lorry' : 'intoWall', o.Z0); }
  o.vx = c.vx; o.vz = c.vz;
}
// player profiles: clean = autopilot; medium = a bit too fast, steering a bit imprecise; brute = always flat out, never brakes (he hits)
// the "medium" steering drifts at random, but from a fixed draw reset at each race: two runs give the same figures
let noise = 0, rngSeed = 1; const rand = () => (rngSeed = (rngSeed * 16807) % 2147483647) / 2147483647, resetRng = () => { noise = 0; rngSeed = 1; };
const PROFILES = {
  clean: (c, T, o) => autopilot(c, T, 1, o),
  medium: (c, T, o) => { const a = autopilot(c, T, 1.06, o); noise += (rand() - 0.5) * 0.12 - noise * 0.01; return { ...a, steer: Math.max(-1, Math.min(1, a.steer + noise)) }; },
  brute: (c, T, o) => ({ ...autopilot(c, T, 1.05, o), gas: 1, brake: 0 })
};
const fmt = o => `${o.n.slice(1).join(' ').padEnd(16)} | ${o.nbr.slice(1).join(' ').padEnd(14)} | ${[...o.lapRun, o.Z].map(z => Math.round(Math.max(...z) * 100)).join(' → ').padEnd(12)} | ${o.Z.map(z => Math.round(z * 100)).join('/').padEnd(12)} ${stage(Math.max(...o.Z))}`;
console.log('wall impacts (vn 4-6, 6-10, 10-15, 15-20, 20-30, >30) | car (same) | max wear end of each lap | zones end of race\n');
const onlyMap = process.argv[2], allRes = {};
for (const M of MAPS) { if (onlyMap && M.id !== onlyMap) continue;
  const T = buildTrack(THREE, M); console.log('== ' + M.id);
  for (const p in PROFILES) {
    resetRng(); const R = newRace(T, 3), S = R.cars.map(tracker), circuit = R.cars; let t = 0;
    while (!R.cars[0].ending && t < 600) { const inp = PROFILES[p](R.cars[0], T, circuit); stepRace(R, inp, H); t += H; S.forEach(o => note(o, t)); S.forEach(o => { while (o.lapRun.length < Math.min(2, (o.c.lap || 1) - 1)) o.lapRun.push(o.Z.slice()); }); }
    console.log(`  ${p.padEnd(8)} ${fmt(S[0])}  (${Math.round(t)} s, frotte ${S[0].fric.toFixed(1)} s)`);
    (allRes[p] = allRes[p] || []).push(Math.max(...S[0].Z));
    if (p === 'clean') S.slice(1).forEach((o, i) => { console.log(`  IA ${i + 1}     ${fmt(o)}`); (allRes.BOTS = allRes.BOTS || []).push(Math.max(...o.Z)); });
  }
  if (M.traffic) for (const p of ['clean', 'brute']) { // time trial with the trucks
    resetRng(); const c = newCar(T), o = tracker(c); let t = 0;
    while ((c.lap || 0) < 3 && t < 600) { step(c, PROFILES[p](c, T, traffic(T, t)), T, H); hitTraffic(c, T, t, H); t += H; note(o, t, 1); while (o.lapRun.length < Math.min(2, (c.lap || 1) - 1)) o.lapRun.push(o.Z.slice()); }
    console.log(`  CLM ${p.padEnd(7)}${fmt(o)}  (camions)`);
  }
}
console.log('\nwear of the most damaged zone at end of race, per profile (all maps):');
for (const p in allRes) { const v = allRes[p].sort((a, b) => a - b); console.log(`  ${p.padEnd(8)} min ${Math.round(v[0] * 100)}  median ${Math.round(v[v.length >> 1] * 100)}  max ${Math.round(v[v.length - 1] * 100)}`); }
