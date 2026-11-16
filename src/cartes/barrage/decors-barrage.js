// Placement du décor de « barrage » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  Object.assign(DECORS, {
    // ---------- Barrage 74 : centrale hydroélectrique soviétique de montagne, début mai 1974, retenue basse, vidanges de fond ouvertes, matin voilé ----------
    // Le site (docs/propositions/PROPOSITION-barrage.md) : Saïano-Chouchenskaïa au 1/2,5. x vers l'est, z vers le sud, la rivière coule vers le sud.
    // Un mur poids-voûte de 95 m (pied à 10 m, crête à 105 m) en arc de 600 m de rayon (centre en x = 0, z = 550, bombé vers le lac au nord) ferme une vallée en V.
    // Niveaux : retenue 85 m (pleine : 97 m, limite des arbres côté lac), bassin 10 m, terrasse de la rive est 14 à 16 m (usine, poste, cité), rivière 10 → 6 m.
    // Le relief est une fonction du site (`site`) ; près de la route il se raccorde à elle. La route : rue de la cité, vallée, pont au pied du mur, rampe du versant ouest,
    // tunnel dans l'éperon de la culée ouest, crête, épaule du versant est (deux épingles), retour à la cité.
    barrage(h) {
      const { THREE, S, N, W, rnd } = h, PP = h.M.pts.map((_, k) => pt(h, k)), P = k => PP[k], T0 = h.T.t0, T1 = h.T.t1, LUMI = { lum: 1 }, DS = { side: THREE.DoubleSide }, IX = new Map(S.map((s, i) => [s, i]));
      const LET = new Set(), mc = new Map(), mat = (n, o = {}, ...a) => { const k = n + JSON.stringify(o) + JSON.stringify(a); if (!mc.has(k)) { mc.set(k, h.mat(n, o, ...a)); if (n === 'lettres') LET.add(mc.get(k)); } return mc.get(k); }; // une matière par réglage : le jeu fond ensuite les pièces qui la partagent
      const lots = new Map(), ruban = (...a) => { const m = h.ribbon(...a); (lots.get(m.material) || lots.set(m.material, []).get(m.material)).push(m); return m; }; // rubans regroupés par matière à la fin (fond)
      const fond = () => { for (const [m, L] of lots) { if (L.length < 2) continue; const P3 = [], N3 = [], UV = [], I = []; for (const o of L) { const g = o.geometry, b = P3.length / 3; P3.push(...g.attributes.position.array); N3.push(...g.attributes.normal.array); UV.push(...g.attributes.uv.array); I.push(...Array.from(g.index.array, i => i + b)); h.scene.remove(o); g.dispose(); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); const o = new THREE.Mesh(g, m); o.receiveShadow = true; h.scene.add(o); } };
      // ---------- la vie (docs/propositions/VIE-barrage.md) : tout ce qui bouge passe par le tick, sur dt (la pause fige tout). TICK = fonctions (dt, car, t) ; un seul vent, du lac vers l'aval (vers +z) ----------
      // MOB = objets faits de cubes peints en coordonnées locales, dessinés en un lot mobile (userData.dyn) : train, drapeaux, nacelles. Le tick ne réécrit que les objets dont la matrice a changé (o.sale)
      const TICK = [], MOB = [], mob = () => { const o = { c: [], M: new THREE.Matrix4(), sale: 1 }; MOB.push(o); return o; }, mb = (o, x, y, z, r, a, b, c, col) => (o.c.push([x, y, z, r, a, b, c, col]), o);
      const mobA = (o, x, y, z, ry) => { o.M.makeRotationY(ry).setPosition(x, y, z); o.sale = 1; };
      const coule = (m, v, u = 0) => { TICK.push(dt => { const o = m.map.offset; o.y = (o.y - v * dt) % 1; o.x = (o.x + u * dt) % 1; }); return m; }; // l'eau qui coule : la texture avance le long de v (chaque réglage de mat() a sa propre texture)
      // panaches (embruns, fumées, poussière) : particules du jeu (h.flou), créées au premier tick ; [x, y, z, couleur, opacité, vie s, taille, par seconde, vitesse de montée, étalement]
      const PAN = [], panache = (...p) => { const q = { p, f: null, t: 0 }; PAN.push(q); return q; }, jit = a => (Math.random() - 0.5) * 2 * a;
      TICK.push(dt => { for (const q of PAN) { const [x, y, z, col, op, vie, tl, par, vy, et, vz = 2.2] = q.p; if (!q.f) q.f = h.flou(Math.ceil(par * vie) + 4, col, op, vie, 0.25, tl);
        if (!q.off) for (q.t += dt * par; q.t > 1; q.t--) q.f.emit(x + jit(et), y, z + jit(et), jit(0.6), vy * (0.7 + Math.random() * 0.6), vz + jit(0.8)); q.f.step(dt); } }); // le vent pousse tout vers +z
      // un drapeau : un cube mince accroché à sa hampe en (x, y, z), qui part dans le vent (vers +z) et bat ; r0 et amp : repos et débattement d'un calicot tenu par le haut
      const FLAGS = [], drapeau = (x, y, z, L, H, col = 0xb5241c, r0 = -Math.PI / 2, amp = 0.32) => { FLAGS.push([mb(mob(), L / 2, 0, 0, 0, L, H, 0.06, col), x, y, z, r0, amp, (x * 12.9898 + z * 78.233) % 6.28]); };
      TICK.push((dt, car, t) => { for (const [o, x, y, z, r0, amp, ph] of FLAGS) mobA(o, x, y, z, r0 + amp * Math.sin(t * 5 + ph) + amp * 0.4 * Math.sin(t * 11.3 + ph * 2)); });
      const borne = (i0, f) => { let arme = 1; TICK.push((dt, car) => { if (!car) return; const e = (car.idx - i0 + N) % N; if (e < 60) { if (arme) { arme = 0; f(car); } } else arme = 1; }); }; // f une fois par passage de la voiture à l'échantillon i0
      const K = { depart: 0, sortieVille: 9, plat: 21, halle0: 27, halle1: 33, pont0: 40, pont1: 42, rampe: 44, ravin: 52, traverse: 55, tunnel: 63, crete: 68, culee: 75, epingleHaute: 83, belvedere: 89, descente: 92, entreeVille: 100, rueSud: 112, fin: 116 }; // indices des points de contrôle nommés (captures/gen-pts.js K)
      const dans = (i, a, b) => ((i - P(a) + N) % N) <= ((P(b) - P(a) + N) % N); // échantillon i entre les points a et b
      const lisse = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }, mix = (a, b, t) => a + (b - a) * t;
      const pl = (T, v) => { if (v <= T[0][0]) return T[0][1]; for (let k = 1; k < T.length; k++) if (v <= T[k][0]) return mix(T[k - 1][1], T[k][1], (v - T[k - 1][0]) / (T[k][0] - T[k - 1][0])); return T[T.length - 1][1]; }; // table [[abscisse, valeur], …] lue en ligne brisée
      const SUB = []; for (let i = 0; i < N; i += 3) SUB.push(i);
      // échantillon le plus proche, par cases de 50 m : chaque case garde, à sa première question, les seuls échantillons qui peuvent être le plus proche d'un de ses points
      // (à moins de la distance minimale au centre + deux demi-diagonales), dans l'ordre de SUB : même résultat que le parcours de tout SUB, égalités comprises
      const CEL = 50, DG = CEL * Math.SQRT1_2, CAND = new Map();
      const proche = (x, z) => { const cx = Math.floor(x / CEL), cz = Math.floor(z / CEL), k = cx * 65536 + cz; let L = CAND.get(k);
        if (!L) { const mx = (cx + 0.5) * CEL, mz = (cz + 0.5) * CEL, D = SUB.map(i => Math.hypot(S[i].x - mx, S[i].z - mz)), m = Math.min(...D); L = SUB.filter((_, j) => D[j] <= m + 2 * DG + 1e-6); CAND.set(k, L); }
        let b = 0, bd = 1e18; for (const i of L) { const s = S[i], d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = i; } } return { i: b, s: S[b], d: Math.sqrt(bd) }; };
      const tranche = (a, b, f) => { const l = (b - a + N) % N; f((a + N) % N, l); }; // ruban de l'échantillon a à b
      const bloc = (m, x0, x1, z0, z1, y0, y1) => boite(h, m, x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      const maille = (P3, UV, I, m) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); const o = new THREE.Mesh(g, m); o.receiveShadow = true; h.scene.add(o); return o; };
      // bande d'eau le long d'une ligne [[x, z, demi-largeur, altitude], …]
      const bande = (L, m, tu = 16) => { const P3 = [], UV = [], I = []; let v = 0;
        L.forEach(([x, z, w, y], k) => { const a = L[Math.max(0, k - 1)], b = L[Math.min(L.length - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l;
          if (k) v += Math.hypot(x - L[k - 1][0], z - L[k - 1][1]); P3.push(x - nx * w, y, z - nz * w, x + nx * w, y, z + nz * w); UV.push(-w / tu, v / tu, w / tu, v / tu); if (k) { const c = k * 2 - 2; I.push(c, c + 1, c + 2, c + 1, c + 3, c + 2); } });
        return maille(P3, UV, I, m); };

      // ---------- le site ----------
      const CZ = 550, RA = 600, YC = 105, LAC = 85, PLEIN = 97; // centre et rayon de l'arc de crête ; niveaux
      const AMAX = Math.asin(262 / RA); // demi-ouverture du mur (il s'encastre dans la roche à x = ±262)
      const arc = (a, r) => [Math.sin(a) * r, CZ - Math.cos(a) * r]; // point de l'arc : angle a (0 = plein nord), rayon r
      const aval = (x, z) => z - (CZ - Math.sqrt(RA * RA - Math.min(Math.abs(x), 300) ** 2)); // distance vers l'aval de l'axe de la crête (négative côté lac)
      // bords du fond de vallée (rive ouest, rive est), altitude de la terrasse, pentes des versants : tables en z
      const XW = [[80, -152], [200, -172], [288, -195], [1100, -195], [1250, -330], [1500, -760]], XE = [[30, 150], [70, 188], [230, 196], [366, 272], [480, 325], [595, 375], [700, 440], [800, 500], [1150, 500], [1280, 250], [1420, -150], [1500, -330]];
      const SW = [[80, 0.73], [290, 0.57], [480, 0.42], [600, 0.37], [900, 0.36], [1400, 0.42]]; // pente du versant ouest
      const SE = [[30, 0.75], [124, 0.5], [216, 0.34], [300, 0.43], [366, 0.42], [700, 0.36], [1400, 0.42]]; // pente du pied du versant est
      const R1 = [[216, 400], [280, 26], [620, 14], [720, 400]]; // hauteur du pied raide sous l'épaule du versant est (400 : pas d'épaule)
      const X2 = [[44, 365], [124, 402], [180, 437], [244, 482], [300, 540], [400, 612], [620, 565], [720, 525], [1150, 540], [1400, 0]]; // au-delà : le versant est reprend sa pente raide
      const terrasse = z => 14 + 2 * lisse(318, 930, z);
      const cote = (x, z) => 300 + 70 * Math.sin(x / 310 + 1) * Math.sin(z / 270) + 40 * Math.sin((x + z) / 130); // altitude des crêtes proches
      const contrefort = (x, z) => 90 * Math.exp(-(((x + 335) / 130) ** 2) - ((z - 150) / 170) ** 2) * (aval(x, z) > 0 ? lisse(pl(XW, z) - 5, pl(XW, z) - 60, x) : 1); // le contrefort rocheux de la culée ouest : la montagne que perce le tunnel (rien sur le fond de vallée)
      const site = (x, z) => {
        const dv = aval(x, z), f = terrasse(z); let y;
        // aval : fond plat entre les deux bords, versant ouest d'une seule pente, versant est avec son épaule
        const xw = pl(XW, z), xe = pl(XE, z); let ya = f, u = 0;
        if (x < xw) { u = xw - x; ya = f + u * pl(SW, z); }
        else if (x > xe) { u = x - xe; const s1 = pl(SE, z), r1 = pl(R1, z), x2 = pl(X2, z), ua = r1 / s1; ya = f + Math.min(u * s1, r1) + Math.max(0, Math.min(x, x2) - (xe + ua)) * 0.18 + Math.max(0, x - x2) * 0.3; }
        // amont : la vallée noyée, fond à 25 m, qui s'élargit et tourne au nord-est
        const zu = Math.min(0, z), cu = 0.3 * Math.max(0, -zu - 250), uu = Math.abs(x - cu) - (105 + Math.min(-zu, 700) * 0.3), yu = 25 + Math.max(0, uu) * 0.5;
        if (dv < 0) u = Math.max(0, uu);
        y = mix(yu, ya, lisse(-30, 50, dv));
        y += Math.min(1, Math.max(0, u - 40) / 120) * 8 * Math.sin(z / 55 + Math.sin(x / 80) * 1.3); // nervures et ravines des versants
        y += contrefort(x, z);
        const c = cote(x, z); if (y > 180) y = 180 + (c - 180) * (1 - Math.exp(-(y - 180) / (c - 180))); // les crêtes : la pente s'adoucit vers le haut
        return y;
      };
      // la rivière : du bassin de dissipation (10 m) à la sortie de la carte (6 m) ; le canal de fuite de l'usine la rejoint sous le pont
      const RIV = [[-115, 200, 35, 10], [-112, 300, 38, 9.8], [-100, 400, 42, 9.4], [-110, 520, 40, 9], [-110, 700, 40, 8.2], [-112, 900, 42, 7.4], [-130, 1100, 45, 6.6], [-300, 1290, 45, 6], [-760, 1560, 50, 5.4]];
      const FUITE = [[60, 108, 24, 10], [58, 200, 20, 10], [40, 300, 18, 9.9], [-18, 372, 18, 9.6], [-96, 414, 20, 9.4]];
      const dLigne = L => (x, z) => { let b = 1e9, yb = 0; for (let k = 0; k < L.length - 1; k++) { const [ax, az, aw, ay] = L[k], [bx, bz, bw, by] = L[k + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))), d = Math.hypot(x - ax - dx * t, z - az - dz * t) - mix(aw, bw, t); if (d < b) { b = d; yb = mix(ay, by, t); } } return [b, yb]; };
      const dRiv = dLigne(RIV), dFuite = dLigne(FUITE), eauAval = (x, z) => { const a = dRiv(x, z), b = dFuite(x, z); return a[0] < b[0] ? a : b; }; // [distance à la berge (négative dans l'eau), altitude de l'eau]
      const BAS = [-150, -80, 30, 200]; // le bassin de dissipation : x0, x1, z0, z1
      const dBassin = (x, z) => Math.max(BAS[0] - x, x - BAS[1], BAS[2] - z, z - BAS[3]);
      const riv = (x, z) => Math.min(eauAval(x, z)[0], dBassin(x, z));
      // ce que la route ne modèle pas : le pont (sur l'eau), la crête (sur le mur), le tunnel (dans l'éperon)
      const pontI = new Set(), murI = new Set();
      for (let i = P(K.pont0 - 1); i !== P(K.pont1); i = (i + 1) % N) if (S[i].x > -152 && S[i].x < -72) pontI.add(i);
      for (let i = P(K.crete); i !== P(K.culee); i = (i + 1) % N) if (Math.abs(S[i].x) < 256 && aval(S[i].x, S[i].z) < 30) murI.add(i);
      const tunI = i => i >= T0 + 5 && i <= T1 - 5;
      const QA = P(95) - 4, QB = P(97) + 4, carr = (p, x, z, m) => p.i > QA && p.i < QB && (z - p.s.z) * p.s.tx - (x - p.s.x) * p.s.tz < -(p.s.w + 6) && p.d < p.s.w + m; // la carrière de la descente, côté montagne (gauche) entre les points 95 et 97
      const creux = (x, z, y) => {
        const p = proche(x, z), s = p.s, w = s.w, d = p.d, hs = site(x, z), dv = aval(x, z), plat = dv > 40 && x > pl(XW, z) - 25 && x < pl(XE, z) + 25; let b;
        if (tunI(p.i)) b = d < w + 16 ? s.y - 0.8 : Math.min(Math.max(hs, mix(s.y + 13, -99, lisse(w + 50, w + 130, d))), s.y + 13 + Math.min(p.i - T0, T1 - p.i) * 2 + (d - w - 16) * 1.1); // la montagne part du haut de la tête de bunker et monte à 45° : pas de falaise à pic au-dessus du portail // sous le tunnel le sol reste sous la chaussée (la chape de roche le couvre) ; autour, l'éperon monte au-dessus de la voûte
        else if (pontI.has(p.i) || murI.has(p.i)) b = d < w + 6 ? Math.min(hs, s.y - 0.9) : hs;
        else { const kc = Math.min(1, contrefort(x, z) / 30), loin = mix(plat || dv < -20 ? hs : y, hs, lisse(mix(70, 20, kc), mix(170, 55, kc), d)); const vk = x > 100 && x < 492 && z > 690 && z < 1150 ? 18 : 0; b = mix(s.y - 0.6, loin, lisse(w + 5 + vk, w + 30 + vk * 1.6, d)); if (d < w + 30 + vk) b = Math.min(b, s.y - 0.6 + Math.max(0, d - w - 5 - vk) * 0.8); } // près de la route : son niveau, puis un talus qui rejoint le site ; jamais de sol plus haut que la chaussée à son bord
        { const k = Math.min(lisse(T0 - 34, T0 - 2, p.i), 1 - lisse(T1 - 2, T1 + 10, p.i)); if (k > 0 && d > w + 5 && !murI.has(p.i)) b = Math.max(b, s.y - 0.6 + Math.min(Math.max(14 * (1 - lisse(w + 50, w + 130, d)), hs - s.y) * k, (d - w - 5) * 1.1)); } // l'éperon de la culée ouest : la roche monte de part et d'autre de la route avant le portail (une entaille), et reste au-dessus de la voûte jusqu'à la sortie
        if (carr(p, x, z, 66)) b = Math.min(b, s.y - 0.5); // le carreau de la carrière : à plat, au niveau de la route
        if (x > -24 && x < 144 && z > 16 && z < 110) b = Math.min(b, 12); // sous la salle des turbines : jamais de terrain au-dessus du sol de la halle (14)
        // l'eau d'aval se creuse : lit sous l'eau, berge à 1 pour 2
        const libre = d > w + 6 || pontI.has(p.i) || murI.has(p.i);
        if (libre && dv > 60) { const [rv, wy] = eauAval(x, z), db = dBassin(x, z), r = Math.min(rv, db), yw = db < rv ? 10 : wy; if (r < 14) b = Math.min(b, yw - 2.5 + Math.max(0, r + 4) * 0.5); }
        return y - b;
      };
      const g = terrain(h, { pas: 12, marge: 720, sol: s => { const i = IX.get(s); return pontI.has(i) || murI.has(i) ? site(s.x, s.z) : s.y; }, creux, mat: mat('solGES'), couches: [
        { tex: ['rocheGES'], pente: [0.1, 0.17], rep: 0.8, bruit: 0.04 }, // la roche affleure sur les pentes de plus de 30°
        { tex: ['bruit', '#b4ab96', ['#c4bba6', '#a09884']], poids: (x, z, y) => Math.max(aval(x, z) < 0 ? 1 - lisse(PLEIN - 1.5, PLEIN + 1, y) : 0, aval(x, z) > 60 ? 1 - lisse(3, 12, riv(x, z)) : 0) }, // la rive nue de la retenue basse (sous 97 m), les galets des berges
        { tex: ['bruit', '#6e6a58', ['#7c7864', '#5e5a4a']], bord: [5, 13] }] }); // l'accotement de gravier
      const hAt = g.hAt, dAt = g.dAt;

      // ---------- l'eau : la retenue (85 m), le bassin et la rivière ----------
      const eau = mat('eauGES', { c: 0xb8cccc }, '#4f7f8c', 40), eauRiv = mat('eauGES', { c: 0xa8bcbc }, '#4f7f8c', 40), ecume = mat('ecumeGES');
      { const P3 = [], UV = [], I = [], n = 24, a0 = AMAX + 0.28; // la retenue : un secteur qui part du parement amont ; les versants la découpent
        for (let k = 0; k <= n; k++) { const a = -a0 + 2 * a0 * k / n, A = arc(a, RA + 10.5), B = arc(a, RA + 1900); P3.push(A[0], LAC, A[1], B[0], LAC, B[1]); UV.push(A[0] / 16, A[1] / 16, B[0] / 16, B[1] / 16); if (k) { const c = k * 2 - 2; I.push(c, c + 2, c + 1, c + 1, c + 2, c + 3); } }
        maille(P3, UV, I, eau).material.side = THREE.DoubleSide; }
      bande(RIV, eauRiv, 12); bande(FUITE, eauRiv, 12); coule(eauRiv, 0.45); coule(eau, 0.012, 0.008); coule(ecume, 0.05, 0.02); // V-52, V-85 : la rivière et le canal courent vers l'aval, la retenue clapote, l'écume du bassin dérive
      bloc(ecume, BAS[0], BAS[1], BAS[2], BAS[3], 8, 10.1);

      // ---------- le mur : poids-voûte, parement aval incliné (0,72 m par mètre), parement amont vertical ; plots de 18 m en relief, fenêtres des galeries de visite ----------
      const bet = mat('betonGES'), betS = mat('betonGES', {}, '#6d726d'), betC = mat('betonGES', {}, '#b8b4a4'), face = mat('faceGES'), noir = mat('peinture', { c: 0x1c1e20 }), orange = mat('toleOrange'), gris = mat('matGris');
      // prisme en arc : profil [[décalage vers l'aval, altitude], …] tourné autour du centre de l'arc, de l'angle a0 à a1
      const arcPrisme = (prof, a0, a1, m, tu = 18, tv = 24, n = 44) => { const P3 = [], UV = [], I = []; let v = 0;
        for (let k = 0; k < prof.length - 1; k++) { const [oa, ya] = prof[k], [ob, yb] = prof[k + 1], l = Math.hypot(ob - oa, yb - ya), b0 = P3.length / 3;
          for (let j = 0; j <= n; j++) { const an = a0 + (a1 - a0) * j / n, A = arc(an, RA - oa), B = arc(an, RA - ob), su = an * RA / tu; P3.push(A[0], ya, A[1], B[0], yb, B[1]); UV.push(su, v / tv, su, (v + l) / tv); if (j) { const c = b0 + j * 2 - 2; I.push(c, c + 1, c + 2, c + 1, c + 3, c + 2); } }
          v += l; }
        const o = maille(P3, UV, I, m); o.material.side = THREE.DoubleSide; o.castShadow = true; return o; };
      const YF = YC - 1.4, oF = y => 11 + (YF - y) * 0.72, AM = AMAX + 0.05; // oF : décalage vers l'aval du parement aval à l'altitude y
      const pF = (x, y, e = 0) => { const r = RA - oF(y) - e; return [x, y, CZ - Math.sqrt(r * r - x * x)]; }; // point du parement aval à l'abscisse x et l'altitude y, décollé de e mètres
      arcPrisme([[oF(0), 0], [11, YF]], -AM, AM, face); arcPrisme([[11, YF], [-11, YF], [-11, 20]], -AM, AM, bet, 8, 8);
      arcPrisme([[-11.06, PLEIN], [-11.06, LAC - 2]], -AM, AM, betS, 8, 8); // côté lac : la bande sombre laissée par l'eau entre la retenue pleine et le niveau du jour
      { const P3 = [], UV = [], I = [], quad = (A, B, C, D) => { const b = P3.length / 3; P3.push(...A, ...B, ...C, ...D); UV.push(0, 0, 1, 0, 0, 8, 1, 8); I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); };
        for (let x = -243; x <= 243; x += 18) { const a = [pF(x - 1, 2, 1.2), pF(x + 1, 2, 1.2), pF(x - 1, YF, 1.2), pF(x + 1, YF, 1.2)], f = [pF(x - 1, 2), pF(x + 1, 2), pF(x - 1, YF), pF(x + 1, YF)];
          quad(a[0], a[1], a[2], a[3]); quad(f[0], a[0], f[2], a[2]); quad(a[1], f[1], a[3], f[3]); } // un joint de plot saillant : une face et deux joues
        maille(P3, UV, I, mat('betonGES', DS, '#7d817a')).castShadow = true;
        const Q3 = [], QV = [], QI = []; for (let x = -234; x < 240; x += 18) for (const y of [34, 58, 82]) if (rnd() < 0.4) { const x0 = x + 4 + rnd() * 6, b = Q3.length / 3; Q3.push(...pF(x0, y, 0.2), ...pF(x0 + 2, y, 0.2), ...pF(x0, y + 2.4, 0.2), ...pF(x0 + 2, y + 2.4, 0.2)); QV.push(0, 0, 1, 0, 0, 1, 1, 1); QI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
        maille(Q3, QV, QI, mat('peinture', { c: 0x1e2022, side: THREE.DoubleSide })); }

      // ---------- les vidanges de fond et le bassin : quatre pertuis dans la moitié ouest, à 12 m au-dessus de l'eau ; chaque jet est un volume en arc qui retombe dans le bassin ----------
      { const XS = [-136, -115, -94], blanc = mat('ecumeGES', { c: 0xffffff, emissive: 0x9aa8ac }), brume = mat('brumeGES', { lum: 1, transparent: true, depthWrite: false, side: THREE.DoubleSide }), P3 = [], UV = [], I = [], bru = [];
        for (const x of XS) { const [, , z0] = pF(x, 22); bloc(noir, x - 3.4, x + 3.4, z0 - 5, z0 + 0.8, 19, 25); bloc(orange, x - 3.8, x + 3.8, z0 - 3.4, z0 - 2.6 + 3.2, 25.4, 28.6); bloc(betS, x - 4.6, x + 4.6, z0 - 2, z0 + 3, 16.5, 18.8); // le pertuis, sa vanne levée, sa lèvre
          const n = 12, m = 8, b0 = P3.length / 3; // le jet : un tube à section en ellipse, qui part à l'horizontale et retombe de 12 m en 52 m
          for (let k = 0; k <= n; k++) { const t = k / n, zc = z0 + 1 + t * 52, yc = 22 - 12.5 * t * t, a = Math.atan2(-25 * t, 52), rx = 2.6 + 3.6 * t, ry = 2.2 + 3 * t;
            for (let j = 0; j <= m; j++) { const u = j / m * Math.PI * 2, cy = Math.cos(u) * ry, cx = Math.sin(u) * rx; P3.push(x + cx, yc + cy * Math.cos(a), zc - cy * Math.sin(a)); UV.push(j / m * 2, t * 5); if (k < n && j < m) { const c = b0 + k * (m + 1) + j; I.push(c, c + 1, c + m + 1, c + 1, c + m + 2, c + m + 1); } } }
          bru.push([x, 15, z0 + 60, rnd() * 3, 30, 15, 30], [x + 10, 13.5, z0 + 78, rnd() * 3, 26, 11, 26]); panache(x, 13, z0 + 56, [0.93, 0.96, 0.97], 0.2, 6, 4, 6, 4, 4); }
        maille(P3, UV, I, blanc); coule(blanc, 1.5); // V-50, V-51 : l'écume des jets file dans le sens de la chute ; un panache d'embruns monte de chaque point de chute
        bru.push([-115, 13, 170, 0, 60, 9, 40]);
 inst(h, h.geo('brume'), brume, bru).renderOrder = 3; }
      bloc(bet, BAS[0] - 4, BAS[0], 36, BAS[3] + 4, 2, 15); bloc(bet, BAS[1], BAS[1] + 4, 24, BAS[3] + 4, 2, 15); bloc(betS, BAS[0], BAS[1], BAS[3], BAS[3] + 4, 2, 10.6); // les bajoyers du bassin et le seuil de sortie

      // ---------- la salle des turbines, au pied de la moitié est du mur : la route la traverse d'est en ouest (halle de 160 × 64 m) en slalomant entre trois groupes en quinconce, deux groupes à l'arrêt, pupitres côté baies, deux ponts roulants ----------
      const HX0 = -20, HX1 = 140, HZ0 = 42, HZ1 = 106, YH = 14, HT = 26, dansHalle = i => { const s = S[(i + N) % N]; return s.x > HX0 - 2 && s.x < HX1 + 2 && s.z > HZ0 && s.z < HZ1; };
      let iH0 = -1, iH1 = -1; for (let i = P(K.halle0 - 2); i !== P(K.halle1 + 3); i = (i + 1) % N) if (dansHalle(i)) { if (iH0 < 0) iH0 = i; iH1 = i; }
      { const verre = mat('baiesHalle', { c: 0xd8dcd8 }), vert = mat('cuveGroupe'), vertS = mat('peinture', { c: 0x4a8478 }), rouge = mat('peinture', { c: 0xb5483c });
        bloc(bet, HX0, HX1, 20, HZ0 + 1.2, YH - 12, YH + HT); // le mur du fond, contre le pied du barrage
        bloc(bet, HX0, HX1, HZ1 - 1, HZ1, YH - 12, YH + 4); bloc(verre, HX0 + 1, HX1 - 1, HZ1 - 0.8, HZ1 - 0.2, YH + 4, YH + HT - 3); bloc(bet, HX0, HX1, HZ1 - 1, HZ1, YH + HT - 3, YH + HT); // la façade sud : allège, grandes baies, bandeau
        bloc(betS, HX0 - 1, HX1 + 1, 20, HZ1 + 1.5, YH + HT, YH + HT + 1.2); // le toit
        for (const x of [15, 60, 105]) bloc(mat('vitreSombre'), x - 9, x + 9, HZ0 + 12, HZ1 - 12, YH + HT + 1.2, YH + HT + 2.2); // lanterneaux

        // les pignons, percés pour la route : la porte suit la chaussée qui les traverse
        for (const xw of [HX0, HX1]) { let bi = iH0, bd = 1e9; for (let i = iH0 - 12; i <= iH1 + 12; i++) { const d = Math.abs(S[i].x - xw); if (d < bd) { bd = d; bi = i; } } const s = S[bi], o = (s.w + 2.2) / Math.max(0.5, Math.abs(s.tx));
          bloc(bet, xw - 1.3, xw + 1.3, 20, s.z - o, YH - 12, YH + HT); bloc(bet, xw - 1.3, xw + 1.3, s.z + o, HZ1, YH - 12, YH + HT); bloc(bet, xw - 1.3, xw + 1.3, s.z - o, s.z + o, YH + 10, YH + HT);
          bloc(mat('bandeOrange'), xw - 1.45, xw + 1.45, s.z - o, s.z + o, YH + 10, YH + 11); } // le linteau rayé des portes
        bloc(mat('solHalle'), HX0, HX1, HZ0, HZ1, YH - 2, YH - 0.2); // une dalle pleine dessous : aucun trou entre les dalles qui suivent la route
        // le sol : deux dalles de part et d'autre de la chaussée, qui la suivent (rien n'est posé sur la route)
        tranche(iH0 - 2, iH1 + 2, (i, l) => { ruban(i, l, s => -(s.w + 0.1), 0.03, s => -Math.max(s.w + 0.2, s.z - HZ0 - 1), 0.03, mat('solHalle'), 6); ruban(i, l, s => s.w + 0.1, 0.03, s => Math.max(s.w + 0.2, HZ1 - 1 - s.z), 0.03, mat('solHalle'), 6); });
        { const gc = mat('glissiere', DS, ['#e8761e', '#1e1e1c', '#e8761e', '#c86a1a']); for (const sd of [-1, 1]) tranche(iH0 - 2, iH1 + 2, (i, l) => ruban(i, l, s => sd * (s.w + 0.4), 1, s => sd * (s.w + 0.4), 0, gc, 4)); } // la voie, bordée de garde-corps orange
        // les trois groupes côté mur : cuve vert d'eau, collier rayé, capot, excitatrice rouge, plaque
        const G3 = [[105, YH, 65], [60, YH, 84], [15, YH, 65]]; // la voie passe au sud du premier, au nord du deuxième, au sud du troisième, à 4 m des cuves
        inst(h, h.geo('alternateur'), vert, G3); inst(h, h.geo('capot'), vertS, G3.map(([x, y, z]) => [x, y + 5, z]));
        { const tourne = G3.map(([x, y, z]) => { const g = new THREE.Group(); g.position.set(x, y, z); g.userData.dyn = 1; h.scene.add(g); h.pose('collier', mat('bandeOrange'), g, [0, 0, 0]); h.pose('excitatrice', rouge, g, [0, 6.8, 0]); // V-15 : le collier rayé et l'excitatrice tournent (hors de la fusion) ; les deux groupes à l'arrêt ne bougent pas
            for (const a of [0, 2.1, 4.2]) h.pose('boite', mat('peinture', { c: 0xe8e4d8 }), g, [Math.cos(a) * 1.62, 8, Math.sin(a) * 1.62], 0.5, 1.6, 0.5).rotation.y = -a; soude(h, g); return g; }); // trois plaques claires sur l'excitatrice : sans elles sa rotation ne se voit pas
          TICK.push(dt => { for (const g of tourne) g.rotation.y += dt * 2.6; }); }
        inst(h, h.geo('boite', 4, 1.4, 0.1), mat('lettres', {}, 'ГА', '#5fa89a', '#e8e4d8'), G3.flatMap(([x, y, z]) => [[x + 5.05, y + 3, z, Math.PI / 2], [x - 5.05, y + 3, z, Math.PI / 2]]));
        inst(h, h.geo('couvercle'), mat('peinture', { c: 0x8a9a6a }), [[82, YH + 0.06, 52], [38, YH + 0.06, 52], [128, YH + 0.06, 52], [-8, YH + 0.06, 52]]); // deux groupes à l'arrêt : couvercles au ras du sol
        { const arm = []; for (let x = HX0 + 8; x < HX1 - 6; x += 8) arm.push([x, YH + 1.2, HZ1 - 3, 0, 2.6, 2.4, 1.2]); inst(h, h.geo('bloc'), mat('peinture', { c: 0x9aa89a }), arm); } // les pupitres et armoires, côté baies
        { const col = []; for (let x = HX0 + 2; x <= HX1 - 2; x += 15.4) for (const z of [HZ0 + 2.2, HZ1 - 2]) col.push([x, YH + HT / 2, z, 0, 1.6, HT, 1.4]); inst(h, h.geo('bloc'), betS, col); }
        for (const z of [HZ0 + 3, HZ1 - 3]) bloc(orange, HX0 + 1, HX1 - 1, z - 0.6, z + 0.6, YH + 19.5, YH + 20.5); // les rails des ponts roulants
        insts(h, 'pontRoulant', { acier: orange, chariot: orange, cabine: mat('peinture', { c: 0xe8e4d8 }), cable: gris, crochet: gris }, [[38, YH + 21.5, (HZ0 + HZ1) / 2, Math.PI / 2], [128, YH + 21.5, (HZ0 + HZ1) / 2, Math.PI / 2]], { a: [HZ1 - HZ0 - 6] });
        { const l = []; for (let x = HX0 + 12; x < HX1; x += 22) { for (const z of [HZ0 + 14, HZ1 - 14]) l.push([x, YH + HT - 0.4, z, 0, 6, 0.3, 1]); const i = near(h, x, 74); h.lum(i, x, YH + 21, 74, 0xfff0d8, 50, 0.8); } inst(h, h.geo('bloc'), mat('lampe', LUMI), l); }
        { const m = new THREE.Mesh(h.geo('boite', 44, 6, 0.4), mat('lettres', {}, 'ГЭС-74', '#8d918a', '#b5483c')); m.position.set((HX0 + HX1) / 2, YH + HT + 5.4, HZ1 - 1); h.scene.add(m); for (const x of [-18, 0, 18]) bloc(gris, (HX0 + HX1) / 2 + x - 0.3, (HX0 + HX1) / 2 + x + 0.3, HZ1 - 2.6, HZ1 - 1.4, YH + HT + 1, YH + HT + 3); } // les lettres sur le toit
        const tm = mat('peinture', { c: 0x4a5a5a }); for (const x of [15, 60, 105]) { const y0 = 84, y1 = YH + HT - 2, A = pF(x, y0, -3.4), B = pF(x, y1, -3.4), l = Math.hypot(A[1] - B[1], A[2] - B[2]), m = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, l, 10), tm);
          m.position.set(x, (y0 + y1) / 2, (A[2] + B[2]) / 2); m.rotation.x = -Math.atan2(B[2] - A[2], A[1] - B[1]); m.castShadow = true; h.scene.add(m); for (let y = y1 + 8; y < y0; y += 12) { const q = pF(x, y); bloc(betS, x - 4, x + 4, q[2] - 0.5, q[2] + 3.6, y - 1, y); } } } // les conduites forcées, au droit des groupes

      // ---------- côté lac : la tour de prise d'eau accrochée au parement amont, sa passerelle ; le barrage flottant de bouées, loin du mur ----------
      { const [tx, tz] = arc(Math.asin(70 / RA), RA + 21), verreT = mat('baiesHalle', { c: 0xb4bcc0 }); bloc(bet, tx - 8, tx + 8, tz - 8, tz + 8, 30, 116); bloc(verreT, tx - 8.3, tx + 8.3, tz - 8.3, tz + 8.3, 107, 114); bloc(betS, tx - 9, tx + 9, tz - 9, tz + 9, 116, 117.4); bloc(betS, tx - 2, tx + 2, tz + 8, tz + 14, 103.4, 104.6);
        const b = []; for (let a = -0.36; a < 0.36; a += 0.014) { const [x, z] = arc(a, RA + 120 + Math.sin(a * 22) * 6); b.push([x, LAC + 0.2, z, 0, 1.4, 0.8, 1.4]); } inst(h, h.geo('bloc'), orange, b); }

      // ---------- la route : glissière continue hors ouvrages (comme touge) et ses catadioptres ; parapet de béton sur le pont et côté lac de la crête ; garde-corps ajouré côté vide ; trottoirs dans la cité ----------
      const para = mat('parapet', DS), glis = mat('glissiere', DS, h.TH.mur);
      const parapet = (a, b, sd) => tranche(a, b, (i, l) => { const o = s => sd * (s.w + 0.3), o2 = s => sd * (s.w + 0.9); ruban(i, l, o, 1.15, o, -2, para, 3); ruban(i, l, o2, 1.15, o2, -2, para, 3); ruban(i, l, o, 1.15, o2, 1.15, para, 3); });
      const glissiere = (a, b, sd) => tranche(a, b, (i, l) => ruban(i, l, s => sd * (s.w + 0.4), 1.05, s => sd * (s.w + 0.4), 0.25, glis, 4));
      const iP0 = Math.min(...pontI) - 12, iP1 = Math.max(...pontI) + 12, iM0 = T1 - 2, iM1 = Math.max(...murI) + 10, iV0 = P(K.entreeVille) - 6, iV1 = P(K.sortieVille) + 6; // pont, mur, cité (de iV0 à iV1 en passant par la ligne)
      const enVille = i => ((i - iV0 + N) % N) <= ((iV1 - iV0 + N) % N), surPont = i => i >= iP0 && i <= iP1, surMur = i => i >= iM0 && i <= iM1, enTunnel = i => i >= T0 - 2 && i <= T1 + 2;
      for (const sd of [-1, 1]) { parapet(iP0, iP1, sd); glissiere(iP1, T0 + 2, sd); glissiere(iM1, iV0, sd); glissiere(iV1, iH0 - 3, sd); glissiere(iH1 + 3, iP0, sd); }
      parapet(iM0, iM1, -1); // la crête côté lac
      { const gc = mat('gardeCorps', { alphaTest: 0.5, side: THREE.DoubleSide }); tranche(iM0, iM1, (i, l) => { const o = s => s.w + 0.3, o2 = s => s.w + 0.9; ruban(i, l, o, 0.4, o, -2, para, 3); ruban(i, l, o2, 0.4, o2, -2, para, 3); ruban(i, l, o, 0.4, o2, 0.4, para, 3); ruban(i, l, s => s.w + 0.6, 1.25, s => s.w + 0.6, 0.4, gc, 2); }); } // côté vide : une bordure et un garde-corps à barreaux, on voit la vallée
      tranche(iV0, iV1, (i, l) => { for (const sd of [-1, 1]) { ruban(i, l, s => sd * (s.w + 0.2), 0.2, s => sd * (s.w + 3.6), 0.2, betC, 4); ruban(i, l, s => sd * (s.w + 0.2), 0.2, s => sd * (s.w + 0.2), -0.5, betC, 4); } }); // trottoirs de la cité
      { const ca = []; for (let i = 0; i < N; i += 6) { if (enVille(i) || surPont(i) || enTunnel(i) || (i > iH0 - 4 && i < iH1 + 4)) continue; const cr = surMur(i); for (const sd of [-1, 1]) { const [x, z] = bord(S[i], sd, S[i].w + (cr ? 0.28 : 0.3)); ca.push([x, S[i].y + (cr ? (sd < 0 ? 0.9 : 0.3) : 1.05), z]); } } // V-05 : sur la crête aussi, au flanc des parapets : ils renvoient les phares dans le brouillard
        inst(h, h.geo('catadioptre'), h.mat('catadioptre', { lum: 1, retro: 2.5 }), ca); }

      // ---------- le pont du pied du mur : tablier et piles de béton, lampadaires ----------
      tranche(iP0 + 6, iP1 - 6, (i, l) => { ruban(i, l, s => -(s.w + 1.2), -0.15, s => s.w + 1.2, -0.15, betS, 8); ruban(i, l, s => -(s.w + 1.2), -2.4, s => s.w + 1.2, -2.4, betS, 8); for (const sd of [-1, 1]) ruban(i, l, s => sd * (s.w + 1.2), -0.15, s => sd * (s.w + 1.2), -2.4, betS, 8); });
      for (let i = iP0 + 18; i < iP1 - 12; i += 22) { const s = S[i], m = h.pose('boite', betS, h.scene, [s.x, (s.y - 2.4 + 2) / 2, s.z], 2 * W + 1, s.y - 2.4 - 2, 2.6); m.rotation.y = h.across(s); }
      for (const i of [iP0 + 14, iP0 + 22, iP0 + 30, iP0 + 38]) { const s = S[i], [x, z] = bord(s, 1, s.w + 4); panache(x, s.y + 1.4, z, [0.93, 0.96, 0.97], 0.14, 3, 1.6, 3, 0.8, 2.5, 6.5); } // V-53 : des paquets d'embruns traversent le pont, de l'amont vers l'aval
      const lampes = [], clair = []; // lampadaires, posés après la cité (aucun dans un mur) ; clairières de la forêt [x, z, rayon]
      // lampadaires de sodium : le pont, la crête, la rue de la cité et ses abords
      { const lp = lampes; const pose1 = (i, sd, o = 1.6) => { const s = S[(i + N) % N], [x, z] = bord(s, sd, s.w + o); lp.push([x, s.y, z, h.across(s) + (sd > 0 ? Math.PI : 0)]); };
        for (let i = iP0 + 4, k = 0; i < iP1; i += 14, k++) pose1(i, k & 1 ? 1 : -1, 1.2);
        for (let i = iM0 + 6, k = 0; i < iM1 + 30; i += 14, k++) pose1(i, k & 1 ? 1 : -1, 1.2);
        for (let i = iV0 - 60, k = 0; ((i - iV0 + 60 + N) % N) < ((iV1 + 80 - iV0 + 60 + N) % N); i = (i + 14) % N, k++) pose1(i, k & 1 ? 1 : -1, 3.9);
        }

      // ---------- le tunnel de la culée ouest : la chape de roche sous l'éperon (ses deux têtes de bunker sont plus bas) ----------
      const roche = mat('rocheGES', { ...DS, rep: [2, 1] });
      { const P3 = [], UV = [], I = [], LAT = []; for (let o = -44; o <= 44; o += 4) LAT.push(o); let rg = 0; // le rocher au-dessus du tunnel : un maillage fin (4 m) qui part du haut de chaque tête de bunker, monte à 45° et rejoint le relief ; ses bords tombent sur le terrain
        for (let i = T0; i <= T1; i += 2, rg++) { const s = S[i], ax = Math.min(i - T0, T1 - i) * 2; LAT.forEach((o, k) => { const [x, z] = bord(s, 1, o), d = Math.abs(o), bordM = k === 0 || k === LAT.length - 1 || i === T0 || i >= T1 - 1;
            const y = Math.min(Math.max(site(x, z), s.y + 13), s.y + 13 + ax + Math.max(0, d - s.w - 16) * 1.1) + (bordM ? 0 : 1.6 * Math.sin(x * 0.9 + z * 0.37) * Math.sin(z * 0.7 - x * 0.21)); P3.push(x, y, z); UV.push((x + y) / 10, (z + y) / 10);
            if (rg && k) { const c = rg * LAT.length + k; I.push(c - LAT.length - 1, c - 1, c - LAT.length, c - LAT.length, c - 1, c); } }); }
        const m = maille(P3, UV, I, mat('rocheGES', DS)); m.castShadow = true; }


      // ---------- la crête : deux portiques roulants au-dessus de la route, la tour de contrôle sur le belvédère de la culée est ----------
      insts(h, 'portiqueVanne', { acier: mat('toleOrange', {}, '#e8a01e'), roue: gris, treuil: mat('peinture', { c: 0x6d726d }), cabine: mat('peinture', { c: 0xe8e4d8 }), vitre: mat('vitreSombre') }, [-65, 120].map(x => { const s = S[near(h, x, CZ - Math.sqrt(RA * RA - x * x))]; return [s.x, s.y, s.z, h.across(s)]; }), { a: [W] });
      { const s = S[P(K.culee) + 6], [x, z] = bord(s, -1, s.w + 14); h.pose('tourControle', { beton: bet, vitre: mat('vitreSombre'), acier: gris }, h.scene, [x, hAt(x, z) - 1.5, z]); }

      // ---------- le poste de transformation, sur la terrasse entre l'usine et la cité : transformateurs, portiques, disjoncteurs, clôture, bâtiment de commande ----------
      const YP = terrasse(510) + 0.05, isol = mat('peinture', { c: 0xd8e0c8 }), treil = mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide }, '#a8aea6'), barres = [];
      bloc(mat('bruit', {}, '#8a8a82', ['#9a9a90', '#76766e', '#a8a49a']), 196, 302, 420, 612, YP - 3, YP);
      insts(h, 'transfo', { socle: betS, cuve: mat('peinture', { c: 0x7a8a80 }), ailette: mat('peinture', { c: 0x4a5a50 }), isol, plaque: mat('danger') }, [214, 249, 284].map(x => [x, YP, 434, 0, 1.3]));
      { const gant = [], disj = [];
        for (const z of [470, 520, 570]) for (const x of [214, 249, 284]) { gant.push([x, YP, z, 0]); for (const dx of [-7, 0, 7]) if (x < 280) barres.push(x + dx, YP + 17.8, z, x + dx + 35, YP + 17.8, z); }
        for (const z of [495, 545]) for (const x of [214, 249, 284]) { disj.push([x, YP, z, Math.PI / 2]); for (const dx of [-7, 0, 7]) barres.push(x + dx, YP + 17.8, z - 25, x + dx, YP + 6.6, z); }
        insts(h, 'portiquePoste', { treillis: treil, isol }, gant); insts(h, 'disjoncteur', { chassis: gris, isol }, disj);
        const c = [], add = (x0, z0, x1, z1) => { const l = Math.hypot(x1 - x0, z1 - z0); c.push([(x0 + x1) / 2, YP + 1.3, (z0 + z1) / 2, -Math.atan2(z1 - z0, x1 - x0), l, 2.6, 0.1]); };
        add(197, 421, 197, 611); add(197, 611, 301, 611); add(301, 611, 301, 421); add(197, 421, 301, 421); inst(h, h.geo('bloc'), mat('betonPO2', DS), c);
        bloc(mat('panneauK', {}, '#b8b4a4'), 272, 298, 588, 606, YP, YP + 8); bloc(betS, 271, 299, 587, 607, YP + 8, YP + 8.6);
        for (const [x, z] of [[201, 426], [297, 426], [201, 606]]) { bloc(gris, x - 0.2, x + 0.2, z - 0.2, z + 0.2, YP, YP + 18); bloc(mat('lampe', LUMI), x - 0.9, x + 0.9, z - 0.3, z + 0.3, YP + 18, YP + 18.8); } } // trois mâts de projecteurs, allumés
      // ---------- la cité ouvrière, traversée par la route : des barres grises de cinq étages alignées sur les rues (un rang de chaque côté, posé sur un sol pavé), un second rang derrière, des tours de neuf étages,
      //            des enseignes de rez-de-chaussée, des cours avec leurs aires de jeu, des kiosques, des voitures le long des trottoirs, les conduites de chauffage en portique ----------
      const YV = 16, peints = [], bl = (x, y, z, r, a, b, c, col) => peints.push([x, y, z, r, a, b, c, col]); // petits volumes peints, posés ensemble à la fin (une seule passe de dessin)
      const cite = (x, z) => x > 100 && x < 492 && z > 690 && z < 1150, poste = (x, z) => x > 188 && x < 310 && z > 412 && z < 620, usine = (x, z) => x > -165 && x < 205 && z > 0 && z < 250;
      // l'emprise de chaque construction : [x, z, rotation, demi-longueur, demi-profondeur] ; rien ne se pose sur une emprise prise, ni trop près de la chaussée
      // GB : chaque emprise rangée dans les cases de 32 m qu'elle touche, marge de dansBati comprise (m ≤ 7 : une emprise couvre au plus hl + hp + 14 m autour de son centre) ; dansBati ne lit que la case du point
      const GB = new Map(), bati = (...L) => { for (const e of L) { batis.push(e); const [x, z, , hl, hp] = e, R = hl + hp + 14; for (let a = Math.floor((x - R) / 32); a <= Math.floor((x + R) / 32); a++) for (let c = Math.floor((z - R) / 32); c <= Math.floor((z + R) / 32); c++) { const k = a * 65536 + c; (GB.get(k) || GB.set(k, []).get(k)).push(e); } } };
      const batis = [], dansBati = (px, pz, m = 4) => (GB.get(Math.floor(px / 32) * 65536 + Math.floor(pz / 32)) || []).some(([x, z, r, hl, hp]) => { const dx = px - x, dz = pz - z, c = Math.cos(r), s = Math.sin(r), u = dx * c - dz * s, v = dx * s + dz * c; return Math.abs(u) < hl + m && Math.abs(v) < hp + m; });
      const place = (x, z, r, hl, hp, marge = 5.5) => { const c = Math.cos(r), s = Math.sin(r); for (const u of [-1, -0.5, 0, 0.5, 1]) for (const v of [-1, 0, 1]) { const px = x + c * u * hl + s * v * hp, pz = z - s * u * hl + c * v * hp, p = proche(px, pz);
        if (p.d < p.s.w + marge || dansBati(px, pz) || riv(px, pz) < 10 || px < pl(XW, pz) + 8 || px > pl(XE, pz) - 8) return false; } bati([x, z, r, hl, hp]); return true; };
      // ce qui est fixe d'abord : la chaufferie et sa cheminée, le château d'eau, les garages, les jardins ouvriers
      let fontaine, kiosque, parterre, avion, ecole, jardin, boxes; const bosq = []; // les objets de la cité, repris pour combler les vides ; bouleaux des bosquets (posés avec la forêt)
      { bati([392, 1052, 0, 14, 12], [118, 1066, 0, 6, 6], [240, 1128, 0, 32, 5]);
        bloc(mat('brique'), 380, 404, 1042, 1062, YV - 2, YV + 9); bloc(betS, 379, 405, 1041, 1063, YV + 9, YV + 9.6); bloc(mat('brique'), 406, 410, 1050, 1054, YV - 2, YV + 40); bloc(betS, 405.6, 410.4, 1049.6, 1054.4, YV + 40, YV + 41); panache(408, YV + 42, 1052, [0.6, 0.6, 0.63], 0.34, 10, 5, 5, 3.4, 0.7); // V-32 : la fumée de la chaufferie
        h.pose('chateauEau', { fer: gris, cuve: mat('peinture', { c: 0x7a8a86 }) }, h.scene, [118, YV, 1066]);
        { const gar = []; for (let k = 0; k < 14; k++) gar.push([212 + k * 4.2, YV + 1.3, 1128, 0, 4, 2.8, 6]); inst(h, h.geo('bloc'), mat('toleOrange', {}, '#6e7a7a'), gar); }
        }
      // le sol des rues : un parvis de dalles de chaque côté de la chaussée, du trottoir au pied des immeubles
      { const dalle = mat('bruit', DS, '#7a7c7c', ['#868888', '#6c6e6e', '#8e8c86']); tranche(iV0, iV1, (i, l) => { for (const sd of [-1, 1]) ruban(i, l, s => sd * (s.w + 3.6), 0.06, s => sd * (s.w + 20), 0.06, dalle, 6); }); }
      const rang1 = [], rang2 = [], tours = [];
      { // un lieu = une emprise prise au bord de la rue, près de l'échantillon i0 (côté préféré sd0), dessinée dans son repère : u le long de la rue, v vers la chaussée
        const lieu = (i0, sd0, hl, hp, f, off = 6.4, DI = [0, 8, -8, 16, -16, 24, -24, 32, -32]) => { for (const di of DI) for (const sd of [sd0, -sd0]) { const s = S[(i0 + di + N) % N], [x, z] = bord(s, sd, s.w + off + hp), r = h.across(s) + Math.PI / 2 + (sd > 0 ? Math.PI : 0); if (!place(x, z, r, hl, hp)) continue;
          const c = Math.cos(r), sn = Math.sin(r), Y = Math.max(s.y, hAt(x, z)) + 0.05, B = (u, y, v, a, b, d, col, dr = 0) => bl(x + c * u + sn * v, Y + y, z - sn * u + c * v, r + dr, a, b, d, col);
          const mot = (t, fond, u, y, v, w, ht) => { const m = new THREE.Mesh(h.geo('boite', w, ht, 0.2), mat('lettres', {}, t, fond, '#f0e8d0')); m.position.set(x + c * u + sn * v, Y + y, z - sn * u + c * v); m.rotation.y = r; h.scene.add(m); };
          f(B, mot, { x, z, r, Y, c, sn }); return true; } };
        const iF = k => (iV0 + k + N) % N; // k échantillons après l'entrée de la cité
        // le cinéma : portique de six colonnes blanches, fronton, enseigne rouge, affiches
        lieu(iF(40), 1, 13, 8, (B, mot) => { B(0, 0.03, 0, 30, 0.06, 18, 0x8e8c86); B(0, 4.5, -1.5, 26, 9, 12, 0xd8d0b8); B(0, 9.3, -1.5, 27, 0.6, 13, 0x6d726d); for (let k = 0; k < 6; k++) B(-10 + k * 4, 4, 5.6, 0.9, 8, 0.9, 0xf0ece0);
          B(0, 8.7, 5.4, 24, 1.4, 2.4, 0xf0ece0); B(0, 0.25, 7, 24, 0.5, 2.6, 0x9a9890); mot('КИНО', '#b5241c', 0, 10.6, 5.4, 10, 2.4); [0xc8281e, 0x2a6aa8, 0xd0a020].forEach((col, k) => B(-6 + k * 6, 3.4, 4.56, 3, 4, 0.12, col)); });
        // le marché : deux rangs d'étals sous des auvents de couleur, cageots, portique d'entrée
        lieu(iF(100), -1, 11, 7, (B, mot) => { B(0, 0.03, 0, 24, 0.06, 15, 0x9a8f78); for (let k = 0; k < 10; k++) { const u = -8 + (k % 5) * 4, v = k < 5 ? -3 : 2.4, col = [0xc8281e, 0xe8e4d8, 0x2a6aa8, 0xd0a020, 0x3a8a4a][(k + (k > 4)) % 5];
            B(u, 0.5, v, 3, 1, 1.4, 0x7a5a3a); B(u, 2.7, v, 3.6, 0.14, 2.6, col); for (const du of [-1.6, 1.6]) B(u + du, 1.35, v - 1.1, 0.12, 2.7, 0.12, 0x55585a); B(u - 0.7, 1.15, v, 1, 0.3, 0.9, [0xd86a1e, 0x4a8a3a, 0xc8281e][k % 3]); B(u + 0.7, 1.15, v, 1, 0.3, 0.9, [0xe8c83a, 0xc8281e, 0x8a5a3a][k % 3]); }
          for (const du of [-4.4, 4.4]) B(du, 2, 6.6, 0.3, 4, 0.3, 0x55585a); mot('РЫНОК', '#3a6a5a', 0, 4.6, 6.6, 9.4, 1.6); });
        // l'avion sur son pylône : un chasseur à ailes en flèche, de profil vers la rue
        avion = (B) => { B(0, 0.4, 0, 14, 0.8, 9, 0x8d918a); B(-1, 3.4, 0, 1.2, 5.4, 1.6, 0xb8bbb4); B(0, 7, 0, 11, 1.4, 1.4, 0xc8ccd0); B(5.7, 7, 0, 0.4, 1.2, 1.2, 0xb5241c); B(2.2, 7.9, 0, 1.8, 0.6, 0.8, 0x3a5a7a);
          for (const e of [-1, 1]) { B(-0.8, 6.9, e * 3.2, 2.4, 0.16, 5.6, 0xc8ccd0, e * 0.5); B(-4.9, 8.6, e * 1.5, 1.2, 0.12, 2.8, 0xc8ccd0, e * 0.4); } B(-4.6, 8.5, 0, 2.2, 2.4, 0.16, 0xc8ccd0); B(-4.9, 9.3, 0, 1.2, 0.8, 0.2, 0xb5241c);
          for (const e of [-1, 1]) B(e * 5.5, 0.95, 4, 2.4, 0.3, 0.8, 0xc8281e); };
        // la grande roue du parc : 22 m, nacelles de couleur, guérite
        lieu(iF(220), -1, 12, 5, (B, mot, o) => { const g = new THREE.Group(); g.position.set(o.x, o.Y, o.z); g.rotation.y = o.r; h.scene.add(g); const jaune = mat('peinture', { c: 0xd8b820 }), fer = mat('peinture', { c: 0x3a5a7a });
          const ro = new THREE.Group(); ro.position.set(0, 12.6, 0); ro.userData.dyn = 1; g.add(ro); ro.add(new THREE.Mesh(new THREE.TorusGeometry(10, 0.22, 5, 28), jaune)); for (let k = 0; k < 6; k++) h.pose('boite', jaune, ro, [0, 0, 0], 20, 0.16, 0.16).rotation.z = k * Math.PI / 6; soude(h, ro); // V-31 : la roue tourne (un tour en 40 s), les nacelles restent d'aplomb
          for (const e of [-1, 1]) for (const f of [-1, 1]) { const p = h.pose('boite', fer, g, [e * 2.4, 6.3, f * 1.1], 0.4, 13.6, 0.4); p.rotation.z = e * 0.37; } h.pose('boite', fer, g, [0, 12.6, 0], 1, 1, 2.6);
          { const nac = Array.from({ length: 12 }, (_, k) => mb(mob(), 0, 0, 0, 0, 1.5, 1.5, 1.3, [0xc8281e, 0x2a6aa8, 0xe8e4d8, 0x3a8a4a][k % 4])); let A = 0;
            TICK.push(dt => { A += dt * Math.PI / 20; ro.rotation.z = A; nac.forEach((q, k) => { const a = k * Math.PI / 6 + 0.26 + A, u = Math.cos(a) * 10; mobA(q, o.x + o.c * u, o.Y + 12.6 + Math.sin(a) * 10 - 0.9, o.z - o.sn * u, o.r); }); }); }
          B(8, 1.3, 3.4, 2.4, 2.6, 2.4, 0xd8d0b8); B(8, 2.75, 3.4, 3, 0.3, 3, 0xc8281e); B(0, 0.03, 0, 26, 0.06, 11, 0x8a8468); });
        // la statue sur sa place : socle de granit rouge, bronze le bras levé, parterres, trois drapeaux
        lieu(iF(280), -1, 18, 15, (B, mot, o) => { const br = 0xc4c8c4; B(0, 0.03, 0, 38, 0.06, 31, 0xa8a49a); B(0, 0.25, -3, 16, 0.5, 14, 0x8d918a); B(0, 0.7, -3, 11, 0.5, 10, 0x8d918a); B(0, 3.6, -3, 5.4, 5.4, 4.6, 0x7a3a34); B(0, 6.5, -3, 6, 0.5, 5.2, 0x5a2a26); mot('ЛЕНИН', '#7a3a34', 0, 4, -0.62, 4.4, 1.3);
          for (const e of [-1, 1]) B(e * 0.6, 8.6, -3, 0.9, 3.8, 1.1, br); B(0, 12, -3, 2.6, 3.6, 1.7, br); B(0, 11, -3.2, 3, 3.2, 1.3, br); B(0, 14.5, -3, 1.2, 1.3, 1.2, br); B(-1.5, 11.6, -3, 0.6, 2.6, 0.7, br); B(1.6, 13.2, -1.6, 0.6, 0.6, 3.4, br); // jambes, buste, pan du manteau, tête, bras gauche le long du corps, bras droit tendu vers la rue
          for (const e of [-1, 1]) { B(e * 12, 0.3, 6, 8, 0.6, 3, 0xb5241c); B(e * 12, 0.3, -9, 8, 0.6, 3, 0xb5241c); B(e * 9, 0.45, 12, 2.4, 0.1, 0.5, 0x6a4a2a); B(e * 9, 0.22, 12, 2.2, 0.44, 0.12, 0x55585a); }
          for (let k = -2; k <= 2; k++) { B(k * 4, 6, -12.5, 0.2, 12, 0.2, 0x8a8e88); drapeau(o.x + o.c * k * 4 - o.sn * 12.5, o.Y + 10.9, o.z - o.sn * k * 4 - o.c * 12.5, 2.6, 1.7); } }, 8);
        // la patinoire de la cour : bande blanche à liseré bleu, deux cages
        lieu(iF(385), -1, 14, 8, (B) => { B(0, 0.05, 0, 27, 0.1, 15, 0xdce4e8); for (const e of [-1, 1]) { B(0, 0.6, e * 7.5, 27, 1.2, 0.2, 0xf0f0ec); B(0, 1.25, e * 7.5, 27, 0.14, 0.24, 0x2a6aa8); B(e * 13.5, 0.6, 0, 0.2, 1.2, 15, 0xf0f0ec); B(e * 13.5, 1.25, 0, 0.24, 0.14, 15, 0x2a6aa8);
            B(e * 11, 0.6, 0, 0.1, 1.2, 1.8, 0xc8281e); B(e * 11.5, 1.2, 0, 1, 0.08, 1.8, 0xc8281e); B(e * 12.6, 4, 7.9, 0.2, 8, 0.2, 0x55585a); } B(0, 0.11, 0, 0.3, 0.02, 15, 0xc8281e); });
        // la station-service de la sortie : auvent blanc à bande rouge, trois pompes, guérite, camion-citerne
        lieu(iF(450), 1, 9, 6, (B, mot) => { B(0, 0.03, 0, 20, 0.06, 13, 0x6c6e6e); B(0, 4.6, 1, 15, 0.5, 7, 0xf0f0ec); B(0, 4.6, 4.52, 15, 0.52, 0.06, 0xc8281e); for (const e of [-1, 1]) B(e * 6, 2.2, 1, 0.5, 4.4, 0.5, 0xb8bbb4);
          for (let k = -1; k <= 1; k++) { B(k * 3, 0.9, 1, 0.8, 1.8, 0.6, k ? 0xc8281e : 0xd8b820); B(k * 3, 0.15, 1, 1.6, 0.3, 1.2, 0x8d918a); } B(0, 1.6, -3.6, 7, 3.2, 3, 0xd8d0b8); B(0, 3.35, -3.6, 7.6, 0.3, 3.6, 0x6d726d); mot('БЕНЗИН', '#2a4a6a', 0, 5.5, 4.4, 8, 1.3);
          B(-5.5, 1.9, 4.4, 5, 1.8, 2, 0xd86a1e); B(-1.9, 1.5, 4.4, 2, 2, 2.2, 0x3a6a9a); B(-4.4, 0.55, 4.4, 7.4, 0.7, 2.2, 0x1e2020); });
        // l'intérieur des virages de la rue, que les barres laissent en pelouse : fontaine, avion, kiosque à musique, parterre en étoile, à tour de rôle
        fontaine = B => { for (const dr of [0, Math.PI / 4]) { B(0, 0.4, 0, 9, 0.8, 9, 0xb8bbb4, dr); B(0, 0.76, 0, 7.8, 0.1, 7.8, 0x6aa8c0, dr); } B(0, 1.6, 0, 1.1, 2.4, 1.1, 0x8d918a); B(0, 3.3, 0, 2.4, 0.3, 2.4, 0x8d918a); B(0, 4.4, 0, 0.5, 2, 0.5, 0xe8f4f8); for (const e of [-1, 1]) { B(e * 6.6, 0.45, 0, 0.5, 0.1, 2.2, 0x6a4a2a); B(0, 0.45, e * 6.6, 2.2, 0.1, 0.5, 0x6a4a2a); } };
        kiosque = B => { for (const dr of [0, Math.PI / 4]) { B(0, 0.4, 0, 7, 0.8, 7, 0xe8e4d8, dr); B(0, 4.2, 0, 7.8, 0.3, 7.8, 0x3a6a5a, dr); B(0, 4.7, 0, 4.6, 0.7, 4.6, 0x3a6a5a, dr); } B(0, 5.6, 0, 1.4, 1.2, 1.4, 0x3a6a5a); for (const e of [-1, 1]) for (const f of [-1, 1]) B(e * 3, 2.5, f * 3, 0.25, 3.4, 0.25, 0xf0f0ec); for (const e of [-1, 1]) B(e * 3, 1.3, 0, 0.12, 0.9, 6, 0xf0f0ec); };
        parterre = B => { for (let k = 0; k < 3; k++) B(0, 0.25, 0, 12, 0.5, 2.6, 0xb5241c, k * Math.PI / 3); B(0, 0.4, 0, 3, 0.8, 3, 0xd8b820, 0.4); B(0, 4.5, 0, 0.3, 9, 0.3, 0x8a8e88); B(1.4, 7.9, 0, 2.6, 1.8, 0.06, 0xb5241c); };
        { const L = [fontaine, avion, kiosque, parterre]; let n = 0, der = -99; for (let q = 4; q < ((iV1 - iV0 + N) % N) - 4; q++) { const i = iF(q), k = Math.abs(S[i].k); if (k < 0.008 || q - der < 36 || k < Math.abs(S[iF(q + 1)].k)) continue; const ok = lieu(i, S[i].k > 0 ? 1 : -1, 5, 5, L[n % 4], 6.5, [0, 6, -6, 12, -12, 18, -18]); if (ok) { n++; der = q; } } } }
      { // premier rang : le long de chaque rue, façade vers la chaussée, à 6 m du trottoir
        for (let i = iV0 + 4, n = 0; n < ((iV1 - iV0 + N) % N) - 8; i = (i + 4) % N, n += 4) { const s = S[i]; for (const sd of [-1, 1]) for (const hl of [30, 15]) { const [x, z] = bord(s, sd, s.w + 3.6 + 2.2 + 6), r = h.across(s) + Math.PI / 2 + (sd > 0 ? Math.PI : 0);
          if (place(x, z, r, hl, 6)) { rang1.push([x, s.y - 0.4, z, r, hl, sd, i]); break; } } }
        // second rang et tours : sur une trame, derrière le premier rang
        rang1.slice().forEach(([x, y, z, r, hl], q) => { for (const d of [36, 72]) { const x2 = x - Math.sin(r) * d, z2 = z - Math.cos(r) * d, tour = d > 40 && q % 4 === 0; if (cite(x2, z2) && place(x2, z2, r, tour ? 15 : hl, 6, 14)) (tour ? tours : rang2).push([x2, Math.max(YV, hAt(x2, z2)) - 0.4, z2, r, tour ? 15 : hl]); else break; } });
        // dans les cours, entre les rangs : l'école (trois étages en H, terrain de sport), les jardins d'enfants (deux étages, vérandas de couleur), des boxes de garages
        { ecole = (x, z, Y) => { const B = (u, y, v, a, b, c, col) => bl(x + u, Y + y, z + v, 0, a, b, c, col); B(0, 5, 0, 40, 10, 10, 0xc8b8a0); B(0, 10.2, 0, 41, 0.4, 11, 0x6d726d); for (const e of [-1, 1]) { B(e * 17, 5, 9, 10, 10, 10, 0xc8b8a0); B(e * 17, 10.2, 9, 11, 0.4, 11, 0x6d726d); } for (let k = -4; k <= 4; k++) for (const f of [2.4, 5.6, 8.4]) B(k * 4, f, 5.06, 2.6, 1.6, 0.1, 0x3a4a54); B(0, 2, 5.6, 6, 4, 1.2, 0xe8e4d8); B(0, 4.4, 5.6, 7, 0.5, 2, 0xb5241c);
              B(0, 0.04, 26, 36, 0.08, 20, 0x9a6a4a); B(0, 0.06, 26, 28, 0.08, 12, 0x4a7a3a); for (const e of [-1, 1]) { B(e * 13, 1.2, 26, 0.2, 2.4, 6, 0xf0f0ec); B(e * 13, 2.4, 26, 1.6, 0.2, 6, 0xf0f0ec); } },
            jardin = (x, z, Y) => { const B = (u, y, v, a, b, c, col) => bl(x + u, Y + y, z + v, 0, a, b, c, col); B(0, 3.4, 0, 26, 6.8, 9, 0xe0d8c0); B(0, 7, 0, 27, 0.4, 10, 0x8a5a4a); [0xd8b820, 0x2a6aa8, 0xc8281e, 0x3a8a4a].forEach((col, k) => { B(-9 + k * 6, 1.5, 6, 4.6, 3, 3, col); B(-9 + k * 6, 3.1, 6, 5, 0.3, 3.4, 0xf0f0ec); }); for (let k = -3; k <= 3; k++) B(k * 3.6, 4.8, 4.56, 2.2, 1.6, 0.1, 0x3a4a54); B(0, 0.5, 11, 28, 1, 0.2, 0x3a8a4a); },
            boxes = (x, z, Y) => { for (let k = -6; k <= 6; k++) for (const e of [-1, 1]) bl(x + k * 3.6, Y + 1.3, z + e * 4.5, 0, 3.4, 2.6, 6, k & 1 ? 0x6e7a7a : 0x7a6a5a); bl(x, Y + 0.03, z, 0, 50, 0.06, 4, 0x55585a); };
          const L = [[ecole, 22, 22], [jardin, 14, 8], [boxes, 25, 8], [jardin, 14, 8]]; let n = 0; for (let z = 716; z < 1130 && n < 7; z += 26) for (let x = 126; x < 480 && n < 7; x += 26) { const [f, hl, hp] = L[n % 4]; if (place(x, z, 0, hl, hp, 26)) { f(x, z, hAt(x, z) + 0.05); n++; } } }
        const pk = [mat('panneauK', {}, '#9c9c96'), mat('panneauK', {}, '#8c9092'), mat('panneauK', {}, '#a8a498')], tous = [...rang1, ...rang2]; { const lk = mat('panneauKlum').map; for (const m of pk) { m.emissiveMap = lk; m.emissive.setHex(0xffffff); m.emissiveIntensity = 0.9; } TICK.push((dt, car) => { if (!car) return; const k = Math.max(0.25, 0.9 - 0.3 * Math.max(0, (car.lap || 1) - 1)); for (const m of pk) m.emissiveIntensity += (k - m.emissiveIntensity) * Math.min(1, dt); }); } // V-39 : elles s'éteignent d'un tour à l'autre, le jour se lève // une fenêtre sur trois est allumée
        for (const hl of [30, 15]) pk.forEach((m, j) => { const l = tous.filter((b, q) => b[4] === hl && q % 3 === j).map(b => b.slice(0, 4)); if (l.length) insts(h, 'barre', { facade: m, toit: betS, auvent: betS }, l, { a: [hl * 2] }); });
        insts(h, 'barre', { facade: pk[1], toit: betS, auvent: betS }, tours.map(b => b.slice(0, 4)), { a: [30, 27] });
        inst(h, h.geo('bloc'), betS, [...tous, ...tours].map(b => [b[0], b[1] - 1.6, b[2], b[3], b[4] * 2 + 1, 3.4, 13])); // les soubassements : aucun immeuble ne montre son dessous
        // les enseignes de rez-de-chaussée d'un immeuble sur deux du premier rang, face à la rue
        const MOTS = ['ПРОДУКТЫ', 'ХЛЕБ', 'АПТЕКА', 'ПОЧТА', 'КНИГИ', 'МОЛОКО', 'ОБУВЬ', 'ГАСТРОНОМ'], FONDS = ['#3a5a7a', '#7a3a34', '#3a6a5a'];
        rang1.forEach((b, q) => { if (q % 2) return; const [x, y, z, r] = b, m = new THREE.Mesh(h.geo('boite', 18, 1.5, 0.2), mat('lettres', {}, MOTS[(q >> 1) % MOTS.length], FONDS[(q >> 1) % MOTS.length % 3], '#f0e8d0')); m.position.set(x + Math.sin(r) * 6.15, y + 3.9, z + Math.cos(r) * 6.15); m.rotation.y = r; h.scene.add(m); });
        // la seule fresque : le pignon de l'immeuble le plus proche de la ligne de départ, à droite, tourné vers les voitures qui arrivent
        { const s0 = S[30], cible = bord(s0, 1, s0.w + 12); let b = null, bd = 1e9; for (const q of rang1) { const d = Math.hypot(q[0] - cible[0], q[2] - cible[1]); if (q[5] > 0 && d < bd) { bd = d; b = q; } }
          if (b) { const [x, y, z, r, hl] = b, ax = Math.cos(r), az = -Math.sin(r), e = az > 0 ? 1 : -1, m = new THREE.Mesh(h.geo('boite', 11.4, 14.2, 0.2), mat('fresque')); m.position.set(x + ax * e * (hl + 0.15), y + 7.7, z + az * e * (hl + 0.15)); m.rotation.y = r + Math.PI / 2 + (e > 0 ? 0 : Math.PI); h.scene.add(m); } }
        // des voitures garées sur le parvis, le long du trottoir ; des kiosques à journaux bleus aux coins
        const vo = []; let nm = 0; for (let i = iV0 + 6, n = 0; n < ((iV1 - iV0 + N) % N) - 12; i = (i + 7) % N, n += 7) { const u = rnd(), s = S[i], sd = (rnd(), -1), [x, z] = bord(s, sd, s.w + 4.8), y = s.y + 0.07, r = h.across(s); if (u < 0.3 || dansBati(x, z, 0.4) || Math.abs(hAt(x, z) - s.y + 0.6) > 0.7) continue;
          if (u >= 0.6) { vo.push([x, y, z, r + Math.PI / 2, 1.2, 1.2, 1.2, [0xb5483c, 0x3d6e8a, 0xe8e4d8, 0x8a9488, 0xc8b47a, 0x4a4d50][vo.length % 6]]); continue; }
          const t = nm++ % 4; // le mobilier du trottoir : banc et corbeille, tableau d'honneur rouge, colonne d'affiches, cabine téléphonique
          if (t === 0) { bl(x, y + 0.45, z, r + Math.PI / 2, 2.2, 0.1, 0.5, 0x6a4a2a); bl(x, y + 0.85, z, r + Math.PI / 2, 2.2, 0.5, 0.08, 0x6a4a2a); bl(x, y + 0.22, z, r + Math.PI / 2, 2, 0.44, 0.12, 0x55585a); bl(x + s.tx * 1.8, y + 0.4, z + s.tz * 1.8, r, 0.5, 0.8, 0.5, 0x3a5a3a); }
          else if (t === 1) { bl(x, y + 2, z, r + Math.PI / 2, 5, 2.2, 0.16, 0xb5241c); bl(x, y + 3.25, z, r + Math.PI / 2, 5.3, 0.3, 0.3, 0xd0a020); for (const e of [-2.2, 2.2]) bl(x + s.tx * e, y + 0.5, z + s.tz * e, r, 0.2, 1, 0.2, 0x55585a); for (let k = -1; k <= 1; k++) bl(x + s.tx * k * 1.5, y + 2, z + s.tz * k * 1.5, r + Math.PI / 2, 1, 1.3, 0.2, 0xe8e0c8); }
          else if (t === 2) { bl(x, y + 1.6, z, r + 0.4, 1.2, 3.2, 1.2, 0xc8b47a); bl(x, y + 3.3, z, r + 0.4, 1.5, 0.3, 1.5, 0x4a5a50); bl(x, y + 1.8, z, r + 0.4, 1.24, 1.2, 1.24, [0xc8281e, 0x2a6aa8, 0xe8e4d8][nm % 3]); }
          else { bl(x, y + 1.25, z, r, 1, 2.5, 1, 0xc8281e); bl(x, y + 1.5, z, r, 1.04, 1.2, 1.04, 0xd8e4e8); bl(x, y + 2.6, z, r, 1.1, 0.2, 1.1, 0xf0f0ec); } }
        insts(h, 'berline', { caisse: mat('peinture'), vitre: mat('vitreSombre'), pneu: gris }, vo, { teinte: 'caisse' });
        for (const k of [K.depart + 2, K.depart + 5, K.entreeVille + 3, K.entreeVille + 8, K.rueSud]) { const s = S[P(k)], [x, z] = bord(s, -1, s.w + 4.6), r = h.across(s), y = s.y + 0.06; if (dansBati(x, z, 0.5)) continue; bl(x, y + 1.3, z, r, 2.4, 2.6, 2.4, 0x3a6a9a); bl(x, y + 2.75, z, r, 3, 0.3, 3, 0x2a4a6a); bl(x, y + 1.6, z, r, 2.46, 0.9, 1.6, 0xd8e4e8); } }
      // les aires de jeu, dans les cours derrière le premier rang, là où il reste de la place
      const aire = (x, z, Y) => {
        bl(x - 8, Y + 0.08, z - 6, 0, 4, 0.16, 4, 0xd8c890); for (const [dx, dz, a, c] of [[0, -2, 4.2, 0.2], [0, 2, 4.2, 0.2], [-2, 0, 0.2, 4.2], [2, 0, 0.2, 4.2]]) bl(x - 8 + dx, Y + 0.2, z - 6 + dz, 0, a, 0.4, c, 0xd0a020); // le bac à sable
        for (const dx of [-1.7, 1.7]) bl(x + dx, Y + 1.4, z - 7, 0, 0.16, 2.8, 0.16, 0x2a6aa8); bl(x, Y + 2.8, z - 7, 0, 3.6, 0.16, 0.16, 0x2a6aa8); for (const dx of [-0.7, 0.7]) { bl(x + dx, Y + 0.6, z - 7, 0, 0.5, 0.06, 0.22, 0xc8281e); bl(x + dx, Y + 1.7, z - 7, 0, 0.04, 2.2, 0.04, 0x2a2c2a); } // la balançoire
        bl(x + 8, Y + 1.1, z - 6, 0, 1.2, 2.2, 1.2, 0xc8281e); for (let k = 0; k < 4; k++) bl(x + 8, Y + 1.9 - k * 0.5, z - 4.9 + k * 0.9, 0, 0.8, 0.1, 1, 0xd8d8d0); // le toboggan
        bl(x + 6, Y + 2.6, z + 6, 0, 1.2, 3.6, 1.2, 0xe8e4d8); bl(x + 6, Y + 3, z + 6, 0, 1.26, 0.6, 1.26, 0xc8281e); bl(x + 6, Y + 5, z + 6, 0, 0.7, 1.2, 0.7, 0xc8281e); for (const [dx, dz] of [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]]) bl(x + 6 + dx, Y + 0.6, z + 6 + dz, 0, 0.3, 1.2, 0.3, 0x2a6aa8); // la fusée
        bl(x - 6, Y + 0.45, z + 6, 0.4, 2.6, 0.14, 2.6, 0x3a8a4a); bl(x - 6, Y + 0.5, z + 6, 0, 0.2, 1, 0.2, 0xd0a020); // le tourniquet
        for (const dz of [-11, 11]) { bl(x, Y + 0.45, z + dz, 0, 1.9, 0.1, 0.5, 0x6a4a2a); bl(x, Y + 0.22, z + dz, 0, 1.7, 0.44, 0.12, 0x55585a); } // deux bancs
        for (const dx of [-1.5, 1.5]) bl(x + 13 + dx, Y + 1.1, z + 2, 0, 0.12, 2.2, 0.12, 0x55585a); bl(x + 13, Y + 2.2, z + 2, 0, 3.1, 0.12, 0.12, 0x55585a); // le cadre à battre les tapis
        for (const dz of [-3.5, 3.5]) bl(x - 14, Y + 1.2, z + dz, 0, 0.12, 2.4, 0.12, 0x55585a); bl(x - 14, Y + 2.3, z, 0, 0.04, 0.04, 7, 0x2a2c2a); [0xf0f0e8, 0x9ab8d8, 0xf0f0e8, 0xc86a5a].forEach((c, k) => bl(x - 14, Y + 1.6, z - 2.4 + k * 1.6, 0, 0.05, 1.3, 1.3, c)); // le linge
        bl(x, Y + 0.03, z, 0, 34, 0.06, 26, 0x8a8468); }; // le sol de terre battue de l'aire
      { let n = 0; for (let z = 720; z < 1130 && n < 7; z += 36) for (let x = 130; x < 480 && n < 7; x += 58) if (place(x, z, 0, 17, 13, 16)) { aire(x, z, hAt(x, z) + 0.05); n++; } }
      { const loc = f => (x, z, Y, r) => { const c = Math.cos(r), sn = Math.sin(r); f((u, y, v, a, b, d, col, dr = 0) => bl(x + c * u + sn * v, Y + y, z - sn * u + c * v, r + dr, a, b, d, col)); };
        const bosquet = (x, z, Y) => { for (let k = 0; k < 8; k++) { const a = rnd() * 6.28, d = 2 + rnd() * 8, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d; bosq.push([bx, hAt(bx, bz) - 0.3, bz, rnd() * 6, 0.8 + rnd() * 0.5]); } bl(x, Y + 0.45, z, 0.5, 2.2, 0.1, 0.5, 0x6a4a2a); bl(x, Y + 0.22, z, 0.5, 2, 0.44, 0.12, 0x55585a); };
        const L = [[aire, 17, 13, 0, 8], [bosquet, 9, 9, 0, 99], [loc(fontaine), 7, 7, 1, 2], [jardin, 14, 8, 0, 3], [bosquet, 9, 9, 0, 99], [loc(kiosque), 6, 6, 1, 2], [boxes, 25, 8, 0, 4], [bosquet, 9, 9, 0, 99], [loc(parterre), 7, 7, 1, 3], [ecole, 22, 22, 0, 1], [bosquet, 9, 9, 0, 99]]; let n = 0; // dernier nombre : combien de fois au plus
        for (let q = -10; q < ((iV1 - iV0 + N) % N) + 10; q += 7) for (const sd of [-1, 1]) for (const off of [16, 36, 56, 76]) { const s = S[(iV0 + q + N) % N], [x, z] = bord(s, sd, s.w + off), Y = hAt(x, z) + 0.05; if (Math.abs(Y - s.y) > 14 || poste(x, z) || !(x > 60 && z > 660)) continue;
          for (let k = 0; k < L.length; k++) { const e = L[(n + k) % L.length], [f, hl, hp, tourne] = e, r = tourne ? h.across(s) + Math.PI / 2 + (sd > 0 ? Math.PI : 0) : 0; if (e[4] > 0 && place(x, z, r, hl, hp, 5)) { f(x, z, Y, r); e[4]--; n += k + 1; break; } } } }
      // les conduites de chauffage hors sol, isolées de tôle, qui enjambent les rues en portique
      { // deux tubes jumeaux gainés de tôle, posés sur des plots le long du trottoir de droite sur toute la traversée ; une lyre de dilatation tous les 70 m ; ils ne montent en portique que pour traverser la chaussée, en deux endroits
        const H = [], V = [], plots = [], O = 4.7, Y = [0.75, 1.4], pas = 3, span = ((iV1 - 8 - iV0 - 8 + N) % N), trav = [P(5) + 4, P(K.entreeVille) + 46].map(i => (i + N) % N);
        const seg = (a, b, y) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); H.push([(a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, -Math.atan2(dz, dx), l + 0.15, 1, 1]); }, mont = (q, y0, y1) => V.push([q[0], (y0 + y1) / 2, q[1], 0, 1, y1 - y0, 1]);
        for (let n = 0; n < span; n += pas) { const i = (iV0 + 8 + n) % N, j = (i + pas) % N, a = bord(S[i], 1, S[i].w + O), b = bord(S[j], 1, S[j].w + O), ya = S[i].y, lyre = n % 36 === 18;
          if (lyre) Y.forEach((y, k) => { const ht = 3.4 + k * 0.65; mont(a, ya + y, ya + ht); mont(b, ya + y, ya + ht); seg(a, b, ya + ht); });
          else for (const y of Y) seg(a, b, ya + y);
          if (n % 6 === 0) plots.push([a[0], ya + 0.3, a[1], h.across(S[i]), 0.9, 0.9, 0.5]);
          if (trav.some(t => Math.abs(t - i) < pas / 2 + 0.6)) { const g = bord(S[i], -1, S[i].w + O); Y.forEach((y, k) => { const ht = 7 + k * 0.65; mont(a, ya + y, ya + ht); seg(a, g, ya + ht); mont(g, ya - 0.5, ya + ht); }); plots.push([g[0], ya + 0.3, g[1], h.across(S[i]), 1.6, 0.9, 1.2]); } }
        const tole = mat('toleOrange', {}, '#b6bab4'); inst(h, h.geo('tubeGES'), tole, H); inst(h, h.geo('tubeGESv'), tole, V); inst(h, h.geo('bloc'), betS, plots); }
      bl(206, YV + 1.3, 1118, 0, 3.4, 1.5, 1.6, 0xe8b820); bl(206, YV + 0.4, 1118, 0, 2.4, 0.5, 1.5, 0x2a2c2a); // la citerne de kvas, jaune
      { const s = S[P(K.rueSud) - 4], gr = repere(h, s); h.pose('abriBus', { beton: betC, mosaique: betS, banc: mat('peinture', { c: 0x6d726d }) }, gr, [-(s.w + 5.2), 0, 0]).forEach(m => m.rotation.y = Math.PI / 2); }

      // ---------- les portails du tunnel : deux têtes de bunker, béton massif à fruit, ouverture en voûte (celle du tunnel), meurtrières, portes blindées ouvertes, roche par-dessus ----------
      { const TU = h.TH.tun, HV = TU.h || 7.5, FL = TU.voute || 3.2, betB = mat('betonGES', {}, '#7d817a'), blinde = mat('toleOrange', {}, '#4a5a48');
        for (const [i, sens] of [[T0, 0], [T1, Math.PI]]) { const s = S[i], gr = new THREE.Group(); gr.position.set(s.x, s.y, s.z); gr.rotation.y = h.across(s) + sens; h.scene.add(gr); // la face du portail regarde vers -Z
          const mur = new THREE.Shape([[-W - 13, -3], [W + 13, -3], [W + 8.5, 13.4], [-W - 8.5, 13.4]].map(([x, y]) => new THREE.Vector2(x, y))), trou = new THREE.Path();
          const WO = W - 0.35, HO = HV - 0.3; trou.moveTo(-WO, -3); trou.lineTo(-WO, HO - FL); for (let k = 1; k <= 12; k++) { const a = Math.PI * (1 - k / 12); trou.lineTo(Math.cos(a) * WO, HO - FL + Math.sin(a) * FL); } trou.lineTo(WO, -3); mur.holes.push(trou); // un peu plus étroite et plus basse que la coque : elle cache le portail du moteur sans jamais être dans son plan
          const ge = new THREE.ExtrudeGeometry(mur, { depth: 7, bevelEnabled: false, curveSegments: 1 }); ge.translate(0, 0, -7.25); { const uv = ge.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) / 8, uv.getY(k) / 8); }
          const m = new THREE.Mesh(ge, betB); m.castShadow = m.receiveShadow = true; gr.add(m);
          h.pose('boite', betS, gr, [0, 14.2, -4], 2 * W + 19, 1.6, 9); // la dalle de couverture, en débord
          for (const x of [-7, 0, 7]) h.pose('boite', noir, gr, [x, 10.6, -7.3], 3, 0.6, 0.5); // trois meurtrières au-dessus de la voûte
          for (const sd of [-1, 1]) { const p = h.pose('boite', blinde, gr, [sd * (W + 5.4), 4.4, -11.2], 0.9, 9.4, 9); p.rotation.y = sd * 0.5; h.pose('boite', mat('bandeOrange'), gr, [sd * (W + 3.4), 4.4, -15.1], 1, 9.4, 0.3).rotation.y = sd * 0.5; // les vantaux blindés, ouverts, et leur chant rayé
            h.pose('boite', mat('lampe', LUMI), gr, [sd * (W + 2), 6.2, -7.45], 0.5, 0.9, 0.4); }
          h.pose('boite', mat('lettres', {}, sens ? 'Т-2' : 'Т-1', '#7d817a', '#2a2c2a'), gr, [-W - 5.2, 9, -7.3], 5, 1.5, 0.1);
        } }

      // ---------- la garnison du barrage, entre la route de la vallée et la rivière : clôture de béton à losanges, portail vert à étoiles, casernements, place d'armes, camions, miradors, radar et deux rampes de missiles antiaériens ----------
      const BX0 = -36, BX1 = 12, BZ0 = 118, BZ1 = 282, base = (x, z) => x > BX0 - 6 && x < BX1 + 6 && z > BZ0 - 6 && z < BZ1 + 6; // sur le quai, à gauche en sortant de la halle : la route passe à l'ouest (x = -50)
      const chantier = (x, z) => x > -36 && x < 114 && z > 436 && z < 646; // l'ancien terrain de la garnison, dans la vallée
      { const YB = terrasse(200) + 0.05, po2 = mat('betonPO2', DS), kaki = 0x4a5a3a, olive = mat('peinture', { c: kaki }), pkB = mat('panneauK', {}, '#a8ac98'), ZP = 200; // ZP : le portail, face à la route
        const cl = [], add = (x0, z0, x1, z1) => { const l = Math.hypot(x1 - x0, z1 - z0); cl.push([(x0 + x1) / 2, YB + 1.25, (z0 + z1) / 2, -Math.atan2(z1 - z0, x1 - x0), l, 2.5, 0.25]); };
        add(BX0, BZ0, BX1, BZ0); add(BX0, BZ1, BX1, BZ1); add(BX1, BZ0, BX1, BZ1); inst(h, h.geo('bloc'), po2, cl); // mur plein au nord, au sud et côté canal
        { const po = [], fils = []; for (let z = BZ0; z <= BZ1; z += 4) if (Math.abs(z - ZP) > 7.5) po.push([BX0, YB + 1.3, z, 0, 0.24, 2.6, 0.24]); inst(h, h.geo('bloc'), betS, po); // côté route : poteaux de béton et quatre rangs de barbelés, on voit dedans
          for (const [z0, z1] of [[BZ0, ZP - 8], [ZP + 8, BZ1]]) for (const y of [0.6, 1.2, 1.8, 2.4]) fils.push(BX0, YB + y, z0, BX0, YB + y, z1);
          const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(fils, 3)); h.scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2e3230 }))); }
        inst(h, h.geo('boite', 0.3, 3, 6.6), mat('porteEtoile'), [[BX0, YB + 1.5, ZP - 3.5], [BX0, YB + 1.5, ZP + 3.5]]); // les deux vantaux verts à étoile rouge
        for (const dz of [-7.4, 7.4]) bloc(betS, BX0 - 0.6, BX0 + 0.6, ZP + dz - 0.6, ZP + dz + 0.6, YB - 1, YB + 3.8);
        bloc(pkB, BX0 + 2, BX0 + 8, ZP + 9, ZP + 15, YB - 2, YB + 3.4); bloc(betS, BX0 + 1.5, BX0 + 8.5, ZP + 8.5, ZP + 15.5, YB + 3.4, YB + 3.8); // le poste de garde
        bloc(mat('bruit', {}, '#55585a', ['#606366', '#4a4d50']), -18, 10, 176, 250, YB - 2, YB + 0.02); // la place d'armes
        for (const z of [126, 274]) { bloc(pkB, -30, 8, z - 6, z + 6, YB - 2, YB + 7); bloc(betS, -30.6, 8.6, z - 6.6, z + 6.6, YB + 7, YB + 7.5); } // deux casernements
        bloc(pkB, -8, 10, 140, 158, YB - 2, YB + 10); bloc(betS, -8.6, 10.6, 139.4, 158.6, YB + 10, YB + 10.5); // l'état-major, et son mât au drapeau rouge
        bloc(gris, -12.2, -11.8, 148.8, 149.2, YB, YB + 14); drapeau(-12, YB + 12.5, 149.2, 4.4, 2.6); // V-13
        { const g = new THREE.Group(); g.position.set(-10, YB + 7.5, 274); g.userData.dyn = 1; h.scene.add(g); const P1 = (m, p, w, ht, d) => h.pose('boite', m, g, p, w, ht, d); // V-11 : l'antenne de veille en râteau, qui tourne vite (un tour en 4 s), vue dès la sortie de la halle
          P1(olive, [0, 2, 0], 0.5, 4, 0.5); P1(olive, [0, 4.4, 0], 11, 0.3, 0.3); P1(olive, [0, 6.6, 0], 11, 0.3, 0.3); for (let k = -5; k <= 5; k += 1.25) P1(mat('peinture', { c: 0xc8ccc0 }), [k, 5.5, 0], 0.16, 3.4, 0.16); P1(olive, [0, 5.5, -0.9], 11.6, 3.8, 0.1);
          bloc(olive, -11.4, -8.6, 272.6, 275.4, YB + 7.5, YB + 8.7); soude(h, g); TICK.push(dt => { g.rotation.y += dt * 1.05; }); }
        { const tr = []; for (let k = 0; k < 7; k++) { const z = 183 + k * 5.4; tr.push([4.5, YB + 1.7, z, 0, 5.4, 2.2, 2.6, 0x5a6844], [-0.1, YB + 1.5, z, 0, 2.4, 2.4, 2.5, kaki], [3, YB + 0.5, z, 0, 7.4, 1, 2.7, 0x1e2020]); } // sept camions bâchés, le nez vers la route : bâche, cabine, châssis
          for (const z of [229, 240]) tr.push([-6, YB + 1.2, z, 0, 7, 1.5, 3.1, kaki], [-5.4, YB + 2.3, z, 0, 2.6, 0.8, 1.8, kaki], [-9.2, YB + 2.4, z, 0, 4.6, 0.25, 0.25, 0x2a2e26]); // deux blindés, tourelle et canon
          const m = inst(h, h.geo('bloc'), mat('peinture'), tr), c = new THREE.Color(); tr.forEach((q, k) => m.setColorAt(k, c.setHex(q[7]))); m.instanceColor.needsUpdate = true; }
        for (const [x, z] of [[BX0 + 4, BZ0 + 4], [BX0 + 4, BZ1 - 4], [BX1 - 4, BZ1 - 4]]) { for (const dx of [-1.4, 1.4]) for (const dz of [-1.4, 1.4]) bloc(gris, x + dx - 0.15, x + dx + 0.15, z + dz - 0.15, z + dz + 0.15, YB, YB + 9); bloc(olive, x - 2, x + 2, z - 2, z + 2, YB + 9, YB + 11.4); bloc(betS, x - 2.6, x + 2.6, z - 2.6, z + 2.6, YB + 11.4, YB + 11.8); bloc(mat('lampe', LUMI), x - 0.5, x + 0.5, z - 0.5, z + 0.5, YB + 11.8, YB + 12.4); } // trois miradors, projecteur allumé
        // la défense antiaérienne, au premier rang devant la route : un radar sur sa butte, deux rampes et leurs missiles pointés vers le nord-ouest
        { const tre = mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide }, '#5a6652'), blancM = mat('peinture', { c: 0xd8dcd4 });
          bloc(olive, -31, -23, 254, 262, YB, YB + 3); bloc(tre, -28, -26, 257, 259, YB + 3, YB + 12); { const d = new THREE.Mesh(new THREE.SphereGeometry(11, 14, 5, 0, Math.PI * 2, 0, 0.75), mat('peinture', { c: 0xc8ccc0, side: THREE.DoubleSide })); d.rotation.order = 'YXZ'; d.rotation.set(Math.PI - 1, -1.2, 0); d.castShadow = true; const gp = new THREE.Group(); gp.position.set(-27, YB + 16, 258); gp.userData.dyn = 1; gp.add(d); h.scene.add(gp); TICK.push(dt => { gp.rotation.y += dt * 0.42; }); /* V-12 : la parabole balaie lentement (un tour en 15 s : elle est à l'extérieur du virage du pont) */ h.pose('boite', olive, h.scene, [-27, YB + 12.6, 258], 2.4, 1.2, 2.4); }
          for (const z of [177, 186, 214, 223]) { const k = new THREE.Group(); k.position.set(-27, YB, z); k.scale.setScalar(1.3); h.scene.add(k); const rk = new THREE.Group(); rk.position.set(0.8, 3.1, 0); rk.rotation.z = -0.62; k.add(rk); // lance-roquettes sur camion, cabine vers la route, seize roquettes sur leurs rails
            h.pose('boite', noir, k, [0, 0.55, 0], 7, 0.9, 2.4); h.pose('boite', olive, k, [-2.5, 1.7, 0], 2, 1.6, 2.4); h.pose('boite', olive, k, [-3.8, 1.3, 0], 1, 0.9, 2.3); h.pose('boite', olive, k, [1.2, 1.5, 0], 3.6, 1, 2.3); h.pose('boite', olive, k, [2, 2.4, 0], 0.3, 1.6, 1.8);
            h.pose('boite', olive, rk, [0, 0, 0], 5.8, 0.2, 2.4).castShadow = true; for (let q = 0; q < 8; q++) for (const e of [-1, 1]) h.pose('boite', blancM, rk, [0.2, e * 0.26, -0.98 + q * 0.28], 5, 0.2, 0.16); }
          for (const [x, z] of [[-27, 165], [-27, 236]]) { const bu = new THREE.Mesh(new THREE.CylinderGeometry(5, 6.5, 1.2, 10), mat('bruit', {}, '#5e6a4c', ['#6c7858', '#505c40'])); bu.position.set(x, YB + 0.6, z); h.scene.add(bu); bloc(olive, x - 2.4, x + 2.4, z - 2.4, z + 2.4, YB + 1.2, YB + 2.6); const r = new THREE.Group(); r.position.set(x, YB + 2.6, z); r.rotation.order = 'YXZ'; r.rotation.set(-0.8, 2.3, 0); h.scene.add(r);
            h.pose('boite', olive, r, [0, 0, 1.5], 0.6, 0.5, 9); const mi = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 10.5, 8), blancM); mi.rotation.x = Math.PI / 2; mi.position.set(0, 0.7, 1.8); mi.castShadow = true; r.add(mi);
            const og = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.6, 8), mat('peinture', { c: 0x4a5a3a })); og.rotation.x = -Math.PI / 2; og.position.set(0, 0.7, -4.2); r.add(og); h.pose('boite', olive, r, [0, 0.7, 5.6], 2.2, 0.08, 1.6); h.pose('boite', olive, r, [0, 0.7, 5.6], 0.08, 2.2, 1.6); } // butte, rampe, missile, ogive, empennage
          bloc(gris, 5.8, 6.2, 261.8, 262.2, YB, YB + 28); bloc(mat('feuRouge', LUMI), 5.6, 6.4, 261.6, 262.4, YB + 28, YB + 28.8); } } // le mât radio et son feu

      // ---------- le chantier de la cité, sur l'ancien terrain de la garnison : un immeuble de neuf étages monté jusqu'au cinquième, l'ossature au-dessus, deux grues à tour sur leur voie, piles de panneaux, baraques ----------
      { const YC2 = terrasse(540) + 0.05, ox = 68, fer = mat('peinture', { c: 0x2a2c2e }), rouille = 0x8a4634;
        insts(h, 'barre', { facade: mat('panneauK', {}, '#a8a498'), toit: betS, auvent: betS }, [[ox, YC2 - 0.4, 530, Math.PI / 2]], { a: [60, 15] }); bloc(betS, ox - 6.6, ox + 6.6, 499.4, 560.6, YC2 - 2, YC2 + 0.2);
        { const os = [[ox, YC2 + 18.6, 530, 0, 12.4, 0.35, 60.4], [ox, YC2 + 21.9, 520, 0, 12.4, 0.35, 40.4], [ox - 5.9, YC2 + 16.9, 516, 0, 0.3, 3, 30], [ox + 5.9, YC2 + 16.9, 512, 0, 0.3, 3, 22]]; // l'ossature des sixième et septième étages : dalles, poteaux, premiers panneaux posés
          for (let z = 502; z <= 558; z += 8) for (const dx of [-5.6, 0, 5.6]) { os.push([ox + dx, YC2 + 17, z, 0, 0.5, 3.2, 0.5]); if (z < 540) os.push([ox + dx, YC2 + 20.3, z, 0, 0.5, 3.2, 0.5]); if (z < 524) os.push([ox + dx, YC2 + 23.4, z, 0, 0.4, 2.6, 0.4]); }
          inst(h, h.geo('bloc'), betC, os); }
        bloc(mat('bruit', {}, '#6e6a60', ['#7c786c', '#5e5a50']), 87, 95, 482, 578, YC2 - 1, YC2 + 0.12); for (const x of [88.6, 93.4]) bloc(fer, x - 0.1, x + 0.1, 483, 577, YC2 + 0.12, YC2 + 0.3); // la voie des grues
        { const peauG = { acier: mat('peinture', { c: rouille }), treillis: mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide }, '#8a4634'), lest: mat('peinture', { c: 0x6d726d }), cabine: mat('peinture', { c: 0xe8e0c8 }), vitre: mat('vitreSombre'), cable: fer };
          [[500, 2.7], [562, 3.5]].forEach(([z, r0], k) => { const g = new THREE.Group(); g.position.set(91, YC2 + 0.3, z); g.rotation.y = r0; g.userData.dyn = 1; h.scene.add(g); h.pose('grueKB', peauG, g, [0, 0, 0]); TICK.push((dt, car, t) => { g.rotation.y = r0 + 0.6 * Math.sin(t * 0.13 + k * 2); }); }); } // V-40 : les deux grues pivotent lentement (hors de la fusion)
        for (const [x, z, r] of [[98, 470, 0], [50, 520, 1.57], [52, 548, 1.57], [96, 592, 0.3]]) { for (let k = 0; k < 7; k++) bl(x, YC2 + 0.2 + k * 0.34, z, r, 6, 0.26, 3, 0xb0b2aa); for (let k = 0; k < 5; k++) bl(x + Math.cos(r) * 7, YC2 + 0.9, z - Math.sin(r) * 7 + (k - 2) * 0.5, r + 1.57 - 0.25, 0.3, 3, 6, 0xa8aaa2); } // piles de dalles et panneaux debout sur leur chevalet
        for (const z of [606, 616]) { bl(92, YC2 + 1.5, z, 0, 8, 2.6, 3, 0x4a6a5a); bl(92, YC2 + 2.95, z, 0, 8.4, 0.3, 3.4, 0x3a3e3c); } // deux baraques de chantier
        { const c = new THREE.Mesh(new THREE.ConeGeometry(6, 4.4, 9), mat('bruit', {}, '#c8b888', ['#d6c696', '#b6a678'])); c.position.set(78, YC2 + 2, 590); h.scene.add(c); } // le tas de sable
        { const m = new THREE.Mesh(h.geo('boite', 0.15, 1.8, 11), mat('lettres', {}, 'СТРОЙКА · СМУ-4', '#e8e0c8', '#b5241c')); m.position.set(108.6, YC2 + 4.4, 522); h.scene.add(m); for (const dz of [-5, 5]) bloc(gris, 108.4, 108.8, 522 + dz - 0.2, 522 + dz + 0.2, YC2, YC2 + 5.2); } }

      // les lignes à 500 kV : vers le sud au pied du versant est, à travers la rivière puis en haut du versant ouest, par l'épaule du versant est
      { const LIGNES = [[[249, 570], [360, 690], [515, 800], [535, 980], [525, 1160]], [[214, 470], [96, 392], [-190, 585], [-312, 640], [-470, 700], [-640, 760]], [[284, 470], [332, 522], [470, 470], [625, 500], [790, 545]]], pyl = [], fils = [];
        const dense = L => { const o = [L[0]]; for (let k = 1; k < L.length; k++) { const a = L[k - 1], b = L[k], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 170); for (let j = 1; j <= n; j++) o.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); } return o; };
        for (const L0 of LIGNES) { const L = dense(L0), tops = [[-7, 0, 7].map(u => [L[0][0] + u, YP + 17.8, L[0][1]]).concat([[L[0][0] - 10, YP + 20, L[0][1]], [L[0][0] + 10, YP + 20, L[0][1]]])];
          L.forEach(([x, z], k) => { if (!k) return; const a = L[k - 1], b = L[Math.min(L.length - 1, k + 1)], ang = Math.atan2(b[0] - a[0], b[1] - a[1]), y = hAt(x, z) - 0.6, c = Math.cos(ang), s = Math.sin(ang);
            if (dAt(x, z) < W + 14 || riv(x, z) < 4 || dansBati(x, z, 6)) return; const e = y > 24 ? 1.5 : 1; pyl.push([x, y, z, ang, e]); tops.push([-12, 0, 12].map(u => [x + c * u * e, y + 29 * e, z - s * u * e]).concat([[x + c * -14 * e, y + 42 * e, z - s * -14 * e], [x + c * 14 * e, y + 42 * e, z - s * 14 * e]])); }); // e : pylône une fois et demie plus haut sur les versants
          for (let k = 0; k < tops.length - 1; k++) for (let f = 0; f < 5; f++) { const A = tops[k][f], B = tops[k + 1][f], fl = Math.hypot(B[0] - A[0], B[2] - A[2]) * (f < 3 ? 0.03 : 0.02);
            for (let j = 0; j < 12; j++) { const u = j / 12, v = (j + 1) / 12, p = t => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - fl * 4 * t * (1 - t), A[2] + (B[2] - A[2]) * t]; fils.push(...p(u), ...p(v)); } } }
        insts(h, 'pyloneGES', { treillis: mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide }, '#5a5e5c'), isol, feu: mat('feuRouge', LUMI) }, pyl);
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute([...fils, ...barres], 3)); const ls = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2e3230 })); ls.userData.cables = 1; h.scene.add(ls); }

      // ---------- le 1er mai dans la cité : calicots rouges aux lampadaires de la rue, une banderole en travers de la route à l'entrée et à la sortie, le mot d'ordre en lettres sur un toit, l'autobus à l'arrêt, la stèle du chantier ----------
      {
        for (const [i, txt] of [[P(K.sortieVille) - 4, '1 МАЯ'], [P(K.entreeVille) + 14, 'МИР · ТРУД · МАЙ']]) { const s = S[(i + N) % N], gr = repere(h, s); for (const sd of [-1, 1]) h.pose('boite', gris, gr, [sd * (s.w + 2), 4.5, 0], 0.3, 9, 0.3); const n = 16, bg = new THREE.PlaneGeometry(2 * s.w + 4, 2.2, n, 1), bm = new THREE.Mesh(bg, mat('lettres', DS, txt, '#b5241c', '#f0e8d0')); bm.position.set(0, 7.6, 0); bm.userData.dyn = 1; gr.add(bm); // V-30 : la banderole ondule (tenue aux deux bouts)
          const pa = bg.attributes.position, ph = i * 0.7; TICK.push((dt, car, t) => { for (let k = 0; k <= n; k++) { const z = 0.45 * Math.sin(Math.PI * k / n) * Math.sin(t * 3.1 + k * 0.55 + ph); pa.setZ(k, z); pa.setZ(k + n + 1, z * 1.25); } pa.needsUpdate = true; }); }
        { let b = null, bd = 1e9; for (const q of rang1) { const d = Math.hypot(q[0] - 300, q[2] - 795); if (q[4] === 30 && d < bd) { bd = d; b = q; } } if (b) { const [x, y, z, r] = b, m = new THREE.Mesh(h.geo('boite', 40, 5, 0.4), mat('lettres', {}, 'СЛАВА ТРУДУ', '#8d918a', '#b5483c')); m.position.set(x + Math.sin(r) * 5.6, y + 15 + 0.6 + 2.5, z + Math.cos(r) * 5.6); m.rotation.y = r; h.scene.add(m); } } // sur le toit de l'immeuble de la rue le plus proche, face à la chaussée
        { const s = S[P(K.rueSud) + 8], [x, z] = bord(s, -1, s.w + 5.4), b = [[x, s.y + 1.7, z, h.across(s) + Math.PI / 2, 10.5, 2.4, 2.5, 0xe8e0c8], [x, s.y + 1.0, z, h.across(s) + Math.PI / 2, 10.6, 0.6, 2.56, 0xb5241c], [x, s.y + 0.35, z, h.across(s) + Math.PI / 2, 8, 0.7, 2.3, 0x1e2020]]; // l'autobus crème à bande rouge
          const m = inst(h, h.geo('bloc'), mat('peinture'), b), c = new THREE.Color(); b.forEach((p, k) => m.setColorAt(k, c.setHex(p[7]))); m.instanceColor.needsUpdate = true; }
        { const s = S[P(K.plat + 1)], [x, z] = bord(s, 1, s.w + 24), y = hAt(x, z), g2 = new THREE.Group(); g2.position.set(x, y, z); g2.rotation.y = h.across(s) + Math.PI * 0.75; h.scene.add(g2); // la stèle du chantier au bord de la route de la vallée
          h.pose('boite', betS, g2, [0, 0.5, 0], 8, 1.4, 3.4); const st = h.pose('boite', bet, g2, [0, 6.5, 0], 3.2, 11, 1.4); h.pose('boite', mat('lettres', {}, 'ГЭС 1974', '#8d918a', '#b5483c'), g2, [0, 3, 0.75], 7, 1.8, 0.1); } }

      const iG0 = iV1 + 4, iG1 = P(K.halle0) - 34; // la double voie de la vallée : de la gare à l'arrêt ГЭС
      // ---------- la zone industrielle de la vallée, entre la cité et la centrale : clôture de béton le long de la route, hangars, garages, piles de panneaux et de tuyaux, camions, grue à tour, le poste de contrôle de la centrale, le terminus du tramway ----------
      { const iZ0 = iV1 + 6, iZ1 = iH0 - 22, po2 = mat('betonPO2', DS), tramA = P(K.plat) + 4, tramB = P(K.halle0) - 34, cote = (i, sd) => !(sd > 0 && i > iG0 - 8 && i < iG1 + 8); // côté libre (le tramway prend le bord est à la fin)
        // la clôture de béton à losanges, des deux côtés, coupée devant le portail de la garnison
        for (const sd of [-1]) { let deb = -1; for (let i = iZ0; i <= iZ1 + 1; i++) { const s = S[i], [x, z] = bord(s, sd, s.w + 4.4), ok = i <= iZ1 && cote(i, sd) && !(sd < 0 && Math.abs(z - 540) < 12) && !poste(x + (sd > 0 ? 6 : 0), z); if (ok && deb < 0) deb = i; if (!ok && deb >= 0) { if (i - deb > 3) tranche(deb, i, (j, l) => ruban(j, l, q => sd * (q.w + 4.4), 2.3, q => sd * (q.w + 4.4), -0.4, po2, 4)); deb = -1; } } }
        // ---------- V-21 à V-27 : la double voie « cité – centrale », à droite de la route, de la gare (iG0) à l'arrêt ГЭС (iG1). Voie 1 (marchandises) à 10 m du bord, voie 2 (motrice électrique, sous caténaire) à 13,6 m.
        //            Elle ne croise jamais la chaussée ; les deux rames sont du décor pur (lot mobile), relancées par deux bornes du tour pour qu'on les retrouve à chaque passage ----------
        { const fer = mat('peinture', { c: 0x2a2c2e }), VO = [10, 13.6], gravier = mat('bruit', {}, '#6e6a60', ['#7c786c', '#5e5a50']), voie = mat('voieGES');
          tranche(iG0, iG1, (i, l) => { for (const c of VO) { ruban(i, l, s => s.w + c - 1.8, 0.08, s => s.w + c + 1.8, 0.08, voie, 2); for (const e of [-0.76, 0.76]) ruban(i, l, s => s.w + c + e - 0.09, 0.24, s => s.w + c + e + 0.09, 0.24, fer, 4); }
            ruban(i, l, s => s.w + 7.5, -0.7, s => s.w + 8.2, 0.08, gravier, 6); ruban(i, l, s => s.w + 15.4, 0.08, s => s.w + 16.1, -0.7, gravier, 6); }); // les deux talus du ballast
          for (const i of [iG0, iG1]) for (const c of VO) { const s = S[i], [x, z] = bord(s, 1, s.w + c), r = h.across(s); bl(x, s.y + 0.9, z, r, 2.6, 1.3, 0.6, 0xb5241c); bl(x, s.y + 0.9, z, r, 2.7, 0.4, 0.64, 0xf2f0e8); } // les heurtoirs
          // la caténaire de la voie 2 : poteaux à l'extérieur, console, fil
          { const fil = []; let prev = null; for (let i = iG0 + 3; i < iG1; i += 13) { const s = S[i], [x, z] = bord(s, 1, s.w + 16.6), r = h.across(s); bl(x, s.y + 3.6, z, r, 0.25, 7.2, 0.25, 0x55585a); bl(x - Math.cos(r) * 1.5, s.y + 6.8, z + Math.sin(r) * 1.5, r, 3.2, 0.12, 0.12, 0x55585a);
              const [fx, fz] = bord(s, 1, s.w + 13.6); if (prev) fil.push(prev[0], prev[1], prev[2], fx, s.y + 6.6, fz); prev = [fx, s.y + 6.6, fz]; }
            const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(fil, 3)); h.scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2e3230 }))); }
          // la gare, au bout sud : un quai de 64 m le long de la voie 2, sa marquise, le bâtiment ocre et blanc à pavillon central et horloge, la passerelle par-dessus les voies
          { const a = iG0 + 3, b = iG0 + 35, sm = S[(a + b) >> 1], r = h.across(sm) + Math.PI / 2, ux = sm.tx, uz = sm.tz, nx = -sm.tz, nz = sm.tx, Y = sm.y; // (ux, uz) le long de la voie, (nx, nz) vers la droite de la route
            const iM = (a + b) >> 1, G = (u, y, v, lu, ly, lv, col) => { const q = S[Math.round(iM + u / 2)]; bl(q.x - q.tz * (q.w + v), Y + y, q.z + q.tx * (q.w + v), h.across(q) + Math.PI / 2, lu, ly, lv, col); }; // u le long de la voie (2 m par échantillon), v depuis le bord de la chaussée : chaque pièce suit la courbe
            tranche(a, b, (i, l) => { ruban(i, l, s => s.w + 15.5, 1, s => s.w + 20, 1, betC, 4); ruban(i, l, s => s.w + 15.5, 0, s => s.w + 15.5, 1, betC, 4); }); // le quai
            for (let u = -28; u <= 28; u += 8) { G(u, 3, 18.6, 0.3, 4, 0.3, 0x55585a); G(u, 5.1, 17.6, 8.6, 0.3, 4.6, 0x7a3a30); } // la marquise, par travées qui suivent le quai
            for (const u of [-22, 0, 22]) { const q = S[Math.round(iM + u / 2)]; h.lum(IX.get(q), q.x - q.tz * (q.w + 17.6), Y + 4.6, q.z + q.tx * (q.w + 17.6), 0xffe2a8, 22, 0.9); } // trois lampes sous la marquise : de vrais luminaires
            bati([sm.x + nx * (sm.w + 27), sm.z + nz * (sm.w + 27), r, 18, 8]);
            G(0, 3.5, 26.5, 32, 7, 10, 0xd8b070); G(0, 7.2, 26.5, 33, 0.5, 11, 0x6d726d); G(0, 5.2, 26, 11, 10.4, 12.4, 0xe0bc7c); G(0, 10.7, 26, 12, 0.6, 13.4, 0x6d726d); G(0, 12.2, 26, 3.4, 2.6, 3.4, 0xe0bc7c); G(0, 13.8, 26, 4, 0.5, 4, 0x7a3a30); // corps, toit, pavillon central, lanternon
            for (const e of [-1, 1]) { G(0, 12.2, 26 + e * 1.74, 2, 2, 0.1, 0xf2f0e8); G(0, 12.2, 26 + e * 1.8, 0.14, 0.9, 0.06, 0x1e2020); } // l'horloge, côté voies et côté cour
            for (let u = -14; u <= 14; u += 4) if (Math.abs(u) > 5) for (const e of [-1, 1]) G(u, 3.6, 26.5 + e * 5.05, 1.6, 3, 0.1, 0x2a3a4a); // les fenêtres
            for (const e of [-4.2, 4.2]) G(e, 4, 19.7, 0.7, 8, 0.7, 0xf2f0e8); G(0, 2, 19.75, 3, 4, 0.2, 0x4a3424); // pilastres blancs et porte, côté quai
            { const m = new THREE.Mesh(h.geo('boite', 11, 1.6, 0.2), mat('lettres', {}, 'ВОКЗАЛ', '#e0bc7c', '#7a3a30')); m.position.set(sm.x + nx * (sm.w + 19.7), Y + 8.6, sm.z + nz * (sm.w + 19.7)); m.rotation.y = r; h.scene.add(m); }
            for (const e of [-1, 1]) G(22, 3.4, 11.8 + e * 5.6, 2.2, 6.8, 2.2, 0x8d918a); G(22, 7, 11.8, 2.4, 0.4, 13.4, 0x6d726d); for (const e of [-1, 1]) G(22 + e * 1.15, 7.8, 11.8, 0.1, 1.2, 13.4, 0x55585a); // la passerelle : deux piles d'escalier, le tablier, ses garde-corps
            for (const u of [-20, -8, 10]) { G(u, 1.45, 19, 1.8, 0.1, 0.5, 0x6a4a2a); G(u, 1.22, 19, 1.6, 0.44, 0.12, 0x55585a); } } // trois bancs
          // l'arrêt « ГЭС », au bout nord : un quai court et son abri
          { const a = iG1 - 26, b = iG1 - 4; tranche(a, b, (i, l) => { ruban(i, l, s => s.w + 15.5, 1, s => s.w + 18, 1, betC, 4); ruban(i, l, s => s.w + 15.5, 0, s => s.w + 15.5, 1, betC, 4); });
            const s = S[iG1 - 15], [x, z] = bord(s, 1, s.w + 17.4), r = h.across(s) + Math.PI / 2; bl(x, s.y + 3.6, z, r, 9, 0.3, 2.4, 0x6d726d); for (const e of [-4, 4]) bl(x + s.tx * e, s.y + 2.3, z + s.tz * e, r, 0.25, 2.6, 0.25, 0x55585a);
            const m = new THREE.Mesh(h.geo('boite', 4, 1.1, 0.12), mat('lettres', {}, 'ГЭС', '#f2f0e8', '#2a2c2a')); m.position.set(x, s.y + 4.4, z); m.rotation.y = r; h.scene.add(m); }
          // le chemin de chaque voie : points, altitude, abscisse cumulée
          const CH = VO.map(c => { const P2 = [], D = [0]; for (let i = iG0; i <= iG1; i++) { const s = S[i], [x, z] = bord(s, 1, s.w + c); P2.push([x, s.y + 0.2, z]); if (P2.length > 1) { const q = P2[P2.length - 2]; D.push(D[D.length - 1] + Math.hypot(x - q[0], z - q[2])); } } return { P: P2, D, L: D[D.length - 1] }; });
          const surVoie = (ch, d) => { const n = ch.P.length - 1; d = Math.max(0, Math.min(ch.L - 0.01, d)); let k = Math.min(n - 1, d / ch.L * n | 0); while (k > 0 && ch.D[k] > d) k--; while (k < n - 1 && ch.D[k + 1] < d) k++;
            const a = ch.P[k], b = ch.P[k + 1], t = (d - ch.D[k]) / (ch.D[k + 1] - ch.D[k] || 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, Math.atan2(-(b[2] - a[2]), b[0] - a[0])]; };
          // le matériel roulant, en cubes locaux (x le long de la caisse, l'avant vers +x) : cotes du train à l'arrêt d'origine
          const V = (L, f) => { const o = mob(), T = (dx, dy, lx, ly, lz, col, r = 0, dz = 0) => mb(o, dx, dy, dz, r, lx, ly, lz, col); T(0, 0.6, L - 0.6, 0.6, 2.4, 0x1e2020); for (const e of [-1, 1]) T(e * (L / 2 - 2.6), 0.3, 3, 0.5, 2, 0x161818); f(T); return { o, L }; };
          const loco = () => V(17.6, T => { T(0, 2.4, 17, 2.8, 2.9, 0x2f5a3c); T(0, 3.95, 9, 0.5, 2.5, 0x274a32); for (const e of [-1, 1]) { T(e * 6.4, 4.2, 4, 1.5, 2.9, 0x2f5a3c); T(e * 6.4, 4.35, 4.04, 0.7, 2.94, 0x2a3a4a); T(e * 8.56, 1.4, 0.3, 0.9, 2.7, 0xb5241c); T(e * 8.52, 3.4, 0.14, 0.5, 0.5, 0xfff4c0); for (const g of [-0.9, 0.9]) T(e * 8.56, 2.1, 0.14, 0.34, 0.34, 0xfff4c0, 0, g); }
            T(0, 1.5, 17.04, 0.4, 2.94, 0xd8b820); T(0, 2.9, 1.2, 1.2, 2.96, 0xb5241c); });
          const citerne = () => V(12.6, T => { T(0, 2.5, 11, 2.6, 2.6, 0x3a3e40); T(0, 4, 1.4, 0.6, 1.4, 0x3a3e40); T(0, 2.5, 11.04, 0.5, 2.64, 0xe8e4d8); });
          const tombereau = () => V(12.6, T => { T(0, 2, 12, 2.2, 2.8, 0x7a3a2c); T(0, 3.25, 11.4, 0.5, 2.3, 0xb4aa98); });
          const couvert = () => V(12.6, T => { T(0, 2.6, 12, 3.4, 2.8, 0x6a4a34); T(0, 4.4, 12.2, 0.3, 3, 0x6d726d); T(0, 2.4, 2.4, 2.6, 2.84, 0x4a3424); });
          const plat = () => V(12.6, T => { T(0, 1.05, 12.2, 0.3, 2.8, 0x5a4a3a); for (const r of [0, Math.PI / 4]) T(0, 2.1, 3.7, 1.7, 3.7, 0xc8562a, r); T(0, 2.3, 1.3, 2.3, 1.3, 0x8a8e88); for (const e of [-3.4, 3.4]) T(e, 1.5, 0.3, 0.7, 2.8, 0x6a4a2a); }); // la roue d'une turbine, sur ses cales
          const motrice = panto => V(13.4, T => { T(0, 1.9, 13, 2.4, 2.5, 0xb5483c); T(0, 2.5, 13.1, 0.9, 2.56, 0xe8e0c8); T(0, 2.6, 11, 0.5, 2.6, 0x2a3a4a); T(0, 3.3, 12, 0.3, 2.3, 0x6d726d); if (panto) T(1, 4.8, 0.1, 2.8, 1.6, 0x2a2c2e); for (const e of [-1, 1]) T(e * 6.56, 1.3, 0.12, 0.4, 0.4, 0xfff4c0); });
          // une rame : ses véhicules, sa voie ; d = abscisse de son milieu, cible = où elle va ; elle accélère, roule à v et freine pour s'arrêter à sa cible. Le premier véhicule mène toujours : au départ la rame se retourne (personne ne la voit alors)
          const rame = (ch, vs, v, d0) => { const Lr = vs.reduce((a, q) => a + q.L + 0.8, 0), R = { ch, vs, v, Lr, d: d0 < 0 ? ch.L + d0 - Lr / 2 : d0 + Lr / 2, cible: 0, vc: 0, sens: d0 < 0 ? -1 : 1, x: 0, y: 0, z: 0, sud: Lr / 2 + 6, nord: ch.L - Lr / 2 - 6 }; R.cible = R.d;
            R.va = c => { R.cible = c; if (Math.abs(c - R.d) > 1) R.sens = Math.sign(c - R.d); R.pose = 0; };
            R.pas = dt => { const e = R.cible - R.d, vt = Math.sign(e) * Math.min(R.v, Math.sqrt(2 * 0.9 * Math.abs(e))); R.vc += Math.max(-1.6 * dt, Math.min(1.6 * dt, vt - R.vc)); if (Math.abs(e) < 0.05 && Math.abs(R.vc) < 0.3) R.vc = 0; R.d += R.vc * dt;
              if (R.vc || !R.pose) { R.pose = 1; let c = Lr / 2; for (const q of vs) { c -= q.L / 2 + 0.4; const [x, y, z, ry] = surVoie(ch, R.d + R.sens * c); mobA(q.o, x, y, z, ry + (R.sens < 0 ? Math.PI : 0)); if (q === vs[0]) { R.x = x; R.y = y; R.z = z; } c -= q.L / 2 + 0.4; } } };
            return R; };
          const RA = rame(CH[1], [motrice(1), motrice(0)], 16.7, 30), RB = rame(CH[0], [loco(), plat(), couvert(), citerne(), tombereau(), citerne(), couvert()], 11, -8); // A à quai en gare, B à l'arrêt ГЭС
          const fum = panache(0, 0, 0, [0.3, 0.3, 0.32], 0.3, 4, 2.4, 6, 3, 0.3); // l'échappement de la locomotive, quand elle roule
          const phare = Rm => { const l = h.lum(iG0, 0, -99, 0, 0xfff0c0, 34, 1.2); return () => { const dT = Rm.d + Rm.sens * (Rm.Lr / 2 + 3), [x, y, z] = surVoie(Rm.ch, dT); l.x = x; l.y = y + 3; l.z = z; l.i = iG0 + Math.round(Math.max(0, Math.min(1, dT / Rm.ch.L)) * (iG1 - iG0)); }; }, phA = phare(RA), phB = phare(RB); // les phares : un luminaire du moteur porté 3 m devant la tête de chaque rame, qui éclaire la voie, le ballast et la route
          TICK.push(dt => { RA.pas(dt); RB.pas(dt); phA(); phB(); fum.p[0] = RB.x; fum.p[1] = RB.y + 4.6; fum.p[2] = RB.z; fum.off = !RB.vc; });
          borne(60, () => { RA.va(RA.nord); RB.va(RB.d > RB.ch.L / 2 ? RB.sud : RB.nord); }); // à la sortie de la ligne de départ : A part vers la centrale (on la double dans la vallée), B change de bout (on la croise un tour, on la double le suivant)
          borne(1300, () => RA.va(RA.sud)); // pendant la montée, où on ne la voit pas : A rentre en gare pour le tour suivant
          h.trains = [RA, RB]; } // pour le son (sources mobiles)
        // un objet tous les 40 m de chaque côté, derrière la clôture : on les fait tourner
        const hangar = (x, y, z, r, c) => { bl(x, y + 4, z, r, 34, 8, 13, c); bl(x, y + 8.3, z, r, 35, 0.7, 14, 0x4a4e50); bl(x + Math.sin(r) * 6.6, y + 2.6, z + Math.cos(r) * 6.6, r, 6, 5.2, 0.3, 0x3a3c3e); bl(x + Math.sin(r) * 6.6, y + 6.4, z + Math.cos(r) * 6.6, r, 30, 1.2, 0.2, 0x9aa4a8); };
        const garages = (x, y, z, r) => { for (let k = -3; k <= 3; k++) bl(x + Math.cos(r) * k * 4.3, y + 1.4, z - Math.sin(r) * k * 4.3, r, 4, 2.8, 6, k & 1 ? 0x6e7a7a : 0x7a6a5a); };
        const piles = (x, y, z, r) => { for (let k = 0; k < 6; k++) bl(x, y + 0.2 + k * 0.34, z, r, 6, 0.26, 3, 0xb0b2aa); for (let k = 0; k < 4; k++) bl(x + Math.cos(r) * 9 + Math.sin(r) * (k - 1.5) * 1.3, y + 0.6, z - Math.sin(r) * 9 + Math.cos(r) * (k - 1.5) * 1.3, r, 8, 1.1, 1.1, 0x8a8e88); };
        const camions = (x, y, z, r) => { for (let k = -1; k <= 1; k++) { const cx = x + Math.cos(r) * k * 4.4, cz = z - Math.sin(r) * k * 4.4; bl(cx - Math.sin(r) * 1.4, y + 1.9, cz - Math.cos(r) * 1.4, r, 2.5, 2.4, 5.2, k ? 0x7a8a8e : 0x5a6844); bl(cx + Math.sin(r) * 2.6, y + 1.6, cz + Math.cos(r) * 2.6, r, 2.4, 2.2, 2.2, k ? 0xd86a1e : 0x4a5a3a); bl(cx, y + 0.5, cz, r, 2.5, 0.9, 7.6, 0x1e2020); } };
        const citernes = (x, y, z, r) => { for (let k = -1; k <= 1; k++) { bl(x + Math.cos(r) * k * 8, y + 5, z - Math.sin(r) * k * 8, r + 0.4, 5.4, 10, 5.4, 0xa8aeaa); bl(x + Math.cos(r) * k * 8, y + 10.2, z - Math.sin(r) * k * 8, r + 0.4, 4.4, 0.5, 4.4, 0x7d817a); } };
        const TYPES = [[hangar, 17, 7, 0x7a8a90], [piles, 9, 3], [camions, 7, 5], [garages, 15, 3.5], [hangar, 17, 7, 0x8a8478], [citernes, 12, 4], [piles, 9, 3]]; let nt = 0;
        for (let i = iZ0 + 6; i < iH0 - 75; i += 20) for (const sd of [-1, 1]) { if (!cote(i, sd)) continue; const s = S[i + (sd > 0 ? 10 : 0)], [f, hl, hp, c] = TYPES[nt % TYPES.length], [x, z] = bord(s, sd, s.w + (sd > 0 ? 14 : 6.5) + hp), r = h.across(s) + Math.PI / 2 + (sd > 0 ? Math.PI : 0);
          if (!base(x, z) && !chantier(x, z) && !poste(x, z) && place(x, z, r, hl, hp, 5.5)) { f(x, hAt(x, z) + 0.05, z, r, c); nt++; } }
        for (let i = iZ0 + 2; i < iH0 - 20; i += 9) for (const sd of [-1, 1]) for (const off of [30, 52, 74]) { const s = S[i], [f, hl, hp, c] = TYPES[nt % TYPES.length], [x, z] = bord(s, sd, s.w + off), r = h.across(s) + Math.PI / 2 + (sd > 0 ? Math.PI : 0), y = hAt(x, z);
          if (Math.abs(y - s.y) < 6 && !base(x, z) && !chantier(x, z) && !poste(x, z) && place(x, z, r, hl, hp, 8)) { f(x, y + 0.05, z, r, c); nt++; } }
        // à gauche, par-dessus la clôture : la centrale à béton du chantier (tour, trois silos, bande montante) puis un portique roulant jaune sur son parc à panneaux
        { const s = S[iZ0 + 70], [x, z] = bord(s, -1, s.w + 20), r = h.across(s) + Math.PI / 2, Y = hAt(x, z), T = (du, dy, dv, a, b, c, col) => bl(x + s.tx * du - s.tz * dv, Y + dy, z + s.tz * du + s.tx * dv, r, a, b, c, col);
          if (!chantier(x, z) && !base(x, z) && place(x, z, r, 16, 8)) { T(0, 11, 0, 8, 22, 8, 0xa8aaa4); T(0, 20, 0, 8.1, 2, 8.1, 0xb5241c); T(0, 23, 0, 9, 2, 9, 0x6d726d); for (let k = 0; k < 3; k++) { T(-8 - k * 5, 8, 2, 4.4, 16, 4.4, 0xc8ccc4); T(-8 - k * 5, 16.4, 2, 3, 0.8, 3, 0x6d726d); } for (let k = 0; k < 6; k++) T(6 + k * 3, 2 + k * 3, -1, 3.4, 0.8, 1.6, 0x55585a); T(22, 1.5, -1, 5, 3, 5, 0x8a8e88); } }
        { const s = S[iZ0 + 150], [x, z] = bord(s, -1, s.w + 22), r = h.across(s) + Math.PI / 2, Y = hAt(x, z), T = (du, dy, dv, a, b, c, col) => bl(x + s.tx * du - s.tz * dv, Y + dy, z + s.tz * du + s.tx * dv, r, a, b, c, col);
          if (!chantier(x, z) && !base(x, z) && place(x, z, r, 14, 12)) { for (const e of [-1, 1]) { for (const f of [-1, 1]) T(f * 3, 7, e * 11, 0.7, 14, 0.7, 0xd8a020); T(0, 0.5, e * 11, 9, 1, 1.2, 0xd8a020); } T(0, 14.6, 0, 2.6, 1.8, 26, 0xd8a020); T(0, 12.8, 4, 3, 1.8, 3, 0x3a3e3c); T(0, 9, 4, 0.2, 6, 0.2, 0x2a2c2e); for (let k = 0; k < 4; k++) for (let n = 0; n < 5; n++) T(-8 + k * 5.4, 0.2 + n * 0.34, -3, 4.6, 0.26, 3, 0xb0b2aa); } }
        // l'arrivée à la centrale : une allée de drapeaux rouges à gauche sur les 150 derniers mètres
        for (let i = iH0 - 76; i < iH0 - 6; i += 7) { const s = S[i], [x, z] = bord(s, -1, s.w + 3.4), y = Math.max(s.y, hAt(x, z)), r = h.across(s); bl(x, y + 4.5, z, r, 0.18, 9, 0.18, 0x8a8e88); drapeau(x, y + 8, z, 2.2, 1.4); } // V-41 : ils battent au vent
        // le poste de contrôle de la centrale, en travers de la route : deux piles, un linteau à l'enseigne, la guérite, la barrière levée
        { const s = S[P(K.sortieVille + 6)], r = h.across(s), o = s.w + 2.2; for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, o); bl(x, s.y + 4.2, z, r, 2.4, 8.4, 2.4, 0x8d918a); bl(x, s.y + 0.6, z, r, 2.8, 1.2, 2.8, 0x6d726d); }
          bl(s.x, s.y + 9.2, s.z, r, 2 * o + 4, 1.8, 2.6, 0x8d918a); const m = new THREE.Mesh(h.geo('boite', 2 * o - 2, 1.5, 0.15), mat('lettres', {}, 'ГЭС-74 · ПРОПУСК', '#8d918a', '#b5483c')); m.position.set(s.x - s.tx * 1.4, s.y + 9.2, s.z - s.tz * 1.4); m.rotation.y = r + Math.PI; h.scene.add(m);
          const [gx, gz] = bord(s, 1, o + 4); bl(gx, s.y + 1.6, gz, r, 3, 3.2, 3, 0xb8b4a4); bl(gx, s.y + 3.4, gz, r, 3.6, 0.3, 3.6, 0x6d726d); bl(gx - Math.cos(r) * 1.55, s.y + 2, gz + Math.sin(r) * 1.55, r, 0.1, 1.2, 1.8, 0x2a3a4a); // la guérite et sa vitre
          const [bx, bz] = bord(s, 1, o - 1.6); bl(bx, s.y + 3.4, bz, r, 0.25, 6.2, 0.25, 0xc8281e); bl(bx, s.y + 1.4, bz, r, 0.3, 0.9, 0.3, 0xf2f0e8); bl(bx, s.y + 4.4, bz, r, 0.3, 0.9, 0.3, 0xf2f0e8); } // la barrière, levée
        }

      // ---------- la montée et la descente : grumes, relais hertzien, camp de pionniers sur l'épaule, char sur son socle à l'entrée de la cité, belvédère, meules et palissades ----------
      { // la coupe de bois de la rampe : une clairière de souches du côté le plus plat, quatre piles de grumes, le camion grumier, l'enseigne
        const i = P(K.rampe + 3), s = S[i], ec = sd => Math.abs(hAt(...bord(s, sd, s.w + 26)) - s.y), sd = ec(-1) < ec(1) ? -1 : 1, r = h.across(s) + Math.PI / 2, [cx, cz] = bord(s, sd, s.w + 26); clair.push([cx, cz, 34]);
        for (let j = 0; j < 4; j++) { const q = S[i + (j % 2 ? 13 : -13)], [x, z] = bord(q, sd, q.w + (j < 2 ? 8 : 17)), y = hAt(x, z); for (let n = 0; n < 3; n++) bl(x, y + 0.6 + n * 1.2, z, r + (j % 2 ? 0.12 : -0.12), 11, 1.2, 3.6 - n * 1.1, 0x7a5a3a); }
        { const q = S[i + 2], [x, z] = bord(q, sd, q.w + 4.6), y = q.y; bl(x, y + 0.6, z, r, 11, 0.8, 2.4, 0x1e2020); bl(x + q.tx * 4.3, y + 2, z + q.tz * 4.3, r, 2.3, 2.3, 2.4, 0x3a6a9a); bl(x - q.tx * 1.3, y + 1.9, z - q.tz * 1.3, r, 8.4, 1.6, 2.2, 0x7a5a3a); }
        { const q = S[i + 6], [ax, az] = bord(q, sd, q.w + 11), g = new THREE.Group(), axe = new THREE.Vector3(q.tx, 0, q.tz); g.position.set(ax, hAt(ax, az) - 0.4, az); g.userData.dyn = 1; h.scene.add(g); let ta = -1; // V-58 : un mélèze qu'on abat dans la clairière ; il tombe loin de la route quand on sort du pont, il est à terre avant le virage
          h.pose('cedre', mat('conifere', {}, '#5e7a44'), g, [0, 13.2, 0]).scale.setScalar(1.2); h.pose('tronc', h.mat('tronc'), g, [0, 3.1, 0]).scale.setScalar(1.2);
          borne(i - 50, () => { ta = 0; }); borne(i + 300, () => { ta = -1; g.quaternion.identity(); }); TICK.push(dt => { if (ta >= 0 && ta < 3) { ta += dt; g.quaternion.setFromAxisAngle(axe, sd * Math.min(1.5, 1.5 * (ta / 2.4) ** 2.6)); } }); h.arbre = () => ta; }
        { const q = S[i - 14], [x, z] = bord(q, sd, q.w + 4.6), m = new THREE.Mesh(h.geo('boite', 7, 1.5, 0.15), mat('lettres', {}, 'ЛЕСПРОМХОЗ', '#3a5a3a', '#f0e8d0')); m.position.set(x, q.y + 3.4, z); m.rotation.y = h.across(q) + Math.PI; h.scene.add(m); for (const e of [-3, 3]) bl(x + Math.cos(h.across(q)) * e, q.y + 1.7, z - Math.sin(h.across(q)) * e, h.across(q), 0.2, 3.4, 0.2, 0x3a3e3c); } }
      { // l'épingle du ravin : un grand panneau rouge dans l'axe de l'arrivée, à l'extérieur du virage, la forêt dégagée autour
        let ia = P(K.ravin); for (let i = P(K.rampe + 4); i < P(K.traverse); i++) if (Math.abs(S[i].k) > Math.abs(S[ia].k)) ia = i;
        const s = S[ia], e = S[ia - 45], [x, z] = bord(s, s.k > 0 ? -1 : 1, s.w + 15), y = Math.max(hAt(x, z), s.y), ry = Math.atan2(e.x - x, e.z - z), m = new THREE.Mesh(h.geo('boite', 26, 5, 0.3), mat('lettres', {}, 'СЛАВА ТРУДУ!', '#b5241c', '#f0e8d0')); clair.push([x, z, 20]);
        m.position.set(x, y + 6.5, z); m.rotation.y = ry; h.scene.add(m); for (const u of [-10, 10]) bl(x + Math.cos(ry) * u, y + 2, z - Math.sin(ry) * u, ry, 0.5, 4, 0.5, 0x6d726d); }
      { const x = -520, z = 330, y = hAt(x, z) - 1, tre = mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide }, '#b5483c'); bloc(tre, x - 2.5, x + 2.5, z - 2.5, z + 2.5, y, y + 22); bloc(mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide }, '#e8e4d8'), x - 1.8, x + 1.8, z - 1.8, z + 1.8, y + 22, y + 44); bloc(tre, x - 1.1, x + 1.1, z - 1.1, z + 1.1, y + 44, y + 62);
        bloc(mat('feuRouge', LUMI), x - 0.6, x + 0.6, z - 0.6, z + 0.6, y + 62, y + 63.2); } // le relais : treillis rouge et blanc, feu
      { // le camp de pionniers, sur le replat entre les deux lacets : portique d'entrée, cabanes sur socle, mât au drapeau, terrain de jeu
        const cx = 396, cz = 362, y0 = hAt(cx, cz), cab = [[], []], rc = 0.3, c = Math.cos(rc), sn = Math.sin(rc);
        for (let k = 0; k < 8; k++) { const u = (k % 4 - 1.5) * 12.5, v = k < 4 ? -8 : 8, x = cx + u * c + v * sn, z = cz - u * sn + v * c; if (dAt(x, z) < W + 10) continue; cab[k & 1].push([x, hAt(x, z) + 0.1, z, rc]); }
        cab.forEach((l, j) => insts(h, 'cabanePio', { mur: mat('peinture', { c: [0x6f9a8e, 0xc8b070][j] }), toit: mat('peinture', { c: 0x7a3a30 }), socle: betS, vitre: mat('vitreSombre') }, l));
        { const s = S[P(86)], [x, z] = bord(s, -1, s.w + 6.5), y = hAt(x, z), g2 = new THREE.Group(); g2.position.set(x, y, z); g2.rotation.y = h.across(s) + Math.PI / 2 - 0.35; h.scene.add(g2); // le portique d'entrée, tourné vers ceux qui descendent
          for (const sd of [-1, 1]) h.pose('boite', mat('peinture', { c: 0xe8e4d8 }), g2, [sd * 7.4, 3, 0], 0.6, 6, 0.6); h.pose('boite', mat('lettres', {}, 'ПИОНЕРСКИЙ ЛАГЕРЬ', '#3a6a9a', '#f0e8d0'), g2, [0, 6, 0], 16, 1.8, 0.2); h.pose('boite', mat('peinture', { c: 0xb5241c }), g2, [0, 7.4, 0], 2.2, 1.4, 0.1); }
        bl(cx, y0 + 5, cz + 6, 0, 0.2, 10, 0.2, 0x8a8e88); drapeau(cx, y0 + 9, cz + 6, 3, 1.8); panache(cx - 12, y0 + 4.5, cz - 6, [0.78, 0.78, 0.8], 0.28, 7, 2.2, 4, 2.6, 0.5); } // V-75 : le drapeau flotte, une fumée de cuisine monte
      { // le char sur son socle, mémorial à l'entrée de la cité
        const s = S[P(K.entreeVille) - 14], [x, z] = bord(s, 1, s.w + 12), y = hAt(x, z), r = h.across(s) + 0.5; bl(x, y + 1.2, z, r, 9, 2.6, 5.4, 0x8d918a); bl(x, y + 0.2, z, r, 12, 0.6, 8, 0x6d726d); bl(x, y + 3.2, z, r, 6.4, 1.3, 3.2, 0x4a5a3a); bl(x - Math.cos(r) * 0.5, y + 4.3, z + Math.sin(r) * 0.5, r, 2.6, 1, 2.2, 0x4a5a3a); bl(x + Math.cos(r) * 2.8, y + 4.4, z - Math.sin(r) * 2.8, r, 4.4, 0.26, 0.26, 0x3a4a2e); bl(x, y + 2.7, z, r, 6.8, 0.7, 3.5, 0x2a2e26); }
      { // le belvédère de l'épingle : dalle, garde-corps, deux voitures, une table d'orientation
        const s = S[P(K.belvedere) + 2], [x, z] = bord(s, 1, s.w + 9), y = s.y, r = h.across(s); bl(x, y - 1.4, z, r, 14, 3, 12, 0x8d918a); bl(x + Math.cos(r) * 6.8, y + 0.6, z - Math.sin(r) * 6.8, r, 0.2, 1.1, 12, 0xe8761e); bl(x, y + 0.6, z, r, 1.4, 1, 1.4, 0x6d726d); }
      { // la carrière de granulat du chantier, côté montagne : un carreau de gravier, un front de taille en trois gradins, le concasseur et sa bande, deux tas, deux camions-bennes
        const rocheQ = mat('bruit', DS, '#b4aa98', ['#c6bca8', '#9c9280', '#8a8070', '#d2c8b4']), gravier = mat('bruit', {}, '#c2baa8', ['#d0c8b6', '#aea694', '#dcd4c2']), kq = s => { const i = IX.get(s); return Math.min(lisse(QA, QA + 12, i), 1 - lisse(QB - 12, QB, i)); };
        tranche(QA, QB, (i, l) => { ruban(i, l, s => -(s.w + 5), 0.04, s => -(s.w + 27), 0.04, gravier, 6);
          for (let k = 0; k < 3; k++) { const o0 = 26 + 12 * k, o1 = o0 + (k < 2 ? 12 : 14); ruban(i, l, s => -(s.w + o0), s => 8 * k * kq(s) - 1, s => -(s.w + o0 + 1.5), s => 8 * (k + 1) * kq(s), rocheQ, 8); ruban(i, l, s => -(s.w + o0 + 1.5), s => 8 * (k + 1) * kq(s), s => -(s.w + o1), s => 8 * (k + 1) * kq(s), gravier, 6); }
          ruban(i, l, s => -(s.w + 64), s => 24 * kq(s), s => -(s.w + 74), -3, rocheQ, 8); });
        const sm = S[(QA + QB) >> 1], gr = repere(h, sm), X = -(sm.w + 15), tole = mat('toleOrange', {}, '#a8623a'), fer = mat('peinture', { c: 0x3a3e3c }), P1 = (m, p, w, ht, d) => { const o = h.pose('boite', m, gr, p, w, ht, d); o.castShadow = true; return o; };
        for (const dx of [-2.6, 2.6]) for (const dz of [-2.2, 2.2]) P1(fer, [X + dx, 2.6, dz], 0.5, 5.2, 0.5); // le concasseur sur pilotis : caisse, trémie, bande inclinée vers le tas
        { const [px, pz] = bord(sm, -1, sm.w + 15); panache(px, sm.y + 14, pz, [0.8, 0.75, 0.64], 0.26, 8, 10, 4, 2.2, 1.5); } // V-77 : un nuage de poussière au-dessus du concasseur, lent et en hauteur (zone de virages)
        P1(tole, [X, 8.2, 0], 6.4, 6, 5.4); P1(tole, [X, 12.2, 0], 8.6, 2, 7.4); P1(fer, [X, 5.6, -11], 1.5, 0.5, 19).rotation.x = -0.36; 
        for (const [z, r, ht] of [[-24, 7.5, 6.5], [22, 6, 5]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(r, ht, 9), gravier); c.position.set(X + 1, ht / 2 - 0.2, z); c.castShadow = true; gr.add(c); }
        for (const [x, z, ry] of [[X + 7, 10, 0.25], [X + 5, 34, -0.5]]) { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; gr.add(b); // deux camions-bennes : cabine orange, benne grise
          h.pose('boite', mat('peinture', { c: 0xd8621e }), b, [0, 2.1, -2.7], 2.5, 2.3, 2.1); h.pose('boite', mat('peinture', { c: 0x7a7e7a }), b, [0, 2.5, 1.3], 2.7, 1.7, 4.8).castShadow = true; h.pose('boite', fer, b, [0, 0.8, 0], 2.5, 1, 7.4); }
        { h.pose('boite', mat('lettres', {}, 'КАРЬЕР № 2', '#8d918a', '#2a2c2a'), gr, [-(sm.w + 5.5), 3.2, 30], 0.12, 1.5, 7); for (const dz of [-3, 3]) h.pose('boite', fer, gr, [-(sm.w + 5.5), 1.6, 30 + dz], 0.2, 3.2, 0.2); } }

      { const m = inst(h, h.geo('bloc'), mat('peinture'), peints), c = new THREE.Color(); peints.forEach((p, k) => m.setColorAt(k, c.setHex(p[7]))); m.instanceColor.needsUpdate = true; }
      { const L = lampes.filter(([x, , z]) => !dansBati(x, z, 1.2)); insts(h, 'lampadaireGES', { fut: gris, lampe: mat('lampe', LUMI) }, L); for (const [x, y, z, r] of L.filter(([x, , z]) => cite(x, z))) { FLAGS.push([mb(mob(), 0.55, 0, 0, 0, 0.9, 2.6, 0.06, 0xb5241c), x, y + 6.2, z, r, 0.16, (x * 12.9898 + z * 78.233) % 6.28]); } } // V-30 : ils remuent dans le vent // les calicots rouges du 1er mai, sur les lampadaires de la cité

      // ---------- la forêt : les arbres de touge (houppier en cône sur un fût nu), de jour ; mélèzes clairs et pins cembro sombres sur les versants, bouleaux dans le fond de vallée ----------
      { const cla = [], som = [], futs = [], bou = [];
        const libre = (x, z, m) => dAt(x, z) > W + m && !carr(proche(x, z), x, z, 78) && riv(x, z) > 6 && !cite(x, z) && !poste(x, z) && !usine(x, z) && !base(x, z) && !chantier(x, z) && !dansBati(x, z, 7) && !clair.some(([cx, cz, r]) => (x - cx) ** 2 + (z - cz) ** 2 < r * r);
        const arbre = (x, z, k) => { const y = hAt(x, z) - 0.4, dv = aval(x, z); if (dv < 30 && y < PLEIN + 1.5) return; if (dv > -30 && dv < 95 && Math.abs(x) < 262 && y < YC + 3) return; if (y > 250 && rnd() < (y - 250) / 90) return; // rien sous le niveau de la retenue pleine, rien sur le mur, la forêt s'éclaircit vers les crêtes
          const loin = dAt(x, z) > 90; (rnd() < 0.62 ? cla : som).push([x, y + (loin ? 8.2 : 11) * k, z, rnd() * 6, k]); if (!loin) futs.push([x, y + 2.6 * k, z, 0, k]); };
        // le rang serré le long de la route, là où elle est en forêt ; ouvert côté vallée dans les trouées de la traverse haute, sur la descente est et face au mur
        const foret = i => (i > iP1 + 20 && i < T0 - 8) || (i > iM1 + 30 && i < iV0 - 25), vallee = i => i < T0 ? (dans(i, K.ravin + 2, K.tunnel) ? 1 : -1) : (dans(i, K.epingleHaute, K.belvedere) ? -1 : 1); // le côté de la vallée
        const ouvert = (i, sd) => sd === vallee(i) && (dans(i, K.culee, K.entreeVille) || [K.traverse + 2, K.traverse + 4, K.traverse + 6].some(k => Math.abs(i - P(k)) < 26));
        for (let i = 0; i < N; i += 3) { if (!foret(i)) continue; for (const sd of [-1, 1]) { if (ouvert(i, sd)) continue; const [x, z] = bord(S[i], sd, S[i].w + 5 + rnd() * 7); if (dAt(x, z) > W + 4 && libre(x, z, 4)) arbre(x, z, 0.8 + rnd() * 0.6); } }
        for (let k = 0; k < 15000; k++) { const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]); if (!libre(x, z, 9)) continue; const dv = aval(x, z), plat = dv > 40 && x > pl(XW, z) - 8 && x < pl(XE, z) + 8;
          if (plat) { if (rnd() < 0.3 && riv(x, z) > 14 && !dansBati(x, z, 6)) bou.push([x, hAt(x, z) - 0.3, z, rnd() * 6, 0.8 + rnd() * 0.5]); continue; }
          const p = proche(x, z); if (p.d < 60 && ouvert(p.i, vallee(p.i)) && (z - p.s.z) * p.s.tx - (x - p.s.x) * p.s.tz > 0 === vallee(p.i) > 0) continue; // les trouées restent ouvertes en profondeur
          arbre(x, z, 0.9 + rnd() * 0.8); }
        // bouleaux en allée le long de la rue et de la route de la vallée, et autour des immeubles
        for (let i = iV0 - 40; ((i - iV0 + 40 + N) % N) < ((P(K.plat + 2) - iV0 + 40 + N) % N); i = (i + 9) % N) for (const sd of [-1, 1]) { if (enVille(i) && ((i / 9 | 0) + (sd > 0)) % 2) continue; if (sd > 0 && !enVille(i) && i > iG0 - 8 && i < iG1 + 8) continue; /* pas de bouleaux entre la route et la voie : on voit les trains */ const [x, z] = bord(S[i], sd, S[i].w + (enVille(i) ? 1.9 : 6.5)); if (dAt(x, z) > W + 1.2 && riv(x, z) > 6 && !dansBati(x, z, 4) && !poste(x, z) && !base(x, z) && !chantier(x, z)) bou.push([x, hAt(x, z) - 0.3, z, rnd() * 6, 0.9 + rnd() * 0.4]); }
        { const mc = Object.assign(mat('conifere', {}, '#5e7a44').clone(), { vertexColors: true }), LOIN = 150, CELL = 250, T = [...cla.map(q => [q, 1]), ...som.map(q => [q, 0])]; // au-delà de 150 m de la piste : un cône à 4 pans sans fond (10 sommets au lieu de 23) ; teinte par arbre dans une couleur de sommet, en pavés de 250 m (le moteur ne découpe plus les instances de moins de 100 000 sommets : sans pavés, tout serait dessiné partout)
        for (const [G0, sel] of [[h.geo('cedre'), d => d <= LOIN], [new THREE.ConeGeometry(3.6, 15, 4, 1, true), d => d > LOIN]]) { const cell = new Map(); for (const t of T) if (sel(dAt(t[0][0], t[0][2]))) { const k = Math.floor(t[0][0] / CELL) + ':' + Math.floor(t[0][2] / CELL); (cell.get(k) || cell.set(k, []).get(k)).push(t); }
          const A = G0.attributes, n = A.position.count, ix = G0.index.array;
          for (const L of cell.values()) { const P3 = new Float32Array(n * L.length * 3), N3 = new Float32Array(n * L.length * 3), UV = new Float32Array(n * L.length * 2), C3 = new Float32Array(n * L.length * 3), I = new Uint32Array(ix.length * L.length);
            L.forEach(([[x, y, z, r, k], cl], e) => { const cs = Math.cos(r), sn = Math.sin(r), col = cl ? [1, 1, 1] : [0.54, 0.57, 0.69]; for (let v = 0; v < n; v++) { const px = A.position.getX(v) * k, py = A.position.getY(v) * k, pz = A.position.getZ(v) * k, nx = A.normal.getX(v), nz = A.normal.getZ(v), o = (e * n + v) * 3;
                P3[o] = x + cs * px + sn * pz; P3[o + 1] = y + py; P3[o + 2] = z - sn * px + cs * pz; N3[o] = cs * nx + sn * nz; N3[o + 1] = A.normal.getY(v); N3[o + 2] = -sn * nx + cs * nz; C3.set(col, o); UV[(e * n + v) * 2] = A.uv.getX(v); UV[(e * n + v) * 2 + 1] = A.uv.getY(v); }
              for (let q = 0; q < ix.length; q++) I[e * ix.length + q] = ix[q] + e * n; });
            const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N3, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setAttribute('color', new THREE.BufferAttribute(C3, 3)); g.setIndex(new THREE.BufferAttribute(I, 1));
            const m = new THREE.Mesh(g, mc); m.castShadow = m.receiveShadow = h.TH.sun[1] > 0.6; h.scene.add(m); } } }
        inst(h, h.geo('tronc'), h.mat('tronc'), futs);
        bou.push(...bosq); const gardeB = bou.map(([x, , z]) => { const p = proche(x, z); return !(p.i > iG0 - 10 && p.i < iG1 + 10 && (z - p.s.z) * p.s.tx - (x - p.s.x) * p.s.tz > 0 && p.d < p.s.w + 18); }); // aucun bouleau dans le couloir des voies (le tirage du hasard reste le même : on retire après)
        inst(h, h.geo('futBouleau'), mat('ecorceB'), bou.filter((_, k) => gardeB[k])); { const hp = bou.map(([x, y, z, r, s]) => [x, y, z, r, s * (0.8 + rnd() * 0.5)]); const lo = new THREE.OctahedronGeometry(2.6, 0).translate(0, 8, 0), pres = q => dAt(q[0], q[2]) <= 150; // au-delà de 150 m de la piste : un octaèdre (24 sommets au lieu de 60)
          for (const [f, m3] of [[k => k % 3, mat('feuillesB')], [k => k % 3 === 0, mat('feuillesB', { c: 0xa8b890 })]]) { const L = hp.filter((_, k) => f(k) && gardeB[k]); inst(h, h.geo('houppierB'), m3, L.filter(pres)); inst(h, lo, m3, L.filter(q => !pres(q))); } } }
      { const s = S[P(K.epingleHaute)], [x, z] = bord(s, -1, s.w + 16); inst(h, h.geo('rocherGES'), mat('rocheGES'), [[x, hAt(x, z) + 2, z, 0.7, 7, 5, 6], [x + 6, hAt(x + 6, z + 5) + 1, z + 5, 2, 3.5, 2.5, 3]]); } // le rocher de l'épingle haute, repère de freinage
      // enrochements des berges
      { const roc = []; for (let k = 0; k < 2200; k++) { const x = -420 + rnd() * 560, z = 190 + rnd() * 1150, rv = riv(x, z); if (rv < -2 || rv > 6 || dAt(x, z) < W + 4) continue; roc.push([x, hAt(x, z), z, rnd() * 6, 1.2 + rnd() * 2.2, 0.7 + rnd() * 1.2, 1.2 + rnd() * 2.2]); } inst(h, h.geo('rocherGES'), mat('rocheGES'), roc); }

      // ---------- le lointain : trois plans de sommets hors brouillard, de plus en plus pâles, neige sur les deux derniers (rien au-delà de 2 350 m de la route : le ciel est à 2 500 m) ----------
      { const P3 = [], C3 = [], I = [], n = 180, cx = 0, cz = 450, hz = v => { const s = Math.sin(v * 127.1) * 43758.5453; return s - Math.floor(s); };
        for (const [R, roc, h0, h1, neige, gr, voile] of [[1380, 0x5f7470, 190, 360, 1e9, 9, 0.3], [1520, 0x8296a0, 330, 620, 520, 6, 0.45], [1660, 0xa6b6c0, 480, 860, 560, 4, 0.6]]) { const br = new THREE.Color(h.TH.fog), cr = new THREE.Color(roc).lerp(br, voile), cn = new THREE.Color(0xeef2f4).lerp(br, voile * 0.6), b0 = P3.length / 3;
          for (let k = 0; k <= n; k++) { const a = k / n * Math.PI * 2, kk = k % n, t = 0.5 + 0.3 * Math.sin(a * gr + R) + 0.2 * Math.sin(a * gr * 2.7 + R * 2) + 0.12 * Math.sin(a * gr * 6.1 + R * 3) + 0.06 * (hz(kk + R) - 0.5), y = h0 + (h1 - h0) * Math.max(0, Math.min(1, t)), x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, ym = Math.min(y, neige + 30 * Math.sin(a * 31 + R));
            P3.push(x, -80, z, x, ym, z, x, ym, z, x, y, z); for (const c of [cr, cr, cn, cn]) C3.push(c.r, c.g, c.b); if (k < n) { const b = b0 + k * 4; I.push(b, b + 1, b + 4, b + 1, b + 5, b + 4, b + 2, b + 3, b + 6, b + 3, b + 7, b + 6); } } }
        const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g2.setAttribute('color', new THREE.Float32BufferAttribute(C3, 3)); g2.setIndex(I); const blancTx = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); blancTx.needsUpdate = true; // une texture : rythme.js laisse alors ce grand plan d'horizon tranquille (sans elle, les sommets battaient avec la musique)
        h.scene.add(new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ map: blancTx, vertexColors: true, fog: false, side: THREE.DoubleSide }))); }

      // ---------- la vie, suite : silhouettes, envols, oiseaux qui planent, hélicoptère, câble-grue, nappes de brume de la crête, feux des portiques, ventilateurs du tunnel, soudure du chantier, bande de la carrière ----------
      { // V-14, V-27, V-35, V-48 : des silhouettes fixes (forme « passant » de touge), une teinte par personne
        const gens = [], G = (i, sd, off, n, cols, dy = 0.2) => { for (let k = 0; k < n; k++) { const s = S[(i + N) % N], o = s.w + off + ((k * 7) % 3) * 0.5, [x, z] = bord(s, sd, o), u = (k - n / 2) * 1.2 + Math.sin(k * 3.1) * 0.4; gens.push([x + s.tx * u, s.y + dy, z + s.tz * u, k * 2.4, 1.05, 1.05, 1.05, cols[k % cols.length]]); } };
        const CIV = [0x3a4a6a, 0x6a3a34, 0x4a4a52, 0x7a6a4a, 0x2e3a34, 0x8a8478];
        G(2628, 1, 2, 6, CIV); G(2688, -1, 2.2, 7, CIV); G(2862, -1, 2.4, 6, CIV); G(30, 1, 2, 5, CIV); G(72, -1, 2, 5, CIV); // devant le cinéma, au marché, à l'arrêt d'autobus, deux groupes de spectateurs au départ
        G(iG0 + 14, 1, 17, 8, CIV, 1); // les voyageurs sur le quai de la gare
        insts(h, 'passant', { ombre: mat('peinture') }, gens, { teinte: 'ombre' }); }
      { // V-36, V-45, V-72 : des oiseaux posés qui s'envolent à l'approche (modèle : les pigeons de paris), reposés pour le tour suivant
        const vols = [], envol = (i0, sd, o0, o1, n, y, col) => vols.push({ i0, en: 0, t: 0, p: Array.from({ length: n }, (_, k) => { const s = S[i0 + (k * 5) % 11], [x, z] = bord(s, sd, s.w + o0 + (o1 - o0) * ((k * 0.618) % 1));
          return { x, y: s.y + y, z, r: k * 1.7, vx: Math.sin(k * 2.4) * 2.5 + s.tx * 5 - s.tz * sd * 4, vy: 3 + (k % 3), vz: Math.cos(k * 2.4) * 2.5 + s.tz * 5 + s.tx * sd * 4, col }; }) });
        envol(2868, -1, 4.5, 11, 12, 0.25, 0x7a7c84); envol(1706, -1, 0.6, 0.6, 9, 1.17, 0x26282c); // pigeons de la place de la statue, cormorans sur le parapet côté lac, corneilles au bord de la voie
        const tous = vols.flatMap(v => v.p), pig = insts(h, 'pigeon', { plume: mat('peinture'), tete: mat('peinture', { c: 0x3a3e44 }) }, tous.map(q => [q.x, q.y, q.z, q.r, 1.3, 1.3, 1.3, q.col]), { teinte: 'plume' }); for (const m of pig) m.userData.dyn = 1;
        const dp = new THREE.Object3D(), posePig = (k, x, y, z, r, e) => { dp.position.set(x, y, z); dp.rotation.set(0, r, 0); dp.scale.setScalar(e * 1.3); dp.updateMatrix(); for (const m of pig) m.setMatrixAt(k, dp.matrix); };
        TICK.push((dt, car) => { if (!car) return; let k = 0, bouge = 0; for (const v of vols) { const e = (v.i0 - car.idx + N) % N;
            if (!v.en && e < 24 && e > 0) { v.en = 1; v.t = 0; } else if (v.en && e > 300 && e < N - 300) { v.en = 0; v.p.forEach((q, j) => posePig(k + j, q.x, q.y, q.z, q.r, 1)); bouge = 1; }
            if (v.en && v.t < 5) { v.t += dt; const t = v.t; v.p.forEach((q, j) => posePig(k + j, q.x + q.vx * t, q.y + q.vy * t + 0.3 * t * t, q.z + q.vz * t, Math.atan2(-q.vz, q.vx), t < 4.5 ? 1 : 0)); bouge = 1; }
            k += v.p.length; }
          if (bouge) for (const m of pig) m.instanceMatrix.needsUpdate = true; }); }
      { // V-55, V-61, V-80 : des oiseaux qui tournent (cubes du lot mobile) : mouettes au-dessus de l'écume du bassin, un rapace dans chaque trouée de la traverse et au-dessus de la descente
        const OIS = [], oiseau = (cx, cy, cz, R, w, ph, e, col) => OIS.push([mb(mb(mob(), 0, 0, 0, 0, 1.8, 0.35, 0.6, col), -0.2, 0.1, 0, 0, 0.9, 0.14, e, col), cx, cy, cz, R, w, ph]);
        for (const i of [1235, 1298, 1360, 2020]) { const s = S[i + 55], [x, z] = bord(s, 1, s.w + 30); oiseau(x, s.y + 20, z, 24, 0.3, i, 6, 0x3a342c); } // 110 m devant la trouée, dans l'axe de la caméra de course
        TICK.push((dt, car, t) => { for (const [o, cx, cy, cz, R, w, ph] of OIS) { const a = t * w + ph; mobA(o, cx + Math.cos(a) * R, cy + Math.sin(a * 0.7) * 1.5, cz + Math.sin(a) * R, Math.atan2(-Math.cos(a), -Math.sin(a))); } }); }
      { // V-82 : un hélicoptère militaire fait le tour de la vallée (forme de terre), rotor qui tourne
        const heli = new THREE.Group(), rotor = new THREE.Group(), peauH = { caisse: mat('peinture', { c: 0x4a5a3a }), vitre: mat('vitreSombre'), chassis: gris, pale: gris }; heli.userData.dyn = 1; heli.scale.setScalar(2); rotor.position.y = 1.65; heli.add(rotor); h.scene.add(heli);
        h.pose('helico', peauH, heli); h.pose('rotorHelico', peauH, rotor); soude(h, rotor); heli.remove(rotor); soude(h, heli); heli.add(rotor); // une passe par matière, rotor mis à part (il tourne)
        TICK.push((dt, car, t) => { const a = t * 0.085; heli.position.set(40 + Math.cos(a) * 170, 96 + Math.sin(a * 2) * 6, 500 + Math.sin(a) * 340); heli.rotation.y = Math.atan2(-Math.cos(a) * 340, -Math.sin(a) * 170); rotor.rotation.y += dt * 25; }); h.helicoP = heli.position; }
      { // V-64 : le câble-grue du chantier, tendu d'un versant à l'autre ; sa benne va et vient au-dessus de la vallée
        const A = [-430, hAt(-430, 470) + 22, 470], B = [470, hAt(470, 470) + 22, 470], lg = new THREE.BufferGeometry(), pts = []; for (let k = 0; k < 16; k++) for (const u of [k / 16, (k + 1) / 16]) pts.push(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u - 60 * u * (1 - u), A[2]);
        lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const ls = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2e3230 })); ls.userData.cables = 1; h.scene.add(ls);
        for (const P3 of [A, B]) bloc(mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide }, '#8a4634'), P3[0] - 1.5, P3[0] + 1.5, P3[2] - 1.5, P3[2] + 1.5, P3[1] - 24, P3[1]);
        const benne = mb(mb(mob(), 0, -3.2, 0, 0, 3.4, 2.4, 2.6, 0xd8a020), 0, -1, 0, 0, 0.2, 2.4, 0.2, 0x2a2c2e); TICK.push((dt, car, t) => { const u = 0.5 + 0.42 * Math.sin(t * 0.06); mobA(benne, A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u - 60 * u * (1 - u), A[2], 0); }); }
      { // V-06 : des nappes de brume traversent la crête, du lac vers le vide
        const NB = 9, im = inst(h, h.geo('brume'), mat('brumeGES', { lum: 1, transparent: true, depthWrite: false, side: THREE.DoubleSide }), Array.from({ length: NB }, () => [0, -99, 0])), d = new THREE.Object3D(); im.userData.dyn = 1; im.renderOrder = 3; im.castShadow = im.receiveShadow = false;
        TICK.push((dt, car, t) => { for (let k = 0; k < NB; k++) { const x = -232 + k * 58, u = ((t * 3.5 + k * 23) % 80) - 40; const f = Math.max(0.02, Math.min(1, (40 - Math.abs(u)) / 14)); d.position.set(x, YC + 3, CZ - Math.sqrt(RA * RA - x * x) + u); d.scale.set(28 * f, 8 * f, 28 * f); d.rotation.set(0, k, 0); d.updateMatrix(); im.setMatrixAt(k, d.matrix); } im.instanceMatrix.needsUpdate = true; }); }
      { // V-07 : un feu orange qui tourne en haut de chaque portique de la crête ; V-68 : deux paires de ventilateurs sous la voûte du tunnel
        const tour = [], orangeL = mat('lampe', { lum: 1, c: 0xff9a20 });
        for (const x of [-65, 120]) { const s = S[near(h, x, CZ - Math.sqrt(RA * RA - x * x))], g = new THREE.Group(); g.position.set(s.x, s.y + 21.6, s.z); g.userData.dyn = 1; h.scene.add(g); h.pose('boite', orangeL, g, [0, 0, 0], 2.8, 0.7, 0.7); h.pose('boite', gris, g, [0, -0.5, 0], 0.6, 0.6, 0.6); tour.push([g, 'y', 2.2]); const l = h.lum(IX.get(s), s.x, s.y + 14, s.z, 0xff8a20, 30, 1), c0 = l.c.clone(); TICK.push((dt, car, t) => { l.c.copy(c0).multiplyScalar(0.6 + 0.4 * Math.sin(t * 2.2)); }); } // le feu éclaire pour de vrai le portique et la chaussée dessous
        for (const i of [T0 + 24, T0 + 64]) for (const o of [-3.4, 3.4]) { const s = S[i], [x, z] = bord(s, 1, o), g = new THREE.Group(), ro = new THREE.Group(); g.position.set(x, s.y + 6.3, z); g.rotation.y = Math.atan2(-s.tz, s.tx); g.userData.dyn = 1; g.add(ro); h.scene.add(g);
          const c = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 2.2, 10, 1, true), mat('peinture', { c: 0x6d726d, side: THREE.DoubleSide })); c.rotation.z = Math.PI / 2; g.add(c); h.pose('boite', noir, ro, [0, 0, 0], 0.12, 1.1, 0.24); h.pose('boite', noir, ro, [0, 0, 0], 0.12, 0.24, 1.1); soude(h, ro); tour.push([ro, 'x', 14]); }
        TICK.push(dt => { for (const [g, ax, w] of tour) g.rotation[ax] += dt * w; }); }
      // ---------- le son du lieu (SON.lieux, SON.bref de audio.js) : sources posées dans le décor, entendues selon la distance et le côté ; événements liés au passage de la voiture ----------
      if (window.SON && SON.lieux) { const Vp = (x, y, z) => ({ x, y, z }), [RA, RB] = h.trains, coupe = S[P(K.rampe + 3)], camp = Vp(396, hAt(396, 362), 362), carr = S[(QA + QB) >> 1], tunM = S[(T0 + T1) >> 1];
        const chute = { p: Vp(-115, 12, 110), son: 'chute', r: 760, vol: 0.22 }, trA = { p: RA, son: 'train', r: 170, vol: 0 }, trB = { p: RB, son: 'train', r: 190, vol: 0 }, scie = { p: Vp(coupe.x, coupe.y, coupe.z), son: 'tronconneuse', r: 280, vol: 0.25 };
        SON.lieux('barrage', [chute, trA, trB, scie, // V-18 à V-20 : la chute, entendue du quai, du pont, de la crête (en contrebas) et du belvédère ; V-24 : le roulement des rames ; V-59 : la tronçonneuse
          ...[[105, 14, 65], [60, 14, 84], [15, 14, 65]].map(([x, y, z]) => ({ p: Vp(x, y + 3, z), son: 'turbine', r: 75, vol: 0.1, int: 1 })), // V-16, V-17 : un bourdon par groupe en marche, qui passe d'une oreille à l'autre dans le slalom
          { p: Vp(249, 18, 516), son: 'transfo', r: 220, vol: 0.07 }, // V-42 : les transformateurs du poste
          { p: Vp(carr.x, carr.y + 8, carr.z), son: 'concasseur', r: 160, vol: 0.22 }, // V-78
          { p: h.helicoP, son: 'helico', r: 320, vol: 0.28 }, // V-82
          ...[P(K.rampe + 6), P(K.traverse + 3), P(K.traverse + 6), P(K.culee + 6), P(K.belvedere + 4)].map(i => ({ p: Vp(S[i].x, S[i].y, S[i].z), son: 'foret', r: 260, vol: 0.14 })), // V-62 : le vent dans les mélèzes, dans la montée et la descente
          { p: Vp(tunM.x, tunM.y + 5, tunM.z), son: 'souffle', r: 170, vol: 0.2, int: 1 }, // V-69 : la ventilation du tunnel
          ...[40, 2760].map(i => { const [x, z] = bord(S[i], i < 100 ? 1 : -1, S[i].w + 4); return { p: Vp(x, S[i].y + 7, z), son: 'hautParleur', r: 90, vol: 0.25 }; })]); // V-33 : les haut-parleurs de la rue
        const pos = car => Vp(car.x, car.y || 0, car.z); let iAv = -1, tOis = 3, trompe = 0, craq = 0;
        TICK.push((dt, car) => { if (!car) return; const i = car.idx, v = Math.hypot(car.vx, car.vz);
          chute.occ = i > iH0 && i < iH1 ? 0.75 : 0; trA.vol = RA.vc ? 0.28 : 0; trB.vol = RB.vc ? 0.32 : 0; scie.vol = h.arbre() < 1 || h.arbre() > 6 ? 0.25 : 0; // dans la halle, la chute est derrière les murs ; les rames à l'arrêt se taisent ; la scie s'arrête quand l'arbre tombe
          if (h.arbre() > 1.5 && !craq) { craq = 1; SON.bref('craque', scie.p, 1, 260); } if (h.arbre() < 0) craq = 0; // V-59
          { const d = Math.hypot(RB.x - car.x, RB.z - car.z); if (RB.vc && d < 150 && !trompe) { trompe = 1; SON.bref('trompe', RB, 1, 320); } if (d > 260) trompe = 0; } // V-24 : la trompe de la locomotive, une fois par rencontre
          if (i !== iAv) { iAv = i;
            if (i > iP0 + 6 && i < iP1 - 6 && i % 11 === 0) SON.bref('joint', pos(car), 0.7 * Math.min(1, v / 45), 50); // V-54 : les joints du tablier
            if (i > iM0 + 6 && i < iM1 && (i - iM0 - 6) % 14 === 0) { const sd = ((i - iM0 - 6) / 14) & 1 ? 1 : -1, s = S[i], [x, z] = bord(s, sd, s.w + 1.2); SON.bref('souffle', Vp(x, s.y + 2, z), Math.min(1, v / 55), 40); } } // V-70 : chaque lampadaire de la crête passe en soufflant
          if ((i > P(K.rampe) && i < T0 - 20) || (i > P(K.culee) + 40 && i < P(K.descente))) { if ((tOis -= dt) < 0) { tOis = 2 + Math.random() * 4; const s = S[(i + 20) % N], [x, z] = bord(s, Math.random() < 0.5 ? 1 : -1, s.w + 12); SON.bref('oiseau', Vp(x, s.y + 8, z), 1, 200); } } // V-62 : les oiseaux du matin, en forêt
          if (i > 280 && i < 345 && Math.random() < dt * 0.5) SON.bref('marteau', Vp(68, 30, 530), 1.5, 220); }); // V-43 : le chantier
        borne(P(K.crete) + 12, () => SON.bref('corne', Vp(70, YC, -70), 0.7, 900)); // V-71 : la corne de brume, en entrant sur la crête
        borne(2150, () => SON.bref('clairon', camp, 1, 300)); // V-76 : le clairon du camp
        for (const i of [388, 2462]) borne(i, car => SON.bref('gresille', pos(car), 0.8, 60)); // V-84 : sous les lignes à 500 kV
        for (const i of [1235, 1298, 1700]) borne(i, () => SON.bref('trompe', Vp(170, 15, 400), 1, 1300)); } // V-28 : la trompe d'un train monte de la vallée
      // le lot mobile : tous les cubes des objets de MOB en une seule passe de dessin, hors de la fusion du décor (userData.dyn)
      { const L = MOB.flatMap(o => o.c.map(c => [o, c])), im = inst(h, h.geo('bloc'), mat('peinture'), L.map(([, c]) => c)), col = new THREE.Color(), d = new THREE.Object3D(), m4 = new THREE.Matrix4(); im.userData.dyn = 1;
        const loc = L.map(([, c]) => { d.position.set(c[0], c[1], c[2]); d.rotation.set(0, c[3] || 0, 0); d.scale.set(c[4], c[5], c[6]); d.updateMatrix(); return d.matrix.clone(); });
        L.forEach(([, c], k) => im.setColorAt(k, col.setHex(c[7]))); if (im.instanceColor) im.instanceColor.needsUpdate = true;
        TICK.push(() => { let b = 0; L.forEach(([o], k) => { if (o.sale) { im.setMatrixAt(k, m4.multiplyMatrices(o.M, loc[k])); b = 1; } }); if (b) { im.instanceMatrix.needsUpdate = true; for (const o of MOB) o.sale = 0; } }); }

      const VUE = []; // ce qui dépend de la voiture suivie, réglé pour chaque vue avant son rendu (tick.vue)
      { // V-03 : dans le banc de brouillard de la crête, un halo orange sur chaque lampadaire, visible à 170 m : la chaîne des lampes dessine la route. Additif, hors brouillard, dessiné après le voile du banc (renderOrder 51)
        const LP = lampes.filter(([x, y, z]) => y > YC - 6 && z < 120).map(([x, y, z, r]) => [x + Math.cos(r) * 2.1, y + 8.8, z - Math.sin(r) * 2.1]), g = new THREE.BufferGeometry(), C = new Float32Array(LP.length * 3), a = P(K.crete), b = P(74);
        g.setAttribute('position', new THREE.Float32BufferAttribute(LP.flat(), 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
        for (const [x, y, z] of LP) h.lum(near(h, x, z), x, y - 0.6, z, 0xffa040, 30, 0.65); // la vraie lumière : un luminaire du moteur par lampe, qui éclaire la chaussée et les parapets ; le halo n'en est que la lueur dans l'air
        const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: h.tx('brumeGES'), size: 8, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); pts.frustumCulled = false; pts.renderOrder = 51; pts.userData.dyn = 1; h.scene.add(pts);
        VUE.push(car => { const i = car.idx, d = i < a ? a - i : i > b ? i - b : 0, k = Math.max(0, 1 - d / 90); pts.visible = k > 0.01; if (!pts.visible) return;
          LP.forEach(([x, , z], j) => { const f = k * Math.max(0, 1 - Math.hypot(x - car.x, z - car.z) / 170); C[j * 3] = 0.75 * f; C[j * 3 + 1] = 0.42 * f; C[j * 3 + 2] = 0.12 * f; }); g.attributes.color.needsUpdate = true; }); }

      fond();
      // atlas des panneaux peints (matière « lettres », une texture de 256 × 64 par texte) : toutes les pièces partagent une matière, donc une passe de dessin ; les uv de chaque boîte sont renvoyés sur sa case (le moteur les fond ensuite)
      { const M = [...LET].filter(m => m.map), CW = 4, CH = Math.ceil(M.length / CW), AW = 1024, AH = 64 * 2 ** Math.ceil(Math.log2(CH)), cv = document.createElement('canvas'), cx = cv.getContext('2d'), idx = new Map(M.map((m, i) => [m, i])); cv.width = AW; cv.height = AH;
        M.forEach((m, i) => cx.drawImage(m.map.image, (i % CW) * 256, (i / CW | 0) * 64)); // les cases se rangent du haut ; flipY : v = 1 en haut de l'image
        const t = new THREE.CanvasTexture(cv); t.magFilter = M[0].map.magFilter; t.minFilter = M[0].map.minFilter; t.anisotropy = M[0].map.anisotropy; t.wrapS = t.wrapT = THREE.RepeatWrapping; const am = M[0].clone(); am.map = t; const vu = new Set();
        h.scene.traverse(o => { if (!o.isMesh || !idx.has(o.material)) return; let g = o.geometry; if (vu.has(g)) g = o.geometry = g.clone(); vu.add(g); const i = idx.get(o.material), u0 = (i % CW) * 256 / AW, v0 = (AH - 64 - (i / CW | 0) * 64) / AH, uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * 256 / AW, v0 + uv.getY(k) * 64 / AH); o.material = am; });
        for (const m of M) m.map.dispose(); }
      let tv = 0; const tick = (dt, now, car) => { dt = Math.min(dt, 0.1); tv += dt; for (const f of TICK) f(dt, car, tv); }; tick.vue = car => { for (const f of VUE) f(car); }; return tick;
    },
  });
})();
