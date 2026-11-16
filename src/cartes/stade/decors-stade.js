// Placement du décor de « stade » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  Object.assign(DECORS, {
    // ---------- Grand Vacarme : une arène couverte, comble. Sol de terre battue, gradins sur tout le pourtour, charpente et rampes de projecteurs, cube d'affichage au centre.
    // Au milieu, l'aire ouverte (M.place) : on y roule partout, entre la scène et la butte de sortie d'épingle on coupe sous l'arche de feu. Le jeu ne dessine ici aucun mur (th.murH = 0) :
    // c'est ce décor qui pose le sol des parties larges et les murs, là où la simulation en met (bord de chaussée hors de l'aire, bord de l'aire hors de la chaussée) ----------
    stade(h) {
      const { THREE, S, N, W, M } = h, net = m => { m.map.anisotropy = 8; return m; }, PL = M.place, [CX, CZ] = PL.c;
      const AD = { lum: 1, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }; // lumière ajoutée : flammes, lasers, faisceaux
      const dansAire = (x, z, e = 0) => Math.hypot(x - CX, z - CZ) < PL.r + e, ouvert = s => s.w > W + 0.05 && !s.rc, au = (s, d, y = 0) => [s.x - s.tz * d, s.y + y, s.z + s.tx * d];
      const haut = s => s.rc ? s.rc - Math.sqrt(s.rc * s.rc - Math.min(s.w - s.pl, 0.98 * s.rc) ** 2) : 0; // hauteur du mur roulable à son sommet (sim.js : paroi)
      // le terrain suit la piste (tremplins = buttes, fosse = cratère) ; sous les parties larges et l'aire il s'efface : leur sol est posé plus bas
      const g = terrain(h, { pas: 8, marge: 150, mat: h.mat('terreBattue'), creux: (x, z) => { const s = S[near(h, x, z)]; return (ouvert(s) && Math.hypot(s.x - x, s.z - z) < s.w + 3) || dansAire(x, z, 3) ? 1.5 - Math.min(0, s.y) : 0; } });
      // une nappe de quadrilatères en une seule passe de dessin. tuile : texture plaquée en plan tous les `tuile` m ; sinon u en travers, v le long
      const nappe = (mat, tuile) => { const pos = [], uv = [], idx = []; return {
        quad(a, b, c, d, v0 = 0, v1 = 1) { const k = pos.length / 3; [a, b, c, d].forEach((p, j) => { pos.push(p[0], p[1], p[2]); if (tuile) uv.push(p[0] / tuile, p[2] / tuile); else uv.push(j & 1, j < 2 ? v0 : v1); }); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); },
        fin() { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); q.setIndex(idx); q.computeVertexNormals(); const m = new THREE.Mesh(q, mat); h.scene.add(m); return m; } }; };
      // le sol : de part et d'autre de la chaussée dans les parties larges, le disque de l'aire, et la butte de sortie d'épingle qui s'étend de la piste au mur de la scène
      const sol = nappe(h.mat('terreBattue', { side: THREE.DoubleSide }), 10), iB = pt(h, 16);
      for (let i = 0; i < N; i++) { const a = S[i], b = S[(i + 1) % N];
        if (ouvert(a) || ouvert(b)) for (const sd of [-1, 1]) sol.quad(au(a, sd * W), au(a, sd * a.w), au(b, sd * W), au(b, sd * b.w));
        if (i > iB - 16 && i <= iB) sol.quad(au(a, -W), au(a, CZ - a.z), au(b, -W), au(b, CZ - b.z)); }
      for (let k = 0; k < 48; k++) { const f = j => [CX + Math.cos(j * Math.PI / 24) * PL.r, -0.03, CZ + Math.sin(j * Math.PI / 24) * PL.r], c = [CX, -0.03, CZ]; sol.quad(c, f(k), c, f(k + 1)); }
      sol.fin();
      // les murs : la glissière du thème, au bord de la chaussée (au sommet des murs roulables) sauf dans l'aire, et autour de l'aire là où elle déborde de la chaussée ; aux pointes où les deux bords se croisent, seulement là où sim.js met un mur (derrière la glissière, ni chaussée ni aire)
      const mur = nappe(h.mat('glissiere', { side: THREE.DoubleSide }, h.TH.mur)), pan = (p, q, v) => mur.quad([p[0], p[1] + 1.2, p[2]], [p[0], p[1] - 0.6, p[2]], [q[0], q[1] + 1.2, q[2]], [q[0], q[1] - 0.6, q[2]], v, v + 0.25);
      for (let i = 0; i < N; i++) for (const sd of [-1, 1]) { const a = S[i], b = S[(i + 1) % N], p = au(a, sd * a.w, haut(a)), q = au(b, sd * b.w, haut(b)); const o = au(a, sd * (a.w + 2.2)); if ((!dansAire(p[0], p[2], -0.4) || !dansAire(q[0], q[2], -0.4)) && !dansAire(o[0], o[2], -1.1)) pan(p, q, i / 4); }
      for (let k = 0; k < 96; k++) { const f = j => [CX + Math.cos(j * Math.PI / 48) * PL.r, 0, CZ + Math.sin(j * Math.PI / 48) * PL.r], p = f(k), q = f(k + 1), x = (p[0] + q[0]) / 2, z = (p[2] + q[2]) / 2, s = S[near(h, x, z)];
        const f2 = 1 + 2.2 / PL.r, ox = CX + (x - CX) * f2, oz = CZ + (z - CZ) * f2, s2 = S[near(h, ox, oz)]; if (Math.hypot(s.x - x, s.z - z) > s.w - 0.4 && Math.hypot(s2.x - ox, s2.z - oz) > s2.w - 1.1) pan(p, q, k / 4); }
      mur.fin();
      // le pourtour : deux longs côtés, deux angles arrondis à l'est, un demi-cercle à l'ouest qui épouse le grand virage relevé. Pièces [longueur, rayon, u => x, z, normale sortante]
      const X0 = -68, X1 = 308, Z0 = -34, Z1 = 354, RE = 90, RW = (Z1 - Z0) / 2, arc = (cx, cz, R, a0) => u => { const a = a0 + u / R; return [cx + Math.cos(a) * R, cz + Math.sin(a) * R, Math.cos(a), Math.sin(a)]; };
      const tour = [[X1 - X0, 0, u => [X0 + u, Z0, 0, -1]], [RE * Math.PI / 2, RE, arc(X1, Z0 + RE, RE, -Math.PI / 2)], [Z1 - Z0 - 2 * RE, 0, u => [X1 + RE, Z0 + RE + u, 1, 0]],
        [RE * Math.PI / 2, RE, arc(X1, Z1 - RE, RE, 0)], [X1 - X0, 0, u => [X1 - u, Z1, 0, 1]], [RW * Math.PI, RW, arc(X0, (Z0 + Z1) / 2, RW, Math.PI / 2)]];
      // un module de gradin tous les 14 m ; dans les arcs il s'élargit pour refermer l'éventail jusqu'au mur du fond
      const grad = [];
      for (const [len, R, f] of tour) { const n = Math.round(len / 14), pas = len / n;
        for (let k = 0; k < n; k++) { const [x, z, nx, nz] = f((k + 0.5) * pas); grad.push([x, Math.min(g.hAt(x, z), 0) - 0.6, z, Math.atan2(nx, nz), pas / 14 * (R ? (R + 54) / R : 1) + 0.02, 1, 1]); } }
      const acier = h.mat('acier'), beton = h.mat('beton'), lampe = h.mat('lampe', LUM);
      const foule = net(h.mat('foule', {}, '#3a3448', '#e8362a')), foule2 = net(h.mat('foule', {}, '#2e2a3c', '#ffc21a'));
      insts(h, 'gradinArene', { beton, banderole: h.mat('banderoleStade', LUM, 0), banderole2: h.mat('banderoleStade', LUM, 2), foule, foule2, escalier: h.mat('marches'), loge: h.mat('loges', LUM), acier, lampe }, grad);
      // le toit : une sous-face semée de lampes, et une ferme tous les 70 m d'un long côté à l'autre, avec ses rampes de projecteurs
      const HT = 63, cx = (X0 - RW + X1 + RE) / 2, cz = (Z0 + Z1) / 2;
      const toit = h.mat('toitArene', LUM); boite(h, toit, X1 + RE - X0 + RW + 120, 1, Z1 - Z0 + 120, cx, HT + 0.5, cz);
      const peauF = { acier, lampe, treillis: h.mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide, rep: [(Z1 - Z0) / 6.2, 1] }, '#3a3e4a') };
      for (let x = -230; x <= 380; x += 70) h.pose('fermeToit', peauF, h.scene, [x, HT - 4.5, cz], Z1 - Z0 + 100);
      // le cube d'affichage au-dessus de l'aire, et un écran géant à chaque bout de la salle (deux images qui alternent)
      h.pose('cubeScore', { ecran: h.mat('tableauStade', LUM), acier, bande: h.mat('peinture', { lum: 1, c: 0xffc21a }) }, h.scene, [CX, HT - 30, CZ]);
      const ecranG = h.mat('ecranGeant', LUM); ecranG.map.repeat.set(1, 0.5);
      for (const x of [X1 + RE + 34, X0 - RW - 34]) boite(h, ecranG, 1, 18, 84, x, 50, cz);
      // la scène (elle ferme l'est de l'aire), le mur de la butte et l'arche de feu entre les deux : ce sont les piles de M.place
      const chev = h.mat('banderoleSaut', { lum: 1, rep: [4, 1] });
      h.pose('sceneArene', { beton, ecran: h.mat('banderoleStade', LUM, 4), bande: h.mat('peinture', { lum: 1, c: 0xffc21a }), chevrons: h.mat('banderoleSaut', { lum: 1, rep: [6, 1] }), acier,
        enseigne: h.mat('ecrit', LUM, 192, 16, '#16161c', '#ff8a1a', 'ARCHE DE FEU', 12) }, h.scene, [CX, 0, CZ]);
      // les 8 derniers mètres de chaque tremplin peints de chevrons (même signal sur toutes les cartes à relief ; pas de portique au-dessus, il chargeait la vue)
      for (const [p] of M.sauts) { const i = pt(h, p); h.ribbon((i - 4 + N) % N, 4, -W + 0.6, 0.05, W - 0.6, 0.05, chev, 3.5); }
      // les flammes : deux lance-flammes au bout de chaque tremplin (leur lueur éclaire la butte), une rangée sur l'arche et une sur la scène. [x, y, z, rotation, largeur, hauteur]
      const feux = [];
      for (const [p] of M.sauts) { const i = pt(h, p), s = S[i]; h.lum(i, s.x, s.y + 4, s.z, 0xff7a20, 30, 0.45); for (const sd of [-1, 1]) feux.push([...au(s, sd * (s.w - 0.8)), h.across(s), 2.4, 6]); }
      for (let k = 0; k < 6; k++) feux.push([CX - 20 + k * 5.4, 12, CZ, 0, 2, 4.5]);
      for (let k = 0; k < 5; k++) feux.push([CX + 14 + k * 10, 4.5, CZ, 0, 2.4, 5]);
      const gf = new THREE.PlaneGeometry(1, 1); gf.translate(0, 0.5, 0);
      const mf = new THREE.InstancedMesh(gf, h.mat('flamme', AD), feux.length), o3 = new THREE.Object3D(); mf.frustumCulled = false; mf.userData.dyn = 1; h.scene.add(mf);
      // deux éventails de lasers sous le cube, quatre faisceaux de poursuite qui balaient la piste, et les flashs des appareils photo dans les gradins
      const lasers = [0x30ff70, 0xff30c0].map(c => h.pose('eventailLaser', { rayon: h.mat('peinture', { ...AD, c }) }, h.scene, [CX, HT - 38, CZ])[0]);
      const gc = new THREE.ConeGeometry(9, 56, 10, 1, true); gc.translate(0, -28, 0); const mc = h.mat('faisceau', AD);
      const cones = [[-60, 60], [80, 250], [220, 70], [330, 240]].map(([x, z]) => { const m = new THREE.Mesh(gc, mc); m.position.set(x, HT - 6, z); h.scene.add(m); return m; });
      const fl = []; for (let k = 0; k < 900; k++) { const p = grad[(h.rnd() * grad.length) | 0], t = h.rnd(), lx = (h.rnd() - 0.5) * 13 * p[4], lz = 2 + 26 * t, c = Math.cos(p[3]), s = Math.sin(p[3]); fl.push(p[0] + lx * c + lz * s, p[1] + 5.5 + 15 * t, p[2] - lx * s + lz * c); }
      const gfl = new THREE.BufferGeometry(); gfl.setAttribute('position', new THREE.Float32BufferAttribute(fl, 3));
      const flashs = new THREE.Points(gfl, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); flashs.frustumCulled = false; h.scene.add(flashs);
      // panneaux des annonceurs derrière les murs, et les projecteurs qui éclairent la piste : blancs, pour que la terre garde sa couleur
      const pubs = [['VOLT COLA', '#e8362a', '#f4f0e0'], ['KOP 170', '#16161c', '#ffc21a'], ['TONNERRE', '#f4f0e0', '#1c3fa8'], ['BRASERO', '#ffc21a', '#16161c']].map(([t, a, b]) => h.mat('ecrit', LUM, 64, 32, a, b, t, 11));
      [[9, -1], [13, 1], [16, 1], [22, 1], [24, -1], [1, 1]].forEach(([p, sd], k) => { const s = S[pt(h, p)]; h.pose('panneauPub', { mat: h.mat('fer'), affiche: pubs[k % pubs.length] }, repere(h, s), [sd * (s.w + 7), 0, 0], sd * 0.5); });
      for (let i = 0; i < N; i += 45) h.lum(i, S[i].x, S[i].y + 20, S[i].z, 0xeef2ff, 55, 0.22);
      const rnd = h.rnd, ext = s => s.k > 0 ? -1 : 1, wrap = a => Math.atan2(Math.sin(a), Math.cos(a)); // ext : côté extérieur d'un virage (sim.js : k > 0 = à droite)
      const peauV = { caisse: h.mat('peinture', { c: 0xffffff }), vitre: h.mat('vitreSombre'), feuRouge: h.mat('feuRouge'), feuBlanc: h.mat('matGris'), chassis: h.mat('matGris'), roue: h.mat('roue'), pneu: h.mat('pneu') };
      const rouilles = [0x8a4a2a, 0x5a6a7a, 0xa89a50, 0x6a2a2a, 0x3a5a3a, 0x9a9a9a];
      // premier demi-tour (points 4 à 8, à plat, deux angles serrés) : à l'extérieur, une banquette de béton chargée d'un mur de pneus qui dépasse la glissière de 1,6 m, et sur les pneus, les carcasses écrasées des soirées précédentes
      { const i0 = pt(h, 4), n = (pt(h, 8) - i0 + N) % N, sd = ext(S[pt(h, 5)]), pn = [], carc = [];
        h.ribbon(i0, n, s => sd * s.w, haut, s => sd * (s.w + 2.6), haut, beton, 8); h.ribbon(i0, n, s => sd * (s.w + 2.6), haut, s => sd * (s.w + 2.6), -2, beton, 8);
        for (let k = 0; k < n; k++) { const s = S[(i0 + k) % N], y = s.y + haut(s);
          for (const r of [0.6, 1.6]) for (const l of [-0.5, 0.5]) { const [x, z] = bord(s, sd, s.w + r), nb = r > 1 && k % 5 === 2 ? 6 : 9; for (let e = 0; e < nb; e++) pn.push([x + s.tx * l, y + 0.15 + e * 0.31, z + s.tz * l, rnd() * 3]); }
          if (k % 14 === 7) { const [x, z] = bord(s, sd, s.w + 1.1); carc.push([x, y + 3, z, h.across(s) + Math.PI / 2 + (rnd() - 0.5) * 0.4, 1, 0.38, 1, rouilles[carc.length % rouilles.length]]); } }
        inst(h, new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10), h.mat('pneu'), pn); insts(h, 'voitureGaree', peauV, carc, { teinte: 'caisse' }); }
      // second demi-tour (points 17 à 21) : les banderoles des supporters pendent du toit au-dessus de l'extérieur du virage, chacune à son câble, et se balancent
      const bans = []; { const i0 = pt(h, 17), n = (pt(h, 21) - i0 + N) % N, sd = ext(S[pt(h, 19)]);
        for (let k = 0; k < 6; k++) { const s = S[(i0 + Math.round((k + 0.5) * n / 6)) % N], [x, z] = bord(s, sd, s.w + 6 + (k % 2) * 6), y = 30 + (k % 3) * 3;
          const m = boite(h, h.mat('banderoleSupporter', { lum: 1, c: 0xd0d0d0 }, k), 0.12, 16, 6, x, y, z); m.rotation.y = h.across(s); bans.push(m);
          boite(h, acier, 0.1, HT - y - 8, 0.1, x, (HT + y + 8) / 2, z); } }
      // la fosse (le tremplin qui a une fosse) : boue au fond et sur ses bords, voitures broyées derrière ses glissières, monster truck garé au bord du côté de l'aire
      { const [p, , , F] = M.sauts.find(s => s[3]), i0 = pt(h, p), nf = Math.round(F / 2), boue = h.mat('boue', { gloss: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), br = [];
        h.ribbon((i0 + 1) % N, nf - 1, s => -s.w - 4, 0.04, s => s.w + 4, 0.04, boue, 6);
        for (let k = 0; k < 8; k++) { const s = S[(i0 + 2 + Math.round(k * (nf - 6) / 7)) % N], sd = k & 1 ? 1 : -1, [x, z] = bord(s, sd, s.w + 1.6 + (k % 3) * 0.6); br.push([x, s.y + 0.05 + (k % 4 === 0 ? 0.5 : 0), z, h.across(s) + Math.PI / 2 + (rnd() - 0.5) * 0.8, 1, 0.32, 1.05, rouilles[k % rouilles.length]]); }
        insts(h, 'voitureGaree', peauV, br, { teinte: 'caisse' });
        const s = S[i0], sd = Math.hypot(...bord(s, 1, 1).map((v, j) => v - [CX, CZ][j])) < Math.hypot(...bord(s, -1, 1).map((v, j) => v - [CX, CZ][j])) ? 1 : -1, [x, z] = bord(s, sd, s.w + 9);
        const mt = new THREE.Group(); mt.position.set(x, g.hAt(x, z), z); mt.rotation.y = h.across(s) + Math.PI / 2 + 0.5; h.scene.add(mt);
        h.pose('monsterTruck', { caisse: h.mat('peinture', { c: 0x2ab84a }), flammes: h.mat('peinture', { c: 0xff8a1a }), vitre: h.mat('vitreSombre'), chassis: h.mat('matGris'), acier, pneu: h.mat('pneu'), lampe }, mt); }
      // étincelles : à chaque décollage, une gerbe tombe de la charpente au-dessus de la voiture suivie (une seule gerbe à la fois)
      const NE = 160, pe = new Float32Array(NE * 3), ve = new Float32Array(NE * 3), ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(pe, 3));
      const me = new THREE.PointsMaterial({ color: 0xffb040, size: 0.7, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }), etin = new THREE.Points(ge, me); etin.frustumCulled = false; etin.visible = false; h.scene.add(etin);
      // la ola : une copie bras levés de la foule de l'anneau bas, levée sur les gradins proches de la voiture suivie et cachée sous le sol ailleurs ; elle court avec elle autour de la salle
      // shortcut: elle suit la voiture que le décor reçoit (celle du joueur), pas la tête de course ; il faudrait que game.js passe la voiture de tête au décor
      // (code de la foule et de la ola : src/rendu/foule.js, partagé avec canal)
      const ag = grad.map(p => Math.atan2(p[2] - cz, p[0] - cx)), foulée = POSEURS.foule(h, { ola: { mods: grad, larg: 14, prof: 30, pente: Math.atan2(15, 26), y: 11.5, z: 15, ecart: (k, car) => Math.max(0, 1 - Math.abs(wrap(ag[k] - Math.atan2(car.z - cz, car.x - cx) + 0.12)) / 0.22) },
        etages: [{ mat: foule, f1: 0.0023, f2: 0.0061, ph: 0, seuil: 0.6 }, { mat: foule2, f1: 0.0019, f2: 0.0047, ph: 2, seuil: 0.5 }] }), BAS = new THREE.Vector3(0, -1, 0), vise = new THREE.Vector3();
      // confettis de l'arrivée : ils tombent en tournoyant au-dessus de la ligne, repartent du toit tant que le tableau d'arrivée est là
      const NC = 700, pc = new Float32Array(NC * 3), cc = new Float32Array(NC * 3), gc2 = new THREE.BufferGeometry(), teintes = [[1, 0.76, 0.1], [0.91, 0.21, 0.16], [0.11, 0.25, 0.66], [0.96, 0.94, 0.88]];
      for (let k = 0; k < NC; k++) { const c = teintes[k % 4]; cc.set(c, k * 3); pc[k * 3 + 1] = -99; }
      gc2.setAttribute('position', new THREE.BufferAttribute(pc, 3)); gc2.setAttribute('color', new THREE.BufferAttribute(cc, 3));
      const conf = new THREE.Points(gc2, new THREE.PointsMaterial({ size: 0.45, vertexColors: true, fog: false })); conf.frustumCulled = false; conf.visible = false; h.scene.add(conf);
      const cone0 = cones.map(m => m.position.clone());
      let tE = 9, parti = false, vol = 0, rejoue = 0, eteint = 0, fete = false;
      return (dt, now, car) => {
        if (car) {
          // décollage franc (pas une bosse) : la gerbe part ; réception d'un vrai saut : l'écran le rejoue
          if (car.air && car.airT > 0.2 && !parti) { parti = true; tE = 0;
            for (let k = 0; k < NE; k++) { pe[k * 3] = car.x + car.vx * 0.8 + (Math.random() - 0.5) * 14; pe[k * 3 + 1] = HT - 8 - Math.random() * 3; pe[k * 3 + 2] = car.z + car.vz * 0.8 + (Math.random() - 0.5) * 14;
              ve[k * 3] = (Math.random() - 0.5) * 3; ve[k * 3 + 1] = -Math.random() * 4; ve[k * 3 + 2] = (Math.random() - 0.5) * 3; } }
          if (car.air) vol = Math.max(vol, car.airT); else { if (vol > 0.6) rejoue = now + 4000; vol = 0; parti = false; }
        }
        if (tE < 4) { tE += dt; for (let k = 0; k < NE * 3; k++) { if (k % 3 === 1) ve[k] -= 9.81 * dt; pe[k] += ve[k] * dt; } ge.attributes.position.needsUpdate = true; me.opacity = Math.max(0, 1 - tE / 4); }
        etin.visible = tE < 4;
        // dernier tour : la salle s'éteint, les quatre poursuites viennent se braquer sur la voiture ; arrivée : confettis
        // shortcut: dernier tour = car.lap === 3 (session.js : toute course contre l'IA fait 3 tours) ; à revoir si le nombre de tours devient réglable
        const der = !!(car && car.lap === 3), arrive = der && car.dist >= 3 * N;
        eteint += ((der && !arrive ? 1 : 0) - eteint) * Math.min(1, dt * 1.5);
        toit.color.setScalar(1 - 0.8 * eteint); lampe.color.setScalar(1 - 0.85 * eteint); mc.color.setScalar(1 + 2 * eteint);
        foulée(dt, now, car); // la foule bouge : bras levés par moments, et la ola
        ecranG.map.offset.y = now < rejoue ? Math.floor(now / 200) % 2 * 0.5 : Math.floor(now / 2500) % 2 * 0.5; // après un saut, « QUEL SAUT ! » clignote
        // les flammes tremblent, et chaque lance-flammes crache un grand coup toutes les 3 s, à son tour
        feux.forEach(([x, y, z, r, w, ht], k) => { const coup = (now * 0.001 + k * 0.37) % 3.2 < 0.45 ? 1.9 : 1, f = 0.75 + 0.25 * Math.sin(now * 0.021 + k * 1.7) * Math.sin(now * 0.013 + k);
          o3.position.set(x, y, z); o3.rotation.set(0, r, 0); o3.scale.set(w * (0.85 + 0.15 * f), ht * f * coup, 1); o3.updateMatrix(); mf.setMatrixAt(k, o3.matrix); });
        mf.instanceMatrix.needsUpdate = true;
        lasers.forEach((m, k) => m.rotation.set(Math.sin(now * 0.0007 + k * 2) * 0.5, now * 0.0004 * (k ? -1 : 1) + k * 1.57, 0));
        cones.forEach((m, k) => { if (eteint > 0.5 && car) { const a = k * 1.571 + now * 0.0002; m.position.set(car.x + Math.cos(a) * 30, HT - 6, car.z + Math.sin(a) * 30); m.scale.set(0.5, 1.25, 0.5);
            m.quaternion.setFromUnitVectors(BAS, vise.set(car.x - m.position.x, car.y - m.position.y, car.z - m.position.z).normalize()); }
          else { m.position.copy(cone0[k]); m.scale.set(1, 1, 1); m.rotation.set(Math.sin(now * 0.0006 + k) * 0.45, 0, Math.cos(now * 0.0008 + k * 2) * 0.45); } });
        if (arrive && !fete) { const s = S[0]; for (let k = 0; k < NC; k++) { pc[k * 3] = s.x + (Math.random() - 0.5) * 70; pc[k * 3 + 1] = 15 + Math.random() * (HT - 20); pc[k * 3 + 2] = s.z + (Math.random() - 0.5) * 40; } }
        fete = arrive; conf.visible = fete;
        if (fete) { for (let k = 0; k < NC; k++) { const j = k * 3; pc[j] += Math.sin(now * 0.003 + k) * 1.5 * dt; pc[j + 1] -= (2 + k % 3) * dt; pc[j + 2] += Math.cos(now * 0.0027 + k * 1.3) * 1.5 * dt; if (pc[j + 1] < 0) pc[j + 1] = HT - 8; } gc2.attributes.position.needsUpdate = true; }
        gfl.setDrawRange(Math.floor(now / 70) * 7919 % 860, 40);
      };
    },
  });
})();
