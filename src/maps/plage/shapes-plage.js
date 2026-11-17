// Shapes specific to "plage" (Playa 307): completes the shapes.js catalogue (simple shape = geometry, assembly = list of boxes with zones). See docs/methods/SCENERY.md.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // coconut palm leaning towards +X: trunk in four sections that straighten up, crown of ten drooping fronds, bunch of yellow coconuts under the crown; v = 0 (11 m) or 1 (8 m, more leaning). Origin at the foot
    coconutPalm: (v = 0) => {
      const H = v ? 8 : 11, inc = v ? 0.42 : 0.28, seg = [], n = 4; let x = 0, y = 0;
      for (let k = 0; k < n; k++) { const a = inc * (1 - k / n), l = H / n, cx = x + Math.sin(a) * l / 2, cy = y + Math.cos(a) * l / 2; seg.push(['trunk', 0.36 - k * 0.04, l + 0.15, 0.36 - k * 0.04, cx, cy, 0, [0, 0, -a], 1]); x += Math.sin(a) * l; y += Math.cos(a) * l; }
      const fronds = Array.from({ length: 10 }, (_, k) => { const b = k / 10 * 6.2832, d = 1.9; return ['frond', 4.2, 0.08, 0.9, x + Math.cos(b) * d, y - 0.5 - (k % 2) * 0.3, Math.sin(b) * d, [0, -b, -0.5 - (k % 3) * 0.15], 1]; });
      const nut = [[0.35, 0], [-0.2, 0.3], [0, -0.35], [-0.25, -0.15]].map(([a, b]) => ['nut', 0.32, 0.36, 0.32, x + a, y - 0.55, b]);
      return [...seg, ...fronds, ...nut];
    },
    // palapa roof: eight-sided thatch cone, 1 m radius and height (to be scaled); origin at the base
    roofPalapa: () => { const g = new THREE.ConeGeometry(1, 1, 8, 1, true); g.translate(0, 0.5, 0); return g; },
    // round wooden post 1 m high (to be stretched); origin at the foot
    poleWood: () => { const g = new THREE.CylinderGeometry(0.1, 0.12, 1, 6); g.translate(0, 0.5, 0); return g; },
    // marker buoy: small sphere 1 m in diameter to be scaled; origin at the centre
    buoyPlage: () => new THREE.IcosahedronGeometry(0.5, 1),
    // rope stretched along X between two posts: thin tube 1 m long (to be stretched in X)
    racingLine: () => { const g = new THREE.CylinderGeometry(0.03, 0.03, 1, 4); g.rotateZ(Math.PI / 2); return g; },
    // beach deckchair facing +X: frame, canvas, raised backrest
    deckchair: () => [['wood', 1.8, 0.08, 0.7, 0, 0.35, 0], ['cloth', 1.2, 0.05, 0.6, -0.25, 0.42, 0], ['cloth', 0.8, 0.05, 0.6, 0.6, 0.65, 0, [0, 0, 0.6]], ...pair(sz => ['wood', 0.06, 0.35, 0.06, -0.8, 0.17, sz * 0.3]), ...pair(sz => ['wood', 0.06, 0.35, 0.06, 0.8, 0.17, sz * 0.3])],
    // fishing boat, bow towards +X: white hull, painted band (tinted zone), benches, outboard motor; origin at the bottom of the hull
    boatPlage: () => [['hull', 5, 0.7, 1.7, 0, 0.35, 0, null, 1], ['hull', 1.2, 0.7, 1.1, 2.9, 0.4, 0, [0, 0, 0.2]], ['bandStrip', 5.1, 0.18, 1.74, 0, 0.62, 0], ['bandStrip', 1.25, 0.18, 1.14, 2.95, 0.66, 0, [0, 0, 0.2]],
      ['wood', 0.35, 0.08, 1.5, 0.8, 0.55, 0], ['wood', 0.35, 0.08, 1.5, -1, 0.55, 0], ['engine', 0.4, 0.8, 0.35, -2.7, 0.6, 0]],
    // street façade facing -Z (the road): two-storey rendered block, crenellated parapet, balcony, canvas awning at ground floor; L = width, H = height. Origin at ground level, middle of the façade
    facadePlaya: (L = 10, H = 8) => [['intoWall', L, H, 9, 0, H / 2, 4.5, null, 1], ...Array.from({ length: Math.round(L / 1.6) }, (_, k) => ['intoWall', 0.8, 0.6, 0.4, -L / 2 + 0.4 + k * (L - 0.8) / Math.max(1, Math.round(L / 1.6) - 1), H + 0.3, 0.2]),
      ['rackFrame', L * 0.6, 0.15, 1.1, 0, H * 0.48, -0.55], ['rackFrame', L * 0.6, 0.9, 0.06, 0, H * 0.48 + 0.5, -1.08], ['cloth', L * 0.8, 0.06, 2.2, 0, 2.9, -1.05, [-0.32, 0, 0]], ['rackFrame', L * 0.8, 0.35, 0.05, 0, 2.5, -2.1]],
    // market stall, the barge facing -Z: table, striped canvas on four uprights, stacked straw hats and hung hammocks (tinted zone)
    stallPlaya: () => [['wood', 3, 0.9, 1.4, 0, 0.45, 0, null, 1], ...pair(a => pair(b => ['wood', 0.08, 2.6, 0.08, a * 1.45, 1.3, b * 0.7])).flat(), ['cloth', 3.3, 0.06, 1.9, 0, 2.62, 0, [0.12, 0, 0], 1],
      ...[-1, -0.4, 0.2, 0.8].map(x => ['straw', 0.55, 0.12, 0.55, x, 0.98, -0.2]), ...[-0.7, 0.5].map(x => ['straw', 0.32, 0.22, 0.32, x, 1.1, -0.2]),
      ['hammock', 1.3, 0.9, 0.05, -0.5, 1.75, 0.68, [0, 0, 0.05]], ['hammock', 1.3, 0.9, 0.05, 0.9, 1.75, 0.68, [0, 0, -0.05]]],
    // market hall pillar, from the roadway to the roof (h m): square shaft, capital; origin at ground level
    pillarHangar: (h = 9) => [['pillar', 0.6, h, 0.6, 0, h / 2, 0, null, 1], ['pillar', 1, 0.3, 1, 0, h - 0.15, 0], ['pillar', 0.9, 0.4, 0.9, 0, 0.2, 0]],
    // round lobby column (h m), white; origin at ground level
    column: (h = 9) => { const g = new THREE.CylinderGeometry(0.45, 0.5, h, 10); g.translate(0, h / 2, 0); return g; },
    // stalactite: cone pointing down, 1 m long and 0.5 m radius at the root (to be scaled); origin at the root (at the ceiling)
    stalactite: () => { const g = new THREE.ConeGeometry(0.5, 1, 6); g.rotateX(Math.PI); g.translate(0, -0.5, 0); return g; },
    // limestone rock: rounded block of 1 m radius, to be scaled; origin at the centre
    boulderPlage: () => { const g = new THREE.DodecahedronGeometry(1, 0); g.scale(1, 0.75, 1); return g; },
    // scrub bush: low ball, 1 m radius; origin at ground level
    bush: () => { const g = new THREE.IcosahedronGeometry(1, 0); g.scale(1, 0.6, 1); g.translate(0, 0.35, 0); return g; },
    // dry-stone low wall, L m along X
    lowwall: (L = 6) => [['stone', L, 0.9, 0.7, 0, 0.45, 0, null, 1], ['stone', L, 0.15, 0.85, 0, 0.95, 0]],
    // vertical plane 1 m × 1 m (vines, light rays); origin at the top, middle: it hangs down
    pan: () => { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, -0.5, 0); return g; },
    // square pennant 0.4 × 0.5 m hanging from its string (string along X); origin at the string
    pennant: () => { const g = new THREE.PlaneGeometry(0.42, 0.52); g.translate(0, -0.26, 0); return g; },
    // beach-bar counter: simplified arc-shaped counter, stools, bottle shelf (lit zone); origin at ground, the customer on the +Z side
    barThatch: () => [['wood', 5, 1.1, 0.8, 0, 0.55, 0, null, 1], ['wood', 5.4, 0.1, 1.1, 0, 1.15, 0], ['wood', 4.5, 1.8, 0.4, 0, 0.9, -1.6], ['bottles', 4.2, 0.9, 0.1, 0, 1.6, -1.38],
      ...[-1.8, -0.6, 0.6, 1.8].map(x => ['wood', 0.4, 0.7, 0.4, x, 0.35, 1])],
    // plant pot: terracotta pot and tuft; origin at ground
    potPlant: () => [['pot', 0.8, 0.8, 0.8, 0, 0.4, 0], ['plant', 1.4, 1.4, 1.4, 0, 1.4, 0, [0, 0.6, 0]], ['plant', 1.1, 1.2, 1.1, 0, 2.2, 0, [0.4, 0, 0.3]]],
    // wooden staircase attached to the wall, descending along X: steps, stringer, handrail; n steps
    stairs: (n = 12) => [...Array.from({ length: n }, (_, k) => ['wood', 0.45, 0.08, 1.4, k * 0.5, -k * 0.4, 0]), ['wood', n * 0.5, 0.25, 0.08, n * 0.25 - 0.25, -n * 0.2 + 0.1, 0.72, [0, 0, -0.67]],
      ['wood', n * 0.5, 0.06, 0.06, n * 0.25 - 0.25, -n * 0.2 + 1.1, 0.72, [0, 0, -0.67]]],

    // ---------- V2: each shape names the reference sheet it follows ----------
    // lifeguard tower (sheet 1, torre de salvavidas): four legs, platform at 3 m, cabin closed on three sides, overhanging flat roof, ramp toward the beach (+Z), flag mast; origin at ground
    towerLifeguard: () => [...pair(a => pair(b => ['wood', 0.18, 3.1, 0.18, a * 1.1, 1.55, b * 1.1])).flat(), ['wood', 2.8, 0.15, 2.8, 0, 3.1, 0, null, 1],
      ['cabin', 2.3, 1.9, 0.12, 0, 4.1, -1.1], ...pair(sd => ['cabin', 0.12, 1.9, 2.3, sd * 1.1, 4.1, 0]), ['cabin', 2.3, 0.9, 0.12, 0, 3.6, 1.1], ['roofM', 3.2, 0.18, 3.2, 0, 5.15, 0, null, 1],
      ['wood', 1, 0.08, 4.2, 0, 1.55, 3, [0.78, 0, 0]], ['wood', 0.08, 3, 0.08, 1.2, 6.6, -1.2], ['flagCube', 0.9, 0.6, 0.03, 1.65, 7.7, -1.2]],
    // beach-volleyball net: two posts, net stretched along X (9 m); origin at ground, middle of the net
    volley: () => [...pair(sd => ['pole', 0.12, 2.6, 0.12, sd * 4.7, 1.3, 0]), ['netting', 9.4, 0.9, 0.03, 0, 2.0, 0], ['pole', 9.4, 0.06, 0.05, 0, 2.47, 0]],
    // red mangrove (sheet 7): short trunk and arched stilt roots diving into the water (root zone); the crown is placed separately (bush); origin at water level, under the trunk
    mangroveTree: () => [['rootCol', 0.22, 1.6, 0.22, 0, 1.6, 0, null, 1], ...Array.from({ length: 7 }, (_, k) => { const a = k / 7 * 6.2832, c = Math.cos(a), s = Math.sin(a);
      return [['rootCol', 0.09, 1.3, 0.09, c * 0.5, 1.1, s * 0.5, [s * 0.6, 0, -c * 0.6]], ['rootCol', 0.08, 1, 0.08, c * 1.05, 0.35, s * 1.05, [s * 0.25, 0, -c * 0.25]]]; }).flat()],
    // pink flamingo (sheet 7): thin legs, body, S-shaped neck (two pieces), head and black beak; t = 1 head in the water (feeding); bow toward +X; origin at ground (under 0.2 m of water)
    flamingo: (t = 0) => [['paw', 0.04, 1.05, 0.04, 0, 0.5, -0.07], ['paw', 0.04, 1.05, 0.04, 0.05, 0.5, 0.07], ['feather', 0.75, 0.38, 0.34, 0, 1.2, 0, [0, 0, 0.1], 1], ['feather', 0.3, 0.2, 0.3, -0.42, 1.23, 0, [0, 0, -0.3]],
      ...(t ? [['feather', 0.09, 0.75, 0.09, 0.45, 0.95, 0, [0, 0, 0.6]], ['feather', 0.18, 0.12, 0.12, 0.62, 0.55, 0], ['beak', 0.14, 0.08, 0.07, 0.72, 0.48, 0]]
        : [['feather', 0.09, 0.55, 0.09, 0.38, 1.55, 0, [0, 0, -0.35]], ['feather', 0.09, 0.4, 0.09, 0.44, 1.95, 0, [0, 0, 0.3]], ['feather', 0.2, 0.13, 0.12, 0.5, 2.18, 0], ['beak', 0.14, 0.08, 0.07, 0.64, 2.12, 0, [0, 0, -0.5]]])],
    // wooden lagoon observation tower (sheet 7): four 9 m posts, two decks, railings; the palapa roof is placed separately; origin at ground
    obsTower: () => [...pair(a => pair(b => ['wood', 0.25, 9, 0.25, a * 1.8, 4.5, b * 1.8])).flat(), ['wood', 4.2, 0.2, 4.2, 0, 4, 0, null, 1], ['wood', 4.2, 0.2, 4.2, 0, 8, 0, null, 1],
      ...pair(sd => ['wood', 4.2, 0.9, 0.08, 0, 8.55, sd * 2.05]), ...pair(sd => ['wood', 0.08, 0.9, 4.2, sd * 2.05, 8.55, 0]), ['wood', 5.4, 0.12, 0.9, 0, 2, 2.6, [0, 0, 0.8]]],
    // rental kayak, bow toward +X; origin on the water
    kayak: () => [['hull', 3.6, 0.3, 0.7, 0, 0.1, 0], ['hull', 0.7, 0.24, 0.4, 2.0, 0.1, 0], ['seat', 0.5, 0.08, 0.5, -0.2, 0.28, 0], ['seat', 0.06, 0.06, 2.2, 0.2, 0.55, 0, [0, 0.5, 0.2]]],
    // tinaco: black water tank of Mexican rooftops (sheet 3), 1.1 m cylinder; origin at base
    tinaco: () => { const g = new THREE.CylinderGeometry(0.62, 0.62, 1.2, 10); g.translate(0, 0.6, 0); return g; },
    // road sign facing -Z: plate on two posts (the plate carries the lettering); origin at ground
    signRoad: (L = 3, H = 1.4) => [...pair(sd => ['pole', 0.1, 2.4 + H / 2, 0.1, sd * L * 0.35, (2.4 + H / 2) / 2, 0.05]), ['plate', L, H, 0.08, 0, 2.4 + H / 2, 0]],
    // mototaxi (canvas-roof tricycle), bow toward +X; tinted body; origin at ground
    mototaxi: () => [['carBody', 1.6, 0.8, 1.3, -0.3, 0.75, 0, null, 1], ['carBody', 1.1, 0.4, 0.15, 0.75, 0.9, 0], ['roofM', 2.1, 0.08, 1.4, -0.2, 2.05, 0], ...pair(sd => ['rackFrame', 0.05, 1.0, 0.05, -1.2, 1.55, sd * 0.65]),
      ...pair(sd => ['rackFrame', 0.05, 1.0, 0.05, 0.6, 1.55, sd * 0.65]), ['wheelPart', 0.5, 0.5, 0.15, 0.9, 0.25, 0], ...pair(sd => ['wheelPart', 0.5, 0.5, 0.15, -0.6, 0.25, sd * 0.6])],
    // parked bicycle, along X; origin at ground
    bike: () => [...pair(sd => ['wheelPart', 0.68, 0.68, 0.05, sd * 0.52, 0.34, 0]), ['rackFrame', 1.05, 0.05, 0.05, 0, 0.62, 0, [0, 0, 0.12]], ['rackFrame', 0.05, 0.55, 0.05, -0.15, 0.62, 0], ['rackFrame', 0.5, 0.05, 0.05, 0.42, 0.95, 0]],
    // stalagmite: cone with the point up, 1 m high and 0.5 m radius at the base; origin at ground (sheet 6)
    stalagmite: () => { const g = new THREE.ConeGeometry(0.5, 1, 6); g.translate(0, 0.5, 0); return g; },
    // cave column (sheet 6): stalactite and stalagmite fused, wide at both ends, pinched in the middle, h m; origin at ground
    columnCave: (h = 7.6) => new THREE.LatheGeometry([[0.01, 0], [1.4, 0], [1.1, 0.12 * h], [0.55, 0.35 * h], [0.32, 0.52 * h], [0.5, 0.66 * h], [1.0, 0.86 * h], [1.6, h]].map(([x, y]) => new THREE.Vector2(x, y)), 8),
    // open cone of light ray (sheet 6): 1 m high, radius 1 at the bottom and 0.7 at the top; origin at the top (at the ceiling hole), it descends
    coneRay: () => { const g = new THREE.CylinderGeometry(0.7, 1, 1, 14, 1, true); g.translate(0, -0.5, 0); return g; },
    // disc laid flat, 1 m radius: ceiling light hole, sunspot on the ground; origin at center
    discPlage: () => { const g = new THREE.CircleGeometry(1, 16); g.rotateX(-Math.PI / 2); return g; },
    // Cozumel ferry, bow toward +X: white hull, stripe, two decks; origin at the waterline
    ferry: () => [['hull', 40, 4, 9, 0, 1, 0], ['bandStrip', 40.2, 0.8, 9.2, 0, 2.2, 0], ['hull', 26, 3, 8, -3, 4.5, 0], ['pane', 26.2, 1, 8.2, -3, 4.8, 0], ['hull', 12, 2.5, 6, -6, 7.2, 0]],
  });
})();

// Shapes from the redesign. Facades face -Z (toward the road), X along the road. Origin at ground, at the midpoint.
(function () {
  const pair = f => [-1, 1].map(f), runSuite = (n, f) => Array.from({ length: n }, (_, k) => f(k, _));
  Object.assign(SHAPES, {
    // Quinta Avenida house (DA-8, REFS §3): 1 or 2 levels, flat roof with simple parapet, one single-colored wall (wall zone, tinted), open ground floor as a shop
    // under an awning, at the level of the shuttered windows and a wooden balcony, flat sign in flagCube. L = facade length, H = height, P = depth
    houseQuinta: (L = 10, H = 4.6, P = 9) => {
      const f = -P / 2, et = H > 6, nf = Math.max(2, Math.round(L / 3.4));
      return [['intoWall', L, H, P, 0, H / 2, 0, null, 1], ['acro', L + 0.3, 0.4, P + 0.3, 0, H + 0.2, 0], ...runSuite(Math.max(2, Math.round(L / 4)), (k, _, nbr = Math.max(2, Math.round(L / 4))) => [['shadows', L / nbr - 1, 2.5, 0.3, (k + 0.5) / nbr * L - L / 2, 1.35, f - 0.02], ['counterTop', L / nbr - 1.6, 0.9, 0.6, (k + 0.5) / nbr * L - L / 2, 0.45, f - 0.5], ['goods', L / nbr - 1.4, 0.8, 0.12, (k + 0.5) / nbr * L - L / 2, 2.15, f - 0.22]]).flat(),
        ['awning', L * 0.84, 0.1, 2.4, 0, 3.1, f - 1.15, [-0.2, 0, 0], 1], ['signboard', 0.1, 0.9, 1.5, L / 2 - 0.7, 4.0, f - 0.85],
        ...(et ? [...runSuite(nf, k => ['shutter', 1.2, 1.5, 0.14, (k + 0.5) / nf * L - L / 2, H - 1.9, f - 0.04]), ['wood', L * 0.84, 0.12, 1.0, 0, H - 3.0, f - 0.5], ['wood', L * 0.84, 0.07, 0.07, 0, H - 2.1, f - 0.97],
          ...runSuite(nf + 1, k => ['wood', 0.07, 0.9, 0.07, k / nf * L * 0.84 - L * 0.42, H - 2.55, f - 0.97])] : [])];
    },
    // resort wing (DA-7: Mahekal, The Reef Playacar): low, spread-out volume of N levels, roughcast (roughcast zone, tinted), wooden balconies running along each floor, large two-slope palm roof
    // overhanging, palm-covered terrace on wooden posts on the beach side, low wall. L = length, N = levels (2 or 3)
    resort: (L = 30, N = 2) => {
      const H = N * 3.3, np = Math.max(3, Math.round(L / 5));
      return [['stucco', L, H, 11, 0, H / 2, 4, null, 1], ['thatch', L + 2.4, 0.3, 7.6, 0, H + 1.6, 0.9, [-0.48, 0, 0], 1], ['thatch', L + 2.4, 0.3, 7.6, 0, H + 1.6, 7.1, [0.48, 0, 0], 1],
        ...runSuite(N, k => ['shadows', L - 2, 2.3, 0.2, 0, k * 3.3 + 1.35, -1.52]), ...runSuite(N - 1, k => ['wood', L - 1, 0.14, 1.5, 0, (k + 1) * 3.3, -2.2]), ...runSuite(N - 1, k => ['wood', L - 1, 0.07, 0.07, 0, (k + 1) * 3.3 + 0.95, -2.9]),
        ...runSuite(N - 1, k => runSuite(np + 1, j => ['wood', 0.07, 0.95, 0.07, j / np * (L - 1) - (L - 1) / 2, (k + 1) * 3.3 + 0.5, -2.9])).flat(),
        ['thatch', L - 4, 0.25, 6.4, 0, 3.6, -5.6, [-0.16, 0, 0], 1], ...runSuite(np, j => ['wood', 0.24, 3.1, 0.24, (j + 0.5) / np * (L - 4) - (L - 4) / 2, 1.55, -8.3]), ['slab', L - 2, 0.3, 7.5, 0, 0.15, -5.4],
        ['lowwall', L, 0.7, 0.4, 0, 0.35, -9.6]];
    },
    // resort pool: light coping and turquoise water flush with the ground
    pool: (L = 14, P = 7) => [['slab', L + 1.6, 0.25, P + 1.6, 0, 0.12, 0], ['water', L, 0.1, P, 0, 0.24, 0]],
    // feria Ferris wheel (D-1), 24 m diameter, at rest: two 20-segment rims, spokes, ten gondolas in the festival's three colors, A-frame legs. In the XY plane
    bigWheel: () => {
      const R = 11, Y = 13.5, n = 20, l = 2 * R * Math.sin(Math.PI / n) + 0.1, cab = ['cabA', 'cabB', 'cabC'];
      return [...pair(sz => runSuite(n, k => { const a = (k + 0.5) / n * 6.2832; return ['iron', l, 0.22, 0.22, Math.cos(a) * R * Math.cos(Math.PI / n), Y + Math.sin(a) * R * Math.cos(Math.PI / n), sz * 1.1, [0, 0, a + 1.5708]]; })).flat(),
        ...pair(sz => runSuite(10, k => { const a = k / 10 * 6.2832; return ['iron', R, 0.1, 0.1, Math.cos(a) * R / 2, Y + Math.sin(a) * R / 2, sz * 1.1, [0, 0, a]]; })).flat(),
        ...runSuite(10, k => { const a = k / 10 * 6.2832; return [cab[k % 3], 1.5, 1.3, 1.8, Math.cos(a) * R, Y + Math.sin(a) * R - 0.9, 0, null, 1]; }), ['iron', 0.6, 0.6, 3, 0, Y, 0],
        ...pair(sx => pair(sz => ['foot', 0.4, 15.2, 0.4, sx * 3.6, Y / 2 - 0.3, sz * 1.6, [0, 0, sx * 0.26], 1])).flat(), ['foot', 12, 0.5, 5, 0, 0.25, 0]];
    },
    // white chapel of the square (Parque Los Fundadores): low nave, stepped pediment, square bell tower with red roof and cross, dark door
    chapel: () => [['whiteN', 9, 6.5, 15, 0, 3.25, 1, null, 1], ['whiteN', 9.4, 2, 0.7, 0, 7.4, -6.2], ['whiteN', 5.4, 1.6, 0.7, 0, 9.1, -6.2], ['whiteN', 2.2, 1.2, 0.7, 0, 10.4, -6.2], ['shadows', 2.4, 3.6, 0.2, 0, 1.8, -6.62], ['shadows', 1.2, 1.2, 0.2, 0, 5.6, -6.62],
      ['whiteN', 3.2, 14, 3.2, 6.6, 7, -4.8, null, 1], ['shadows', 1.4, 2, 3.3, 6.6, 11.6, -4.8], ['shadows', 3.3, 2, 1.4, 6.6, 11.6, -4.8], ['roofR', 3.8, 0.5, 3.8, 6.6, 14.2, -4.8], ['roofR', 2.4, 0.7, 2.4, 6.6, 14.8, -4.8], ['crossSign', 0.18, 1.8, 0.18, 6.6, 16, -4.8], ['crossSign', 1, 0.18, 0.18, 6.6, 16.3, -4.8], ['crossSign', 0.18, 1.6, 0.18, 0, 11.8, -6.2], ['crossSign', 0.9, 0.18, 0.18, 0, 12.1, -6.2]],
    // village water tower (D-1): tank on four braced legs, 18 m; text zone = the painted name
    waterTowerPlage: () => [['vat', 7, 5, 7, 0, 15.5, 0, null, 1], ['vat', 7.6, 0.4, 7.6, 0, 18.2, 0], ['plainText', 6.2, 1.8, 0.1, 0, 15.6, -3.56], ...pair(a => pair(b => ['foot', 0.6, 13, 0.6, a * 2.8, 6.5, b * 2.8, null, 1])).flat(),
      ...pair(b => ['foot', 6, 0.25, 0.25, 0, 5, b * 2.8, [0, 0, 0.6]]), ...pair(b => ['foot', 6, 0.25, 0.25, 0, 9.5, b * 2.8, [0, 0, -0.6]])],
    // red and white antenna, 30 m
    antenna: () => runSuite(6, k => [k % 2 ? 'whiteN' : 'redTone', 0.7, 5, 0.7, 0, 2.5 + k * 5, 0]),
    // square's bandstand: approximated octagonal base, eight posts, railing; the roof (cone) is placed separately
    kioskPlage: () => [['slab', 8, 1.1, 8, 0, 0.55, 0, null, 1], ['slab', 9.6, 0.5, 2.4, 0, 0.25, -4.6], ...runSuite(8, k => { const a = (k + 0.5) / 8 * 6.2832; return ['iron', 0.2, 3.6, 0.2, Math.cos(a) * 3.7, 2.9, Math.sin(a) * 3.7]; }), ['iron', 7.8, 0.12, 7.8, 0, 4.7, 0]],
    // feria stage: platform, tube gantry, roof, two speaker walls, backdrop (text zone)
    scene: () => [['blackM', 14, 1.3, 8, 0, 0.65, 0, null, 1], ...pair(a => pair(b => ['iron', 0.3, 7, 0.3, a * 6.8, 4.8, b * 3.8])).flat(), ['iron', 14.4, 0.5, 8.4, 0, 8.4, 0, null, 1], ['plainText', 12.4, 4.4, 0.2, 0, 5, 3.6], ...pair(a => ['blackM', 1.8, 4.2, 1.6, a * 8.4, 2.1, -2.6, null, 1])],
    // carousel (merry-go-round) at rest: base, mast, upper platform; the striped roof (cone) is placed separately
    carousel: () => [['slab', 10, 0.6, 10, 0, 0.3, 0], ['iron', 0.8, 5, 0.8, 0, 2.8, 0], ['cabA', 10, 0.5, 10, 0, 5.2, 0, null, 1], ...runSuite(8, k => { const a = k / 8 * 6.2832; return [['cabA', 'cabB', 'cabC'][k % 3], 0.9, 1.3, 1.8, Math.cos(a) * 3.6, 1.6, Math.sin(a) * 3.6, [0, -a, 0]]; })],
    // ---------- life: everything faces +X ----------
    // bird in flight: slim body and two wings raised in a V, 2 m wingspan, a single tinted zone (gull, frigate, pelican, zopilote, swallow depending on tint and scale).
    // A negative Y scale folds the wings down under the body: that is the flap
    bird: () => [['plumage', 0.9, 0.16, 0.2, 0, 0, 0], ['plumage', 0.3, 0.1, 0.1, 0.55, 0.02, 0], ...pair(sd => ['plumage', 0.36, 0.05, 1.0, 0.05, 0.16, sd * 0.52, [sd * -0.32, 0, 0]])],
    // perched bird: body, head, beak, legs; origin at the feet
    birdPerched: () => [['plumage', 0.36, 0.18, 0.18, 0, 0.22, 0], ['plumage', 0.13, 0.13, 0.12, 0.2, 0.36, 0], ['beak', 0.12, 0.04, 0.04, 0.31, 0.35, 0], ['beak', 0.03, 0.14, 0.1, 0, 0.07, 0]],
    // flamingo in flight: outstretched neck, trailing legs, pink wings with black tips; same flap as the bird
    flamingoFlight: () => [['feather', 0.7, 0.26, 0.26, 0, 0, 0], ['feather', 0.85, 0.08, 0.08, 0.75, 0.03, 0], ['beak', 0.16, 0.1, 0.09, 1.22, 0, 0], ['paw', 0.9, 0.04, 0.1, -0.8, -0.04, 0],
      ...pair(sd => [['feather', 0.42, 0.05, 0.75, 0, 0.12, sd * 0.45, [sd * -0.3, 0, 0]], ['beak', 0.38, 0.05, 0.5, 0, 0.3, sd * 1.02, [sd * -0.3, 0, 0]]]).flat()],
    // beach person: legs, tinted top (clothing zone), head, arms; t = 0 arms along the body, 1 arms raised. Origin at ground
    folk: (t = 0) => [...pair(sd => ['low', 0.16, 0.8, 0.18, 0, 0.4, sd * 0.11]), ['clothes', 0.26, 0.6, 0.44, 0, 1.1, 0, null, 1], ['skin', 0.24, 0.26, 0.24, 0, 1.56, 0],
      ...pair(sd => t ? ['skin', 0.1, 0.62, 0.1, 0, 1.62, sd * 0.33, [sd * 0.35, 0, 0]] : ['skin', 0.1, 0.6, 0.1, 0, 1.08, sd * 0.28])],
    // parked pickup (cab toward +X); tinted body zone
    pickup: () => [['carBody', 5.2, 0.55, 1.9, 0, 0.78, 0, null, 1], ['carBody', 1.5, 0.32, 1.8, 1.8, 1.2, 0], ['carBody', 1.7, 0.72, 1.76, 0.3, 1.42, 0, null, 1], ['pane', 1.74, 0.42, 1.62, 0.3, 1.52, 0], ['pane', 0.1, 0.5, 1.56, 1.18, 1.5, 0, [0, 0, -0.4]], ...pair(a => ['carBody', 2.15, 0.42, 0.1, -1.5, 1.24, a * 0.9]), ['carBody', 0.1, 0.42, 1.9, -2.55, 1.24, 0], ['blackM', 2, 0.05, 1.7, -1.5, 1.07, 0],
      ...pair(a => ['pare', 0.16, 0.22, 1.94, a * 2.66, 0.62, 0]), ...pair(a => ['lampObj', 0.06, 0.18, 0.42, 2.62, 0.98, a * 0.62]), ...pair(a => ['redTone', 0.06, 0.22, 0.26, -2.62, 0.98, a * 0.76]), ...pair(a => pair(b => ['blackM', 0.74, 0.74, 0.3, a * 1.68, 0.37, b * 0.86])).flat()],
    // black lamppost of the Quinta and the muelle, 5 m, lantern
    lamppost: () => [['iron', 0.16, 5, 0.16, 0, 2.5, 0], ['iron', 0.5, 0.12, 0.5, 0, 5.05, 0], ['lampObj', 0.36, 0.5, 0.36, 0, 4.7, 0]],
    // concrete electric pole on the 307, 9 m, crossarm
    poleElec: () => [['concretePart', 0.3, 9, 0.3, 0, 4.5, 0], ['concretePart', 2.2, 0.14, 0.14, 0, 8.4, 0]],
    // banc de bois
    benchPlage: () => [['wood', 1.8, 0.1, 0.5, 0, 0.45, 0], ['wood', 1.8, 0.5, 0.08, 0, 0.75, 0.24], ...pair(a => ['iron', 0.08, 0.45, 0.5, a * 0.8, 0.22, 0])],
    // ceiba (REFS §5, Quintana Roo jungle): straight trunk with buttresses, horizontal branches, flat parasol crown made of stepped foliage plates; 14 m, to be scaled. Tinted leaf zone
    ceiba: () => [['trunk', 0.9, 9.4, 0.9, 0, 4.7, 0, null, 1], ['trunk', 1.7, 1.5, 1.7, 0, 0.75, 0], ...pair(a => ['trunk', 5.2, 0.34, 0.34, a * 2.3, 9.7, 0, [0, 0, a * 0.32]]), ...pair(a => ['trunk', 0.34, 0.34, 5.2, 0, 9.9, a * 2.3, [-a * 0.32, 0, 0]]),
      ['leafKey', 11, 1.3, 9, 0, 11.3, 0, [0, 0.3, 0], 1], ['leafKey', 8, 1.1, 10, 1, 12.3, -0.5, [0, 1.1, 0], 1], ['leafKey', 6, 1, 5, -1.5, 13.2, 1, [0, 0.6, 0]], ['leafKey', 4, 1.5, 4, 5, 10.5, 2, [0, 0.4, 0.1]], ['leafKey', 4, 1.4, 4.4, -5, 10.6, -2.5, [0, 0.9, -0.1]]],
    // low-jungle tree (chicozapote, chacá): two slim trunks that lean, angular stepped crowns, no ball; 12 m. Tinted leaf zone
    treeSelva: () => [['trunk', 0.5, 7.2, 0.5, 0.4, 3.6, 0, [0, 0, -0.1], 1], ['trunk', 0.36, 6, 0.36, -0.8, 3, 0.5, [0.15, 0, 0.2]], ['leafKey', 6, 3, 5.5, 0.5, 8.5, 0, [0, 0.4, 0.1], 1], ['leafKey', 4.5, 2.6, 4, -1.9, 7, 1.2, [0.1, 1, 0], 1], ['leafKey', 4, 2.4, 4.5, 1.5, 10.5, -0.8, [0, 0.8, -0.1]], ['leafKey', 3, 2, 3, -0.5, 11.7, 0.6, [0, 0.2, 0]]],
    // four-faced cone of palm leaves (kiosk, bar, carousel roof): radius 1, height 1, base at y = 0
    roof4: () => { const g = new THREE.ConeGeometry(1, 1, 4, 1, true); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return g; },
    // jungle tree: flattened ball crown with facets, wider than the bush
    canopyPlage: () => { const g = new THREE.IcosahedronGeometry(1, 1); g.scale(1, 0.55, 1); g.translate(0, 0.3, 0); return g; },
  });
})();
