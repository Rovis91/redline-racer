// Origine de chaque objet du décor, pour outils/profil.js : chaque add() note la ligne du fichier de carte qui l'a fait (« decors-touge.js:812 pont »), dans userData.origine.
// Chargé avant three.min.js (outils/banc-rapide.js l'injecte en tête de page), et seulement pour la mesure : prendre la pile à chaque add() ralentit le chargement.
// La fusion du décor (game.js, « fusion ») garde alors, pour chaque géométrie fondue, la liste de ses pièces et de leur origine (userData.src).
(() => {
  window.__origines = 1;
  // shortcut: PRELUDE = dernière ligne des poseurs partagés en tête de decors.js (inst, insts, boite, repere ; poses, propre à wangan, est reconnu par son nom) ; à remonter si ce prélude grandit
  const AIDES = /^(inst|insts|boite|repere|poses)$/, PRELUDE = 30, SRC = /\/((?:decors[\w-]*|formes[\w-]*|textures[\w-]*|rythme)\.js):(\d+)/, JEU = /\/(game\.js):(\d+)/;
  const nom = s => (/at (?:Object\.)?(\S+) \(/.exec(s) || [])[1] || '';
  const lieu = () => {
    const l = new Error().stack.split('\n'); let jeu = null;
    const lignesAides = new Map(l.map(s => [s, nom(s)]).filter(([, f]) => AIDES.test(f)).map(([s, f]) => [(SRC.exec(s) || []).slice(1).join(':'), f])); // les rappels anonymes d'un poseur (son forEach) sont sur sa ligne (clé : fichier:ligne)
    let aide = ''; // les poseurs génériques de decors.js (inst, insts, boite, repere) et ceux d'une carte reconnus par leur nom (poses, decors-wangan.js) : on remonte à la ligne qui les appelle, et on les note entre parenthèses
    for (const s of l) {
      const m = SRC.exec(s), f = nom(s);
      if (m) { const ici = m[1] + ':' + m[2]; if (/^decors/.test(m[1]) && (AIDES.test(f) || lignesAides.has(ici) || m[1] === 'decors.js' && +m[2] <= PRELUDE)) { aide = aide || (AIDES.test(f) ? f : lignesAides.get(ici) || ici); continue; } return m[1] + ':' + m[2] + (f && !/^(Array|Object|eval|Map|forEach|map)/.test(f) ? ' ' + f : '') + (aide ? ' (' + aide + ')' : ''); }
      if (!jeu) { const j = JEU.exec(s); if (j) jeu = 'moteur ' + j[1] + ':' + j[2]; }
    }
    return jeu || '?';
  };
  const pose = () => {
    const add = THREE.Object3D.prototype.add;
    THREE.Object3D.prototype.add = function (...o) { const ici = o.some(x => x && !x.userData.origine) ? lieu() : null; for (const x of o) if (x && !x.userData.origine) x.userData.origine = ici; return add.apply(this, o); };
  };
  let T; // three.min.js fait « self.THREE = {} » puis le remplit : on pose le crochet juste après le script, avant cartes.js
  Object.defineProperty(window, 'THREE', { configurable: true, get: () => T, set: v => { T = v; Object.defineProperty(window, 'THREE', { value: v, writable: true, configurable: true }); queueMicrotask(pose); } });
  const A = window.AudioContext; // le contexte audio du jeu, pour ses statistiques de lecture (coupures du son)
  if (A) window.AudioContext = class extends A { constructor(...a) { super(...a); window.__ac = this; } };
})();
