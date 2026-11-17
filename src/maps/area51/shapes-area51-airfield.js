// Shapes specific to "area51", family "airfield": completes the shapes.js catalogue. Metres, origin on the ground, Y up. For the pilot, only what stands in the hangar zone.
// Assemblies; zones are the map's shared materials (MAT in scenery-area51.js). Light masts, water tower and crash tender are borrowed from shapes.js (mastLighting, waterTower, tractor + trailerTank).
(function () {
  Object.assign(SHAPES, {
    // foam-monitor island in the fire alley, 8 × 8 m: a kerbed concrete pad with a hazard edge, a monitor on its post aimed down the alley, two hydrant cabinets
    ilotMousseArea51: () => [['concrete', 8, 0.5, 8, 0, 0.25, 0], ['danger', 8.2, 0.3, 0.5, 0, 0.35, 3.9], ['danger', 8.2, 0.3, 0.5, 0, 0.35, -3.9], ['danger', 0.5, 0.3, 8.2, 3.9, 0.35, 0], ['danger', 0.5, 0.3, 8.2, -3.9, 0.35, 0],
      ['steel', 0.35, 2.4, 0.35, 0, 1.7, 0], ['red', 0.6, 0.6, 2, 0, 3, 0.5, [-0.3, 0, 0]], ['red', 1.2, 1.4, 0.8, -2.4, 1.2, -2.4], ['red', 1.2, 1.4, 0.8, 2.4, 1.2, -2.4]],
  });
})();
