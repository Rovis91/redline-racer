// Placement du décor de « ville » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  Object.assign(DECORS, {
    // ---------- Ville à plein régime (carte d'origine) : tours éclairées sur la grille des rues, enseignes, mégatours, projecteurs, hologrammes, trafic volant ----------
    ville(h) {
      const { THREE, scene, S, W, rnd, geo, mat, tx, addMat, habille, box, concrete, lum, ribbon } = h, LUMI = { lum: 1 }, beacons = [];
      let signMats, beams, holos, MV, mvP, mvV, mvC, mvGeo, movers, beaconPts;
    { // sol : grille de rues éclairées vue d'en haut
      box(5000, 1, 5000, mat('rues', { lum: 1, rep: [70, 70] }), 0, -60.5, 200);
    }
    {
      const emi = (cols, p) => mat('fenetres', { emissive: 0xffffff, emissiveMap: tx('fenetresAllumees', cols, p) });
      const mats = [emi(['#ffd27a', '#ffe9b0'], 0.45), emi(['#7af0ff', '#d0f8ff'], 0.4), emi(['#ff5ad0', '#ffd27a', '#7af0ff'], 0.5), emi(['#ffd27a'], 0.12)];
      const signs = signMats = ['ネオン', 'スピード', '危険', 'ホテル', '電脳', 'BAR', 'NOODLE', '24H'].map((txt, i) => {
        const c = ['#ff003c', '#00f0ff', '#fcee0a', '#ff4fc8'][i % 4];
        return mat('enseigne', LUMI, c, txt);
      });
      const toits = [], machines = [], cuves = [], D = new THREE.Object3D(); // toits : dalle et acrotère, groupes froids, réservoirs d'eau (sans tirage de rnd : la ville ne bouge pas)
      const surLeToit = (m, w, d, y, k) => { const c = Math.cos(m.rotation.y), s = Math.sin(m.rotation.y), at = (ox, oz) => [m.position.x + c * ox + s * oz, m.position.z - s * ox + c * oz];
        toits.push([...at(0, 0), y + 0.6, m.rotation.y, w + 0.6, 1.2, d + 0.6]);
        if (k >= 0) { machines.push([...at(-0.4 * w, -0.38 * d), y + 1.6, m.rotation.y]); machines.push([...at(-0.4 * w, -0.38 * d + 4), y + 1.6, m.rotation.y]); if (k % 2) cuves.push([...at(0.4 * w, -0.4 * d), y + 3.4, 0]); } };
      for (let gx = -620; gx <= 820; gx += 64) for (let gz = -260; gz <= 780; gz += 64) {
        const x = gx + rnd() * 24 - 12, z = gz + rnd() * 24 - 12, w = 28 + rnd() * 22, d = 28 + rnd() * 22, top = 24 + rnd() * rnd() * 150;
        const lim = (W + 4 + 0.71 * Math.max(w, d)) ** 2;
        if (S.some((s, i) => i % 3 === 0 && (s.x - x) ** 2 + (s.z - z) ** 2 < lim)) continue;
        const ombre = S.some((s, i) => i % 3 === 0 && (s.x - x) ** 2 + (s.z - z) ** 2 < (Math.sqrt(lim) + 60) ** 2); // seules les tours à moins de 60 m de la route portent une ombre : toutes, elles coûtaient 1,4 ms par image à la passe d'ombre (banc ?perf)
        const H = top + 60, m = new THREE.Mesh(geo('immeuble', w, H, d), mats[rnd() * mats.length | 0]);
        m.position.set(x, top - H / 2, z); m.rotation.y = (rnd() - 0.5) * 0.6; m.castShadow = ombre; m.receiveShadow = true; scene.add(m);
        surLeToit(m, w, d, top, toits.length);
        if (rnd() < 0.55) { const h2 = 8 + rnd() * 45, tw = w * (0.4 + rnd() * 0.3), td = d * (0.4 + rnd() * 0.3), tm = box(tw, h2, td, m.material, 0, H / 2 + h2 / 2, 0, m); tm.castShadow = ombre; surLeToit(m, tw, td, top + h2, -1); } // étage en retrait
        if (rnd() < 0.45) { const ah = 10 + rnd() * 35; box(0.8, ah, 0.8, concrete, w * 0.35, H / 2 + ah / 2, d * 0.35, m); beacons.push(x + w * 0.35, top + ah + 1, z + d * 0.35); } // antenne et balise rouge
        for (let k = rnd() * 4 | 0; k > 0; k--) { // 0 à 3 enseignes de tailles variées, horizontales ou en drapeau vertical
          const sm = signs[rnd() * signs.length | 0], sd = rnd() < 0.5 ? -1 : 1, y = Math.max(6, Math.min(top - 5, 6 + rnd() * 45)) - m.position.y;
          const tall = rnd() < 0.35, sw = tall ? 5 : 10 + rnd() * 14, sh = tall ? 14 + rnd() * 10 : sw / 2, o = (rnd() - 0.5) * 0.5;
          if (rnd() < 0.5) box(0.5, sh, sw, sm, sd * (w / 2 + 0.3), y, o * d, m); else box(sw, sh, 0.5, sm, o * w, y, sd * (d / 2 + 0.3), m);
        }
      }
      for (const [l, g, mt] of [[toits, geo('bloc'), concrete], [machines, geo('clim'), mat('matGris')], [cuves, geo('reservoir'), mat('acier')]]) {
        const im = new THREE.InstancedMesh(habille(g, mt), mt, l.length);
        l.forEach(([x, z, y, ry, sx = 1, sy = 1, sz = 1], i) => { D.position.set(x, y, z); D.rotation.set(0, ry, 0); D.scale.set(sx, sy, sz); D.updateMatrix(); im.setMatrixAt(i, D.matrix); }); scene.add(im);
      }
    }
    // ---------- horizon et vie de la ville ----------
    { // mégatours lointaines, hors brouillard : silhouettes piquées de fenêtres sur le halo de l'horizon
      const far = mat('tourLoin', { lum: 1, fog: false }, '#0d0820', ['#ffd27a', '#7af0ff', '#ff5ad0'], 70);
      const im = new THREE.InstancedMesh(geo('bloc'), far, 44), D = new THREE.Object3D(); // une seule passe de dessin pour les 44
      for (let i = 0; i < 44; i++) { const a = i / 44 * 6.283 + rnd() * 0.1, rad = 1150 + rnd() * 500, h = 200 + rnd() * rnd() * 600, w = 60 + rnd() * 90; D.position.set(100 + Math.cos(a) * rad, h / 2 - 60, 250 + Math.sin(a) * rad); D.scale.set(w, h, w); D.updateMatrix(); im.setMatrixAt(i, D.matrix); }
      scene.add(im);
    }
    // faisceaux de projecteurs qui balaient le ciel
    const beamGeo = geo('faisceau');
    beams = [[320, 120], [-120, 330], [520, -120], [80, 660], [-420, 60], [700, 420]].map(([x, z], i) => { const b = new THREE.Mesh(beamGeo, addMat(tx('degrade', ['#5a7cff', '#ff2bd6', '#00f0ff'][i % 3], true), { opacity: 0.5 })); b.position.set(x, -60, z); scene.add(b); return b; });
    // hologrammes géants : les enseignes en lumière pure, qui tournent et grésillent
    holos = [[250, 150, 210], [-160, 165, 300], [450, 140, -90], [0, 185, 640], [640, 170, 520]].map(([x, y, z], i) => { const h = new THREE.Mesh(geo('hologramme'), addMat(signMats[i].map, { opacity: 0.6 })); h.position.set(x, y, z); scene.add(h); return h; });
    // trafic : véhicules volants entre les tours et phares dans les rues en contrebas (un point lumineux chacun)
    MV = 110; mvP = new Float32Array(MV * 3); mvV = new Float32Array(MV * 2); mvC = new Float32Array(MV * 3); mvGeo = new THREE.BufferGeometry();
    for (let i = 0; i < MV; i++) {
      const air = i < 45, ax = rnd() < 0.5, v = (air ? 35 + rnd() * 60 : 14 + rnd() * 22) * (rnd() < 0.5 ? -1 : 1), cell = 5000 / 70, snap = (p, o) => o + Math.round((p - o) / cell) * cell;
      let x = -700 + rnd() * 1600, z = -350 + rnd() * 1200;
      if (!air) { if (ax) z = snap(z, -2300); else x = snap(x, -2500); } // au sol : calé sur la grille des rues
      mvP.set([x, air ? 25 + rnd() * 150 : -59.5, z], i * 3); mvV.set(ax ? [v, 0] : [0, v], i * 2);
      mvC.set(air ? [[1, 1, 1], [1, 0.1, 0.2], [0.2, 0.9, 1]][i % 3] : [[1, 0.7, 0.3], [1, 1, 0.9]][i % 2], i * 3);
    }
    mvGeo.setAttribute('position', new THREE.BufferAttribute(mvP, 3)); mvGeo.setAttribute('color', new THREE.BufferAttribute(mvC, 3));
    movers = new THREE.Points(mvGeo, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, fog: false })); movers.frustumCulled = false; scene.add(movers);
    const beaconGeo = new THREE.BufferGeometry(); beaconGeo.setAttribute('position', new THREE.Float32BufferAttribute(beacons, 3));
    beaconPts = new THREE.Points(beaconGeo, new THREE.PointsMaterial({ color: 0xff2030, size: 2, sizeAttenuation: false, fog: false })); scene.add(beaconPts);
      // bouches d'égout au bord de la chaussée : une plaque sombre, d'où game.js fait monter un panache de vapeur teinté par le néon le plus proche (h.vapeur)
      const plaque = mat('peinture', { c: 0x0e0e12 });
      for (let i = 40; i < h.N; i += 140) { if (h.zone(i, 30) > 0) continue; const s = S[i], sd = (i / 140 | 0) & 1 ? 1 : -1, x = s.x - s.tz * sd * (W - 1.6), z = s.z + s.tx * sd * (W - 1.6); box(1.1, 0.05, 1.1, plaque, x, s.y + 0.03, z); h.vapeur(x, s.y + 0.1, z); }
      // ---------- repères du tour (sans tirage de rnd : le reste de la ville ne bouge pas) ----------
      const acier = mat('acier'), DS = THREE.DoubleSide;
      { // le marché de nuit (points 13 à 16) : une dalle de chaque côté de la voie rapide, des étals qui fument, la foule sous des parapluies transparents, des lanternes rouges en travers de la rue
        const i0 = pt(h, 13), i1 = pt(h, 16) - 10, n = i1 - i0, D0 = W + 1.6, D1 = W + 15;
        const dalle = mat('peinture', { c: 0x2a2630, side: DS });
        for (const sd of [-1, 1]) { ribbon(i0, n, sd * D0, -0.15, sd * D1, -0.15, dalle, 8); ribbon(i0, n, sd * D1, -0.15, sd * D1, 1.1, concrete); ribbon(i0, n, sd * D0, -0.15, sd * D0, -2.2, concrete); ribbon(i0, n, sd * D1, -0.15, sd * D1, -2.2, concrete); }
        let a = 77; const al = () => (a = a * 1664525 + 1013904223 >>> 0) / 4294967296; // hasard propre au marché
        const etals = [], gens = [], parap = [], lant = [], fils = [], mats = [], cols = [0xd02030, 0xf4f0e0, 0x109a8a, 0xffb020];
        for (let i = i0 + 3, k = 0; i < i1 - 2; i += 3, k++) for (const sd of [-1, 1]) { const s = S[i];
          if ((k + (sd > 0 ? 1 : 0)) % 4 === 3) continue; // des trous entre les étals
          const [x, z] = bord(s, sd, W + 10.5); etals.push([x, s.y - 0.15, z, Math.atan2(-sd * s.tz, sd * s.tx), 1, 1, 1, cols[(k * 3 + (sd > 0 ? 1 : 0)) % 4]]);
          if (k % 5 === 1) h.vapeur(x, s.y + 1.4, z); // la vapeur des réchauds, quelques-uns
        }
        for (let k = 0; k < 70; k++) { const s = S[i0 + 2 + (al() * (n - 4) | 0)], sd = al() < 0.5 ? -1 : 1, [x, z] = bord(s, sd, W + 3.5 + al() * 4.5), ht = 1.55 + al() * 0.3;
          gens.push([x, s.y - 0.15 + ht / 2, z, al() * 6, 1, ht / 1.7, 1]); if (al() < 0.55) parap.push([x, s.y + ht + 0.2, z, 0, 0.9 + al() * 0.3]); }
        inst(h, geo('boite', 0.5, 1.7, 0.35), mat('peinture', { c: 0x3a3448 }), gens);
        insts(h, 'etal', { comptoir: mat('planches', { c: 0x8a6a4a }), rechaud: mat('peinture', { lum: 1, c: 0xff7a20 }), perche: acier, toile: mat('peinture', { side: DS }), ampoules: mat('lanterne', LUMI) }, etals, { teinte: 'toile' });
        const gp = new THREE.ConeGeometry(0.9, 0.45, 10, 1, true); gp.translate(0, -0.22, 0); // parapluie : un cône ouvert, la pointe en haut
        inst(h, gp, new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.28, side: DS, depthWrite: false }), parap);
        inst(h, geo('boite', 0.04, 0.9, 0.04), acier, parap.map(p => [p[0], p[1] - 0.6, p[2]]));
        // les lanternes : un fil tous les 7 échantillons entre deux mâts, sept lanternes qui pendent avec la flèche du fil ; une ligne sur trois éclaire la rue
        for (let i = i0 + 2, k = 0; i < i1; i += 7, k++) { const s = S[i];
          for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, W + 1.9); fils.push([x, s.y + 3.9 - 0.15, z, 0, 1, 1, 1]); }
          fils.push([s.x, s.y + 7.6, s.z, h.across(s), 2 * W + 3.8, 0.04, 0.04]);
          for (let j = 0; j < 7; j++) { const o = (j - 3) / 3 * (W - 1), [x, z] = bord(s, 1, o); lant.push([x, s.y + 7.6 - 0.9 * (1 - (o / W) ** 2) - 0.5, z, h.across(s)]); }
          if (k % 3 === 1) lum(i, s.x, s.y + 6.5, s.z, 0xff2a30, 18, 0.7); }
        inst(h, geo('boite', 0.2, 7.8, 0.2), acier, fils.filter(f => f[4] === 1));
        inst(h, geo('boite', 1, 1, 1), mat('matGris'), fils.filter(f => f[4] !== 1));
        inst(h, geo('lanterne'), mat('peinture', { lum: 1, c: 0xff2a30 }), lant);
        inst(h, geo('boite', 0.3, 0.12, 0.3), mat('peinture', { lum: 1, c: 0xffd05a }), lant.map(p => [p[0], p[1] - 0.46, p[2], p[3]])); // le gland doré sous chaque lanterne
        box(18, 3.2, 0.4, mat('ecrit', LUMI, 224, 40, '#2a0408', '#ffd05a', '夜市 MARCHE DE NUIT', 26), ...(s => [s.x, s.y + 9.2, s.z])(S[i0 + 2])).rotation.y = h.across(S[i0 + 2]); // l'enseigne d'entrée, posée sur le premier fil
      }
      { // l'entrée du tunnel dans un immeuble d'habitation, comme le métro de Chongqing : la voie rapide entre par un trou au milieu des étages
        const T = h.T, K = 15, a = S[T.t0], b = S[T.t0 + K], L = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L; // axe : la corde des 30 premiers mètres du tunnel, qui tourne
        let dev = 0; for (let k = 0; k <= K; k++) { const s = S[T.t0 + k]; dev = Math.max(dev, Math.abs((s.z - a.z) * ux - (s.x - a.x) * uz)); }
        const tr = W + 2 + dev, w = 2 * tr + 28, d = L + 1, haut = 95, bas = -60, yl = b.y - 0.3, yh = a.y + 10.3, ry = Math.atan2(ux, uz), c = (L - 1) / 2; // trou : la route y passe sans toucher les murs malgré le virage et la descente
        const fen = mat('fenetres', { emissive: 0xffffff, emissiveMap: tx('fenetresAllumees', ['#ffd27a', '#ffe9b0'], 0.45) });
        const bloc = (x0, x1, y0, y1) => { const m = new THREE.Mesh(geo('immeuble', x1 - x0, y1 - y0, d), fen), x = (x0 + x1) / 2;
          m.position.set(a.x + ux * c + uz * x, (y0 + y1) / 2, a.z + uz * c - ux * x); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; scene.add(m); };
        bloc(-w / 2, -tr, bas, haut); bloc(tr, w / 2, bas, haut); bloc(-tr, tr, yh, haut); bloc(-tr, tr, bas, yl);
        box(2 * tr, 4, 0.5, signMats[4], a.x - ux * 1.3, yh + 3, a.z - uz * 1.3).rotation.y = ry; // enseigne au-dessus du trou
      }
      h.beams.push(...beams); // game.js les tourne vers la caméra de chaque vue
      return (dt, now) => { // enseignes qui clignotent, grésillent ou défilent ; hologrammes, trafic, balises
        signMats.forEach((m, i) => { m.color.setScalar(i % 3 === 0 ? ((now / 400 + i) & 1 ? 1 : 0.25) : i % 3 === 1 && Math.random() < 0.04 ? 0.3 : 1); if (i % 2) m.map.offset.x += dt * 0.12; });
        holos.forEach((h, i) => { h.rotation.y += dt * 0.25; h.material.opacity = 0.45 + 0.2 * Math.sin(now * 0.004 + i) - (Math.random() < 0.05 ? 0.3 : 0); });
        for (let i = 0; i < MV; i++) {
          let x = mvP[i * 3] + mvV[i * 2] * dt, z = mvP[i * 3 + 2] + mvV[i * 2 + 1] * dt;
          mvP[i * 3] = x < -700 ? x + 1600 : x > 900 ? x - 1600 : x; mvP[i * 3 + 2] = z < -350 ? z + 1200 : z > 850 ? z - 1200 : z;
        }
        mvGeo.attributes.position.needsUpdate = true; beaconPts.visible = (now / 700 & 1) === 1;
      };
    },
  });
})();
