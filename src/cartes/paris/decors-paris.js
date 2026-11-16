// Placement du décor de « paris » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  Object.assign(DECORS, {
    // ---------- Premier métro : la largeur de chaussée est la même partout (sim.js), mais la rue change de taille : grand boulevard à contre-allées
    // et double rangée d'arbres, avenue, rue, ruelle de la butte aux maisons basses collées au trottoir, quai ouvert sur la Seine, place. ----------
    paris(h) {
      const { THREE, S, N, W, rnd, M } = h, quai = (x, z) => z > 250 && x > -170 && x < 1060; // côté fleuve des quais
      const PL = M.place, C = PL.c, RT = PL.r + 6, horsPlace = (x, z) => (x - C[0]) ** 2 + (z - C[1]) ** 2 > (PL.r + 1) ** 2; // la place : centre, pied des façades
      const IY = 1.5, WY = -8, rive = x => x > 180 && x < 820 ? 280 : 248; // niveau de la Seine ; sa rive : au ras des voies sur berge, en retrait du tunnel qui passe dessous (il va jusqu'à z 272 au point 29)
      const g = terrain(h, { pas: 16, marge: 320, mat: h.mat('bruit', {}, '#6e6a66', ['#7a7672', '#625e5a']), creux: (x, z) => quai(x, z) ? Math.max(0, Math.min(9, (z - rive(x)) * 0.6)) : 0 });
      const eau = h.mat('bruit', { lum: 1, rep: [40, 20] }, '#1e3a3a', ['#2a4a48', '#c08a7a', '#16302e']); // la Seine, qui prend le rose du ciel
      boite(h, eau, 1710, 1, 710, 595, WY - 0.5, 635); for (const [x0, x1] of [[-260, 180], [820, 1060]]) boite(h, eau, x1 - x0, 1, 18, (x0 + x1) / 2, WY - 0.5, 255);
      let graine = 1; const al = () => (graine = graine * 16807 % 2147483647) / 2147483647; // hasard propre aux nouveaux placements : ne décale pas rnd
      // ruban le long de la piste dont les bords suivent la largeur locale : fa(s), fb(s) = écarts à l'axe ; à plat, la texture est plaquée en plan (une tuile tous les `tuile` m)
      // ya, yb = hauteurs, nombres ou fonctions (s, k) de l'échantillon et du rang dans le ruban
      const ruban = (i0, cnt, fa, ya, fb, yb, m) => {
        const t = m.userData.tuile || 4, pos = [], uv = [], idx = [], Y = (v, s, k) => typeof v === 'function' ? v(s, k) : v;
        for (let k = 0; k <= cnt; k++) {
          const s = S[(i0 + k) % N], a = fa(s), b = fb(s), y1 = Y(ya, s, k), y2 = Y(yb, s, k), A = [s.x - s.tz * a, s.y + y1, s.z + s.tx * a], B = [s.x - s.tz * b, s.y + y2, s.z + s.tx * b];
          pos.push(...A, ...B); uv.push(...(ya === yb ? [A[0] / t, A[2] / t, B[0] / t, B[2] / t] : [k * 2 / t, y1 / t, k * 2 / t, y2 / t]));
          if (k < cnt) idx.push(2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 1, 2 * k + 3, 2 * k + 2);
        }
        return nappe(pos, uv, idx, m);
      };
      const nappe = (pos, uv, idx, m) => { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals();
        const me = new THREE.Mesh(ge, m); me.receiveShadow = true; h.scene.add(me); return me; };
      // couronne horizontale de centre (cx, cz), du rayon r0 à r1, à l'altitude y, en n secteurs ; garde(x, z) = faux pour sauter un secteur
      const couronne = (cx, cz, r0, r1, y, n, m, garde = () => true) => {
        const t = m.userData.tuile || 4, pos = [], uv = [], idx = [];
        for (let k = 0; k < n; k++) { const a0 = k / n * 6.2832, a1 = (k + 1) / n * 6.2832, am = (a0 + a1) / 2, rm = (r0 + r1) / 2;
          if (!garde(cx + Math.cos(am) * rm, cz + Math.sin(am) * rm, a0, a1)) continue;
          const v = pos.length / 3; for (const [r, a] of [[r0, a0], [r1, a0], [r1, a1], [r0, a1]]) { const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; pos.push(x, y, z); uv.push(x / t, z / t); }
          idx.push(v, v + 2, v + 1, v, v + 3, v + 2); }
        return nappe(pos, uv, idx, m);
      };
      const proche = (x, z) => { let b = S[0], bd = 1e18; for (const s of S) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = s; } } return [Math.sqrt(bd), b]; }; // échantillon le plus proche et sa distance
      // types de rue : recul = distance du trottoir à la façade, H = hauteur des immeubles, arbres = rangées (distance au bord), gare = stationnement
      const TYPES = { boulevard: { recul: 21, H: [26, 30], arbres: [5.5, 15], gare: 2 }, avenue: { recul: 11, H: [22, 26], arbres: [6], gare: 1 }, rue: { recul: 3.2, H: [18, 22], arbres: [], gare: 0 },
        ruelle: { recul: 1, H: [9, 15], arbres: [], gare: 0 }, quai: { recul: 6.5, H: [20, 24], arbres: [], gare: 1 }, berge: { recul: 16, H: [26, 30], arbres: [], gare: 0 }, place: { recul: 6, H: [26, 28], arbres: [], gare: 0 } };
      const type = new Array(N).fill('rue'), rues = M.th.rues.map(([p, t]) => [pt(h, p), t]).sort((a, b) => a[0] - b[0]);
      rues.forEach(([i0, t], k) => { const i1 = k + 1 < rues.length ? rues[k + 1][0] : N; for (let i = i0; i < i1; i++) type[i] = t; });
      for (let i = 0; i < rues[0][0]; i++) type[i] = rues[rues.length - 1][1];
      const troncs = [], houp = [], mats = [], lant = [], autos = [[], [], [], []], boutiques = [], anneaux = [];
      // la descente de la butte (points 19 à 23) : façades d'autres teintes, l'escalier de la butte à droite au point 20 (un immeuble en moins), la boulangerie à gauche au point 21
      const iD0 = pt(h, 19), iD1 = pt(h, 23), iE = pt(h, 20) >> 3 << 3, iB = pt(h, 21) >> 3 << 3, sdE = 1, sdB = -1;
      // trottoirs à bordure de granit, et bande de stationnement en asphalte, par tronçon de même type hors tunnel ; ils suivent la largeur de la chaussée (la place s'élargit)
      const dalle = h.mat('dalles', { side: THREE.DoubleSide }), bordure = h.mat('pierre', { side: THREE.DoubleSide }), bitume = h.mat('bruit', { side: THREE.DoubleSide }, '#45454c', ['#4f4f56', '#3c3c42']);
      for (let i = 0; i < N;) {
        let j = i; const tun = h.zone(i, 1) > 0.5; while (j < N && type[j] === type[i] && (h.zone(j, 1) > 0.5) === tun) j++;
        const t = TYPES[type[i]], gb = t.gare ? 3.2 : 0;
        if (!tun && type[i] === 'berge') { // voie sur berge (la Seine toujours à gauche ici) : à gauche un liseré de pierre et le mur qui plonge dans l'eau ;
          // à droite un trottoir étroit, le mur du quai haut (rue à 1,5 m), son parapet ; le mur monte sur 50 m quand on descend de la rue, il est entier à la sortie du tunnel
          const plein = h.zone(i - 1, 1) > 0.5, hq = (s, k) => 0.22 + Math.max(0, 1.28 - s.y) * (plein ? 1 : Math.min(1, k / 25)), hp = (s, k) => hq(s, k) + 1;
          ruban(i, j - i, s => s.w, 0.22, s => s.w + 1.2, 0.22, dalle); ruban(i, j - i, s => s.w, 0.22, s => s.w, -0.6, bordure);
          ruban(i, j - i, s => s.w + 1.2, 0.22, s => s.w + 1.2, hq, bordure); ruban(i, j - i, s => s.w + 1.2, hq, s => s.w + 18, hq, dalle); ruban(i, j - i, s => s.w + 1.4, hq, s => s.w + 1.4, hp, bordure);
          ruban(i, j - i, s => -s.w, 0.22, s => -s.w - 0.8, 0.22, bordure); ruban(i, j - i, s => -s.w, 0.22, s => -s.w, -0.6, bordure); ruban(i, j - i, s => -s.w - 0.8, 0.22, s => -s.w - 0.8, s => WY - s.y - 0.6, bordure);
          for (let k = i; k < j; k++) { const s = S[k]; if (k % 6 === 0) { const [x, z] = bord(s, -1, s.w + 0.8); anneaux.push([x, s.y - 1.1, z, h.across(s) + Math.PI]); }
            if (k % 10 === 5) { const [x, z] = bord(s, 1, s.w + 9), y0 = s.y + hq(s, k - i); troncs.push([x, y0 + 2.6, z]); houp.push([x, y0 + 7.6, z, al() * 6, 1, 0.9, 1]); } }
        } else if (!tun && type[i] !== 'place') for (const sd of [-1, 1]) {
          const dans = s => !horsPlace(...bord(s, sd, s.w + gb)); // dans le cercle de la place : pas de trottoir, on y roule
          ruban(i, j - i, s => sd * (s.w + gb), 0.22, s => dans(s) ? sd * (s.w + gb) : sd * (s.w + t.recul + 0.5), 0.22, dalle); ruban(i, j - i, s => sd * (s.w + gb), 0.22, s => sd * (s.w + gb), s => dans(s) ? 0.22 : -0.6, bordure);
          if (gb) ruban(i, j - i, s => sd * s.w, 0.01, s => sd * (s.w + gb), 0.01, bitume);
        }
        i = j;
      }
      // ---- la place : un grand cercle pavé où l'on roule partout, l'arc de triomphe au milieu : on le contourne en glisse ou on passe dessous
      const large = S.map((s, i) => i).filter(i => S[i].w > W + 0.05), paves = h.mat('paves', { side: THREE.DoubleSide });
      ruban(large[0], large[large.length - 1] - large[0], s => -s.w, 0.02, s => s.w, 0.02, paves);
      // le choix de la place : la chaussée du tour (bitume, sim.js : sec) en fait le grand tour ; couper par l'arche, entre les piles, c'est plus court mais sur les pavés (surf.large).
      // La chaussée du jeu (même texture, mêmes marquages, en phase avec ses tirets de 32 m) est reposée par-dessus les pavés, de l'avenue d'arrivée à celle de départ : aucun raccord visible
      { const dans = S.map((s, i) => i).filter(i => S[i].w > W + 0.05 || (S[i].x - C[0]) ** 2 + (S[i].z - C[1]) ** 2 < (RT + 20) ** 2), a = dans[0] - ((dans[0] - h.T.t1 + 16 * N) % 16);
        const y = s => Math.max(0.07, 0.07 - s.y); // au moins 5 cm au-dessus des pavés, qui sont à plat (0,02) alors que la route plonge jusqu'à -0,13 m vers la sortie : le croisement rasant des deux plans faisait glisser le raccord avec la caméra
        h.ribbon(a, dans[dans.length - 1] - a + 16, -W, y, W, y, h.mat('chaussee', { side: THREE.DoubleSide, gloss: 0.08 }, ...M.th.route), 32); }
      // le sol de la place en cases de 2 m : pavés partout dans le cercle où l'on roule, trottoir étroit au pied des façades, sauf où partent les avenues
      { const pres = S.filter(s => (s.x - C[0]) ** 2 + (s.z - C[1]) ** 2 < 260 ** 2), loin = (x, z) => { let m = 1e9; for (const s of pres) m = Math.min(m, Math.hypot(s.x - x, s.z - z) - s.w); return m; }; // distance au bord de la chaussée
        const roule = [[], [], []], pied = [[], [], []];
        for (let r = PL.ile[0]; r < RT + 6; r += 2) { // (le terre-plein, au milieu, a son propre dallage)
          const n = Math.max(6, Math.ceil(6.2832 * r / 2)); for (let k = 0; k < n; k++) {
          const a0 = k / n * 6.2832, a1 = (k + 1) / n * 6.2832, P = [[r, a0], [r + 2, a0], [r + 2, a1], [r, a1]].map(([rr, a]) => [C[0] + Math.cos(a) * rr, C[1] + Math.sin(a) * rr]), e = r < PL.r - 2 ? 0 : Math.min(...P.map(q => loin(...q)));
          const L = r < PL.r || e < 0.3 ? roule : pied; P.forEach(([x, z]) => { L[0].push(x, 0, z); L[1].push(x / 4, z / 4); }); const v = L[0].length / 3 - 4; L[2].push(v, v + 2, v + 1, v, v + 3, v + 2); } }
        roule[0].forEach((v, i) => { if (i % 3 === 1) roule[0][i] = 0.02; }); pied[0].forEach((v, i) => { if (i % 3 === 1) pied[0][i] = 0.22; });
        nappe(...roule, paves); nappe(...pied, dalle); }
      // l'arc au milieu, grande arche dans l'axe de la traversée ; ses piles sont des obstacles (sim.js). Sa pierre est mise en lumière, dorée, comme à l'aube : on le voit du bout des avenues,
      // c'est le repère de la place (gris comme les façades, il s'y perdait)
      const dore = m => { m.emissive.setHex(0xffb860); m.emissiveMap = m.map; m.emissiveIntensity = 0.5; return m; };
      h.pose('arcParis', { pierre: dore(h.mat('pierre')), relief: dore(h.mat('basRelief')) }, h.scene, [C[0], 0.02, C[1]]).forEach(m => m.rotation.y = PL.a);
      // ---- le terre-plein de l'arc (sim.js : place.ile) : dallage de granit clair, étoile à douze branches en pavés roses, cent bornes de granit reliées par des chaînes,
      // ouvertes dans l'axe de la grande arche ; sous l'arche, la dalle et la flamme ; dix candélabres. L'anneau de chaussée autour reste nu : c'est là qu'on glisse.
      { const [RI, OUV] = PL.ile, A0 = Math.PI / 2 - PL.a, cs = Math.cos(PL.a), sn = Math.sin(PL.a), P2 = (r, a) => [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r];
        const ferme = a => Math.abs(RI * (Math.cos(a) * cs - Math.sin(a) * sn)) > OUV; // hors de l'ouverture (même calcul que sim.js)
        couronne(C[0], C[1], 0, RI, 0.02, 72, h.mat('granit', { side: THREE.DoubleSide }));
        const et = [[], [], []]; for (let k = 0; k < 12; k++) { const a = A0 + k * Math.PI / 6; for (const [r, b] of [[28, a - Math.PI / 12], [28, a + Math.PI / 12], [46, a]]) { const [x, z] = P2(r, b); et[0].push(x, 0.04, z); et[1].push(x / 4, z / 4); } et[2].push(3 * k, 3 * k + 1, 3 * k + 2); }
        nappe(...et, h.mat('paves', { c: 0xf0b0a0, side: THREE.DoubleSide }));
        const bornes = [], chaines = [], n = 100, pas = 6.2832 / n;
        for (let k = 0; k < n; k++) { const a = A0 + (k + 0.5) * pas; if (!ferme(a)) continue; const [x, z] = P2(RI, a); bornes.push([x, 0.02, z, -a]);
          if (ferme(a + pas)) { const [mx, mz] = P2(RI * Math.cos(pas / 2), a + pas / 2); chaines.push([mx, 0.62, mz, Math.PI / 2 - a - pas / 2, 2 * RI * Math.sin(pas / 2), 0.07, 0.07]); } }
        insts(h, 'borne', { pierre: h.mat('pierre') }, bornes); inst(h, h.geo('bloc'), h.mat('fonte'), chaines);
        h.pose('flamme', { bronze: h.mat('peinture', { c: 0x4a3c22 }), feu: h.mat('peinture', { lum: 1, c: 0xffa030 }) }, h.scene, [C[0], 0.02, C[1]]).forEach(m => m.rotation.y = PL.a);
        const iP = large[large.length >> 1]; h.lum(iP, C[0], 2.5, C[1], 0xff8a30, 34, 2); // la flamme éclaire le dessous de la voûte
        for (const sd of [-1, 1]) for (let k = 1; k <= 5; k++) { const [x, z] = P2(RI - 2.5, A0 + sd * k * Math.PI / 6); mats.push([x, 3.5, z]); lant.push([x, 7.1, z]); if (k % 2 === 0) h.lum(iP, x, 6.6, z, 0xffd05a, 15, 1.6); } }
      // ---- le trottoir de la place, entre le mur et les façades : platanes, bancs, colonnes Morris, bouches de métro, un kiosque ; rien là où partent les avenues
      const kqPlace = [], bancs = [], morris = [], metros = [];
      { let n = 0; const pas = 9 / (PL.r + 2.2);
        for (let a = pas / 2; a < 6.2832; a += pas) { const x = C[0] + Math.cos(a) * (PL.r + 2.2), z = C[1] + Math.sin(a) * (PL.r + 2.2), [d, s] = proche(x, z); if (d < s.w + 1.5) continue; // (sur la chaussée d'une avenue)
          const P2 = (r, b = a) => [C[0] + Math.cos(b) * r, 0.22, C[1] + Math.sin(b) * r, -b - Math.PI / 2], k = n++; // posé sur le trottoir, face à l'arc
          if (k % 27 === 13) metros.push(P2(PL.r + 3)); else if (k % 20 === 8) morris.push(P2(PL.r + 2.2)); else if (k === 45) kqPlace.push(P2(PL.r + 3.6)); else { troncs.push([x, 2.82, z]); houp.push([x, 7.82, z, k * 1.7, 1, 0.9, 1]); }
          if (k % 5 === 2) bancs.push(P2(PL.r + 4.8, a + pas / 2)); } }
      const fm = ['#d9c9a8', '#cfc0a0', '#e0d4b8', '#e8cfa0', '#c8b4a8', '#d8c8a0'].map(p => h.mat('facadeParis', {}, p)), lots = fm.map(() => []); // les trois dernières : la descente de la butte
      const fb = ['#e8dcc0', '#d8c8b0'].map(p => h.mat('facadeParis', {}, p, 1)), bas = fb.map(() => []); // maisons basses de la butte
      for (let i = 0; i < N; i += 2) {
        const s = S[i], t = TYPES[type[i]], ry = h.across(s), tun = h.zone(i, 14) > 0;
        for (const sd of [-1, 1]) {
          const [qx, qz] = bord(s, sd, W + 12), fleuve = quai(qx, qz) || quai(qx, qz + 14);
          if (i % 8 === 0 && !tun && !fleuve) { // un immeuble tous les 16 m, au recul de la rue ; pas sur la trémie, ni côté fleuve, ni là où une autre rue passe
            const [x, z] = bord(s, sd, s.w + t.recul + 7.5), ruelle = type[i] === 'ruelle';
            if (g.dAt(x, z) > s.w + t.recul + 6.5 && (x - C[0]) ** 2 + (z - C[1]) ** 2 > (RT + 14) ** 2) { const H = t.H[0] + rnd() * (t.H[1] - t.H[0]), k3 = rnd() * 3 | 0, desc = i >= iD0 && i <= iD1;
              (i === iE && sd === sdE ? [] : ruelle ? bas[k3 % 2] : lots[k3 + (desc ? 3 : 0)]).push([x, g.hAt(x, z) + H / 2 - 3, z, ry, 17, H + (desc ? k3 * 4 : 6), 14]); // (même tirage qu'avant : le reste du décor ne bouge pas ; dans la descente, des hauteurs qui varient)
              if (type[i] !== 'berge' && al() < (i < h.T.sp[0] ? 0.3 : i < h.T.sp[1] ? 0.6 : 0.25) && !(i === iB && sd === sdB) && !(i === iE && sd === sdE)) { const [fx, fz] = bord(s, sd, s.w + t.recul - 1.05); boutiques.push([fx, s.y + 0.22, fz, ry - sd * 1.5708, t.recul]); } } // un commerce en rez-de-chaussée : quelques-uns partout, plus au secteur 2
          }
          if (i % 10 === 0 && !tun && type[i] !== 'berge') for (const off of fleuve ? [2.4] : t.arbres) { const [x, z] = bord(s, sd, s.w + off); if (g.dAt(x, z) > s.w + off - 1.5 && (x - C[0]) ** 2 + (z - C[1]) ** 2 > (RT + 4) ** 2) { troncs.push([x, s.y + 2.6, z]); houp.push([x, s.y + 7.6, z, rnd() * 6, 1, 0.9, 1]); } } // platanes : en rangées sur les grands axes, le long du fleuve sur le quai
          if (t.gare && !tun && !fleuve && s.w < W + 0.3 && i > 30 && i < N - 34 && i % 4 === 0 && rnd() < (t.gare > 1 ? 0.8 : 0.55)) { const [x, z] = bord(s, sd, s.w + 1.7); if (horsPlace(x, z)) autos[rnd() * 4 | 0].push([x, s.y, z, ry + 1.5708]); } // voitures en stationnement
        }
        if (i % 10 === 0 && h.zone(i, 6) === 0) { const sd = (i / 10) & 1 ? 1 : -1, [x, z] = bord(s, sd, s.w + (t.gare ? 3.6 : 0.6)); if (horsPlace(x, z)) { mats.push([x, s.y + 3.4, z]); lant.push([x, s.y + 7, z]); h.lum(i, x, s.y + 6.5, z, 0xffd05a, 15, 1.6); } } // réverbères, allumés jusqu'au lever du jour
      }
      // la couronne d'immeubles qui ferme la place, façades tournées vers l'arc ; une avenue part là où passe la piste
      for (let a = 0; a < 6.2832; a += 17.5 / RT) { const x = C[0] + Math.cos(a) * (RT + 7), z = C[1] + Math.sin(a) * (RT + 7), [d, s] = proche(x, z);
        if (d > s.w + 10) { const H = 26 + al() * 3; lots[al() * 3 | 0].push([x, g.hAt(x, z) + H / 2 - 3, z, Math.atan2(-Math.sin(a), Math.cos(a)), 14, H + 6, 17.4]); } }
      for (let k = 0; k < 420; k++) { // et la ville derrière : des toits à perte de vue
        const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z);
        if (d > 52 && !quai(x, z - 30) && (x - C[0]) ** 2 + (z - C[1]) ** 2 > (RT + 22) ** 2) { const H = 18 + rnd() * 8; lots[k % 3].push([x, g.hAt(x, z) + H / 2 - 3, z, (rnd() * 4 | 0) * 1.5708 + rnd() * 0.3, 16 + rnd() * 14, H + 6, 14 + rnd() * 10]); }
      }
      // l'île de la Cité, à gauche à la sortie du tunnel : quais de pierre, la cathédrale (chevet tourné vers l'arrivée, flanc sud et sa rose face à la route, tours au bout),
      // un square planté derrière le chevet, des immeubles à la pointe ouest
      const IX = 30, IZ = 318;
      h.pose('ile', { quai: h.mat('pierre'), sol: dalle }, h.scene, [IX, 0, IZ], 380, 96, WY - 1, IY);
      h.pose('cathedrale', { mur: h.mat('murGothique'), pierre: h.mat('pierre', {}, '#e0d4bc'), plomb: h.mat('plomb'), rose: h.mat('rose'), sombre: h.mat('matGris') }, h.scene, [IX + 10, IY, IZ]);
      for (let x = 120; x <= 200; x += 16) for (let z = IZ - 30; z <= IZ + 30; z += 15) { troncs.push([x, IY + 2.6, z]); houp.push([x, IY + 7.6, z, al() * 6, 1, 0.9, 1]); }
      for (let x = -150; x <= 110; x += 18) for (const z of [IZ - 43, IZ + 43]) { troncs.push([x, IY + 2.6, z]); houp.push([x, IY + 7.6, z, al() * 6, 1, 0.9, 1]); }
      for (const x of [-140, -112]) for (const z of [IZ - 26, IZ + 26]) { const H = 20 + al() * 4; lots[al() * 3 | 0].push([x, IY + H / 2 - 3, z, 0, 26, H + 6, 22]); }
      // la rive d'en face : quai de pierre, platanes, trois rangs d'immeubles face au fleuve
      for (const [x0, x1, z0] of [[300, 1450, 400], [-260, 300, 425]]) {
        h.pose('rive', { quai: h.mat('pierre'), sol: dalle }, h.scene, [(x0 + x1) / 2, 0, (z0 + 990) / 2], x1 - x0, 990 - z0, WY - 1, IY);
        for (let x = x0 + 10; x < x1 - 8; x += 17.5) { for (let r = 0; r < 3; r++) if (!r || al() < 0.8) { const H = 20 + al() * 6; lots[al() * 3 | 0].push([x + (r ? al() * 4 - 2 : 0), IY + H / 2 - 3, z0 + 16 + r * 24, 0, 17, H + 6, 14]); }
          if ((x - x0) % 35 < 17.5) { troncs.push([x, IY + 2.6, z0 + 5]); houp.push([x, IY + 7.6, z0 + 5, al() * 6, 1, 0.9, 1]); } }
      }
      const cube = h.geo('bloc');
      lots.forEach((l, i) => inst(h, cube, fm[i], l)); bas.forEach((l, i) => inst(h, cube, fb[i], l));
      // les combles : corniche de pierre, brisis de zinc à lucarnes, souches de cheminée en brique (le haut des façades ne montre plus de fenêtres)
      const corniche = [], comble = [], souches = [];
      for (const [x, y, z, ry, sx, sy, sz] of [...lots.flat(), ...bas.flat()]) {
        const top = y + sy / 2, c = Math.cos(ry), sn = Math.sin(ry); corniche.push([x, top + 0.15, z, ry, sx + 0.5, 0.3, sz + 0.5]); comble.push([x, top + 1.6, z, ry, sx - 1.6, 3.2, sz - 1.6]);
        for (const [ox, oz] of [[sx * 0.3, sz * 0.2], [-sx * 0.3, -sz * 0.2]]) souches.push([x + c * ox + sn * oz, top + 4.1, z - sn * ox + c * oz, ry]);
      }
      // une géométrie chacun : la pierre règle la densité de sa texture sur la boîte
      inst(h, h.geo('bloc'), h.mat('pierre'), corniche); inst(h, h.geo('bloc'), h.mat('zinc'), comble); inst(h, h.geo('cheminee'), h.mat('brique'), souches);
      inst(h, h.geo('bloc'), h.mat('matGris'), comble.map(([x, y, z, ry, sx, sy, sz]) => [x, y + sy / 2 + 0.05, z, ry, sx - 1.4, 0.1, sz - 1.4])); // le terrasson, plat, au-dessus du brisis
      inst(h, h.geo('reverbere'), h.mat('fonte'), mats); inst(h, h.geo('lanterneRue'), h.mat('lanterne', LUM), lant);
      inst(h, h.geo('tronc'), h.mat('tronc'), troncs); inst(h, h.geo('houppier'), h.mat('feuillage'), houp);
      const garees = autos.flatMap((l, i) => l.map(p => [...p, 1, 1, 1, [0x2a3a5a, 0x8a8a90, 0x5a1a1a, 0xd8d4c8][i]]));
      insts(h, 'voitureGaree', { caisse: h.mat('laque'), vitre: h.mat('vitreSombre'), chassis: h.mat('matGris'), roue: h.mat('roue'), pneu: h.mat('pneu'), feuRouge: h.mat('feuRouge', LUM), feuBlanc: h.mat('lampe', LUM) }, garees, { teinte: 'caisse' });
      // les commerces : devanture à enseigne (noms inventés) ; store rayé sur les cafés, boulangeries, fromageries, fleuristes ; terrasse devant les cafés
      // quand le trottoir le permet ; croix verte en drapeau sur la pharmacie ; deux kiosques à journaux sur l'avenue
      const GENRES = [['cafe', 'CAFE DE LA BUTTE', '#1e3a2a', '#e8c860'], ['boulangerie', 'AU FOURNIL DORE', '#5a2a1a', '#f0d890'], ['librairie', 'LIBRAIRIE LA PAGE BLANCHE', '#1a2a4a', '#e8e0c8'],
        ['cafe', 'LE CHAT QUI GUETTE', '#6a1a1a', '#f0d070'], ['pharmacie', 'PHARMACIE DES LILAS', '#e8ece8', '#1a7a4a'], ['fleuriste', 'LES JARDINS DE ROSE', '#2a4a3a', '#f4f0e0'],
        ['fromagerie', 'CREMERIE FROMAGERIE', '#e0d4a8', '#4a3a1a'], ['mode', 'MAISON VERLAINE', '#1a1a1e', '#d8d0c0'], ['boucherie', 'BOUCHERIE DU MARCHE', '#7a1a1a', '#f4f0e0'],
        ['cafe', 'BAR DES AMANDIERS', '#2a2a4a', '#f0c860'], ['librairie', 'LE TEMPS RETROUVE', '#5a1a2a', '#f0d890'], ['mode', 'ATELIER CORALIE', '#4a5a5a', '#f4f0e0']];
      const parGenre = GENRES.map(() => []), stores = [], terrasses = [], croix = [], STORE = { cafe: 0xb02a2a, boulangerie: 0x2a5a8a, fromagerie: 0x3a6a3a, fleuriste: 0x2a6a4a };
      boutiques.forEach(([x, y, z, ry, recul], k) => { const gi = (k * 7 + (al() * 2 | 0)) % GENRES.length, [genre] = GENRES[gi]; parGenre[gi].push([x, y, z, ry]);
        if (STORE[genre]) stores.push([x, y, z, ry, 1, 1, 1, STORE[genre]]); if (genre === 'cafe' && recul >= 3) terrasses.push([x, y, z, ry]); if (genre === 'pharmacie') croix.push([x, y, z, ry]); });
      const geoDev = h.geo('devanture'); parGenre.forEach((l, gi) => l.length && inst(h, geoDev, h.mat('devanture', {}, ...GENRES[gi]), l));
      insts(h, 'store', { toile: h.mat('toileRayee', { side: THREE.DoubleSide }), fer: h.mat('fonte') }, stores, { teinte: 'toile' });
      insts(h, 'terrasse', { plateau: h.mat('craie'), fer: h.mat('fonte'), canne: h.mat('bruit', {}, '#b8925a', ['#8a6a3a', '#d0b080']) }, terrasses);
      insts(h, 'croixPharmacie', { fer: h.mat('fonte'), croix: h.mat('peinture', { lum: 1, c: 0x2aff7a }) }, croix);
      const kq = [...kqPlace]; for (const [i, sd] of [[h.T.sp[1] - 60, -1], [h.T.sp[1] - 24, 1]]) { const s = S[i], [x, z] = bord(s, sd, s.w + 4.6); kq.push([x, s.y + 0.22, z, h.across(s) - sd * 1.5708]); } // entre les voitures garées et la rangée d'arbres
      insts(h, 'banc', { vert: h.mat('peinture', { c: 0x1e4a36 }), fer: h.mat('fonte') }, bancs);
      insts(h, 'colonneMorris', { corps: h.mat('affiches'), toit: h.mat('peinture', { c: 0x1e4a36 }), fer: h.mat('fonte') }, morris);
      insts(h, 'boucheMetro', { fer: h.mat('peinture', { c: 0x1e4a36 }), trou: h.mat('peinture', { c: 0x121216 }), panneau: h.mat('ecrit', LUM, 64, 22, '#a01818', '#f4e8c0', 'METRO', 14), lampe: h.mat('lanterne', LUM) }, metros);
      insts(h, 'kiosque', { corps: h.mat('kiosque'), toit: h.mat('peinture', { c: 0x1e4a36 }), comptoir: h.mat('fonte') }, kq);
      // voies sur berge : anneaux d'amarrage, péniches le long du quai ; le pont de pierre qui passe sur l'entrée du tunnel et traverse la Seine
      insts(h, 'anneau', { fer: h.mat('fonte') }, anneaux);
      const pen = [1432, 1480, 1848, 1898].map(i => { const s = S[i], [x, z] = bord(s, -1, s.w + 3.5); return [x, WY, z, h.across(s) + 1.5708, 1, 1, 1, [0x2a2a30, 0x2a4a6a, 0x5a2020, 0x2a4a32][i % 4]]; }); // à couple contre le mur de quai
      insts(h, 'peniche', { coque: h.mat('acier'), liston: h.mat('peinture', { c: 0xe8e0d0 }), pont: h.mat('bruit', {}, '#7a5a3a', ['#6a4a2a', '#8a6a4a']), roof: h.mat('roof'), toit: h.mat('matGris'),
        plantes: h.mat('feuillage') }, pen, { teinte: 'coque' });
      { const s = S[h.T.t0], gp = repere(h, s); h.pose('pont', { pierre: h.mat('pierre'), tablier: h.mat('paves'), fer: h.mat('fonte'), lampe: h.mat('lanterne', LUM) }, gp, [0, 0, 0], 170, WY - s.y);
        // la tête du tunnel sous le pont : mur de pierre percé, arc de décharge à claveaux, plaque du souterrain (comme les trémies des voies sur berge)
        h.pose('teteTunnelParis', { pierre: h.mat('pierre'), claveau: h.mat('pierre', {}, '#a89878'), plaque: h.mat('ecrit', {}, 128, 16, '#1d2f6f', '#f4f0e0', 'SOUTERRAIN DES QUAIS', 13) }, gp, [0, 0, 0], WY - s.y); }
      // le dôme blanc en haut de la butte
      const craie = h.mat('craie'), yb = g.hAt(935, -598);
      h.pose('basilique', { craie }, h.scene, [935, yb, -598]);
      h.pose('dome', craie, h.scene, [935, yb + 24, -596], 13, 8, 5).scale.y = 1.5;
      for (const sx of [-15, 15]) h.pose('dome', craie, h.scene, [935 + sx, yb + 24, -588], 5, 6, 4).scale.y = 1.5;
      // ---- repères de la butte (descente, points 19 à 23)
      // l'escalier de la butte qui monte entre deux immeubles, un réverbère en bas et un en haut
      { const s = S[iE], ox = -s.tz * sdE, oz = s.tx * sdE, [x, z] = bord(s, sdE, s.w + 3.7), rv = [], ln = [];
        h.pose('escalierButte', { marche: h.mat('pierre', {}, '#b8b0a0'), muret: h.mat('pierre'), fer: h.mat('fonte') }, h.scene, [x, s.y + 0.22, z]).forEach(m => m.rotation.y = Math.atan2(-ox, -oz));
        for (const [k, dy] of [[-0.6, 0], [8.4, 3.74]]) { const px = x + ox * k + s.tx * 2.3, pz = z + oz * k + s.tz * 2.3; rv.push([px, s.y + 0.22 + dy + 3.2, pz]); ln.push([px, s.y + 0.22 + dy + 6.8, pz]); h.lum(iE, px, s.y + dy + 6.5, pz, 0xffd05a, 15, 1.6); }
        inst(h, h.geo('reverbere'), h.mat('fonte'), rv); inst(h, h.geo('lanterneRue'), h.mat('lanterne', LUM), ln); }
      // la boulangerie qui lève son rideau de fer quand on arrive : devanture, store, la lumière du fournil
      const rideau = (() => { const s = S[iB], [fx, fz] = bord(s, sdB, s.w + TYPES.rue.recul - 1.05), ry = h.across(s) - sdB * 1.5708, P = [fx, s.y + 0.22, fz, ry], sn = Math.sin(ry), cs = Math.cos(ry);
        inst(h, h.geo('devanture'), h.mat('devanture', {}, ...GENRES[1]), [P]); insts(h, 'store', { toile: h.mat('toileRayee', { side: THREE.DoubleSide }), fer: h.mat('fonte') }, [[...P, 1, 1, 1, 0x2a5a8a]], { teinte: 'toile' });
        const tole = h.mat('tole'), r = new THREE.Mesh(h.habille(h.geo('rideau'), tole), tole); r.position.set(fx + sn * 0.55, s.y + 0.22 + 3.5, fz + cs * 0.55); r.rotation.y = ry; h.scene.add(r);
        h.lum(iB, fx + sn * 1.5, s.y + 2.5, fz + cs * 1.5, 0xffc070, 10, 1.4); return r; })();
      // le livreur de journaux à vélo qui descend la butte sur le trottoir de droite
      const velo = new THREE.Group(); h.scene.add(velo); let uV = iD0;
      h.pose('livreur', { pneu: h.mat('pneu'), cadre: h.mat('peinture', { c: 0x1a4a8a }), tenue: h.mat('peinture', { c: 0x3a3a44 }), peau: h.mat('peinture', { c: 0xd8a888 }), journaux: h.mat('peinture', { c: 0xe8e0c8 }) }, velo, [0, 0, 0]);
      // ---- le quai : des pigeons posés sur la chaussée qui s'envolent quand on arrive, avant le souterrain (points 26-27) et à sa sortie (30-31)
      const vols = [pt(h, 26) + 55, h.T.t1 + 30, h.T.t1 + 75].map(i0 => ({ i0, en: 0, t: 0, p: Array.from({ length: 12 }, () => { const s = S[i0 + (al() * 8 | 0)], d = al() * 10 - 5;
        return { x: s.x - s.tz * d, y: s.y, z: s.z + s.tx * d, r: al() * 6.28, vx: al() * 6 - 3, vy: 3 + al() * 3, vz: al() * 6 - 3 }; }) }));
      const pig = insts(h, 'pigeon', { plume: h.mat('peinture', { c: 0x7a7c84 }), tete: h.mat('peinture', { c: 0x4a5058 }) }, vols.flatMap(v => v.p.map(q => [q.x, q.y, q.z, q.r])));
      const dp = new THREE.Object3D(), posePig = (k, x, y, z, r, e) => { dp.position.set(x, y, z); dp.rotation.set(0, r, 0); dp.scale.setScalar(e); dp.updateMatrix(); for (const m of pig) m.setMatrixAt(k, dp.matrix); };
      // ---- le camion de livraison garé en double file à la sortie du souterrain (obstacle de sim.js : T.cam), d'un côté aux tours impairs, de l'autre aux tours pairs ; feux de détresse
      const cam = h.T.cam, sCam = S[cam.i], gc = new THREE.Group(), detresse = h.mat('peinture', { lum: 1, c: 0xffa020 }); h.scene.add(gc); gc.position.y = sCam.y; gc.rotation.y = Math.atan2(-sCam.tz, sCam.tx);
      h.pose('camionLivraison', { caisse: h.mat('ecrit', {}, 128, 64, '#e8ecf0', '#1d2f6f', 'LES HALLES', 20), chassis: h.mat('matGris'), cabine: h.mat('laque', { c: 0xe8e4dc }), vitre: h.mat('vitreSombre'), pneu: h.mat('pneu'),
        orange: detresse, rouge: h.mat('feuRouge', LUM) }, gc, [0, 0, 0]);
      return (dt, now, car) => {
        if (!car) return;
        const [cx, cz] = bord(sCam, Math.floor(car.dist / N) & 1 ? 1 : -1, cam.d); gc.position.x = cx; gc.position.z = cz; // même règle que camion() de sim.js, pour la voiture suivie
        detresse.color.setHex(now % 800 < 400 ? 0xffa020 : 0x3a2008);
        const a = (iB - car.idx + N) % N; rideau.scale.y = a < 80 ? Math.max(0.06, a / 80) : a > N - 200 ? 0.06 : 1; // il remonte à l'approche, reste levé après le passage
        uV += dt * 3; if (uV > iD1) uV = iD0; const s = S[uV | 0], [vx, vz] = bord(s, 1, s.w + 1.6); velo.position.set(vx, s.y + 0.22, vz); velo.rotation.y = Math.atan2(-s.tz, s.tx);
        let k = 0, bouge = 0; for (const v of vols) { const e = (v.i0 - car.idx + N) % N;
          if (!v.en && e < 22 && e > 0) { v.en = 1; v.t = 0; } else if (v.en && e > 300 && e < N - 300) { v.en = 0; v.p.forEach((q, j) => posePig(k + j, q.x, q.y, q.z, q.r, 1)); bouge = 1; } // reposés pour le tour suivant
          if (v.en && v.t < 5) { v.t += dt; const t = v.t; v.p.forEach((q, j) => posePig(k + j, q.x + q.vx * t, q.y + q.vy * t + 0.3 * t * t, q.z + q.vz * t, Math.atan2(-q.vz, q.vx), t < 4.5 ? 1 : 0)); bouge = 1; }
          k += v.p.length; }
        if (bouge) for (const m of pig) m.instanceMatrix.needsUpdate = true;
      };
    },
  });
})();
