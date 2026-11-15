// Formes propres à « chapada » (Matin sur la Chapada) : complète le catalogue de formes.js. Voir METHODE-DECOR.md.
// Sauf mention, X = en travers de la route (ou en s'éloignant d'elle), Z = le long de la route, origine au pied de l'objet.
(function () {
  const paire = f => [-1, 1].map(f);
  Object.assign(FORMES, {
    // REFS 4 : fougère arborescente (Cyathea) : stipe fin et brun, couronne de huit frondes arquées (h = taille)
    fougereArbo: (h = 1) => [['stipe', 0.35 * h, 5 * h, 0.35 * h, 0, 2.5 * h, 0], ...Array.from({ length: 5 }, (_, k) => { const a = k / 5 * 6.2832;
      return ['fronde', 3.4 * h, 0.08, 0.9 * h, Math.cos(a) * 1.5 * h, 4.9 * h, Math.sin(a) * 1.5 * h, [0, -a, -0.35 - (k % 2) * 0.25]]; })],
    // REFS 4 et 5 : broméliacée : rosette de feuilles raides en étoile, une hampe rouge au centre
    bromelia: () => [...Array.from({ length: 6 }, (_, k) => ['feuille', 1.1, 0.06, 0.22, 0, 0.3, 0, [0, k * 0.5236, 0.55]]), ...Array.from({ length: 6 }, (_, k) => ['feuille', 1.1, 0.06, 0.22, 0, 0.3, 0, [0, k * 0.5236 + 3.1416, 0.55]]),
      ['fleur', 0.18, 0.7, 0.18, 0, 0.45, 0]],
    // REFS 5 : canela-de-ema (Vellozia) du campo rupestre : tronc noir bas qui fourche deux ou trois fois, une touffe de feuilles raides vert-gris au bout de chaque branche (h = taille, 1 = 2,4 m)
    canelaEma: (h = 1) => [['bois', 0.34 * h, 1.1 * h, 0.26 * h, 0, 0.55 * h, 0, [0, 0, 0.08]],
      ...[[-0.45, 0, 0.55, 1.5], [0.4, 0.3, 0.5, 1.8]].flatMap(([dx, dz, r, y]) => [['bois', 0.15 * h, 0.9 * h, 0.15 * h, dx * h, (y - 0.35) * h, dz * h, [dz * 0.6, 0, -Math.sign(dx) * r]],
        ['touffe', 1.4 * h, 0.6 * h, 0.3 * h, dx * 1.7 * h, y * h, dz * 1.4 * h, [0, 0.4, 0.35]], ['touffe', 1.4 * h, 0.6 * h, 0.3 * h, dx * 1.7 * h, y * h, dz * 1.4 * h, [0, 1.9, -0.35]]])],
    // REFS 5 : affleurement de quartzite : dalles basses inclinées dans le même sens (le pendage), arêtes claires, lichen noir dessus
    lajedo: (l = 1) => [['roc', 4.2 * l, 0.9, 2.8, 0, 0.25, 0, [0, 0, 0.2]], ['roc', 3.2 * l, 0.8, 2.2, 1.9 * l, 0.55, 1.3, [0.08, 0.5, 0.24]], ['roc', 2.4 * l, 0.7, 1.8, -1.8 * l, 0.3, -1, [-0.06, -0.35, 0.16]],
      ['lichen', 1.8 * l, 0.06, 1.2, 0.3 * l, 0.92, 0.2, [0, 0.2, 0.2]]],
    // REFS 4 : houppier de la forêt : l'icosaèdre de formes.js (houppier) à sommets partagés, 12 au lieu de 60 : ombré lisse, cinq fois moins de sommets à transformer
    cime: () => { const p = new THREE.IcosahedronGeometry(3.4, 0).attributes.position, vu = new Map(), pos = [], uv = [], idx = [];
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = [x, y, z].map(v => v.toFixed(3)).join(); let j = vu.get(k);
        if (j === undefined) { vu.set(k, j = pos.length / 3); pos.push(x, y, z); uv.push(Math.atan2(z, x) / 6.2832 + 0.5, y / 6.8 + 0.5); } idx.push(j); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; },
    // REFS 4 : broméliacée vue de loin ou perchée (épiphyte) : une coupe ouverte de feuilles, sept facettes (la rosette en boîtes coûte vingt fois plus)
    bromeliaCoupe: () => { const g = new THREE.CylinderGeometry(1, 0.12, 0.7, 7, 1, true); g.translate(0, 0.35, 0); return g; },
    // touffe d'herbe ou de sempre-viva (REFS 5), et petit buisson du sous-bois (REFS 4) : formes simples, posées en nombre
    touffe: () => { const g = new THREE.ConeGeometry(0.55, 1, 5, 1, true); g.translate(0, 0.5, 0); return g; }, // sans fond : on ne le voit jamais
    // houppier lointain (niveau de détail) : un octaèdre à sommets partagés, 8 faces
    cimeLoin: () => { const g = new THREE.OctahedronGeometry(3.6, 0), p = g.attributes.position, vu = new Map(), pos = [], uv = [], idx = [];
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = [x, y, z].map(v => v.toFixed(3)).join(); let j = vu.get(k);
        if (j === undefined) { vu.set(k, j = pos.length / 3); pos.push(x, y, z); uv.push(Math.atan2(z, x) / 6.2832 + 0.5, y / 7.2 + 0.5); } idx.push(j); }
      const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setIndex(idx); G.computeVertexNormals(); return G; },
    // REFS 1 et 3 : bloc de grès tombé, galet : un dodécaèdre aplati par l'échelle
    rocher: () => { const g = new THREE.BoxGeometry(2, 1.6, 2, 1, 1, 1), p = g.attributes.position; // une boîte aux coins tirés au hasard (fixe), le dessus plus étroit : un bloc anguleux (les dodécaèdres se lisaient comme des hexagones)
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = Math.sin(x * 12.9 + y * 78.2 + z * 37.7) * 43758.5, u = k - Math.floor(k);
        p.setXYZ(i, x * (y > 0 ? 0.7 + 0.3 * u : 1 - 0.2 * u), y * (0.8 + 0.4 * u), z * (y > 0 ? 0.65 + 0.35 * (1 - u) : 1)); }
      g.computeVertexNormals(); return g; },
    // REFS 4 : fougère basse du sous-bois : six frondes en rosette qui s'ouvrent vers le haut
    fougereBasse: () => Array.from({ length: 4 }, (_, k) => { const a = k / 4 * 6.2832 + 0.4; return ['fronde', 1.8, 0.05, 0.45, Math.cos(a) * 0.8, 0.45, Math.sin(a) * 0.8, [0, -a, 0.55]]; }),
    // REFS 5 : maison de garimpeiro d'Igatu, en pierre sèche (w × d, murs de ht). ruine = 1 : sans toit, murs écroulés en marches, ouvertures vides ;
    // ruine = 0 : murs entiers, pignon, toit de tuiles à deux pans, porte de bois. Face vers -Z (la route)
    maisonIgatu: (w = 6, d = 5, ht = 3.2, ruine = 1) => { const e = 0.5, L = [], m = (x, y, z, a, b, c) => L.push(['pierre', a, b, c, x, y, z]);
      const hr = k => ruine ? ht * (0.45 + 0.55 * ((k * 0.618) % 1)) : ht; // hauteur écroulée de chaque pan
      m(-w / 4 - 0.55, hr(1) / 2, -d / 2, w / 2 - 1.1, hr(1), e); m(w / 4 + 0.55, hr(2) / 2, -d / 2, w / 2 - 1.1, hr(2), e); // façade, de part et d'autre de la porte
      if (!ruine || hr(3) > 2.4) m(0, ht - 0.35, -d / 2, 2.2, 0.7, e); // le linteau
      m(0, hr(4) / 2, d / 2, w, hr(4), e); for (const sd of [-1, 1]) { m(sd * w / 2, hr(5 + sd) * 0.3, 0, e, hr(5 + sd) * 0.6, d); m(sd * w / 2, hr(5 + sd) * 0.8, -d / 4, e, hr(5 + sd) * 0.4, d / 2 - 0.4); m(sd * w / 2, hr(5 + sd) * 0.8, d / 3, e, hr(5 + sd) * 0.4, d / 3); } // pignons percés d'une fenêtre
      if (ruine) { m(-w / 2 + 0.6, 0.25, -d / 2 - 0.6, 1.2, 0.5, 0.9); m(w / 2 - 1, 0.2, d / 2 + 0.5, 1.4, 0.4, 0.8); } // pierres tombées
      else { for (const sd of [-1, 1]) L.push(['tuile', w + 0.8, 0.18, d / 2 + 0.9, 0, ht + 0.75, sd * (d / 4 + 0.15), [sd * 0.5, 0, 0]]); m(0, ht + 0.6, -d / 2, w, 1.2, e * 0.9); m(0, ht + 0.6, d / 2, w, 1.2, e * 0.9); L.push(['porte', 1.1, 2.1, 0.1, 0, 1.05, -d / 2 - 0.22]); }
      return L; },
    // REFS 5 : muret de pierre sèche, le long de X, avec des pierres de couronnement de travers
    muret: (l = 8) => [['pierre', l, 0.9, 0.6, 0, 0.45, 0], ...Array.from({ length: Math.max(1, l / 2 | 0) }, (_, k) => ['pierre', 1.1, 0.35, 0.7, -l / 2 + 1 + k * 2, 1, 0, [0, 0.3 * (k % 3 - 1), 0.1 * (k % 2)]])],
    // REFS 6 : pylône de bois du pont suspendu, en travers de la route de demi-largeur W : deux poteaux jumelés de chaque côté, deux traverses, sabots de béton
    pyloneBois: W => [...paire(sd => [['bois', 0.45, 9, 0.45, sd * (W + 0.7), 4.5, -0.3], ['bois', 0.45, 9, 0.45, sd * (W + 0.7), 4.5, 0.3], ['beton', 1.4, 1, 1.4, sd * (W + 0.7), 0.2, 0]]).flat(),
      ['bois', 2 * W + 2.6, 0.4, 0.5, 0, 8.4, 0], ['bois', 2 * W + 2.6, 0.3, 0.4, 0, 6.4, 0]],
    // REFS 7 : arche naturelle de grès au-dessus de la route de demi-largeur W : deux piliers massifs en bancs horizontaux décalés (ocre et rouille, joints sombres en saillie),
    // un linteau épais de trois bancs, plus large que haut, des blocs tombés au pied, de la mousse dessus
    archeRoche: W => { const L = [], o = W + 7;
      for (const sd of [-1, 1]) { [[12, 4, 13, 0], [10.5, 3.5, 12, 0.8], [11.5, 4.5, 13.5, -0.6], [10, 3, 11, 1]].reduce((y, [w, hh, d, dx], k) => { L.push([k % 2 ? 'rouille' : 'roche', w, hh, d, sd * (o + dx), y + hh / 2, dx * 1.5, [0, 0.05 * k * sd, 0]], ['joint', w + 0.6, 0.35, d + 0.6, sd * (o + dx), y + hh, dx * 1.5]); return y + hh; }, -1);
        L.push(['roche', 5, 3, 4, sd * (W + 2.5), 0.5, 5, [0, 0.5, 0.15]], ['rouille', 3, 2, 3, sd * (W + 3), 0.2, -6, [0.1, 1.1, 0]], ['roche', 2.5, 1.6, 2.2, sd * (W + 1.8), 0, 9, [0, 0.4, 0.2]]); }
      [[2 * o + 14, 3.5, 14, 15.2, 'roche'], [2 * o + 10, 3, 12.5, 18.4, 'rouille'], [2 * o + 4, 3, 11, 21.4, 'roche']].forEach(([w, hh, d, y, z], k) => L.push([z, w, hh, d, (k - 1) * 1.5, y, k * 0.5, [0, 0, 0.02 * (k - 1)]], ['joint', w + 0.4, 0.35, d + 0.4, (k - 1) * 1.5, y - hh / 2, k * 0.5]));
      L.push(['joint', 2 * W + 4, 2, 11, 0, 12.6, 0.5, [0, 0, 0.04]], ['gris', 2 * o + 8, 1.4, 12, 0, 20.2, 0.3], ['mousse', 2 * o + 2, 0.8, 10, 0, 23.3, 0.5], ['mousse', 8, 1.2, 8, -o + 3, 23.6, -1]); return L; },
    // cairn de pierres sèches
    cairn: () => [['pierre', 1.4, 0.5, 1.2, 0, 0.25, 0], ['pierre', 1.1, 0.45, 0.9, 0.05, 0.7, 0, [0, 0.6, 0]], ['pierre', 0.8, 0.4, 0.7, -0.05, 1.1, 0, [0, 1.2, 0]], ['pierre', 0.5, 0.35, 0.45, 0, 1.45, 0, [0, 0.3, 0]]],
    // panneau de bois du parc : deux poteaux, une planche gravée (face vers Z, la voiture qui arrive)
    panneauBois: () => [...paire(sd => ['bois', 0.16, 2.4, 0.16, sd * 1.2, 1.2, 0]), ['plaque', 2.8, 1, 0.08, 0, 1.9, 0.1]],
    // tronc tombé, couché le long de X, avec deux moignons de branches
    troncCouche: (l = 10) => [['bois', l, 0.8, 0.8, 0, 0.4, 0, [0, 0, 0.04]], ['bois', 0.3, 1.6, 0.3, l * 0.2, 1, 0.2, [0.3, 0, -0.4]], ['bois', 0.25, 1.2, 0.25, -l * 0.25, 0.9, -0.2, [-0.4, 0, 0.3]]],
  });
})();
