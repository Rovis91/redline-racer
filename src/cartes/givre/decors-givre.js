// Placement du décor de « givre » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  Object.assign(DECORS, {
    // ---------- Nuit Blanche : un col fermé pour l'hiver, à l'aube. Pentes de neige, sapins chargés, falaise givrée, pont sur la gorge, refuge éclairé au col ; la glace vive se voit sur la route ----------
    givre(h) {
      const { THREE, S, N, W, T, rnd } = h, neige = h.mat('neigeVierge'), beton = h.mat('beton');
      const ecart = (x, z, d) => d - S[near(h, x, z)].w + W; // distance à l'axe ramenée à une route de demi-largeur W (la route s'élargit au hameau, sur le champ de neige et au col : M.large)
      // la gorge : une entaille que la route franchit par un pont, entre les points 22 et 23 ; elle s'ouvre vers l'aval
      const xG = (S[pt(h, 22)].x + S[pt(h, 23)].x) / 2, gorge = (x, z) => 30 * Math.max(0, 1 - ((x - xG) / 50) ** 2) * Math.min(1, Math.max(0, (z - 330) / 70));
      const g = terrain(h, { pas: 8, marge: 420, loin: 80, chute: -0.25, creux: gorge, mat: neige });
      // bord dessiné = mur réel : le jeu dessine chaussée et glissière à ±W constant (cartes sans relief), alors que les murs sont à la demi-largeur variable s.w (M.large :
      // lac, hameau, champ de neige, col). th.murH = 0 enterre sa glissière ; ce décor repose la chaussée et la glissière à ±s.w, mêmes matières et mêmes coordonnées de texture
      // (un seul ruban depuis T.t1, comme celui du jeu : les tirets ne sautent pas), la chaussée un peu au-dessus de celle du jeu, la glace encore au-dessus
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('chaussee', { side: THREE.DoubleSide, gloss: 0.08, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.route), 32);
      const glis = h.mat('glissiere', { side: THREE.DoubleSide }, h.TH.mur); for (const sd of [-1, 1]) h.glis(sd, T.t1, N, s => sd * s.w, 1.4, s => sd * s.w, -2, glis); // h.glis : s'abîme aux chocs
      const iG = S.findIndex(s => gorge(s.x, s.z) > 1), nG = S.filter(s => gorge(s.x, s.z) > 1).length;
      h.ribbon(iG, nG, s => -s.w, -2, s => s.w, -2, beton, 8); // le tablier (ses flancs sont les murets de la route), sur deux piles
      inst(h, h.geo('pileViaduc'), beton, [1, 2].map(k => { const s = S[iG + Math.round(nG * k / 3)], y0 = g.hAt(s.x, s.z) - 2; return [s.x, (s.y - 2 + y0) / 2, s.z, h.across(s), 1, s.y - 2 - y0, 0.5]; }));
      // la glace : partout où la route en est (T.surf, la table de la physique), une plaque sombre et luisante posée sur la neige tassée, les deux bouts en langues.
      // Seuil 0,33 (la neige est à 0,3) : le lac gelé, moins glissant que la glace vive pour que la glisse y paie (force 0,2 dans cartes.js), se voit aussi
      const opt = { alphaTest: 0.1, gloss: 0.25, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, vive = i => T.surf[(i + N) % N].vir > 0.33, plaques = [];
      const grp = (x, y, z, ry, k = 1) => { const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(k); h.scene.add(o); return o; }; // un objet posé et tourné (X local = rotation ry)
      const plaque = h.mat('glaceVive', opt, 0), debut = h.mat('glaceVive', opt, 1), fin = h.mat('glaceVive', { ...opt, rep: [1, -1] }, 1), B = 5; // B échantillons (10 m) par bout
      for (let i = 0; i < N; i++) if (vive(i) && !vive(i - 1)) { let n = 1; while (vive(i + n)) n++;
        const pose = (i0, cnt, m, v) => h.ribbon((i0 + N) % N, cnt, s => -s.w + 0.3, 0.03, s => s.w - 0.3, 0.03, m, v);
        pose(i, B, debut, 2 * B); pose(i + B, n - 2 * B, plaque, 32); pose(i + n - B, B, fin, 2 * B); plaques.push(i); }
      // chaque plaque s'annonce à 150 m (75 échantillons) puis à 40 m (20, rappel à la sortie des lacets, où le premier est caché par le virage) : un panneau VERGLAS de chaque côté, feu bleu allumé ; une lueur froide au-dessus de son entrée fait luire la glace de loin
      // (les plaques à la sortie des lacets, 13-14 et 18-19, ne se voyaient qu'une fois dessus) ; sur la plaque, les bagues des jalons passent au bleu (plus bas)
      const peauV = { poteau: h.mat('acier'), plaque: h.mat('ecrit', { lum: 1 }, 128, 48, '#f4f8ff', '#c81e1e', '▲ VERGLAS', 24), feu: h.mat('peinture', { lum: 1, c: 0x40a0ff }) };
      insts(h, 'panneauVerglas', peauV, plaques.flatMap(i => [75, 20].map(d => S[(i - d + N) % N])).flatMap(s => [-1, 1].map(sd => { const [x, z] = bord(s, sd, s.w + 1.8); return [x, s.y, z, Math.atan2(s.tz, -s.tx)]; })));
      for (const i of plaques) { const e = S[(i + 8) % N]; h.lum((i + 8) % N, e.x, e.y + 7, e.z, 0x9fd0ff, 32, 0.9); }
      const iN = (pt(h, 23) + 20) % N; // le dégagement du chasse-neige, dans la descente nue
      // congères : la neige repoussée par le chasse-neige fait un mur clair de chaque côté, plus haut que la glissière (le bord de la route se lit de loin) ; rien sur le pont
      h.ribbon((iG + nG) % N, N - nG, s => -(s.w + 3.5), 2.4, s => -(s.w + 0.1), 1.2, neige, 10); { const a0 = (iG + nG) % N, l1 = (iN - 12 - a0 + N) % N; for (const [i0, l] of [[a0, l1], [iN + 12, N - nG - l1 - 24]]) h.ribbon(i0 % N, l, s => s.w + 0.1, 1.2, s => s.w + 3.5, 2.4, neige, 10); } // à droite, ouverte devant le chasse-neige garé
      // la falaise du départ, côté montagne : elle garde la route à l'ombre du point 2 au point 3 ; une marche de roche givrée, la neige reprend au-dessus
      { const i0 = pt(h, 2), n = (pt(h, 3) - i0 + N) % N, m = S[(i0 + (n >> 1)) % N], ht = s => 3 + 17 * Math.max(0, 1 - (Math.hypot(s.x - m.x, s.z - m.z) / (n + 30)) ** 2);
        h.ribbon((i0 - 20 + N) % N, n + 40, s => s.w + 3, -1, s => s.w + 8, ht, h.mat('rocGivre', { side: THREE.DoubleSide }), 16); h.ribbon((i0 - 20 + N) % N, n + 40, s => s.w + 8, ht, s => s.w + 60, s => ht(s) + 10, neige, 10);
        // la coulée de poudreuse : une langue de neige descendue de la corniche, plaquée sur la roche (t = part de la pente du pied au sommet, 0,25 m devant elle), plus haute au milieu,
        // et son cône d'avalanche au pied, des tas de neige qui débordent sur la congère sans mordre la route
        const c0 = (i0 + (n >> 1) - 14 + N) % N, face = (s, t) => s.w + 3 + 5 * t - 0.25, fy = (s, t) => -1 + (ht(s) + 1) * t + 0.1, cloche = s => { const k = ((S.indexOf(s) - c0 + N) % N - 14) / 14; return 0.2 + 0.78 * Math.max(0, 1 - k * k); };
        h.ribbon(c0, 28, s => face(s, 0.2), s => fy(s, 0.2), s => face(s, cloche(s)), s => fy(s, cloche(s)), h.mat('neigeVierge', { side: THREE.DoubleSide, c: 0xffffff }), 12);
        inst(h, h.geo('pic'), neige, Array.from({ length: 8 }, (_, k) => { const s = S[(c0 + 2 + k * 3) % N], l = 4 + rnd() * 3, [x, z] = bord(s, 1, s.w + 0.4 + 0.7 * l); return [x, s.y - 0.3, z, rnd() * 1.5, l, 3.5 + rnd() * 2, l * 1.3]; })); }
      // sapins : le bois du retour (à l'ouest) serre la route et la tient à l'ombre ; ailleurs des bouquets épars, plus rien au-dessus de 100 m ni dans la gorge
      const arbres = [], bois = x => x < -90, iB = pt(h, 24), nB = (pt(h, 28) - iB + N) % N;
      for (let k = 0; k < nB; k += 3) for (const sd of [-1, 1]) { const s = S[(iB + k) % N], [x, z] = bord(s, sd, s.w + 5 + rnd() * 8); if (bois(x) && ecart(x, z, g.dAt(x, z)) > W + 4) arbres.push([x, g.hAt(x, z) + 6, z, rnd() * 6, 0.8 + rnd() * 0.7]); }
      for (let k = 0; k < 2200; k++) { const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z), y = g.hAt(x, z);
        if (d > 12 && d < 260 && y - 0.25 * Math.max(0, d - 80) < 100 && !gorge(x, z) && (bois(x) ? rnd() < 0.9 : Math.sin(x * 0.02) + Math.cos(z * 0.027) + rnd() > 0.85) && ecart(x, z, d) > 12) arbres.push([x, y + 6, z, rnd() * 6, 0.7 + rnd() * 0.8]); }
      const futs = arbres.map(p => { const y0 = p[1] - 6; p[1] = y0 + 10 * p[4]; return [p[0], y0 + 2.4 * p[4], p[2], 0, p[4]]; });
      inst(h, h.geo('cedre'), h.mat('sapinNeige'), arbres); inst(h, h.geo('tronc'), h.mat('tronc'), futs);
      // jalons à neige au ras des congères, tous les 24 m, tous les 12 m en virage : le seul balisage du col, leur bague s'allume dans les phares
      // sur la glace, tous les 12 m et la bague bleue : la plaque se lit de loin comme un couloir de feux bleus
      const jalons = [], jalonsG = []; for (let i = 0; i < N; i += vive(i) || Math.abs(S[i].k) > 0.008 ? 6 : 12) for (const sd of [-1, 1]) { const [x, z] = bord(S[i], sd, S[i].w + 0.5); (vive(i) ? jalonsG : jalons).push([x, S[i].y, z]); }
      // la chouette harfang, perchée sur un jalon de la descente nue (point 25), tournée vers la route et un peu vers qui arrive
      const sC = S[(pt(h, 25) + 3) % N], [ox, oz] = bord(sC, -1, sC.w + 0.5); jalons.push([ox, sC.y, oz]);
      h.pose('chouette', { plume: h.mat('peinture', { c: 0xf0f2f8 }), tache: h.mat('peinture', { c: 0x4a4a52 }), oeil: h.mat('peinture', { lum: 1, c: 0xffb020 }), bec: h.mat('peinture', { c: 0x202024 }) },
        grp(ox, sC.y + 2.8, oz, Math.atan2(-sC.tx, -sC.tz) - 0.6, 2.2)); // agrandie : à sa taille vraie, elle ne se voit pas à 150 km/h
      insts(h, 'jalon', { piquet: h.mat('cone'), bague: h.mat('catadioptre', { lum: 1, retro: 2.5 }) }, jalons);
      insts(h, 'jalon', { piquet: h.mat('cone'), bague: h.mat('peinture', { lum: 1, c: 0x50b0ff }) }, jalonsG);
      // la descente nue (points 23 à 26) : le chasse-neige garé sur un dégagement, gyrophare allumé ; la remontée mécanique arrêtée pour l'hiver grimpe la pente au nord, sièges figés
      const peauCN = { chassis: h.mat('matGris'), caisse: h.mat('peinture', { c: 0xf08a1a }), vitre: h.mat('vitreSombre'), neige, lame: h.mat('rayures'), roue: h.mat('roue'), pneu: h.mat('pneu') };
      const sN = S[iN], [nx, nz] = bord(sN, 1, sN.w + 4.2), gN = grp(nx, Math.max(sN.y - 0.15, g.hAt(nx, nz)), nz, -Math.atan2(sN.tz, sN.tx) + 0.15);
      h.pose('chasseNeige', peauCN, gN); h.lum(iN, nx, sN.y + 5, nz, 0xff8a1a, 26, 1.1);
      const gyro = new THREE.Group(); gyro.userData.dyn = 1; gyro.position.copy(gN.position); gyro.rotation.y = gN.rotation.y; h.scene.add(gyro); // il clignote : hors fusion du décor fixe
      const feuxG = [-1, 1].map(sd => h.pose('boite', h.mat('clignotant', LUM), gyro, [2, 3.55, sd * 0.7], 0.32, 0.28, 0.32));
      { const s = S[(pt(h, 23) + 35) % N], ry = -Math.atan2(s.tz, s.tx), tops = []; // la ligne part perpendiculaire à la route, vers le dehors de la boucle
        for (let k = 0; k < 6; k++) { const [x, z] = bord(s, -1, s.w + 24 + 46 * k), y = g.hAt(x, z); h.pose('pyloneTelesiege', { acier: h.mat('acier'), neige }, grp(x, y, z, ry)); tops.push([x, y + 8.75, z]); }
        const sieges = []; for (let k = 0; k < 5; k++) for (const sd of [-1, 1]) { const [a, b] = [tops[k], tops[k + 1]], ox = s.tx * sd * 2.1, oz = s.tz * sd * 2.1, L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          const c = grp((a[0] + b[0]) / 2 + ox, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + oz, 0); c.lookAt(b[0] + ox, b[1], b[2] + oz); h.pose('boite', h.mat('matGris'), c, [0, 0, 0], 0.14, 0.14, L); // le câble, d'un pylône à l'autre
          for (const f of [0.3, 0.7]) sieges.push([a[0] + (b[0] - a[0]) * (sd > 0 ? f : 1 - f) + ox, a[1] + (b[1] - a[1]) * (sd > 0 ? f : 1 - f) - 0.25, a[2] + (b[2] - a[2]) * (sd > 0 ? f : 1 - f) + oz, ry + Math.PI / 2 * (sd > 0 ? 1 : -1)]); }
        insts(h, 'siege', { acier: h.mat('acier'), siege: h.mat('peinture', { c: 0x2a62c8 }), neige }, sieges); }
      // balises de virage à l'extérieur des courbes, fixées devant les jalons : 1,2 × 0,6 m (les chevrons communs, 5 × 2,5 m, écrasent la route du col) ; sans retro, qui les assombrit à l'aube
      const chev = [[], []]; for (let i = 0; i < N; i += 6) { const s = S[i]; if (Math.abs(s.k) <= 0.006) continue; const f = s.k > 0 ? 0 : 1, [x, z] = bord(s, f ? 1 : -1, s.w + 0.35); chev[f].push([x, s.y + 1.9, z, Math.atan2(s.x - x, s.z - z), 0.24]); }
      chev.forEach((l, f) => inst(h, h.geo('chevron'), h.mat('chevron', { lum: 1, side: THREE.DoubleSide }, f), l));
      // le refuge du col, côté aval, fenêtres allumées, et le panneau du col
      const iR = pt(h, 19), gR = repere(h, S[iR]), WR = S[iR].w, [lx, lz] = bord(S[iR], -1, WR + 9);
      const peauR = { pierre: h.mat('pierre', { c: 0x8a92a4 }), mur: h.mat('planches', { c: 0x9a7a5a }), toit: neige, fenetre: h.mat('vitrine', { lum: 1, c: 0xffc070 }), porte: h.mat('planches', { c: 0x4a3626 }) };
      h.pose('refuge', peauR, gR, [-(WR + 17), 0, 0]);
      // deux voitures ensevelies devant le refuge : il ne dépasse que les vitres et les roues
      const auto = { caisse: neige, vitre: h.mat('vitreSombre'), feuRouge: h.mat('feuRouge'), feuBlanc: h.mat('lampe'), chassis: h.mat('matGris'), roue: h.mat('roue'), pneu: h.mat('pneu') };
      for (const [dz, a] of [[11, 1.4], [16, 1.75]]) { const v = new THREE.Group(); v.position.set(-(WR + 8), -0.15, dz); v.rotation.y = a; gR.add(v); h.pose('voitureGaree', auto, v); }
      // le hameau du fond de vallée, dans la boucle du départ : six chalets aux fenêtres allumées, pignon vers la route
      insts(h, 'refuge', peauR, [[28, -1, 30], [29, 1, 26], [29, -1, 48], [30, -1, 28], [0, -1, 34], [1, 1, 30]].map(([p, sd, o]) => { const s = S[pt(h, p)], [x, z] = bord(s, sd, s.w + o); return [x, g.hAt(x, z) - 0.8, z, h.across(s) + (sd > 0 ? Math.PI : 0)]; }));
      // le col est fermé : les barrières ont été poussées sur le bas-côté après le départ, leur feu orange allumé
      for (const dz of [0, 4]) h.pose('barriere', { rayures: h.mat('rayures', LUM), clignotant: h.mat('clignotant', LUM) }, repere(h, S[14]), [S[14].w + 5, 0.6, dz]);
      // la ligne à haute tension traverse la vallée d'est en ouest, entre le départ et les lacets
      for (let x = -160; x <= 640; x += 160) if (g.dAt(x, 140) > 20) h.pose('pyloneCol', { acier: h.mat('acier') }, h.scene, [x, g.hAt(x, 140), 140]);
      // rochers qui percent la neige : les mêmes pyramides que les sommets, petites, plus nombreuses là-haut où il n'y a plus d'arbres
      const rocs = []; for (let k = 0; k < 900 && rocs.length < 70; k++) { const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z), y = g.hAt(x, z), l = 5 + rnd() * 14;
        if (d > l + 14 && d < 220 && !gorge(x, z) && rnd() < (y > 80 ? 0.9 : 0.25) && ecart(x, z, d) > l + 14) rocs.push([x, y - 1, z, rnd() * 1.5, l, l * (0.6 + rnd() * 0.9), l * (0.7 + rnd() * 0.6)]); }
      inst(h, h.geo('pic'), h.mat('rocNeige'), rocs);
      h.lum(iR, lx, S[iR].y + 3, lz, 0xffb060, 45, 1.3);
      h.pose('panneauCol', { poteau: h.mat('acier'), plaque: h.mat('ecrit', { retro: 1.5 }, 128, 42, '#1c3fa8', '#f4f8ff', 'COL DE L\'ECHINE · 1922 m', 10) }, gR, [-(WR + 4), 0, -16]);
      // les sommets, en couronne à plus d'un kilomètre, bleus dans le petit jour
      const pics = []; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283 + rnd() * 0.2, r = 1150 + rnd() * 500, l = 520 + rnd() * 420; pics.push([250 + Math.cos(a) * r, 40, 250 + Math.sin(a) * r, rnd() * 1.5, l, 420 + rnd() * 330, l]); }
      inst(h, h.geo('pic'), h.mat('rocNeige', { fog: false, c: 0xa8b8e8 }), pics);
      // ---------- Laponie, en secret : rennes, cerfs, kotas, sapin de Noël, aurores boréales, et le Père Noël ----------
      const pc = new Map(), P = c => { const m = h.mat('peinture', { c }); return pc.get(c) || pc.set(c, m).get(c); }, bete = c => ({ poil: P(c), patte: P(0x3a2a20), nez: P(0x1a1410), ventre: P(0xe8e0d0), bois: P(0xd8c8a8) });
      const prets = (n, p, sd, o0, o1) => Array.from({ length: n }, () => { const s = S[(pt(h, p) + (rnd() * 30 | 0)) % N], [x, z] = bord(s, sd, s.w + o0 + rnd() * (o1 - o0)); return [x, g.hAt(x, z), z, rnd() * 6.3, 0.9 + rnd() * 0.25]; });
      insts(h, 'renne', bete(0x8a7660), [...prets(9, 29, 1, 25, 60), ...prets(5, 0, 1, 20, 45)]); // le troupeau du hameau
      insts(h, 'renne', bete(0x6a4428), prets(5, 25, 1, 14, 30), { a: [1.8] }); // les cerfs, à l'orée du bois
      const kotas = prets(4, 29, -1, 60, 80).map(p => [p[0], p[1] - 0.3, p[2], p[3]]); inst(h, h.geo('kota'), h.mat('planches', { c: 0xb09070 }), kotas);
      kotas.forEach(p => h.lum(pt(h, 29), p[0], p[1] + 1, p[2], 0xff9040, 14, 1.2));
      // le sapin de Noël du hameau, ses boules allumées
      { const s = S[pt(h, 29)], [x, z] = bord(s, -1, s.w + 40), y = g.hAt(x, z), cols = [0xff3030, 0xffd040, 0x40a0ff, 0xff60e0];
        inst(h, h.geo('cedre'), h.mat('sapinNeige'), [[x, y + 18, z, 0, 1.8]]); inst(h, h.geo('tronc'), h.mat('tronc'), [[x, y + 4.3, z, 0, 1.8]]);
        cols.forEach((c, k) => inst(h, h.geo('boite', 0.5, 0.5, 0.5), h.mat('peinture', { lum: 1, c }), Array.from({ length: 14 }, (_, j) => { const t = (j * 4 + k) / 56, a = t * 40, r = 4.6 * (1 - t) + 0.3; return [x + Math.cos(a) * r, y + 5 + t * 15, z + Math.sin(a) * r]; })));
        h.pose('boite', h.mat('peinture', { lum: 1, c: 0xffe070 }), h.scene, [x, y + 21, z], 1, 1, 1); }
      // le Père Noël : son traîneau et deux rennes garés près du refuge…
      const peauN = { patin: P(0xd8a838), caisse: P(0xb01020), sac: P(0x6a4a2a), costume: P(0xc8102e), ceinture: P(0x1a1a1a), peau: P(0xf0c0a0), barbe: P(0xf8f8f8) };
      const attelage = (parent, n) => { const t = new THREE.Group(); parent.add(t); h.pose('traineau', peauN, t);
        for (let k = 0; k < n; k++) for (const sd of [-1, 1]) h.pose('renne', k === n - 1 && sd < 0 ? { ...bete(0x8a7660), nez: h.mat('feuRouge', LUM) } : bete(0x8a7660), t, [3.4 + k * 2.6, 0, sd * 0.6]);
        for (const sd of [-1, 1]) h.pose('boite', peauN.ceinture, t, [1.6 + n * 1.3, 1.55, sd * 0.45], n * 2.6 + 0.6, 0.04, 0.04); return t; };
      { const t = attelage(gR, 1); t.position.set(-(WR + 10), 0, -4); t.rotation.y = Math.PI / 2; }
      // … et le même, en vol, quatre paires de rennes, qui tourne au-dessus du col
      let cx = 0, cz = 0, rx = 0, ym = -1e9; for (const s of S) { cx += s.x / N; cz += s.z / N; ym = Math.max(ym, s.y); } for (const s of S) rx = Math.max(rx, Math.hypot(s.x - cx, s.z - cz));
      const vol = new THREE.Group(); vol.userData.dyn = 1; h.scene.add(vol); attelage(vol, 4).position.x = -6; soude(h, vol); // une passe par teinte pour tout l'attelage en vol
      // aurores boréales : deux rideaux de lumière qui ondulent haut dans le ciel, au nord, derrière les sommets
      const rideaux = [['#40ffa0', 1350, 2.2, 3.9, 560, 520], ['#b060ff', 1550, 2.7, 4.4, 640, 380]].map(([c, r0, a0, a1, y0, ht]) => {
        const n = 90, pos = new Float32Array((n + 1) * 6), uv = [], idx = [];
        for (let k = 0; k <= n; k++) { uv.push(k / 6, 0, k / 6, 1); if (k < n) idx.push(2 * k, 2 * k + 2, 2 * k + 1, 2 * k + 1, 2 * k + 2, 2 * k + 3); }
        const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(idx);
        const m = new THREE.Mesh(ge, h.mat('degrade', { lum: 1, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }, c, true));
        m.userData.dyn = 1; m.frustumCulled = false; h.scene.add(m); return { m, pos, n, r0, a0, a1, y0, ht };
      });
      return (dt, now) => {
        feuxG.forEach((m, k) => { m.visible = ((now / 260 | 0) + k) % 2 === 0; }); // le gyrophare : ses deux feux alternent
        const a = now * 0.00012, R = rx * 0.75, [x, z] = [cx + Math.cos(a) * R, cz + Math.sin(a) * R];
        vol.position.set(x, ym + 45 + Math.sin(now * 0.002) * 3, z); vol.rotation.y = -a - Math.PI / 2; // X local sur la tangente du cercle, sens de la marche
        for (const q of rideaux) { for (let k = 0; k <= q.n; k++) { const t = q.a0 + (q.a1 - q.a0) * k / q.n, r = q.r0 + 90 * Math.sin(k * 0.21 + now * 0.0005) + 40 * Math.sin(k * 0.07 - now * 0.0003), px = cx + Math.cos(t) * r, pz = cz + Math.sin(t) * r;
          q.pos.set([px, q.y0, pz, px, q.y0 + q.ht * (0.8 + 0.2 * Math.sin(k * 0.3 + now * 0.001)), pz], k * 6); }
          q.m.geometry.attributes.position.needsUpdate = true; q.m.material.opacity = 0.55 + 0.2 * Math.sin(now * 0.0007 + q.r0); }
      };
    },
  });
})();
