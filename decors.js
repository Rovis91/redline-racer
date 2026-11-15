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
      const { THREE, S, N, W, M, T, rnd } = h, PL = M.place, [CX, CZ] = PL.c, P0 = i => pt(h, i);
      { const mat0 = h.mat, MC = new Map(); h = { ...h, mat: (...a) => { const k = JSON.stringify(a); return MC.get(k) || MC.set(k, mat0(...a)).get(k); } }; } // une matière par réglage : la fusion de game.js fait une passe de dessin par matière
      const DS = { side: THREE.DoubleSide }, au = (s, d, y = 0) => [s.x - s.tz * d, s.y + y, s.z + s.tx * d]; // au : point à d mètres à droite de l'axe (négatif : à gauche)
      const cull = m => { for (const x of [].concat(m)) { x.computeBoundingSphere(); x.frustumCulled = true; } return m; }, I = (...a) => cull(inst(h, ...a)), Is = (...a) => cull(insts(h, ...a));
      const sansOmbre = (ms, ...gardes) => { for (const m of ms) if (!gardes.includes(m.material)) m.castShadow = false; return ms; }; // seules les grandes masses portent une ombre : chaque petite zone (fenêtres, portes, étoffes) coûtait une passe de plus dans la carte d'ombre
      const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      const enTunnel = i => T.tun && ((i - T.t0 + N) % N) <= ((T.t1 - T.t0 + N) % N), dansSalle = (x, z, e = 0) => Math.hypot(x - CX, z - CZ) < PL.r + e;
      const i9 = P0(9), i12 = P0(12), i14 = P0(14), i20 = P0(20), i24 = P0(24), i25 = P0(25), i39 = P0(39);
      // une nappe de quadrilatères en une seule pièce. tuile : UV à plat (sols), en mètres par motif ; sinon u donné et, si vt, v = hauteur / vt (murs)
      const nappe = (mat, tuile) => { const pos = [], uv = [], idx = []; return {
        quad(a, b, c, d, u0 = 0, u1 = 1, vt = 0) { const k = pos.length / 3; [a, b, c, d].forEach((p, j) => { pos.push(p[0], p[1], p[2]); if (tuile) uv.push(p[0] / tuile, p[2] / tuile); else uv.push(j < 2 ? u0 : u1, Array.isArray(vt) ? vt[j] : vt ? p[1] / vt : j & 1 ? 0 : 1); }); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); },
        fin() { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); q.setIndex(idx); q.computeVertexNormals(); const m = new THREE.Mesh(q, mat); m.receiveShadow = m.castShadow = true; h.scene.add(m); return m; } }; };
      // un mur vertical qui suit une ligne brisée : seg(x0, z0, x1, z1, haut, bas[, haut1, bas1]) ; la texture file le long du mur, tv mètres par motif
      // haut : la texture est calée sur le sommet du mur (chaperon, frise), tv = hauteur d'un motif ; sinon elle suit l'altitude
      const paroi = (mat, tv = 8, haut = 0, tu = tv) => { const n = nappe(mat); let u = 0; return { seg(x0, z0, x1, z1, h0, b0, h1 = h0, b1 = b0) { const l = Math.hypot(x1 - x0, z1 - z0); n.quad([x0, h0, z0], [x0, b0, z0], [x1, h1, z1], [x1, b1, z1], u / tu, (u + l) / tu, haut ? [1, 1 - (h0 - b0) / tv, 1, 1 - (h1 - b1) / tv] : tv); u += l; }, fin: () => n.fin() }; };
      // un mur le long de la route, de l'échantillon i0 sur n échantillons : écart à l'axe, sommet et pied au-dessus de la chaussée (nombres ou fonctions de l'échantillon). h.ribbon tourne la texture d'un quart de tour : réservé aux sols
      const murS = (i0, n, off, haut, bas, p) => { const f = (o, s) => typeof o === 'function' ? o(s) : o; for (let k = 0; k < n; k++) { const a = S[(i0 + k) % N], b = S[(i0 + k + 1) % N], A = au(a, f(off, a)), B = au(b, f(off, b)); p.seg(A[0], A[2], B[0], B[2], a.y + f(haut, a), a.y + f(bas, a), b.y + f(haut, b), b.y + f(bas, b)); } };
      // l'eau de la carte, turquoise ; la rigole : le fil d'eau qui descend tout le tour, à droite de la chaussée, entre deux bordures ivoire
      const eau = h.mat('bruit', { ...DS, emissive: 0x124a44 }, '#2aa39a', ['#3ab8ae', '#1f8c84', '#bfe8e0']), ivoire = h.mat('peinture', { c: 0xe8dcc0, side: THREE.DoubleSide });
      const rigole = (i0, n, d0 = 1.5, d1 = 0.5) => { i0 = (i0 + N) % N; h.ribbon(i0, n, s => s.w - d0, 0.05, s => s.w - d1, 0.05, eau, 6); h.ribbon(i0, n, s => s.w - d0 - 0.25, 0.06, s => s.w - d0, 0.06, ivoire, 4); h.ribbon(i0, n, s => s.w - d1, 0.06, s => s.w - d1 + 0.25, 0.06, ivoire, 4); };
      // une dalle plate posée sur un polygone [[x, z], …]
      const dalle = (poly, y, mat, tuile) => { const q = new THREE.ShapeGeometry(new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)))); q.rotateX(-Math.PI / 2); const p = q.attributes.position, uv = q.attributes.uv; for (let k = 0; k < p.count; k++) { p.setY(k, y); uv.setXY(k, p.getX(k) / tuile, p.getZ(k) / tuile); } q.computeVertexNormals(); const m = new THREE.Mesh(q, mat); m.receiveShadow = true; h.scene.add(m); return m; };
      const dansPoly = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
      const pierre = h.mat('pierre'), sculpte = h.mat('sculpte'), or = h.mat('peinture', { c: 0xf0b840 }), crue = h.mat('briqueCrue'), sombre = h.mat('peinture', { c: 0x2a1c14 }), noir = h.mat('sculpte', { c: 0x8a8480 });
      const appareil = h.mat('appareil', { ...DS, emissive: 0x3a2a18 }), relief = h.mat('relief', DS), dallage = h.mat('dallesPerse', DS);

      // ================= le site : un seul terrain =================
      // La plaine est plate (0 m). La terrasse de Persépolis (+14 m) est une plate-forme à bords verticaux : toute la bande sud, de la salle à la Porte, avancée au nord-est jusqu'au pied de la rampe,
      // qui longe son mur est. Le jardin la prolonge à l'ouest, en contre-haut de la ville basse. À l'est et au sud, le Kuh-e Rahmat monte dès le pied de la rampe et derrière la salle.
      const YT = 14, TZ = 372, TXO = 312, AX0 = 560, AZ = 215, TXE = 705, TZS = 566; // niveau de la terrasse ; son bord nord, son bord ouest (le perron), l'avancée de l'Apadana (x ≥ AX0, jusqu'à z = AZ), ses bords est et sud (au pied de la montagne)
      const rampeD = []; for (let i = i9; i <= i12 + 2; i++) { const [x, , z] = au(S[i], S[i].w + 0.6); if (z >= AZ) rampeD.push([x, z, S[i].y]); } // le bord droit de la rampe : le mur est de la terrasse
      const TP = [[TXO, TZ], [AX0, TZ], [AX0, AZ], [rampeD[0][0], AZ], ...rampeD, [TXE, rampeD[rampeD.length - 1][1]], [TXE, TZS], [TXO, TZS]];
      const PIED = [[900, -420], [760, -160], [722, -10], [720, 400], [708, 566], [520, 578], [300, 590], [120, 640], [-150, 780]]; // le pied du Kuh-e Rahmat : la montagne est à gauche de cette ligne
      const dMont = (x, z) => { let bd = 1e9, cote = 0; for (let k = 0; k < PIED.length - 1; k++) { const [ax, az] = PIED[k], [bx, bz] = PIED[k + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))), ex = x - ax - dx * t, ez = z - az - dz * t, e = Math.hypot(ex, ez); if (e < bd) { bd = e; cote = dx * ez - dz * ex; } } return cote < 0 ? bd : 0; };
      // le relief du Kuh-e Rahmat : des arêtes vives (1 - |sin|, deux familles déformées) au lieu de bosses rondes (on lisait des dunes), et des bancs de calcaire : la pente se casse en gradins de 16 m
      const arete = (x, z) => { const u = (x * 0.6 + z) / 45 + 1.2 * Math.sin(x / 71) + 0.8 * Math.sin(z / 53), v = (x - z * 0.5) / 23 + Math.sin(z / 37); return 0.77 * (1 - Math.abs(Math.sin(u))) + 0.23 * (1 - Math.abs(Math.sin(v))); };
      const hMont = (x, z) => { const d = dMont(x, z); if (d <= 0) return 0; const y = 230 * (1 - Math.exp(-d / 140)) * (0.35 + 0.65 * arete(x, z)) * (0.8 + 0.2 * Math.sin(x / 131 + z / 97)), b = y / 16, fr = b - Math.floor(b);
        return y < 10 ? y : 16 * (Math.floor(b) + ss(0.55, 0.95, fr)) * 0.6 + y * 0.4; };
      const basse = (x, z) => x < 648 && z < (x < AX0 - 14 ? TZ + 14 : AZ + 14) ? ss(140, 185, x) : 0; // la plaine et la ville basse : à plat, jusqu'à 14 m derrière le mur de la terrasse (la pente du maillage reste cachée derrière lui)
      const jard = S.slice(i20 + 3, i25 - 2);
      const g = terrain(h, { pas: 12, marge: 360, mat: h.mat('bruit', { flatShading: true }, '#cdb47c', ['#c2a86e', '#d6c08c', '#b89c64']),
        couches: [{ tex: ['bruit', '#b9ad9c', ['#9c9080', '#d0c6b6', '#857a6c']], rep: 0.3, poids: (x, z, y, p) => Math.max(ss(0.1, 0.3, p), ss(22, 40, y)) * (dMont(x, z) > 0 ? 1 : 0) },
          { tex: ['bruit', '#8e7460', ['#7a624e', '#a08670', '#6a5444']], rep: 0.3, poids: (x, z, y, p) => dMont(x, z) > 0 ? ss(0.3, 0.55, p) * ss(14, 30, y) : 0 }, // les fronts des bancs, plus raides : une roche brune, dans l'ombre
          { tex: ['bruit', '#e2cfa4', ['#f0deb4', '#d0bc90', '#c8b088']], rep: 0.3, poids: (x, z, y, p) => dMont(x, z) > 0 ? ss(0.75, 0.95, arete(x, z)) * ss(60, 110, y) * (1 - ss(0.25, 0.45, p)) : 0 }], // les crêtes hautes, dorées par le couchant // le calcaire du Kuh-e Rahmat, sur ses pentes
        creux: (x, z, y) => { const k = basse(x, z); let c = y * (1 - k) - 0.5 * k; if (dansPoly(x, z, TP)) c = Math.min(c, YT - 0.4);
          if (x > 100 && x < TXO + 6 && z > TZ && z < 530) { let d = 1e9; for (const s of jard) d = Math.min(d, Math.hypot(s.x - x, s.z - z)); c -= 2.6 * ss(19, 25, d) * (1 - ss(60, 72, d)); } // les parterres du jardin : sous l'allée, en paliers (posés plus bas, à part)
          return y - (c + hMont(x, z)); } });
      const sol = (x, z) => g.hAt(x, z), libre = (x, z, m = 6) => g.dAt(x, z) > W + m && !dansSalle(x, z, 8);
      // --- la terrasse : sa dalle, ses murs nus en grand appareil (REFS §1), un parapet d'un mètre ---
      dalle(TP, YT - 0.08, dallage, 8);
      { const mu = paroi(appareil, 8), HP = YT + 1.1; mu.seg(TXO, TZS, TXO, TZ, HP, 4); mu.seg(TXO, TZ, AX0, TZ, HP, -1); mu.seg(AX0, TZ, AX0, AZ, HP, -1); mu.seg(AX0, AZ, rampeD[0][0], AZ, HP, -1);
        for (let k = 0; k < rampeD.length - 1; k++) { const [x0, z0, y0] = rampeD[k], [x1, z1, y1] = rampeD[k + 1]; mu.seg(x0, z0, x1, z1, HP, y0 - 1, HP, y1 - 1); } mu.fin();
        const ch = nappe(pierre, 4); for (const [x0, z0, x1, z1] of [[TXO, TZ, AX0, TZ], [AX0, TZ, AX0, AZ], [AX0, AZ, rampeD[0][0], AZ]]) { const dx = Math.sign(x1 - x0), dz = Math.sign(z1 - z0), nx = dz * 0.6, nz = -dx * 0.6; ch.quad([x0 + nx, HP, z0 + nz], [x0 - nx, HP, z0 - nz], [x1 + nx, HP, z1 + nz], [x1 - nx, HP, z1 - nz]); } ch.fin(); } // le chaperon du parapet
      { const fl = paroi(appareil, 8); for (let i = i9 - 4; i < i12; i++) { const a = au(S[i], S[i].w + 0.6), b = au(S[i + 1], S[i + 1].w + 0.6); if (a[2] < AZ) fl.seg(a[0], a[2], b[0], b[2], a[1], -1, b[1], -1); } fl.fin(); } // sous le pied de la rampe, avant le mur : son flanc

      // --- le sol hors de la bande de chaussée, là où la route est plus large qu'elle ; le dallage de la salle (un disque, M.place) ---
      const YS = S[P0(17)].y, bas = nappe(h.mat('bruit', { ...DS, emissive: 0x4a3420 }, '#b89a70', ['#a88a60', '#c8aa80']), 6);
      for (let i = 0; i < N; i++) { const a = S[i], b = S[(i + 1) % N]; if (a.w < W + 0.05 && b.w < W + 0.05) continue; for (const sd of [-1, 1]) bas.quad(au(a, sd * W, 0.02), au(b, sd * W, 0.02), au(a, sd * a.w, 0.02), au(b, sd * b.w, 0.02)); }
      bas.fin();
      const HC = 19, ca = Math.cos(PL.a), sa = Math.sin(PL.a), cols = PL.piles.map(([x, z]) => [CX + x * ca + z * sa, YS, CZ - x * sa + z * ca, 0]);
      const ruines = []; // colonnes de ruine (Apadana, palais de Darius) : posées en un seul lot, plus bas

      // ================= le lointain =================
      // une crête = une bande verticale à sommet dentelé, plate, hors brouillard : deux chaînes du Zagros, de silhouettes différentes
      const crete = (pts, mat) => { const n = nappe(mat); for (let k = 0; k < pts.length - 1; k++) { const [x0, z0, y0] = pts[k], [x1, z1, y1] = pts[k + 1]; n.quad([x0, y0, z0], [x0, -30, z0], [x1, y1, z1], [x1, -30, z1]); } const m = n.fin(); m.castShadow = m.receiveShadow = false; return m; };
      const dent = (k, base, amp, f) => base + amp * (0.5 * Math.abs(Math.sin(k * 0.71 * f + 1.3)) + 0.3 * Math.abs(Math.sin(k * 1.93 * f)) + 0.2 * ((k * 0.618) % 1));
      for (const [r, base, amp, c, n, f] of [[2150, 90, 170, 0x9a7a98, 120, 1], [1600, 40, 90, 0xa8866e, 150, 0.37]]) crete(Array.from({ length: n + 1 }, (_, k) => { const a = k / n * 6.2832; return [300 + Math.cos(a) * r, 250 + Math.sin(a) * r, dent(k + r, base, amp, f)]; }), h.mat('peinture', { lum: 1, c, fog: false, side: THREE.DoubleSide }));
      // trois buttes à sommet plat, loin dans la plaine (les « trois dômes » d'Istakhr, près de Persépolis) : les mêmes repères depuis la rue, la terrasse et le bazar ; la carte a un pays autour d'elle
      for (const [a, r, l, ht] of [[-2.25, 1250, 430, 88], [-1.35, 1380, 300, 70], [2.75, 1300, 380, 92]]) { const cx = 300 + Math.cos(a) * r, cz = 250 + Math.sin(a) * r, tx = -Math.sin(a), tz = Math.cos(a), P = (u, y) => [cx + tx * u, cz + tz * u, y]; crete([P(-l / 2, -5), P(-l / 2 + l * 0.14, ht * 0.9), P(-l * 0.1, ht), P(l / 2 - l * 0.2, ht * 0.94), P(l / 2, -5)], h.mat('peinture', { lum: 1, c: 0x6a5670, fog: false, side: THREE.DoubleSide })); }
      // la falaise de Naqsh-e Rostam (REFS §9), au nord-ouest, à un kilomètre du départ : une barre claire à sommet plat, quatre tombeaux en croix. Repère du retour vers la ligne
      const croix = (x, y, z, ry, k, mat, fond) => { for (const [w, ht, dy] of [[9, 22, 0], [19, 8, 1]]) { const m = boite(h, dy ? mat : fond, w * k, ht * k, 0.8, x, y + (11 + dy) * k, z); m.rotation.y = ry; m.castShadow = false; } const p = boite(h, fond, 2.2 * k, 4 * k, 1, x, y + 10 * k, z); p.rotation.y = ry; };
      { const A = [-930, -520], B = [-360, -930], L = Math.hypot(B[0] - A[0], B[1] - A[1]), ry = Math.atan2(-(B[1] - A[1]), B[0] - A[0]), n = 24;
        crete(Array.from({ length: n + 1 }, (_, k) => [A[0] + (B[0] - A[0]) * k / n, A[1] + (B[1] - A[1]) * k / n, k === 0 || k === n ? 20 : 78 + 9 * Math.sin(k * 1.7) + 5 * Math.sin(k * 4.1)]), h.mat('peinture', { lum: 1, c: 0xd9bf98, fog: false, side: THREE.DoubleSide }));
        const fo = h.mat('peinture', { lum: 1, c: 0x7a6450, fog: false }), fa = h.mat('peinture', { lum: 1, c: 0xa88a68, fog: false });
        for (const t of [0.24, 0.42, 0.6, 0.78]) croix(A[0] + (B[0] - A[0]) * t + 3, 12, A[1] + (B[1] - A[1]) * t + 3, ry, 1.5, fa, fo); }

      // --- le Kuh-e Rahmat : deux pans de falaise taillés à pic dans sa pente, chacun avec un tombeau royal en croix (ceux d'Artaxerxès II et III, au-dessus de la terrasse) ---
      // l'un est dans l'axe de la sortie de la Porte des Nations, l'autre domine la salle aux cent colonnes : les deux repères de la terrasse
      const roc = h.mat('peinture', { c: 0xb4a894, side: THREE.DoubleSide, flatShading: true }), tombe = (x, z, larg, haut) => { const f = paroi(roc, 20), y0 = sol(x, z) - 2, top = nappe(roc, 20); // un éperon de roche nue, à pans irréguliers, qui se perd dans la pente derrière lui
        const P = [[-larg / 2 - 46, 74, haut + 26], [-larg / 2 - 20, 26, haut + 12], [-larg / 2 - 5, 5, haut + 5], [-larg / 2, 0, haut], [larg / 2, 0, haut - 3], [larg / 2 + 6, 6, haut + 4], [larg / 2 + 24, 30, haut + 9], [larg / 2 + 50, 74, haut + 24]].map(([u, v, t]) => [x + u, z + v, y0 + t]);
        for (let k = 0; k < P.length - 1; k++) { f.seg(P[k][0], P[k][1], P[k + 1][0], P[k + 1][1], P[k][2], y0 - 4, P[k + 1][2], y0 - 4); top.quad([P[k][0], P[k][2], P[k][1]], [P[k + 1][0], P[k + 1][2], P[k + 1][1]], [P[k][0], y0 + haut + 30, z + 78], [P[k + 1][0], y0 + haut + 30, z + 78]); } f.fin(); top.fin();
        // la façade taillée dans le roc, en croix (REFS §9) : bras haut à relief, bras du milieu en façade de palais à quatre colonnes et porte noire, bras bas nu
        const om = h.mat('peinture', { c: 0x8a7c6a }), cl = h.mat('peinture', { c: 0xcfc3ad }), yc = y0 + 9; boite(h, om, 9, 24, 1.2, x, yc + 12, z - 0.3); boite(h, om, 21, 8.5, 1.2, x, yc + 12, z - 0.3);
        for (const u of [-8, -3.2, 3.2, 8]) boite(h, cl, 1, 7, 0.5, x + u, yc + 12, z - 1); boite(h, cl, 21.6, 0.8, 0.6, x, yc + 16.4, z - 1); boite(h, sombre, 2.2, 3.6, 0.5, x, yc + 10, z - 1); boite(h, cl, 5, 3, 0.4, x, yc + 20.5, z - 1); };
      tombe(661, 600, 56, 44); tombe(432, 612, 62, 42);

      // --- l'Apadana en ruine sur l'avancée nord-est de la terrasse : un soubassement à reliefs, treize colonnes de 19 m encore debout (REFS §5). C'est le repère de toute la plaine ---
      { for (let k = 0; k < rampeD.length; k += 7) { const [x, z] = rampeD[k]; if (z < TZ - 10) ruines.push([x - 4.5, YT - 0.1, z, 0, 1, [1, 0.7, 1, 1, 0.5, 1][(k / 7) % 6], 1]); } for (let x = AX0 + 6; x < rampeD[0][0] - 8; x += 11) ruines.push([x, YT - 0.1, AZ + 4.5, 0, 1, [1, 1, 0.6, 1][((x - AX0) / 11 | 0) % 4], 1]); }

      // ================= la plaine et la ville basse =================
      // --- au nord et à l'ouest de la route, les champs en lanières jusqu'à l'horizon (REFS §15) : chaume, luzerne, labour ---
      { const ch = [['#d2b468', '#c0a252'], ['#8da05a', '#7a8e4c'], ['#9a7048', '#86603c']].map(c => nappe(h.mat('champ', { ...DS, emissive: 0x3a2c14 }, ...c), 12)), [bx0, bz0, bx1] = g.box;
        for (let x = bx0 + 10, i = 0; x < bx1 - 60; x += 70 + (i * 37) % 50, i++) for (let z = bz0 + 10, j = 0; z < 360; z += 120 + ((i + j) * 53) % 90, j++) { const w = 60 + (i * 37) % 50, l = 110 + ((i + j) * 53) % 90;
          if ((i * 7 + j * 3) % 5 === 0 || dMont(x + w / 2, z + l / 2) > 0 || dMont(x + w, z + l) > 0 || x + w > 185 && z + l > 90 || z + l > 110 && x + w > -75) continue; const c = [[x, z], [x + w - 6, z], [x, z + l - 6], [x + w - 6, z + l - 6]]; if (c.some(([px, pz]) => g.dAt(px, pz) < 36)) continue;
          ch[(i * 5 + j * 3) % 3].quad(...c.map(([px, pz]) => [px, sol(px, pz) + 0.12, pz])); }
        ch.forEach(n => { const m = n.fin(); m.castShadow = false; }); }
      // --- au milieu de la boucle, la ville basse : un damier de vergers clos de murs de terre (grenadiers, orangers), des ruelles entre eux, un caravansérail au centre ---
      { const mur = paroi(h.mat('murTerre', { ...DS, emissive: 0x2a2010 }), 3.6), herbe = nappe(h.mat('bruit', { ...DS, emissive: 0x1a2410 }, '#6a7a3e', ['#5a6a34', '#7a8a48']), 10), arbres = [], CV = [372, 232];
        for (let x = 192, i = 0; x < 640; x += 58, i++) for (let z = 98, j = 0; z < TZ - 12; z += 58, j++) { const x1 = x + 50, z1 = Math.min(z + 50, (x1 > AX0 - 8 ? AZ : TZ) - 10); if (z1 - z < 24) continue;
          if ([[x, z], [x1, z], [x, z1], [x1, z1], [(x + x1) / 2, z]].some(([px, pz]) => g.dAt(px, pz) < 38) || Math.abs(x + 25 - CV[0]) < 60 && Math.abs(z + 25 - CV[1]) < 60) continue;
          mur.seg(x, z, x1, z, 3, -0.6); mur.seg(x1, z, x1, z1, 3, -0.6); mur.seg(x1, z1, x, z1, 3, -0.6); mur.seg(x, z1, x, z, 3, -0.6); herbe.quad([x, 0.06, z], [x1, 0.06, z], [x, 0.06, z1], [x1, 0.06, z1]);
          for (let ax = x + 5; ax < x1 - 3; ax += 10) for (let az = z + 5; az < z1 - 3; az += 10) arbres.push([ax, 3.5, az, (ax * 7 + az * 3) % 6, 3.8, 2.6 + ((ax * 3 + az) % 5) * 0.14, 3.8, (i + j) % 3 ? 0 : 1]); }
        mur.fin(); herbe.fin().castShadow = false;
        I(h.geo('houppierRond'), h.mat('bruit', {}, '#4e6e34', ['#5a7a3e', '#3e5a2c']), arbres.filter(a => !a[7])).castShadow = false; I(h.geo('houppierRond'), h.mat('bruit', {}, '#4a6a30', ['#e08a2a', '#3e5a2c', '#d87a20']), arbres.filter(a => a[7])).castShadow = false; // grenadiers ; orangers en fruits
        h.pose('caravanserail', { crue: h.mat('facadeCrue'), sombre, brique: h.mat('brique', { c: 0xd8a070 }), faience: h.mat('faience') }, h.scene, [CV[0], -0.3, CV[1]]); }

      // --- le ciel de miniature : quelques volutes de nuages, au-dessus du couchant (à l'ouest) ---
      { const vol = h.mat('volute', { fog: false, alphaTest: 0.5, ...DS }); for (let k = 0; k < 5; k++) { const a = Math.PI + 0.55 - k * 0.42, r = 1800, w = 300 + (k * 97) % 160; const m = h.pose('panneau', vol, h.scene, [300 + Math.cos(a) * r, 430 + (k * 131) % 170, 250 + Math.sin(a) * r]); m.scale.set(w, w / 2, 1); m.lookAt(300, m.position.y, 250); } }

      // ================= la route royale dans la plaine : une rue de village =================
      // Les façades sont au ras de la chaussée : des îlots de 30 m (trois maisons de terre différentes, 5 à 15 m de haut, portes à cadre turquoise, fenêtres allumées au couchant, boutique à auvent, balcon de bois).
      // Un emplacement sur quatre, décalé d'un côté à l'autre, reste un mur de jardin de 4 m avec sa porte et ses arbres. Le mur ne s'abaisse nulle part : la rue est bâtie d'un bout à l'autre.
      // Trois passages couverts (sabat) enjambent la rue : une pièce habitée qui relie deux maisons. Au pied des façades : jarres, bois empilé, charrettes. À droite, une rigole d'eau. Chaussée dallée, sans marquage.
      const terre = h.mat('murTerre', { ...DS, emissive: 0x2a2010 }), peuplier = h.mat('bruit', {}, '#6f8a45', ['#7c9850', '#5c7638']), R0 = N - 30, rel = k => (R0 + k) % N; // R0 : la rue commence 60 m avant la ligne
      const KG = 30 + 332, KD = 30 + i9 + 8, K0 = 27; // K0 : la rue du bazar (morceau 6) continue jusque-là, dans le dernier virage, trop courbe pour les îlots de 30 m ; la rue de village commence après
      const maisons = [], peup = [], calottesV = [], dehors = (s, sd) => Math.atan2(-s.tz, s.tx) + (sd < 0 ? Math.PI : 0); // dehors : orientation d'une pièce dont le Z local s'éloigne de la route
      const fenetre = h.mat('peinture', { lum: 1, c: 0xffc058 }), peauRue = { crue: h.mat('facadeCrue', { emissive: 0x2a2010 }), toit: h.mat('brique', { c: 0xb88868 }), cadre: h.mat('faience'), porte: h.mat('planches', { c: 0x7a5a3c }), fenetre, volet: h.mat('planches', { c: 0x5a4630 }), bois: h.mat('planches'), boutique: h.mat('hojreh', { emissive: 0x4a3828 }), faience: h.mat('faience'), auvent: h.mat('auvent', DS, '#a23b2a', '#e8d9b5'), tapis: h.mat('tapis', {}, '#a23b2a', '#1f3a6e', '#f0b840') };
      const ilots = [], aIlot = (sd, m) => { const k = 8 + 17 * m, K = sd < 0 ? KG : KD; if (k < K0 + 15 || k > K - 26 || (m + (sd > 0 ? 2 : 0)) % 4 === 3) return false; for (const e of [-7, 0, 7]) if (Math.abs(S[rel(k + e)].k || 0) > 0.018) return false; return true; };
      { const verger = [], etalsV = [[], []], cadres = [], portes = [], debord = [], tapisM = [], ruellesI = [], jarres = [], bois = [], roues = [], mt = paroi(terre, 4, 1, 4), chap = h.mat('peinture', { c: 0xdcb880, side: THREE.DoubleSide }), mp = paroi(appareil, 8);
        for (const sd of [-1, 1]) { const K = sd < 0 ? KG : KD, off = s => sd * (s.w + 0.4); let a = 0;
          const pose = (a, b, ht) => { if (b <= a) return; murS(rel(a), b - a, off, ht, -0.6, mt); h.ribbon(rel(a), b - a, s => sd * (s.w + 0.1), ht, s => sd * (s.w + 0.7), ht, chap, 4); };
          const ruelles = []; for (let m = 0; 8 + 17 * (m + 1) < K; m++) if (aIlot(sd, m) && aIlot(sd, m + 1)) { const c = 8 + 17 * m + 8, s = S[rel(c)], [x, , z] = au(s, sd * (s.w + 0.3)); ruelles.push(c); ruellesI.push([x + s.tx, s.y - 0.3, z + s.tz, dehors(s, sd)]); } // entre deux îlots : une ruelle latérale, vue en enfilade
          const haut = k => ruelles.some(c => k >= c - 1 && k <= c + 1) ? 0 : 4; for (let k = K0, k0 = K0; k <= K; k++) if (k === K || haut(k) !== haut(k0)) { if (haut(k0)) pose(k0, k, haut(k0)); k0 = k; }
          for (let m = 2; 8 + 17 * m < K; m++) { const k = 8 + 17 * m, s = S[rel(k)];
            if (aIlot(sd, m)) { const [x, , z] = au(s, sd * (s.w + 0.25)); ilots.push([x, s.y - 0.3, z, dehors(s, sd), 1, 0.88 + ((m * 5 + (sd > 0) * 3) % 5) * 0.07, 1]);
              const t = (m + (sd > 0)) % 3, sj = S[rel(k + 4 - t * 4)], [jx, , jz] = au(sj, sd * (sj.w - (sd > 0 ? 2.4 : 0.8))), ax = sj.tx, az = sj.tz; // au pied des façades, sur le bord de la chaussée : des jarres, du bois empilé ou une charrette
              if ((m + (sd > 0)) % 2 === 0) { const se = S[rel(k - 9)], [ex, , ez] = au(se, sd * (se.w - (sd > 0 ? 3.4 : 2.3))); etalsV[(m >> 1) % 2].push([ex, se.y, ez, dehors(se, sd)]); } // un étal à auvent devant un îlot sur deux
              if (t === 0) for (const [e, r] of [[0, 1], [0.9, 0.75], [-0.8, 0.85]]) jarres.push([jx + ax * e, sj.y + 0.5 * r, jz + az * e, 0, 0.36 * r, 0.55 * r, 0.36 * r]);
              else if (t === 1) for (const e of [0, 0.5]) bois.push([jx, sj.y + 0.3 + e * 1, jz, h.across(sj), 0.8, 0.5, 2.2 - e]);
              else { bois.push([jx, sj.y + 0.95, jz, h.across(sj), 1.2, 0.5, 2.4]); for (const e of [-0.9, 0.9]) roues.push([jx + ax * e, sj.y + 0.6, jz + az * e, h.across(sj), 0.14, 0.62, 0.62]); } }
            else { for (const e of [-5, 0, 5]) { const s2 = S[rel(k + e)], [x, , z] = au(s2, sd * (s2.w + 2.6)), f = 0.85 + (((k + e) * 13) % 7) * 0.05; peup.push([x, sol(x, z) + 8.5, z, (k + e) % 6, 1.9 * f, 8.2 + (((k + e) * 7) % 5) * 0.7, 1.9 * f]); } // un mur de jardin : sa porte, trois peupliers, des arbres de verger
              for (const e of [-6, -2, 2, 6]) for (const d of [8, 14]) { const s2 = S[rel(k + e)], [x, , z] = au(s2, sd * (s2.w + d)); if (g.dAt(x, z) > s2.w + 5) verger.push([x, sol(x, z) + 3.2, z, (k + e) % 6, 2.9, 2.5, 2.9]); }
              for (const e of [-4, 3]) { const s2 = S[rel(k + e)], [x, , z] = au(s2, sd * (s2.w + 1.6)); debord.push([x, s2.y + 5.6, z, (k + e) % 6, 4.4, 3.4, 4.4]); } // les arbres du jardin débordent par-dessus le mur
              { const s2 = S[rel(k + 6)], [x, , z] = au(s2, sd * (s2.w + 0.4)); tapisM.push([x, s2.y + 3.1, z, h.across(s2)]); } // un tapis rouge à cheval sur la crête du mur
              const [px, , pz] = au(s, sd * (s.w + 0.3)); portes.push([px, s.y + 1.4, pz, h.across(s)]); cadres.push([px, s.y + 1.6, pz, h.across(s)]); // la porte, dans son cadre de faïence turquoise comme celles des maisons
              { const s2 = S[rel(k - 6)], [x, , z] = au(s2, sd * (s2.w + 0.4)); tapisM.push([x, s2.y + 3.1, z, h.across(s2)]); } // un second tapis sur la crête
              for (const [e0, n] of [[-10, 3], [10, 2]]) for (let q = 0; q < n; q++) { const s2 = S[rel(k + e0)], [x, , z] = au(s2, sd * (s2.w - (sd > 0 ? 2.4 : 0.8))), r = 1 - q * 0.15; jarres.push([x + s2.tx * q * 0.9, s2.y + 0.5 * r, z + s2.tz * q * 0.9, 0, 0.36 * r, 0.55 * r, 0.36 * r]); } } } }
        for (const kk of [24, 28]) { const s2 = S[rel(kk)], [x, , z] = au(s2, -(s2.w + 2.2)); debord.push([x, s2.y + 5.6, z, kk % 6, 4.4, 3.4, 4.4]); } // au raccord de la rue du bazar et du premier îlot, à gauche de la ligne : deux arbres devant le pignon nu
        [['#a23b2a', '#e8d9b5'], ['#2aa39a', '#e8d9b5']].forEach((c, n) => sansOmbre(Is('etalPerse', { bois: peauRue.bois, auvent: h.mat('auvent', DS, ...c), marchandise: h.mat('peinture', { c: n ? 0xf0b840 : 0xc8323c }) }, etalsV[n])));
        sansOmbre(Is('ilot', peauRue, ilots), peauRue.crue); sansOmbre(Is('ruelle', { crue: peauRue.crue, sol: h.mat('peinture', { c: 0xb89a70 }), cadre: peauRue.cadre, porte: peauRue.porte, fenetre, arc: h.mat('peinture', { c: 0xdccfb4 }) }, ruellesI));
        I(h.geo('houppierRond'), h.mat('bruit', {}, '#4f7a3a', ['#5c8a44', '#3e6b34']), debord).castShadow = false; I(h.geo('boite', 0.7, 2, 2.2), peauRue.tapis, tapisM);
        { const sab = []; for (const m of [2, 9, 13, 17, 21]) if (aIlot(-1, m) && aIlot(1, m) && sab.length < 3) { const s = S[rel(8 + 17 * m + 5)]; sab.push([s.x, s.y - 0.3, s.z, h.across(s), 1, 1, 1]); } sansOmbre(Is('sabat', peauRue, sab, { a: [11] }), peauRue.crue); }
        I(h.geo('houppierRond'), h.mat('bruit', {}, '#4e6e34', ['#5a7a3e', '#3e5a2c']), verger).castShadow = false; I(h.geo('boite', 0.5, 2.8, 1.8), h.mat('planches', { c: 0x7a5a3c }), portes); I(h.geo('boite', 0.4, 3.3, 2.5), peauRue.cadre, cadres);
        I(h.geo('houppierRond'), h.mat('peinture', { c: 0xb5683c }), jarres); I(h.geo('bloc'), h.mat('planches', { c: 0x9a7a52 }), bois); I(h.geo('houppierRond'), h.mat('peinture', { c: 0x3a2c20 }), roues);
        rigole(rel(K0), KD - K0); // la rigole au pied des façades de droite
        murS(300, i9 + 8 - 300, s => s.w + 0.3, 1.3, -0.6, mp); mt.fin(); mp.fin(); } // les 250 derniers mètres avant la terrasse : le pied du mur passe à la pierre
      // --- le virage du pied de la montagne (fin de la plaine) : côté extérieur, plus de mur de terre ; un muret de pierre, de grands platanes, la roche qui affleure ---
      { const tr = [], ho = [], rocs = [], i0 = 332, n = i9 - i0; { const p = paroi(appareil, 8); murS(i0, n, s => -(s.w + 0.4), 0.9, -0.6, p); p.fin(); } h.ribbon(i0, n, s => -(s.w + 0.1), 0.9, s => -(s.w + 0.8), 0.9, pierre, 4);
        for (let i = i0 + 8; i < i9 + 30; i += 11) { const s = S[i], [x, , z] = au(s, -(s.w + 5 + (i % 4))), y = sol(x, z); tr.push([x, y + 3.2, z, 0, 0.9, 7.4, 0.9]); ho.push([x, y + 9.5, z, i % 6, 6.2, 4.6, 6.2]); }
        for (let i = i0; i < i9 + 20; i += 4) { const s = S[i], d = s.w + 9 + ((i * 7) % 16), [x, , z] = au(s, -d), k = 1.5 + ((i * 5) % 7) * 0.5; rocs.push([x, sol(x, z) + k * 0.3, z, i % 5, k * 1.4, k, k * 1.1]); }
        { const cy = []; for (let i = i0 + 2; i < i9 + 24; i += 3) { const s = S[i], d = s.w + 13 + ((i * 11) % 34), [x, , z] = au(s, -d), f = 0.8 + ((i * 7) % 6) * 0.12; cy.push([x, sol(x, z) - 0.6, z, 0, f, f, f]); } I(h.geo('cypres'), h.mat('peinture', { c: 0x2f4a2e }), cy).castShadow = false; } // des cyprès sombres sur la pente claire : elle n'est plus un aplat
        I(h.geo('bloc'), h.mat('peinture', { c: 0x8a7458 }), tr); I(h.geo('houppierRond'), h.mat('bruit', {}, '#5a7a3a', ['#6a8a44', '#46642e']), ho); I(h.geo('houppierRond'), h.mat('bruit', { flatShading: true }, '#b9ad9c', ['#9c9080', '#d0c6b6', '#857a6c']), rocs); }
      I(h.geo('houppierRond'), peuplier, peup).castShadow = false;
      // --- la chaussée dallée : des joints en travers sur toute la route à ciel ouvert, hors de l'escalier (qui a ses marches) et de la salle (qui a son tapis) ---
      { const jo = h.mat('joints', { alphaTest: 0.5, ...DS }); for (const [a, b] of [[R0, i9], [i12 + 2, i14 + 8], [i20 + 3, T.t0 - 1], [T.t1 + 2, R0]]) { h.ribbon(a % N, (b - a + N) % N, s => -s.w + 0.2, 0.025, s => s.w - 0.2, 0.025, jo, 6); h.ribbon(a % N, (b - a + N) % N, s => -s.w + 0.15, 0.04, s => -s.w + 0.5, 0.04, ivoire, 4); } } // et une bordure ivoire à gauche : le bord droit se lit par la rigole, le gauche ne se lisait pas

      // ================= Persépolis : l'escalier, la Porte, la terrasse, la salle, le perron =================
      const portique = [], frise = h.mat('frise', DS), tapisBord = h.mat('tapisBord', DS), braseros = [], flammes = [], brasero = (i, d, k = 1, y = 0) => { const s = S[(i + N) % N], [x, , z] = au(s, d); braseros.push([x, s.y + y, z, h.across(s), k, k, k]); flammes.push([x, s.y + y + 2.6 * k, z, 0, 0.55 * k, 0.4 * k, 0.55 * k]); };
      // le bord de la bande roulable sur la terrasse et au jardin : un muret bas à bordure de tapis (on voit ce qui arrête la voiture, et il se détache du dallage)
      const muret = (i0, n, sd, ht = 0.75) => { const p = paroi(tapisBord, 1, 1, 4); murS(i0, n, s => sd * (s.w + 0.25), ht, -0.3, p); p.fin(); h.ribbon(i0, n, s => sd * (s.w + 0.25), ht, s => sd * (s.w + 0.9), ht, pierre, 4); };
      // --- le parvis au pied de l'escalier : le sol passe aux dalles 40 m avant la pente ; le lion et le taureau de part et d'autre (REFS §3) ---
      for (const sd of [-1, 1]) h.ribbon(i9 - 20, 20, s => sd * W, 0.035, s => sd * s.w, 0.035, dallage, 8);
      for (const sd of [-1, 1]) { const s = S[i9 - 2], [x, , z] = au(s, sd * (s.w + 1.2)), m = boite(h, h.mat('lionTaureau'), 0.5, 4.4, 4.4, x, s.y + 2.2, z); m.rotation.y = h.across(s); }
      rigole(i9 - 20, i14 + 8 - (i9 - 20)); rigole(i20 - 34, 33); // le fil d'eau monte l'escalier et traverse la terrasse
      for (let i = 366; i < i9 - 8; i += 10) { brasero(i, S[i].w + 0.4, 2, 4); brasero(i, -(S[i].w + 0.45), 2, 0.9); } // (5 m de haut : à 1,2 on ne les remarquait pas) // une allée d'autels du feu sur les murs, du virage au parvis : elle annonce l'escalier
      // --- le grand escalier (REFS §2-3), tel qu'il était : marches basses de pierre sur toute la largeur, parapets à frise d'Immortels des deux côtés, couronnés d'un bandeau de rosettes, autels du feu qui rythment la montée ---
      { const HPa = 2.6, n = i12 - 16 - i9, lt = [], etend = [];
        h.ribbon(i9, i12 - i9, s => -s.w + 0.4, 0.03, s => s.w - 0.4, 0.03, h.mat('marchesPerse', { ...DS, emissive: 0x2a2014 }), 1.2);
        for (const sd of [-1, 1]) { const p = paroi(frise, HPa + 0.6, 1, 4); murS(i9, n, s => sd * (s.w + 0.05), HPa, -0.6, p); p.fin();
          h.ribbon(i9, n, s => sd * (s.w - 0.3), HPa + 0.45, s => sd * (s.w + 0.9), HPa + 0.45, pierre, 4); h.ribbon(i9, n, s => sd * (s.w - 0.3), HPa + 0.45, s => sd * (s.w - 0.3), HPa - 0.05, h.mat('rosettes', DS), 3); // couronnement continu : bandeau de rosettes et corniche lisse, sans dents
          for (let i = i9 + 4; i < i12 - 18; i += 10) brasero(i, sd * (S[i].w + 0.3), i > i12 - 20 ? 1.5 : 1, HPa + 0.45);
          for (let i = i9 + 14; i < i12 - 6; i += 24) { const s = S[i], [x, , z] = au(s, sd * (s.w - 0.12)); lt.push([x, s.y + 1.3, z, h.across(s)]); }
          for (const ii of [i9 + 14, i12 - 26]) { const s = S[ii], [x, , z] = au(s, sd * (s.w + 1.2)); etend.push([x, s.y + HPa + 0.45, z, h.across(s), 1.8, 1.8, 1.8, sd > 0 ? 0xc8323c : 0x1d3a8a]); } }
        I(h.geo('boite', 0.2, 2.4, 3.2), h.mat('lionTaureau'), lt); Is('banniere', { mat: h.mat('peinture', { c: 0x4a3020 }), drap: h.mat('peinture', { c: 0xffffff }), or }, etend, { teinte: 'drap' });
        for (let i = i9 + 8; i < i12; i += 20) h.lum(i, S[i].x, S[i].y + 6, S[i].z, 0xff9a40, 16, 0.5);
        const cy = []; for (let i = i9 + 6; i < i12 + 20; i += 9) { const s = S[i], d = s.w + 9 + (i % 5) * 2.2, [x, , z] = au(s, -d); cy.push([x, sol(x, z) - 0.6, z, 0, 0.9, 0.8 + (i % 4) * 0.12, 0.9]); } I(h.geo('cypres'), h.mat('peinture', { c: 0x2f4a2e }), cy).castShadow = false; } // quelques cyprès au pied de la montagne
      // --- la Porte des Nations (REFS §6-7), au sommet de l'escalier, dans son axe : un pavillon de 30 m de haut que la route traverse, taureaux ailés à l'arrivée, taureaux à tête humaine à la sortie ---
      { const i = i12 + 9, s = S[i], gr = repere(h, s), E = 1.45; gr.scale.setScalar(E); // agrandie d'un seul tenant (30 m de haut) : étirée en hauteur seulement, ses reliefs et ses taureaux étaient déformés ; la forme est bâtie pour une baie de s.w / E, qui retrouve la largeur de la route
        h.pose('porteNations', { crue, pierre, sculpte: h.mat('sculpte', { c: 0x6a625a, emissive: 0x1a1410 }), ailes: h.mat('ailes', { c: 0xb8ac98, emissive: 0x2a2018 }), or, fut: h.mat('cannelure'), relief, cedre: h.mat('plafondCedre'), lamTG: h.mat('lamassuRelief', {}, false, false), lamTD: h.mat('lamassuRelief', {}, false, true), lamHG: h.mat('lamassuRelief', {}, true, false), lamHD: h.mat('lamassuRelief', {}, true, true), visage: h.mat('sculpte', { c: 0xb0a490, emissive: 0x2a2018 }), tiare: h.mat('peinture', { c: 0x1d3a8a }), aile: h.mat('ailes', { c: 0xd0c4a8, emissive: 0x2a2018 }) }, gr, [0, 0, 0], (S[i - 10].w + 1.6) / E); for (const sd of [-1, 1]) { const p0 = i12 - 16, pn = 43, HS = 1.3, p = paroi(appareil, 8); murS(p0, pn, e => sd * (e.w + 0.2), HS, -0.6, p); for (const ii of [p0, p0 + pn]) { const e = S[ii], A = au(e, sd * (e.w + 0.2)), B = au(e, sd * (e.w + 24)); p.seg(A[0], A[2], B[0], B[2], e.y + HS, e.y - 6); } murS(p0, pn, e => sd * (e.w + 24), HS, -6, p); p.fin(); h.ribbon(p0, pn, e => sd * (e.w + 0.2), HS, e => sd * (e.w + 24), HS, pierre, 4); } } /* le socle : un massif de pierre appareillée de 1,3 m, du bord de la chaussée jusque sous les montants, d'un bout à l'autre du pavillon ; les taureaux y posent leurs pattes, le parapet à frise s'arrête devant lui et le muret à tapis reprend après (ils entraient dans la baie) */ // la baie : 1,6 m de plus que la route à l'entrée du pavillon, de chaque côté (la caméra, qui déborde de la chaussée en virage, entrait dans le poitrail des taureaux) ; la route se resserre ensuite, le muret à bordure de tapis prend le relais du parapet de l'escalier
      // --- la terrasse, de la Porte à la salle : une voie processionnelle. Muret à bordure de tapis et file de colonnes des deux côtés de la route, braseros ; autour, les palais en ruine :
      // à droite de la ligne droite, au ras de la route, le palais de Darius (dans le creux du virage, la caméra ne le voyait pas) ; à gauche le portique du palais de Xerxès, qui file jusqu'à la salle ; contre la montagne, les murs du Trésor ---
      { const a = i12 + 26, b = i14 + 6, allee = [], etendT = [], portes = [], murets = paroi(h.mat('murSalle', DS), 8), socles = [];
        for (const sd of [-1, 1]) { muret(a, b - a, sd); muret(i20 - 34, 34, sd);
          for (let i = a + 3; i < b; i += 12) { const s = S[i], [x, , z] = au(s, sd * (s.w + 5.5)); if (dansSalle(x, z, 6)) continue; allee.push([x, YT - 0.1, z, 0, 1, [0.74, 0.5, 0.74, 0.62, 0.74, 0.38][(i + (sd > 0)) % 6], 1]); brasero(i + 6, sd * (S[(i + 6) % N].w + 3), 1.4); } }
        ruines.push(...allee);
        const palais = (px, pz, lx, lz, ry) => { const c = Math.cos(ry), s = Math.sin(ry), P = (u, v) => [px + c * u + s * v, pz - s * u + c * v]; socles.push([px, YT + 0.6, pz, ry, lx + 6, 1.4, lz + 6]); // un palais en ruine : socle, encadrements de portes debout, pans de mur de brique crue, colonnes
          for (const [u, v, r] of [[-lx / 2, -lz / 4, 1], [-lx / 2, lz / 4, 1], [lx / 2, -lz / 4, 1], [lx / 2, lz / 4, 1], [-lx / 4, -lz / 2, 0], [lx / 4, -lz / 2, 0], [-lx / 4, lz / 2, 0], [lx / 4, lz / 2, 0], [0, -lz / 2, 0], [0, lz / 2, 0]]) { const [x, z] = P(u, v); portes.push([x, YT + 1.3, z, ry + r * Math.PI / 2]); }
          for (const [u0, v0, u1, v1, ht] of [[-lx / 2, -lz / 2, -lx / 2 + lx * 0.3, -lz / 2, 7], [lx / 2, -lz / 2, lx / 2, -lz / 2 + lz * 0.35, 5], [lx / 2 - lx * 0.3, lz / 2, lx / 2, lz / 2, 8], [-lx / 2, lz / 2 - lz * 0.3, -lx / 2, lz / 2, 4]]) { const [x0, z0] = P(u0, v0), [x1, z1] = P(u1, v1); murets.seg(x0, z0, x1, z1, YT + 1.3 + ht, YT + 1.2); }
          for (const [u, v, k] of [[-lx / 6, -lz / 6, 0.7], [lx / 6, -lz / 6, 0.7], [-lx / 6, lz / 6, 0.5], [lx / 6, lz / 6, 0.7], [0, 0, 0.3]]) { const [x, z] = P(u, v); ruines.push([x, YT + 1.3, z, 0, 1, k, 1]); } };
        palais(574, 426, 72, 20, 0);
        // à l'extérieur du virage, dans l'axe de la sortie de la Porte : le portique d'un palais encore debout (colonnes de 19 m, poutre de cèdre) et, entre ses colonnes, deux taureaux ailés à tête humaine de 13 m en haut-relief
        for (let k = 0; k < 13; k++) portique.push([690 - k * 13, YT - 0.1, 478, 0]); boite(h, h.mat('peinture', { c: 0x6a4a2e }), 160, 1.6, 2.4, 612, YT + 20.4, 478); boite(h, noir, 164, 2.4, 3.2, 612, YT + 22.4, 478); // treize colonnes : le portique borde toute la ligne droite, du virage à la salle (il s'arrêtait à mi-chemin : 80 m vides)
        { const fond = paroi(h.mat('murSalle', DS), 8); fond.seg(700, 486, 524, 486, YT + 16, YT - 0.3); fond.fin(); for (const [x, g] of [[672, false], [650, true], [607, false], [585, true], [554, false], [532, true]]) { const m = boite(h, h.mat('lamassuRelief', { emissive: 0x2a2018 }, true, g), 0.6, 13, 9.6, x, YT + 6.5, 484.6); m.rotation.y = Math.PI / 2; } }

        murets.seg(702, 396, 702, 562, YT + 7, YT - 0.3); murets.seg(702, 562, 500, 566, YT + 7, YT - 0.3); murets.fin(); boite(h, noir, 1.2, 0.8, 166, 702, YT + 7.3, 479); boite(h, noir, 202, 0.8, 1.2, 601, YT + 7.3, 564);
        I(h.geo('bloc'), relief, socles); sansOmbre(Is('portail', { noir, pierre }, portes)); Is('colonneRuine', { pierre, fut: h.mat('cannelure'), sculpte }, ruines); }
      // --- la salle aux cent colonnes (REFS §4-5) : une forêt de colonnes sous un toit plat de cèdre, ouverte sur ses quatre côtés par des portiques. Au sol, comme avant : damier garance et ivoire,
      // allée de tapis rouge et or qui montre la ligne rapide, un tapis rond et un cercle ivoire sous chaque colonne qu'on peut percuter, frise des Immortels sur le pourtour ---
      { const HX = 88, HZ = 80, HM = HC + 3, foret = [];
        { const d = nappe(h.mat('dallage', DS), 8); for (let k = 0; k < 64; k++) { const f = j => [CX + Math.cos(j * Math.PI / 32) * (PL.r + 0.5), YS - 0.01, CZ + Math.sin(j * Math.PI / 32) * (PL.r + 0.5)], c = [CX, YS - 0.01, CZ]; d.quad(c, c, f(k), f(k + 1)); } d.fin(); }
        const nTapis = (i20 - i14 + N) % N - 11; // jusqu'à la lèvre du perron (il s'arrêtait net 18 m avant)
        h.ribbon(i14 + 10, nTapis, -3.5, 0.03, 3.5, 0.03, h.mat('tapisAllee', DS), 7);
        for (const e of [-1, 1]) h.ribbon(i14 + 10, nTapis, e * 3.5, 0.035, e * 3.85, 0.035, h.mat('peinture', { lum: 1, c: 0xf4ead0, side: THREE.DoubleSide }), 4);
        h.ribbon(i14 + 9, 1, -3.85, 0.035, 3.85, 0.035, h.mat('peinture', { lum: 1, c: 0xf4ead0, side: THREE.DoubleSide }), 4); // la frange ivoire, au début du tapis // liserés ivoire : l'allée se lit sur le tapis
        { const d = nappe(h.mat('dallage', DS), 8), i0 = i14 + 10, n = (i20 - i14 + N) % N - 20; // le damier vient jusqu'au liseré du tapis : la chaussée grise qui dépassait de chaque côté se lisait comme une seconde piste
          for (let k = 0; k < n; k++) { const a = S[(i0 + k) % N], b = S[(i0 + k + 1) % N]; if (!dansSalle(a.x, a.z, -1) || !dansSalle(b.x, b.z, -1)) continue; for (const sd of [-1, 1]) d.quad(au(a, sd * 3.85, 0.03), au(b, sd * 3.85, 0.03), au(a, sd * a.w, 0.03), au(b, sd * b.w, 0.03)); } d.fin().castShadow = false; }
        for (let x = CX - 84; x <= CX + 84; x += 12) for (let z = CZ - 72; z <= CZ + 72; z += 12) if (!dansSalle(x, z, 4) && g.dAt(x, z) > W + 4) foret.push([x, YS, z, 0]);
        foret.push(...portique, ...cols); // avec le portique de la terrasse et les quinze colonnes de la place, qu'on percute
        Is('colonnePerse', { pierre: h.mat('pierre', { c: 0xa8a098, emissive: 0x1a1612 }), fut: h.mat('cannelure', { c: 0xa49e94, emissive: 0x1a1612 }), sculpte: h.mat('sculpte', { emissive: 0x1a1612 }), or }, foret, { a: [HC] });
        I(h.geo('disque'), tapisBord, PL.piles.map((_, k) => [cols[k][0], YS + 0.05, cols[k][2], 0, 4.2, 1, 4.2])); I(h.geo('margelle'), h.mat('peinture', { lum: 1, c: 0xf4ead0 }), PL.piles.map((_, k) => [cols[k][0], YS - 0.1, cols[k][2], 0, 4.4, 0.35, 4.4]));
        const poutres = [], cedre = h.mat('peinture', { c: 0x6a4a2e }); for (let z = CZ - 72; z <= CZ + 72; z += 12) poutres.push([CX, YS + HC + 0.6, z, 0, 2 * HX, 1.2, 1.6]); I(h.geo('bloc'), cedre, poutres);
        boite(h, h.mat('plafondCedre', { emissive: 0x4a3424 }), 2 * HX + 6, 0.8, 2 * HZ + 6, CX, YS + HM - 1.2, CZ); for (const [w, d, x, z] of [[2 * HX + 9, 2.4, CX, CZ - HZ - 3], [2 * HX + 9, 2.4, CX, CZ + HZ + 3], [2.4, 2 * HZ + 9, CX - HX - 3, CZ], [2.4, 2 * HZ + 9, CX + HX + 3, CZ]]) boite(h, noir, w, 2.8, d, x, YS + HM - 0.6, z); // l'entablement de pierre sombre
        // le pourtour de la place où l'on roule : un mur de 1,5 m d'épaisseur (une feuille, avant), frise des Immortels sur ses deux faces, dessus et bouts de pierre, là où il ne coupe pas la chaussée
        const tour = paroi(frise, 3.6, 1, 4), tourX = paroi(frise, 3.6, 1, 4), pierreD = h.mat('pierre', DS), dessus = nappe(pierreD, 4), bouts = nappe(pierreD), EP = 1.5, y1 = YS + 3, y0 = YS - 0.6, f = (j, r) => [CX + Math.cos(j * Math.PI / 48) * r, CZ + Math.sin(j * Math.PI / 48) * r];
        const plein = k => { const [x, z] = f(k + 0.5, PL.r), s = S[near(h, x, z)]; return Math.hypot(s.x - x, s.z - z) >= s.w + 0.5; };
        for (let k = 0; k < 96; k++) { if (!plein(k)) continue; const p = f(k, PL.r), q = f(k + 1, PL.r), P = f(k, PL.r + EP), Q = f(k + 1, PL.r + EP);
          tour.seg(p[0], p[1], q[0], q[1], y1, y0); tourX.seg(P[0], P[1], Q[0], Q[1], y1, y0); dessus.quad([p[0], y1, p[1]], [q[0], y1, q[1]], [P[0], y1, P[1]], [Q[0], y1, Q[1]]);
          for (const [bout, kk] of [[!plein((k + 95) % 96), k], [!plein((k + 1) % 96), k + 1]]) if (bout) { const a = f(kk, PL.r), b = f(kk, PL.r + EP); bouts.quad([a[0], y1, a[1]], [a[0], y0, a[1]], [b[0], y1, b[1]], [b[0], y0, b[1]]); } }
        tour.fin(); tourX.fin(); dessus.fin(); bouts.fin(); }
      // --- le perron : la terrasse finit net, la route décolle et se reçoit en contrebas, dans le jardin ; deux murs d'échiffre, deux braseros ---
      for (const sd of [-1, 1]) { const p = paroi(appareil, 8); murS(i20 - 15, 16, s => sd * (s.w + 0.3), 0.55, -3, p); p.fin(); brasero(i20 - 1, sd * (S[i20].w + 2), 1.8); }
      { const s = S[i20], A = au(s, -s.w - 0.3), B = au(s, s.w + 0.3), f = nappe(appareil); f.quad([A[0], s.y, A[2]], [A[0], s.y - 6, A[2]], [B[0], s.y, B[2]], [B[0], s.y - 6, B[2]], 0, 3, 8); f.fin(); } // la face du perron, sous la lèvre
      sansOmbre(Is('autel', { pierre, or }, braseros)); I(h.geo('houppierRond'), h.mat('peinture', { lum: 1, c: 0xff8a2a }), flammes).castShadow = false; // autels du feu : une braise fixe (la flamme viendra avec la vie)
      // --- à chaque seuil de zone, de chaque côté : un cyprès sombre et un arbre rond, côte à côte (le couple des miniatures persanes) ---
      { const cy = [], tr = [], ho = []; for (const i of [i9 - 26, i20 - 36, i20 + 8, T.t0 - 9]) for (const sd of [-1, 1]) { const s = S[(i + N) % N], a = au(s, sd * (s.w + 3.4)), s2 = S[(i + 3 + N) % N], b = au(s2, sd * (s2.w + 4.2)); if (dansSalle(a[0], a[2], 4)) continue; const ya = Math.max(sol(a[0], a[2]), s.y - 0.5), yb = Math.max(sol(b[0], b[2]), s2.y - 0.5); cy.push([a[0], ya - 0.3, a[2], 0, 1.1, 1.35, 1.1]); tr.push([b[0], yb + 2.4, b[2], 0, 0.7, 5.6, 0.7]); ho.push([b[0], yb + 6.8, b[2], i % 6, 3.8, 3.2, 3.8]); }
        I(h.geo('cypres'), h.mat('peinture', { c: 0x2f4a2e }), cy).castShadow = false; I(h.geo('bloc'), h.mat('peinture', { c: 0x8a7458 }), tr); I(h.geo('houppierRond'), h.mat('bruit', {}, '#4f7a3a', ['#5c8a44', '#3e6b34']), ho).castShadow = false; }

      // ================= le jardin (du perron au portail du bazar) : un jardin royal luxuriant, en gradins, plein d'eau (REFS §10-11 ; l'idée des jardins suspendus) =================
      // À gauche (côté montagne) : trois gradins plantés qui montent au-dessus de la route, verdure qui retombe des murs, palmiers, et une cascade qui descend de gradin en gradin tous les 28 m jusqu'à un bassin.
      // À droite (côté ville basse) : un large canal à jets d'eau au ras de la route (le fil d'eau de toute la carte), une bande de fleurs, une file de palmiers, puis deux gradins plantés (les parterres en contrebas ne se voyaient pas de la route : retirés).
      // Partout des cyprès, des orangers, des massifs de fleurs. Mur d'enceinte en terre au fond, des deux côtés.
      { const j0 = i20 + 3, j1 = i25 - 3, nJ = j1 - j0, cyp = [], orang = [], buis = [], troncs = [], palmes = [], fleurs = [], jets = [], herbe = nappe(h.mat('bruit', { ...DS, emissive: 0x16240e }, '#4e7a34', ['#5c8a3e', '#3e662a', '#6a9a48']), 8), niches = paroi(h.mat('nichesJardin', DS), 3.4, 1, 8), bassin = nappe(eau, 6), chute = nappe(h.mat('peinture', { lum: 1, c: 0xc4e8e8, side: THREE.DoubleSide }));
        const COUL = [0xc8323c, 0xf0c020, 0xf4ead0, 0xe87a2a, 0xd8508a];
        const P = (s, d, y) => { const q = au(s, d); return [q[0], y, q[2]]; };
        const palmier = (x, y, z, ht, r) => { troncs.push([x, y + ht / 2, z, 0, 1, ht, 1]); palmes.push([x, y + ht, z, r]); };
        // des gradins de 3 m des deux côtés : trois à gauche (côté montagne), deux à droite derrière le canal (le couchant passe entre leurs palmiers). b0 : écart du pied du premier mur au bord de la route
        const cotes = [[-1, 1, 3], [1, 1.5, 2]];
        for (const [sd, b0, nT] of cotes) { muret(j0, nJ, sd, 0.6); const D = b0 + (nT + 1) * 8, p = paroi(terre, 3.6, 1, 4); murS(j0, nJ, s => sd * (s.w + D), nT * 3 + 3.6, nT * 3 - 1, p); p.fin(); const dehors = paroi(h.mat('murTerre', { side: THREE.DoubleSide, emissive: 0x2a2010 }), 3.6); murS(j0, nJ, s => sd * (s.w + D + 0.3), nT * 3 + 3.6, -8, dehors); dehors.fin(); } /* la face du dehors de l'enceinte : un mur de terre plein jusqu'au sol (l'enceinte ne descendait que jusqu'au dernier gradin : de la terrasse du palais, on voyait sous elle l'envers des gradins) */ // l'enceinte, derrière le dernier gradin
        { const bout = paroi(appareil, 8); for (const j of [j0, j1]) for (const [sd, b0, nT] of cotes) { const e = S[j]; for (let t = 1; t <= nT; t++) { const A = P(e, sd * (e.w + b0 + t * 8), 0), B = P(e, sd * (e.w + b0 + (t + 1) * 8), 0); bout.seg(A[0], A[2], B[0], B[2], e.y + t * 3 + (t === nT ? 3.6 : 0.5), e.y - 4); } } bout.fin(); } // les deux bouts du jardin : un mur de pierre en gradins ferme chaque terrasse (de la terrasse du palais, on voyait la tranche ouverte des gradins)
        for (let i = j0; i < j1; i++) { const a = S[i], b = S[i + 1], u = i - j0;
          // --- à droite, au ras de la route : le canal, une bande de fleurs, une file de palmiers ---
          herbe.quad(P(b, b.w + 6.2, b.y + 0.1), P(a, a.w + 6.2, a.y + 0.1), P(b, b.w + 9.5, b.y + 0.1), P(a, a.w + 9.5, a.y + 0.1));
          for (const d of [6.9, 8.6]) fleurs.push([...P(a, a.w + d, a.y + 0.35), u % 6, 1.5, 0.9, 1.5, COUL[(u + (d > 8)) % 5]]);
          if (u % 5 === 2) palmier(...P(a, a.w + 7.8, a.y), 9 + (u % 3) * 1.5, u);
          if (u % 6 === 3) jets.push([...P(a, a.w + 3.8, a.y - 0.1), 0, 0.5, 2.6, 0.5]);
          // --- à gauche, au pied des gradins : herbe, fleurs, cyprès, et le bassin de la cascade ---
          herbe.quad(P(a, -a.w - 1, a.y + 0.1), P(b, -b.w - 1, b.y + 0.1), P(a, -a.w - 9, a.y + 0.1), P(b, -b.w - 9, b.y + 0.1));
          for (const d of [2.2, 4.2]) fleurs.push([...P(a, -a.w - d, a.y + 0.35), u % 6, 1.6, 0.9, 1.5, COUL[(u + 2 + (d > 3)) % 5]]);
          if (u % 4 === 2) { const q = P(a, -a.w - 6.6, a.y - 0.3); cyp.push([q[0], q[1], q[2], 0, 0.8, 0.85 + (u % 5) * 0.06, 0.8]); }
          if (u % 14 === 7) { const s2 = S[i + 2]; bassin.quad(P(a, -a.w - 5.2, a.y + 0.14), P(s2, -s2.w - 5.2, s2.y + 0.14), P(a, -a.w - 8.8, a.y + 0.14), P(s2, -s2.w - 8.8, s2.y + 0.14)); jets.push([...P(S[i + 1], -S[i + 1].w - 7, a.y), 0, 0.6, 3, 0.6]); }
          // --- les gradins : chacun porte son mur à niches, sa terre plantée, sa verdure qui retombe, ses arbres ---
          for (const [sd, b0, nT] of cotes) { const G = (s, d, y) => P(s, sd * (s.w + d), y), v = u + (sd > 0 ? 3 : 0);
            for (let t = 1; t <= nT; t++) { const d0 = b0 + t * 8, d1 = d0 + 8, ya = a.y + t * 3, yb = b.y + t * 3, A = G(a, d0, ya), B = G(b, d0, yb), C = G(a, d1, ya), Dd = G(b, d1, yb);
              niches.seg(A[0], A[2], B[0], B[2], ya, ya - 3.4, yb, yb - 3.4); if (sd < 0) herbe.quad(A, B, C, Dd); else herbe.quad(B, A, Dd, C);
              if (v % 2 === t % 2) buis.push([A[0], ya + 0.1 - (v % 3) * 0.3, A[2], v % 6, 1.7, 1.3 + (v % 4) * 0.25, 1.4]); // la verdure qui retombe du bord du gradin
              if (v % 14 === 7) { const c0 = G(a, d0 - 0.15, ya + 0.3), s2 = S[i + 2], c2 = G(s2, d0 - 0.15, s2.y + t * 3 + 0.3); chute.quad(c0, [c0[0], ya - 3.2, c0[2]], c2, [c2[0], s2.y + t * 3 - 3.2, c2[2]]); } // la cascade : une nappe d'eau de 4 m qui tombe de chaque gradin
              const q = G(a, d0 + 4, ya);
              if (t === nT) { // au sommet : à gauche un mur d'arbres (cyprès de 16 m et platanes alternés) ; à droite des palmiers et des cyprès plus bas, espacés
                if (sd < 0 && v % 3 === 1) { if (v % 6 === 1) cyp.push([q[0], ya - 0.3, q[2], 0, 1.15, 1.3 + (v % 4) * 0.06, 1.15]); else { troncs.push([q[0], ya + 4, q[2], 0, 1.3, 8, 1.3]); buis.push([q[0], ya + 10, q[2], v % 6, 5.2, 4.2, 5.2]); } }
                if (sd > 0 && v % 4 === 1) { if (v % 8 === 1) palmier(q[0], ya, q[2], 9 + (v % 3) * 1.4, v); else cyp.push([q[0], ya - 0.3, q[2], 0, 0.95, 0.9 + (v % 4) * 0.06, 0.95]); } }
              else if (t === nT - 1 && v % 3 === 0) orang.push([q[0], ya + 1.8, q[2], v % 6, 2.3, 2.1, 2.3]);
              else if (t === nT - 2 && v % 5 === 0) palmier(q[0], ya, q[2], 8 + (v % 3) * 1.4, v);
              if (v % 2 === 1) fleurs.push([...G(a, d0 + 1.6, ya + 0.3), 0, 1.6, 0.8, 1.4, COUL[(v + t) % 5]]); } } }
        // (les pavillons posés sur les gradins traversaient les murs : retirés)
        herbe.fin().castShadow = false; niches.fin(); bassin.fin().castShadow = false; chute.fin().castShadow = false;
        h.ribbon(j0, nJ, s => s.w + 1.5, -0.12, s => s.w + 5.8, -0.12, eau, 6); h.ribbon(j0, nJ, s => s.w + 5.8, 0.12, s => s.w + 6.2, 0.12, pierre, 4); h.ribbon(j0, nJ, s => s.w + 1.1, 0.45, s => s.w + 1.5, -0.4, pierre, 4); // le canal, à droite
        I(h.geo('cypres'), h.mat('peinture', { c: 0x2f4a2e }), cyp).castShadow = false; I(h.geo('houppierRond'), h.mat('bruit', {}, '#3e6230', ['#e08a2a', '#4a7038', '#d87a20']), orang).castShadow = false;
        I(h.geo('houppierRond'), h.mat('bruit', {}, '#3a6a2c', ['#4a7a36', '#2e5624', '#d8508a']), buis).castShadow = false; I(h.geo('troncPalmier'), h.mat('troncPalmier'), troncs).castShadow = false; Is('palmes', { palme: h.mat('palme', { ...DS, emissive: 0x1e3a16 }) }, palmes).forEach(m => { m.castShadow = false; });
        I(h.geo('jet'), h.mat('peinture', { lum: 1, c: 0xd8f4f4 }), jets).castShadow = false;
        { const mf = I(h.geo('massif'), h.mat('peinture', { c: 0xffffff }), fleurs); fleurs.forEach((p, i) => mf.setColorAt(i, new THREE.Color(p[7]))); if (fleurs.length) mf.instanceColor.needsUpdate = true; mf.castShadow = false; } }

      // ================= le bazar (REFS §12-14) =================
      const bois = h.mat('planches');
      // sous la voûte, le décor a sa propre clarté (émissive) : les luminaires du moteur n'éclairent que près de la voiture, et sans elle le fond du bazar restait noir puis s'allumait en approchant
      if (T.tun) { const cT = (T.t1 - T.t0 + N) % N, BAY = 4, NV = 10, u = M.th.tun, Sj = j => S[(T.t0 + j) % N];
        const val = (v, j, d) => { const f = j / cT; if (v == null) return d; if (typeof v === 'number') return v; if (typeof v === 'function') return v(f, Sj(j));
          let k = 0; while (k < v.length - 1 && v[k + 1][0] < f) k++; const [fa, a] = v[k], [fb, b] = v[Math.min(k + 1, v.length - 1)]; return fb > fa ? a + (b - a) * Math.max(0, Math.min(1, (f - fa) / (fb - fa))) : a; };
        const HH = j => val(u.h, j, 8), VT = j => val(u.voute, j, 0), HM = j => HH(j) - VT(j), lant = j => j > 8 && j < cT - 9 && (j / BAY | 0) % 3 === 1 && (j % BAY === 1 || j % BAY === 2); // lant : les deux segments du milieu d'une travée sur trois portent le lanterneau
        const arcsL = [], coudes = [[], [], []], anesB = [], tapSol = [[], [], [], []], guirB = [], comptoirs = [], sacs = [], arcs = [], lan = [], chaines = [], tap = [[], [], [], []], cones = [], cuivres = [], domes = [], lanternons = [];
        const voute = nappe(h.mat('voute', { ...DS, emissive: 0x4a3828 })), jour = nappe(h.mat('peinture', { lum: 1, c: 0xffe2a8, side: THREE.DoubleSide })), vouteF = nappe(h.mat('muqarnas', { ...DS, emissive: 0x4a3828 })), murHaut = nappe(h.mat('voute', { ...DS, emissive: 0x4a3828 })), boutiques = nappe(h.mat('hojreh', { ...DS, emissive: 0x4a3828 })), bandeau = nappe(h.mat('faience', { ...DS, emissive: 0x4a3828 })), boutiquesD = nappe(h.mat('hojreh', { ...DS, emissive: 0x4a3828 })), dehors = nappe(h.mat('arcades', DS)), toit = nappe(h.mat('briqueCrue', DS));
        for (let j = 0; j < cT; j++) { const i = (T.t0 + j) % N, a = S[i], b = S[(i + 1) % N], ph = j % BAY, ry = h.across(a), wa = a.w, wb = b.w;
          // la voûte de brique sur celle du moteur, à 6 cm en dedans ; d'un portail à l'autre, sans trou ; une travée sur cinq en muqarnas ; le lanterneau : quatre facettes claires à la clé, entre deux arcs
          { const vq = (j / BAY | 0) % 5 === 2 ? vouteF : voute;
            for (let k = 0; k < NV; k++) { const P2 = (s, w, jj, q) => au(s, -w * Math.cos(Math.PI * q / NV) * 0.996, HM(jj) + VT(jj) * Math.sin(Math.PI * q / NV) - 0.06); (lant(j) && k > 2 && k < 7 ? jour : vq).quad(P2(a, wa, j, k), P2(a, wa, j, k + 1), P2(b, wb, j + 1, k), P2(b, wb, j + 1, k + 1), j / 3, (j + 1) / 3); }
            if (j > 3 && j < cT - 4) toit.quad(au(a, -wa - 1.7, HH(j) + 2.05), au(a, wa + 1.7, HH(j) + 2.05), au(b, -wb - 1.7, HH(j + 1) + 2.05), au(b, wb + 1.7, HH(j + 1) + 2.05), j / 2, (j + 1) / 2); }
          for (const sd of [-1, 1]) { const p = au(a, sd * (wa - 0.05)), q = au(b, sd * (wb - 0.05)), m0 = Math.min(3.8, HM(j) - 0.4);
            boutiques.quad([p[0], p[1] + m0, p[2]], [p[0], p[1] - 0.1, p[2]], [q[0], q[1] + m0, q[2]], [q[0], q[1] - 0.1, q[2]], j / 4, (j + 1) / 4);
            bandeau.quad([p[0], p[1] + m0 + 0.75, p[2]], [p[0], p[1] + m0, p[2]], [q[0], q[1] + m0 + 0.75, q[2]], [q[0], q[1] + m0, q[2]], j / 2, (j + 1) / 2);
            murHaut.quad([p[0], p[1] + HM(j), p[2]], [p[0], p[1] + m0 + 0.75, p[2]], [q[0], q[1] + HM(j + 1), q[2]], [q[0], q[1] + m0 + 0.75, q[2]], j / 3, (j + 1) / 3); // la brique entre la frise et la naissance de la voûte
            if (j < 4 || j > cT - 5) continue; const e = au(a, sd * (wa + 1.6)), f = au(b, sd * (wb + 1.6)); boutiquesD.quad([e[0], e[1] + 3.8, e[2]], [e[0], e[1] - 1, e[2]], [f[0], f[1] + 3.8, f[2]], [f[0], f[1] - 1, f[2]], j / 4, (j + 1) / 4);
            dehors.quad([e[0], e[1] + HH(j) + 2.1, e[2]], [e[0], e[1] + 3.8, e[2]], [f[0], f[1] + HH(j + 1) + 2.1, f[2]], [f[0], f[1] + 3.8, f[2]], j / 2, (j + 1) / 2); } // le dehors : boutiques et arcades aveugles sur la coque du moteur
          if (ph === 2) { if (lant(j)) lanternons.push([a.x, a.y + HH(j) + 2, a.z, 0, 2.4, 1.6, 2.4]); else domes.push([a.x, a.y + HH(j) + 2.05, a.z, ry, wa * 0.8, 3.2, 5.5]); } // dehors : le tapis de coupoles, un lanternon sur chaque lanterneau
          if (ph === 0) { const avant = Math.abs(a.k) < 0.02 && [10, 14, 18].some(e => Math.abs(S[(i + e) % N].k) > 0.022), sy = (HM(j) + VT(j) * 0.9) / 6.2; arcs.push([a.x, a.y, a.z, ry, wa / W, sy, 1]); // l'arc transversal, à la largeur et à la hauteur de la voûte ; celui qui précède un coude luit
            lan.push([a.x, a.y + HM(j) + VT(j) * 0.9 - 2.4, a.z, 0, 0.42, 0.55, 0.42]); chaines.push([a.x, a.y + HM(j) + VT(j) * 0.9 - 1.1, a.z, 0, 0.22, 2.2, 0.22]); }
          if (ph === 2 && !lant(j)) h.lum(i, a.x, a.y + HM(j), a.z, 0xffd890, 18, 0.18, 1);
          if (ph === 1 && (j / BAY | 0) % 3 !== 1) { const sd = (j / BAY | 0) % 2 ? 1 : -1, [x, z] = bord(a, sd, wa - 1.5); tapSol[(j / BAY | 0) % 4].push([x, a.y + 0.05, z, ry, 1, 1, 1]); } // tapis posés au sol devant la boutique
          if (ph === 2) { const sd = (j / BAY | 0) % 2 ? -1 : 1, [x, z] = bord(a, sd, wa - 0.3); comptoirs.push([x, a.y + 0.4, z, ry]); for (const e of [-1, 1]) sacs.push([x + a.tx * 0.6 * e, a.y + 1.0, z + a.tz * 0.6 * e, 0, 0.32, 0.5, 0.32, [0xd9a21b, 0xb5391e, 0x6a8a3a, 0xc8742e][(j + ph + (e > 0)) % 4]]); }
          if (ph === 2 || ph === 0) { const sd = (j / BAY | 0) % 2 ? 1 : -1, [x, z] = bord(a, ph === 2 ? sd : -sd, wa - 0.18); tap[(j * 7 + ph) % 4].push([x, a.y + 2.2, z, ry]); }
          if (j % 3 === 0 && Math.abs(a.k) > 0.035) { const sd = a.k > 0 ? -1 : 1, [x, z] = bord(a, sd, wa - 0.12); coudes[(j / 40 | 0) % 3].push([x, a.y + 2.4, z, ry]); } // le mur extérieur du coude : faïence qui luit, repère de freinage
          if (ph === 3) for (const sd of [-1, 1]) for (let e = -1; e <= 1; e++) { const [x, z] = bord(a, sd, wa - 0.55), xx = x + a.tx * e * 0.9, zz = z + a.tz * e * 0.9; if ((j + e + (sd > 0)) % 3) cones.push([xx, a.y, zz, 0, 0.42, 0.75, 0.42, [0xd9a21b, 0xb5391e, 0x8a5a2a, 0x3a6a2a][(j + e + 2) % 4]]); else cuivres.push([xx, a.y + 0.35, zz, 0, 0.4, 0.35, 0.4]); } }
        for (const sd of [-1, 1]) h.ribbon(T.t0, cT, s => sd * (s.w - 1.3), 0.045, s => sd * (s.w - 1.05), 0.045, h.mat('peinture', { c: 0xf4ead0, side: THREE.DoubleSide }), 4); // ligne de rive ivoire, mate : le bord se lit sous la voûte
        for (const sd of [-1, 1]) h.ribbon(T.t0, cT, s => sd * (s.w - 0.7), 0.04, s => sd * (s.w - 0.05), 0.04, h.mat('peinture', { lum: 1, c: 0xd8c8a8, side: THREE.DoubleSide }), 4); // seuil de pierre claire au pied des boutiques : le bord de la ruelle se lit dans les coudes
        [voute, vouteF, jour, murHaut, boutiques, bandeau, boutiquesD, dehors, toit].forEach(n => n.fin());
        Is('arcBazar', { brique: h.mat('brique', { c: 0x9a7060, emissive: 0x4a3828 }), faience: h.mat('faience') }, arcs, { a: [W] });
        I(h.geo('houppierRond'), h.mat('peinture', { lum: 1, c: 0xe8a050 }), lan); I(h.geo('bloc'), h.mat('matGris'), chaines);  // lanternes de cuivre rondes, pendues à la clé des arcs ; guirlandes au-dessus des boutiques
        I(h.geo('boite', 0.5, 0.8, 2.4), h.mat('planches', { emissive: 0x4a3828 }), comptoirs); { const ms = I(h.geo('cone'), h.mat('peinture', { c: 0xffffff }), sacs); sacs.forEach((p, k) => ms.setColorAt(k, new THREE.Color(p[7]))); if (sacs.length) ms.instanceColor.needsUpdate = true; } // comptoirs chargés de sacs d'épices
        I(h.geo('boite', 0.1, 4, 8), h.mat('faience', { emissive: 0x4a3828 }), coudes.flat()); // mats : allumés, ils éblouissaient au coude // chaque coude a sa couleur : faïence, lapis, or
        [['#a23b2a', '#1f3a6e', '#f0b840'], ['#1f3a6e', '#a23b2a', '#f4ead0'], ['#2aa39a', '#7a2a2a', '#f0b840'], ['#c8323c', '#2f4a2e', '#f0b840']].forEach((c, k) => { I(h.geo('boite', 0.08, 3.2, 2.2), h.mat('tapis', { emissive: 0x4a3828 }, ...c), tap[k]); I(h.geo('boite', 1.3, 0.04, 2.2), h.mat('tapis', { emissive: 0x4a3828 }, ...c), tapSol[k]); });
        { const mc = I(h.geo('cone'), h.mat('peinture', { c: 0xffffff }), cones); cones.forEach((p, k) => mc.setColorAt(k, new THREE.Color(p[7]))); if (cones.length) mc.instanceColor.needsUpdate = true; }
        I(h.geo('houppierRond'), h.mat('peinture', { c: 0xc8742e }), cuivres);
        I(h.geo('calotte'), h.mat('briqueCrue', { c: 0xffe4c8 }), domes); I(h.geo('tambour'), h.mat('faience'), lanternons);
        const pm = { brique: h.mat('brique', { c: 0xd8a070 }), faience: h.mat('faience'), inscr: h.mat('inscription'), muq: h.mat('muqarnas') };
        h.pose('pishtaq', pm, repere(h, S[T.t0]), [0, 0, 0], S[T.t0].w); { const gr = repere(h, S[T.t1]); gr.rotation.y += Math.PI; h.pose('pishtaq', pm, gr, [0, 0, 0], S[T.t1].w); } }

      // --- à ciel ouvert, avant le portail (fin du jardin) et après la voûte jusqu'à la ruelle de jardins : une rue de boutiques. Chaque module a ses niches, un étage et un toit plat ;
      // les hauteurs varient de 7 à 10 m, puis la rue s'abaisse vers la plaine. Sur les 40 premiers mètres après la voûte, des toiles tendues d'une façade à l'autre : on ne passe pas d'un coup de l'ombre au ciel ---
      { const mods = [[], []], badgirs = [], potences = [], lanternes = [], etals = [[], []], toiles = [[], []], finRue = R0 + 22, peaux = { tapis: h.mat('tapis', {}, '#a23b2a', '#1f3a6e', '#f0b840'), boutiques: h.mat('hojreh', { emissive: 0x4a3828 }), faience: h.mat('faience'), etage: h.mat('facadeCrue'), toit: h.mat('brique', { c: 0xb88868 }) };
        const rue = (a, b) => { for (let i = a, k = 0; i < b; i += 6, k++) { const j = i % N, s = S[j], reste = (b - i) / 6, bas = 1; // la rue garde sa hauteur jusqu'aux premiers îlots de la rue de village, 6 m avant la ligne (elle s'abaissait vers un mur de terre nu : 50 m vides)
            for (const sd of [-1, 1]) { const [x, , z] = au(S[(j + 3) % N], sd * (S[(j + 3) % N].w + 0.5)), hy = bas * (0.72 + ((k * 5 + (sd > 0) * 3) % 5) * 0.14); mods[(k + (sd > 0)) % 2].push([x, s.y - 0.4, z, Math.atan2(-s.tz, s.tx) + (sd < 0 ? Math.PI : 0), 1.04, hy, 1]);
              if ((k + (sd > 0) * 2) % 3 === 1) { const [bx, , bz] = au(S[(j + 3 + (k % 2) * 2) % N], sd * (S[(j + 3) % N].w + 5 + (k % 3))); badgirs.push([bx, s.y - 0.4 + 9.5 * hy, bz, h.across(s), 1, 0.8 + (k % 4) * 0.2, 1]); } // une tour à vent sur un toit sur trois : la ligne des toits n'est plus un trait
              if ((k + (sd > 0)) % 2 === 0 && reste > 2) { const [ex, , ez] = au(s, sd * (s.w - (sd > 0 ? 3.4 : 2.3))); etals[(k >> 1) % 2].push([ex, s.y, ez, dehors(s, sd)]); } // un étal à auvent devant une boutique sur deux, sur le bord de la chaussée
              if ((k + (sd > 0) * 2) % 5 === 0) { const [px, , pz] = au(s, sd * (s.w - 0.4)); potences.push([px, s.y + 4.9, pz, h.across(s), 1.8, 0.1, 0.1]); const [lx, , lz] = au(s, sd * (s.w - 1.1)); lanternes.push([lx, s.y + 4.2, lz, 0]); h.lum(j, lx, s.y + 4.2, lz, 0xffb060, 14, 0.4); } } } }; // une lanterne sur potence de fer, fixée à la façade, une boutique sur cinq
        rue(i25 - 2, T.t0 - 2); rue(T.t1 + 3, finRue);
        for (let k = 0; k < 6; k++) { const s = S[(T.t1 + 4 + k * 3) % N]; toiles[k % 2].push([s.x, s.y + 7.6 - (k % 2) * 0.5, s.z, h.across(s), 2 * s.w + 1.2, 0.08, 1.6]); } // six bandes de toile étroites, d'une façade à l'autre, sous la ligne des toits (larges, elles faisaient un grand aplat quand la caméra passait dessous)
        mods.forEach((l, v) => sansOmbre(Is('arcadeBazar', { ...peaux, boutiques: h.mat('hojreh', { emissive: 0x4a3828 }, 5, v * 2), tapis: v ? h.mat('tapis', {}, '#1f3a6e', '#a23b2a', '#f4ead0') : peaux.tapis }, l), peaux.etage)); /* deux variantes de module, alternées : cinq niches plus fines, marchandises et tapis différents */ sansOmbre(Is('badgir', { crue: peaux.etage, sombre }, badgirs)); [['#c8323c', '#f0b840'], ['#2aa39a', '#e8d9b5']].forEach((c, n) => sansOmbre(Is('etalPerse', { bois, auvent: h.mat('auvent', DS, ...c), marchandise: h.mat('peinture', { c: n ? 0xf0b840 : 0xc8323c }) }, etals[n]))); I(h.geo('bloc'), h.mat('matGris'), potences); I(h.geo('lanterne'), h.mat('peinture', { lum: 1, c: 0xe8a050 }), lanternes);
        [['#e8d9b5', '#d2a24c'], ['#e8d9b5', '#2aa39a']].forEach((c, k) => I(h.geo('bloc'), h.mat('auvent', { ...DS, emissive: 0x6a5a40 }, ...c), toiles[k])); // toiles claires mais éclairées par le jour : lumineuses, elles brûlaient la sortie de la voûte en bandes blanches
        rigole(T.t1 + 3, (R0 + 27 - (T.t1 + 3) + N) % N); if (T.tun) rigole(T.t0, (T.t1 - T.t0 + N) % N + 3, 2.7, 1.8); rigole(i25 - 3, (T.t0 - (i25 - 3) + N) % N); } // la rigole du canal, à droite, jusqu'à celle de la ruelle
      // --- le quartier du bazar : autour de la voûte et de la rue, une nappe de maisons de brique crue à toits plats qui descend la pente, quelques calottes de brique (pas de bulbe : REFS §12) ---
      { const calottes = calottesV;
        for (let x = -70; x < 172; x += 12.5) for (let z = -46; z < 470; z += 12.5) { const xx = x + ((x * 7 + z * 3) % 5) - 2, zz = z + ((x * 3 + z * 11) % 5) - 2, i = near(h, xx, zz), s = S[i], d = Math.hypot(s.x - xx, s.z - zz);
          if (d < s.w + (enTunnel(i) ? 16 : 23) || d > 84 || !(enTunnel(i) || i >= i25 - 4 && i < T.t0 || i > T.t1 && i < R0 + 20) || xx > 120 && zz > TZ + 4) continue; // ni sur la route, ni dans le jardin, ni loin de la rue
          const sx = 0.95 + ((x + z) % 4) * 0.14, sy = 0.9 + ((x * 5 + z) % 5) * 0.22, y = sol(xx, zz); maisons.push([xx, y - 0.4, zz, ((x + z) % 4 | 0) * Math.PI / 2, sx, sy, sx]); if ((x * 3 + z * 7) % 11 < 1.2) calottes.push([xx, y + 6 * sy - 0.4, zz, 0, 3.3 * sx, 2.3, 3.3 * sx]); }
        sansOmbre(Is('maison', { crue: h.mat('facadeCrue'), sombre }, maisons)); I(h.geo('calotte'), h.mat('voute'), calottes); }
    },
    // ---------- Barrage 74 : centrale hydroélectrique soviétique de montagne, début mai 1974, retenue basse, vidanges de fond ouvertes, matin voilé ----------
    // Le site (propositions/PROPOSITION-barrage.md) : Saïano-Chouchenskaïa au 1/2,5. x vers l'est, z vers le sud, la rivière coule vers le sud.
    // Un mur poids-voûte de 95 m (pied à 10 m, crête à 105 m) en arc de 600 m de rayon (centre en x = 0, z = 550, bombé vers le lac au nord) ferme une vallée en V.
    // Niveaux : retenue 85 m (pleine : 97 m, limite des arbres côté lac), bassin 10 m, terrasse de la rive est 14 à 16 m (usine, poste, cité), rivière 10 → 6 m.
    // Le relief est une fonction du site (`site`) ; près de la route il se raccorde à elle. La route : rue de la cité, vallée, pont au pied du mur, rampe du versant ouest,
    // tunnel dans l'éperon de la culée ouest, crête, épaule du versant est (deux épingles), retour à la cité.
    barrage(h) {
      const { THREE, S, N, W, rnd } = h, PP = h.M.pts.map((_, k) => pt(h, k)), P = k => PP[k], T0 = h.T.t0, T1 = h.T.t1, LUMI = { lum: 1 }, DS = { side: THREE.DoubleSide }, IX = new Map(S.map((s, i) => [s, i]));
      const mc = new Map(), mat = (n, o = {}, ...a) => { const k = n + JSON.stringify(o) + JSON.stringify(a); if (!mc.has(k)) mc.set(k, h.mat(n, o, ...a)); return mc.get(k); }; // une matière par réglage : le jeu fond ensuite les pièces qui la partagent
      const lots = new Map(), ruban = (...a) => { const m = h.ribbon(...a); (lots.get(m.material) || lots.set(m.material, []).get(m.material)).push(m); return m; }; // rubans regroupés par matière à la fin (fond)
      const fond = () => { for (const [m, L] of lots) { if (L.length < 2) continue; const P3 = [], N3 = [], UV = [], I = []; for (const o of L) { const g = o.geometry, b = P3.length / 3; P3.push(...g.attributes.position.array); N3.push(...g.attributes.normal.array); UV.push(...g.attributes.uv.array); I.push(...Array.from(g.index.array, i => i + b)); h.scene.remove(o); g.dispose(); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); const o = new THREE.Mesh(g, m); o.receiveShadow = true; h.scene.add(o); } };
      const K = { depart: 0, sortieVille: 9, plat: 21, halle0: 27, halle1: 33, pont0: 40, pont1: 42, rampe: 44, ravin: 52, traverse: 55, tunnel: 63, crete: 68, culee: 75, epingleHaute: 83, belvedere: 89, descente: 92, entreeVille: 100, rueSud: 112, fin: 116 }; // indices des points de contrôle nommés (captures/gen-pts.js K)
      const dans = (i, a, b) => ((i - P(a) + N) % N) <= ((P(b) - P(a) + N) % N); // échantillon i entre les points a et b
      const lisse = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }, mix = (a, b, t) => a + (b - a) * t;
      const pl = (T, v) => { if (v <= T[0][0]) return T[0][1]; for (let k = 1; k < T.length; k++) if (v <= T[k][0]) return mix(T[k - 1][1], T[k][1], (v - T[k - 1][0]) / (T[k][0] - T[k - 1][0])); return T[T.length - 1][1]; }; // table [[abscisse, valeur], …] lue en ligne brisée
      const SUB = []; for (let i = 0; i < N; i += 3) SUB.push(i);
      const proche = (x, z) => { let b = 0, bd = 1e18; for (const i of SUB) { const s = S[i], d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = i; } } return { i: b, s: S[b], d: Math.sqrt(bd) }; };
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
      bande(RIV, eauRiv, 12); bande(FUITE, eauRiv, 12);
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
          bru.push([x, 15, z0 + 60, rnd() * 3, 30, 15, 30], [x + 10, 13.5, z0 + 78, rnd() * 3, 26, 11, 26]); }
        maille(P3, UV, I, blanc);
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
        inst(h, h.geo('alternateur'), vert, G3); inst(h, h.geo('collier'), mat('bandeOrange'), G3); inst(h, h.geo('capot'), vertS, G3.map(([x, y, z]) => [x, y + 5, z])); inst(h, h.geo('excitatrice'), rouge, G3.map(([x, y, z]) => [x, y + 6.8, z]));
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
      { const ca = []; for (let i = 0; i < N; i += 6) { if (enVille(i) || surPont(i) || surMur(i) || enTunnel(i) || (i > iH0 - 4 && i < iH1 + 4)) continue; for (const sd of [-1, 1]) { const [x, z] = bord(S[i], sd, S[i].w + 0.3); ca.push([x, S[i].y + 1.05, z]); } }
        inst(h, h.geo('catadioptre'), h.mat('catadioptre', { lum: 1, retro: 2.5 }), ca); }

      // ---------- le pont du pied du mur : tablier et piles de béton, lampadaires ----------
      tranche(iP0 + 6, iP1 - 6, (i, l) => { ruban(i, l, s => -(s.w + 1.2), -0.15, s => s.w + 1.2, -0.15, betS, 8); ruban(i, l, s => -(s.w + 1.2), -2.4, s => s.w + 1.2, -2.4, betS, 8); for (const sd of [-1, 1]) ruban(i, l, s => sd * (s.w + 1.2), -0.15, s => sd * (s.w + 1.2), -2.4, betS, 8); });
      for (let i = iP0 + 18; i < iP1 - 12; i += 22) { const s = S[i], m = h.pose('boite', betS, h.scene, [s.x, (s.y - 2.4 + 2) / 2, s.z], 2 * W + 1, s.y - 2.4 - 2, 2.6); m.rotation.y = h.across(s); }
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
      const batis = [], dansBati = (px, pz, m = 4) => batis.some(([x, z, r, hl, hp]) => { const dx = px - x, dz = pz - z, c = Math.cos(r), s = Math.sin(r), u = dx * c - dz * s, v = dx * s + dz * c; return Math.abs(u) < hl + m && Math.abs(v) < hp + m; });
      const place = (x, z, r, hl, hp, marge = 5.5) => { const c = Math.cos(r), s = Math.sin(r); for (const u of [-1, -0.5, 0, 0.5, 1]) for (const v of [-1, 0, 1]) { const px = x + c * u * hl + s * v * hp, pz = z - s * u * hl + c * v * hp, p = proche(px, pz);
        if (p.d < p.s.w + marge || dansBati(px, pz) || riv(px, pz) < 10 || px < pl(XW, pz) + 8 || px > pl(XE, pz) - 8) return false; } batis.push([x, z, r, hl, hp]); return true; };
      // ce qui est fixe d'abord : la chaufferie et sa cheminée, le château d'eau, les garages, les jardins ouvriers
      let fontaine, kiosque, parterre, avion, ecole, jardin, boxes; const bosq = []; // les objets de la cité, repris pour combler les vides ; bouleaux des bosquets (posés avec la forêt)
      { batis.push([392, 1052, 0, 14, 12], [118, 1066, 0, 6, 6], [240, 1128, 0, 32, 5]);
        bloc(mat('brique'), 380, 404, 1042, 1062, YV - 2, YV + 9); bloc(betS, 379, 405, 1041, 1063, YV + 9, YV + 9.6); bloc(mat('brique'), 406, 410, 1050, 1054, YV - 2, YV + 40); bloc(betS, 405.6, 410.4, 1049.6, 1054.4, YV + 40, YV + 41);
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
          const t = new THREE.Mesh(new THREE.TorusGeometry(10, 0.22, 5, 28), jaune); t.position.set(0, 12.6, 0); g.add(t); for (let k = 0; k < 6; k++) h.pose('boite', jaune, g, [0, 12.6, 0], 20, 0.16, 0.16).rotation.z = k * Math.PI / 6;
          for (const e of [-1, 1]) for (const f of [-1, 1]) { const p = h.pose('boite', fer, g, [e * 2.4, 6.3, f * 1.1], 0.4, 13.6, 0.4); p.rotation.z = e * 0.37; } h.pose('boite', fer, g, [0, 12.6, 0], 1, 1, 2.6);
          for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6 + 0.26; B(Math.cos(a) * 10, 12.6 + Math.sin(a) * 10 - 0.9, 0, 1.5, 1.5, 1.3, [0xc8281e, 0x2a6aa8, 0xe8e4d8, 0x3a8a4a][k % 4]); }
          B(8, 1.3, 3.4, 2.4, 2.6, 2.4, 0xd8d0b8); B(8, 2.75, 3.4, 3, 0.3, 3, 0xc8281e); B(0, 0.03, 0, 26, 0.06, 11, 0x8a8468); });
        // la statue sur sa place : socle de granit rouge, bronze le bras levé, parterres, trois drapeaux
        lieu(iF(280), -1, 18, 15, (B, mot) => { const br = 0xc4c8c4; B(0, 0.03, 0, 38, 0.06, 31, 0xa8a49a); B(0, 0.25, -3, 16, 0.5, 14, 0x8d918a); B(0, 0.7, -3, 11, 0.5, 10, 0x8d918a); B(0, 3.6, -3, 5.4, 5.4, 4.6, 0x7a3a34); B(0, 6.5, -3, 6, 0.5, 5.2, 0x5a2a26); mot('ЛЕНИН', '#7a3a34', 0, 4, -0.62, 4.4, 1.3);
          for (const e of [-1, 1]) B(e * 0.6, 8.6, -3, 0.9, 3.8, 1.1, br); B(0, 12, -3, 2.6, 3.6, 1.7, br); B(0, 11, -3.2, 3, 3.2, 1.3, br); B(0, 14.5, -3, 1.2, 1.3, 1.2, br); B(-1.5, 11.6, -3, 0.6, 2.6, 0.7, br); B(1.6, 13.2, -1.6, 0.6, 0.6, 3.4, br); // jambes, buste, pan du manteau, tête, bras gauche le long du corps, bras droit tendu vers la rue
          for (const e of [-1, 1]) { B(e * 12, 0.3, 6, 8, 0.6, 3, 0xb5241c); B(e * 12, 0.3, -9, 8, 0.6, 3, 0xb5241c); B(e * 9, 0.45, 12, 2.4, 0.1, 0.5, 0x6a4a2a); B(e * 9, 0.22, 12, 2.2, 0.44, 0.12, 0x55585a); }
          for (let k = -2; k <= 2; k++) { B(k * 4, 6, -12.5, 0.2, 12, 0.2, 0x8a8e88); B(k * 4 + 1.3, 10.9, -12.5, 2.6, 1.7, 0.06, 0xb5241c); } }, 8);
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
        const pk = [mat('panneauK', {}, '#9c9c96'), mat('panneauK', {}, '#8c9092'), mat('panneauK', {}, '#a8a498')], tous = [...rang1, ...rang2]; { const lk = mat('panneauKlum').map; for (const m of pk) { m.emissiveMap = lk; m.emissive.setHex(0xffffff); m.emissiveIntensity = 0.9; } } // une fenêtre sur trois est allumée
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
        bloc(gris, -12.2, -11.8, 148.8, 149.2, YB, YB + 14); bloc(mat('peinture', { c: 0xb5241c }), -11.9, -11.7, 149.2, 153.6, YB + 11.2, YB + 13.8);
        { const tr = []; for (let k = 0; k < 7; k++) { const z = 183 + k * 5.4; tr.push([4.5, YB + 1.7, z, 0, 5.4, 2.2, 2.6, 0x5a6844], [-0.1, YB + 1.5, z, 0, 2.4, 2.4, 2.5, kaki], [3, YB + 0.5, z, 0, 7.4, 1, 2.7, 0x1e2020]); } // sept camions bâchés, le nez vers la route : bâche, cabine, châssis
          for (const z of [229, 240]) tr.push([-6, YB + 1.2, z, 0, 7, 1.5, 3.1, kaki], [-5.4, YB + 2.3, z, 0, 2.6, 0.8, 1.8, kaki], [-9.2, YB + 2.4, z, 0, 4.6, 0.25, 0.25, 0x2a2e26]); // deux blindés, tourelle et canon
          const m = inst(h, h.geo('bloc'), mat('peinture'), tr), c = new THREE.Color(); tr.forEach((q, k) => m.setColorAt(k, c.setHex(q[7]))); m.instanceColor.needsUpdate = true; }
        for (const [x, z] of [[BX0 + 4, BZ0 + 4], [BX0 + 4, BZ1 - 4], [BX1 - 4, BZ1 - 4]]) { for (const dx of [-1.4, 1.4]) for (const dz of [-1.4, 1.4]) bloc(gris, x + dx - 0.15, x + dx + 0.15, z + dz - 0.15, z + dz + 0.15, YB, YB + 9); bloc(olive, x - 2, x + 2, z - 2, z + 2, YB + 9, YB + 11.4); bloc(betS, x - 2.6, x + 2.6, z - 2.6, z + 2.6, YB + 11.4, YB + 11.8); bloc(mat('lampe', LUMI), x - 0.5, x + 0.5, z - 0.5, z + 0.5, YB + 11.8, YB + 12.4); } // trois miradors, projecteur allumé
        // la défense antiaérienne, au premier rang devant la route : un radar sur sa butte, deux rampes et leurs missiles pointés vers le nord-ouest
        { const tre = mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide }, '#5a6652'), blancM = mat('peinture', { c: 0xd8dcd4 });
          bloc(olive, -31, -23, 254, 262, YB, YB + 3); bloc(tre, -28, -26, 257, 259, YB + 3, YB + 12); { const d = new THREE.Mesh(new THREE.SphereGeometry(11, 14, 5, 0, Math.PI * 2, 0, 0.75), mat('peinture', { c: 0xc8ccc0, side: THREE.DoubleSide })); d.position.set(-27, YB + 16, 258); d.rotation.order = 'YXZ'; d.rotation.set(Math.PI - 1, -1.2, 0); d.castShadow = true; h.scene.add(d); h.pose('boite', olive, h.scene, [-27, YB + 12.6, 258], 2.4, 1.2, 2.4); }
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
        insts(h, 'grueKB', { acier: mat('peinture', { c: rouille }), treillis: mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide }, '#8a4634'), lest: mat('peinture', { c: 0x6d726d }), cabine: mat('peinture', { c: 0xe8e0c8 }), vitre: mat('vitreSombre'), cable: fer }, [[91, YC2 + 0.3, 500, 2.7], [91, YC2 + 0.3, 562, 3.5]]);
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
        for (const [i, txt] of [[P(K.sortieVille) - 4, '1 МАЯ'], [P(K.entreeVille) + 14, 'МИР · ТРУД · МАЙ']]) { const s = S[(i + N) % N], gr = repere(h, s); for (const sd of [-1, 1]) h.pose('boite', gris, gr, [sd * (s.w + 2), 4.5, 0], 0.3, 9, 0.3); h.pose('boite', mat('lettres', {}, txt, '#b5241c', '#f0e8d0'), gr, [0, 7.6, 0], 2 * s.w + 4, 2.2, 0.12); }
        { let b = null, bd = 1e9; for (const q of rang1) { const d = Math.hypot(q[0] - 300, q[2] - 795); if (q[4] === 30 && d < bd) { bd = d; b = q; } } if (b) { const [x, y, z, r] = b, m = new THREE.Mesh(h.geo('boite', 40, 5, 0.4), mat('lettres', {}, 'СЛАВА ТРУДУ', '#8d918a', '#b5483c')); m.position.set(x + Math.sin(r) * 5.6, y + 15 + 0.6 + 2.5, z + Math.cos(r) * 5.6); m.rotation.y = r; h.scene.add(m); } } // sur le toit de l'immeuble de la rue le plus proche, face à la chaussée
        { const s = S[P(K.rueSud) + 8], [x, z] = bord(s, -1, s.w + 5.4), b = [[x, s.y + 1.7, z, h.across(s) + Math.PI / 2, 10.5, 2.4, 2.5, 0xe8e0c8], [x, s.y + 1.0, z, h.across(s) + Math.PI / 2, 10.6, 0.6, 2.56, 0xb5241c], [x, s.y + 0.35, z, h.across(s) + Math.PI / 2, 8, 0.7, 2.3, 0x1e2020]]; // l'autobus crème à bande rouge
          const m = inst(h, h.geo('bloc'), mat('peinture'), b), c = new THREE.Color(); b.forEach((p, k) => m.setColorAt(k, c.setHex(p[7]))); m.instanceColor.needsUpdate = true; }
        { const s = S[P(K.plat + 1)], [x, z] = bord(s, 1, s.w + 9), y = hAt(x, z), g2 = new THREE.Group(); g2.position.set(x, y, z); g2.rotation.y = h.across(s) + Math.PI * 0.75; h.scene.add(g2); // la stèle du chantier au bord de la route de la vallée
          h.pose('boite', betS, g2, [0, 0.5, 0], 8, 1.4, 3.4); const st = h.pose('boite', bet, g2, [0, 6.5, 0], 3.2, 11, 1.4); h.pose('boite', mat('lettres', {}, 'ГЭС 1974', '#8d918a', '#b5483c'), g2, [0, 3, 0.75], 7, 1.8, 0.1); } }

      // ---------- la zone industrielle de la vallée, entre la cité et la centrale : clôture de béton le long de la route, hangars, garages, piles de panneaux et de tuyaux, camions, grue à tour, le poste de contrôle de la centrale, le terminus du tramway ----------
      { const iZ0 = iV1 + 6, iZ1 = iH0 - 22, po2 = mat('betonPO2', DS), tramA = P(K.plat) + 4, tramB = P(K.halle0) - 34, cote = (i, sd) => !(sd > 0 && i > tramA - 6 && i < tramB + 6); // côté libre (le tramway prend le bord est à la fin)
        // la clôture de béton à losanges, des deux côtés, coupée devant le portail de la garnison
        for (const sd of [-1]) { let deb = -1; for (let i = iZ0; i <= iZ1 + 1; i++) { const s = S[i], [x, z] = bord(s, sd, s.w + 4.4), ok = i <= iZ1 && cote(i, sd) && !(sd < 0 && Math.abs(z - 540) < 12) && !poste(x + (sd > 0 ? 6 : 0), z); if (ok && deb < 0) deb = i; if (!ok && deb >= 0) { if (i - deb > 3) tranche(deb, i, (j, l) => ruban(j, l, q => sd * (q.w + 4.4), 2.3, q => sd * (q.w + 4.4), -0.4, po2, 4)); deb = -1; } } }
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
        // à droite, le long de la route : la voie de desserte du chantier et un train de marchandises à l'arrêt (locomotive verte, citernes, tombereaux de gravier, couverts)
        { const fer = mat('peinture', { c: 0x2a2c2e }), a = iZ0 + 10, b = tramA - 12; tranche(a, b, (i, l) => { for (const o of [8.75, 10.25]) ruban(i, l, s => s.w + o, 0.16, s => s.w + o + 0.18, 0.16, fer, 4); ruban(i, l, s => s.w + 7.8, 0.05, s => s.w + 11.4, 0.05, mat('bruit', {}, '#6e6a60', ['#7c786c', '#5e5a50']), 6); });
          for (let i = a + 6, n = 0; i < b - 6; i += 7, n++) { const s = S[i], [x, z] = bord(s, 1, s.w + 9.6), y = s.y + 0.2, r = h.across(s) + Math.PI / 2, T = (dx, dy, lx, ly, lz, col) => bl(x + s.tx * dx, y + dy, z + s.tz * dx, r, lx, ly, lz, col); if (poste(x, z)) continue;
            T(0, 0.6, 12.6, 0.6, 2.4, 0x1e2020);
            if (n === 0) { T(0, 2.3, 13, 2.8, 2.9, 0x2f5a3c); T(3.4, 4.2, 4, 1.4, 2.9, 0x2f5a3c); T(3.4, 4.3, 4.04, 0.7, 2.94, 0x2a3a4a); T(0, 1.5, 13.04, 0.4, 2.94, 0xd8b820); T(-6.4, 2, 0.3, 0.8, 2, 0xb5241c); }
            else if (n % 3 === 1) { T(0, 2.5, 11, 2.6, 2.6, 0x3a3e40); T(0, 4, 1.4, 0.6, 1.4, 0x3a3e40); T(0, 2.5, 11.04, 0.5, 2.64, 0xe8e4d8); }
            else if (n % 3 === 2) { T(0, 2, 12, 2.2, 2.8, 0x7a3a2c); T(0, 3.25, 11.4, 0.5, 2.3, 0xb4aa98); }
            else { T(0, 2.6, 12, 3.4, 2.8, 0x6a4a34); T(0, 4.4, 12.2, 0.3, 3, 0x6d726d); T(0, 2.4, 2.4, 2.6, 2.84, 0x4a3424); } } }
        // à gauche, par-dessus la clôture : la centrale à béton du chantier (tour, trois silos, bande montante) puis un portique roulant jaune sur son parc à panneaux
        { const s = S[iZ0 + 70], [x, z] = bord(s, -1, s.w + 20), r = h.across(s) + Math.PI / 2, Y = hAt(x, z), T = (du, dy, dv, a, b, c, col) => bl(x + s.tx * du - s.tz * dv, Y + dy, z + s.tz * du + s.tx * dv, r, a, b, c, col);
          if (!chantier(x, z) && !base(x, z) && place(x, z, r, 16, 8)) { T(0, 11, 0, 8, 22, 8, 0xa8aaa4); T(0, 20, 0, 8.1, 2, 8.1, 0xb5241c); T(0, 23, 0, 9, 2, 9, 0x6d726d); for (let k = 0; k < 3; k++) { T(-8 - k * 5, 8, 2, 4.4, 16, 4.4, 0xc8ccc4); T(-8 - k * 5, 16.4, 2, 3, 0.8, 3, 0x6d726d); } for (let k = 0; k < 6; k++) T(6 + k * 3, 2 + k * 3, -1, 3.4, 0.8, 1.6, 0x55585a); T(22, 1.5, -1, 5, 3, 5, 0x8a8e88); } }
        { const s = S[iZ0 + 150], [x, z] = bord(s, -1, s.w + 22), r = h.across(s) + Math.PI / 2, Y = hAt(x, z), T = (du, dy, dv, a, b, c, col) => bl(x + s.tx * du - s.tz * dv, Y + dy, z + s.tz * du + s.tx * dv, r, a, b, c, col);
          if (!chantier(x, z) && !base(x, z) && place(x, z, r, 14, 12)) { for (const e of [-1, 1]) { for (const f of [-1, 1]) T(f * 3, 7, e * 11, 0.7, 14, 0.7, 0xd8a020); T(0, 0.5, e * 11, 9, 1, 1.2, 0xd8a020); } T(0, 14.6, 0, 2.6, 1.8, 26, 0xd8a020); T(0, 12.8, 4, 3, 1.8, 3, 0x3a3e3c); T(0, 9, 4, 0.2, 6, 0.2, 0x2a2c2e); for (let k = 0; k < 4; k++) for (let n = 0; n < 5; n++) T(-8 + k * 5.4, 0.2 + n * 0.34, -3, 4.6, 0.26, 3, 0xb0b2aa); } }
        // l'arrivée à la centrale : une allée de drapeaux rouges à gauche sur les 150 derniers mètres
        for (let i = iH0 - 76; i < iH0 - 6; i += 7) { const s = S[i], [x, z] = bord(s, -1, s.w + 3.4), y = Math.max(s.y, hAt(x, z)), r = h.across(s); bl(x, y + 4.5, z, r, 0.18, 9, 0.18, 0x8a8e88); bl(x - s.tx * 1.1, y + 8, z - s.tz * 1.1, r + Math.PI / 2, 2.2, 1.4, 0.06, 0xb5241c); }
        // le poste de contrôle de la centrale, en travers de la route : deux piles, un linteau à l'enseigne, la guérite, la barrière levée
        { const s = S[P(K.sortieVille + 6)], r = h.across(s), o = s.w + 2.2; for (const sd of [-1, 1]) { const [x, z] = bord(s, sd, o); bl(x, s.y + 4.2, z, r, 2.4, 8.4, 2.4, 0x8d918a); bl(x, s.y + 0.6, z, r, 2.8, 1.2, 2.8, 0x6d726d); }
          bl(s.x, s.y + 9.2, s.z, r, 2 * o + 4, 1.8, 2.6, 0x8d918a); const m = new THREE.Mesh(h.geo('boite', 2 * o - 2, 1.5, 0.15), mat('lettres', {}, 'ГЭС-74 · ПРОПУСК', '#8d918a', '#b5483c')); m.position.set(s.x - s.tx * 1.4, s.y + 9.2, s.z - s.tz * 1.4); m.rotation.y = r + Math.PI; h.scene.add(m);
          const [gx, gz] = bord(s, 1, o + 4); bl(gx, s.y + 1.6, gz, r, 3, 3.2, 3, 0xb8b4a4); bl(gx, s.y + 3.4, gz, r, 3.6, 0.3, 3.6, 0x6d726d); bl(gx - Math.cos(r) * 1.55, s.y + 2, gz + Math.sin(r) * 1.55, r, 0.1, 1.2, 1.8, 0x2a3a4a); // la guérite et sa vitre
          const [bx, bz] = bord(s, 1, o - 1.6); bl(bx, s.y + 3.4, bz, r, 0.25, 6.2, 0.25, 0xc8281e); bl(bx, s.y + 1.4, bz, r, 0.3, 0.9, 0.3, 0xf2f0e8); bl(bx, s.y + 4.4, bz, r, 0.3, 0.9, 0.3, 0xf2f0e8); } // la barrière, levée
        // le terminus du tramway : la voie, les poteaux de la caténaire, la motrice rouge et crème à quai
        { const fer = mat('peinture', { c: 0x2a2c2e });
          tranche(tramA, tramB, (i, l) => { for (const o of [5.2, 6.7]) ruban(i, l, s => s.w + o, 0.12, s => s.w + o + 0.18, 0.12, fer, 4); ruban(i, l, s => s.w + 4.4, 0.04, s => s.w + 7.7, 0.04, mat('bruit', {}, '#6e6a60', ['#7c786c', '#5e5a50']), 6); });
          const fil = []; let prev = null; for (let i = tramA; i < tramB; i += 13) { const s = S[i], [x, z] = bord(s, 1, s.w + 8.6), r = h.across(s); bl(x, s.y + 3.6, z, r, 0.25, 7.2, 0.25, 0x55585a); bl(x - Math.cos(r) * 1.3, s.y + 6.8, z + Math.sin(r) * 1.3, r, 2.8, 0.12, 0.12, 0x55585a); const [fx, fz] = bord(s, 1, s.w + 6); if (prev) fil.push(prev[0], prev[1], prev[2], fx, s.y + 6.6, fz); prev = [fx, s.y + 6.6, fz]; }
          const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(fil, 3)); h.scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2e3230 })));
          const s = S[tramA + 30], [x, z] = bord(s, 1, s.w + 6), r = h.across(s) + Math.PI / 2; bl(x, s.y + 1.9, z, r, 13, 2.4, 2.5, 0xb5483c); bl(x, s.y + 2.5, z, r, 13.1, 0.9, 2.56, 0xe8e0c8); bl(x, s.y + 0.4, z, r, 10, 0.7, 2.2, 0x1e2020); bl(x, s.y + 3.3, z, r, 12, 0.3, 2.3, 0x6d726d); bl(x, s.y + 4.8, z, r, 0.1, 2.8, 1.6, 0x2a2c2e); } }

      // ---------- la montée et la descente : grumes, relais hertzien, camp de pionniers sur l'épaule, char sur son socle à l'entrée de la cité, belvédère, meules et palissades ----------
      { // la coupe de bois de la rampe : une clairière de souches du côté le plus plat, quatre piles de grumes, le camion grumier, l'enseigne
        const i = P(K.rampe + 3), s = S[i], ec = sd => Math.abs(hAt(...bord(s, sd, s.w + 26)) - s.y), sd = ec(-1) < ec(1) ? -1 : 1, r = h.across(s) + Math.PI / 2, [cx, cz] = bord(s, sd, s.w + 26); clair.push([cx, cz, 34]);
        for (let j = 0; j < 4; j++) { const q = S[i + (j % 2 ? 13 : -13)], [x, z] = bord(q, sd, q.w + (j < 2 ? 8 : 17)), y = hAt(x, z); for (let n = 0; n < 3; n++) bl(x, y + 0.6 + n * 1.2, z, r + (j % 2 ? 0.12 : -0.12), 11, 1.2, 3.6 - n * 1.1, 0x7a5a3a); }
        { const q = S[i + 2], [x, z] = bord(q, sd, q.w + 4.6), y = q.y; bl(x, y + 0.6, z, r, 11, 0.8, 2.4, 0x1e2020); bl(x + q.tx * 4.3, y + 2, z + q.tz * 4.3, r, 2.3, 2.3, 2.4, 0x3a6a9a); bl(x - q.tx * 1.3, y + 1.9, z - q.tz * 1.3, r, 8.4, 1.6, 2.2, 0x7a5a3a); }
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
        bl(cx, y0 + 5, cz + 6, 0, 0.2, 10, 0.2, 0x8a8e88); bl(cx + 1.6, y0 + 9, cz + 6, 0, 3, 1.8, 0.06, 0xb5241c); }
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
        P1(tole, [X, 8.2, 0], 6.4, 6, 5.4); P1(tole, [X, 12.2, 0], 8.6, 2, 7.4); P1(fer, [X, 5.6, -11], 1.5, 0.5, 19).rotation.x = -0.36;
        for (const [z, r, ht] of [[-24, 7.5, 6.5], [22, 6, 5]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(r, ht, 9), gravier); c.position.set(X + 1, ht / 2 - 0.2, z); c.castShadow = true; gr.add(c); }
        for (const [x, z, ry] of [[X + 7, 10, 0.25], [X + 5, 34, -0.5]]) { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; gr.add(b); // deux camions-bennes : cabine orange, benne grise
          h.pose('boite', mat('peinture', { c: 0xd8621e }), b, [0, 2.1, -2.7], 2.5, 2.3, 2.1); h.pose('boite', mat('peinture', { c: 0x7a7e7a }), b, [0, 2.5, 1.3], 2.7, 1.7, 4.8).castShadow = true; h.pose('boite', fer, b, [0, 0.8, 0], 2.5, 1, 7.4); }
        { h.pose('boite', mat('lettres', {}, 'КАРЬЕР № 2', '#8d918a', '#2a2c2a'), gr, [-(sm.w + 5.5), 3.2, 30], 0.12, 1.5, 7); for (const dz of [-3, 3]) h.pose('boite', fer, gr, [-(sm.w + 5.5), 1.6, 30 + dz], 0.2, 3.2, 0.2); } }

      { const m = inst(h, h.geo('bloc'), mat('peinture'), peints), c = new THREE.Color(); peints.forEach((p, k) => m.setColorAt(k, c.setHex(p[7]))); m.instanceColor.needsUpdate = true; }
      { const L = lampes.filter(([x, , z]) => !dansBati(x, z, 1.2)); insts(h, 'lampadaireGES', { fut: gris, lampe: mat('lampe', LUMI) }, L); inst(h, h.geo('bloc'), mat('peinture', { c: 0xb5241c }), L.filter(([x, , z]) => cite(x, z)).map(([x, y, z, r]) => [x + Math.cos(r) * 0.55, y + 6.2, z - Math.sin(r) * 0.55, r, 0.9, 2.6, 0.06])); } // les calicots rouges du 1er mai, sur les lampadaires de la cité

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
        for (let i = iV0 - 40; ((i - iV0 + 40 + N) % N) < ((P(K.plat + 2) - iV0 + 40 + N) % N); i = (i + 9) % N) for (const sd of [-1, 1]) { if (enVille(i) && ((i / 9 | 0) + (sd > 0)) % 2) continue; const [x, z] = bord(S[i], sd, S[i].w + (enVille(i) ? 1.9 : 6.5)); if (dAt(x, z) > W + 1.2 && riv(x, z) > 6 && !dansBati(x, z, 4) && !poste(x, z) && !base(x, z) && !chantier(x, z)) bou.push([x, hAt(x, z) - 0.3, z, rnd() * 6, 0.9 + rnd() * 0.4]); }
        { const m = inst(h, h.geo('cedre'), mat('conifere', {}, '#5e7a44'), [...cla, ...som]), c = new THREE.Color(); for (let k = 0; k < cla.length + som.length; k++) m.setColorAt(k, k < cla.length ? c.setRGB(1, 1, 1) : c.setRGB(0.54, 0.57, 0.69)); m.instanceColor.needsUpdate = true; } // mélèzes clairs et pins sombres en un seul lot : la teinte par arbre
        inst(h, h.geo('tronc'), h.mat('tronc'), futs);
        bou.push(...bosq); inst(h, h.geo('futBouleau'), mat('ecorceB'), bou); { const hp = bou.map(([x, y, z, r, s]) => [x, y, z, r, s * (0.8 + rnd() * 0.5)]); inst(h, h.geo('houppierB'), mat('feuillesB'), hp.filter((_, k) => k % 3)); inst(h, h.geo('houppierB'), mat('feuillesB', { c: 0xa8b890 }), hp.filter((_, k) => k % 3 === 0)); } }
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

      fond();
    },
    // ---------- Manuscrit 512 (Bahia, de nos jours, 9 h) : la cité perdue, dans une vallée de jungle dont la route fait le tour. propositions/PROPOSITION-chapada.md ----------
    // L'aval est à l'ouest (bas), l'amont à l'est : la falaise du plateau ferme la vallée et la grande chute en tombe (la source). La rivière passe sous le pont de lianes,
    // descend par ressauts à l'intérieur de la boucle, longe la place de la cité, s'étale au gué et sort vers l'ouest dans la brume. Sens horaire : la droite est l'intérieur.
    // Un seul sol, une seule chaussée, une seule brume, une seule forêt d'un bout à l'autre (T-0) : une zone ne se distingue que par ce qui s'ajoute à la forêt (toile, pierre, eau, roche).
    // Contre « la vague » (D-9) : aucune crête qui suit le maillage du terrain, aucune grande surface à bandes horizontales, pas de grande facette de terrain nue.
    chapada(h) {
      const { THREE, S, N, W, rnd, T } = h, DS = { side: THREE.DoubleSide }, P = k => pt(h, k), IX = new Map(S.map((s, i) => [s, i]));
      const cache = new Map(), mat = (n, o = {}) => { const k = n + JSON.stringify(o); return cache.get(k) || cache.set(k, h.mat(n, o)).get(k); }; // une matière par réglage : le moteur fond le décor fixe par matière
      const entre = (i, a, b) => ((i - a + N) % N) <= ((b - a + N) % N), ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      let VAP = null; const COULE = [], coule = (m, u, v) => { COULE.push([m.map, u, v]); return m; }; // l'eau qui coule : [texture, vitesse en u, vitesse en v] (répétitions par seconde), avancées par le tick renvoyé à la fin
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
      const e1 = tombe(5, 1, 0.55), e2 = tombe(11, 0.8, 0.9), ec = coule(h.mat('ecumeBassin', { lum: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false }), 0, 0.35); // les deux couches de toute chute, l'écume de tout bassin
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
      // ---------- l'eau : un seul ruban qui suit la rivière, plat par bief, incliné aux ressauts ----------
      { const pos = [], uv = [], idx = [];
        RIV.forEach((p, j) => { const q = RIV[Math.min(RIV.length - 1, j + 1)], o = RIV[Math.max(0, j - 1)], dx = q.x - o.x, dz = q.z - o.z, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, w = p.w + 2;
          pos.push(p.x + nx * w, p.y, p.z + nz * w, p.x - nx * w, p.y, p.z - nz * w); uv.push(0, j * 0.4, w / 5, j * 0.4); if (j) { const a = j * 2 - 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
        // deux matières : au gué l'eau est transparente, on voit les dalles de la chaussée dessous (le passage doit se lire)
        const clair = j => RIV[j].r ? 2 : RIV[j].x > -135 && RIV[j].x < 10 ? 1 : 0, tri = [[], [], []]; for (let j = 1; j < RIV.length; j++) { const a = j * 2 - 2; tri[clair(j)].push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } // 2 : sur la route de la descente, une eau vive et presque opaque (on roule dans la rivière, pas sur des dalles vertes)
        for (const [k, op, vit] of [[0, 0.86, 1], [1, 0.5, 1], [2, 0.9, 2.2]]) { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(tri[k]); ge.computeVertexNormals();
          const eau = new THREE.Mesh(ge, coule(mat('eauJade', { ...DS, transparent: true, opacity: op, gloss: 0.5, c: k === 2 ? 0xb8d8cc : 0xffffff }), 0, -0.5 * vit)); eau.receiveShadow = true; eau.userData.dyn = 1; h.scene.add(eau);
          // le courant : une seconde couche, plus rapide et plus claire, 4 cm au-dessus (deux couches qui défilent à des vitesses différentes : l'eau, pas un tapis roulant)
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
        inst(h, h.geo('rocher'), mat('rocheMousse'), rives); inst(h, h.geo('bloc'), ec, [...sill, ...bouil]).userData.dyn = 1;
        // la rivière quitte la route par la droite : un grand tronc couché en travers de sa sortie, le long de la chaussée, pour qu'on ne la suive pas (la route file tout droit vers l'arc)
        { const s = S[P(52) - 8], sd = [-1, 1].sort((a, b) => Math.hypot(...bord(s, a, 20).map((v, k) => v - [190, 490][k])) - Math.hypot(...bord(s, b, 20).map((v, k) => v - [190, 490][k])))[0], [x, z] = bord(s, sd, s.w + 2.2), ax = new THREE.Vector3(s.tx, 0.03, s.tz).normalize(), bois = mat('ecorceJungle');
          const pos = (g, d, y) => { const o = new THREE.Mesh(g, bois); o.position.set(x + s.tx * d, s.y + y, z + s.tz * d); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ax); h.scene.add(o); };
          pos(new THREE.CylinderGeometry(1.3, 1.7, 46, 7), 0, 1.3); pos(new THREE.CylinderGeometry(3.6, 3.2, 1.2, 7), -23.5, 1.8); } }
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
      insts(h, 'fougereArbo', { stipe: ecorce, fronde: palme }, fougeres); insts(h, 'jucara', { stipe: ecorce, palme }, palmiers);
      inst(h, h.geo('cimeLoin'), mat('feuilleLoin'), rideau).castShadow = false;
      const feuilleG = mat('feuilleSoleil', DS), rouge = mat('peinture', { c: 0xd8362a });
      insts(h, 'grandeFeuille', { feuille: feuilleG }, feuillesG); insts(h, 'grandeFeuille', { feuille: feuilleG, fleur: rouge }, heliconias, { a: [1, 1] });

      // ---------- la brume épaisse de la rivière et du cirque : des nappes basses, à plus de 22 m de la chaussée, jamais en l'air sur fond de ciel (D-6) ----------
      { const nappes = [], G = new THREE.PlaneGeometry(1, 1); G.rotateX(-Math.PI / 2);
        for (let j = 0; j < RIV.length; j += 5) { const p = RIV[j], x = p.x + (rnd() - 0.5) * 20, z = p.z + (rnd() - 0.5) * 20; if (g.dAt(x, z) > 45) nappes.push([x, p.y + 1.5 + rnd() * 4, z, rnd() * 6, 30 + rnd() * 30, 1, 22 + rnd() * 20]); }
        for (let k = 0; k < 5; k++) nappes.push([CIRQUE[0] + 4 + (rnd() - 0.5) * 26, 35 + rnd() * 7, CIRQUE[1] + 16 + (rnd() - 0.5) * 16, rnd() * 6, 26 + rnd() * 14, 1, 22 + rnd() * 10]); // le nuage au pied de la chute seulement
        const b = inst(h, G, mat('brume', { lum: 1, c: 0x343c24, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, ...DS }), nappes); b.castShadow = b.receiveShadow = false; }

      // ---------- matières et outils de pose des repères ----------
      const pierre = mat('pierreCite'), ombre = mat('pierreOmbre'), clairM = mat('pierreClaire'), or = mat('peinture', { lum: 1, c: 0xe8b83a }), noir = mat('peinture', { c: 0x14120e }), flamme = mat('peinture', { lum: 1, c: 0xffb040, fog: false }),
        bois = mat('ecorceJungle', { c: 0xc8a878 }), toile = mat('toileTente', DS), bambou = mat('bambou'), planche = mat('planchesPont'), lampe = mat('peinture', { lum: 1, c: 0xffd890 }), fer = mat('peinture', { c: 0x2a2a26 }),
        CITE = { pierre, ombre, clair: clairM, or, noir, relief: ombre, socle: mat('socleNoir'), inscription: mat('inscription512') };
      // un objet posé en (x, z), tourné de ry (son +Z regarde alors vers (sin ry, cos ry)) ; y = le sol par défaut
      const pose = (nom, peau, x, z, ry = 0, y = g.hAt(x, z), ...a) => { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; h.scene.add(p); h.pose(nom, peau, p, [0, 0, 0], ...a); return p; };
      // au bord de la route, face à elle : échantillon i, côté sd, à off m de l'axe
      const auBord = (nom, peau, i, sd, off, ...a) => { const s = S[(i + N) % N], [x, z] = bord(s, sd, off); return pose(nom, peau, x, z, Math.atan2(s.x - x, s.z - z), s.y - 0.35, ...a); };
      // torches de l'expédition : elles marquent les freinages à la place des panneaux (O-5) : deux à 100 m, une à 50 m ; et les lieux
      const torches = [], torche = (i, sd, off = 1.1) => { const s = S[(i + N) % N], [x, z] = bord(s, sd, s.w + off); torches.push([x, s.y - 0.3, z, rnd() * 6]); h.lum((i + N) % N, x, s.y + 2.6, z, 0xffa040, 13, 1.6); };
      for (const k of [16, 22, 44, 47]) { const i = P(k), sd = S[i].k > 0 ? -1 : 1; for (const d of [-7, 0, 7]) torche(i + d, sd, 1.4); } // trois flammes à l'extérieur de chaque virage serré : les deux épingles, les deux équerres
      for (const k of [4, 14, 20, 42, 52]) { const i = P(k) - (k === 42 ? 12 : 0); torche(i - 52, -1); torche(i - 52, 1); torche(i - 26, S[i].k > 0 ? -1 : 1); }

      // ---------- Z1, le camp de base (O-10) : tentes, table à cartes, caisses, 4×4 bâché, mât radio, dans la clairière de gauche ; l'expédition est là ----------
      { const P1 = { toile, bois, papier: mat('peinture', { c: 0xe8dcc0 }), lampe, fer, caisse: mat('peinture', { c: 0x5a6a3a }), vitre: noir, pneu: fer };
        for (const [x, z, r] of [[24, -19, 0.2], [44, -27, -0.1], [72, -26, 0.15], [94, -19, -0.3]]) pose('tente', P1, x, z, r).scale.setScalar(1.5);
        pose('tableCartes', P1, 58, -17, 0.3); pose('caisses', P1, 38, -13, 0.5); pose('caisses', P1, 82, -14, 2.2); pose('quatreQuatre', P1, 106, -15, 1.25); pose('matRadio', P1, 62, -44);
        pose('feuCamp', { pierre, bois, flamme }, 50, -11); h.lum(25, 50, 16, -11, 0xffa040, 14, 1.8); pose('echafaudage', { bambou, planche }, 8, -22, 1.57, undefined, 4, 3); pose('tableCartes', P1, 84, -22, -0.4); pose('caisses', P1, 16, -12, 2.6); pose('caisses', P1, 66, -11, 0.2); pose('quatreQuatre', P1, 122, -18, 1.9);
        for (const x of [20, 36, 52, 68, 84, 100]) { h.pose('boite', lampe, h.scene, [x, 19.2 - Math.abs(x - 60) * 0.004, -10.5], 0.3, 0.4, 0.3); } h.pose('boite', fer, h.scene, [60, 19.6, -10.5], 84, 0.05, 0.05); for (const x of [18, 102]) h.pose('boite', bois, h.scene, [x, 17.4, -10.5], 0.16, 4.6, 0.16); // une guirlande de lanternes le long de la route
        pose('caisses', P1, -30, -12, 1); pose('barque', P1, -82, 236, 0.9); pose('caisses', P1, -108, 120, 2); // T-8 : les traces de l'expédition depuis le gué
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
          for (const i of [a, b]) auBord('obelisque', CITE, i, sd, W + 1.9, 10.6); }
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
          nappe(haut, e1, 3); nappe(haut, e2, 2.4, -0.4); nappe(bas, e1, 4.2); nappe(bas, e2, 3.3, -0.5); nappe(filet, e2, 0.2); nappe(filet2, e2, 0.2);
          // la chute prend toute la paroi du cirque : deux autres pans, au sud-est et à l'est (le mur de gauche vu du pont), chacun avec sa paroi de roche derrière
          for (const th of [Math.PI / 4, Math.PI / 2, Math.PI * 0.72]) { const G = new THREE.Group(); G.position.set(CIRQUE[0] + 30 * Math.sin(th), 0, CIRQUE[1] + 30 * Math.cos(th)); G.rotation.y = th; h.scene.add(G); const w = 27;
            h.pose('boite', mat('rocheMousse', { c: 0x4a4a44 }), G, [0, 72, 4.5], w + 8, 82, 3);
            const pan = [[0, 112, 3, w * 0.8], [0, 110.5, 1.4, w * 0.84], [0, 104, 0.4, w * 0.88], [0, 84, 0, w * 0.94], [0, 60, -0.6, w], [0, 33.2, -2.6, w * 1.1]]; nappe(pan, e1, 3, 0, G); nappe(pan, e2, 2.4, -0.45, G); }
          // la vapeur au pied : des bouffées rondes et douces qui montent du bassin, grossissent et s'effacent (un seul nuage de points, additif : chaque bouffée s'éteint en fonçant sa couleur)
          { const n = 90, PP = new Float32Array(n * 3), CC = new Float32Array(n * 3), A = new Float32Array(n), gv = new THREE.BufferGeometry(); gv.setAttribute('position', new THREE.BufferAttribute(PP, 3)); gv.setAttribute('color', new THREE.BufferAttribute(CC, 3));
            const o = new THREE.Points(gv, new THREE.PointsMaterial({ size: 28, map: h.mat('brume', { lum: 1 }).map, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); o.frustumCulled = false; o.userData.dyn = 1; o.renderOrder = 5; h.scene.add(o);
            const nait = k => { const a = rnd() * Math.PI * 0.9 - 0.1, r = 12 + rnd() * 16; PP[k * 3] = CIRQUE[0] + r * Math.sin(a); PP[k * 3 + 1] = 33 + rnd() * 6; PP[k * 3 + 2] = CIRQUE[1] + r * Math.cos(a); A[k] = 0; };
            for (let k = 0; k < n; k++) { nait(k); A[k] = rnd(); PP[k * 3 + 1] += A[k] * 46; }
            VAP = dt => { for (let k = 0; k < n; k++) { A[k] += dt / 9; if (A[k] > 1) nait(k); PP[k * 3 + 1] += 5.2 * dt; PP[k * 3] -= 1.2 * dt; const f = 0.075 * Math.sin(Math.PI * Math.sqrt(A[k])); CC[k * 3] = CC[k * 3 + 1] = CC[k * 3 + 2] = f; } gv.attributes.position.needsUpdate = gv.attributes.color.needsUpdate = true; }; }
          { const P = [], U = [], I = [], NA = 14; for (let j = 0; j <= NA; j++) { const a = Math.PI * j / NA, c = Math.cos(a), sn = Math.sin(a); P.push(cx + 1 + c * 24, 33.12, cz - 3.2 - sn * 2, cx + 1 + c * 34, 33.12, cz - 3.2 - sn * 26); U.push(j / NA * 5, 0, j / NA * 5, -1.6);
              if (j) { const a0 = (j - 1) * 2; I.push(a0, a0 + 1, a0 + 2, a0 + 2, a0 + 1, a0 + 3); } }
            const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); ge.setIndex(I); ge.computeVertexNormals();
            const o = new THREE.Mesh(ge, ec); o.userData.dyn = 1; h.scene.add(o); } }
        inst(h, h.geo('rocher'), mat('rocheMousse'), [[cx - 7, 88, cz + 1, 0.4, 3.2, 2.2, 2], [cx + 3, 74, cz + 0.8, 1.9, 3.6, 2, 2], [cx - 2, 58, cz + 0.4, 2.7, 4.4, 2.4, 2.4], [cx + 7, 96, cz + 1, 0.9, 2.6, 1.8, 2], [cx - 6, 36, cz - 3, 1, 4, 2.4, 3], [cx + 5, 35.5, cz - 4, 2.2, 3.4, 2, 3]]); }

      // ---------- Z5, le temple-grotte (O-14) : une façade taillée dans la falaise autour de chaque portail, braseros allumés ----------
      for (const [i, rv, H] of [[t0, 0, 9], [t1, Math.PI, 8]]) { const r = repere(h, S[i]); r.rotation.y += rv; h.pose('facadeTemple', CITE, r, [0, -0.3, 0.6], S[i].w, H);
        { const rr = [], w = S[i].w, V = new THREE.Vector3(); r.updateMatrixWorld(); const pose = (x, y, z, t) => { V.set(x, y, z).applyMatrix4(r.matrixWorld); rr.push([V.x, V.y, V.z, rnd() * 6, t * 1.3, t, t * 1.2]); };
          for (const sd of [-1, 1]) for (let k = 0; k < 16; k++) { const u = rnd(), d = w + 5 + u * 34; pose(sd * d, rnd() * rnd() * (40 - u * 22), 1 + rnd() * 5 + (1 - u) * 3, 6 + rnd() * 6); }
          for (let k = 0; k < 9; k++) pose((rnd() - 0.5) * 2 * (w + 5), H + 5 + rnd() * 22, 0.5 + rnd() * 2.5, 5 + rnd() * 5);
          inst(h, h.geo('rocher'), mat('rocheMousse'), rr); }
        for (const sd of [-1, 1]) { const b = new THREE.Group(); b.position.set(sd * (S[i].w + 2.2), 0, 5); b.scale.setScalar(1.7); r.add(b); h.pose('torche', { bois: fer, fer, flamme }, b, [0, 0, 0]); }
        r.updateMatrixWorld(); for (const sd of [-1, 1]) { const q = r.localToWorld(new THREE.Vector3(sd * (S[i].w + 2.2), 5, 5)); h.lum(i, q.x, q.y, q.z, 0xffa040, 22, 2.2); } }

      // ---------- Z6, la descente des idoles (O-15, T-6) : des statues debout de plus en plus rapprochées jusqu'à l'arc ; la grande idole assise dans l'axe de l'équerre ----------
      { const st = []; let sd = 1; for (const d of [22, 42, 62, 84, 124, 164, 244, 324, 404, 484, 564]) { const i = P(52) - (d >> 1), s = S[i], [x, z] = bord(s, sd, s.w + 1.6); if (libre(x, z)) st.push([x, s.y - 0.4, z, Math.atan2(s.x - x, s.z - z), 1.5 + (d < 100 ? 0.3 : 0)]); sd = -sd; }
        const yB = g.hAt(BASSIN[0], BASSIN[1]) + 1.5; for (const [dx, dz, a, t] of [[-17, 0, 0.5, 2.6], [-9, -15, 0.3, 1.5], [-9, 15, 0.7, 1.5]]) st.push([BASSIN[0] + dx, g.hAt(BASSIN[0] + dx, BASSIN[1] + dz) - 0.3, BASSIN[1] + dz, Math.PI * a, t]); // les gardiens du bassin
        { const rr = []; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283 + rnd() * 0.3, t = 1.4 + rnd() * 1.6; rr.push([BASSIN[0] + 13.5 * Math.cos(a), g.hAt(BASSIN[0] + 13.5 * Math.cos(a), BASSIN[1] + 13.5 * Math.sin(a)) + 0.2, BASSIN[1] + 13.5 * Math.sin(a), rnd() * 6, t * 1.3, t, t * 1.2]); } inst(h, h.geo('rocher'), mat('rocheMousse'), rr);
          h.pose('boite', coule(h.mat('eauJade', { ...DS, transparent: true, opacity: 0.86, gloss: 0.5 }), 0.015, 0.03), h.scene, [BASSIN[0], yB, BASSIN[1]], 30, 0.1, 30).userData.dyn = 1; }
        insts(h, 'statueDebout', CITE, st);
        pose('idoleAssise', CITE, 508, 410, Math.PI / 2).scale.setScalar(1.6); for (const dz of [-6, 6]) { const p = pose('torche', { bois: fer, fer, flamme }, 518, 410 + dz); p.scale.setScalar(1.6); h.lum(P(43), 518, g.hAt(518, 410) + 4.5, 410 + dz, 0xffa040, 20, 2); } }

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
        const st = pose('statueDebout', CITE, -12, 306, -2.2, 12.2, 2.2); st.rotation.z = 0.16; }
      inst(h, h.geo('tronc'), ecorce, futs); cimes.forEach((l, k) => inst(h, h.geo('cime'), feuilles[k], l)); // tous les arbres, ceux de la cité et le houppier du fromager compris
      insts(h, 'torche', { bois, fer, flamme }, torches);
      // ---------- Z5, dedans : des côtes de roche le long des parois de la grotte, pour qu'elle ne soit pas un couloir ----------
      { const cotes = []; for (let i = t0 + 6, k = 0; i < t1 - 4; i += 5, k++) { const s = S[i], sd = k & 1 ? 1 : -1, [x, z] = bord(s, sd, s.w + 1.2); cotes.push([x, s.y + 2.6 + rnd() * 2, z, rnd() * 6, 1.3 + rnd() * 0.6, 4 + rnd() * 3, 1.3 + rnd() * 0.6]); } // elles dépassent la paroi de moins de 0,8 m
        inst(h, h.geo('rocher'), mat('rocheMousse', { c: 0x8a8478 }), cotes); }
      // ---------- le saut de la descente (C-6) : les degrés écroulés d'un escalier de la cité, de part et d'autre du tremplin ----------
      { const deg = []; for (let k = 0; k < 7; k++) for (const sd of [-1, 1]) { const s = S[P(49) - 18 + k * 3], [x, z] = bord(s, sd, s.w + 2.2); deg.push([x, s.y - 0.6 + k * 0.12, z, h.across(s) + (rnd() - 0.5) * 0.3, 2.6, 1.2 + k * 0.25, 5.2]); }
        inst(h, h.geo('bloc'), pierre, deg); for (const sd of [-1, 1]) auBord('obelisque', CITE, P(49) + 2, sd, S[P(49)].w + 2.4, 8); }
      for (const [m, b] of NAP) { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(b.P, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(b.U, 2)); ge.setIndex(b.I); ge.computeVertexNormals();
        const o = new THREE.Mesh(ge, m); o.userData.dyn = 1; o.frustumCulled = false; o.renderOrder = m === e1 ? 1 : m === e2 ? 2 : 3; h.scene.add(o); } // la nappe de derrière d'abord, puis celle de devant, puis voiles et écume
      let tv = 0; return dt => { tv += dt; if (VAP) VAP(Math.min(dt, 0.1)); for (const [t, u, v] of COULE) { t.offset.x = (t.offset.x + u * dt) % 1; t.offset.y = (t.offset.y + v * dt) % 1; } }; // l'eau coule : seules des textures glissent
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
