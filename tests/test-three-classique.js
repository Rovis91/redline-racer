// vendor/three/three.classique.js (chargé par index.html, marche en file://) est à jour et expose les mêmes noms que three.module.js.
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const F = __dirname + '/../vendor/three/three.classique.js', txt = fs.readFileSync(F, 'utf8'), lf = s => s.replace(/\r/g, ''); // (fins de ligne : git peut les rendre en CRLF sous Windows)
assert.strictEqual(lf(txt), lf(require('../outils/three-classique.js')()), 'three.classique.js périmé : node outils/three-classique.js');
const ctx = { window: {}, console }; vm.runInNewContext(txt, ctx);
const M = require('../vendor/three/three.module.js');
assert.deepStrictEqual(Object.keys(ctx.window.THREE).sort(), Object.keys(M).filter(k => k !== 'default' && k !== '__esModule').sort());
assert.strictEqual(ctx.window.THREE.REVISION, M.REVISION);
console.log('three classique OK, r' + M.REVISION);
