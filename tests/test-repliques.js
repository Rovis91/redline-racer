// node test-repliques.js : forme des répliques de rivaux (src/donnees/repliques.js) : [fr, en], capitales sans accents, 30 signes au plus, une liste pour chaque carte, pas de doublon, choisis() évite la répétition.
const assert = require('assert');
require('../src/donnees/cartes.js'); require('../src/donnees/repliques.js');
const R = REPL, vus = new Set(), OK = /^[A-Z0-9 .,!?'\-:]+$/, EVT = ['choc', 'bump', 'nitro', 'tete', 'queue', 'dernier', 'dernierTete', 'dernierQueue', 'sale', 'serre'];
const verifie = (nom, L) => { assert(L.length >= 3, nom + ' : au moins 3 répliques'); for (const p of L) { assert(Array.isArray(p) && p.length === 2, nom + ' : [fr, en] attendu');
  for (const s of p) assert(OK.test(s) && s.length <= 30, `${nom} : « ${s} » (capitales sans accents, 30 signes au plus)`); assert(!vus.has(p[0]), nom + ' : doublon ' + p[0]); vus.add(p[0]); } };
assert.strictEqual(R.rival.length, 3); R.rival.forEach((r, k) => ['grille', 'double', 'passe'].forEach(e => verifie('rival ' + k + ' ' + e, r[e])));
EVT.forEach(e => verifie('evt ' + e, R.evt[e])); assert.deepStrictEqual(Object.keys(R.evt).sort(), [...EVT].sort());
for (const m of CARTES) verifie('carte ' + m.id, R.carte[m.id] || []); assert.strictEqual(Object.keys(R.carte).length, CARTES.length, 'une liste par carte, pas plus');
const L = R.evt.choc, dits = new Set(), tires = L.map(() => R.choisis(L, dits)); assert.strictEqual(new Set(tires).size, L.length, 'choisis : pas de répétition avant épuisement'); assert(L.includes(R.choisis(L, dits)), 'choisis : repart après épuisement');
require('../src/moteur/langue.js'); // la traduction anglaise passe par traduit() comme toute l'interface : aucune expression de EN ne doit la déformer
for (const L of [...R.rival.flatMap(r => Object.values(r)), ...Object.values(R.evt), ...Object.values(R.carte)]) for (const [fr, en] of L) assert.strictEqual(traduit(fr, 'en'), en, 'traduction de ' + fr);
console.log('repliques OK : ' + vus.size + ' répliques');
