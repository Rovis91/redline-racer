// Shapes specific to "area51", family "aircraft": completes the shapes.js catalogue. Metres, origin on the ground under the middle of the fuselage, nose toward +Z, Y up.
// Assemblies; zones are the map's shared materials (MAT in scenery-area51.js): white (airframe), glass, dark, gray, amber, lattice.
// See docs/proposals/area51/AMBIANCE-V2.html, zone 1: the airframes read as pale wedges on amber scaffolding docks. An invented twin-fin delta prototype, 46 m long, 26 m span. Not an airliner, no markings of a real air force.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    avionArea51: () => [['white', 3.6, 3.4, 22, 0, 3.7, 0], ['white', 3, 3, 9, 0, 3.7, 15], ['white', 2, 2.1, 6, 0, 3.5, 21.5], ['white', 1, 1.2, 3, 0, 3.3, 25.5], ['white', 4.2, 3.6, 7, 0, 3.8, -14], // fuselage, nose to tail
      ['glass', 1.8, 1.2, 4.6, 0, 5.6, 13],                                                                             // canopy
      ...pair(sd => [['white', 5, 0.6, 14, sd * 3.8, 3.2, -3], ['white', 11, 0.45, 8, sd * 7.6, 3.2, -6, [0, sd * 0.55, 0]],  // delta wing: root and swept panel
        ['white', 5, 0.4, 4, sd * 4.6, 3.6, -15.5, [0, sd * 0.4, 0]], ['white', 0.4, 6.5, 5, sd * 2, 8, -14, [-0.35, 0, -sd * 0.28]], // tailplane, canted fin
        ['dark', 1.7, 1.7, 2.2, sd * 1.15, 3.7, -18.4], ['gray', 2.6, 1.6, 6, sd * 2.6, 2.7, 6],                         // nozzle, air intake
        ['gray', 0.4, 2, 0.4, sd * 2.5, 1.2, -4], ['dark', 0.6, 1.2, 1.2, sd * 2.5, 0.6, -4]]).flat(),                    // main gear
      ['gray', 0.4, 2, 0.4, 0, 1.2, 14], ['dark', 0.5, 1, 1, 0, 0.5, 14]],                                               // nose gear
    // maintenance dock round an airframe (same origin and heading): a two-level scaffold gangway along each side, a bridge behind the tail, stairs
    dockArea51: () => [...pair(sd => [...[-12, -4, 4, 12].flatMap(z => pair(k => ['amber', 0.4, 6.4, 0.4, sd * (9 + k * 1.4), 3.2, z])), ['amber', 3.4, 0.3, 26, sd * 9, 3.1, 0], ['amber', 3.4, 0.3, 26, sd * 9, 6.2, 0],
        ['lattice', 0.2, 1.2, 26, sd * 10.6, 4, 0], ['lattice', 0.2, 1.2, 26, sd * 10.6, 7.1, 0], ['amber', 1.2, 0.3, 7, sd * 11.6, 1.6, 9, [0.46, 0, 0]]]).flat(),
      ['amber', 21.6, 0.3, 3, 0, 6.2, -19.5], ['lattice', 21.6, 1.2, 0.2, 0, 7.1, -21]],
  });
})();
