// Placement du décor de « terre » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  Object.assign(DECORS, {
    // ---------- Spéciale des Ocres : une spéciale de rallye en fin de journée. Garrigue, pins parasols, oliviers et cyprès, talus des bas-côtés, vignes et lavandes, buttes d'ocre ;
    // parc d'assistance au départ, public sur des talus tout le long, banderoles, voitures garées, le gué, le hameau et son bout de bitume, des mas isolés, un village perché et sa chapelle ----------
    terre(h) {
      const { THREE, S, N, W, rnd } = h, [[g0, g1], [b0, b1]] = h.M.surf.zones, entre = (i, a, n) => (i - a + 2 * N) % N <= n, m = i => S[(i + 2 * N) % N];
      const iG = (pt(h, g0) + pt(h, g1)) >> 1, iB = pt(h, b0), nB = (pt(h, b1) - iB + N) % N;
      // plat(i) : là où le sol reste au niveau de la route (gué, hameau avec son moulin et sa pâture, parc d'assistance du départ) ; ailleurs les bas-côtés montent en talus
      const plat = i => entre(i, iG - 30, 60) || entre(i, iB - 60, nB + 80) || entre(i, -50, 130), parc = i => entre(i, -50, 130);
      const sub = S.filter((_, i) => i % 4 === 0), pres = (x, z) => { let b = 0, bd = 1e18; for (let k = 0; k < sub.length; k++) { const d = (sub[k].x - x) ** 2 + (sub[k].z - z) ** 2; if (d < bd) { bd = d; b = k; } } return [Math.sqrt(bd), b * 4]; };
      const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      // le village perché : sur une butte à sommet plat, au point de l'emprise le plus loin de la route
      let vx = 0, vz = 0, vd = 0, bx = [1e9, 1e9, -1e9, -1e9]; for (const s of S) bx = [Math.min(bx[0], s.x), Math.min(bx[1], s.z), Math.max(bx[2], s.x), Math.max(bx[3], s.z)];
      for (let x = bx[0]; x <= bx[2]; x += 20) for (let z = bx[1]; z <= bx[3]; z += 20) { const d = pres(x, z)[0]; if (d > vd) { vd = d; vx = x; vz = z; } }
      // relief des bas-côtés : des talus de terre au bord de la route (jusqu'à 3,5 m, par endroits seulement), des collines au-delà, la butte du village
      const relief = (x, z) => { const [d, i] = pres(x, z), w = S[i].w; if (d < w + 3) return 0; // w : la demi-largeur où l'on roule (sim.js : s.w, plus large au départ et à l'épingle)
        const n1 = Math.max(0, Math.sin(x * 0.031 + 1) * Math.cos(z * 0.027) + 0.5 * Math.sin(x * 0.07 + z * 0.05)), n2 = 0.5 + 0.5 * Math.sin(x * 0.011 + 2) * Math.cos(z * 0.009 + 1);
        return (plat(i) ? 0 : 3.5 * n1 * ss(w + 3, w + 16, d)) + 16 * n2 * ss(50, 220, d) + 18 * (1 - ss(38, 110, Math.hypot(x - vx, z - vz))) * ss(30, 70, d); };
      const g = terrain(h, { pas: 8, marge: 420, loin: 45, chute: -0.1, mat: h.mat('terreOcre'), creux: (x, z) => -relief(x, z) });
      const occ = [], vide = (x, z, r) => occ.every(o => (o[0] - x) ** 2 + (o[1] - z) ** 2 > (o[2] + r) ** 2), prend = (x, z, r) => vide(x, z, r) && (occ.push([x, z, r]), true); // ce qui est déjà posé : rien ne se chevauche
      const sol = (x, z, dy = 0) => g.hAt(x, z) + dy, hasard = () => [g.box[0] + rnd() * (g.box[2] - g.box[0]), g.box[1] + rnd() * (g.box[3] - g.box[1])];
      // le gué : le ruisseau traverse la route au creux du parcours. Sur toute la zone mouillée de la carte (sim.js : surf.zones, là où la voiture chasse), de la boue sombre et des ornières pleines d'eau, fondues dans la terre sèche aux deux bouts ;
      // au milieu, sur toute la zone mouillée pleine (54 m), de l'eau brun vert, brillante (reflets du soleil et des phares), avec une ligne d'écume à l'entrée et à la sortie ; de part et d'autre, le lit du ruisseau, ses galets et ses roseaux
      const iG0 = pt(h, g0), nG = (pt(h, g1) - iG0 + N) % N, verre = { transparent: true, depthWrite: false, side: THREE.DoubleSide };
      const eau = h.mat('eauGue', { ...verre, opacity: 0.92, rep: [4, 1] }), eauR = h.mat('eauGue', { ...verre, opacity: 0.92, rep: [18, 1] }), ecume = h.mat('ecume', { ...verre, rep: [6, 1] });
      h.ribbon((iG0 - 9 + N) % N, nG + 18, s => -s.w, 0.025, s => s.w, 0.025, h.mat('boueGue', verre), 2 * (nG + 18)).renderOrder = -3; // v de 0 à 1 sur toute la longueur : la texture s'efface aux deux bouts
      h.ribbon(iG0, nG, s => -s.w - 0.5, 0.07, s => s.w + 0.5, 0.07, eau, 8).renderOrder = -2; // la nappe couvre la zone mouillée pleine : là où game.js fait partir la gerbe. renderOrder négatif : l'eau (transparente) est dessinée avant la gerbe ; après, elle la recouvrait
      for (const i of [iG0 - 1, iG0 + nG - 1]) h.ribbon((i + N) % N, 2, s => -s.w - 0.5, 0.08, s => s.w + 0.5, 0.08, ecume, 4).renderOrder = -1;
      h.pose('boite', eauR, repere(h, S[iG]), [0, -0.2, 0], 90, 0.3, 12); // le lit, 12 m de large, sous la nappe de la route
      const lit = (sd, off, a) => { const s = S[iG], [x, z] = bord(s, sd, off); return [x + s.tx * a, z + s.tz * a]; }, galets = [], roseaux = [];
      for (let k = 0; k < 70; k++) { const sd = k & 1 ? 1 : -1, [x, z] = lit(sd, S[iG].w + 1.5 + rnd() * 34, (rnd() < 0.5 ? -1 : 1) * (5.5 + rnd() * 2)), l = 0.5 + rnd() * 0.8; galets.push([x, sol(x, z, -0.25 * l), z, rnd() * 6, l, l * 0.6, l]); }
      for (let k = 0; k < 140; k++) { const sd = k & 1 ? 1 : -1, [x, z] = lit(sd, S[iG].w + 3 + rnd() * 32, (rnd() < 0.5 ? -1 : 1) * (6.5 + rnd() * 3)), e = 1.1 + rnd() * 1; roseaux.push([x, sol(x, z, 0.6 * e), z, rnd() * 6, 1, e, 1]); }
      for (let k = 0; k < 16; k++) { const sd = k & 1 ? 1 : -1, [x, z] = lit(sd, S[iG].w + 0.4, -7 + k * 0.9); galets.push([x, S[iG].y, z, rnd() * 6, 0.5, 0.45, 0.5]); } // galets sur la ligne du talus de bordure, qui s'interrompt au-dessus du lit
      inst(h, h.geo('butte'), h.mat('pierre', { c: 0xe8e0d0 }), galets); inst(h, h.geo('boite', 0.12, 1.2, 0.12), h.mat('feuillage', { c: 0x5a7a30 }), roseaux).castShadow = false;
      // bordures de la piste, alignées sur la limite où l'on roule (s.w, là où sim.js arrête la voiture) : un talus de terre tassée qui monte à la hauteur du muret et cache la glissière, redescend dans la garrigue ;
      // dans le hameau, un muret de pierre sèche ; sur le lit du ruisseau, rien (les galets). Aux parties larges (départ, épingle), la terre battue s'étend jusqu'au talus
      const HT = h.TH.murH + 0.08, talusM = h.mat('talusPiste', { side: THREE.DoubleSide }), muretM = h.mat('pierre', { side: THREE.DoubleSide }), type = i => entre(i, iG - 4, 8) ? 0 : entre(i, iB, nB) ? 2 : 1;
      for (let i0 = 0; i0 < N;) { const ty = type(i0); let n = 1; while (i0 + n < N && type(i0 + n) === ty) n++;
        for (const sg of [-1, 1]) if (ty === 1) { h.ribbon(i0, n, s => sg * (s.w - 0.45), 0.02, s => sg * s.w, HT, talusM, 6); h.ribbon(i0, n, s => sg * s.w, HT, s => sg * (s.w + 1.4), -0.5, talusM, 6); }
          else if (ty === 2) { h.ribbon(i0, n, s => sg * (s.w - 0.1), 0, s => sg * s.w, HT, muretM, 4); h.ribbon(i0, n, s => sg * s.w, HT, s => sg * (s.w + 0.55), HT, muretM, 4); h.ribbon(i0, n, s => sg * (s.w + 0.55), HT, s => sg * (s.w + 0.55), -0.5, muretM, 4); }
        i0 += n; }
      const larg = h.mat('terrePiste', { transparent: true, side: THREE.DoubleSide });
      for (let i0 = 0; i0 < N;) { if (S[i0].w < W + 0.3) { i0++; continue; } let n = 1; while (i0 + n < N && S[i0 + n].w >= W + 0.3) n++;
        for (const sg of [-1, 1]) h.ribbon((i0 - 1 + N) % N, n + 1, sg * (W - 1.6), 0.012, s => sg * s.w, 0.012, larg, 6).renderOrder = -3; // (avant les particules, comme l'eau du gué)
        i0 += n; }
      // le hameau : la terre laisse place à un bout de bitume entre des mas de pierre
      const peauM = { mur: h.mat('pierre'), toit: h.mat('tuilesCanal'), volet: h.mat('peinture', { c: 0x6a8ab8 }) }, mas = [], cypres = [], pins = [], futs = [], oliviers = [], buissons = [];
      const cyp = (x, z) => { const e = 0.6 + rnd() * 0.5; cypres.push([x, sol(x, z, 7.3 * e), z, rnd() * 6, 0.38 * e, e, 0.38 * e]); };
      h.ribbon(iB, nB, -W + 0.2, 0.05, W - 0.2, 0.05, h.mat('chaussee', {}, '#4c4c52', '#58585e', '#e8e4d8', '#4c4c52', '#4c4c52', '#4c4c52', false), 32);
      for (let k = 0; k < 9; k++) { const s = m(iB + 4 + Math.round(k * (nB - 8) / 8)), sd = k & 1 ? 1 : -1, [x, z] = bord(s, sd, W + 7 + (k % 3) * 2); mas.push([x, s.y - 0.5, z, h.across(s)]); occ.push([x, z, 9]);
        if (k % 3 === 0) cyp(...bord(s, sd, W + 17)); }
      for (let i = iB - 40; i < iB + nB + 60; i += 14) { const [x, z] = bord(m(i), -1, W + 2.2); futs.push([x, sol(x, z, 3.6), z, 0, 0.5, 1.4, 0.5]); } // poteaux du téléphone le long du hameau
      // le parc d'assistance, à droite de la ligne droite du départ : deux rangs de barnums, un fourgon derrière chacun, une voiture de course sous un sur deux
      const COUL = [0xe8482a, 0xf4f0e0, 0x2a62c8, 0xf4c020, 0x3a7a3a, 0xf08a2a], barnums = [], fourgons = [], autos = [], auto = (x, z, a, c) => autos.push([x, sol(x, z), z, a, 1, 1, 1, c]);
      for (let k = 0; k < 14; k++) { const rang = k & 1, s = m(-44 + (k >> 1) * 16 + rang * 8), a = h.across(s), [x, z] = bord(s, 1, s.w + 8 + rang * 17), [fx, fz] = bord(s, 1, s.w + 15 + rang * 17);
        barnums.push([x, s.y - 0.45, z, a - Math.PI / 2, 1, 1, 1, COUL[k % 6]]); fourgons.push([fx, s.y - 0.5, fz, a + Math.PI / 2 + (rnd() - 0.5) * 0.5, 1, 1, 1, COUL[(k + 1) % 6]]); occ.push([x, z, 6], [fx, fz, 4]);
        if (k % 2 === 0) autos.push([x, s.y - 0.45, z, a + Math.PI / 2, 1, 1, 1, COUL[(k + 2) % 6]]); }
      // le public : un talus à l'extérieur de chaque virage, un autre de loin en loin dans les lignes droites, en face du parc et à la réception des crêtes ; bottes de paille au pied, voitures garées derrière
      const talus = [], bottes = [], pan = [], crete = h.M.sauts.map(([p]) => pt(h, p));
      const groupe = (i, sd, nb) => { for (let k = 0; k < nb; k++) { const t = m(i + Math.round((k - (nb - 1) / 2) * 8)), [x, z] = bord(t, sd, t.w + 6.5); talus.push([x, Math.max(t.y, sol(x, z)) - 0.4, z, h.across(t) + Math.PI / 2, 1, 1, 1, i]); occ.push([x, z, 8]); }
        for (let dk = -nb * 4 - 1; dk <= nb * 4 + 1; dk += 2) { const t = m(i + dk), [x, z] = bord(t, sd, t.w + 1.9); bottes.push([x, t.y - 0.1, z, h.across(t)]); }
        for (let dk = -nb * 4; dk <= nb * 4; dk += 4) { const t = m(i + dk), [x, z] = bord(t, -sd, t.w + 0.45); pan.push([x, t.y + 1.45, z, h.across(t) + Math.PI / 2]); } // banderoles en face, au-dessus du muret
        for (let k = 0; k < nb + 1; k++) { const t = m(i - nb * 4 + k * 7), [x, z] = bord(t, sd, t.w + 15 + rnd() * 5); if (prend(x, z, 3.5)) auto(x, z, h.across(t) + (rnd() - 0.5), COUL[(i + k) % 6]); } };
      const pris = i => talus.some(t => entre(i, t[7] - 34, 68)), libre = i => !entre(i, iG - 22, 44) && !entre(i, iB - 14, nB + 64) && !parc(i); // ni au gué, ni au hameau et à sa pâture, ni au parc
      for (const i of [-30, 0, 30, 60]) groupe(i, -1, 3); // la tribune de terre face au parc
      for (const i of crete) for (const sd of [-1, 1]) groupe(i + 22, sd, 2);
      for (let i = 0; i < N; i++) { const s = S[i], k = Math.abs(s.k); if (k >= 0.012 && k >= Math.abs(m(i + 1).k) && k >= Math.abs(m(i - 1).k) && libre(i) && !pris(i)) groupe(i, s.k > 0 ? -1 : 1, k > 0.022 ? 3 : 2); } // l'extérieur : à gauche d'un virage à droite
      for (let i = 0, sd = 1; i < N; i += 20) if (libre(i) && !pris(i)) groupe(i, sd = -sd, 1);
      for (let i = -48; i < 80; i += 4) for (const sd of [-1, 1]) { const t = m(i), [x, z] = bord(t, sd, t.w + 0.45); pan.push([x, t.y + 1.45, z, h.across(t) + Math.PI / 2]); }
      for (const i of crete) for (let dk = -44; dk < -4; dk += 4) for (const sd of [-1, 1]) { const t = m(i + dk), [x, z] = bord(t, sd, t.w + 0.45); pan.push([x, t.y + 1.45, z, h.across(t) + Math.PI / 2]); }
      const foule = h.mat('foule', {}, '#8a5a34', '#e8482a'); foule.map.anisotropy = 8;
      insts(h, 'talusPublic', { talus: h.mat('terreOcre'), ruban: h.mat('banderoleRallye', {}, 0), foule }, talus);
      const pan1 = pan.filter((p, k) => !pan.slice(0, k).some(q => (p[0] - q[0]) ** 2 + (p[2] - q[2]) ** 2 < 7.5 * 7.5)); // les groupes et les rangées posent parfois une banderole au même endroit : une seule par place, sinon deux textures se battent
      inst(h, h.geo('boite', 7.6, 0.9, 0.1), h.mat('banderoleRallye', { side: THREE.DoubleSide }, 2), pan1).castShadow = false; // 7,6 m tous les 8 m : un jour entre deux, pas de chevauchement en virage
      // portiques des crêtes, 30 m avant le bout, aux couleurs de la spéciale : la crête se lit au relief, au portique et au public, sans marquage au sol
      insts(h, 'portiqueSaut', { acier: h.mat('acier'), banderole: h.mat('banderoleRallye', { side: THREE.DoubleSide, rep: [2, 1] }, 4) }, crete.map(i => { const s = m(i - 15); return [s.x, s.y, s.z, h.across(s)]; }), { a: [W] });
      // pts 18-22 : l'hélicoptère de la télévision, en vol stationnaire à 26 m au-dessus du bord droit de la piste, le nez vers elle ; il se balance, le rotor tourne (animé plus bas)
      const sH = m(pt(h, 20)), [hx, hz] = bord(sH, 1, 5), heli = new THREE.Group(), rotor = new THREE.Group(), hy = sH.y + 26; heli.userData.dyn = 1; h.scene.add(heli); // dyn : il bouge, hors fusion du décor fixe (game.js)
      heli.position.set(hx, hy, hz); heli.rotation.y = h.across(sH) + Math.PI; rotor.position.y = 1.65; heli.add(rotor);
      const peauH = { caisse: h.mat('peinture', { c: 0xe8482a }), vitre: h.mat('vitreSombre'), chassis: h.mat('matGris'), pale: h.mat('matGris') };
      h.pose('helico', peauH, heli); h.pose('rotorHelico', peauH, rotor);
      // pts 62-68 : à l'entrée du hameau, un moulin à vent en ruine sur le côté le plus dégagé ; à la sortie, un troupeau de moutons dans sa pâture et le berger, devant la clôture, qui fait signe aux voitures
      const cote = s => g.dAt(...bord(s, 1, 40)) > g.dAt(...bord(s, -1, 40)) ? 1 : -1, face = (s, sd) => h.across(s) + (sd > 0 ? Math.PI : 0); // face : l'axe +X d'une forme tourné vers la route
      const sM = m(pt(h, 62) + 4), dM = cote(sM), [mx, mz] = bord(sM, dM, W + 26), bois = h.mat('planches'), pierre = h.mat('pierre'); occ.push([mx, mz, 9]);
      inst(h, h.geo('tourMoulin'), h.mat('pierre', { side: THREE.DoubleSide, c: 0xb89a78 }), [[mx, sol(mx, mz, -0.4), mz, 0, 1.4]]); // pierre plus sombre que celle des mas : il se détache du ciel
      insts(h, 'moulinRuine', { bois, pierre }, [[mx, sol(mx, mz, -0.4), mz, face(sM, dM), 1.4]]); // à l'échelle 1,4 : une tour de 12,6 m
      const sP = m(pt(h, 68) + 8), dP = cote(sP), along = (s, sd, off, a) => { const [x, z] = bord(s, sd, off); return [x + s.tx * a, z + s.tz * a]; }, P0 = W + 6, PL = 21, PA = 28; // la pâture : de P0 à P0 + PL en travers, PA le long de la route
      const clot = [], moutons = [], seg = 7, aTr = h.across(sP), aLg = aTr + Math.PI / 2;
      for (let a = -PA / 2 + seg / 2; a < PA / 2; a += seg) for (const off of [P0, P0 + PL]) { const [x, z] = along(sP, dP, off, a); clot.push([x, sol(x, z), z, aLg]); }
      for (let o = seg / 2; o < PL; o += seg) for (const a of [-PA / 2, PA / 2]) { const [x, z] = along(sP, dP, P0 + o, a); clot.push([x, sol(x, z), z, aTr]); }
      for (let k = 0; k < 18; k++) { const [x, z] = along(sP, dP, P0 + 2 + rnd() * (PL - 4), (rnd() - 0.5) * (PA - 4)); moutons.push([x, sol(x, z), z, rnd() * 6, 0.9 + rnd() * 0.25]); }
      { const [x, z] = along(sP, dP, P0 + PL / 2, 0); occ.push([x, z, 18]); }
      insts(h, 'cloture', { bois }, clot, { a: [seg] }); insts(h, 'mouton', { laine: h.mat('peinture', { c: 0xe4dccb }), tete: h.mat('peinture', { c: 0x2e2620 }) }, moutons);
      const [qx, qz] = along(sP, dP, P0 - 1.4, -6), berger = new THREE.Group(), bras = new THREE.Group(); berger.userData.dyn = 1; h.scene.add(berger);
      berger.position.set(qx, sol(qx, qz), qz); berger.rotation.y = face(sP, dP); berger.scale.setScalar(1.15); bras.position.set(0, 1.5, -0.3); berger.add(bras);
      const peauB = { habit: h.mat('peinture', { c: 0x3a6ab0 }), peau: h.mat('peinture', { c: 0xc89870 }), chapeau: h.mat('peinture', { c: 0x2e2a24 }), bois };
      h.pose('berger', peauB, berger); h.pose('brasBerger', peauB, bras);
      // dans la campagne : des mas isolés avec leurs cyprès, une chapelle au bord de la route, le village sur sa butte autour de la sienne
      const chap = [];
      for (let k = 0, nb = 0; k < 900 && nb < 9; k++) { const [x, z] = hasard(), d = g.dAt(x, z); if (d < 26 || d > 70 || plat(pres(x, z)[1]) || !prend(x, z, 13)) continue;
        const a = rnd() * 6; if (nb++ === 0) chap.push([x, sol(x, z, -0.8), z, a]); else mas.push([x, sol(x, z, -1), z, a]); for (const da of [0.6, 1.1, 3.6]) cyp(x + Math.cos(a + da) * 9, z + Math.sin(a + da) * 9); }
      occ.push([vx, vz, 46]); chap.push([vx, sol(vx, vz, -0.3), vz, 0.4, 1.4]);
      for (let k = 0; k < 22; k++) { const a = k * 2.4, r = 13 + k * 1.15, x = vx + Math.cos(a) * r, z = vz + Math.sin(a) * r; mas.push([x, sol(x, z, -1.2), z, a + (k & 1) * 1.57, 0.9 + rnd() * 0.3]); if (k % 4 === 0) cyp(x + 6, z + 5); }
      insts(h, 'mas', peauM, mas); insts(h, 'chapelle', peauM, chap);
      // vignes et lavandes : des parcelles en rangs sur les pentes
      const champs = [[], []];
      for (let k = 0, nb = 0; k < 1500 && nb < 22; k++) { const [x, z] = hasard(), d = g.dAt(x, z); if (d < 36 || d > 170 || !prend(x, z, 24)) continue;
        const a = rnd() * 3.14, t = nb++ & 1, ca = Math.cos(a), sa = Math.sin(a);
        for (let r = -4; r <= 4; r++) for (let q = -2; q <= 2; q++) { const px = x + ca * q * 7 - sa * r * 3.4, pz = z + sa * q * 7 + ca * r * 3.4; champs[t].push([px, sol(px, pz, 0.25), pz, -a]); } }
      inst(h, h.geo('boite', 7.1, 1.1, 1.1), h.mat('feuillage', { c: 0xc8e070 }), champs[0]).castShadow = false; inst(h, h.geo('boite', 7.1, 0.8, 1.5), h.mat('lavande'), champs[1]).castShadow = false;
      // voitures du public et de l'assistance : une passe de dessin par pièce, la caisse teintée par exemplaire
      const peauV = { caisse: h.mat('laque'), vitre: h.mat('vitreSombre'), feuRouge: h.mat('feuRouge', LUM), feuBlanc: h.mat('lampe', LUM), chassis: h.mat('matGris'), roue: h.mat('roue'), pneu: h.mat('pneu') };
      insts(h, 'voitureGaree', peauV, autos, { teinte: 'caisse' }); insts(h, 'fourgon', peauV, fourgons, { teinte: 'caisse' });
      insts(h, 'barnum', { poteau: h.mat('acier'), toile: h.mat('peinture') }, barnums, { teinte: 'toile' });
      inst(h, h.geo('botte'), h.mat('paille'), bottes.concat(Array.from({ length: 70 }, () => { const [x, z] = hasard(), d = g.dAt(x, z); return d > 14 && d < 110 && vide(x, z, 2) ? [x, sol(x, z, -0.1), z, rnd() * 6] : null; }).filter(Boolean)));
      // pins parasols au bord de la route et en bosquets sur les pentes, oliviers plus bas, buissons de garrigue partout (le même houppier, tout petit, au ras du sol)
      const pin = (x, z) => { const e = 0.8 + rnd() * 0.7, r = 2.8 + rnd() * 2.2, y = sol(x, z); futs.push([x, y + 2.6 * e, z, 0, e]); pins.push([x, y + 5.2 * e + 0.25 * r, z, rnd() * 6, r]); };
      const olivier = (x, z) => { const e = 0.35 + rnd() * 0.2, r = 1.8 + rnd() * 1.4, y = sol(x, z); futs.push([x, y + 2.6 * e, z, rnd(), e * 1.6, e, e * 1.6]); oliviers.push([x, y + 5.2 * e + 0.5 * r, z, rnd() * 6, r, r * 1.7, r]); };
      for (let i = 0; i < N; i += 4) for (const sd of [-1, 1]) { const [x, z] = bord(S[i], sd, S[i].w + 8 + rnd() * 18), q = rnd(); if (q < 0.62 && !plat(i) && vide(x, z, 3) && g.dAt(x, z) > W + 6) (q < 0.4 ? pin : q < 0.52 ? olivier : cyp)(x, z); }
      for (let k = 0; k < 6500; k++) { const [x, z] = hasard(), d = g.dAt(x, z), b = Math.sin(x * 0.021) + Math.cos(z * 0.026) + rnd();
        if (d > 26 && b > 0.9 && vide(x, z, 4)) (rnd() < 0.8 ? pin : olivier)(x, z);
        else if (d > W + 3 && d < 190 && d > m(pres(x, z)[1]).w + 2 && vide(x, z, 1)) { const r = 0.7 + rnd() * 1.3; buissons.push([x, sol(x, z, 0.2), z, rnd() * 6, r]); } }
      inst(h, h.geo('pinParasol'), h.mat('feuillage'), pins); inst(h, h.geo('pinParasol'), h.mat('feuillage'), buissons).castShadow = false; inst(h, h.geo('pinParasol'), h.mat('feuillage', { c: 0xa8c0a0 }), oliviers); // buissons, rangs et banderoles ne portent pas d'ombre : du temps de rendu pour rien
      inst(h, h.geo('tronc'), h.mat('tronc'), futs); inst(h, h.geo('cedre'), h.mat('cedre', { c: 0x9ad08a }), cypres);
      // les ocres : des blocs éboulés au bord de la route, des buttes proches, et une couronne de falaises à l'horizon, dans la brume de poussière
      const buttes = [], cx = (g.box[0] + g.box[2]) / 2, cz = (g.box[1] + g.box[3]) / 2;
      for (let k = 0; k < 2000 && buttes.length < 110; k++) { const [x, z] = hasard(), d = g.dAt(x, z), l = 1.2 + rnd() * 2.6; if (d > m(pres(x, z)[1]).w + 4 && d < 60 && vide(x, z, l)) buttes.push([x, sol(x, z, -0.4), z, rnd() * 6, l, l * (0.6 + rnd() * 0.5), l * (0.7 + rnd() * 0.6)]); } // des blocs, pas des galettes
      for (let k = 0, nb = 0; k < 600 && nb < 20; k++) { const [x, z] = hasard(), d = g.dAt(x, z), l = 30 + rnd() * 40; if (d > l + 40 && d < 280 && prend(x, z, l + 40)) { nb++; buttes.push([x, sol(x, z, -6), z, rnd() * 6, l, 22 + rnd() * 26, l * (0.7 + rnd() * 0.6)]); } }
      for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283 + rnd() * 0.2, r = 1000 + rnd() * 450, l = 170 + rnd() * 190; buttes.push([cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r, rnd() * 6, l, 110 + rnd() * 110, l * (0.7 + rnd() * 0.6)]); }
      inst(h, h.geo('butte'), h.mat('falaiseOcre'), buttes);
      // le ruisseau coule, le public lève les bras par moments, l'hélicoptère se balance sous son rotor, le berger agite le bras
      return (dt, now) => { rotor.rotation.y = now * 0.025; heli.position.y = hy + Math.sin(now * 0.0011) * 0.6; heli.rotation.z = Math.sin(now * 0.0007) * 0.05; bras.rotation.x = -2.6 + Math.sin(now * 0.008) * 0.45; eau.map.offset.y -= dt * 0.25; eauR.map.offset.x += dt * 0.08; foule.map.offset.y = Math.sin(now * 0.0023) + Math.sin(now * 0.0061) > 0.6 ? 0.5 : 0; };
    },
  });
})();
