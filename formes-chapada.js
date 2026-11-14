// Formes propres à « chapada » (Matin sur la Chapada) : complète le catalogue de formes.js. Voir METHODE-DECOR.md.
// Sauf mention, X = en travers de la route (ou en s'éloignant d'elle), Z = le long de la route, origine au pied de l'objet.
(function () {
  const paire = f => [-1, 1].map(f);
  Object.assign(FORMES, {
    // fougère arborescente : stipe fin et brun, couronne de huit frondes arquées (h = taille)
    fougereArbo: (h = 1) => [['stipe', 0.35 * h, 5 * h, 0.35 * h, 0, 2.5 * h, 0], ...Array.from({ length: 8 }, (_, k) => { const a = k / 8 * 6.2832;
      return ['fronde', 3.4 * h, 0.08, 0.9 * h, Math.cos(a) * 1.5 * h, 4.9 * h, Math.sin(a) * 1.5 * h, [0, -a, -0.35 - (k % 2) * 0.25]]; })],
    // arbre tordu du cerrado : tronc bas en deux coudes, branches obliques, houppier plat en trois nappes
    arbreCerrado: (h = 1) => [['bois', 0.32 * h, 1.6 * h, 0.32 * h, 0, 0.8 * h, 0, [0, 0, 0.25]], ['bois', 0.26 * h, 1.6 * h, 0.26 * h, -0.35 * h, 2.2 * h, 0, [0, 0, -0.35]],
      ['bois', 0.16 * h, 1.4 * h, 0.16 * h, 0.4 * h, 2.6 * h, 0.2 * h, [0.3, 0, 0.7]],
      ['feuille', 3.2 * h, 0.5 * h, 2.6 * h, 0.1 * h, 3.2 * h, 0], ['feuille', 2 * h, 0.4 * h, 1.8 * h, 1.2 * h, 3.0 * h, 0.9 * h], ['feuille', 1.8 * h, 0.4 * h, 2 * h, -1.1 * h, 3.4 * h, -0.6 * h]],
    // broméliacée : rosette de feuilles raides en étoile, une hampe rouge au centre
    bromelia: () => [...Array.from({ length: 6 }, (_, k) => ['feuille', 1.1, 0.06, 0.22, 0, 0.3, 0, [0, k * 0.5236, 0.55]]), ...Array.from({ length: 6 }, (_, k) => ['feuille', 1.1, 0.06, 0.22, 0, 0.3, 0, [0, k * 0.5236 + 3.1416, 0.55]]),
      ['fleur', 0.18, 0.7, 0.18, 0, 0.45, 0]],
    // pylône de bois du pont suspendu, en travers de la route de demi-largeur W : deux poteaux jumelés de chaque côté, deux traverses, sabots de béton
    pyloneBois: W => [...paire(sd => [['bois', 0.45, 9, 0.45, sd * (W + 0.7), 4.5, -0.3], ['bois', 0.45, 9, 0.45, sd * (W + 0.7), 4.5, 0.3], ['beton', 1.4, 1, 1.4, sd * (W + 0.7), 0.2, 0]]).flat(),
      ['bois', 2 * W + 2.6, 0.4, 0.5, 0, 8.4, 0], ['bois', 2 * W + 2.6, 0.3, 0.4, 0, 6.4, 0]],
    // arche naturelle de grès au-dessus de la route de demi-largeur W : deux piliers massifs, irréguliers, un linteau épais qui tombe en blocs ; mousse sur le dessus
    archeRoche: W => [...paire(sd => [['roche', 9, 16, 12, sd * (W + 5), 8, 0], ['roche', 6, 8, 9, sd * (W + 3), 4, 3, [0, 0.3, 0]], ['roche', 7, 10, 7, sd * (W + 9), 20, -2, [0, 0.4, 0.1]]]).flat(),
      ['roche', 2 * W + 22, 7, 13, 0, 19.5, 0], ['roche', 2 * W + 6, 3, 10, 0, 15.2, 0.5, [0, 0, 0.04]], ['roche', 10, 4, 11, -3, 23.5, 1, [0.1, 0.3, 0]], ['mousse', 2 * W + 18, 0.8, 11, 0, 23.2, 0]],
    // cairn de pierres sèches
    cairn: () => [['pierre', 1.4, 0.5, 1.2, 0, 0.25, 0], ['pierre', 1.1, 0.45, 0.9, 0.05, 0.7, 0, [0, 0.6, 0]], ['pierre', 0.8, 0.4, 0.7, -0.05, 1.1, 0, [0, 1.2, 0]], ['pierre', 0.5, 0.35, 0.45, 0, 1.45, 0, [0, 0.3, 0]]],
    // panneau de bois du parc : deux poteaux, une planche gravée (face vers Z, la voiture qui arrive)
    panneauBois: () => [...paire(sd => ['bois', 0.16, 2.4, 0.16, sd * 1.2, 1.2, 0]), ['plaque', 2.8, 1, 0.08, 0, 1.9, 0.1]],
    // tronc tombé, couché le long de X, avec deux moignons de branches
    troncCouche: (l = 10) => [['bois', l, 0.8, 0.8, 0, 0.4, 0, [0, 0, 0.04]], ['bois', 0.3, 1.6, 0.3, l * 0.2, 1, 0.2, [0.3, 0, -0.4]], ['bois', 0.25, 1.2, 0.25, -l * 0.25, 0.9, -0.2, [-0.4, 0, 0.3]]],
  });
})();
