// Placement du décor de « chapada » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  Object.assign(DECORS, {
    // ---------- Manuscrit 512 (Bahia, de nos jours, 9 h) : la cité perdue, dans une vallée de jungle dont la route fait le tour. propositions/PROPOSITION-chapada.md ----------
    // L'aval est à l'ouest (bas), l'amont à l'est : la falaise du plateau ferme la vallée et la grande chute en tombe (la source). La rivière passe sous le pont de lianes,
    // descend par ressauts à l'intérieur de la boucle, longe la place de la cité, s'étale au gué et sort vers l'ouest dans la brume. Sens horaire : la droite est l'intérieur.
    // Un seul sol, une seule chaussée, une seule brume, une seule forêt d'un bout à l'autre (T-0) : une zone ne se distingue que par ce qui s'ajoute à la forêt (toile, pierre, eau, roche).
    // Contre « la vague » (D-9) : aucune crête qui suit le maillage du terrain, aucune grande surface à bandes horizontales, pas de grande facette de terrain nue.
    chapada(h) {
      const { THREE, S, N, W, rnd, T } = h, DS = { side: THREE.DoubleSide }, P = k => pt(h, k), IX = new Map(S.map((s, i) => [s, i]));
      const cache = new Map(), mat = (n, o = {}) => { const k = n + JSON.stringify(o); return cache.get(k) || cache.set(k, h.mat(n, o)).get(k); }; // une matière par réglage : le moteur fond le décor fixe par matière
      const entre = (i, a, b) => ((i - a + N) % N) <= ((b - a + N) % N), ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      let graine = 512; const alea = () => (graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296; // le hasard de la vie : il ne tire pas dans rnd, le décor fixe reste le même au caillou près
      const VIE = [], BRUME = h.mat('brume', { lum: 1 }).map; // VIE : ce que le tick anime, (dt, car, t) ; t = temps de jeu (figé en pause). Le vent de la carte souffle vers l'ouest (-x) : vapeur, fumée, flammes, feuilles
      // des bouffées qui montent et s'effacent (vapeur de la chute, embruns, brume du matin, fumée) : un nuage de points à transparence par point, en mélange normal.
      // Pas d'additif : le brouillard, ajouté par chaque point, brûlait le nuage en tache claire, et hors brouillard il ne se voyait que sur fond sombre. nait() = [x, y, z] d'une naissance ; f = opacité au plus fort
      const bouffees = (n, nait, { vie = 9, vx = -1.2, vy = 5.2, taille = 14, f = 0.3, c = [1, 1, 1] } = {}) => { const PP = new Float32Array(n * 3), CC = new Float32Array(n * 4), A = new Float32Array(n), gv = new THREE.BufferGeometry();
        gv.setAttribute('position', new THREE.BufferAttribute(PP, 3)); gv.setAttribute('color', new THREE.BufferAttribute(CC, 4));
        const o = new THREE.Points(gv, new THREE.PointsMaterial({ size: taille, map: BRUME, vertexColors: true, transparent: true, depthWrite: false })); o.frustumCulled = false; o.userData.dyn = 1; o.renderOrder = 5; h.scene.add(o);
        o.onBeforeRender = (r, sc, cam) => { o.material.size = Math.abs(cam.fov) === 90 && cam.aspect === 1 ? taille * 0.05 : taille; }; // dans le cube de reflets de la voiture (32 pixels de côté), three garde la taille en pixels de l'écran : une bouffée y couvrait une face entière et blanchissait les vitres
        const ne = k => { const p = nait(); PP[k * 3] = p[0]; PP[k * 3 + 1] = p[1]; PP[k * 3 + 2] = p[2]; A[k] = 0; };
        for (let k = 0; k < n; k++) { ne(k); A[k] = alea(); PP[k * 3] += A[k] * vie * vx; PP[k * 3 + 1] += A[k] * vie * vy; CC.set(c, k * 4); }
        VIE.push(dt => { dt = Math.min(dt, 0.1); for (let k = 0; k < n; k++) { A[k] += dt / vie; if (A[k] > 1) ne(k); PP[k * 3] += vx * dt; PP[k * 3 + 1] += vy * dt; CC[k * 4 + 3] = f * Math.sin(Math.PI * Math.sqrt(A[k])); }
          gv.attributes.position.needsUpdate = gv.attributes.color.needsUpdate = true; }); return o; };
      // une bête ou un objet posé à part : un groupe hors de la fusion du décor fixe (il bouge) ; fixe = 1 : il ne bouge pas, la fusion le prend
      const mobile = (nom, peau, x, y, z, ry = 0, k = 1, fixe = 0, ...a) => { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; p.scale.setScalar(k); if (!fixe) p.userData.dyn = 1; h.scene.add(p); h.pose(nom, peau, p, [0, 0, 0], ...a); return p; };
      const vers = (x, z, q) => Math.atan2(z - q.z, q.x - x); // l'angle qui tourne le +X d'une forme, posée en (x, z), vers l'échantillon q
      // un envol déclenché à l'approche (le modèle : les pigeons de decors-paris.js) : les bêtes posées partent quand la voiture est à moins de D échantillons de i0, puis sont reposées quand elle est loin.
      // ms = lots des bêtes posées ; vol = lots de leur forme en vol ; ailes = lots des ailes, qui battent (échelle en hauteur) ; meme = 1 : pas de forme en vol, la bête posée saute telle quelle (singes).
      // bête = { x, y, z, r, vx, vy, vz, e: [échelle] } ; g = gravité (positive : elles montent toujours plus ; négative : elles retombent). Tous ces lots portent dyn : sans lui, la fusion du décor fixe fige une copie de chaque bête
      const d3 = new THREE.Object3D(), ENVOLS = [], placeEnvol = (v, b) => { v.betes.forEach((q, k) => { const t = b === 1 ? v.t : 0, vol = t > 0 && t < v.T - 0.25, f = v.bat ? 0.15 + 0.85 * Math.sin(t * v.bat + k * 1.7) : 1;
          const met = (ms, vu, sy) => { d3.scale.set(vu ? q.e[0] : 1e-4, vu ? q.e[1] * sy : 1e-4, vu ? q.e[2] : 1e-4); d3.updateMatrix(); for (const m of ms) m.setMatrixAt(k, d3.matrix); };
          if (!v.meme) { d3.position.set(q.x, q.y, q.z); d3.rotation.set(0, q.r, 0); met(v.ms, t === 0, 1); }
          d3.position.set(q.x + q.vx * t, q.y + q.vy * t + v.g * t * t, q.z + q.vz * t); d3.rotation.set(0, t || !v.meme ? Math.atan2(-q.vz, q.vx) : q.r, 0);
          if (v.meme) met(v.ms, t < v.T - 0.25, 1); else { met(v.vol, vol, 1); met(v.ailes, vol, f); } });
        for (const m of v.tous) m.instanceMatrix.needsUpdate = true; };
      const envol = (ms, betes, i0, o = {}) => { const v = { ms: [].concat(ms), vol: [], ailes: [], betes, i0, D: 22, T: 5, g: 0.3, bat: 0, meme: 0, en: 0, t: 0, ...o }; v.tous = [...v.ms, ...v.vol, ...v.ailes]; for (const m of v.tous) m.userData.dyn = 1; ENVOLS.push(v); placeEnvol(v, 2); };
      VIE.push((dt, car) => { if (car) for (const v of ENVOLS) { const e = (v.i0 - car.idx + N) % N;
        if (!v.en && e < v.D && e > 0) { v.en = 1; v.t = 0; } else if (v.en && e > 300 && e < N - 300) { v.en = 0; placeEnvol(v, 2); }
        if (v.en && v.t < v.T) { v.t += dt; placeEnvol(v, 1); } } });
      const COULE = [], coule = (m, u, v) => { COULE.push([m.map, u, v]); return m; }; // l'eau qui coule : [texture, vitesse en u, vitesse en v] (répétitions par seconde), avancées par le tick renvoyé à la fin
      const tombe = (trous, op, v, c = 0xc4d8d4) => coule(h.mat('eauChute', { lum: 1, c, side: THREE.DoubleSide, transparent: true, opacity: op, depthWrite: false, lisse: 1 }, trous), 0, v); // de l'eau qui tombe : la texture glisse vers le bas
      // une nappe d'eau : une bande courbe qui suit la chute. secs, de haut en bas : [x du milieu, y, z, largeur] ; u en travers, v = la hauteur (une répétition tous les 16 m) ; sens : de quel côté (z) elle bombe, vers qui regarde
      // Toutes les nappes d'une même matière sont fondues en une seule géométrie à la fin (une passe de dessin par matière, pas une par nappe) : NAP les accumule, en coordonnées du monde
      const NAP = new Map(), tas = m => NAP.get(m) || NAP.set(m, { P: [], U: [], I: [] }).get(m), V3 = new THREE.Vector3();
      const nappe = (secs, m, rep, dz = 0, parent = null, sens = -1, vK = 16) => { const b = tas(m), base = b.P.length / 3, NX = 6; if (parent) parent.updateMatrixWorld(); /* vK : mètres de chute par répétition de la texture */
        secs.forEach(([x, y, z, w], i) => { for (let j = 0; j <= NX; j++) { const u = j / NX; V3.set(x + (u - 0.5) * w, y, z + dz + sens * 0.5 * Math.sin(u * Math.PI)); if (parent) V3.applyMatrix4(parent.matrixWorld); b.P.push(V3.x, V3.y, V3.z); b.U.push(u * rep, y / vK); }
          if (i) for (let j = 0; j < NX; j++) { const a = base + (i - 1) * (NX + 1) + j, c = a + NX + 1; b.I.push(a, c, a + 1, a + 1, c, c + 1); } }); };
      // une plaque d'eau à plat (bassin, écume) : w en travers, d dans le sens où la texture glisse, dans le repère parent
      const plat = (m, parent, [x, y, z], w, d) => { const b = tas(m), base = b.P.length / 3; parent.updateMatrixWorld();
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { V3.set(x + sx * w / 2, y, z + sz * d / 2).applyMatrix4(parent.matrixWorld); b.P.push(V3.x, V3.y, V3.z); b.U.push((sx + 1) * w / 16, (sz + 1) * d / 16); }
        b.I.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); };
      const e1 = tombe(5, 1, 0.55), e2 = tombe(11, 0.8, 0.9), ec = coule(h.mat('ecumeBassin', { lum: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false }), 0, 0.35), // les deux couches de toute chute, l'écume de tout bassin
        e3 = tombe(18, 0.88, 1.25, 0xffffff), ecV = coule(h.mat('ecumeBassin', { lum: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.7, depthWrite: false, rep: [1.4, 1.4] }), 0.04, 0.95), // le voile troué du bas de la chute ; l'écume vive des rouleaux (sa propre texture : elle va plus vite que le courant)
        pail = (ru, rv, u, v) => coule(h.mat('paillettes', { lum: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, rep: [ru, rv] }), u, v); // les paillettes du soleil sur l'eau : deux couches qui se croisent scintillent
      const t0 = T.t0, t1 = T.t1, enTunnel = i => entre(i, t0, t1), surPont = i => entre(i, P(32) - 4, P(33) + 4), MAR = 14.9;
      // le marais tropical (Z2) : la plaine inondée entre le camp et la chicane, de part et d'autre de la chaussée ; routeZ = l'axe de la chaussée, marais(x, z) = 0 dehors, 1 dedans
      const routeZ = x => x < 200 ? 0 : x < 360 ? -30 * (x - 200) / 160 : x < 500 ? -30 + 50 * (x - 360) / 140 : 20, marais = (x, z) => ss(135, 175, x) * ss(560, 520, x) * ss(-70, -40, z - routeZ(x)) * ss(125, 95, z - routeZ(x));
      const iR0 = P(49) + 2, iR1 = P(52) - 18, enRiv = i => entre(i, iR0, iR1); // le bas de la descente : la rivière coule sur la chaussée (on roule dans la rivière)
      const gue = s => enRiv(IX.get(s)) || s.y < (marais(s.x, s.z) > 0.5 ? MAR + 0.02 : 14.32); // les passages dans l'eau (marais, gué) : là où la chaussée passe sous le niveau de l'eau
      // ---------- la rivière : une ligne, un niveau par bief (les ressauts sont des cascades), une demi-largeur ----------
      const NIV = x => x > 870 ? 33 : x > 420 ? 31.4 : x > 150 ? 19.4 : x > 60 ? 16.2 : 14.25, // entre x = 428 et 205 elle coule sur la route et en prend la pente
        LARG = x => 8 + 16 * ss(1012, 1030, x) + 16 * ss(20, -40, x) + 7 * ss(930, 960, x) * ss(1012, 1000, x); // plus large dans la gorge du pont, au bassin de la chute, au gué
      const RIV = []; { const amont = [[1040, 238], [1032, 200], [1012, 172], [996, 165], [850, 200], [700, 260], [600, 320], [470, 400], [452, 460], [438, 500]], aval = [[190, 490], [172, 440], [160, 400], [120, 350], [40, 335], [-60, 268], [-180, 225], [-400, 170]];
        const A = [...amont.map(([x, z]) => [x, z]), ...Array.from({ length: Math.floor((iR1 - iR0) / 2) + 1 }, (_, k) => { const q = S[iR0 + k * 2]; return [q.x, q.z, q.y + 0.15, q.w + 1.5]; }), ...aval.map(([x, z]) => [x, z])]; // [x, z, niveau s'il suit la route]
        for (let k = 0; k < A.length - 1; k++) { const [ax, az, ay, aw] = A[k], [bx, bz] = A[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4)); for (let j = 0; j < n; j++) { const x = ax + (bx - ax) * j / n;
          RIV.push({ x, z: az + (bz - az) * j / n, y: ay !== undefined ? ay : NIV(x), w: ay !== undefined ? aw : LARG(x), r: ay !== undefined }); } } } // sur la route (r), un lit étroit entre deux rives de roche : pas une forêt inondée
      const riv = (x, z) => { let b = RIV[0], bd = 1e18; for (const p of RIV) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; b = p; } } return { d: Math.sqrt(bd), p: b }; };
      const BASSIN = [583, -55]; /* un bassin sacré à gauche de la ligne droite qui suit le fromager (la zone était nue) */ const CIRQUE = [1036, 215]; // le bassin au pied de la chute, dans un cirque de la falaise, au sud-est du pont : la chute tombe face à qui traverse, à gauche du temple
      // ---------- le relief : la route donne les versants ; on y creuse le lit, on y lève l'éperon de la grotte (au-dessus du tunnel) et la falaise du plateau (à l'est) ----------
      const creux = (x, z, y) => { let c = 0;
        const r = riv(x, z), lit = r.p.y - 1.2; if (y > lit) c += (y - lit) * (1 - ss(r.p.w, r.p.w + 5 + (y - lit) * (x > 930 ? 0.4 : 0.8), r.d)); // la gorge du pont : des parois raides
        if (x > 660 && z > 230) { let bd = 1e18, bi = t0; for (let i = t0; i <= t1; i++) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; bi = i; } } // l'éperon : coupé net au plan des deux portails
          if (bi > t0 + 3 && bi < t1 - 3) { const d = Math.sqrt(bd); c -= Math.min(44, Math.max(0, d - S[bi].w - 1) * 6) * (1 - ss(80, 140, d)); } }
        { const x0 = 1012 + 1.7 * Math.max(0, 152 - z); if (x > x0) c -= Math.min(70, (x - x0) * 3) * ss(30, 38, Math.hypot(x - CIRQUE[0], z - CIRQUE[1])); } // au nord du cirque la falaise recule en biais : dès l'entrée du pont, la chute est dans le champ, à gauche // la falaise du plateau, à 70 m du pont : la chute se voit de près
        c += 2.4 * (1 - ss(8, 15, Math.hypot(x - BASSIN[0], z - BASSIN[1]))); /* le bassin sacré */
        const m = marais(x, z); if (m > 0 && y > MAR - 1) c += (y - MAR + 1) * m; // le marais : un fond plat, un mètre sous l'eau
        return c; };
      const solPont = i => entre(i, P(32) + 6, P(33) - 6);
      const g = terrain(h, { pas: 6, marge: 230, loin: 100, chute: -0.2, creux, sol: s => solPont(IX.get(s)) ? 34 : enRiv(IX.get(s)) ? s.y - 1.6 : s.y, /* sous la rivière le terrain est plus bas que la route : il ne dépasse pas au pied des seuils */ mat: mat('litiereMousse'),
        couches: [{ tex: ['rocheMousse'], pente: [0.35, 0.6], rep: 0.7 }, { tex: ['vaseGalets'], poids: (x, z) => { const r = riv(x, z); return 1 - ss(r.p.w, r.p.w + 9, r.d); } }] });
      // ---------- la chaussée : la voie dallée du moteur (±W), prolongée par le décor jusqu'au bord roulable ; bordure de pierre basse et talus sous le sous-bois (O-1, O-3) ----------
      { const cO = N - (t1 - t0), dalles = mat('dallesBord', DS), bordM = mat('pierreClaire', DS), /* un rang de pierres claires : le bord de la route se lit jusqu'au fond de l'image */ talusM = mat('litiereMousse', DS), e = s => surPont(IX.get(s)) || gue(s) ? 0 : 1; // ni bordure ni talus sur le pont et dans l'eau
        for (const sd of [-1, 1]) { h.ribbon(t1, cO, sd * W, 0, s => sd * s.w, 0, dalles, 16);
          h.ribbon(t1, cO, s => sd * s.w, 0, s => sd * (s.w + 0.25 * e(s)), s => 0.3 * e(s), bordM, 8); h.ribbon(t1, cO, s => sd * (s.w + 0.25 * e(s)), s => 0.3 * e(s), s => sd * (s.w + 0.85 * e(s)), s => 0.3 * e(s), bordM, 8);
          h.ribbon(t1, cO, s => sd * (s.w + 0.85 * e(s)), s => 0.3 * e(s), s => sd * (s.w + 6 * e(s)), s => -1.1 * e(s), talusM, 8); } }
      // la traînée mouillée à la sortie de chaque passage noyé : la chaussée (bandes du décor comprises) est sombre sur 64 m, de moins en moins ; le moteur n'y mouille que sa bande centrale, sur 20 m (th.mouilleVisible)
      { const sortie = i => { while (gue(S[i % N])) i++; return i; }, voile = Array.from({ length: 10 }, (_, k) => h.mat('peinture', { c: 0x0a140e, transparent: true, opacity: 0.5 * (1 - k / 10), depthWrite: false, side: THREE.DoubleSide }));
        for (const i0 of [sortie(P(3) - 6), sortie(iR1 - 4), sortie(P(64) - 4)]) voile.forEach((m, k) => { h.ribbon(i0 + k * 4, 4, s => -s.w, 0.045, s => s.w, 0.045, m, 8).userData.dyn = 1; }); }
      // ---------- l'eau : un seul ruban qui suit la rivière, plat par bief, incliné aux ressauts ----------
      { const pos = [], uv = [], idx = [];
        RIV.forEach((p, j) => { const q = RIV[Math.min(RIV.length - 1, j + 1)], o = RIV[Math.max(0, j - 1)], dx = q.x - o.x, dz = q.z - o.z, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, w = p.w + 2;
          pos.push(p.x + nx * w, p.y, p.z + nz * w, p.x - nx * w, p.y, p.z - nz * w); uv.push(0, j * 0.4, w / 5, j * 0.4); if (j) { const a = j * 2 - 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
        // deux matières : au gué l'eau est transparente, on voit les dalles de la chaussée dessous (le passage doit se lire)
        const clair = j => RIV[j].r ? 2 : RIV[j].x > -135 && RIV[j].x < 10 ? 1 : 0, tri = [[], [], []]; for (let j = 1; j < RIV.length; j++) { const a = j * 2 - 2; tri[clair(j)].push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } // 2 : sur la route de la descente, une eau vive et presque opaque (on roule dans la rivière, pas sur des dalles vertes)
        for (const [k, op, vit] of [[0, 0.86, 1], [1, 0.5, 1], [2, 0.9, 2.2]]) { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(tri[k]); ge.computeVertexNormals();
          const eau = new THREE.Mesh(ge, coule(mat('eauJade', { ...DS, transparent: true, opacity: op, gloss: 0.5, c: k === 2 ? 0xb8d8cc : 0xffffff }), 0, -0.5 * vit)); eau.receiveShadow = true; eau.userData.dyn = 1; h.scene.add(eau);
          // le courant : une seconde couche, plus rapide et plus claire, 4 cm au-dessus (deux couches qui défilent à des vitesses différentes : l'eau, pas un tapis roulant)
          if (k === 1) for (const [dy, ru, rv, su, sv] of [[0.07, 5, 5, 0.05, -0.4], [0.09, 3.7, 6.1, -0.07, -0.25]]) { const gp = ge.clone(); gp.translate(0, dy, 0); const p = new THREE.Mesh(gp, pail(ru, rv, su, sv)); p.userData.dyn = 1; h.scene.add(p); } // le gué scintille au soleil
          if (!k) continue; const g2 = ge.clone(); g2.translate(0, 0.04, 0); const e2 = new THREE.Mesh(g2, coule(h.mat('eauJade', { ...DS, transparent: true, opacity: op * 0.5, depthWrite: false, rep: [1.7, 0.6], c: 0xd8f0e0 }), 0.03, -0.85 * vit)); e2.userData.dyn = 1; h.scene.add(e2); } }
      h.pose('boite', coule(mat('eauMarais', { transparent: true, opacity: 0.85, c: 0x6a7a70 }), 0.012, 0.008), h.scene, [345, MAR - 0.05, 25], 440, 0.1, 250).userData.dyn = 1; // l'eau du marais : une nappe plate, le terrain en sort autour ; elle dérive à peine
      h.pose('boite', coule(h.mat('eauMarais', { transparent: true, opacity: 0.35, depthWrite: false, c: 0x9ab0a0, rep: [0.7, 0.7] }), -0.009, 0.014), h.scene, [345, MAR, 25], 440, 0.02, 250).userData.dyn = 1; // une seconde nappe qui dérive en sens croisé : les taches de ciel glissent
      // ---------- la descente de la rivière : des rives de roche de part et d'autre du lit, un sillage d'écume derrière chaque borne, l'eau blanche qui tombe à chaque seuil et bouillonne au pied ----------
      { const rives = [], sill = [], bouil = [];
        for (let i = iR0 - 6; i < iR1 + 8; i += 2) for (const sd of [-1, 1]) { const s = S[i], t = 1.3 + rnd() * 1.5, [x, z] = bord(s, sd, s.w + 1.9 + rnd() * 1.2); rives.push([x, s.y + 0.2 + rnd() * 0.4, z, rnd() * 6, t * 1.3, t, t * 1.2]);
          if (rnd() < 0.5) { const [x2, z2] = bord(s, sd, s.w + 6 + rnd() * 3); rives.push([x2, s.y + 1 + rnd(), z2, rnd() * 6, 3 + rnd() * 2, 2.4 + rnd() * 2, 3 + rnd() * 2]); } }
        for (let i = iR0; i < iR1; i += 3) for (const sd of [-1, 1]) { const s = S[i + 2], [x, z] = bord(s, sd, s.w - 0.3); sill.push([x, s.y + 0.2, z, h.across(s), 1.5, 0.02, 4.2]); }
        for (const p of [50, 51]) { const i = P(p) + 1, s = S[i], w = s.w + 2;
          { const a = S[i - 1], b = S[i + 1]; bouil.push([a.x, a.y + 0.12, a.z, h.across(a), 2 * w, 0.3, 1.8], [b.x, b.y + 0.5, b.z, h.across(b), 2 * w, 0.9, 2.6]); } const [x, z] = bord(S[i + 4], 0, 0); // l'eau blanche sur l'arête, le rouleau au pied
          bouil.push([x, S[i + 4].y + 0.24, z, h.across(S[i + 4]), 2 * w, 0.02, 11]);
          for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const [rx, rz] = bord(S[i - 1], sd, s.w + 1.6 + k * 1.6); rives.push([rx, S[i - 1].y + 0.3, rz, rnd() * 6, 1.8 + rnd(), 1.4 + rnd(), 1.8 + rnd()]); } }
        { const s = S[P(49) + 6], [x, z] = bord(s, 0, 0); bouil.push([x, s.y + 0.24, z, h.across(s), 2 * s.w + 3, 0.02, 14]); } // là où l'on retombe du saut
        inst(h, h.geo('rocher'), mat('rocheMousse'), rives); inst(h, h.geo('bloc'), ec, sill).userData.dyn = 1; inst(h, h.geo('bloc'), ecV, bouil).userData.dyn = 1;
        { const pieds = [S[P(49) + 6], S[P(50) + 4], S[P(51) + 4]]; bouffees(110, () => { const q = pieds[alea() * 3 | 0], [x, z] = bord(q, alea() < 0.5 ? -1 : 1, alea() * q.w); return [x, q.y + 0.3, z]; }, { vie: 2.8, vy: 2.3, taille: 8.5, f: 0.46 }); } // un nuage d'embruns au pied de chaque seuil et à la réception du saut
        { const bois = mat('ecorceJungle', { c: 0xd8b890 }), br = Array.from({ length: 9 }, (_, k) => ({ g: mobile('troncCouche', { bois }, 0, 0, 0, 0, 0.95, 0, 8), u: iR0 + (iR1 - iR0) * k / 9, sd: k & 1 ? 1 : -1, r: alea() * 6 })); // des branches descendent le courant, le long des rives (hors de la trajectoire) : purement visuelles, rien à percuter
          VIE.push((dt, car, t) => { for (const b of br) { b.u += dt * 4.5; if (b.u > iR1) b.u = iR0; const q = S[b.u | 0], [x, z] = bord(q, b.sd, q.w - 2.6); b.g.position.set(x, q.y + 0.05, z); b.g.rotation.y = Math.atan2(-q.tz, q.tx) + 0.4 * Math.sin(t * 0.7 + b.r); } }); }
        // la rivière quitte la route par la droite : un grand tronc couché en travers de sa sortie, le long de la chaussée, pour qu'on ne la suive pas (la route file tout droit vers l'arc)
        { const s = S[P(52) - 8], sd = [-1, 1].sort((a, b) => Math.hypot(...bord(s, a, 20).map((v, k) => v - [190, 490][k])) - Math.hypot(...bord(s, b, 20).map((v, k) => v - [190, 490][k])))[0], [x, z] = bord(s, sd, s.w + 2.2), ax = new THREE.Vector3(s.tx, 0.03, s.tz).normalize(), bois = mat('ecorceJungle');
          const pos = (g, d, y) => { const o = new THREE.Mesh(g, bois); o.position.set(x + s.tx * d, s.y + y, z + s.tz * d); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ax); h.scene.add(o); };
          pos(new THREE.CylinderGeometry(1.3, 1.7, 46, 7), 0, 1.3); pos(new THREE.CylinderGeometry(3.6, 3.2, 1.2, 7), -23.5, 1.8);
          mobile('onca', { robe: mat('peinture', { c: 0xe9b44c }), tache: mat('peinture', { c: 0x14120e }), museau: mat('peinture', { c: 0xf2e6c8 }) }, x - s.tx * 14, s.y + 2.72, z - s.tz * 14, vers(x - s.tx * 14, z - s.tz * 14, S[IX.get(s) - 7]) + sd * 0.25, 2.5, 1); } /* l'onça couchée en travers du tronc, la tête vers la route : la voiture porte son nom */ }
      // ---------- la forêt, en trois épaisseurs (D-4) : le mur (une rangée de grands arbres de chaque côté, houppiers jointifs au-dessus de la route, sous-bois continu au pied),
      // la forêt (jusqu'à 90 m), le rideau (masses sans détail que la brume réduit à des silhouettes). Clairières voulues : le camp, la place de la cité, le cirque de la chute, la rivière ----------
      const racines = [], cimes = [[], [], []], futs = [], buissons = [[], []], fougeres = [], palmiers = [], rideau = [], feuillesG = [], heliconias = [], lianes = [];
      const CLAIR = [[62, -30, 30], [84, 474, 30], [CIRQUE[0], CIRQUE[1], 40], [BASSIN[0], BASSIN[1], 15], [626, 22, 13], [512, 410, 9], [95, 372, 29], [918, -104, 7]]; // camp, place, cirque, fromager, idole, édifice, tête
      // couloirs de vue : rien ne pousse entre la route et le repère planté dans l'axe d'un freinage (fromager, tête colossale, porte ruinée, grande idole) [x1, z1, x2, z2, rayon]
      const VUES = [[598, 20, 626, 22, 12], [884, -110, 922, -104, 12], [728, -61, 642, -58, 20], [556, 410, 510, 410, 12], [996, 92, 996, 238, 24], [996, 238, 996, 298, 27], [124, 510, 66, 512, 13], [95, 440, 88, 374, 19]]; // la seconde épingle s'ouvre sur la vallée en contrebas ; le parvis du temple-grotte est dégagé (la grande chute) ; le temple à degrés au bout de sa ligne droite // … et le long du pont : la vue part vers la chute et vers l'aval
      const segD = (x, z, [ax, az, bx, bz]) => { const ux = bx - ax, uz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz))); return Math.hypot(x - ax - ux * t, z - az - uz * t); };
      const libre = (x, z) => { const r = riv(x, z); return r.d > r.p.w + (r.p.r ? 7 : 3) && CLAIR.every(([cx, cz, cr]) => (x - cx) ** 2 + (z - cz) ** 2 > cr * cr) && VUES.every(v => segD(x, z, v) > v[4]); };
      // un arbre de canopée : fût droit, houppier large en masses arrondies (k = taille, 1 = 14 m de fût ; vx, vz = vers où pencher le houppier ; n = nombre de masses)
      const arbre = (x, z, k, vx = 0, vz = 0, n = 3) => { if (marais(x, z) > 0.6) racines.push([x, MAR - 0.5, z, rnd() * 6, 0.9 + k * 0.5]); // dans le marais, les arbres ont les pieds dans l'eau, sur des racines-échasses
        const y = g.hAt(x, z) - 0.5, H = 14 * k, a = rnd() * 6.28, c = (dx, dy, dz, r, ap) => cimes[rnd() * 3 | 0].push([x + dx, y + H + dy, z + dz, rnd() * 6, r / 3.4, r * ap / 3.4, r / 3.4]);
        futs.push([x, y + H / 2, z, rnd() * 6, 3 * k, H / 5.2, 3 * k]); c(vx * 3, 2 * k, vz * 3, 8.5 * k, 0.62);
        if (n > 1) c(Math.cos(a) * 6 * k, -k, Math.sin(a) * 6 * k, 5.5 * k, 0.7); if (n > 2) c(-Math.cos(a) * 5 * k + vx * 4, 0, -Math.sin(a) * 5 * k + vz * 4, 5 * k, 0.7); };
      for (let i = 0; i < N; i += 3) { if (enTunnel(i) || surPont(i)) continue; const s = S[i];
        for (const sd of [-1, 1]) { const off = s.w + 3.5 + rnd() * 4, k = 0.85 + rnd() * 0.45, [x, z] = bord(s, sd, off), v = rnd() < 0.75 ? 1 : -0.6; // des trouées et des houppiers qui s'écartent : le soleil tombe en taches sur la route
          if (rnd() > (marais(x, z) > 0.5 ? 0.5 : 0.12) && g.dAt(x, z) > off - 1.5 && libre(x, z)) arbre(x, z, k, s.tz * sd * v, -s.tx * sd * v); } }
      for (let k = 0; k < 6500; k++) { const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z), u = rnd(), t = 0.8 + rnd() * 0.7;
        if (d < 15 || d > 90 || !libre(x, z) || (marais(x, z) > 0.5 && u > 0.45)) continue; // forêt claire dans le marais : on voit l'eau
        if (d < 40 && u < 0.1) palmiers.push([x, g.hAt(x, z) - 0.3, z, rnd() * 6, 0.8 + rnd() * 0.5]); else arbre(x, z, t * (d < 32 ? 1 : 1.2), 0, 0, d < 32 ? 2 : 1); }
      for (let k = 0; k < 1900; k++) { const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z), t = 3 + rnd() * 1.6;
        if (d > 85 && d < 215 && libre(x, z)) rideau.push([x, g.hAt(x, z) + 9 + rnd() * 6, z, rnd() * 6, t, t * 0.75, t]); }
      // le sous-bois : une bande continue au pied du mur d'arbres, deux rangs ; il cache le sol et les fûts du fond
      for (let i = 0; i < N; i += 2) { if (enTunnel(i) || surPont(i) || gue(S[i])) continue; const s = S[i];
        for (const sd of [-1, 1]) for (const rang of [0, 1]) { if (rang && (i & 2)) continue; const off = s.w + 2.6 + rang * 3.4 + rnd() * 2.4, [x, z] = bord(s, sd, off), u = rnd(), t = 0.4 + rnd() * 0.35 + rang * 0.3, y = rang ? g.hAt(x, z) : s.y - 0.5;
          if (g.dAt(x, z) < off - 1.5 || !libre(x, z)) continue;
          if (u < 0.16) fougeres.push([x, y, z, rnd() * 6, 0.6 + rnd() * 0.5]); else if (u < 0.46) (u < 0.2 ? heliconias : feuillesG).push([x, y, z, rnd() * 6, 0.9 + rnd() * 0.7]); else buissons[u < 0.55 ? 0 : 1].push([x, y + 1.9 * t, z, rnd() * 6, t, t * 0.72, t]); } }
      const feuilles = ['feuilleOmbre', 'feuilleCanopee', 'feuilleSoleil'].map(n => mat(n)), ecorce = mat('ecorceJungle'), palme = mat('palmeJungle', DS);
      buissons.forEach((l, k) => inst(h, h.geo('cime'), feuilles[k + 1], l));
      // le marais : racines-échasses sous les arbres, nénuphars géants (vitória-régia) et leurs fleurs près de la chaussée
      insts(h, 'racinesEchasses', { bois: ecorce }, racines);
      { const nen = [], fl = []; for (let k = 0; k < 420; k++) { const x = 150 + rnd() * 400, z = routeZ(x) - 60 + rnd() * 180, t = 1.3 + rnd() * 1.5; if (marais(x, z) > 0.85 && g.dAt(x, z) > 8.5 && g.dAt(x, z) < 40) { nen.push([x, MAR + 0.02, z, rnd() * 6, t, 1, t]); if (rnd() < 0.3) fl.push([x + t * 0.5, MAR + 0.2, z, rnd() * 6, 0.45, 0.4, 0.45]); } }
        inst(h, h.geo('nenuphar'), mat('peinture', { c: 0xa6d24a }), nen).castShadow = false; inst(h, h.geo('bloc'), mat('peinture', { c: 0xf0a8c8 }), fl); }
      // un vol d'aigrettes blanches posées dans l'eau du marais, de part et d'autre du passage noyé : elles décollent à l'approche et partent sur le côté (avant le freinage de la chicane)
      { const peauA = { patte: mat('peinture', { c: 0x2a2a26 }), plume: mat('peinture', { c: 0xf6f6ee }), bec: mat('peinture', { c: 0xe8b83a }) }, i0 = P(2) + 8;
        const blanc = mat('peinture', { c: 0xf6f6ee, ...DS });
        for (const tete of [0, 1]) { const bs = []; for (let k = 0; k < 12; k++) { const q = S[i0 + 2 + (alea() * 24 | 0)], sd = (k + tete) & 1 ? 1 : -1, [x, z] = bord(q, sd, q.w + 2.5 + alea() * 6), v = 2 + alea() * 2.5, av = 10 + alea() * 7;
            bs.push({ x, y: MAR - 0.2, z, r: alea() * 6.28, vx: -q.tz * sd * v + q.tx * av, vy: 0.7 + alea() * 0.9, vz: q.tx * sd * v + q.tz * av, e: [3.2, 3.2, 3.2] }); }
          const l = bs.map(q => [q.x, q.y, q.z, q.r, 3.2]); // posée : l'échassier de la plage, en blanc ; en vol : le corps à l'horizontale et deux ailes
          envol(insts(h, 'flamant', peauA, l, { a: [tete] }), bs, i0, { vol: insts(h, 'aigretteVol', peauA, l), ailes: [inst(h, h.geo('ailesV', 1.5), blanc, l)], D: 28, T: 6, g: 0.07, bat: 8 }); } }
      insts(h, 'fougereArbo', { stipe: ecorce, fronde: palme }, fougeres); insts(h, 'jucara', { stipe: ecorce, palme }, palmiers);
      inst(h, h.geo('cimeLoin'), mat('feuilleLoin'), rideau).castShadow = false;
      const feuilleG = mat('feuilleSoleil', DS), rouge = mat('peinture', { c: 0xd8362a });
      insts(h, 'grandeFeuille', { feuille: feuilleG }, feuillesG); insts(h, 'grandeFeuille', { feuille: feuilleG, fleur: rouge }, heliconias, { a: [1, 1] });

      // ---------- la brume épaisse de la rivière et du cirque : des nappes basses, à plus de 22 m de la chaussée, jamais en l'air sur fond de ciel (D-6) ----------
      { const nappes = [], G = new THREE.PlaneGeometry(1, 1); G.rotateX(-Math.PI / 2);
        for (let j = 0; j < RIV.length; j += 5) { const p = RIV[j], x = p.x + (rnd() - 0.5) * 20, z = p.z + (rnd() - 0.5) * 20; if (g.dAt(x, z) > 45) nappes.push([x, p.y + 1.5 + rnd() * 4, z, rnd() * 6, 30 + rnd() * 30, 1, 22 + rnd() * 20]); }
        for (let k = 0; k < 5; k++) nappes.push([CIRQUE[0] + 4 + (rnd() - 0.5) * 26, 35 + rnd() * 7, CIRQUE[1] + 16 + (rnd() - 0.5) * 16, rnd() * 6, 26 + rnd() * 14, 1, 22 + rnd() * 10]); // le nuage au pied de la chute seulement
        const b = inst(h, G, mat('brume', { lum: 1, c: 0x343c24, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, ...DS }), nappes); b.castShadow = b.receiveShadow = false; }

      bouffees(130, () => { for (let k = 0; k < 30; k++) { const x = 150 + alea() * 320, dz = -60 + alea() * 180, z = routeZ(x) + dz; if (marais(x, z) > 0.85 && Math.abs(dz) > 12) return [x, MAR + 0.6, z]; } return [300, MAR + 0.6, 60]; },
        { vie: 12, vy: 0.5, taille: 36, f: 0.46, c: [0.93, 0.97, 0.86] }); // la brume du matin se lève du marais, loin de la chaussée, et dérive vers l'ouest

      // ---------- matières et outils de pose des repères ----------
      const pierre = mat('pierreCite'), ombre = mat('pierreOmbre'), clairM = mat('pierreClaire'), or = mat('peinture', { lum: 1, c: 0xe8b83a }), noir = mat('peinture', { c: 0x14120e }), flamme = mat('peinture', { lum: 1, c: 0xffb040, fog: false }),
        bois = mat('ecorceJungle', { c: 0xc8a878 }), toile = mat('toileTente', DS), bambou = mat('bambou'), planche = mat('planchesPont'), lampe = mat('peinture', { lum: 1, c: 0xffd890 }), fer = mat('peinture', { c: 0x2a2a26 }),
        CITE = { pierre, ombre, clair: clairM, or, noir, relief: ombre, socle: mat('socleNoir'), inscription: mat('inscription512') };
      // un objet posé en (x, z), tourné de ry (son +Z regarde alors vers (sin ry, cos ry)) ; y = le sol par défaut
      const pose = (nom, peau, x, z, ry = 0, y = g.hAt(x, z), ...a) => { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; h.scene.add(p); h.pose(nom, peau, p, [0, 0, 0], ...a); return p; };
      // une flamme qui vit (feu de camp, braseros des portails ; jamais les torches, qui marquent les freinages) : deux langues dont la hauteur change, penchées par le vent ; l = son luminaire, qui respire avec elle
      const coeurFeu = mat('peinture', { lum: 1, c: 0xffe890, fog: false });
      const flammeVive = (x, y, z, k = 1, l = null, lw = 1) => { const p = new THREE.Group(); p.position.set(x, y, z); p.userData.dyn = 1; h.scene.add(p); for (const [w, ht, y, dx] of [[0.62, 0.7, 0.35, 0], [0.42, 0.6, 0.95, 0.03], [0.22, 0.55, 1.45, 0.08]]) h.pose('boite', flamme, p, [dx * k, y * k, 0], w * k * lw, ht * k, w * k * lw); /* trois langues de plus en plus étroites : une pointe, pas un bloc */
        for (const [wx, wz] of [[0.3, 0.66], [0.66, 0.3]]) h.pose('boite', coeurFeu, p, [0, 0.36 * k, 0], wx * k * lw, 0.5 * k, wz * k * lw); /* le cœur jaune */
        const ph = alea() * 9, c0 = l && l.c ? l.c.clone() : null; VIE.push((dt, car, t) => { const f = 1 + 0.24 * Math.sin(t * 11 + ph) + 0.16 * Math.sin(t * 27.3 + ph * 2); p.scale.set(1 + 0.22 * Math.sin(t * 19 + ph), f, 1 + 0.18 * Math.sin(t * 23 + ph * 3)); p.rotation.z = 0.14 + 0.08 * Math.sin(t * 7 + ph); if (c0) l.c.copy(c0).multiplyScalar(0.75 + 0.3 * f); }); };
      // au bord de la route, face à elle : échantillon i, côté sd, à off m de l'axe
      const auBord = (nom, peau, i, sd, off, ...a) => { const s = S[(i + N) % N], [x, z] = bord(s, sd, off); return pose(nom, peau, x, z, Math.atan2(s.x - x, s.z - z), s.y - 0.35, ...a); };
      // torches de l'expédition : elles marquent les freinages à la place des panneaux (O-5) : deux à 100 m, une à 50 m ; et les lieux
      const torches = [], torche = (i, sd, off = 1.1) => { const s = S[(i + N) % N], [x, z] = bord(s, sd, s.w + off); torches.push([x, s.y - 0.3, z, rnd() * 6]); h.lum((i + N) % N, x, s.y + 2.6, z, 0xffa040, 13, 1.6); };
      for (const k of [16, 22, 44, 47]) { const i = P(k), sd = S[i].k > 0 ? -1 : 1; for (const d of [-7, 0, 7]) torche(i + d, sd, 1.4); } // trois flammes à l'extérieur de chaque virage serré : les deux épingles, les deux équerres
      for (const k of [4, 14, 20, 42, 52]) { const i = P(k) - (k === 42 ? 12 : 0); torche(i - 52, -1); torche(i - 52, 1); torche(i - 26, S[i].k > 0 ? -1 : 1); }

      // ---------- la faune (propositions/VIE-chapada.md §3) : décor pur, rien ne se percute, rien ne bouge dans l'axe d'un freinage ----------
      const SINGES = [], noirDS = mat('peinture', { c: 0x1a1816, ...DS });
      // un oiseau en vol : un corps et deux ailes sur pivot (elles battent, ou planent en V)
      const oiseau = (peau, k = 1, l = 1) => { const p = mobile('oiseauVol', peau, 0, 0, 0, 0, k, 0, l), ailes = [-1, 1].map(sd => { const a = new THREE.Group(); a.position.set(0.05, 0.08, sd * 0.12); a.scale.z = sd; p.add(a); h.pose('aileOiseau', peau, a); return a; }); p.rotation.order = 'YXZ'; return { p, ailes }; };
      { const vaut = { plume: noirDS, bec: mat('peinture', { c: 0xb0a890, ...DS }), queue: noirDS }; // des vautours (urubus) planent en cercles dans la gorge, à droite du pont (l'aval) ; deux autres sont posés au sommet du temple à degrés
        const vols = [[962, 78, 172, 26, 0], [968, 85, 150, 34, 2.1], [950, 72, 198, 20, 4.2]].map(([x, y, z, r, ph]) => ({ o: oiseau(vaut, 2.8, 0.7), x, y, z, r, ph }));
        VIE.push((dt, car, t) => { for (const v of vols) { const a = t * 6.5 / v.r + v.ph; v.o.p.position.set(v.x + v.r * Math.cos(a), v.y + 1.5 * Math.sin(a * 0.6), v.z + v.r * Math.sin(a)); v.o.p.rotation.set(0.3, -a - Math.PI / 2, 0); v.o.ailes.forEach((w, k) => { w.rotation.x = (k ? -1 : 1) * (0.22 + 0.05 * Math.sin(t * 0.9 + v.ph)); }); } });
        for (const dx of [-5.5, 5]) mobile('oiseauVol', vaut, 86 + dx, 16.6 + 35.2, 372, dx, 5, 1, 0.5).rotation.z = 1.1; } // sur l'avant-dernier degré, de part et d'autre du sommet
      { const ara = { plume: mat('peinture', { c: 0xe0241a, ...DS }), bec: mat('peinture', { c: 0xf0e8d0, ...DS }), queue: mat('peinture', { c: 0x2a5ad0, ...DS }) }, deux = [oiseau(ara, 2.3, 1.5), oiseau(ara, 2.3, 1.5)]; // deux aras rouges remontent la route à la sortie de la chicane, bas sous la canopée, et passent au-dessus de la voiture
        const i0 = P(8) + 2, iA = P(10) + 40, iB = P(8) + 6, T = 7.5; let en = 0, tt = 99;
        VIE.push((dt, car) => { if (!car) return; const e = (i0 - car.idx + N) % N; if (!en && e < 12 && e > 0) { en = 1; tt = 0; } else if (en && e > 300 && e < N - 300) en = 0; tt += dt;
          deux.forEach(({ p, ailes }, k) => { const u = (tt - k * 0.3) / T; p.visible = u > 0 && u < 1; if (!p.visible) return; const q = S[Math.round(iA + (iB - iA) * u)], [x, z] = bord(q, 1, 4 - 9 * u + k * 2.5); p.position.set(x, q.y + 7.5 - k * 1.3, z); p.rotation.set(0, Math.atan2(q.tz, -q.tx), 0);
            ailes.forEach((w, j) => { w.rotation.x = (j ? -1 : 1) * 0.6 * Math.sin(tt * 9 + k); }); }); }); }
      { const iJ = P(2) + 42, q = S[iJ], [x, z] = bord(q, 1, q.w + 3), jc = mobile('jacare', { peau: mat('peinture', { c: 0x3e4a22 }), oeil: or }, x, MAR, z, Math.atan2(-q.tz, q.tx) + 1.1, 3.4); let fond = 0; // un caïman au ras de l'eau du marais : il s'enfonce quand on arrive
        VIE.push((dt, car) => { if (car) { const e = (iJ - car.idx + N) % N; if (e < 7 && e > 0) fond = 1; else if (e > 300 && e < N - 300) fond = 0; } jc.position.y += ((fond ? MAR - 0.8 : MAR) - jc.position.y) * Math.min(1, dt * 1.2); }); }
      { const n = 380, PP = new Float32Array(n * 3).fill(-999), CC = new Float32Array(n * 3), gv = new THREE.BufferGeometry(), cols = h.TH.feuilles || [[0.5, 0.4, 0.15]], ZF = [[P(18) + 2, P(20) - 12], [P(24) + 2, P(28)]]; // des feuilles tombent de la canopée dans la montée des lacets, portées par le vent ; pas aux freinages des deux épingles
        for (let k = 0; k < n; k++) CC.set(cols[k % cols.length].map(v => Math.min(1, v * 1.5)), k * 3); gv.setAttribute('position', new THREE.BufferAttribute(PP, 3)); gv.setAttribute('color', new THREE.BufferAttribute(CC, 3));
        const o = new THREE.Points(gv, new THREE.PointsMaterial({ size: 0.46, vertexColors: true })); o.frustumCulled = false; o.userData.dyn = 1; h.scene.add(o);
        VIE.push((dt, car, t) => { if (!car) return; const on = ZF.some(([a, b]) => entre(car.idx, a, b)), fx = Math.cos(car.th), fz = Math.sin(car.th);
          for (let k = 0; k < n; k++) { const j = k * 3; if (PP[j + 1] > -900) { PP[j] += (-1.2 + 0.8 * Math.sin(t * 2 + k)) * dt; PP[j + 1] -= (1.3 + (k % 5) * 0.2) * dt; PP[j + 2] += 0.8 * Math.cos(t * 1.7 + k) * dt;
              const dx = PP[j] - car.x, dz = PP[j + 2] - car.z; if (PP[j + 1] < car.y - 0.5 || dx * fx + dz * fz < 5 || dx * dx + dz * dz > 8100) PP[j + 1] = -999; }
            if (PP[j + 1] < -900 && on && Math.random() < dt * 2.5) { const a = 20 + Math.random() * 50, l = (Math.random() - 0.5) * 15; PP[j] = car.x + fx * a - fz * l; PP[j + 1] = car.y + 1.5 + Math.random() * 8; PP[j + 2] = car.z + fz * a + fx * l; } }
          gv.attributes.position.needsUpdate = true; }); }

      // ---------- Z1, le camp de base (O-10) : tentes, table à cartes, caisses, 4×4 bâché, mât radio, dans la clairière de gauche ; l'expédition est là ----------
      { const P1 = { toile, bois, papier: mat('peinture', { c: 0xe8dcc0 }), lampe, fer, caisse: mat('peinture', { c: 0x5a6a3a }), vitre: noir, pneu: fer };
        for (const [x, z, r] of [[24, -19, 0.2], [44, -27, -0.1], [72, -26, 0.15], [94, -19, -0.3]]) pose('tente', P1, x, z, r).scale.setScalar(1.5);
        pose('tableCartes', P1, 58, -17, 0.3); pose('caisses', P1, 38, -13, 0.5); pose('caisses', P1, 82, -14, 2.2); pose('quatreQuatre', P1, 106, -15, 1.25); pose('matRadio', P1, 62, -44);
        pose('feuCamp', { pierre, bois, flamme }, 50, -11); flammeVive(50, g.hAt(50, -11) + 0.3, -11, 1.5, h.lum(25, 50, 16, -11, 0xffa040, 14, 1.8), 1.9); bouffees(30, () => [50 + (alea() - 0.5) * 0.8, g.hAt(50, -11) + 2.4, -11 + (alea() - 0.5) * 0.8], { vie: 6, vy: 2.4, taille: 4.2, f: 0.44, c: [0.62, 0.62, 0.6] }); /* le feu vit, sa lueur respire, il fume */ pose('echafaudage', { bambou, planche }, 8, -22, 1.57, undefined, 4, 3); pose('tableCartes', P1, 84, -22, -0.4); pose('caisses', P1, 16, -12, 2.6); pose('caisses', P1, 66, -11, 0.2); pose('quatreQuatre', P1, 122, -18, 1.9);
        { const lant = [20, 36, 52, 68, 84, 100].map(x => { const p = new THREE.Group(); p.position.set(x, 19.6, -10.5); p.userData.dyn = 1; h.scene.add(p); h.pose('boite', lampe, p, [0, -0.4 - Math.abs(x - 60) * 0.004, 0], 0.3, 0.4, 0.3); return p; }); let souffle = 0; // les lanternes pendent à leur fil : elles se balancent, plus fort au passage des voitures
          VIE.push((dt, car, t) => { if (car && car.x > -10 && car.x < 130 && Math.abs(car.z + 10.5) < 22 && Math.hypot(car.vx, car.vz) > 15) souffle = 1; souffle = Math.max(0, souffle - dt * 0.35); lant.forEach((p, k) => { p.rotation.x = (0.2 + 0.5 * souffle) * Math.sin(t * 2.6 + k * 1.3); }); });
          const y0 = g.hAt(62, -44), feuR = h.mat('peinture', { lum: 1, c: 0xff5030 }), feux = [4, 7.5, 11].map(y => { const m = h.pose('boite', feuR, h.scene, [62.3, y0 + y, -44], 1.1, 1.2, 1.1); m.userData.dyn = 1; return m; }); VIE.push((dt, car, t) => feux.forEach((m, k) => { m.visible = (t / 0.45 | 0) % 3 === k; })); // les trois feux du mât radio s'allument tour à tour (visible alterné : rythme.js réécrit les couleurs)
{ const q = S[0], [x, z] = bord(q, -1, 7.5); mobile('toucan', { plume: noir, face: mat('peinture', { c: 0xf2ecd8 }), bec: mat('peinture', { c: 0xff8a1c }) }, x, q.y + 9.45, z, vers(x, z, S[N - 30]), 3.2, 1); } } /* un toucan perché sur la traverse du portique de départ, tourné vers qui arrive */ h.pose('boite', fer, h.scene, [60, 19.6, -10.5], 84, 0.05, 0.05); for (const x of [18, 102]) h.pose('boite', bois, h.scene, [x, 17.4, -10.5], 0.16, 4.6, 0.16); // une guirlande de lanternes le long de la route
        pose('caisses', P1, -30, -12, 1); { const bq = pose('barque', P1, -82, 236, 0.9, 14.12); bq.scale.setScalar(1.5); bq.userData.dyn = 1; VIE.push((dt, car, t) => { bq.rotation.z = 0.07 * Math.sin(t * 1.3); bq.position.y = 14.12 + 0.05 * Math.sin(t * 1.7); }); } /* la barque flotte au bord du gué (elle était posée sur le fond, sous l'eau) et tangue */ pose('caisses', P1, -108, 120, 2); // T-8 : les traces de l'expédition depuis le gué
        for (const [x, z] of [[58, -17], [30, -18], [90, -18]]) h.lum(30, x, 17.5, z, 0xffd890, 16, 1.4); torche(8, -1, 2); torche(60, -1, 2); torche(-40, -1); torche(-40, 1); }

      // ---------- Z2, le fromager (O-11) : dans l'axe du freinage de la chicane, la route le contourne ; échelle de corde et plateforme d'observation ----------
      { const [x, z] = [626, 22], y = g.hAt(x, z) - 0.6; pose('fromager', { bois: ecorce, planche, corde: bambou }, x, z, 2.2, y);
        for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, r = k ? 11 : 0, t = (k ? 11 : 15) / 3.4; cimes[k % 3].push([x + Math.cos(a) * r, y + 43 + (k ? rnd() * 4 - 3 : 3), z + Math.sin(a) * r, rnd() * 6, t, t * 0.6, t]); } }

      // ---------- Z3, les lacets : la tête colossale et sa suite (têtes plus petites à demi enfouies, statues, obélisques, pans de mur) dans l'axe de la première épingle, une porte ruinée dans l'axe de la seconde ----------
      {
        pose('teteColossale', CITE, 922, -104, -Math.PI / 2 + 0.25).scale.setScalar(1.8); h.lum(P(14), 912, g.hAt(912, -104) + 5, -104, 0xffa040, 26, 2.2);
        { const t2 = pose('teteColossale', CITE, 916, -122, -Math.PI / 2 - 0.5, g.hAt(916, -122) - 1.2); t2.scale.setScalar(0.85); t2.rotation.z = 0.2; pose('teteColossale', CITE, 913, -83, -Math.PI / 2 + 0.9, g.hAt(913, -83) - 0.8).scale.setScalar(0.7);
          for (const [x, z, t] of [[909, -116, 1.6], [910, -93, 1.4], [926, -90, 1.8]]) pose('statueDebout', CITE, x, z, -Math.PI / 2, undefined, t); pose('obelisque', CITE, 930, -116, 0.3, undefined, 12); pose('obelisque', CITE, 931, -95, 0.1, undefined, 9);
          h.pose('boite', pierre, h.scene, [934, g.hAt(934, -105) + 2.2, -105], 2, 5, 26); h.pose('boite', mat('bordureMousse'), h.scene, [934, g.hAt(934, -105) + 4.9, -105], 2.6, 0.5, 26.6); torche(P(15), -1, 2.5); } torche(P(16), -1, 2.5);
        const pr = pose('arc', CITE, 690, -52, Math.PI / 2 - 0.2, undefined, 3, 0.9, 2.2, 7, 4); for (const sd of [-1, 1]) h.pose('boite', pierre, pr, [sd * 3.6, 2.2, 0], 1.6, 4.4, 2.4); h.pose('boite', clairM, pr, [0, 8.4, 0], 9.4, 0.8, 2.8);
        pose('statueDebout', CITE, 694, -60, Math.PI / 2, undefined, 1.2); pose('statueDebout', CITE, 692, -44, Math.PI / 2, undefined, 1.2); }

      // ---------- Z4, le pont de lianes (O-12) et la grande chute (O-13) ----------
      { const a = P(32) - 4, b = P(33) + 4, n = b - a, KI = new Map(); for (let k = 0; k <= n; k++) KI.set(S[a + k], k / n);
        const yc = s => 1.5 + 8.8 * (2 * KI.get(s) - 1) ** 2, liane = mat('ecorceJungle', { ...DS, c: 0xa8b070 }), susp = [], poteaux = [];
        h.ribbon(a, n, -W - 0.3, 0.06, W + 0.3, 0.06, mat('planchesPont', DS), 4); // le tablier : des planches à la place de la chaussée
        for (const sd of [-1, 1]) { const x = sd * (W + 0.7);
          h.ribbon(a, n, x, s => yc(s) + 0.22, x, s => yc(s) - 0.22, liane, 3); h.ribbon(a, n, x - 0.22, yc, x + 0.22, yc, liane, 3); // les deux câbles porteurs en lianes tressées, en chaînette
          h.ribbon(a, n, x, 1.3, x, 1.12, liane, 3); h.ribbon(a, n, sd * (W + 0.3), 0.3, sd * (W + 0.3), -0.25, planche, 4); // main courante, rive du tablier
          for (let k = 1; k < n; k++) { const s = S[a + k], [px, pz] = bord(s, sd, W + 0.7), hh = yc(s); susp.push([px, s.y + hh / 2, pz, 0, 0.09, hh, 0.09]); if (k % 3 === 0) poteaux.push([px, s.y + 0.65, pz, 0, 0.14, 1.3, 0.14]); }
          for (const i of [a, b]) { auBord('obelisque', CITE, i, sd, W + 1.9, 10.6); if (i === a || sd < 0) { const q = S[i], [x, z] = bord(q, sd, W + 1.9); SINGES.push([x, q.y + 11.05, z, vers(x, z, S[i - 24]), 3]); } } } // un singe assis au sommet de trois des obélisques (fixes : on arrive dans un goulet)
        inst(h, h.geo('bloc'), liane, susp); inst(h, h.geo('bloc'), planche, poteaux);
        for (const [i, rv] of [[a + 2, 0], [b - 2, Math.PI]]) { const r = repere(h, S[i]); h.pose('boite', ombre, r, [0, -9.2, rv ? -4.5 : 4.5], 2 * W + 6, 18, 9); } // les culées de pierre, dans la paroi de la gorge
        // la chute : un ruban blanc étroit et strié dans une entaille sombre de la falaise, qui se défait en nuage aux deux tiers ; pas de colonne ni de bloc translucide
        const ch = (op) => mat('chuteFil', { lum: 1, c: 0xb4ccc8, transparent: op < 1, opacity: op, depthWrite: op === 1 }), cx = CIRQUE[0] + 3, cz = CIRQUE[1] + 28; // juste devant la paroi sud du cirque (elle monte à 30 m du centre)
        h.pose('boite', mat('rocheMousse', { c: 0x4a4a44 }), h.scene, [cx, 72, cz + 3], 60, 80, 3);
        // des mèches d'eau de largeurs et de longueurs inégales, entrecoupées de ressauts de roche moussue ; en bas, l'eau se défait (mèches translucides) : de l'eau éclairée par le jour, pas un pavé lumineux
        // PROTOTYPE (propositions/OEIL-NEUF-chapada.md, modification 1) : l'eau coule. Des nappes courbes à la place des boîtes : la lame se décolle de la lèvre, tombe en s'élargissant sur le ressaut,
        // rebondit et s'étale jusqu'au bassin. Chaque nappe est doublée d'une seconde, plus trouée, plus rapide, 40 cm devant (le principe des deux couches défilantes de l'eau des exemples three.js, Water2,
        // sans ses deux rendus de la scène) ; au pied, une couronne d'écume qui s'écarte. Le mouvement : la texture glisse (Texture.offset, dans le tick renvoyé à la fin), aucune géométrie ne bouge.
        {
          const haut = [[cx - 1, 111, cz + 2.6, 7], [cx - 1, 109.6, cz + 1.2, 7.6], [cx - 0.8, 106, cz + 0.4, 8.4], [cx - 0.5, 96, cz + 0.1, 9.4], [cx, 80, cz, 10.6], [cx + 0.4, 66, cz, 11.6], [cx + 0.6, 60, cz + 0.2, 12.4]],
            bas = [[cx + 0.6, 61, cz - 0.2, 10], [cx + 0.8, 59.4, cz - 2, 12], [cx + 1, 54, cz - 3, 14], [cx + 1, 44, cz - 3.4, 16], [cx + 1, 33.2, cz - 3.6, 18.5]],
            filet = [[cx + 9.4, 104, cz + 1.4, 1.6], [cx + 9.6, 90, cz + 0.6, 2.2], [cx + 9.8, 72, cz + 0.4, 2.8], [cx + 10, 61, cz + 0.4, 3.2]], filet2 = [[cx - 9, 86, cz + 1.4, 1.4], [cx - 9.2, 74, cz + 0.8, 2], [cx - 9.4, 61, cz + 0.6, 2.4]];
          for (const l of [haut, bas]) for (const q of l) q[3] *= 3; for (const q of filet) q[0] += 14; for (const q of filet2) q[0] -= 14; /* la grande chute de la carte : beaucoup d'eau, trois fois la largeur du prototype */
          nappe(haut, e1, 3); nappe(haut, e2, 2.4, -0.4); nappe(bas, e1, 4.2); nappe(bas, e2, 3.3, -0.5);
          nappe(bas.map(([x, y, z, w], k) => [x - 1.5 * k, y, z - 1 - 0.5 * k, w * (1.1 + 0.07 * k)]), e3, 5, -1.5); nappe([[cx - 1, 114, cz + 2.4, 23], [cx - 1, 111.4, cz + 2, 23.6], [cx - 1, 107, cz + 0.1, 25.5]], ecV, 6, -0.8); /* à mi-hauteur la chute se défait : un voile troué, plus rapide, que le vent écarte vers l'ouest ; la lèvre bouillonne */ nappe(filet, e2, 0.2); nappe(filet2, e2, 0.2);
          // la chute prend toute la paroi du cirque : deux autres pans, au sud-est et à l'est (le mur de gauche vu du pont), chacun avec sa paroi de roche derrière
          for (const th of [Math.PI / 4, Math.PI / 2, Math.PI * 0.72]) { const G = new THREE.Group(); G.position.set(CIRQUE[0] + 30 * Math.sin(th), 0, CIRQUE[1] + 30 * Math.cos(th)); G.rotation.y = th; h.scene.add(G); const w = 27;
            h.pose('boite', mat('rocheMousse', { c: 0x4a4a44 }), G, [0, 72, 4.5], w + 8, 82, 3);
            const pan = [[0, 112, 3, w * 0.8], [0, 110.5, 1.4, w * 0.84], [0, 104, 0.4, w * 0.88], [0, 84, 0, w * 0.94], [0, 60, -0.6, w], [0, 33.2, -2.6, w * 1.1]]; nappe(pan, e1, 3, 0, G); nappe(pan, e2, 2.4, -0.45, G); }
          // la vapeur au pied : des bouffées rondes et douces qui montent du bassin, grossissent et s'effacent (un seul nuage de points, additif : chaque bouffée s'éteint en fonçant sa couleur)
          // la vapeur : beaucoup de petites bouffées chaudes (à contre-jour) qui montent du bassin, un panache qui dépasse la falaise, et des embruns que le vent pousse en travers du tablier du pont
          { const nc = () => { const a = alea() * Math.PI * 0.9 - 0.1, r = 12 + alea() * 16; return [CIRQUE[0] + r * Math.sin(a), 33 + alea() * 6, CIRQUE[1] + r * Math.cos(a)]; };
            bouffees(220, nc, { vie: 12, vy: 5.6, taille: 15, f: 0.36, c: [1, 0.97, 0.88] }); bouffees(70, () => [cx - 16 + alea() * 34, 55 + alea() * 9, cz - 3 - alea() * 4], { vie: 5, vy: 1.6, vx: -2.6, taille: 14, f: 0.42 }); /* et au ressaut, à mi-hauteur, là où la chute se défait */
            bouffees(230, () => [1001 + alea() * 24, 62.5 + alea() * 8, 168 + alea() * 78], { vie: 4, vx: -7.5, vy: 0.7, taille: 10, f: 0.5 }); }
          { const P = [], U = [], I = [], NA = 14; for (let j = 0; j <= NA; j++) { const a = Math.PI * j / NA, c = Math.cos(a), sn = Math.sin(a); P.push(cx + 1 + c * 24, 33.12, cz - 3.2 - sn * 2, cx + 1 + c * 34, 33.12, cz - 3.2 - sn * 26); U.push(j / NA * 5, 0, j / NA * 5, -1.6);
              if (j) { const a0 = (j - 1) * 2; I.push(a0, a0 + 1, a0 + 2, a0 + 2, a0 + 1, a0 + 3); } }
            const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); ge.setIndex(I); ge.computeVertexNormals();
            const o = new THREE.Mesh(ge, ec); o.userData.dyn = 1; h.scene.add(o); const o2 = new THREE.Mesh(ge.clone().translate(0, 0.06, 0), ecV); o2.userData.dyn = 1; h.scene.add(o2); } /* une seconde couronne, plus rapide : le bassin bouillonne */ }
        inst(h, h.geo('rocher'), mat('rocheMousse'), [[cx - 7, 88, cz + 1, 0.4, 3.2, 2.2, 2], [cx + 3, 74, cz + 0.8, 1.9, 3.6, 2, 2], [cx - 2, 58, cz + 0.4, 2.7, 4.4, 2.4, 2.4], [cx + 7, 96, cz + 1, 0.9, 2.6, 1.8, 2], [cx - 6, 36, cz - 3, 1, 4, 2.4, 3], [cx + 5, 35.5, cz - 4, 2.2, 3.4, 2, 3]]); }

      // ---------- Z5, le temple-grotte (O-14) : une façade taillée dans la falaise autour de chaque portail, braseros allumés ----------
      for (const [i, rv, H] of [[t0, 0, 9], [t1, Math.PI, 8]]) { const r = repere(h, S[i]); r.rotation.y += rv; h.pose('facadeTemple', CITE, r, [0, -0.3, 0.6], S[i].w, H);
        { const rr = [], w = S[i].w, V = new THREE.Vector3(); r.updateMatrixWorld(); const pose = (x, y, z, t) => { V.set(x, y, z).applyMatrix4(r.matrixWorld); rr.push([V.x, V.y, V.z, rnd() * 6, t * 1.3, t, t * 1.2]); };
          for (const sd of [-1, 1]) for (let k = 0; k < 16; k++) { const u = rnd(), d = w + 5 + u * 34; pose(sd * d, rnd() * rnd() * (40 - u * 22), 1 + rnd() * 5 + (1 - u) * 3, 6 + rnd() * 6); }
          for (let k = 0; k < 9; k++) pose((rnd() - 0.5) * 2 * (w + 5), H + 5 + rnd() * 22, 0.5 + rnd() * 2.5, 5 + rnd() * 5);
          inst(h, h.geo('rocher'), mat('rocheMousse'), rr); }
        for (const sd of [-1, 1]) { const b = new THREE.Group(); b.position.set(sd * (S[i].w + 2.2), 0, 5); b.scale.setScalar(1.7); r.add(b); h.pose('torche', { bois: fer, fer, flamme }, b, [0, 0, 0]); }
        r.updateMatrixWorld(); for (const sd of [-1, 1]) { const q = r.localToWorld(new THREE.Vector3(sd * (S[i].w + 2.2), 5, 5)); flammeVive(q.x, q.y - 0.55, q.z, 1.7, h.lum(i, q.x, q.y, q.z, 0xffa040, 22, 2.2)); } } // les braseros des portails vacillent, et leur lueur avec eux
      { const cs = Array.from({ length: 110 }, () => { const q = S[t0 + 1 + (alea() * 13 | 0)], [x, z] = bord(q, alea() < 0.5 ? -1 : 1, alea() * 5), v = 6 + alea() * 5, k = 0.7 + alea() * 0.5; return { x, y: q.y + 3.4 + alea() * 4.2, z, r: 0, vx: -q.tx * v + (alea() - 0.5) * 3, vy: -0.4 + alea() * 1.1, vz: -q.tz * v + (alea() - 0.5) * 3, e: [k, k, k] }; });
        envol([], cs, t0 + 4, { ailes: [inst(h, h.geo('ailesV', 0.85), mat('peinture', { c: 0x2a1a14, ...DS }), cs.map(q => [q.x, q.y, q.z]))], D: 45, T: 5, g: 0.1, bat: 24 }); } // une nuée de chauves-souris sort de la grotte quand on y entre : au ras de la voûte, vers le jour

      const FUYARDS = []; // les singes qui fuient à l'approche : [échantillon, x, y, z, côté]
      // ---------- Z6, la descente des idoles (O-15, T-6) : des statues debout de plus en plus rapprochées jusqu'à l'arc ; la grande idole assise dans l'axe de l'équerre ----------
      { const st = []; let sd = 1; for (const d of [22, 42, 62, 84, 124, 164, 244, 324, 404, 484, 564]) { const i = P(52) - (d >> 1), s = S[i], [x, z] = bord(s, sd, s.w + 1.6); if (libre(x, z)) { st.push([x, s.y - 0.4, z, Math.atan2(s.x - x, s.z - z), 1.5 + (d < 100 ? 0.3 : 0)]); if (d === 324) FUYARDS.push([i, x, s.y - 0.4 + 5.32, z, sd]); } sd = -sd; }
        const yB = g.hAt(BASSIN[0], BASSIN[1]) + 1.5; for (const [dx, dz, a, t] of [[-17, 0, 0.5, 2.6], [-9, -15, 0.3, 1.5], [-9, 15, 0.7, 1.5]]) st.push([BASSIN[0] + dx, g.hAt(BASSIN[0] + dx, BASSIN[1] + dz) - 0.3, BASSIN[1] + dz, Math.PI * a, t]); // les gardiens du bassin
        { const rr = []; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283 + rnd() * 0.3, t = 1.4 + rnd() * 1.6; rr.push([BASSIN[0] + 13.5 * Math.cos(a), g.hAt(BASSIN[0] + 13.5 * Math.cos(a), BASSIN[1] + 13.5 * Math.sin(a)) + 0.2, BASSIN[1] + 13.5 * Math.sin(a), rnd() * 6, t * 1.3, t, t * 1.2]); } inst(h, h.geo('rocher'), mat('rocheMousse'), rr);
          h.pose('boite', coule(h.mat('eauJade', { ...DS, transparent: true, opacity: 0.86, gloss: 0.5 }), 0.015, 0.03), h.scene, [BASSIN[0], yB, BASSIN[1]], 30, 0.1, 30).userData.dyn = 1;
          h.pose('boite', pail(6, 6, 0.03, -0.05), h.scene, [BASSIN[0], yB + 0.09, BASSIN[1]], 30, 0.02, 30).userData.dyn = 1; h.pose('boite', pail(4.5, 7.5, -0.04, -0.02), h.scene, [BASSIN[0], yB + 0.11, BASSIN[1]], 30, 0.02, 30).userData.dyn = 1; } // le bassin sacré scintille
        insts(h, 'statueDebout', CITE, st);
        pose('idoleAssise', CITE, 508, 410, Math.PI / 2).scale.setScalar(1.6); for (const dz of [-6, 6]) { const p = pose('torche', { bois: fer, fer, flamme }, 518, 410 + dz); p.scale.setScalar(1.6); h.lum(P(43), 518, g.hAt(518, 410) + 4.5, 410 + dz, 0xffa040, 20, 2); }
        { const gv = new THREE.BufferGeometry(); gv.setAttribute('position', new THREE.Float32BufferAttribute([510.4, g.hAt(508, 410) + 5.6, 410], 3)); const m = new THREE.PointsMaterial({ size: 7, map: BRUME, color: 0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), o = new THREE.Points(gv, m); o.frustumCulled = false; o.userData.dyn = 1; h.scene.add(o);
          VIE.push((dt, car) => { if (!car) return; const d = Math.hypot(car.x - 510, car.z - 410), k = ss(210, 120, d) * ss(30, 70, d) * (car.x > 510 ? 1 : 0); m.color.setRGB(k, 0.72 * k, 0.24 * k); }); } } // l'or de l'idole accroche le soleil : un éclat qui monte et retombe avec la distance, sans clignoter

      // ---------- Z7, la cité perdue (O-16) : l'arc triple, la place dallée au bord de la rivière, la statue qui montre le nord sur son socle noir, quatre obélisques, le grand édifice ; l'expédition y a monté ses échafaudages ----------
      { const ia = P(52), ra = repere(h, S[ia]); h.pose('arcTriple', CITE, ra, [0, -0.5, 0], 7.5); h.pose('echafaudage', { bambou, planche }, ra, [15.5, -0.3, 4.2], 8, 3);
        h.pose('boite', mat('dallesBord', { c: 0x9a9c84 }), h.scene, [82, 16.62, 468], 96, 0.5, 132); // la place : un dallage plat, sous la chaussée (dalles de 1,2 m, mousse dans les joints)
        { const murs = [], mousses = [], tas = []; // les ruines de la ville autour de la place : des pans de mur bas qui dessinent des maisons, de la mousse dessus, des blocs tombés
          for (const [x, z, l, r, hh] of [[44, 452, 14, 0, 2.6], [37, 459, 14, 1.57, 1.8], [51, 462, 9, 1.57, 3.2], [40, 490, 12, 0, 2.2], [34, 498, 16, 1.57, 3], [46, 528, 18, 0, 2.4], [122, 452, 12, 0, 3], [128, 462, 16, 1.57, 2], [118, 476, 10, 0, 1.6], [132, 494, 12, 1.57, 2.8], [108, 536, 20, 0, 2.6], [60, 536, 10, 0, 1.8], [140, 520, 10, 1.57, 3.4], [56, 404, 12, 1.57, 2.4]]) {
            murs.push([x, 16.85 + hh / 2, z, r, l, hh, 1.3]); mousses.push([x, 16.9 + hh, z, r, l + 0.3, 0.25, 1.6]); if (rnd() < 0.7) tas.push([x + Math.cos(r) * (l / 2 + 1.5), 17.3, z - Math.sin(r) * (l / 2 + 1.5), rnd() * 6, 1.2, 0.9, 1.1]); }
          for (let k = 0; k < 16; k++) { const x = 40 + rnd() * 90, z = 440 + rnd() * 96; if (g.dAt(x, z) > 14) tas.push([x, 17.2, z, rnd() * 6, 0.8 + rnd(), 0.7, 0.8 + rnd()]); }
          inst(h, h.geo('bloc'), pierre, murs); inst(h, h.geo('bloc'), mat('bordureMousse'), mousses); inst(h, h.geo('rocher'), pierre, tas); }
        pose('statueNord', CITE, 68, 512, Math.PI, 16.85).scale.setScalar(1.7);
        for (const x of [72, 98]) for (let k = 0; k < 4; k++) { const hh = 4 + ((k * 7 + x) % 5); h.pose('boite', clairM, h.scene, [x + (k % 2) * 1.5, 16.85 + hh / 2, 430 - k * 8], 1.5, hh, 0.9); } // deux rangées de stèles mènent au temple for (const [x, z] of [[124, 540], [36, 540], [36, 436], [126, 436]]) pose('obelisque', CITE, x, z, 0, 16.85, 12);
        pose('templeDegres', CITE, 86, 366, 0, 16.6).scale.setScalar(1.8); pose('echafaudage', { bambou, planche }, 112, 392, 0.1, 16.85, 6, 2); for (const sd of [-1, 1]) pose('teteColossale', CITE, 86 + sd * 9, 394, 0, 16.6).scale.setScalar(0.5);
        for (const [x, z] of [[84, 505], [84, 519], [92, 396], [80, 396]]) { const p = pose('torche', { bois: fer, fer, flamme }, x, z, 0, 16.85); p.scale.setScalar(1.5); h.lum(P(55), x, 21, z, 0xffa040, 18, 1.8); }
        arbre(128, 388, 1.3); arbre(44, 396, 1.1); arbre(34, 500, 1.2); // les arbres ont poussé dans les murs
        for (const [x, z, r, t] of [[150, 536, 0.3, 1.2], [20, 470, 1.6, 1], [130, 470, -1.2, 1]]) pose('statueDebout', CITE, x, z, r, undefined, t); }

      // ---------- Z8, le gué (O-17) : dalles affleurantes hors de la trajectoire, galets, une statue à demi immergée en amont ; ressauts de la rivière : rochers et écume ----------
      { const roches = [], ecume = [], dallesG = [];
        for (let j = 1; j < RIV.length; j++) if (RIV[j].y < RIV[j - 1].y - 1 && !RIV[j].r && !RIV[j - 1].r) for (let k = 0; k < 9; k++) { const p = RIV[j - 1], q = RIV[j], f = (k / 8 - 0.5) * 2 * p.w, nx = -(q.z - p.z) / 4, nz = (q.x - p.x) / 4; // un ressaut : une barre de rochers, l'eau blanche entre eux
          roches.push([p.x + nx * f, p.y - 0.4, p.z + nz * f, rnd() * 6, 1.6 + rnd() * 1.4, 1.2 + rnd(), 1.6 + rnd() * 1.4]); ecume.push([q.x + nx * f * 0.9, (p.y + q.y) / 2 + 0.3, q.z + nz * f * 0.9, Math.atan2(nx, nz), 2.2, 0.3 + (p.y - q.y) * 0.5, 3.4]); }
        for (let k = 0; k < 46; k++) { const x = -112 + rnd() * 104, z = 232 + rnd() * 76, r = riv(x, z); if (r.d < r.p.w && g.dAt(x, z) > 13.5) (rnd() < 0.6 ? dallesG : roches).push([x, 14.05, z, rnd() * 6, 2 + rnd() * 2.5, 0.6, 1.4 + rnd() * 2]); }
        inst(h, h.geo('rocher'), mat('rocheMousse'), roches); inst(h, h.geo('bloc'), tombe(8, 0.95, 0.7, 0xe8f4f0), ecume); inst(h, h.geo('bloc'), mat('bordureMousse'), dallesG);
        { const ux = -0.9, uz = -0.43, ry = Math.atan2(ux, uz), sl = dallesG.map(([x, , z, , w]) => [x + ux * (w / 2 + 2.2), 14.3, z + uz * (w / 2 + 2.2), ry, 1.4, 0.02, 4.4]); for (const d of [-1, 1]) sl.push([-12 + ux * 3 - uz * d * 0.9, 14.3, 306 + uz * 3 + ux * d * 0.9, ry + d * 0.3, 1.3, 0.02, 5.5]);
          inst(h, h.geo('bloc'), ec, sl).userData.dyn = 1; } // un sillage d'écume derrière chaque dalle et derrière la statue : on voit que la rivière traverse
        { const cp = [0, 1, 2, 3].map(k => { const q = S[P(63) + 10 + k * 3], [x, z] = bord(q, 1, q.w + 2.5 + (k & 1) * 2); return [x, 14.25 - 0.2, z, vers(x, z, q) + (k & 1 ? 0.5 : -0.4), k === 3 ? 1.3 : 2.1]; }); insts(h, 'capivara', { poil: mat('peinture', { c: 0xa87a44 }), face: mat('peinture', { c: 0x5a3e24 }) }, cp); } // une famille de capybaras dans l'eau peu profonde, au bord amont du gué
        const st = pose('statueDebout', CITE, -12, 306, -2.2, 12.2, 2.2); st.rotation.z = 0.16; }
      inst(h, h.geo('tronc'), ecorce, futs); cimes.forEach((l, k) => inst(h, h.geo('cime'), feuilles[k], l)); // tous les arbres, ceux de la cité et le houppier du fromager compris
      insts(h, 'torche', { bois, fer, flamme }, torches);
      // ---------- Z5, dedans : des côtes de roche le long des parois de la grotte, pour qu'elle ne soit pas un couloir ----------
      { const cotes = []; for (let i = t0 + 6, k = 0; i < t1 - 4; i += 5, k++) { const s = S[i], sd = k & 1 ? 1 : -1, [x, z] = bord(s, sd, s.w + 1.2); cotes.push([x, s.y + 2.6 + rnd() * 2, z, rnd() * 6, 1.3 + rnd() * 0.6, 4 + rnd() * 3, 1.3 + rnd() * 0.6]); } // elles dépassent la paroi de moins de 0,8 m
        inst(h, h.geo('rocher'), mat('rocheMousse', { c: 0x8a8478 }), cotes); }
      // ---------- le saut de la descente (C-6) : les degrés écroulés d'un escalier de la cité, de part et d'autre du tremplin ----------
      { const deg = []; for (let k = 0; k < 7; k++) for (const sd of [-1, 1]) { const s = S[P(49) - 18 + k * 3], [x, z] = bord(s, sd, s.w + 2.2); deg.push([x, s.y - 0.6 + k * 0.12, z, h.across(s) + (rnd() - 0.5) * 0.3, 2.6, 1.2 + k * 0.25, 5.2]); }
        inst(h, h.geo('bloc'), pierre, deg); for (const sd of [-1, 1]) auBord('obelisque', CITE, P(49) + 2, sd, S[P(49)].w + 2.4, 8); }
      // les singes (macacos-prego) : assis sur les obélisques du pont (fixes) ; sur une statue de la descente, sur les degrés et les obélisques du saut, ils bondissent vers les arbres quand la voiture arrive
      { const peauS = { poil: mat('peinture', { c: 0x9a6230 }), face: mat('peinture', { c: 0xf0dcae }) }, iS = P(49); insts(h, 'singe', peauS, SINGES);
        for (const sd of [-1, 1]) { const q = S[iS + 2], [x, z] = bord(q, sd, S[iS].w + 2.4); FUYARDS.push([iS + 2, x, q.y - 0.35 + 8.85, z, sd]); const q2 = S[iS - 6], [x2, z2] = bord(q2, sd, q2.w + 2.2); FUYARDS.push([iS - 6, x2, q2.y + 0.98, z2, sd]); }
        for (const [lot, i0] of [[FUYARDS.filter(f => f[0] < iS - 10), iS - 28], [FUYARDS.filter(f => f[0] >= iS - 10), iS - 4]]) { if (!lot.length) continue;
          const bs = lot.map(([i, x, y, z, sd]) => { const q = S[i], v = 4 + alea() * 2; return { x, y, z, r: vers(x, z, S[i - 16]), vx: -q.tz * sd * v, vy: 6.5 + alea() * 2, vz: q.tx * sd * v, e: [3, 3, 3] }; });
          envol(insts(h, 'singe', peauS, bs.map(q => [q.x, q.y, q.z, q.r, 3])), bs, i0, { D: 26, T: 1.7, g: -4, meme: 1 }); } }
      for (const [m, b] of NAP) { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(b.P, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(b.U, 2)); ge.setIndex(b.I); ge.computeVertexNormals();
        const o = new THREE.Mesh(ge, m); o.userData.dyn = 1; o.frustumCulled = false; o.renderOrder = m === e1 ? 1 : m === e2 ? 2 : 3; h.scene.add(o); } // la nappe de derrière d'abord, puis celle de devant, puis voiles et écume
      let tv = 0; return (dt, now, car) => { tv += dt; for (const f of VIE) f(dt, car, tv); for (const [t, u, v] of COULE) { t.offset.x = (t.offset.x + u * dt) % 1; t.offset.y = (t.offset.y + v * dt) % 1; } }; // l'eau coule : seules des textures glissent
    },
  });
})();
