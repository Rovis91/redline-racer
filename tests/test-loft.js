// node test-loft.js — M.loft (sim.js, step): on crater ground (M.dents, M.bowls) the car has inertia: it falls after the ground past a rim and hops off a lip, the more so the faster it goes.
// Only a map that sets M.loft gets it: without the option the same crater is followed like a rail, as before.
const assert = require('assert'), THREE = require('../vendor/three/three.module.js');
require('../src/data/maps.js'); require('../src/engine/sim.js');
assert.deepStrictEqual(MAPS.filter(M => M.loft).map(M => M.id), ['lune'], 'M.loft is set by lune only: any other map would change its physics');
const H = 1 / 120, B = MAPS.find(m => m.id === 'touge');
const M0 = { ...B, sc: 1, pts: [[0, 0, 0], [200, 0, 0], [400, 0, 0], [400, 200, 0], [200, 200, 0], [0, 200, 0]], wide: [], jumps: [[1, 20, 0.2]], tun: null, hotList: [0, 1], sect: [1, 3], amb: [], trough: null, place: null };
const i0 = 110, s0 = buildTrack(THREE, M0).S, DENT = [s0[i0 + 20].x, s0[i0 + 20].z, 16, 3.5]; // a crater 32 m wide and 3.5 m deep on the axis of a straight, 40 m ahead of the car
// crosses the crater along the straight at v m/s (speed held): [time in the air, flights, lowest height above the ground, greatest height above the ground]
const cross = (M, v) => { const T = buildTrack(THREE, M), S = T.S, c = newCar(T), s = S[i0]; let air = 0, n = 0, lo = 0, hi = 0, was = false;
  Object.assign(c, { idx: i0, dist: i0, x: s.x, z: s.z, th: Math.atan2(s.tz, s.tx), vx: s.tx * v, vz: s.tz * v, y: ground(T, { idx: i0, x: s.x, z: s.z, d: 0 }), vy: 0 });
  for (let t = 0; t < 100 / v; t += H) { step(c, { steer: 0, gas: Math.hypot(c.vx, c.vz) < v ? 1 : 0, brake: 0 }, T, H); const h = c.y - ground(T, c); lo = Math.min(lo, h); hi = Math.max(hi, h); if (c.air) air += H; if (c.air && !was) n++; was = c.air; }
  return [air, n, lo, hi]; };
{ const [air, n, lo] = cross({ ...M0, dents: [DENT] }, 40); assert(air === 0 && n === 0 && lo > -1e-6, 'without M.loft the car follows the crater without leaving it: ' + [air, n, lo]); }
{ const M = { ...M0, dents: [DENT], loft: [0.4, 1.5] }, R = [5, 15, 25, 40].map(v => cross(M, v));
  R.forEach(([, , lo], k) => assert(lo > -1e-6, 'the car goes under the ground at ' + [5, 15, 25, 40][k] + ' m/s: ' + lo));
  assert(R[0][3] < 0.3, 'at walking pace the car stays on the ground (within 0.3 m): ' + R[0][3]);
  assert(R[3][1] >= 2, 'at 40 m/s: one flight past the rim, one off the lip: ' + R[3][1]);
  assert(R[1][3] < R[2][3] && R[2][3] < R[3][3] && R[3][3] > 1, 'the faster, the higher over the crater: ' + R.map(r => r[3].toFixed(2)));
  assert(R.every(r => r[0] < 2.5), 'a hop, not a jump: ' + R.map(r => r[0].toFixed(2)));
  console.log('OK  loft: over a 32 m crater, ' + R.map((r, k) => [5, 15, 25, 40][k] * 3.6 + ' km/h ' + r[0].toFixed(2) + ' s in the air, up to ' + r[3].toFixed(1) + ' m').join(' ; ') + ' ; glued without the option'); }
