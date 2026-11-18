// Shapes specific to "area51", family "dishes and radio", small pieces: completes the shapes.js catalogue (the dishes themselves are in shapes-area51-dish.js). Metres, origin on the ground, Y up.
// See docs/proposals/area51/AMBIANCE-V2.html, zones 3 to 5: white radomes and shelters, lattice masts with red lights, aerials beyond the runway strips. Roadside pieces have local Z along the road.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // plain cylinder or cone frustum (simple shape): radius r, height ht, n flat sides, top radius = r × top; closed on top. Tanks, stacks, silos
    cylArea51: (r = 13, ht = 10, n = 12, top = 1) => SHAPES.ringsArea51(n, [[-0.5, r, r], [ht, r * top, r * top]], true),
    // radome (simple shape): a faceted white ball of radius r on its collar, 8 sides
    radomeArea51: (r = 7) => SHAPES.ringsArea51(8, [[0, r * 0.7, r * 0.7], [r * 0.45, r, r], [r * 1.05, r * 0.92, r * 0.92], [r * 1.55, r * 0.55, r * 0.55], [r * 1.78, r * 0.05, r * 0.05]]),
    // relay mast, ht high: lattice shaft, two white drum aerials, a red light
    mastRelaisArea51: (ht = 22) => [['lattice', 1.6, ht, 1.6, 0, ht / 2, 0], ['white', 1.8, 1.8, 0.7, 0, ht * 0.8, 1], ['white', 1.4, 1.4, 0.6, 0, ht * 0.62, -1], ['fire', 0.5, 0.5, 0.5, 0, ht + 0.25, 0]],
    // glide-slope aerial: 12 m lattice mast, three amber panels, a shelter at its foot
    glideArea51: () => [['lattice', 1.2, 12, 1.2, 0, 6, 0], ...[5, 8, 11].map(y => ['amber', 2.6, 1, 0.3, 0, y, 0.8]), ['white', 3, 2.4, 4, 2.6, 1.2, 0], ['fire', 0.4, 0.4, 0.4, 0, 12.2, 0]],
    // localizer array, 20 m along Z: eight amber dipole frames on a steel beam
    localizerArea51: () => [['steel', 0.3, 0.3, 20, 0, 2.4, 0], ...Array.from({ length: 8 }, (_, i) => -8.75 + i * 2.5).flatMap(z => [['steel', 0.15, 2.4, 0.15, 0, 1.2, z], ['amber', 1.8, 1.3, 0.12, 0, 3.2, z]])],
    // approach radar: white cabin on a concrete base, a mast, the lattice aerial tilted on top, a red light
    radarArea51: () => [['concrete', 8, 1, 8, 0, 0.5, 0], ['white', 6, 3.4, 6, 0, 2.7, 0], ['gray', 0.6, 4, 0.6, 0, 6.4, 0], ['lattice', 7, 3.6, 0.5, 0, 9.6, 0, [0.25, 0.4, 0]], ['fire', 0.4, 0.4, 0.4, 0, 11.6, 0]],
  });
})();
