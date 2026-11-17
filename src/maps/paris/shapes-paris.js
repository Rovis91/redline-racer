// Shapes specific to "paris": complements the catalogue in shapes.js (same conventions: simple shape = geometry, assembly = list of zoned boxes). See docs/methods/SCENERY.md.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // edge of a round island: open cylinder of radius r and height hh, texture repeated every 8 m (the stone tile)
    cylinderOpen: (r, hh, n) => { const g = new THREE.CylinderGeometry(r, r, hh, n, 1, true), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6.2832 * r / 8, uv.getY(i) * hh / 8); return g; },
    // ground floor: origin at the pavement at the foot of the façade, X along the façade, Z toward the street
    shopfront: () => { const g = new THREE.BoxGeometry(13, 4.4, 0.5); g.translate(0, 2.2, 0.25); return g; },
    store: () => [['cloth', 11.5, 0.08, 2.6, 0, 3.9, 1.2, [0.42, 0, 0]], ['cloth', 11.5, 0.4, 0.06, 0, 3.15, 2.42], ...pair(sx => ['iron', 0.06, 0.06, 2.6, sx * 5.6, 3.6, 1.2, [0.42, 0, 0]])],
    // café terrace: three marble tables on cast-iron pedestals, two cane chairs each, on 1.4 m of pavement
    terrace: () => [-1, 0, 1].flatMap(k => [['platform', 0.65, 0.04, 0.65, k * 3.6, 0.75, 1.0], ['iron', 0.08, 0.73, 0.08, k * 3.6, 0.37, 1.0], ['iron', 0.45, 0.04, 0.45, k * 3.6, 0.02, 1.0],
      ...pair(sx => [['cane', 0.45, 0.05, 0.42, k * 3.6 + sx * 0.75, 0.46, 1.0], ['cane', 0.06, 0.48, 0.42, k * 3.6 + sx * 0.97, 0.72, 1.0], ...pair(z => ['iron', 0.04, 0.46, 0.04, k * 3.6 + sx * 0.75, 0.23, 1.0 + z * 0.18])]).flat()]),
    // pharmacy cross as a flag: bracket, lit cross perpendicular to the façade (readable along the street)
    crossPharmacy: () => [['iron', 0.08, 0.08, 0.7, 0, 5.2, 0.35], ['crossSign', 0.22, 1.3, 0.42, 0, 5.2, 1.25], ['crossSign', 0.22, 0.42, 1.3, 0, 5.2, 1.25]],
    // newspaper kiosk: body with panels, counter, dome roof with facets and a lantern
    kiosk: () => [['payload', 3, 2.6, 2.2, 0, 1.3, 0, null, 1], ['roofM', 3.6, 0.25, 2.8, 0, 2.72, 0], ['roofM', 3.1, 0.35, 2.3, 0, 3.0, 0], ['roofM', 2.3, 0.35, 1.6, 0, 3.3, 0], ['roofM', 1.3, 0.3, 0.9, 0, 3.58, 0],
      ['roofM', 0.25, 0.7, 0.25, 0, 4.0, 0], ['counterTop', 2.4, 0.08, 0.5, 0, 1.1, 1.3], ['roofM', 3.4, 0.08, 1.1, 0, 2.45, 1.55, [-0.3, 0, 0]]],
    // stone bridge over the Seine, in the road frame at the tunnel entrance (X across, positive on the city side; Z toward the back of the course):
    // city-side abutment, an arch over the riverside road, then flattened arches on piers with cutwaters all the way to the other bank (L m); deck at 12 m, parapets.
    // y0 = water level under the road (negative). Zones: stone, deck (roadway top), iron (railings, lamp posts)
    bridge: (L, y0) => {
      const Z = 10, D = 16, B = [['stone', 32, 13.5 - y0, D, 24.5, (13.5 + y0) / 2, Z, null, 1], ['deck', L + 40, 0.3, D - 1.2, 40 - (L + 40) / 2, 13.65, Z], ['stone', L + 40, 1.6, D, 40 - (L + 40) / 2, 12.7, Z, null, 1],
        ...pair(sz => ['stone', L + 40, 1.1, 0.6, 40 - (L + 40) / 2, 14.3, Z + sz * (D / 2 - 0.3)]), ['stone', L + 41, 0.4, D + 0.8, 40 - (L + 40) / 2, 13.4, Z]];
      const arch = (xa, xb, ys) => { const r = (xb - xa) / 2, m = (xa + xb) / 2; for (const a of [0.3, 0.6, 0.9, 1.2]) { const e = r * (1 - Math.cos(a)), y = ys + (12 - ys) * Math.sin(a) ** 0.8; B.push(...pair(sd => ['stone', e, 12 - y, D, m + sd * (r - e / 2), (y + 12) / 2, Z])); } };
      arch(-11, 8.5, 7); // over the riverside road
      for (let x = -14, k = 0; x > -L; x -= 42, k++) {
        B.push(['stone', 6, 12 - y0 + 2, D, x, (12 + y0 - 2) / 2, Z, null, 1], ...pair(sz => ['stone', 4.2, 7 - y0 + 2, 4.2, x, (7 + y0 - 2) / 2, Z + sz * (D / 2 + 1.4), [0, 0.785, 0]])); // pier up to the deck, cutwaters
        if (x - 42 > -L) arch(x - 39, x - 3, 7); else B.push(['stone', 26, 13.5 - y0, D, -L - 4, (13.5 + y0) / 2, Z, null, 1]); // abutment on the other bank
        B.push(...pair(sz => ['iron', 0.3, 5, 0.3, x, 16.5, Z + sz * (D / 2 - 0.3)]), ...pair(sz => ['lampObj', 0.7, 0.8, 0.7, x, 19.2, Z + sz * (D / 2 - 0.3)]));
      }
      return B;
    },
    // moored barge, origin at the waterline, long along the X axis: black hull, rubbing strake, wooden deck, wheelhouse at the stern, glazed roof, planter boxes
    barge: () => [['hull', 38, 2.4, 5.1, 0, -0.4, 0, null, 1], ['hull', 3, 2.4, 3.6, 19.5, -0.4, 0], ['rubStrip', 38.2, 0.25, 5.3, 0, 0.85, 0], ['bridge', 37, 0.1, 4.6, 0, 0.82, 0],
      ['roof', 18, 1.6, 3.6, 2, 1.7, 0, null, 1], ['roofM', 18.4, 0.15, 3.9, 2, 2.55, 0], ['roof', 4, 2.6, 3, -14.5, 2.2, 0, null, 1], ['roofM', 4.4, 0.15, 3.4, -14.5, 3.55, 0],
      ['greens', 1.2, 0.7, 1.2, 14, 1.2, 1.5], ['greens', 1.2, 0.9, 1.2, 15.8, 1.3, -1.4], ['greens', 0.9, 0.6, 0.9, -8.5, 1.2, 1.7]],
    // bronze mooring ring set into the quay wall, origin at the setting, the wall is the plane X = 0, the ring hangs toward -Y
    annulus: () => [['iron', 0.25, 0.25, 0.25, 0, 0, 0], ...pair(sz => ['iron', 0.08, 0.5, 0.08, 0.12, -0.35, sz * 0.22]), ['iron', 0.08, 0.08, 0.5, 0.12, -0.6, 0]],
    // island in the river, long along the X axis: stone quay walls from the water (y0) to the ground (y1), cutwaters at both ends; zones: quay (stone), ground (top)
    island: (L, D, y0, y1) => { const h = y1 - y0, c = (y0 + y1) / 2, p = D / Math.SQRT2; return [['quay', L, h, D, 0, c, 0, null, 1], ...pair(sx => ['quay', p, h, p, sx * L / 2, c, 0, [0, 0.785, 0]]),
      ['ground', L, 0.1, D - 0.4, 0, y1 + 0.05, 0], ...pair(sx => ['ground', p - 0.3, 0.1, p - 0.3, sx * L / 2, y1 + 0.05, 0, [0, 0.785, 0]])]; },
    // Gothic cathedral, long along the X axis: west façade at -X (two square towers with sound-louvres, gallery, rose window, three portals), high nave and side aisles, transept with roses,
    // choir and apse, flying buttresses over the side aisles down to pinnacled abutments, lead roofs, spire at the crossing. Zones: wall (walls with windows), stone, lead, rose, dark (portals, sound-louvres)
    cathedral: () => {
      const B = [], roofM = (x, l, w, y, ax = 'x') => { for (const [k, f] of [[0, 1], [1, 0.66], [2, 0.33]]) B.push(ax === 'x' ? ['lead', l, 3.4, w * f, x, y + 1.7 + k * 3.4, 0] : ['lead', w * f, 3.4, l, x, y + 1.7 + k * 3.4, 0]); };
      B.push(['intoWall', 100, 33, 14, -5, 16.5, 0, null, 1], ...pair(sz => ['intoWall', 92, 18, 12, -1, 9, sz * 13, null, 1]), ...pair(sz => ['lead', 92, 1.2, 12.6, -1, 18.4, sz * 13]));
      roofM(-5, 100, 14, 33); roofM(5, 50, 14, 33, 'z');
      B.push(['intoWall', 14, 33, 50, 5, 16.5, 0, null, 1], ...pair(sz => ['pink', 0.3, 10, 10, 5, 24, sz * 25.1]), ...pair(sz => ['dark', 5, 8, 0.3, 5, 4, sz * 25.1]));
      for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.55; B.push(['intoWall', 6, 33, 7, 45 + Math.cos(a) * 4.5, 16.5, Math.sin(a) * 4.5, [0, -a, 0], 1], ['intoWall', 6, 18, 9, 47 + Math.cos(a) * 12, 9, Math.sin(a) * 12, [0, -a, 0]]); }
      for (const x of [-38, -29, -20, -11, 20, 29, 38, 47]) for (const sz of [-1, 1]) {
        const zx = x === 47 ? 0.6 : 1; // the apse has its own, shorter ones
        B.push(['stone', 2.2, 23, 3, x, 11.5, sz * 21 * zx], ['stone', 1, 6, 1, x, 26, sz * 21 * zx], ['stone', 1.6, 2, Math.hypot(14 * zx, 7) + 1, x, 27, sz * (7 + 14 * zx / 2), [sz * Math.atan2(7, 14 * zx), 0, 0]]);
      }
      B.push(['stone', 16, 43, 42, -62, 21.5, 0, null, 1], ['pink', 0.3, 11, 11, -70.1, 26, 0], ...[-12, 0, 12].map(z => ['dark', 0.4, z ? 8 : 10, z ? 5 : 6, -70.1, z ? 4 : 5, z]),
        ['stone', 16.4, 1, 42.4, -62, 15, 0], ['stone', 16.4, 1, 42.4, -62, 34, 0], ['stone', 4, 4, 16, -66, 45, 0]);
      for (const sz of [-1, 1]) B.push(['stone', 14, 26, 14, -63, 56, sz * 14, null, 1], ['stone', 14.6, 1, 14.6, -63, 69.5, sz * 14], ...[-1, 1].map(o => ['dark', 0.3, 14, 2.4, -70.1, 55, sz * 14 + o * 3]), ...[-1, 1].map(o => ['dark', 2.4, 14, 0.3, -63 + o * 3, 55, sz * (14 + 7.1)]));
      [[3, 8], [2.2, 10], [1.5, 12], [0.9, 14], [0.4, 12]].reduce((y, [w, hh]) => { B.push(['lead', w, hh, w, 5, y + hh / 2, 0]); return y + hh; }, 41);
      return B;
    },
    // river bank, long along the X axis: quay wall from the water (y0) to the ground (y1); zones: quay, ground
    shore: (L, D, y0, y1) => [['quay', L, y1 - y0, D, 0, (y0 + y1) / 2, 0, null, 1], ['ground', L, 0.1, D, 0, y1 + 0.05, 0]],
    // stone tunnel head under the bridge, in the road frame at the portal (X across, Z toward the back): wall pierced by a 17 × 8 m opening
    // behind the bridge, relieving arch of eleven voussoirs, plaque; y0 = water-level height. Zones: stone, voussoir, plaque
    headTunnelParis: y0 => { const B = [['stone', 8.5, 12 - y0, 1, -12.75, (12 + y0) / 2, 2.4], ['stone', 17, 4, 1, 0, 10, 2.4], ['keystone', 18.4, 0.6, 1.6, 0, 7.7, 2.6]], R = 17.9, cy = 9.6 - R;
      for (let k = 0; k < 11; k++) { const a = (k / 10 - 0.5) * 1.09; B.push(['keystone', 1.75, 1.3, 0.8, Math.sin(a) * (R + 0.65), cy + Math.cos(a) * (R + 0.65), 3.2, [0, 0, -a]]); }
      B.push(['plate', 11, 1.2, 0.15, 0, 11.4, 3.0]); return B; },
    // square furniture. Granite bollard of the central island (chains are placed separately); bronze slab and flame under the arch, flat: one drives over them
    bollard: () => [['stone', 0.55, 0.75, 0.55, 0, 0.375, 0], ['stone', 0.4, 0.18, 0.4, 0, 0.84, 0]],
    flame: () => [['bronze', 2.6, 0.05, 1.6, 0, 0.025, 0], ['bronze', 0.9, 0.1, 0.9, 0, 0.1, 0], ['fire', 0.3, 0.3, 0.3, 0, 0.3, 0], ['fire', 0.16, 0.22, 0.16, 0, 0.55, 0]],
    // on the pavement, origin at the ground, Z toward the roadway: slatted public bench, Morris column (eight-sided shaft, canopy, dome and finial), metro entrance
    // (dark stairwell, cast-iron surround open toward the roadway, mast with illuminated sign and globe)
    bench: () => [['vert', 1.8, 0.06, 0.5, 0, 0.45, 0], ['vert', 1.8, 0.4, 0.06, 0, 0.75, -0.25], ...pair(sx => ['iron', 0.08, 0.45, 0.5, sx * 0.8, 0.225, 0])],
    columnMorris: () => [['iron', 1.5, 0.3, 1.5, 0, 0.15, 0], ['payload', 1.3, 3.2, 1.3, 0, 1.9, 0, null, 1], ['payload', 1.3, 3.2, 1.3, 0, 1.9, 0, [0, 0.785, 0], 1], ['roofM', 1.9, 0.18, 1.9, 0, 3.6, 0], ['roofM', 1.9, 0.18, 1.9, 0, 3.6, 0, [0, 0.785, 0]],
      ['roofM', 1.2, 0.35, 1.2, 0, 3.85, 0], ['roofM', 0.6, 0.4, 0.6, 0, 4.2, 0], ['roofM', 0.15, 0.5, 0.15, 0, 4.6, 0]],
    mouthMetro: () => [['hole', 3, 0.03, 1.6, 0, 0.015, 0], ['iron', 3.2, 0.9, 0.08, 0, 0.45, -0.85], ...pair(sx => ['iron', 0.08, 0.9, 1.7, sx * 1.6, 0.45, 0]),
      ['iron', 0.12, 3.6, 0.12, 1.9, 1.8, 0.9], ['signPanel', 1.3, 0.45, 0.1, 1.9, 3.4, 0.9], ['lampObj', 0.35, 0.35, 0.35, 1.9, 3.85, 0.9]],
    // Arc de Triomphe: 45 m wide (X), 22 deep (Z), 50 high. Great arch 14.6 m under 29 m along the Z axis, side arches 8.4 m under 18.7 m along the X axis;
    // four piers with plinths and sculpted groups, tiered vaults, cornice, frieze, attic with escutcheons. Zones: stone, relief (sculpted parts)
    arc: () => {
      const L = [];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.push(['stone', 15.2, 22, 6.8, sx * 14.9, 11, sz * 7.6, null, 1], ['stone', 16, 1.4, 7.6, sx * 14.9, 0.7, sz * 7.6],
        ['relief', 8, 11, 0.6, sx * 14.9, 9.5, sz * 11.1], ['stone', 15.8, 0.7, 7.4, sx * 14.9, 22.2, sz * 7.6]);
      for (const sx of [-1, 1]) L.push(['stone', 15.2, 7.2, 22, sx * 14.9, 25.6, 0, null, 1], ['stone', 15.2, 3.3, 8.4, sx * 14.9, 20.35, 0], ...pair(sz => ['stone', 15.2, 2.6, 1.3, sx * 14.9, 17.4, sz * 3.55]));
      // vault of the great arch: bands whose edge follows the 7.3 m semicircle
      for (const a of [0.35, 0.7, 1.05, 1.35]) { const y = 22 + 7.3 * Math.sin(a), e = 7.3 * (1 - Math.cos(a)); L.push(...pair(sx => ['stone', e, 29.2 - y + 0.01, 22, sx * (7.3 - e / 2), (y + 29.2) / 2, 0])); }
      L.push(['stone', 45, 19.8, 22, 0, 39.1, 0, null, 1], ['relief', 45.4, 2.6, 22.4, 0, 34.6, 0], ['stone', 46.6, 1.2, 23.6, 0, 37.5, 0], ['stone', 46, 1, 23, 0, 49.5, 0], ['stone', 45.6, 0.6, 22.6, 0, 29.6, 0]);
      for (const x of [-18, -9, 0, 9, 18]) L.push(...pair(sz => ['relief', 3, 3, 0.4, x, 43.5, sz * 11.2]));
      return L;
    },
    // delivery truck double-parked (sim.js obstacle: 9 × 2.5 m), origin at the ground at the centre, front toward +X: refrigerated box at the rear, cab, wheels, orange hazard lights at the four corners
    truckDelivery: () => [['carBody', 6.2, 2.9, 2.5, -1.3, 2.05, 0, null, 1], ['chassis', 8.8, 0.4, 2.2, 0, 0.75, 0], ['cabin', 2.4, 2.3, 2.4, 3.2, 1.95, 0], ['pane', 0.1, 0.9, 2.1, 4.42, 2.45, 0],
      ...pair(sz => ['pane', 1.2, 0.8, 0.06, 3.4, 2.5, sz * 1.21]), ...[-3.2, 0.2, 3.2].flatMap(x => pair(sz => ['tire', 1, 1, 0.3, x, 0.5, sz * 1.05])),
      ...pair(sz => ['orange', 0.1, 0.2, 0.3, 4.45, 1.2, sz * 1.05]), ...pair(sz => ['orange', 0.1, 0.25, 0.25, -4.42, 1.3, sz * 1.0]), ...pair(sz => ['redTone', 0.1, 0.3, 0.3, -4.42, 0.9, sz * 1.0])],
    // bicycle newspaper boy, origin at the ground, rides toward +X: two thin wheels, frame, cyclist (legs, torso, head with cap), newspaper bag on the rear rack
    courier: () => [...pair(sx => ['tire', 0.7, 0.7, 0.05, sx * 0.55, 0.35, 0]), ['rackFrame', 1.1, 0.05, 0.05, 0, 0.6, 0], ['rackFrame', 0.05, 0.5, 0.05, -0.15, 0.75, 0], ['rackFrame', 0.05, 0.05, 0.5, 0.45, 1.0, 0],
      ['holdTime', 0.15, 0.6, 0.3, -0.1, 0.85, 0], ['holdTime', 0.35, 0.6, 0.4, 0.0, 1.4, 0, [0, 0, -0.35]], ['skin', 0.22, 0.24, 0.22, 0.12, 1.85, 0], ['holdTime', 0.3, 0.06, 0.26, 0.17, 1.98, 0],
      ['newspapers', 0.5, 0.3, 0.45, -0.55, 0.85, 0]],
    // the butte's staircase, origin at the bottom at the pavement's edge, climbing toward -Z (away from the street): n steps of 17 × 35 cm over 3.5 m wide, stone walls and handrail
    stairsKnoll: (n = 22) => { const B = []; for (let k = 0; k < n; k++) B.push(['stairStep', 3.5, 0.17 * (k + 1), 0.36, 0, 0.085 * (k + 1), -0.35 * k - 0.18]);
      for (let k = 0; k < n; k += 2) B.push(...pair(sx => ['lowwall', 0.4, 0.17 * (k + 2) + 0.7, 0.72, sx * 1.95, (0.17 * (k + 2) + 0.7) / 2, -0.35 * k - 0.36])); // walls in tiers: they follow the slope, the steps can be seen
      B.push(['iron', 0.06, 0.06, 0.35 * n * 1.12, 0, 0.085 * n + 1.0, -0.175 * n, [Math.atan(0.17 / 0.35), 0, 0]]); return B; },
    // perched pigeon, origin at the ground, head toward +X (instanced by the dozens: a single grey block, darker head)
    pigeon: () => [['feather', 0.3, 0.16, 0.15, 0, 0.14, 0], ['feather', 0.12, 0.03, 0.14, -0.2, 0.18, 0], ['headEl', 0.09, 0.1, 0.08, 0.17, 0.26, 0]],
    // shutter of a shopfront, origin at the top of the opening, hangs toward -Y; scaled in height as it rises
    curtain: () => { const g = new THREE.BoxGeometry(11.5, 3, 0.08); g.translate(0, -1.5, 0); return g; },
  });
})();
