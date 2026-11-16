// Placement du décor de « canal » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  Object.assign(DECORS, {
    // ---------- Canal 6 : le lit bétonné est devenu un grand ovale à l'américaine. Anneau de tribunes géantes pleines de monde, grillages, stands au départ,
    // tour de chronométrage, écrans du classement, parkings pleins et camping-cars dehors, dirigeable ; projecteurs sur la piste au couchant ----------
    canal(h) {
      const { THREE, S, N, W, rnd, T } = h;
      const net = m => { m.map.anisotropy = 8; return m; }; // textures vues en rasant (gazon, gradins, grillage) : filtrage anisotrope, sinon elles bavent
      const g = terrain(h, { pas: 16, marge: 340, mat: net(h.mat('gazon')) });
      // fresques fléchées : sur un mur de 5 m à l'extérieur des courbes, des chevrons peints dans le sens du virage
      const fresque = flip => h.mat('fresque', { lum: 1, side: THREE.DoubleSide }, flip);
      const dummy = new THREE.Object3D(), murs = [0, 1].map(f => new THREE.InstancedMesh(h.geo('murFresque'), fresque(f), 400)), cnt = [0, 0], balA = [], balB = [], apex = [];
      for (let i = 0; i < N; i++) {
        const s = S[i], k = s.k; if (Math.abs(k) < 0.0045) continue;
        const f = k > 0 ? 0 : 1, sd = k > 0 ? -1 : 1; // l'extérieur est à gauche d'un virage à droite
        if (i % 8 === 0 && cnt[f] < 400) { const [x, z] = bord(s, sd, s.w + 1.6); dummy.position.set(x, s.y + 2.5, z); dummy.lookAt(s.x, s.y + 2.5, s.z); dummy.updateMatrix(); murs[f].setMatrixAt(cnt[f]++, dummy.matrix); }
        if (i % 4 === 0) { const [x, z] = bord(s, sd, s.w + 0.5); (i % 8 ? balA : balB).push([x, s.y + 4.4, z]); } // balises hautes, une sur deux blanche, l'autre rose
        if (Math.abs(k) > Math.abs(S[(i + N - 1) % N].k) && Math.abs(k) >= Math.abs(S[(i + 1) % N].k) && Math.abs(k) > 0.008) apex.push([i, sd]);
      }
      murs.forEach((m, f) => { m.count = cnt[f]; m.frustumCulled = false; h.scene.add(m); });
      inst(h, h.geo('balise'), h.mat('peinture', { lum: 1, c: 0xf4f0e0 }), balA); inst(h, h.geo('balise'), h.mat('peinture', { lum: 1, c: 0xe83f8c }), balB);
      // panneaux des sponsors du meeting (inventés) : un mât de 24 m au point de corde extérieur de chaque courbe
      const pubs = [['SOLAR COLA', '#c8102e', '#f4f0e0'], ['DUSK RADIO', '#3d2a5c', '#ffc04a'], ['PALM TIRES', '#1848c8', '#f4f0e0'], ['RANCHO', '#f4f0e0', '#1a1420'], ['NITRO TACO', '#2aa39a', '#f4f0e0'], ['CANAL 6', '#1a1420', '#ff7a3d']].map(([t, a, b]) => h.mat('ecrit', LUM, 64, 32, a, b, t, 11));
      const fer = h.mat('fer'), acier = h.mat('acier'), beton = h.mat('beton'), lampe = h.mat('lampe', LUM);
      apex.forEach(([i, sd], k) => h.pose('panneauPub', { mat: fer, affiche: pubs[k % pubs.length] }, repere(h, S[i]), [sd * (S[i].w + 9), 0, 0], sd * 0.5));
      // grillage de protection au-dessus des murets, des deux côtés, sur tout le tour ; poteaux tous les 6 échantillons
      const cO = N - (T.t1 - T.t0), grille = net(h.mat('grillage', { alphaTest: 0.5, side: THREE.DoubleSide }));
      for (const sd of [-1, 1]) h.ribbon(T.t1, cO, s => sd * (s.w + 0.1), h.TH.murH + 4.2, s => sd * (s.w + 0.1), h.TH.murH - 0.1, grille, 4);
      const pot = []; for (let i = 0; i < N; i += 6) for (const sd of [-1, 1]) { const [x, z] = bord(S[i], sd, S[i].w + 0.2); pot.push([x, S[i].y + h.TH.murH + 2.1, z, 0, 1, 0.86, 1]); }
      inst(h, h.geo('poteauGrillage'), acier, pot);

      // --- les tribunes suivent la piste par l'extérieur, sans trou : un module de 14 m tous les 7 échantillons. Il s'élargit à l'extérieur des courbes
      // pour refermer l'éventail, et perd de la profondeur (75 %, 50 %) là où une autre portion de piste passe derrière ; un sur quatre porte un mât ---
      const trib = [[], []], PAS = 7, PROF = 53, olaI = []; // olaI : chaque module avec, en dernier, son échantillon de piste (pour la ola)
      const pied = i => { const s = S[i % N]; return [...bord(s, -1, s.w + 12), s.tz, -s.tx]; }; // façade et direction du fond (côté gauche = extérieur de l'ovale)
      for (let i = 0, k = 0; i < N; i += PAS, k++) {
        const [x, z, ox, oz] = pied(i), sc = [1, 0.75, 0.5].find(c => [0, 0.35, 0.7, 1].every(f => g.dAt(x + f * PROF * c * ox, z + f * PROF * c * oz) > W + 9));
        if (!sc || ![-7, 7].every(u => g.dAt(x + u * oz, z - u * ox) > W + 9)) continue;
        const [x2, z2, ox2, oz2] = pied(i + PAS), large = Math.max(1, Math.hypot(x2 + 40 * sc * ox2 - x - 40 * sc * ox, z2 + 40 * sc * oz2 - z - 40 * sc * oz) / 14 + 0.05);
        const y = Math.min(g.hAt(x, z), g.hAt(x + 20 * sc * ox, z + 20 * sc * oz)) - 0.6, mat = k % 4 === 0 ? 1 : 0;
        trib[mat].push([x, y, z, Math.atan2(ox, oz), large, sc, sc]); olaI.push([...trib[mat][trib[mat].length - 1], i]);
        if (mat) { const s = S[i], [lx, lz] = bord(s, -1, W + 2); h.lum(i, lx, s.y + 20, lz, 0xfff0d8, 50, 0.5); } // le mât éclaire la piste ; au couchant, un appoint
      }
      const foule = net(h.mat('foule', {}, '#4a4250', '#e83f8c')), foule2 = net(h.mat('foule', {}, '#3e3848', '#2aa39a'));
      const peauT = { beton, banderole: h.mat('banderole', {}, 0), banderole2: h.mat('banderole', {}, 2), foule, foule2, escalier: h.mat('marches'), loge: h.mat('loges', LUM), acier, toit: h.mat('toleToit'), lampe, drapeau: h.mat('damier', { lum: 1, net: 1, side: THREE.DoubleSide }, '#f4f0e0') };
      trib.forEach((l, m) => insts(h, 'tribune', peauT, l, { a: [m] }));
      // la ola (comme au Stade) : une copie bras levés de la foule du bas, levée sur les tribunes proches de la voiture suivie, cachée sous le sol ailleurs ; elle court avec elle
      // shortcut: elle suit la voiture que le décor reçoit (celle du joueur), pas la tête de course
      const A1 = Math.atan2(14, 24), go = h.geo('boite', 14, 0.6, 27.8); go.rotateX(-A1); go.translate(0, 11.2, 14);
      const fo = net(h.mat('foule', {}, '#4a4458', '#f4f0e0')); fo.map.offset.y = 0.5;
      const ola = inst(h, go, fo, olaI.map(p => p.slice(0, 7))), o4 = new THREE.Object3D(); ola.userData.dyn = 1; ola.frustumCulled = false;
      const ecrans = [[240, 70], [1250, 110], [1600, 140]];

      // --- le parking derrière les tribunes : des milliers de voitures, des camping-cars au bout des virages ---
      const autos = [], cc = [], COUL = [0xf4f0e0, 0x1a1a1e, 0xc8102e, 0x9aa0a8, 0x1848c8, 0x5a5e66, 0xd8d0c0, 0x2a5a3a, 0xffc04a];
      const lots = [[-260, 1780, -240, -178], [-260, 1780, 398, 460], [1960, 2100, -200, 420], [-580, -440, -200, 420]], dalles = [];
      lots.forEach(([x0, x1, z0, z1], n) => {
        dalles.push([(x0 + x1) / 2, g.hAt((x0 + x1) / 2, (z0 + z1) / 2) - 0.3, (z0 + z1) / 2, 0, x1 - x0, 1, z1 - z0]);
        for (let z = z0 + 6; z < z1 - 4; z += 8.5) for (let x = x0 + 2; x < x1 - 2; x += 2.5) {
          const r = rnd(); if (r > 0.86) continue;
          if (n > 1 && r < 0.05) { cc.push([x + 3, g.hAt(x, z), z, (z | 0) % 2 ? 0 : Math.PI, 1, 1, 1, COUL[(r * 977 | 0) % COUL.length]]); x += 6; continue; }
          autos.push([x, g.hAt(x, z) + 0.65, z + ((z | 0) % 2 ? 2.4 : -2.4), 1.5708, 1, 1, 1, COUL[(r * 977 | 0) % COUL.length]]);
        }
      });
      // et dans l'herbe du milieu, le public qui campe : deux rangées de camping-cars le long du grillage intérieur, par groupes, puis des grappes plus loin
      const poly = S.filter((s, i) => i % 8 === 0), dedans = (x, z) => { let c = false; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const p = poly[a], q = poly[b]; if ((p.z > z) !== (q.z > z) && x < (q.x - p.x) * (z - p.z) / (q.z - p.z) + p.x) c = !c; } return c; };
      const libre = (x, z) => [[20, 60, 140], ...ecrans.map(([a, b]) => [a, b, 30])].every(([cx, cz, r]) => Math.hypot(x - cx, z - cz) > r);
      for (let i = 100; i < N - 130; i += 4) for (const off of [W + 19, W + 28]) {
        const s = S[i], [x, z] = bord(s, 1, off); if ((i >> 2) % 8 === 0) continue; // un passage tous les 8 camping-cars
        if (dedans(x, z) && g.dAt(x, z) > off - 1.5 && libre(x, z)) cc.push([x, g.hAt(x, z), z, Math.atan2(-s.tz, s.tx), 1, 1, 1, COUL[(i * 7 + off | 0) % COUL.length]]);
      }
      for (let n = 0; n < 70; n++) {
        const x0 = -150 + rnd() * 1900, z0 = -60 + rnd() * 340, a = rnd() * 3.14;
        for (let m = 0; m < 6; m++) { const x = x0 + Math.cos(a) * m * 4, z = z0 - Math.sin(a) * m * 4; if (dedans(x, z) && g.dAt(x, z) > W + 45 && libre(x, z)) cc.push([x, g.hAt(x, z), z, a + 1.5708, 1, 1, 1, COUL[(n + m) % COUL.length]]); }
      }
      const laque = h.mat('laque'), ga = h.habille(h.geo('auto'), laque), garde = [...Array(24).keys()].filter(i => i < 12 || i > 15); // sans la face du dessous (posée au sol, jamais vue) : les voitures du parking sont la moitié des triangles de la carte
      for (const n in ga.attributes) { const a = ga.attributes[n]; ga.setAttribute(n, new THREE.Float32BufferAttribute(garde.flatMap(i => Array.from(a.array.slice(i * a.itemSize, (i + 1) * a.itemSize))), a.itemSize)); }
      ga.setIndex(Array.from(ga.index.array).filter((_, k) => k < 18 || k > 23).map(i => i > 15 ? i - 4 : i)); ga.clearGroups();
      const ma = inst(h, ga, laque, autos); autos.forEach((p, i) => ma.setColorAt(i, new THREE.Color(p[7]))); ma.instanceColor.needsUpdate = true;
      [inst(h, h.geo('bloc'), h.mat('parking'), dalles), ma, ...insts(h, 'campingCar', { caisse: h.mat('campingCar'), bande: h.mat('peinture', { c: 0xffffff }), vitre: h.mat('vitreSombre'), pneu: h.mat('pneu') }, cc, { teinte: 'bande' })]
        .forEach(m => { m.castShadow = false; }); // loin derrière les tribunes : leur ombre ne se verrait pas

      // --- les stands, côté intérieur du départ : voie des stands, garages des équipes ---
      const gar = [], E = [0xe83f8c, 0x1848c8, 0xffc04a, 0x2aa39a, 0xc8102e, 0xf4f0e0, 0xff7a3d, 0x3d2a5c];
      h.ribbon(N - 110, 200, W + 0.3, 0.04, W + 19, 0.04, h.mat('bitume', { side: THREE.DoubleSide }), 8);
      for (let j = 0, i = N - 106; j < 32; j++, i = (i + 6) % N) {
        const s = S[i], [x, z] = bord(s, 1, W + 21); gar.push([x, s.y, z, Math.atan2(-s.tz, s.tx), 1, 1, 1, E[j % E.length]]); // Z local vers l'intérieur de l'ovale
      }
      insts(h, 'garage', { beton: h.mat('crepi'), porte: h.mat('garageOuvert', LUM), enseigne: h.mat('peinture', { lum: 1, c: 0xffffff }), toit: h.mat('matGris') }, gar, { teinte: 'enseigne' });
      for (let i = N - 100; i < N + 90; i += 40) { const s = S[i % N], [x, z] = bord(s, 1, W + 10); h.lum(i % N, x, s.y + 14, z, 0xfff4e0, 32, 0.45); } // la voie des stands est éclairée, sans plus : la chaussée mouillée renvoie chaque lampe
      // tour de chronométrage et pylône des positions, derrière les garages
      const nom = h.mat('ecrit', LUM, 128, 32, '#1a1420', '#ff7a3d', 'CANAL 6', 26), score = h.mat('pyloneChrono', LUM);
      h.pose('tourChrono', { beton, loge: h.mat('loges', LUM), nom }, h.scene, [-30, g.hAt(-30, 90), 90]);
      h.pose('pyloneScore', { acier, ecran: score }, h.scene, [60, g.hAt(60, 75), 75]);
      // écrans géants du classement dans l'herbe du milieu, tournés vers les deux lignes droites
      const ecran = h.mat('classement', LUM);
      for (const [x, z] of [[240, 70], [1250, 110], [1600, 140]]) if (g.dAt(x, z) > W + 22) h.pose('ecranGeant', { acier, beton, ecran }, h.scene, [x, g.hAt(x, z), z]);
      // portiques de sponsors au-dessus de la piste
      for (const [i, t] of [[520, 'SOLAR COLA 500'], [1560, 'PALM TIRES · DUSK RADIO']]) h.pose('portiquePub', { ecran: h.mat('ecranPub', LUM, '#ffc04a', t), beton: acier }, repere(h, S[i]), [0, 0, 0], W);
      // mâts de projecteurs du côté intérieur : ils éclairent la chaussée
      const mats = [];
      for (let i = 30; i < N; i += 55) { const s = S[i], [x, z] = bord(s, 1, s.w + 9); if (g.dAt(x, z) < s.w + 7) continue; mats.push([x, g.hAt(x, z), z, 0]); const [lx, lz] = bord(s, 1, W - 2); h.lum(i, lx, s.y + 16, lz, 0xfff0d8, 45, 0.6); }
      insts(h, 'matEclairage', { acier, lampe }, mats);
      // quelques palmiers entre la piste et les tribunes
      const troncs = [], palmes = [];
      for (let i = 10; i < N; i += 37) { const s = S[i], [x, z] = bord(s, -1, s.w + 8); if (g.dAt(x, z) < s.w + 6) continue; const y = g.hAt(x, z), ht = 13 + rnd() * 5; troncs.push([x, y + ht / 2, z, 0, 1, ht, 1]); palmes.push([x, y + ht, z, rnd() * 6]); }
      inst(h, h.geo('troncPalmier'), h.mat('troncPalmier'), troncs); insts(h, 'palmes', { palme: h.mat('palme', { side: THREE.DoubleSide }) }, palmes);

      // --- la boue du canal (pts 3-4) : là où la route s'élargit (M.large), tout ce qui dépasse le bitume est de la boue (M.surf.large : la physique la roule comme de la terre) ---
      const b0 = pt(h, 3) - 40, b1 = pt(h, 4) + 40, boue = h.mat('bruit', { side: THREE.DoubleSide, gloss: 0.3 }, '#4a3b2a', ['#3a2c1e', '#5e4a32', '#2a2016', '#6a5a44']);
      for (const sd of [-1, 1]) h.ribbon((b0 + N) % N, b1 - b0, s => sd * (W - 0.05), 0.02, s => sd * s.w, 0.02, boue, 6);
      // --- l'écluse du retour (pt 16) : la rampe de M.sauts monte entre deux bajoyers, finit net sous la passerelle de manœuvre ; les 8 derniers mètres en chevrons (signal des cartes à relief) ---
      { const i = pt(h, h.M.sauts[0][0]), s = S[i];
        h.pose('ecluse', { beton, bois: h.mat('planches'), acier, rouge: h.mat('peinture', { c: 0xc8102e }) }, repere(h, s), [0, 0, 0], s.w);
        h.ribbon((i - 4 + N) % N, 4, -W + 0.6, 0.05, W - 0.6, 0.05, h.mat('banderoleSaut', { lum: 1, rep: [4, 1] }), 3.5); h.lum(i, s.x, s.y + 11, s.z, 0xffd8a0, 36, 0.5); }

      // --- l'aller (pts 1-6), devant la tribune nord : le défilé du meeting entre le grillage et les gradins. Un char tous les 120 m, et entre deux,
      // la fanfare en rangs de quatre (tenues rouges) précédée d'une ligne de majorettes (bleu et rose) ; tout le monde marche dans le sens de la course ---
      const chars = [], fanfare = [], majo = [], fil = (i, off) => { const s = S[(Math.round(i) + N) % N], [x, z] = bord(s, -1, s.w + off); return [x, s.y + h.TH.murH, z, Math.atan2(-s.tz, s.tx)]; }; // sur l'allée, au niveau du haut du muret : au sol, le muret les cachait
      { const a0 = pt(h, 1) - 20, cnt = pt(h, 6) - a0, dalle = h.mat('beton', { side: THREE.DoubleSide }); // l'allée du défilé : une terrasse de béton du muret à la façade des gradins
        h.ribbon(a0, cnt, s => -(s.w + 0.3), h.TH.murH, s => -(s.w + 11.6), h.TH.murH, dalle, 8); h.ribbon(a0, cnt, s => -(s.w + 11.6), h.TH.murH, s => -(s.w + 11.6), -3, dalle, 8); }
      const COULC = [0xe83f8c, 0xffc04a, 0x2aa39a, 0x1848c8, 0xff7a3d];
      for (let i = pt(h, 1), k = 0; i < pt(h, 6) - 40; i += 60, k++) {
        chars.push([...fil(i, 5.2), 1, 1, 1, COULC[k % COULC.length]]);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) fanfare.push([...fil(i + 9 + r * 0.7, 3.4 + c * 1.1), 1, 1, 1, 0xc8102e]);
        for (let c = 0; c < 6; c++) majo.push([...fil(i + 13, 3 + c * 0.9), 1, 1, 1, c % 2 ? 0xe83f8c : 0x1848c8]);
      }
      const blanc = h.mat('peinture', { c: 0xf4f0e0 }), damier = h.mat('damier', { lum: 1, net: 1, side: THREE.DoubleSide }, '#f4f0e0');
      const peauF = { blanc, peau: h.mat('peinture', { c: 0xc8926a }), tenue: h.mat('peinture', { c: 0xffffff }), or: h.mat('peinture', { c: 0xe0b040 }) };
      insts(h, 'figurant', peauF, fanfare, { a: [0], teinte: 'tenue' }); insts(h, 'figurant', peauF, majo, { a: [1], teinte: 'tenue' });
      insts(h, 'charMeeting', { caisse: h.mat('laque', { c: 0xf4f0e0 }), vitre: h.mat('vitreSombre'), blanc, deco: h.mat('peinture', { c: 0xffffff }), drapeau: damier, pneu: h.mat('pneu') }, chars, { teinte: 'deco' });

      // --- le retour (pts 13-18), devant la tribune sud : une haie de drapeaux à damier des deux côtés, et loin à l'ouest, dans le couchant qu'on a en face,
      // les montgolfières du meeting (hors brouillard : des silhouettes de couleur sur le ciel orange) ---
      const mats2 = []; for (let i = pt(h, 13), k = 0; i < pt(h, 18); i += 14, k++) { const s = S[i], sd = k % 2 ? 1 : -1, [x, z] = bord(s, sd, s.w + 3); mats2.push([x, g.hAt(x, z), z, Math.atan2(-s.tz, s.tx) + Math.PI]); }
      insts(h, 'matDamier', { acier, drapeau: damier }, mats2);
      const ballons = [], nacelles = [], COULB = [0xe83f8c, 0xffc04a, 0x2aa39a, 0x1848c8, 0xc8102e, 0xf4f0e0, 0x3d2a5c];
      for (let k = 0; k < 16; k++) { const x = -330 - rnd() * 380, z = 280 + rnd() * 420, y = 60 + rnd() * 140, r = 18 + rnd() * 8; // à moins de 2 350 m de la piste : au-delà, derrière le ciel
        ballons.push([x, y, z, rnd() * 6, r, r, r, COULB[k % COULB.length]]); nacelles.push([x, y - r * 1.15 - 3, z, 0, 1.8, 1.4, 1.8]); }
      const mb = inst(h, h.geo('ballon'), h.mat('peinture', { c: 0xffffff, fog: false }), ballons); ballons.forEach((p, i) => mb.setColorAt(i, new THREE.Color(p[7]))); mb.instanceColor.needsUpdate = true;
      inst(h, h.geo('boite', 1, 1, 1), h.mat('planches', { fog: false }), nacelles);
      // dirigeable du meeting, qui tourne lentement au-dessus de l'ovale
      const dg = new THREE.Group(); dg.userData.dyn = 1; h.scene.add(dg); // dyn : il vole, hors fusion du décor fixe (game.js)
      h.pose('enveloppe', h.mat('laque', { c: 0xe8e4dc }), dg);
      h.pose('dirigeable', { nacelle: h.mat('matGris'), aileron: h.mat('peinture', { c: 0xe83f8c }), ecran: h.mat('ecrit', LUM, 128, 26, '#1a1420', '#ffc04a', 'SOLAR COLA', 20) }, dg);
      // les tours du centre-ville à l'ouest, à contre-jour devant le soleil
      const tours = h.mat('tourLoin', { lum: 1, fog: false }, '#2a1c3a', ['#ffc04a'], 40);
      for (let i = 0; i < 34; i++) { const hh = 120 + rnd() * rnd() * 380, w = 50 + rnd() * 70; boite(h, tours, w, hh, w, -2300 + rnd() * 900, hh / 2, -500 + rnd() * 1300); }
      // la foule bouge : chaque étage de gradins passe par moments à sa variante bras levés ; le dirigeable fait le tour en une vingtaine de minutes
      return (dt, now, car) => {
        if (car) {
          olaI.forEach((p, k) => { const d = (p[7] - car.idx + N * 1.5) % N - N / 2, e = Math.max(0, 1 - Math.abs(d - 14) / 28); // écart signé en échantillons ; vague centrée 14 (28 m) devant la voiture
            o4.position.set(p[0], p[1] + (e ? e * 1.6 - 1 : -60), p[2]); o4.rotation.set(0, p[3], 0); o4.scale.set(p[4], p[5], p[6]); o4.updateMatrix(); ola.setMatrixAt(k, o4.matrix); });
          ola.instanceMatrix.needsUpdate = true;
        }
        foule.map.offset.y = Math.sin(now * 0.0021) + Math.sin(now * 0.0057) > 0.7 ? 0.5 : 0;
        foule2.map.offset.y = Math.sin(now * 0.0017 + 2) + Math.sin(now * 0.0049) > 0.5 ? 0.5 : 0;
        const t = now * 0.00006; dg.position.set(760 + Math.cos(t) * 520, 125, 110 + Math.sin(t) * 260); dg.rotation.y = -t - Math.PI / 2;
      };
    },
  });
})();
