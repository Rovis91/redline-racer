// La foule des tribunes, partagée par les cartes à gradins (stade, canal) : POSEURS.foule(h, opts) → tick (dt, now, car), à appeler dans le tick du décor.
// Trois choses : (1) les bras qui se lèvent par moments (décalage d'une demi-hauteur de la texture `foule`, rien n'est redessiné) ; (2) la ola, une copie bras levés
// de la foule du bas, levée sur les modules proches de la voiture suivie et cachée sous le sol ailleurs ; (3) les réactions à la course : quand la voiture suivie double,
// prend la tête ou tape un mur, une banderole géante (un tifo, quatre modules de large) se déroule sur le rang du bas devant elle, des pancartes s'y lèvent autour,
// toute la salle se lève (bras levés) et la clameur part (SON.clameur).
// Les cartes ne gardent que leurs données (gradins, réglages, textes).
//   etages : [{ mat, f1, f2, ph, seuil }]   mat = matériau `foule` d'un étage ; bras levés quand sin(now·f1 + ph) + sin(now·f2) > seuil
//   ola    : { mods, larg, prof, pente, y, z, ecart }
//     mods   : modules de tribune posés [x, y, z, rotY, éch. x, éch. y, éch. z] (mêmes listes que le décor passe à insts)
//     larg, prof, pente (rad), y, z : le rang du bas dans le repère du module (formes-<carte>.js : ['foule', larg, 0.6, prof, 0, y, z, [-pente, 0, 0]])
//     ecart(k, car) → 0..1 : à quel point le module k est « dans la vague » (0 = au sol, caché)
//   pancartes : { sorte: [[texte, fond, encre], …] } (mêmes textes pour les pancartes et la banderole) ; sortes suivies d'elles-mêmes : double, tete, choc. Les autres (saut, feu…), la carte les lève par tick.leve(car, sorte)
// Le tick renvoie la sorte levée à cette image (ou null) ; tick.leve(car, sorte, n) lève n pancartes devant la voiture ; tick.debout() : la salle est debout (2,5 s après une réaction)
(function () {
  POSEURS.foule = (h, { etages, ola: o, pancartes: textes = {} }) => {
    const { THREE } = h, { inst } = POSEURS, o4 = new THREE.Object3D();
    const go = h.geo('boite', o.larg, 0.6, o.prof); go.rotateX(-o.pente); go.translate(0, o.y + 1.2, o.z);
    const fo = h.mat('foule', {}, '#4a4458', '#f4f0e0'); fo.map.anisotropy = 8; fo.map.offset.y = 0.5;
    const ola = inst(h, go, fo, o.mods); ola.userData.dyn = 1; ola.frustumCulled = false; // dyn : elle bouge, hors fusion du décor fixe (game.js)

    // les pancartes : 6 places par module sur le premier quart du rang du bas (du bas au haut du rang : [z, y] av et ar dans le repère du module), face à la piste
    const av = [o.z - o.prof / 2 * Math.cos(o.pente), o.y - o.prof / 2 * Math.sin(o.pente)], ar = [o.z + o.prof / 2 * Math.cos(o.pente), o.y + o.prof / 2 * Math.sin(o.pente)];
    const P = [], ob = new THREE.Object3D(), Z = new THREE.Matrix4().makeScale(0, 0, 0), gp = new THREE.PlaneGeometry(4.6, 2.6); gp.translate(0, 0.5, 0);
    let a = 4242; const rn = () => (a = (a * 16807) % 2147483647) / 2147483647; // hasard propre : ne décale pas h.rnd, donc pas le reste du décor
    for (const [x, y, z, r, sx = 1, sy = 1, sz = 1] of o.mods) for (let k = 0; k < 6; k++) { const t = rn() * 0.25, lx = (rn() - 0.5) * 12 * sx, lz = (av[0] + (ar[0] - av[0]) * t) * sz, ly = (av[1] + (ar[1] - av[1]) * t) * sy + 1.3, c = Math.cos(r), s = Math.sin(r);
      P.push([x + lx * c + lz * s, y + ly, z - lx * s + lz * c, r + Math.PI]); }
    const C = 16, M = {}, L = 3.2; // C pancartes au plus par texte ; L : secondes levées
    for (const [so, l] of Object.entries(textes)) M[so] = l.map(txt => { const [t, fond, encre] = txt; const m = new THREE.InstancedMesh(gp, h.mat('ecrit', { lum: 1, side: THREE.DoubleSide }, 64, 36, fond, encre, t, 12), C);
      for (let k = 0; k < C; k++) m.setMatrixAt(k, Z); m.frustumCulled = false; m.userData.dyn = 1; m.visible = false; h.scene.add(m); return { m, txt, sl: Array.from({ length: C }, () => ({ t: -1 })) }; });
    // les banderoles : une par texte, posée à plat sur la pente du rang du bas de quatre modules, déroulée du haut vers le bas, tenue 4 s, roulée
    // devant la voiture, assez loin pour être dans le champ de la caméra de course (les tribunes sont sur le côté) : 2,5 s de course, 80 m au moins
    const devant = car => { const v = Math.hypot(car.vx, car.vz) || 1, d = Math.max(80, v * 2.5); return [car.x + car.vx / v * d, car.z + car.vz / v * d]; };
    const gb = new THREE.PlaneGeometry(1, 1); gb.translate(0, -0.5, 0); // le haut au pivot : elle se déroule vers le bas de la pente
    const BAN = Object.values(M).flat().map(e => { const [t, fond, encre] = e.txt, b = new THREE.Mesh(gb, h.mat('ecrit', { lum: 1, side: THREE.DoubleSide }, 192, 112, fond, encre, t, 64));
      b.visible = false; b.userData.dyn = 1; b.rotation.order = 'YXZ'; h.scene.add(b); e.ban = { b, t: -1 }; return e.ban; });
    const deroule = (e, car) => { const [x, z] = devant(car), k = o.mods.reduce((bk, p, j) => ((p[0] - x) ** 2 + (p[2] - z) ** 2 < (o.mods[bk][0] - x) ** 2 + (o.mods[bk][2] - z) ** 2 ? j : bk), 0);
      const [px, py, pz, r, sx = 1, sy = 1, sz = 1] = o.mods[k], lz = (av[0] + (ar[0] - av[0]) * 0.92) * sz, ly = (av[1] + (ar[1] - av[1]) * 0.92) * sy + 1.6, c = Math.cos(r), sn = Math.sin(r), B = e.ban.b;
      B.position.set(px + lz * sn, py + ly, pz + lz * c); B.rotation.set(-(Math.PI / 2 - o.pente), r + Math.PI, 0); B.userData.l = [4 * o.larg * sx, 0.84 * o.prof * sz]; e.ban.t = 0; actif = true; };
    let actif = false, vue = null, pos = 0, attente = 0, hurle = 0, tNow = 0;
    const leve = (car, so, n = 24) => { const l = M[so]; hurle = tNow + 2500; if (window.SON) SON.clameur(); if (!l) return; deroule(l[(Math.random() * l.length) | 0], car); 
      const [x, z] = devant(car), pr = P.filter(p => (p[0] - x) ** 2 + (p[2] - z) ** 2 < 12100);
      for (let j = 0; j < n && pr.length; j++) { const p = pr.splice((Math.random() * pr.length) | 0, 1)[0], e = l[(Math.random() * l.length) | 0], s = e.sl.find(q => q.p == null) || e.sl.reduce((u, v) => (v.t > u.t ? v : u)); // une libre, sinon la plus ancienne
        Object.assign(s, { t: -j * 0.03, p, ph: Math.random() * 6 }); } actif = true; }; // t < 0 au départ : elles se lèvent l'une après l'autre

    const tick = (dt, now, car) => { let ev = null; tNow = now; attente -= dt;
      if (car) {
        o.mods.forEach((p, k) => { const e = o.ecart(k, car); o4.position.set(p[0], p[1] + (e ? e * 1.6 - 1 : -60), p[2]); o4.rotation.set(0, p[3], 0); o4.scale.set(p[4], p[5], p[6]); o4.updateMatrix(); ola.setMatrixAt(k, o4.matrix); });
        ola.instanceMatrix.needsUpdate = true;
        if (car.pos) { if (car !== vue) { vue = car; pos = car.pos; } // car.pos : la place en course (rien hors course)
          if (car.hit > 8 && attente < 0) ev = 'choc'; else if (car.pos < pos && attente < 0) ev = car.pos === 1 ? 'tete' : 'double';
          pos = car.pos; if (ev) { leve(car, ev); attente = 2; } }
      }
      for (const { mat, f1, f2, ph, seuil } of etages) mat.map.offset.y = now < hurle || Math.sin(now * f1 + ph) + Math.sin(now * f2) > seuil ? 0.5 : 0;
      if (actif) { actif = false;
        for (const l of Object.values(M)) for (const { m, sl } of l) { let maj = false;
          sl.forEach((s, k) => { if (s.p == null) return; s.t += dt; maj = true; if (s.t > L) { s.p = null; s.t = -1; m.setMatrixAt(k, Z); return; } actif = true;
            const u = Math.max(0, Math.min(1, s.t / 0.2, (L - s.t) / 0.3)), p = s.p; // u : levée, puis baissée
            ob.position.set(p[0], p[1] - 1.2 * (1 - u) + 0.3 * Math.abs(Math.sin(s.t * 9 + s.ph)), p[2]); ob.rotation.set(0, p[3], 0.15 * Math.sin(s.t * 6 + s.ph)); ob.scale.setScalar(u); ob.updateMatrix(); m.setMatrixAt(k, ob.matrix); });
          if (maj) m.instanceMatrix.needsUpdate = true; m.visible = sl.some(q => q.p != null); }
        for (const e of BAN) { if (e.t < 0) continue; e.t += dt; const [w, ht] = e.b.userData.l, u = Math.max(0, Math.min(1, e.t / 0.8, (5.4 - e.t) / 0.6)); // déroulée en 0,8 s, tenue, roulée en 0,6 s
          if (e.t > 5.4) { e.t = -1; e.b.visible = false; continue; } actif = true; e.b.visible = u > 0.01; e.b.scale.set(w, ht * u, 1); } }
      return ev;
    };
    tick.leve = (car, so, n) => { leve(car, so, n); return so; };
    tick.debout = () => tNow < hurle;
    return tick;
  };
})();
