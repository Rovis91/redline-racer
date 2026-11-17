// node test-catalogs.js — each shape name (SHAPES) and texture name (TEXTURES) is defined only once across the whole repo:
// the maps complete the same catalog through Object.assign, and the last one loaded would silently overwrite another's shape (Paris arch invisible, terre chapel…).
const assert = require('assert'), fs = require('fs'), path = require('path'), rootCol = path.join(__dirname, '..');
const files = [];
(function seek(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) seek(p); else if (/^(shapes|textures)(-.*)?\.js$/.test(f.name)) files.push(p); } })(path.join(rootCol, 'src'));
const base = f => /^(shapes|textures)\.js$/.test(path.basename(f)); // shapes.js and textures.js create the catalogs, the others complete them
const doubles = [], vu = { SHAPES: {}, TEXTURES: {} }; let current = '';
const retain = label => new Proxy({}, { set(o, k, v) { if (k in o) doubles.push(`${label}.${k} : ${vu[label][k]} and ${current}`); else vu[label][k] = current; o[k] = v; return true; } });
globalThis.window = globalThis; globalThis.THREE = require('../vendor/three/three.module.js');
for (const f of files.filter(base)) { current = path.relative(rootCol, f); require(f); const label = /^shapes/.test(path.basename(f)) ? 'SHAPES' : 'TEXTURES', g = retain(label); for (const k in window[label]) g[k] = window[label][k]; window[label] = g; }
for (const f of files.filter(f => !base(f))) { current = path.relative(rootCol, f); require(f); }
assert(Object.keys(vu.SHAPES).length > 50 && Object.keys(vu.TEXTURES).length > 50, 'catalogs not loaded');
assert(!doubles.length, doubles.length + ' names defined twice:\n' + doubles.join('\n'));
console.log(`OK  catalogues : ${Object.keys(vu.SHAPES).length} shapes and ${Object.keys(vu.TEXTURES).length} textures, each defined once (${files.length} fichiers)`);
