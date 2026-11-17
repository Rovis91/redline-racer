// Shapes specific to "givre" (Nuit Blanche): complements the catalogue in shapes.js (simple shape = geometry, assembly = list of zoned boxes). See docs/methods/SCENERY.md.
(function () {
  const A = 0.62; // slope of the shelter roof (rad)
  Object.assign(SHAPES, {
    // pylon of the valley's high-voltage line (lattice: four legs, three cross-arms)
    pylonCol: () => [...[-1, 1].flatMap(a => [-1, 1].map(b => ['steelMat', 0.35, 34, 0.35, a * 1.6, 17, b * 1.6, null, 1])),
      ...[14, 24, 32].flatMap(y => [['steelMat', 4, 0.3, 4, 0, y, 0], ['steelMat', 0.4, 0.4, 16 - (y - 14) * 0.25, 0, y + 1.2, 0]])],
    // snow marker: the stake poking out of the drifts at the edge of pass roads, topped with a retroreflective collar
    milestone: () => [['stake', 0.14, 2.8, 0.14, 0, 1.4, 0], ['collar', 0.2, 0.35, 0.2, 0, 2.45, 0]],
    // pass shelter, gable toward the road (X = toward the road): plank walls on a stone base, two-pitched roof laden with snow, two lit windows and the door in the gable, chimney
    shelter: () => [['stone', 9.4, 1.2, 7.4, 0, 0.1, 0], ['intoWall', 9, 3.4, 7, 0, 2.2, 0, null, 1], ['intoWall', 9, 1.6, 3.4, 0, 4.4, 0],
      ...[-1, 1].map(sd => ['roofM', 9.8, 0.5, 5.4, 0, 4.9, sd * 2, [sd * A, 0, 0], 1]), ['stone', 0.9, 2.4, 0.9, -2.5, 6, 1.2],
      ...[-1, 1].map(sd => ['casement', 0.15, 1.1, 1.3, 4.55, 2.5, sd * 2.1]), ['door', 0.15, 2.1, 1, 4.55, 1.75, 0], ['casement', 1.4, 1, 0.15, -1, 2.5, 3.55]],
    // pass sign: two posts, one plate
    signCol: () => [...[-1, 1].map(sd => ['pole', 0.14, 3, 0.14, 0, 1.5, sd * 1.7]), ['plate', 0.1, 1.3, 4, 0, 2.9, 0]],
    // reindeer (X = forward): body, legs, outstretched neck, head, muzzle, forked antlers; b = antler size (the stag carries them bigger)
    reindeer: (b = 1) => [['fur', 1.6, 0.8, 0.7, 0, 1.2, 0, null, 1], ...[-1, 1].flatMap(a => [-1, 1].map(c => ['paw', 0.15, 0.9, 0.15, a * 0.6, 0.45, c * 0.22])),
      ['fur', 0.35, 0.7, 0.3, 0.85, 1.6, 0, [0, 0, -0.6]], ['fur', 0.6, 0.3, 0.3, 1.15, 1.95, 0], ['nose', 0.1, 0.13, 0.13, 1.48, 1.95, 0], ['belly', 0.3, 0.25, 0.72, -0.85, 1.35, 0],
      ...[-1, 1].flatMap(sd => [['wood', 0.08, 0.8 * b, 0.08, 1.0, 2.05 + 0.4 * b, sd * 0.25, [sd * 0.4, 0, 0.3]], ['wood', 0.5 * b, 0.06, 0.06, 1.1, 2.1 + 0.55 * b, sd * (0.2 + 0.2 * b), [0, 0, 0.5]],
        ['wood', 0.06, 0.4 * b, 0.06, 0.8, 2.1 + 0.6 * b, sd * (0.25 + 0.2 * b), [sd * 0.6, 0, -0.2]]])],
    // Father Christmas's sleigh (X = forward): gilded runners curled up at the front, red box and backrest, the sack, and him, seated, reins in hand
    sled: () => [...[-1, 1].flatMap(sd => [['skate', 2.8, 0.1, 0.1, 0, 0.1, sd * 0.6], ['skate', 0.1, 0.6, 0.1, 1.45, 0.35, sd * 0.6, [0, 0, 0.3]], ['skate', 0.08, 0.5, 0.08, 0, 0.35, sd * 0.6]]),
      ['carBody', 2.2, 0.7, 1.4, 0, 0.75, 0, null, 1], ['carBody', 0.3, 1.0, 1.4, -1.0, 1.4, 0], ['carBody', 0.25, 0.6, 1.4, 1.0, 1.25, 0, [0, 0, -0.4]], ['skate', 2.24, 0.08, 1.44, 0, 1.12, 0],
      ['bag', 0.8, 0.9, 1.0, -0.5, 1.55, 0], ['outfit', 0.6, 0.8, 0.7, 0.2, 1.5, 0], ['beltCol', 0.62, 0.12, 0.72, 0.2, 1.4, 0], ['skin', 0.35, 0.35, 0.35, 0.25, 2.08, 0],
      ['beard', 0.2, 0.42, 0.4, 0.42, 1.95, 0], ['outfit', 0.38, 0.3, 0.38, 0.22, 2.38, 0, [0, 0, 0.3]], ['beard', 0.42, 0.08, 0.42, 0.25, 2.25, 0], ['beard', 0.13, 0.13, 0.13, 0.05, 2.5, 0],
      ...[-1, 1].map(sd => ['outfit', 0.6, 0.18, 0.18, 0.55, 1.65, sd * 0.38])],
    // kota, the Lapp tent in a cone of canvas and poles
    kota: () => { const g = new THREE.ConeGeometry(2.6, 5.5, 9); g.translate(0, 2.75, 0); return g; },
    // DDE snowplough parked (X = forward): chassis, glazed cab, salt hopper, angled blade with stripes at the front, six wheels (rim and tyre crossed, like the wheels in shapes.js).
    // The beacon is not part of it: it flashes, so it is placed apart (outside the static scenery merge)
    snowplow: () => [['chassis', 7, 0.5, 2.3, 0, 0.95, 0], ['carBody', 2.2, 2, 2.4, 2, 2.2, 0, null, 1], ['pane', 0.1, 0.9, 2.1, 3.12, 2.65, 0], ['pane', 1.5, 0.8, 2.44, 2.1, 2.65, 0],
      ['carBody', 4.2, 1.7, 2.4, -1.5, 2.05, 0, null, 1], ['snowSurf', 4.3, 0.3, 2.5, -1.5, 3.05, 0], ['snowSurf', 2.3, 0.2, 2.5, 2, 3.3, 0], ['chassis', 1, 0.3, 1, 3.6, 0.9, 0],
      ['blade', 0.3, 1.2, 3.4, 4.25, 0.75, 0, [0, 0.35, 0]], ['snowSurf', 1.2, 0.6, 3.6, 4.9, 0.3, 0, [0, 0.35, 0]],
      ...[2.2, -1, -2.4].flatMap(x => [-1, 1].flatMap(sd => [0, 0.785].map(a => [a ? 'tire' : 'wheelPart', 1.1, 1.1, 0.4, x, 0.55, sd * 1.05, [0, 0, a]])))],
    // ski lift pylon (origin at the foot, the line follows Z, the cross-arm X): mast, cross-arm and its two roller bogies, snow-laden
    pylonChairlift: () => [['steelMat', 0.7, 9, 0.7, 0, 4.5, 0, null, 1], ['steelMat', 4.4, 0.3, 0.3, 0, 9, 0], ...[-1, 1].map(sd => ['steelMat', 0.25, 0.25, 0.9, sd * 2.1, 8.7, 0]), ['snowSurf', 4.5, 0.2, 0.45, 0, 9.25, 0]],
    // ski lift chair, stopped (origin at the cable, X = along the line): hanger, seat and backrest, snow fallen on it
    seat: () => [['steelMat', 0.08, 1.6, 0.08, 0, -0.8, 0], ['steelMat', 0.08, 0.08, 1.4, 0, -0.05, 0], ['seat', 0.6, 0.12, 1.3, 0, -1.65, 0], ['seat', 0.1, 0.6, 1.3, -0.3, -1.35, 0], ['snowSurf', 0.6, 0.1, 1.3, 0, -1.55, 0]],
    // perched snowy owl (origin at the talons, X = where it looks): body, round head, plumes, amber eyes that catch the headlights
    owl: () => [['feather', 0.26, 0.34, 0.24, 0, 0.17, 0], ['feather', 0.24, 0.2, 0.24, 0, 0.44, 0], ['stain', 0.27, 0.06, 0.25, 0, 0.12, 0], ['stain', 0.27, 0.04, 0.25, 0, 0.25, 0],
      ...[-1, 1].flatMap(sd => [['eye', 0.03, 0.06, 0.06, 0.12, 0.46, sd * 0.055], ['feather', 0.05, 0.08, 0.05, 0, 0.58, sd * 0.08], ['stain', 0.2, 0.25, 0.04, -0.02, 0.2, sd * 0.13]]), ['beak', 0.05, 0.05, 0.04, 0.13, 0.41, 0]],
    // "verglas" sign (black ice) 150 m before each plate (plate facing X), a blue light on top, like the pass markers
    signBlackIce: () => [['pole', 0.14, 3.6, 0.14, 0, 1.8, 0], ['plate', 0.08, 1.1, 2.9, 0.08, 2.9, 0], ['fire', 0.45, 0.45, 0.45, 0, 3.8, 0]],
  });
})();
