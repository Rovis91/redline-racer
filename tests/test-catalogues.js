// node test-catalogues.js — chaque nom de forme (FORMES) et de texture (TEXTURES) n'est défini qu'une fois dans tout le dépôt :
// les cartes complètent le même catalogue par Object.assign, et la dernière chargée écraserait en silence la forme d'une autre (arc de Paris invisible, chapelle de terre…).
const assert = require('assert'), fs = require('fs'), path = require('path'), racine = path.join(__dirname, '..');
const fichiers = [];
(function cherche(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) cherche(p); else if (/^(formes|textures)(-.*)?\.js$/.test(f.name)) fichiers.push(p); } })(path.join(racine, 'src'));
const base = f => /^(formes|textures)\.js$/.test(path.basename(f)); // formes.js et textures.js créent les catalogues, les autres les complètent
const doubles = [], vu = { FORMES: {}, TEXTURES: {} }; let courant = '';
const garde = nom => new Proxy({}, { set(o, k, v) { if (k in o) doubles.push(`${nom}.${k} : ${vu[nom][k]} et ${courant}`); else vu[nom][k] = courant; o[k] = v; return true; } });
globalThis.window = globalThis; globalThis.THREE = require('../vendor/three/three.module.js');
for (const f of fichiers.filter(base)) { courant = path.relative(racine, f); require(f); const nom = /^formes/.test(path.basename(f)) ? 'FORMES' : 'TEXTURES', g = garde(nom); for (const k in window[nom]) g[k] = window[nom][k]; window[nom] = g; }
for (const f of fichiers.filter(f => !base(f))) { courant = path.relative(racine, f); require(f); }
assert(Object.keys(vu.FORMES).length > 50 && Object.keys(vu.TEXTURES).length > 50, 'catalogues non chargés');
assert(!doubles.length, doubles.length + ' noms définis deux fois :\n' + doubles.join('\n'));
console.log(`OK  catalogues : ${Object.keys(vu.FORMES).length} formes et ${Object.keys(vu.TEXTURES).length} textures, chacune définie une fois (${fichiers.length} fichiers)`);
