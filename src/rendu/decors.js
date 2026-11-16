// Placement des décors des cartes. Chaque décor est une fonction DECORS[id](h) appelée une fois au chargement, rangée dans decors-<carte>.js ; ici, les poseurs que les cartes partagent.
// Ces fichiers ne disent que OÙ poser QUOI avec QUELLE texture : les formes sont dans formes.js, les textures dans textures.js.
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
  // échantillon de piste le plus proche, par cases de 50 m : chaque case garde, à sa première question, les seuls échantillons qui peuvent être le plus proche d'un de ses points
  // (à moins de la distance minimale au centre + deux demi-diagonales), dans l'ordre : même résultat que le parcours de toute la piste, égalités comprises (le plus petit indice)
  const CEL = 50, DG = CEL * Math.SQRT1_2, CASES = new WeakMap();
  const near = (h, x, z) => { const S = h.S, C = CASES.get(S) || CASES.set(S, new Map()).get(S), cx = Math.floor(x / CEL), cz = Math.floor(z / CEL), k = cx * 65536 + cz; let L = C.get(k);
    if (!L) { const mx = (cx + 0.5) * CEL, mz = (cz + 0.5) * CEL, D = S.map(s => Math.hypot(s.x - mx, s.z - mz)); let m = Infinity; for (const d of D) if (d < m) m = d; L = []; D.forEach((d, i) => { if (d <= m + 2 * DG + 1e-6) L.push(i); }); C.set(k, L); }
    let b = 0, bd = 1e18; for (const i of L) { const s = S[i], d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
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
    // couches (o.couches, sinon th.couches ; docs/specs/MOTEUR-OPTIONS-CARTES.md) : jusqu'à 4 textures par-dessus o.mat, chacune avec son poids par sommet (pente, distance à la route, altitude) ; même passe de dessin
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

  window.DECORS = {}; // chaque decors-<carte>.js y ajoute sa fonction, par Object.assign
  window.POSEURS = { inst, near, pt, indexe, insts, LUM, boite, bord, repere, soude, terrain }; // les poseurs partagés, pour les fichiers de carte
})();
