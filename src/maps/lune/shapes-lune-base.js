// Shapes specific to "lune", family "colony": completes the shapes.js catalogue. Metres, origin on the ground, Y up. See docs/proposals/lunar-outpost/AMBIANCE-V2.html: a 1970s colony at human scale,
// domes, short cylinders, lattice masts, orange guidance marks; analogue, a little dusty, lit windows. Not a city, not chrome science fiction, no glass greenhouse.
// Assemblies are lists of boxes whose zones are the map's shared materials (MAT in scenery-lune.js): shell (ivory panels), hall (pale grey panels), dark, steel, lattice, amber (orange paint), glow (orange light),
// hublot (warm lit windows), ceil (cold lit panels), solar, glass, tire. A building has its front on -X (the placement turns it toward the road); what stands along the road has the road along Z.
(function () {
  const pair = f => [-1, 1].map(f), range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  Object.assign(SHAPES, {
    // ---------- simple shapes (one material) ----------
    // habitat dome: a faceted cap of radius r and height ht, 12 sides, 5 rings: the triangulated shell read from far
    coupoleLune: (r = 35, ht = 30) => SHAPES.ringsLune(12, [0, 0.38, 0.72, 1.05, 1.36].map(a => [ht * Math.sin(a) / Math.sin(1.36), r * Math.cos(a) / Math.cos(0) * (a ? 1 : 1)]), true),
    // pressurised cylinder lying on its cradles, L long along Z, radius r, 8 sides, its ends drawn in: the module, the tank, the tube between two buildings
    cylindreLune: (L = 26, r = 4.5) => { const g = SHAPES.ringsLune(8, [[-L / 2, r * 0.5], [-L / 2 + 1.4, r], [L / 2 - 1.4, r], [L / 2, r * 0.5]], true); g.rotateX(Math.PI / 2); g.translate(0, r + 1.2, 0); g.computeVertexNormals(); return g; },
    // standing tank, radius r, height ht: a cylinder with a drawn-in top, 10 sides
    citerneLune: (r = 4, ht = 7) => SHAPES.ringsLune(10, [[0, r], [ht * 0.72, r], [ht * 0.9, r * 0.8], [ht, r * 0.45]], true),
    // dish: a shallow paraboloid of radius r opening toward +Y, 10 sides (DoubleSide material); the placement tilts it
    soucoupeLune: (r = 5, dp = 1.6) => SHAPES.ringsLune(10, [0.12, 0.45, 0.75, 1].map(t => [dp * t * t, r * t])),
    // the Earth: a disc of radius r facing +Z
    terreLune: (r = 110) => new THREE.CircleGeometry(r, 20),
    // ---------- assemblies ----------
    // what goes with the dome: an octagonal plinth 14 m deep (the dome stands level on a slope), a ring of lit windows 4 m up, the entry lock on -X with its door and orange band, a mast with a light at the top
    domeLune: (r = 35, ht = 30) => [['dark', r * 1.74, 16, r * 1.74, 0, -6, 0], ['dark', r * 1.74, 16, r * 1.74, 0, -6, 0, [0, 0.7854, 0]],
      ...range(12, i => i * 0.5236 + 0.2618).map(t => ['hublot', r * 0.3, 1.8, 1, Math.cos(t) * r * 0.975, 5, Math.sin(t) * r * 0.975, [0, 1.5708 - t, 0]]),
      ['shell', 12, 7, 11, -r - 3, 3.5, 0], ['amber', 12.3, 0.8, 11.3, -r - 3, 6, 0], ['dark', 0.5, 4.6, 6, -r - 9.1, 2.3, 0], ['steel', 0.4, 7, 0.4, 0, ht + 3.5, 0], ['glow', 1, 1, 1, 0, ht + 7.4, 0]],
    // what goes with a lying cylinder (cylindreLune, same L and r): two cradles, a band of lit windows on each side, a hatch at each end, an orange stripe along the top
    moduleLune: (L = 26, r = 4.5) => [...pair(sd => ['dark', r * 1.9, 1.8, 1.4, 0, 0.9, sd * L * 0.3]), ...pair(sd => ['hublot', 0.4, 1.2, L * 0.55, sd * r * 0.94, r + 1.9, 0]),
      ...pair(sd => ['dark', 2.4, 2.8, 0.6, 0, r + 1.2, sd * (L / 2 + 0.05)]), ['amber', 1, 0.3, L * 0.86, 0, r * 1.93 + 1.2, 0]],
    // control tower: a lattice shaft, a glazed cab lit from inside under a dark roof, a mast and its light; 46 m in all
    tourLune: () => [['dark', 8, 3, 8, 0, 1.5, 0], ['lattice', 5, 32, 5, 0, 19, 0], ['hall', 11, 1, 11, 0, 35.5, 0], ['shell', 10, 4.6, 10, 0, 38.3, 0], ['hublot', 10.3, 1.8, 10.3, 0, 38.8, 0], ['dark', 11.4, 0.7, 11.4, 0, 41, 0],
      ['steel', 0.3, 5, 0.3, 0, 43.8, 0], ['glow', 0.9, 0.9, 0.9, 0, 46.7, 0]],
    // antenna: a lattice mast of height ht with two orange bands, a cross arm and a light at the top
    antenneLune: (ht = 46) => [['dark', 5, 1.2, 5, 0, 0.6, 0], ['lattice', 3, ht, 3, 0, ht / 2 + 1, 0], ['amber', 3.3, 1.2, 3.3, 0, ht * 0.36, 0], ['amber', 3.3, 1.2, 3.3, 0, ht * 0.7, 0], ['steel', 7, 0.3, 0.3, 0, ht * 0.86, 0], ['glow', 1, 1, 1, 0, ht + 1.6, 0]],
    // telemetry relay: a small cabin with a lit window band, and the post that carries the dish (soucoupeLune, posed apart at 12 m)
    relaisLune: () => [['shell', 9, 4, 7, 0, 2, 0], ['hublot', 9.2, 1, 3.4, 0, 2.7, 0], ['dark', 10, 0.5, 8, 0, 4.25, 0], ['steel', 0.6, 8, 0.6, 2.6, 8.2, 0], ['amber', 1.4, 1.4, 1.4, 2.6, 12, 0], ['glow', 0.6, 0.6, 0.6, -3.5, 4.9, 2.5]],
    // photovoltaic field, w wide by d deep: rows of tilted panels every 5 m on a rail and two legs
    champSolaireLune: (w = 50, d = 50) => range(Math.max(1, Math.round(d / 5)), i => -d / 2 + 2.5 + i * 5).flatMap(z => [['solar', w, 0.25, 3.8, 0, 2.3, z, [0.55, 0, 0]], ['dark', w * 0.94, 0.25, 0.25, 0, 1.3, z + 0.4], ...pair(sd => ['steel', 0.3, 1.4, 0.3, sd * w * 0.42, 0.7, z + 0.4])]),
    // hangar, w × ht × d: a pale grey shell, an orange band under the roof, roof ribs, one large dark door and a lit strip above it on the front (-X)
    hangarLune: (w = 50, ht = 16, d = 70) => [['hall', w, ht, d, 0, ht / 2, 0], ['amber', w + 0.3, 0.9, d + 0.3, 0, ht - 1.5, 0], ...range(5, i => ['dark', w + 0.8, 0.6, 1.2, 0, ht + 0.3, (i - 2) * d * 0.22]),
      ['dark', 0.6, ht * 0.66, d * 0.5, -w / 2 - 0.1, ht * 0.33, 0], ['hublot', 0.5, 1.4, d * 0.5, -w / 2 - 0.15, ht * 0.76, 0]],
    // warehouse, w × ht × d: the same shell, three small doors on the front, a roof unit
    entrepotLune: (w = 30, ht = 12, d = 50) => [['hall', w, ht, d, 0, ht / 2, 0], ['amber', w + 0.3, 0.8, d + 0.3, 0, ht - 1.3, 0], ...range(3, i => ['dark', 0.5, 4.4, 5, -w / 2 - 0.1, 2.2, (i - 1) * d * 0.3]), ['dark', 7, 2.4, 9, w * 0.15, ht + 1.2, -d * 0.2]],
    // one 40 m bay of the start airlock, the road along Z: two thick walls 28 m apart, a roof at ht, four portal frames inside, an orange band at 2 m on each wall, cold ceiling panels between the frames
    sasLune: (w = 28, ht = 14, L = 40) => [...pair(sd => ['hall', 7, ht + 2, L, sd * (w / 2 + 3.5), ht / 2 + 1, 0]), ['dark', w + 14, 2, L, 0, ht + 1, 0], ...pair(sd => ['amber', 0.3, 0.9, L, sd * (w / 2 - 0.1), 2.2, 0]),
      ...range(4, i => -L / 2 + 5 + i * 10).flatMap(z => [...pair(sd => ['shell', 1.4, ht, 1.4, sd * (w / 2 - 0.7), ht / 2, z]), ['shell', w, 1.4, 1.4, 0, ht - 0.7, z], ...pair(sd => ['ceil', 7, 0.3, 4, sd * 6, ht - 0.25, z + 5])])],
    // frame across the road, w wide inside, ht high, in the material `zone`: two posts, a lintel, a light on each post. The doors of the airlock, the open frames before the base, the mouth of the tunnel
    portiqueLune: (w = 24, ht = 12, zone = 'amber') => [...pair(sd => [zone, 2.2, ht, 2.2, sd * (w / 2 + 1.1), ht / 2, 0]), [zone, w + 4.4, 2.2, 2.2, 0, ht + 1.1, 0], ...pair(sd => ['glow', 0.9, 0.9, 0.9, sd * (w / 2 + 1.1), ht + 2.7, 0])],
    // buggy garage, 26 × 10 × 40: an ivory box, an orange band, two large doors and a lit strip on the front (-X), two roof units
    garageLune: () => [['shell', 26, 10, 40, 0, 5, 0], ['amber', 26.3, 0.8, 40.3, 0, 8.8, 0], ...pair(sd => ['dark', 0.6, 6.4, 13, -13.1, 3.2, sd * 9]), ['hublot', 0.5, 1.2, 30, -13.15, 7.6, 0], ...pair(sd => ['dark', 6, 2, 6, 4, 11, sd * 10])],
    // parked buggy, closed cabin, along Z: an ivory hull with an orange sill, an opaque dark canopy, four exposed wheels, a whip antenna with its light
    roverLune: () => [['shell', 2.6, 1.3, 5.6, 0, 1.55, 0], ['amber', 2.7, 0.3, 5.7, 0, 1.15, 0], ['glass', 2.3, 1.1, 2.7, 0, 2.7, 0.5], ['shell', 2.4, 0.2, 2.9, 0, 3.35, 0.5],
      ...pair(sx => pair(sz => [0, 0.7854].map(a => ['tire', 0.7, 1.3, 1.3, sx * 1.6, 0.65, sz * 1.9, [a, 0, 0]])).flat()).flat(), ['steel', 0.1, 1.8, 0.1, 0.8, 4.2, -2.2], ['glow', 0.3, 0.3, 0.3, 0.8, 5.2, -2.2]],
    // landing pad, 40 m across: a dark octagonal slab, an orange cross, a light at each corner
    padLune: () => [['dark', 40, 0.6, 16.6, 0, 0.3, 0], ['dark', 40, 0.6, 16.6, 0, 0.3, 0, [0, 0.7854, 0]], ['dark', 40, 0.6, 16.6, 0, 0.3, 0, [0, 1.5708, 0]], ['dark', 40, 0.6, 16.6, 0, 0.3, 0, [0, 2.3562, 0]],
      ['amber', 26, 0.1, 2.4, 0, 0.66, 0], ['amber', 2.4, 0.1, 26, 0, 0.66, 0], ...[0.3927, 1.9635, 3.5343, 5.1051].map(t => ['glow', 0.8, 0.8, 0.8, Math.cos(t) * 19, 1, Math.sin(t) * 19])],
    // descent stage left on its pad: an octagonal ivory body on four splayed legs with footpads, an engine bell, an orange tank on two sides, a mast and its light; 9 m high
    landerLune: () => [['shell', 7, 3.2, 3, 0, 4.4, 0], ['shell', 7, 3.2, 3, 0, 4.4, 0, [0, 0.7854, 0]], ['shell', 7, 3.2, 3, 0, 4.4, 0, [0, 1.5708, 0]], ['shell', 7, 3.2, 3, 0, 4.4, 0, [0, 2.3562, 0]],
      ...[0.7854, 2.3562, 3.927, 5.4978].flatMap(t => [['steel', 0.3, 5.4, 0.3, Math.cos(t) * 4.6, 2.4, Math.sin(t) * 4.6, [Math.sin(t) * 0.5, 0, -Math.cos(t) * 0.5]], ['dark', 1.6, 0.3, 1.6, Math.cos(t) * 5.9, 0.15, Math.sin(t) * 5.9]]),
      ['dark', 2.2, 1.6, 2.2, 0, 2, 0], ...pair(sd => ['amber', 1.6, 2, 1.6, sd * 3.9, 4.4, 0]), ['hublot', 3, 0.8, 0.3, 0, 5, 3.6], ['steel', 0.15, 2.6, 0.15, 1, 7.3, 0], ['glow', 0.4, 0.4, 0.4, 1, 8.8, 0]],
    // instrument station: a small ivory box on three legs, a solar panel on a post, an orange flag; what the colony leaves along the ridge and on the rims
    capteurLune: () => [['shell', 1.6, 1.1, 1.6, 0, 1.3, 0], ...[0, 2.094, 4.189].map(t => ['steel', 0.12, 1.2, 0.12, Math.cos(t) * 0.9, 0.5, Math.sin(t) * 0.9, [Math.sin(t) * 0.5, 0, -Math.cos(t) * 0.5]]),
      ['steel', 0.12, 2.6, 0.12, 1.6, 1.3, 0], ['solar', 2.4, 0.1, 1.6, 1.6, 2.7, 0, [0.5, 0, 0]], ['steel', 0.08, 3, 0.08, -1.4, 1.5, 1], ['amber', 0.9, 0.6, 0.06, -0.95, 2.7, 1]],
    // pipe run on low supports, L long along Z: two parallel pipes, a support every 8 m
    tuyauLune: (L = 40) => [...pair(sd => ['hall', 0.7, 0.7, L, sd * 0.6, 1.5, 0]), ...range(Math.max(2, Math.round(L / 8)), i => ['dark', 2.2, 1.2, 0.5, 0, 0.6, -L / 2 + 4 + i * 8]), ['amber', 2, 0.9, 0.9, 0, 1.5, 0]],
    // beacon, ht high: a dark post, an orange sleeve, a light at the top. On the rim of a fresh impact, at a guidance point
    baliseLune: (ht = 9) => [['dark', 0.5, ht, 0.5, 0, ht / 2, 0], ['amber', 1.2, 2, 1.2, 0, ht * 0.7, 0], ['glow', 0.9, 0.9, 0.9, 0, ht + 0.5, 0]],
  });
})();
