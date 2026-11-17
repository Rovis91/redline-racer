// node test-taunts.js: shape of the rival taunts (src/data/taunts.js): [fr, en], uppercase without accents, 30 characters at most, one list per map, no duplicate, pickLine() avoids repetition.
const assert = require('assert');
require('../src/data/maps.js'); require('../src/data/taunts.js');
const R = TAUNTS, viewed = new Set(), OK = /^[A-Z0-9 .,!?'\-:]+$/, EVT = ['impact', 'bump', 'nitro', 'leading', 'trailing', 'lastLap', 'lastLapLeading', 'lastLapTrailing', 'dirty', 'squeezed'];
const check = (label, L) => { assert(L.length >= 3, label + ': at least 3 taunts'); for (const p of L) { assert(Array.isArray(p) && p.length === 2, label + ' : [fr, en] attendu');
  for (const s of p) assert(OK.test(s) && s.length <= 30, `${label} : « ${s} " (uppercase without accents, 30 characters at most)`); assert(!viewed.has(p[0]), label + ' : doublon ' + p[0]); viewed.add(p[0]); } };
assert.strictEqual(R.rival.length, 3); R.rival.forEach((r, k) => ['grid', 'double', 'pass'].forEach(e => check('rival ' + k + ' ' + e, r[e])));
EVT.forEach(e => check('evt ' + e, R.evt[e])); assert.deepStrictEqual(Object.keys(R.evt).sort(), [...EVT].sort());
for (const m of MAPS) check('map ' + m.id, R.mapDef[m.id] || []); assert.strictEqual(Object.keys(R.mapDef).length, MAPS.length, 'one list per map, no more');
const L = R.evt.impact, said = new Set(), draws = L.map(() => R.pickLine(L, said)); assert.strictEqual(new Set(draws).size, L.length, 'choose: no repeat until exhausted'); assert(L.includes(R.pickLine(L, said)), 'choose: restarts after exhaustion');
require('../src/engine/lang.js'); // the English translation goes through translated() like the whole interface: no EN expression must distort it
for (const L of [...R.rival.flatMap(r => Object.values(r)), ...Object.values(R.evt), ...Object.values(R.mapDef)]) for (const [fr, en] of L) assert.strictEqual(translated(fr, 'en'), en, 'traduction de ' + fr);
console.log('repliques OK : ' + viewed.size + ' taunts');
