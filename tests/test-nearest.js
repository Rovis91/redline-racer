// Spatial road lookups must preserve the exhaustive search on every circuit, including ties and distant/negative cells.
const assert = require('assert'), THREE = require('../vendor/three/three.module.js');
globalThis.window = globalThis; require('../src/data/maps.js'); require('../src/engine/sim.js'); require('../src/render/scenery.js');
const brute = (S, x, z) => { let b = 0, best = 1e18; for (let i = 0; i < S.length; i++) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < best) { best = d; b = i; } } return b; };
let seed = 73; const rand = () => (seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296;
for (const M of MAPS) {
  const S = buildTrack(THREE, M).S, h = { S }, xs = S.map(s => s.x), zs = S.map(s => s.z), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  for (let i = 0; i < 2400; i++) { const x = x0 - 200 + rand() * (x1 - x0 + 400), z = z0 - 200 + rand() * (z1 - z0 + 400); assert.strictEqual(PLACERS.near(h, x, z), brute(S, x, z), M.id + ': ' + x + ',' + z); }
}
for (const S of [[{ x: -1, z: 0 }, { x: 1, z: 0 }, { x: -1, z: 0 }], [{ x: 0, z: 0 }]]) for (const [x, z] of [[0, 0], [-50, 50], [3276800, -50], [-50, 3276800]]) assert.strictEqual(PLACERS.near({ S }, x, z), brute(S, x, z));
console.log('OK  spatial road lookup: exhaustive results on all circuits, ties and negative/distant cells');
