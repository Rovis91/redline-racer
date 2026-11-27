// Shapes specific to "autoroute", family "vehicles": completes the shapes.js catalogue. Metres, origin on the ground at the centre, Z = length (front toward -Z), X = width, Y up.
// Assemblies (lists of boxes [zone, w, h, d, x, y, z, rotation]); zones: body (bodywork, tinted per copy or per material), pane (dark glass), tyre, steel, olive (army), canvas, concrete, stripe (the line colour of the tram), dark, yellow.
// Wrecks left for decades: flat tyres (the body sits low), no lights, nothing shiny. One period for all: mid-size saloons, pickups, vans, buses, lorries.
// See docs/proposals/sunken-highway/AMBIANCE-V2.html: grouped where a jam, a checkpoint or an accident put them. Not a scrapyard row. (Round 5: the trams of the line, stopped where the power went off.)
(function () {
  const wheels = (w, zs, r = 0.62) => zs.flatMap(z => [-1, 1].map(s => ['tyre', 0.28, r, r, s * (w / 2 - 0.1), r / 2 - 0.08, z]));
  Object.assign(SHAPES, {
    // car, k = 0 saloon, 1 estate, 2 pickup, 3 van: 1.8 m wide, 4.4 to 5.2 m long
    voitureAutoroute: (k = 0) => k === 3 ? [['body', 2, 1.9, 5.2, 0, 1.2, 0], ['pane', 2.04, 0.7, 1.2, 0, 1.65, -1.75], ['pane', 1.7, 0.75, 0.1, 0, 1.6, -2.58], ...wheels(2, [-1.7, 1.7])]
      : k === 2 ? [['body', 1.85, 0.75, 5.2, 0, 0.72, 0], ['body', 1.8, 0.75, 1.9, 0, 1.45, -0.7], ['pane', 1.84, 0.5, 1.6, 0, 1.5, -0.7], ['body', 1.85, 0.45, 0.12, 0, 1.3, 2.54], ...[-1, 1].map(s => ['body', 0.12, 0.45, 2.3, s * 0.87, 1.3, 1.45]), ...wheels(1.85, [-1.6, 1.6], 0.7)]
      : [['body', 1.8, 0.7, 4.4, 0, 0.62, 0], ['body', 1.66, 0.6, k ? 2.9 : 2, 0, 1.25, k ? 0.5 : 0.2], ['pane', 1.7, 0.42, k ? 2.7 : 1.8, 0, 1.24, k ? 0.5 : 0.2], ['pane', 1.5, 0.45, 0.1, 0, 1.22, k ? -0.98 : -0.82], ...wheels(1.8, [-1.4, 1.4])],
    // city bus, 2.55 × 3.1 × 11.5 m: body, a band of windows all round, a roof unit
    busAutoroute: () => [['body', 2.55, 2.7, 11.5, 0, 1.7, 0], ['pane', 2.6, 0.9, 10.6, 0, 2.2, 0.1], ['pane', 2.3, 1.2, 0.1, 0, 2.05, -5.78], ['steel', 1.6, 0.3, 3, 0, 3.2, 1], ...wheels(2.55, [-3.6, 3.4, 4.3], 0.95)],
    // lorry, t = 0 box trailer, 1 tanker, 2 army truck with a canvas-covered bed: 2.5 m wide, 9 to 14 m long
    camionAutoroute: (t = 0) => t === 2 ? [['olive', 2.4, 1.6, 2.2, 0, 1.9, -2.6], ['pane', 2.44, 0.6, 1.2, 0, 2.25, -2.9], ['olive', 2.3, 0.5, 7.4, 0, 1.05, 0], ['canvas', 2.5, 1.9, 4.6, 0, 2.3, 1.3], ['olive', 2.2, 0.9, 1.5, 0, 1.2, -4.3], ...wheels(2.4, [-3.4, 0.8, 2.2], 1.1)]
      : [['body', 2.5, 2.3, 2.4, 0, 2, -5.6], ['pane', 2.54, 0.8, 1.2, 0, 2.5, -6], ['steel', 2.3, 0.5, 14, 0, 0.95, 0], ...(t ? [['body', 2.4, 2.4, 10, 0, 2.45, 1.6], ['steel', 2.5, 0.3, 10.4, 0, 3.75, 1.6], ['steel', 0.5, 2.6, 0.5, 0, 2.5, -3.5]] : [['body', 2.55, 2.9, 10.6, 0, 2.7, 1.5]]),
        ...wheels(2.5, [-5.4, -3.4, 4.6, 5.9], 1)],
    // armoured carrier: hull with sloped front, turret, eight wheels. 3 × 2.6 × 7 m
    blindeAutoroute: () => [['olive', 3, 1.3, 7, 0, 1.35, 0], ['olive', 2.6, 0.7, 2.4, 0, 1.2, -3.6, [0.5, 0, 0]], ['olive', 1.8, 0.7, 2, 0, 2.35, 0.3], ['steel', 0.2, 0.2, 3, 0, 2.4, -1.8], ...wheels(3, [-2.5, -0.9, 0.9, 2.5], 1.1)],
    // one section of a low-floor tram, 2.65 × 3.4 × 9.4 m (a tram is three of them end to end, 9.7 m apart): skirt, a tall band of windows, two dark doors a side, roof and its equipment, the line's stripe, a bogie,
    // the bellows of the joint at each end that meets another section. k = 0 leading section (cab at -Z), 1 middle (it carries the pantograph, folded), 2 trailing (cab at +Z)
    tramAutoroute: (k = 1) => [['body', 2.65, 1.05, 9.4, 0, 0.78, 0], ['pane', 2.6, 1.3, 9.1, 0, 1.95, 0], ['body', 2.65, 0.5, 9.4, 0, 2.85, 0], ['stripe', 2.68, 0.2, 9.42, 0, 1.3, 0], ['steel', 1.7, 0.3, 5.5, 0, 3.25, 0],
      ...[-2.4, 2.4].map(z => ['steel', 2.7, 2.15, 1.35, 0, 1.5, z]), ...[-4.2, 0, 4.2].map(z => ['body', 2.63, 1.3, 0.3, 0, 1.95, z]), ['dark', 2.3, 0.45, 2.4, 0, 0.22, 0],
      ...(k !== 0 ? [['dark', 2.35, 2.7, 0.5, 0, 1.6, -4.85]] : [['body', 2.5, 2.4, 0.5, 0, 1.6, -4.8, [-0.12, 0, 0]], ['pane', 2.2, 1.2, 0.1, 0, 2, -5.08, [-0.12, 0, 0]]]),
      ...(k !== 2 ? [['dark', 2.35, 2.7, 0.5, 0, 1.6, 4.85]] : [['body', 2.5, 2.4, 0.5, 0, 1.6, 4.8, [0.12, 0, 0]], ['pane', 2.2, 1.2, 0.1, 0, 2, 5.08, [0.12, 0, 0]]]),
      ...(k === 1 ? [['steel', 1.5, 0.08, 0.08, 0, 3.75, 0.8], ['steel', 0.08, 0.08, 1.9, -0.5, 3.6, 0, [0.2, 0, 0]], ['steel', 0.08, 0.08, 1.9, 0.5, 3.6, 0, [0.2, 0, 0]]] : [])],
    // road-works arrow board on its trailer, 2.6 × 1.7 m panel 3.85 m up, facing -Z (its lamps are lit by scenery-autoroute-vie.js)
    flecheChantierAutoroute: () => [['yellow', 1.7, 0.3, 1.3, 0, 0.6, 0], ...wheels(1.7, [0], 0.6), ['steel', 0.1, 0.1, 1.2, 0, 0.5, -1.1], ['steel', 0.16, 1.6, 0.16, 0, 1.5, 0], ['dark', 2.6, 1.7, 0.14, 0, 3, 0], ['yellow', 2.7, 0.1, 0.16, 0, 3.9, 0], ['yellow', 2.7, 0.1, 0.16, 0, 2.1, 0]],
    // river barge aground, 8 × 38 m: rusted hull, hatch covers, wheelhouse aft. Origin at its keel line
    bargeAutoroute: () => [['body', 8, 3, 38, 0, 1.5, 0], ['steel', 7.2, 0.6, 26, 0, 3.3, -3], ['steel', 8.3, 0.4, 38.4, 0, 2.9, 0], ['concrete', 6, 3, 5, 0, 4.5, 15], ['pane', 6.1, 0.9, 4.6, 0, 5.1, 15], ['steel', 6.6, 0.3, 5.6, 0, 6.15, 15], ['steel', 0.4, 4, 0.4, 0, 8, 14]],
  });
})();
