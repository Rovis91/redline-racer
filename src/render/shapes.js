// Shapes catalogue: the geometry of each scenery object, and nothing else (neither texture nor placement). Metres, origin at the foot of the item.
// Two kinds of entries, all functions of their settings:
//   simple shape — returns a three geometry, placed as is or in number (inst)
//   assembly     — returns a list of boxes [zone, width, height, depth, x, y, z, rotation [rx, ry, rz], casts a shadow];
//                  the zone names the part, so that placement gives it its texture: pose('station', { steelMat: …, lampObj: … }, parent, [x, y, z])
// Textures are in textures.js. The track itself (carriageway, walls, tunnel) is a ribbon generated along the path in game.js, and the car stays there too.
(function () {
  // dim = real dimensions in metres, so that placement sets the texture density; H = typical height of a box stretched in height per instance
  const B = (w, h, d, H = h) => { const g = new THREE.BoxGeometry(w, h, d); g.userData.dim = [w, H, d]; return g; };
  const pair = f => [-1, 1].map(f); // one part on each side
  const wheels = (xs, z, d = 1, w = 0.5) => xs.flatMap(x => pair(sd => [0, 0.785].map(a => [a ? 'tire' : 'wheelPart', d, d, w, x, d / 2, sd * z, [0, 0, a]])).flat()); // wheel = two crossed boxes, the rim and the tyre: an octagon in profile
  // common to all trailers: tandem axles, stands, rear lights, anti-underrun bar
  const trailer = [...wheels([-4.4, -5.6], 0.95), ...pair(sd => ['chassis', 0.2, 0.9, 0.2, 1.4, 0.6, sd * 0.8]), ...pair(sd => ['fire', 0.1, 0.25, 0.5, -6.45, 1.2, sd * 0.85]), ['chassis', 0.15, 0.15, 2.2, -6.3, 0.8, 0]];
  window.SHAPES = {
    // ---------- formes simples ----------
    boxMesh: (w, h, d) => B(w, h, d),                                   // single piece with free dimensions: water slab, distant tower, bridge pier
    blk: () => B(1, 1, 1),                     // unit cube, scaled per instance: buildings, towers, warehouses
    building: (w, H, d) => {                    // city tower: the window texture repeats every 28 m
      const g = B(w, H, d), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(w / 28)), uv.getY(i) * Math.max(1, Math.round(H / 28)));
      return g;
    },
    // piste
    fixtureTunnel: () => B(1.8, 0.25, 3.2), casingRescue: () => B(0.12, 0.7, 1.4),
    chevron: () => new THREE.PlaneGeometry(5, 2.5), pierViaduct: () => B(5, 1, 5, 24), tubeNeon: () => B(0.35, 7, 0.35), reflectionTube: () => new THREE.PlaneGeometry(7, 1.6),
    beam: () => { const g = new THREE.PlaneGeometry(26, 900); g.translate(0, 450, 0); return g; }, hologram: () => new THREE.PlaneGeometry(90, 45),
    // mobilier de route
    mastLamppost: () => B(0.3, 10, 0.3), headLamppost: (l = 3.2) => B(l, 0.25, 0.7), streetlamp: () => B(0.25, 7, 0.25), lantern: () => B(0.7, 0.8, 0.7),
    reflector: () => B(0.18, 0.3, 0.18), cone: () => B(0.4, 0.7, 0.4), beacon: () => B(0.5, 6.2, 0.5), wallMural: () => new THREE.PlaneGeometry(15.8, 5),
    // vegetation
    cedar: () => new THREE.ConeGeometry(3.6, 15, 5), trunk: () => B(0.5, 5.2, 0.5), canopy: () => new THREE.IcosahedronGeometry(3.4, 0),
    trunkPalmtree: () => B(0.55, 1, 0.55, 14), frond: () => new THREE.IcosahedronGeometry(4, 0),
    // vehicles and freight
    auto: () => B(4.1, 1.3, 1.75), container: () => B(12, 2.6, 2.5), wagon: () => B(17, 4.2, 3.2), chimney: () => B(0.8, 2, 2.2), clim: () => B(3, 2, 3.4), reservoir: () => new THREE.CylinderGeometry(2.2, 2.2, 4.4, 8),
    trailer: () => B(8, 3.1, 2.5), cabin: () => B(2.2, 2.6, 2.4), lightsTruck: () => B(0.15, 0.5, 2.3),
    // large landmarks
    pylonHT: () => B(1.6, 48, 1.6), armHT: () => B(1, 1, 16), dome: (r, seg, ann) => new THREE.SphereGeometry(r, seg, ann, 0, 6.283, 0, 1.6),

    // ---------- assemblages ----------
    // track (W = half-width of the carriageway)
    portalTunnel: W => [['portal', 2 * W + 6, 4, 3, 0, 10, 0], ...pair(sd => ['portal', 3, 12, 3, sd * (W + 1.5), 6, 0])],
    // start gantry, X across: two lattice legs on concrete bases outside the guardrails, struts, 1.5 m lattice girder (chequered underneath),
    // rail of three lights (those of the countdown) on each side, two floodlights per side tilted toward the line, lit band with the map name; chequered on the ground
    startLine: W => {
      const xp = W + 2.2, L = 2 * xp + 1.5, dx = 2.8, dy = 2.7, jl = Math.hypot(dx, dy), ja = Math.atan2(dx, dy), th = 0.55;
      return [['ground', 2 * W, 0.06, 4, 0, 0, 0],
        ...pair(sd => [['concretePart', 2.4, 0.7, 2.4, sd * xp, 0.35, 0], ['steelMat', 1.7, 0.12, 1.7, sd * xp, 0.76, 0], ['lattice', 1.5, 7.6, 1.5, sd * xp, 4.6, 0], ['steelMat', 1.7, 0.15, 1.7, sd * xp, 8.45, 0],
          ...pair(a => pair(b => ['steelMat', 0.2, 7.6, 0.2, sd * xp + a * 0.75, 4.6, b * 0.75])).flat(),
          ['steelMat', 0.22, jl, 0.22, sd * (xp - 0.75 - dx / 2), 4.5 + dy / 2, 0, [0, 0, sd * ja]]]).flat(),
        ['lattice', L, 1.5, 1.5, 0, 7.6, 0, null, 1], ...pair(a => pair(b => ['steelMat', L, 0.2, 0.2, 0, 7.6 + a * 0.75, b * 0.75])).flat(), ['checker', L - 1.5, 0.45, 1.6, 0, 6.95, 0],
        ['steelMat', 2 * W + 1.4, 1.9, 0.3, 0, 9.4, 0], ['label', 2 * W + 1, 1.5, 0.4, 0, 9.4, 0],
        ...pair(sz => [['casing', 5.6, 1.2, 0.25, 0, 7.6, sz * 0.85], ...[-1, 0, 1].map(i => ['fire' + (i + 1), 0.9, 0.9, 0.1, i * 1.7, 7.6, sz * 1.0]),
          ...pair(sx => { const x = sx * (W - 1.2), r = [sz * th, 0, 0]; return [['casing', 1, 0.5, 0.7, x, 7.9, sz * 1.15, r], ['lampObj', 0.85, 0.06, 0.55, x, 7.9 - 0.28 * Math.cos(th), sz * (1.15 - 0.28 * Math.sin(th)), r]]; }).flat()]).flat()];
    },
    gantryAd: W => [['screen', 2 * W + 3, 4, 0.5, 0, 11.5, 0], ...pair(sd => ['concretePart', 0.8, 13.5, 0.8, sd * (W + 1.3), 6.75, 0])],
    gantryHighway: W => [['structure', 2 * W + 3, 0.5, 0.5, 0, 10.2, 0], ...pair(sd => ['structure', 0.6, 10.5, 0.6, sd * (W + 1.2), 5.2, 0]), ['signLeft', 6.4, 2.6, 0.3, -3.6, 8.4, 0], ['signRight', 6.4, 2.6, 0.3, 3.6, 8.4, 0]],
    pylonBridge: W => [...pair(sd => ['concretePart', 3, 96, 3, sd * (W + 3.5), 2, 0]), ['concretePart', 2 * W + 10, 3, 3, 0, 46, 0]], // H pylon of a cable-stayed bridge
    // touge: the crossroads at the summit. side = 1 or -1: which side of the road it is on; the minimarket shows its vending machines toward the road
    esplanade: () => [['asphalt', 40, 0.5, 52, 0, -0.1, 0]], traverse: () => [['asphalt', 60, 0.5, 9, 0, -0.1, 0]],
    // minimarket: rendered walls, shop window across the whole front on the road side, sign band, door, parapet, cooling units on the roof, vending machines in front
    minimarket: sideOf => [['intoWall', 11, 4.4, 22, 0, 2.2, 0], ['showcase', 0.2, 3.2, 20, sideOf * -5.55, 1.75, 0], ['door', 0.25, 2.4, 2.2, sideOf * -5.6, 1.2, 4], ['signboard', 0.3, 1.3, 22.6, sideOf * -5.75, 5.05, 0], ['roofM', 11.4, 0.5, 22.4, 0, 4.65, 0],
      ...[-6, 0, 6].map(z => ['clim', 1.6, 1, 1.4, sideOf * 2.5, 5.4, z]), ...[13.5, 15.2].map(z => ['dispenser', 1, 2.2, 1.3, sideOf * -5.8, 1.2, z])],
    station: () => [['steelMat', 13, 0.7, 18, 0, 5.6, 0], ['lampObj', 12.4, 0.12, 17.4, 0, 5.2, 0], ...pair(sd => ['signboard', 0.2, 0.9, 18.2, sd * 6.6, 6.3, 0]), ...pair(sd => ['signboard', 13.2, 0.9, 0.2, 0, 6.3, sd * 9.1]), ['steelMat', 13, 0.2, 18, 0, 6.6, 0], ['islet', 1.6, 0.25, 10, 0, 0.12, 0],
      ...[[-5, -7], [5, -7], [-5, 7], [5, 7]].map(([x, z]) => ['steelMat', 0.5, 5.4, 0.5, x, 2.7, z]), ...[-3.5, 3.5].map(z => ['pumpset', 1, 1.7, 0.7, 0, 0.95, z])],
    totem: () => [['steelMat', 0.4, 8, 0.4, 0, 4, 0], ['price', 0.5, 3.4, 3, 0, 6.6, 0]],
    // parked car, origin on the ground: body, roof on a glazed band, sill, four wheels, lights
    carParked: () => [['carBody', 4.3, 0.6, 1.8, 0, 0.66, 0], ['carBody', 2, 0.1, 1.46, -0.35, 1.42, 0], ['pane', 2.3, 0.46, 1.56, -0.3, 1.15, 0], ['chassis', 4.4, 0.2, 1.7, 0, 0.32, 0], ['lightRed', 0.08, 0.16, 1.6, -2.17, 0.78, 0], ...[-0.6, 0.6].map(z => ['lightWhite', 0.08, 0.16, 0.4, 2.17, 0.68, z]), ...wheels([1.35, -1.35], 0.8, 0.64, 0.22)],
    barrierRail: () => [['striping', 0.25, 0.9, 2.6, 0, 1, 0], ['blinker', 0.3, 0.3, 0.3, 0, 1.7, 0]],
    // Wan-9: quay gantry, legs on the quay (z > 0), lattice jib above the water, trestle and tie rods, machine room, trolley and cab
    crane: () => [...[-12, 12].flatMap(x => [...[22, 48].map(z => ['structure', 2, 44, 2, x, 22, z]), ['lattice', 1.2, 34, 1.2, x, 22, 35, [0.72, 0, 0]], ['structure', 1.6, 1.4, 30, x, 1.2, 35], ...[24, 46].map(z => ['wheelPart', 1.2, 1.2, 0.6, x, 0.6, z])]),
      ...[22, 48].map(z => ['structure', 26, 2.5, 2.5, 0, 42.5, z]), ...[-3, 3].map(x => ['lattice', 1.6, 3.2, 112, x, 46, 6]), ['structure', 8, 0.6, 112, 0, 44.6, 6],
      ...[-3, 3].flatMap(x => [['structure', 1.2, 22, 1.2, x, 57, 44, [-0.25, 0, 0]], ['tieRod', 0.4, 0.4, 66, x, 55, 12, [-0.3, 0, 0]]]), ['machinery', 10, 5, 14, 0, 50.5, 56],
      ['structure', 7, 1.6, 6, 0, 43.5, -12], ['cabin', 3.2, 3, 3.6, 0, 41, -9], ['pane', 3.3, 1.4, 3.7, 0, 41.4, -9], ['structure', 2.6, 0.5, 12.2, 0, 30, -12, [0, 1.5708, 0]]],
    // Wan-9 trucks (X forward, origin on the ground at the centre of the coupling): a cab-forward tractor and a trailer, 12.6 m in all like the crash box of sim.js
    tractor: () => [['chassis', 5, 0.5, 1.9, 3.7, 1, 0], ['cabin', 2.3, 2.5, 2.45, 5, 2.65, 0], ['cabin', 1.7, 0.7, 2.3, 4.7, 4.15, 0, [0, 0, 0.3]], ['pane', 0.1, 1.05, 2.2, 6.17, 3.2, 0], ['pane', 1.1, 0.8, 2.5, 5.45, 3.25, 0],
      ['radiator', 0.1, 0.8, 1.7, 6.17, 2, 0], ['chassis', 0.3, 0.45, 2.45, 6.1, 1.15, 0], ['chassis', 0.6, 0.15, 2.3, 2.2, 1.35, 0], ...pair(sd => ['headlight', 0.1, 0.3, 0.45, 6.2, 1.5, sd * 0.85]), ['lightOrange', 0.12, 0.12, 1.5, 6.16, 3.97, 0],
      ...pair(sd => ['chassis', 1.4, 0.6, 0.35, 3.2, 1, sd * 1.05]), ...wheels([5.3, 2.2, 1], 1)],
    trailerContainer: () => [['chassis', 10, 0.35, 1.9, -1.4, 1.25, 0], ['carBody', 9.8, 2.6, 2.45, -1.4, 2.75, 0], ...trailer],
    trailerTank: () => [['chassis', 10, 0.35, 1.9, -1.4, 1.25, 0], ...[0, 0.785].map(a => ['vat', 9, 2.3, 2.3, -1.6, 2.7, 0, [a, 0, 0]]), ['chassis', 7, 0.12, 0.7, -1.6, 4.1, 0], ['chassis', 0.12, 2.3, 0.5, -6.15, 2.6, 0], ...trailer],
    trailerPlatform: () => [['platform', 10, 0.35, 2.45, -1.4, 1.45, 0], ['chassis', 0.2, 1.6, 2.4, 3.45, 2.4, 0], ...[-4.6, -1.8, 1].flatMap(x => [['coil', 1.7, 1.7, 1.5, x, 2.5, 0], ['coil', 1.7, 1.7, 1.5, x, 2.5, 0, [0, 0, 0.785]], ['strap', 0.15, 2.4, 2.5, x, 2.55, 0]]), ...trailer],
    // ships: origin at the waterline, at the middle, bow toward +X. type 'containers' or 'bulk' (bulk carrier: hold deck, deck cranes)
    ship: (L, type, bays = []) => [['keel', L, 4, 26, 0, -1.5, 0], ['hull', L, 10, 26, 0, 5.5, 0], ['keel', 18.4, 4, 18.4, L / 2, -1.5, 0, [0, 0.785, 0]], ['hull', 18.4, 10, 18.4, L / 2, 5.5, 0, [0, 0.785, 0]],
      ['whiteN', 14, 22, 24, -L / 2 + 14, 21.5, 0], ['portholes', 14.4, 15, 24.4, -L / 2 + 14, 24, 0], ['whiteN', 5, 1.4, 36, -L / 2 + 19, 32, 0], ['chimney', 7, 9, 6, -L / 2 + 5, 36, 0], ['whiteN', 1, 12, 1, L / 2 - 6, 16.5, 0],
      ...(type === 'ferry' ? [['whiteN', L - 50, 14, 24, -5, 17.5, 0], ['portholes', L - 52, 3, 24.4, -5, 13, 0], ['portholes', L - 60, 3, 24.4, -8, 18.5, 0], ['portholes', L - 70, 3, 24.4, -12, 23, 0]]
        : type === 'bulk' ? Array.from({ length: Math.floor((L - 50) / 24) }, (_, k) => [['chock', 16, 2, 18, -L / 2 + 36 + k * 24, 11.5, 0], ...(k % 2 ? [] : [['craneEdge', 1.5, 16, 1.5, -L / 2 + 47 + k * 24, 18.5, 0], ['craneEdge', 1, 1, 22, -L / 2 + 47 + k * 24, 22, 4, [-0.5, 0, 0]]])]).flat()
        : bays.map((n, k) => ['cargo', 22, 2.6 * n, 24, -L / 2 + 34 + k * 24, 10.5 + 1.3 * n, 0]))],
    tug: () => [['keel', 28, 3, 10, 0, -1, 0], ['hull', 28, 3.5, 10, 0, 2.2, 0], ['hull', 7, 3.5, 7, 14, 2.2, 0, [0, 0.785, 0]], ['defense', 30, 1, 10.6, 0, 1.2, 0], ['whiteN', 10, 3.5, 7, 2, 5.7, 0], ['whiteN', 5, 2.4, 6.4, 3.5, 8.6, 0], ['pane', 5.2, 1, 6.6, 3.5, 8.9, 0], ['whiteN', 0.6, 6, 0.6, 1, 12, 0], ['chimney', 1.6, 3, 1.4, -2, 8.5, 0]],
    // yard machines: straddle carrier (straddles a row of containers, X along the containers) and rubber-tyred gantry (straddles a bay, Z across the rows)
    straddleCarrier: () => [...pair(sd => [...pair(sx => ['structure', 0.8, 13, 0.8, sx * 6, 7.1, sd * 2.4]), ['structure', 14, 1.2, 0.8, 0, 13.8, sd * 2.4], ['structure', 14, 0.9, 0.7, 0, 1.4, sd * 2.4], ...[-6, -2, 2, 6].map(x => ['wheelPart', 1.2, 1.2, 0.5, x, 0.6, sd * 2.4])]).flat(),
      ...pair(sx => ['structure', 0.8, 1.2, 5.6, sx * 6, 13.8, 0]), ['structure', 3, 1.6, 1.2, -2, 15.2, 0], ['cabin', 1.8, 2, 1.8, 6.4, 12.4, 2.5], ['pane', 1.9, 1, 1.9, 6.4, 12.7, 2.5]],
    cranePark: s => [...pair(sx => [...pair(sz => ['structure', 1.4, 21, 1.4, sx * s / 2, 11.5, sz * 7]), ['structure', 1.4, 1.2, 16, sx * s / 2, 1.2, 0], ['structure', 1.6, 2, 15.6, sx * s / 2, 22.5, 0], ...pair(sz => ['wheelPart', 1.2, 1.2, 0.6, sx * s / 2, 0.6, sz * 7])]).flat(),
      ...pair(sz => ['structure', s + 3, 2, 1.4, 0, 22.5, sz * 7]), ['structure', 4.5, 2.2, 16, 4, 24.6, 0], ['cabin', 2.2, 2.2, 2, 4, 20.6, 6], ['pane', 2.3, 1, 2.1, 4, 20.9, 6], ['structure', 2.6, 0.5, 12.2, 4, 15, 0], ['machinery', 3, 3, 5, -s / 2 - 2.6, 4, 0]],
    // 35 m lighting mast with a ring of floodlights
    mastLighting: () => [['steelMat', 0.9, 35, 0.9, 0, 17.5, 0], ['steelMat', 5, 0.4, 5, 0, 35, 0], ...pair(sx => pair(sz => ['lampObj', 1.3, 0.5, 1.3, sx * 1.8, 34.6, sz * 1.8])).flat()],
    // Wan-9 immersed tunnel, placed in the road frame at the portal (X across, Z toward the rear: the driver arrives from +Z); fits behind the lit portal of game.js
    headTunnel: W => [...pair(sd => ['concretePart', 16, 17, 5, sd * (W + 9.5), 8.5, -4]), ['concretePart', 2 * W + 4, 8.5, 5, 0, 12.75, -4], ['cornice', 2 * W + 38, 1, 6.5, 0, 17.5, -4], ['label', 2 * W - 1, 2.6, 0.3, 0, 15, -1.4],
      ['lights', 2 * W - 3, 1.2, 0.3, 0, 12.7, -1.4],
      ['limit', 2 * W + 2, 0.7, 0.4, 0, 6.1, 26], ...pair(sd => ['structure', 0.4, 6.5, 0.4, sd * (W + 1), 3.25, 26]), ['signPanel', 3, 3, 0.2, 0, 8.3, 26]],
    // tunnel ventilation tower: louvred shaft, fan room, two chimneys
    ventilationTower: (h = 30) => [['shutters', 14, h, 11, 0, h / 2, 0], ['concretePart', 15, 1.2, 12, 0, h + 0.6, 0], ['shutters', 10, 8, 8, 0, h + 5.2, 0], ...[-2.5, 2.5].map(x => ['concretePart', 2.4, 6, 2.4, x, h + 12, 0]), ['concretePart', 20, 6, 15, 4, 3, 2]],
    islandVentilation: () => [['quay', 64, 6, 40, 0, -3, 0], ['quay', 40, 6, 40, 0, -3, 0, [0, 0.785, 0]], ['defense', 66, 1, 42, 0, -0.2, 0]],
    // big wheel: rotor (double rim, spokes, hub), to turn around Z; A-frame support on the ground, hub at H metres
    wheelRotor: R => [...Array.from({ length: 48 }, (_, k) => { const a = (k + 0.5) / 48 * 6.2832; return pair(z => ['rimPart', 1.1, 2 * R * Math.sin(Math.PI / 48) + 0.4, 1.1, Math.cos(a) * R, Math.sin(a) * R, z * 3.5, [0, 0, a]]); }).flat(),
      ...Array.from({ length: 16 }, (_, k) => { const a = k / 16 * 6.2832; return [...pair(z => ['arcRadius', 0.35, R, 0.35, Math.cos(a) * R / 2, Math.sin(a) * R / 2, z * 3.5, [0, 0, a - Math.PI / 2]]), ['rimPart', 0.6, 0.6, 7, Math.cos(a) * R, Math.sin(a) * R, 0]]; }).flat(),
      ['hub', 5, 5, 10, 0, 0, 0]],
    wheelSupport: H => { const a = Math.atan(H * 0.4 / H), l = Math.hypot(H, H * 0.4); return [...pair(sd => pair(z => ['steelMat', 1.6, l, 1.6, sd * H * 0.2, -H / 2, z * 10, [0, 0, sd * a]])).flat(), ...pair(z => ['steelMat', H * 0.45, 1, 1, 0, -H * 0.55, z * 10]), ['steelMat', 1.6, 1.6, 22, 0, 0, 0], ['plinth', 50, 5, 30, 0, -H + 2.5, 0]]; },
    gondola: () => B(2.4, 2.6, 2.4), berm: () => B(30, 1, 8.4, 4), buoy: () => B(1.4, 2.6, 1.4),
    // Paris
    arch: () => [...[-14, 14].map(x => ['stone', 12, 36, 16, x, 18, 0]), ['stone', 40, 14, 16, 0, 43, 0]],
    basilica: () => [['chalk', 40, 24, 30, 0, 12, 0], ['chalk', 9, 46, 9, 0, 23, -22]], // nave and bell tower; the domes are simple shapes placed on top
    // canal
    signAd: angle => [['mat', 1, 24, 1, 0, 12, 0], ['poster', 1, 8, 16, 0, 22, 0, [0, angle, 0]]],
    bridgeCanal: () => [['concretePart', 16, 3, 640, 0, 17.5, 0, null, 1], ...[-8.5, 8.5].map(x => ['concretePart', 1, 2, 640, x, 20, 0]), // deck, railings, then V-shaped arches above
      ...[-170, 0, 170].flatMap(z => [-0.42, 0.42].map(a => ['concretePart', 2, 3, 96, 0, 30, z + (a > 0 ? 42 : -42), [a, 0, 0]]))],
    // covered wagon, origin at the rail: body, frame, two two-axle bogies, buffers, couplings
    wagonCovered: () => [['carBody', 17, 3.6, 3.1, 0, 3, 0], ['roofM', 17.2, 0.25, 3.3, 0, 4.9, 0], ['chassis', 17.6, 0.5, 2.6, 0, 1.05, 0], ...[-6, 6].flatMap(x => [['chassis', 3, 0.5, 2.2, x, 0.6, 0], ...wheels([x - 1, x + 1], 0.8, 0.9, 0.2)]), ...pair(sx => pair(z => ['chassis', 0.4, 0.35, 0.35, sx * 9, 1.05, z * 0.8])).flat()],
    // palm tree: a crown of eight drooping fronds, origin at the top of the trunk
    fronds: () => Array.from({ length: 8 }, (_, k) => { const a = k / 8 * 6.2832; return ['frond', 5.5, 0.15, 1, Math.cos(a) * 2.4, -0.6, Math.sin(a) * 2.4, [0, -a, -0.45 - (k % 2) * 0.2]]; }),
    pumpsetPlinth: () => [['iron', 7, 0.8, 2.4, 0, 0.4, 0], ...[-0.3, 0.3].map(a => ['iron', 0.5, 7.4, 0.5, a * 4, 4, 0, [0, 0, a]])],
    pumpsetBalancier: () => [['minium', 9, 0.7, 0.7, 0.6, 0, 0], ['minium', 1.4, 2.4, 1, 5.2, -0.6, 0], ['iron', 1.6, 1.6, 1.6, -4, -0.4, 0]], // tourne autour de son origine
    waterTower: () => [...[[-4, -4], [4, -4], [-4, 4], [4, 4]].map(([x, z]) => ['iron', 0.8, 26, 0.8, x, 13, z]), ['vat', 13, 9, 13, 0, 30, 0], ['iron', 14, 1, 14, 0, 35, 0]],
    // distant peak: four-sided pyramid, 1 m base and height, to be scaled; origin at the base
    peakAt: () => { const g = new THREE.ConeGeometry(0.7, 1, 4); g.translate(0, 0.5, 0); return g; },
    // gantry announcing a jump, across the road of half-width W: two masts, a chevron banner
    gantryJump: (W = 8) => [...[-1, 1].map(sd => ['steelMat', 0.5, 8, 0.5, sd * (W + 0.8), 4, 0, null, 1]), ['streamer', 2 * W + 2.1, 1.8, 0.2, 0, 7.1, 0, null, 1]],
  };
})();
