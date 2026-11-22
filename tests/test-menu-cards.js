// Offline menu cards must describe the real track; every circuit needs a valid local preview, including on a cold visit.
const assert = require('assert'), fs = require('fs'), path = require('path'), THREE = require('../vendor/three/three.module.js');
require('../src/data/maps.js'); require('../src/data/menu-cards.js'); require('../src/engine/sim.js');
assert.deepStrictEqual(Object.keys(MENU_CARDS).sort(), MAPS.map(m => m.id).sort());
for (const M of MAPS) {
  const T = buildTrack(THREE, M), card = MENU_CARDS[M.id], stride = Math.ceil(T.n / 96);
  assert.strictEqual(card.car, T.car.label, M.id + ': stale car'); assert.strictEqual(card.km, +(T.len / 1000).toFixed(1), M.id + ': stale length');
  assert.deepStrictEqual(card.points, T.S.filter((s, i) => i % stride === 0).map(s => [+s.x.toFixed(1) || 0, +s.z.toFixed(1) || 0]), M.id + ': stale outline');
  const image = fs.readFileSync(path.join(__dirname, '../assets/previews/' + M.id + '.webp'));
  assert(image.length > 1000 && image.subarray(0, 4).toString() === 'RIFF' && image.subarray(8, 12).toString() === 'WEBP', M.id + ': invalid preview');
  assert(image.length < 100000, M.id + ': menu preview exceeds 100 KB');
}
console.log('OK  menu cards: accurate metadata and lightweight previews for all ' + MAPS.length + ' circuits');
