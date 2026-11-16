// Placement du décor de « touge » : ajoute sa fonction à DECORS. Les poseurs partagés viennent de decors.js. Voir METHODE-DECOR.md.
(function () {
  const { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain } = POSEURS;

  // La mégapole de nuit tout autour du massif du touge, de 800 à 2 350 m du milieu des lacets, 110 à 240 m sous eux, hors brouillard. Le ciel est une sphère de 2 500 m
  // autour de la caméra : rien n'est posé au-delà de 2 350 m des lacets et de la supérette, sinon il disparaîtrait derrière.
  // Une ville japonaise, pas un damier : des quartiers serrés chacun avec sa trame (îlots de 25 à 55 m, rues qui ondulent), un tapis continu de petits
  // immeubles éclairés en blanc froid et chaud, des autoroutes urbaines surélevées qui serpentent, des voies ferrées et leurs gares, des grappes de tours
  // et partout des feux rouges d'obstacle qui clignotent ensemble ; une tour de télévision, une tour en treillis rouge, la baie et son pont suspendu.
  // Tout en points de taille fixe à l'écran (nets à toute distance), une passe de dessin par taille. Renvoie la matière des feux rouges.
  function ville(h, g) { // g = terrain du massif, pour poser les hameaux
    const { THREE } = h, C = [460, 430], VU = [[460, 430], [720, 580]], A = [], B = [], F = [], R = []; // A : rues ; B : axes, gares, monuments ; F : fenêtres ; R : feux rouges
    let sd = 91; const al = () => (sd = sd * 1664525 + 1013904223 >>> 0) / 4294967296; // hasard propre à la ville : ne décale pas rnd
    const pol = (deg, r) => [C[0] + Math.cos(deg / 57.3) * r, C[1] + Math.sin(deg / 57.3) * r], rC = (x, z) => Math.hypot(x - C[0], z - C[1]);
    const alt = r => -150 + (r - 800) * 0.07 + Math.max(0, r - 1800) * 0.06, y0 = (x, z) => alt(rC(x, z)); // le sol remonte vers l'horizon : le tapis va jusqu'à lui
    const baie = pol(212, 1750), BX = 560, BZ = 360, eau = (x, z) => ((x - baie[0]) / BX) ** 2 + ((z - baie[1]) / BZ) ** 2 < 1;
    const parcs = Array.from({ length: 22 }, () => [...pol(al() * 360, 1150 + al() * 1100), 40 + al() * 80]);
    const sol = (x, z) => { const r = rC(x, z); return r > 800 && VU.every(([vx, vz]) => (x - vx) ** 2 + (z - vz) ** 2 < 2350 * 2350) && !eau(x, z) && parcs.every(([px, pz, pr]) => (x - px) ** 2 + (z - pz) ** 2 > pr * pr); };
    const centres = [[178, 1300, 1], [150, 1700, 1], [200, 2050, 0.9], [128, 1450, 0.8], [240, 1350, 0.8], [105, 2000, 0.7], [255, 2000, 0.7], [60, 1500, 0.5], [300, 1500, 0.5]].map(([a, r, f]) => [...pol(a, r), f]);
    const dens = (x, z) => Math.min(1, 0.45 + centres.reduce((a, [cx, cz, f]) => a + f * 0.8 * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 1.6e5), 0));
    const met = (L, x, y, z, c, k = 0.7 + al() * 0.3) => L.push(x, y, z, (c >> 16 & 255) / 255 * k, (c >> 8 & 255) / 255 * k, (c & 255) / 255 * k);
    const blanc = (chaud) => { const u = al(); return chaud > u ? 0xffe0b0 : u < 0.6 ? 0xe8f0ff : u < 0.88 ? 0xfff4e0 : u < 0.94 ? 0xffb060 : [0xff60c0, 0x60f0ff, 0x80ff90, 0xffe040][al() * 4 | 0]; };
    // quartiers : chacun sa trame, son orientation, la taille de ses îlots ; une table de 25 m dit à quel quartier appartient chaque point
    const Q = Array.from({ length: 90 }, () => { const [x, z] = pol(al() * 360, 750 + Math.sqrt(al()) * 1650); return { x, z, a: al() * 3.1416, s: 25 + al() * 30, o: al() * 6.283 }; });
    const T0 = [C[0] - 2400, C[1] - 2400], NT = 192, tab = new Uint8Array(NT * NT);
    for (let i = 0; i < NT; i++) for (let j = 0; j < NT; j++) { const x = T0[0] + i * 25, z = T0[1] + j * 25; let b = 0, bd = 1e18; Q.forEach((q, k) => { const d = (q.x - x) ** 2 + (q.z - z) ** 2; if (d < bd) { bd = d; b = k; } }); tab[i * NT + j] = b; }
    const quartier = (x, z) => { const i = (x - T0[0]) / 25 | 0, j = (z - T0[1]) / 25 | 0; return i < 0 || j < 0 || i >= NT || j >= NT ? -1 : tab[i * NT + j]; };
    Q.forEach((q, k) => {
      const ca = Math.cos(q.a), sa = Math.sin(q.a);
      for (const sens of [0, 1]) for (let u = -480, n = 0; u < 480; u += q.s * (0.7 + al() * 0.6), n++) {
        const grande = n % 5 === 2; // une rue sur cinq est une avenue, plus claire
        for (let v = -480; v < 480; v += grande ? 4 : 6) {
          const w = u + Math.sin(v / 70 + q.o) * 4, [a, b] = sens ? [w, v] : [v, w], x = q.x + a * ca - b * sa, z = q.z + a * sa + b * ca; // les rues ondulent un peu
          if (quartier(x, z) === k && sol(x, z) && al() < dens(x, z)) met(grande ? B : A, x, y0(x, z) + 1, z, grande ? 0xfff0d0 : blanc(0.15));
        }
      }
    });
    // le tapis des petits immeubles : fenêtres à toutes les hauteurs, plus hautes et plus serrées vers les centres
    for (let k = 0; k < 160000; k++) { const [x, z] = pol(al() * 360, Math.sqrt(800 ** 2 + al() * (2350 ** 2 - 800 ** 2))); const d = dens(x, z); if (sol(x, z) && al() < d) met(F, x, y0(x, z) + 3 + al() * al() * (10 + 70 * d * d), z, blanc(0.3), 0.45 + al() * 0.55); }
    // autoroutes urbaines surélevées : elles serpentent, lampadaires orangés des deux côtés, phares blancs et feux rouges
    for (let k = 0; k < 9; k++) {
      let [x, z] = pol(al() * 360, 1100 + al() * 1100), cap = al() * 6.283, vir = 0;
      for (let p = 0; p < 1600; p++) {
        vir = vir * 0.98 + (al() - 0.5) * 0.004; cap += vir; x += Math.cos(cap) * 3; z += Math.sin(cap) * 3;
        if (!sol(x, z)) { if (rC(x, z) < 800) cap += 0.05; continue; }
        const y = y0(x, z) + 16, nx = -Math.sin(cap), nz = Math.cos(cap);
        if (p % 4 === 0) for (const s of [-1, 1]) met(B, x + nx * 7 * s, y + 4, z + nz * 7 * s, 0xffa040, 0.9);
        if (al() < 0.45) met(B, x + nx * 2, y, z + nz * 2, 0xfff4e8); if (al() < 0.45) met(B, x - nx * 2, y, z - nz * 2, 0xff2a18);
      }
    }
    // voies ferrées : de longs traits presque droits, lumière verdâtre, et des gares très éclairées
    for (let k = 0; k < 7; k++) {
      let [x, z] = pol(al() * 360, 1100 + al() * 300), cap = Math.atan2(z - C[1], x - C[0]) + (al() - 0.5) * 1.2;
      for (let p = 0; p < 500; p++) {
        cap += (al() - 0.5) * 0.02; x += Math.cos(cap) * 4; z += Math.sin(cap) * 4;
        if (!sol(x, z)) continue;
        if (p % 3 === 0) met(B, x, y0(x, z) + 6, z, 0xc8ffe0, 0.6);
        if (p % 160 === 80) for (let i = 0; i < 60; i++) { const t = (al() - 0.5) * 120, e = (al() - 0.5) * 24; met(B, x + Math.cos(cap) * t - Math.sin(cap) * e, y0(x, z) + 4 + al() * 8, z + Math.sin(cap) * t + Math.cos(cap) * e, al() < 0.7 ? 0xffffff : 0xffe070); }
      }
    }
    // la baie : un quai éclairé, des bateaux, et un pont suspendu (deux pylônes, câbles en chaînette)
    for (let t = 0; t < 6.283; t += 0.003) { const x = baie[0] + Math.cos(t) * (BX + 6), z = baie[1] + Math.sin(t) * (BZ + 6); if (rC(x, z) > 800 && VU.every(([vx, vz]) => Math.hypot(x - vx, z - vz) < 2350)) met(B, x, y0(x, z) + 2, z, al() < 0.6 ? 0xffb860 : 0xffffff); }
    for (let k = 0; k < 18; k++) { const t = al() * 6.283, q = al() * 0.85; met(B, baie[0] + Math.cos(t) * BX * q, y0(...baie) + 1, baie[1] + Math.sin(t) * BZ * q, [0xffffff, 0xff4030, 0x40ff80][k % 3]); }
    { const P0 = [baie[0] + Math.cos(0.75) * BX, baie[1] + Math.sin(0.75) * BZ], P1 = [baie[0] + Math.cos(2.4) * BX, baie[1] + Math.sin(2.4) * BZ], yb = y0(...baie) + 25;
      const at = t => [P0[0] + (P1[0] - P0[0]) * t, P0[1] + (P1[1] - P0[1]) * t];
      for (let t = 0; t <= 1; t += 0.0025) { const [x, z] = at(t), c = t < 0.25 ? (0.25 - t) / 0.25 : t > 0.75 ? (t - 0.75) / 0.25 : Math.abs(t - 0.5) / 0.25;
        met(B, x, yb, z, 0xfff0d0, 0.9); if (t % 0.01 < 0.0025) met(B, x, yb + 4 + 80 * c * c, z, 0xe0f0ff, 0.9); } // tablier et câbles
      for (const t of [0.25, 0.75]) { const [x, z] = at(t); for (let e = 0; e < 90; e += 3) met(B, x, yb + e, z, 0xffffff, 0.8); R.push(x, yb + 92, z, 1, 1, 1); }
    }
    // tours : grappes serrées autour des centres, et quelques-unes partout ; silhouettes sombres (elles cachent la ville derrière), fenêtres, feu rouge
    const tours = [];
    const tour = (x, z, w, p, ht) => {
      const b = y0(x, z); tours.push([x, b + ht / 2, z, w, ht, p]);
      for (let e = 4; e < ht - 2; e += 6) for (const [fx, fz, lx, lz, L] of [[1, 0, 0, 1, p], [-1, 0, 0, 1, p], [0, 1, 1, 0, w], [0, -1, 1, 0, w]]) for (let c = -L / 2 + 3; c < L / 2 - 1; c += 5)
        if (al() < 0.2) met(F, x + fx * (w / 2 + 0.4) + lx * c, b + e, z + fz * (p / 2 + 0.4) + lz * c, blanc(0.25), 0.6 + al() * 0.4);
      if (ht > 90) R.push(x, b + ht + 1, z, 1, 1, 1);
    };
    for (const [cx, cz, f] of centres) for (let k = 0; k < 60 * f; k++) {
      const a = al() * 6.283, d = Math.sqrt(-2 * Math.log(1 - al() * 0.99)) * 110, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (sol(x, z)) tour(x, z, 20 + al() * 22, 20 + al() * 22, 40 + f * 220 * Math.exp(-d * d / 3e4) * (0.4 + al() * 0.6));
    }
    for (let k = 0; k < 320; k++) { const [x, z] = pol(al() * 360, 900 + al() * 1450); if (sol(x, z)) tour(x, z, 14 + al() * 16, 14 + al() * 16, 30 + al() * al() * 90); }
    for (let k = 0; k < 350; k++) { const [x, z] = pol(al() * 360, 900 + al() * 1450); if (sol(x, z) && al() < dens(x, z)) R.push(x, y0(x, z) + 25 + al() * 40, z, 1, 1, 1); } // les toits des immeubles moyens
    // la tour de télévision : un fût fin aux anneaux éclairés, deux observatoires ; la tour en treillis rouge, illuminée en orange
    { const [x, z] = pol(195, 1500), b = y0(x, z);
      for (let e = 0; e < 380; e += 3) { const r = 13 - e * 0.022; for (let i = 0; i < 10; i++) if (e % 24 === 0 || i % 5 === 0) met(B, x + Math.cos(i * 0.628) * r, b + e, z + Math.sin(i * 0.628) * r, 0xc8dcff, 0.8); }
      for (const [e, r] of [[225, 16], [290, 11]]) for (let i = 0; i < 36; i++) for (const de of [0, 3, 6]) met(B, x + Math.cos(i * 0.1745) * r, b + e + de, z + Math.sin(i * 0.1745) * r, 0xffffff, 1);
      R.push(x, b + 384, z, 1, 1, 1); }
    { const [x, z] = pol(165, 1420), b = y0(x, z), dm = e => 16 * (1 - e / 230) ** 1.6 + 1;
      for (let e = 0; e < 220; e += 2) for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) met(B, x + sx * dm(e), b + e, z + sz * dm(e), 0xff7020, 1);
      for (const e of [0, 55, 100, 150]) for (let t = -1; t <= 1; t += 0.08) for (const [sx, sz, ox, oz] of [[1, 0, 0, 1], [-1, 0, 0, 1], [0, 1, 1, 0], [0, -1, 1, 0]]) met(B, x + (sx + ox * t) * dm(e), b + e, z + (sz + oz * t) * dm(e), e === 100 ? 0xffffff : 0xff7020, 1);
      R.push(x, b + 223, z, 1, 1, 1); }
    const sil = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x04060a, fog: false }), Math.max(1, tours.length)), o = new THREE.Object3D();
    tours.forEach((t, i) => { o.position.set(t[0], t[1], t[2]); o.scale.set(t[3], t[4], t[5]); o.updateMatrix(); sil.setMatrixAt(i, o.matrix); }); sil.count = tours.length; sil.frustumCulled = false; h.scene.add(sil);
    const nuage = (L, size) => { // une passe de dessin : des points de taille fixe à l'écran, donc nets à toute distance. Élément : x, y, z, r, v, b
      const g = new THREE.BufferGeometry(), n = L.length / 6, P = new Float32Array(n * 3), K = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { P.set(L.slice(i * 6, i * 6 + 3), i * 3); K.set(L.slice(i * 6 + 3, i * 6 + 6), i * 3); }
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(K, 3));
      const m = new THREE.PointsMaterial({ size, sizeAttenuation: false, fog: false, vertexColors: true }), pts = new THREE.Points(g, m); pts.frustumCulled = false; h.scene.add(pts); return m;
    };
    // la lueur du ciel au-dessus de la ville : un anneau de 2 300 m, du dégradé en lumière ajoutée, qui monte de l'horizon et s'éteint vers le haut
    // plus forte face aux quartiers denses : chaque sommet de l'anneau prend la densité de la ville dans sa direction
    const hg = new THREE.CylinderGeometry(2300, 2300, 420, 96, 1, true), hp = hg.attributes.position, hc = new Float32Array(hp.count * 3);
    for (let i = 0; i < hp.count; i++) { const a = Math.atan2(hp.getZ(i), hp.getX(i)); let d = 0; for (const r of [1300, 1700, 2100]) d += dens(C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r) / 3; const k = Math.max(0.15, (d - 0.45) * 1.8); hc.set([k, k, k], i * 3); }
    hg.setAttribute('color', new THREE.BufferAttribute(hc, 3));
    const halo = new THREE.Mesh(hg, h.mat('degrade', { lum: 1, fog: false, transparent: true, opacity: 0.6, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }, '#b4643c', true));
    halo.position.set(C[0], 170, C[1]); halo.frustumCulled = false; h.scene.add(halo);
    // des hameaux dans les vallons du massif, entre la route et la plaine : quelques maisons éclairées, un lampadaire
    if (g) for (let k = 0; k < 24; k++) { const x0 = g.box[0] + al() * (g.box[2] - g.box[0]), z0 = g.box[1] + al() * (g.box[3] - g.box[1]); if (g.dAt(x0, z0) < 90) continue;
      for (let i = 0; i < 30; i++) { const x = x0 + (al() - 0.5) * 120, z = z0 + (al() - 0.5) * 120; if (g.dAt(x, z) > 70) met(A, x, g.hAt(x, z) + 1.5 + al() * 4, z, al() < 0.7 ? 0xffd090 : 0xe8f0ff, 0.5 + al() * 0.4); } }
    nuage(A, 1.5); nuage(B, 2); nuage(F, 1);
    return nuage(R, 2.5); // la couleur de la matière multiplie celle des points : le tick fait clignoter tous les feux rouges ensemble
  }

  Object.assign(DECORS, {
    // ---------- Karasu-tōge : forêt de cèdres, glissières à catadioptres, et au sommet un carrefour : supérette de nuit, station-service, voitures garées ----------
    touge(h) {
      const { THREE, S, N, W, rnd } = h;
      // le torrent du bas de la montée (pt 2) : un ravin de 7 m qui serpente en travers de la route, sous un pont de pierre
      const sp = S[pt(h, 2)], ravin = (x, z) => { const dx = x - sp.x, dz = z - sp.z, v = dz * sp.tx - dx * sp.tz, u = dx * sp.tx + dz * sp.tz - 6 * Math.sin(v / 25);
        return Math.abs(v) > 90 || Math.abs(u) > 9 ? 0 : 7 * (1 - (u / 9) ** 2) * Math.min(1, (90 - Math.abs(v)) / 20); };
      // deux lieux, chacun du côté extérieur (le plus loin des autres routes), le sol mis au niveau de la route sous eux, jamais sur la chaussée ni à ses bords :
      // le temple au carrefour du sommet (pt 11), la supérette et la station-service dans le dernier virage, celui qui ramène à la ligne (pt 47)
      const lieu = (i, off) => { const s = S[i], loin = (x, z) => { let d = 1e18; for (let j = 0; j < N; j += 3) if (Math.abs(((j - i + N + N / 2) % N) - N / 2) > 40) d = Math.min(d, (S[j].x - x) ** 2 + (S[j].z - z) ** 2); return d; };
        const sd = loin(...bord(s, 1, 60)) > loin(...bord(s, -1, 60)) ? 1 : -1, [x, z] = bord(s, sd, W + off);
        const plat = (px, pz, y) => { const r = Math.hypot(px - x, pz - z); if (r > 55) return 0; let d = 1e18; for (let j = i - 60; j < i + 60; j++) { const q = S[(j + N) % N]; d = Math.min(d, (q.x - px) ** 2 + (q.z - pz) ** 2); }
          return (y - (s.y - 0.35)) * Math.min(1, (55 - r) / 17, Math.max(0, (Math.sqrt(d) - W - 6) / 10)); };
        // dégagé : le lieu lui-même (r0) et, côté approche (Z local > 0), jusqu'à 75 m pour qu'on le voie venir
        const degage = (px, pz, r0) => { const r = Math.hypot(px - x, pz - z); return r < r0 || (r < 75 && (px - s.x) * s.tx + (pz - s.z) * s.tz < 0); };
        // colline : derrière le lieu, le sol remonte (0,35 m par m) au lieu de plonger vers la vallée : les cèdres du fond dépassent le toit du temple. Jamais près d'une autre route
        const colline = (px, pz, y) => { const dx = px - s.x, dz = pz - s.z, X = (dz * s.tx - dx * s.tz) * sd, Z = -(dx * s.tx + dz * s.tz); if (X < W + 40 || X > W + 130 || Math.abs(Z) > 70) return 0;
          let d = 1e18; for (let j = 0; j < N; j += 3) d = Math.min(d, (S[j].x - px) ** 2 + (S[j].z - pz) ** 2);
          return (y - (s.y - 0.35 + (X - W - 40) * 0.35)) * Math.min(1, (X - W - 40) / 10, (W + 130 - X) / 20, (70 - Math.abs(Z)) / 20, Math.max(0, (Math.sqrt(d) - W - 30) / 15)); };
        return { i, s, sd, x, z, plat, degage, colline }; };
      const haut = lieu(pt(h, 11), 26), bas = lieu(pt(h, 47) + 6, 22), ic = haut.i, sc = haut.s, sd = haut.sd, cx = haut.x, cz = haut.z;
      const g = terrain(h, { pas: 7, sous: 6, marge: 320, loin: 60, chute: 1.1, creux: (x, z, y) => ravin(x, z) + haut.plat(x, z, y) + haut.colline(x, z, y) + bas.plat(x, z, y), mat: h.mat('bruit', {}, '#0c1a14', ['#12261e', '#081410', '#16302a']) });
      // ---------- la ligne à haute tension : elle part d'un poste électrique à côté du temple, franchit la route en hauteur et descend la pente vers la ville de la vallée ----------
      // Le poste (portique d'arrivée, transformateurs, local) est posé du côté du temple, au-delà de la route de traverse ; trois pylônes s'éloignent en ligne droite,
      // chacun plus bas que le précédent, puis le câble descend 700 m plus loin vers un pylône de la ville, au fond de la vallée, et se perd derrière le relief et le brouillard. Direction, portées et échelle des pylônes sont cherchées par calcul :
      // pylônes à plus de W + 15 m de toute route, hors du temple et de la supérette ; câble bas, flèche comprise (4,5 % de la portée), à plus de 9 m du sol et 13 m au-dessus d'une chaussée.
      // Les arbres sont ensuite écartés du couloir et du poste, et rabattus sous le câble.
      const CONS = [[-6.3, 26.7], [6.3, 26.7], [-6.3, 31.7], [6.3, 31.7], [-4.3, 36.7], [4.3, 36.7]], GANT = [[-6.3, 16], [6.3, 16], [-6.3, 18.5], [6.3, 18.5], [-4.3, 21], [4.3, 21]], BAS = CONS[0][1], i10 = pt(h, 10);
      const cable = (A, B, t) => { const f = 0.045 * Math.hypot(B[0] - A[0], B[2] - A[2]); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - 4 * f * t * (1 - t), A[2] + (B[2] - A[2]) * t]; }; // A, B : points d'attache
      const ligne = (() => { const n = [-sc.tz * sd, sc.tx * sd]; // n : vers l'extérieur, côté temple
        for (const [PX, PZ] of [[W + 22, -48], [W + 22, -56], [W + 30, -50], [W + 22, 48]]) { const x0 = sc.x + n[0] * PX - sc.tx * PZ, z0 = sc.z + n[1] * PX - sc.tz * PZ, P0 = [x0, g.hAt(x0, z0), z0];
          for (const k of [1, 1.25, 1.5]) for (const a of [0, 0.25, -0.25, 0.5, -0.5, 0.75, -0.75]) { const u = [-n[0] * Math.cos(a) + n[1] * Math.sin(a), -n[0] * Math.sin(a) - n[1] * Math.cos(a)];
            for (const D1 of [90, 110, 130, 150, 170]) for (const ps of [140, 160, 120]) {
              const pts = [P0]; for (let j = 0; j < 3; j++) { const d = D1 + j * ps, x = x0 + u[0] * d, z = z0 + u[1] * d; pts.push([x, g.hAt(x, z), z]); }
              if (pts.slice(1).some(([x, , z]) => g.dAt(x, z) < W + 15 || Math.hypot(x - cx, z - cz) < 45 || Math.hypot(x - bas.x, z - bas.z) < 60) || pts[3][1] > pts[1][1] - 15) continue; // la ligne descend
              const d3 = D1 + 2 * ps + 700, xa = x0 + u[0] * d3, za = z0 + u[1] * d3, ra = Math.hypot(xa - 460, za - 430); // l'ancrage : un pylône de la ville, au pied de la montagne (même altitude que le sol de ville())
              pts.push([xa, -150 + (Math.max(ra, 800) - 800) * 0.07 + Math.max(0, ra - 1800) * 0.06, za]); // le câble descend vers la vallée et se perd derrière le relief, dans le brouillard
              const hA = i => [pts[i][0], pts[i][1] + (i ? BAS * k : GANT[0][1]), pts[i][2]]; let ok = true;
              for (let q = 0; q < 4 && ok; q++) { const A = hA(q), B = hA(q + 1), m = Math.ceil(Math.hypot(B[0] - A[0], B[2] - A[2]) / 4);
                for (let j = 0; j <= m && ok; j++) { const [x, y, z] = cable(A, B, j / m); ok = y - g.hAt(x, z) > (g.dAt(x, z) < W + 4 ? 13 : 9); } }
              if (ok) return { pts, u, k, ry: Math.atan2(u[0], u[1]), hA }; } } }
        return null; })();
      const sousLigne = (x, z) => { if (!ligne) return null; let b = null; for (let q = 0; q < 4; q++) { const A = ligne.hA(q), B = ligne.hA(q + 1), ux = B[0] - A[0], uz = B[2] - A[2], l2 = ux * ux + uz * uz,
        t = Math.max(0, Math.min(1, ((x - A[0]) * ux + (z - A[2]) * uz) / l2)), d = Math.hypot(A[0] + ux * t - x, A[2] + uz * t - z); if (!b || d < b.d) b = { d, y: cable(A, B, t)[1] }; } // distance au couloir, hauteur du câble bas
        if (Math.hypot(x - ligne.pts[0][0], z - ligne.pts[0][2]) < 18) b.d = 0; return b; }; // le poste : pas d'arbre dessus
      // une route de traverse part du carrefour, barrée
      // cèdres : une rangée serrée le long de la route (le tunnel d'arbres), puis la forêt ; rien sur le temple ni sur la supérette, ni devant eux à l'approche.
      // Dans les lacets, rien côté vallée (ouest) et des cèdres plus petits côté amont, dont la cime reste sous le regard du lacet du dessus ; de jeunes plants sur la pente en contrebas : on voit la ville par-dessus
      const arbres = [], lacets = (x, z) => x > 372 && x < 552 && z > 300 && z < 576, plants = (x, z) => x > 100 && x < 552 && z > 260 && z < 640, libre0 = (x, z) => !haut.degage(x, z, 34) && !bas.degage(x, z, 60) && ravin(x, z) < 1 && !(sousLigne(x, z)?.d < 14);
      // la trouée côté vallée (droite) entre les pts 7 et 9 : aucun arbre là où cette portion est la route la plus proche, la ville et la lune apparaissent
      const i7 = pt(h, 7), i9 = pt(h, 9), trouee = (x, z) => { let b = null, bd = 1e18; for (let i = i7; i <= i9; i += 3) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; b = S[i]; } }
        return bd < 160 * 160 && Math.sqrt(bd) < g.dAt(x, z) + 4 && (z - b.z) * b.tx - (x - b.x) * b.tz > 0; }, libre = (x, z) => libre0(x, z) && !trouee(x, z);
      for (let i = 0; i < N; i += 3) for (const side of [-1, 1]) {
        const [x, z] = bord(S[i], side, W + 4.5 + rnd() * 7);
        if (g.dAt(x, z) > W + 3.5 && libre(x, z) && !(lacets(x, z) && x < S[i].x - 3)) arbres.push([x, g.hAt(x, z) + 6, z, rnd() * 6, (0.8 + rnd() * 0.7) * (plants(x, z) && x < 545 ? (lacets(x, z) ? 0.75 : 0.4) : 1)]);
      }
      for (let k = 0; k < 2600; k++) {
        const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z);
        if (d > W + 6 && d < 230 && libre(x, z) && (!lacets(x, z) || (d < 17 && g.dAt(x - 2, z) < d))) arbres.push([x, g.hAt(x, z) + 6, z, rnd() * 6, (0.9 + rnd() * 0.9) * (lacets(x, z) ? 0.75 : plants(x, z) || (x > -100 && x < 552 && z > 200 && z < 700) ? 0.4 : 1)]);
      }
      // derrière le temple et derrière la supérette, un rideau de cèdres : on ne voit plus le vide. Rien côté approche, ni sur la route de traverse du sommet (Z ≈ -22)
      for (const [P, X0, trav] of [[haut, 54, 1], [bas, 48, 0]]) for (let k = 0; k < 70; k++) { const X = W + X0 + rnd() * 45, Z = -45 + rnd() * 80, q = P.s, x = q.x - q.tz * P.sd * X - q.tx * Z, z = q.z + q.tx * P.sd * X - q.tz * Z;
        if (!(trav && Math.abs(Z + 22) < 9) && !(sousLigne(x, z)?.d < 14)) arbres.push([x, g.hAt(x, z) + 6, z, rnd() * 6, 1.1 + rnd() * 0.6]); }
      for (let k = arbres.length - 1; k >= 0; k--) { const p = arbres[k], c = sousLigne(p[0], p[2]); if (c && c.d < 3.6 * p[4] + 10 && p[1] - 6 + 18.5 * p[4] > c.y - 3) arbres.splice(k, 1); } // cime (houppier de 15 m sur fût de 11 m) à 3 m au moins sous le câble
      const fûts = arbres.map(p => { const y0 = p[1] - 6; p[1] = y0 + 11 * p[4]; return [p[0], y0 + 2.6 * p[4], p[2], 0, p[4]]; }); // le houppier monte sur un fût nu, comme un vrai cèdre du Japon
      inst(h, h.geo('cedre'), h.mat('cedre'), arbres); inst(h, h.geo('tronc'), h.mat('tronc'), fûts);
      // catadioptres orange sur les glissières : le seul balisage, comme sur une vraie route de col
      const cata = [];
      for (let i = 0; i < N; i += 6) for (const side of [-1, 1]) { const [x, z] = bord(S[i], side, W + 0.15); cata.push([x, S[i].y + 0.85, z]); }
      inst(h, h.geo('catadioptre'), h.mat('catadioptre', { lum: 1, retro: 2.5 }), cata); // éteints, ils s'allument dans le faisceau des phares

      // --- le temple du sommet : posé au bord de la route, X local en s'éloignant d'elle ; la route de traverse part à côté, barrée ---
      const bitume = h.mat('bitume'), acier = h.mat('acier'), vitre = h.mat('vitreSombre'), feuRouge = h.mat('feuRouge', LUM), feuBlanc = h.mat('lampe', LUM);
      const gr = repere(h, sc), X = v => sd * (W + v), gT = new THREE.Group(), [tx0, tz0] = bord(sc, sd, W + 1); gT.position.set(tx0, sc.y, tz0); gT.rotation.y = h.across(sc) + (sd > 0 ? 0 : Math.PI); h.scene.add(gT);
      const lanterne = h.mat('lanterne', LUM);
      h.pose('temple', { gravier: h.mat('gravier'), vermillon: h.mat('vermillon'), noir: vitre, pierre: h.mat('pierreMousse'), feu: lanterne, bois: h.mat('boisTemple', { emissive: 0x120a06 }), shoji: h.mat('shoji', LUM), eau: h.mat('eauVive', { lum: 1, c: 0x2a5058 }), crepi: h.mat('crepi'),
        chochin: h.mat('peinture', { lum: 1, c: 0xff4a28 }), corde: h.mat('laque', { c: 0xe8d8a0, emissive: 0x3a3018 }), toit: h.mat('tuileTemple', { emissive: 0x222c38 }), rive: h.mat('laque', { c: 0xd8c49a, emissive: 0x3a2e1c }) }, gT); // emissive : les toits restent lisibles sur le ciel de nuit
      h.pose('traverse', { bitume }, gr, [X(70), 0, -22]); // la route de traverse s'enfonce dans la forêt, à côté du temple
      const rayures = h.mat('rayures', LUM), cligno = h.mat('clignotant', LUM), cone = h.mat('cone', LUM); // barrée : barrières rayées, cônes, feux orange qui clignotent
      for (const dz of [-25, -22, -19]) h.pose('barriere', { rayures, clignotant: cligno }, gr, [X(43), 0, dz]);
      for (const dz of [-26.5, -23.5, -20.5, -17.5]) h.pose('cone', cone, gr, [X(41.5), 0.5, dz]);
      gT.updateMatrixWorld(); // lanternes du torii et de l'allée, façade du pavillon : lumière chaude
      for (const [lx, ly, lz, d, f] of [[4, 5, 0, 18, 1.4], [14, 2, 0, 16, 1.6], [33, 7.5, -5.4, 16, 1.8], [33, 7.5, 5.4, 16, 1.8], [36, 5, 0, 20, 1.6]]) { const p = gT.localToWorld(new THREE.Vector3(lx, ly, lz)); h.lum(ic, p.x, p.y, p.z, 0xffb060, d, f); } // les lanternes éclairent l'avant-toit
      // --- la supérette, la station-service et leur esplanade : dans le dernier virage, face à qui arrive (repère de la route, X vers l'extérieur) ---
      { const gb = repere(h, bas.s), XB = v => bas.sd * (W + v);
        h.pose('esplanade', { bitume }, gb, [XB(21), 0, 0]); h.pose('boite', h.mat('beton'), gb, [XB(21), -1.3, 0], 39.6, 1.9, 51.6); // jupe sous la dalle : près de la route le sol est plus bas
        h.pose('superette', { mur: h.mat('crepi'), porte: vitre, toit: h.mat('matGris'), clim: acier, vitrine: h.mat('vitrine', LUM), enseigne: h.mat('ecrit', LUM, 128, 12, '#1d4ac8', '#ffd84a', 'カラスマート  KARASU MART  24H', 9), distributeur: h.mat('distributeur', LUM) }, gb, [XB(34), 0, -8], bas.sd);
        h.pose('station', { acier, ilot: h.mat('beton'), lampe: h.mat('lampe', LUM), enseigne: h.mat('ecrit', LUM, 96, 8, '#c8102e', '#ffffff', 'TOGE OIL  峠石油', 7), pompe: h.mat('pompeEssence', LUM) }, gb, [XB(15), 0, 15]);
        h.pose('enseigneHaute', { acier, enseigne: h.mat('ecrit', LUM, 96, 64, '#1d4ac8', '#ffd84a', 'カラスマート 24H', 13) }, gb, [XB(3), 0, 34]); // vue de loin, avant le virage
        h.pose('totem', { acier, prix: h.mat('ecrit', LUM, 32, 32, '#101418', '#ffd84a', '168', 14) }, gb, [XB(4.5), 0, 25]);
        // voitures garées : silhouettes de sportives génériques, feux allumés, certaines tournées vers la route
        [[7, -19, 0.3, 0xf4f0e0], [7.5, -13, -0.2, 0xc8102e], [8, -7, 0.15, 0x2a5ac8], [22, -21, 1.57, 0x14161c], [22, 2, 1.4, 0xffc04a], [10, 6, -0.4, 0x9aa0a8], [16, 26, 1.57, 0x1f8f5a]].forEach(([vx, vz, a, col]) => {
          const v = new THREE.Group(); v.position.set(XB(vx), 0, vz); v.rotation.y = a; gb.add(v);
          h.pose('voitureGaree', { caisse: h.mat('laque', { c: col }), vitre, feuRouge, feuBlanc, chassis: h.mat('matGris'), roue: h.mat('roue'), pneu: h.mat('pneu') }, v); });
        gb.updateMatrixWorld(); // la vitrine et l'auvent éclairent l'esplanade, la route et les voitures qui passent
        for (const [lx, lz, col, d] of [[27, -8, 0xdfefff, 46], [15, 15, 0xffe0a0, 34], [3, 0, 0xdfefff, 22]]) { const p = gb.localToWorld(new THREE.Vector3(XB(lx), 4.5, lz)); h.lum(bas.i, p.x, p.y, p.z, col, d, 3); } }
      // les chevrons des deux virages (posés par game.js avant le décor) cachaient le temple et la supérette : retirés devant eux
      for (const o of h.scene.children) if (o.isInstancedMesh && o.geometry.parameters && ((o.geometry.parameters.width === 5 && o.geometry.parameters.height === 2.5) || (o.geometry.parameters.width === 0.14 && o.geometry.parameters.height === 5.4))) { // chevrons (forme chevron, 5 × 2,5 m) et leurs poteaux
        const M4 = new THREE.Matrix4(), v = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
        for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, M4); v.setFromMatrixPosition(M4); if ([haut, bas].some(P => (v.x - P.x) ** 2 + (v.z - P.z) ** 2 < 62 * 62)) o.setMatrixAt(k, zero); }
        o.instanceMatrix.needsUpdate = true; }

      // les cases fondues ne sont dessinées qu'à moins de 180 m d'une caméra (le sol, toujours dessiné, relève la position de chaque vue à chaque image)
      const proches = [], vues = [], sol0 = g.mesh; sol0.onBeforeRender = (r, sc, cam) => vues.push(cam.position.clone());
      const n0 = h.scene.children.length; // tout ce qui suit, sauf les instances, est fondu par matière à la fin (passes de dessin)
      // ---------- la montée (pts 1 à 12) : un repère par portion, pour qu'elle ne soit plus seulement de grandes courbes dans les cèdres ----------
      const ext = i => g.dAt(...bord(S[i], 1, 30)) > g.dAt(...bord(S[i], -1, 30)) ? 1 : -1; // le côté qui s'éloigne des autres routes
      // un groupe posé au sol à côté de la route, X local = en s'éloignant d'elle ; jamais plus de `bas` m sous la chaussée (les socles descendent dans la pente)
      const site = (i, cote, off, bas = 9) => { const s = S[i], [x, z] = bord(s, cote, off), p = new THREE.Group(); p.position.set(x, Math.max(g.hAt(x, z), s.y - bas), z); p.rotation.y = h.across(s) + (cote > 0 ? 0 : Math.PI); h.scene.add(p); return p; };
      const at = (i0, i1, f) => Math.round(i0 + (i1 - i0) * f), allume = (p, i, lx, ly, col, d, f) => { p.updateMatrixWorld(); const q = p.localToWorld(new THREE.Vector3(lx, ly, 0)); h.lum(i, q.x, q.y, q.z, col, d, f); };
      const pierre = h.mat('pierreMousse'), gris = h.mat('matGris'), roue = h.mat('roue'), blanc = h.mat('laque', { c: 0xe8ecf0 }), pneu = h.mat('pneu'), feuDoux = h.mat('lanterne', LUM), beton = h.mat('beton'), bois = h.mat('tronc'), [i1, i3, i4, i5] = [1, 3, 4, 5].map(k => pt(h, k));
      // pts 1-3 : pont de pierre sur le torrent, brume basse qui monte du ravin et traîne sur la route, panneau « 13 % »
      h.pose('pontPierre', { pierre }, repere(h, sp), [0, 0, 0], W);
      const eau = h.mat('eauVive', { lum: 1, c: 0x2a5058 }), flots = [], nappes = [], brumeG = new THREE.PlaneGeometry(1, 1); brumeG.rotateX(-Math.PI / 2);
      const lit = v => { const u = 6 * Math.sin(v / 25); return [sp.x - sp.tz * v + sp.tx * u, sp.z + sp.tx * v + sp.tz * u]; }; // le fond du ravin, comme ravin()
      for (let v = -86; v <= 86; v += 8) { const [x, z] = lit(v); flots.push([x, g.hAt(x, z) + 0.6, z, h.across(sp)]); } // le torrent descend en marches : des cascades
      (inst(h, h.geo('boite', 8.6, 0.3, 3.5), eau, flots));
      for (let k = 0; k < 14; k++) { const [x, z] = lit((rnd() - 0.5) * 150); nappes.push([x, g.hAt(x, z) + 2 + rnd() * 3, z, rnd() * 6, 26 + rnd() * 20, 1, 18 + rnd() * 10]); }
      for (let i = i1; i < i3; i += 12) for (const c of [-1, 1]) { const [x, z] = bord(S[i], c, W + 20 + rnd() * 10); nappes.push([x, S[i].y - 0.8 + rnd(), z, rnd() * 6, 16 + rnd() * 8, 1, 16 + rnd() * 8]); } // à 20 m et plus du bord : elles ne couvrent jamais la chaussée
      // additive : les plans de brume en mélange normal recevaient les phares (eclaire, game.js) et éblouissaient sur toute la route
      const brume = inst(h, brumeG, h.mat('brume', { lum: 1, c: 0x3a4a50, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }), nappes); brume.castShadow = brume.receiveShadow = false; (brume);
      const retro = { lum: 1, retro: 1.2 }; // les panneaux s'allument dans les phares, comme les catadioptres
      h.pose('panneauPente', { poteau: acier, plaque: h.mat('losange', { ...retro, alphaTest: 0.5 }, '13%'), sous: h.mat('ecrit', retro, 48, 20, '#f4f4f0', '#101010', '上り急勾配', 10) }, repere(h, S[i1 + 12]), [W + 1.5, 0, 0]);
      // pts 3-5 : sanctuaire dans la pente (torii vermillon, escalier de pierre, tōrō allumés, oratoire), et des cerfs sika au bord de la route
      { const i = at(i3, i4, 0.8), p = site(i, -ext(i), W + 4.5);
        h.pose('sanctuaire', { vermillon: h.mat('vermillon'), noir: vitre, marche: pierre, feu: feuDoux, bois, toit: gris }, p);
        allume(p, i, 2.5, 1.9, 0xffb050, 14, 1.6); allume(p, i, 9, 4.6, 0xffb050, 10, 1.2); }
      const peauCerf = { poil: h.mat('pelage'), croupe: pierre, bois, yeux: h.mat('peinture', { lum: 1, retro: 4, c: 0xc8ffb0 }) }; // les yeux : même technique que les catadioptres
      (insts(h, 'cerf', peauCerf, [[0.15, 1, 3.4, 1], [0.2, 1, 6.5, 0.8], [0.62, -1, 3.2, 1.05], [0.7, -1, 7, 0.85], [0.74, -1, 5, 0.9]].map(([f, c, off, t]) => { // tournés vers la route et la voiture qui arrive
        const p = site(at(i3, i5, f), c, W + off); h.scene.remove(p); return [p.position.x, p.position.y, p.position.z, p.rotation.y - c * 2.36 + (rnd() - 0.5) * 0.6, t]; })));
      // pts 5-7 : l'intérieur de l'épingle reste ouvert (mur et filet retirés : ils bouchaient la vue) ; dehors, un distributeur de boissons allumé, seul
      { const i = at(i5, i7, 0.55), p = site(i, -1, W + 3.2, 0.4); p.rotation.y += (rnd() - 0.5) * 0.3;
        h.pose('distribIsole', { socle: beton, caisse: blanc, face: h.mat('distributeur', LUM), bac: blanc }, p); allume(p, i, -1.2, 1.6, 0xe8f4ff, 11, 2.2); }
      // pts 7-9 : la trouée côté vallée (les arbres y sont retirés plus haut), annoncée par un panneau de point de vue
      h.pose('panneauVue', { poteau: acier, plaque: h.mat('ecrit', retro, 64, 24, '#5a3420', '#f4f0e0', '展望  VIEW', 14) }, repere(h, S[i7 + 6]), [W + 1.6, 0, 0]);
      // pts 9-10 : trois voitures garées face à la vue, feux allumés, et leurs pilotes debout devant
      { const i = at(i9, i10, 0.35), q = repere(h, S[i]), V = (x, z) => q.localToWorld(new THREE.Vector3(x, 0, z));
        h.pose('boite', bitume, q, [W + 6, -0.35, 0], 10, 0.6, 34);
        [[-11, 0.25, 0xd8d8d0], [-2, -0.1, 0x14161c], [8, 0.2, 0xc8102e]].forEach(([vz, a, col]) => { const v = new THREE.Group(); v.position.set(W + 5, 0, vz); v.rotation.y = a; q.add(v);
          h.pose('voitureGaree', { caisse: h.mat('laque', { c: col }), vitre, feuRouge, feuBlanc, chassis: gris, roue, pneu }, v); });
        q.updateMatrixWorld();
        (insts(h, 'passant', { ombre: vitre }, [[W + 8.6, -7, 1], [W + 8.9, -6.2, 0.92], [W + 9, 3, 1.04], [W + 3, 4.5, 0.98]].map(([px, pz, t]) => { const p = V(px, pz); return [p.x, p.y, p.z, q.rotation.y, t]; })));
        allume(q, i, W + 11, 1, 0xfff0d0, 16, 2); }
      const feuPylone = h.mat('feuRouge', LUM);
      // le retour (pts 41-48) : des jizō à bavoir rouge et leur bougie, puis une cabine téléphonique allumée
      { const i = pt(h, 43), p = site(i, ext(i), W + 2.6, 0.4); h.pose('jizos', { socle: beton, pierre, bavoir: h.mat('laque', { c: 0xc8102e }), bois, toit: gris, feu: feuDoux }, p); allume(p, i, -0.6, 0.4, 0xffa040, 6, 1.2); }
      { const i = pt(h, 46), p = site(i, ext(i), W + 2.8, 0.4); h.pose('cabine', { socle: beton, verre: h.mat('vitrine', { lum: 1, c: 0xd8ffe0 }), cadre: blanc }, p); allume(p, i, 0, 2, 0xe0ffe8, 12, 2); }

      { // fusion : tout ce qui précède (objets posés un à un, et les petits groupes d'instances, dépliés) en une géométrie par matière et par case de 150 m :
        // une passe de dessin par matière et par case dans le champ, au lieu d'une par pièce ou d'un groupe d'instances dessiné partout (three r128 ne les écarte pas)
        const par = new Map(), M4 = new THREE.Matrix4(), v = new THREE.Vector3(); h.scene.updateMatrixWorld();
        const met = (m, mw) => { const ge = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); ge.applyMatrix4(mw); v.setFromMatrixPosition(mw);
          const k = m.material.uuid + (Math.floor(v.x / 150) * 1000 + Math.floor(v.z / 150)); if (!par.has(k)) par.set(k, [m.material]); par.get(k).push(ge); };
        for (const o of h.scene.children.slice(n0)) { h.scene.remove(o);
          o.traverse(m => { if (!m.isMesh) return; if (!m.isInstancedMesh) return met(m, m.matrixWorld); for (let k = 0; k < m.count; k++) { m.getMatrixAt(k, M4); met(m, M4.premultiply(m.matrixWorld)); } }); }
        for (const [mt, ...l] of par.values()) { const ge = new THREE.BufferGeometry();
          for (const [k, sz] of [['position', 3], ['normal', 3], ['uv', 2]]) { const A = new Float32Array(l.reduce((n, e) => n + e.attributes.position.count, 0) * sz); let o = 0; for (const e of l) { A.set(e.attributes[k].array, o); o += e.attributes.position.count * sz; } ge.setAttribute(k, new THREE.BufferAttribute(A, sz)); }
          const m = new THREE.Mesh(ge, mt); ge.computeBoundingSphere(); proches.push(m); h.scene.add(m); } }
      if (ligne) { // le poste, les pylônes (consoles perpendiculaires à la ligne), six conducteurs par portée : du portique du poste jusqu'à l'ancrage
        const o = new THREE.Object3D(), fils = [], at6 = (P, i) => { o.position.set(...P); o.rotation.y = ligne.ry; o.scale.setScalar(i ? ligne.k : 1); o.updateMatrixWorld(); return (i ? CONS : GANT).map(([lx, ly]) => o.localToWorld(new THREE.Vector3(lx, ly, 0)).toArray()); };
        const gp = new THREE.Group(); gp.position.set(...ligne.pts[0]); gp.rotation.y = ligne.ry; h.scene.add(gp);
        h.pose('poste', { dalle: h.mat('gravier'), beton: h.mat('beton'), acier: h.mat('matGris'), isolant: h.mat('laque', { c: 0xd8dce0 }), lampe: h.mat('lampe', LUM) }, gp);
        gp.updateMatrixWorld(); for (const [lx, lz] of [[-6, -16], [6, -2]]) { const p = gp.localToWorld(new THREE.Vector3(lx, 6, lz)); h.lum(ic, p.x, p.y, p.z, 0xdfe8ff, 24, 2.2); } // les lampadaires du poste : il se lit de nuit
        insts(h, 'pyloneHT', { acier: h.mat('matGris'), feu: feuPylone }, ligne.pts.slice(1, 4).map(([x, y, z]) => [x, y, z, ligne.ry, ligne.k]));
        const att = ligne.pts.map(at6); for (let q = 0; q < 4; q++) for (let c = 0; c < 6; c++) for (let j = 0; j < 16; j++) fils.push(...cable(att[q][c], att[q + 1][c], j / 16), ...cable(att[q][c], att[q + 1][c], (j + 1) / 16));
        const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fils, 3)); const lg = new THREE.LineSegments(fg, new THREE.LineBasicMaterial({ color: 0x23272c })); lg.userData.cables = 1; h.scene.add(lg); }
      const rouge = ville(h, g); // la mégapole en contrebas, à l'ouest des lacets
      return (dt, now) => { cligno.color.setHex((now / 450 & 1) ? 0xff8c1a : 0x3a2008); const r = now % 1500 < 700 ? 0xff2018 : 0x300404; rouge.color.setHex(r); feuPylone.color.setHex(r); eau.map.offset.x += dt * 0.3;
        if (vues.length) { for (const m of proches) { const b = m.geometry.boundingSphere, d = 180 + b.radius; m.visible = vues.some(p => p.distanceToSquared(b.center) < d * d); } vues.length = 0; } };
    },
  });
})();
