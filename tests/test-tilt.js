// node test-tilt.js — tilt(T, c) of sim.js: the pitch and roll that craters (M.dents, M.bowls) give the car model.
// It must be exactly [0, 0] on every map of MAPS (none has craters: their attitude must not move), and follow the slope on a map that has some.
const assert = require('assert'), THREE = require('../vendor/three/three.module.js');
require('../src/data/maps.js'); require('../src/engine/sim.js');
for (const M of MAPS) { const T = buildTrack(THREE, M), c = newCar(T);
  for (const i of [0, T.n >> 2, T.n >> 1, 3 * T.n >> 2]) for (const d of [-3, 0, 3]) { const s = T.S[i]; Object.assign(c, { idx: i, x: s.x - s.tz * d, z: s.z + s.tx * d, th: Math.atan2(s.tz, s.tx) + d * 0.1, d });
    assert.deepStrictEqual(tilt(T, c), [0, 0], M.id + ' : tilt is not zero at sample ' + i); } }
console.log('OK  tilt: zero on the ' + MAPS.length + ' maps of MAPS');
{ // a bowl 20 m wide and 4 m deep, 6 m to the right of a car driving along a straight: the ground falls to its right (roll), not along its path (no pitch); in the middle of the bowl, flat
  const B = MAPS.find(m => m.id === 'touge'), M0 = { ...B, sc: 1, pts: [[0, 0, 0], [200, 0, 0], [400, 0, 0], [400, 200, 0], [200, 200, 0], [0, 200, 0]], wide: [], jumps: [[1, 20, 0.2]], tun: null, hotList: [0, 1], sect: [1, 3], amb: [], trough: null, place: null };
  const T0 = buildTrack(THREE, M0), c = newCar(T0), i = 40, s = T0.S[i], rx = -s.tz, rz = s.tx;
  const T = buildTrack(THREE, { ...M0, dents: [[s.x + rx * 6, s.z + rz * 6, 10, 4]] });
  Object.assign(c, { idx: i, x: T.S[i].x, z: T.S[i].z, th: Math.atan2(s.tz, s.tx), d: 0, y: 0 });
  const [f, r] = tilt(T, c); assert(Math.abs(f) < 0.02, 'pitch beside a bowl: ' + f); assert(r < -0.2, 'the ground should fall to the right of the car: ' + r);
  Object.assign(c, { x: s.x + rx * 6, z: s.z + rz * 6 }); const [f1, r1] = tilt(T, c); assert(Math.abs(f1) < 0.02 && Math.abs(r1) < 0.02, 'flat at the bottom of the bowl: ' + [f1, r1]);
  Object.assign(c, { x: s.x - rx * 2, z: s.z - rz * 2, th: c.th + Math.PI }); assert(tilt(T, c)[1] > 0.05, 'driving the other way, the bowl is on the left: the roll changes sign');
  console.log('OK  tilt: beside a bowl ' + r.toFixed(2) + ' m/m to the right, flat at its bottom, opposite sign the other way');
}
