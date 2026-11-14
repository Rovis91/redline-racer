// Formes propres à « perse » (Route royale) : complète le catalogue de formes.js (mêmes conventions : forme simple = géométrie, assemblage = liste de boîtes à zones). Voir METHODE-DECOR.md.
// Pièces le long de la piste (arcade, étal) : origine au sol au milieu de la façade, X le long de la piste, Z en s'éloignant d'elle.
// Pièces posées sur la route (porte) : repère de la route (repere de decors.js), X en travers, Z vers l'arrière (d'où vient la voiture).
(function () {
  const B = (w, h, d, H = h) => { const g = new THREE.BoxGeometry(w, h, d); g.userData.dim = [w, H, d]; return g; };
  const R45 = [0, Math.PI / 4, 0];
  // REFS §7 : taureau ailé, debout, pieds à l'origine, tourné vers +Z (dir = 1) ou -Z (dir = -1) ; tête humaine à tiare cylindrique et barbe en boucles (lamassu, côté est de la Porte), sinon tête de taureau (côté ouest) ; 11 m de haut
  const lamassu = (x = 0, z = 0, dir = 1, humain = true) => { const Z = d => z + dir * d; return [
    ['sculpte', 2.6, 4.2, 7.5, x, 4.6, z], ['sculpte', 2.4, 2.2, 1.8, x, 7.2, Z(3.4)], // corps, poitrail
    ...[[-0.8, 3], [0.8, 3], [-0.8, -2.8], [0.8, -2.8], [0, 2.2]].map(([dx, dz]) => ['sculpte', 0.9, 2.6, 1, x + dx, 1.3, Z(dz)]), // cinq pattes : quatre vues de côté, deux de face
    ...[-1, 1].map(sd => ['ailes', 0.35, 3.6, 6.8, x + sd * 1.45, 7.6, Z(-0.6), [dir * 0.35, 0, 0]]), // ailes en plumes recourbées le long du dos, relevées vers l'arrière
    ...(humain ? [['sculpte', 1.7, 1.9, 1.6, x, 8.8, Z(4)], ['sculpte', 1.5, 1.6, 0.6, x, 7.5, Z(4.75)], ['or', 1.8, 1.4, 1.7, x, 10.4, Z(4)], ['sculpte', 1.9, 0.3, 1.8, x, 9.9, Z(4)], ['or', 1.9, 0.25, 1.8, x, 11.2, Z(4)]] // tête humaine, barbe étagée, tiare à cornes, couronne de rosettes
      : [['sculpte', 1.5, 1.7, 2.4, x, 8.3, Z(4.4)], ['sculpte', 3, 0.35, 0.4, x, 9.3, Z(4)], ['or', 0.3, 0.9, 0.3, x - 1.4, 9.8, Z(4)], ['or', 0.3, 0.9, 0.3, x + 1.4, 9.8, Z(4)]])]; }; // tête de taureau, cornes
  // REFS §4 : colonne persépolitaine (base en cloche sur plinthe, fût cannelé, couronne de palmes, volutes verticales, double protomé qui porte la poutre) ; H = hauteur sous poutre
  const colonne = (x, z, H) => [['pierre', 2.4, 0.5, 2.4, x, 0.25, z], ['pierre', 2, 1.1, 2, x, 1, z], ['pierre', 2, 1.1, 2, x, 1, z, R45], ['pierre', 1.6, 0.4, 1.6, x, 1.75, z],
    ['fut', 1.2, H - 5.2, 1.2, x, 1.95 + (H - 5.2) / 2, z], ['fut', 1.2, H - 5.2, 1.2, x, 1.95 + (H - 5.2) / 2, z, R45],
    ['sculpte', 1.9, 1, 1.9, x, H - 2.8, z, R45], ['sculpte', 1.3, 1.3, 1.3, x, H - 1.7, z], ['sculpte', 4.6, 1.2, 1.5, x, H - 0.4, z], ['sculpte', 1.1, 1.2, 1.4, x - 2.6, H - 0.1, z], ['sculpte', 1.1, 1.2, 1.4, x + 2.6, H - 0.1, z], ['or', 4.8, 0.25, 1.6, x, H + 0.3, z]];
  Object.assign(FORMES, {
    // colonne persépolitaine de H m : socle, base en cloche (deux boîtes croisées), fût cannelé octogonal, chapiteau, deux protomés de taureau dos à dos (X), poutre du plafond posée dessus
    colonnePerse: (H = 19) => [['pierre', 3.4, 0.6, 3.4, 0, 0.3, 0], ['pierre', 2.6, 1.2, 2.6, 0, 1.2, 0], ['pierre', 2.6, 1.2, 2.6, 0, 1.2, 0, R45],
      ['fut', 1.5, H - 6, 1.5, 0, 1.8 + (H - 6) / 2, 0, null, 1], ['fut', 1.5, H - 6, 1.5, 0, 1.8 + (H - 6) / 2, 0, R45], ['sculpte', 2.4, 1, 2.4, 0, H - 4.4, 0, R45], // couronne de palmes (REFS §4)
     
      ['pierre', 2.2, 1.4, 2.2, 0, H - 3.5, 0], ['pierre', 1.6, 1.2, 1.6, 0, H - 2.3, 0, R45],
      ['sculpte', 7.6, 2.2, 2.4, 0, H - 1, 0, null, 1], ...[-1, 1].flatMap(sd => [['sculpte', 1.8, 1.9, 2, sd * 4.4, H - 0.4, 0], ['or', 0.35, 1.1, 0.35, sd * 4.6, H + 1, 0.6], ['or', 0.35, 1.1, 0.35, sd * 4.6, H + 1, -0.6], ['sculpte', 0.9, 2.2, 1, sd * 3, H - 3, 0.5], ['sculpte', 0.9, 2.2, 1, sd * 3, H - 3, -0.5]])],
    // REFS §6 : la Porte des Nations restituée, à cheval sur la route (repère de la route : Z vers la voiture qui arrive) : salle carrée de brique crue ocre à toit plat et corniche à gorge,
    // portes à chambranles de pierre, taureaux côté arrivée (ouest), lamassus à tête humaine côté sortie (est), quatre colonnes de 16,5 m à l'intérieur ; ni arc, ni créneau, ni tour
    porteNations: (W = 10) => { const L = 2 * W + 20; return [...[-1, 1].flatMap(sd => [['crue', 3, 18, 27, sd * (W + 8.5), 9, 0, null, 1], ['pierre', 3.2, 1.2, 27.4, sd * (W + 8.5), 0.6, 0],
        ...[-1, 1].flatMap(fz => [['pierre', 3.4, 14, 3.6, sd * (W + 1.7), 7, fz * 11.7, null, 1], ['crue', 4.6, 14, 3, sd * (W + 5.9), 7, fz * 11.7]]),
        ...[...lamassu(sd * (W + 1.7), 17.5, 1, false), ...lamassu(sd * (W + 1.7), -17.5, -1, true)].map(b => { const c = b.slice(); c[5] += 2.6; return c; }), // debout sur leur socle
        ...[-5, 5].flatMap(z => colonne(sd * (W + 4.6), z, 16.5)), ['pierre', 3.4, 2.6, 9, sd * (W + 1.7), 1.3, 17.5], ['pierre', 3.4, 2.6, 9, sd * (W + 1.7), 1.3, -17.5]]), // socles des taureaux
      ...[-1, 1].flatMap(fz => [['crue', L, 3.4, 3, 0, 16.3, fz * 11.7], ['pierre', 2 * W + 7.2, 1.3, 3.8, 0, 14.6, fz * 11.7], ['relief', 2 * W + 7, 1, 0.2, 0, 15.6, fz * 13.65]]),
      ['crue', L, 1, 27, 0, 18.5, 0, null, 1], ['cedre', L - 6, 0.2, 21, 0, 17.9, 0], ['pierre', L + 1, 0.6, 28, 0, 19.3, 0], ['pierre', L + 2.2, 0.5, 29.2, 0, 19.85, 0], ['or', L + 2.4, 0.15, 29.4, 0, 20.15, 0]]; },
    // REFS §1-3 : bandeau de rosettes et corniche lisse qui couronnent le parapet de l'escalier (à la place des merlons, interdits) ; 2 m le long de la route
    couronne: () => [['pierre', 2, 0.35, 0.9, 0, 0.18, 0], ['pierre', 2, 0.3, 1.2, 0, 0.5, 0], ['or', 2, 0.1, 1.25, 0, 0.7, 0]],
    // REFS §8 : encadrement de porte du Tachara, debout dans les ruines : chambranles et linteau de pierre noire, corniche à gorge ; X en travers de la porte
    portail: () => [...[-2.2, 2.2].map(x => ['noir', 1.5, 8, 1.8, x, 4, 0, null, 1]), ['noir', 6, 1.3, 1.9, 0, 8.65, 0], ['noir', 6.6, 0.5, 2.2, 0, 9.55, 0], ['noir', 7, 0.4, 2.4, 0, 10, 0], ['pierre', 7, 0.6, 3, 0, 0.3, 0]],
    // REFS §4-5 : colonne de ruine, debout sans poutre (l'Apadana vu de la plaine) ; H = hauteur
    colonneRuine: (H = 19) => colonne(0, 0, H).slice(0, -1),
    // REFS §11 : pavillon de jardin (Chehel Sotoun) : estrade, talar à colonnes de bois élancées, toit plat très débordant à plafond peint, salle du fond à iwan de faïence ; façade vers -Z (la route), Z en s'éloignant
    kushk: () => [['pierre', 32, 1.2, 26, 0, 0.6, 13, null, 1],
      ...[-12.5, -7.5, -2.5, 2.5, 7.5, 12.5].flatMap(x => [2, 7].map(z => ['bois', 0.6, 11, 0.6, x, 6.7, z])), ...[-12.5, 12.5].map(x => ['bois', 0.6, 11, 0.6, x, 6.7, 11.5]),
      ['bois', 33, 0.8, 15, 0, 12.6, 6.5, null, 1], ['or', 33.4, 0.3, 15.4, 0, 13.1, 6.5], ['plafond', 32, 0.1, 14, 0, 12.15, 6.5],
      ['crue', 30, 14.5, 11, 0, 7.45, 19.5, null, 1], ['crue', 30.6, 0.6, 11.6, 0, 14.9, 19.5], ['faience', 11, 10, 0.3, 0, 6.2, 13.95], ['sombre', 6, 7.5, 0.3, 0, 4.95, 13.8], ['or', 11.4, 0.4, 0.4, 0, 11.3, 13.9]],
    // REFS §15 : maison de brique crue à toit plat (village, quartier du bazar) : corps, rebord du toit, porte, deux fenêtres ; façade vers -Z
    maison: () => [['crue', 8, 6, 8, 0, 3, 4, null, 1], ['crue', 8.3, 0.4, 8.3, 0, 6.2, 4], ['sombre', 1.4, 2.4, 0.2, -1.5, 1.2, -0.05], ['sombre', 0.9, 1.2, 0.2, 1.8, 3.8, -0.05], ['sombre', 0.9, 1.2, 0.2, -1.5, 4.2, -0.05]],
    // tour à vent (badgir) posée sur un toit : fût carré, fentes, toit plat
    badgir: () => [['crue', 2.4, 5, 2.4, 0, 2.5, 0, null, 1], ...[0, Math.PI / 2].map(a => ['sombre', 2.5, 2.4, 0.5, 0, 3.4, 0, [0, a, 0]]), ['crue', 2.8, 0.4, 2.8, 0, 5.2, 0]],
    // REFS §12 : caravansérail au bord de la route royale : enclos carré de 56 m, contreforts d'angle carrés (pas de tours rondes), portail à iwan sur la face -Z
    caravanserail: () => [...[-1, 1].flatMap(s => [['crue', 56, 9, 2, 0, 4.5, s * 27, null, 1], ['crue', 2, 9, 56, s * 27, 4.5, 0, null, 1]]),
      ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => ['crue', 5, 10, 5, a * 27, 5, b * 27, R45]),
      ['crue', 18, 14, 5, 0, 7, -27, null, 1], ['sombre', 8, 10, 0.4, 0, 5, -29.6], ['faience', 10, 1.2, 0.3, 0, 11.8, -29.6], ['faience', 18.2, 0.8, 5.2, 0, 14, -27]],
    // REFS §15 : tente noire des nomades : lés tendus en deux pans, rebord bas
    tente: () => [['tente', 9, 1.4, 5, 0, 0.7, 0], ['tente', 9.4, 0.12, 3.2, 0, 1.9, -1.1, [0.45, 0, 0]], ['tente', 9.4, 0.12, 3.2, 0, 1.9, 1.1, [-0.45, 0, 0]]],
    // REFS §12 : arc transversal brisé du bazar couvert (repère de la route) : deux piles et l'arc en six segments, de la naissance à 3,8 m jusqu'à la clé à 6,8 m
    arcBazar: (W = 10) => { const n = 6, R0 = W - 0.45, pt = k => { const t = k / n, x = R0 * (1 - t); return [x, 3.8 + 3 * Math.pow(t, 0.62)]; }, segs = [];
      for (let k = 0; k < n; k++) { const [x0, y0] = pt(k), [x1, y1] = pt(k + 1), l = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0); for (const sd of [-1, 1]) segs.push(['brique', l + 0.3, 0.7, 1.1, sd * (x0 + x1) / 2, (y0 + y1) / 2, 0, [0, 0, sd > 0 ? a : -a]]); }
      return [...[-1, 1].flatMap(sd => [['brique', 0.9, 3.8, 1.2, sd * R0, 1.9, 0], ['faience', 1, 0.4, 1.3, sd * R0, 3.7, 0]]), ...segs]; },
    // REFS §13 : portail (pishtaq) à l'entrée du bazar couvert, à cheval sur la route : cadre de faïence plus haut que les toits, bandeau d'inscription, niche brisée à muqarnas au-dessus de la voûte
    pishtaq: (W = 10) => { const b = [...[-1, 1].flatMap(sd => [['brique', 4, 21, 3.4, sd * (W + 2), 10.5, 0, null, 1], ['faience', 0.6, 19, 3.6, sd * (W - 0.1), 10.5, 0]]),
        ['brique', 2 * W + 8, 3.6, 3.4, 0, 19.2, 0, null, 1], ['inscr', 2 * W + 8.2, 1.4, 3.6, 0, 17.6, 0], ['faience', 2 * W + 8.4, 0.5, 3.8, 0, 21.2, 0], ['muq', 2 * W, 9, 0.4, 0, 12.4, -2.6]];
      for (let k = 0; k < 12; k++) { const y = 8 + k * 0.7, hw = W * Math.pow(1 - (k + 0.5) / 12, 0.7); for (const sd of [-1, 1]) b.push(['muq', W - hw + 0.1, 0.72, 3.2, sd * (hw + (W - hw) / 2), y + 0.35, 0]); }
      return b; },
    // module d'arcades du bazar à ciel ouvert, 12 m : mur de brique peint de deux arcs, corniche, coupole basse derrière (bulbe en deux boîtes)
    // V2 : toit plat à rebord, plus de coupole en gradins (lue comme un merlon, REFS §12) : les coupoles du quartier sont des calottes à part
    arcade: () => [['brique', 12, 5.5, 1.2, 0, 2.75, 0.6, null, 1], ['faience', 12.2, 0.6, 1.4, 0, 5.8, 0.6], ['crue', 12, 7, 9, 0, 3.5, 5.6], ['crue', 12.3, 0.4, 9.3, 0, 7.2, 5.6]],
    // étal à auvent (X le long de la route) : comptoir, deux montants, toile rayée penchée vers la route, marchandises
    etalPerse: () => [['bois', 3.4, 1, 1.4, 0, 0.5, 1.2], ...[-1.6, 1.6].map(x => ['bois', 0.15, 2.8, 0.15, x, 1.4, 0.3]), ['auvent', 3.8, 0.08, 2.4, 0, 2.6, 0.8, [-0.35, 0, 0]],
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
    // fond : coupole sur tambour, minaret à couronne plate (pas de toit pointu)
    coupole: () => { const g = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.6); return g; },
    tambour: () => { const g = new THREE.CylinderGeometry(1, 1, 1, 16); g.translate(0, 0.5, 0); return g; },
    minaret: () => { const g = new THREE.CylinderGeometry(0.8, 1, 1, 10); g.translate(0, 0.5, 0); return g; },
    // panneau plat au loin (nuages en volutes, foule) : plan vertical face à +Z
    panneau: () => new THREE.PlaneGeometry(1, 1),
    // V2 : calotte de coupole (toits du bazar), houppier rond (orangers), cône de qanat, jet de fontaine, cône (épices, Zagros)
    calotte: () => new THREE.SphereGeometry(1, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    houppierRond: () => new THREE.IcosahedronGeometry(1, 1),
    qanat: () => { const g = new THREE.CylinderGeometry(0.8, 2.6, 1.2, 8); g.translate(0, 0.6, 0); return g; },
    jet: () => { const g = new THREE.CylinderGeometry(0.06, 0.25, 1, 6); g.translate(0, 0.5, 0); return g; },
    rai: () => { const g = new THREE.CylinderGeometry(1, 2.4, 1, 10, 1, true); g.translate(0, -0.5, 0); return g; }, // puits de lumière du bazar : cône ouvert sous l'oculus, pointe en haut
    cone: () => { const g = new THREE.ConeGeometry(1, 1, 8); g.translate(0, 0.5, 0); return g; },
  });
})();
