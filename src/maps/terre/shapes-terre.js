// Shapes specific to "terre" (Spéciale des Ocres): completes the shapes.js catalogue (simple shape = geometry, assembly = list of boxes with zones). See docs/methods/SCENERY.md.
(function () {
  const A = 0.9; // slope of the spectator bank
  Object.assign(SHAPES, {
    // ochre butte: seven-sided truncated cone with flat top, 1 m radius at the base and as tall, to be scaled; origin at base
    knoll: () => { const g = new THREE.CylinderGeometry(0.62, 1, 1, 7); g.translate(0, 0.5, 0); return g; },
    // umbrella pine crown: flattened ball of 1 m radius, to be scaled (also serves, very small, as a garrigue bush)
    pineParasol: () => { const g = new THREE.IcosahedronGeometry(1, 0); g.scale(1, 0.42, 1); return g; },
    // round hay bale lying down, axis across (X); origin at ground
    bale: () => { const g = new THREE.CylinderGeometry(0.75, 0.75, 1.3, 8); g.rotateZ(Math.PI / 2); g.translate(0, 0.75, 0); return g; },
    // spectator bank, L m along X: an earth mound, a banner on each flank, and the spectators in two back-to-back panels (each faces its side)
    embankPublic: (L = 14) => [['embank', L, 1.6, 4.4, 0, 0.8, 0, null, 1], ...[-1, 1].map(sd => ['ribbonFn', L, 1.1, 0.1, 0, 0.95, sd * 2.25]),
      ['crowd', L, 0.3, 2.6, 0, 2.6, -0.85, [-A, 0, 0], 1], ['crowd', L, 0.3, 2.6, 0, 2.6, 0.85, [A, Math.PI, 0], 1]],
    // hamlet farmhouse, ridge along Z (the road): stone walls, two-pitch tile roof, shutters and door on both facades; origin at ground, to be sunk half a meter
    farm: () => [['intoWall', 7, 5.5, 11, 0, 2.75, 0, null, 1], ['intoWall', 3.4, 1.2, 11, 0, 6, 0], ...[-1, 1].flatMap(sd => [['roofM', 4.7, 0.35, 11.8, sd * 1.85, 6.2, 0, [0, 0, -sd * 0.38], 1],
      ...[-3.4, 0, 3.4].map(z => ['shutter', 0.15, 1.5, 1, sd * 3.5, 3.9, z]), ['shutter', 0.15, 2.2, 1.2, sd * 3.5, 1.6, 1.7]])],
    // 6 m square service marquee: four posts, two-tier canvas roof, a tarpaulin at the back (-Z); origin at ground
    marquee: () => [...[-1, 1].flatMap(a => [-1, 1].map(b => ['pole', 0.12, 2.8, 0.12, a * 2.9, 1.4, b * 2.9])), ['cloth', 6.2, 0.5, 6.2, 0, 3.05, 0, null, 1], ['cloth', 3.6, 0.5, 3.6, 0, 3.5, 0], ['cloth', 6, 2.6, 0.08, 0, 1.5, -2.95]],
    // service van, front toward +X: high body, windshield and cab windows, roof rack
    van: () => [['carBody', 5.4, 2.1, 2.1, 0, 1.55, 0, null, 1], ['pane', 0.1, 0.8, 1.9, 2.72, 2, 0], ['pane', 1.1, 0.7, 2.14, 1.9, 2.05, 0], ['chassis', 5.3, 0.3, 2, 0, 0.45, 0], ['chassis', 3, 0.1, 1.6, -0.8, 2.7, 0],
      ...[-1.7, 1.7].flatMap(x => [-1, 1].map(sd => ['tire', 0.75, 0.75, 0.3, x, 0.38, sd * 0.95]))],
    // chapel: nave along Z, two-pitch tile roof, square bell tower at the apse (-Z) topped with tiles, door in the gable (+Z); origin at ground
    chapel: () => [['intoWall', 6, 5, 11, 0, 2.5, 0, null, 1], ['intoWall', 2.6, 1.2, 11, 0, 5.4, 0], ...[-1, 1].map(sd => ['roofM', 4.2, 0.35, 11.6, sd * 1.6, 5.7, 0, [0, 0, -sd * 0.5], 1]),
      ['intoWall', 3.2, 12, 3.2, 0, 6, -6.5, null, 1], ['roofM', 3.8, 0.5, 3.8, 0, 12.2, -6.5], ['roofM', 2.2, 1.2, 2.2, 0, 13, -6.5], ['shutter', 1.2, 2.4, 0.15, 0, 1.2, 5.5], ...[-1, 1].map(sd => ['shutter', 0.15, 1.4, 0.8, sd * 1.6, 10, -6.5])],
    // TV helicopter, nose toward +X: glazed cabin, fuselage, tail boom, fin and tail rotor, skids, camera ball under the nose; the main rotor is separate (rotorHeli) so it can turn. Origin at the center of the cabin
    chopper: () => [['carBody', 3.6, 1.8, 1.9, 0, 0, 0, null, 1], ['pane', 1.4, 1.3, 1.7, 1.9, 0.2, 0, [0, 0, -0.35]], ['pane', 1.6, 0.8, 1.95, 0.4, 0.35, 0], ['carBody', 2, 0.7, 1.2, -0.4, 1.1, 0],
      ['carBody', 5.6, 0.45, 0.45, -4.4, 0.35, 0, [0, 0, 0.06], 1], ['carBody', 1.3, 1.6, 0.12, -7, 1.05, 0, [0, 0, -0.35]], ['carBody', 1.6, 0.1, 0.6, -6.6, 0.45, 0], ['chassis', 0.5, 0.5, 0.5, 2.2, -0.95, 0],
      ...[-1, 1].flatMap(sd => [['chassis', 3.4, 0.12, 0.12, 0.2, -1.6, sd * 1], ['chassis', 0.1, 0.7, 0.1, 1, -1.25, sd * 0.9], ['chassis', 0.1, 0.7, 0.1, -0.7, -1.25, sd * 0.9]])],
    // main rotor: two crossed 10 m blades and the hub; origin at the hub
    rotorHeli: () => [['rotorBlade', 10, 0.06, 0.3, 0, 0, 0], ['rotorBlade', 0.3, 0.06, 10, 0, 0, 0], ['chassis', 0.3, 0.4, 0.3, 0, -0.2, 0]],
    // ruined windmill: round stone tower, slightly conical, topless (the roof has fallen in); origin at ground
    millTower: () => { const g = new THREE.CylinderGeometry(3.1, 3.8, 9, 10, 1, true); g.translate(0, 4.5, 0); return g; },
    // what remains of the mechanism, on the 9 m tower, sails toward +X: the shaft, one whole sail and one broken (wooden frames without canvas), two beams of the collapsed roof, the door frame, fallen stones
    millRuin: () => [['wood', 1.6, 0.35, 0.35, 3.5, 8.2, 0, [0, 0, -0.15]], ['wood', 0.35, 0.35, 15, 4.3, 8.1, 0, [0.5, 0, 0]], ['wood', 0.3, 0.06, 2, 4.4, 9.8, -1.1, [0.5, 0, 0]], ['wood', 0.3, 0.06, 2, 4.4, 6.5, 2.9, [0.5, 0, 0]],
      ['wood', 0.35, 0.35, 5, 4.3, 6.2, -1.2, [-1.05, 0, 0]], ['wood', 7, 0.3, 0.3, 0, 8.6, 1, [0, 0.4, 0.25]], ['wood', 6.6, 0.3, 0.3, -0.4, 8.3, -1.4, [0, -0.3, -0.12]],
      ['stone', 0.5, 2.4, 1.8, 3.6, 1.2, 0], ['stone', 1.4, 0.8, 1.2, 4.6, 0.4, 2.2, [0, 0.6, 0]], ['stone', 1, 0.6, 0.9, -4.4, 0.3, -1.5, [0, 0.3, 0]]],
    // sheep, muzzle toward +X: fleece, dark head, legs; origin at ground
    sheep: () => [['wool', 1.15, 0.7, 0.65, 0, 0.75, 0, null, 1], ['headEl', 0.35, 0.36, 0.3, 0.68, 0.9, 0], ['headEl', 0.1, 0.12, 0.3, 0.58, 1.05, 0], ...[-1, 1].flatMap(a => [-1, 1].map(b => ['headEl', 0.1, 0.45, 0.1, a * 0.38, 0.22, b * 0.2]))],
    // shepherd facing +X: clothing, head, hat, staff; the waving arm is separate (armShepherd, so it can wave). Origin at ground
    shepherd: () => [['clothes', 0.35, 0.95, 0.5, 0, 1.1, 0, null, 1], ['clothes', 0.18, 0.8, 0.18, 0, 0.4, -0.12], ['clothes', 0.18, 0.8, 0.18, 0, 0.4, 0.12], ['skin', 0.22, 0.26, 0.24, 0, 1.75, 0],
      ['hat', 0.55, 0.05, 0.55, 0, 1.9, 0], ['hat', 0.28, 0.16, 0.28, 0, 1.98, 0], ['clothes', 0.13, 0.7, 0.13, 0.05, 1.15, 0.32], ['wood', 0.05, 1.7, 0.05, 0.12, 0.95, 0.4]],
    // shepherd's raised arm: origin at the shoulder, hand at the top
    armShepherd: () => [['clothes', 0.13, 0.62, 0.13, 0, 0.31, 0], ['skin', 0.12, 0.14, 0.12, 0, 0.68, 0]],
    // pasture fence, L m along X: a post about every 2.5 m, two rails
    fence: (L = 10) => { const nbr = Math.round(L / 2.5); return [...Array.from({ length: nbr + 1 }, (_, k) => ['wood', 0.12, 1.1, 0.12, -L / 2 + k * L / nbr, 0.55, 0]), ['wood', L, 0.08, 0.05, 0, 0.95, 0], ['wood', L, 0.08, 0.05, 0, 0.55, 0]]; },
  });
})();
