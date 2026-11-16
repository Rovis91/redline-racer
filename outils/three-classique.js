// Fabrique vendor/three/three.classique.js : three.core.js + three.module.js en un script classique qui pose window.THREE.
// Pourquoi : Chrome refuse les modules ES en file:// (double-clic sur index.html). Les tests node gardent three.module.js.
// À relancer après toute retouche de vendor/three/three.module.js (lignes // vpr) ou mise à jour de three : `node outils/three-classique.js`. tests/test-three-classique.js vérifie qu'il est à jour.
const fs = require('fs'), D = __dirname + '/../vendor/three/';
function fabrique() {
  const core = fs.readFileSync(D + 'three.core.js', 'utf8').split('\n'), mod = fs.readFileSync(D + 'three.module.js', 'utf8').split('\n');
  const noms = l => l.slice(l.indexOf('{') + 1, l.indexOf('}')).trim(); // export { A, B } / import { A, B } from '...' : pas d'alias « as » dans three r187
  const ex = l => /^export\s*\{/.test(l), im = l => /^import\s*\{/.test(l);
  if (core.some(im) || mod.filter(im).length !== 1 || [...core, ...mod].some(l => / as /.test(l) && (ex(l) || im(l)))) throw new Error('forme de three inattendue : revoir outils/three-classique.js');
  const exCore = core.filter(ex).map(noms).join(', '), reexp = mod.filter(l => ex(l) && /from\s/.test(l)).map(noms).join(', '), propres =mod.filter(l => ex(l) && !/from\s/.test(l)).map(noms).join(', ');
  return '// Généré par outils/three-classique.js depuis three.core.js et three.module.js : ne pas modifier à la main.\n' +
    '(function () {\n\'use strict\';\nconst core = (function () {\n' + core.filter(l => !ex(l)).join('\n') + '\nreturn { ' + exCore + ' };\n})();\n' +
    'window.THREE = (function () {\nconst { ' + mod.filter(im).map(noms)[0] + ' } = core;\n' + mod.filter(l => !ex(l) && !im(l)).join('\n') + '\nconst { ' + reexp + ' } = core;\nreturn { ' + reexp + ', ' + propres + ' };\n})();\n})();\n';
}
if (require.main === module) { fs.writeFileSync(D + 'three.classique.js', fabrique()); console.log('vendor/three/three.classique.js écrit'); }
module.exports = fabrique;
