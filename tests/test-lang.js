// node test-language.js: every text shown by the interface has its English translation in language.js.
// Interface texts are written in capitals: any literal string in capitals in game.js (or in pieces, inside a `…${…}…` string) goes through translated();
// with the EN expressions removed, each word left must be in SAME (identical in both languages, or not interface text). Plus the names, subtitles and titles of the maps (mapDefs.js) and the levels (sim.js).
// the French titles passed to headingMap() only show in French: we only check that their map is in HEADING_EN.
const assert = require('assert'), fs = require('fs');
require('../src/engine/lang.js'); require('../src/engine/sim.js');
const SAME = new Set(['XYZ', 'YXZ', 'YZX', // ordres de rotation de three.js
  'SPEED', 'CITY', 'NOODLE', 'BAR', 'KENJI', 'REI', 'JUN', // scenery signs, rival names
  'RADIO', 'SOLO', 'REC', 'SHIFT', 'GO', 'AUTO', 'MODE', 'NITRO', 'RECORD', 'MENU', 'PAUSE', 'SCORE', 'PTS', 'KM', 'TUNNEL', 'BRONZE', 'NORMAL', 'ENGLISH', 'FRANCAIS', 'JOY', 'CON', 'IA', 'FM', 'SPEEDWAY', 'PARIS', 'KARASU', 'TOGE', 'WAN', 'BAYSHORE', 'CANAL', 'SIX', 'PRIX', 'GRAND', 'SILENCE', 'PERSEPOLIS', 'BAHIA', 'PLAYA', 'RIVIERA', 'MAYA', 'CYCLADES', 'NEVADA', 'HUNAN',
  'ER', // shortcut: ordinal in pieces (n + 'ER' / 'E'), which translated() reads whole; to revisit if a lone "ER" becomes text
]);
const without = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const remains = s => (without(s).replace(/(\d+)ER?(?![A-Z])/g, '$1').replace(EN_RX, ' ').match(/[A-Z]{2,}/g) || []).filter(w => !SAME.has(w)); // same order as translated(): ordinals, then expressions
// string literals of a JS source (comments skipped), fixed pieces of the `…` templates included
const literals = src => {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 2; continue; }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1, s = '';
      while (j < src.length && src[j] !== c) {
        if (src[j] === '\\') { s += src[j + 1]; j += 2; continue; }
        if (c === '`' && src[j] === '$' && src[j + 1] === '{') { out.push(s); s = ''; let d = 1; j += 2; while (d) { if (src[j] === '{') d++; else if (src[j] === '}') d--; j++; } continue; }
        s += src[j++];
      }
      out.push(s); i = j + 1; continue;
    }
    if (c === '/' && /[=(,:;!&|?{}]\s*$/.test(src.slice(Math.max(0, i - 4), i))) { let j = i + 1; while (src[j] !== '/' || src[j - 1] === '\\') { if (src[j] === '[') while (src[j] !== ']') j++; j++; } i = j + 1; continue; } // regex literal
    i++;
  }
  return out;
};
const plainText = s => !/[a-z]/.test(s) && /[A-ZÀ-Ý]{2}/.test(s); // in capitals, at least two letters in a row
const missingList = [];
const game = fs.readFileSync(__dirname + '/../src/engine/game.js', 'utf8'), headings = [...game.matchAll(/headingMap\('(\w+)', \[[^\]]*\]/g)];
assert(headings.length && headings.every(([, id]) => HEADING_EN[id]), 'headingMap: map without an English title');
for (const f of ['game.js']) for (const s of literals(game.replace(/headingMap\('(\w+)', \[[^\]]*\]/g, ''))) if (plainText(s)) { const r = remains(s); if (r.length) missingList.push(f + ' : « ' + s + ' » -> « ' + translated(s, 'en') + ' » (' + r.join(', ') + ')'); }
for (const m of MAPS) for (const s of [m.label, m.th.hud.over[1], ...(HEADING_EN[m.id] ? [] : m.th.hud.heading)]) { const r = remains(s); if (r.length) missingList.push('maps.js ' + m.id + ' : « ' + s + ' » (' + r.join(', ') + ')'); }
for (const d of DIFF) { const r = remains(d.label); if (r.length) missingList.push('sim.js DIFF : « ' + d.label + ' »'); }
assert.deepStrictEqual(missingList, [], 'texts without an English translation (add their line to EN of lang.js, or the word to SAME if it is said the same way) :\n' + missingList.join('\n'));
// an EN expression is never translated in the middle of a word, and the table does not bite its own tail
assert.strictEqual(translated('REJOUER', 'en'), 'RETRY'); assert.strictEqual(translated('CARTES', 'fr'), 'CARTES');
assert.deepStrictEqual(headingMap('ville', ['VILLE A', 'PLEIN REGIME'], 'en'), ['FULL THROTTLE', 'CITY']); assert.deepStrictEqual(headingMap('touge', ['KARASU', 'TOGE'], 'en'), ['KARASU', 'TOGE']);
console.log('OK  language: all the capitalised texts of game.js, the maps and the levels have their English');
