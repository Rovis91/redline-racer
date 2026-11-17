// Origin of each scenery object, for tools/profReport.js: each add() records the line of the map file that made it ("scenery-touge.js:812 bridge"), in userData.originName.
// Loaded before three.min.js (tools/bench-quick.js injects it at the top of the page), and only for the measurement: taking the stack at each add() slows the loading.
// The scenery merge (game.js, "merge") then keeps, for each merged geometry, the list of its parts and their origin (userData.src).
(() => {
  window.__origins = 1;
  // shortcut: PRELUDE = last line of the shared placers at the top of scenery.js (inst, insts, boxMesh, marker; puts, specific to wangan, is recognized by its name); move it up if this prelude grows
  const HELPERS = /^(inst|insts|boxMesh|marker|puts)$/, PRELUDE = 30, SRC = /\/((?:scenery[\w-]*|shapes[\w-]*|textures[\w-]*|rythme)\.js):(\d+)/, GAME = /\/(game\.js):(\d+)/;
  const label = s => (/at (?:Object\.)?(\S+) \(/.exec(s) || [])[1] || '';
  const spot = () => {
    const l = new Error().stack.split('\n'); let game = null;
    const helperLines = new Map(l.map(s => [s, label(s)]).filter(([, f]) => HELPERS.test(f)).map(([s, f]) => [(SRC.exec(s) || []).slice(1).join(':'), f])); // the anonymous callbacks of a placer (its forEach) are on its line (key: file:line)
    let help = ''; // the generic placers of scenery.js (inst, insts, boxMesh, marker) and those of a map recognized by their name (puts, scenery-wangan.js): we go up to the line that calls them, and note it in parentheses
    for (const s of l) {
      const m = SRC.exec(s), f = label(s);
      if (m) { const here = m[1] + ':' + m[2]; if (/^decors/.test(m[1]) && (HELPERS.test(f) || helperLines.has(here) || m[1] === 'scenery.js' && +m[2] <= PRELUDE)) { help = help || (HELPERS.test(f) ? f : helperLines.get(here) || here); continue; } return m[1] + ':' + m[2] + (f && !/^(Array|Object|eval|Map|forEach|map)/.test(f) ? ' ' + f : '') + (help ? ' (' + help + ')' : ''); }
      if (!game) { const j = GAME.exec(s); if (j) game = 'moteur ' + j[1] + ':' + j[2]; }
    }
    return game || '?';
  };
  const pose = () => {
    const add = THREE.Object3D.prototype.add;
    THREE.Object3D.prototype.add = function (...o) { const here = o.some(x => x && !x.userData.originName) ? spot() : null; for (const x of o) if (x && !x.userData.originName) x.userData.originName = here; return add.apply(this, o); };
  };
  let T; // three.min.js does "self.THREE = {}" then fills it: we set the hook right after the script, before mapDefs.js
  Object.defineProperty(window, 'THREE', { configurable: true, get: () => T, set: v => { T = v; Object.defineProperty(window, 'THREE', { value: v, writable: true, configurable: true }); queueMicrotask(pose); } });
  const A = window.AudioContext; // the game's audio context, for its playback statistics (sound dropouts)
  if (A) window.AudioContext = class extends A { constructor(...a) { super(...a); window.__ac = this; } };
})();
