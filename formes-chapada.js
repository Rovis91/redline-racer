// Formes propres à « chapada » (Manuscrit 512, la cité perdue) : complète le catalogue de formes.js. Voir METHODE-DECOR.md.
// Sauf mention, X = en travers de la route (ou en s'éloignant d'elle), Z = le long de la route, origine au pied de l'objet.
(function () {
  const paire = f => [-1, 1].map(f);
  Object.assign(FORMES, {
    fougereArbo: (h = 1) => [['stipe', 0.35 * h, 5 * h, 0.35 * h, 0, 2.5 * h, 0], ...Array.from({ length: 5 }, (_, k) => { const a = k / 5 * 6.2832;
      return ['fronde', 3.4 * h, 0.08, 0.9 * h, Math.cos(a) * 1.5 * h, 4.9 * h, Math.sin(a) * 1.5 * h, [0, -a, -0.35 - (k % 2) * 0.25]]; })],
    cime: () => { const p = new THREE.IcosahedronGeometry(3.4, 0).attributes.position, vu = new Map(), pos = [], uv = [], idx = [];
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = [x, y, z].map(v => v.toFixed(3)).join(); let j = vu.get(k);
        if (j === undefined) { vu.set(k, j = pos.length / 3); pos.push(x, y, z); uv.push(Math.atan2(z, x) / 6.2832 + 0.5, y / 6.8 + 0.5); } idx.push(j); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; },
    touffe: () => { const g = new THREE.ConeGeometry(0.55, 1, 5, 1, true); g.translate(0, 0.5, 0); return g; }, // sans fond : on ne le voit jamais
    cimeLoin: () => { const g = new THREE.OctahedronGeometry(3.6, 0), p = g.attributes.position, vu = new Map(), pos = [], uv = [], idx = [];
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = [x, y, z].map(v => v.toFixed(3)).join(); let j = vu.get(k);
        if (j === undefined) { vu.set(k, j = pos.length / 3); pos.push(x, y, z); uv.push(Math.atan2(z, x) / 6.2832 + 0.5, y / 7.2 + 0.5); } idx.push(j); }
      const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setIndex(idx); G.computeVertexNormals(); return G; },
    rocher: () => { const g = new THREE.BoxGeometry(2, 1.6, 2, 1, 1, 1), p = g.attributes.position; // une boîte aux coins tirés au hasard (fixe), le dessus plus étroit : un bloc anguleux (les dodécaèdres se lisaient comme des hexagones)
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = Math.sin(x * 12.9 + y * 78.2 + z * 37.7) * 43758.5, u = k - Math.floor(k);
        p.setXYZ(i, x * (y > 0 ? 0.7 + 0.3 * u : 1 - 0.2 * u), y * (0.8 + 0.4 * u), z * (y > 0 ? 0.65 + 0.35 * (1 - u) : 1)); }
      g.computeVertexNormals(); return g; },
    fougereBasse: () => Array.from({ length: 4 }, (_, k) => { const a = k / 4 * 6.2832 + 0.4; return ['fronde', 1.8, 0.05, 0.45, Math.cos(a) * 0.8, 0.45, Math.sin(a) * 0.8, [0, -a, 0.55]]; }),
    troncCouche: (l = 10) => [['bois', l, 0.8, 0.8, 0, 0.4, 0, [0, 0, 0.04]], ['bois', 0.3, 1.6, 0.3, l * 0.2, 1, 0.2, [0.3, 0, -0.4]], ['bois', 0.25, 1.2, 0.25, -l * 0.25, 0.9, -0.2, [-0.4, 0, 0.3]]],
    // palmier juçara (Euterpe edulis) : fût fin de 10 m, couronne de palmes courbes qui montent puis retombent (h = taille)
    jucara: (h = 1) => [['stipe', 0.3 * h, 10 * h, 0.3 * h, 0, 5 * h, 0], ...Array.from({ length: 7 }, (_, k) => { const a = k / 7 * 6.2832, c = Math.cos(a), s = Math.sin(a);
      return [['palme', 3 * h, 0.06, 0.9 * h, c * 1.4 * h, 10.4 * h, s * 1.4 * h, [0, -a, 0.4]], ['palme', 2.6 * h, 0.06, 0.8 * h, c * 3.7 * h, 10.2 * h, s * 3.7 * h, [0, -a, -0.75]]]; }).flat()],
    // touffe de grandes feuilles (bananier, héliconia) : cinq feuilles dressées qui s'ouvrent ; fleur = hampe rouge au milieu (une forme lisible à 200 km/h, pas un détail)
    grandeFeuille: (h = 1, fleur = 0) => [...Array.from({ length: 5 }, (_, k) => { const a = k / 5 * 6.2832 + 0.3; return ['feuille', 2.8 * h, 0.05, 1 * h, Math.cos(a) * 0.9 * h, 1.35 * h, Math.sin(a) * 0.9 * h, [0, -a, 0.95]]; }),
      ...(fleur ? [['fleur', 0.3 * h, 1.1 * h, 0.3 * h, 0, 2.3 * h, 0, [0, 0.6, 0.15]], ['fleur', 0.5 * h, 0.25 * h, 0.2 * h, 0.15 * h, 2.6 * h, 0, [0, 0.6, 0.5]]] : [])],
    // rideau de lianes : des brins qui pendent d'une branche, de longueurs inégales (origine en haut ; l = longueur du plus long)
    lianes: (l = 6) => [['liane', 5, 0.14, 0.14, 0, 0, 0, [0, 0, 0.06]], ...[[-2.1, 1], [-1.2, 0.55], [-0.3, 0.8], [0.7, 0.45], [1.5, 0.95], [2.2, 0.6]].map(([x, f]) => ['liane', 0.12, l * f, 0.12, x, -l * f / 2, 0, [0, 0, x * 0.02]])],
    // torche de l'expédition : un piquet, une coupe, la flamme (lumineuse)
    torche: () => [['bois', 0.14, 2.3, 0.14, 0, 1.15, 0], ['fer', 0.5, 0.22, 0.5, 0, 2.35, 0], ['flamme', 0.34, 0.5, 0.34, 0, 2.7, 0], ['flamme', 0.18, 0.4, 0.18, 0.03, 3.05, 0, [0, 0.7, 0]]],
    // le marais : racines-échasses d'un arbre qui a les pieds dans l'eau (huit arceaux autour du fût) ; nénuphar géant (vitória-régia), un disque à plat sur l'eau
    racinesEchasses: (k = 1) => Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.2832 + 0.3, c = Math.cos(a), s = Math.sin(a); return ['bois', 3.6 * k, 0.32 * k, 0.32 * k, c * 1.5 * k, 1.5 * k, s * 1.5 * k, [0, -a, -0.8]]; }),
    nenuphar: () => new THREE.CylinderGeometry(1, 1, 0.06, 9),
    // ---------- le camp de l'expédition (O-10) ----------
    // portique de départ en bambou (th.depart[4], mêmes zones que « depart » de formes.js : sol, damier, beton, acier, nom, boitier, feu0-2, lampe) ; la ligne fait la largeur du camp (2 W de demi-largeur)
    departJungle: W => { const xp = 2 * W + 1.4, L = 2 * xp + 1.4;
      return [['sol', 2 * xp - 2.4, 0.06, 4, 0, 0, 0],
        ...paire(sd => [['beton', 2.2, 0.8, 2.6, sd * xp, 0.4, 0], ...paire(b => ['acier', 0.34, 9.6, 0.34, sd * xp, 4.8, b * 0.7, [b * 0.05, 0, 0]]), ['acier', 0.3, 3.6, 0.3, sd * (xp - 1.2), 6.3, 0, [0, 0, sd * 0.75]]]).flat(),
        ...paire(b => [['acier', L, 0.3, 0.3, 0, 7.5, b * 0.7], ['acier', L, 0.26, 0.26, 0, 9.3, b * 0.6]]).flat(),
        ['nom', 2 * W + 3, 1.5, 0.3, 0, 8.4, 0], ['damier', L - 3, 0.4, 0.12, 0, 7.05, 0],
        ...paire(sz => [['boitier', 5.6, 1.2, 0.2, 0, 6.2, sz * 0.2], ...[-1, 0, 1].map(i => ['feu' + (i + 1), 0.9, 0.9, 0.1, i * 1.7, 6.2, sz * 0.35])]).flat(),
        ...paire(sx => ['lampe', 0.45, 0.55, 0.45, sx * (xp - 2.6), 6.6, 0])]; },
    tente: () => [...paire(sd => ['toile', 3.3, 0.08, 6, sd * 1.08, 1.25, 0, [0, 0, -sd * 0.86]]), ['toile', 2.5, 1.5, 0.08, 0, 0.75, -3], ...paire(b => ['bois', 0.12, 2.7, 0.12, 0, 1.35, b * 3]), ['bois', 0.1, 0.1, 6.4, 0, 2.6, 0]],
    caisses: () => [['bois', 1.3, 0.8, 0.9, 0, 0.4, 0], ['bois', 1.1, 0.7, 0.8, 1.1, 0.35, 0.5, [0, 0.4, 0]], ['bois', 1, 0.7, 0.8, 0.2, 1.15, 0.1, [0, 0.2, 0]], ['toile', 1.6, 0.5, 1, -1.5, 0.25, 0.2, [0, -0.3, 0]]],
    tableCartes: () => [['bois', 2, 0.08, 1.2, 0, 0.9, 0], ...paire(a => paire(b => ['bois', 0.08, 0.9, 0.08, a * 0.9, 0.45, b * 0.5])).flat(), ['papier', 1.3, 0.03, 0.9, 0.1, 0.96, 0, [0, 0.2, 0]], ['lampe', 0.22, 0.34, 0.22, -0.7, 1.12, 0.3]],
    quatreQuatre: () => [['caisse', 4.3, 0.9, 1.9, 0, 1.05, 0], ['caisse', 1.7, 0.85, 1.8, 0.45, 1.95, 0], ['toile', 2.1, 1.05, 1.86, -1.05, 2.05, 0], ['vitre', 0.08, 0.6, 1.6, 1.32, 1.98, 0],
      ...paire(a => paire(b => ['pneu', 0.95, 0.95, 0.36, a * 1.4, 0.48, b * 0.95])).flat(), ...paire(b => ['lampe', 0.1, 0.24, 0.3, 2.17, 1.15, b * 0.65]), ['pneu', 0.3, 0.9, 0.9, -2.3, 1.3, 0]],
    matRadio: () => [['fer', 0.16, 12, 0.16, 0, 6, 0], ...[4, 7.5, 11].map(y => ['lampe', 0.36, 0.46, 0.36, 0.3, y, 0]), ...paire(sd => ['fer', 0.05, 13.5, 0.05, sd * 3, 5.6, 0, [0, 0, sd * 0.47]])],
    // échafaudage de bambou de l'expédition (l = longueur, n = niveaux de 2,4 m)
    echafaudage: (l = 6, n = 2) => [...Array.from({ length: Math.round(l / 2) + 1 }, (_, i) => paire(b => ['bambou', 0.14, n * 2.4 + 0.6, 0.14, -l / 2 + i * 2, n * 1.2 + 0.3, b * 0.7])).flat(),
      ...Array.from({ length: n }, (_, k) => [['planche', l, 0.08, 1.3, 0, (k + 1) * 2.4, 0], ['bambou', l + 0.6, 0.1, 0.1, 0, (k + 1) * 2.4 + 1, 0.7], ['bambou', 3.4, 0.1, 0.1, (k % 2 ? 1 : -1) * l / 4, k * 2.4 + 1.2, -0.7, [0, 0, (k % 2 ? 1 : -1) * 0.78]]]).flat()],
    barque: () => [['bois', 4.6, 0.45, 1.3, 0, 0.3, 0], ...paire(b => ['bois', 4.8, 0.4, 0.1, 0, 0.65, b * 0.66]), ['bois', 0.2, 0.3, 1.2, 0.8, 0.6, 0], ['bois', 3.2, 0.08, 0.14, -0.4, 0.9, 0.2, [0, 0.3, 0.1]]],
    // ---------- le fromager (sumaúma) de la chicane (O-11) : fût énorme, contreforts en ailettes, grosses branches ; le houppier est posé par le décor ----------
    fromager: (k = 1) => [['bois', 5 * k, 15 * k, 5 * k, 0, 7.5 * k, 0], ['bois', 4.2 * k, 14 * k, 4.2 * k, 0, 21 * k, 0, [0, 0.5, 0]], ['bois', 3.2 * k, 9 * k, 3.2 * k, 0, 32 * k, 0, [0, 0.2, 0]],
      ...Array.from({ length: 7 }, (_, i) => { const a = i / 7 * 6.2832 + 0.2, c = Math.cos(a), s = Math.sin(a);
        return [['bois', 3 * k, 10 * k, 0.6 * k, c * 3.6 * k, 5 * k, s * 3.6 * k, [0, -a, 0]], ['bois', 3 * k, 5 * k, 0.55 * k, c * 6.3 * k, 2.5 * k, s * 6.3 * k, [0, -a, 0]], ['bois', 3 * k, 2 * k, 0.5 * k, c * 9 * k, 1 * k, s * 9 * k, [0, -a, 0]]]; }).flat(),
      ...Array.from({ length: 5 }, (_, i) => { const a = i / 5 * 6.2832; return ['bois', 12 * k, 1.5 * k, 1.5 * k, Math.cos(a) * 5.5 * k, 38 * k, Math.sin(a) * 5.5 * k, [0, -a, 0.45]]; }),
      ['planche', 5, 0.2, 5, 4.4 * k, 17, 0], ...paire(b => ['corde', 0.1, 17, 0.1, 6.6 * k, 8.5, b * 0.4]), ...Array.from({ length: 16 }, (_, i) => ['corde', 0.08, 0.08, 0.8, 6.6 * k, 1 + i, 0])],
    // ---------- les pierres de la cité (D-10) : arcs en plein cintre, obélisques, socles, statues ; face vers +Z ----------
    // arc en plein cintre : n claveaux sur un demi-cercle de rayon R (épaisseur ep, profondeur prof), naissances à la hauteur y0
    arc: (R, ep = 1.2, prof = 3, n = 9, y0 = 0, x0 = 0, z0 = 0, zone = 'clair') => Array.from({ length: n }, (_, k) => { const a = Math.PI * (k + 0.5) / n;
      return [zone, Math.PI * (R + ep) / n * 1.04, ep, prof, x0 + Math.cos(a) * (R + ep / 2), y0 + Math.sin(a) * (R + ep / 2), z0, [0, 0, a - Math.PI / 2]]; }),
    obelisque: (H = 9) => [['pierre', 1.8, 0.8, 1.8, 0, 0.4, 0], ['pierre', 1.15, H * 0.55, 1.15, 0, 0.8 + H * 0.275, 0], ['pierre', 0.9, H * 0.35, 0.9, 0, 0.8 + H * 0.725, 0], ['pierre', 0.55, H * 0.1, 0.55, 0, 0.8 + H * 0.95, 0, [0, 0.785, 0]]],
    statueDebout: (t = 1) => [['pierre', 1.3 * t, 0.5 * t, 1.3 * t, 0, 0.25 * t, 0], ['pierre', 0.9 * t, 1.1 * t, 0.6 * t, 0, 1.05 * t, 0], ['pierre', 1.15 * t, 1 * t, 0.7 * t, 0, 2.1 * t, 0], ['pierre', 0.7 * t, 0.7 * t, 0.7 * t, 0, 2.95 * t, 0],
      ['pierre', 0.95 * t, 0.25 * t, 0.95 * t, 0, 3.42 * t, 0], ...paire(sd => ['pierre', 0.26 * t, 0.9 * t, 0.4 * t, sd * 0.7 * t, 2.1 * t, 0.1 * t])],
    // la tête colossale (5 m) : yeux incrustés d'or
    teteColossale: () => [['pierre', 5, 5.2, 4.6, 0, 2.6, 0], ['pierre', 5.6, 1.3, 5.2, 0, 5.75, 0], ['pierre', 5.3, 0.7, 0.8, 0, 3.95, 2.3], ['pierre', 1, 1.9, 0.9, 0, 2.85, 2.55], ['ombre', 2.3, 0.45, 0.4, 0, 1.3, 2.25],
      ...paire(sd => [['or', 0.95, 0.5, 0.2, sd * 1.25, 3.3, 2.32], ['pierre', 0.6, 2, 1.1, sd * 2.8, 2.8, 0], ['ombre', 1.3, 0.9, 0.3, sd * 1.25, 3.3, 2.2]]).flat()],
    // la grande idole assise (7 m), un disque d'or entre les mains
    idoleAssise: () => [['pierre', 6.4, 1.2, 6.4, 0, 0.6, 0], ['pierre', 5.6, 1.5, 3.8, 0, 1.95, 0.8], ['pierre', 3.7, 3.1, 2.7, 0, 4.2, -0.3], ['pierre', 2.5, 2.2, 2.3, 0, 6.85, -0.2], ['pierre', 3, 0.8, 2.8, 0, 8.3, -0.2],
      ...paire(sd => [['pierre', 0.9, 2.5, 1.1, sd * 2.25, 3.9, 0.2], ['or', 0.42, 0.26, 0.1, sd * 0.58, 7.05, 0.96], ['pierre', 0.5, 0.9, 0.6, sd * 1.45, 6.8, -0.2]]).flat(), ['or', 1.3, 1.3, 0.3, 0, 3.5, 1.35], ['ombre', 1.2, 0.3, 0.2, 0, 6.2, 0.95]],
    // la statue de la place, sur son socle noir : debout, un disque d'or tenu contre la poitrine, laurier doré (plus de bras tendu)
    statueNord: () => [['socle', 3.4, 4, 3.4, 0, 2, 0], ['socle', 4, 0.45, 4, 0, 4.2, 0], ['socle', 4.4, 0.5, 4.4, 0, 0.25, 0], ['pierre', 1.1, 1.8, 0.8, 0, 5.3, 0], ['pierre', 1.35, 1.5, 0.9, 0, 6.95, 0], ['pierre', 0.8, 0.8, 0.8, 0, 8.1, 0],
      ['or', 0.95, 0.16, 0.95, 0, 8.46, 0], ['pierre', 1.75, 0.36, 0.5, 0, 6.9, 0.45], ['or', 0.85, 0.85, 0.14, 0, 6.95, 0.75], ...paire(sd => ['pierre', 0.3, 0.9, 0.36, sd * 0.82, 7.1, 0.15])],
    // le temple à degrés du fond de la place (à la place de la colonnade antique) : cinq gradins, un escalier axial, le sanctuaire en haut, sa porte, sa crête ; face vers +Z
    templeDegres: () => [...[[36, 0], [29, 1], [22, 2], [15, 3], [9.5, 4]].map(([w, k]) => ['pierre', w, 3.2, w, 0, 1.6 + k * 3.2, 0]), ...[[36, 0], [29, 1], [22, 2], [15, 3]].map(([w, k]) => ['clair', w + 0.6, 0.4, w + 0.6, 0, 3.2 + k * 3.2, 0]),
      ['clair', 5.4, 0.7, 23, 0, 7.9, 9.6, [0.76, 0, 0]], ...paire(sd => ['ombre', 0.8, 1.4, 23, sd * 3.1, 8.3, 9.6, [0.76, 0, 0]]),
      ['pierre', 7.4, 4.6, 6.4, 0, 18.3, -0.6], ['noir', 2.4, 3.2, 0.3, 0, 17.6, 2.65], ['clair', 8.2, 0.6, 7.2, 0, 20.9, -0.6], ['pierre', 5.6, 3.4, 1.6, 0, 22.9, -0.6], ['or', 1.5, 1.5, 0.2, 0, 22.9, 0.3],
      ...paire(sd => [['relief', 1.6, 2.6, 0.3, sd * 2.6, 17.4, 2.65], ['ombre', 3, 2.4, 3, sd * 5.4, 1.2, 19.2]]).flat()],
    // un feu de camp : cercle de pierres, bûches, flamme
    feuCamp: () => [...Array.from({ length: 7 }, (_, i) => ['pierre', 0.45, 0.3, 0.45, Math.cos(i * 0.9) * 0.9, 0.15, Math.sin(i * 0.9) * 0.9, [0, i, 0]]), ['bois', 1.3, 0.2, 0.2, 0, 0.2, 0, [0, 0.5, 0.2]], ['bois', 1.3, 0.2, 0.2, 0, 0.25, 0, [0, 2, -0.2]], ['flamme', 0.5, 0.7, 0.5, 0, 0.6, 0], ['flamme', 0.25, 0.5, 0.25, 0.05, 1.1, 0, [0, 0.7, 0]]],

    // l'arc triple de l'entrée de la cité : arche centrale (demi-ouverture R) pour la route, deux petites, attique à inscriptions
    arcTriple: (R = 7.5) => { const A = FORMES.arc, pw = 3.6, r = 3, xs = R + pw + r, xe = xs + r + 1.6, top = R + 6.5;
      return [...paire(sd => [['pierre', pw, top, 5, sd * (R + pw / 2), top / 2, 0], ['pierre', 3.2, top, 5, sd * xe, top / 2, 0], ['pierre', 2 * r, top - 6.4, 5, sd * xs, 6.4 + (top - 6.4) / 2, 0],
          ['pierre', 2.4, 2.6, 4.6, sd * (R - 1.2), top - 1.3, 0], ...A(r, 0.8, 5.3, 7, 3.2, sd * xs), ['clair', 1.2, top, 0.5, sd * (R + pw / 2), top / 2, 2.6]]).flat(),
        ...A(R, 1.3, 5.4, 11, 5), ['pierre', 2 * (xe + 1.6), 3.6, 5, 0, top + 1.8, 0], ['clair', 2 * (xe + 2), 0.7, 5.8, 0, top + 0.1, 0], ['clair', 2 * (xe + 2), 0.6, 5.6, 0, top + 3.7, 0],
        ...paire(b => ['inscription', 22, 2.2, 0.15, 0, top + 1.8, b * 2.55])]; },
    // le grand édifice à colonnade et reliefs (côté sud de la place)
    edifice: () => [['pierre', 40, 0.5, 9, 0, 0.25, 0], ['pierre', 38, 0.5, 7, 0, 0.75, 0], ...Array.from({ length: 8 }, (_, i) => [['clair', 1.4, 8, 1.4, -15.75 + i * 4.5, 5, 2], ['clair', 1.9, 0.5, 1.9, -15.75 + i * 4.5, 9.2, 2]]).flat(),
      ['pierre', 37, 1.6, 3.2, 0, 10.2, 2], ['pierre', 31, 1.2, 2.8, 0, 11.6, 2], ['pierre', 21, 1.2, 2.8, 0, 12.8, 2], ['pierre', 11, 1, 2.8, 0, 13.9, 2], ['ombre', 36, 9.6, 1.2, 0, 5.8, -1.6], ['noir', 4.4, 6.4, 0.3, 0, 4.2, -0.9],
      ...paire(sd => [['relief', 6, 3.2, 0.25, sd * 9.5, 6, -0.9], ['relief', 2, 4.4, 0.25, sd * 14.5, 5.2, -0.9]]).flat()],
    // la façade du temple taillée dans la falaise, autour du portail de la grotte (w = demi-largeur du passage, H = hauteur sous clé) : arc en plein cintre, figure couronnée de laurier au-dessus
    facadeTemple: (w = 6.5, H = 9) => { const R = w + 0.3, y0 = H - R, T = 30;
      return [...paire(sd => [['pierre', 26, T, 4, sd * (R + 13), T / 2, 0], ['ombre', 2.2, 2.6, 3.6, sd * (R - 1.1), H - 0.9, 0], ['clair', 2.2, 17, 1, sd * (R + 3.4), 8.5, 2.3], ['clair', 3, 1, 1.6, sd * (R + 3.4), 17.5, 2.3]]).flat(),
        ['pierre', 2 * R, T - H - 0.4, 4, 0, H + 0.4 + (T - H - 0.4) / 2, 0], ...FORMES.arc(R, 1.3, 1.2, 11, y0, 0, 2.3), ['clair', 2 * R + 12, 1, 1.4, 0, 18.5, 2.3],
        ['relief', 2.6, 4.2, 0.5, 0, 12.6, 2.2], ['relief', 1.5, 1.5, 0.5, 0, 15.5, 2.2], ['or', 1.9, 0.3, 0.55, 0, 16.25, 2.2], ['relief', 5.4, 0.7, 0.5, 0, 13.8, 2.2], ...paire(sd => ['relief', 0.7, 2, 0.5, sd * 2.6, 12.9, 2.2])]; },
    // ---------- la faune (propositions/VIE-chapada.md §3) : des silhouettes qui se lisent en roulant, la tête vers +X, origine au sol ou aux pattes ----------
    // un oiseau en vol (ara, vautour) : corps, tête, bec, longue queue ; les ailes sont à part (aileOiseau, sur un pivot à l'épaule, pour battre). l = longueur de la queue
    oiseauVol: (l = 1) => [['plume', 0.9, 0.3, 0.32, 0, 0, 0], ['plume', 0.3, 0.28, 0.28, 0.55, 0.06, 0], ['bec', 0.2, 0.14, 0.12, 0.76, 0.02, 0], ['queue', l, 0.08, 0.24, -0.4 - l / 2, 0, 0]],
    aileOiseau: (e = 1.5) => [['plume', 0.55, 0.06, e, 0, 0, e / 2], ['queue', 0.4, 0.05, e * 0.5, -0.1, 0, e * 1.2]], // origine à l'épaule, l'aile part vers +Z
    // singe capucin assis : tronc, tête, museau clair, queue en crochet
    singe: () => [['poil', 0.5, 0.6, 0.45, 0, 0.3, 0], ['poil', 0.34, 0.34, 0.34, 0.1, 0.78, 0], ['face', 0.14, 0.16, 0.2, 0.28, 0.74, 0], ['poil', 0.1, 0.7, 0.1, -0.32, 0.5, 0, [0, 0, 0.3]], ['poil', 0.3, 0.1, 0.1, -0.5, 0.86, 0],
      ...paire(sd => ['poil', 0.14, 0.4, 0.14, 0.22, 0.2, sd * 0.22])],
    // l'onça (jaguar) couchée, la tête relevée : la voiture porte son nom et sa robe
    onca: () => [['robe', 1.7, 0.5, 0.6, 0, 0.3, 0], ['robe', 0.5, 0.42, 0.46, 1, 0.6, 0], ['museau', 0.2, 0.2, 0.3, 1.3, 0.52, 0], ...paire(sd => ['tache', 0.1, 0.14, 0.1, 0.92, 0.86, sd * 0.16]),
      ['robe', 1.1, 0.1, 0.1, -1.3, 0.12, 0.2, [0, 0.4, 0]], ...paire(sd => ['robe', 0.6, 0.16, 0.16, 0.75, 0.1, sd * 0.24]), ['tache', 1.2, 0.06, 0.4, -0.1, 0.57, 0]],
    // toucan perché : corps noir, plastron blanc, grand bec orange
    toucan: () => [['plume', 0.3, 0.5, 0.3, 0, 0.3, 0], ['plume', 0.26, 0.26, 0.26, 0.06, 0.66, 0], ['face', 0.1, 0.3, 0.24, 0.14, 0.42, 0], ['bec', 0.5, 0.14, 0.12, 0.42, 0.66, 0], ['plume', 0.34, 0.06, 0.16, -0.26, 0.14, 0]],
    // caïman (jacaré) au ras de l'eau : le dos, la tête, la queue ; origine à la surface
    jacare: () => [['peau', 1.6, 0.16, 0.5, 0, 0.02, 0], ['peau', 0.8, 0.14, 0.36, 1.1, 0.02, 0], ['peau', 1.4, 0.1, 0.22, -1.4, 0, 0], ...paire(sd => ['oeil', 0.1, 0.1, 0.1, 0.86, 0.12, sd * 0.14])],
    // capybara debout : un tonneau sur quatre pattes courtes
    capivara: () => [['poil', 1.1, 0.55, 0.5, 0, 0.5, 0], ['poil', 0.42, 0.4, 0.4, 0.66, 0.62, 0], ...paire(a => paire(b => ['poil', 0.14, 0.3, 0.14, a * 0.36, 0.15, b * 0.16])).flat()],
  });
})();
