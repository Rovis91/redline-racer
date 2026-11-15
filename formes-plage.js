// Formes propres à « plage » (Playa 307) : complète le catalogue de formes.js (forme simple = géométrie, assemblage = liste de boîtes à zones). Voir METHODE-DECOR.md.
(function () {
  const paire = f => [-1, 1].map(f);
  Object.assign(FORMES, {
    // cocotier penché vers +X : tronc en quatre tronçons qui se redressent, couronne de dix palmes retombantes, régime de noix jaunes sous la couronne ; v = 0 (11 m) ou 1 (8 m, plus penché). Origine au pied
    cocotier: (v = 0) => {
      const H = v ? 8 : 11, inc = v ? 0.42 : 0.28, seg = [], n = 4; let x = 0, y = 0;
      for (let k = 0; k < n; k++) { const a = inc * (1 - k / n), l = H / n, cx = x + Math.sin(a) * l / 2, cy = y + Math.cos(a) * l / 2; seg.push(['tronc', 0.36 - k * 0.04, l + 0.15, 0.36 - k * 0.04, cx, cy, 0, [0, 0, -a], 1]); x += Math.sin(a) * l; y += Math.cos(a) * l; }
      const palmes = Array.from({ length: 10 }, (_, k) => { const b = k / 10 * 6.2832, d = 1.9; return ['palme', 4.2, 0.08, 0.9, x + Math.cos(b) * d, y - 0.5 - (k % 2) * 0.3, Math.sin(b) * d, [0, -b, -0.5 - (k % 3) * 0.15], 1]; });
      const noix = [[0.35, 0], [-0.2, 0.3], [0, -0.35], [-0.25, -0.15]].map(([a, b]) => ['noix', 0.32, 0.36, 0.32, x + a, y - 0.55, b]);
      return [...seg, ...palmes, ...noix];
    },
    // toit de palapa : cône de chaume à huit pans, 1 m de rayon et de haut (à mettre à l'échelle) ; origine à la base
    toitPalapa: () => { const g = new THREE.ConeGeometry(1, 1, 8, 1, true); g.translate(0, 0.5, 0); return g; },
    // poteau de bois rond d'1 m de haut (à étirer) ; origine au pied
    poteauBois: () => { const g = new THREE.CylinderGeometry(0.1, 0.12, 1, 6); g.translate(0, 0.5, 0); return g; },
    // bouée de balisage : petite sphère de 1 m de diamètre à mettre à l'échelle ; origine au centre
    bouee: () => new THREE.IcosahedronGeometry(0.5, 1),
    // corde tendue le long de X entre deux poteaux : tube fin d'1 m de long (à étirer en X)
    corde: () => { const g = new THREE.CylinderGeometry(0.03, 0.03, 1, 4); g.rotateZ(Math.PI / 2); return g; },
    // transat de plage tourné vers +X : châssis, toile, dossier relevé
    transat: () => [['bois', 1.8, 0.08, 0.7, 0, 0.35, 0], ['toile', 1.2, 0.05, 0.6, -0.25, 0.42, 0], ['toile', 0.8, 0.05, 0.6, 0.6, 0.65, 0, [0, 0, 0.6]], ...paire(sz => ['bois', 0.06, 0.35, 0.06, -0.8, 0.17, sz * 0.3]), ...paire(sz => ['bois', 0.06, 0.35, 0.06, 0.8, 0.17, sz * 0.3])],
    // barque de pêcheur, la proue vers +X : coque blanche, bande peinte (zone teinte), bancs, moteur hors-bord ; origine au fond de la coque
    barque: () => [['coque', 5, 0.7, 1.7, 0, 0.35, 0, null, 1], ['coque', 1.2, 0.7, 1.1, 2.9, 0.4, 0, [0, 0, 0.2]], ['bande', 5.1, 0.18, 1.74, 0, 0.62, 0], ['bande', 1.25, 0.18, 1.14, 2.95, 0.66, 0, [0, 0, 0.2]],
      ['bois', 0.35, 0.08, 1.5, 0.8, 0.55, 0], ['bois', 0.35, 0.08, 1.5, -1, 0.55, 0], ['moteur', 0.4, 0.8, 0.35, -2.7, 0.6, 0]],
    // façade de la rue tournée vers -Z (la route) : bloc crépi de 2 étages, acrotère crénelé, balcon, auvent de toile au rez-de-chaussée ; L = largeur, H = hauteur. Origine au sol, milieu de la façade
    facadePlaya: (L = 10, H = 8) => [['mur', L, H, 9, 0, H / 2, 4.5, null, 1], ...Array.from({ length: Math.round(L / 1.6) }, (_, k) => ['mur', 0.8, 0.6, 0.4, -L / 2 + 0.4 + k * (L - 0.8) / Math.max(1, Math.round(L / 1.6) - 1), H + 0.3, 0.2]),
      ['cadre', L * 0.6, 0.15, 1.1, 0, H * 0.48, -0.55], ['cadre', L * 0.6, 0.9, 0.06, 0, H * 0.48 + 0.5, -1.08], ['toile', L * 0.8, 0.06, 2.2, 0, 2.9, -1.05, [-0.32, 0, 0]], ['cadre', L * 0.8, 0.35, 0.05, 0, 2.5, -2.1]],
    // étal du marché, le chaland vers -Z : table, toile rayée sur quatre montants, chapeaux de paille empilés et hamacs pendus (zone teinte)
    etalPlaya: () => [['bois', 3, 0.9, 1.4, 0, 0.45, 0, null, 1], ...paire(a => paire(b => ['bois', 0.08, 2.6, 0.08, a * 1.45, 1.3, b * 0.7])).flat(), ['toile', 3.3, 0.06, 1.9, 0, 2.62, 0, [0.12, 0, 0], 1],
      ...[-1, -0.4, 0.2, 0.8].map(x => ['paille', 0.55, 0.12, 0.55, x, 0.98, -0.2]), ...[-0.7, 0.5].map(x => ['paille', 0.32, 0.22, 0.32, x, 1.1, -0.2]),
      ['hamac', 1.3, 0.9, 0.05, -0.5, 1.75, 0.68, [0, 0, 0.05]], ['hamac', 1.3, 0.9, 0.05, 0.9, 1.75, 0.68, [0, 0, -0.05]]],
    // pilier de la halle du marché, de la chaussée au toit (h m) : fût carré, chapiteau ; origine au sol
    pilierHalle: (h = 9) => [['pilier', 0.6, h, 0.6, 0, h / 2, 0, null, 1], ['pilier', 1, 0.3, 1, 0, h - 0.15, 0], ['pilier', 0.9, 0.4, 0.9, 0, 0.2, 0]],
    // colonne ronde du lobby (h m), blanche ; origine au sol
    colonne: (h = 9) => { const g = new THREE.CylinderGeometry(0.45, 0.5, h, 10); g.translate(0, h / 2, 0); return g; },
    // stalactite : cône pointe en bas, 1 m de long et 0,5 m de rayon à la racine (à mettre à l'échelle) ; origine à la racine (au plafond)
    stalactite: () => { const g = new THREE.ConeGeometry(0.5, 1, 6); g.rotateX(Math.PI); g.translate(0, -0.5, 0); return g; },
    // rocher de calcaire : bloc arrondi de 1 m de rayon, à mettre à l'échelle ; origine au centre
    rocher: () => { const g = new THREE.DodecahedronGeometry(1, 0); g.scale(1, 0.75, 1); return g; },
    // buisson de garrigue : boule basse, 1 m de rayon ; origine au sol
    buisson: () => { const g = new THREE.IcosahedronGeometry(1, 0); g.scale(1, 0.6, 1); g.translate(0, 0.35, 0); return g; },
    // muret de pierre sèche, L m le long de X
    muret: (L = 6) => [['pierre', L, 0.9, 0.7, 0, 0.45, 0, null, 1], ['pierre', L, 0.15, 0.85, 0, 0.95, 0]],
    // plan vertical d'1 m × 1 m (lianes, rayons de lumière) ; origine en haut, au milieu : il pend vers le bas
    pan: () => { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, -0.5, 0); return g; },
    // fanion carré de 0,4 × 0,5 m qui pend de son fil (le fil le long de X) ; origine au fil
    fanion: () => { const g = new THREE.PlaneGeometry(0.42, 0.52); g.translate(0, -0.26, 0); return g; },
    // bar de paillote : comptoir en arc de cercle simplifié, tabourets, étagère de bouteilles (zone lum) ; origine au sol, le client côté +Z
    barPaillote: () => [['bois', 5, 1.1, 0.8, 0, 0.55, 0, null, 1], ['bois', 5.4, 0.1, 1.1, 0, 1.15, 0], ['bois', 4.5, 1.8, 0.4, 0, 0.9, -1.6], ['bouteilles', 4.2, 0.9, 0.1, 0, 1.6, -1.38],
      ...[-1.8, -0.6, 0.6, 1.8].map(x => ['bois', 0.4, 0.7, 0.4, x, 0.35, 1])],
    // pot de plante : pot de terre cuite et touffe ; origine au sol
    potPlante: () => [['pot', 0.8, 0.8, 0.8, 0, 0.4, 0], ['plante', 1.4, 1.4, 1.4, 0, 1.4, 0, [0, 0.6, 0]], ['plante', 1.1, 1.2, 1.1, 0, 2.2, 0, [0.4, 0, 0.3]]],
    // escalier de bois accroché à la paroi, descendant le long de X : marches, limon, rampe ; n marches
    escalier: (n = 12) => [...Array.from({ length: n }, (_, k) => ['bois', 0.45, 0.08, 1.4, k * 0.5, -k * 0.4, 0]), ['bois', n * 0.5, 0.25, 0.08, n * 0.25 - 0.25, -n * 0.2 + 0.1, 0.72, [0, 0, -0.67]],
      ['bois', n * 0.5, 0.06, 0.06, n * 0.25 - 0.25, -n * 0.2 + 1.1, 0.72, [0, 0, -0.67]]],

    // ---------- V2 : chaque forme dit la fiche de docs/REFS-plage.md qu'elle suit ----------
    // tour de maître-nageur (fiche 1, torre de salvavidas) : quatre pieds, plateforme à 3 m, cabine fermée sur trois côtés, toit plat débordant, rampe vers la plage (+Z), mât à drapeau ; origine au sol
    torreSalvavidas: () => [...paire(a => paire(b => ['bois', 0.18, 3.1, 0.18, a * 1.1, 1.55, b * 1.1])).flat(), ['bois', 2.8, 0.15, 2.8, 0, 3.1, 0, null, 1],
      ['cabine', 2.3, 1.9, 0.12, 0, 4.1, -1.1], ...paire(sd => ['cabine', 0.12, 1.9, 2.3, sd * 1.1, 4.1, 0]), ['cabine', 2.3, 0.9, 0.12, 0, 3.6, 1.1], ['toit', 3.2, 0.18, 3.2, 0, 5.15, 0, null, 1],
      ['bois', 1, 0.08, 4.2, 0, 1.55, 3, [0.78, 0, 0]], ['bois', 0.08, 3, 0.08, 1.2, 6.6, -1.2], ['drapeau', 0.9, 0.6, 0.03, 1.65, 7.7, -1.2]],
    // filet de beach-volley : deux poteaux, filet tendu le long de X (9 m) ; origine au sol, milieu du filet
    voley: () => [...paire(sd => ['poteau', 0.12, 2.6, 0.12, sd * 4.7, 1.3, 0]), ['filet', 9.4, 0.9, 0.03, 0, 2.0, 0], ['poteau', 9.4, 0.06, 0.05, 0, 2.47, 0]],
    // palétuvier rouge (fiche 7) : tronc court et racines-échasses arquées qui plongent dans l'eau (zone racine) ; la couronne est posée à part (buisson) ; origine au niveau de l'eau, sous le tronc
    mangle: () => [['racine', 0.22, 1.6, 0.22, 0, 1.6, 0, null, 1], ...Array.from({ length: 7 }, (_, k) => { const a = k / 7 * 6.2832, c = Math.cos(a), s = Math.sin(a);
      return [['racine', 0.09, 1.3, 0.09, c * 0.5, 1.1, s * 0.5, [s * 0.6, 0, -c * 0.6]], ['racine', 0.08, 1, 0.08, c * 1.05, 0.35, s * 1.05, [s * 0.25, 0, -c * 0.25]]]; }).flat()],
    // flamant rose (fiche 7) : pattes fines, corps, cou en S (deux pièces), tête et bec noir ; t = 1 tête dans l'eau (il mange) ; la proue vers +X ; origine au sol (sous l'eau de 0,2 m)
    flamant: (t = 0) => [['patte', 0.04, 1.05, 0.04, 0, 0.5, -0.07], ['patte', 0.04, 1.05, 0.04, 0.05, 0.5, 0.07], ['plume', 0.75, 0.38, 0.34, 0, 1.2, 0, [0, 0, 0.1], 1], ['plume', 0.3, 0.2, 0.3, -0.42, 1.23, 0, [0, 0, -0.3]],
      ...(t ? [['plume', 0.09, 0.75, 0.09, 0.45, 0.95, 0, [0, 0, 0.6]], ['plume', 0.18, 0.12, 0.12, 0.62, 0.55, 0], ['bec', 0.14, 0.08, 0.07, 0.72, 0.48, 0]]
        : [['plume', 0.09, 0.55, 0.09, 0.38, 1.55, 0, [0, 0, -0.35]], ['plume', 0.09, 0.4, 0.09, 0.44, 1.95, 0, [0, 0, 0.3]], ['plume', 0.2, 0.13, 0.12, 0.5, 2.18, 0], ['bec', 0.14, 0.08, 0.07, 0.64, 2.12, 0, [0, 0, -0.5]]])],
    // tour d'observation en bois de la lagune (fiche 7) : quatre poteaux de 9 m, deux planchers, garde-corps ; le toit de palapa est posé à part ; origine au sol
    tourObs: () => [...paire(a => paire(b => ['bois', 0.25, 9, 0.25, a * 1.8, 4.5, b * 1.8])).flat(), ['bois', 4.2, 0.2, 4.2, 0, 4, 0, null, 1], ['bois', 4.2, 0.2, 4.2, 0, 8, 0, null, 1],
      ...paire(sd => ['bois', 4.2, 0.9, 0.08, 0, 8.55, sd * 2.05]), ...paire(sd => ['bois', 0.08, 0.9, 4.2, sd * 2.05, 8.55, 0]), ['bois', 5.4, 0.12, 0.9, 0, 2, 2.6, [0, 0, 0.8]]],
    // kayak de location, la proue vers +X ; origine sur l'eau
    kayak: () => [['coque', 3.6, 0.3, 0.7, 0, 0.1, 0], ['coque', 0.7, 0.24, 0.4, 2.0, 0.1, 0], ['siege', 0.5, 0.08, 0.5, -0.2, 0.28, 0], ['siege', 0.06, 0.06, 2.2, 0.2, 0.55, 0, [0, 0.5, 0.2]]],
    // tinaco : réservoir d'eau noir des toits mexicains (fiche 3), cylindre d'1,1 m ; origine au pied
    tinaco: () => { const g = new THREE.CylinderGeometry(0.62, 0.62, 1.2, 10); g.translate(0, 0.6, 0); return g; },
    // panneau de bord de route vers -Z : plaque sur deux poteaux (la plaque porte l'écrit) ; origine au sol
    panneauRoute: (L = 3, H = 1.4) => [...paire(sd => ['poteau', 0.1, 2.4 + H / 2, 0.1, sd * L * 0.35, (2.4 + H / 2) / 2, 0.05]), ['plaque', L, H, 0.08, 0, 2.4 + H / 2, 0]],
    // mototaxi (triporteur à toit de toile), la proue vers +X ; caisse teintée ; origine au sol
    mototaxi: () => [['caisse', 1.6, 0.8, 1.3, -0.3, 0.75, 0, null, 1], ['caisse', 1.1, 0.4, 0.15, 0.75, 0.9, 0], ['toit', 2.1, 0.08, 1.4, -0.2, 2.05, 0], ...paire(sd => ['cadre', 0.05, 1.0, 0.05, -1.2, 1.55, sd * 0.65]),
      ...paire(sd => ['cadre', 0.05, 1.0, 0.05, 0.6, 1.55, sd * 0.65]), ['roue', 0.5, 0.5, 0.15, 0.9, 0.25, 0], ...paire(sd => ['roue', 0.5, 0.5, 0.15, -0.6, 0.25, sd * 0.6])],
    // vélo garé, le long de X ; origine au sol
    velo: () => [...paire(sd => ['roue', 0.68, 0.68, 0.05, sd * 0.52, 0.34, 0]), ['cadre', 1.05, 0.05, 0.05, 0, 0.62, 0, [0, 0, 0.12]], ['cadre', 0.05, 0.55, 0.05, -0.15, 0.62, 0], ['cadre', 0.5, 0.05, 0.05, 0.42, 0.95, 0]],
    // stalagmite : cône pointe en haut, 1 m de haut et 0,5 m de rayon au pied ; origine au sol (fiche 6)
    stalagmite: () => { const g = new THREE.ConeGeometry(0.5, 1, 6); g.translate(0, 0.5, 0); return g; },
    // colonne de grotte (fiche 6) : stalactite et stalagmite soudées, large aux deux bouts, étranglée au milieu, h m ; origine au sol
    colonneGrotte: (h = 7.6) => new THREE.LatheGeometry([[0.01, 0], [1.4, 0], [1.1, 0.12 * h], [0.55, 0.35 * h], [0.32, 0.52 * h], [0.5, 0.66 * h], [1.0, 0.86 * h], [1.6, h]].map(([x, y]) => new THREE.Vector2(x, y)), 8),
    // cône ouvert du rayon de lumière (fiche 6) : 1 m de haut, rayon 1 en bas et 0,7 en haut ; origine en haut (au trou du plafond), il descend
    coneRayon: () => { const g = new THREE.CylinderGeometry(0.7, 1, 1, 14, 1, true); g.translate(0, -0.5, 0); return g; },
    // disque posé à plat, 1 m de rayon : trou de lumière du plafond, tache de soleil au sol ; origine au centre
    disque: () => { const g = new THREE.CircleGeometry(1, 16); g.rotateX(-Math.PI / 2); return g; },
    // bac à ferry de Cozumel, la proue vers +X : coque blanche, bande, deux ponts ; origine à la flottaison
    ferry: () => [['coque', 40, 4, 9, 0, 1, 0], ['bande', 40.2, 0.8, 9.2, 0, 2.2, 0], ['coque', 26, 3, 8, -3, 4.5, 0], ['vitre', 26.2, 1, 8.2, -3, 4.8, 0], ['coque', 12, 2.5, 6, -6, 7.2, 0]],
  });
})();

// Formes de la refonte (propositions/PROPOSITION-plage.md). Les façades regardent -Z (vers la route), X le long de la route. Origine au sol, au milieu.
(function () {
  const paire = f => [-1, 1].map(f), suite = (n, f) => Array.from({ length: n }, (_, k) => f(k, _));
  Object.assign(FORMES, {
    // maison de la Quinta Avenida (DA-8, REFS §3) : 1 ou 2 niveaux, toit plat à acrotère simple, un mur d'une seule couleur (zone mur, teintée), rez-de-chaussée ouvert en boutique
    // sous un auvent, à l'étage des fenêtres à volets et un balcon de bois, enseigne plate en drapeau. L = longueur de façade, H = hauteur, P = profondeur
    maisonQuinta: (L = 10, H = 4.6, P = 9) => {
      const f = -P / 2, et = H > 6, nf = Math.max(2, Math.round(L / 3.4));
      return [['mur', L, H, P, 0, H / 2, 0, null, 1], ['acro', L + 0.3, 0.4, P + 0.3, 0, H + 0.2, 0], ...suite(Math.max(2, Math.round(L / 4)), (k, _, nb = Math.max(2, Math.round(L / 4))) => [['ombre', L / nb - 1, 2.5, 0.3, (k + 0.5) / nb * L - L / 2, 1.35, f - 0.02], ['comptoir', L / nb - 1.6, 0.9, 0.6, (k + 0.5) / nb * L - L / 2, 0.45, f - 0.5], ['marchandise', L / nb - 1.4, 0.8, 0.12, (k + 0.5) / nb * L - L / 2, 2.15, f - 0.22]]).flat(),
        ['auvent', L * 0.84, 0.1, 2.4, 0, 3.1, f - 1.15, [0.2, 0, 0], 1], ['enseigne', 0.1, 0.9, 1.5, L / 2 - 0.7, 4.0, f - 0.85],
        ...(et ? [...suite(nf, k => ['volet', 1.2, 1.5, 0.14, (k + 0.5) / nf * L - L / 2, H - 1.9, f - 0.04]), ['bois', L * 0.84, 0.12, 1.0, 0, H - 3.0, f - 0.5], ['bois', L * 0.84, 0.07, 0.07, 0, H - 2.1, f - 0.97],
          ...suite(nf + 1, k => ['bois', 0.07, 0.9, 0.07, k / nf * L * 0.84 - L * 0.42, H - 2.55, f - 0.97])] : [])];
    },
    // aile de resort (DA-7 : Mahekal, The Reef Playacar) : volume bas et étalé de N niveaux, crépi (zone crepi, teintée), balcons de bois filants à chaque étage, grand toit de palmes à deux pans
    // qui déborde, terrasse couverte de palmes sur poteaux de bois côté plage, muret bas. L = longueur, N = niveaux (2 ou 3)
    resort: (L = 30, N = 2) => {
      const H = N * 3.3, np = Math.max(3, Math.round(L / 5));
      return [['crepi', L, H, 11, 0, H / 2, 4, null, 1], ['chaume', L + 2.4, 0.3, 7.6, 0, H + 1.6, 0.9, [0.48, 0, 0], 1], ['chaume', L + 2.4, 0.3, 7.6, 0, H + 1.6, 7.1, [-0.48, 0, 0], 1],
        ...suite(N, k => ['ombre', L - 2, 2.3, 0.2, 0, k * 3.3 + 1.35, -1.52]), ...suite(N - 1, k => ['bois', L - 1, 0.14, 1.5, 0, (k + 1) * 3.3, -2.2]), ...suite(N - 1, k => ['bois', L - 1, 0.07, 0.07, 0, (k + 1) * 3.3 + 0.95, -2.9]),
        ...suite(N - 1, k => suite(np + 1, j => ['bois', 0.07, 0.95, 0.07, j / np * (L - 1) - (L - 1) / 2, (k + 1) * 3.3 + 0.5, -2.9])).flat(),
        ['chaume', L - 4, 0.25, 6.4, 0, 3.6, -5.6, [0.16, 0, 0], 1], ...suite(np, j => ['bois', 0.24, 3.1, 0.24, (j + 0.5) / np * (L - 4) - (L - 4) / 2, 1.55, -8.3]), ['dalle', L - 2, 0.3, 7.5, 0, 0.15, -5.4],
        ['muret', L, 0.7, 0.4, 0, 0.35, -9.6]];
    },
    // piscine de resort : margelle claire et eau turquoise au ras du sol
    piscine: (L = 14, P = 7) => [['dalle', L + 1.6, 0.25, P + 1.6, 0, 0.12, 0], ['eau', L, 0.1, P, 0, 0.24, 0]],
    // grande roue de la feria (D-1), 24 m de diamètre, à l'arrêt : deux jantes de 20 segments, rayons, dix nacelles aux trois couleurs de la fête, pieds en A. Dans le plan XY
    grandeRoue: () => {
      const R = 11, Y = 13.5, n = 20, l = 2 * R * Math.sin(Math.PI / n) + 0.1, cab = ['cabA', 'cabB', 'cabC'];
      return [...paire(sz => suite(n, k => { const a = (k + 0.5) / n * 6.2832; return ['fer', l, 0.22, 0.22, Math.cos(a) * R * Math.cos(Math.PI / n), Y + Math.sin(a) * R * Math.cos(Math.PI / n), sz * 1.1, [0, 0, a + 1.5708]]; })).flat(),
        ...paire(sz => suite(10, k => { const a = k / 10 * 6.2832; return ['fer', R, 0.1, 0.1, Math.cos(a) * R / 2, Y + Math.sin(a) * R / 2, sz * 1.1, [0, 0, a]]; })).flat(),
        ...suite(10, k => { const a = k / 10 * 6.2832; return [cab[k % 3], 1.5, 1.3, 1.8, Math.cos(a) * R, Y + Math.sin(a) * R - 0.9, 0, null, 1]; }), ['fer', 0.6, 0.6, 3, 0, Y, 0],
        ...paire(sx => paire(sz => ['pied', 0.4, 15.2, 0.4, sx * 3.6, Y / 2 - 0.3, sz * 1.6, [0, 0, sx * 0.26], 1])).flat(), ['pied', 12, 0.5, 5, 0, 0.25, 0]];
    },
    // chapelle blanche de la place (Parque Los Fundadores) : nef basse, fronton à redents, clocher carré à toit rouge et croix, porte sombre
    chapelle: () => [['blanc', 9, 6.5, 15, 0, 3.25, 1, null, 1], ['blanc', 9.4, 2, 0.7, 0, 7.4, -6.2], ['blanc', 5.4, 1.6, 0.7, 0, 9.1, -6.2], ['blanc', 2.2, 1.2, 0.7, 0, 10.4, -6.2], ['ombre', 2.4, 3.6, 0.2, 0, 1.8, -6.62], ['ombre', 1.2, 1.2, 0.2, 0, 5.6, -6.62],
      ['blanc', 3.2, 14, 3.2, 6.6, 7, -4.8, null, 1], ['ombre', 1.4, 2, 3.3, 6.6, 11.6, -4.8], ['ombre', 3.3, 2, 1.4, 6.6, 11.6, -4.8], ['toitR', 3.8, 0.5, 3.8, 6.6, 14.2, -4.8], ['toitR', 2.4, 0.7, 2.4, 6.6, 14.8, -4.8], ['croix', 0.18, 1.8, 0.18, 6.6, 16, -4.8], ['croix', 1, 0.18, 0.18, 6.6, 16.3, -4.8], ['croix', 0.18, 1.6, 0.18, 0, 11.8, -6.2], ['croix', 0.9, 0.18, 0.18, 0, 12.1, -6.2]],
    // château d'eau du bourg (D-1) : cuve sur quatre pieds contreventés, 18 m ; zone texte = le nom peint
    chateauEau: () => [['cuve', 7, 5, 7, 0, 15.5, 0, null, 1], ['cuve', 7.6, 0.4, 7.6, 0, 18.2, 0], ['texte', 6.2, 1.8, 0.1, 0, 15.6, -3.56], ...paire(a => paire(b => ['pied', 0.6, 13, 0.6, a * 2.8, 6.5, b * 2.8, null, 1])).flat(),
      ...paire(b => ['pied', 6, 0.25, 0.25, 0, 5, b * 2.8, [0, 0, 0.6]]), ...paire(b => ['pied', 6, 0.25, 0.25, 0, 9.5, b * 2.8, [0, 0, -0.6]])],
    // antenne rouge et blanche de 30 m
    antenne: () => suite(6, k => [k % 2 ? 'blanc' : 'rouge', 0.7, 5, 0.7, 0, 2.5 + k * 5, 0]),
    // kiosque à musique de la place : socle octogonal approché, huit poteaux, garde-corps ; le toit (cône) est posé à part
    kiosque: () => [['dalle', 8, 1.1, 8, 0, 0.55, 0, null, 1], ['dalle', 9.6, 0.5, 2.4, 0, 0.25, -4.6], ...suite(8, k => { const a = (k + 0.5) / 8 * 6.2832; return ['fer', 0.2, 3.6, 0.2, Math.cos(a) * 3.7, 2.9, Math.sin(a) * 3.7]; }), ['fer', 7.8, 0.12, 7.8, 0, 4.7, 0]],
    // scène de la feria : plateau, portique de tubes, toit, deux murs d'enceintes, fond de scène (zone texte)
    scene: () => [['noir', 14, 1.3, 8, 0, 0.65, 0, null, 1], ...paire(a => paire(b => ['fer', 0.3, 7, 0.3, a * 6.8, 4.8, b * 3.8])).flat(), ['fer', 14.4, 0.5, 8.4, 0, 8.4, 0, null, 1], ['texte', 12.4, 4.4, 0.2, 0, 5, 3.6], ...paire(a => ['noir', 1.8, 4.2, 1.6, a * 8.4, 2.1, -2.6, null, 1])],
    // manège (carrousel) à l'arrêt : socle, mât, plateau haut ; le toit rayé (cône) est posé à part
    manege: () => [['dalle', 10, 0.6, 10, 0, 0.3, 0], ['fer', 0.8, 5, 0.8, 0, 2.8, 0], ['cabA', 10, 0.5, 10, 0, 5.2, 0, null, 1], ...suite(8, k => { const a = k / 8 * 6.2832; return [['cabA', 'cabB', 'cabC'][k % 3], 0.9, 1.3, 1.8, Math.cos(a) * 3.6, 1.6, Math.sin(a) * 3.6, [0, -a, 0]]; })],
    // pick-up garé (cabine vers +X) ; zone caisse teintée
    pickup: () => [['caisse', 5, 0.8, 1.9, 0, 0.85, 0, null, 1], ['caisse', 1.9, 0.75, 1.8, 0.7, 1.6, 0], ['vitre', 1.95, 0.5, 1.6, 0.7, 1.65, 0], ['noir', 2.2, 0.5, 1.95, -1.35, 1.1, 0], ...paire(a => paire(b => ['noir', 0.7, 0.7, 0.3, a * 1.6, 0.35, b * 0.85])).flat()],
    // lampadaire noir de la Quinta et du muelle, 5 m, lanterne
    lampadaire: () => [['fer', 0.16, 5, 0.16, 0, 2.5, 0], ['fer', 0.5, 0.12, 0.5, 0, 5.05, 0], ['lampe', 0.36, 0.5, 0.36, 0, 4.7, 0]],
    // poteau électrique de béton de la 307, 9 m, traverse
    poteauElec: () => [['beton', 0.3, 9, 0.3, 0, 4.5, 0], ['beton', 2.2, 0.14, 0.14, 0, 8.4, 0]],
    // banc de bois
    banc: () => [['bois', 1.8, 0.1, 0.5, 0, 0.45, 0], ['bois', 1.8, 0.5, 0.08, 0, 0.75, 0.24], ...paire(a => ['fer', 0.08, 0.45, 0.5, a * 0.8, 0.22, 0])],
    // palmes en cône à quatre pans (toit de kiosque, de bar, de manège) : rayon 1, hauteur 1, base à y = 0
    toit4: () => { const g = new THREE.ConeGeometry(1, 1, 4, 1, true); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return g; },
    // arbre de la selva : houppier en boule aplatie à facettes, plus large que le buisson
    houppier: () => { const g = new THREE.IcosahedronGeometry(1, 1); g.scale(1, 0.55, 1); g.translate(0, 0.3, 0); return g; },
  });
})();
