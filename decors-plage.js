// Placement du décor de « plage » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  Object.assign(DECORS, {
    // ---------- Playa 307 (Riviera Maya, midi, jour de la Feria del Carmen) : refonte d'après propositions/PROPOSITION-plage.md ----------
    // Un bourg balnéaire traversé par une route : plage des hôtels et sa place de sable, muelle en un seul tablier, rue, place de la feria, halle, route 307, cénote ouvert (lac),
    // abri sous roche puis salle (le tunnel du moteur, nu : th.tun.sans), digue de la lagune. Le nord (z < 0) est la mer. Sources : docs/REFS-plage.md et la proposition.
    // Le décor fixe d'abord, puis « la vie » (propositions/VIE-plage.md) : ce qui bouge s'inscrit dans VIE et le tick renvoyé à la fin le fait avancer. Règle de texture : aucune bande ondulée sur les grandes surfaces (grain 'bruit' et accidents posés par le décor).
    plage(h) {
      const { THREE, S, N, W, T, rnd } = h, D = THREE.DoubleSide, P = i => pt(h, i), IX = new Map(S.map((s, i) => [s, i])), n0 = h.scene.children.length;
      const off = (i, o) => { const s = S[(i % N + N) % N]; return [s.x - s.tz * o, s.z + s.tx * o]; }; // point à o mètres de l'axe (positif = à droite) à l'échantillon i
      const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      const grain = (fond, g, o = {}) => h.mat('bruit', o, fond, g);
      // nappe : un polygone horizontal [[x, z], …] à l'altitude y (trous = polygones retirés) ; la texture se répète tous les t mètres
      const nappe = (pts, y, m, t = 12, trous = []) => {
        const V = a => a.map(([x, z]) => new THREE.Vector2(x, z)), c = V(pts), ho = trous.map(V), tous = [...c, ...ho.flat()], pos = [], uv = [], nor = [], idx = [];
        for (const v of tous) { pos.push(v.x, y, v.y); uv.push(v.x / t, v.y / t); nor.push(0, 1, 0); }
        for (const [a, b, d] of THREE.ShapeUtils.triangulateShape(c, ho)) { const A = tous[a], B = tous[b], C = tous[d]; (B.y - A.y) * (C.x - A.x) - (B.x - A.x) * (C.y - A.y) > 0 ? idx.push(a, b, d) : idx.push(a, d, b); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
        const me = new THREE.Mesh(g, m); me.receiveShadow = true; h.scene.add(me); return me;
      };
      // mur : une paroi verticale le long d'une ligne [[x, z], …], de y0 à y1 (nombres ou fonctions du rang du point)
      const mur = (pts, y0, y1, m, t = 8) => {
        const pos = [], uv = [], idx = [], f = (y, k) => typeof y === 'function' ? y(k) : y; let l = 0;
        pts.forEach(([x, z], k) => { if (k) l += Math.hypot(x - pts[k - 1][0], z - pts[k - 1][1]); pos.push(x, f(y0, k), z, x, f(y1, k), z); uv.push(l / t, f(y0, k) / t, l / t, f(y1, k) / t); if (k) { const a = k * 2 - 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
        const me = new THREE.Mesh(g, m); me.receiveShadow = true; h.scene.add(me); return me;
      };
      // ruban le long de la piste par morceaux : seulement là où garde(i) est vrai
      const ruban = (i0, n, oa, ya, ob, yb, m, garde, v = 8) => { const out = []; for (let k = 0, a = -1; k <= n; k++) { const ok = k < n && (!garde || garde((i0 + k) % N)); if (ok && a < 0) a = k; if (!ok && a >= 0) { out.push(h.ribbon((i0 + a) % N, k - a, oa, ya, ob, yb, m, v)); a = -1; } } return out; };
      const OFF = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, col2 = c => h.mat('peinture', { c, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
      const ligne = (i0, i1, o, pas = 2) => { const l = []; for (let i = i0; i <= i1; i += pas) l.push(off(i, typeof o === 'function' ? o(S[i % N], i) : o)); return l; };

      // matières des grandes masses (grain non directionnel)
      const mSable = grain('#cdbb8e', ['#c2ae80', '#d8c89e', '#b8a476']), mPiste = grain('#a8946c', ['#9c8860', '#b4a078', '#8e7c58'], OFF), mSol = grain('#bdb48e', ['#a9a078', '#cfc8a6', '#8f9462']);
      const mDalle = h.mat('dallageQuinta'), mRoche = grain('#ddd2b2', ['#c8bc98', '#ece2c6', '#b4a884'], { side: D }), mRocheS = grain('#8e8a78', ['#7c7868', '#a09c88', '#5e6654'], { side: D });
      const mSascab = grain('#d2c8ae', ['#c4baa0', '#ddd4bc'], OFF), mEnroche = grain('#a8a294', ['#8e887a', '#c0baac', '#787266'], { side: D }), mBois = h.mat('planches', { side: D }), mPlanches = h.mat('planchesMuelle');
      const mMerB = grain('#9fe3d2', ['#b4ecde', '#8ad8c8'], { lisse: 1 }), mMer = grain('#4fcbc3', ['#62d4cc', '#42bfb8'], { lisse: 1 }), mMerL = grain('#146a8c', ['#1a7496', '#105e80'], { lisse: 1 });
      const mLagune = grain('#5d9480', ['#689e8a', '#528874', '#7a9a6a'], { lisse: 1 }), mCenote = grain('#2fb3d0', ['#49c4dc', '#27a6c4'], { lisse: 1, transparent: true, opacity: 0.5, depthWrite: false });
      const mFond = h.mat('peinture', { c: 0x0b3f63 }), mHaut = grain('#d8d2b8', ['#c4c0a4', '#e6e2cc']);

      mRocheS.emissive = new THREE.Color(0x1c2224);
      // ---------- repères de piste (cénote v9, dessin de l'auteur : propositions/img-plage/cenote-cible.webp) : une grotte couverte et petite. Galerie d'entrée, passerelle de bois en S au-dessus de l'eau
      // (contre la paroi gauche, puis un pont entre deux bassins), plage dans l'axe de la passerelle, galerie de sortie. Les formes sortent d'un hasard fixe, par blocs ----------
      const tT = T.t0, t1 = T.t1, i25 = P(25), EAU = -7, YT = 7.5;   // EAU : niveau de l'eau, 1 m sous la passerelle ; YT : dessus de la butte de roche qui couvre la salle
      let iz = i25; while (S[iz].y > -0.2) iz++;      // repères du sascab et du chemin de la mangrove (inchangés)
      let ix = t1; while (S[ix].y < -0.2) ix++;
      let jz = i25; while (S[jz].y > 0.05) jz++; let jx = t1; while (S[jx].y < 0) jx++;   // le creux : tout ce qui roule sous le niveau du sol
      const iA = P(27) + 7, iB = P(33) - 3, i29 = P(29), i31 = P(31);                    // la salle : de iA à iB ; avant et après, les galeries
      const hz = (a, b = 0) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };                                  // hasard fixe
      const bloc = (i, j, l = 4) => hz(Math.floor((i + hz(j, 9) * l) / l), j);                                                                        // … constant par blocs de l rangs (redans, strates cassées)
      const lis = (i, j, l = 12) => { const u = i / l, k = Math.floor(u), f = u - k; return hz(k, j) + (hz(k + 1, j) - hz(k, j)) * f * f * (3 - 2 * f); }; // … continu (grandes formes)
      const E0 = i => 0.3 + ss(tT - 4, tT, i) * (1 - ss(t1, t1 + 4, i));   // pied des parois : au ras de la limite roulable à ciel ouvert, juste derrière le garde-corps sous la roche
      const bassinG = i => { const b = 16 * ss(i29 + 2, i29 + 10, i) * (1 - ss(i31 - 2, i31 + 5, i)) * (0.8 + 0.4 * lis(i, 57, 5)); return b > 0.05 ? b : 0; };   // le bassin secondaire, à gauche du pont
      // la paroi de droite de la salle : du débouché de la galerie d'entrée à celui de la galerie de sortie par le nord, une ligne brisée arrondie puis cassée par blocs (la plage est dans sa dernière poche)
      const RIVE = (() => { let c = [off(iA, S[iA].w + E0(iA)), [286, 446], [281, 432], [268, 422], [252, 424], [236, 416], [216, 411], [202, 414], [196, 421], off(iB, S[iB].w + E0(iB))];
        for (let q = 0; q < 3; q++) c = [c[0], ...c.slice(0, -1).flatMap((p, k) => { const n = c[k + 1]; return [[p[0] * 0.75 + n[0] * 0.25, p[1] * 0.75 + n[1] * 0.25], [p[0] * 0.25 + n[0] * 0.75, p[1] * 0.25 + n[1] * 0.75]]; }), c[c.length - 1]];
        return c.map((p, k) => { const a = c[Math.max(0, k - 1)], b = c[Math.min(c.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, f = Math.min(1, k / 4, (c.length - 1 - k) / 4) * 2.6 * (lis(k, 62, 5) - 0.5 + 0.5 * (bloc(k, 63, 3) - 0.5)); return [p[0] + (b[1] - a[1]) / l * f, p[1] - (b[0] - a[0]) / l * f]; }); })();
      // le bord droit du creux, dans le sens de la marche : tranchée et galerie d'entrée, paroi de la salle, galerie et tranchée de sortie ; DR = direction vers la route ou l'eau
      const NR = RIVE.length, kR = iA - jz, DROITE = [...Array.from({ length: kR }, (_, k) => off(jz + k, S[jz + k].w + E0(jz + k))), ...RIVE, ...Array.from({ length: jx - iB }, (_, k) => off(iB + 1 + k, S[iB + 1 + k].w + E0(iB + 1 + k)))];
      const DR = DROITE.map((p, k) => { const a = DROITE[Math.max(0, k - 1)], b = DROITE[Math.min(DROITE.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l]; });
      const GAUCHE = i => off(i, -(S[i].w + E0(i) + bassinG(i))), SALLE = [...Array.from({ length: iB - iA + 1 }, (_, k) => GAUCHE(iA + k)), ...RIVE.slice().reverse()];   // pied des parois de la salle
      const CREUX = [...Array.from({ length: jx - jz + 1 }, (_, k) => off(jz + k, -(S[jz + k].w + E0(jz + k) + 2.5 + bassinG(jz + k)))), ...DROITE.map((p, k) => [p[0] - DR[k][0] * 2.5, p[1] - DR[k][1] * 2.5]).reverse()];   // un seul polygone retiré du sol (talus et butte le recouvrent)
      // ---------- sols et eaux (polygones sans recouvrement) ----------
      const LAG = [[60, 105], [120, 150], [135, 260], [110, 340], [60, 385], [34, 378], [-12, 376], [-34, 392], [-60, 424], [-120, 440], [-900, 460]]; // rive de la lagune côté terre, du nord au sud
      nappe([[-900, -46], [1500, -46], [1500, -12], [540, -12], [540, 100], [60, 100], [60, 105], [-900, 105]], -0.06, mSable);
      nappe([[540, -12], [760, -12], [760, 360], [540, 360]], -0.06, mDalle, 8);
      nappe([[60, 100], [540, 100], [540, 360], [1500, 360], [1500, 1500], [-900, 1500], ...LAG.slice().reverse()], -0.06, mSol, 12, [CREUX]);
      nappe([[760, -12], [1500, -12], [1500, 360], [760, 360]], -0.06, mSol);
      nappe([[-900, 105], [60, 105], ...LAG.slice(1)], -1, mLagune, 16);
      mur([[-900, 105], ...LAG], -1.6, -0.02, mEnroche);
      { const B = [[-44, '#9fe3d2'], [-60, '#7fdacc'], [-85, '#62d0c6'], [-120, '#4cc2c0'], [-165, '#3aaeb8'], [-220, '#2c98ac'], [-290, '#2084a0'], [-380, '#187494'], [-2500, '#146a8c']]; // la mer en dégradé : neuf bandes de teintes voisines, plus de ligne entre turquoise et bleu
        for (let k = 0; k < B.length - 1; k++) nappe([[-2500, B[k + 1][0]], [2500, B[k + 1][0]], [2500, B[k][0]], [-2500, B[k][0]]], -0.3, grain(B[k][1], [B[k + 1][1]], { lisse: 1 }), 16); }
      nappe([[-900, -44], [-2500, -44], [-2500, 1500], [-900, 1500]], -0.3, mMerL, 16); nappe([[1500, -44], [2500, -44], [2500, 1500], [1500, 1500]], -0.08, mSol, 12);

      // ---------- revêtements posés sur la chaussée (le bitume de la 307 et de la digue est celui du moteur) ----------
      const tr = (a, b, m0 = 0, m1 = 0) => { const i0 = (P(a) - m0 + N) % N; return [i0, (P(b) + m1 - i0 + N) % N]; };
      h.ribbon(...tr(43, 3, -6, 4), -W, 0.02, W, 0.02, mPiste, 12);                                   // sable dur de la plage
      h.ribbon(...tr(11, 20, 4, 18), s => -s.w, 0.02, s => s.w, 0.02, h.mat('dallageQuinta', { ...OFF, rep: [3, 1] }), 8); // dallage du bourg
      h.ribbon(i25 + 10, tT - i25 - 10, s => -s.w, 0.02, s => s.w, 0.02, mSascab, 12); h.ribbon(t1, ix - t1 + 14, s => -s.w, 0.02, s => s.w, 0.02, mSascab, 12); // sascab du cénote
      // bitume de la 307 et de la digue (X-1, X-10) : gris usé à grain, ligne de rive jaune, axe discontinu ; posé par le décor, sans les flaques brillantes de la chaussée du moteur
      { const mBit = grain('#6e7378', ['#666b70', '#787d82', '#5e6368', '#747a80'], OFF), jaune = col2(0xe8b84a), blanc = col2(0xe8e0c8);
        for (const [i0, n] of [[P(20) + 15, i25 + 10 - P(20) - 15], [P(42) - 4, (P(43) + 10 - P(42) + N) % N]]) { h.ribbon(i0, n, s => -s.w, 0.025, s => s.w, 0.025, mBit, 12);
          for (const sg of [-1, 1]) h.ribbon(i0, n, s => sg * (s.w - 0.75), 0.04, s => sg * (s.w - 0.5), 0.04, jaune, 8); ruban(i0, n, -0.12, 0.04, 0.12, 0.04, blanc, i => i % 9 < 3, 8); } }
      // le chemin de la mangrove (retour de l'auteur) : une chaussée de terre claire bordée de madriers sur pieux, au ras de l'eau, au lieu du bitume
      { const i0 = ix + 14, n = P(42) - 4 - i0, mTerre = grain('#c2b48e', ['#b4a680', '#cec29e', '#a89a74'], OFF); h.ribbon(i0, n, s => -s.w, 0.025, s => s.w, 0.025, mTerre, 12);
        for (const sg of [-1, 1]) { h.ribbon(i0, n, s => sg * (s.w + 0.05), 0.4, s => sg * (s.w + 0.05), -0.5, mBois, 6); h.ribbon(i0, n, s => sg * (s.w + 0.05), 0.4, s => sg * (s.w + 0.5), 0.4, mBois, 6); h.ribbon(i0, n, s => sg * (s.w + 0.5), 0.4, s => sg * (s.w + 0.5), -1.2, mBois, 6); } }
      // talus de la crête de la 307 (la route passe au-dessus du sol plat)
      for (const sg of [-1, 1]) ruban(P(22), P(25) + 20 - P(22), s => sg * (s.w + 0.4), -0.03, s => sg * (s.w + 0.6 + 2.6 * Math.max(0, s.y)), s => -s.y - 0.07, mSol, i => S[i].y > 0.08, 12);

      // ---------- muelle : un seul tablier, 2,5 m au-dessus de l'eau ; rampes de bois à chaque bout ----------
      const TAB = ligne(P(4) + 1, P(10) - 1, s => -(s.w + 0.45), 3);   // le bord extérieur des deux voies est le bord du tablier : une seule bordure
      nappe(TAB, 2.46, mPlanches, 8); mur([...TAB, TAB[0]], 1.9, 2.46, mBois);
      for (const [a, b] of [[2, 4], [10, 12]]) { const [i0, n] = tr(a, b); for (const sg of [-1, 1]) ruban(i0, n, s => sg * s.w, 0, s => sg * s.w, s => -s.y - 0.1, mBois, i => S[i].y > 0.05 && S[i].z > -32); }
      h.ribbon(...tr(3, 11, 6, 6), s => -s.w, 0.02, s => s.w, 0.02, h.mat('planchesMuelle', OFF), 8);

      // ---------- digue de la lagune : enrochement des deux côtés ----------
      { const [i0, n] = tr(36, 42, -8, -4), mHf = grain('#a6b47a', ['#b4be88', '#98a86c', '#8fb09a'], { lisse: 1 }); for (const sg of [-1, 1]) { h.ribbon(i0, n, s => sg * (s.w + 2.6), s => -s.y - 0.985, s => sg * (s.w + 11), s => -s.y - 0.985, mHf, 10); h.ribbon(i0, n, s => sg * s.w, -0.02, s => sg * (s.w + 0.6), -0.05, mEnroche, 6); h.ribbon(i0, n, s => sg * (s.w + 0.6), -0.05, s => sg * (s.w + 3), -1.4, mEnroche, 6); } }
      // =====================================================================================================================
      // Ce qui se pose : outils de placement, matières par zone d'assemblage
      // =====================================================================================================================
      const PL = h.M.place, PX = PL.c[0], PZ = PL.c[1], dPlace = (x, z) => Math.hypot(x - PX, z - PZ) - PL.r;
      const ecart = (x, z) => { let b = dPlace(x, z); for (let i = 0; i < N; i += 2) { const s = S[i], d = Math.hypot(s.x - x, s.z - z) - s.w; if (d < b) b = d; } return b; }; // distance à ce qui se roule
      const dans = (p, x, z) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };
      const face = (s, sd) => Math.atan2(-sd * s.tz, sd * s.tx); // rotation Y : le -Z local d'un objet posé du côté sd regarde la route, son X local la longe
      const col = (c, o = {}) => h.mat('peinture', { c, ...o }), colore = (m, l) => { if (l.length) { l.forEach((p, i) => m.setColorAt(i, new THREE.Color(p[7]))); m.instanceColor.needsUpdate = true; } return m; };
      const ROSE = 0xe8468c, TURQ = 0x1fb5a8, JAUNE = 0xf2c230, FETE = [ROSE, TURQ, JAUNE];
      const tronc = grain('#7a6a58', ['#5a4a3a', '#94846e']), palme = grain('#3f7a22', ['#5a9a2a', '#2f6a1e'], { side: D }), mChaume = h.mat('chaume', { side: D }), mCrepi = h.mat('crepiClair');
      const MZ = { bois: mBois, chaume: mChaume, crepi: mCrepi, mur: mCrepi, acro: col(0xf4ecd8), ombre: col(0x5e4a3c), auvent: h.mat('toldo', { side: D }, '#25406b', '#f4ecd8'), enseigne: col(0x25406b), volet: col(0x2f7f8f), dalle: col(0xe6dcc4), muret: col(0xefe6d0),
        eau: col(0x35c4d4), fer: col(0x2a2a2e), pied: col(0xf2f2f2), cabA: col(ROSE), cabB: col(TURQ), cabC: col(JAUNE), blanc: col(0xf6f2e8), toitR: col(0xc8452e), croix: col(0x3a2a20), cuve: col(0xf2ece0), rouge: col(0xd8362a), noir: col(0x1e1e22), caisse: col(0xffffff),
        vitre: col(0x2a3a4a), lampe: col(0xfff2c0, { lum: 1 }), beton: col(0xb0aca0), tronc, palme, noix: col(0xe8b828), coque: col(0xf6f6f0), bande: col(0xffffff), toile: col(0xffffff), racine: col(0xb8b2a2), plume: col(0xf0836a), patte: col(0xe78a8c), bec: col(0x2a2a2a),
        filet: col(0xf6f6f0), poteau: col(0x8a6a48), cabine: col(0xc9cfcf), toit: col(0xf2f0ea), drapeau: col(ROSE), moteur: col(0x2a2a2e), siege: col(0x2a2a2e), cadre: col(0x2a2a2e), roue: col(0x1e1e22), plaque: col(0xf6f2e8), hamac: col(0xf6f2e8), paille: col(0xd8b96a), pilier: col(0x8a6a48), pierre: mRoche,
        marchandise: h.mat('toldoMulti'), feuille: grain('#ffffff', ['#e4e4e4', '#cacaca']), comptoir: mBois, pare: col(0xc8c8c8),
        texte: h.mat('ecrit', {}, 128, 32, '#f2ece0', '#1f8f9f', 'PLAYA 307', 24) };
      const PEAU = new Proxy(MZ, { get: (o, k) => o[k] || (o[k] = col(0xff00ff)) }); // une zone sans matière sort en magenta : on la voit tout de suite
      const pose = (nom, x, y, z, r = 0, ...a) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = r; h.scene.add(g); h.pose(nom, PEAU, g, [0, 0, 0], ...a); return g; };
      // guirlande : une bande verticale de `haut` m sous une ligne de points [[x, y, z], …] (banderoles, ampoules) ; la texture se répète tous les `pas` m
      const guirlande = (pts, haut, m, pas) => {
        const pos = [], uv = [], idx = []; let l = 0;
        pts.forEach(([x, y, z], k) => { if (k) l += Math.hypot(x - pts[k - 1][0], z - pts[k - 1][2]); pos.push(x, y, z, x, y - haut, z); uv.push(l / pas, 1, l / pas, 0); if (k) { const a = k * 2 - 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
        const me = new THREE.Mesh(g, m); h.scene.add(me); return me;
      };
      const mBand = h.mat('banderole', { lum: 1, transparent: true, alphaTest: 0.5, side: D }), mAmp = h.mat('ampoules', { lum: 1, transparent: true, alphaTest: 0.5, side: D, fog: false });
      const L = { poteaux: [], cocos: [], buis: [], houp: [], troncs: [], lamp: [], poteauxE: [], palapas: [], etals: [], bancs: [], mangles: [], flamants: [], barques: [], cubes: [], fanions: [], pickups: [], motos: [], transats: [], piscines: [] };
      // la vie : VIE = les fonctions (dt, voiture) du tick ; ce qui bouge porte userData.dyn (hors fusion du moteur, hors redécoupage final). Les listes ci-dessous sont remplies par le décor fixe et animées plus bas
      const VIE = [], GENS = [], PIN = [], PIL = [], D0 = new THREE.Object3D(), dyn = o => { o.userData.dyn = 1; o.frustumCulled = false; return o; }; D0.rotation.order = 'YXZ';
      let VOUTE = null, PUITS = [];
      const coco = (x, z, y = -0.05, t = 1) => L.cocos.push([x, y, z, rnd() * 6.28, t * (0.85 + rnd() * 0.35)]);
      const VERTS = [0x66763f, 0x58703a, 0x7a8048, 0x4e6a34, 0x8c8a4e];
      const buisson = (x, z, w, ht, y = -0.2, c = VERTS[rnd() * 5 | 0]) => L.buis.push([x, y, z, rnd() * 6.28, w, ht, w * (0.8 + rnd() * 0.4), c]);
      const ARB = [[], []], arbre = (x, z, ht, w, c = VERTS[rnd() * 4 | 0], y = 0) => ARB[c === 0xe2532a || rnd() < 0.45 ? 0 : 1].push([x, y - 0.2, z, rnd() * 6.28, w / 11, ht / 14, w / 11, c]); // ceiba (houppier plat en parasol) ou arbre de selva (houppiers étagés)
      const cube = (x, y, z, r, w, ht, d, c) => L.cubes.push([x, y, z, r, w, ht, d, c]); const MANG = [], mangl = (x, z, w) => { L.mangles.push([x, -1, z, rnd() * 6.28, w / 2]); MANG.push([x, 1.1 + w * 0.2, z, rnd() * 6.28, w * 0.8, 1.6 + rnd() * 1.8, w * 0.8, [0x2f5a34, 0x3c7a3a, 0x356a38, 0x44803c][rnd() * 4 | 0]]); };
      const chaque = ([i0, n], pas, f) => { for (let k = 0; k <= n; k += pas) f(S[(i0 + k) % N], (i0 + k) % N, k); };
      // rangée de bâtiments le long d'un côté : f(s, i) pose et renvoie la longueur occupée (0 = rien, on avance de 4 m) ; le pas suit la longueur de la ligne décalée dans les courbes
      const rangee = (i0, n, sd, o, f) => { for (let k = 0; k < n;) { const i = (i0 + k) % N, s = S[i], l = f(s, i) || 4; k += Math.max(2, Math.ceil(l / 2 / Math.max(0.4, 1 - sd * s.k * (s.w + o)))); } };

      // ---------- le bourg : façades de la Quinta au ras de la chaussée, second rang plus haut derrière (D-5) ----------
      const FAC = [0xd8715f, 0xe8b84a, 0x3c8dad, 0xe2744f, 0xefe3c8, 0xe8b84a, 0xd8715f, 0xe07a9c, 0x35a79a], VM = [[8, 4.6], [10, 7.4], [12, 7.4], [10, 4.8]], MA = VM.map(() => []), HM = []; let kf = 0;   // HM : [x, z, hauteur, côté] de chaque façade, pour accrocher les banderoles
      const maison = (s, i, sd, o = 2.6, bas = 0) => { const v = bas ? (rnd() < 0.5 ? 0 : 3) : rnd() * 4 | 0, [Lg, H] = VM[v], [x, z] = off(i, sd * (s.w + o + 4.5)), c = FAC[kf++ % FAC.length]; MA[v].push([x, s.y - 0.05, z, face(s, sd), 1, 1, 1, c]); HM.push([x, z, H, sd]);
        if (!bas && rnd() < 0.7 && !(sd < 0 && i < P(12) + 30)) { const [x2, z2] = off(i, sd * (s.w + o + 16)); cube(x2, (H + 3) / 2, z2, face(s, sd), Lg + 2, H + 3 + rnd() * 2, 10, FAC[(kf + 3) % FAC.length]); } return Lg; };
      const i11 = P(11), i12 = P(12), i17 = P(17), i18 = P(18), i20 = P(20), i21 = P(21);
      rangee(i11 + 2, i18 - 3 - i11 - 2, -1, 7, (s, i) => maison(s, i, -1));          // côté extérieur (mer puis est) : du pied du muelle jusqu'à la halle, sans trou
      rangee(i11 + 3, i17 - 4 - i11 - 3, 1, 7, (s, i) => maison(s, i, 1));          // côté intérieur : jusqu'à la place
      rangee(i20 + 9, i21 + 16 - i20 - 9, -1, 10, (s, i) => maison(s, i, -1, 4 + rnd() * 2, 1) + 1.5); rangee(i20 + 8, 14, 1, 10, (s, i) => maison(s, i, 1, 4, 1) + 1); rangee(i20 + 38, i21 + 12 - i20 - 38, 1, 10, (s, i) => maison(s, i, 1, 4 + rnd() * 2, 1) + 1.5); // sortie du bourg : maisons basses des deux côtés, sans trou, de part et d'autre de la supérette
      rangee(i18 + 1, i20 - i18 - 2, -1, 16, (s, i) => maison(s, i, -1, 10.4)); rangee(i18 + 4, i20 - i18 - 6, 1, 16, (s, i) => maison(s, i, 1, 10.4)); // de chaque côté de la halle, derrière ses rives
      VM.forEach(([Lg, H], v) => insts(h, 'maisonQuinta', PEAU, MA[v], { a: [Lg, H], teinte: 'mur' }));
      const hFac = (i, sd) => { const [x, z] = off(i, sd * (S[i].w + 7)); let b = 1e9, hb = 4.6; for (const [mx, mz, H, d] of HM) { const e = Math.hypot(mx - x, mz - z); if (d === sd && e < b) { b = e; hb = H; } } return b < 14 ? hb : 4.6; };   // hauteur de la façade la plus proche de ce côté
      chaque([i12, i18 - i12], 5, (s, i) => { const n = Math.round((s.w + 2.4) * 2 / 0.5), ya = Math.min(hFac(i, -1), hFac(i, 1)) + 0.5; for (let k = 0; k < n; k++) { const [x, z] = off(i, -(s.w + 2.4) + (k + 0.5) * 0.5); L.fanions.push([x, s.y + ya - 0.5 * Math.sin(k / n * Math.PI), z, face(s, 1) + 1.5708, 1, 1, 1, [ROSE, JAUNE, TURQ, 0x7a4bd6, 0xff6a2b][k % 5]]); } }); // papel picado en travers de la rue

      // ---------- la place de la feria (à droite de la route, entre la rue et la halle) : étals au bord, chapelle, kiosque, scène, grande roue, manège ----------
      rangee(i17 - 2, i18 - 2 - i17 + 2, 1, 3, (s, i) => { const [x, z] = off(i, s.w + 2.6); L.etals.push([x, s.y - 0.05, z, face(s, 1), 1, 1, 1, FETE[i % 3]]); return 4.2; });
      { const s = S[i17 + 1], [x, z] = off(i17 + 1, s.w + 13); pose('chapelle', x, -0.05, z, face(s, 1)); } // au bord de la rue, là où on la voit en arrivant
      pose('kiosque', 590, -0.05, 250, -Math.PI / 2); pose('scene', 578, -0.05, 276, -Math.PI / 2);
      pose('grandeRoue', 628, -0.05, 244, Math.PI / 2).scale.setScalar(1.6); pose('manege', 612, -0.05, 278); // la grande roue (38 m) dépasse des toits : on la voit de la rue. Fixes, sans animation : de près, la roue et le manège sont hors du champ de la caméra de course
      inst(h, h.geo('toit4'), col(0xc8452e, { side: D }), [[590, 4.7, 250, 0, 5.8, 2.6, 5.8]]); inst(h, h.geo('toitPalapa'), h.mat('toldo', { side: D }, '#e8468c', '#f4ecd8'), [[612, 5.4, 278, 0, 5.6, 2.2, 5.6]]);
      for (let k = 0; k < 14; k++) { const x = 560 + (k % 7) * 13 + rnd() * 3, z = 212 + (k / 7 | 0) * 66 + rnd() * 4; arbre(x, z, 9 + rnd() * 3, 7 + rnd() * 2, 0x3f7a32); }
      for (const l of ARB) for (let k = l.length - 1; k >= 0; k--) { const [x, , z] = l[k]; if (Math.hypot(x - 612, z - 278) < 10 || Math.hypot(x - 628, z - 244) < 13 || (x > 568 && x < 605 && z > 262 && z < 290)) l.splice(k, 1); } // pas d'arbre dans le manège, la roue, la scène ni son public
      for (let k = 0; k < 10; k++) L.etals.push([596 + k * 4.4, -0.05, 258, 0, 1, 1, 1, FETE[k % 3]]);

      // ---------- la halle (D-5) : toit de palmes large et bas à deux pans sur poteaux de bois, ouverte des quatre côtés, jours dans le toit ; étals serrés des deux côtés ----------
      { const n = i20 - i18, e = s => s.w + 9, hp = (s, o) => 9 - 4.4 * (o - 0.6) / (e(s) - 0.6);
        for (const sg of [-1, 1]) ruban(i18, n, s => sg * 0.6, 9, s => sg * e(s), 4.6, mChaume, i => (i - i18) % 13 > 0, 6).forEach(m => { m.castShadow = true; });
        h.ribbon(i18, n, -0.7, 9.1, 0.7, 9.1, mBois, 6).castShadow = true;
        chaque([i18, n], 4, (s, i) => { for (const sg of [-1, 1]) { for (const o of [s.w + 0.9, e(s) - 0.6]) { const [x, z] = off(i, sg * o); L.poteaux.push([x, s.y, z, 0, 2.2, hp(s, o), 2.2]); } const [x, z] = off(i, sg * (s.w + 3.4)); if (i % 8 < 4 || true) L.etals.push([x, s.y - 0.05, z, face(s, sg), 1, 1, 1, [0xd8b96a, ROSE, 0xf6f2e8, TURQ, JAUNE][(i / 4 | 0) % 5]]); } }); }

      // ---------- la plage : malecón (promenade à muret bas qui suit la piste), cocotiers plantés, front de resorts (D-3, DA-7) ----------
      const plageT = tr(44, 3, -6, -2), mMuret = col(0xefe6d0), mProm = grain('#e6dcc4', ['#d8ceb4', '#f0e8d4']);
      { const [i0, n] = plageT; h.ribbon(i0, n, s => s.w + 0.5, 0.55, s => s.w + 0.5, -0.1, mMuret, 6); h.ribbon(i0, n, s => s.w + 0.5, 0.55, s => s.w + 0.95, 0.55, mMuret, 6); h.ribbon(i0, n, s => s.w + 0.95, 0.55, s => s.w + 0.95, 0.1, mMuret, 6); h.ribbon(i0, n, s => s.w + 0.95, 0.12, s => s.w + 7.5, 0.12, mProm, 8); }
      chaque(plageT, 6, (s, i) => { const [x, z] = off(i, s.w + 4.4); coco(x, z, 0.1); });
      const RES = [[26, 2], [32, 3], [36, 2], [14, 2]], RL = RES.map(() => []), CR = [0xefe3c8, 0xe8b84a, 0xf6eedc, 0x7fcfc6, 0xe59a7a]; let kr = 0;
      rangee(plageT[0], plageT[1], 1, 18, (s, i) => { const v = s.k > 0.009 ? 3 : kr % 3, [Lg] = RES[v], [x, z] = off(i, s.w + 17.1 + (kr % 2) * 0.6); RL[v].push([x, 0, z, face(s, 1), 1, 1, 1, CR[kr++ % CR.length]]); return v === 3 ? 11 : Lg - 2; }); // front continu, sans trou ; petits pavillons dans les courbes serrées
      // les quatre groupes de la place de sable (C-7) : ce sont les piles de M.place, là où sim.js les heurte
      { const ca = Math.cos(PL.a), sa = Math.sin(PL.a), tor = [], vol = [];
        for (const [px, pz, , , nom] of PL.piles) { const x = PX + px * ca + pz * sa, z = PZ - px * sa + pz * ca; if (nom === 'torre') tor.push([x, -0.05, z, PL.a]); else if (nom === 'lancha') L.barques.push([x, -0.05, z, PL.a, 1, 1, 1, FETE[L.barques.length % 3]]); else if (nom === 'filet') vol.push([x, -0.05, z, PL.a + Math.PI / 2]); else coco(x, z); }
        insts(h, 'torreSalvavidas', PEAU, tor); insts(h, 'voley', PEAU, vol); }
      // laisse de mer : sable mouillé, écume, paquets de sargasses
      nappe([[-900, -44], [900, -44], [900, -40], [-900, -40]], -0.05, grain('#9c8a6a', ['#8e7c5e', '#a89878'], OFF), 8); // le liseré d'écume est le ressac, animé avec la vie
      for (let k = 0; k < 150; k++) { const x = -300 + rnd() * 1100; cube(x, -0.02, -38.5 + rnd() * 1.6, rnd() * 0.3, 1.5 + rnd() * 5, 0.08, 0.5 + rnd() * 0.8, 0x3a2e22); }

      // ---------- le muelle (D-4) : garde-corps continu, pilotis, allée centrale, palapa-bar ronde au centre de l'épingle ----------
      { const bord = TAB, // le garde-corps s'arrête avant les rampes : les voies entrent et sortent par le pied du tablier
          pas = 3, gris = col(0x7c8a6a), pil = [];
        mur(bord, 3.38, 3.5, mBois); mur(bord, 2.92, 3.02, mBois);
        for (let k = 0; k < bord.length - 1; k++) { const [x0, z0] = bord[k], [x1, z1] = bord[k + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / pas)); for (let j = 0; j < n; j++) { const x = x0 + (x1 - x0) * j / n, z = z0 + (z1 - z0) * j / n; L.poteaux.push([x, 2.46, z, 0, 1, 1.06, 1]); if (j % 2 === 0) pil.push([x, -2.5, z, 0, 3.4, 5, 3.4]); } }
        for (let z = -36; z > -160; z -= 9) for (const x of [505, 515, 525]) pil.push([x, -2.5, z, 0, 3.4, 5, 3.4]);
        inst(h, h.geo('poteauBois'), gris, pil); PIL.push(...pil);
        for (let z = -44; z >= -116; z -= 12) { L.lamp.push([515, 2.46, z, 0]); if (z % 24) L.bancs.push([513.6, 2.46, z - 6, Math.PI / 2], [516.4, 2.46, z - 6, -Math.PI / 2]); }
        guirlande([...Array.from({ length: 13 }, (_, k) => [515, 7.3 - (k % 2) * 0.6, -44 - k * 6])], 0.6, mBand, 6);
        inst(h, h.geo('toitPalapa'), mChaume, [[515, 5.6, -138, 0, 6.2, 3.6, 6.2], [515, 5.4, -52, 0, 3.4, 2.2, 3.4]]).castShadow = true;
        for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; L.poteaux.push([515 + Math.cos(a) * 5, 2.46, -138 + Math.sin(a) * 5, 0, 1.6, 3.3, 1.6]); } cube(515, 3.0, -138, 0, 4, 1.1, 4, 0x8a6a48);
        { const [i0, n] = tr(3, 11, -12, -12); for (const sg of [1]) { h.ribbon(i0, n, s => sg * (s.w + 0.12), 0.5, s => sg * (s.w + 0.12), 0, mBois, 6); h.ribbon(i0, n, s => sg * (s.w + 0.12), 0.5, s => sg * (s.w + 0.45), 0.5, mBois, 6); h.ribbon(i0, n, s => sg * (s.w + 0.45), 0.5, s => sg * (s.w + 0.45), 0, mBois, 6); } } /* chasse-roues de bois au bord de chaque voie : la limite roulable se voit */
        cube(515, 3.5, -52, 0, 3, 2.1, 3, 0x35a79a); for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.poteaux.push([515 + sx * 2.4, 2.46, -52 + sz * 2.4, 0, 1.2, 3.1, 1.2]); }

      // ---------- la digue de la lagune (D-9) : palétuviers en massifs au ras de l'enrochement, fenêtres ouvertes, flamants ; mur de mangrove au loin ----------
      { const dg = tr(36, 42, -10, -6);
        chaque(dg, 2, (s, i, k) => { for (const sg of [-1, 1]) { if ((k + (sg > 0 ? 13 : 0)) % 26 > 17) continue; for (let j = 0; j < 3; j++) { const [x, z] = off(i, sg * (s.w + 3.4 + rnd() * 11)), w = 2.6 + rnd() * 2.6; mangl(x, z, w); } } });
        for (const [i, sg] of [[P(37) + 6, -1], [P(38), 1], [P(38) + 14, -1], [P(39) + 8, 1], [P(40), -1], [P(40) + 14, 1]]) for (let k = 0; k < 16; k++) { const [x, z] = off(i + (rnd() * 16 | 0), sg * (S[i].w + 14 + rnd() * 14)); L.flamants.push([x, -1.2, z, rnd() * 0.6 + (sg > 0 ? 0 : 3.14)]); }
        for (let k = 0; k < 60; k++) { const z = 90 + k * 6.4; buisson(-190 - rnd() * 40, z, 18 + rnd() * 10, 9 + rnd() * 5, -1, 0x2f5a34); if (k % 5 === 2) coco(-176, z, -0.5, 1.6); }
        for (let k = 0; k < 16; k++) { const i = dg[0] + 10 + k * 11, sg = k % 2 ? 1 : -1, [cx, cz] = off(i, sg * (S[i % N].w + 38 + rnd() * 55)); if (!dans([[-900, 105], [60, 105], ...LAG.slice(1)], cx, cz)) continue; for (let j = 0; j < 6; j++) { const x = cx + rnd() * 12 - 6, z = cz + rnd() * 12 - 6, w = 3 + rnd() * 3; mangl(x, z, w); } } // îlots de mangrove dans l'eau
        chaque(dg, 9, (s, i, k) => { const sg = (k / 9 | 0) % 2 ? 1 : -1, [x, z] = off(i, sg * (s.w + 1.6)); coco(x, z, -0.1, 0.9); });
        { const kay = []; for (let k = 0; k < 6; k++) { const i = dg[0] + 14 + k * 26, s = S[i % N], [x, z] = off(i, (k % 2 ? 1 : -1) * (s.w + 2.2)); kay.push([x, -0.6, z, face(s, 1) + 1.87, 1, 1, 1, k % 2 ? 0xf2c230 : 0xff7a2a]); } insts(h, 'kayak', PEAU, kay, { teinte: 'coque' }); }
        { const i = P(39), s = S[i], [x, z] = off(i, -(s.w + 34)), [mx, mz] = off(i, -(s.w + 17)); pose('tourObs', x, -1, z, face(s, -1)); cube(mx, -0.35, mz, face(s, -1) + 1.5708, 34, 0.2, 1.6, 0xc9b58e); } // tour d'observation et son ponton
        for (let k = 0; k < 4; k++) { const i = P(37) + 10 + k * 34, s = S[i % N], sg = k % 2 ? -1 : 1, [x, z] = off(i, sg * (s.w + 30 + k * 4)); cube(x, 1.4, z, face(s, sg), 5.5, 2.8, 4.5, [0x35a79a, 0xe8b84a, 0xe07a9c, 0xefe3c8][k]); L.palapas.push([x, z, 4.6, 2.9]); for (const [a, b] of [[-2.2, -1.8], [2.2, -1.8], [-2.2, 1.8], [2.2, 1.8]]) L.poteaux.push([x + a, -1.5, z + b, 0, 1.4, 1.6, 1.4]); L.barques.push([x + 5, -0.95, z + 2, k, 1, 1, 1, FETE[k % 3]]); } // cabanes de pêcheurs sur pilotis et leurs barques
        for (const [x, z, r] of [[150, 190, 1.2], [158, 245, 1.5708], [150, 300, 1.9]]) { RL[0].push([x, 0, z, r, 1, 1, 1, CR[(x + z) % 5]]); for (let j = 0; j < 4; j++) coco(x - 14 + rnd() * 4, z - 18 + j * 12, 0); } // les hôtels de l'autre rive du bras
        LAG.forEach(([x, z], k) => { if (k < LAG.length - 1) { const [x1, z1] = LAG[k + 1], n = Math.hypot(x1 - x, z1 - z) / 9 | 0; for (let j = 0; j < Math.min(n, 30); j++) { const bx = x + (x1 - x) * j / n + rnd() * 4, bz = z + (z1 - z) * j / n + rnd() * 4, r = 7 + rnd() * 5, ht = 5 + rnd() * 4; if (ecart(bx, bz) > r + 1) buisson(bx, bz, r, ht, -0.8, [0x2f5a34, 0x3c7a3a][j % 2]); } } }); }   // jamais sur la chaussée : à la sortie de la grotte, la route longe la rive et ces massifs de 7 à 12 m de rayon la recouvraient

      // ---------- la route 307 (D-6) : mur de selva basse au ras de l'accotement, grands arbres qui dépassent derrière, poteaux électriques d'un seul côté ----------
      { const gr = [i21 + 8, (iz - i21 - 8 + N) % N];
        chaque(gr, 1, (s, i, k) => { for (const sg of [-1, 1]) { const yr = Math.max(0, s.y), o = 4 + rnd() * 9, yg = yr * Math.max(0, 1 - (o - 0.4) / (0.2 + 2.6 * yr)), [x, z] = off(i, sg * (s.w + o)); if (ecart(x, z) > 2.5) buisson(x, z, 3 + rnd() * 3, 4 + rnd() * 4 + yr - yg, Math.min(0, s.y) + yg - 0.2); }   /* sur la crête de la 307, les massifs sont posés sur le talus et montent jusqu'au-dessus de la chaussée : un mur végétal au bord de la route, pas des buissons en contrebas */
          if (k % 7 === 3) for (const sg of [-1, 1]) { const [x, z] = off(i, sg * (s.w + 26 + rnd() * 50)); if (ecart(x, z) > 18 && !dans(CREUX, x, z)) arbre(x, z, 13 + rnd() * 6, 9 + rnd() * 4, k % 28 === 3 ? 0xe2532a : undefined); }
          if (k % 22 === 6) { const [x, z] = off(i, s.w + 2.4 + Math.max(0, s.y) * 2.6); L.poteauxE.push([x, 0, z, face(s, 1)]); } }); }
      // la forêt se resserre et se referme au-dessus de la route avant le cénote (T-7) : grands arbres au ras de la chaussée dès la crête, puis au bord de la tranchée ; arbres autour du trou du plafond du lac
      for (let i = P(24) - 14; i < tT - 2; i += 2) { const s = S[i], sg = i % 4 ? 1 : -1, [x, z] = off(i, sg * (s.w + 3.2 + Math.max(0, s.y) * 2.6 + rnd() * 3)); arbre(x, z, 18 + rnd() * 5, 14, 0x3a5e2a); }
      // l'intérieur de la boucle et le lointain : selva, cocotiers des jardins ; rien sur l'eau, dans le creux, dans le bourg ni sur la plage
      const BOURG = [[540, -30], [760, -30], [760, 360], [540, 360]], LAGP = [[-900, 105], [60, 105], ...LAG.slice(1)];
      for (let k = 0; k < 900; k++) { const x = -150 + rnd() * 1200, z = 110 + rnd() * 760; if (dans(LAGP, x, z) || dans(CREUX, x, z) || dans(BOURG, x, z) || ecart(x, z) < 16) continue; if (z < 200 && x < 520) { if (rnd() < 0.5) coco(x, z); continue; } rnd() < 0.12 ? arbre(x, z, 12 + rnd() * 6, 9 + rnd() * 4) : buisson(x, z, 5 + rnd() * 6, 4 + rnd() * 5); }
      for (let k = 0; k < 150; k++) { const a = rnd() * 3.14, r = 650 + rnd() * 700; buisson(320 + Math.cos(a) * r, 380 + Math.sin(a) * r, 22 + rnd() * 18, 9 + rnd() * 7, -1); }

      // ---------- les repères communs, au centre de la boucle (D-1) ----------
      pose('chateauEau', 300, -0.05, 168, Math.PI); pose('antenne', 440, -0.05, 300);

      // ---------- le fil continu (T-2) : une ligne de poteaux et de banderoles à droite de la route sur tout le tour ; guirlande d'ampoules dans la grotte ----------
      { const pts = [], amp = [], o = s => s.w + 1.4; let dernier = -99;
        for (let i = 0; i <= N; i += 5) { const j = i % N, s = S[j], [x, z] = off(j, o(s)), creux = j > jz - 4 && j < jx + 4;
          if (creux) { if (pts.length > 1) guirlande(pts.splice(0), 0.6, mBand, 6); continue; }   // pas de banderoles dans le cénote ni dans la grotte : roche, bois et racines seulement
          pts.push([x, s.y + 5.3 - (i % 10 ? 0.5 : 0), z]); if (i % 10 === 0) L.poteaux.push([x, s.y - 0.3, z, 0, 1.3, 5.6, 1.3]); }
        if (pts.length > 1) guirlande(pts, 0.6, mBand, 6); }

      // =====================================================================================================================
      // Transitions (T-3 à T-10) et détails (X-)
      // =====================================================================================================================
      // arche de bois en travers de la route, avec son texte sur les deux faces
      const arche = (i, texte, fond, fg = '#fff4e0') => { const s = S[i % N], m = h.mat('ecrit', {}, 256, 28, fond, fg, texte, 18), b = boite(h, m, s.w * 2 + 2.4, 1.7, 0.3, s.x, s.y + 7, s.z); b.rotation.y = h.across(s); b.castShadow = true;
        for (const sg of [-1, 1]) { const [x, z] = off(i, sg * (s.w + 0.9)); L.poteaux.push([x, s.y - 0.2, z, 0, 3.4, 8, 3.4]); } };
      // panneau peint à la main sur deux piquets, au bord droit
      const panneau = (i, texte, fond, fg = '#fff4e0', o = 1.3) => { const s = S[i % N], [x, z] = off(i, s.w + o), m = h.mat('ecrit', {}, Math.max(96, texte.length * 11), 24, fond, fg, texte, 16), b = boite(h, m, Math.max(3, texte.length * 0.36), 1.2, 0.1, x, s.y + 2.6, z); b.rotation.y = h.across(s);
        for (const e of [-1, 1]) L.poteaux.push([x - s.tz * 0 + Math.cos(h.across(s)) * e * 1.2, s.y - 0.2, z - Math.sin(h.across(s)) * e * 1.2, 0, 1.5, 3.4, 1.5]); };
      arche(i11 + 3, 'BIENVENIDOS  ·  FERIA DEL CARMEN', '#e8468c');                                   // T-4 : au pied de la rampe du muelle
      arche(i25 + 6, 'CENOTE  PLAYA 307', '#1f8f9f');                                                  // T-7 : le guichet du cénote, là où le bitume s'arrête
      arche(P(42) + 4, 'ZONA HOTELERA  ·  PLAYA 307', '#25406b');                                      // T-10
      h.ribbon(i20 + 14, 1, -W, 0.04, W, 0.04, h.mat('topes', OFF), 2);                                // T-6 : le tope où finit le dallage
      panneau(i21 + 2, 'CARRETERA 307', '#1f6a3a'); panneau(P(23) + 6, 'CENOTE 300 m', '#1f8f9f'); panneau(P(24) + 14, 'CENOTE 100 m  ·  COCO FRIO', '#e8468c');
      panneau(P(36) + 6, 'CUIDADO COCODRILOS', '#f2c230', '#3a2a20', 1.6);
      // T-7 : guichet sous palapa (là où la route repasse au niveau du sol), étal de noix de coco ; plus de parking ni de pickups : posés au niveau du sol sous la crête, ils disparaissaient dans les massifs
      { const s = S[jz - 2];
        const [gx, gz] = off(jz - 2, s.w + 6); cube(gx, 1.2, gz, face(s, 1), 3.2, 2.4, 3.2, 0x35a79a); L.palapas.push([gx, gz, 3.2, 2.9]); const [ex, ez] = off(P(24) + 18, s.w + 3.4); L.etals.push([ex, S[P(24) + 18].y - 0.05, ez, face(S[P(24) + 18], 1), 1, 1, 1, JAUNE]); }
      // T-9 : sortie de la grotte en demi-ombre (arches de roche restantes au-dessus de la tranchée), racines et grands arbres
      for (const i of [t1 + 6, t1 + 16, ix + 2]) for (const sg of [-1, 1]) { const [x, z] = off(i, sg * (S[i].w + 7)); arbre(x, z, 15, 11, 0x3f7a32); }
      // T-10 : zone hôtelière sur les 120 derniers mètres de la digue
      { const i = P(42) + 8, j = P(42) + 26; for (const [k, sd, v] of [[i, -1, 0], [j, -1, 2], [i + 2, 1, 1]]) { const s = S[k % N], [x, z] = off(k, sd * (s.w + 15)); RL[v].push([x, 0, z, face(s, sd), 1, 1, 1, CR[(k + v) % CR.length]]); } chaque([P(42), 40], 5, (s, k) => { for (const sg of [-1, 1]) { const [x, z] = off(k, sg * (s.w + 3)); coco(x, z, 0); } }); }
      // T-3 : au pied de la rampe du muelle, le kiosque du ferry et trois lanchas tirées sur le sable
      { const i = P(3) - 6, s = S[i]; for (let k = 0; k < 3; k++) { const [x, z] = off(i - 4 + k * 4, -(s.w + 5)); L.barques.push([x, -0.05, z, face(s, -1), 1, 1, 1, FETE[k]]); } const [x, z] = off(i + 8, -(s.w + 4)); cube(x, 1.3, z, face(s, -1), 3, 2.6, 3, 0xe8b84a); L.palapas.push([x, z, 3, 3.1]); }
      // le pont en dos d'âne de la digue : garde-corps de bois, et l'eau turquoise de la résurgence du cénote qui se mêle à la lagune (D-9, D-11)
      { const i41 = P(41), n = 26, s = S[i41]; for (const sg of [-1, 1]) { h.ribbon(i41 - n, n + 6, sg * (s.w + 0.2), 1.0, sg * (s.w + 0.2), 0.86, mBois, 6); h.ribbon(i41 - n, n + 6, sg * (s.w + 0.2), 0.5, sg * (s.w + 0.2), 0.4, mBois, 6); for (let k = -n; k <= 6; k += 3) { const [x, z] = off(i41 + k, sg * (S[i41 + k].w + 0.2)); L.poteaux.push([x, S[i41 + k].y - 1.5, z, 0, 1.3, 2.6, 1.3]); } }
        nappe([off(i41 - 20, -70), off(i41 - 10, -3.2 - s.w), off(i41 + 2, -3.2 - s.w), off(i41 + 14, -70)], -0.985, grain('#5fc4c0', ['#74d0ca', '#4fb8b4'], { lisse: 1 }), 12); nappe([off(i41 - 14, 60), off(i41 - 8, 3.2 + s.w), off(i41, 3.2 + s.w), off(i41 + 8, 60)], -0.985, grain('#5fc4c0', ['#74d0ca', '#4fb8b4'], { lisse: 1 }), 12); }

      // ---------- cénote v9 (dessin de l'auteur, propositions/img-plage/cenote-cible.webp) : une grotte couverte. Parois de calcaire en strates cassées, voûte de roche à facettes percée de quatre puits de lumière ronds,
      // passerelle de planches à garde-corps sur pilotis, eau claire sur un fond pâle semé de rochers, un gros rocher au milieu, une plage de sable et trois cocotiers au bout de la passerelle, lanternes sur poteaux.
      // Règle : rien de visible à l'intérieur de la limite roulable sous 6,5 m ; parois, eau et garde-corps commencent au ras de cette limite. Le jour vient du vrai soleil par les puits (ombres portées de la voûte).
      { const C3 = new THREE.Color(), C4 = new THREE.Color(), PALC = [0xe2d3ae, 0xcbb585, 0xb39768, 0xd9c79c, 0xa88c62, 0xc9b890], PALG = [0xd8d2b8, 0xc4baa0, 0xb4ae98, 0xa8b09a], SOL = 0xb4ad86;
        const mRocV = grain('#f2eee2', ['#dcd6c4', '#fffaf0', '#c2bcaa'], { side: D }); mRocV.vertexColors = true;
        const sous = i => i >= tT && i <= t1, salle = i => i >= iA && i <= iB, K = 1.05;   // K : la roche de la grotte, plus sombre que celle des tranchées
        const teinte = (j, n, k = 1) => C3.set(PALC[(j + (bloc(n, 77, 9) * 3 | 0)) % 6]).lerp(C4.set(PALG[(j + (bloc(n, 78, 7) * 2 | 0)) % 4]), 0.4).multiplyScalar((0.82 + 0.3 * bloc(n, j + 30, 2)) * k).getHex();
        const p3 = (i, o, y) => { const [x, z] = off(i, o); return [x, y, z]; };
        // peau : surface tendue entre des coupes successives (coupe = liste de points [x, y, z, teinte de la facette qui suit]) ; facettes à plat
        const peau = (coupes, m = mRocV) => { const pos = [], uv = [], cl = [], idx = []; let l = 0;
          for (let k = 0; k + 1 < coupes.length; k++) { const A = coupes[k], B = coupes[k + 1], d = Math.hypot(B[0][0] - A[0][0], B[0][2] - A[0][2]); let v = 0;
            for (let j = 0; j + 1 < A.length; j++) { const dv = Math.hypot(A[j + 1][0] - A[j][0], A[j + 1][1] - A[j][1], A[j + 1][2] - A[j][2]), q = pos.length / 3; C3.set(A[j][3] ?? 0xffffff);
              for (const [p, u, w] of [[A[j], l, v], [A[j + 1], l, v + dv], [B[j], l + d, v], [B[j + 1], l + d, v + dv]]) { pos.push(p[0], p[1], p[2]); uv.push(u / 8, w / 8); cl.push(C3.r, C3.g, C3.b); }
              idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); v += dv; }
            l += d; }
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setIndex(idx); g.computeVertexNormals();
          const me = new THREE.Mesh(g, m); me.castShadow = me.receiveShadow = true; h.scene.add(me); return me; };
        // coupe d'une paroi : pied p, direction d (vers la route ou l'eau), n = rang (hasard), yr = niveau de la route ou de l'eau, yb = bas, yw = haut ; six strates en retrait du pied, puis un talus de rc mètres jusqu'au sol
        const coupe = (p, d, n, yr, yb, yw, rc, k) => { const at = (a, y, c) => [p[0] + d[0] * a, y, p[1] + d[1] * a, c], o = [], F = [0.2, 0.38, 0.55, 0.72, 0.88, 1]; let a = 0, y = yb;
          for (let j = 0; j < 6; j++) { const y1 = j < 5 ? yr + (yw - yr) * (F[j] + 0.12 * (bloc(n, j + 60, 3 + j) - 0.5)) : yw; o.push(at(a, y, teinte(j, n, k)), at(a, y1, teinte(j + 3, n, k * 0.7))); y = y1; if (j < 5) a = -(0.15 + 2.4 * bloc(n, j, 3 + j % 3) ** 1.5); }
          o[o.length - 1][3] = SOL; o.push(at(-rc * 0.4, yw + 0.3, 0x9aa070), at(-rc, -0.3, SOL)); return o; };
        const rim = i => 0.4 + 1.2 * lis(i, 35, 9) * ss(jz, jz + 10, i) * (1 - ss(jx - 10, jx, i));                                 // bord des tranchées au-dessus du sol
        const paroi = (i, sg) => { const s = S[i], e = s.w + E0(i) + (sg < 0 ? bassinG(i) : 0); return coupe(off(i, sg * e), [sg * s.tz, -sg * s.tx], i + (sg > 0 ? 500 : 0), salle(i) ? EAU : s.y, salle(i) ? -12 : s.y - 1.5, sous(i) ? Math.max(s.y + 7.4, salle(i) ? 3.2 : 0) : rim(i), sous(i) ? 4 : 7, sous(i) ? K : 1); };
        const G = [], iD = k => k < kR ? jz + k : k >= kR + NR ? iB + 1 + k - kR - NR : -1, DD = DROITE.map((p, k) => iD(k) >= 0 ? paroi(iD(k), 1) : coupe(p, DR[k], 2000 + k, EAU, -12, 3.2, 4, K));
        for (let i = jz - 2; i <= jx + 2; i++) G.push(paroi(i, -1));
        peau(G); peau(DD);
        // voûte des deux galeries : une arche de roche d'une paroi à l'autre (jamais sous 7 m), son dessus (une échine de roche couverte de terre), et un front de roche à chaque bout
        const arche = i => { const s = S[i], e = s.w + E0(i); return [[-(e + 3.5), 6.7], [-e, 7], [-0.55 * e, 7.8], [-0.15 * e, 8.2], [0.25 * e, 8.1], [0.6 * e, 7.7], [e, 7], [e + 3.5, 6.7]].map(([o, y], j) => [...p3(i, o, s.y + y + (j > 1 && j < 6 ? 0.5 * bloc(i, 20 + j, 3) : 0)), teinte(j, i, K * 0.9)]); };
        const echine = i => { const s = S[i], e = s.w + E0(i), y = s.y + 10.2; return [[-(e + 11), -0.3], [-(e + 3.5), y - 1.6], [-0.5 * e, y], [0.5 * e, y], [e + 3.5, y - 1.6], [e + 11, -0.3]].map(([o, v], j) => [...p3(i, o, v + (j > 0 && j < 5 ? 0.5 * bloc(i, 40 + j, 4) : 0)), j % 2 ? SOL : 0x9aa070]); };
        const front = i => peau([arche(i), arche(i).map((p, j) => [p[0], S[i].y + (j % 7 ? 10.4 : 8.8), p[2], teinte(j + 2, i, 0.9)])]);
        for (const [a, b] of [[tT, iA + 2], [iB - 2, t1]]) { const r = Array.from({ length: b - a + 1 }, (_, k) => a + k); peau(r.map(arche)); peau(r.map(echine)); front(a); front(b); }
        // contrôle : aucun point de roche dans le volume roulable (entre les deux limites, sous 6,5 m)
        { const vu = (c, i) => { if (i < 0) return; const s = S[i]; for (const p of c) { const o = (p[0] - s.x) * -s.tz + (p[2] - s.z) * s.tx; if (Math.abs(o) < s.w - 0.01 && p[1] > s.y - 1 && p[1] < s.y + 6.5) return console.error('plage : roche dans la route à', i, o.toFixed(1), (p[1] - s.y).toFixed(1)); } };
          G.forEach((c, k) => vu(c, jz - 2 + k)); DD.forEach((c, k) => vu(c, iD(k))); for (let i = tT; i <= t1; i++) if (i <= iA + 2 || i >= iB - 2) vu(arche(i), i); }
        // sol de roche des tranchées et des galeries, de la chaussée au pied des parois (et sous leurs retraits) ; un quai de roche ferme chaque galerie côté salle
        for (const [a, b] of [[jz, iA - 1], [iB + 1, jx]]) for (const sg of [-1, 1]) h.ribbon(a, b - a, s => sg * (s.w - 0.15), 0.015, s => sg * (s.w + 4.2), 0.015, mRoche, 6);
        for (const i of [iA - 1, iB + 1]) mur([off(i, -(S[i].w + 4.5)), off(i, S[i].w + 4.5)], -12, S[i].y, mRocheS);

        // la voûte de la salle : un champ de facettes, bas le long des parois (8 m au-dessus de la passerelle), haut au milieu (plus de 12 m) ; les puits de lumière y sont laissés ouverts
        const PU = [[259.7, 453, 6.5], [203, 428.5, 8], [224.5, 477.5, 4], [233.7, 445, 5.5]]; PUITS = PU;   // puits [x, z, rayon] : au-dessus du gros rocher (dans l'axe de la sortie de la galerie), de la plage (le soleil tombe 5 m plus au nord), du bassin secondaire, du second rocher (à droite de la dernière ligne droite)
        const dMur = (x, z) => { let b = 1e9; for (const p of SALLE) b = Math.min(b, Math.hypot(p[0] - x, p[1] - z)); return b; }, plaf = (x, z) => 2 + 4.6 * ss(2, 20, dans(SALLE, x, z) ? dMur(x, z) : 0);
        { const xs = SALLE.map(p => p[0]), zs = SALLE.map(p => p[1]), x0 = Math.min(...xs) - 6, z0 = Math.min(...zs) - 6, nx = Math.ceil((Math.max(...xs) + 6 - x0) / 4), nz = Math.ceil((Math.max(...zs) + 6 - z0) / 4), pos = [], uv = [], cl = [];
          const V = (a, b) => { const x = x0 + a * 4 + 2.4 * (hz(a, b + 7) - 0.5), z = z0 + b * 4 + 2.4 * (hz(a + 3, b) - 0.5); return [x, plaf(x, z) + 1.1 * hz(a * 3 + 1, b * 5 + 2), z]; };
          for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const q = [V(a, b), V(a + 1, b), V(a, b + 1), V(a + 1, b + 1)], cx = (q[0][0] + q[3][0]) / 2, cz = (q[0][2] + q[3][2]) / 2;
            if (PU.some(([x, z, r]) => Math.hypot(cx - x, cz - z) < r + 2.2) || !(dans(SALLE, cx, cz) || dMur(cx, cz) < 7)) continue;
            [[0, 1, 2], [1, 3, 2]].forEach((t, f) => { C3.set(teinte(a + f * 2, b * 7 + a, K * 0.85)); for (const k of t) { pos.push(...q[k]); uv.push(q[k][0] / 8, q[k][2] / 8); cl.push(C3.r, C3.g, C3.b); } }); }
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.computeVertexNormals();
          const me = new THREE.Mesh(g, mRocV); me.castShadow = me.receiveShadow = true; h.scene.add(me); VOUTE = g; }
        // chaque puits : un col de roche du plafond jusqu'au-dessus de la butte (sa lèvre basse passe sous les facettes voisines), des lianes qui pendent de la lèvre, des buissons au bord, en haut
        const VERTL = [0x6aa832, 0x4f8a2a, 0x86b83a, 0x3f7a22];
        PU.forEach(([x, z, r], n) => { const yl = plaf(x, z) - 0.4, cols = [];
          for (let k = 0; k <= 14; k++) { const a = (k % 14) / 14 * 6.2832, c = Math.cos(a), sn = Math.sin(a), rr = r + 0.9 * (hz(k % 14, n + 80) - 0.5), P2 = (d, y, t) => [x + c * (rr + d), y, z + sn * (rr + d), t]; cols.push([P2(6, yl + 3.6, teinte(k, n, K * 0.75)), P2(0, yl, teinte(k + 1, n, K)), P2(0.4, YT + 0.5, SOL), P2(2.5, YT - 0.2, SOL)]);
            if (k < 14) { buisson(x + c * (rr + 1.6), z + sn * (rr + 1.6), 1.6 + rnd() * 1.4, 1.8 + rnd() * 1.6, YT - 0.3, VERTL[k % 4]);
              for (let j = 0; j < 2; j++) { const lx = x + c * (rr - 0.25) + (rnd() - 0.5), lz = z + sn * (rr - 0.25) + (rnd() - 0.5), bas = ecart(lx, lz) < 1.2 ? 0.7 : EAU + 1.5, l = Math.min(yl + 0.6 - bas, 1.5 + rnd() * rnd() * 7), e = 0.22 + rnd() * 0.16; cube(lx, yl + 0.6 - l / 2, lz, rnd() * 3, e, l, e, VERTL[(k + j) % 4]); } } }
          peau(cols); });
        // la butte de roche et de terre au-dessus de la salle : un dessus plat percé des puits, un talus jusqu'au sol, la forêt dessus
        { const xs = SALLE.map(p => p[0]), zs = SALLE.map(p => p[1]), mx = (Math.min(...xs) + Math.max(...xs)) / 2, mz = (Math.min(...zs) + Math.max(...zs)) / 2, ax = (Math.max(...xs) - Math.min(...xs)) / 2, az = (Math.max(...zs) - Math.min(...zs)) / 2;
          const f = Math.max(...SALLE.map(p => Math.hypot((p[0] - mx) / ax, (p[1] - mz) / az))) * 1.06, E = (k, d = 0) => { const a = k / 32 * 6.2832, j = 1 + 0.06 * (hz(k % 32, 91) - 0.5); return [mx + Math.cos(a) * (ax * f * j + 5 + d), mz + Math.sin(a) * (az * f * j + 5 + d)]; };
          nappe(Array.from({ length: 32 }, (_, k) => E(k)), YT, mSol, 12, PU.map(([x, z, r]) => Array.from({ length: 14 }, (_, k) => [x + Math.cos(k / 14 * 6.2832) * (r + 0.6), z + Math.sin(k / 14 * 6.2832) * (r + 0.6)])));
          peau(Array.from({ length: 33 }, (_, k) => { const a = E(k), b = E(k, 6), c = E(k, 14); return [[a[0], YT, a[1], SOL], [b[0], YT * 0.55, b[1], 0x9aa070], [c[0], -0.3, c[1], SOL]]; }));
          for (let k = 0; k < 70; k++) { const a = rnd() * 6.2832, u = Math.sqrt(rnd()), x = mx + Math.cos(a) * (ax * f + 12) * u, z = mz + Math.sin(a) * (az * f + 12) * u, d = Math.hypot((x - mx) / (ax * f + 5), (z - mz) / (az * f + 5));
            if (PU.some(([px, pz, r]) => Math.hypot(x - px, z - pz) < r + 12)) continue; arbre(x, z, 12 + rnd() * 5, 9 + rnd() * 3, 0x3a5e2a, d < 1 ? YT : YT * Math.max(0, 1 - (d - 1) * 6)); } }

        // l'eau : une nappe claire et transparente sur un fond pâle (on voit les rochers posés dessus) ; la voûte la tient à l'ombre, elle ne renvoie pas le ciel
        const BASSIN = [...Array.from({ length: iB - iA + 3 }, (_, k) => off(iA - 1 + k, -(S[iA - 1 + k].w + E0(iA) + bassinG(iA - 1 + k) + 3))), ...RIVE.map((p, k) => [p[0] - DR[kR + k][0] * 3, p[1] - DR[kR + k][1] * 3]).reverse()];
        const fond = (poly, y, c) => { const me = nappe(poly, y, mRocV, 6), n = me.geometry.attributes.position.count, cl = new Float32Array(n * 3); C3.set(c); for (let k = 0; k < n; k++) cl.set([C3.r, C3.g, C3.b], k * 3); me.geometry.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); return me; };
        nappe(BASSIN, -9.3, col(0x4fc8c0, { lum: 1 }), 10);   /* le fond renvoie le jour : un turquoise clair qui porte sa lumière, sur lequel les rochers se découpent */ nappe(BASSIN, EAU, grain('#2fc0c8', ['#3ccdd2', '#27b2bc'], { lisse: 1, transparent: true, opacity: 0.55, depthWrite: false }), 10);

        // la plage : dans la poche du fond, dans l'axe de la dernière ligne droite de la passerelle ; sable 70 cm au-dessus de l'eau, qui descend sous l'eau en pente douce
        const kS = RIVE.findIndex(p => p[0] < 229), iF = P(32) - 4, [fx, fz] = off(iF, S[iF].w + 5);
        const AVANT = [...Array.from({ length: iB - 2 - iF + 1 }, (_, k) => off(iB - 2 - k, S[iB - 2 - k].w + 5)), [fx + 1, fz - 9], [fx - 3, fz - 19], RIVE[kS]], PLG = [...RIVE.slice(kS + 1), ...AVANT];
        const dAv = (x, z) => { let b = 1e9; for (const p of AVANT) b = Math.min(b, Math.hypot(p[0] - x, p[1] - z)); return b; }, ySable = (x, z) => -6.3 + 2.4 * ss(1, 16, dAv(x, z));   // le sable monte vers la paroi du fond : on le voit de face depuis la passerelle
        { const me = nappe(PLG, 0, mSable, 10), at = me.geometry.attributes.position; for (let k = 0; k < at.count; k++) at.setY(k, ySable(at.getX(k), at.getZ(k))); me.geometry.computeVertexNormals(); }
        { const sg = (() => { const [a, b] = AVANT, l = Math.hypot(b[0] - a[0], b[1] - a[1]), m = [(a[0] + b[0]) / 2 + (b[1] - a[1]) / l, (a[1] + b[1]) / 2 - (b[0] - a[0]) / l]; return dans(PLG, m[0], m[1]) ? -1 : 1; })();   // le côté de l'eau
          peau(AVANT.map((p, k) => { const a = AVANT[Math.max(0, k - 1)], b = AVANT[Math.min(AVANT.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = sg * (b[1] - a[1]) / l, nz = -sg * (b[0] - a[0]) / l; return [[p[0], -6.3, p[1], 0xcdbb8e], [p[0] + nx * 2, -6.75, p[1] + nz * 2, 0xc8b88c], [p[0] + nx * 5, -7.9, p[1] + nz * 5, 0xbfb48a]]; })).castShadow = false; }
        for (const [x, z, t] of [[205, 420.5, 0.7], [211, 417, 0.55], [200.5, 425.5, 0.55]]) coco(x, z, ySable(x, z) - 0.1, t);
        for (const [x, z, r] of [[207, 423.5, 0.6], [203.5, 421.5, 2.2], [209.5, 420.5, 4]]) GENS.push([x, ySable(x, z), z, r, 0, 0]);   // deux ou trois baigneurs sur la plage du cénote (CN-6)

        // rochers : le gros rocher du milieu et deux plus petits, des blocs clairs posés sur le fond (certains affleurent ou émergent), d'autres au pied de la plage
        const ROC = [], RT = [0xe6dcc0, 0xd2c29c, 0xbca67a, 0xc8c0a8], roc = (x, y, z, sc) => ROC.push([x, y, z, rnd() * 6.28, sc * (0.8 + rnd() * 0.5), sc * (0.7 + rnd() * 0.6), sc * (0.8 + rnd() * 0.5), RT[rnd() * 4 | 0]]);
        for (const [x, z, k] of [[262, 449, 1.15], [236, 441, 0.9], [277, 440, 0.45]]) [[-9, 5.2], [-7.4, 4.4], [-5.8, 3.4], [-4.9, 2.2]].forEach(([y, sc], j) => ROC.push([x + (hz(j, x) - 0.5) * 2.4 * k, EAU + (y - EAU) * k - (1 - k) * 1.2, z + (hz(j, z) - 0.5) * 2.4 * k, hz(j, x + z) * 6, sc * k, sc * k * 0.8, sc * k * (0.8 + 0.3 * hz(j, 3)), RT[j % 4]]));
        { const xs = SALLE.map(p => p[0]), zs = SALLE.map(p => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), dx = Math.max(...xs) - x0, dz = Math.max(...zs) - z0;
          for (let k = 0; k < 420; k++) { const x = x0 + rnd() * dx, z = z0 + rnd() * dz; if (!dans(SALLE, x, z) || dans(PLG, x, z) || ecart(x, z) < 1.5) continue; const sc = 0.7 + rnd() * rnd() * 2.2; roc(x, -9.1 + sc * 0.5 + rnd() * 0.9, z, sc); } }
        for (let k = 0; k < AVANT.length; k += 2) roc(AVANT[k][0] + (rnd() - 0.5) * 3, -7.3 + rnd() * 0.5, AVANT[k][1] + (rnd() - 0.5) * 3, 0.6 + rnd() * 0.9);
        colore(inst(h, h.geo('rocher'), PEAU.feuille, ROC), ROC);

        // stalactites : des cônes de roche épais (pas d'aiguilles : elles scintillaient), enfoncés dans la voûte, jamais plus bas que 6,6 m au-dessus de la passerelle ; matière de roche ordinaire, éclairée comme le reste
        { const stal = [], xs = SALLE.map(p => p[0]), zs = SALLE.map(p => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), dx = Math.max(...xs) - x0, dz = Math.max(...zs) - z0;
          for (let k = 0; k < 230; k++) { const x = x0 + rnd() * dx, z = z0 + rnd() * dz; if (!dans(SALLE, x, z) || dMur(x, z) < 1.5 || PU.some(([px, pz, r]) => Math.hypot(x - px, z - pz) < r + 3)) continue;
            const y = plaf(x, z) + 1.2, l = Math.min(2.2 + rnd() * rnd() * 5.5, ecart(x, z) < 1.5 ? y - 0.7 : 99), e = 0.45 + l * 0.17 + rnd() * 0.3; stal.push([x, y, z, rnd() * 6, e, l, e, teinte(k, k * 3, K * (0.7 + 0.2 * rnd()))]); }
          colore(inst(h, new THREE.ConeGeometry(1, 1, 5).rotateX(Math.PI).translate(0, -0.5, 0), grain('#f2eee2', ['#dcd6c4', '#fffaf0', '#c2bcaa']), stal), stal); }

        // la passerelle : planches sur toute la traversée couverte, chants et pilotis au-dessus de l'eau, garde-corps des deux côtés, lanternes sur poteaux (des objets : un verre ambré, sans halo)
        { const mPl = h.mat('planchesMuelle', { side: D, c: 0xd6b48a, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), a = tT + 1, n = t1 - tT - 2, POT = [], verre = [];
          h.ribbon(a, n, s => -(s.w + 0.9), 0.035, s => s.w + 0.9, 0.035, mPl, 8);
          for (const sg of [-1, 1]) { h.ribbon(iA - 1, iB - iA + 2, s => sg * (s.w + 0.9), 0.035, s => sg * (s.w + 0.9), -0.55, mBois, 6);
            for (const y of [1.05, 0.58]) h.ribbon(a, n, s => sg * (s.w + 0.5), y, s => sg * (s.w + 0.5), y - 0.16, mBois, 6);
            for (let i = a; i <= a + n; i += 2) { const s = S[i], [x, z] = off(i, sg * (s.w + 0.5)); POT.push([x, s.y - 0.1, z, 0, 1.5, 1.2, 1.5]); if (salle(i) && i % 6 === 0) { const [px, pz] = off(i, sg * (s.w + 0.6)); POT.push([px, EAU - 2, pz, 0, 2.6, s.y - EAU + 2, 2.6]); } } }
          for (let i = tT + 5; i < t1 - 3; i += 9) for (const sg of salle(i) ? [-1] : [-1, 1]) { const s = S[i], [x, z] = off(i, sg * (s.w + 0.5)); POT.push([x, s.y - 0.1, z, 0, 1.9, 3.7, 1.9]); verre.push([x, s.y + 3.9, z, face(s, sg), 0.5, 0.62, 0.5]); cube(x, s.y + 4.3, z, face(s, sg), 0.78, 0.14, 0.78, 0x2a2622); cube(x, s.y + 3.56, z, face(s, sg), 0.6, 0.1, 0.6, 0x2a2622); h.lum(i, x - sg * s.tz * -0.8, s.y + 3.6, z + sg * s.tx * -0.8, 0xffb45a, 20, 1.25); }
          inst(h, h.geo('boite', 1, 1, 1), col(0xffc266, { lum: 1 }), verre).castShadow = false; POT.forEach(p => L.poteaux.push(p)); }

        // rayons : une colonne de jour très légère sous chaque puits, dans la direction vraie du soleil ; ni halo ni tache au sol (la tache est celle du vrai soleil)
        { const SD = new THREE.Vector3(...h.TH.astre.dir).normalize(), mR = h.addMat(h.tx('degrade', '#fff0c4', 1), { opacity: 0.06, polygonOffset: false }), Lr = (YT - EAU) / SD.y;   /* trois colonnes emboîtées : le bord du rayon se fond au lieu de se découper */
          for (const [x, z, r] of PU) for (const f of [0.85, 0.6, 0.35]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * f, r * f * 1.12, Lr, 14, 1, true), mR); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), SD.clone().negate()); m.position.set(x, YT, z).addScaledVector(SD, -Lr / 2); m.scale.y = -1; h.scene.add(m); } }

        // la forêt au-dessus des tranchées et des galeries
        for (let i = jz + 4; i < jx - 2; i += 3) if (!salle(i)) for (const sg of [-1, 1]) { const s = S[i], [x, z] = off(i, sg * (s.w + 6 + rnd() * 5)); arbre(x, z, 13 + rnd() * 6, 10 + rnd() * 3, 0x3a5e2a, sous(i) ? s.y + 8 : 0.3); }
      }

      // (le cénote ouvert de la première version est retiré : cénote v3 sans lac)
      // front de mer du bourg, vu de la voie retour du muelle : des pavillons de plage à toit de palmes tournés vers la mer cachent le dos des maisons
      for (let x = 556; x <= 705; x += 29) { RL[3].push([x, 0, -27, 0, 1, 1, 1, CR[(x / 29 | 0) % CR.length]]); coco(x + 14, -31); coco(x + 15, -22); }
      // au pied des rampes du muelle (avant et après) : étals, cocotiers, barques ; rien de vide entre la plage, le muelle et le bourg
      for (const [a, b] of [[P(3) - 2, P(4) - 4], [P(10) + 4, i11 + 2]]) for (let i = a; i < b; i += 5) for (const sg of [-1, 1]) { const s = S[i], [x, z] = off(i, sg * (s.w + 3.2)), [cx, cz] = off(i + 2, sg * (s.w + 7)); if (z < -40) continue; L.etals.push([x, -0.05, z, face(s, sg), 1, 1, 1, FETE[(i + (sg > 0)) % 3]]); coco(cx, cz); }
      // T-6 : la supérette à la sortie de la halle (demande de l'auteur : un OXXO), bandeau rouge et jaune
      { const i = i20 + 28, s = S[i], [x, z] = off(i, s.w + 9), [fx, fz] = off(i, s.w + 4.42), r = face(s, 1); cube(x, 2.2, z, r, 15, 4.4, 9, 0xf4f0e8); cube(fx, 3.75, fz, r, 15.1, 1.3, 0.3, 0xd8271c); cube(fx, 2.95, fz, r, 15.1, 0.25, 0.32, 0xf2c230); cube(fx, 1.4, fz, r, 9, 2.2, 0.2, 0x2a3a4a);
        const [tx, tz] = off(i, s.w + 4.0), b = boite(h, h.mat('ecrit', { lum: 1 }, 96, 28, '#d8271c', '#ffe14a', 'XOXO', 24), 6.5, 1.25, 0.12, tx, 3.75, tz); b.rotation.y = r; } // enseigne inventée (pas la vraie marque), à plat sur la façade
      // ---------- la halle (X-9) : franges de hamacs aux deux pignons, piñatas sous le faîtage, marchandises sur les étals ----------
      for (const i of [i18, i20]) { const s = S[i], n = Math.round((s.w + 8) / 1.5); for (let k = -n; k <= n; k++) { if (Math.abs(k * 1.5) < s.w - 1) continue; const [x, z] = off(i, k * 1.5); cube(x, s.y + 3.7, z, face(s, 1) + 1.5708, 0.12, 1.9, 1.3, [0xf6f2e8, ROSE, TURQ, JAUNE, 0xff6a2b][(k + 40) % 5]); } }
      { const pin = []; for (let i = i18 + 6; i < i20; i += 7) { const s = S[i]; pin.push([s.x, s.y + 7.6, s.z, rnd() * 6, 1.3, 1.3, 1.3, FETE[(i / 7 | 0) % 3]]); } PIN.push(...pin);
        chaque([i18, i20 - i18], 4, (s, i) => { for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) { const [x, z] = off(i + k - 1, sg * (s.w + 3.3)); cube(x, s.y + 1.05 + (k % 2) * 0.08, z, rnd() * 3, 0.7, 0.3 + (k % 2) * 0.25, 0.7, [0xd8b96a, 0x2c4fa3, 0xd8362a, 0xd8b96a, 0xf2c230][(i + k) % 5]); } }); }

      // ---------- la plage (X-6) : palapas et transats sur les terrasses des hôtels, piquets à corde côté mer, barques de la procession au large, ferry, Cozumel ----------
      chaque(plageT, 7, (s, i) => { if (s.k > 0.011) return; const [x, z] = off(i, s.w + 9.4); L.palapas.push([x, z, 2.3, 2.3]); for (const e of [-1.6, 1.6]) L.transats.push([x + e, 0.12, z + 0.4, face(s, 1) + 1.5708, 1, 1, 1, FETE[i % 3]]); });
      chaque(tr(43, 3, -4, -2), 4, (s, i) => { const [x, z] = off(i, -(s.w + 0.7)); if (dPlace(x, z) > 2 && z > -40) L.poteaux.push([x, -0.3, z, 0, 1.1, 1.7, 1.1]); });
      // la limite roulable se voit : corde jaune entre les piquets côté mer, et corde sur piquets autour de la place de sable là où elle dépasse de la piste
      { const [i0, n] = tr(43, 3, -4, -2), o = s => -(s.w + 0.7), mCorde = col(JAUNE, { side: D }); ruban(i0, n, o, 1.15, o, 0.9, mCorde, i => { const [x, z] = off(i, o(S[i])); return dPlace(x, z) > 2 && z > -40; }, 6);
        const dB = (x, z) => { let b = 1e9; for (let i = 0; i < N; i += 2) { const s = S[i], d = Math.hypot(s.x - x, s.z - z) - s.w; if (d < b) b = d; } return b; }, arc = [];
        for (let a = 0; a <= 360; a += 3) { const x = PX + Math.cos(a / 57.3) * (PL.r + 0.5), z = PZ + Math.sin(a / 57.3) * (PL.r + 0.5); if (dB(x, z) > 1.5) { arc.push([x, 1.15, z]); if (a % 6 === 0) L.poteaux.push([x, -0.3, z, 0, 1.1, 1.7, 1.1]); } else { if (arc.length > 1) guirlande(arc.slice(), 0.25, mCorde, 2); arc.length = 0; } }
        if (arc.length > 1) guirlande(arc, 0.25, mCorde, 2); }
      for (let k = 0; k < 7; k++) L.barques.push([250 + k * 22, -0.45, -96 - (k % 2) * 7, Math.PI, 1, 1, 1, FETE[k % 3]]);
      pose('ferry', 80, -0.3, -380, 0.2); cube(300, 6, -1700, 0, 1900, 14, 80, 0x4e7a70);
      // véhicules garés (statique) : mototaxis dans la rue, pick-up de la 307
      for (const [i, sd] of [[i12 + 10, 1], [P(15), -1], [P(16) + 6, 1], [i17 + 4, -1]]) { const s = S[i], [x, z] = off(i, sd * (s.w - 1.4)); L.motos.push([x, s.y, z, face(s, sd) + 1.5708, 1, 1, 1, FETE[i % 3]]); }
      // cumulus de midi au-dessus de la terre
      { const nu = []; for (let k = 0; k < 30; k++) { const a = rnd() * 3.14, r = 1300 + rnd() * 700; nu.push([300 + Math.cos(a) * r, 240 + rnd() * 220, 300 + Math.sin(a) * r, rnd() * 6, 100 + rnd() * 120, 34 + rnd() * 30, 70 + rnd() * 70]); } inst(h, h.geo('buisson'), col(0xf8fbff, { lum: 1, fog: false }), nu).castShadow = false; }
      // ---------- plage plus habitée : côté mer, palapas à transats, lanchas tirées au sec et cocotiers entre la corde et l'eau ; à la sortie du muelle, cabanes, palapas, barques et cocotiers des deux côtés jusqu'au bourg ----------
      chaque(plageT, 3, (s, i, k) => { const [x, z] = off(i, -(s.w + 3 + rnd() * 7)); if (z < -34 || ecart(x, z) < 2.5) return;
        if (k % 12 === 9) L.barques.push([x, -0.05, z, rnd() * 6.28, 1, 1, 1, FETE[k % 3]]); else if (k % 6 === 3) coco(x, z); else { L.palapas.push([x, z, 2.1, 2.3]); for (const e of [-1.5, 1.5]) L.transats.push([x + e, 0.12, z + 0.4, face(s, -1) + 1.5708, 1, 1, 1, FETE[(i + k) % 3]]); } });
      for (let i = P(3) - 2; i < P(4) + 8; i += 3) for (const d of [10 + rnd() * 5, 20 + rnd() * 7, 31 + rnd() * 8, 43 + rnd() * 10]) { const s = S[i], [x, z] = off(i, s.w + d), r = rnd(); if (z < -36 || ecart(x, z) < 3 || dans(BOURG, x, z)) continue;
        if (r < 0.3) coco(x, z); else if (r < 0.45) L.barques.push([x, -0.05, z, rnd() * 6.28, 1, 1, 1, FETE[i % 3]]); else if (r < 0.75) { cube(x, 1.3, z, face(s, 1), 3.4, 2.6, 3, [0x35a79a, 0xe8b84a, 0xe07a9c, 0xefe3c8][i % 4]); L.palapas.push([x, z, 3.2, 3.1]); } else { L.palapas.push([x, z, 2.1, 2.3]); for (const e of [-1.5, 1.5]) L.transats.push([x + e, 0.12, z + 0.4, face(s, 1) + 1.5708, 1, 1, 1, FETE[i % 3]]); } }
      let PISC = null; for (let i = P(10) + 2; i < i11 + 10 && !PISC; i += 2) for (const sg of [1, -1]) { const s = S[i], [x, z] = off(i, sg * (s.w + 24)); if (!PISC && z > -24 && ecart(x, z) > 17 && !dans(BOURG, x, z)) PISC = [x, z, face(s, sg), i, sg]; }
      if (PISC) { const [x, z, a, i, sg] = PISC, ca = Math.cos(a), sa = Math.sin(a), loc = (u, v) => [x + u * ca + v * sa, z - u * sa + v * ca]; L.piscines.push([x, 0, z, a, 1.7, 1, 1.7]);   // piscine de resort : bassin, transats et palapas autour, cocotiers, l'hôtel derrière
        for (let k = -3; k <= 3; k++) for (const v of [-9, 9]) { const [tx, tz] = loc(k * 3.6, v); if (ecart(tx, tz) < 2.5) continue; L.transats.push([tx, 0.12, tz, a + (v > 0 ? 0 : Math.PI), 1, 1, 1, FETE[(k + 3) % 3]]); if (k % 2 === 0) L.palapas.push([...loc(k * 3.6 + 1.8, v + Math.sign(v) * 1.2), 2.1, 2.3]); }
        for (const [u, v] of [[-15, -8], [-15, 8], [15, -8], [15, 8], [-16, 0], [16, 0]]) { const [cx, cz] = loc(u, v); if (ecart(cx, cz) > 2.5) coco(cx, cz); }
        { const [hx, hz2] = off(i, sg * (S[i].w + 47)); if (ecart(hx, hz2) > 14 && !dans(BOURG, hx, hz2)) RL[1].push([hx, 0, hz2, a, 1, 1, 1, CR[2]]); } }
      const loinP = (x, z) => !PISC || Math.hypot(x - PISC[0], z - PISC[1]) > 19;
      for (let i = P(10); i < i11 + 12; i += 3) for (const sg of [-1, 1]) for (const d of [9 + rnd() * 6, 19 + rnd() * 10]) { const s = S[i], [x, z] = off(i, sg * (s.w + d)), r = rnd(); if (z < -36 || ecart(x, z) < 3 || dans(BOURG, x, z) || !loinP(x, z)) continue;
        if (r < 0.3) coco(x, z); else if (r < 0.48) L.barques.push([x, -0.05, z, rnd() * 6.28, 1, 1, 1, FETE[i % 3]]); else if (r < 0.72) { cube(x, 1.3, z, face(s, sg), 3.4, 2.6, 3, [0x35a79a, 0xe8b84a, 0xe07a9c, 0xefe3c8][i % 4]); L.palapas.push([x, z, 3.2, 3.1]); } else { L.palapas.push([x, z, 2.1, 2.3]); for (const e of [-1.5, 1.5]) L.transats.push([x + e, 0.12, z + 0.4, face(s, sg) + 1.5708, 1, 1, 1, FETE[i % 3]]); } }
      inst(h, h.geo('toitPalapa'), mChaume, L.palapas.map(([x, z, r, y]) => [x, y, z, 0, r, r * 0.6, r])).castShadow = true; L.palapas.forEach(([x, z, r, y]) => L.poteaux.push([x, -0.2, z, 0, 1.3, y + 0.3, 1.3]));
      insts(h, 'transat', PEAU, L.transats, { teinte: 'toile' }); insts(h, 'pickup', PEAU, L.pickups, { teinte: 'caisse' }); insts(h, 'mototaxi', PEAU, L.motos, { teinte: 'caisse' });
      RES.forEach(([Lg, Nv], v) => insts(h, 'resort', PEAU, RL[v], { a: [Lg, Nv], teinte: 'crepi' })); insts(h, 'piscine', PEAU, L.piscines);
      // =====================================================================================================================
      // La vie (propositions/VIE-plage.md) : eau, lumière, mécanique, vivant, réactions à la course. Numéros entre parenthèses : ceux de la proposition.
      // Un seul vent, la brise de mer, du nord vers le sud (+z). Tout avance sur dt : la pause fige tout. Hasard : hz (fixe) ou Math.random, jamais rnd (le décor validé ne bouge pas).
      // Rien n'est percutable, rien ne se pose dans ce qui se roule (ecart).
      // =====================================================================================================================
      let TV = 0; VIE.push(dt => { TV += dt; });   // l'horloge de la vie, en secondes
      const met = (ms, k, x, y, z, ry = 0, e = 1, ey = e, rx = 0, rz = 0, ez = e) => { D0.position.set(x, y, z); D0.rotation.set(rx, ry, rz); D0.scale.set(e, ey, ez); D0.updateMatrix(); for (const m of ms) m.setMatrixAt(k, D0.matrix); };
      const cache = (ms, k) => met(ms, k, 0, -99, 0, 0, 1e-4), maj = ms => { for (const m of ms) m.instanceMatrix.needsUpdate = true; };
      const vifs = (nom, list, o, peau = PEAU) => insts(h, nom, peau, list, o).map(dyn);   // un lot qui bouge : hors fusion, hors redécoupage
      const AX = new THREE.Vector3(1, 0, 0), DV = new THREE.Vector3(), tend = (m, k, ax, ay, az, bx, by, bz) => { DV.set(bx - ax, by - ay, bz - az); const l = DV.length() || 1; D0.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); D0.quaternion.setFromUnitVectors(AX, DV.divideScalar(l)); D0.scale.set(l, 1, 1); D0.updateMatrix(); m.setMatrixAt(k, D0.matrix); }; // un fil tendu de a à b (boîte de 1 m le long de X)
      const cap = (dx, dz) => Math.atan2(-dz, dx);   // rotation Y qui tourne +X vers (dx, dz)
      const COULE = [], coule = (m, u, v) => { COULE.push([m.map, u, v]); return m; };   // une texture qui glisse (répétitions par seconde), comme l'eau de chapada
      VIE.push(dt => { for (const [t, u, v] of COULE) { t.offset.x = (t.offset.x + u * dt) % 1; t.offset.y = (t.offset.y + v * dt) % 1; } });
      const flot = (g, m, x, y, z) => { const o = dyn(new THREE.Mesh(g, m)); o.position.set(x, y, z); h.scene.add(o); return o; };
      // grains : un nuage de points. nait(k) rend [x, y, z, vx, vy, vz, vie]. o = { taille, c, op, add, g (pesanteur), map, coul (teintes par point), fondu (le grain s'allume puis s'éteint, en additif), vers ([de, à] : le grain passe d'une teinte à l'autre en vieillissant), continu }.
      // Sans `continu`, les grains attendent une salve.
      const grains = (n, nait, o = {}) => {
        const Pp = new Float32Array(n * 3).fill(-999), Vt = new Float32Array(n * 3), A = new Float32Array(n).fill(1e9), Vi = new Float32Array(n).fill(1), C = o.coul || o.fondu || o.vers ? new Float32Array(n * 3) : null, VA = o.vers && o.vers.map(c => new THREE.Color(c)), geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(Pp, 3)); if (C) { if (o.coul) for (let k = 0; k < n; k++) C.set(o.coul[k % o.coul.length], k * 3); geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); }
        const pts = dyn(new THREE.Points(geo, new THREE.PointsMaterial({ size: o.taille || 0.2, color: o.c ?? 0xffffff, map: o.map || null, vertexColors: !!C, transparent: true, opacity: o.op ?? 1, depthWrite: false, blending: o.add || o.fondu ? THREE.AdditiveBlending : THREE.NormalBlending }))); pts.renderOrder = 5; h.scene.add(pts);
        const lance = k => { const r = nait(k); Pp.set([r[0], r[1], r[2]], k * 3); Vt.set([r[3], r[4], r[5]], k * 3); Vi[k] = r[6]; A[k] = 0; };
        if (o.continu) for (let k = 0; k < n; k++) { lance(k); A[k] = hz(k, 71) * Vi[k]; for (let j = 0; j < 3; j++) Pp[k * 3 + j] += Vt[k * 3 + j] * A[k]; }
        VIE.push(dt => { for (let k = 0; k < n; k++) { if (A[k] > Vi[k]) { if (!o.continu) { Pp[k * 3 + 1] = -999; continue; } lance(k); } A[k] += dt; if (o.g) Vt[k * 3 + 1] -= o.g * dt; for (let j = 0; j < 3; j++) Pp[k * 3 + j] += Vt[k * 3 + j] * dt;
            if (o.fondu) C[k * 3] = C[k * 3 + 1] = C[k * 3 + 2] = o.fondu * Math.sin(Math.PI * Math.sqrt(Math.min(1, A[k] / Vi[k])));
            if (VA) { const u = Math.min(1, A[k] / Vi[k]) ** 1.5; C[k * 3] = VA[0].r + (VA[1].r - VA[0].r) * u; C[k * 3 + 1] = VA[0].g + (VA[1].g - VA[0].g) * u; C[k * 3 + 2] = VA[0].b + (VA[1].b - VA[0].b) * u; } }
          geo.attributes.position.needsUpdate = true; if (o.fondu || VA) geo.attributes.color.needsUpdate = true; });
        return { salve: () => { for (let k = 0; k < n; k++) lance(k); } };
      };
      const alea = (a = 1) => (Math.random() - 0.5) * a, brumeTx = h.tx('brume');
      // fumée : des bouffées grises qui montent de ht mètres et que le vent couche vers le sud ; en vieillissant elles prennent la teinte `vers` (celle du ciel pour un panache lointain : il s'y fond)
      const fumee = (x, y, z, ht, taille, n = 14, op = 0.4, vers = [0x8c8c88, 0xe6e6e2]) => grains(n, () => { const vy = ht / (5 + ht * 0.14); return [x + alea(taille * 0.3), y, z + alea(taille * 0.3), alea(0.3), vy, 0.5 + ht * 0.03, ht / vy]; }, { taille, map: brumeTx, op, vers, continu: 1 });
      const pres = (car, i0, a = 24) => { if (!car) return false; const e = (i0 - car.idx + N) % N; return e > 0 && e < a; }, loin = (car, i0) => { if (!car) return true; const e = (i0 - car.idx + N) % N; return e > 300 && e < N - 300; };

      // ---------- l'eau ----------
      { // la mer (PL-1, MU-1) : rouleaux d'écume qui viennent du large et meurent sur la laisse, ressac, écume au pied des pilotis du bord
        const plan = (lx, lz, nx = 1, nz = 1) => new THREE.PlaneGeometry(lx, lz, nx, nz).rotateX(Math.PI / 2), mEc = (nom, k) => { const m = h.mat(nom, { lum: 1, transparent: true, depthWrite: false, side: D, rep: [72, 1] }); m.map.offset.x = k * 0.37; return m; };
        const rouleaux = [0, 1, 2, 3].map(k => flot(plan(1800, 1), mEc('ecumeLarge', k), 300, -0.04, -100)), ressac = flot(plan(1800, 1), mEc('ecumeMer', 5), 300, -0.03, -44);
        VIE.push(() => { rouleaux.forEach((o, k) => { const p = (TV / 15 + k / 4) % 1; o.position.z = -130 + 85 * p; o.scale.z = 4 + 7 * p; o.material.opacity = Math.min(1, p * 5, (1 - p) * 5); });
          const r = Math.sin(TV * 0.85); ressac.position.z = -44.4 + 2.1 * r; ressac.scale.z = 3.4 + 0.9 * r; });
        const pl = PIL.filter(p => p[2] < -46 && ![505, 515, 525].includes(p[0]))   /* les pilotis du bord seulement : sous le tablier, personne ne les voit */, ec = dyn(inst(h, h.geo('disque'), h.mat('peinture', { c: 0xffffff, lum: 1, transparent: true, opacity: 0.5, depthWrite: false }), pl.map(p => [p[0], -0.1, p[2], 0, 1]))); ec.castShadow = ec.receiveShadow = false;
        VIE.push(() => { pl.forEach((p, k) => met([ec], k, p[0], -0.1, p[2], 0, 0.8 + 0.55 * (0.5 + 0.5 * Math.sin(TV * 1.3 + k * 1.7)))); ec.instanceMatrix.needsUpdate = true; });
      }

      // ---------- la lumière ----------
      // reflets d'eau sur la voûte de la salle (CN-2) : deux couches de mailles claires, en additif, sur la géométrie de la voûte
      if (VOUTE) for (const [rep, u, v, op] of [[0.5, 0.008, 0.014, 0.13], [0.31, -0.011, 0.006, 0.1]]) { const m = coule(h.addMat(h.tx('caustique'), { opacity: op }), u, v); m.map.repeat.set(rep, rep); h.scene.add(new THREE.Mesh(VOUTE, m)); }
      { const eau = PUITS.map(([x, z, r]) => h.lum(near(h, x, z), x, EAU + 3, z, 0x7fe8dc, 14 + r, 1.6)), c0 = eau.map(l => l.c.clone());   // la lumière que l'eau renvoie sous chaque puits : un luminaire turquoise qui respire
        VIE.push(() => eau.forEach((l, k) => l.c.copy(c0[k]).multiplyScalar(0.75 + 0.25 * Math.sin(TV * 1.3 + k * 1.7)))); }

      // ---------- le mouvement mécanique ----------
      { // cerfs-volants au-dessus de la place de sable (PL-4) : amarrés aux lanchas et à la tour de sauvetage (les piles de la place), ils tirent vers le sud ; fil, losange, queue qui ondule
        const ca = Math.cos(PL.a), sa = Math.sin(PL.a), A = PL.piles.filter(p => p[4] === 'lancha' || p[4] === 'torre').map(([px, pz, , , nom]) => [PX + px * ca + pz * sa, nom === 'torre' ? 4.3 : 1.2, PZ - px * sa + pz * ca]), n = A.length, NQ = 9;
        const CV = [ROSE, JAUNE, TURQ, 0xff6a2b, 0x7a4bd6, 0xf6f2e8], blanc = col(0xffffff, { side: D, lum: 1 }), lc = A.map((a, k) => [0, -99, 0, 0, 1, 1, 1, CV[k % 6]]), lq = A.flatMap((a, k) => Array.from({ length: NQ }, (_, j) => [0, -99, 0, 0, 1, 1, 1, CV[(k + j) % 6]]));
        const toile = dyn(colore(inst(h, h.geo('boite', 3, 3, 0.05), blanc, lc), lc)), queue = dyn(colore(inst(h, h.geo('boite', 0.4, 0.4, 0.04), blanc, lq), lq)), fil = dyn(inst(h, h.geo('boite', 1, 0.04, 0.04), col(0xf6f2e8), lc));
        VIE.push(() => { A.forEach(([ax, ay, az], k) => { const H = 20 + (k * 5) % 10, x = ax + 2.6 * Math.sin(TV * 0.45 + k * 1.3), y = ay + H + 1.3 * Math.sin(TV * 0.8 + k), z = az + 1.6 * H + 1.6 * Math.sin(TV * 0.6 + k * 2);
            met([toile], k, x, y, z, 0, 1, 1, -0.5, 0.785 + 0.12 * Math.sin(TV * 1.1 + k)); tend(fil, k, ax, ay, az, x, y - 1.3, z + 0.6);
            for (let j = 0; j < NQ; j++) met([queue], k * NQ + j, x + 0.1 * (j + 1) * Math.sin(TV * 3.2 - j * 0.9 + k), y - 1.8 - j * 0.6, z + 0.9 + j * 0.33, 0, 1, 1, -0.5, TV * 2 + j); });
          maj([toile, queue, fil]); });
      }
      { // sous la halle (HA-5) : une piñata basse éclate en confettis au passage de la voiture
        const iP = i18 + 21, sP = S[iP]; PIN.push([sP.x, sP.y + 5.4, sP.z, 0, 1.7, 1.7, 1.7, ROSE]); const kP = PIN.length - 1, pin = dyn(colore(inst(h, h.geo('bouee'), col(0xffffff), PIN), PIN));
        const conf = grains(220, () => [sP.x + alea(1.5), sP.y + 5.4 + alea(1.2), sP.z + alea(1.5), alea(7), 1 + Math.random() * 4, alea(7), 2.2], { taille: 0.16, coul: [[0.91, 0.27, 0.55], [0.12, 0.71, 0.66], [0.95, 0.76, 0.19], [1, 1, 1]], g: 7 });
        let eclate = 0;
        VIE.push((dt, car) => { if (!eclate && pres(car, iP, 9)) { eclate = 1; conf.salve(); cache([pin], kP); pin.instanceMatrix.needsUpdate = true; } else if (eclate && loin(car, iP)) { eclate = 0; const p = PIN[kP]; met([pin], kP, p[0], p[1], p[2], p[3], p[4]); pin.instanceMatrix.needsUpdate = true; } });
      }
      for (let i = i12 + 2; i < i17 - 2; i += 10) { const s = S[i], y = Math.min(hFac(i, -1), hFac(i, 1)) + 0.9, o = s.w + 2.4, [x0, z0] = off(i, -o), [x1, z1] = off(i, o); h.lum(i, s.x, s.y + y - 1.2, s.z, 0xffd08a, 16, 0.4); guirlande([[x0, s.y + y, z0], [(x0 * 3 + x1) / 4, s.y + y - 0.7, (z0 * 3 + z1) / 4], [s.x, s.y + y - 0.95, s.z], [(x0 + x1 * 3) / 4, s.y + y - 0.7, (z0 + z1 * 3) / 4], [x1, s.y + y, z1]], 0.4, mAmp, 3); } // guirlandes d'ampoules en travers de la rue (RU-1)
      // fumées (RU-3, R7-2) : grills de la rue au bord du trottoir, brûlis au loin
      const BRAISES = []; for (const [i, sd] of [[440, -1], [468, 1], [494, -1]]) { const s = S[i], [x, z] = off(i, sd * (s.w + 0.7)); cube(x, s.y + 0.5, z, face(s, sd), 1, 1, 0.6, 0x3a3a3e); fumee(x, s.y + 1.2, z, 8, 3, 14, 0.6, [0x6a6a68, 0xdcdcd8]); BRAISES.push(h.lum(i, x, s.y + 1.2, z, 0xff7a20, 9, 0.7)); }
      { const c0 = BRAISES.map(l => l.c.clone()); VIE.push(() => BRAISES.forEach((l, k) => l.c.copy(c0[k]).multiplyScalar(0.7 + 0.3 * Math.abs(Math.sin(TV * 9 + k * 2) * Math.sin(TV * 5.3 + k))))); }   // la braise des grills éclaire le trottoir et vacille
      fumee(150, 8, 455, 80, 32, 34, 0.55, [0x6e6e6c, 0xc4e0ee]);   // dans l'axe de la ligne droite de la crête, derrière la butte du cénote

      // ---------- le vivant ----------
      // Les oiseaux : un lot posé et un lot en vol, aux mêmes rangs. Un oiseau tourne en rond (R), ou attend, posé ou caché, de s'envoler avec son groupe (ENV).
      const OIS = [], ENV = [], NOIR = 0x1e2024, GRIS = 0x2a3038;
      const ronde = (n, cx, cy, cz, R, w, e, c, bat, dy = 0) => { for (let k = 0; k < n; k++) OIS.push({ cx, cy: cy + (hz(k, cx) - 0.5) * 6, cz, R: R * (0.75 + 0.5 * hz(k, cz)), w: w * (0.85 + 0.3 * hz(k, 8)), ph: k / n * 6.2832 + hz(k, 9), e, c, bat, dy }); };
      const groupe = (liste, dec, lointain, o = {}) => { const ks = liste.map(b => OIS.push(b) - 1); ENV.push({ ks, dec, loin: lointain, T: 5, del: 0.05, bat: 14, en: 0, t: 9, ...o }); };
      ronde(6, 500, 17, 452, 12, 0.5, 2.6, 0x18181a, 0, 2);   // zopilotes qui tournent bas dans le couloir de la 307, entre les deux rangs d'arbres (R7-1)
      // mouettes posées sur la place de sable, à gauche de la piste : elles s'envolent vers le sud, en travers de la piste, quand la voiture approche (PL-9)
      groupe(Array.from({ length: 16 }, (_, k) => ({ pose: 1, x: 270 + (hz(k, 21) - 0.5) * 18, y: -0.05, z: 50 + (hz(k, 22) - 0.5) * 11, r: hz(k, 23) * 6.28, e: 2, c: 0xf4f4f0, vx: (hz(k, 24) - 0.5) * 8, vy: 3 + hz(k, 25) * 3, vz: 5 + hz(k, 26) * 4 })),
        car => !!car && Math.hypot(car.x - 270, car.z - 50) < 62, car => !car || Math.hypot(car.x - 270, car.z - 50) > 190);
      // hirondelles de grotte qui s'envolent de la tranchée, devant la bouche de la galerie, à l'approche (CE-2) ; au jour : dans l'ombre de la bouche on ne les voyait pas
      { const s = S[tT - 8]; groupe(Array.from({ length: 16 }, (_, k) => ({ x: s.x - s.tz * (hz(k, 41) - 0.5) * 8, y: s.y + 1.5 + hz(k, 42) * 3, z: s.z + s.tx * (hz(k, 41) - 0.5) * 8, e: 1.4, c: GRIS, vx: -s.tx * 9 + (hz(k, 43) - 0.5) * 5, vy: 3 + hz(k, 44) * 3, vz: -s.tz * 9 + (hz(k, 43) - 0.5) * 5 })), car => pres(car, tT - 8, 22), car => loin(car, tT), { T: 3.2, del: 0.06 }); }
      const PLU = { plumage: col(0xffffff, { side: D, lum: 1, transparent: true })   /* en aplat : éclairé par le dessous, un oiseau blanc sortait brun ; transparent : rythme.js ne le fait pas battre */, bec: col(0x2a2a2a, { side: D }) }, lo = OIS.map(o => [o.x || 0, -99, o.z || 0, 0, o.e, o.e, o.e, o.c]), oP = vifs('oiseauPose', lo, { teinte: 'plumage' }, PLU), oV = vifs('oiseau', lo, { teinte: 'plumage' }, PLU);
      OIS.forEach((o, k) => { cache(oV, k); o.pose ? met(oP, k, o.x, o.y, o.z, o.r, o.e) : cache(oP, k); });
      VIE.push((dt, car) => {
        OIS.forEach((o, k) => {
          if (o.R) { const a = o.ph + TV * o.w, sg = Math.sign(o.w); met(oV, k, o.cx + Math.cos(a) * o.R, o.cy + o.dy * Math.sin(TV * 0.4 + o.ph), o.cz + Math.sin(a) * o.R, cap(-sg * Math.sin(a), sg * Math.cos(a)), o.e, o.e * (o.bat ? Math.cos(TV * o.bat + k * 1.7) * 0.85 + 0.15 : 0.75 + 0.2 * Math.sin(TV * 1.3 + k))); }
        });
        for (const g of ENV) {
          if (!g.en && g.t >= g.T && g.dec(car)) { g.en = 1; g.t = 0; } else if (g.en && g.t >= g.T && g.loin(car)) { g.en = 0; for (const k of g.ks) { const o = OIS[k]; if (o.pose) met(oP, k, o.x, o.y, o.z, o.r, o.e); } }
          if (g.en && g.t < g.T) { g.t += dt; g.ks.forEach((k, j) => { const o = OIS[k], t = g.t - j * g.del; if (t <= 0) return; const y = o.y + o.vy * t, vu = g.t < g.T - 0.05;
              cache(oP, k); vu ? met(oV, k, o.x + o.vx * t, y, o.z + o.vz * t, cap(o.vx, o.vz), o.e, o.e * (Math.cos(TV * g.bat + k) * 0.85 + 0.15)) : cache(oV, k); }); }
        }
        maj(oP); maj(oV);
      });
      { // les flamants (LA-1) : deux lots aux mêmes rangs (debout, en vol). Le groupe du point 38 décolle à l'approche, traverse la digue au-dessus de la route et se repose de l'autre côté
        const FL = L.flamants, PV = { plume: col(0xf0836a, { side: D }), patte: col(0xe78a8c, { side: D }), bec: col(0x2a2a2a, { side: D }) }, fA = vifs('flamant', FL, { a: [0] }), fV = vifs('flamantVol', FL, {}, PV);
        const ici = FL.map(p => [p[0], p[2], p[3]]), but = (k0, i0) => Array.from({ length: 16 }, (_, j) => { const i = i0 + (hz(j, 51) * 16 | 0); return [...off(i, -(S[i].w + 15 + hz(j, 52) * 12)), 3.14 + hz(j, 53) * 0.6]; });
        const G = [{ k0: 16, i0: P(38), dec: car => pres(car, P(38), 30) }].map(g => ({ ...g, de: ici.slice(g.k0, g.k0 + 16), a: but(g.k0, g.i0), en: 0, t: 9, T: 4.6 }));
        const repose = k => { const p = ici[k]; met(fA, k, p[0], -1.2, p[1], p[2]); cache(fV, k); }; FL.forEach((p, k) => repose(k));
        VIE.push((dt, car) => { let ch = 0;
          for (const g of G) {
            if (!g.en && g.dec(car)) { g.en = 1; g.t = 0; } else if (g.en && g.t >= g.T && loin(car, g.i0)) { g.en = 0; ch = 1; for (let j = 0; j < 16; j++) { ici[g.k0 + j] = g.de[j]; repose(g.k0 + j); } }
            if (g.en && g.t < g.T) { g.t += dt; ch = 1; for (let j = 0; j < 16; j++) { const k = g.k0 + j, u = ss(0, 3.6, g.t - j * 0.06), d = g.de[j], a = g.a[j];
                if (u <= 0) continue; if (u >= 1) { if (ici[k] !== a) { ici[k] = a; repose(k); } continue; } ici[k] = null; cache(fA, k);
                met(fV, k, d[0] + (a[0] - d[0]) * u, 0.3 + 6.2 * Math.sin(Math.PI * u), d[1] + (a[1] - d[1]) * u, cap(a[0] - d[0], a[1] - d[1]), 1, Math.cos(TV * 9 + k) * 0.85 + 0.15); } }
          }
          if (ch) { maj(fA); maj(fV); }
        });
      }
      { // les gens (RU-4, HA-3, PL-10, CN-6) : deux lots aux mêmes rangs (bras le long du corps, bras levés). GENS = [x, y, z, rotation, mode, échantillon, teinte, échelle] ;
        // mode 0 : calme, un bras levé de temps en temps ; 1 : public, salue la voiture qui arrive à son échantillon
        const HAB = [ROSE, TURQ, JAUNE, 0xf6f2e8, 0xff6a2b, 0x2c4fa3, 0xd8362a, 0x7a4bd6], gens = (x, y, z, r, mode = 0, i = 0, e = 1) => { if (ecart(x, z) > 0.3) GENS.push([x, y, z, r, mode, i, undefined, e]); };
        const ETR = [[420, -1], [430, -1], [450, -1], [460, -1], [470, -1], [480, -1], [503, -1], [425, 1], [435, 1], [445, 1], [455, 1], [475, 1], [485, 1], [495, 1]];   // étals de la rue [échantillon, côté] : hors des poteaux du fil continu (à droite, tous les 10) et des grills
        for (const [i, sd] of ETR) { const s = S[i], [x, z] = off(i, sd * (s.w + 1.05)); L.etals.push([x, s.y - 0.05, z, face(s, sd), 0.85, 0.85, 0.85, [ROSE, TURQ, JAUNE, 0xf6f2e8, 0xff6a2b][(i + (sd > 0 ? 2 : 0)) % 5]]); }   // à 85 % : leur toile passe sous le bord des auvents
        for (let i = 418; i < 506; i += 4) for (const sd of [-1, 1]) { if (hz(i, sd + 70) < 0.3 || (sd > 0 && i % 10 === 0) || ETR.some(([e, c]) => c === sd && Math.abs(e - i) < 3)) continue; const s = S[i], [x, z] = off(i, sd * (s.w + 0.4 + hz(i, sd + 71) * 0.5)); gens(x, s.y, z, face(s, sd) + 1.5708, 1, i, 1.15); }   // la rue : au bord du trottoir, entre les étals
        chaque([i18, i20 - i18], 2, (s, i) => { if ((i - i18) % 4 === 0) return; for (const sg of [-1, 1]) { if (hz(i, sg + 72) < 0.5) continue; const [x, z] = off(i, sg * (s.w + 1.3 + hz(i, sg + 73) * 0.9)); gens(x, s.y, z, face(s, sg) + (hz(i, sg + 74) < 0.5 ? 1.5708 : -1.5708), hz(i, sg + 75) < 0.5 ? 1 : 0, i, 1.15); } });   // la halle : vendeurs et clients entre la chaussée et les étals, hors des rangs de poteaux
        chaque(plageT, 5, (s, i, k) => { const [x, z] = off(i, s.w + [2.4, 3.2, 5.6, 6.4][(k / 5 | 0) % 4]); gens(x, 0.12, z, face(s, 1) + 1.5708, (k / 5 | 0) % 2, i); });                                                                               // le malecón de la plage
        const lg = GENS.map((p, k) => [p[0], p[1], p[2], p[3], p[7] || 1, p[7] || 1, p[7] || 1, p[6] || HAB[(k * 5 + (k >> 3)) % 8]]), PG = { bas: col(0x2a3a5a), habit: col(0xffffff), peau: col(0xc68a5a) }, gA = vifs('gente', lg, { a: [0], teinte: 'habit' }, PG), gB = vifs('gente', lg, { a: [1], teinte: 'habit' }, PG), etat = new Int8Array(GENS.length).fill(-1);
        VIE.push((dt, car) => { let ch = 0; GENS.forEach((p, k) => { const e = car ? (p[5] - car.idx + N) % N : 99, leve = p[4] === 1 && (e < 26 || e > N - 5) ? (TV * 3 + k * 0.37) % 1 < 0.75 : p[4] === 0 && Math.sin(TV * 0.8 + k * 1.9) > 0.93;
            if (etat[k] === +leve) return; etat[k] = +leve; ch = 1; const s = p[7] || 1; met(leve ? gB : gA, k, p[0], p[1], p[2], p[3], s); cache(leve ? gA : gB, k); }); if (ch) { maj(gA); maj(gB); } });
        // le vendeur à vélo du malecón (PL-10) : il longe la promenade, aller et retour
        const [v0, vn] = plageT, velo = vifs('velo', [[0, -99, 0]]), cyc = vifs('gente', [[0, -99, 0, 0, 1, 1, 1, 0xf6f2e8]], { a: [0], teinte: 'habit' }, PG);
        VIE.push(() => { const T2 = vn / 2, w = (TV % (2 * T2)), u = w < T2 ? w * 2 : (2 * T2 - w) * 2, j = (v0 + Math.floor(u)) % N, f = u - Math.floor(u), a = S[j], b = S[(j + 1) % N], d = w < T2 ? 1 : -1, o = a.w + 7, x = a.x + (b.x - a.x) * f - a.tz * o, z = a.z + (b.z - a.z) * f + a.tx * o, r = cap(d * a.tx, d * a.tz);
          met(velo, 0, x, 0.12, z, r); met(cyc, 0, x, 0.5, z, r); maj(velo); maj(cyc); });
      }

      // ---------- les réactions à la course ----------
      { // confettis de la feria quand la voiture arrive sur la ligne (PL-13) : elle roule dessous
        const s0 = S[0], conf = grains(420, () => { const o = alea(2 * s0.w); return [s0.x - s0.tz * o + alea(3), s0.y + 6.5 + Math.random() * 2.5, s0.z + s0.tx * o + alea(3), alea(1.5), -1.6 - Math.random() * 1.2, 0.8 + alea(1.5), 4.5]; }, { taille: 0.15, coul: [[0.91, 0.27, 0.55], [0.12, 0.71, 0.66], [0.95, 0.76, 0.19], [1, 1, 1]] });
        let avant = false; VIE.push((dt, car) => { const va = pres(car, N, 26); if (va && !avant) conf.salve(); avant = va; });
      }
      // ---------- lots : une passe de dessin par forme ----------
      inst(h, h.geo('poteauBois'), mBois, L.poteaux); insts(h, 'cocotier', PEAU, L.cocos, { a: [0] }); colore(inst(h, h.geo('buisson'), grain('#ffffff', ['#e8e8e8', '#d8d8d8']), L.buis), L.buis);
      colore(inst(h, h.geo('houppier'), grain('#ffffff', ['#e4e4e4', '#cacaca']), MANG), MANG);
      insts(h, 'ceiba', PEAU, ARB[0], { teinte: 'feuille' }); insts(h, 'arbreSelva', PEAU, ARB[1], { teinte: 'feuille' });
      insts(h, 'lampadaire', PEAU, L.lamp); insts(h, 'poteauElec', PEAU, L.poteauxE); insts(h, 'banc', PEAU, L.bancs); insts(h, 'etalPlaya', PEAU, L.etals, { teinte: 'toile' }); insts(h, 'mangle', PEAU, L.mangles);
      insts(h, 'barque', PEAU, L.barques, { teinte: 'bande' }); colore(inst(h, h.geo('boite', 1, 1, 1), mCrepi, L.cubes), L.cubes); colore(inst(h, h.geo('fanion'), h.mat('papelPicado', { side: D, alphaTest: 0.5 }), L.fanions), L.fanions).castShadow = true;
      for (const o of h.scene.children.slice(n0)) if (o.isInstancedMesh && o.count > 120 && !o.userData.dyn) {
        const cases = new Map(), M4 = new THREE.Matrix4(), C = new THREE.Color();
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); const k = Math.floor(M4.elements[12] / 350) + ':' + Math.floor(M4.elements[14] / 350); if (!cases.has(k)) cases.set(k, []); cases.get(k).push(i); }
        if (cases.size < 2) continue;
        for (const l of cases.values()) { const m = new THREE.InstancedMesh(o.geometry, o.material, l.length); l.forEach((i, j) => { o.getMatrixAt(i, M4); m.setMatrixAt(j, M4); if (o.instanceColor) { o.getColorAt(i, C); m.setColorAt(j, C); } }); m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; h.scene.add(m); }
        h.scene.remove(o);
      }
      for (const o of h.scene.children.slice(n0)) if (o.isInstancedMesh && o.count && !o.userData.dyn) { o.computeBoundingSphere(); o.frustumCulled = true; }
      const tick = (dt, now, car) => { dt = Math.min(dt, 0.1); for (const f of VIE) f(dt, car); }; tick(0); return tick;
    },
  });
})();
