// assets/fonts/dotgothic16-game.woff2 (reduced font, tools/font.py) has all the Japanese characters written in src/ and index.html.
const assert = require('assert'), fs = require('fs'), path = require('path'), R = path.join(__dirname, '..');
const files = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(d, e.name)) : e.name.endsWith('.js') && !e.name.startsWith('instruments') ? [path.join(d, e.name)] : []);
const within = new Set(fs.readFileSync(path.join(R, 'assets', 'fonts', 'dotgothic16-game.txt'), 'utf8'));
const missing = new Set(); for (const f of [...files(path.join(R, 'src')), path.join(R, 'index.html')]) for (const c of fs.readFileSync(f, 'utf8')) if (c.codePointAt(0) >= 0x3000 && !within.has(c)) missing.add(c);
assert(!missing.size, 'characters missing from the reduced font: ' + [...missing].join('') + ' → python -I tools/font.py');
console.log('police OK, ' + [...within].filter(c => c.codePointAt(0) >= 0x3000).length + ' Japanese characters');
