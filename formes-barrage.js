// Formes propres à « barrage » : complète le catalogue de formes.js (mêmes conventions : forme simple = géométrie, assemblage = liste de boîtes à zones). Voir METHODE-DECOR.md.
// Chaque forme dit la fiche de docs/REFS-barrage.md qu'elle suit (REFS n°).
(function () {
  const B = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d); g.userData.dim = [w, h, d]; return g; }, paire = f => [-1, 1].map(f);
  const fond = (g, y) => { g.translate(0, y, 0); return g; };
  Object.assign(FORMES, {
    // REFS 2 — jet d'un pertuis de fond (forme simple) : la lame part à l'horizontale du pertuis (origine) vers +Z et retombe en parabole de `chute` m sur `L` m ;
    // deux nappes croisées (à plat, de w0 à w1 m de large ; debout, de 2 à w1 / 2 m d'épaisseur), v = le long du jet (la texture défile)
    gerbe: (L = 70, chute = 14, w0 = 7, w1 = 16) => {
      const P = [], UV = [], I = [], n = 20;
      for (const nappe of [0, 1]) { const b = P.length / 3;
        for (let k = 0; k <= n; k++) { const t = k / n, z = t * L, y = -chute * t * t, w = (nappe ? 4 + (w1 * 0.8 - 4) * t : w0 + (w1 - w0) * t) / 2;
          if (nappe) P.push(0, y - w, z, 0, y + w, z); else P.push(-w, y, z, w, y, z); UV.push(0, t * 4, 1, t * 4);
          if (k < n) { const a = b + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
    },
    // REFS 2 — nuage d'embruns : trois plans croisés de 1 m (mis à l'échelle par instance), centrés à l'origine
    brume: () => { const gs = [0, 1, 2].map(k => { const p = new THREE.PlaneGeometry(1, 1); p.rotateY(k * Math.PI / 3); return p; });
      const P = [], UV = [], I = []; gs.forEach(p => { const b = P.length / 3; P.push(...p.attributes.position.array); UV.push(...p.attributes.uv.array); I.push(...Array.from(p.index.array, i => i + b)); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); return g; },
    // REFS 3 — groupe de la salle des machines : cuve de l'alternateur (10 m de diamètre, 5 m de haut), couvercle conique, collier ; origine au sol
    alternateur: () => fond(new THREE.CylinderGeometry(5, 5, 5, 16), 2.5),
    capot: () => fond(new THREE.CylinderGeometry(2, 5, 1.8, 16), 0.9),
    collier: () => fond(new THREE.CylinderGeometry(5.3, 5.3, 0.6, 16), 0.3),
    excitatrice: () => fond(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 10), 1.2),
    // REFS 3 — couvercle d'un groupe à l'arrêt, au ras du sol (on roule dessus) : disque de 9 m
    couvercle: () => fond(new THREE.CylinderGeometry(4.5, 4.5, 0.12, 16), 0.06),
    // REFS 3 — pont roulant de la halle (X en travers de la halle, L = portée) : poutre double, chariot, cabine suspendue, crochet
    pontRoulant: (L = 50) => [['acier', L, 1.8, 1.2, 0, 0, -1.6, null, 1], ['acier', L, 1.8, 1.2, 0, 0, 1.6], ...paire(sd => ['acier', 2, 1.6, 8, sd * L / 2, 0, 0]),
      ['chariot', 6, 1.8, 5, -8, 1.8, 0], ['cabine', 3, 2.4, 3, L / 2 - 4, -2.4, 0], ['cable', 0.25, 9, 0.25, -8, -4.5, 0], ['crochet', 1.4, 1.2, 0.7, -8, -9.5, 0]],
    // REFS 5 — portique roulant de la crête, jaune-orange, sur rails (X en travers de la route, origine au milieu) : deux palées en dehors des parapets, poutre caisson, treuil, cabine ; W = demi-largeur
    portiqueVanne: (W = 9) => [...paire(sd => [['acier', 1.6, 16, 2.4, sd * (W + 3), 8, -3.5, null, 1], ['acier', 1.6, 16, 2.4, sd * (W + 3), 8, 3.5, null, 1], ['acier', 1.2, 1, 9, sd * (W + 3), 6, 0],
      ['acier', 2.8, 1, 10, sd * (W + 3), 0.5, 0], ['roue', 1, 1, 1, sd * (W + 3), 0.5, -4.4], ['roue', 1, 1, 1, sd * (W + 3), 0.5, 4.4]]).flat(),
      ['acier', 2 * W + 9, 2.4, 3, 0, 17, -3.2, null, 1], ['acier', 2 * W + 9, 2.4, 3, 0, 17, 3.2], ['treuil', 6, 3, 8, -W + 4, 19.6, 0], ['cabine', 2.6, 2.4, 2.6, W + 3, 14, 4.6], ['vitre', 2.7, 1, 2.7, W + 3, 14.4, 4.6]],
    // REFS 6 — poutre-treillis latérale du pont, le long de X (L m) : membrures haute et basse, montants et diagonales tous les 10 m
    treillisPont: (L = 160, H = 7) => { const B = [['acier', L, 0.8, 0.7, 0, 0.4, 0], ['acier', L, 0.7, 0.7, 0, H, 0, null, 1]];
      for (let x = -L / 2; x <= L / 2 + 0.1; x += 10) { B.push(['acier', 0.5, H, 0.5, x, H / 2, 0]); if (x < L / 2) B.push(['acier', 0.4, Math.hypot(10, H), 0.4, x + 5, H / 2, 0, [0, 0, ((x / 10 | 0) & 1 ? 1 : -1) * Math.atan2(10, H)]]); } return B; },
    // REFS 4 — pylône de 500 kV en portique (X = le long des câbles en travers, origine au pied) : deux jambes en treillis évasées, traverse de 30 m, trois chaînes d'isolateurs, deux pointes de garde
    pyloneGES: () => [...paire(sd => [['treillis', 2.2, 34, 2.2, sd * 9.5, 17, 0, [0, 0, sd * 0.09], 1], ['treillis', 1.6, 34, 1.6, sd * 9.5, 17, 0, [0.16, 0, sd * 0.09]], ['treillis', 1.6, 34, 1.6, sd * 9.5, 17, 0, [-0.16, 0, sd * 0.09]]]).flat(),
      ['treillis', 32, 2.6, 2.2, 0, 35, 0, null, 1], ['treillis', 20, 1.4, 1.4, 0, 31.5, 0], ...paire(sd => ['treillis', 1, 6, 1, sd * 14, 39, 0, [0, 0, -sd * 0.25]]),
      ...[-12, 0, 12].map(x => ['isol', 0.5, 4.5, 0.5, x, 31.3, 0]), ['feu', 0.7, 0.7, 0.7, -14.7, 42, 0]],
    // REFS 4 — portique d'arrivée du poste (X en travers, origine au pied) : deux poteaux et une traverse en treillis de 24 m, trois isolateurs
    portiquePoste: () => [...paire(sd => ['treillis', 1.4, 20, 1.4, sd * 12, 10, 0, null, 1]), ['treillis', 26, 1.6, 1.4, 0, 20, 0], ...[-7, 0, 7].map(x => ['isol', 0.4, 3, 0.4, x, 17.8, 0])],
    // REFS 4 — transformateur de groupe (X = le long) : cuve, radiateurs en ailettes, conservateur, trois traversées, socle
    transfo: () => [['socle', 12, 1, 8, 0, 0.5, 0], ['cuve', 8, 6, 5, 0, 4, 0, null, 1], ...[-3, -1, 1, 3].flatMap(x => paire(sd => ['ailette', 1.4, 5, 0.4, x, 4, sd * 2.9])),
      ['cuve', 6, 1.4, 1.4, -1, 8.2, -1.6], ...[-2.5, 0, 2.5].map(x => ['isol', 0.5, 3.6, 0.5, x, 8.8, 1]), ['plaque', 1.6, 1, 0.05, 0, 4, 2.53]],
    // REFS 4 — disjoncteur et sectionneur du poste : colonnes d'isolateurs sur un châssis
    disjoncteur: () => [['chassis', 5, 2.4, 0.4, 0, 1.2, 0], ...[-2, 0, 2].flatMap(x => [['isol', 0.45, 4, 0.45, x, 4.4, 0], ['chassis', 0.9, 0.6, 0.9, x, 6.6, 0]])],
    // REFS 7 — khrouchtchevka : barre de 5 étages (w × 15 × 12 m), toit plat, auvents d'entrée côté +Z ; la façade est une seule texture de 15 m
    barre: (w = 60, H = 15) => [['facade', w, H, 12, 0, H / 2, 0, null, 1], ['toit', w + 0.6, 0.6, 12.6, 0, H + 0.3, 0], ...Array.from({ length: Math.round(w / 15) }, (_, k) => ['auvent', 3, 0.3, 2, -w / 2 + 7.5 + k * 15, 2.8, 7])],
    // REFS 7 — silo de la centrale à béton du chantier : fût de 12 m de diamètre, 22 m de haut
    silo: () => fond(new THREE.CylinderGeometry(6, 6, 22, 14), 11),
    // REFS 7 — mélèze (cône sombre et étroit) et bouleau (fût blanc, houppier clair) : formes simples, posées en nombre
    meleze: () => fond(new THREE.ConeGeometry(2.4, 14, 6), 8),
    pied: () => B(0.4, 2, 0.4),
    futBouleau: () => fond(B(0.32, 8, 0.32), 4),
    houppierB: () => fond(new THREE.IcosahedronGeometry(2.6, 0), 8),
    // REFS 1 — bloc de roche anguleux (dodécaèdre aplati), enrochement des berges et éboulis
    rocherGES: () => new THREE.DodecahedronGeometry(1, 0),
    // REFS 5 — lampadaire de la crête : fût, crosse vers la route (+X), lanterne
    lampadaireGES: () => [['fut', 0.3, 9, 0.3, 0, 4.5, 0], ['fut', 2.4, 0.2, 0.2, 1.1, 9, 0], ['lampe', 0.9, 0.3, 0.5, 2.1, 8.8, 0]],
    // borne de bord de route soviétique : plot de béton blanc à bande noire
    borneGES: () => B(0.35, 0.9, 0.35),
    // REFS 8 — portail de la galerie (X en travers, origine au milieu de la chaussée, face vers -Z) : piédroits, linteau à bandes orange, front de roche au-dessus
    portailGES: (W = 9) => [...paire(sd => ['beton', 3, 12, 4, sd * (W + 3), 6, 0, null, 1]), ['beton', 2 * W + 9, 3, 4, 0, 11.5, 0], ['bande', 2 * W + 2, 1.2, 0.1, 0, 10.6, 2.06], ['numero', 5, 1.4, 0.1, 0, 12, 2.06], ['roche', 2 * W + 34, 16, 10, 0, 19, -6]],
    // REFS 5 — cabine de garde de la crête et de la vallée : maisonnette de béton, auvent, fenêtre éclairée
    cabane: () => [['beton', 4, 3, 3.4, 0, 1.5, 0, null, 1], ['toit', 5, 0.3, 4.2, 0, 3.15, 0], ['vitre', 1.6, 1, 0.1, 0, 1.8, 1.72]],
    // REFS 5 — tour de commande sur la culée : fût, salle vitrée, toit, antenne
    tourControle: () => [['beton', 7, 24, 7, 0, 12, 0, null, 1], ['vitre', 10, 4, 10, 0, 26, 0], ['beton', 11, 1, 11, 0, 28.5, 0], ['acier', 0.4, 12, 0.4, 2, 35, 2]],
    // REFS 7 — berline garée des années 70 (X = le long) : caisse, pavillon, vitres
    berline: () => [['caisse', 4.7, 0.9, 1.8, 0, 0.75, 0, null, 1], ['caisse', 2.4, 0.6, 1.6, -0.3, 1.5, 0], ['vitre', 2.3, 0.45, 1.65, -0.3, 1.45, 0], ['pneu', 3.4, 0.6, 1.7, 0, 0.3, 0]],
    // REFS 7 — panneau de route sur deux poteaux (face vers -Z), 4 × 2 m
    panneauGES: () => [...paire(sd => ['poteau', 0.15, 3.6, 0.15, sd * 1.6, 1.8, 0]), ['plaque', 4, 2, 0.08, 0, 3.4, 0]],
    // REFS 7 — abri de bus en béton, mosaïque au fond (face vers +Z)
    abriBus: () => [['beton', 7, 0.4, 3, 0, 3, 0], ['mosaique', 7, 2.8, 0.3, 0, 1.4, -1.3], ...paire(sd => ['beton', 0.3, 2.8, 2.6, sd * 3.4, 1.4, 0]), ['banc', 4, 0.5, 0.6, 0, 0.5, -0.8]],
  });
})();
