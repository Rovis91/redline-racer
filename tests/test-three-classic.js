// vendor/three/three.classic.js (loaded by index.html, works over file://) is up to date and exposes the same names as three.module.js.
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const F = __dirname + '/../vendor/three/three.classic.js', txt = fs.readFileSync(F, 'utf8'), lf = s => s.replace(/\r/g, ''); // (line endings: git may turn them into CRLF on Windows)
assert.strictEqual(lf(txt), lf(require('../tools/three-classic.js')()), 'three.classic.js is outdated: node tools/three-classic.js');
const ctx = { window: {}, console }; vm.runInNewContext(txt, ctx);
const M = require('../vendor/three/three.module.js');
assert.deepStrictEqual(Object.keys(ctx.window.THREE).sort(), Object.keys(M).filter(k => k !== 'default' && k !== '__esModule').sort());
assert.strictEqual(ctx.window.THREE.REVISION, M.REVISION);
console.log('three classique OK, r' + M.REVISION);
