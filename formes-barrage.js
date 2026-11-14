// Formes propres à « barrage » : complète le catalogue de formes.js (mêmes conventions : forme simple = géométrie, assemblage = liste de boîtes à zones). Voir METHODE-DECOR.md.
(function () {
  Object.assign(FORMES, {
    // gerbe d'une vanne ouverte (forme simple) : la lame d'eau part à l'horizontale de la vanne (origine) vers +Z et tombe en parabole de `chute` m sur `L` m ;
    // deux nappes croisées (à plat, de w0 à w1 m de large ; debout, de 2 à w1 / 2 m d'épaisseur), v = le long de la chute (la texture défile)
    gerbe: (L = 160, chute = 90, w0 = 8, w1 = 22) => {
      const P = [], UV = [], I = [], n = 24;
      for (const nappe of [0, 1]) { const b = P.length / 3;
        for (let k = 0; k <= n; k++) { const t = k / n, z = t * L, y = -chute * t * t, w = (nappe ? 2 + (w1 / 2 - 2) * t : w0 + (w1 - w0) * t) / 2;
          if (nappe) P.push(0, y - w, z, 0, y + w, z); else P.push(-w, y, z, w, y, z); UV.push(0, t * 6, 1, t * 6);
          if (k < n) { const a = b + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
    },
    // nuage d'embruns : trois plans croisés de 1 m (mis à l'échelle par instance), centrés à l'origine
    brume: () => { const gs = [0, 1, 2].map(k => { const p = new THREE.PlaneGeometry(1, 1); p.rotateY(k * Math.PI / 3); return p; });
      const P = [], UV = [], I = []; gs.forEach(p => { const b = P.length / 3; P.push(...p.attributes.position.array); UV.push(...p.attributes.uv.array); I.push(...Array.from(p.index.array, i => i + b)); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); return g; },
    // alternateur de la salle des turbines : cuve vert d'eau de 10 m de diamètre, posée au sol (origine au pied)
    alternateur: () => { const g = new THREE.CylinderGeometry(5, 5.4, 7, 20); g.translate(0, 3.5, 0); return g; },
    // capot de l'alternateur et silos de la vallée
    capot: () => { const g = new THREE.CylinderGeometry(2.2, 4.8, 1.6, 20); g.translate(0, 0.8, 0); return g; },
    silo: () => { const g = new THREE.CylinderGeometry(6, 6, 22, 14); g.translate(0, 11, 0); return g; },
    // vanne vue de l'aval : pertuis sombre de 12 × 8 m, piles de part et d'autre, vantail levé (orange) au-dessus, numéro peint ; origine au bas du pertuis, face vers +Z
    vanne: () => [['trou', 12, 8, 1, 0, 4, 0.3], ['beton', 2, 14, 3, -7, 7, 1], ['beton', 2, 14, 3, 7, 7, 1], ['vantail', 12.4, 3, 1.2, 0, 9.6, 0.8], ['numero', 6, 1.6, 0.2, 0, 12, 0.7]],
    // portique des vannes sur le couronnement (repère de la route : X en travers, origine au milieu) : deux jambes en dehors des parapets, une poutre caisson, un treuil ; W = demi-largeur de la route
    portiqueVanne: (W = 9) => [...[-1, 1].flatMap(sd => [['acier', 1.6, 14, 2.4, sd * (W + 3), 7, 0, null, 1], ['acier', 2.6, 0.6, 3.4, sd * (W + 3), 0.3, 0]]),
      ['acier', 2 * W + 8, 2.2, 2.6, 0, 15, 0, null, 1], ['treuil', 4, 2.4, 3, -W + 3, 17.3, 0], ['treuil', 1.4, 1.4, 2, W - 2, 16.8, 0]],
    // pont roulant de la halle (X en travers de la halle, L = portée) : poutre double, chariot, cabine suspendue côté sud, crochet
    pontRoulant: (L = 44) => [['acier', L, 1.6, 1.2, 0, 0, -1.4, null, 1], ['acier', L, 1.6, 1.2, 0, 0, 1.4], ['chariot', 5, 1.6, 4.4, -6, 1.6, 0], ['cabine', 3, 2.4, 3, L / 2 - 4, -2.2, 0], ['cable', 0.2, 9, 0.2, -6, -4.5, 0], ['cable', 1.2, 1, 0.6, -6, -9.5, 0]],
    // poutre-treillis latérale du pont d'acier, le long de X (L m) : membrures haute et basse, montants et diagonales tous les 8 m
    treillisPont: (L = 160) => { const B = [['acier', L, 0.6, 0.5, 0, 0.3, 0], ['acier', L, 0.5, 0.5, 0, 4.2, 0, null, 1]];
      for (let x = -L / 2; x <= L / 2 + 0.1; x += 8) { B.push(['acier', 0.4, 4, 0.4, x, 2.25, 0]); if (x < L / 2) B.push(['acier', 0.3, 5.7, 0.3, x + 4, 2.25, 0, [0, 0, x / 8 & 1 ? 0.78 : -0.78]]); } return B; },
    // cabane de garde de la vallée : maisonnette de béton, auvent, fenêtre éclairée
    cabane: () => [['beton', 4, 3, 3.4, 0, 1.5, 0, null, 1], ['toit', 5, 0.3, 4.2, 0, 3.15, 0], ['vitre', 1.6, 1, 0.1, 0, 1.8, 1.72]],
    // tour de contrôle sur la culée ouest : fût, salle vitrée, toit, antenne
    tourControle: () => [['beton', 6, 26, 6, 0, 13, 0, null, 1], ['vitre', 10, 4, 10, 0, 28, 0], ['beton', 11, 1, 11, 0, 30.5, 0], ['acier', 0.4, 12, 0.4, 2, 37, 2]],
  });
})();
