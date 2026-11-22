// Spatial footprint lookup must preserve every placement decision of the exhaustive bounds test.
const assert = require('assert'); globalThis.window = globalThis; require('../src/render/scenery.js');
const boxes = [[-128, 0, -64, 64], [0, 128, 0, 128], [64, 64, -2, 2], [-1, 500, -20, 20]];
for (let i = 0; i < 150; i++) { const x = (i * 7919 % 1600) - 800, z = (i * 3571 % 1600) - 800; boxes.push([x, x + i % 87, z, z + i % 121]); }
const reference = (x, z) => boxes.some(b => x > b[0] && x < b[1] && z > b[2] && z < b[3]);
for (const cell of [16, 64, 150]) {
  const occupied = PLACERS.boxMask(boxes, cell);
  for (let x = -900; x <= 900; x += 9) for (let z = -900; z <= 900; z += 13) assert.strictEqual(occupied(x, z), reference(x, z), x + ',' + z);
  for (const b of boxes) for (const x of [b[0] - 1e-6, b[0], b[0] + 1e-6, b[1] - 1e-6, b[1], b[1] + 1e-6]) for (const z of [b[2], (b[2] + b[3]) / 2, b[3]]) assert.strictEqual(occupied(x, z), reference(x, z), 'Footprint edge: ' + x + ',' + z);
}
assert.strictEqual(PLACERS.boxMask([])(0, 0), false);
console.log('OK  spatial footprints: identical inside/outside and edge decisions');
