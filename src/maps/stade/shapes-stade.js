// Shapes specific to "stade" (Grand Vacarme): completes the shapes.js catalogue (simple shape = geometry, assembly = list of boxes with zones). See docs/methods/SCENERY.md.
// Stand reference frame: origin at ground at the middle of the front, X along the perimeter, Z toward the back (moving away from the track).
(function () {
  const A1 = Math.atan2(15, 26), A2 = Math.atan2(18, 22); // slopes of the lower and upper rings
  Object.assign(SHAPES, {
    // arena stand module of L m, placed side by side all around the perimeter: banner podium, lower ring (crowd), stairs, glazed boxes,
    // upper ring (crowd2), back wall up to the roof, technical walkway and its floodlight rail
    bleacherArena: (L = 14) => [['concretePart', L, 4, 2, 0, 2, 1], ['streamer', L, 1.6, 0.2, 0, 2.6, -0.05],
      ['crowd', L, 0.6, 30, 0, 11.5, 15, [-A1, 0, 0], 1], ['stairs', 1.4, 0.8, 30, 0.7 - L / 2, 11.5, 15, [-A1, 0, 0]],
      ['vipBox', L, 4, 3, 0, 21, 29.5], ['concretePart', L, 1, 6, 0, 23.5, 30], ['banner2', L, 1.2, 0.2, 0, 24.6, 26.9],
      ['crowd2', L, 0.6, 28.4, 0, 33, 41, [-A2, 0, 0], 1], ['stairs', 1.4, 0.8, 28.4, 0.7 - L / 2, 33, 41, [-A2, 0, 0]],
      ['concretePart', L, 64, 2, 0, 32, 53, null, 1], ['steelMat', L, 0.5, 3, 0, 53, 44], ['lampObj', L - 2, 0.6, 0.8, 0, 52.5, 42.8]],
    // roof truss, span L m along Z, origin at its middle: two chords, a lattice web, one floodlight rail every 50 m
    farmRoof: L => [['steelMat', 1.4, 0.8, L, 0, 3.5, 0], ['steelMat', 1.4, 0.8, L, 0, -3.5, 0], ['lattice', 0.4, 6.2, L, 0, 0, 0],
      ...Array.from({ length: Math.floor((L - 60) / 50) + 1 }, (_, k) => 30 - L / 2 + k * 50).flatMap(z => [['steelMat', 12, 0.8, 3, 0, -4.2, z], ['lampObj', 11, 0.5, 2.2, 0, -4.8, z]])],
    // display cube hung at the center of the arena, origin at its center: four screens, two belts, four hangers
    cubeScore: () => [['screen', 24, 13, 0.6, 0, 0, 12], ['screen', 24, 13, 0.6, 0, 0, -12], ['screen', 0.6, 13, 24, 12, 0, 0], ['screen', 0.6, 13, 24, -12, 0, 0],
      ['steelMat', 25.4, 1.2, 25.4, 0, 7.1, 0], ['bandStrip', 25.4, 1.2, 25.4, 0, -7.1, 0], ...[-1, 1].flatMap(a => [-1, 1].map(b => ['steelMat', 0.5, 22, 0.5, a * 9, 18.7, b * 9]))],
    // the stage, the mound wall and the fire arch of the central area, origin at the center of the area (M.place.c): same footprints as its piers in mapDefs.js.
    // 49 × 6 m stage to the east, light strip on both faces; 25 m chevron wall to the west; between the two, a 37 m span gantry, hanging sign, 8 m clearance underneath
    sceneArena: () => [['concretePart', 49, 4, 6, 34.5, 2, 0], ['screen', 46, 3, 0.3, 34.5, 2.2, 3.1], ['screen', 46, 3, 0.3, 34.5, 2.2, -3.1], ['bandStrip', 49.4, 0.5, 6.4, 34.5, 4.25, 0],
      ['chevrons', 25, 2.6, 2, -35.5, 1.3, 0], ['steelMat', 1.6, 11, 1.6, -24, 5.5, 0], ['steelMat', 1.6, 7, 1.6, 11, 7.5, 0], ['steelMat', 37, 1.4, 1.8, -6.5, 11.3, 0], ['signboard', 26, 2.2, 0.4, -6.5, 9.4, 0]],
    // monster truck parked, origin at ground under its middle, X = the front: four 2.2 m wheels (two crossed boxes each), tubular chassis set high,
    // pickup body with painted flames, glazed cab, headlight rail on the roof
    monsterTruck: () => [...[-1.9, 1.9].flatMap(x => [-1.55, 1.55].flatMap(z => [['tire', 2.2, 2.2, 1.1, x, 1.1, z], ['tire', 2.2, 2.2, 1.1, x, 1.1, z, [0, 0, 0.785]], ['steelMat', 0.25, 1.6, 0.25, x, 2, z * 0.6, [z > 0 ? 0.5 : -0.5, 0, 0]]])),
      ['chassis', 4.6, 0.35, 1.5, 0, 2.6, 0, null, 1], ['carBody', 5.2, 1.1, 2.5, 0, 3.3, 0, null, 1], ['flameSet', 2.4, 0.5, 2.54, 1.3, 3.2, 0], ['carBody', 2.1, 1.05, 2.3, -0.2, 4.4, 0],
      ['pane', 0.1, 0.75, 2, 0.88, 4.45, 0], ['pane', 1.7, 0.6, 2.34, -0.25, 4.5, 0], ['steelMat', 0.3, 0.3, 2.1, -0.2, 5.05, 0], ['lampObj', 0.25, 0.3, 1.8, 0, 5.05, 0]],
    // fan of n laser beams of L m starting from the origin and pointing down, spread by e rad
    fanLaser: (n = 5, L = 130, e = 0.3) => Array.from({ length: n }, (_, k) => { const a = (k - (n - 1) / 2) * e; return ['arcRadius', 0.3, L, 0.3, Math.sin(a) * L / 2, -Math.cos(a) * L / 2, 0, [0, 0, a]]; }),
  });
})();
