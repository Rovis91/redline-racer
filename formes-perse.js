// Formes propres à « perse » (Route royale) : complète le catalogue de formes.js (mêmes conventions : forme simple = géométrie, assemblage = liste de boîtes à zones). Voir METHODE-DECOR.md.
// Pièces le long de la piste (arcade, étal) : origine au sol au milieu de la façade, X le long de la piste, Z en s'éloignant d'elle.
// Pièces posées sur la route (porte) : repère de la route (repere de decors.js), X en travers, Z vers l'arrière (d'où vient la voiture).
(function () {
  const B = (w, h, d, H = h) => { const g = new THREE.BoxGeometry(w, h, d); g.userData.dim = [w, H, d]; return g; };
  const R45 = [0, Math.PI / 4, 0];
  // REFS §4 : colonne persépolitaine (base en cloche sur plinthe, fût cannelé, couronne de palmes, volutes verticales, double protomé qui porte la poutre) ; H = hauteur sous poutre
  const colonne = (x, z, H) => [['pierre', 2.4, 0.5, 2.4, x, 0.25, z], ['pierre', 2, 1.1, 2, x, 1, z], ['pierre', 2, 1.1, 2, x, 1, z, R45], ['pierre', 1.6, 0.4, 1.6, x, 1.75, z],
    ['fut', 1.2, H - 5.2, 1.2, x, 1.95 + (H - 5.2) / 2, z], ['fut', 1.2, H - 5.2, 1.2, x, 1.95 + (H - 5.2) / 2, z, R45],
    ['sculpte', 1.9, 1, 1.9, x, H - 2.8, z, R45], ['sculpte', 1.3, 1.3, 1.3, x, H - 1.7, z], ['sculpte', 4.6, 1.2, 1.5, x, H - 0.4, z], ['sculpte', 1.1, 1.2, 1.4, x - 2.6, H - 0.1, z], ['sculpte', 1.1, 1.2, 1.4, x + 2.6, H - 0.1, z], ['or', 4.8, 0.25, 1.6, x, H + 0.3, z]];
  Object.assign(FORMES, {
    // REFS §4 : colonne persépolitaine de H m : socle, base en cloche (deux boîtes croisées), fût cannelé octogonal, chapiteau, deux protomés de taureau dos à dos (X), poutre du plafond posée dessus
    colonnePerse: (H = 19) => [['pierre', 2.6, 0.5, 2.6, 0, 0.25, 0], ['pierre', 2, 1.1, 2, 0, 1.05, 0], ['pierre', 2, 1.1, 2, 0, 1.05, 0, R45],
      ['fut', 1.2, H - 6, 1.2, 0, 1.8 + (H - 6) / 2, 0, null, 1], ['fut', 1.2, H - 6, 1.2, 0, 1.8 + (H - 6) / 2, 0, R45], ['sculpte', 2.4, 1, 2.4, 0, H - 4.4, 0, R45], // couronne de palmes (REFS §4)
     
      ['pierre', 2.2, 1.4, 2.2, 0, H - 3.5, 0], ['pierre', 1.6, 1.2, 1.6, 0, H - 2.3, 0, R45],
      ['sculpte', 6.2, 2, 2.2, 0, H - 1, 0, null, 1], ...[-1, 1].flatMap(sd => [['sculpte', 1.8, 1.9, 2, sd * 4.4, H - 0.4, 0], ['sculpte', 1.1, 1.1, 1.3, sd * 5.4, H - 0.7, 0], ['or', 0.3, 0.3, 1.9, sd * 4.9, H + 0.75, 0], ['or', 0.35, 1.1, 0.35, sd * 4.6, H + 1, 0.9], ['or', 0.35, 1.1, 0.35, sd * 4.6, H + 1, -0.9], ['sculpte', 0.9, 2.2, 1, sd * 3, H - 3, 0.5], ['sculpte', 0.9, 2.2, 1, sd * 3, H - 3, -0.5]])],
    // REFS §6 : la Porte des Nations restituée (zones lamTG/lamTD/lamHG/lamHD : reliefs du taureau et du lamassu, tête à gauche ou à droite de la texture), à cheval sur la route (repère de la route : Z vers la voiture qui arrive) : salle carrée de brique crue ocre à toit plat et corniche à gorge,
    // portes à chambranles de pierre, taureaux côté arrivée (ouest), lamassus à tête humaine côté sortie (est), quatre colonnes de 16,5 m à l'intérieur ; ni arc, ni créneau, ni tour
    porteNations: (W = 10) => { const L = 2 * W + 20; return [...[-1, 1].flatMap(sd => [['crue', 3, 18, 27, sd * (W + 8.5), 9, 0, null, 1], ['pierre', 3.2, 1.2, 27.4, sd * (W + 8.5), 0.6, 0],
        // les montants, profonds de 8 m ; sur leur face tournée vers la route, le taureau en haut-relief (taureau à l'ouest, à l'arrivée ; lamassu à tête humaine à l'est, à la sortie : REFS §6-7) ;
        // son avant-corps (poitrail, pattes, tête, tiare ou cornes) sort du montant vers l'extérieur, comme sur le site
        ...[-1, 1].flatMap(fz => { const z1 = fz * 17.9, X = sd * (W + 1.5), hum = fz < 0; return [['pierre', 3.4, 14, 8, sd * (W + 1.7), 7, fz * 13.9, null, 1], ['crue', 4.6, 18, 3, sd * (W + 5.9), 9, fz * 11.7],
          [(sd < 0) === (fz > 0) ? (hum ? 'lamHG' : 'lamTG') : (hum ? 'lamHD' : 'lamTD'), 0.16, 10.5, 7.6, sd * (W - 0.05), 6.6, fz * 13.9],
          ['sculpte', 2.8, 4, 2.4, X, 6.6, z1 + fz * 1.2], ...[-0.7, 0.7].map(dx => ['sculpte', 0.9, 4.6, 1, X + dx, 2.3, z1 + fz * 1.6]), ['visage', 2, 2.4, 2, X, 9.6, z1 + fz * 1.6], ...[-1, 1].map(e => ['aile', 0.35, 5.5, 4.5, X + e * 1.5, 9.5, z1 - fz * 0.6, [fz * 0.35, e * fz * 0.3, 0]]), // tête claire, ailes déployées qui montent du montant
          ...(hum ? [['sculpte', 1.6, 1.8, 0.6, X, 7.6, z1 + fz * 2.6], ['tiare', 2.1, 1.9, 2, X, 11.75, z1 + fz * 1.6], ['or', 2.2, 0.3, 2.1, X, 11.2, z1 + fz * 1.6], ['or', 2.3, 0.25, 2.2, X, 12.8, z1 + fz * 1.6]] : [['or', 3.4, 0.35, 0.4, X, 10.9, z1 + fz * 1.6], ['or', 0.35, 1.2, 0.35, X - 1.6, 11.6, z1 + fz * 1.6], ['or', 0.35, 1.2, 0.35, X + 1.6, 11.6, z1 + fz * 1.6]])]; }),
        ...[-5, 5].flatMap(z => colonne(sd * (W + 4.6), z, 16.5))]),
      ...[-1, 1].flatMap(fz => [['crue', L, 3.4, 3, 0, 16.3, fz * 11.7], ['pierre', 2 * W + 7.2, 1.3, 3.8, 0, 14.6, fz * 11.7], ['relief', 2 * W + 7, 1, 0.2, 0, 15.6, fz * 13.65]]),
      ['crue', L, 1, 27, 0, 18.5, 0, null, 1], ['cedre', L - 6, 0.2, 21, 0, 17.9, 0], ['pierre', L + 1.2, 0.7, 28.2, 0, 19.35, 0], ['sculpte', L + 2.6, 0.6, 29.6, 0, 20, 0], ['pierre', L + 3.4, 0.5, 30.4, 0, 20.55, 0], ['or', L + 3.5, 0.15, 30.5, 0, 20.85, 0]]; },
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
    // REFS §15 : tour à vent (badgir) posée sur un toit : fût carré, fentes, toit plat
    badgir: () => [['crue', 2.4, 5, 2.4, 0, 2.5, 0, null, 1], ...[0, Math.PI / 2].map(a => ['sombre', 2.5, 2.4, 0.5, 0, 3.4, 0, [0, a, 0]]), ['crue', 2.8, 0.4, 2.8, 0, 5.2, 0]],
    // REFS §12 : caravansérail au bord de la route royale : enclos carré de 56 m, contreforts d'angle carrés (pas de tours rondes), portail à iwan sur la face -Z
    caravanserail: () => [...[-1, 1].flatMap(s => [['crue', 56, 9, 2, 0, 4.5, s * 27, null, 1], ['crue', 2, 9, 56, s * 27, 4.5, 0, null, 1]]),
      ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => ['crue', 5, 10, 5, a * 27, 5, b * 27, R45]),
      ['crue', 18, 14, 5, 0, 7, -27, null, 1], ['sombre', 8, 10, 0.4, 0, 5, -29.6], ['faience', 10, 1.2, 0.3, 0, 11.8, -29.6], ['faience', 18.2, 0.8, 5.2, 0, 14, -27]],
    // REFS §16 : personnage en robe longue (paysan, marchand), silhouette plate de miniature ; la robe prend la teinte de l'instance
    personnage: () => [['robe', 0.6, 1.25, 0.42, 0, 0.63, 0], ['robe', 0.75, 0.25, 0.5, 0, 0.12, 0], ['peau', 0.3, 0.32, 0.3, 0, 1.42, 0], ['coiffe', 0.36, 0.18, 0.36, 0, 1.64, 0]],
    // REFS §16 et §2 : étendard achéménide le long de la route royale : mât, drap (teinte de l'instance), aigle d'or au sommet ; X en travers de la route
    banniere: () => [['mat', 0.16, 7, 0.16, 0, 3.5, 0], ['drap', 0.06, 2.6, 1.5, 0, 5.4, 0.8], ['or', 0.5, 0.5, 0.25, 0, 7.2, 0], ['or', 1.1, 0.12, 0.2, 0, 7.15, 0]],
    // REFS §9 : autel du feu achéménide (Naqsh-e Rostam) : socle à degrés, fût carré, coupe à degrés ; la flamme est posée à part
    autel: () => [['pierre', 1.4, 0.4, 1.4, 0, 0.2, 0], ['pierre', 0.8, 1.3, 0.8, 0, 1.05, 0], ['pierre', 1.2, 0.3, 1.2, 0, 1.85, 0], ['pierre', 1.5, 0.3, 1.5, 0, 2.15, 0], ['or', 1.55, 0.08, 1.55, 0, 2.34, 0]],
    // REFS §15 : tente noire des nomades : lés tendus en deux pans, rebord bas
    tente: () => [['tente', 9, 1.4, 5, 0, 0.7, 0], ['tente', 9.4, 0.12, 3.2, 0, 1.9, -1.1, [0.45, 0, 0]], ['tente', 9.4, 0.12, 3.2, 0, 1.9, 1.1, [-0.45, 0, 0]]],
    // REFS §12 : arc transversal brisé du bazar couvert (repère de la route) : deux piles et l'arc en six segments, de la naissance à 3,8 m jusqu'à la clé à 6,2 m ; entre deux arcs, la coupole monte à 7,9 m
    arcBazar: (W = 10) => { const n = 6, R0 = W - 0.45, pt = k => { const t = k / n, x = R0 * (1 - t); return [x, 3.8 + 2.4 * Math.pow(t, 0.62)]; }, segs = [];
      for (let k = 0; k < n; k++) { const [x0, y0] = pt(k), [x1, y1] = pt(k + 1), l = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0); for (const sd of [-1, 1]) segs.push(['brique', l + 0.3, 0.7, 1.1, sd * (x0 + x1) / 2, (y0 + y1) / 2, 0, [0, 0, sd > 0 ? a : -a]]); }
      return [...[-1, 1].flatMap(sd => [['brique', 0.9, 3.8, 1.2, sd * R0, 1.9, 0], ['faience', 1, 0.4, 1.3, sd * R0, 3.7, 0]]), ...segs]; },
    // REFS §13 : portail (pishtaq) à l'entrée du bazar couvert, à cheval sur la route : cadre de faïence plus haut que les toits, bandeau d'inscription, niche brisée à muqarnas au-dessus de la voûte
    pishtaq: (W = 10) => { const b = [...[-1, 1].flatMap(sd => [['brique', 4, 25, 3.4, sd * (W + 2), 12.5, 0, null, 1], ['faience', 0.6, 23, 3.6, sd * (W - 0.1), 12.5, 0]]),
        ['brique', 2 * W + 8, 7.6, 3.4, 0, 21.2, 0, null, 1], ['inscr', 2 * W + 8.2, 1.6, 3.6, 0, 17.6, 0], ['inscr', 2 * W + 8.2, 1.6, 3.6, 0, 23.2, 0], ['faience', 2 * W + 8.4, 0.5, 3.8, 0, 25.2, 0], ['muq', 2 * W, 9, 0.4, 0, 12.4, -2.6]];
      for (let k = 0; k < 12; k++) { const y = 8 + k * 0.7, hw = W * Math.pow(1 - (k + 0.5) / 12, 0.7); for (const sd of [-1, 1]) b.push(['muq', W - hw + 0.1, 0.72, 3.2, sd * (hw + (W - hw) / 2), y + 0.35, 0]); }
      return b; },
    // REFS §12 : module d'arcades du bazar à ciel ouvert, 12 m : mur de brique peint de deux arcs, corniche, coupole basse derrière (bulbe en deux boîtes)
    // V2 : toit plat à rebord, plus de coupole en gradins (lue comme un merlon, REFS §12) : les coupoles du quartier sont des calottes à part
    arcade: () => [['brique', 12, 5.5, 1.2, 0, 2.75, 0.6, null, 1], ['faience', 12.2, 0.6, 1.4, 0, 5.8, 0.6], ['crue', 12, 7, 9, 0, 3.5, 5.6], ['crue', 12.3, 0.4, 9.3, 0, 7.2, 5.6], ...[-3, 3].flatMap(x => [['bois', 3, 1.3, 0.9, x, 6.4, 0.75], ['bois', 3.2, 0.15, 1.1, x, 7.1, 0.75]])], // balcons de bois à claustras à l'étage
    // îlot de rue de village, 30 m, X le long de la route, Z vers l'arrière, façades au ras de la chaussée : trois maisons de terre accolées, différentes
    // (maison à balcon de bois de 9 m ; maison à boutique de 12 m, auvent et pièce sur le toit ; maison basse de 5,5 m à grand portail). Portes à cadre turquoise, fenêtres allumées ou volets clos, banc de terre au pied
    ilot: () => [
      ['crue', 10, 9, 8, -10, 4.5, 4, null, 1], ['toit', 10.4, 0.5, 8.4, -10, 9.25, 4], ['cadre', 2.3, 3.1, 0.2, -12.4, 1.55, -0.02], ['porte', 1.6, 2.6, 0.3, -12.4, 1.3, -0.06], ['fenetre', 1, 1.5, 0.25, -7.8, 6.3, -0.05], ['volet', 1, 1.5, 0.25, -12.4, 6.3, -0.05], ['fenetre', 0.9, 1.2, 0.25, -7.4, 2.4, -0.05],
      ['bois', 3.4, 0.2, 1.3, -7.8, 5, -0.6], ['bois', 3.4, 0.9, 0.12, -7.8, 5.5, -1.2], ['crue', 3, 0.5, 0.7, -9.5, 0.25, -0.35],
      ['tapis', 2.2, 1.6, 0.1, -7.8, 5.2, -1.3], ['tapis', 1.6, 2.2, 0.1, 3, 5.4, -0.14], // l'étoffe rouge à bordure d'or, toujours en hauteur : un tapis sur le balcon, un autre sous une fenêtre
      ...[[-10, 8.3], [0, 11.3], [10, 4.9]].flatMap(([x0, y]) => [-4, -2.4, -0.8, 0.8, 2.4, 4].map(e => ['bois', 0.25, 0.25, 0.7, x0 + e, y, -0.3])), // les bouts de poutres du toit, en saillie
      ['crue', 10, 12, 8, 0, 6, 4, null, 1], ['toit', 10.4, 0.5, 8.4, 0, 12.25, 4], ['boutique', 7, 3.6, 0.3, -0.8, 1.8, -0.1], ['faience', 10.1, 0.5, 0.25, 0, 4.3, -0.05], ['auvent', 7.4, 0.12, 2.8, -0.8, 3.7, -1.4, [0.28, 0, 0]],
      ...[[-3, 6.8, 1], [0, 6.8, 1], [3, 6.8, 0], [-3, 9.8, 0], [0, 9.8, 1], [3, 9.8, 1]].map(([x, y, a]) => [a ? 'fenetre' : 'volet', 1, 1.5, 0.25, x, y, -0.05]), ['porte', 1.2, 2.4, 0.3, 3.8, 1.2, -0.06], ['crue', 3.4, 3, 3.4, -2, 13.9, 5], ['toit', 3.8, 0.3, 3.8, -2, 15.5, 5],
      ['crue', 10, 5.5, 8, 10, 2.75, 4, null, 1], ['toit', 10.4, 0.4, 8.4, 10, 5.7, 4], ['cadre', 3, 3.8, 0.2, 10, 1.9, -0.02], ['porte', 2.2, 3.2, 0.3, 10, 1.6, -0.06], ['fenetre', 0.8, 1, 0.25, 6.8, 3.6, -0.05], ['volet', 0.8, 1, 0.25, 13.2, 3.6, -0.05], ['crue', 4.6, 1.4, 4.6, 11.5, 6.4, 4.5], ['toit', 5, 0.3, 5, 11.5, 7.2, 4.5]],
    // ruelle latérale vue en enfilade depuis la rue (kucheh) : 4 m de large, 18 m de profondeur entre deux murs de terre, cinq arcs minces à dessus plat qui les contrebutent (les vrais sabat), une porte turquoise et une fenêtre allumée au fond, un seuil
    ruelle: () => [...[-1, 1].map(sd => ['crue', 0.6, 9, 18.6, sd * 2.3, 4.5, 9.3, null, 1]), ['sol', 4, 0.1, 18, 0, 0.05, 9], ['crue', 5.2, 9, 0.6, 0, 4.5, 18.6], ['cadre', 1.9, 2.7, 0.2, 0, 1.35, 18.25], ['porte', 1.3, 2.3, 0.3, 0, 1.15, 18.2], ['fenetre', 1, 1.2, 0.2, 0.9, 5.6, 18.25], ['crue', 4, 0.4, 0.5, 0, 0.2, 0.25],
      ...[2, 5.5, 9, 12.5, 16].flatMap(z => [['arc', 4, 0.7, 0.45, 0, 5.6, z], ...[-1, 1].map(sd => ['arc', 0.8, 0.7, 0.45, sd * 1.6, 4.95, z])])],
    // passage couvert en travers de la ruelle (sabat) : une pièce d'habitation qui enjambe la rue, d'une maison à l'autre, sur deux piles et deux consoles ; fenêtres allumées sur ses deux faces. W = demi-largeur de la rue
    sabat: (W = 10) => [...[-1, 1].flatMap(sd => [['crue', 2.4, 6.4, 7, sd * (W + 0.6), 3.2, 0, null, 1], ['crue', 2.6, 1.4, 6.9, sd * (W - 1.6), 5.9, 0], ['crue', 2.6, 0.75, 6.8, sd * (W - 3.8), 6.3, 0]]), // consoles moins profondes que les piles et la pièce : aucune face dans le même plan qu'une autre (elles scintillaient)
      ['crue', 2 * W + 3.6, 4.4, 7, 0, 9, 0, null, 1], ['toit', 2 * W + 4, 0.5, 7.4, 0, 11.45, 0], ['faience', 2 * W + 3.7, 0.5, 7.1, 0, 6.95, 0], ['bois', 2 * W + 3.5, 0.12, 6.9, 0, 6.66, 0], // dessous : un plancher de bois, 4 cm sous le bandeau de faïence (les deux dessous étaient dans le même plan)
      ...[-2.4, -0.8, 0.8, 2.4].map(z => ['bois', 2 * W - 6, 0.3, 0.35, 0, 6.45, z]), // ses solives
      ...[-1, 1].flatMap(fz => [-0.55, -0.18, 0.18, 0.55].map((u, k) => [k % 3 ? 'fenetre' : 'volet', 1.2, 1.7, 0.25, u * W, 9.2, fz * 3.52]))],
    // module de rue du bazar ouvert, 12 m, X le long de la route, Z vers l'arrière : boutiques en niches au rez-de-chaussée, bandeau de faïence, un étage de brique crue, toit plat à rebord. Toujours un étage et un toit (9,6 m)
    arcadeBazar: () => [['tapis', 2, 2.6, 0.1, -3, 7.2, -0.08], ['boutiques', 12, 5, 9, 0, 2.5, 4.5, null, 1], ['faience', 12.1, 0.5, 9.1, 0, 5.25, 4.5], ['etage', 12, 3.6, 9, 0, 7.3, 4.5], ['toit', 12.4, 0.5, 9.4, 0, 9.35, 4.5]],
    // REFS §12, §16 : étal à auvent (X le long de la route) : comptoir, deux montants, toile rayée penchée vers la route, marchandises
    etalPerse: () => [['bois', 3.4, 1, 1.4, 0, 0.5, 1.2], ...[-1.6, 1.6].map(x => ['bois', 0.15, 2.8, 0.15, x, 1.4, 0.3]), ['auvent', 3.8, 0.08, 2.4, 0, 2.6, 0.8, [-0.35, 0, 0]],
      ['marchandise', 3, 0.5, 1, 0, 1.25, 1.2]],
    // REFS §16 : chameau de bât, X vers l'avant : pattes, corps, bosse, cou et tête ; bât rouge
    chameau: () => [...[[-0.75, -0.3], [-0.75, 0.3], [0.75, -0.3], [0.75, 0.3]].map(([x, z]) => ['poil', 0.22, 1.6, 0.22, x, 0.8, z]), ['poil', 2.1, 0.8, 0.8, 0, 1.95, 0], // pattes hautes, corps
      ['poil', 1.1, 0.5, 0.7, -0.1, 2.55, 0], ['poil', 0.6, 0.35, 0.5, -0.1, 2.9, 0], ['bat', 1.5, 0.25, 1.1, -0.1, 2.4, 0], ['bat', 0.5, 0.6, 1.3, -0.7, 2.2, 0], // bosse arrondie, tapis de bât rouge, ballots
      ['poil', 0.35, 1.2, 0.4, 1.25, 2.4, 0, [0, 0, -0.75]], ['poil', 0.3, 0.7, 0.35, 1.75, 3.05, 0, [0, 0, 0.2]], ['poil', 0.75, 0.35, 0.35, 2.05, 3.35, 0], ['poil', 0.3, 0.25, 0.25, -1.15, 1.9, 0, [0, 0, 0.6]]], // cou en S, tête allongée, queue
    // REFS §16 : âne bâté, X vers l'avant
    ane: () => [...[[-0.4, -0.2], [-0.4, 0.2], [0.4, -0.2], [0.4, 0.2]].map(([x, z]) => ['poil', 0.14, 0.7, 0.14, x, 0.35, z]), ['poil', 1.1, 0.5, 0.5, 0, 0.95, 0],
      ['poil', 0.25, 0.5, 0.25, 0.6, 1.25, 0, [0, 0, -0.6]], ['poil', 0.45, 0.25, 0.25, 0.8, 1.5, 0], ['bat', 0.6, 0.45, 0.8, -0.05, 1.3, 0]],
    // REFS §10, §15 : cyprès : flamme étroite à six pans (silhouette plate de miniature)
    cypres: () => { const g = new THREE.ConeGeometry(1.3, 12, 6, 1); g.translate(0, 6.6, 0); return g; },
    // REFS §10 : bassin rond du jardin : margelle (anneau bas), l'eau est un disque posé à part
    margelle: () => { const g = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); g.translate(0, 0.5, 0); return g; },
    disque: () => { const g = new THREE.CircleGeometry(1, 24); g.rotateX(-Math.PI / 2); return g; },
    // REFS §10 : massif de fleurs : bourrelet bas
    massif: () => B(1, 0.6, 1),
    // REFS §12 : lanterne du bazar
    lanterne: () => B(0.5, 0.8, 0.5),
    // REFS §13 : fond : coupole sur tambour, minaret à couronne plate (pas de toit pointu)
    coupole: () => new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), // calotte, pas de bulbe (REFS §12-13)
    tambour: () => { const g = new THREE.CylinderGeometry(1, 1, 1, 16); g.translate(0, 0.5, 0); return g; },
    minaret: () => { const g = new THREE.CylinderGeometry(0.8, 1, 1, 10); g.translate(0, 0.5, 0); return g; },
    // panneau plat au loin (nuages en volutes, foule) : plan vertical face à +Z
    panneau: () => new THREE.PlaneGeometry(1, 1),
    // REFS §12, §10, §15 : calotte de coupole (toits du bazar), houppier rond (orangers), cône de qanat, jet de fontaine, cône (épices, Zagros)
    calotte: () => new THREE.SphereGeometry(1, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    houppierRond: () => new THREE.IcosahedronGeometry(1, 0), // 20 faces : les vergers en comptent un millier
    qanat: () => { const g = new THREE.CylinderGeometry(0.8, 2.6, 1.2, 8); g.translate(0, 0.6, 0); return g; },
    jet: () => { const g = new THREE.CylinderGeometry(0.06, 0.25, 1, 6); g.translate(0, 0.5, 0); return g; },
    rai: () => { const g = new THREE.CylinderGeometry(1, 2.4, 1, 10, 1, true); g.translate(0, -0.5, 0); return g; }, // puits de lumière du bazar : cône ouvert sous l'oculus, pointe en haut
    cone: () => { const g = new THREE.ConeGeometry(1, 1, 8); g.translate(0, 0.5, 0); return g; },
  });
})();
