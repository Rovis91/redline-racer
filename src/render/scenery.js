// Placement of the mapDefs scenery. Each scenery is a function SCENERY[id](h) called once at load time, stored in scenery-<map>.js; here, the placers that the maps share.
// These files only say WHERE to place WHAT with WHICH texture: the shapes are in shapes.js, the textures in textures.js.
// h = game.js tools: THREE, scene, T/S/N/W (track), M (map), ribbon, rnd, across, zone, time (traffic clock), and for the city tx, addMat, box, concrete, beams (beams that game.js turns toward the camera),
//   geo('forme', ...settings)                  = geometry of a simple shape, for inst()
//   mat('texture', options, ...settings)       = material; options: lum (self-lit), c (tint), retro, gloss, rep (repeat), and those of three
//   pose('forme', skin, parent, [x, y, z], ...settings) = places a shape; skin = a material, or { zone: material } for an assembly
//   clothe(geometry, material)                = sets the texture density on a box (done by pose and inst)
//   emis(i, x, y, z, colour, range, strength)    = declares a light fixture at track sample i
// It builds the scenery around the track and may return a function tick(dt, now) for what moves.
(function () {
  // Places a list of identical objects in a single draw pass. Element: [x, y, z, rotationY, scaleX, scaleY, scaleZ].
  function inst(h, geo, mat, list) {
    const m = new h.THREE.InstancedMesh(h.clothe(geo, mat), mat, Math.max(1, list.length)), d = new h.THREE.Object3D();
    list.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.rotation.set(0, p[3] || 0, 0); d.scale.set(p[4] || 1, p[5] || p[4] || 1, p[6] || p[4] || 1); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
    m.count = list.length; m.frustumCulled = false; m.castShadow = m.receiveShadow = h.TH.sun[1] > 0.6; h.scene.add(m); return m; // low sun (Paris, canal): the whole scenery casts a shadow; at night that would be wasted render time
  }
  // A balanced spatial tree finds each cell's nearby samples without rescanning the whole track.
  // The cell candidates stay in track order, preserving the exhaustive search's lowest-index tie break.
  const CELL_SIZE = 50, DG = CELL_SIZE * Math.SQRT1_2, CELLS = new WeakMap();
  const roadTree = (S, ids, axis = 'x') => {
    if (!ids.length) return null;
    ids.sort((a, b) => S[a][axis] - S[b][axis] || a - b); const m = ids.length >> 1, next = axis === 'x' ? 'z' : 'x';
    return { i: ids[m], axis, lo: roadTree(S, ids.slice(0, m), next), hi: roadTree(S, ids.slice(m + 1), next) };
  };
  const roadCandidates = (S, tree, x, z) => {
    let closest = 0, best = Infinity;
    const seek = node => {
      if (!node) return;
      const s = S[node.i], d = (s.x - x) ** 2 + (s.z - z) ** 2, delta = (node.axis === 'x' ? x - s.x : z - s.z);
      if (d < best) { best = d; closest = node.i; }
      seek(delta < 0 ? node.lo : node.hi); if (delta * delta <= best) seek(delta < 0 ? node.hi : node.lo);
    };
    seek(tree);
    const nearest = S[closest], radius = Math.hypot(nearest.x - x, nearest.z - z) + 2 * DG + 1e-6, list = [];
    const collect = node => {
      if (!node) return;
      const s = S[node.i], delta = node.axis === 'x' ? x - s.x : z - s.z;
      if (Math.hypot(s.x - x, s.z - z) <= radius) list.push(node.i);
      if (delta <= radius) collect(node.lo); if (delta >= -radius) collect(node.hi);
    };
    collect(tree); return list.sort((a, b) => a - b);
  };
  const near = (h, x, z) => { const S = h.S;
    let cache = CELLS.get(S); if (!cache) { cache = { tree: roadTree(S, S.map((_, i) => i)), cells: new Map() }; CELLS.set(S, cache); }
    const C = cache.cells, cx = Math.floor(x / CELL_SIZE), cz = Math.floor(z / CELL_SIZE), k = cx + ':' + cz; let L = C.get(k);
    if (!L) { L = roadCandidates(S, cache.tree, (cx + 0.5) * CELL_SIZE, (cz + 0.5) * CELL_SIZE); C.set(k, L); }
    let b = 0, bd = 1e18; for (const i of L) { const s = S[i], d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
  const pt = (h, i) => near(h, h.M.pts[i][0] * h.M.sc, h.M.pts[i][1] * h.M.sc); // nearest track sample to control point i
  // Index footprints once instead of scanning every placed object for each candidate plant. Bounds stay strict, as in the exhaustive check.
  const boxMask = (boxes, cell = 64) => {
    const cells = new Map(), key = (x, z) => Math.floor(x / cell) + ':' + Math.floor(z / cell);
    for (const b of boxes) for (let x = Math.floor(b[0] / cell); x <= Math.floor(b[1] / cell); x++) for (let z = Math.floor(b[2] / cell); z <= Math.floor(b[3] / cell); z++) {
      const k = x + ':' + z; if (!cells.has(k)) cells.set(k, []); cells.get(k).push(b);
    }
    return (x, z) => { const list = cells.get(key(x, z)); if (list) for (const b of list) if (x > b[0] && x < b[1] && z > b[2] && z < b[3]) return true; return false; };
  };
  const indexed = (h, g) => { const A = Object.entries(g.attributes), vu = new Map(), retain = [], idx = []; for (let i = 0; i < g.attributes.position.count; i++) { const k = A.map(([, a]) => Array.from(a.array.subarray(i * a.itemSize, (i + 1) * a.itemSize))).join(); let j = vu.get(k); if (j === undefined) { vu.set(k, j = retain.length); retain.push(i); } idx.push(j); } const G = new h.THREE.BufferGeometry(); for (const [n, a] of A) G.setAttribute(n, new h.THREE.Float32BufferAttribute(retain.flatMap(i => Array.from(a.array.subarray(i * a.itemSize, (i + 1) * a.itemSize))), a.itemSize)); G.setIndex(idx); G.userData = g.userData; return G; }; // the zones of an assembly arrive unindexed (36 vertices per box): same triangles, identical vertices shared (24 per box)
  // places an assembly in number: one draw pass per zone, whatever the number of copies. Element as for inst; o.a = settings of the shape; o.tintMat = the zone that takes the colour of each element (8th value: 0xrrggbb)
  const insts = (h, label, skin, list, o = {}) => Object.entries(h.zones(label, skin, ...(o.a || []))).map(([zn, g]) => {
    const m = inst(h, indexed(h, g), skin[zn], list); if (zn === o.tintMat && list.length) { list.forEach((p, i) => m.setColorAt(i, new h.THREE.Color(p[7]))); m.instanceColor.needsUpdate = true; } return m;
  });
  const GLOW = { emis: 1 }; // self-lit material by itself: shop window, sign, light
  const boxMesh = (h, m, w, ht, d, x, y, z) => h.pose('boxMesh', m, h.scene, [x, y, z], w, ht, d); // single piece with free dimensions
  // blockout (docs/methods/NEW-MAP.md, phase 2): a flat-colour box at the real size of what will replace it, base at y, local X across the road when ry = h.across(s),
  // its name on a board above it, facing the car that arrives. Returns the group: phase 3 fills this footprint.
  const block = (h, label, c, w, ht, d, x, y, z, ry = 0) => { const T = h.THREE, g = new T.Group(), lw = Math.max(10, label.length * 2.2); g.position.set(x, y, z); g.rotation.y = ry; h.scene.add(g);
    h.pose('boxMesh', h.mat('paint', { c }), g, [0, ht / 2, 0], w, ht, d);
    const b = new T.Mesh(new T.PlaneGeometry(lw, lw / 4), h.mat('written', { emis: 1, side: T.DoubleSide }, 256, 64, '#16202a', '#ffffff', label, 44)); b.position.y = ht + 2 + lw / 8; g.add(b); return g; };
  // a point at the road edge: sample s, side sd (-1 left, 1 right), at `off` metres from the axis
  const edgePt = (s, sd, off) => [s.x - s.tz * sd * off, s.z + s.tx * sd * off];
  // a group placed on the road at sample s: local X = across (positive to the right), local Z = toward the rear
  const marker = (h, s) => { const g = new h.THREE.Group(); g.position.set(s.x, s.y, s.z); g.rotation.y = h.across(s); h.scene.add(g); return g; };
  const weld = (h, grp, fmly, shade) => { const T = h.THREE, batches = new Map(); grp.updateMatrixWorld(true); const inv = new T.Matrix4().copy(grp.matrixWorld).invert(); grp.traverse(o => { if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) return; const f = fmly && fmly.test(o.material), k = [f ? 'fmly' : o.material.uuid, o.castShadow, o.receiveShadow, Object.keys(o.geometry.attributes).sort()].join(); (batches.get(k) || batches.set(k, []).get(k)).push(o); }); for (const l of batches.values()) { if (l.length < 2) continue; const tf = fmly && fmly.test(l[0].material), gs = l.map(o => { const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); if (tf) { const c = o.material.color, n = g.attributes.position.count, A = new Float32Array(n * 3); for (let i = 0; i < n; i++) A.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new T.BufferAttribute(A, 3)); } g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld)); if (o.matrixWorld.determinant() < 0) for (const a of Object.values(g.attributes)) for (let j = 0; j < a.count; j += 3) for (let c = 0; c < a.itemSize; c++) { const i0 = j * a.itemSize + c, i1 = i0 + a.itemSize, t = a.array[i0]; a.array[i0] = a.array[i1]; a.array[i1] = t; } return g; }), G = new T.BufferGeometry(); for (const n in gs[0].attributes) { const A = new Float32Array(gs.reduce((s, g) => s + g.attributes[n].array.length, 0)); let b = 0; for (const g of gs) { A.set(g.attributes[n].array, b); b += g.attributes[n].array.length; } G.setAttribute(n, new T.BufferAttribute(A, gs[0].attributes[n].itemSize)); } const m = new T.Mesh(G, tf ? fmly.mat || (fmly.mat = Object.assign(l[0].material.clone(), { vertexColors: true })).color.setRGB(1, 1, 1) && fmly.mat : l[0].material); m.castShadow = l[0].castShadow; m.receiveShadow = l[0].receiveShadow; grp.add(m); for (const o of l) o.parent.remove(o); }
    if (shade) grp.traverse(o => { const m = o.material; if (o.isMesh && m.isMeshLambertMaterial && !m.transparent && !m.alphaTest && !m.polygonOffset && !shade.includes(m)) { o.castShadow = true; m.shadowSide = THREE.DoubleSide; } }); }; // shade (day maps, a whole kit): its opaque lit meshes cast the sun shadow, but for the materials listed (far backdrops); self-lit, cut-out and decal materials never do. Both faces are drawn in the shadow: with back faces alone, the depth bias leaves a lit sliver at the foot of each object
  // weld: merges the parts of a moving group (dyn) into one geometry per material, in its frame: one pass per material instead of one per part (game.js's merge only takes the static ones)

  // Terrain: a height field that follows the road. Each vertex takes the altitude of the neighbouring road portions (weighted average by
  // the distance): the road ends up laid on a slope, stacked hairpins become terraces, a channel digs between two lanes.
  // o = { stepSec, margin, mat, isFar, waterfall (beyond `isFar` metres from the road, the ground drops by `waterfall` m per metre), hollow(x, z, y) = m to remove from the ground (y = its computed height),
  //       ground(s) = ground altitude under sample s when the road is not laid on it (viaduct, bridge),
  //       under = slope (touge only): caps each vertex under all the nearby road, then raises it by `under` m per metre; triangles no longer pass over a roadway lying lower (hairpins) }
  // Returns hAt(x, z) = ground altitude and dAt(x, z) = distance to the road, to place the scenery on it.
  function terrain(h, o) {
    const { THREE, S, W } = h, stepSec = o.stepSec, ground = o.ground || (s => s.y);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const s of S) { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z); }
    x0 -= o.margin; z0 -= o.margin; x1 += o.margin; z1 += o.margin;
    const nx = Math.ceil((x1 - x0) / stepSec) + 1, nz = Math.ceil((z1 - z0) / stepSec) + 1, Y = new Float32Array(nx * nz), D = new Float32Array(nx * nz), sub = S.filter((s, i) => i % 3 === 0).map(s => ({ x: s.x, z: s.z, w: s.w || W, g: ground(s), pose: ground(s) > s.y - 0.5 }));
    const R = stepSec * 1.42 + W + 1, RC = R + 48, cells = new Map(); // R: max distance between a vertex of a triangle touching the carriageway and the road sample at that point
    if (o.under) for (const s of S) { const c = Math.floor(s.x / RC) * 1e4 + Math.floor(s.z / RC); if (!cells.has(c)) cells.set(c, []); cells.get(c).push(s); } // the road stored in cells of RC metres
    const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), idx = [];
    for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
      const x = x0 + ix * stepSec, z = z0 + iz * stepSec, k = iz * nx + ix; let sw = 0, sy = 0, dm = 1e18, pm = null;
      for (const s of sub) { const d2 = (s.x - x) ** 2 + (s.z - z) ** 2, w = 1 / ((d2 + 100) * (d2 + 100)); sw += w; sy += w * s.g; if (d2 < dm) { dm = d2; pm = s; } }
      const d = Math.sqrt(dm); let y = sy / sw - 0.5;
      if (d < pm.w + 1 && pm.pose) y -= 1.5; // under the carriageway: we dig, the road and its low walls hide the join
      if (o.isFar && d > o.isFar) y -= (d - o.isFar) * o.waterfall;
      if (o.under && d < R) y = Math.max(y, pm.g - 1.7); // high enough that the foot of the low walls does not float
      if (o.under && d < RC) for (let cz = -1; cz <= 1; cz++) for (let cx = -1; cx <= 1; cx++) for (const s of cells.get((Math.floor(x / RC) + cx) * 1e4 + Math.floor(z / RC) + cz) || []) {
        const e = Math.hypot(s.x - x, s.z - z); if (e < RC) y = Math.min(y, s.y - 0.3 + Math.max(0, e - R) * o.under); // beyond RC the rise exceeds any height difference on the map
      }
      if (o.hollow) y -= o.hollow(x, z, y); // after the hairpin ceiling: a ravine (touge) can pass under the carriageway
      Y[k] = y; D[k] = d; pos.set([x, y, z], k * 3); uv.set(o.under ? [(x + y) / 10, (z + y) / 10] : [x / 10, z / 10], k * 2); // touge: the texture also follows the height, without stretching on steep walls
      if (ix < nx - 1 && iz < nz - 1) idx.push(k, k + nx, k + 1, k + 1, k + nx, k + nx + 1);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // layers (o.layerSet, otherwise th.layerSet; docs/methods/MAP-ENGINE-OPTIONS.md): up to 4 textures on top of o.mat, each with its weight per vertex (slope, distance to the road, altitude); same draw pass
    const layerSet = o.layerSet || h.TH.layerSet; let mt = o.mat;
    if (layerSet && mt.map) {
      const N = g.attributes.normal.array, C = new Float32Array(nx * nz * 4), ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      for (let k = 0; k < nx * nz; k++) {
        const p = 1 - N[k * 3 + 1], d = D[k], y = Y[k], x = pos[k * 3], z = pos[k * 3 + 2], hs = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453 % 1; // p: 0 flat, 1 vertical
        layerSet.slice(0, 4).forEach((c, i) => { C[k * 4 + i] = Math.max(0, Math.min(1, (c.slope ? ss(c.slope[0], c.slope[1], p) : 1) * (c.edgePt ? 1 - ss(c.edgePt[0], c.edgePt[1], d) : 1) * (c.high ? ss(c.high[0], c.high[1], y) : 1) * (c.low ? 1 - ss(c.low[0], c.low[1], y) : 1) * (c.weight ? c.weight(x, z, y, p, d) : 1) + (c.noise || 0) * hs)); });
      }
      g.setAttribute('layer', new THREE.BufferAttribute(C, 4)); mt = mt.clone(); mt.userData.layerSet = layerSet.slice(0, 4).map(c => ({ map: c.map || h.tx(...c.tex), rep: c.rep || 1 }));
    }
    const mesh = new THREE.Mesh(g, mt); mesh.receiveShadow = true; h.scene.add(mesh);
    const readBar = A => (x, z) => { // bilinear interpolation in the grid
      const fx = Math.max(0, Math.min(nx - 1.001, (x - x0) / stepSec)), fz = Math.max(0, Math.min(nz - 1.001, (z - z0) / stepSec)), ix = fx | 0, iz = fz | 0, a = fx - ix, b = fz - iz, k = iz * nx + ix;
      return (A[k] * (1 - a) + A[k + 1] * a) * (1 - b) + (A[k + nx] * (1 - a) + A[k + nx + 1] * a) * b;
    };
    return { hAt: readBar(Y), dAt: readBar(D), box: [x0, z0, x1, z1], mesh };
  }

  window.SCENERY = {}; // each scenery-<map>.js adds its function to it, via Object.assign
  window.PLACERS = { inst, near, pt, boxMask, indexed, insts, GLOW, boxMesh, block, edgePt, marker, weld, terrain }; // the shared placers, for the map files
})();
