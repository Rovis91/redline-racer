// Shapes specific to "area51", family "airfield": completes the shapes.js catalogue. Metres, origin on the ground, Y up. Assemblies; zones are the shared materials of the map (MAT in scenery-area51.js).
// Light masts, water tower and crash tender are borrowed from shapes.js (mastLighting, waterTower, tractor + trailerTank). Roadside pieces have local Z along the road.
// See docs/proposals/area51/AMBIANCE-V2.html, zones 1 and 5: tower, fire station, light masts and fuel tanks along the apron; amber and white lights low on the ground. Not a civilian airport.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // foam-monitor island in the fire alley, 8 × 8 m: a kerbed concrete pad with a hazard edge, a monitor on its post aimed down the alley, two hydrant cabinets
    ilotMousseArea51: () => [['concrete', 8, 0.5, 8, 0, 0.25, 0], ['danger', 8.2, 0.3, 0.5, 0, 0.35, 3.9], ['danger', 8.2, 0.3, 0.5, 0, 0.35, -3.9], ['danger', 0.5, 0.3, 8.2, 3.9, 0.35, 0], ['danger', 0.5, 0.3, 8.2, -3.9, 0.35, 0],
      ['steel', 0.35, 2.4, 0.35, 0, 1.7, 0], ['red', 0.6, 0.6, 2, 0, 3, 0.5, [-0.3, 0, 0]], ['red', 1.2, 1.4, 0.8, -2.4, 1.2, -2.4], ['red', 1.2, 1.4, 0.8, 2.4, 1.2, -2.4]],
    // control tower, ht to the cab floor: a corrugated base building, the concrete shaft, the cab with its lit glazing all round, roof, aerial mast and red light
    tourArea51: (ht = 34) => [['tin', 24, 6, 16, 0, 3, 0], ['verriere', 24.2, 1.2, 16.2, 0, 4.4, 0], ['concrete', 9, ht, 9, 0, ht / 2, 0], ['concrete', 13, 2, 13, 0, ht - 1, 0], ['verriere', 16, 4.4, 16, 0, ht + 2.2, 0],
      ['gray', 18, 0.8, 18, 0, ht + 4.8, 0], ['steel', 0.4, 8, 0.4, 3, ht + 9, 3], ['fire', 0.6, 0.6, 0.6, 3, ht + 13.2, 3]],
    // approach light bar, 30 m along Z: a steel bar on three posts, five lamps
    rampeArea51: () => [['steel', 0.3, 0.3, 30, 0, 1.5, 0], ...[-12, 0, 12].map(z => ['steel', 0.25, 1.5, 0.25, 0, 0.75, z]), ...[-14, -7, 0, 7, 14].map(z => ['neon', 0.6, 0.5, 0.6, 0, 1.9, z])],
    // windsock: 8 m pole, amber sock blown along Z, a white band
    mancheArea51: () => [['steel', 0.25, 8, 0.25, 0, 4, 0], ['amber', 0.9, 0.9, 3.2, 0, 7.6, 1.8, [0.15, 0, 0]], ['white', 0.95, 0.95, 0.6, 0, 7.7, 1.2, [0.15, 0, 0]]],
    // transporter track of the antenna array, len long along Z: two rails on sleepers
    railsArea51: (len = 40) => [...pair(sd => ['steel', 0.2, 0.25, len, sd * 0.75, 0.3, 0]), ...Array.from({ length: Math.round(len / 2.5) }, (_, i) => -len / 2 + 1.25 + i * 2.5).map(z => ['dark', 2.6, 0.18, 0.5, 0, 0.1, z])],
    // generator set (12 × 5 × 10): container on a pad, exhaust stack, day tank
    groupeArea51: () => [['concrete', 12, 0.4, 6, 0, 0.2, 0], ['gray', 10, 3.4, 4, 0, 2.1, 0], ['steel', 0.5, 2.4, 0.5, 3.5, 5, 0], ['white', 2, 2, 3, -3, 1.4, 4]],
    // cryogenic plant: two white vertical tanks, pipework, a pad
    cryoArea51: () => [['concrete', 12, 0.4, 12, 0, 0.2, 0], ...pair(sd => [0, 0.7854].map(a => ['white', 3.6, 6, 3.6, sd * 3, 3.4, 0, [0, a, 0]])).flat(), ['gray', 9, 0.5, 0.5, 0, 5, 2.4], ['gray', 3, 2, 4, 0, 1.4, -4]],
  });
})();
