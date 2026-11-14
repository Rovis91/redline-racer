// Formes propres à « perse » (Route royale) : complète le catalogue de formes.js (mêmes conventions : forme simple = géométrie, assemblage = liste de boîtes à zones). Voir METHODE-DECOR.md.
// Pièces le long de la piste (arcade, étal) : origine au sol au milieu de la façade, X le long de la piste, Z en s'éloignant d'elle.
// Pièces posées sur la route (porte) : repère de la route (repere de decors.js), X en travers, Z vers l'arrière (d'où vient la voiture).
(function () {
  const B = (w, h, d, H = h) => { const g = new THREE.BoxGeometry(w, h, d); g.userData.dim = [w, H, d]; return g; };
  const R45 = [0, Math.PI / 4, 0];
  // taureau ailé à tête humaine (lamassu), debout, tourné vers +Z, pieds à l'origine ; 9 m de haut
  const lamassu = (x = 0, z = 0) => [
    ['sculpte', 2.6, 4.2, 7.5, x, 4.6, z], ['sculpte', 2.4, 2.2, 1.8, x, 7.2, z + 3.4], // corps, poitrail
    ...[[-0.8, 3], [0.8, 3], [-0.8, -2.8], [0.8, -2.8], [0, 2.2]].map(([dx, dz]) => ['sculpte', 0.9, 2.6, 1, x + dx, 1.3, z + dz]), // pattes (le lamassu en a cinq : quatre vues de côté, deux de face)
    ...[-1, 1].map(sd => ['ailes', 0.35, 3.6, 6.8, x + sd * 1.45, 7.6, z - 0.6, [0.35, 0, 0]]), // ailes repliées le long du dos, relevées vers l'arrière
    ['sculpte', 1.7, 1.9, 1.6, x, 8.8, z + 4], ['sculpte', 1.5, 1.4, 0.6, x, 7.6, z + 4.6], // tête humaine, barbe en boucles
    ['or', 1.8, 1, 1.7, x, 10.2, z + 4], ['or', 1.5, 0.25, 1.5, x, 10.85, z + 4]]; // tiare à cornes, couronne
  Object.assign(FORMES, {
    // colonne persépolitaine de H m : socle, base en cloche (deux boîtes croisées), fût cannelé octogonal, chapiteau, deux protomés de taureau dos à dos (X), poutre du plafond posée dessus
    colonnePerse: (H = 19) => [['pierre', 3.4, 0.6, 3.4, 0, 0.3, 0], ['pierre', 2.6, 1.2, 2.6, 0, 1.2, 0], ['pierre', 2.6, 1.2, 2.6, 0, 1.2, 0, R45],
      ['fut', 1.7, H - 6, 1.7, 0, 1.8 + (H - 6) / 2, 0, null, 1], ['fut', 1.7, H - 6, 1.7, 0, 1.8 + (H - 6) / 2, 0, R45],
      ['pierre', 2.2, 1.4, 2.2, 0, H - 3.5, 0], ['pierre', 1.6, 1.2, 1.6, 0, H - 2.3, 0, R45],
      ['sculpte', 6.4, 1.5, 1.8, 0, H - 0.9, 0, null, 1], ...[-1, 1].flatMap(sd => [['sculpte', 1.1, 1.3, 1.5, sd * 3.6, H - 0.5, 0], ['or', 0.25, 0.7, 0.25, sd * 3.6, H + 0.4, 0.5], ['sculpte', 0.6, 1.4, 0.6, sd * 2.6, H - 2.1, 0]])],
    // la Porte des Nations, à cheval sur la route : deux piliers massifs de 20 m, un taureau ailé contre chacun du côté où l'on arrive, le linteau à frise ; W = demi-largeur de la route
    porteNations: (W = 10) => [...[-1, 1].flatMap(sd => [['pierre', 5, 20, 12, sd * (W + 3.5), 10, 0, null, 1], ['frise', 5.2, 2.4, 12.2, sd * (W + 3.5), 18.5, 0], ...lamassu(sd * (W + 2.2), 8)]),
      ['pierre', 2 * W + 12, 3, 12, 0, 21.5, 0, null, 1], ['frise', 2 * W + 12.2, 1.6, 12.2, 0, 22.4, 0], ['or', 2 * W + 12.4, 0.4, 12.4, 0, 23.3, 0]],
    // taureau ailé seul (allée de la plaine, de loin)
    lamassu: () => [['pierre', 3.4, 2, 9, 0, 1, 0], ...lamassu(0, 0).map(b => { const c = b.slice(); c[5] += 2; return c; })],
    // merlon à degrés de la balustrade de l'escalier (1,2 m de large)
    merlon: () => [['pierre', 1.2, 0.7, 0.6, 0, 0.35, 0], ['pierre', 0.8, 0.5, 0.6, 0, 0.95, 0], ['pierre', 0.4, 0.4, 0.6, 0, 1.4, 0]],
    // module d'arcades du bazar à ciel ouvert, 12 m : mur de brique peint de deux arcs, corniche, coupole basse derrière (bulbe en deux boîtes)
    arcade: () => [['brique', 12, 7, 1.2, 0, 3.5, 0.6, null, 1], ['faience', 12.2, 0.8, 1.4, 0, 7.4, 0.6], ['brique', 12, 3, 9, 0, 1.5, 5.5],
      ['brique', 5, 2.2, 5, 0, 8, 5], ['brique', 3.6, 1.2, 3.6, 0, 9.6, 5, R45], ['or', 0.3, 1.4, 0.3, 0, 10.8, 5]],
    // étal à auvent (X le long de la route) : comptoir, deux montants, toile rayée penchée vers la route, marchandises
    etal: () => [['bois', 3.4, 1, 1.4, 0, 0.5, 1.2], ...[-1.6, 1.6].map(x => ['bois', 0.15, 2.8, 0.15, x, 1.4, 0.3]), ['auvent', 3.8, 0.08, 2.4, 0, 2.6, 0.8, [-0.35, 0, 0]],
      ['marchandise', 3, 0.5, 1, 0, 1.25, 1.2]],
    // chameau de bât, X vers l'avant : pattes, corps, bosse, cou et tête ; bât rouge
    chameau: () => [...[[-0.8, -0.35], [-0.8, 0.35], [0.8, -0.35], [0.8, 0.35]].map(([x, z]) => ['poil', 0.25, 1.4, 0.25, x, 0.7, z]), ['poil', 2.2, 0.9, 0.9, 0, 1.75, 0],
      ['poil', 0.9, 0.6, 0.7, -0.1, 2.4, 0], ['bat', 1, 0.4, 1, -0.1, 2.75, 0], ['poil', 0.35, 1.1, 0.35, 1.3, 2.3, 0, [0, 0, -0.5]], ['poil', 0.6, 0.35, 0.35, 1.65, 2.85, 0]],
    // âne bâté, X vers l'avant
    ane: () => [...[[-0.4, -0.2], [-0.4, 0.2], [0.4, -0.2], [0.4, 0.2]].map(([x, z]) => ['poil', 0.14, 0.7, 0.14, x, 0.35, z]), ['poil', 1.1, 0.5, 0.5, 0, 0.95, 0],
      ['poil', 0.25, 0.5, 0.25, 0.6, 1.25, 0, [0, 0, -0.6]], ['poil', 0.45, 0.25, 0.25, 0.8, 1.5, 0], ['bat', 0.6, 0.45, 0.8, -0.05, 1.3, 0]],
    // cyprès : flamme étroite à six pans (silhouette plate de miniature)
    cypres: () => { const g = new THREE.ConeGeometry(1.3, 12, 6, 1); g.translate(0, 6.6, 0); return g; },
    // bassin rond du jardin : margelle (anneau bas), l'eau est un disque posé à part
    margelle: () => { const g = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); g.translate(0, 0.5, 0); return g; },
    disque: () => { const g = new THREE.CircleGeometry(1, 24); g.rotateX(-Math.PI / 2); return g; },
    // massif de fleurs : bourrelet bas
    massif: () => B(1, 0.6, 1),
    // lanterne du bazar
    lanterne: () => B(0.5, 0.8, 0.5),
    // fond : coupole sur tambour, minaret, tour carrée à toit en pyramide (Golestan, Ispahan)
    coupole: () => { const g = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.6); return g; },
    tambour: () => { const g = new THREE.CylinderGeometry(1, 1, 1, 16); g.translate(0, 0.5, 0); return g; },
    minaret: () => { const g = new THREE.CylinderGeometry(0.8, 1, 1, 10); g.translate(0, 0.5, 0); return g; },
    toitPyramide: () => { const g = new THREE.ConeGeometry(0.71, 1, 4); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return g; },
    // panneau plat au loin (nuages en volutes, foule) : plan vertical face à +Z
    panneau: () => new THREE.PlaneGeometry(1, 1),
  });
})();
