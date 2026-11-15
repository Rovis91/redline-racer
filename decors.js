// Placement des décors des cartes. Chaque décor est une fonction DECORS[id](h) appelée une fois au chargement.
// Ce fichier ne dit que OÙ poser QUOI avec QUELLE texture : les formes sont dans formes.js, les textures dans textures.js.
// h = outils de game.js : THREE, scene, T/S/N/W (piste), M (carte), ribbon, rnd, across, zone, temps (horloge du trafic), et pour la ville tx, addMat, box, concrete, beams (faisceaux que game.js tourne vers la caméra),
//   geo('forme', ...réglages)                  = géométrie d'une forme simple, pour inst()
//   mat('texture', options, ...réglages)       = matière ; options : lum (lumineuse par elle-même), c (teinte), retro, gloss, rep (répétition), et celles de three
//   pose('forme', peau, parent, [x, y, z], ...réglages) = pose une forme ; peau = une matière, ou { zone: matière } pour un assemblage
//   habille(géométrie, matière)                = règle la densité de la texture sur une boîte (fait par pose et inst)
//   lum(i, x, y, z, couleur, portée, force)    = déclare un luminaire à l'échantillon de piste i
// Elle construit le décor autour du tracé et peut renvoyer une fonction tick(dt, now) pour ce qui bouge.
(function () {
  // Pose une liste d'objets identiques en une seule passe de dessin. Élément : [x, y, z, rotationY, échelleX, échelleY, échelleZ].
  function inst(h, geo, mat, list) {
    const m = new h.THREE.InstancedMesh(h.habille(geo, mat), mat, Math.max(1, list.length)), d = new h.THREE.Object3D();
    list.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.rotation.set(0, p[3] || 0, 0); d.scale.set(p[4] || 1, p[5] || p[4] || 1, p[6] || p[4] || 1); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
    m.count = list.length; m.frustumCulled = false; m.castShadow = m.receiveShadow = h.TH.sun[1] > 0.6; h.scene.add(m); return m; // soleil rasant (Paris, canal) : tout le décor porte une ombre ; de nuit ce serait du temps de rendu pour rien
  }
  const near = (h, x, z) => { let b = 0, bd = 1e18; h.S.forEach((s, i) => { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = i; } }); return b; };
  const pt = (h, i) => near(h, h.M.pts[i][0] * h.M.sc, h.M.pts[i][1] * h.M.sc); // échantillon de piste le plus proche du point de contrôle i
  const indexe = (h, g) => { const A = Object.entries(g.attributes), vu = new Map(), garde = [], idx = []; for (let i = 0; i < g.attributes.position.count; i++) { const k = A.map(([, a]) => Array.from(a.array.subarray(i * a.itemSize, (i + 1) * a.itemSize))).join(); let j = vu.get(k); if (j === undefined) { vu.set(k, j = garde.length); garde.push(i); } idx.push(j); } const G = new h.THREE.BufferGeometry(); for (const [n, a] of A) G.setAttribute(n, new h.THREE.Float32BufferAttribute(garde.flatMap(i => Array.from(a.array.subarray(i * a.itemSize, (i + 1) * a.itemSize))), a.itemSize)); G.setIndex(idx); G.userData = g.userData; return G; }; // les zones d'un assemblage arrivent non indexées (36 sommets par boîte) : mêmes triangles, sommets identiques partagés (24 par boîte)
  // pose un assemblage en nombre : une passe de dessin par zone, quel que soit le nombre d'exemplaires. Élément comme pour inst ; o.a = réglages de la forme ; o.teinte = la zone qui prend la couleur de chaque élément (8e valeur : 0xrrggbb)
  const insts = (h, nom, peau, list, o = {}) => Object.entries(h.zones(nom, peau, ...(o.a || []))).map(([zn, g]) => {
    const m = inst(h, indexe(h, g), peau[zn], list); if (zn === o.teinte && list.length) { list.forEach((p, i) => m.setColorAt(i, new h.THREE.Color(p[7]))); m.instanceColor.needsUpdate = true; } return m;
  });
  const LUM = { lum: 1 }; // matière lumineuse par elle-même : vitrine, enseigne, feu
  const boite = (h, m, w, ht, d, x, y, z) => h.pose('boite', m, h.scene, [x, y, z], w, ht, d); // pièce unique aux dimensions libres
  // un point au bord de la route : échantillon s, côté sd (-1 gauche, 1 droite), à `off` mètres de l'axe
  const bord = (s, sd, off) => [s.x - s.tz * sd * off, s.z + s.tx * sd * off];
  // un groupe posé sur la route à l'échantillon s : X local = en travers (positif à droite), Z local = vers l'arrière
  const repere = (h, s) => { const g = new h.THREE.Group(); g.position.set(s.x, s.y, s.z); g.rotation.y = h.across(s); h.scene.add(g); return g; };
  const soude = (h, grp, fam) => { const T = h.THREE, lots = new Map(); grp.updateMatrixWorld(true); const inv = new T.Matrix4().copy(grp.matrixWorld).invert(); grp.traverse(o => { if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) return; const f = fam && fam.test(o.material), k = [f ? 'fam' : o.material.uuid, o.castShadow, o.receiveShadow, Object.keys(o.geometry.attributes).sort()].join(); (lots.get(k) || lots.set(k, []).get(k)).push(o); }); for (const l of lots.values()) { if (l.length < 2) continue; const tf = fam && fam.test(l[0].material), gs = l.map(o => { const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); if (tf) { const c = o.material.color, n = g.attributes.position.count, A = new Float32Array(n * 3); for (let i = 0; i < n; i++) A.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new T.BufferAttribute(A, 3)); } g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld)); if (o.matrixWorld.determinant() < 0) for (const a of Object.values(g.attributes)) for (let j = 0; j < a.count; j += 3) for (let c = 0; c < a.itemSize; c++) { const i0 = j * a.itemSize + c, i1 = i0 + a.itemSize, t = a.array[i0]; a.array[i0] = a.array[i1]; a.array[i1] = t; } return g; }), G = new T.BufferGeometry(); for (const n in gs[0].attributes) { const A = new Float32Array(gs.reduce((s, g) => s + g.attributes[n].array.length, 0)); let b = 0; for (const g of gs) { A.set(g.attributes[n].array, b); b += g.attributes[n].array.length; } G.setAttribute(n, new T.BufferAttribute(A, gs[0].attributes[n].itemSize)); } const m = new T.Mesh(G, tf ? fam.mat || (fam.mat = Object.assign(l[0].material.clone(), { vertexColors: true })).color.setRGB(1, 1, 1) && fam.mat : l[0].material); m.castShadow = l[0].castShadow; m.receiveShadow = l[0].receiveShadow; grp.add(m); for (const o of l) o.parent.remove(o); } }; // fond les pièces d'un groupe mobile (dyn) en une géométrie par matière, dans son repère : une passe par matière au lieu d'une par pièce (la fusion de game.js ne prend que l'immobile)

  // Terrain : un champ de hauteur qui passe par la route. Chaque sommet prend l'altitude des portions de route voisines (moyenne pondérée par
  // la distance) : la route se retrouve posée sur une pente, les lacets empilés deviennent des terrasses, un canal se creuse entre deux voies.
  // o = { pas, marge, mat, loin, chute (au-delà de `loin` mètres de la route, le sol descend de `chute` m par mètre), creux(x, z, y) = m à retirer au sol (y = sa hauteur calculée),
  //       sol(s) = altitude du sol sous l'échantillon s quand la route n'est pas posée dessus (viaduc, pont),
  //       sous = pente (touge seul) : plafonne chaque sommet sous toute la route proche, puis remonte de `sous` m par mètre ; les triangles ne passent plus sur une chaussée en contrebas (lacets) }
  // Renvoie hAt(x, z) = altitude du sol et dAt(x, z) = distance à la route, pour y poser le décor.
  function terrain(h, o) {
    const { THREE, S, W } = h, pas = o.pas, sol = o.sol || (s => s.y);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const s of S) { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z); }
    x0 -= o.marge; z0 -= o.marge; x1 += o.marge; z1 += o.marge;
    const nx = Math.ceil((x1 - x0) / pas) + 1, nz = Math.ceil((z1 - z0) / pas) + 1, Y = new Float32Array(nx * nz), D = new Float32Array(nx * nz), sub = S.filter((s, i) => i % 3 === 0).map(s => ({ x: s.x, z: s.z, w: s.w || W, g: sol(s), pose: sol(s) > s.y - 0.5 }));
    const R = pas * 1.42 + W + 1, RC = R + 48, cases = new Map(); // R : distance max entre un sommet d'un triangle qui touche la chaussée et l'échantillon de route de ce point
    if (o.sous) for (const s of S) { const c = Math.floor(s.x / RC) * 1e4 + Math.floor(s.z / RC); if (!cases.has(c)) cases.set(c, []); cases.get(c).push(s); } // la route rangée par cases de RC mètres
    const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), idx = [];
    for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
      const x = x0 + ix * pas, z = z0 + iz * pas, k = iz * nx + ix; let sw = 0, sy = 0, dm = 1e18, pm = null;
      for (const s of sub) { const d2 = (s.x - x) ** 2 + (s.z - z) ** 2, w = 1 / ((d2 + 100) * (d2 + 100)); sw += w; sy += w * s.g; if (d2 < dm) { dm = d2; pm = s; } }
      const d = Math.sqrt(dm); let y = sy / sw - 0.5;
      if (d < pm.w + 1 && pm.pose) y -= 1.5; // sous la chaussée : on creuse, la route et ses murets cachent le raccord
      if (o.loin && d > o.loin) y -= (d - o.loin) * o.chute;
      if (o.sous && d < R) y = Math.max(y, pm.g - 1.7); // assez haut pour que le pied des murets ne flotte pas
      if (o.sous && d < RC) for (let cz = -1; cz <= 1; cz++) for (let cx = -1; cx <= 1; cx++) for (const s of cases.get((Math.floor(x / RC) + cx) * 1e4 + Math.floor(z / RC) + cz) || []) {
        const e = Math.hypot(s.x - x, s.z - z); if (e < RC) y = Math.min(y, s.y - 0.3 + Math.max(0, e - R) * o.sous); // au-delà de RC la remontée dépasse tout dénivelé de la carte
      }
      if (o.creux) y -= o.creux(x, z, y); // après le plafond des lacets : un ravin (touge) peut passer sous la chaussée
      Y[k] = y; D[k] = d; pos.set([x, y, z], k * 3); uv.set(o.sous ? [(x + y) / 10, (z + y) / 10] : [x / 10, z / 10], k * 2); // touge : la texture suit aussi la hauteur, sans s'étirer sur les parois raides
      if (ix < nx - 1 && iz < nz - 1) idx.push(k, k + nx, k + 1, k + 1, k + nx, k + nx + 1);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // couches (o.couches, sinon th.couches ; docs/MOTEUR-OPTIONS-CARTES.md) : jusqu'à 4 textures par-dessus o.mat, chacune avec son poids par sommet (pente, distance à la route, altitude) ; même passe de dessin
    const couches = o.couches || h.TH.couches; let mt = o.mat;
    if (couches && mt.map) {
      const N = g.attributes.normal.array, C = new Float32Array(nx * nz * 4), ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      for (let k = 0; k < nx * nz; k++) {
        const p = 1 - N[k * 3 + 1], d = D[k], y = Y[k], x = pos[k * 3], z = pos[k * 3 + 2], hs = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453 % 1; // p : 0 à plat, 1 à la verticale
        couches.slice(0, 4).forEach((c, i) => { C[k * 4 + i] = Math.max(0, Math.min(1, (c.pente ? ss(c.pente[0], c.pente[1], p) : 1) * (c.bord ? 1 - ss(c.bord[0], c.bord[1], d) : 1) * (c.haut ? ss(c.haut[0], c.haut[1], y) : 1) * (c.bas ? 1 - ss(c.bas[0], c.bas[1], y) : 1) * (c.poids ? c.poids(x, z, y, p, d) : 1) + (c.bruit || 0) * hs)); });
      }
      g.setAttribute('couche', new THREE.BufferAttribute(C, 4)); mt = mt.clone(); mt.userData.couches = couches.slice(0, 4).map(c => ({ map: c.map || h.tx(...c.tex), rep: c.rep || 1 }));
    }
    const mesh = new THREE.Mesh(g, mt); mesh.receiveShadow = true; h.scene.add(mesh);
    const lire = A => (x, z) => { // interpolation bilinéaire dans la grille
      const fx = Math.max(0, Math.min(nx - 1.001, (x - x0) / pas)), fz = Math.max(0, Math.min(nz - 1.001, (z - z0) / pas)), ix = fx | 0, iz = fz | 0, a = fx - ix, b = fz - iz, k = iz * nx + ix;
      return (A[k] * (1 - a) + A[k + 1] * a) * (1 - b) + (A[k + nx] * (1 - a) + A[k + nx + 1] * a) * b;
    };
    return { hAt: lire(Y), dAt: lire(D), box: [x0, z0, x1, z1], mesh };
  }

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

  window.DECORS = {
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
      const A1 = Math.atan2(15, 26), go = h.geo('boite', 14, 0.6, 30); go.rotateX(-A1); go.translate(0, 12.7, 15);
      const fo = net(h.mat('foule', {}, '#4a4458', '#f4f0e0')); fo.map.offset.y = 0.5;
      const ola = inst(h, go, fo, grad), ag = grad.map(p => Math.atan2(p[2] - cz, p[0] - cx)), o4 = new THREE.Object3D(), BAS = new THREE.Vector3(0, -1, 0), vise = new THREE.Vector3();
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
          const ac = Math.atan2(car.z - cz, car.x - cx);
          grad.forEach((p, k) => { const e = Math.max(0, 1 - Math.abs(wrap(ag[k] - ac + 0.12)) / 0.22); o4.position.set(p[0], p[1] + (e ? e * 1.6 - 1 : -60), p[2]); o4.rotation.set(0, p[3], 0); o4.scale.set(p[4], 1, 1); o4.updateMatrix(); ola.setMatrixAt(k, o4.matrix); });
          ola.instanceMatrix.needsUpdate = true;
        }
        if (tE < 4) { tE += dt; for (let k = 0; k < NE * 3; k++) { if (k % 3 === 1) ve[k] -= 9.81 * dt; pe[k] += ve[k] * dt; } ge.attributes.position.needsUpdate = true; me.opacity = Math.max(0, 1 - tE / 4); }
        etin.visible = tE < 4;
        // dernier tour : la salle s'éteint, les quatre poursuites viennent se braquer sur la voiture ; arrivée : confettis
        // shortcut: dernier tour = car.lap === 3 (session.js : toute course contre l'IA fait 3 tours) ; à revoir si le nombre de tours devient réglable
        const der = !!(car && car.lap === 3), arrive = der && car.dist >= 3 * N;
        eteint += ((der && !arrive ? 1 : 0) - eteint) * Math.min(1, dt * 1.5);
        toit.color.setScalar(1 - 0.8 * eteint); lampe.color.setScalar(1 - 0.85 * eteint); mc.color.setScalar(1 + 2 * eteint);
        // la foule bouge : chaque anneau passe par moments à sa variante bras levés
        foule.map.offset.y = Math.sin(now * 0.0023) + Math.sin(now * 0.0061) > 0.6 ? 0.5 : 0;
        foule2.map.offset.y = Math.sin(now * 0.0019 + 2) + Math.sin(now * 0.0047) > 0.5 ? 0.5 : 0;
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
    // ---------- Nuit Blanche : un col fermé pour l'hiver, à l'aube. Pentes de neige, sapins chargés, falaise givrée, pont sur la gorge, refuge éclairé au col ; la glace vive se voit sur la route ----------
    givre(h) {
      const { THREE, S, N, W, T, rnd } = h, neige = h.mat('neigeVierge'), beton = h.mat('beton');
      const ecart = (x, z, d) => d - S[near(h, x, z)].w + W; // distance à l'axe ramenée à une route de demi-largeur W (la route s'élargit au hameau, sur le champ de neige et au col : M.large)
      // la gorge : une entaille que la route franchit par un pont, entre les points 22 et 23 ; elle s'ouvre vers l'aval
      const xG = (S[pt(h, 22)].x + S[pt(h, 23)].x) / 2, gorge = (x, z) => 30 * Math.max(0, 1 - ((x - xG) / 50) ** 2) * Math.min(1, Math.max(0, (z - 330) / 70));
      const g = terrain(h, { pas: 8, marge: 420, loin: 80, chute: -0.25, creux: gorge, mat: neige });
      // bord dessiné = mur réel : le jeu dessine chaussée et glissière à ±W constant (cartes sans relief), alors que les murs sont à la demi-largeur variable s.w (M.large :
      // lac, hameau, champ de neige, col). th.murH = 0 enterre sa glissière ; ce décor repose la chaussée et la glissière à ±s.w, mêmes matières et mêmes coordonnées de texture
      // (un seul ruban depuis T.t1, comme celui du jeu : les tirets ne sautent pas), la chaussée un peu au-dessus de celle du jeu, la glace encore au-dessus
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('chaussee', { side: THREE.DoubleSide, gloss: 0.08, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.route), 32);
      const glis = h.mat('glissiere', { side: THREE.DoubleSide }, h.TH.mur); for (const sd of [-1, 1]) h.ribbon(T.t1, N, s => sd * s.w, 1.4, s => sd * s.w, -2, glis);
      const iG = S.findIndex(s => gorge(s.x, s.z) > 1), nG = S.filter(s => gorge(s.x, s.z) > 1).length;
      h.ribbon(iG, nG, s => -s.w, -2, s => s.w, -2, beton, 8); // le tablier (ses flancs sont les murets de la route), sur deux piles
      inst(h, h.geo('pileViaduc'), beton, [1, 2].map(k => { const s = S[iG + Math.round(nG * k / 3)], y0 = g.hAt(s.x, s.z) - 2; return [s.x, (s.y - 2 + y0) / 2, s.z, h.across(s), 1, s.y - 2 - y0, 0.5]; }));
      // la glace : partout où la route en est (T.surf, la table de la physique), une plaque sombre et luisante posée sur la neige tassée, les deux bouts en langues.
      // Seuil 0,33 (la neige est à 0,3) : le lac gelé, moins glissant que la glace vive pour que la glisse y paie (force 0,2 dans cartes.js), se voit aussi
      const opt = { alphaTest: 0.1, gloss: 0.25, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, vive = i => T.surf[(i + N) % N].vir > 0.33, plaques = [];
      const grp = (x, y, z, ry, k = 1) => { const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(k); h.scene.add(o); return o; }; // un objet posé et tourné (X local = rotation ry)
      const plaque = h.mat('glaceVive', opt, 0), debut = h.mat('glaceVive', opt, 1), fin = h.mat('glaceVive', { ...opt, rep: [1, -1] }, 1), B = 5; // B échantillons (10 m) par bout
      for (let i = 0; i < N; i++) if (vive(i) && !vive(i - 1)) { let n = 1; while (vive(i + n)) n++;
        const pose = (i0, cnt, m, v) => h.ribbon((i0 + N) % N, cnt, s => -s.w + 0.3, 0.03, s => s.w - 0.3, 0.03, m, v);
        pose(i, B, debut, 2 * B); pose(i + B, n - 2 * B, plaque, 32); pose(i + n - B, B, fin, 2 * B); plaques.push(i); }
      // chaque plaque s'annonce à 150 m (75 échantillons) puis à 40 m (20, rappel à la sortie des lacets, où le premier est caché par le virage) : un panneau VERGLAS de chaque côté, feu bleu allumé ; une lueur froide au-dessus de son entrée fait luire la glace de loin
      // (les plaques à la sortie des lacets, 13-14 et 18-19, ne se voyaient qu'une fois dessus) ; sur la plaque, les bagues des jalons passent au bleu (plus bas)
      const peauV = { poteau: h.mat('acier'), plaque: h.mat('ecrit', { lum: 1 }, 128, 48, '#f4f8ff', '#c81e1e', '▲ VERGLAS', 24), feu: h.mat('peinture', { lum: 1, c: 0x40a0ff }) };
      insts(h, 'panneauVerglas', peauV, plaques.flatMap(i => [75, 20].map(d => S[(i - d + N) % N])).flatMap(s => [-1, 1].map(sd => { const [x, z] = bord(s, sd, s.w + 1.8); return [x, s.y, z, Math.atan2(s.tz, -s.tx)]; })));
      for (const i of plaques) { const e = S[(i + 8) % N]; h.lum((i + 8) % N, e.x, e.y + 7, e.z, 0x9fd0ff, 32, 0.9); }
      const iN = (pt(h, 23) + 20) % N; // le dégagement du chasse-neige, dans la descente nue
      // congères : la neige repoussée par le chasse-neige fait un mur clair de chaque côté, plus haut que la glissière (le bord de la route se lit de loin) ; rien sur le pont
      h.ribbon((iG + nG) % N, N - nG, s => -(s.w + 3.5), 2.4, s => -(s.w + 0.1), 1.2, neige, 10); { const a0 = (iG + nG) % N, l1 = (iN - 12 - a0 + N) % N; for (const [i0, l] of [[a0, l1], [iN + 12, N - nG - l1 - 24]]) h.ribbon(i0 % N, l, s => s.w + 0.1, 1.2, s => s.w + 3.5, 2.4, neige, 10); } // à droite, ouverte devant le chasse-neige garé
      // la falaise du départ, côté montagne : elle garde la route à l'ombre du point 2 au point 3 ; une marche de roche givrée, la neige reprend au-dessus
      { const i0 = pt(h, 2), n = (pt(h, 3) - i0 + N) % N, m = S[(i0 + (n >> 1)) % N], ht = s => 3 + 17 * Math.max(0, 1 - (Math.hypot(s.x - m.x, s.z - m.z) / (n + 30)) ** 2);
        h.ribbon((i0 - 20 + N) % N, n + 40, s => s.w + 3, -1, s => s.w + 8, ht, h.mat('rocGivre', { side: THREE.DoubleSide }), 16); h.ribbon((i0 - 20 + N) % N, n + 40, s => s.w + 8, ht, s => s.w + 60, s => ht(s) + 10, neige, 10);
        // la coulée de poudreuse : une langue de neige descendue de la corniche, plaquée sur la roche (t = part de la pente du pied au sommet, 0,25 m devant elle), plus haute au milieu,
        // et son cône d'avalanche au pied, des tas de neige qui débordent sur la congère sans mordre la route
        const c0 = (i0 + (n >> 1) - 14 + N) % N, face = (s, t) => s.w + 3 + 5 * t - 0.25, fy = (s, t) => -1 + (ht(s) + 1) * t + 0.1, cloche = s => { const k = ((S.indexOf(s) - c0 + N) % N - 14) / 14; return 0.2 + 0.78 * Math.max(0, 1 - k * k); };
        h.ribbon(c0, 28, s => face(s, 0.2), s => fy(s, 0.2), s => face(s, cloche(s)), s => fy(s, cloche(s)), h.mat('neigeVierge', { side: THREE.DoubleSide, c: 0xffffff }), 12);
        inst(h, h.geo('pic'), neige, Array.from({ length: 8 }, (_, k) => { const s = S[(c0 + 2 + k * 3) % N], l = 4 + rnd() * 3, [x, z] = bord(s, 1, s.w + 0.4 + 0.7 * l); return [x, s.y - 0.3, z, rnd() * 1.5, l, 3.5 + rnd() * 2, l * 1.3]; })); }
      // sapins : le bois du retour (à l'ouest) serre la route et la tient à l'ombre ; ailleurs des bouquets épars, plus rien au-dessus de 100 m ni dans la gorge
      const arbres = [], bois = x => x < -90, iB = pt(h, 24), nB = (pt(h, 28) - iB + N) % N;
      for (let k = 0; k < nB; k += 3) for (const sd of [-1, 1]) { const s = S[(iB + k) % N], [x, z] = bord(s, sd, s.w + 5 + rnd() * 8); if (bois(x) && ecart(x, z, g.dAt(x, z)) > W + 4) arbres.push([x, g.hAt(x, z) + 6, z, rnd() * 6, 0.8 + rnd() * 0.7]); }
      for (let k = 0; k < 2200; k++) { const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z), y = g.hAt(x, z);
        if (d > 12 && d < 260 && y - 0.25 * Math.max(0, d - 80) < 100 && !gorge(x, z) && (bois(x) ? rnd() < 0.9 : Math.sin(x * 0.02) + Math.cos(z * 0.027) + rnd() > 0.85) && ecart(x, z, d) > 12) arbres.push([x, y + 6, z, rnd() * 6, 0.7 + rnd() * 0.8]); }
      const futs = arbres.map(p => { const y0 = p[1] - 6; p[1] = y0 + 10 * p[4]; return [p[0], y0 + 2.4 * p[4], p[2], 0, p[4]]; });
      inst(h, h.geo('cedre'), h.mat('sapinNeige'), arbres); inst(h, h.geo('tronc'), h.mat('tronc'), futs);
      // jalons à neige au ras des congères, tous les 24 m, tous les 12 m en virage : le seul balisage du col, leur bague s'allume dans les phares
      // sur la glace, tous les 12 m et la bague bleue : la plaque se lit de loin comme un couloir de feux bleus
      const jalons = [], jalonsG = []; for (let i = 0; i < N; i += vive(i) || Math.abs(S[i].k) > 0.008 ? 6 : 12) for (const sd of [-1, 1]) { const [x, z] = bord(S[i], sd, S[i].w + 0.5); (vive(i) ? jalonsG : jalons).push([x, S[i].y, z]); }
      // la chouette harfang, perchée sur un jalon de la descente nue (point 25), tournée vers la route et un peu vers qui arrive
      const sC = S[(pt(h, 25) + 3) % N], [ox, oz] = bord(sC, -1, sC.w + 0.5); jalons.push([ox, sC.y, oz]);
      h.pose('chouette', { plume: h.mat('peinture', { c: 0xf0f2f8 }), tache: h.mat('peinture', { c: 0x4a4a52 }), oeil: h.mat('peinture', { lum: 1, c: 0xffb020 }), bec: h.mat('peinture', { c: 0x202024 }) },
        grp(ox, sC.y + 2.8, oz, Math.atan2(-sC.tx, -sC.tz) - 0.6, 2.2)); // agrandie : à sa taille vraie, elle ne se voit pas à 150 km/h
      insts(h, 'jalon', { piquet: h.mat('cone'), bague: h.mat('catadioptre', { lum: 1, retro: 2.5 }) }, jalons);
      insts(h, 'jalon', { piquet: h.mat('cone'), bague: h.mat('peinture', { lum: 1, c: 0x50b0ff }) }, jalonsG);
      // la descente nue (points 23 à 26) : le chasse-neige garé sur un dégagement, gyrophare allumé ; la remontée mécanique arrêtée pour l'hiver grimpe la pente au nord, sièges figés
      const peauCN = { chassis: h.mat('matGris'), caisse: h.mat('peinture', { c: 0xf08a1a }), vitre: h.mat('vitreSombre'), neige, lame: h.mat('rayures'), roue: h.mat('roue'), pneu: h.mat('pneu') };
      const sN = S[iN], [nx, nz] = bord(sN, 1, sN.w + 4.2), gN = grp(nx, Math.max(sN.y - 0.15, g.hAt(nx, nz)), nz, -Math.atan2(sN.tz, sN.tx) + 0.15);
      h.pose('chasseNeige', peauCN, gN); h.lum(iN, nx, sN.y + 5, nz, 0xff8a1a, 26, 1.1);
      const gyro = new THREE.Group(); gyro.userData.dyn = 1; gyro.position.copy(gN.position); gyro.rotation.y = gN.rotation.y; h.scene.add(gyro); // il clignote : hors fusion du décor fixe
      const feuxG = [-1, 1].map(sd => h.pose('boite', h.mat('clignotant', LUM), gyro, [2, 3.55, sd * 0.7], 0.32, 0.28, 0.32));
      { const s = S[(pt(h, 23) + 35) % N], ry = -Math.atan2(s.tz, s.tx), tops = []; // la ligne part perpendiculaire à la route, vers le dehors de la boucle
        for (let k = 0; k < 6; k++) { const [x, z] = bord(s, -1, s.w + 24 + 46 * k), y = g.hAt(x, z); h.pose('pyloneTelesiege', { acier: h.mat('acier'), neige }, grp(x, y, z, ry)); tops.push([x, y + 8.75, z]); }
        const sieges = []; for (let k = 0; k < 5; k++) for (const sd of [-1, 1]) { const [a, b] = [tops[k], tops[k + 1]], ox = s.tx * sd * 2.1, oz = s.tz * sd * 2.1, L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          const c = grp((a[0] + b[0]) / 2 + ox, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + oz, 0); c.lookAt(b[0] + ox, b[1], b[2] + oz); h.pose('boite', h.mat('matGris'), c, [0, 0, 0], 0.14, 0.14, L); // le câble, d'un pylône à l'autre
          for (const f of [0.3, 0.7]) sieges.push([a[0] + (b[0] - a[0]) * (sd > 0 ? f : 1 - f) + ox, a[1] + (b[1] - a[1]) * (sd > 0 ? f : 1 - f) - 0.25, a[2] + (b[2] - a[2]) * (sd > 0 ? f : 1 - f) + oz, ry + Math.PI / 2 * (sd > 0 ? 1 : -1)]); }
        insts(h, 'siege', { acier: h.mat('acier'), siege: h.mat('peinture', { c: 0x2a62c8 }), neige }, sieges); }
      // balises de virage à l'extérieur des courbes, fixées devant les jalons : 1,2 × 0,6 m (les chevrons communs, 5 × 2,5 m, écrasent la route du col) ; sans retro, qui les assombrit à l'aube
      const chev = [[], []]; for (let i = 0; i < N; i += 6) { const s = S[i]; if (Math.abs(s.k) <= 0.006) continue; const f = s.k > 0 ? 0 : 1, [x, z] = bord(s, f ? 1 : -1, s.w + 0.35); chev[f].push([x, s.y + 1.9, z, Math.atan2(s.x - x, s.z - z), 0.24]); }
      chev.forEach((l, f) => inst(h, h.geo('chevron'), h.mat('chevron', { lum: 1, side: THREE.DoubleSide }, f), l));
      // le refuge du col, côté aval, fenêtres allumées, et le panneau du col
      const iR = pt(h, 19), gR = repere(h, S[iR]), WR = S[iR].w, [lx, lz] = bord(S[iR], -1, WR + 9);
      const peauR = { pierre: h.mat('pierre', { c: 0x8a92a4 }), mur: h.mat('planches', { c: 0x9a7a5a }), toit: neige, fenetre: h.mat('vitrine', { lum: 1, c: 0xffc070 }), porte: h.mat('planches', { c: 0x4a3626 }) };
      h.pose('refuge', peauR, gR, [-(WR + 17), 0, 0]);
      // deux voitures ensevelies devant le refuge : il ne dépasse que les vitres et les roues
      const auto = { caisse: neige, vitre: h.mat('vitreSombre'), feuRouge: h.mat('feuRouge'), feuBlanc: h.mat('lampe'), chassis: h.mat('matGris'), roue: h.mat('roue'), pneu: h.mat('pneu') };
      for (const [dz, a] of [[11, 1.4], [16, 1.75]]) { const v = new THREE.Group(); v.position.set(-(WR + 8), -0.15, dz); v.rotation.y = a; gR.add(v); h.pose('voitureGaree', auto, v); }
      // le hameau du fond de vallée, dans la boucle du départ : six chalets aux fenêtres allumées, pignon vers la route
      insts(h, 'refuge', peauR, [[28, -1, 30], [29, 1, 26], [29, -1, 48], [30, -1, 28], [0, -1, 34], [1, 1, 30]].map(([p, sd, o]) => { const s = S[pt(h, p)], [x, z] = bord(s, sd, s.w + o); return [x, g.hAt(x, z) - 0.8, z, h.across(s) + (sd > 0 ? Math.PI : 0)]; }));
      // le col est fermé : les barrières ont été poussées sur le bas-côté après le départ, leur feu orange allumé
      for (const dz of [0, 4]) h.pose('barriere', { rayures: h.mat('rayures', LUM), clignotant: h.mat('clignotant', LUM) }, repere(h, S[14]), [S[14].w + 5, 0.6, dz]);
      // la ligne à haute tension traverse la vallée d'est en ouest, entre le départ et les lacets
      for (let x = -160; x <= 640; x += 160) if (g.dAt(x, 140) > 20) h.pose('pyloneCol', { acier: h.mat('acier') }, h.scene, [x, g.hAt(x, 140), 140]);
      // rochers qui percent la neige : les mêmes pyramides que les sommets, petites, plus nombreuses là-haut où il n'y a plus d'arbres
      const rocs = []; for (let k = 0; k < 900 && rocs.length < 70; k++) { const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z), y = g.hAt(x, z), l = 5 + rnd() * 14;
        if (d > l + 14 && d < 220 && !gorge(x, z) && rnd() < (y > 80 ? 0.9 : 0.25) && ecart(x, z, d) > l + 14) rocs.push([x, y - 1, z, rnd() * 1.5, l, l * (0.6 + rnd() * 0.9), l * (0.7 + rnd() * 0.6)]); }
      inst(h, h.geo('pic'), h.mat('rocNeige'), rocs);
      h.lum(iR, lx, S[iR].y + 3, lz, 0xffb060, 45, 1.3);
      h.pose('panneauCol', { poteau: h.mat('acier'), plaque: h.mat('ecrit', { retro: 1.5 }, 128, 42, '#1c3fa8', '#f4f8ff', 'COL DE L\'ECHINE · 1922 m', 10) }, gR, [-(WR + 4), 0, -16]);
      // les sommets, en couronne à plus d'un kilomètre, bleus dans le petit jour
      const pics = []; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283 + rnd() * 0.2, r = 1150 + rnd() * 500, l = 520 + rnd() * 420; pics.push([250 + Math.cos(a) * r, 40, 250 + Math.sin(a) * r, rnd() * 1.5, l, 420 + rnd() * 330, l]); }
      inst(h, h.geo('pic'), h.mat('rocNeige', { fog: false, c: 0xa8b8e8 }), pics);
      // ---------- Laponie, en secret : rennes, cerfs, kotas, sapin de Noël, aurores boréales, et le Père Noël ----------
      const pc = new Map(), P = c => { const m = h.mat('peinture', { c }); return pc.get(c) || pc.set(c, m).get(c); }, bete = c => ({ poil: P(c), patte: P(0x3a2a20), nez: P(0x1a1410), ventre: P(0xe8e0d0), bois: P(0xd8c8a8) });
      const prets = (n, p, sd, o0, o1) => Array.from({ length: n }, () => { const s = S[(pt(h, p) + (rnd() * 30 | 0)) % N], [x, z] = bord(s, sd, s.w + o0 + rnd() * (o1 - o0)); return [x, g.hAt(x, z), z, rnd() * 6.3, 0.9 + rnd() * 0.25]; });
      insts(h, 'renne', bete(0x8a7660), [...prets(9, 29, 1, 25, 60), ...prets(5, 0, 1, 20, 45)]); // le troupeau du hameau
      insts(h, 'renne', bete(0x6a4428), prets(5, 25, 1, 14, 30), { a: [1.8] }); // les cerfs, à l'orée du bois
      const kotas = prets(4, 29, -1, 60, 80).map(p => [p[0], p[1] - 0.3, p[2], p[3]]); inst(h, h.geo('kota'), h.mat('planches', { c: 0xb09070 }), kotas);
      kotas.forEach(p => h.lum(pt(h, 29), p[0], p[1] + 1, p[2], 0xff9040, 14, 1.2));
      // le sapin de Noël du hameau, ses boules allumées
      { const s = S[pt(h, 29)], [x, z] = bord(s, -1, s.w + 40), y = g.hAt(x, z), cols = [0xff3030, 0xffd040, 0x40a0ff, 0xff60e0];
        inst(h, h.geo('cedre'), h.mat('sapinNeige'), [[x, y + 18, z, 0, 1.8]]); inst(h, h.geo('tronc'), h.mat('tronc'), [[x, y + 4.3, z, 0, 1.8]]);
        cols.forEach((c, k) => inst(h, h.geo('boite', 0.5, 0.5, 0.5), h.mat('peinture', { lum: 1, c }), Array.from({ length: 14 }, (_, j) => { const t = (j * 4 + k) / 56, a = t * 40, r = 4.6 * (1 - t) + 0.3; return [x + Math.cos(a) * r, y + 5 + t * 15, z + Math.sin(a) * r]; })));
        h.pose('boite', h.mat('peinture', { lum: 1, c: 0xffe070 }), h.scene, [x, y + 21, z], 1, 1, 1); }
      // le Père Noël : son traîneau et deux rennes garés près du refuge…
      const peauN = { patin: P(0xd8a838), caisse: P(0xb01020), sac: P(0x6a4a2a), costume: P(0xc8102e), ceinture: P(0x1a1a1a), peau: P(0xf0c0a0), barbe: P(0xf8f8f8) };
      const attelage = (parent, n) => { const t = new THREE.Group(); parent.add(t); h.pose('traineau', peauN, t);
        for (let k = 0; k < n; k++) for (const sd of [-1, 1]) h.pose('renne', k === n - 1 && sd < 0 ? { ...bete(0x8a7660), nez: h.mat('feuRouge', LUM) } : bete(0x8a7660), t, [3.4 + k * 2.6, 0, sd * 0.6]);
        for (const sd of [-1, 1]) h.pose('boite', peauN.ceinture, t, [1.6 + n * 1.3, 1.55, sd * 0.45], n * 2.6 + 0.6, 0.04, 0.04); return t; };
      { const t = attelage(gR, 1); t.position.set(-(WR + 10), 0, -4); t.rotation.y = Math.PI / 2; }
      // … et le même, en vol, quatre paires de rennes, qui tourne au-dessus du col
      let cx = 0, cz = 0, rx = 0, ym = -1e9; for (const s of S) { cx += s.x / N; cz += s.z / N; ym = Math.max(ym, s.y); } for (const s of S) rx = Math.max(rx, Math.hypot(s.x - cx, s.z - cz));
      const vol = new THREE.Group(); vol.userData.dyn = 1; h.scene.add(vol); attelage(vol, 4).position.x = -6; soude(h, vol); // une passe par teinte pour tout l'attelage en vol
      // aurores boréales : deux rideaux de lumière qui ondulent haut dans le ciel, au nord, derrière les sommets
      const rideaux = [['#40ffa0', 1350, 2.2, 3.9, 560, 520], ['#b060ff', 1550, 2.7, 4.4, 640, 380]].map(([c, r0, a0, a1, y0, ht]) => {
        const n = 90, pos = new Float32Array((n + 1) * 6), uv = [], idx = [];
        for (let k = 0; k <= n; k++) { uv.push(k / 6, 0, k / 6, 1); if (k < n) idx.push(2 * k, 2 * k + 2, 2 * k + 1, 2 * k + 1, 2 * k + 2, 2 * k + 3); }
        const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(idx);
        const m = new THREE.Mesh(ge, h.mat('degrade', { lum: 1, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }, c, true));
        m.userData.dyn = 1; m.frustumCulled = false; h.scene.add(m); return { m, pos, n, r0, a0, a1, y0, ht };
      });
      return (dt, now) => {
        feuxG.forEach((m, k) => { m.visible = ((now / 260 | 0) + k) % 2 === 0; }); // le gyrophare : ses deux feux alternent
        const a = now * 0.00012, R = rx * 0.75, [x, z] = [cx + Math.cos(a) * R, cz + Math.sin(a) * R];
        vol.position.set(x, ym + 45 + Math.sin(now * 0.002) * 3, z); vol.rotation.y = -a - Math.PI / 2; // X local sur la tangente du cercle, sens de la marche
        for (const q of rideaux) { for (let k = 0; k <= q.n; k++) { const t = q.a0 + (q.a1 - q.a0) * k / q.n, r = q.r0 + 90 * Math.sin(k * 0.21 + now * 0.0005) + 40 * Math.sin(k * 0.07 - now * 0.0003), px = cx + Math.cos(t) * r, pz = cz + Math.sin(t) * r;
          q.pos.set([px, q.y0, pz, px, q.y0 + q.ht * (0.8 + 0.2 * Math.sin(k * 0.3 + now * 0.001)), pz], k * 6); }
          q.m.geometry.attributes.position.needsUpdate = true; q.m.material.opacity = 0.55 + 0.2 * Math.sin(now * 0.0007 + q.r0); }
      };
    },
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
        boite(h, M('trottoir'), X1 - X0, 0.3, ZQ + 230, (X0 + X1) / 2, -0.4, (ZQ - 230) / 2); // dalles claires sur tout le quartier (au-dessus des rues, sous la route qui monte)
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
      { boite(h, M('trottoir'), 150, 0.3, 46, 620, -0.1, 37);
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
          boite(h, M('trottoir'), x1 - x0, 0.3, MQ - W - 6.5, (x0 + x1) / 2, -0.1, (MQ - 1.5 + W + 5) / 2); } // la promenade, de la route au quai
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
      h.pose('arc', { pierre: dore(h.mat('pierre')), relief: dore(h.mat('basRelief')) }, h.scene, [C[0], 0.02, C[1]]).forEach(m => m.rotation.y = PL.a);
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
      inst(h, h.geo('reverbere'), h.mat('fonte'), mats); inst(h, h.geo('lanterne'), h.mat('lanterne', LUM), lant);
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
        inst(h, h.geo('reverbere'), h.mat('fonte'), rv); inst(h, h.geo('lanterne'), h.mat('lanterne', LUM), ln); }
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

    // ---------- Canal 6 : le lit bétonné est devenu un grand ovale à l'américaine. Anneau de tribunes géantes pleines de monde, grillages, stands au départ,
    // tour de chronométrage, écrans du classement, parkings pleins et camping-cars dehors, dirigeable ; projecteurs sur la piste au couchant ----------
    canal(h) {
      const { THREE, S, N, W, rnd, T } = h;
      const net = m => { m.map.anisotropy = 8; return m; }; // textures vues en rasant (gazon, gradins, grillage) : filtrage anisotrope, sinon elles bavent
      const g = terrain(h, { pas: 16, marge: 340, mat: net(h.mat('gazon')) });
      // fresques fléchées : sur un mur de 5 m à l'extérieur des courbes, des chevrons peints dans le sens du virage
      const fresque = flip => h.mat('fresque', { lum: 1, side: THREE.DoubleSide }, flip);
      const dummy = new THREE.Object3D(), murs = [0, 1].map(f => new THREE.InstancedMesh(h.geo('murFresque'), fresque(f), 400)), cnt = [0, 0], balA = [], balB = [], apex = [];
      for (let i = 0; i < N; i++) {
        const s = S[i], k = s.k; if (Math.abs(k) < 0.0045) continue;
        const f = k > 0 ? 0 : 1, sd = k > 0 ? -1 : 1; // l'extérieur est à gauche d'un virage à droite
        if (i % 8 === 0 && cnt[f] < 400) { const [x, z] = bord(s, sd, s.w + 1.6); dummy.position.set(x, s.y + 2.5, z); dummy.lookAt(s.x, s.y + 2.5, s.z); dummy.updateMatrix(); murs[f].setMatrixAt(cnt[f]++, dummy.matrix); }
        if (i % 4 === 0) { const [x, z] = bord(s, sd, s.w + 0.5); (i % 8 ? balA : balB).push([x, s.y + 4.4, z]); } // balises hautes, une sur deux blanche, l'autre rose
        if (Math.abs(k) > Math.abs(S[(i + N - 1) % N].k) && Math.abs(k) >= Math.abs(S[(i + 1) % N].k) && Math.abs(k) > 0.008) apex.push([i, sd]);
      }
      murs.forEach((m, f) => { m.count = cnt[f]; m.frustumCulled = false; h.scene.add(m); });
      inst(h, h.geo('balise'), h.mat('peinture', { lum: 1, c: 0xf4f0e0 }), balA); inst(h, h.geo('balise'), h.mat('peinture', { lum: 1, c: 0xe83f8c }), balB);
      // panneaux des sponsors du meeting (inventés) : un mât de 24 m au point de corde extérieur de chaque courbe
      const pubs = [['SOLAR COLA', '#c8102e', '#f4f0e0'], ['DUSK RADIO', '#3d2a5c', '#ffc04a'], ['PALM TIRES', '#1848c8', '#f4f0e0'], ['RANCHO', '#f4f0e0', '#1a1420'], ['NITRO TACO', '#2aa39a', '#f4f0e0'], ['CANAL 6', '#1a1420', '#ff7a3d']].map(([t, a, b]) => h.mat('ecrit', LUM, 64, 32, a, b, t, 11));
      const fer = h.mat('fer'), acier = h.mat('acier'), beton = h.mat('beton'), lampe = h.mat('lampe', LUM);
      apex.forEach(([i, sd], k) => h.pose('panneauPub', { mat: fer, affiche: pubs[k % pubs.length] }, repere(h, S[i]), [sd * (S[i].w + 9), 0, 0], sd * 0.5));
      // grillage de protection au-dessus des murets, des deux côtés, sur tout le tour ; poteaux tous les 6 échantillons
      const cO = N - (T.t1 - T.t0), grille = net(h.mat('grillage', { alphaTest: 0.5, side: THREE.DoubleSide }));
      for (const sd of [-1, 1]) h.ribbon(T.t1, cO, s => sd * (s.w + 0.1), h.TH.murH + 4.2, s => sd * (s.w + 0.1), h.TH.murH - 0.1, grille, 4);
      const pot = []; for (let i = 0; i < N; i += 6) for (const sd of [-1, 1]) { const [x, z] = bord(S[i], sd, S[i].w + 0.2); pot.push([x, S[i].y + h.TH.murH + 2.1, z, 0, 1, 0.86, 1]); }
      inst(h, h.geo('poteauGrillage'), acier, pot);

      // --- les tribunes suivent la piste par l'extérieur, sans trou : un module de 14 m tous les 7 échantillons. Il s'élargit à l'extérieur des courbes
      // pour refermer l'éventail, et perd de la profondeur (75 %, 50 %) là où une autre portion de piste passe derrière ; un sur quatre porte un mât ---
      const trib = [[], []], PAS = 7, PROF = 53;
      const pied = i => { const s = S[i % N]; return [...bord(s, -1, s.w + 12), s.tz, -s.tx]; }; // façade et direction du fond (côté gauche = extérieur de l'ovale)
      for (let i = 0, k = 0; i < N; i += PAS, k++) {
        const [x, z, ox, oz] = pied(i), sc = [1, 0.75, 0.5].find(c => [0, 0.35, 0.7, 1].every(f => g.dAt(x + f * PROF * c * ox, z + f * PROF * c * oz) > W + 9));
        if (!sc || ![-7, 7].every(u => g.dAt(x + u * oz, z - u * ox) > W + 9)) continue;
        const [x2, z2, ox2, oz2] = pied(i + PAS), large = Math.max(1, Math.hypot(x2 + 40 * sc * ox2 - x - 40 * sc * ox, z2 + 40 * sc * oz2 - z - 40 * sc * oz) / 14 + 0.05);
        const y = Math.min(g.hAt(x, z), g.hAt(x + 20 * sc * ox, z + 20 * sc * oz)) - 0.6, mat = k % 4 === 0 ? 1 : 0;
        trib[mat].push([x, y, z, Math.atan2(ox, oz), large, sc, sc]);
        if (mat) { const s = S[i], [lx, lz] = bord(s, -1, W + 2); h.lum(i, lx, s.y + 20, lz, 0xfff0d8, 50, 0.5); } // le mât éclaire la piste ; au couchant, un appoint
      }
      const foule = net(h.mat('foule', {}, '#4a4250', '#e83f8c')), foule2 = net(h.mat('foule', {}, '#3e3848', '#2aa39a'));
      const peauT = { beton, banderole: h.mat('banderole', {}, 0), banderole2: h.mat('banderole', {}, 2), foule, foule2, escalier: h.mat('marches'), loge: h.mat('loges', LUM), acier, toit: h.mat('toleToit'), lampe, drapeau: h.mat('damier', { lum: 1, net: 1, side: THREE.DoubleSide }, '#f4f0e0') };
      trib.forEach((l, m) => insts(h, 'tribune', peauT, l, { a: [m] }));
      const ecrans = [[240, 70], [1250, 110], [1600, 140]];

      // --- le parking derrière les tribunes : des milliers de voitures, des camping-cars au bout des virages ---
      const autos = [], cc = [], COUL = [0xf4f0e0, 0x1a1a1e, 0xc8102e, 0x9aa0a8, 0x1848c8, 0x5a5e66, 0xd8d0c0, 0x2a5a3a, 0xffc04a];
      const lots = [[-260, 1780, -240, -178], [-260, 1780, 398, 460], [1960, 2100, -200, 420], [-580, -440, -200, 420]], dalles = [];
      lots.forEach(([x0, x1, z0, z1], n) => {
        dalles.push([(x0 + x1) / 2, g.hAt((x0 + x1) / 2, (z0 + z1) / 2) - 0.3, (z0 + z1) / 2, 0, x1 - x0, 1, z1 - z0]);
        for (let z = z0 + 6; z < z1 - 4; z += 8.5) for (let x = x0 + 2; x < x1 - 2; x += 2.5) {
          const r = rnd(); if (r > 0.86) continue;
          if (n > 1 && r < 0.05) { cc.push([x + 3, g.hAt(x, z), z, (z | 0) % 2 ? 0 : Math.PI, 1, 1, 1, COUL[(r * 977 | 0) % COUL.length]]); x += 6; continue; }
          autos.push([x, g.hAt(x, z) + 0.65, z + ((z | 0) % 2 ? 2.4 : -2.4), 1.5708, 1, 1, 1, COUL[(r * 977 | 0) % COUL.length]]);
        }
      });
      // et dans l'herbe du milieu, le public qui campe : deux rangées de camping-cars le long du grillage intérieur, par groupes, puis des grappes plus loin
      const poly = S.filter((s, i) => i % 8 === 0), dedans = (x, z) => { let c = false; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const p = poly[a], q = poly[b]; if ((p.z > z) !== (q.z > z) && x < (q.x - p.x) * (z - p.z) / (q.z - p.z) + p.x) c = !c; } return c; };
      const libre = (x, z) => [[20, 60, 140], ...ecrans.map(([a, b]) => [a, b, 30])].every(([cx, cz, r]) => Math.hypot(x - cx, z - cz) > r);
      for (let i = 100; i < N - 130; i += 4) for (const off of [W + 19, W + 28]) {
        const s = S[i], [x, z] = bord(s, 1, off); if ((i >> 2) % 8 === 0) continue; // un passage tous les 8 camping-cars
        if (dedans(x, z) && g.dAt(x, z) > off - 1.5 && libre(x, z)) cc.push([x, g.hAt(x, z), z, Math.atan2(-s.tz, s.tx), 1, 1, 1, COUL[(i * 7 + off | 0) % COUL.length]]);
      }
      for (let n = 0; n < 70; n++) {
        const x0 = -150 + rnd() * 1900, z0 = -60 + rnd() * 340, a = rnd() * 3.14;
        for (let m = 0; m < 6; m++) { const x = x0 + Math.cos(a) * m * 4, z = z0 - Math.sin(a) * m * 4; if (dedans(x, z) && g.dAt(x, z) > W + 45 && libre(x, z)) cc.push([x, g.hAt(x, z), z, a + 1.5708, 1, 1, 1, COUL[(n + m) % COUL.length]]); }
      }
      const laque = h.mat('laque'), ga = h.habille(h.geo('auto'), laque), garde = [...Array(24).keys()].filter(i => i < 12 || i > 15); // sans la face du dessous (posée au sol, jamais vue) : les voitures du parking sont la moitié des triangles de la carte
      for (const n in ga.attributes) { const a = ga.attributes[n]; ga.setAttribute(n, new THREE.Float32BufferAttribute(garde.flatMap(i => Array.from(a.array.slice(i * a.itemSize, (i + 1) * a.itemSize))), a.itemSize)); }
      ga.setIndex(Array.from(ga.index.array).filter((_, k) => k < 18 || k > 23).map(i => i > 15 ? i - 4 : i)); ga.clearGroups();
      const ma = inst(h, ga, laque, autos); autos.forEach((p, i) => ma.setColorAt(i, new THREE.Color(p[7]))); ma.instanceColor.needsUpdate = true;
      [inst(h, h.geo('bloc'), h.mat('parking'), dalles), ma, ...insts(h, 'campingCar', { caisse: h.mat('campingCar'), bande: h.mat('peinture', { c: 0xffffff }), vitre: h.mat('vitreSombre'), pneu: h.mat('pneu') }, cc, { teinte: 'bande' })]
        .forEach(m => { m.castShadow = false; }); // loin derrière les tribunes : leur ombre ne se verrait pas

      // --- les stands, côté intérieur du départ : voie des stands, garages des équipes ---
      const gar = [], E = [0xe83f8c, 0x1848c8, 0xffc04a, 0x2aa39a, 0xc8102e, 0xf4f0e0, 0xff7a3d, 0x3d2a5c];
      h.ribbon(N - 110, 200, W + 0.3, 0.04, W + 19, 0.04, h.mat('bitume', { side: THREE.DoubleSide }), 8);
      for (let j = 0, i = N - 106; j < 32; j++, i = (i + 6) % N) {
        const s = S[i], [x, z] = bord(s, 1, W + 21); gar.push([x, s.y, z, Math.atan2(-s.tz, s.tx), 1, 1, 1, E[j % E.length]]); // Z local vers l'intérieur de l'ovale
      }
      insts(h, 'garage', { beton: h.mat('crepi'), porte: h.mat('garageOuvert', LUM), enseigne: h.mat('peinture', { lum: 1, c: 0xffffff }), toit: h.mat('matGris') }, gar, { teinte: 'enseigne' });
      for (let i = N - 100; i < N + 90; i += 40) { const s = S[i % N], [x, z] = bord(s, 1, W + 10); h.lum(i % N, x, s.y + 14, z, 0xfff4e0, 32, 0.45); } // la voie des stands est éclairée, sans plus : la chaussée mouillée renvoie chaque lampe
      // tour de chronométrage et pylône des positions, derrière les garages
      const nom = h.mat('ecrit', LUM, 128, 32, '#1a1420', '#ff7a3d', 'CANAL 6', 26), score = h.mat('pyloneChrono', LUM);
      h.pose('tourChrono', { beton, loge: h.mat('loges', LUM), nom }, h.scene, [-30, g.hAt(-30, 90), 90]);
      h.pose('pyloneScore', { acier, ecran: score }, h.scene, [60, g.hAt(60, 75), 75]);
      // écrans géants du classement dans l'herbe du milieu, tournés vers les deux lignes droites
      const ecran = h.mat('classement', LUM);
      for (const [x, z] of [[240, 70], [1250, 110], [1600, 140]]) if (g.dAt(x, z) > W + 22) h.pose('ecranGeant', { acier, beton, ecran }, h.scene, [x, g.hAt(x, z), z]);
      // portiques de sponsors au-dessus de la piste
      for (const [i, t] of [[520, 'SOLAR COLA 500'], [1560, 'PALM TIRES · DUSK RADIO']]) h.pose('portiquePub', { ecran: h.mat('ecranPub', LUM, '#ffc04a', t), beton: acier }, repere(h, S[i]), [0, 0, 0], W);
      // mâts de projecteurs du côté intérieur : ils éclairent la chaussée
      const mats = [];
      for (let i = 30; i < N; i += 55) { const s = S[i], [x, z] = bord(s, 1, s.w + 9); if (g.dAt(x, z) < s.w + 7) continue; mats.push([x, g.hAt(x, z), z, 0]); const [lx, lz] = bord(s, 1, W - 2); h.lum(i, lx, s.y + 16, lz, 0xfff0d8, 45, 0.6); }
      insts(h, 'matEclairage', { acier, lampe }, mats);
      // quelques palmiers entre la piste et les tribunes
      const troncs = [], palmes = [];
      for (let i = 10; i < N; i += 37) { const s = S[i], [x, z] = bord(s, -1, s.w + 8); if (g.dAt(x, z) < s.w + 6) continue; const y = g.hAt(x, z), ht = 13 + rnd() * 5; troncs.push([x, y + ht / 2, z, 0, 1, ht, 1]); palmes.push([x, y + ht, z, rnd() * 6]); }
      inst(h, h.geo('troncPalmier'), h.mat('troncPalmier'), troncs); insts(h, 'palmes', { palme: h.mat('palme', { side: THREE.DoubleSide }) }, palmes);

      // --- la boue du canal (pts 3-4) : là où la route s'élargit (M.large), tout ce qui dépasse le bitume est de la boue (M.surf.large : la physique la roule comme de la terre) ---
      const b0 = pt(h, 3) - 40, b1 = pt(h, 4) + 40, boue = h.mat('bruit', { side: THREE.DoubleSide, gloss: 0.3 }, '#4a3b2a', ['#3a2c1e', '#5e4a32', '#2a2016', '#6a5a44']);
      for (const sd of [-1, 1]) h.ribbon((b0 + N) % N, b1 - b0, s => sd * (W - 0.05), 0.02, s => sd * s.w, 0.02, boue, 6);
      // --- l'écluse du retour (pt 16) : la rampe de M.sauts monte entre deux bajoyers, finit net sous la passerelle de manœuvre ; les 8 derniers mètres en chevrons (signal des cartes à relief) ---
      { const i = pt(h, h.M.sauts[0][0]), s = S[i];
        h.pose('ecluse', { beton, bois: h.mat('planches'), acier, rouge: h.mat('peinture', { c: 0xc8102e }) }, repere(h, s), [0, 0, 0], s.w);
        h.ribbon((i - 4 + N) % N, 4, -W + 0.6, 0.05, W - 0.6, 0.05, h.mat('banderoleSaut', { lum: 1, rep: [4, 1] }), 3.5); h.lum(i, s.x, s.y + 11, s.z, 0xffd8a0, 36, 0.5); }

      // --- l'aller (pts 1-6), devant la tribune nord : le défilé du meeting entre le grillage et les gradins. Un char tous les 120 m, et entre deux,
      // la fanfare en rangs de quatre (tenues rouges) précédée d'une ligne de majorettes (bleu et rose) ; tout le monde marche dans le sens de la course ---
      const chars = [], fanfare = [], majo = [], fil = (i, off) => { const s = S[(Math.round(i) + N) % N], [x, z] = bord(s, -1, s.w + off); return [x, s.y + h.TH.murH, z, Math.atan2(-s.tz, s.tx)]; }; // sur l'allée, au niveau du haut du muret : au sol, le muret les cachait
      { const a0 = pt(h, 1) - 20, cnt = pt(h, 6) - a0, dalle = h.mat('beton', { side: THREE.DoubleSide }); // l'allée du défilé : une terrasse de béton du muret à la façade des gradins
        h.ribbon(a0, cnt, s => -(s.w + 0.3), h.TH.murH, s => -(s.w + 11.6), h.TH.murH, dalle, 8); h.ribbon(a0, cnt, s => -(s.w + 11.6), h.TH.murH, s => -(s.w + 11.6), -3, dalle, 8); }
      const COULC = [0xe83f8c, 0xffc04a, 0x2aa39a, 0x1848c8, 0xff7a3d];
      for (let i = pt(h, 1), k = 0; i < pt(h, 6) - 40; i += 60, k++) {
        chars.push([...fil(i, 5.2), 1, 1, 1, COULC[k % COULC.length]]);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) fanfare.push([...fil(i + 9 + r * 0.7, 3.4 + c * 1.1), 1, 1, 1, 0xc8102e]);
        for (let c = 0; c < 6; c++) majo.push([...fil(i + 13, 3 + c * 0.9), 1, 1, 1, c % 2 ? 0xe83f8c : 0x1848c8]);
      }
      const blanc = h.mat('peinture', { c: 0xf4f0e0 }), damier = h.mat('damier', { lum: 1, net: 1, side: THREE.DoubleSide }, '#f4f0e0');
      const peauF = { blanc, peau: h.mat('peinture', { c: 0xc8926a }), tenue: h.mat('peinture', { c: 0xffffff }), or: h.mat('peinture', { c: 0xe0b040 }) };
      insts(h, 'figurant', peauF, fanfare, { a: [0], teinte: 'tenue' }); insts(h, 'figurant', peauF, majo, { a: [1], teinte: 'tenue' });
      insts(h, 'charMeeting', { caisse: h.mat('laque', { c: 0xf4f0e0 }), vitre: h.mat('vitreSombre'), blanc, deco: h.mat('peinture', { c: 0xffffff }), drapeau: damier, pneu: h.mat('pneu') }, chars, { teinte: 'deco' });

      // --- le retour (pts 13-18), devant la tribune sud : une haie de drapeaux à damier des deux côtés, et loin à l'ouest, dans le couchant qu'on a en face,
      // les montgolfières du meeting (hors brouillard : des silhouettes de couleur sur le ciel orange) ---
      const mats2 = []; for (let i = pt(h, 13), k = 0; i < pt(h, 18); i += 14, k++) { const s = S[i], sd = k % 2 ? 1 : -1, [x, z] = bord(s, sd, s.w + 3); mats2.push([x, g.hAt(x, z), z, Math.atan2(-s.tz, s.tx) + Math.PI]); }
      insts(h, 'matDamier', { acier, drapeau: damier }, mats2);
      const ballons = [], nacelles = [], COULB = [0xe83f8c, 0xffc04a, 0x2aa39a, 0x1848c8, 0xc8102e, 0xf4f0e0, 0x3d2a5c];
      for (let k = 0; k < 16; k++) { const x = -330 - rnd() * 380, z = 280 + rnd() * 420, y = 60 + rnd() * 140, r = 18 + rnd() * 8; // à moins de 2 350 m de la piste : au-delà, derrière le ciel
        ballons.push([x, y, z, rnd() * 6, r, r, r, COULB[k % COULB.length]]); nacelles.push([x, y - r * 1.15 - 3, z, 0, 1.8, 1.4, 1.8]); }
      const mb = inst(h, h.geo('ballon'), h.mat('peinture', { c: 0xffffff, fog: false }), ballons); ballons.forEach((p, i) => mb.setColorAt(i, new THREE.Color(p[7]))); mb.instanceColor.needsUpdate = true;
      inst(h, h.geo('boite', 1, 1, 1), h.mat('planches', { fog: false }), nacelles);
      // dirigeable du meeting, qui tourne lentement au-dessus de l'ovale
      const dg = new THREE.Group(); dg.userData.dyn = 1; h.scene.add(dg); // dyn : il vole, hors fusion du décor fixe (game.js)
      h.pose('enveloppe', h.mat('laque', { c: 0xe8e4dc }), dg);
      h.pose('dirigeable', { nacelle: h.mat('matGris'), aileron: h.mat('peinture', { c: 0xe83f8c }), ecran: h.mat('ecrit', LUM, 128, 26, '#1a1420', '#ffc04a', 'SOLAR COLA', 20) }, dg);
      // les tours du centre-ville à l'ouest, à contre-jour devant le soleil
      const tours = h.mat('tourLoin', { lum: 1, fog: false }, '#2a1c3a', ['#ffc04a'], 40);
      for (let i = 0; i < 34; i++) { const hh = 120 + rnd() * rnd() * 380, w = 50 + rnd() * 70; boite(h, tours, w, hh, w, -2300 + rnd() * 900, hh / 2, -500 + rnd() * 1300); }
      // la foule bouge : chaque étage de gradins passe par moments à sa variante bras levés ; le dirigeable fait le tour en une vingtaine de minutes
      return (dt, now) => {
        foule.map.offset.y = Math.sin(now * 0.0021) + Math.sin(now * 0.0057) > 0.7 ? 0.5 : 0;
        foule2.map.offset.y = Math.sin(now * 0.0017 + 2) + Math.sin(now * 0.0049) > 0.5 ? 0.5 : 0;
        const t = now * 0.00006; dg.position.set(760 + Math.cos(t) * 520, 125, 110 + Math.sin(t) * 260); dg.rotation.y = -t - Math.PI / 2;
      };
    },

    // ---------- Route royale (docs/SPEC-PERSE.md) : la plaine de Marvdasht, le grand escalier, la Porte des Nations, la salle aux cent colonnes (M.place), le jardin, le bazar couvert ----------
    // Miniature persane : la route reste sobre, l'ornement va aux murs, au sol hors piste et au fond. formes-perse.js, textures-perse.js.
    perse(h) {
      const { THREE, S, N, W, M, T, rnd } = h, PL = M.place, [CX, CZ] = PL.c, YS = S[pt(h, 17)].y; // YS : niveau du sol de la salle
      const dansSalle = (x, z, e = 0) => Math.hypot(x - CX, z - CZ) < PL.r + e, au = (s, d, y = 0) => [s.x - s.tz * d, s.y + y, s.z + s.tx * d];
      const enTunnel = i => T.tun && ((i - T.t0 + N) % N) <= ((T.t1 - T.t0 + N) % N);
      const ang = (s, sd) => Math.atan2(-s.tz, s.tx) + (sd < 0 ? Math.PI : 0); // pièce de bord de piste : X local le long de la route, Z vers l'extérieur du côté sd
      const P0 = i => pt(h, i);
      const g = terrain(h, { pas: 12, marge: 320, mat: h.mat('bruit', {}, '#c49a68', ['#b48a58', '#d4aa78', '#a47a4c']), creux: (x, z) => dansSalle(x, z, 3) ? 1.2 : 0 });
      // une nappe de quadrilatères en une passe de dessin (comme au stade) ; tuile : texture plaquée en plan ; sinon u le long, v en hauteur
      const nappe = (mat, tuile) => { const pos = [], uv = [], idx = []; return {
        quad(a, b, c, d, u0 = 0, u1 = 1) { const k = pos.length / 3; [a, b, c, d].forEach((p, j) => { pos.push(p[0], p[1], p[2]); if (tuile) uv.push(p[0] / tuile, p[2] / tuile); else uv.push(j < 2 ? u0 : u1, j & 1 ? 0 : 1); }); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); },
        fin() { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); q.setIndex(idx); q.computeVertexNormals(); const m = new THREE.Mesh(q, mat); m.receiveShadow = true; h.scene.add(m); return m; } }; };
      const DS = { side: THREE.DoubleSide }, pierre = h.mat('pierre'), sculpte = h.mat('sculpte'), or = h.mat('peinture', { c: 0xf0b840 }), frise = h.mat('frise', DS), faience = h.mat('faience', DS);
      const secteur = i => { for (const [a, b, k] of [[9, 12, 'escalier'], [14, 20, 'salle'], [20, 25, 'jardin'], [25, 38, 'bazar']]) { const i0 = P0(a), l = (P0(b) - i0 + N) % N; if ((i - i0 + N) % N <= l) return k; } return 'plaine'; };

      // --- le sol hors de la bande de bitume : bas-côtés de pierre damée dans la plaine, dallage du jardin, et le dallage en damier de la salle (un disque, M.place) ---
      const bas = nappe(h.mat('bruit', DS, '#b89a70', ['#a88a60', '#c8aa80']), 6), dalles = nappe(h.mat('dallage', DS), 8);
      for (let i = 0; i < N; i++) { const a = S[i], b = S[(i + 1) % N]; if (a.w < W + 0.05 && b.w < W + 0.05) continue;
        const n = secteur(i) === 'jardin' ? dalles : bas; for (const sd of [-1, 1]) n.quad(au(a, sd * W, 0.02), au(b, sd * W, 0.02), au(a, sd * a.w, 0.02), au(b, sd * b.w, 0.02)); }
      for (let k = 0; k < 64; k++) { const f = j => [CX + Math.cos(j * Math.PI / 32) * (PL.r + 0.5), YS - 0.02, CZ + Math.sin(j * Math.PI / 32) * (PL.r + 0.5)], c = [CX, YS - 0.02, CZ]; dalles.quad(c, c, f(k), f(k + 1)); }
      bas.fin(); dalles.fin();
      // l'allée de tapis rouge et or au milieu de la salle : la ligne rapide (posée sur la chaussée, de l'entrée à la sortie de la salle)
      h.ribbon(P0(14) + 10, (P0(20) - P0(14) + N) % N - 20, -3.5, 0.03, 3.5, 0.03, h.mat('tapisAllee', DS), 7);

      // --- les murs : bordure de tapis, frise des Immortels le long de l'escalier, faïence au jardin ; ni dans la salle (on y roule partout), ni dans le tunnel (game.js les fait) ---
      const MH = { plaine: 1.2, escalier: 2.6, jardin: 0.6, bazar: 0.9 }, murs = { plaine: nappe(h.mat('tapisBord', DS)), escalier: nappe(frise), jardin: nappe(faience), bazar: nappe(h.mat('arcades', DS)) };
      for (let i = 0; i < N; i++) { if (enTunnel(i)) continue; const k = secteur(i), m = murs[k === 'salle' ? 'plaine' : k], ht = MH[k] || 1.2;
        for (const sd of [-1, 1]) { const a = S[i], b = S[(i + 1) % N], p = au(a, sd * a.w), q = au(b, sd * b.w), o = au(a, sd * (a.w + 2.2));
          if (dansSalle(p[0], p[2], -0.4) && dansSalle(q[0], q[2], -0.4) || dansSalle(o[0], o[2], -1.1)) continue;
          m.quad([p[0], p[1] + ht, p[2]], [p[0], p[1] - 0.6, p[2]], [q[0], q[1] + ht, q[2]], [q[0], q[1] - 0.6, q[2]], i / 2, (i + 1) / 2); } }
      // le pourtour de la salle : un mur de frise de 3 m sur le cercle de M.place, là où il ne coupe pas la chaussée
      const tourSalle = nappe(frise);
      for (let k = 0; k < 96; k++) { const f = j => [CX + Math.cos(j * Math.PI / 48) * PL.r, YS, CZ + Math.sin(j * Math.PI / 48) * PL.r], p = f(k), q = f(k + 1), x = (p[0] + q[0]) / 2, z = (p[2] + q[2]) / 2, s = S[near(h, x, z)];
        if (Math.hypot(s.x - x, s.z - z) < s.w + 0.5) continue; tourSalle.quad([p[0], YS + 3, p[2]], [p[0], YS - 0.6, p[2]], [q[0], YS + 3, q[2]], [q[0], YS - 0.6, q[2]], k / 3, (k + 1) / 3); }
      Object.values(murs).forEach(m => m.fin()); tourSalle.fin();

      // --- la salle aux cent colonnes : les 15 de M.place (on les percute), et le reste de la forêt au-delà du mur, sur une grille de 18 m ; un plafond de poutres posé dessus ---
      const HC = 19, ca = Math.cos(PL.a), sa = Math.sin(PL.a), cols = PL.piles.map(([x, z]) => [CX + x * ca + z * sa, YS, CZ - x * sa + z * ca, 0]); // repère tourné de la place (sim.js)
      for (let x = CX - 81; x <= CX + 81; x += 18) for (let z = CZ - 72; z <= CZ + 72; z += 18) { if (dansSalle(x, z, 4) || g.dAt(x, z) < W + 4) continue; cols.push([x, YS, z, 0]); }
      insts(h, 'colonnePerse', { pierre, fut: h.mat('cannelure'), sculpte, or }, cols, { a: [HC] });
      const poutres = [], bois = h.mat('planches'), cedre = h.mat('peinture', { c: 0xa8743c });
      for (let z = CZ - 72; z <= CZ + 72; z += 18) poutres.push([CX, YS + HC + 0.6, z, 0, 168, 1.2, 1.6]);
      for (let x = CX - 81; x <= CX + 81; x += 36) poutres.push([x, YS + HC + 1.6, CZ, 0, 1.2, 0.8, 150]);
      inst(h, h.geo('bloc'), cedre, poutres); // poutres de cèdre, claires : sombres, elles barraient le ciel

      // --- la Porte des Nations, à cheval sur la route juste avant l'épingle (pt 12-13) : on y arrive face au soleil couchant ---
      { const i = P0(12) + 6, s = S[i]; h.pose('porteNations', { pierre, frise, sculpte, ailes: h.mat('ailes'), or }, repere(h, s), [0, 0, 0], s.w); h.lum(i, s.x, s.y + 12, s.z, 0xffc070, 40, 0.5); }

      // --- le grand escalier (pts 9-12) : balustrade crénelée des deux côtés, et à gauche la rampe miroir (décor) qui rejoint le même palier ---
      const merl = [], i9 = P0(9), i12 = P0(12);
      for (let i = i9; i < i12 + 10; i++) for (const sd of [-1, 1]) { const s = S[i], [x, z] = bord(s, sd, s.w + 0.3); merl.push([x, s.y + MH.escalier, z, ang(s, 1)]); }
      { const nr = i12 - i9; h.ribbon(i9, nr, s => -(s.w + 5), 0.02, s => -(s.w + 16), 0.02, h.mat('pierre', DS), 6); // le plat de la rampe miroir, à la même pente
        h.ribbon(i9, nr, s => -(s.w + 16), MH.escalier, s => -(s.w + 16), -6, frise, 6); // son mur extérieur à frise
        for (let i = i9; i < i12; i++) { const s = S[i], [x, z] = bord(s, -1, s.w + 16.3); merl.push([x, s.y + MH.escalier, z, ang(s, 1)]); } }
      h.ribbon(i9, i12 - i9, -W + 0.4, 0.03, W - 0.4, 0.03, h.mat('marchesPerse', { alphaTest: 0.5, ...DS }), 1.2);
      inst(h, h.geo('boite', 1.2, 0.7, 0.6), pierre, merl.map(p => [p[0], p[1] + 0.35, p[2], p[3]]));
      inst(h, h.geo('boite', 0.6, 0.6, 0.6), pierre, merl.filter((_, k) => k % 2 === 0).map(p => [p[0], p[1] + 1, p[2], p[3]]));
      // le palier : deux taureaux ailés sur socle de part et d'autre du haut de l'escalier
      for (const sd of [-1, 1]) { const s = S[i12 - 4], [x, z] = bord(s, sd, s.w + 9); h.pose('lamassu', { pierre, sculpte, ailes: h.mat('ailes'), or }, h.scene, [x, s.y, z]).forEach(m => m.rotation.y = Math.atan2(-s.tx, -s.tz) + Math.PI); }

      // --- la plaine (pts 0-8) : palmiers et peupliers en silhouette, bornes de la route royale, une allée de taureaux ailés au loin, la falaise du Kuh-e Rahmat au fond ---
      const troncs = [], palmes = [], cypres = [], bornes = [];
      for (let i = 0; i < P0(9); i += 3) for (const sd of [-1, 1]) { const s = S[i];
        if (i % 24 === 0) { const [x, z] = bord(s, sd, s.w + 2); bornes.push([x, s.y + 0.6, z, 0]); }
        const off = s.w + 6 + rnd() * 40, [x, z] = bord(s, sd, off); if (g.dAt(x, z) < W + 6 || rnd() < 0.4) continue; const y = g.hAt(x, z);
        if (rnd() < 0.5) { const ht = 11 + rnd() * 6; troncs.push([x, y + ht / 2, z, 0, 1, ht, 1]); palmes.push([x, y + ht, z, rnd() * 6]); } else cypres.push([x, y, z, 0, 1, 0.8 + rnd() * 0.6, 1]); }
      // le jardin (pts 20-24) aussi a ses cyprès, en rangs, et la ville (fond) les siens
      const i20 = P0(20), i25 = P0(25);
      for (let i = i20; i < i25; i += 5) { const s = S[i], [x, z] = bord(s, -1, s.w + 4); if (g.dAt(x, z) > W + 2) cypres.push([x, g.hAt(x, z), z, 0, 0.9, 1.1, 0.9]); const [x2, z2] = bord(s, 1, s.w + 9); if (g.dAt(x2, z2) > W + 6) cypres.push([x2, g.hAt(x2, z2), z2, 0, 0.9, 1.2, 0.9]); }
      inst(h, h.geo('troncPalmier'), h.mat('troncPalmier'), troncs); insts(h, 'palmes', { palme: h.mat('palme', DS) }, palmes);
      inst(h, h.geo('cypres'), h.mat('peinture', { c: 0x2f5a3a }), cypres); inst(h, h.geo('boite', 0.6, 1.2, 0.6), pierre, bornes);
      for (const [p, sd] of [[3, 1], [4, -1], [6, 1]]) { const s = S[P0(p)], [x, z] = bord(s, sd, s.w + 24); if (g.dAt(x, z) > W + 10) h.pose('lamassu', { pierre, sculpte, ailes: h.mat('ailes'), or }, h.scene, [x, g.hAt(x, z), z]).forEach(m => m.rotation.y = ang(s, sd) + Math.PI / 2); }
      const fal = h.mat('falaise', { fog: false }); for (let k = 0; k < 7; k++) boite(h, fal, 90 + rnd() * 60, 140 + rnd() * 90, 60, 1150 + rnd() * 120, 40, -150 + k * 130);

      // --- le jardin (pts 20-24) : le canal turquoise côté intérieur (infranchissable : derrière le mur de faïence), des bassins ronds et des massifs jaunes et rouges de l'autre côté ---
      const eau = h.mat('bruit', { lum: 1, ...DS }, '#2aa39a', ['#3ab8ae', '#1f8a82', '#f4ead0']);
      h.ribbon(i20, i25 - i20, s => s.w + 0.3, 0.06, s => s.w + 7, 0.06, eau, 6); h.ribbon(i20, i25 - i20, s => s.w + 7, 0.6, s => s.w + 7, -0.6, faience, 4);
      const marg = [], plans = [], fleurs = [];
      for (let i = i20 + 8, k = 0; i < i25 - 8; i += 20, k++) { const s = S[i], [x, z] = bord(s, -1, s.w + 15); if (g.dAt(x, z) < W + 12) continue; const y = Math.max(s.y, g.hAt(x, z));
        marg.push([x, y, z, 0, 5, 0.5, 5]); plans.push([x, y + 0.35, z, 0, 4.8, 1, 4.8]);
        for (let j = 0; j < 8; j++) { const a = j / 8 * 6.283; fleurs.push([x + Math.cos(a) * 7.5, y + 0.3, z + Math.sin(a) * 7.5, a, 2.4, 1, 1.2, j & 1 ? 0xf0c020 : 0xc8323c]); } }
      inst(h, h.geo('margelle'), faience, marg); inst(h, h.geo('disque'), eau, plans);
      { const mf = inst(h, h.geo('massif'), h.mat('peinture', { c: 0xffffff }), fleurs); fleurs.forEach((p, i) => mf.setColorAt(i, new THREE.Color(p[7]))); if (fleurs.length) mf.instanceColor.needsUpdate = true; }
      // le palais au fond du jardin (Golestan) : façade à iwan, deux tours à toit en pyramide
      { const s = S[P0(22)], [x, z] = bord(s, -1, s.w + 70), y = g.hAt(x, z), a = ang(s, -1), pal = h.mat('palais');
        const m = boite(h, pal, 110, 24, 10, x, y + 12, z); m.rotation.y = a; for (const sd of [-1, 1]) { const tx = x + Math.cos(a) * sd * 60, tz = z - Math.sin(a) * sd * 60;
          boite(h, h.mat('faience'), 12, 34, 12, tx, y + 17, tz).rotation.y = a; h.pose('toitPyramide', h.mat('peinture', { c: 0x1d3a8a }), h.scene, [tx, y + 34, tz]).scale.set(16, 10, 16); } }

      // --- le bazar (pts 25-38) : la voûte de briques entre les pts 26 et 34 (tunnel de game.js, teintes th.tun), et à ciel ouvert des arcades, des étals rayés, des chameaux et des ânes ---
      const arc = [], eta = [], cham = [], anes = [], lant = [];
      for (let i = i25, k = 0; i < N + 4; i += 6, k++) { const j = i % N; if (enTunnel(j)) { if (k % 2 === 0) lant.push([S[j].x, S[j].y + 6.4, S[j].z, 0]); continue; }
        for (const sd of [-1, 1]) { const s = S[j], [x, z] = bord(s, sd, s.w + 4); if (g.dAt(...bord(s, sd, s.w + 8)) < s.w + 6) continue; // les arcades en retrait de 4 m : devant elles, étals et bêtes, vus par-dessus le mur bas
          arc.push([x, s.y, z, ang(s, sd)]);
          if ((k + (sd > 0)) % 2 === 0) { const [ex, ez] = bord(s, sd, s.w + 1.6); eta.push([ex, s.y, ez, ang(s, sd)]); } else { const [cx, cz] = bord(s, sd, s.w + 2.4); (k & 2 ? cham : anes).push([cx, s.y, cz, Math.atan2(-s.tz, s.tx)]); } } }
      insts(h, 'arcade', { brique: h.mat('brique'), faience: h.mat('faience'), or }, arc);
      for (const [n, a, b] of [[0, '#c8323c', '#f0b840'], [1, '#2aa39a', '#1d3a8a']]) insts(h, 'etalPerse', { bois, auvent: h.mat('auvent', DS, a, b), marchandise: h.mat('peinture', { c: n ? 0xf0b840 : 0xc8323c }) }, eta.filter((_, k) => k % 2 === n));
      insts(h, 'chameau', { poil: h.mat('peinture', { c: 0xb08850 }), bat: h.mat('peinture', { c: 0xc8323c }) }, cham); insts(h, 'ane', { poil: h.mat('peinture', { c: 0x8a8478 }), bat: h.mat('peinture', { c: 0x1d3a8a }) }, anes);
      inst(h, h.geo('lanterne'), h.mat('peinture', { lum: 1, c: 0xffb850 }), lant);
      // au fond, à l'ouest du bazar : une mosquée à coupole turquoise et deux minarets, à contre-jour
      { const x = -320, z = 260, y = g.hAt(x, z), tu = h.mat('faience', { fog: false });
        h.pose('tambour', tu, h.scene, [x, y, z]).scale.set(24, 30, 24); h.pose('coupole', h.mat('peinture', { c: 0x2aa39a, fog: false }), h.scene, [x, y + 30, z]).scale.set(25, 30, 25);
        boite(h, h.mat('palais', { fog: false }), 70, 28, 14, x + 40, y + 14, z).rotation.y = Math.PI / 2;
        for (const dz of [-48, 48]) { h.pose('minaret', tu, h.scene, [x + 30, y, z + dz]).scale.set(3.5, 64, 3.5); h.pose('coupole', or, h.scene, [x + 30, y + 64, z + dz]).scale.set(4, 6, 4); } }

      // --- le ciel de miniature : des volutes de nuages ivoire et or, plates, au-dessus du couchant ---
      const vol = h.mat('volute', { fog: false, alphaTest: 0.5, ...DS });
      for (let k = 0; k < 9; k++) { const a = -2.2 + k * 0.5 + rnd() * 0.2, r = 1700 + rnd() * 300, w = 260 + rnd() * 160;
        const m = h.pose('panneau', vol, h.scene, [300 + Math.cos(a) * r, 400 + rnd() * 180, 250 + Math.sin(a) * r]); m.scale.set(w, w / 2, 1); m.lookAt(300, m.position.y, 250); }
    },
    // ---------- Barrage 74 : centrale hydroélectrique soviétique des années 70, vannes ouvertes, matin voilé (docs/SPEC-BARRAGE.md) ----------
    // Le corps du barrage est fait de gradins de béton (x de -252 à 170) qui enferment les galeries du tunnel : couronnement (z 12-30, au ras de la crête), gradin haut (z 30-68, 111 m)
    // où s'ouvrent les cinq vannes, gradin bas (z 68-113, 79 m), puis la salle des turbines (z 113-160), creuse, que la route traverse à ciel fermé (pts 17-21). À l'est (x 170-480), le mur nu de 104 m :
    // la crête y longe le vide. Les gerbes des vannes passent au-dessus de la halle et tombent dans le bassin, juste en amont du pont (pts 10-11) ; la rivière file au sud sous la ligne de départ.
    barrage(h) {
      const { THREE, S, N, W, rnd } = h, P = i => pt(h, i), LUMI = { lum: 1 }, DS = { side: THREE.DoubleSide };
      const bloc = (m, x0, x1, z0, z1, y0, y1) => boite(h, m, x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      const yA = (x, z) => S[near(h, x, z)].y; // altitude de la route la plus proche
      // --- le sol : la vallée à 9 m, le relief suit la route dans la vallée et les lacets ; sous le barrage (du portail à la fin de la crête), il reste au fond de la vallée ---
      const i15 = P(15), i48 = P(48), bassin = (x, z) => x > -170 && x < 130 && z > 160 && z < 228;
      const creux = (x, z) => bassin(x, z) ? 7 : z > 160 ? 7 * Math.max(0, Math.min(1, (24 - Math.abs(x)) / 6)) : 0; // le bassin de dissipation, puis la rivière (x ≈ 0)
      const g = terrain(h, { pas: 14, marge: 650, sol: s => { const i = S.indexOf(s); return i >= i15 && i < i48 ? 8 : s.y; }, creux, mat: h.mat('bruit', {}, '#5f6450', ['#545a46', '#6c705a', '#5c5446']) });
      // --- l'eau : la retenue au ras de la crête (101 m), le bassin et la rivière (4 m) ---
      const eau = h.mat('eauGES'), eauVive = h.mat('eauGES', {}, '#8ab8cc', 90);
      bloc(eau, -330, 735, -1200, -14, 100, 101); bloc(eauVive, -170, 130, 160, 228, 3, 4); bloc(eau, -22, 22, 205, 1250, 3, 4);
      // --- les rives de la retenue : deux massifs de roche, à l'ouest et à l'est (hors de la vallée) ---
      const roche = h.mat('bruit', { rep: [24, 8] }, '#5c5446', ['#4a4438', '#6a6254', '#545048']);
      for (const [x0, x1, z0, z1, y] of [[-1200, -330, -1200, 180, 150], [-1200, -620, -1200, 120, 215], [-620, -420, -1200, -200, 185], [745, 1450, -1200, 390, 165], [930, 1450, -1200, 300, 240], [745, 930, -1200, -260, 200]]) bloc(roche, x0, x1, z0, z1, 0, y);
      // --- le corps du barrage ---
      const bet = h.mat('betonGES'), betS = h.mat('betonGES', {}, '#6d726d'), baies = h.mat('baiesHalle');
      bloc(bet, -252, 480, -14, 12, 0, 104.6); // mur de la crête (le parapet est la glissière de game.js)
      bloc(bet, -252, 170, 12, 30, 0, 104.6); bloc(bet, -252, 170, 30, 68, 0, 111); bloc(bet, -252, 170, 68, 113, 0, 79); // couronnement, gradin haut, gradin bas
      bloc(betS, -330, -252, -20, 175, 0, 116); // culée ouest : portails des galeries (pts 22 et 44)
      // salle des turbines : façade sud vitrée, toit, pignon est percé pour la route (elle y entre vers 29 m d'altitude, entre z = 126 et 152)
      bloc(baies, -252, 312, 157, 160, 0, 62); bloc(betS, -252, 312, 113, 160, 60, 62.5);
      bloc(bet, 309, 312, 113, 126, 0, 62); bloc(bet, 309, 312, 152, 160, 0, 62); bloc(bet, 309, 312, 126, 152, 40, 62); bloc(bet, 309, 312, 126, 152, 0, 27.4);
      { const a = P(17) - 8, n = P(22) - a, dalle = h.mat('betonGES', DS, '#7a7e78'); for (const sd of [-1, 1]) h.ribbon(a, n, sd * W, -0.05, sd * 22, -0.05, dalle, 8); } // le sol de la halle, de la route aux murs
      // la halle : alternateurs vert d'eau des deux côtés, colonnes, rails et pont roulant orange, mosaïque sur le mur nord, lumière du jour par les baies et lampes au plafond
      const vert = h.mat('peinture', { c: 0x5fa89a }), orange = h.mat('toleOrange'), acier = h.mat('acier', { c: 0x6d726d }), alt = [], cap = [], col = [];
      for (let x = -225; x <= 285; x += 45) for (const z of [119, 151]) { const y = yA(x, 135) - 0.05; alt.push([x, y, z]); cap.push([x, y + 7, z]); }
      for (let x = -240; x < 309; x += 22.5) for (const z of [114, 156]) { const y = yA(x, 135) - 0.05; col.push([x, y + (61 - y) / 2, z, 0, 1.4, 61 - y, 1.4]); }
      inst(h, h.geo('alternateur'), vert, alt); inst(h, h.geo('capot'), h.mat('peinture', { c: 0x4a8478 }), cap); inst(h, h.geo('bloc'), betS, col);
      for (const z of [114.6, 155.4]) bloc(orange, -252, 309, z - 0.6, z + 0.6, 52.4, 53.6);
      { const gr = new THREE.Group(); gr.position.set(40, 51.4, 135); gr.rotation.y = Math.PI / 2; h.scene.add(gr); h.pose('pontRoulant', { acier: orange, chariot: orange, cabine: h.mat('peinture', { c: 0xe8e4d8 }), cable: h.mat('matGris') }, gr, [0, 0, 0], 41); }
      bloc(h.mat('mosaique'), -110, -14, 113, 113.4, 40, 58); bloc(h.mat('lettres', {}, 'ГЭС-74 · ГА 1-12'), 60, 220, 113, 113.4, 44, 52);
      for (let x = -220; x < 300; x += 65) { const i = near(h, x, 135); h.lum(i, x, S[i].y + 22, 135, 0xfff0d8, 48, 0.8); }
      // --- les cinq vannes du gradin haut et leurs gerbes : la lame part à 96 m, passe au-dessus des gradins et de la halle, tombe dans le bassin (z ≈ 231) ---
      const gerbe = h.mat('gerbe', { lum: 1, transparent: true, depthWrite: false, side: THREE.DoubleSide }), brume = h.mat('brume', { lum: 1, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const trou = h.mat('peinture', { c: 0x202224 }), bru = [];
      [-150, -90, -30, 30, 90].forEach((x, k) => {
        h.pose('vanne', { trou, beton: betS, vantail: orange, numero: h.mat('lettres', {}, 'ГА-' + (k + 1)) }, h.scene, [x, 92, 68]);
        const m = h.pose('gerbe', gerbe, h.scene, [x, 96, 69], 162, 91, 9, 24); m.renderOrder = 2;
        bru.push([x, 14, 224, rnd() * 3, 60, 34, 60], [x + 20, 30, 205, rnd() * 3, 44, 30, 44]);
      });
      bru.push([-20, 22, 245, 0, 110, 26, 40]); // le nuage qui passe sur le pont
      inst(h, h.geo('brume'), brume, bru).renderOrder = 3;
      // --- la crête : portiques des vannes au-dessus de la route, lampadaires des deux côtés, lettres peintes sur le mur aval nu ---
      const portique = { acier: orange, treuil: h.mat('peinture', { c: 0x5fa89a }) };
      for (const x of [-150, -30, 90]) { const s = S[near(h, x, 0)]; h.pose('portiqueVanne', portique, repere(h, s), [0, 0, 0], W); }
      { const mats = [], tetes = []; for (let i = P(44) + 10; i < P(49); i += 20) { const s = S[i], ry = h.across(s);
          for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, W + 0.8), [tx, tz] = bord(s, sd, W - 0.7); mats.push([x, s.y + 5, z, ry]); tetes.push([tx, s.y + 10, tz, ry]); }
          { const [lx, lz] = bord(s, (i / 20) & 1 ? 1 : -1, W - 0.7); h.lum(i, lx, s.y + 9.6, lz, 0xfff0d0, 28, 0.9); } }
        inst(h, h.geo('matLampadaire'), h.mat('matGris'), mats); inst(h, h.geo('teteLampadaire'), h.mat('lampe', LUMI), tetes); }
      bloc(h.mat('lettres', {}, 'ГЭС'), 205, 385, 12, 12.4, 46, 86);
      h.pose('tourControle', { beton: bet, vitre: h.mat('vitreSombre'), acier: h.mat('matGris') }, h.scene, [-292, 116, 110]);
      // --- le pont d'acier au pied du mur (pts 10-11) : tablier, deux poutres-treillis, piles sur les berges ; un pont de béton sur la rivière à la ligne de départ ---
      { const y = yA(0, 245); bloc(betS, -80, 80, 235, 255, y - 2.2, y - 0.3); for (const x of [-30, 30]) bloc(bet, x - 2, x + 2, 238, 252, 0, y - 2.2);
        for (const sd of [-1, 1]) { const gr = new THREE.Group(); gr.position.set(0, y - 0.3, 245 + sd * (W + 0.9)); h.scene.add(gr); h.pose('treillisPont', { acier: orange }, gr, [0, 0, 0], 152); } }
      { const y = yA(0, 430); bloc(betS, -34, 34, 420, 440, y - 1.8, y - 0.3); }
      // --- la vallée : silos, cabane de garde, pylônes haute tension, peupliers ---
      inst(h, h.geo('silo'), h.mat('betonGES', {}, '#a4a69e'), [[-170, 9, 330], [-156, 9, 330], [-142, 9, 330]]);
      h.pose('cabane', { beton: h.mat('betonGES', {}, '#b8b4a4'), toit: h.mat('toleOrange', {}, '#b5483c'), vitre: h.mat('lampe', LUMI) }, h.scene, [262, 9.5, 446]);
      const py = []; for (const [x0, z0, dx, dz] of [[120, 300, 0, 130], [-230, 340, -40, 130]]) for (let k = 0; k < 7; k++) { const x = x0 + dx * k, z = z0 + dz * k; if (g.dAt(x, z) > W + 14) py.push([x, g.hAt(x, z), z, Math.atan2(dx, dz), 1]); }
      insts(h, 'pyloneHT', { acier: h.mat('matGris'), feu: h.mat('feuRouge', LUMI) }, py);
      const ced = []; for (let k = 0; k < 260; k++) { const x = -520 + rnd() * 1300, z = 250 + rnd() * 700; if (g.dAt(x, z) > W + 9 && Math.abs(x) > 34 && !bassin(x, z) && !(x > -180 && x < -130 && Math.abs(z - 330) < 12)) ced.push([x, g.hAt(x, z) + 7, z, rnd() * 6, 0.7 + rnd() * 0.5]); }
      inst(h, h.geo('cedre'), h.mat('cedre'), ced);
      // les gerbes coulent : la texture défile le long de la chute ; la brume ondule
      return (dt, now) => { gerbe.map.offset.y = -(now * 0.0011 % 1); brume.map.offset.x = Math.sin(now * 0.0004) * 0.05; };
    },
    // ---------- Matin sur la Chapada (V2) : campo rupestre et hameau de pierre sèche (Igatu) sur le plateau, mesas au loin, épingles entre des falaises de grès en strates,
    // galerie derrière la grande chute, gué sur les dalles, pont suspendu dans la brume, forêt de galerie en étages, arche de roche. Fiches : docs/REFS-chapada.md ----------
    // Le circuit est parcouru en sens horaire : sa droite est l'intérieur (le massif du centre). La gorge (pts 12 à 23) court d'est en ouest, la rivière au sud de la route.
    // Aucun ruban n'est posé à plat sur le terrain : ses mailles de 8 m le perçaient en festons (les « vagues » de la V1). Le bas-côté est un ruban en pente douce
    // depuis la chaussée, et le terrain est tenu 0,35 m sous lui (creux) ; les parois sont des maillages en strates, au sommet plat.
    chapada(h) {
      const { THREE, S, N, W, rnd } = h, P = k => pt(h, k >= 2 ? k + 2 : k), // deux points ajoutés après le point 1 (la chicane du plateau) : le décor garde la numérotation d'avant
         DS = { side: THREE.DoubleSide }, IX = new Map(S.map((s, i) => [s, i]));
      const dans = (i, a, b) => ((i - P(a) + N) % N) <= ((P(b) - P(a) + N) % N); // échantillon i entre les points a et b
      const entre = (i, a, b) => ((i - a + N) % N) <= ((b - a + N) % N); // idem, entre deux échantillons
      const lisse = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      const bruit = () => { const v = Float32Array.from({ length: 512 }, rnd); return x => { const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f), a = v[(i % 512 + 512) % 512], b = v[((i + 1) % 512 + 512) % 512]; return a + (b - a) * t; }; };
      const h2 = (a, b) => { const t = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return t - Math.floor(t); };
      const n2 = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), u = lisse(0, 1, x - ix), v = lisse(0, 1, z - iz); return (h2(ix, iz) * (1 - u) + h2(ix + 1, iz) * u) * (1 - v) + (h2(ix, iz + 1) * (1 - u) + h2(ix + 1, iz + 1) * u) * v; };
      const COL = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; }, mix = (a, b, t) => a.map((v, j) => v + (b[j] - v) * t);
      const SUB = []; for (let i = 0; i < N; i += 3) SUB.push(i);
      // échantillon le plus proche (affiné à pleine résolution), écart en travers de l'axe, côté (1 = à droite, vers l'intérieur)
      const proche = (x, z) => { let b = 0, bd = 1e18; for (const i of SUB) { const s = S[i], d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = i; } }
        for (let j = b - 2; j <= b + 2; j++) { const i = (j + N) % N, s = S[i], d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = i; } }
        const s = S[b], n = (z - s.z) * s.tx - (x - s.x) * s.tz; return { i: b, s, d: Math.max(Math.abs(n), Math.sqrt(bd) - 3), cote: n > 0 ? 1 : -1 }; };
      const poly = h.M.pts.map(p => [p[0] * h.M.sc, p[1] * h.M.sc]), dedans = (x, z) => { let c = false; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const [xa, za] = poly[a], [xb, zb] = poly[b]; if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) c = !c; } return c; };
      // la rivière : son niveau sous la route, 3,5 m dans la gorge, à fleur au gué (pts 15 à 19, où elle passe sur la route)
      const iF0 = P(15), iF1 = P(19), iB0 = P(21), iB1 = P(22), dF = i => dans(i, 15, 19) ? 0 : Math.min((iF0 - i + N) % N, (i - iF1 + N) % N), dG = i => Math.min((i - P(13) + N) % N, (P(13) - i + N) % N), niv = i => -0.3 - 3.2 * lisse(0, 40, dF(i)) * lisse(40, 80, dG(i)), nivS = s => niv(IX.get(s)); // au pied de la grande chute, le bassin monte à fleur de route
      const g0 = (iF0 - 30 + N) % N, g1 = (iF1 + 30) % N, p0 = (iB0 - 4 + N) % N, p1 = (iB1 + 4) % N;
      const xEst = Math.max(...poly.map(p => p[0])), sb = S[(iB0 + ((iB1 - iB0 + N) % N >> 1)) % N]; // l'extrémité est des épingles ; le milieu du pont
      const ravin = (x, z) => { const u = (x - sb.x) * sb.tx + (z - sb.z) * sb.tz, v = (z - sb.z) * sb.tx - (x - sb.x) * sb.tz; return lisse(60, 36, Math.abs(u)) * lisse(170, 130, Math.abs(v)); }; // le torrent sous le pont, en travers
      const amont = s => s.tx < 0 ? 1 : -1, paroiLacet = i => dans(i, 3, 12) && Math.abs(S[i].tx) > 0.6; // dans les lacets, le côté de la pente qui monte ; les tronçons droits portent une falaise
      const zone = i => dans(i, 29, 3) ? 'plateau' : dans(i, 3, 12) ? 'lacets' : dans(i, 12, 23) ? 'gorge' : 'foret';
      // le bas-côté : largeur (m) et texture, de chaque côté ; 0 = pas de bas-côté (la rivière, le gué, le pont)
      const acc = (i, sd) => { const zn = zone(i); if (entre(i, g0, g1) || entre(i, p0, p1)) return 0;
        if (zn === 'plateau') return 6; if (zn === 'lacets') return sd === amont(S[i]) ? (paroiLacet(i) ? 1.5 : 4) : 5; if (zn === 'gorge') return sd > 0 ? 6 : 0; return 10; };
      const A = e => -0.04 - 0.05 * e; // hauteur du bas-côté sous la chaussée, à e m du bord
      const creux = (x, z, y) => { const { i, s, d, cote } = proche(x, z), w = s.w; let r = 0;
        if (dans(i, 12, 23) && (cote < 0 || dF(i) < 20) && d > w + 0.5) { r = Math.max(0, y - (s.y + niv(i) - 1.2)) * lisse(w + 0.5, w + 2.5, d); // le lit de la rivière, creusé dès le bord : à 9 m, le terrain passait au-dessus de l'eau et la cachait
          if (cote < 0 && d > w + 52) r -= Math.min(75, (d - w - 52) * 2.2); } // au-delà, la paroi d'en face
        else if (dedans(x, z) && d > 30) r -= Math.min(45, (d - 30) * 0.8); // le massif du centre
        if (x > xEst - 40) r += Math.min(90, (x - xEst + 40) * 0.9) * lisse(w + 4, w + 14, d); // à l'est des épingles, le vide
        const k = ravin(x, z); if (k > 0) r = Math.max(r, (y - (sb.y - 15)) * k);
        const a = acc(i, cote), e = Math.max(0, d - w); if (a && e < a + 60) r = Math.max(r, y - (s.y + A(Math.min(e, a)) - 0.35 + Math.max(0, e - a - 2) * 0.7)); // jamais au-dessus du bas-côté, puis une rampe (pas de marche)
        return r; };
      const g = terrain(h, { pas: 12, marge: 180, creux, mat: h.mat('bruit', { vertexColors: true }, '#d0cec6', ['#c0beb6', '#e0ded6', '#b0aea6']) });
      // le sol prend sa couleur du lieu : campo ocre-gris et olive au plateau, herbe et roche ailleurs (la roche là où ça monte raide), litière en forêt, dalles au fond de la rivière
      { const ge = g.mesh.geometry, p = ge.attributes.position, nr = ge.attributes.normal, C = new Float32Array(p.count * 3);
        const campo = [COL('#b09a78'), COL('#7f8b4a'), COL('#9a8a6a')], vert = [COL('#3a5a30'), COL('#2f4a2c'), COL('#4a6a34')], roc = COL('#7d7062'), litiere = COL('#3e3a26'), dalle = COL('#8a6a4a');
        for (let v = 0; v < p.count; v++) { const x = p.getX(v), y = p.getY(v), z = p.getZ(v), q = proche(x, z), zn = zone(q.i), t = n2(x / 30, z / 30), u = n2(x / 9 + 50, z / 9);
          let c = zn === 'plateau' ? mix(mix(mix(mix(campo[0], campo[1], lisse(0.45, 0.7, t)), campo[2], u * 0.5), COL('#4a4236'), lisse(0.72, 0.8, n2(x / 17 + 9, z / 17))), COL('#c8bca0'), lisse(0.75, 0.85, n2(x / 11 + 30, z / 11))) : zn === 'foret' ? mix(litiere, vert[1], lisse(0.4, 0.8, t)) : mix(vert[0], vert[2], t);
          if ((zn === 'gorge' && q.cote < 0 && y < q.s.y + niv(q.i) - 0.5) || ravin(x, z) > 0.3) c = dalle; // le lit de la rivière et le ravin du pont
          c = mix(c, roc, lisse(0.85, 0.6, nr.getY(v))); const k = 0.85 + 0.3 * u; C.set([c[0] * k, c[1] * k, c[2] * k], v * 3); }
        ge.setAttribute('color', new THREE.BufferAttribute(C, 3)); }
      const eau = h.mat('eauPoco', { ...DS, lum: 1, rep: [5, 1], c: 0xd0d0d0 }), bois = h.mat('tronc'), planches = h.mat('planches', DS), mousse = h.mat('feuillage', { c: 0x8aa850 });
      const gres = h.mat('grainGres', { vertexColors: true, emissive: 0x3a342c, ...DS }), pierre = h.mat('pierreSeche'), pierreR = h.mat('pierreSeche', { rep: [0.35, 1] }, 1);
      const chuteM = h.mat('chute', { ...DS, lum: 1, c: 0xccd8d8, transparent: true, depthWrite: false, rep: [6, 1] }), lisseBord = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 };
      const tranche = (a, b, f) => { const l = (b - a + N) % N; f((a + N) % N, l); }; // ruban de l'échantillon a à b

      // ---------- extrusion d'un profil le long de la route : prof(i, s) = liste de [écart à l'axe, hauteur sur s.y, couleur], null = arête vive (deux bandes sans sommet commun) ----------
      const extrude = (i0, cnt, sd, prof, m = gres, st = 2) => {
        const pos = [], col = [], uv = [], idx = []; let prev = null;
        for (let k = 0; ; k += st) { if (k > cnt) k = cnt; const i = (i0 + k) % N, s = S[i], L = prof(i, s), cur = [];
          for (const p of L) { if (!p) { cur.push(-1); continue; } const [x, z] = bord(s, sd, p[0]); cur.push(pos.length / 3); pos.push(x, s.y + p[1], z); col.push(...p[2]); uv.push(k / 3, p[1] / 6); }
          if (prev) for (let j = 0; j + 1 < cur.length; j++) { const a = prev[j], b = prev[j + 1], c = cur[j], d = cur[j + 1]; if (a >= 0 && b >= 0 && c >= 0 && d >= 0) idx.push(a, c, b, b, c, d); }
          prev = cur; if (k === cnt) break; }
        const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals();
        const me = new THREE.Mesh(ge, m); me.receiveShadow = true; h.scene.add(me); return me; }; // sans ombre portée : à la résolution de la carte d'ombre, celle des falaises barrait la route en damier
      // REFS 1 : une falaise de grès en bancs horizontaux. o0(s) = écart du pied à l'axe, Hf(i) = hauteur du sommet (plat : les bancs au-dessus sont rabotés),
      // y0(s) = hauteur du pied. Chaque banc a son épaisseur, son retrait (corniche ou surplomb) et sa teinte ; des contreforts et des couloirs en plan ; des coulures noires.
      // corniche(i, s, o, y) : appelé sur les replats, pour y poser fougères et broméliacées
      const PALG = ['#b59a78', '#9a8a70', '#8a8478', '#a07a58', '#9a5b3a', '#7d7468', '#a89478'];
      const falaise = (o0, Hf, y0 = () => -1.5, corniche, Hmax = 90) => {
        const ep = [], rec = [], tc = []; for (let k = 0, y = 0; y < Hmax; k++) { ep.push(2 + rnd() * 4.5); rec.push((rnd() - 0.35) * 4.5); tc.push(COL(PALG[rnd() * PALG.length | 0], (k % 2 ? 0.72 : 1.12) * (0.9 + rnd() * 0.2))); y += ep[k]; } // un banc sur deux plus sombre : les strates se lisent de loin // des bancs plus fins : plus de joints à l'écran
        const nA = bruit(), nB = bruit(), nC = bruit(), joint = COL('#3a3532'), mo = COL('#5f7a3a');
        return (i, s) => { const H = Hf(i), b0 = y0(s), base = o0(s) + 3.5 * nA(i * 0.03) + 3.5 * nB(i * 0.22) ** 2, noir = lisse(0.6, 0.68, nC(i * 0.12)), L = []; let y = b0, o = base;
          for (let k = 0; k < ep.length; k++) { const dy = k ? 1.6 * (nA(i * 0.025 + k * 7) - 0.5) : 0, dz = 1.6 * (nA(i * 0.025 + k * 7 + 7) - 0.5), ya = Math.min(H, y + dy), yb = Math.min(H, y + ep[k] + dz), ob = base + rec[k] + 0.8 * (nB(i * 0.09 + k * 17) - 0.5), f = 1 - 0.85 * noir;
            if (k) L.push([o, ya, ob > o ? mo : joint], [ob + 0.3, ya, ob > o ? mo : joint], null); // le replat (vert) ou le dessous du surplomb (sombre)
            if (corniche && k && ob > o + 0.5 && ya < H - 1 && rnd() < 0.05) corniche(i, s, (o + ob) / 2, ya);
            L.push([ob + 0.3, ya, tc[k].map(v => v * 0.3 * f)], [ob + 0.28, Math.min(yb, ya + 0.9), tc[k].map(v => v * 0.4 * f)], [ob - 0.25, yb, tc[k].map(v => v * f)], null); o = ob - 0.25; y += ep[k]; } // chaque banc : le joint sombre, puis la pierre qui s'éclaircit vers le haut
          const c = tc[(i >> 6) % tc.length]; L.push([o, H - 1.8, joint], [o - 1.6, H - 1.8, joint], null, [o - 1.6, H - 1.8, c.map(v => v * 0.7)], [o - 1.6, H, c], null, [o - 1.6, H, mo], [o + 9, H + 0.4, mix(mo, joint, 0.3)]); return L; }; }; // la corniche en saillie au sommet

      // ---------- la route : chaussée à la demi-largeur réelle (s.w) ; au gué, des dalles sur les bords et l'eau au milieu ; au pont, des planches ----------
      const chaussee = h.mat('chaussee', { side: THREE.DoubleSide, gloss: 0.08, ...lisseBord }, ...h.TH.route), glis = h.mat('glissiere', DS, h.TH.mur);
      for (const [a, b] of [[g1, p0], [p1, g0]]) tranche(a, b, (i, l) => h.ribbon(i, l, s => -s.w, 0, s => s.w, 0, chaussee, 32));
      const gueM = h.mat('eauGue', { ...DS, lum: 1, c: 0xf0e8dc, ...lisseBord }); // au centre du gué, l'eau peu profonde, ambre et plus claire que les berges tranche(iF0, iF1, (i, l) => h.ribbon(i, l, -W, 0.04, W, 0.04, gueM, 12)); // le courant passe au milieu
      tranche(g0, g1, (i, l) => { for (const sd of [-1, 1]) h.ribbon(i, l, sd * W, 0.03, s => sd * s.w, 0.03, h.mat('lajedo', { ...DS, ...lisseBord, rep: [2, 1], c: 0xb8b4a8 }), 6); }); // REFS 3 : les bords secs du gué sont des dalles de grès
      { const ecu = h.mat('peinture', { lum: 1, c: 0xf2efe6, transparent: true, opacity: 0.75, depthWrite: false, ...lisseBord, side: THREE.DoubleSide }); // l'écume crème au bord du courant
        tranche(iF0, iF1, (i, l) => { for (const sd of [-1, 1]) h.ribbon(i, l, sd * (W - 0.25), 0.06, sd * (W + 0.45), 0.06, ecu, 6); }); }
      // le bas-côté, en pente douce depuis le bord de la chaussée, par tronçons de même largeur et de même sol
      const solM = { plateau: h.mat('campoSol', { rep: [3, 1] }), lacets: h.mat('herbeRoche', { rep: [1, 1] }), gorge: h.mat('herbeRoche', { rep: [1, 1] }), foret: h.mat('litiere', { rep: [2, 1] }) };
      for (const sd of [-1, 1]) { let deb = -1, cle = ''; for (let i = 0; i <= N; i++) { const j = i % N, a = acc(j, sd), c = a ? zone(j) + a : '';
        if (c !== cle || i === N) { if (cle) { const a0 = acc(deb, sd), zn = zone(deb); h.ribbon(deb, (i - deb), s => sd * s.w, A(0), s => sd * (s.w + a0), A(a0), solM[zn], 6); } deb = j; cle = c; } } }
      // le bord : au plateau un muret de pierre sèche (REFS 5) ; ailleurs le garde-corps de bois ; rien au gué (des galets marquent le bord) ni au pont
      for (const sd of [-1, 1]) tranche(g1, g0, (i0, l) => { let deb = i0, pl = dans(i0, 29, 3), pont = entre(i0, p0, p1);
        for (let k = 1; k <= l; k++) { const i = (i0 + k) % N, a = dans(i, 29, 3), b = entre(i, p0, p1); if (a !== pl || b !== pont || k === l) { const n = (i - deb + N) % N;
          if (!pont) { if (pl) { h.ribbon(deb, n, s => sd * (s.w + 0.35), 0.95, s => sd * (s.w + 0.35), -0.6, pierreR, 4); h.ribbon(deb, n, s => sd * (s.w + 0.35), 0.95, s => sd * (s.w + 0.95), 0.95, pierreR, 4); }
            else h.ribbon(deb, n, s => sd * s.w, 1, s => sd * s.w, -2, glis); }
          deb = i; pl = a; pont = b; } } });

      // ---------- la rivière, la paroi d'en face et ses chutes (gorge, pts 12 à 23) ----------
      tranche(P(12) - 20, iB0 - 8, (i, l) => h.ribbon(i, l, s => -(s.w + 1), nivS, s => -(s.w + 54), nivS, eau, 12));
      tranche(iF0 - 20, iF1 + 20, (i, l) => h.ribbon(i, l, s => s.w + 1, nivS, s => s.w + 45, nivS, eau, 12));
      const corn = [], cornB = []; // fougères et broméliacées sur les replats des falaises
      const surCorniche = sd => (i, s, o, y) => { const [x, z] = bord(s, sd, o); (rnd() < 0.6 ? corn : cornB).push([x, s.y + y, z, rnd() * 6, 0.6 + rnd() * 0.5]); };
      { const nH = bruit(); tranche(P(12) - 30, P(23) + 20, (i, l) => extrude(i, l, -1, falaise(s => s.w + 54, j => 52 + 14 * nH(j * 0.012), s => nivS(s) - 1, surCorniche(-1), 62), gres, 4)); }
      // REFS 2 : trois chutes fines qui descendent la paroi d'en face, chacune avec sa vasque de brume et ses blocs au pied
      const chutes = []; for (const [k, f] of [[12, 0.6], [17, 0.3], [20, 0.7]]) { const i = (P(k) + Math.round(((P(k + 1) - P(k) + N) % N) * f)) % N; h.ribbon(i, 5, s => -(s.w + 51), nivS, s => -(s.w + 51), 56, chuteM, 12); chutes.push(i); }
      // galets du gué (le mur de la simulation y est), blocs et dalles dans la rivière
      const galets = [], blocs = [], coupes = [], fbas = []; for (let i = g0; entre(i, g0, g1); i = (i + 6) % N) for (const sd of [-1, 1]) { const s = S[i], [x, z] = bord(s, sd, s.w + 0.5); galets.push([x, s.y, z, rnd() * 6, 0.6 + rnd() * 0.7, 0.25 + rnd() * 0.25]); } // galets espacés : en rangée serrée, ils faisaient un talus brun le long de la route
      for (let k = 0; k < 260; k++) { const i = (P(12) + (rnd() * ((P(23) - P(12) + N) % N) | 0)) % N, s = S[i], o = s.w + 4 + rnd() * 49, [x, z] = bord(s, -1, o), t = rnd();
        (t < 0.7 ? galets : blocs).push([x, s.y + niv(i) + (t < 0.7 ? 0 : 0.3), z, rnd() * 6, ...(t < 0.7 ? [0.8 + rnd() * 2.5, 0.3 + rnd() * 0.5] : [1 + rnd() * 2.5, 0.6 + rnd() * 1.4, 1 + rnd() * 2.5])]); }
      for (const i of chutes) for (let k = 0; k < 14; k++) { const s = S[(i + (rnd() * 12 | 0)) % N], [x, z] = bord(s, -1, s.w + 44 + rnd() * 8); blocs.push([x, s.y + niv(i) - 0.5, z, rnd() * 6, 1.5 + rnd() * 3, 1 + rnd() * 2, 1.5 + rnd() * 3]); }
      insts(h, 'troncCouche', { bois }, [[iF0 + 10, 1, 16], [iF1 - 6, -1, 20], [iF0 + 30, -1, 30], [P(13) + 40, -1, 25], [iB0 - 30, -1, 14]].map(([i, sd, off]) => { const s = S[i % N], [x, z] = bord(s, sd, s.w + off); return [x, s.y + niv(i % N) + 0.2, z, rnd() * 6, 0.9 + rnd() * 0.4]; }), { a: [12] });
      // au gué, des dalles plates qui affleurent dans le courant, en marches basses
      const dalles = []; for (let k = 0; k < 70; k++) { const i = (g0 + (rnd() * ((g1 - g0 + N) % N) | 0)) % N, s = S[i], sd = rnd() < 0.5 ? -1 : 1, [x, z] = bord(s, sd, s.w + 2 + rnd() * 35); dalles.push([x, s.y + niv(i) - 0.05, z, rnd() * 6, 2 + rnd() * 5, 0.3, 2 + rnd() * 4]); }
      for (let k = 0; k < 60; k++) { const i = (g0 + (rnd() * ((g1 - g0 + N) % N) | 0)) % N, s = S[i], sd = rnd() < 0.5 ? -1 : 1, [x, z] = bord(s, sd, s.w + 2 + rnd() * 14), t = rnd(); // rochers et îlots de rive, avec leurs fougères
        blocs.push([x, s.y + niv(i) - 0.3, z, rnd() * 6, 0.8 + rnd() * 2, 0.6 + rnd() * 1.2, 0.8 + rnd() * 2]); if (t < 0.4) fbas.push([x, s.y + niv(i) + 0.6, z, rnd() * 6, 0.8]); else if (t < 0.55) coupes.push([x, s.y + niv(i) + 0.6, z, rnd() * 6, 0.9]); }
      for (let i = iF0; entre(i, iF0, iF1); i = (i + 3) % N) for (const sd of [-1, 1]) { const s = S[i]; // REFS 3 : au bord du courant, des dalles pâles en marches basses et des galets
        if (rnd() < 0.7) { const [x, z] = bord(s, sd, W + 0.6 + rnd() * 1.5); dalles.push([x, s.y + 0.02, z, h.across(s) + (rnd() - 0.5) * 0.6, 1.2 + rnd() * 1.6, 0.12, 0.8 + rnd() * 1.2]); }
        if (rnd() < 0.5) { const [x, z] = bord(s, sd, W - 0.4 - rnd() * 1.2); galets.push([x, s.y + 0.02, z, rnd() * 6, 0.3 + rnd() * 0.4, 0.12 + rnd() * 0.1]); } }
      inst(h, h.geo('boite', 1, 1, 1), h.mat('lajedo', { c: 0x9a8070 }), dalles);
      const rive = []; for (let i = g0; entre(i, g0, g1); i = (i + 3) % N) for (const sd of [-1, 1]) { const s = S[i], o = sd > 0 ? s.w + 44 + rnd() * 3 : s.w + 50 + rnd() * 3, [x, z] = bord(s, sd, o); blocs.push([x, s.y + niv(i) - 0.2, z, rnd() * 6, 1 + rnd() * 2, 0.8 + rnd() * 1.2, 1 + rnd() * 2]); if (rnd() < 0.6) (rnd() < 0.5 ? fbas : coupes).push([x, s.y + niv(i) + 0.8, z, rnd() * 6, 1 + rnd() * 0.6]); if (rnd() < 0.15) rive.push([x, s.y + niv(i), z]); } // les rives du gué

      // ---------- les épingles (pts 3 à 12) : une falaise en strates côté amont sur chaque tronçon droit, garde-corps et vide côté aval ----------
      { let deb = -1; const nH = bruit();
        for (let i = P(3); i !== (P(12) + 2) % N; i = (i + 1) % N) { const run = paroiLacet(i) && (deb < 0 || amont(S[i]) === amont(S[deb]));
          if (run && deb < 0) deb = i; if (!run && deb >= 0) { const sd = amont(S[deb]), a = deb, l = (i - deb + N) % N; for (let j = 0; j < l; j += 3) if (rnd() < 0.6) { const s = S[(a + j) % N], [x, z] = bord(s, sd, s.w + 1.6 + rnd() * 2.5); blocs.push([x, s.y - 0.3, z, rnd() * 6, 0.6 + rnd() * 1.2, 0.5 + rnd() * 1, 0.6 + rnd() * 1.2]); if (rnd() < 0.4) fbas.push([x, s.y - 0.1, z, rnd() * 6, 0.7]); } // l'éboulis au pied
            extrude(a, l, sd, falaise(s => s.w + 1.5, j => (10 + 9 * nH(j * 0.01)) * lisse(0, 14, Math.min((j - a + N) % N, (a + l - j + N) % N)) + 1, undefined, surCorniche(sd), 22), gres, 3); deb = paroiLacet(i) ? i : -1; } } }

      // ---------- la galerie (pts 12 à 14) : la falaise au nord, une voûte de roche moussue au-dessus de la route, la grande chute de 44 m qui tombe devant elle ----------
      const i13 = P(13), gal0 = (i13 - 55 + N) % N, gal1 = (i13 + 55) % N;
      tranche(P(12) - 20, P(14) + 10, (i, l) => extrude(i, l, 1, falaise(s => s.w + 2, () => 44, undefined, surCorniche(1), 46)));
      { const nV = bruit(), sombre = COL('#8a7660'), mo = COL('#6f8a3a'), mo2 = COL('#4f6a2e'); // le dessous de la voûte : des bancs en surplomb, irréguliers ; le dessus moussu
        tranche(gal0 - 10, gal1 + 10, (i, l) => extrude(i, l, 1, (j, s) => { const t = Math.min((j - i + N) % N, (i + l - j + N) % N), e = lisse(0, 10, t), b = 7.2 + 1.6 * nV(j * 0.08);
          return [[s.w + 1.2, 6.5, sombre], [s.w * 0.3, b + 0.6 * nV(j * 0.2 + 9), sombre.map(v => v * 0.8)], [-(s.w + 1) * e, b + 0.5 * e + 0.4 * nV(j * 0.15 + 3), sombre], [-(s.w + 3.8) * e, 8.5 * e + 2, mix(sombre, mo2, 0.5)], null,
            [-(s.w + 3.8) * e, 8.5 * e + 2, mo2], [-(s.w + 3.8) * e, 11 * e + 2, mo], [s.w * 0.2, 12.5 + nV(j * 0.1 + 5), mo], [s.w + 3, 14, mo2]]; })); }
      // (pas de rideau texturé derrière les filets : il faisait une grille de pixels)
      tranche(gal0 - 6, gal1 + 6, (i, l) => extrude(i, l, -1, falaise(s => s.w + 13, () => 46, s => nivS(s) - 1, undefined, 50))); // REFS 2 : l'alcôve, la roche sombre derrière la chute
      { const nL = bruit(), c1 = COL('#8a7660'), c2 = COL('#a89478'), mo = COL('#6f8a3a'); // REFS 2 : la lèvre de la corniche d'où tombe la chute, en surplomb au-dessus du rideau
        tranche(gal0 - 30, gal1 + 30, (i, l) => extrude(i, l, -1, (j, s) => { const e = lisse(0, 25, Math.min((j - i + N) % N, (i + l - j + N) % N)), y = 43 + 2 * nL(j * 0.05);
          return [[s.w + 13 - 3 * e, y - 1, c1], [s.w + 7 - 1.5 * e, y - 0.5, c1], [s.w + 7 - 1.5 * e, y + 2.5, c2], [s.w + 20, y + 4, mo]]; })); }
      { const fil = [], ecume = []; for (let i = gal0; entre(i, gal0, gal1); i = (i + 1) % N) { const s = S[i]; if (rnd() < 0.8) continue;
          for (const o of [8, 9.6]) { const [x, z] = bord(s, -1, s.w + o + rnd() * 0.6), y0 = s.y + niv(i), hh = 44 - niv(i); fil.push([x, y0 + hh / 2, z, h.across(s), 0.8 + rnd() * 1.6, hh, 1, rnd() < 0.5 ? 0xeef4f4 : rnd() < 0.5 ? 0xa8bcc2 : 0x7a8c94]); } // des filets clairs et sombres : un rideau strié
          if (rnd() < 0.2) { const [x, z] = bord(s, -1, s.w + 7 + rnd() * 4); ecume.push([x, s.y + niv(i) + 0.4, z, rnd() * 6, 2 + rnd() * 3, 0.8 + rnd(), 2 + rnd() * 3]); } }
        const pf = new THREE.PlaneGeometry(1, 1); const mf = inst(h, pf, h.mat('peinture', { lum: 1, c: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }), fil); fil.forEach((p, k) => mf.setColorAt(k, new THREE.Color(p[7]))); mf.castShadow = false;
        inst(h, h.geo('cime'), h.mat('peinture', { c: 0xc8d0d0 }), ecume.map(p => [p[0], p[1], p[2], p[3], p[4] / 5, p[5] / 6, p[6] / 5])); // l'écume au pied
        tranche(gal0, gal1, (i, l) => h.ribbon(i, l, s => -(s.w + 6.5), s => nivS(s) + 0.15, s => -(s.w + 11.5), s => nivS(s) + 0.15, h.mat('peinture', { lum: 1, c: 0xeef2f0, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide }), 6)); // l'écume au pied du rideau
        for (let k = 0; k < 4; k++) { const i = (gal0 + Math.round((k + 0.5) / 4 * ((gal1 - gal0 + N) % N))) % N, s = S[i], [x, z] = bord(s, -1, s.w + 2); h.lum(i, x, s.y + 4, z, 0xcfe8e4, 26, 0.7); } } // le jour qui traverse l'eau
      // à l'entrée, un voile d'eau en travers de la route : on le traverse, la vue se coupe un instant
      { const s = S[(gal0 + 6) % N], vg = new THREE.PlaneGeometry(7, 2 * s.w + 8); vg.rotateZ(Math.PI / 2); const v = new THREE.Mesh(vg, chuteM); v.position.set(s.x, s.y + 4, s.z); v.rotation.y = h.across(s); h.scene.add(v); }
      // le bassin au pied de la chute : des blocs ronds dans l'écume
      for (let k = 0; k < 40; k++) { const i = (gal0 + (rnd() * ((gal1 - gal0 + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, -1, s.w + 7 + rnd() * 20); blocs.push([x, s.y + niv(i) - 0.4, z, rnd() * 6, 1.2 + rnd() * 2.5, 0.8 + rnd() * 1.5, 1.2 + rnd() * 2.5]); }
      // embruns : des gouttes qui montent du pied de la chute et traversent la galerie
      const NE = 600, pe = new Float32Array(NE * 3), ge = new THREE.BufferGeometry(), base = [];
      for (let k = 0; k < NE; k++) { const i = (gal0 + (rnd() * ((gal1 - gal0 + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, -1, s.w * (rnd() * 2 - 0.2) + 2); base.push([x, s.y, z]); pe.set([x, s.y + rnd() * 9, z], k * 3); }
      ge.setAttribute('position', new THREE.BufferAttribute(pe, 3));
      const embruns = new THREE.Points(ge, new THREE.PointsMaterial({ color: 0xf4faf7, size: 0.6, map: h.mat('brume').map, transparent: true, opacity: 0.45, depthWrite: false })); embruns.frustumCulled = false; h.scene.add(embruns);

      // ---------- le pont suspendu (pts 21 à 22) : tablier de planches, pylônes de bois, câbles d'acier ; le ravin du torrent dessous ----------
      tranche(p0, p1, (i, l) => { h.ribbon(i, l, s => -s.w, 0.04, s => s.w, 0.04, planches, 4); h.ribbon(i, l, s => -s.w - 0.3, -0.7, s => s.w + 0.3, -0.7, planches, 4);
        for (const sd of [-1, 1]) h.ribbon(i, l, s => sd * (s.w + 0.3), 0.1, s => sd * (s.w + 0.3), -0.7, bois, 8); });
      { const rv = new THREE.Group(); rv.position.set(sb.x, sb.y - 13.5, sb.z); rv.rotation.y = h.across(sb); h.scene.add(rv); h.pose('boite', eau, rv, [0, 0, 0], 300, 0.3, 30);
        for (let k = 0; k < 50; k++) { const u = (rnd() - 0.5) * 280, v = (rnd() - 0.5) * 26; // des blocs dans le torrent, en travers de la route
          const bx = sb.x + (-sb.tz) * u + sb.tx * v, bz = sb.z + sb.tx * u + sb.tz * v; blocs.push([bx, sb.y - 13.6, bz, rnd() * 6, 1.5 + rnd() * 3, 1 + rnd() * 2.5, 1.5 + rnd() * 3]); } }
      const pyl = [iB0 - 3, iB1 + 3].map(i => S[(i + N) % N]), feuP = h.mat('peinture', { lum: 1, c: 0xffb45a }); for (const s of pyl) { const r = repere(h, s); h.pose('pyloneBois', { bois, beton: h.mat('beton') }, r, [0, 0, 0], W); for (const sd of [-1, 1]) h.pose('boite', feuP, r, [sd * (W + 0.7), 7.2, -0.6], 0.4, 0.5, 0.4); h.lum(IX.get(s), s.x, s.y + 7, s.z, 0xffb45a, 24, 0.6); }
      { const L = [], A3 = (i, sd, off, y) => { const s = S[(i + N) % N], [x, z] = bord(s, sd, off); return [x, s.y + y, z]; }, nb = (iB1 + 3 - (iB0 - 3) + N) % N;
        for (const sd of [-1, 1]) { const o = W + 0.7;
          for (let k = 0; k < nb; k++) { const t0 = k / nb, t1 = (k + 1) / nb, y = t => 8.6 - 7.4 * 4 * t * (1 - t), i = iB0 - 3 + k; L.push(...A3(i, sd, o, y(t0)), ...A3(i + 1, sd, o, y(t1)), ...A3(i, sd, o, 1.05), ...A3(i + 1, sd, o, 1.05)); // câble porteur et main courante
            if (k % 2 === 0) L.push(...A3(i, sd, o, y(t0)), ...A3(i, sd, o - 0.2, 0.1)); } // suspentes
          for (const [i, dir] of [[iB0 - 3, -1], [iB1 + 3, 1]]) L.push(...A3(i, sd, o, 8.6), ...A3(i + dir * 9, sd, o + 2, -0.5)); } // haubans d'ancrage
        const acierM = h.mat('matGris', { c: 0xd8dce0 }); for (const sd of [-1, 1]) for (const y of [t => 8.6 - 7.4 * 4 * t * (1 - t), () => 1.05]) { // câble porteur et main courante en tubes (les traits d'un pixel ne se voyaient pas)
          const C = []; for (let k = 0; k <= nb; k += 2) C.push(new THREE.Vector3(...A3(iB0 - 3 + k, sd, W + 0.7, y(k / nb))));
          h.scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(C), nb, 0.3, 5), acierM)); }
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(L, 3)); const ls = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x6c7075 })); ls.userData.cables = 1; h.scene.add(ls); }

      // ---------- l'arche de roche (pt 31) : la dernière ligne droite passe dessous ----------
      { const s = S[P(32)]; h.pose('archeRoche', { roche: h.mat('grainGres', { c: 0xb59a78 }), rouille: h.mat('grainGres', { c: 0x8a6a52 }), joint: h.mat('grainGres', { c: 0x2f2a26 }), gris: h.mat('grainGres', { c: 0x8a8478 }), mousse }, repere(h, s), [0, 0, 0], s.w);
        for (let k = 0; k < 14; k++) { const u = (rnd() - 0.5) * 2 * (s.w + 12), v = (rnd() - 0.5) * 9; (rnd() < 0.5 ? fbas : coupes).push([s.x - s.tz * u + s.tx * v, s.y + 23.8, s.z + s.tx * u + s.tz * v, rnd() * 6, 1 + rnd() * 0.6]); } } // fougères et broméliacées sur le dessus
      // panneaux de bois, repères de freinage (une planche à flèches, 90 m avant chaque épingle, au gué et au pont), cairns
      const plaques = new Map(), panneau = (i, sd, txt) => { const s = S[(i + N) % N]; if (!plaques.has(txt)) plaques.set(txt, h.mat('ecrit', {}, 128, 40, '#5a3e20', '#ede6cf', txt, 13)); h.pose('panneauBois', { bois, plaque: plaques.get(txt) }, repere(h, s), [sd * (s.w + 2.5), 0, 0]); };
      panneau(P(1), 1, 'CHAPADA DIAMANTINA'); panneau(P(3) - 60, -1, '▲ SALTO ▲'); panneau(P(21) - 50, 1, '▲ SALTO · PONTE ▲'); panneau(P(0) + 25, -1, 'IGATU · ANDARAÍ'); panneau(P(12) - 60, -1, 'CACHOEIRA  ▸'); panneau(iB0 - 70, 1, 'PONTE · UMA VIA'); panneau(P(24), -1, 'MIRANTE 2 KM'); panneau(P(26), 1, 'VALE DO PATI');
      for (const [k, txt] of [[3, '▶ ▶ ▶'], [5, '◀ ◀ ◀'], [8, '▶ ▶ ▶'], [11, '◀ ◀ ◀'], [15, 'VAU · 13 M'], [21, '▲ UMA VIA ▲']]) { const i = (P(k) - 45 + N) % N; panneau(i, k === 15 || k === 21 ? 1 : -amont(S[P(k)]), txt); }
      { const pc = h.mat('grainGres', { c: 0x8a8478 }); for (const k of [2, 30, 1]) { const s = S[P(k)], [x, z] = bord(s, -1, s.w + 6 + rnd() * 6); h.pose('cairn', { pierre: pc }, h.scene, [x, g.hAt(x, z), z]); } }

      { const fl = [h.mat('ecrit', {}, 64, 32, '#e9b44c', '#1a1a16', '▶▶', 22), h.mat('ecrit', {}, 64, 32, '#e9b44c', '#1a1a16', '◀◀', 22)], pl = [[], []], po = [];
        for (let i = 0; i < N; i += 6) { const s = S[i]; if (Math.abs(s.k) < 0.006 || entre(i, g0, g1) || entre(i, p0, p1) || entre(i, gal0 - 10, gal1 + 10)) continue;
          const side = s.k > 0 ? -1 : 1, [x, z] = bord(s, side, s.w + 1.4); pl[side < 0 ? 0 : 1].push([x, s.y + 2.4, z, h.across(s) + Math.PI / 2, 2.4, 2.4, 2.4]); for (const u of [-1.2, 1.2]) { const [px, pz] = bord(s, side, s.w + 1.4 + u); po.push([px, s.y + 0.8, pz, 0, 1.2, 2.6, 1.2]); } }
        pl.forEach((l, k) => { inst(h, h.geo('boite', 0.08, 0.9, 1.7), fl[k], l).castShadow = false; }); inst(h, h.geo('boite', 0.12, 1, 0.12), bois, po).castShadow = false; }
      { const bal = [], ref = [], dist = [[], [], []], distR = [[], [], []], poD = []; // panneaux rouges avant les épingles (la gravité se lit), jaunes ailleurs
        for (let i = 0; i < N; i += 8) { const s = S[i]; if (entre(i, p0, p1) || entre(i, gal0 - 10, gal1 + 10)) continue; const gue = entre(i, iF0, iF1);
          for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, gue ? W + 0.3 : s.w + 0.9), y = gue ? s.y + niv(i) : s.y; bal.push([x, y + 0.7, z, h.across(s), 1.8, 1.2, 1.8]); ref.push([x, y + 1.35, z, h.across(s), 1.8, 1.6, 1.8]); } }
        for (const k of [3, 5, 8, 11, 15, 17, 21, 26, 31]) for (const side of [-1, 1]) { [150, 100, 50].forEach((m, j) => { const s = S[(P(k) - Math.round(m / 2) + N) % N], [x, z] = bord(s, side, s.w + 1.6); ([5, 8, 11, 26].includes(k) ? distR : dist)[j].push([x, s.y + 2.8, z, h.across(s) + Math.PI / 2, 3.4, 3.4, 3.4]); for (const u of [-1.6, 1.6]) { const [px, pz] = bord(s, side, s.w + 1.6 + u); poD.push([px, s.y + 1, pz, 0, 1.2, 3.4, 1.2]); } }); }
        for (const m of [inst(h, h.geo('boite', 0.18, 1.2, 0.18), h.mat('peinture', { c: 0xe8e4d8 }), bal), inst(h, h.geo('boite', 0.2, 0.18, 0.2), h.mat('peinture', { lum: 1, c: 0xff6a2a }), ref)]) m.castShadow = false; // au soleil rasant, leurs ombres barraient la route en damier
        inst(h, h.geo('boite', 0.12, 1, 0.12), bois, poD).castShadow = false; ['150', '100', '50'].forEach((t, j) => { inst(h, h.geo('boite', 0.08, 0.9, 1.4), h.mat('ecrit', {}, 64, 40, '#e9b44c', '#1a1a16', t, 26), dist[j]).castShadow = false; inst(h, h.geo('boite', 0.08, 0.9, 1.4), h.mat('ecrit', {}, 64, 40, '#c8321e', '#f4f0e0', t, 26), distR[j]).castShadow = false; }); }
      // ---------- REFS 5 : le hameau de garimpeiros, en pierre sèche, au nord de la ligne droite (et quelques ruines au sud) ----------
      const maisons = [], tuile = h.mat('tuileCuite'), porte = h.mat('planches'), lanterne = h.mat('peinture', { lum: 1, c: 0xffb45a });
      for (let k = 0; k < 120 && maisons.length < 36; k++) { const sd = k % 4 ? -1 : 1, gp = [30, 75, 120, 170, 215, 260, 320, 380][k % 8], i = (P(0) + gp + (rnd() * 30 | 0)) % N, s = S[i], off = s.w + (k < 12 ? 5 + rnd() * 6 : 7 + rnd() * rnd() * 40), [x, z] = bord(s, sd, off); // six grappes le long de la ligne droite
        if (maisons.some(m => Math.hypot(m[0] - x, m[2] - z) < 9) || g.dAt(x, z) < 12) continue; const ru = rnd() < 0.4 ? 1 : 0, w = 6 + rnd() * 4, d = 5 + rnd() * 3, a = h.across(s) + sd * Math.PI / 2 + (rnd() - 0.5) * 0.5; // la façade (-Z) vers la route // ni l'une sur l'autre, ni sur une autre portion de route (la chicane)
        maisons.push([x, g.hAt(x, z) - 0.2, z, a, w, d, ru]); }
      { const s = S[1204], sd = -amont(s); for (const [o, l] of [[s.w + 9, 0], [s.w + 16, 10]]) { const [x, z] = bord(s, sd, o), q = S[(1204 + l) % N]; maisons.push([x, g.hAt(x, z) - 0.2, z, h.across(q) + sd * Math.PI / 2, 8, 6, 1]); } } // épingle 3 : les ruines d'un garimpo à la corde, son seul repère
      for (const [x, y, z, a, w, d, ru] of maisons) { const gr = new THREE.Group(); gr.position.set(x, y, z); gr.rotation.y = a; h.scene.add(gr);
        h.pose('maisonIgatu', { pierre, tuile, porte }, gr, [0, 0, 0], w, d, rnd() < 0.35 ? 5.5 + rnd() * 2 : 3.4 + rnd() * 0.8, ru);
        if (!ru) { const lp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), lanterne); lp.position.set(0.9, 2.5, -d / 2 - 0.35); gr.add(lp); }
        if (rnd() < 0.7) { const l = 6 + rnd() * 10; h.pose('muret', { pierre }, gr, [(rnd() < 0.5 ? -1 : 1) * (w / 2 + l / 2 + 1), 0, d / 2 + 2 + rnd() * 4], l); } } // l'enclos du quintal

      // ---------- la végétation, par lieu et par plan ----------
      const cimesF = [], cimesE = [], cimesL = [], arbres = [], cimes = [[], [], [], []], troncsC = [], fougeres = [], palm = [], palmT = [], bromelias = [], buissons = [], lianes = [], canelas = [], lajedos = [], affl = [];
      { const s = S[687], sd = -amont(s); for (let c = 0; c < 4; c++) { const [x, z] = bord(s, sd, s.w + 8 + c * 4), y = g.hAt(x, z), t = 1.3 - c * 0.15, Ht = 11 * t; arbres.push([x, y + Ht / 2, z, rnd() * 6, t, Ht / 5.2, t]); for (let e = 0; e < 4; e++) cimesF.push([x + (rnd() - 0.5) * 4, y + Ht, z + (rnd() - 0.5) * 4, rnd() * 6, 2.4 * t, 1.8 * t, 2.4 * t]); } } // épingle 1 : un bosquet d'ipês jaunes à la corde
      { const s = S[940], sd = -amont(s), [x, z] = bord(s, sd, s.w + 14), y = g.hAt(x, z); inst(h, h.geo('rocher'), h.mat('grainGres', { c: 0xa88a6a }), [[x, y + 9, z, 0.4, 5, 20, 4.5], [x + 2, y + 21, z - 1, 1.1, 3.5, 6, 3.2], [x - 3, y + 3, z + 2, 2, 4, 6, 4]]); } // épingle 2 : une aiguille de grès isolée, le repère de la corde
      const touffes = [[], [], []], sempre = [];
      // un arbre de la forêt de galerie (REFS 4) : fût de 10 à 24 m, clair ou sombre, couronne de 2 à 4 houppiers de trois verts
      const arbre = (x, y, z, t, prochePiste, loin) => { const Ht = (10 + rnd() * 14) * t, l = 0.9 + rnd() * 0.9; (rnd() < 0.35 ? troncsC : arbres).push([x, y + Ht / 2, z, rnd() * 6, l * t, Ht / 5.2, l * t]); // sans fût, les houppiers lointains flottaient
        const sorte = rnd(), cc = sorte < 0.1 ? cimesF : sorte < 0.2 ? cimesE : loin ? cimesL : cimes[rnd() * 4 | 0]; // ipê en fleur, embaúba, ou l'un des quatre verts
        const nc = loin ? 1 : 2 + (rnd() * 2 | 0), gl = loin ? 1.35 : 1; for (let c = 0; c < nc; c++) { const r = (loin ? 0 : 0.8 + rnd() * 1.8) * t, a = rnd() * 6.28; cc.push([x + Math.cos(a) * r, y + Ht - 1 + rnd() * 3 * t, z + Math.sin(a) * r, rnd() * 6, (0.9 + rnd() * 0.7) * t * gl, (0.85 + rnd() * 0.6) * t * gl, (0.9 + rnd() * 0.7) * t * gl]); } // loin de la route (niveau de détail), un seul houppier, plus gros
        if (!loin && rnd() < 0.25) coupes.push([x + 0.4, y + 3 + rnd() * Ht * 0.4, z, rnd() * 6, 0.5]); // une broméliacée épiphyte sur le fût
        if (prochePiste && rnd() < 0.7) for (let c = 0; c < 1 + (rnd() * 3 | 0); c++) { const ll = 4 + rnd() * 8, a = rnd() * 6.28, r = 1 + rnd() * 3; lianes.push([x + Math.cos(a) * r, y + Ht - ll / 2, z + Math.sin(a) * r, rnd() * 6, 1, ll, 1]); } };
      const palmier = (x, y, z, t) => { const Ht = (5 + rnd() * 11) * t; palmT.push([x, y + Ht / 2, z, rnd() * 6, 0.6 * t, Ht, 0.6 * t]); palm.push([x, y + Ht, z, rnd() * 6, 0.55 * t]); }; // juçara : stipe fin, couronne de palmes
      for (let k = 0; k < 42000; k++) {
        const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), q = proche(x, z), d = q.d - q.s.w, zn = zone(q.i), r = rnd();
        if (d < 1.2 || d > 140 || ravin(x, z) > 0.2 || (zn === 'gorge' && q.cote < 0 && d < 58) || (dF(q.i) < 24 && d < 47)) continue; // ni sur la route, ni dans la rivière
        const a = acc(q.i, q.cote) || 0, y = d < a + 0.5 ? q.s.y + A(Math.min(d, a)) : g.hAt(x, z); // sur le bas-côté, sa hauteur (le terrain est 0,35 m dessous)
        if (d < a + 1 && (zn === 'lacets' && q.cote === amont(q.s) && paroiLacet(q.i))) continue; // le pied de la falaise
        if (zn === 'plateau') { // REFS 5 : campo rupestre
          if (d < 2.5) continue; // le muret
          if (r < 0.2) { if (d < 60) touffes[rnd() * 3 | 0].push([x, y - 0.05, z, rnd() * 6, (d < 15 ? 1.4 : 0.8) + rnd() * 1.2, 0.4 + rnd() * 0.6]); }
          else if (r < 0.5) { if (d < 80 && rnd() < 0.2) sempre.push([x, y - 0.05, z, rnd() * 6, 0.5 + rnd() * 0.4, 0.5 + rnd() * 0.4]); }
          else if (r < 0.525 && d < 40) for (let c = 0, nc = d > 20 ? 1 : 1 + (rnd() * 3 | 0); c < nc; c++) canelas.push([x + (rnd() - 0.5) * 5, y - 0.1, z + (rnd() - 0.5) * 5, rnd() * 6, 0.8 + rnd() * 1.2]); // en groupes
          else if (r < (d < 15 ? 0.6 : 0.545)) lajedos.push([x, y - 0.3, z, h.across(q.s) + Math.PI / 2 + (rnd() - 0.5) * 0.6, (d < 15 ? 0.5 : 0.6) + rnd() * (d < 15 ? 0.6 : 1.4)]);
          else if (r < 0.58 && d > 22 && d < 90) affl.push([x, y - 2, z, rnd() * 6, 4 + rnd() * 10, 2 + rnd() * 6, 3 + rnd() * 8]); // gros affleurements de quartzite
          continue; }
        if (zn === 'foret') {
          if (d < 14) { if (r < 0.28) fbas.push([x, y, z, rnd() * 6, 1 + rnd() * 1.2]); else if (r < 0.36) (d < 6 ? bromelias : coupes).push([x, y, z, rnd() * 6, 0.7 + rnd() * 0.8]); else if (r < 0.55) buissons.push([x, y + 0.6, z, rnd() * 6, 0.35 + rnd() * 0.35, 0.3 + rnd() * 0.25]);
            else if (r < 0.66 && d > 4) fougeres.push([x, y, z, rnd() * 6, 0.8 + rnd() * 0.5]); else if (r < 0.76 && d > 3) palmier(x, y, z, 0.3 + rnd() * 0.9); else if (r < 0.86 && d > 6) arbre(x, y, z, 0.8 + rnd() * 0.5, true); }
          else if (d < 80) { if (r < (d > 40 ? 0.14 : 0.25)) arbre(x, y, z, 0.8 + rnd() * 0.7, false, d > 25); else if (r < 0.3) { if (d < 25) fougeres.push([x, y, z, rnd() * 6, 0.9 + rnd() * 0.6]); } else if (r < 0.36) { if (d < 30) palmier(x, y, z, 0.8 + rnd() * 0.6); } else if (r < 0.5 && d < 30) buissons.push([x, y + 0.8, z, rnd() * 6, 0.5 + rnd() * 0.4, 0.4]); }
          else if (r < 0.08 && d < 140) arbre(x, y, z, 1.2 + rnd() * 0.6, false, true);
          continue; }
        // la gorge et les lacets : mata ciliar sur les rives et les pentes, fougères arborescentes, palmiers ; roche nue là où c'est raide
        if (d < 10) { if (r < 0.25) fbas.push([x, y, z, rnd() * 6, 0.7 + rnd() * 0.6]); else if (r < 0.36) (d < 5 ? bromelias : coupes).push([x, y, z, rnd() * 6, 0.8 + rnd() * 0.6]); else if (r < 0.48) touffes[2].push([x, y, z, rnd() * 6, 0.6 + rnd() * 0.5, 0.6 + rnd() * 0.6]); else if (r < 0.62) blocs.push([x, y, z, rnd() * 6, 0.6 + rnd(), 0.4 + rnd() * 0.6, 0.6 + rnd()]); else if (r < 0.74 && d > 3.5) fougeres.push([x, y, z, rnd() * 6, 0.7 + rnd() * 0.6]); else if (r < 0.8 && d > 4) palmier(x, y, z, 0.5 + rnd() * 0.5); }
        else if (d < 90) { if (r < (d > 40 ? 0.12 : 0.2)) arbre(x, y, z, 0.7 + rnd() * 0.6, false, d > 25); else if (r < 0.26) { if (d < 25) fougeres.push([x, y, z, rnd() * 6, 0.9 + rnd() * 0.7]); } else if (r < 0.31) { if (d < 30) palmier(x, y, z, 0.8 + rnd() * 0.5); } else if (r < 0.55 && d < 30) buissons.push([x, y + 0.8, z, rnd() * 6, 0.5 + rnd() * 0.5, 0.4]); else if (r < 0.56 && d > 20 && d < 70) affl.push([x, y - 1.5, z, rnd() * 6, 3 + rnd() * 6, 2 + rnd() * 3, 3 + rnd() * 6]); }
        else if (r < 0.07 && d < 140) arbre(x, y, z, 1.1 + rnd() * 0.5, false, true);
      }
      for (let i = (P(25) + 20) % N; dans(i, 25, 27); i = (i + 5) % N) for (const sd of [-1, 1]) if (rnd() < 0.6) { const s = S[i], [x, z] = bord(s, sd, s.w + 3 + rnd() * 8), y = g.hAt(x, z), Ht = 11 + rnd() * 6; troncsC.push([x, y + Ht / 2, z, rnd() * 6, 0.9, Ht / 5.2, 0.9]); cimesE.push([x, y + Ht, z, rnd() * 6, 1.1, 0.8, 1.1]); } // REFS 4 : le tronçon des embaúbas
      // (pas de lianes isolées au-dessus de la route : sans arbre au-dessus, elles flottaient ; celles des arbres de bord restent)
      for (let i = 0; i < N; i++) { const s = S[i], zn = zone(i); if (zn !== 'plateau' && zn !== 'foret') continue;
        for (const sd of [-1, 1]) { const a = acc(i, sd), at = (o, f) => { const [x, z] = bord(s, sd, o), y = o < s.w + a + 0.5 ? s.y + A(Math.min(o - s.w, a)) : g.hAt(x, z); f(x, y, z); }, o = () => s.w + 2.6 + rnd() * rnd() * 34;
          if (zn === 'plateau' && rnd() < 0.015) at(s.w + 12 + rnd() * 40, (x, y, z) => { const t = 0.6 + rnd() * 0.4, Ht = 9 * t; arbres.push([x, y + Ht / 2, z, rnd() * 6, t, Ht / 5.2, t]); for (let c = 0; c < 3; c++) cimesF.push([x + (rnd() - 0.5) * 3, y + Ht, z + (rnd() - 0.5) * 3, rnd() * 6, t, 0.8 * t, t]); }); // un ipê en fleur isolé
          if (zn === 'plateau') { // REFS 5 : campo rupestre, à touche-touche au bord
            for (let k = 0; k < 2; k++) if (rnd() < 0.55) at(o(), (x, y, z) => touffes[rnd() * 3 | 0].push([x, y - 0.05, z, rnd() * 6, 1 + rnd() * 1.4, 0.4 + rnd() * 0.6])); // plus larges que hautes : hautes, elles faisaient des sapins
            if (rnd() < 0.14) at(s.w + 4 + rnd() * rnd() * 30, (x, y, z) => lajedos.push([x, y - 0.3, z, h.across(s) + Math.PI / 2 + (rnd() - 0.5) * 0.5, 0.6 + rnd() * 0.8])); // le long de la route : en travers, la dalle de 12 m mordait la chaussée
            if (rnd() < 0.07) at(s.w + 3.5 + rnd() * rnd() * 25, (x, y, z) => { for (let c = 0, nc = 1 + (rnd() * 4 | 0); c < nc; c++) canelas.push([x + (rnd() - 0.5) * 5, y - 0.1, z + (rnd() - 0.5) * 5, rnd() * 6, 0.9 + rnd() * 1.3]); });
            if (rnd() < 0.35) at(s.w + 5 + rnd() * 30, (x, y, z) => { for (let c = 0; c < 3; c++) sempre.push([x + (rnd() - 0.5) * 3, y - 0.05, z + (rnd() - 0.5) * 3, rnd() * 6, 0.6 + rnd() * 0.4, 0.5 + rnd() * 0.4]); }); }
          else { // REFS 4 : le sous-bois au bord
            if (rnd() < 0.5) at(o(), (x, y, z) => fbas.push([x, y, z, rnd() * 6, 1 + rnd() * 1.2]));
            if (rnd() < 0.35) at(o(), (x, y, z) => (rnd() < 0.3 ? bromelias : coupes).push([x, y, z, rnd() * 6, 0.9 + rnd() * 0.8]));
            if (rnd() < 0.3) at(o(), (x, y, z) => buissons.push([x, y + 0.6, z, rnd() * 6, 0.4 + rnd() * 0.4, 0.3 + rnd() * 0.3]));
            if (rnd() < 0.05) at(s.w + 4 + rnd() * 10, (x, y, z) => fougeres.push([x, y, z, rnd() * 6, 0.8 + rnd() * 0.5]));
            if (rnd() < 0.05) at(s.w + 4 + rnd() * 10, (x, y, z) => palmier(x, y, z, 0.4 + rnd() * 0.8)); } } }
      for (const [x, y, z] of rive) arbre(x, y, z, 0.9 + rnd() * 0.4, true); // des arbres de rive, leurs lianes au-dessus de l'eau
      // le grand arbre fantôme dans la brume du pont
      { const s = S[(iB1 + 12) % N]; for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, s.w + 12); arbre(x, g.hAt(x, z), z, 1.8, false); } } // les grands arbres fantômes au bout du pont
      for (const p of corn) fougeres.push(p); for (const p of cornB) coupes.push(p);
      // une matière par famille (feuillage, écorce, roche) ; chaque exemplaire porte sa teinte (8e valeur), que la fusion de game.js passe en couleur de sommet : moins de passes de dessin
      const feuil = h.mat('feuillage', DS), neutre = h.mat('bruit', DS, '#e8e8e4', ['#d0d0cc', '#f4f4f0', '#c0c0bc']), ecorce = h.mat('tronc'), rocM = h.mat('grainGres'), vertsF = [0x1f4d34, 0x2e6a3a, 0x4f7a3a, 0x6f9a45];
      const tc = (l, c) => l.map(p => [p[0], p[1], p[2], p[3] || 0, p[4] || 1, p[5] || p[4] || 1, p[6] || p[4] || 1, typeof c === 'function' ? c() : c]), un = l => l[rnd() * l.length | 0];
      const instT = (geo, m, l) => { const me = inst(h, geo, m, l); l.forEach((p, i) => me.setColorAt(i, new THREE.Color(p[7]))); if (l.length) me.instanceColor.needsUpdate = true; return me; };
      instT(h.geo('cime'), feuil, [...cimes.flatMap((l, k) => tc(l, vertsF[k])),  ...tc(coupes.map(p => [p[0], p[1], p[2], p[3], p[4] * 0.3, p[4] * 0.12, p[4] * 0.3]), 0x8aa83a)]);
      instT(h.geo('cimeLoin'), feuil, [...tc(cimesL, () => un(vertsF)), ...tc(buissons, () => un([0x2a4a2a, 0x3a5a2a]))]); // niveau de détail : les houppiers lointains
      instT(h.geo('cime'), neutre, [...tc(cimesF.map(p => [p[0], p[1] - 1, p[2], p[3], p[4] * 0.7, p[5] * 0.7, p[6] * 0.7]), () => un([0xe8c028, 0xf0cc38, 0xd878a8])), ...tc(cimesE.map(p => [p[0], p[1], p[2], p[3], p[4] * 1.3, p[5] * 0.45, p[6] * 1.3]), 0xb8c8b8)]); // ipês en fleur et embaúbas // les ipês, d'un tiers plus petits (ils faisaient des ballons)
      instT(h.geo('tronc'), ecorce, [...tc(arbres, () => un([0x6a5a48, 0x5a4a3a, 0x7a6a58])), ...tc(troncsC, () => un([0xc8bea8, 0xb0a890]))]);
      insts(h, 'fougereArbo', { stipe: ecorce, fronde: feuil }, tc(fougeres, () => un([0x7da23d, 0x6a9a3a, 0x8ab04a])), { teinte: 'fronde' });
      inst(h, h.geo('troncPalmier'), h.mat('troncPalmier', { c: 0x8a8070 }), palmT);
      insts(h, 'palmes', { palme: feuil }, tc(palm, () => un([0x9ab860, 0x7a9a48])), { teinte: 'palme' });
      insts(h, 'bromelia', { feuille: feuil, fleur: h.mat('peinture', { c: 0xd8402a }) }, tc(bromelias, () => un([0x8aa83a, 0xa8a040, 0x6a9a3a])), { teinte: 'feuille' });
      insts(h, 'fougereBasse', { fronde: feuil }, tc(fbas, () => un([0x5f9a45, 0x4f8a3a])), { teinte: 'fronde' });
      instT(h.geo('boite', 0.18, 1, 0.18), feuil, [...tc(lianes, 0x4a6a2a)]);
      insts(h, 'canelaEma', { bois: h.mat('tronc', { c: 0x2a2622 }), touffe: feuil }, tc(canelas, () => un([0x8a9a6a, 0x9aa070])), { teinte: 'touffe' });
      insts(h, 'lajedo', { roc: rocM, lichen: h.mat('grainGres', { c: 0xb8ae98 }) }, tc(lajedos, () => un([0x5a554c, 0x4a4640, 0x6a6258])), { teinte: 'roc' });
      instT(h.geo('rocher'), rocM, [...tc(affl, () => un([0x6a6258, 0x7a7062])), ...tc(blocs, () => un([0x8a7a62, 0x7a6a58, 0x9a7a5a]))]);
      instT(h.geo('touffe'), feuil, touffes.flatMap((l, k) => tc(l, [0x9aa858, 0xc8b060, 0x6f9a45][k]))); instT(h.geo('touffe'), neutre, tc(sempre, 0xf8f4e8)); // REFS 5 : les sempre-vivas en touffes blanches
      instT(h.geo('boite', 1, 1, 1), rocM, tc(galets, () => un([0x7a6a58, 0x8a7a62])));

      // ---------- REFS 5 : les mesas au loin (Pai Inácio, Camelo, Três Irmãos) : sommet plat, flancs en strates, talus d'éboulis ; bleuies par la distance, hors brouillard ----------
      { const fog = COL(h.TH.fog), sun = new THREE.Vector3(...h.TH.astre.dir).normalize(), pos = [], col = [], idx = [];
        const mesa = (cx, cz, R, H, y0) => { const n = 30, nR = bruit(), prof = [[1.9, 0], [1.35, 0.3], [1.08, 0.38], [1.04, 0.55], [1.02, 0.6], [0.97, 0.82], [0.92, 0.86], [0.9, 1], [0, 1.01]], b0 = pos.length / 3;
          for (let a = 0; a <= n; a++) { const t = a / n * 6.2832, rr = R * (0.8 + 0.45 * nR(a * 0.7)), c = Math.cos(t), s = Math.sin(t), lum = 0.72 + 0.28 * Math.max(0, c * sun.x + s * sun.z);
            prof.forEach(([k, y], j) => { pos.push(cx + c * rr * k, y0 + H * y, cz + s * rr * k); const base = COL(j < 2 ? '#7d7458' : j === 8 ? '#5f6a48' : j === 4 || j === 6 ? '#a89880' : '#8f806c', lum); col.push(...mix(base, COL('#8a9aa2'), 0.5 - 0.2 * y)); }); }
          for (let a = 0; a < n; a++) for (let j = 0; j < prof.length - 1; j++) { const i0 = b0 + a * prof.length + j, i1 = i0 + prof.length; idx.push(i0, i0 + 1, i1, i1, i0 + 1, i1 + 1); } };
        for (const [cx, cz, R, H] of [[350, -900, 260, 300], [1150, -760, 180, 240], [1700, 300, 220, 260], [-750, 250, 200, 280], [-600, 1100, 240, 220], [700, 1350, 200, 250], [-300, -700, 160, 230], [1650, -250, 150, 200], [1500, 1000, 200, 270], [-900, -200, 140, 210], [200, -470, 120, 210], [680, -520, 140, 250], [-380, -260, 110, 190]]) mesa(cx, cz, R, H, -60); // les trois dernières, proches de la ligne droite du plateau
        const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gm.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gm.setIndex(idx);
        h.scene.add(new THREE.Mesh(gm, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }))); }

      // ---------- brume en nappes et rayons de soleil ----------
      const brume = h.mat('brume', { lum: 1, c: 0xe8eee4, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }), voiles = [];
      const nappe = new THREE.PlaneGeometry(1, 1); nappe.rotateX(-Math.PI / 2);
      for (let k = 0; k < 70; k++) { const i = (P(12) + (rnd() * ((P(24) - P(12) + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, -1, s.w + 10 + rnd() * 40); voiles.push([x, s.y + niv(i) + 1 + rnd() * 4, z, rnd() * 6, 25 + rnd() * 25, 1, 25 + rnd() * 20]); } // au fond de la gorge
      for (let k = 0; k < 30; k++) { const i = (P(4) + (rnd() * ((P(11) - P(4) + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, -amont(s), s.w + 15 + rnd() * 30); voiles.push([x, s.y - 4 - rnd() * 6, z, rnd() * 6, 30 + rnd() * 30, 1, 30 + rnd() * 20]); } // dans le vide sous les épingles
      for (let k = 0; k < 16; k++) { const s = S[(gal0 + (rnd() * ((gal1 - gal0 + N) % N) | 0)) % N], [x, z] = bord(s, -1, s.w + 8 + rnd() * 14); voiles.push([x, s.y + niv(IX.get(s)) + 0.3 + rnd() * 1.2, z, rnd() * 6, 16 + rnd() * 10, 1, 16 + rnd() * 10]); } // le bassin de la grande chute fume
      for (const i of chutes) for (let k = 0; k < 4; k++) { const s = S[(i + k * 3) % N], [x, z] = bord(s, -1, s.w + 46 + rnd() * 4); voiles.push([x, s.y + niv(i) + 1 + k, z, rnd() * 6, 14 + rnd() * 8, 1, 14 + rnd() * 8]); } // les vasques des chutes
      for (let k = 0; k < 24; k++) { const i = (P(29) + (rnd() * ((P(3) - P(29) + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, rnd() < 0.5 ? -1 : 1, s.w + 30 + rnd() * 90); voiles.push([x, g.hAt(x, z) + 1 + rnd() * 2, z, rnd() * 6, 40 + rnd() * 40, 1, 30 + rnd() * 20]); } // brume rasante du plateau
      for (let k = 0; k < 14; k++) { const u = (rnd() - 0.5) * 240, v = (rnd() - 0.5) * 30; voiles.push([sb.x - sb.tz * u + sb.tx * v, sb.y - 12 + rnd() * 6, sb.z + sb.tx * u + sb.tz * v, rnd() * 6, 40 + rnd() * 30, 1, 30 + rnd() * 20]); } // le ravin du pont
      for (let k = 0; k < 40; k++) { const i = (P(23) + (rnd() * ((P(29) - P(23) + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, rnd() < 0.5 ? -1 : 1, s.w + 4 + rnd() * 40); voiles.push([x, g.hAt(x, z) + 0.6 + rnd() * 1.5, z, rnd() * 6, 20 + rnd() * 20, 1, 20 + rnd() * 15]); } // brume rasante entre les troncs
      for (let k = 0; k < 40; k++) { const i = (P(3) + (rnd() * ((P(12) - P(3) + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, -amont(s), s.w + 6 + rnd() * 30); voiles.push([x, s.y - 1 - rnd() * 3, z, rnd() * 6, 25 + rnd() * 20, 1, 25 + rnd() * 20]); } // la brume monte du vide, au ras des lacets
      for (let k = 0; k < 14; k++) { const i = (gal0 + (rnd() * ((gal1 - gal0 + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, -1, s.w * (rnd() * 1.6 - 0.6) + 2); voiles.push([x, s.y + 0.6 + rnd() * 1.2, z, rnd() * 6, 10 + rnd() * 8, 1, 10 + rnd() * 8]); } // et qui déborde sur la route
      const nap = inst(h, nappe, brume, voiles); nap.castShadow = nap.receiveShadow = false;
      // au pont, le blanc s'épaissit : des voiles debout en travers de la route, qu'on traverse
      const debout = new THREE.PlaneGeometry(1, 1), vd = []; for (let i = P(19); dans(i, 19, 23); i = (i + 8) % N) { const s = S[i]; vd.push([s.x, s.y + 3, s.z, h.across(s) + Math.PI / 2 + (rnd() - 0.5) * 0.4, 45, 12, 1]); }
      for (let k = 0; k < 20; k++) { const i = (P(23) + (rnd() * ((P(29) - P(23) + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, rnd() < 0.5 ? -1 : 1, s.w + 18 + rnd() * 45); vd.push([x, g.hAt(x, z) + 5, z, h.across(s) + (rnd() - 0.5) * 0.5, 40 + rnd() * 20, 12, 1]); } // les plans de la forêt se séparent dans le blanc
      // la brume en couches, partout : des voiles debout à 30-160 m, parallèles à la route (les nappes à plat ne se voient pas de profil)
      for (let k = 0; k < 24; k++) { const i = (gal0 + (rnd() * ((gal1 - gal0 + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, -1, s.w + 7 + rnd() * 3); vd.push([x, s.y + niv(i) + 2.5 + rnd() * 2, z, h.across(s) + Math.PI / 2 + (rnd() - 0.5) * 0.3, 14 + rnd() * 10, 6 + rnd() * 3, 1]); } // la brume qui monte du bassin
      for (let k = 0; k < 90; k++) { const i = rnd() * N | 0, s = S[i], zn = zone(i), sd = zn === 'lacets' ? -amont(s) : rnd() < 0.5 ? -1 : 1, o = s.w + (k < 30 ? 14 : 30) + rnd() * (k < 30 ? 26 : 130), [x, z] = bord(s, sd, o); // 90 voiles : 300 coûtaient presque autant que tout le reste au GPU (surdessin)
        const y = zn === 'lacets' || zn === 'gorge' ? s.y - 8 + rnd() * 10 : g.hAt(x, z) + 3; vd.push([x, y, z, h.across(s) + (rnd() - 0.5) * 0.6, 40 + rnd() * 40, 8 + rnd() * 6, 1]); }
      const vds = inst(h, debout, h.mat('brume', { lum: 1, c: 0xe4ecf0, transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide }), vd); vds.castShadow = vds.receiveShadow = false;
      // rayons : des fuseaux additifs dans l'axe du soleil (bas, à l'est), en forêt et sur la paroi de la galerie
      const sun = new THREE.Vector3(...h.TH.astre.dir).normalize(), rg = new THREE.PlaneGeometry(9, 70); rg.translate(0, 35, 0); rg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), sun));
      const rayons = []; for (let k = 0; k < 70; k++) { const i = (P(23) + (rnd() * ((P(29) - P(23) + N) % N) | 0)) % N, s = S[i], [x, z] = bord(s, rnd() < 0.5 ? -1 : 1, rnd() * (s.w + 10)); rayons.push([x, s.y - 1, z, 0, 0.6 + rnd()]); }
      const rmat = h.mat('rayon', { lum: 1, c: 0xffd9a0, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      for (const a of [0, Math.PI / 2]) { const gg = rg.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(sun, a)), m = inst(h, gg, rmat, rayons); m.castShadow = m.receiveShadow = false; }
      return (dt, now) => {
        chuteM.map.offset.x += dt * 0.9; eau.map.offset.y -= dt * 0.15; rmat.opacity = 0.46 + 0.08 * Math.sin(now * 0.0007); gueM.map.offset.y -= dt * 0.3;
        for (let k = 0; k < NE; k++) { const j = k * 3 + 1; pe[j] += dt * (1.5 + (k % 5) * 0.4); if (pe[j] > base[k][1] + 10) pe[j] = base[k][1]; } ge.attributes.position.needsUpdate = true;
      };
    },
    // ---------- Playa 307 (Riviera Maya, midi) : plage, ponton, rue aux papel picado, marché couvert, garrigue, cénote ouvert (la place), grotte (le tunnel), lobby d'hôtel ----------
    // Le nord (z < 0) est la mer. Intérieurs : la grotte est le tunnel du moteur ; le marché et le lobby sont des halles posées autour de la route (toit haut, ombre franche), sans mode tunnel.
    plage(h) {
      const { THREE, S, N, W, T, rnd } = h, D = THREE.DoubleSide, P = i => pt(h, i);
      const tranche = (a, b, m0 = 0, m1 = 0) => { const i0 = (P(a) - m0 + N) % N; return [i0, (P(b) + m1 - i0 + N) % N]; }; // [premier échantillon, nombre] du point a au point b, marges en échantillons
      const chaque = ([i0, n], pas, f) => { for (let k = 0; k <= n; k += pas) f(S[(i0 + k) % N], (i0 + k) % N, k); };
      const ecart = (x, z) => { let b = 1e9; for (let i = 0; i < N; i += 2) { const s = S[i], d = Math.hypot(s.x - x, s.z - z) - s.w; if (d < b) b = d; } return b; }; // distance au bord de la route (négative dessus)
      const PL = h.M.place, CX = PL.c[0], CZ = PL.c[1], loinCenote = (x, z, m = 0) => Math.hypot(x - CX, z - CZ) > 150 + m;
      const versRoute = (s, sd) => Math.atan2(-sd * s.tz, sd * s.tx); // rotation Y qui tourne le -Z local d'un objet posé du côté sd vers la route (et met son X local le long de la route)
      const enFace = s => Math.atan2(s.tx, s.tz); // rotation Y qui met le +Z local dans le sens de la course (un panneau plat vu de face par le pilote)
      const colore = (m, l) => { if (l.length) { l.forEach((p, i) => m.setColorAt(i, new THREE.Color(p[7]))); m.instanceColor.needsUpdate = true; } return m; };
      const OFF = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, couvre = (i0, n, oa, ob, m, v = 8) => h.ribbon((i0 + N) % N, n, oa, 0.02, ob, 0.02, m, v); // peinture posée sur la chaussée
      const blancT = h.mat('peinture', { c: 0xffffff }), bois = h.mat('planches'), chaume = h.mat('chaume', { side: D }), calc = h.mat('calcaire'), crepi = h.mat('crepi');
      const tronc = h.mat('bruit', {}, '#9a8a78', ['#7a6a58', '#b4a490', '#6a5a4a']), palme = h.mat('bruit', { side: D }, '#5f9a2a', ['#7ab32e', '#3f8f2a', '#8cc43a']);
      const noix = h.mat('peinture', { c: 0xf2c230 }), feuillage = h.mat('bruit', {}, '#4c7a2a', ['#3a6a24', '#6a9a3a', '#5a7a30']);
      const PAPEL = [0xff3d7f, 0xffb100, 0x1fb5a8, 0x7a4bd6, 0xff6a2b], FACADES = [0xf2b45a, 0xf7d36b, 0xd9693a, 0xfff4e0, 0xf2c890, 0x8fd0c8];
      const palmiers = [[], []], buissons = [], maisons = [];
      const palmier = (x, z, v = rnd() < 0.4 ? 1 : 0, t = 1) => palmiers[v].push([x, 0, z, rnd() * 6.28, t * (0.85 + rnd() * 0.3)]);

      // --- le sol : le large, la mer turquoise du bord, la plage, la garrigue ; la ligne d'écume et de sargasses ---
      const mMer = h.mat('merTurquoise', { gloss: 0.5 }), mLarge = h.mat('merLarge', { gloss: 0.4 });
      boite(h, mLarge, 7000, 1, 3350, 400, -1.8, -1825); boite(h, mMer, 7000, 1, 124, 400, -1.7, -88);
      boite(h, h.mat('sableSec'), 7000, 1, 96, 400, -0.55, 22); boite(h, h.mat('solGarrigue'), 7000, 1, 2930, 400, -0.56, 1535);
      boite(h, h.mat('sableDur'), 7000, 0.3, 6, 400, -0.2, -23); // sable mouillé, entre la corde et l'eau
      { const m = new THREE.Mesh(new THREE.PlaneGeometry(7000, 3), h.mat('ecumeMer', { transparent: true, alphaTest: 0.3, rep: [1200, 1] })); m.rotation.set(-Math.PI / 2, 0, Math.PI); m.position.set(400, -1.15, -27.5); h.scene.add(m); }

      // --- secteur 1, la plage : sable dur sur la piste, corde et bouées des deux côtés de la plage large, palapas, parasols, transats, cocotiers, barques ---
      const dur = h.mat('sableDur', { side: D, ...OFF }), [b0, nb] = tranche(43, 3);
      couvre(b0, (N - 5 - b0 + N) % N, -W, W, dur, 32); couvre(5, P(3) - 5, -W, W, dur, 32); // la ligne de départ garde sa peinture
      const plageL = tranche(45, 2, 20, 20), corde = h.mat('peinture', { c: 0xfff4e0 }), poteaux = [], bouees = [];
      for (const sd of [-1, 1]) {
        h.ribbon(plageL[0], plageL[1], s => sd * (s.w + 0.6), 1.12, s => sd * (s.w + 0.6), 0.86, h.mat('peinture', { c: 0xff6a2b, side: D }), 4);
        chaque(plageL, 2, (s, i, k) => { const [x, z] = bord(s, sd, s.w + 0.6); if (k % 4 === 0) poteaux.push([x, -0.05, z, 0, 1, 1.15, 1]); else if (sd < 0) bouees.push([x, 0.98, z, 0, 0.65, 0.65, 0.65, [0xff6a2b, 0xffffff, 0xffb100][k / 2 % 3 | 0]]); });
      }
      inst(h, h.geo('poteauBois'), bois, poteaux); colore(inst(h, h.geo('bouee'), blancT, bouees), bouees);
      const cones = [], pieds = [], parasols = [], mats = [], transats = [];
      for (let x = 25; x < 480; x += 16 + rnd() * 10) { // côté terre, de 22 à 70 m de la ligne d'eau
        const z = 28 + rnd() * 8; if (ecart(x, z) < 4) continue;
        if (rnd() < 0.55) { cones.push([x, 2.6, z, rnd() * 6, 3.2, 2.2, 3.2]); for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) pieds.push([x + a * 1.9, -0.05, z + b * 1.9, 0, 1, 2.7, 1]);
          for (const a of [-1, 1]) transats.push([x + a * 1.3, -0.05, z + 3.8, -1.5708, 1, 1, 1, [0x1fb5a8, 0x2f95e6, 0xff3d7f][rnd() * 3 | 0]]); }
        else { parasols.push([x, 2.3, z, 0, 1.5, 0.55, 1.5, PAPEL[rnd() * 5 | 0]]); mats.push([x, -0.05, z, 0, 0.5, 2.4, 0.5]); transats.push([x + 1, -0.05, z + 1.5, -1.5708 + rnd() * 0.4, 1, 1, 1, 0xfff4e0]); }
        for (let k = 0; k < 2; k++) palmier(x + rnd() * 14, 44 + rnd() * 26);
      }
      inst(h, h.geo('toitPalapa'), chaume, cones); inst(h, h.geo('poteauBois'), bois, [...pieds, ...mats]);
      colore(inst(h, h.geo('toitPalapa'), h.mat('peinture', { c: 0xffffff, side: D }), parasols), parasols);
      insts(h, 'transat', { bois, toile: blancT }, transats, { teinte: 'toile' });
      const barques = [];
      for (let k = 0; k < 14; k++) { const x = -60 + rnd() * 560, z = k < 4 ? -23.5 : -34 - rnd() * 50, y = k < 4 ? -0.15 : -1.35; if (ecart(x, z) < 8) continue; barques.push([x, y, z, rnd() * 6.28, 1, 1, 1, [0x1478d8, 0x1fb5a8, 0xff3d7f, 0xffb100, 0x3f8f2a][k % 5]]); }
      insts(h, 'barque', { coque: h.mat('peinture', { c: 0xfff8f0 }), bande: blancT, bois, moteur: h.mat('matGris') }, barques, { teinte: 'bande' });
      const voiles = []; for (let k = 0; k < 6; k++) voiles.push([-200 + rnd() * 900, 18 + rnd() * 14, -260 - rnd() * 260, rnd() * 6, 9, 0.2, 3.2, PAPEL[k % 5]]); // ailes de kitesurf au large
      colore(inst(h, h.geo('boite', 1, 1, 1), h.mat('peinture', { c: 0xffffff, fog: false }), voiles), voiles);

      // --- secteur 2, le ponton : planches, pilotis, garde-corps, lampadaires ; dans le U, une terrasse de bois sous une grande palapa-bar ---
      const pon = tranche(3, 11, 10, 10); let p0 = -1, pn = 0;
      chaque(pon, 1, (s, i) => { if (s.z < -20) { if (p0 < 0) p0 = i; pn = (i - p0 + N) % N; } });
      couvre(p0, pn, -W, W, h.mat('planches', { side: D, ...OFF }), 4);
      for (const sd of [-1, 1]) h.ribbon(p0, pn, sd * (W + 0.15), 1.12, sd * (W + 0.15), 0.98, h.mat('planches', { side: D }), 4);
      const pil = [], gc = [], lamp = [], ampoules = [];
      chaque([p0, pn], 1, (s, i, k) => { for (const sd of [-1, 1]) {
        if (k % 3 === 0) { const [x, z] = bord(s, sd, W - 0.6); pil.push([x, -1.6, z]); }
        if (k % 2 === 0) { const [x, z] = bord(s, sd, W + 0.15); gc.push([x, 0, z, 0, 0.6, 1.05, 0.6]); }
        if (k % 12 === 6 && (k / 12 | 0) % 2 === (sd > 0 ? 1 : 0)) { const [x, z] = bord(s, sd, W + 0.5); lamp.push([x, 0, z, 0, 0.9, 5, 0.9]); ampoules.push([x, 5.1, z]); } } });
      inst(h, h.geo('boite', 0.45, 3.2, 0.45), bois, pil); inst(h, h.geo('poteauBois'), bois, [...gc, ...lamp]); inst(h, h.geo('boite', 0.5, 0.5, 0.5), h.mat('lampe', LUM), ampoules);
      { const x = 515, z = -64; // la terrasse entre les deux voies du ponton, la palapa-bar au milieu
        boite(h, bois, 30, 0.3, 70, x, -0.2, z); const sous = []; for (let a = -12; a <= 12; a += 6) for (let b = -30; b <= 30; b += 10) sous.push([x + a, -1.6, z + b]); inst(h, h.geo('boite', 0.45, 3.2, 0.45), bois, sous);
        inst(h, h.geo('toitPalapa'), chaume, [[x, 4.3, z, 0.3, 9, 4.2, 9]]); inst(h, h.geo('poteauBois'), bois, [[x - 6, -0.05, z - 6, 0, 1.6, 4.4, 1.6], [x + 6, -0.05, z - 6, 0, 1.6, 4.4, 1.6], [x - 6, -0.05, z + 6, 0, 1.6, 4.4, 1.6], [x + 6, -0.05, z + 6, 0, 1.6, 4.4, 1.6]]);
        h.pose('barPaillote', { bois, bouteilles: h.mat('vitrine', LUM) }, h.scene, [x, -0.05, z]);
        const gens = []; for (let k = 0; k < 10; k++) gens.push([x - 9 + rnd() * 18, -0.05, z - 4 + rnd() * 18, rnd() * 6.28, 1, 1, 1, PAPEL[k % 5]]);
        insts(h, 'figurant', { blanc: h.mat('peinture', { c: 0xfff4e0 }), peau: h.mat('peinture', { c: 0xb07850 }), tenue: blancT, or: noix }, gens, { a: [0], teinte: 'tenue' }); }

      // --- secteur 3, la rue : dalles claires, trottoirs, façades crépies de couleur, étals, enseignes ; papel picado en fils au-dessus de la route ---
      const rue = tranche(13, 17, 0, 4), dalles = h.mat('dallesRue', { side: D, ...OFF });
      couvre(rue[0], rue[1], -W, W, dalles, 8); for (const sd of [-1, 1]) h.ribbon(rue[0], rue[1], sd * W, 0.15, sd * (W + 3.5), 0.15, h.mat('dallesRue', { side: D }), 8);
      const fac = [], etals = [], fils = [], fanions = [];
      const facades = ([i0, n], off, L, sy) => chaque([i0, n], Math.round(L / 2), s => { for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, off); if (ecart(x, z) > off - W - 1) fac.push([x, -0.05, z, versRoute(s, sd), L / 10, sy * (0.85 + rnd() * 0.35), 1, FACADES[rnd() * FACADES.length | 0]]); } });
      facades(rue, W + 3.6, 10, 1);
      chaque(rue, 9, (s, i, k) => { const sd = (k / 9) % 2 ? 1 : -1, [x, z] = bord(s, sd, W + 2.1); etals.push([x, 0.15, z, versRoute(s, sd), 1, 1, 1, PAPEL[(k / 9) % 5]]); });
      chaque([rue[0] + 3, rue[1] - 3], 6, (s, i, k) => { // un fil tous les 12 m, une quarantaine de fanions qui pendent en chaînette
        const half = W + 3.5; fils.push([s.x, 6.6, s.z, h.across(s), 2 * half, 1, 1]);
        for (let u = -half + 0.3, j = 0; u < half; u += 0.55, j++) { const [x, z] = bord(s, 1, u); fanions.push([x, 6.55 - 0.7 * (1 - (u / half) ** 2), z, enFace(s), 1, 1, 1, PAPEL[(j + k) % 5]]); } });
      inst(h, h.geo('corde'), h.mat('matGris'), fils); colore(inst(h, h.geo('fanion'), h.mat('papelPicado', { side: D, alphaTest: 0.5 }), fanions), fanions);
      insts(h, 'etalPlaya', { bois, toile: h.mat('toldo', { side: D }, '#fff4e0', '#ff3d7f'), paille: h.mat('chaume'), hamac: blancT }, etals, { teinte: 'hamac' });
      [['TACOS', '#d9693a'], ['MEZCAL', '#1fb5a8'], ['HELADOS', '#ff3d7f'], ['FARMACIA', '#3f8f2a'], ['CERVEZA', '#ffb100'], ['ARTESANIAS', '#7a4bd6']].forEach(([t, c], k) => {
        const s = S[(rue[0] + 12 + k * 14) % N], sd = k % 2 ? 1 : -1, [x, z] = bord(s, sd, W + 4.5), m = boite(h, h.mat('ecrit', {}, 96, 24, c, '#fff4e0', t, 16), 4.2, 1, 0.2, x, 4.3, z); m.rotation.y = versRoute(s, sd); });

      // --- secteur 4, le marché couvert : piliers, toit de tôle et de paille (des jours en long laissent passer le soleil), étals de chapeaux et de hamacs, murs du fond percés ---
      const mar = tranche(18, 20, 6, 6), piliers = [], toits = [], pailles = [], toitsD = [], paillesD = [], fonds = [], etalsM = [];
      chaque(mar, 5, (s, i, k) => {
        for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, W + 1.2); piliers.push([x, -0.05, z]); if ((k / 5) % 2) { const [fx, fz] = bord(s, sd, W + 9); fonds.push([fx, 4.4, fz, versRoute(s, sd)]); } }
        if ((k / 5) % 3 === 1) for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, W + 5 - 4.5); toitsD.push([x, 9.15, z, h.across(s)]); paillesD.push([x, 9.55, z, h.across(s)]); } // jour au faîte
        else { toits.push([s.x, 9.15, s.z, h.across(s)]); pailles.push([s.x, 9.55, s.z, h.across(s)]); }
        if (k % 10 === 5) h.lum(i, s.x, s.y + 7.5, s.z, 0xffd8a0, 20, 0.5);
      });
      chaque(mar, 3, (s, i, k) => { for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, W + 3.6); etalsM.push([x, -0.05, z, versRoute(s, sd), 1, 1, 1, PAPEL[(k / 3 + (sd > 0 ? 2 : 0)) % 5]]); } });
      insts(h, 'pilierHalle', { pilier: h.mat('peinture', { c: 0xd9693a }) }, piliers, { a: [9] });
      const tole = h.mat('toleToit', { side: D }); inst(h, h.geo('boite', 26, 0.3, 10.6), tole, toits); inst(h, h.geo('boite', 22, 0.5, 10.6), chaume, pailles); inst(h, h.geo('boite', 9, 0.3, 10.6), tole, toitsD); inst(h, h.geo('boite', 8, 0.5, 10.6), chaume, paillesD);
      inst(h, h.geo('boite', 10, 8.8, 0.5), h.mat('crepi', { c: 0xf2b45a }), fonds);
      insts(h, 'etalPlaya', { bois, toile: h.mat('toldo', { side: D }, '#fff4e0', '#1fb5a8'), paille: h.mat('chaume'), hamac: blancT }, etalsM, { teinte: 'hamac' });
      facades(tranche(20, 21, -8, 0), W + 3.6, 10, 0.9); // les dernières maisons du bourg, à la sortie du marché

      // --- secteur 5, la route de garrigue : murets de pierre sèche, poteaux, deux topes peints (visuels : le moteur n'a pas de dos d'âne sans relief) ---
      const gar = tranche(20, 24, -10, 0), murets = [], pot = [];
      chaque(gar, 4, (s, i, k) => { for (const sd of [-1, 1]) if (rnd() < 0.75) { const [x, z] = bord(s, sd, W + 2.6); murets.push([x, -0.05, z, Math.atan2(-s.tz, s.tx)]); }
        if (k % 20 === 0) { const [x, z] = bord(s, 1, W + 6); pot.push([x, -0.05, z, 0, 1.4, 7.5, 1.4]); } });
      insts(h, 'muret', { pierre: calc }, murets, { a: [7] }); inst(h, h.geo('poteauBois'), bois, pot);
      for (const i of [P(21) - 12, P(23) + 10]) couvre(i, 2, -W, W, h.mat('topes', { side: D, ...OFF }), 4);

      // --- secteur 6, le cénote : bassin turquoise peu profond dans tout le cercle de la place, cirque de calcaire autour (ouvert là où passe la route), lianes, escalier, rochers, baigneurs ---
      { const eau = new THREE.Mesh(new THREE.CircleGeometry(130, 72), h.mat('eauCenote', { gloss: 0.4, rep: [26, 26] })); eau.rotation.x = -Math.PI / 2; eau.position.set(CX, -0.04, CZ); eau.receiveShadow = true; h.scene.add(eau); }
      const roches = [], lianes = [], hauts = [], NB = 84;
      for (let k = 0; k < NB; k++) {
        const a = k / NB * 6.2832, dx = Math.sin(a), dz = Math.cos(a), tx = Math.cos(a), tz = -Math.sin(a), Hh = 12 + rnd() * 6, L = 2 * Math.PI * 139.5 / NB + 1;
        if ([129.5, 139.5, 149.5].some(r => [-0.5, 0, 0.5].some(u => ecart(CX + dx * r + tx * u * L, CZ + dz * r + tz * u * L) < 1.5))) continue; // la route passe : ouverture
        roches.push([CX + dx * 139.5, Hh / 2 - 0.5, CZ + dz * 139.5, Math.atan2(dx, dz), 1, Hh / 15, 1]);
        if (rnd() < 0.65) lianes.push([CX + dx * 129.3, Hh - 0.3, CZ + dz * 129.3, Math.atan2(-dx, -dz), 4 + rnd() * 4, Hh - 1 - rnd() * 4, 1]);
        for (let j = 0; j < 3; j++) { const r = 132 + rnd() * 16, b = a + (rnd() - 0.5) * 0.06; hauts.push([CX + Math.sin(b) * r, Hh - 0.5, CZ + Math.cos(b) * r, rnd() * 6, 1.5 + rnd() * 2.5, 1.2 + rnd(), 1.5 + rnd() * 2.5]); }
        if (rnd() < 0.3) palmier(CX + dx * (134 + rnd() * 12), CZ + dz * (134 + rnd() * 12));
      }
      inst(h, h.geo('boite', 2 * Math.PI * 139.5 / NB + 1, 15, 20), calc, roches); inst(h, h.geo('pan'), h.mat('lianes', { side: D, alphaTest: 0.5 }), lianes);
      buissons.push(...hauts);
      for (const [px, pz] of PL.piles) { const x = CX + px * Math.cos(PL.a) + pz * Math.sin(PL.a), z = CZ - px * Math.sin(PL.a) + pz * Math.cos(PL.a); h.pose('rocher', calc, h.scene, [x, 1.2, z]).scale.set(3.3, 3.2, 3.3); } // les deux rochers du milieu : les piles de la place (sim.js les heurte)
      h.pose('escalier', { bois }, h.scene, [CX - 7.5, 12, CZ - 127.4], 30);
      const nageurs = [], boueesC = [];
      for (let k = 0; k < 8; k++) { const a = Math.PI + (rnd() - 0.5) * 1.6, r = 126.5 + rnd() * 2; nageurs.push([CX + Math.sin(a) * r, -0.9, CZ + Math.cos(a) * r, rnd() * 6, 1, 1, 1, PAPEL[k % 5]]); }
      for (let a = 0; a < 6.2832; a += 0.035) { const x = CX + Math.sin(a) * 124.6, z = CZ + Math.cos(a) * 124.6; if (ecart(x, z) > 2) boueesC.push([x, 0.15, z, 0, 0.5, 0.5, 0.5, a * 30 % 2 < 1 ? 0xff6a2b : 0xfff4e0]); } // la limite de la place, côté nord, en ligne de bouées
      insts(h, 'figurant', { blanc: h.mat('peinture', { c: 0x1fb5a8 }), peau: h.mat('peinture', { c: 0xb07850 }), tenue: blancT, or: noix }, nageurs, { a: [0], teinte: 'tenue' });
      colore(inst(h, h.geo('bouee'), blancT, boueesC), boueesC);

      // --- secteur 7, la grotte (le tunnel) : stalactites, puits de lumière avec leurs rayons, eau fluo au pied des parois ---
      { const t0 = T.t0, n = T.t1 - T.t0, stal = [], trous = [];
        for (let i = t0 + 2; i < T.t1 - 1; i += 3) { const s = S[i % N]; for (let j = 0; j < 4; j++) { const d = -W + 0.6 + rnd() * (2 * W - 1.2), l = Math.abs(d) > W - 2.5 ? 1 + rnd() * 2.2 : 0.3 + rnd() * 0.8, r = 0.5 + rnd() * 0.6, [x, z] = bord(s, 1, d); stal.push([x, s.y + 7.98, z, rnd() * 6, r, l, r]); } }
        inst(h, h.geo('stalactite'), h.mat('bruit', {}, '#b8a880', ['#8a7e62', '#d4c8a6', '#a8602c']), stal);
        const rayon = h.mat('rayon', { lum: 1, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: D, fog: false }), rayons = [];
        for (const f of [0.22, 0.55, 0.82]) { const i = (t0 + Math.round(n * f)) % N, s = S[i], d = (f * 10 | 0) % 2 ? 3 : -3, [x, z] = bord(s, 1, d);
          for (const r of [0, 1.5708]) rayons.push([x, s.y + 8, z, enFace(s) + r + 0.4, 1.8, 8, 1]); trous.push([x, s.y + 7.97, z, 0, 3.2, 0.06, 3.2]); h.lum(i, x, s.y + 6.5, z, 0xfff3c0, 26, 1.6); }
        inst(h, h.geo('pan'), rayon, rayons).castShadow = false; inst(h, h.geo('boite', 1, 1, 1), h.mat('peinture', { lum: 1, c: 0xfff3c0 }), trous);
        for (const sd of [-1, 1]) couvre(t0, n, sd * (W - 0.2), sd * (W - 2.2), h.mat('eauCenote', { lum: 1, side: D, ...OFF }), 6); }

      // --- secteur 8, le lobby d'hôtel : carrelage mouillé, colonnade blanche, grand toit de palapa, aile de chambres à l'ouest, piscine, bar et plantes en pot à l'est ---
      const lob = tranche(36, 42, 3, 3), carrel = h.mat('carrelage', { side: D, gloss: 0.2, ...OFF });
      couvre(lob[0], lob[1], -W, W, carrel, 8); for (const sd of [-1, 1]) h.ribbon(lob[0], lob[1], sd * W, 0.02, sd * (W + 9), 0.02, h.mat('carrelage', { side: D, gloss: 0.35 }), 8);
      const cols = [], toitL = [], sousL = [], faite = [], pots = [];
      chaque(lob, 4, (s, i, k) => { for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, W + 0.9); cols.push([x, 0, z]); if (k % 8 === 4) { const [px, pz] = bord(s, sd, W + 2.6); pots.push([px, 0.02, pz, rnd() * 6]); } }
        if (k % 12 === 0) h.lum(i, s.x, s.y + 8, s.z, 0xffe0b0, 22, 0.5); });
      chaque(lob, 5, s => { toitL.push([s.x, 10.3, s.z, h.across(s)]); sousL.push([s.x, 9.9, s.z, h.across(s)]); faite.push([s.x, 11.3, s.z, h.across(s)]); });
      inst(h, h.geo('colonne', 9.9), h.mat('peinture', { c: 0xd8ccb4 }), cols); inst(h, h.geo('boite', 36, 0.6, 10.6), chaume, toitL); inst(h, h.geo('boite', 18, 1.6, 10.6), chaume, faite); inst(h, h.geo('boite', 34, 0.15, 10.6), bois, sousL);
      insts(h, 'potPlante', { pot: h.mat('peinture', { c: 0xd9693a }), plante: feuillage }, pots);
      facades(tranche(36, 42, 0, 0), W + 10.5, 12, 1.5); // l'aile des chambres (les façades de l'est tombent dans la piscine : retirées plus bas)
      { const x0 = W + 12, x1 = W + 38, z0 = 150, z1 = 330, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2; // la piscine, ouverte sur le hall côté est
        for (let k = fac.length - 1; k >= 0; k--) if (fac[k][0] > 0 && fac[k][0] < x1 + 6 && fac[k][2] > 40 && fac[k][2] < 430 && Math.abs(fac[k][0]) < 40) fac.splice(k, 1);
        boite(h, h.mat('merTurquoise', { gloss: 0.6 }), x1 - x0, 0.3, z1 - z0, xc, -0.35, zc);
        for (const [w, d, x, z] of [[x1 - x0 + 3, 1.5, xc, z0 - 0.75], [x1 - x0 + 3, 1.5, xc, z1 + 0.75], [1.5, z1 - z0, x0 - 0.75, zc], [1.5, z1 - z0, x1 + 0.75, zc]]) boite(h, h.mat('carrelage'), w, 0.4, d, x, -0.15, z);
        const tr = []; for (let z = z0 + 6; z < z1; z += 9) tr.push([x1 + 4, -0.05, z, Math.PI, 1, 1, 1, 0xfff4e0]); insts(h, 'transat', { bois, toile: blancT }, tr, { teinte: 'toile' });
        const s = S[P(41)]; h.pose('barPaillote', { bois, bouteilles: h.mat('vitrine', LUM) }, h.scene, [W + 7, 0, s.z + 20]).forEach(m => m.rotation.y = -Math.PI / 2); }

      // --- le reste : hôtels du front de mer, maisons basses du bourg, cocotiers, buissons de garrigue, tours d'hôtels au loin sur la côte ---
      for (let x = 60; x < 600; x += 40) for (let z = 95; z < 400; z += 38) { const px = x + rnd() * 16, pz = z + rnd() * 16; if (rnd() < 0.35 || ecart(px, pz) < 16 || !loinCenote(px, pz, 12) || (px < 95 && pz > 140 && pz < 340)) continue;
        if (pz < 140) fac.push([px, -0.05, pz, rnd() < 0.5 ? 0 : Math.PI, 1.6, 1.4 + rnd() * 0.6, 1.4, 0xfff4e0]); else maisons.push([px, -0.05, pz, (rnd() * 4 | 0) * 1.5708, 0.9, 0.6 + rnd() * 0.25, 0.9, FACADES[rnd() * FACADES.length | 0]]); }
      for (let x = 700; x < 900; x += 26) for (let z = -10; z < 300; z += 26) { const px = x + rnd() * 10, pz = z + rnd() * 10; if (rnd() < 0.3 || ecart(px, pz) < 14) continue; maisons.push([px, -0.05, pz, (rnd() * 4 | 0) * 1.5708, 0.9, 0.6 + rnd() * 0.4, 0.9, FACADES[rnd() * FACADES.length | 0]]); }
      insts(h, 'facadePlaya', { mur: h.mat('facadePlaya'), cadre: h.mat('peinture', { c: 0x4a3424 }), toile: h.mat('toldo', { side: D }, '#fff4e0', '#ff6a2b') }, [...fac, ...maisons], { a: [10, 8], teinte: 'mur' });
      for (let k = 0; k < 900; k++) { const x = -260 + rnd() * 1200, z = 30 + rnd() * 820, e = ecart(x, z); if (e < 4 || !loinCenote(x, z, 2)) continue;
        if (z < 75 || (x > 600 && x < 720 && z < 260)) { if (rnd() < 0.5) palmier(x, z); continue; } if ((x > -45 && x < 60 && z > 40 && z < 430) || (x > 60 && x < 600 && z > 85 && z < 400 && rnd() < 0.6)) { if (rnd() < 0.3) palmier(x, z); continue; }
        if (rnd() < 0.12) palmier(x, z, 1, 0.5); else buissons.push([x, -0.1, z, rnd() * 6, 1.2 + rnd() * 2.4, 0.8 + rnd() * 1.4, 1.2 + rnd() * 2.4]); }
      inst(h, h.geo('buisson'), feuillage, buissons);
      palmiers.forEach((l, v) => insts(h, 'cocotier', { tronc, palme, noix }, l, { a: [v] }));
      const tours = []; for (let k = 0; k < 26; k++) { const x = k < 13 ? -700 + rnd() * 560 : 900 + rnd() * 700, z = 30 + rnd() * 140, hh = 18 + rnd() * 32, w = 20 + rnd() * 30; tours.push([x, hh / 2 - 0.5, z, rnd() < 0.5 ? 0 : 0.3, w / 30, hh / 30, (16 + rnd() * 10) / 20]); }
      inst(h, h.geo('boite', 30, 30, 20), h.mat('crepi', { c: 0xfff4e0 }), tours);
      return (dt, now) => { mMer.map.offset.set(now * 0.000012, now * 0.000007); };
    },
  };
})();
