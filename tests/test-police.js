// assets/fonts/dotgothic16-jeu.woff2 (police réduite, outils/police.py) a tous les caractères japonais écrits dans src/ et index.html.
const assert = require('assert'), fs = require('fs'), path = require('path'), R = path.join(__dirname, '..');
const fichiers = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? fichiers(path.join(d, e.name)) : e.name.endsWith('.js') && !e.name.startsWith('instruments') ? [path.join(d, e.name)] : []);
const dans = new Set(fs.readFileSync(path.join(R, 'assets', 'fonts', 'dotgothic16-jeu.txt'), 'utf8'));
const manque = new Set(); for (const f of [...fichiers(path.join(R, 'src')), path.join(R, 'index.html')]) for (const c of fs.readFileSync(f, 'utf8')) if (c.codePointAt(0) >= 0x3000 && !dans.has(c)) manque.add(c);
assert(!manque.size, 'caractères absents de la police réduite : ' + [...manque].join('') + ' → python -I outils/police.py');
console.log('police OK, ' + [...dans].filter(c => c.codePointAt(0) >= 0x3000).length + ' caractères japonais');
