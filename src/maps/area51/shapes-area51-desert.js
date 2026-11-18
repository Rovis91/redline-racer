// Shapes specific to "area51", family "high desert and what hides in it": completes the shapes.js catalogue. Metres, origin on the ground, Y up.
// Nevada basin, not Sahara: sagebrush and creosote clumps, Joshua trees, broken rock, an old gunnery hulk and its targets. Plants and rocks are simple shapes (one material), the rest assemblies.
// Also here: the runway light fittings and the grey visitor (alienArea51), an easter egg the scenery places where the race camera catches it for a second.
(function () {
  const pair = f => [-1, 1].map(f), noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  // a faceted solid of revolution like ringsArea51, but with UVs in tiles of `tile` m measured on the surface: a 1 m bush gets its share of pixels (ringsArea51 counts in whole 8 m tiles, right for hills)
  const clump = (n, rings, jit, seed, tile) => { const P = [], UV = [], pt = (r, k) => { const [y, rx, rz] = rings[r], a = (k % n) / n * 6.2832, j = 1 + jit * (noise(k % n, seed + r * 7) - 0.5) * 2; return [Math.cos(a) * rx * j, y * (r ? 1 + jit * (noise(k % n, seed + r + 40) - 0.5) : 1), Math.sin(a) * rz * j, k / n * 6.2832 * rings[1][1] / tile, y / tile]; };
    const tri = (a, b, c) => { for (const p of [a, b, c]) { P.push(p[0], p[1], p[2]); UV.push(p[3], p[4]); } };
    for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < n; k++) { const a = pt(r, k), b = pt(r + 1, k), c = pt(r + 1, k + 1), d = pt(r, k + 1); tri(a, b, c); tri(a, c, d); }
    const top = rings.length - 1, y = rings[top][0]; for (let k = 0; k < n; k++) { const a = pt(top, k), b = pt(top, k + 1); tri([0, y * 1.08, 0, 0, y / tile + 0.2], b, a); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); return g; };
  Object.assign(SHAPES, {
    // sagebrush: a low rounded clump wider than high, r = its radius (0.6 to 1.6 m)
    armoiseArea51: (r = 1, seed = 0) => clump(6, [[-0.3, r * 0.55, r * 0.55], [r * 0.5, r, r], [r * 0.95, r * 0.6, r * 0.6]], 0.3, seed, 4),
    // creosote bush: taller than wide, open at the top like a vase, r = its radius
    creosoteArea51: (r = 1, seed = 0) => clump(5, [[-0.3, r * 0.25, r * 0.25], [r * 1.3, r, r], [r * 1.9, r * 0.7, r * 0.7]], 0.35, seed, 4),
    // a broken rock, r = its radius (0.5 to 5 m): low and angular, half sunk
    caillouArea51: (r = 1, seed = 0) => clump(6, [[-0.4 * r, r * 1.1, r * 0.9], [r * 0.45, r * 0.9, r * 0.7], [r * 0.8, r * 0.45, r * 0.4]], 0.4, seed, 8),
    // Joshua tree, 5 to 7 m, v = which of three: a shaggy trunk, bent arms, a spiky tuft (two crossed cubes on a corner) at each tip
    joshuaArea51: (v = 0) => { const arms = [[[0.9, 0.8], [-0.8, -0.4], [0.2, -0.9]], [[1, -0.3], [-0.9, 0.5]], [[0.6, 0.9], [-0.7, 0.7], [0.9, -0.6], [-0.5, -0.9]]][v % 3], ht = 3.2 + v % 3 * 0.5;
      const tuft = (x, y, z) => [['yucca', 1.1, 1.1, 1.1, x, y, z, [0.62, 0.3, 0.62]], ['yucca', 1, 1, 1, x, y + 0.1, z, [0.2, 1.1, 0.9]]];
      return [['bark', 0.55, ht, 0.55, 0, ht / 2 - 0.2, 0], ...arms.flatMap(([dx, dz], i) => { const L = 1.9 + i * 0.3, lean = 0.75, px = dx * Math.sin(lean) * L / 2, pz = dz * Math.sin(lean) * L / 2, py = ht - 0.5 + Math.cos(lean) * L / 2 - i * 0.5;
        return [['bark', 0.4, L, 0.4, px, py, pz, [dz * lean, 0, -dx * lean]], ...tuft(px * 2, py + Math.cos(lean) * L / 2 + 0.3, pz * 2)]; }), ...tuft(0, ht + 0.3, 0)]; },
    // old gunnery hulk: a rusted fuselage section lying nose down, one wing stub, the fin, plates scattered round it; shot through (dark holes)
    epaveArea51: () => [...[0, 0.7854, 1.5708, 2.3562].map(a => ['rust', 2.6, 1.08, 13, 0, 1.5, 0, [0.09, 0, a]]), ['rust', 9, 0.3, 3.4, 4.6, 1.3, -1, [0, 0.3, -0.16]], ['rust', 0.25, 3.6, 2.6, 0, 3.4, -5.4, [-0.5, 0, 0.1]],
      ['dark', 1.5, 1.5, 0.3, 0, 0.9, 6.6, [0.09, 0, 0.7854]], ...[[1.36, 1.9, 2], [-1.36, 1.6, -1], [1.3, 1.2, -3.4]].map(([x, y, z]) => ['dark', 0.1, 0.5, 0.7, x, y, z]), ['rust', 2.2, 0.12, 1.4, -4, 0.1, 3, [0.1, 0.8, 0]], ['rust', 1.2, 0.12, 2, -3, 0.1, -4.4, [0, 0.3, 0.2]]],
    // range target: a plywood panel 4 × 3 m on two legs, white with a red square, leaning back
    cibleArea51: () => [...pair(sd => ['bark', 0.15, 3.4, 0.15, 0.4, 1.6, sd * 1.5, [0, 0, 0.2]]), ['paintW', 0.12, 3, 4, 0, 2.4, 0, [0, 0, 0.2]], ['red', 0.14, 1.2, 1.4, -0.03, 2.4, 0, [0, 0, 0.2]]],
    // runway or taxiway edge light: a frangible stem and its lens (zone `feu`: the scenery gives it the colour that emits). Three times life size, so it still exists at 270 lines
    feuPisteArea51: () => [['steel', 0.2, 1.2, 0.2, 0, 0.6, 0], ['dark', 1, 0.15, 1, 0, 1.2, 0], ['feu', 0.9, 0.7, 0.9, 0, 1.62, 0]],
    // inset light, flush with the pavement (runway centreline)
    feuAxeArea51: () => [['feu', 1.4, 0.07, 0.6, 0, 0.035, 0]],
    // precision approach path indicator: four lamp boxes in a row along Z, the two nearer the runway red, the two outer white ("on the glide path")
    papiArea51: () => [0, 1, 2, 3].flatMap(i => [['steel', 0.2, 0.7, 0.2, 0, 0.35, i * 4 - 6], ['dark', 1.4, 0.9, 1.6, 0, 1.1, i * 4 - 6], [i < 2 ? 'fire' : 'neon', 0.2, 0.6, 1.2, -0.72, 1.1, i * 4 - 6]]),
    // the grey visitor, 1.5 m × s, facing -X (toward the road): thin legs and arms, a narrow chest, a head too big for it, two black slanted eyes. Zones `alien` (skin) and `oeil`. wave: one arm raised
    alienArea51: (s = 1, wave = 0) => [...pair(sd => [['alien', 0.13, 0.62, 0.13, 0, 0.31, sd * 0.11], ['alien', 0.1, 0.62, 0.1, 0, 0.86 + (wave && sd > 0 ? 0.42 : 0), sd * (0.25 + (wave && sd > 0 ? 0.12 : 0)), [sd * (wave && sd > 0 ? 2.5 : 0.12), 0, 0]],
      ['oeil', 0.06, 0.24, 0.17, -0.29, 1.4, sd * 0.14, [sd * 0.5, 0, 0]]]).flat(), ['alien', 0.2, 0.5, 0.3, 0, 0.84, 0], ['alien', 0.1, 0.12, 0.1, 0, 1.13, 0], ['alien', 0.56, 0.42, 0.6, 0, 1.44, 0], ['alien', 0.4, 0.18, 0.4, 0, 1.18, 0, [0, 0.7854, 0]]]
      .map(([z, w, h, d, x, y, zz, r]) => [z, w * s, h * s, d * s, x * s, y * s, zz * s, r]),
  });
})();
