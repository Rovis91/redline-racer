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
