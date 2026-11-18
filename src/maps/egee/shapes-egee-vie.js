// Shapes specific to "egee", family "island life": what makes the island inhabited, in the fields, on the town pavement and on the quay. Completes the shapes.js catalogue. Metres, origin at the foot, Y up.
// Frame of every piece: +X is its front (the side turned to the road), Z runs along the road. Zones are the materials of MAT in scenery-egee.js (coque and poil are picked by the placement).
// See docs/proposals/aegean-cliffs/AMBIANCE-V2.html ("an island that is lived in"). Edge details, read between 0 and 15 m: few boxes, bold colours. Not street furniture of a big city, not a resort.
(function () {
  // several faceted geometries (position, uv) in one: the dry plants are placed in number, one geometry each
  const join = gs => { const g = new THREE.BufferGeometry(); for (const n of ['position', 'uv']) { const A = new Float32Array(gs.reduce((s, q) => s + q.attributes[n].array.length, 0)); let b = 0;
      for (const q of gs) { A.set(q.attributes[n].array, b); b += q.attributes[n].array.length; } g.setAttribute(n, new THREE.BufferAttribute(A, n === 'uv' ? 2 : 3)); } g.computeVertexNormals(); return g; };
  const at = (g, x, y, z, rx = 0, ry = 0, rz = 0) => { g.rotateZ(rz); g.rotateX(rx); g.rotateY(ry); g.translate(x, y, z); return g; };
  Object.assign(SHAPES, {
    // dovecote (Tinos), 5 × 5 m, 8 m: a lime tower, the upper storey pierced with two triangles of pigeon holes on the front, a finial on each corner, a low blue door
    pigeonnierEgee: () => [['ocre', 5, 6, 5, 0, -3, 0], ['blanc', 5, 6.6, 5, 0, 3.3, 0, null, 1], ['blanc', 5.4, 0.3, 5.4, 0, 6.75, 0], ['bleu', 0.2, 1.8, 1, 2.52, 0.9, 0], ['pierre', 0.15, 0.25, 4.4, 2.52, 3.6, 0],
      ...[-1, 1].flatMap(k => [0, 1, 2].flatMap(r => Array.from({ length: 3 - r }, (_, c) => ['tronc', 0.15, 0.36, 0.36, 2.52, 4.3 + r * 0.6, k * 1.15 + (c - (2 - r) / 2) * 0.6]))),
      ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => ['blanc', 0.55, 1.2, 0.55, a * 2.3, 7.5, b * 2.3])],
    // well: a round-looking stone curb under a lime rim, two posts, the windlass and its bucket
    puitsEgee: () => [['pierre', 1.9, 3, 1.9, 0, -0.5, 0], ['blanc', 2.15, 0.16, 2.15, 0, 1.08, 0], ['tronc', 0.16, 1.7, 0.16, 0, 1.9, -0.85], ['tronc', 0.16, 1.7, 0.16, 0, 1.9, 0.85], ['tronc', 0.2, 0.2, 2.1, 0, 2.7, 0], ['boisB', 0.42, 0.42, 0.42, 0.75, 1.37, 0.5]],
    // rain cistern, 4 × 7 m: a low lime vault in three steps, a blue hatch, the stone trough at its end
    citerneEgee: () => [['blanc', 4, 3.2, 7, 0, -0.4, 0, null, 1], ['blanc', 3, 0.7, 7, 0, 1.5, 0], ['blanc', 1.7, 0.45, 7, 0, 2.05, 0], ['bleu', 0.9, 0.1, 0.9, 0, 2.32, 2], ['pierre', 1.2, 2.6, 2.6, 1.2, -0.6, 4.9]],
    // goat pen, w × d: a dry-stone wall chest-high with a gap on the front, a lean-to with a lime roof in the back corner
    enclosEgee: (w = 10, d = 12) => [['pierre', 0.7, 4.2, d, -w / 2, -0.8, 0], ['pierre', w, 4.2, 0.7, 0, -0.8, -d / 2], ['pierre', w, 4.2, 0.7, 0, -0.8, d / 2], ['pierre', 0.7, 4.2, d * 0.5, w / 2, -0.8, -d * 0.25], ['pierre', 0.7, 4.2, d * 0.22, w / 2, -0.8, d * 0.39],
      ['pierre', 3.4, 4.8, 4, -w / 2 + 2, -0.3, -d / 2 + 2.3], ['blanc', 3.9, 0.25, 4.5, -w / 2 + 2, 2.2, -d / 2 + 2.3]],
    // goat, 1.2 m, head to +X (zone poil: white, brown or stone grey)
    chevreEgee: () => [['poil', 1.1, 0.5, 0.42, 0, 0.72, 0], ['poil', 0.34, 0.36, 0.3, 0.68, 1.02, 0], ['tronc', 0.1, 0.22, 0.34, 0.66, 1.3, 0], ...[[-0.4, -0.13], [-0.4, 0.13], [0.4, -0.13], [0.4, 0.13]].map(([x, z]) => ['poil', 0.11, 0.5, 0.11, x, 0.25, z])],
    // power pole, 9 m: a tarred trunk, a crossbar with two white insulators. tr = 1: a grey transformer box under the crossbar
    poteauEgee: (tr = 0) => [['tronc', 0.3, 12, 0.3, 0, 3, 0], ['tronc', 0.16, 0.16, 2.2, 0, 8.5, 0], ['blanc', 0.16, 0.24, 0.16, 0, 8.7, -0.95], ['blanc', 0.16, 0.24, 0.16, 0, 8.7, 0.95], ...(tr ? [['noir', 0.8, 1.1, 0.7, 0.45, 7.2, 0]] : [])],
    // substation of the island, a walled yard 10 × 14 m, gate on the front: a lime switch house with a blue door, two transformers (fins, three insulators, conservator) on plinths, and the steel gantry the lines leave from, 8.6 m, at x = 3
    posteEgee: () => [['ocre', 10, 4, 14, 0, -1.9, 0], ['blanc', 0.3, 2, 14, -5, 1, 0], ['blanc', 10, 2, 0.3, 0, 1, -7], ['blanc', 10, 2, 0.3, 0, 1, 7], ['blanc', 0.3, 2, 5.2, 5, 1, -4.4], ['blanc', 0.3, 2, 5.2, 5, 1, 4.4], ['noir', 0.12, 1.8, 3.6, 5, 0.9, 0], ['filet', 0.06, 0.55, 0.55, 5.18, 1.35, 3],
      ['blanc', 3.4, 3.2, 4, -2.8, 1.6, -4.4], ['blanc', 3.8, 0.25, 4.4, -2.8, 3.3, -4.4], ['bleu', 0.12, 2, 1, -1.08, 1, -4.4],
      ...[1.2, 4.6].flatMap(z => [['ocre', 2.4, 0.3, 2.6, -1.6, 0.25, z], ['noir', 1.7, 1.9, 2, -1.6, 1.35, z], ['noir', 0.5, 0.5, 1.5, -2.2, 2.55, z], ...[-0.6, 0, 0.6].flatMap(k => [['noir', 2.3, 1.3, 0.1, -1.6, 1.3, z + k], ['blanc', 0.18, 0.6, 0.18, -1.2, 2.6, z + k]]), ['noir', 4.2, 0.07, 0.07, 0.9, 2.9, z], ['noir', 0.07, 5.6, 0.07, 3, 5.7, z]]),
      ['noir', 0.3, 9, 0.3, 3, 4.5, -3.2], ['noir', 0.3, 9, 0.3, 3, 4.5, 6.2], ['noir', 0.3, 0.3, 9.8, 3, 8.6, 1.5], ...[-1.5, 1.2, 4.6].map(z => ['blanc', 0.18, 0.5, 0.18, 3, 8.95, z])],
    // scooter, 1.7 m, parked across the pavement, nose to +X (zone coque: its paint)
    scooterEgee: () => [['noir', 0.5, 0.5, 0.16, 0.62, 0.25, 0], ['noir', 0.5, 0.5, 0.16, -0.62, 0.25, 0], ['coque', 1.2, 0.34, 0.36, -0.05, 0.5, 0], ['coque', 0.14, 0.75, 0.42, 0.5, 0.8, 0], ['noir', 0.62, 0.14, 0.32, -0.3, 0.76, 0],
      ['noir', 0.1, 0.1, 0.66, 0.52, 1.2, 0], ['blanc', 0.1, 0.16, 0.2, 0.6, 1.02, 0]],
    // farm pick-up, 4.6 m, parked along the road, nose to +Z (zone coque): cab, open bed with two crates
    pickupEgee: () => [['noir', 1.95, 0.72, 0.72, 0, 0.36, 1.45], ['noir', 1.95, 0.72, 0.72, 0, 0.36, -1.45], ['coque', 1.8, 0.62, 4.6, 0, 0.82, 0, null, 1], ['coque', 1.72, 0.72, 1.5, 0, 1.49, 0.55], ['verre', 1.76, 0.44, 1.2, 0, 1.52, 0.55], ['verre', 1.5, 0.44, 1.54, 0, 1.52, 0.55],
      ['coque', 0.1, 0.36, 2, 0.85, 1.31, -1.25], ['coque', 0.1, 0.36, 2, -0.85, 1.31, -1.25], ['coque', 1.8, 0.36, 0.1, 0, 1.31, -2.25], ['bois', 0.8, 0.5, 0.8, 0.3, 1.38, -0.9], ['boisB', 0.7, 0.45, 0.7, -0.35, 1.36, -1.7]],
    // fishing gear on the quay: a drying rack with a yellow net, a heap of net at its foot, buoys, two lobster pots, a pair of oars against the rack
    agresEgee: () => [['tronc', 0.14, 2.3, 0.14, 0, 1.15, -2.1], ['tronc', 0.14, 2.3, 0.14, 0, 1.15, 2.1], ['tronc', 0.12, 0.12, 4.5, 0, 2.3, 0], ['filet', 0.08, 1.6, 4, 0, 1.45, 0], ['filet', 1.4, 0.45, 1.8, 1, 0.22, -0.8],
      ['corail', 0.5, 0.5, 0.5, 1.2, 0.3, 1.1, [0.6, 0.6, 0]], ['blanc', 0.45, 0.45, 0.45, 1.7, 0.28, 1.6, [0.3, 0.8, 0]], ['corail', 0.45, 0.45, 0.45, 0.9, 0.28, 1.9, [0, 0.5, 0.6]],
      ['bois', 0.9, 0.5, 0.6, -1.1, 0.25, 1.2], ['bois', 0.9, 0.5, 0.6, -1.1, 0.75, 1.3], ['boisB', 0.1, 3, 0.16, 0.25, 1.4, -1.5, [0, 0, 0.16]], ['boisB', 0.1, 3, 0.16, 0.25, 1.4, -1.2, [0, 0, 0.16]]],
    // dinghy turned over on the quay for the winter paint, 3.6 m (zone coque)
    barqueEgee: () => [['coque', 1.5, 0.45, 3.6, 0, 0.23, 0], ['coque', 1.05, 0.3, 3, 0, 0.6, 0], ['blanc', 0.12, 0.12, 3.2, 0, 0.8, 0], ['bois', 0.3, 0.2, 0.3, 0, 0.1, 2]],
    // café terrace on the pavement, n tables in a row along the road: white tables, blue chairs; v = 0 a striped parasol over each table, 1 one long striped awning on posts
    terrasseEgee: (n = 3, v = 0) => [...Array.from({ length: n }, (_, i) => { const z = (i - (n - 1) / 2) * 3; return [['blanc', 0.95, 0.08, 0.95, 0, 0.76, z], ['blanc', 0.14, 0.76, 0.14, 0, 0.38, z],
        ...[-1, 1].flatMap(k => [['bleu', 0.46, 0.46, 0.46, 0, 0.23, z + k * 0.95], ['bleu', 0.46, 0.5, 0.08, 0, 0.7, z + k * 1.15]]),
        ...(v ? [] : [['bois', 0.09, 2.5, 0.09, 0.55, 1.25, z], ['toile', 2.3, 0.1, 2.3, 0.3, 2.5, z, [0, 0, -0.1]]])]; }).flat(),
      ...(v ? [['toile', 3.4, 0.1, n * 3 + 0.6, 0, 2.75, 0, [0, 0, -0.12]], ...[-1, 1].flatMap(k => [['bois', 0.1, 2.95, 0.1, 1.55, 1.47, k * n * 1.5], ['bois', 0.1, 2.6, 0.1, -1.55, 1.3, k * n * 1.5]])] : [])],
    // prickly pear (simple shape, placed in number), about 2.4 m: seven flat paddles growing out of each other
    nopalEgee: () => { const pad = (s = 1) => SHAPES.ringsEgee(6, [[0, 0.22 * s, 0.07], [0.5 * s, 0.46 * s, 0.09], [0.95 * s, 0.3 * s, 0.07], [1.05 * s, 0.05, 0.03]], true);
      return join([at(pad(1.1), 0, -0.1, 0), at(pad(), 0.25, 0.75, 0, 0, 0.3, -0.5), at(pad(0.9), -0.3, 0.7, 0.1, 0, -0.5, 0.55), at(pad(0.8), 0.75, 1.3, 0.05, 0, 0.9, -0.3), at(pad(0.8), -0.8, 1.25, 0, 0, 0.2, 0.75),
        at(pad(1), 0.7, -0.1, 0.5, 0, 1.2, -0.25), at(pad(0.85), -0.6, -0.1, -0.6, 0, 2.2, 0.3)]); },
    // agave (simple shape, placed in number): a rosette of ten thick blades 1.6 m long and the dry flower stalk, 5 m, with its tiers
    agaveEgee: () => { const blade = () => SHAPES.ringsEgee(4, [[0, 0.24, 0.1], [0.9, 0.16, 0.07], [1.6, 0.02, 0.02]]), tier = r => SHAPES.ringsEgee(5, [[0, r, r], [0.12, r, r]], true);
      return join([...Array.from({ length: 10 }, (_, i) => at(blade(), 0, 0, 0, 0, i * 0.63, i & 1 ? 0.5 : 1.0)), SHAPES.ringsEgee(4, [[0, 0.11, 0.11], [5, 0.04, 0.04]]), ...[0, 1, 2, 3].map(i => at(tier(0.7 - i * 0.14), 0, 3.3 + i * 0.5, 0))]); },
    // loose stone of the scree (simple shape, placed in number), about 1 m
    caillouEgee: () => SHAPES.ringsEgee(5, [[-0.5, 0.6, 0.5], [0.25, 0.5, 0.42], [0.6, 0.2, 0.18]], true, 0.3, 5),
  });
})();
