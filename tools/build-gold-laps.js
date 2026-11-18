// node tools/build-gold-laps.js [map…] — regenerates src/data/gold-laps.js: the reference trace of each map's gold ghost (no argument: all; otherwise the named ones, the others are kept).
// Rerun if the physics or a layout changes (test-mapDefs.js will say so: the trace leaves the road or is no longer under the gold threshold).
// Without a lap driven by hand, the trace comes from the simulation: the skid driver of sim.js (driveSkid) (handbrake in tight bends, nitro as soon as it accelerates),
// whose settings are swept. Among the laps run without a hard landing, we keep: under the gold threshold, the one that touches the walls least, then the fastest; failing that, the fastest without impact. A lap with a hard landing is kept only when no lap avoids it (the log says so).
// To replace it with a real lap: paste into gold-laps.js what follows "#defi=" in a challenge link (same format).
const fs = require('fs'), THREE = require('../vendor/three/three.module.js'), F = __dirname + '/../src/data/gold-laps.js';
require('../src/data/maps.js'); require('../src/engine/sim.js');
const H = 1 / 120, wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), who = process.argv.slice(2);
try { require(F); } catch (e) { globalThis.TRACES_GOLD = {}; }
for (const M of MAPS) {
  if (who.length && !who.includes(M.id)) continue;
  const T = buildTrack(THREE, M), { S, n } = T, gold = lapRef(T).t * (M.med || [1.1, 1.03, 0.97])[2];
  // skid driver settings (driveSkid of sim.js): lv, lg levels out of skid and in skid; ent, ten start from the grip yaw that triggers and holds the skid (ent = Infinity: never)
  const pilot = (lv, lg, entr, holdFrac) => driveSkid(T, lv, lg, entr, holdFrac);
  const lapRun = drive => { const c = newCar(T), trace = []; let t = 0, t1 = 0, i = 0, dirty = 0, hard = 0; // same slicing as lapRef: the second lap, at 20 Hz from the line
    while (c.dist < 2 * n && t < 900) { step(c, drive(c), T, H); t += H; if (!t1 && c.dist >= n) t1 = t; if (t1) { if (i++ % 6 === 0) trace.push(c.x, c.y, c.z, c.th); if (c.hit > 3) dirty++; if (c.land > 9) hard = 1; } }
    return c.dist >= 2 * n ? { t: t - t1, trace, dirty, hard } : null; };
  let b = null;
  const note = r => (r.t <= gold ? r.dirty * 1000 + r.t : r.dirty ? 1e9 : 1e6 + r.t) + r.hard * 1e7; // a hard landing ranks after every lap without one: kept only on a map whose layout imposes it (lune: the crater rim)
  for (const lv of [1, 1.02, 1.04, 1.06, 1.1]) for (const lg of [1.1, 1.2, 1.3, 1.4]) for (const entr of [0.6, 0.7, 0.8, 0.9, Infinity]) for (const holdFrac of [0.2, 0.3, 0.4]) {
    if (entr === Infinity && (lg > 1.1 || holdFrac > 0.2)) continue;
    const r = lapRun(pilot(lv, lg, entr, holdFrac)); if (r && note(r) < 1e9 && (!b || note(r) < note(b))) b = { ...r, sett: [lv, lg, entr, holdFrac] }; }
  if (!b) { console.log(`${M.id} : no lap kept, trace kept`); continue; }
  TRACES_GOLD[M.id] = challengeCode(M.id, b.t, b.trace);
  console.log(`${M.id.padEnd(7)} ${b.t.toFixed(2)} s, seuil or ${gold.toFixed(2)} s : ${b.t <= gold ? 'under the threshold' : 'ABOVE ' + (b.t - gold).toFixed(2) + ' s'}, ${b.dirty} not touching a wall${b.hard ? ', HARD LANDING' : ''} (settings ${b.sett.join(' / ')})`);
}
fs.writeFileSync(F, `// Reference traces of the gold ghosts, one per map, in the format of a challenge link (see challengeCode in sim.js). File produced by tools/build-gold-laps.js: do not edit it by hand,
// except to paste a real lap (what follows "#defi=" in a challenge link).
(typeof window !== 'undefined' ? window : globalThis).TRACES_GOLD = {
${MAPS.filter(M => TRACES_GOLD[M.id]).map(M => `  ${M.id}: '${TRACES_GOLD[M.id]}',`).join('\n')}
};
`);
