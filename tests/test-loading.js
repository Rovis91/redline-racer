// Each circuit must be loadable with its own catalogue; no map file may leak into the shared startup bundle.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
require('../src/data/map-assets.js'); require('../src/data/maps.js');
const root = path.join(__dirname, '..'), { core, maps, dependencies } = GAME_ASSETS;
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(f => f.isDirectory() ? walk(path.join(dir, f.name)) : [path.relative(root, path.join(dir, f.name)).replace(/\\/g, '/')]);
const declared = Object.values(maps).flat(), files = walk(path.join(root, 'src/maps')).filter(f => f.endsWith('.js'));
assert(core.every(f => !f.startsWith('src/maps/')), 'Startup must not download unselected circuits');
assert.strictEqual(new Set([...core, ...declared]).size, core.length + declared.length, 'A script is declared twice');
assert.deepStrictEqual([...declared].sort(), files.sort(), 'Circuit files missing from the asset inventory');
for (const src of [...core, ...declared]) assert(fs.existsSync(path.join(root, src)), 'Missing script: ' + src);
for (const paths of Object.values(dependencies)) for (const src of paths) assert(declared.includes(src) && /\/(textures|shapes)-/.test(src), 'Borrow only registered catalogues, never another circuit scenery: ' + src);
for (const M of MAPS) {
  const context = vm.createContext({ THREE: require('../vendor/three/three.module.js') }); context.window = context;
  for (const src of [...core.filter(f => f.startsWith('src/render/')), ...(dependencies[M.th.scenery] || []), ...maps[M.th.scenery]]) vm.runInContext(fs.readFileSync(path.join(root, src), 'utf8'), context, { filename: src });
  assert.strictEqual(typeof context.SCENERY[M.th.scenery], 'function', M.id + ': isolated scenery unavailable');
  assert.deepStrictEqual(Object.keys(context.SCENERY), [M.th.scenery], M.id + ': another circuit was loaded');
}
console.log('OK  lazy loading: complete inventory, isolated catalogues for ' + MAPS.length + ' circuits');
