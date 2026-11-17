// Shapes specific to "piliers", family "road works and small buildings": completes the shapes.js catalogue. Metres, origin on the ground, Y up. Assemblies (lists of boxes [zone, w, h, d, x, y of the centre, z, rotation]) except the pavilion roof;
// zones are names of the map's shared materials (MAT in scenery-piliers.js): stone, rock, wood, tile, water, dark. Roadside pieces: X away from the road, Z along it.
// See docs/proposals/sky-pillars/AMBIANCE-V2.html, "Road works" and zone 4: small against the rock, grey-cream dressed stone; one small red-brown pavilion. Not a pagoda, not a temple.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // tunnel portal in the road frame (origin on the axis, at mid-depth; +Z looks out of the tunnel): an opening w × ht between two jambs t wide, a lintel, a coping that overhangs, two buttresses; d deep.
    // Behind it, set back in the mountain, a panel of rock closes the opening cut in the tower above and beside the stone
    portailPiliers: (w = 19, ht = 9, t = 6, d = 4) => [...pair(sd => [['stone', t, ht + 2, d, sd * (w + t) / 2, ht / 2 - 1, 0], ['stone', 2.4, ht * 0.7, d + 2, sd * (w / 2 + t - 1.2), ht * 0.35 - 1, 0]]).flat(),
      ['stone', w + 2 * t, 3.4, d, 0, ht + 1.7, 0], ['stone', w + 2 * t + 1.6, 0.9, d + 1.2, 0, ht + 3.8, 0], ['stone', 3, 1.6, d + 0.6, 0, ht + 0.6, 0], ['rock', w + 2 * t + 18, 23 - ht, 3, 0, (29 + ht) / 2, -2], ...pair(sd => ['rock', 11, ht + 4, 3, sd * (w / 2 + t + 3.5), ht / 2 + 1, -2])], // the keystone, then the rock panel: above the stone and on each side of it
    // an old stone marker: a stele 3 m high on a plinth
    bornePiliers: () => [['stone', 1.6, 0.6, 1.6, 0, 0.3, 0], ['stone', 1, 2.4, 0.6, 0, 1.8, 0], ['stone', 1.3, 0.35, 0.9, 0, 3.15, 0]],
    // culvert headwall, w wide, facing the road (the opening looks toward -X): a stone wall with a dark mouth and two short wing walls
    busePiliers: (w = 7, ht = 3.4) => [['stone', 1.2, ht, w, 0, ht / 2 - 0.4, 0], ['dark', 0.5, 1.9, 2.4, -0.45, 0.95, 0], ['stone', 0.6, 0.5, 3.2, -0.5, 2.1, 0], ...pair(sd => ['stone', 2.6, ht * 0.6, 0.8, -1.2, ht * 0.3 - 0.4, sd * w / 2, [0, sd * 0.35, 0]])],
    // viewing platform w × d, 1 m above the ground, a parapet on the three sides away from the road
    belvederePiliers: (w = 24, d = 24) => [['stone', w, 3, d, 0, -0.5, 0], ['stone', 0.6, 1, d, w / 2 - 0.3, 1.5, 0], ...pair(sd => ['stone', w, 1, 0.6, 0, 1.5, sd * (d / 2 - 0.3)]), ['stone', 3, 0.6, 6, -w / 2 - 1.5, 0.3, 0], ['stone', 1.5, 0.3, 6, -w / 2 - 3.6, 0.15, 0]],
    // the pavilion without its roof, 8 m square: a stone base, four red-brown columns, a ring of beams, a low balustrade on three sides
    pavillonPiliers: (w = 8) => { const c = w / 2 - 1.1; return [['stone', w, 1.2, w, 0, 0.2, 0], ...pair(a => pair(b => ['wood', 0.55, 3.8, 0.55, a * c, 2.7, b * c])).flat(),
      ...pair(sd => [['wood', 2 * c + 1.2, 0.5, 0.45, 0, 4.4, sd * c], ['wood', 0.45, 0.5, 2 * c + 1.2, sd * c, 4.4, 0], ['wood', 2 * c, 0.9, 0.2, 0, 1.25, sd * c]]).flat(), ['wood', 0.2, 0.9, 2 * c, c, 1.25, 0]]; },
    // its roof (a simple shape, tiles): a four-sided concave pyramid w wide whose corners turn up, a finial; origin at the level of the eaves
    toitPiliers: (w = 11, ht = 3.6) => { const Tr = [], e = w / 2, m = w * 0.24, ring = (r, yc, ye) => [[r, yc, r], [0, ye, r * 0.94], [-r, yc, r], [-r * 0.94, ye, 0], [-r, yc, -r], [0, ye, -r * 0.94], [r, yc, -r], [r * 0.94, ye, 0]];
      const A = ring(e, 1.1, 0), B = ring(m, ht * 0.42, ht * 0.42), top = [0, ht, 0], uv = p => [p[0], p[1], p[2], (p[0] + p[2]) / 2, p[1] / 2 + Math.hypot(p[0], p[2]) / 2];
      for (let k = 0; k < 8; k++) { const a = A[k], b = A[(k + 1) % 8], c = B[(k + 1) % 8], d = B[k]; Tr.push(a, b, c, a, c, d, d, c, top); }
      const P = [], UV = []; for (const p of Tr.map(uv)) { P.push(p[0], p[1], p[2]); UV.push(p[3], p[4]); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); return g; },
    // the basin, w × d: a stone rim 0.8 m high and the water just under its edge
    bassinPiliers: (w = 16, d = 22) => [...pair(sd => [['stone', 1, 1.6, d, sd * (w / 2 - 0.5), 0, 0], ['stone', w, 1.6, 1, 0, 0, sd * (d / 2 - 0.5)]]).flat(), ['water', w - 2, 0.4, d - 2, 0, 0.35, 0]],
  });
})();
