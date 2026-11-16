// Placement du décor de « wangan » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  Object.assign(DECORS, {
    // ---------- Wan-9 : la ville au nord, le chenal, l'île du port au sud. Voie rapide du front de mer, pont à haubans, quais à conteneurs,
    // tranchée et tunnel immergé sous le chenal, retour en ville. L'eau n'existe que là où la route passe au-dessus (pont) ou dessous (tunnel). ----------
    wangan(h) {
      const { THREE, S, N, W, rnd, T } = h; const poses = (nom, peau, list, o = {}) => Object.entries(h.zones(nom, peau, ...(o.a || []))).forEach(([zn, g]) => { const G = indexe(h, g), t = zn === o.teinte, mt = t && Object.assign(peau[zn].clone(), { vertexColors: true }); for (const p of list) { const Gp = t ? G.clone() : G; if (t) { const c = new THREE.Color(p[7]), n = Gp.attributes.position.count, A = new Float32Array(n * 3); for (let i = 0; i < n; i++) A.set([c.r, c.g, c.b], i * 3); Gp.setAttribute('color', new THREE.BufferAttribute(A, 3)); } const m = new THREE.Mesh(Gp, t ? mt : peau[zn]); m.position.set(p[0], p[1], p[2]); m.rotation.y = p[3] || 0; m.scale.set(p[4] || 1, p[5] || p[4] || 1, p[6] || p[4] || 1); m.castShadow = m.receiveShadow = h.TH.sun[1] > 0.6; h.scene.add(m); } }); // comme insts, mais un maillage par exemplaire : la fusion les découpe en pavés de 500 m, ceux hors champ ne sont plus dessinés (une instance fondue reste entière)
      const mm = new Map(), M = (n, o = {}, ...a) => { const m = h.mat(n, o, ...a), k = JSON.stringify([n, o, a]); if (n === 'metalClair') m.userData.mc = 1; return o.lum ? m : mm.get(k) || mm.set(k, m).get(k); }; // matières non lumineuses partagées à réglages égaux : même image, des lots fondus en moins (les lumineuses restent à part : rythme.js les module). h.mat est appelé quand même : ses textures tirent dans rnd, le décor ne doit pas bouger
      const CH0 = 62, CH1 = 520, ILE = [-880, 1650, 1045], PH = [1568, 958]; // chenal entre z = CH0 et CH1 ; l'île va de x = ILE[0] à ILE[1], jusqu'à z = ILE[2] ; PH : le phare, au bout de l'île, dans l'épingle (points 11 à 16)
      const mer = (x, z) => (z > CH0 && z < CH1) || (z >= CH1 && (x < ILE[0] || x > ILE[1] || z > ILE[2]));
      const tun = i => h.zone(i, 0) === 1;
      const CG0 = [880, -60], MQ = 22, bassin = (x, z) => z > MQ && z <= CH0 && x > 30 && x < 1040 && Math.abs(x - 620) > 80; // bassin de la marina, creusé entre la route du départ et le chenal (la grande roue garde sa terre, en x = 620) : vu de la route, les bateaux sont à 20 m, pas cachés derrière le quai du chenal
      // au-dessus du tunnel, le sol reste au niveau du quai : le tube passe dessous ; dans les tranchées d'accès, il suit la route qui descend
      const g = terrain(h, { pas: 16, marge: 330, sol: s => tun(S.indexOf(s)) ? 0 : Math.min(s.y, 0), creux: (x, z) => mer(x, z) || bassin(x, z) ? 13 : 0, mat: M('bruit', {}, '#1a1c22', ['#22252c', '#14161a', '#2a2622']) });
      { // un sol en grille de 16 m ne peut pas épouser le tube (fond du chenal, rampes) : on retire les triangles qui entrent dans le tube ou passent au-dessus de la chaussée des tranchées ; de dehors, on voit la coque
        const ge = h.scene.children[h.scene.children.length - 1].geometry, P = ge.attributes.position.array, I = ge.index.array, zs = [];
        for (let i = T.t0 - 120; i < T.t1 + 120; i++) { const k = (i + N) % N; if (tun(k) || S[k].y < -0.3) zs.push([S[k], tun(k)]); }
        const dedans = (x, y, z, m) => { let b = zs[0], bd = 1e18; for (const e of zs) { const d = (e[0].x - x) ** 2 + (e[0].z - z) ** 2; if (d < bd) { bd = d; b = e; } }
          const [s, t] = b, l = Math.abs((s.x - x) * s.tz - (s.z - z) * s.tx) /* écart en travers */, dy = y - s.y; return bd < (W + 30) ** 2 && l < W + 1.6 + m && (y === null || dy > -0.3 && (!t || dy < 8.5)); };
        for (let k = 0; k < I.length; k += 3) {
          const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3;
          if (!dedans((P[a] + P[b] + P[c]) / 3, null, (P[a + 2] + P[b + 2] + P[c + 2]) / 3, 30)) continue; // loin des tranchées et du tube : rien à tester
          let hors = true;
          for (let u = 0; u <= 6 && hors; u++) for (let v = 0; u + v <= 6; v++) { const w = 6 - u - v, f = j => (P[a + j] * u + P[b + j] * v + P[c + j] * w) / 6; if (dedans(f(0), f(1), f(2), 0)) { hors = false; break; } }
          if (!hors) I[k] = I[k + 1] = I[k + 2] = 0;
        }
        ge.index.needsUpdate = true;
      }
      const eau = M('bruit', { lum: 1, rep: [300, 300] }, '#071824', ['#0f3b4a', '#0a2836', '#3a2c18']);
      // quatre plans d'eau : le chenal, et la mer à l'ouest, à l'est et au sud de l'île
      boite(h, eau, 16000, 1, CH1 - CH0, 0, -3.5, (CH0 + CH1) / 2); boite(h, eau, 16000, 1, 8000, 0, -3.5, ILE[2] + 4000);
      boite(h, eau, 8000, 1, ILE[2] - CH1, ILE[0] - 4000, -3.5, (CH1 + ILE[2]) / 2); boite(h, eau, 8000, 1, ILE[2] - CH1, ILE[1] + 4000, -3.5, (CH1 + ILE[2]) / 2);
      // la terre continue au nord, au-delà du terrain modelé
      const plaine = M('plaine');
      boite(h, plaine, 16000, 1, 8000, 0, -1, g.box[1] - 4000); boite(h, plaine, 8000, 1, CH0 - g.box[1], g.box[0] - 4000, -1, (CH0 + g.box[1]) / 2); boite(h, plaine, 8000, 1, CH0 - g.box[1], g.box[2] + 4000, -1, (CH0 + g.box[1]) / 2);
      // lampadaires : un tous les 40 m, des deux côtés ; leur défilement régulier donne la vitesse sans aucun flou.
      // Pas dans la marina (points 0 à 3 : des bornes basses le long du quai) ni dans le port (points 9 à 29 : les mâts de projecteurs du port, une course sauvage, pas une autoroute)
      const mats = [], tetes = [], sansLampe = i => i < pt(h, 3) || (i >= pt(h, 9) && i < pt(h, 29));
      for (let i = 0; i < N; i += 20) {
        if (h.zone(i, 0) === 1 || sansLampe(i)) continue;
        const s = S[i], ry = h.across(s);
        for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, W + 0.8), [tx, tz] = bord(s, sd, W - 0.7); mats.push([x, s.y + 5, z, ry]); tetes.push([tx, s.y + 10, tz, ry]); }
        { const [lx, lz] = bord(s, (i / 20) & 1 ? 1 : -1, W - 0.7); h.lum(i, lx, s.y + 9.6, lz, 0xffa040, 31, 3.2); } // sodium : une plage orange par lampadaire, d'un côté puis de l'autre
      }
      inst(h, h.geo('matLampadaire'), M('matGris'), mats);
      inst(h, h.geo('teteLampadaire'), M('sodium', LUM), tetes);
      // panneaux d'autoroute verts, rétroréfléchissants : chacun annonce ce qui vient (pont, port, tunnel sous le chenal, centre)
      const gris = M('portiqueGris'), pan = t => M('panneauRoute', { lum: 1, retro: 0.7 }, t);
      for (const [ip, a, b] of [[1, '湾岸線 ↑', '橋 BRIDGE 1km'], [3, '橋 BRIDGE', '港 PORT →'], [17, '港 PORT', '出口 EXIT'], [27, '海底トンネル', 'UNDERSEA 1.4km'], [29, '水深 -25m', '危険物 ✕ HAZMAT'], [39, '湾岸線 WAN-9', '都心 CENTER']])
        h.pose('portiqueAutoroute', { structure: gris, panneauGauche: pan(a), panneauDroit: pan(b) }, repere(h, S[pt(h, ip)]), [0, 0, 0], W);
      // pont à haubans sur le chenal : deux pylônes en H, câbles tirés jusqu'au tablier
      const blanc = M('blancPont'), fils = [], balises = [];
      for (const [px, pz] of [[1407, 215], [1402, 430]]) {
        const i0 = near(h, px, pz), s = S[i0];
        h.pose('pylonePont', { beton: blanc }, repere(h, s), [0, 0, 0], W);
        for (const sd of [-1, 1]) {
          const [ax, az] = bord(s, sd, W + 3.5); balises.push(ax, s.y + 51, az);
          for (let j = 8; j <= 48; j += 8) for (const dir of [-1, 1]) { const q = S[(i0 + dir * j + N) % N], [bx, bz] = bord(q, sd, W + 1); fils.push(ax, s.y + 48 - j * 0.25, az, bx, q.y + 1.4, bz); }
        }
      }
      const fgm = new THREE.BufferGeometry(); fgm.setAttribute('position', new THREE.Float32BufferAttribute(fils, 3)); h.scene.add(new THREE.LineSegments(fgm, new THREE.LineBasicMaterial({ color: 0xc9ced6 })));

      // ---------- le tunnel immergé : tranchées d'accès, têtes de tunnel, tours de ventilation, bouées qui balisent le tube à travers le chenal ----------
      const beton = M('beton'), berme = [];
      for (let i = 0; i < N; i += 4) { // murs de soutènement des tranchées : du pied de la route au niveau du quai, couronnés d'un terre-plein de 30 m
        const s = S[i]; if (tun(i) || s.y > -0.3 || s.y < -20) continue;
        for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, W + 15.6), ht = 1.4 - s.y; berme.push([x, s.y - 1 + ht / 2, z, h.across(s), 1, ht, 1]); }
      }
      inst(h, h.geo('berme'), M('betonGris'), berme);
      const tete = { beton, corniche: gris, structure: gris, nom: M('ecrit', LUM, 128, 22, '#0e5a38', '#f4f1e0', '湾岸海底トンネル  WAN-9 UNDERSEA TUNNEL', 9), feux: M('feuxVoie', LUM, 4),
        limite: M('matGris', { visible: false }), panneau: M('matGris', { visible: false }), structure: M('matGris', { visible: false }) }; // le gabarit de la tête est rigide, à 26 m : dans la courbe d'accès il tombait dans le mur ; posé à part, plus bas
      for (const [i, rv] of [[T.t0, 0], [T.t1, Math.PI]]) { const r = repere(h, S[i]); r.rotation.y += rv; h.pose('teteTunnel', tete, r, [0, 0, 0], W); }
      for (const [i, rv] of [[T.t0 - 13, 0], [T.t1 + 13, Math.PI]]) { const r = repere(h, S[(i + N) % N]); r.rotation.y += rv; // le portique de gabarit, sur la route elle-même, 26 m avant chaque tête
        h.pose('gabarit', { limite: M('rayures', LUM), structure: gris, panneau: M('ecrit', LUM, 16, 16, '#f4f0e0', '#c8102e', '4.3m', 7) }, r, [0, 0, 0], W); }
      const persiennes = M('persiennes'), quai = M('bitume'), feuxRouges = [];
      { const s = S[T.t0], [x, z] = bord(s, 1, W + 46), r = repere(h, s); r.position.set(x, g.hAt(x, z), z); h.pose('tourVentilation', { persiennes, beton }, r, [0, 0, 18], 24); feuxRouges.push(x, 46, z); }
      { const s = S[T.t1], [x, z] = bord(s, -1, W + 40), r = repere(h, s); r.position.set(x, g.hAt(x, z), z); h.pose('tourVentilation', { persiennes, beton }, r, [0, 0, -18], 20); feuxRouges.push(x, 42, z); }
      // au milieu du chenal, sur l'axe du tube : l'île de la tour de ventilation, et deux rangées de bouées jaunes qui interdisent le mouillage au-dessus du tunnel
      const iv = S[near(h, -615, 300)], ile = new THREE.Group(); ile.position.set(iv.x, 0, iv.z); ile.rotation.y = h.across(iv) + Math.PI / 2; h.scene.add(ile);
      h.pose('ileVentilation', { quai, defense: M('defense') }, ile); h.pose('tourVentilation', { persiennes, beton }, ile, [0, 0, 0], 34); feuxRouges.push(iv.x, 50, iv.z);
      const bouees = [], feuxBouees = [];
      for (let i = T.t0; i < T.t1; i += 10) { const s = S[i]; if (!mer(s.x, s.z)) continue; for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, 60); bouees.push([x, -3.2, z]); feuxBouees.push(x, -0.6, z); } }
      inst(h, h.geo('bouee'), M('metalClair', { c: 0xffc81a }), bouees);
      const fb = new THREE.BufferGeometry(); fb.setAttribute('position', new THREE.Float32BufferAttribute(feuxBouees, 3));
      const ptsBouees = new THREE.Points(fb, new THREE.PointsMaterial({ color: 0xffc81a, size: 3, sizeAttenuation: false })); ptsBouees.frustumCulled = false; h.scene.add(ptsBouees);

      // ---------- l'île du port : quai, parcs à conteneurs en blocs inégaux, engins, mâts d'éclairage ----------
      // places gardées libres (x, z, rayon) : sous les portiques qui enjambent la route (points 18 à 28 ; celui de j = 140 roule de ±20 m)
      const i0E = pt(h, 18), nE = (pt(h, 28) - i0E + N) % N, jGrues = [], iPm = (i0E + 142) % N, trous = [[S[iPm].x, S[iPm].z, 38]];
      for (let j = 420; j < nE - 40; j += 280) { jGrues.push(j); const q = S[(i0E + j) % N]; trous.push([q.x, q.z, 24]); }
      const axe = S[near(h, -615, 560)].x, libre = (x, z, m = 14) => g.dAt(x, z) > W + m && (z > 700 || Math.abs(x - axe) > 90) && Math.hypot(x - PH[0], z - PH[1]) > 30 && // rien dans l'axe du tunnel : de la tranchée, on voit le chenal ; rien contre le phare
         g.hAt(x, z) > -1.5 && z > CH1 + 4 && z < ILE[2] - 12 && x > ILE[0] + 10 && x < ILE[1] - 10 && trous.every(([tx, tz, r]) => Math.hypot(x - tx, z - tz) > r);
      // le sol du port : dalles de béton, rails noyés, voie jaune, cases de stockage, flaques (textures-wangan.js) ; à l'ouest de la tranchée du tunnel, l'ancien terre-plein du quai
      boite(h, M('solPort'), ILE[1] + 500, 0.3, ILE[2] - CH1 - 2, (ILE[1] - 500) / 2, -0.2, (CH1 + 2 + ILE[2]) / 2);
      boite(h, M('parc'), 360, 0.3, 74, ILE[0] + 200, -0.2, CH1 + 37);
      const cols = [0xb8442c, 0x2c6ab8, 0xc9a02c, 0x3a8a5a, 0xd8d4cc, 0x7a3a6a, 0x1a4a5a], piles = cols.map(() => []), cavaliers = [], portiques = [];
      // un bloc = des travées de conteneurs (le long de X) sur plusieurs files (Z) ; chaque bloc a sa compagnie dominante, son remplissage, ses trous
      const blocs = [], bloc = (x0, z0, C, R, fill) => { blocs.push([x0 - 1, z0 - 1, x0 + C * 12.8 + 1, z0 + R * 2.9 + 1]);
        const dom = rnd() * cols.length | 0;
        const H = [], hAt = (c, r) => (H[c] && H[c][r]) || 0;
        for (let c = 0; c < C; c++) { H[c] = []; for (let r = 0; r < R; r++) { const bordure = Math.min(c, C - 1 - c, r, R - 1 - r) === 0 ? 1 : 0; H[c][r] = Math.max(1, Math.min(5, Math.round(fill - bordure + (rnd() - 0.5) * 2.6))); } } // le bloc arrive déjà taillé à la route : pas de trou
        for (let c = 0; c < C; c++) for (let r = 0; r < R; r++) {
          const x = x0 + c * 12.8 + 6, z = z0 + r * 2.9 + 1.25, n = H[c][r], vu = Math.min(hAt(c - 1, r), hAt(c + 1, r), hAt(c, r - 1), hAt(c, r + 1)); // sous ce niveau, le conteneur est enfoui entre ses voisins : on ne le dessine pas
          const pile = [], k0 = Math.max(0, Math.min(vu, n - 1));
          for (let k = k0; k < n; k++) { const haut = k === n - 1, col = rnd() < 0.55 ? dom : rnd() * cols.length | 0; pile.push([col, [x + (haut ? (rnd() - 0.5) * 0.5 : 0), g.hAt(x, z) + 1.3 + k * 2.6, z, haut ? (rnd() - 0.5) * 0.05 : 0, rnd() < 0.15 ? 0.5 : 1, 1, 1]]); }
          // faces cachées (8e valeur) : 1 = dessous (au sol, ou sur un conteneur entier), 2 = dessus (sous un conteneur entier qui n'est pas le dernier, posé droit)
          pile.forEach(([col, p], j) => { p[7] = (k0 + j === 0 || j > 0 && pile[j - 1][1][4] === 1 ? 1 : 0) | (j < pile.length - 2 && pile[j + 1][1][4] === 1 ? 2 : 0); piles[col].push(p); });
        }
        if (rnd() < 0.5 && R <= 7 && libre(x0 + C * 6.4, z0 + R * 1.45, 6)) portiques.push([x0 + (0.2 + rnd() * 0.6) * C * 12.8, g.hAt(x0, z0), z0 + R * 1.45, Math.PI / 2]);
      };
      // des rangées de blocs sur toute l'île, de l'arrière des portiques de quai au bord sud ; un bloc s'arrête net à 4 m derrière le muret (ses colonnes dont un conteneur toucherait la route sont retirées)
      const colLibre = (x0, z0, c, R) => { for (let r = 0; r < R; r++) for (const dx of [-6.4, 6.4]) for (const dz of [-1.45, 1.45]) if (!libre(x0 + c * 12.8 + 6 + dx, z0 + r * 2.9 + 1.25 + dz, 4)) return false; return true; };
      for (let z0 = 580; z0 < ILE[2] - 34; z0 += 40 + (rnd() * 10 | 0)) for (let x0 = ILE[0] + 20 + rnd() * 30; x0 < ILE[1] - 40;) {
        const C0 = 4 + (rnd() * 7 | 0), R = 4 + (rnd() * 4 | 0), t = rnd(), L = C0 * 12.8;
        let c0 = 0; while (c0 < C0 && !colLibre(x0, z0, c0, R)) c0++; let c1 = c0; while (c1 < C0 && colLibre(x0, z0, c1, R)) c1++;
        const C = c1 - c0; if (C < 2) { x0 += L + 14; continue; } // bloc mangé par la route : le bas-côté reste vide, garni plus bas (engins, palettes)
        if (t < 0.15) { // zone vide : quelques conteneurs posés de travers, un cavalier qui attend
          for (let k = rnd() * 4 | 0; k > 0; k--) { const x = x0 + rnd() * L, z = z0 + rnd() * 20; if (libre(x, z)) piles[rnd() * cols.length | 0].push([x, g.hAt(x, z) + 1.3, z, rnd() * 3.14, 1, 1, 1, 1]); }
          const x = x0 + rnd() * L, z = z0 + 10; if (libre(x, z, 18)) cavaliers.push([x, g.hAt(x, z), z, rnd() < 0.5 ? 0 : 0.2]);
        } else bloc(x0 + c0 * 12.8, z0, C, R, t < 0.4 ? 1.5 : t < 0.85 ? 3 : 4.2);
        const allee = 14 + rnd() * 22, x = x0 + L + allee / 2, z = z0 + 9; // l'allée qui suit : un cavalier y passe parfois
        if (rnd() < 0.45 && libre(x, z, 18)) cavaliers.push([x, g.hAt(x, z), z, Math.PI / 2 + (rnd() - 0.5) * 0.2]);
        x0 += L + allee;
      }
      const structure = M('metalClair', { c: 0xe0b020 }), cabine = M('metalClair', { c: 0xe8e8e4 }), vitre = M('vitreSombre'), roue = M('roue'), pneu = M('pneu'), machinerie = M('metalClair', { c: 0x8a8e96 });
      poses('cavalier', { structure, cabine, vitre, roue }, cavaliers);
      poses('grueParc', { structure: M('metalClair', { c: 0x2c6ab8 }), cabine, vitre, roue, machinerie }, portiques, { a: [24] });
      // le quai : portiques au-dessus des navires amarrés, tracteurs de quai qui attendent sous les portiques
      const minium = M('minium'), treillis = M('treillis', { alphaTest: 0.5, side: THREE.DoubleSide }, '#c8442c');
      for (const cx of [-150, -40, 70, 620, 740, 930]) { h.pose('grue', { structure: minium, treillis, tirant: gris, machinerie: cabine, cabine, vitre, roue }, h.scene, [cx, 0, CH1]); balises.push(cx, 69, CH1 + 41); }
      const tracteurs = [];
      for (let k = 0; k < 16; k++) { const x = -260 + rnd() * 1250, z = CH1 + 8 + rnd() * 14; if (Math.abs(x - 280) > 180) tracteurs.push([x, 0, z, (rnd() < 0.5 ? 0 : Math.PI) + (rnd() - 0.5) * 0.3]); }
      // ---------- les bas-côtés du port (points 9 à 29), entre le muret et les blocs : le port travaille, la course passe au milieu. Camions garés, chariots élévateurs, palettes, barrières de chantier ----------
      { const horsBloc = (x, z) => !blocs.some(b => x > b[0] && x < b[2] && z > b[1] && z < b[3]), chariots = [], pal = [[], []], barr = []; let hz = 11; const al = () => (hz = hz * 16807 % 2147483647) / 2147483647; // hasard propre
        const i09 = pt(h, 9), n9 = (pt(h, 29) - i09 + N) % N;
        for (let j = 4; j < n9; j += 5) { const s = S[(i09 + j) % N], ry = h.across(s) + Math.PI / 2;
          for (const sd of [-1, 1]) { const u = al(), [x, z] = bord(s, sd, W + 4 + al() * 14); if (!libre(x, z, 3) || !horsBloc(x, z)) continue;
            if (u < 0.1) { const [x2, z2] = bord(s, sd, W + 6); if (libre(x2, z2, 5) && horsBloc(x2 + s.tx * 10, z2 + s.tz * 10) && horsBloc(x2 - s.tx * 10, z2 - s.tz * 10)) tracteurs.push([x2, 0, z2, ry + (sd > 0 ? 0 : Math.PI)]); } // un camion garé le long, en attente
            else if (u < 0.2) chariots.push([x, 0, z, al() * 6.3]);
            else if (u < 0.48) { const n = 1 + (al() * 4 | 0); for (let k = 0; k < n; k++) { const f = al() < 0.5 ? 1 : 0; pal[f].push([x + (al() - 0.5) * 3, 0, z + (al() - 0.5) * 3, al() * 0.4, 1, f ? 1 : 1 + (al() * 6 | 0), 1]); } } // piles de palettes vides (étirées en hauteur) ou filmées
            else if (u < 0.56) for (let k = -1; k <= 1; k++) barr.push([x + s.tx * k * 2.7, 0, z + s.tz * k * 2.7, h.across(s)]); } }
        insts(h, 'chariot', { caisse: M('metalClair', { c: 0xe0a020 }), contrepoids: M('matGris'), acier: M('acier'), roue: M('roue') }, chariots);
        insts(h, 'palettes', { bois: M('planches', { c: 0xc8a878 }) }, pal[0], { a: [1, false] }); insts(h, 'palettes', { bois: M('planches', { c: 0xc8a878 }), film: M('metalClair', { c: 0xc8d4dc }) }, pal[1], { a: [1, true] });
        insts(h, 'barriere', { rayures: M('rayures', LUM), clignotant: M('clignotant', LUM) }, barr); }
      const chassis = M('matGris'), lampe = M('lampe', LUM), feuRouge = M('feuRouge', LUM), clign = M('clignotant', LUM);
      poses('tracteur', { chassis, pneu, cabine: M('metalClair', { c: 0xe0b020 }), vitre, calandre: M('calandre'), phare: lampe, feuOrange: clign, roue }, tracteurs);
      poses('remorqueConteneur', { chassis, caisse: M('tole', { c: 0x5a5e66 }), roue, pneu, feu: feuRouge }, tracteurs.filter((p, k) => k % 3));
      // mâts d'éclairage : lumière blanche sur les parcs ; ceux qui bordent la route l'éclairent
      const mats35 = [];
      for (let x = ILE[0] + 60; x < ILE[1] - 40; x += 130) for (const z of [CH1 + 30, 700, 818, 1000]) {
        const xx = x + (z % 3) * 20; if (!libre(xx, z, 6)) continue; mats35.push([xx, g.hAt(xx, z), z]);
        if (g.dAt(xx, z) < 60) h.lum(near(h, xx, z), xx, 33, z, 0xe8f0ff, 70, 1.6);
      }
      // ---------- la traversée du port (points 9 à 29) : pas de murs de conteneurs le long de la route, les blocs du parc s'arrêtent net derrière le muret ;
      // deux portiques de parc enjambent la route (un troisième roule, plus bas), des mâts de projecteurs blancs bas (le blanc dur des quais contre l'orange du sodium)
      { const grues = jGrues.map(j => { const s = S[(i0E + j) % N]; return [s.x, s.y, s.z, h.across(s)]; });
        poses('grueParc', { structure: M('metalClair', { c: 0xe0b020 }), cabine: M('metalClair', { c: 0xe8e8e4 }), vitre: M('vitreSombre'), roue: M('roue'), machinerie: M('metalClair', { c: 0x8a8e96 }) }, grues, { a: [32] });
        const i09 = pt(h, 9), n9 = (pt(h, 29) - i09 + N) % N;
        for (let j = 18; j < n9; j += 36) { const i = (i09 + j) % N, s = S[i], sd = (j / 36) & 1 ? 1 : -1, [x, z] = bord(s, sd, W + 2.5); // un projecteur tous les 72 m, d'un côté puis de l'autre
          mats35.push([x, g.hAt(x, z), z]); h.lum(i, x - s.tz * sd * -4, s.y + 20, z + s.tx * sd * -4, 0xe8f0ff, 48, 2.2); } }
      // un conteneur sans ses faces cachées (BoxGeometry : faces ±x, ±y, ±z de 4 sommets ; 2 = dessus, 3 = dessous) : la moitié des sommets de la carte sont des conteneurs
      const sans = (g, f) => { const gv = [...Array(24).keys()].filter(i => !f.includes(i >> 2)); for (const n in g.attributes) { const a = g.attributes[n]; g.setAttribute(n, new THREE.Float32BufferAttribute(gv.flatMap(i => Array.from(a.array.slice(i * a.itemSize, (i + 1) * a.itemSize))), a.itemSize)); }
        g.setIndex(Array.from(g.index.array).filter((_, k) => !f.includes(Math.floor(k / 6))).map(i => gv.indexOf(i))); g.clearGroups(); return g; };
      { let mt = null; piles.forEach((l, i) => { const m = M('tole', { c: cols[i] }); mt = mt || Object.assign(m.clone(), { vertexColors: true, color: new THREE.Color(0xffffff) }); [[], [3], [2], [2, 3]].forEach((f, v) => { const lv = l.filter(p => (p[7] || 0) === v); if (!lv.length) return; const G = sans(h.habille(h.geo('conteneur'), m), f), c = new THREE.Color(cols[i]), n = G.attributes.position.count, A = new Float32Array(n * 3); for (let k = 0; k < n; k++) A.set([c.r, c.g, c.b], k * 3); G.setAttribute('color', new THREE.BufferAttribute(A, 3)); for (const p of lv) { const o = new THREE.Mesh(G, mt); o.position.set(p[0], p[1], p[2]); o.rotation.y = p[3] || 0; o.scale.set(p[4] || 1, p[5] || p[4] || 1, p[6] || p[4] || 1); o.castShadow = o.receiveShadow = h.TH.sun[1] > 0.6; h.scene.add(o); } }); }); } // un maillage par conteneur, que la fusion découpe en pavés (ceux hors champ ne sont plus dessinés) ; une seule matière : les 7 tôles ont la même texture (hasard semé par son nom), la teinte passe dans les sommets
      insts(h, 'matEclairage', { acier: M('acier'), lampe }, mats35);

      // ---------- navires : deux porte-conteneurs à quai, des remorqueurs, des navires au mouillage au large, et deux qui passent dans le chenal au-dessus du tunnel ----------
      let hub = null; // les hublots, partagés entre navires (tirés chaque fois pour rnd, voir M) : les navires fixes se fondent ensemble
      const nav = (L, type, coque, cheminee, baies) => ({ carene: minium, coque: M('metalClair', { c: coque }), blanc: cabine, hublots: (m => hub || (hub = m))(M('tourFenetres', { lum: 1, fog: false }, ['#ffe2a0', '#f4f1e0'])), cheminee: M('metalClair', { c: cheminee }),
        cargaison: M('cargaison'), cale: M('metalClair', { c: 0x8a3a2a }), grueBord: structure, defense: M('defense'), vitre });
      const baies = (L, f) => Array.from({ length: Math.floor((L - 50) / 24) }, () => Math.max(1, Math.min(6, Math.round(f + (rnd() - 0.5) * 3))));
      const famNav = { test: m => m.userData.mc }; // les tôles peintes d'un navire qui passe (même texture, teintes différentes) : une seule passe, la teinte en couleur de sommet
      const feuxNav = [], navire = (L, type, coque, chem, x, z, ry, f = 4, dyn) => { const p = new THREE.Group(); p.userData.dyn = dyn; p.position.set(x, -3, z); p.rotation.y = ry; h.scene.add(p); h.pose('navire', nav(L, type, coque, chem), p, [0, 0, 0], L, type, type === 'vrac' ? [] : baies(L, f)); if (dyn) soude(h, p, famNav); return p; }; // seuls les navires qui passent bougent : les autres sont fondus avec le décor
      for (const [L, x, coque, chem, f] of [[250, -40, 0x1a2a4a, 0xc8442c, 4.5]]) { navire(L, 'conteneurs', coque, chem, x, CH1 - 16, 0, f); feuxNav.push(x + L / 2 - 6, 19, CH1 - 16, x - L / 2 + 14, 36, CH1 - 16); }
      // ---------- le caboteur qui avance d'un tour à l'autre (cycle de 3 tours) : à quai au tour 1, il passe sous le pont à haubans au tour 2 (vu de la route, à l'approche et sur le pont),
      // au large au tour 3 ; revenu à quai pendant le tunnel du tour 3, où personne ne le voit. Sa position ne dépend que des tours de la voiture que suit la vue (tick.vue, plus bas) :
      // rien ne change pour la physique ni pour le fantôme. Il reste dans le chenal, sous le pont entre deux piles (z = 342 : piles à 312 et 372) ----------
      const cabo = new THREE.Group(); cabo.userData.dyn = 1; h.scene.add(cabo); cabo.position.y = -3;
      h.pose('caboteur', nav(170, 'conteneurs', 0x2a3a2a, 0xe8e4dc), cabo, [0, 0, 0], 170, baies(170, 3).map(n => Math.min(4, n))); soude(h, cabo, famNav);
      { const lp = [79, 16, 0, -73, 25.5, 0, -85, 9, 0]; for (let x = -60; x <= 70; x += 6) lp.push(x, 8.2, -12.2, x, 8.2, 12.2); // feux de mât et de poupe, rampes du pont : le caboteur se voit de nuit, de loin
        const fc = new THREE.BufferGeometry(); fc.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
        const pc = new THREE.Points(fc, new THREE.PointsMaterial({ color: 0xfff2d0, size: 2.5, sizeAttenuation: false, fog: false })); pc.frustumCulled = false; cabo.add(pc);
        const fv = new THREE.BufferGeometry(); fv.setAttribute('position', new THREE.Float32BufferAttribute([-82, 17, 12.5, -82, 17, -12.5], 3)); fv.setAttribute('color', new THREE.Float32BufferAttribute([1, 0.1, 0.1, 0.1, 1, 0.3], 3)); // bâbord rouge, tribord vert
        const pv = new THREE.Points(fv, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true, fog: false })); pv.frustumCulled = false; cabo.add(pv); }
      const CHEM = [[690, CH1 - 16], [1050, 490], [1250, 420], [1405, 342], [1700, 330], [2300, 300], [2600, 290]], CL = [0];
      for (let k = 1; k < CHEM.length; k++) CL.push(CL[k - 1] + Math.hypot(CHEM[k][0] - CHEM[k - 1][0], CHEM[k][1] - CHEM[k - 1][1]));
      const surChemin = d => { d = Math.max(0, Math.min(CL[CL.length - 1], d)); let k = 1; while (k < CL.length - 1 && CL[k] < d) k++; const f = (d - CL[k - 1]) / (CL[k] - CL[k - 1]), a = CHEM[k - 1], b = CHEM[k]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
      const sP = CL[3], sL = CL[5], sF = CL[6], lisse = t => t * t * (3 - 2 * t), entre = (u, a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
      const parcours = u => { const f = ((u % 3) + 3) % 3; // u : tours de la voiture, au fil du tour (1,5 = mi-tour 2) → distance parcourue sur le chemin
        if (f < 0.75 || f >= 2.85) return 0; // à quai (tour 1, et de retour à la sortie du tunnel du tour 3)
        if (f < 1.1) return lisse(entre(f, 0.75, 1.1)) * (sP - 100); // il appareille pendant le tunnel et la ville : vu de loin, il glisse
        if (f < 1.45) return sP - 100 + (f - 1.1) / 0.35 * 320; // le passage sous le pont, à allure de navire (9 m/s) : la voiture approche du pont vers 1,15 et le franchit vers 1,25
        if (f < 2) return sP + 220 + lisse(entre(f, 1.45, 2)) * (sL - sP - 220); // il gagne le large pendant que la voiture est dans le port et le tunnel
        return sL + (f - 2) / 0.85 * (sF - sL); }; // au large, il s'éloigne lentement
      const tours = new WeakMap(), placeCabo = car => { // compte les tours de chaque voiture : en course, dist cumule ; en solo, la session la ramène à 0 à chaque tour
        let e = tours.get(car); if (!e) tours.set(car, e = { n: 0, prev: car.dist }); if (car.dist < e.prev - N / 2) e.n++; e.prev = car.dist;
        const d = parcours(Math.max(0, e.n + car.dist / N)), [x, z] = surChemin(d), [x2, z2] = surChemin(d + 30), [x1, z1] = surChemin(d - 30);
        cabo.position.x = x; cabo.position.z = z; cabo.rotation.y = d > 0 ? Math.atan2(-(z2 - z1), x2 - x1) : 0; };
      const remorqueur = (x, z, ry, dyn) => { const p = new THREE.Group(); p.userData.dyn = dyn; p.position.set(x, -3, z); p.rotation.y = ry; h.scene.add(p); h.pose('remorqueur', nav(30, '', 0xc8302c, 0x1a1a20), p); if (dyn) soude(h, p, famNav); return p; };
      remorqueur(330, CH1 - 22, 0.3); remorqueur(360, CH1 - 40, -0.2); // à l'écart du chemin du caboteur (plus bas)
      for (let k = 0; k < 7; k++) { // au mouillage, au sud de l'île : l'avant face au courant, feux de mouillage
        const L = 160 + rnd() * 110, x = -900 + k * 420 + rnd() * 150, z = ILE[2] + 260 + rnd() * 900, ry = 0.6 + (rnd() - 0.5) * 0.3;
        navire(L, k % 3 ? 'vrac' : 'conteneurs', [0x2a1a1a, 0x1a2a4a, 0x3a3a40][k % 3], [0xe8e4dc, 0xc8442c, 0x2c6ab8][k % 3], x, z, ry, 2.5);
        feuxNav.push(x + Math.cos(ry) * L / 2, 12, z - Math.sin(ry) * L / 2, x, 30, z);
      }
      // dans le chenal, sur une boucle : cap à l'est au nord, demi-tour, cap à l'ouest au sud ; le remorqueur suit le premier
      const passants = [[navire(170, 'conteneurs', 0x3a1a2a, 0xf4f0e0, 0, 0, 0, 3.5, 1), 0], [navire(150, 'vrac', 0x1a3a3a, 0xc8442c, 0, 0, 0, 4, 1), 0.25], [navire(190, 'conteneurs', 0x1a2a4a, 0xe8b02c, 0, 0, 0, 4, 1), 0.5], [navire(140, 'ferry', 0xe8e8e4, 0x2c6ab8, 0, 0, 0, 4, 1), 0.75], [remorqueur(0, 0, 0, 1), 0.04]];
      // en face de l'entrée, à quai sur la rive de la ville : un ferry de nuit, tout éclairé, à côté du tube (sa carène descendrait dans le tunnel)
      navire(180, 'ferry', 0xe8e8e4, 0xc8302c, axe + 110, CH0 + 15, Math.PI);
      const BX0 = -1500, BX1 = 1000, BR = 110, BZ = 310, LB = 2 * (BX1 - BX0) + 2 * Math.PI * BR;
      const boucle = (u, p) => { // u de 0 à 1 le long de la boucle
        let d = (u % 1) * LB; const dr = BX1 - BX0, dc = Math.PI * BR;
        if (d < dr) { p.position.set(BX0 + d, -3, BZ + BR); p.rotation.y = 0; return; } d -= dr;
        if (d < dc) { const a = d / BR; p.position.set(BX1 + Math.sin(a) * BR, -3, BZ + Math.cos(a) * BR); p.rotation.y = a; return; } d -= dc;
        if (d < dr) { p.position.set(BX1 - d, -3, BZ - BR); p.rotation.y = Math.PI; return; } d -= dr;
        const a = d / BR; p.position.set(BX0 - Math.sin(a) * BR, -3, BZ - Math.cos(a) * BR); p.rotation.y = Math.PI + a;
      };
      const nf = new THREE.BufferGeometry(); nf.setAttribute('position', new THREE.Float32BufferAttribute(feuxNav, 3));
      const pnav = new THREE.Points(nf, new THREE.PointsMaterial({ color: 0xfff2d0, size: 2, sizeAttenuation: false, fog: false })); pnav.frustumCulled = false; h.scene.add(pnav);

      // ---------- la ville, au nord : tours à fenêtres allumées qui bordent la voie rapide, de plus en plus hautes vers l'intérieur ----------
      const tour = cols2 => M('tourFenetres', LUM, cols2);
      const tm = [tour(['#ffb85a', '#ffd27a']), tour(['#f4f1e0', '#9fd0ff']), tour(['#ffb85a', '#f4f1e0', '#ff7a5a'])], tl = tm.map(() => []);
      for (let gx = g.box[0] + 30; gx < g.box[2] - 30; gx += 58) for (let gz = g.box[1] + 30; gz < CH0 - 60; gz += 58) {
        const x = gx + rnd() * 16, z = gz + rnd() * 16, d = g.dAt(x, z);
        if (d < W + 26 || g.hAt(x, z) < -1.5 || Math.hypot(x - 860, z + 70) < 70) continue; // la place du chantier de la grue (plus bas)
        const hh = 26 + rnd() * 40 + Math.min(120, d * 0.35) * rnd(), w = 26 + rnd() * 16; tl[rnd() * 3 | 0].push([x, hh / 2 - 1, z, 0, w, hh, w]);
      }
      tl.forEach((l, i) => inst(h, h.geo('bloc'), tm[i], l));
      // ---------- au sol entre les tours, maintenant que la route y est (points 36 à 3 : retour du tunnel et ligne droite) : trottoirs à bordure, voitures garées, palettes, chariots, barrières de chantier ----------
      { const i0 = pt(h, 36), n = (pt(h, 3) - i0 + N) % N, trot = M('trottoir');
        for (const sd of [-1, 1]) { h.ribbon(i0, n, sd * (W + 0.6), 0.15, sd * (W + 5), 0.15, trot, 8); h.ribbon(i0, n, sd * (W + 5), 0.15, sd * (W + 5), -2, beton, 8); } // le trottoir et sa bordure, jusqu'au sol
        const dansTour = (x, z, m) => tl.some(l => l.some(t => Math.abs(x - t[0]) < t[4] / 2 + m && Math.abs(z - t[2]) < t[6] / 2 + m)),
          evite = [[-450, -245, 45], [-175, -95, 30], [CG0[0] - 20, CG0[1], 50]], // péage, enseigne de l'hôtel, chantier de la grue
          ok = (x, z, m) => z < -2 && g.hAt(x, z) > -1.5 && !dansTour(x, z, m) && evite.every(([ex, ez, r]) => Math.hypot(x - ex, z - ez) > r);
        const autos = [], chariots = [], pal = [], barr = [], teintes = [0xe8e4dc, 0x1a1a20, 0x8a8e96, 0xc8302c, 0x2c4a8a, 0xd8d4cc, 0x3a3a40, 0x9a8a6a]; let hz = 23; const al = () => (hz = hz * 16807 % 2147483647) / 2147483647;
        for (let k = 0; k < n; k += 3) { const s = S[(i0 + k) % N], ry = h.across(s) + Math.PI / 2;
          for (const sd of [-1, 1]) { const u = al(), [x, z] = bord(s, sd, W + 7.2); if (!ok(x, z, 2.5)) continue;
            if (u < 0.5) autos.push([x, g.hAt(x, z), z, ry + (al() < 0.5 ? 0 : Math.PI) + (al() - 0.5) * 0.06, 1, 1, 1, teintes[al() * teintes.length | 0]]); // garées le long, en file
            else if (u < 0.56) { const [x2, z2] = bord(s, sd, W + 11 + al() * 6); if (ok(x2, z2, 1.5)) { const nb = 1 + (al() * 3 | 0); for (let q = 0; q < nb; q++) pal.push([x2 + (al() - 0.5) * 3, g.hAt(x2, z2), z2 + (al() - 0.5) * 3, al() * 0.5, 1, 1 + (al() * 5 | 0), 1]); } } // devant les entrepôts
            else if (u < 0.58) { const [x2, z2] = bord(s, sd, W + 12); if (ok(x2, z2, 3)) chariots.push([x2, g.hAt(x2, z2), z2, al() * 6.3]); }
            else if (u < 0.62) for (let q = -1; q <= 1; q++) barr.push([x + s.tx * q * 2.7, g.hAt(x, z), z + s.tz * q * 2.7, h.across(s)]); } } // un trou dans le trottoir, barré
        poses('voitureGaree', { caisse: M('peinture', { c: 0xffffff }), vitre: M('vitreSombre'), feuRouge: M('feuRouge'), feuBlanc: M('matGris'), chassis: M('matGris'), roue: M('roue'), pneu: M('pneu') }, autos, { teinte: 'caisse' });
        insts(h, 'palettes', { bois: M('planches', { c: 0xc8a878 }) }, pal, { a: [1, false] });
        insts(h, 'chariot', { caisse: M('metalClair', { c: 0xe0a020 }), contrepoids: M('matGris'), acier: M('acier'), roue: M('roue') }, chariots);
        insts(h, 'barriere', { rayures: M('rayures', LUM), clignotant: M('clignotant', LUM) }, barr);
        // mobilier du trottoir : distributeurs de boissons éclairés, poubelles, bancs, tournés vers la route ; réverbères de rue de 6 m sur la ligne droite (côté ville), sans lampadaire d'autoroute
        const dis = [], pou = [], bancs = [], rev = [], face = (s, sd) => Math.atan2(s.tz * sd, -s.tx * sd);
        for (let k = 6; k < n; k += 12) { const s = S[(i0 + k) % N];
          for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, W + 3.6), u = al(); if (!ok(x, z, 1)) continue; const y = s.y + 0.15, r = face(s, sd);
            if (u < 0.35) for (let q = 0; q < 2 + (al() * 2 | 0); q++) dis.push([x + s.tx * q * 1.05, y, z + s.tz * q * 1.05, r]);
            else if (u < 0.6) pou.push([x, y, z, r]); else if (u < 0.85) bancs.push([x, y, z, r + Math.PI]); } }
        for (let k = 0; k < n; k += 15) { const i = (i0 + k) % N, s = S[i]; for (const sd of [-1, 1]) { if (i >= pt(h, 36) || i < pt(h, 3) && sd > 0) continue; // les lampadaires d'autoroute éclairent déjà le retour (points 36 à 40) ; la marina n'a que ses bornes
          const [x, z] = bord(s, sd, W + 4.8); if (!ok(x, z, 0.5)) continue; rev.push([x, s.y + 0.15, z, Math.atan2(s.tx * sd, s.tz * sd)]); const [lx, lz] = bord(s, sd, W + 3.7); h.lum(i, lx, s.y + 6, lz, 0xffd8a0, 24, 1.6); } }
        insts(h, 'distributeur', { caisse: M('metalClair', { c: 0xe8e8ec }), facade: M('tourFenetres', LUM, ['#f4f8ff', '#ff4a5a', '#4ab0ff']) }, dis);
        insts(h, 'poubelle', { bac: M('metalClair', { c: 0x2a6a3a }), bac2: M('metalClair', { c: 0x2a4a8a }) }, pou);
        insts(h, 'banc', { vert: M('planches', { c: 0x9a7a5a }), fer: M('matGris') }, bancs);
        insts(h, 'reverbereRue', { fut: M('matGris'), lampe: M('lampe', LUM) }, rev); }
      // le sol entre les tours : des rues (asphalte, trottoirs, passages piétons) calées sur la grille des tours ; à l'est de la tranchée du tunnel, sous la route (plus haute), au-dessus du terrain
      { const x0 = g.box[0] + 67 + 58 * Math.ceil((-560 - g.box[0] - 67) / 58), z0 = g.box[1] + 9, nx = Math.floor((g.box[2] - x0) / 58); let nz = Math.ceil((-14 - z0) / 58); if (z0 + nz * 58 > 12) nz--;
        boite(h, M('rueVille'), nx * 58, 0.3, nz * 58, x0 + nx * 29, -0.45, z0 + nz * 29);
        const rv = []; // réverbères de rue aux carrefours, près de la route
        for (let a = 0; a <= nx; a++) for (let b = 0; b <= nz; b++) for (const [dx, dz] of [[-9, -9], [9, 9]]) { const x = x0 + a * 58 + dx, z = z0 + b * 58 + dz, d = g.dAt(x, z);
          if (d < W + 4 || d > 150 || tl.some(l => l.some(t => Math.abs(x - t[0]) < t[4] / 2 + 1 && Math.abs(z - t[2]) < t[6] / 2 + 1))) continue; rv.push([x, -0.3, z, Math.atan2(-dz, dx)]); if (d < 60) h.lum(near(h, x, z), x, 6, z, 0xffd8a0, 26, 1.4); }
        insts(h, 'reverbereRue', { fut: M('matGris'), lampe: M('lampe', LUM) }, rv); }
      // ---------- le front de mer est, de la marina au pont (sous le grand virage qui monte, points 3 à 5) : vu d'en haut, c'était un grand aplat noir entre la route et les tours.
      // Quai et promenade éclairée le long du chenal, palmiers, et derrière, des lots : restaurants à terrasse, entrepôts bas, parkings ----------
      { const X0 = 1040, X1 = 1720, ZQ = CH0 - 2; let hz = 31; const al = () => (hz = hz * 16807 % 2147483647) / 2147483647;
        const dansTour = (x, z, m) => tl.some(l => l.some(t => Math.abs(x - t[0]) < t[4] / 2 + m && Math.abs(z - t[2]) < t[6] / 2 + m));
        const terre = (x, z, m = 6) => g.dAt(x, z) > W + m && g.hAt(x, z) > -1.5 && z < ZQ - 1 && !dansTour(x, z, 2);
        boite(h, M('dallesQuai'), X1 - X0, 0.3, ZQ + 230, (X0 + X1) / 2, -0.4, (ZQ - 230) / 2); // dalles claires sur tout le quartier (au-dessus des rues, sous la route qui monte)
        boite(h, beton, X1 - X0, 4, 3, (X0 + X1) / 2, -2, ZQ + 1.5); // le quai
        const palmT = [], palmP = [], bancs = [], rev = [], bornes = [], feux = [], autos = [], stores = [], terr = [], gens = [], lumF = [], lumC = [];
        for (let x = X0 + 8; x < X1; x += 16) { if (!terre(x, ZQ - 4, 3)) continue; bornes.push([x, -0.25, ZQ - 2]); feux.push(x, 0.8, ZQ - 2); // bornes du quai, comme à la marina
          if (x % 32 < 16 && terre(x, ZQ - 12)) { const ht = 9 + al() * 4; palmT.push([x, ht / 2 - 0.25, ZQ - 12, 0, 1, ht, 1]); palmP.push([x, ht - 0.25, ZQ - 12, al() * 6.3]); }
          if (x % 48 < 16 && terre(x, ZQ - 20)) { rev.push([x, -0.25, ZQ - 20, 0]); h.lum(near(h, x, ZQ - 20), x, 6, ZQ - 19, 0xffd8a0, 30, 1.6); }
          else if (terre(x, ZQ - 18)) bancs.push([x, -0.25, ZQ - 18, Math.PI]); }
        const bat = [[], []], entrepots = [], enseignes = [], parcs = [];
        for (let lz = ZQ - 64; lz > -230; lz -= 44) for (let lx = X0 + 4 + al() * 10; lx < X1 - 40; lx += 52) { // lots de 44 × 34 m, façade vers le chenal (+z)
          if (![[0, 0], [44, 0], [0, 34], [44, 34], [22, 17]].every(([dx, dz]) => terre(lx + dx, lz + dz))) continue;
          const u = al(), cx = lx + 22, cz = lz + 17;
          if (u < 0.38) { // restaurant : salle aux vitres chaudes, store rayé, terrasse et sa guirlande, clients
            bat[al() < 0.5 ? 0 : 1].push([cx, 3.5 - 0.25, cz - 4, 0, 22, 7, 12]); stores.push([cx, -0.25, cz + 2, 0, 1, 1, 1, [0xc8304a, 0x2a6a4a, 0xe8a020][al() * 3 | 0]]);
            for (const dz of [4, 7.5]) terr.push([cx, -0.25, cz + dz, 0]);
            for (let k = 0; k < 6; k++) gens.push([cx - 6 + al() * 12, -0.25, cz + 4 + al() * 6, al() * 6.3, 0.95 + al() * 0.1]);
            for (let x = cx - 11; x <= cx + 11; x += 1) { lumF.push(x, 4.2 - Math.abs(Math.sin((x - cx) / 5.5 * Math.PI)) * 0.6, cz + 9); lumC.push(...[[1, 0.85, 0.4], [1, 0.5, 0.3]][x & 1]); }
            h.lum(near(h, cx, cz), cx, 4, cz + 6, 0xffb860, 28, 1.8); }
          else if (u < 0.72) { // entrepôt bas : bardage, enseigne lumineuse, lampe au-dessus des portes
            entrepots.push([cx, 4.5 - 0.25, cz - 2, 0, 40, 9, 26]); enseignes.push([cx, 7.6, cz + 11.1]); h.lum(near(h, cx, cz), cx, 6, cz + 13, 0xe8f0ff, 22, 1.2); }
          else { parcs.push([cx, cz]); for (const dz of [-8, 8]) for (let x = lx + 3; x < lx + 42; x += 3) if (al() < 0.65) autos.push([x, -0.25, cz + dz, Math.PI / 2 + (al() < 0.5 ? 0 : Math.PI), 1, 1, 1, [0xe8e4dc, 0x1a1a20, 0x8a8e96, 0xc8302c, 0x2c4a8a, 0x3a3a40][al() * 6 | 0]]);
            rev.push([lx + 1, -0.25, cz, 0]); h.lum(near(h, lx, cz), lx + 2, 6, cz, 0xffd8a0, 26, 1.2); } }
        for (const [cx, cz] of parcs) boite(h, M('parc'), 44, 0.3, 34, cx, -0.3, cz);
        bat.forEach((l, i) => inst(h, h.geo('bloc'), M('tourFenetres', LUM, i ? ['#ffd27a', '#ffb85a'] : ['#ffe8c0', '#ff9a5a']), l));
        inst(h, h.geo('bloc'), M('entrepot'), entrepots);
        inst(h, h.geo('boite', 14, 1.6, 0.3), M('ecrit', LUM, 96, 12, '#0e3a5a', '#f4f1e0', '湾岸倉庫  BAY WAREHOUSE', 9), enseignes);
        inst(h, h.geo('troncPalmier'), M('troncPalmier'), palmT); insts(h, 'palmes', { palme: M('palme', { side: THREE.DoubleSide }) }, palmP);
        insts(h, 'store', { toile: M('toileRayee', { side: THREE.DoubleSide }), fer: M('fonte') }, stores, { teinte: 'toile' });
        insts(h, 'terrasse', { plateau: M('craie'), fer: M('fonte'), canne: M('bruit', {}, '#b8925a', ['#8a6a3a', '#d0b080']) }, terr);
        insts(h, 'fetard', { corps: M('vitreSombre') }, gens);
        insts(h, 'banc', { vert: M('planches', { c: 0x9a7a5a }), fer: M('matGris') }, bancs);
        insts(h, 'borneQuai', { fut: M('matGris'), lampe: M('lampe', LUM) }, bornes);
        insts(h, 'reverbereRue', { fut: M('matGris'), lampe: M('lampe', LUM) }, rev);
        poses('voitureGaree', { caisse: M('peinture', { c: 0xffffff }), vitre: M('vitreSombre'), feuRouge: M('feuRouge'), feuBlanc: M('matGris'), chassis: M('matGris'), roue: M('roue'), pneu: M('pneu') }, autos, { teinte: 'caisse' });
        const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(feux.concat(lumF), 3)); fg.setAttribute('color', new THREE.Float32BufferAttribute(feux.map((v, k) => [1, 0.88, 0.66][k % 3]).concat(lumC), 3));
        const pf = new THREE.Points(fg, new THREE.PointsMaterial({ size: 2.5, sizeAttenuation: false, vertexColors: true })); pf.frustumCulled = false; h.scene.add(pf); }
      // au loin, hors brouillard : la ville derrière, une côte en face de l'autre côté de la baie, la zone industrielle à l'est, un grand pont suspendu à l'ouest
      const loins = [['#0a1020', ['#ffb85a', '#f4f1e0', '#ffd27a'], 90], ['#0c0e18', ['#9fd0ff', '#f4f1e0'], 60], ['#140c10', ['#ff9a5a', '#ffd27a'], 40]].map(([f, c, n]) => M('tourLoin', { lum: 1, fog: false }, f, c, n)), ll = loins.map(() => []);
      const amas = (cx, cz, n, rx, rz, hmin, hmax, wmin) => { for (let i = 0; i < n; i++) { const hh = hmin + rnd() * rnd() * (hmax - hmin), w = wmin + rnd() * wmin; ll[i % 3].push([cx + (rnd() - 0.5) * rx, hh / 2 - 4, cz + (rnd() - 0.5) * rz, 0, w, hh, w]); } };
      for (let i = 0; i < 60; i++) { const a = 3.3 + rnd() * 2.8, r = 1900 + rnd() * 900, hh = 120 + rnd() * rnd() * 420, w = 60 + rnd() * 110; ll[0].push([500 + Math.cos(a) * r * 1.4, hh / 2 - 1, -100 + Math.sin(a) * r, 0, w, hh, w]); }
      amas(600, 3600, 70, 4200, 500, 30, 180, 40); amas(-1600, 3000, 30, 1200, 600, 20, 90, 40); amas(3900, 800, 40, 500, 2600, 20, 120, 50); amas(-3300, -300, 40, 600, 2200, 30, 200, 50);
      ll.forEach((l, i) => inst(h, h.geo('bloc'), loins[i], l));
      const lointains = [], cLoin = [], feu = (x, y, z, c) => { lointains.push(x, y, z); cLoin.push(...c); };
      for (let i = 0; i < 700; i++) { const x = -1600 + rnd() * 5000, z = 3300 + rnd() * rnd() * 900; feu(x, -2, z, rnd() < 0.7 ? [1, 0.72, 0.4] : [0.9, 0.95, 1]); } // la côte d'en face : un ruban de lumières
      for (let i = 0; i < 18; i++) { const x = 3600 + rnd() * 600, z = -1000 + rnd() * 2600, hh = 40 + rnd() * 80; feu(x, hh, z, [1, 0.1, 0.15]); ll[1].push([x, hh / 2, z, 0, 6, hh, 6]); } // cheminées d'usine à feu rouge
      for (let i = 0; i < 4; i++) feu(3500 + i * 60, 60 + i * 5, 300 + i * 220, [1, 0.6, 0.1]); // torchères
      for (let k = 0; k <= 80; k++) { const t = k / 80, x = -2600 + t * 1500, z = 1700 + t * 1900, cat = Math.abs(t - 0.5) < 0.25 ? 1 - ((t - 0.5) / 0.25) ** 2 : ((Math.abs(t - 0.5) - 0.25) / 0.25) ** 2 * 0.6; feu(x, 40, z, [1, 0.85, 0.5]); if (k % 2 === 0) feu(x, 40 + 130 * (1 - cat), z, [0.9, 0.95, 1]); } // pont suspendu : tablier et câble porteur
      for (const t of [0.25, 0.75]) ll[1].push([-2600 + t * 1500, 85, 1700 + t * 1900, 0.67, 8, 180, 8]);
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lointains, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(cLoin, 3));
      const ploin = new THREE.Points(lg, new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, fog: false })); ploin.frustumCulled = false; h.scene.add(ploin);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(balises.concat(feuxRouges), 3));
      const bp = new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xff2030, size: 2, sizeAttenuation: false, fog: false })); bp.frustumCulled = false; h.scene.add(bp);

      // ---------- grande roue sur le front de mer : support en A, rotor (jante double, rayons, moyeu) qui porte les lumières, nacelles qui restent d'aplomb ----------
      const HR = 78, RR = 70, roueG = new THREE.Group(); roueG.userData.dyn = 1; roueG.position.set(620, g.hAt(620, 40) + HR, 40); roueG.rotation.y = 0.5; h.scene.add(roueG);
      const acierR = M('metalClair', { c: 0xe8ecf4 });
      h.pose('roueSupport', { acier: acierR, socle: M('entrepot') }, roueG, [0, 0, 0], HR);
      const rotor = new THREE.Group(); roueG.add(rotor); h.pose('roueRotor', { jante: acierR, rayon: acierR, moyeu: M('matGris') }, rotor, [0, 0, 0], RR);
      const rp = [], rc = [];
      for (const z of [-4.2, 4.2]) for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283; rp.push(Math.cos(a) * RR, Math.sin(a) * RR, z); rc.push(...[[1, 0.3, 0.6], [0.3, 0.9, 1], [1, 0.9, 0.3]][i % 3]); if (i % 6 === 0) for (let r = 10; r < RR; r += 12) { rp.push(Math.cos(a) * r, Math.sin(a) * r, z); rc.push(1, 1, 1); } }
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3));
      const roue2 = new THREE.Points(rg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, fog: false })); roue2.frustumCulled = false; rotor.add(roue2);
      // le pied de la roue : esplanade dallée, guichets, manège qui tourne, file d'attente, guirlandes ; la roue sort de la terre gardée entre les deux bassins de la marina
      const manege = new THREE.Group(); manege.userData.dyn = 1; manege.position.set(672, 0.05, 46); h.scene.add(manege);
      { boite(h, M('dallesQuai'), 150, 0.3, 46, 620, -0.1, 37);
        h.pose('carrousel', { socle: M('planches', { c: 0xd8b07a }), mat: M('metalClair', { c: 0xe8c040 }), toit: M('metalClair', { c: 0xc8304a }), barre: M('metalClair', { c: 0xe8c040 }), cheval: M('metalClair', { c: 0xf4f0ea }) }, manege);
        const lm = [], lc = []; for (let k = 0; k < 40; k++) { const a = k / 40 * 6.283; lm.push(Math.cos(a) * 8, 6.4, Math.sin(a) * 8); lc.push(...[[1, 0.85, 0.3], [1, 0.3, 0.6], [0.3, 0.9, 1]][k % 3]); }
        const mg2 = new THREE.BufferGeometry(); mg2.setAttribute('position', new THREE.Float32BufferAttribute(lm, 3)); mg2.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
        const pm2 = new THREE.Points(mg2, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true })); pm2.frustumCulled = false; manege.add(pm2);
        const gu = [[562, 20], [574, 20], [666, 22], [678, 22]].map(([x, z]) => [x, 0.05, z, Math.PI]);
        insts(h, 'guichet', { cabane: M('metalClair', { c: 0xf4ece0 }), vitre: M('tourFenetres', LUM, ['#ffe2a0']), auvent: M('rayures', LUM), enseigne: M('ecrit', LUM, 64, 14, '#c8304a', '#ffffff', 'TICKETS', 9) }, gu);
        const file = []; for (let k = 0; k < 14; k++) file.push([560 + (k % 7) * 2.2 + (k > 6 ? 108 : 0), 0.05, 15.5 + (rnd() - 0.5), rnd() * 6.3, 0.95 + rnd() * 0.1]);
        insts(h, 'fetard', { corps: M('vitreSombre') }, file);
        const gl = [], gc = []; for (let x = 548; x <= 692; x += 2) { gl.push(x, 4 - Math.abs(Math.sin((x - 548) / 12 * Math.PI)) * 1.2, 15); gc.push(...[[1, 0.85, 0.3], [1, 0.4, 0.7]][(x / 2) & 1]); } // guirlande festonnée le long de l'esplanade
        const gg2 = new THREE.BufferGeometry(); gg2.setAttribute('position', new THREE.Float32BufferAttribute(gl, 3)); gg2.setAttribute('color', new THREE.Float32BufferAttribute(gc, 3));
        const pg2 = new THREE.Points(gg2, new THREE.PointsMaterial({ size: 2.5, sizeAttenuation: false, vertexColors: true })); pg2.frustumCulled = false; h.scene.add(pg2);
        for (const x of [560, 620, 680]) h.lum(near(h, x, 0), x, 5, 24, x === 620 ? 0xff6ab0 : 0xffd890, 30, 1.8); }
      const NN = 24, nacelles = new THREE.InstancedMesh(h.geo('nacelle'), M('nacelle', LUM, '#e8e8e8'), NN), dn = new THREE.Object3D(); nacelles.frustumCulled = false; roueG.add(nacelles);
      for (let k = 0; k < NN; k++) nacelles.setColorAt(k, new THREE.Color([0xff4a8a, 0x4ac8ff, 0xffd84a, 0x6aff8a][k % 4]));

      // ---------- le phare rouge et blanc au bout de l'île, au bord de l'eau : l'épingle (points 11 à 16) en fait le tour ; son faisceau tourne, court et discret ----------
      const blancP = M('metalClair', { c: 0xf2f0ea }), rougeP = M('metalClair', { c: 0xc8202a }), yPH = g.hAt(PH[0], PH[1]);
      h.pose('phare', { beton, rouge: rougeP, blanc: blancP, acier: gris, lampe: M('lampe', LUM) }, h.scene, [PH[0], yPH, PH[1]]);
      const feuPhare = new THREE.Group(); feuPhare.userData.dyn = 1; feuPhare.position.set(PH[0], yPH + 27.8, PH[1]); h.scene.add(feuPhare);
      const mFais = h.addMat(h.tx('degrade', '#fff2c0', true), { opacity: 0.18 });
      for (const sd of [-1, 1]) { const b = new THREE.Mesh(h.geo('faisceau'), mFais); b.rotation.z = sd * Math.PI / 2; b.scale.set(0.1, 0.15, 1); feuPhare.add(b); } // deux pinceaux opposés de 135 m, un plan vertical chacun : en croix, ils couvraient l'écran en passant au-dessus de l'épingle (banc : pires images à 60 ms)
      h.lum(near(h, PH[0], PH[1]), PH[0], yPH + 6, PH[1], 0xfff2d0, 40, 1.2); // le pied du phare éclairé : on le voit dans l'épingle

      // ---------- la marina, le long de la ligne droite du départ (points 0 à 3, au ras de l'eau) : promenade, quai à bornes lumineuses basses (pas de lampadaires),
      // ponton principal le long du quai et pontons en peigne, voiliers et vedettes à leur place, et un yacht à quai en bout de bassin, où la fête bat son plein ----------
      const fete = []; // groupes de guirlandes du yacht, que tick fait clignoter tour à tour
      { const bords = [[30, 540], [700, 1040]], blancB = M('metalClair', { c: 0xf2f0ea }), hub = M('tourFenetres', LUM, ['#ffd27a', '#f4f1e0']), planches = M('planches', { c: 0xb89a70 });
        for (const [x0, x1] of bords) { boite(h, eau, x1 - x0, 1, CH0 - MQ, (x0 + x1) / 2, -3.5, (MQ + CH0) / 2); boite(h, beton, x1 - x0, 4, 3, (x0 + x1) / 2, -2, MQ); // l'eau du bassin et son quai
          boite(h, M('dallesQuai'), x1 - x0, 0.3, MQ - W - 6.5, (x0 + x1) / 2, -0.1, (MQ - 1.5 + W + 5) / 2); } // la promenade, de la route au quai
        const bornes = [], feux = [], pontons = [], voiliers = [], vedettes = [];
        for (const [x0, x1] of bords) {
          for (let x = x0 + 6; x < x1; x += 15) { bornes.push([x, 0, MQ - 2]); feux.push(x, 1.05, MQ - 2); if ((x - x0) % 30 < 15) h.lum(near(h, x, 0), x, 3, MQ + 4, 0xffe0a8, 36, 2.2); } // bornes de quai ; une sur trois éclaire (jusqu'à la route)
          pontons.push([(x0 + x1) / 2, -3.55, MQ + 3.5, 0, x1 - x0 - 4, 1, 1]); // le ponton principal, le long du quai
          for (let fx = x0 + 8; fx < x1 - 6; fx += 24) { if (fx > 410 && fx < 540) continue; // la place du yacht
            pontons.push([fx, -3.55, MQ + 30, Math.PI / 2, 50, 1, 1]); bornes.push([fx, -2.98, MQ + 54]); feux.push(fx, -1.93, MQ + 54); // un ponton en peigne, la même borne en bout
            if (fx + 24 >= x1 - 6) continue;
            // les places : le long de chaque ponton, des deux côtés de l'allée d'eau (16 m au milieu), du quai jusqu'au bout ; une sur quatre libre, au hasard
            for (const [cx, sens] of [[fx + 3.4, 1], [fx + 20.6, -1]]) for (let bz = MQ + 8; bz < MQ + 52;) { const L = 8 + rnd() * 8; if (bz + L > MQ + 54) break;
              if (rnd() > 0.26) { const v = rnd() < 0.55; (v ? voiliers : vedettes).push([cx + sens * (L * 0.16 - 2.4), -3.45, bz + L / 2, (rnd() < 0.7 ? -1 : 1) * Math.PI / 2 + (rnd() - 0.5) * 0.04, L, L, L]); }
              bz += L + 1.5; } } }
        insts(h, 'borneQuai', { fut: M('matGris'), lampe: M('lampe', LUM) }, bornes);
        insts(h, 'ponton', { planches, flotteur: M('matGris') }, pontons, { a: [1] }); // ponton de 1 m étiré à sa longueur (les planches suivent)
        const peauB = { coque: blancB, pont: planches, hublots: hub, mat: M('acier'), liston: M('metalClair', { c: 0x1a2a4a }), rouf: M('metalClair', { c: 0xe8e4dc }), voile: M('metalClair', { c: 0x2a4a7a }), blanc: blancB };
        poses('voilier', peauB, voiliers); poses('vedette', { ...peauB, coque: M('metalClair', { c: 0xe8e4dc }) }, vedettes);
        // le yacht de la fête : à quai au bout du ponton principal ouest, parallèle au quai ; fêtards sur le pont arrière et sur le fly, guirlandes qui clignotent, lumière rose et cyan
        const YX = 470, YZ = MQ + 14, yacht = new THREE.Group(); yacht.position.set(YX, -2.7, YZ); yacht.rotation.y = Math.PI; h.scene.add(yacht);
        h.pose('yacht', { coque: blancB, pont: planches, blanc: blancB, hublots: M('tourFenetres', LUM, ['#ffb0e0', '#ffe8c0', '#a0e8ff']) }, yacht);
        const gens = []; for (let k = 0; k < 34; k++) { const fly = k > 20, x = fly ? -12 + rnd() * 16 : -20 + rnd() * 10, z = (rnd() - 0.5) * (fly ? 5.6 : 6.8); gens.push([x, fly ? 7.48 : 2.38, z, rnd() * 6.3, 0.9 + rnd() * 0.2]); }
        { const mC = M('vitreSombre'), d = new THREE.Object3D(), mF = new THREE.InstancedMesh(h.zones('fetard', { corps: mC }).corps, mC, gens.length); mF.frustumCulled = false; // dans le repère du yacht
          gens.forEach((p, k) => { d.position.set(p[0], p[1], p[2]); d.rotation.set(0, p[3], 0); d.scale.setScalar(p[4]); d.updateMatrix(); mF.setMatrixAt(k, d.matrix); }); yacht.add(mF); }
        for (const [cols2, y, x0, x1, zz] of [[[1, 0.2, 0.7], 3.3, -21, -1, 4], [[0.2, 0.9, 1], 8.4, -14, 8, 3.5], [[1, 0.85, 0.2], 3.3, -21, -1, -4], [[1, 0.2, 0.7], 8.4, -14, 8, -3.5]]) { // guirlandes le long des garde-corps
          const lp = []; for (let x = x0; x <= x1; x += 0.8) lp.push(x, y + Math.sin(x * 0.7) * 0.15, zz);
          const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
          const pg = new THREE.Points(gg, new THREE.PointsMaterial({ color: new THREE.Color(...cols2), size: 3, sizeAttenuation: false })); pg.frustumCulled = false; yacht.add(pg); fete.push(pg); }
        yacht.userData.dyn = 1;
        h.lum(near(h, YX, 0), YX - 6, 8, YZ, 0xff3ab0, 40, 3.2); h.lum(near(h, YX + 20, 0), YX + 12, 11, YZ, 0x3ad0ff, 36, 2.4);
        const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(feux, 3));
        const pm = new THREE.Points(mg, new THREE.PointsMaterial({ color: 0xffe8c0, size: 2, sizeAttenuation: false })); pm.frustumCulled = false; h.scene.add(pm); }

      // ---------- en face de la marina, côté ville : une grue de chantier illuminée ----------
      const CG = CG0, grueC = new THREE.Group(); grueC.userData.dyn = 1; grueC.position.set(CG[0], g.hAt(CG[0], CG[1]), CG[1]); h.scene.add(grueC);
      const jaune = M('metalClair', { c: 0xe8b020 });
      h.pose('grueTour', { beton, treillis: M('treillis', { alphaTest: 0.5, side: THREE.DoubleSide }, '#e8b020'), acier: jaune, cabine, vitre }, grueC);
      boite(h, beton, 30, 34, 30, CG[0] - 34, g.hAt(CG[0], CG[1]) + 17, CG[1] - 10); // la tour en chantier : un noyau de béton, pas encore de façade
      { const lp = [], lc = []; // guirlande de lampes le long du mât et de la flèche (blanc), lampes rouges en pointe et en bout de flèche
        for (let y = 3; y < 60; y += 2.5) lp.push(1, y, 1), lc.push(1, 0.95, 0.85);
        for (let x = -16; x <= 50; x += 2) lp.push(x, 62, 0), lc.push(1, 0.95, 0.85);
        for (const p of [[0, 69, 0], [50, 62.5, 0], [-17, 62.5, 0]]) lp.push(...p), lc.push(1, 0.1, 0.15);
        const lg2 = new THREE.BufferGeometry(); lg2.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg2.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
        const pg = new THREE.Points(lg2, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, fog: false })); pg.frustumCulled = false; grueC.add(pg); }

      // ---------- le portique mobile de l'enfilade : un des portiques de parc roule au-dessus de la route, d'avant en arrière (voir l'enfilade, plus haut) ----------
      const portM = new THREE.Group(); portM.userData.dyn = 1; h.scene.add(portM);
      h.pose('grueParc', { structure: M('metalClair', { c: 0xe0b020 }), cabine, vitre, roue, machinerie }, portM, [0, 0, 0], 36);
      { const s = S[iPm], [x, z] = bord(s, 1, 18); h.lum(iPm, x, s.y + 22, z, 0xffc040, 40, 1.4); } // gyrophare et éclairage du portique

      // ---------- le péage abandonné (points 30 à 31) : gare sur dalle de part et d'autre du viaduc, guérites éteintes mais vitres au sodium, auvent sur toute la largeur ----------
      { const s = S[near(h, -450, -245)], r = repere(h, s), dalle = M('bitume'), L = 2 * W + 44;
        h.pose('auventPeage', { toit: M('betonGris'), lampe: M('sodium', LUM), acier: gris, enseigne: M('ecrit', LUM, 128, 16, '#3a2a10', '#ffb040', '料金所  TOLL  閉鎖 CLOSED', 11) }, r, [0, 0, 0], L);
        for (const sd of [-1, 1]) { h.pose('boite', dalle, r, [sd * (W + 11.5), -0.6, 0], 21, 1, 36); // la dalle des voies fermées, au niveau de la chaussée
          for (const sz of [-12, 12]) h.pose('boite', beton, r, [sd * (W + 11.5), -s.y / 2 - 1, sz], 3, s.y, 3); // ses piles
          for (const e of [5, 11, 17]) h.pose('guerite', { beton, nez: M('rayures', LUM), cabine: blancP, vitre: M('sodium', LUM) }, r, [sd * (W + e), 0, 0]); }
        h.lum(near(h, -450, -245), s.x, s.y + 7, s.z, 0xffa040, 36, 2.6); }

      // ---------- l'enseigne de love hotel (point 32) : la première lumière rose de la ville, sur un mât au bord du viaduc, devant l'hôtel ----------
      { const i = near(h, -175, -95), s = S[i], [x, z] = bord(s, -1, W + 9), r = repere(h, s); r.position.set(x, s.y - 2, z);
        h.pose('enseigneHotel', { acier: gris, enseigne: M('ecrit', LUM, 128, 52, '#2a0418', '#ff4ab0', 'HOTEL ♥ LOVE', 30), coeur: M('lampe', { lum: 1, c: 0xff3a8a }), vacant: M('ecrit', LUM, 64, 14, '#08200e', '#5aff8a', '空室 VACANT', 10) }, r);
        const [hx, hz] = bord(s, -1, W + 40); boite(h, tour(['#ff4ab0', '#ffb0d8', '#b05aff']), 26, 30, 22, hx, g.hAt(hx, hz) + 14, hz);
        h.lum(i, x, s.y + 14, z, 0xff4ab0, 30, 1.8); }

      // ---------- camions : un tracteur à cabine avancée et une remorque (conteneur, citerne ou plateau à bobines), qui suivent le trafic de sim.js ----------
      const nt = h.M.trafic, dc = new THREE.Object3D(), types = ['remorqueConteneur', 'remorqueCiterne', 'remorquePlateau'];
      const flotte = (nom, peau, n) => Object.entries(h.zones(nom, peau)).map(([zn, geo]) => { const m = new THREE.InstancedMesh(geo, peau[zn], Math.max(1, n)); m.count = n; m.frustumCulled = false; m.userData.dyn = 1; h.scene.add(m); return m; });
      const cabineC = M('metalClair'), caisseC = M('tole');
      const tracteursC = flotte('tracteur', { chassis, pneu, cabine: cabineC, vitre, calandre: M('calandre'), phare: lampe, feuOrange: clign, roue }, nt);
      const remorques = types.map((nom, t) => flotte(nom, { chassis, roue, pneu, feu: feuRouge, caisse: caisseC, cuve: M('inox'), plateau: M('planches'), bobine: M('bobine'), sangle: M('sangle') }, Math.ceil((nt - t) / 3)));
      const teintesCab = [0x2c6ab8, 0xe8e4dc, 0xc8302c, 0x1f8f5a, 0xd8a02c, 0x5a5e66, 0xe86a1a, 0x2a2a34, 0x7a9ac8].map(c => new THREE.Color(c));
      for (let i = 0; i < nt; i++) {
        for (const m of tracteursC) if (m.material === cabineC) m.setColorAt(i, teintesCab[i % teintesCab.length]);
        if (i % 3 === 0) for (const m of remorques[0]) if (m.material === caisseC) m.setColorAt(i / 3, new THREE.Color(cols[(i * 5) % cols.length]));
      }
      const vus = [...tracteursC, ...remorques.flat()];
      for (const m of vus) if (m.instanceColor) m.instanceColor.needsUpdate = true;
      const tick = (dt, now) => {
        fete.forEach((p, k) => { p.visible = ((now / 469 | 0) + k) % 3 !== 0; }); // les guirlandes du yacht au tempo (128 bpm)
        feuPhare.rotation.y = now * 0.0009; grueC.rotation.y = Math.sin(now * 0.00007) * 0.8; // un tour de phare toutes les 7 s ; la grue pivote lentement
        { const u = iPm + N + Math.sin(now * 0.00025) * 10, j = Math.floor(u), f = u - j, a = S[j % N], b = S[(j + 1) % N]; // ±20 m le long de la route, un aller-retour en 25 s
          portM.position.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f); portM.rotation.y = h.across(a); }
        manege.rotation.y = now * 0.0006; rotor.rotation.z = now * 0.00012; bp.visible = (now / 700 & 1) === 1; ptsBouees.visible = (now / 1100 & 3) === 0;
        for (let k = 0; k < NN; k++) { const a = k / NN * 6.2832 + rotor.rotation.z; dn.position.set(Math.cos(a) * RR, Math.sin(a) * RR - 2.2, 0); dn.updateMatrix(); nacelles.setMatrixAt(k, dn.matrix); } // la nacelle pend sous la jante, toujours d'aplomb
        nacelles.instanceMatrix.needsUpdate = true;
        for (const [p, ph] of passants) boucle(now * 0.007 / LB + ph, p); // 7 m/s
        const vis = h.temps() >= 0; for (const m of vus) m.visible = vis; if (!vis) return; // pas de camions en mode course
        trafic(T, h.temps()).forEach((k, i) => {
          dc.position.set(k.x, k.y, k.z); dc.rotation.set(0, -k.th, 0); dc.updateMatrix();
          for (const m of tracteursC) m.setMatrixAt(i, dc.matrix);
          for (const m of remorques[i % 3]) m.setMatrixAt(i / 3 | 0, dc.matrix);
        });
        for (const m of vus) m.instanceMatrix.needsUpdate = true;
      };
      tick.vue = placeCabo; return tick;
    },
  });
})();
