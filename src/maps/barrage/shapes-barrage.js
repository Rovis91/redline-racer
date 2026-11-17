// Shapes specific to "barrage": completes the shapes.js catalog (same conventions: simple shape = geometry, assembly = list of boxes with zones). See docs/methods/SCENERY.md.
// Each shape states the reference sheet it follows (REFS n°).
(function () {
  const B = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d); g.userData.dim = [w, h, d]; return g; }, pair = f => [-1, 1].map(f);
  const backdrop = (g, y) => { g.translate(0, y, 0); return g; };
  Object.assign(SHAPES, {
    // REFS 2 — bottom-outlet jet (simple shape): the sheet leaves horizontally from the outlet (origin) toward +Z and falls in a parabola of `waterfall` m over `L` m;
    // two crossed sheets (flat, from w0 to w1 m wide; upright, from 2 to w1 / 2 m thick), v = along the jet (the texture scrolls)
    burst: (L = 70, waterfall = 14, w0 = 7, w1 = 16) => {
      const P = [], UV = [], I = [], n = 20;
      for (const sheet of [0, 1]) { const b = P.length / 3;
        for (let k = 0; k <= n; k++) { const t = k / n, z = t * L, y = -waterfall * t * t, w = (sheet ? 4 + (w1 * 0.8 - 4) * t : w0 + (w1 - w0) * t) / 2;
          if (sheet) P.push(0, y - w, z, 0, y + w, z); else P.push(-w, y, z, w, y, z); UV.push(0, t * 4, 1, t * 4);
          if (k < n) { const a = b + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
    },
    // REFS 2 — spray cloud: three crossed 1 m planes (scaled per instance), centered on the origin
    haze: () => { const gs = [0, 1, 2].map(k => { const p = new THREE.PlaneGeometry(1, 1); p.rotateY(k * Math.PI / 3); return p; });
      const P = [], UV = [], I = []; gs.forEach(p => { const b = P.length / 3; P.push(...p.attributes.position.array); UV.push(...p.attributes.uv.array); I.push(...Array.from(p.index.array, i => i + b)); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); return g; },
    // REFS 3 — machine hall unit: alternator vat (10 m diameter, 5 m high), conical lid, collar; origin at ground level
    alternator: () => backdrop(new THREE.CylinderGeometry(5, 5, 5, 16), 2.5),
    hood: () => backdrop(new THREE.CylinderGeometry(2, 5, 1.8, 16), 0.9),
    necklace: () => backdrop(new THREE.CylinderGeometry(5.3, 5.3, 0.6, 16), 0.3),
    exciter: () => backdrop(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 10), 1.2),
    // REFS 3 — lid of a unit at standstill, flush with the ground (driven over): 9 m disc
    lid: () => backdrop(new THREE.CylinderGeometry(4.5, 4.5, 0.12, 16), 0.06),
    // REFS 3 — hall overhead crane (X across the hall, L = span): double girder, trolley, hanging cab, hook
    overheadCrane: (L = 50) => [['steelMat', L, 1.8, 1.2, 0, 0, -1.6, null, 1], ['steelMat', L, 1.8, 1.2, 0, 0, 1.6], ...pair(sd => ['steelMat', 2, 1.6, 8, sd * L / 2, 0, 0]),
      ['trolley', 6, 1.8, 5, -8, 1.8, 0], ['cabin', 3, 2.4, 3, L / 2 - 4, -2.4, 0], ['cable', 0.25, 9, 0.25, -8, -4.5, 0], ['hook', 1.4, 1.2, 0.7, -8, -9.5, 0]],
    // REFS 5 — crest gantry crane, yellow-orange, on rails (X across the road, origin at the middle): two bents outside the parapets, box girder, winch, cab; W = half-width
    gantryGate: (W = 9) => [...pair(sd => [['steelMat', 1.6, 16, 2.4, sd * (W + 3), 8, -3.5, null, 1], ['steelMat', 1.6, 16, 2.4, sd * (W + 3), 8, 3.5, null, 1], ['steelMat', 1.2, 1, 9, sd * (W + 3), 6, 0],
      ['steelMat', 2.8, 1, 10, sd * (W + 3), 0.5, 0], ['wheelPart', 1, 1, 1, sd * (W + 3), 0.5, -4.4], ['wheelPart', 1, 1, 1, sd * (W + 3), 0.5, 4.4]]).flat(),
      ['steelMat', 2 * W + 9, 2.4, 3, 0, 17, -3.2, null, 1], ['steelMat', 2 * W + 9, 2.4, 3, 0, 17, 3.2], ['winch', 6, 3, 8, -W + 4, 19.6, 0], ['cabin', 2.6, 2.4, 2.6, W + 3, 14, 4.6], ['pane', 2.7, 1, 2.7, W + 3, 14.4, 4.6]],
    // REFS 6 — lateral lattice girder of the bridge, along X (L m): top and bottom chords, posts and diagonals every 10 m
    latticeBridge: (L = 160, H = 7) => { const B = [['steelMat', L, 0.8, 0.7, 0, 0.4, 0], ['steelMat', L, 0.7, 0.7, 0, H, 0, null, 1]];
      for (let x = -L / 2; x <= L / 2 + 0.1; x += 10) { B.push(['steelMat', 0.5, H, 0.5, x, H / 2, 0]); if (x < L / 2) B.push(['steelMat', 0.4, Math.hypot(10, H), 0.4, x + 5, H / 2, 0, [0, 0, ((x / 10 | 0) & 1 ? 1 : -1) * Math.atan2(10, H)]]); } return B; },
    // REFS 4 — 500 kV gantry pylon (X = along the cables crossing, origin at the foot): two flared lattice legs, 30 m crossarm, three insulator strings, two guard tips
    pylonGES: () => [...pair(sd => [['lattice', 2.2, 34, 2.2, sd * 9.5, 17, 0, [0, 0, sd * 0.09], 1], ['lattice', 1.6, 34, 1.6, sd * 9.5, 17, 0, [0.16, 0, sd * 0.09]], ['lattice', 1.6, 34, 1.6, sd * 9.5, 17, 0, [-0.16, 0, sd * 0.09]]]).flat(),
      ['lattice', 32, 2.6, 2.2, 0, 35, 0, null, 1], ['lattice', 20, 1.4, 1.4, 0, 31.5, 0], ...pair(sd => ['lattice', 1, 6, 1, sd * 14, 39, 0, [0, 0, -sd * 0.25]]),
      ...[-12, 0, 12].map(x => ['insul', 0.5, 4.5, 0.5, x, 31.3, 0]), ['fire', 0.7, 0.7, 0.7, -14.7, 42, 0]],
    // REFS 4 — substation entry gantry (X across, origin at the foot): two posts and a 24 m lattice crossbeam, three insulators
    gantryBooth: () => [...pair(sd => ['lattice', 1.4, 20, 1.4, sd * 12, 10, 0, null, 1]), ['lattice', 26, 1.6, 1.4, 0, 20, 0], ...[-7, 0, 7].map(x => ['insul', 0.4, 3, 0.4, x, 17.8, 0])],
    // REFS 4 — unit transformer (X = along): tank, finned radiators, conservator, three bushings, plinth
    transformer: () => [['plinth', 12, 1, 8, 0, 0.5, 0], ['vat', 8, 6, 5, 0, 4, 0, null, 1], ...[-3, -1, 1, 3].flatMap(x => pair(sd => ['vane', 1.4, 5, 0.4, x, 4, sd * 2.9])),
      ['vat', 6, 1.4, 1.4, -1, 8.2, -1.6], ...[-2.5, 0, 2.5].map(x => ['insul', 0.5, 3.6, 0.5, x, 8.8, 1]), ['plate', 1.6, 1, 0.05, 0, 4, 2.53]],
    // REFS 4 — substation circuit breaker and disconnector: insulator columns on a frame
    circuitBreaker: () => [['chassis', 5, 2.4, 0.4, 0, 1.2, 0], ...[-2, 0, 2].flatMap(x => [['insul', 0.45, 4, 0.45, x, 4.4, 0], ['chassis', 0.9, 0.6, 0.9, x, 6.6, 0]])],
    // REFS 7 — khrushchevka: 5-storey bar block (w × 15 × 12 m), flat roof, entrance canopies on the +Z side; the facade is one 15 m texture
    barLine: (w = 60, H = 15) => [['facade', w, H, 12, 0, H / 2, 0, null, 1], ['roofM', w + 0.6, 0.6, 12.6, 0, H + 0.3, 0], ...Array.from({ length: Math.round(w / 15) }, (_, k) => ['awning', 3, 0.3, 2, -w / 2 + 7.5 + k * 15, 2.8, 7])],
    // REFS 7 — silo of the site's concrete plant: 12 m diameter shaft, 22 m high
    silo: () => backdrop(new THREE.CylinderGeometry(6, 6, 22, 14), 11),
    // REFS 7 — larch (dark narrow cone) and birch (white trunk, light crown): simple shapes, placed in numbers
    larch: () => backdrop(new THREE.ConeGeometry(2.4, 14, 6), 8),
    foot: () => B(0.4, 2, 0.4),
    shaftBirch: () => backdrop(B(0.32, 8, 0.32), 4),
    canopyB: () => backdrop(new THREE.IcosahedronGeometry(2.6, 0), 8),
    // REFS 1 — angular rock block (flattened dodecahedron), bank riprap and scree
    boulderGES: () => new THREE.DodecahedronGeometry(1, 0),
    // REFS 5 — crest lamppost: shaft, arm toward the road (+X), lantern
    lamppostGES: () => [['shaft', 0.3, 9, 0.3, 0, 4.5, 0], ['shaft', 2.4, 0.2, 0.2, 1.1, 9, 0], ['lampObj', 0.9, 0.3, 0.5, 2.1, 8.8, 0]],
    // Soviet roadside marker: white concrete post with a black band
    bollardGES: () => B(0.35, 0.9, 0.35),
    // REFS 8 — gallery portal (X across, origin at the middle of the roadway, face toward -Z): jambs, lintel with orange bands, rock face above
    portalGES: (W = 9) => [...pair(sd => ['concretePart', 3, 12, 4, sd * (W + 3), 6, 0, null, 1]), ['concretePart', 2 * W + 9, 3, 4, 0, 11.5, 0], ['bandStrip', 2 * W + 2, 1.2, 0.1, 0, 10.6, 2.06], ['numeral', 5, 1.4, 0.1, 0, 12, 2.06], ['bedrock', 2 * W + 34, 16, 10, 0, 19, -6]],
    // REFS 5 — guard booth of the crest and the valley: small concrete house, canopy, lit window
    hut: () => [['concretePart', 4, 3, 3.4, 0, 1.5, 0, null, 1], ['roofM', 5, 0.3, 4.2, 0, 3.15, 0], ['pane', 1.6, 1, 0.1, 0, 1.8, 1.72]],
    // REFS 5 — control tower on the abutment: shaft, glazed room, roof, antenna
    controlTower: () => [['concretePart', 7, 24, 7, 0, 12, 0, null, 1], ['pane', 10, 4, 10, 0, 26, 0], ['concretePart', 11, 1, 11, 0, 28.5, 0], ['steelMat', 0.4, 12, 0.4, 2, 35, 2]],
    // REFS 7 — parked 1970s saloon (X = along): body, roof, windows
    sedan: () => [['carBody', 4.7, 0.75, 1.8, 0, 0.62, 0, null, 1], ['carBody', 2.4, 0.6, 1.6, -0.3, 1.3, 0], ['pane', 2.3, 0.45, 1.65, -0.3, 1.25, 0], ...[-1.5, 1.5].flatMap(x => pair(sd => ['tire', 0.72, 0.72, 0.3, x, 0.36, sd * 0.82]))], // body 25 cm off the ground, four wheels touching: the car reads as parked
    // REFS 7 — road sign on two posts (face toward -Z), 4 × 2 m
    signGES: () => [...pair(sd => ['pole', 0.15, 3.6, 0.15, sd * 1.6, 1.8, 0]), ['plate', 4, 2, 0.08, 0, 3.4, 0]],
    // pioneer camp hut (X = along): plinth, painted plank walls, pitched roof, gables, two windows
    hutPio: () => [['plinth', 9, 4, 6, 0, -1.9, 0], ['intoWall', 8.4, 2.8, 5.4, 0, 1.4, 0, null, 1], ...pair(sd => ['roofM', 9.4, 0.25, 3.7, 0, 3.55, sd * 1.5, [sd * 0.52, 0, 0], 1]), ...pair(sd => ['intoWall', 0.2, 1.5, 3.2, sd * 4.1, 3.2, 0]), ...pair(sd => ['pane', 1.4, 1, 0.1, sd * 2, 1.7, 2.72])],
    // Soviet KB-type tower crane (origin at the middle of the track, jib toward +X): gantry on rails, ballast at the foot, lattice tower, cab at the top, jib raised to 30° held by its stays
    craneKB: () => [...pair(sx => pair(sz => ['steelMat', 0.7, 4.2, 0.7, sx * 2.6, 2.1, sz * 2.4])).flat(), ['steelMat', 7, 0.7, 6.2, 0, 4.5, 0, null, 1], ['ballast', 3, 2.6, 5, -2.4, 6.1, 0, null, 1],
      ['lattice', 2.3, 28, 2.3, 0.9, 18.8, 0, null, 1], ['cabin', 2.2, 2.3, 2.6, 2.6, 30.4, 0, null, 1], ['pane', 0.1, 1.2, 2.2, 3.74, 30.7, 0], ['lattice', 1.4, 8, 1.4, 0.9, 36.8, 0],
      ['lattice', 32, 1.7, 1.7, 15.6, 40.6, 0, [0, 0, 0.5], 1], ['lattice', 8, 1.2, 1.2, -3.2, 33.6, 0, [0, 0, -0.25]],
      ['cable', 29.5, 0.14, 0.14, 15, 44.6, 0, [0, 0, 0.27]], ['cable', 0.14, 34, 0.14, -1, 24, 0, [0, 0, -0.1]], ['cable', 0.1, 19, 0.1, 29.4, 38.6, 0], ['ballast', 0.9, 1.1, 0.9, 29.4, 28.6, 0]],
    // above-ground heating pipe: an eight-sided tube 0.56 m across, one metre long, lying along X (scaled per instance) or upright
    tubeGES: () => { const g = new THREE.CylinderGeometry(0.28, 0.28, 1, 8); g.rotateZ(Math.PI / 2); return g; }, tubeGESv: () => new THREE.CylinderGeometry(0.28, 0.28, 1, 8),
    // REFS 7 — concrete bus shelter, mosaic at the back (face toward +Z)
    shelterBus: () => [['concretePart', 7, 0.4, 3, 0, 3, 0], ['mosaic', 7, 2.8, 0.3, 0, 1.4, -1.3], ...pair(sd => ['concretePart', 0.3, 2.8, 2.6, sd * 3.4, 1.4, 0]), ['bench', 4, 0.5, 0.6, 0, 0.5, -0.8]],
  });
})();
