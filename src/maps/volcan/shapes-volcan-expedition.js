// Shapes specific to "volcan", family "the scientific expedition and the farms": completes the shapes.js catalogue. Metres, origin on the ground at the centre, Y up.
// Assemblies (boxes [zone, w, h, d, x, y, z, rotation]); X along the road, front toward -Z (the road). Zones are keys of the map's shared materials (MAT in scenery-volcan.js):
// orange, white, yellow, red, blue (paint), trim, steel, dark, glass, concrete, flag, greywood, stone, roof, wood, lamp.
// See docs/proposals/volcanic-island/AMBIANCE-V2.html, zones 3 to 6: the expedition is orange and white on black ground, plain working gear; the farms are one bright house, one red barn, grey stone.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // shipping container used as store or laboratory, L long, tint = its paint: corrugated box on four blocks, a door and a white marking on the front, dark door bars on the right end
    conteneurVolcan: (L = 6, tint = 'orange') => [[tint, L, 2.6, 2.4, 0, 1.5, 0], ...pair(sx => ['concrete', 0.6, 1.2, 2.4, sx * (L / 2 - 0.5), -0.3, 0]), ['dark', 1, 1.9, 0.08, -L * 0.25, 1.3, -1.22], ['trim', L * 0.3, 0.5, 0.06, L * 0.2, 2.2, -1.22],
      ...pair(sd => ['dark', 0.08, 2.3, 0.08, L / 2 + 0.03, 1.5, sd * 0.5]), ['steel', L + 0.1, 0.12, 2.5, 0, 2.86, 0]],
    // domed tent, r in radius: a faceted half-sphere, one colour (give the paint as material)
    domeVolcan: (r = 3) => SHAPES.ringsVolcan(8, [[-0.6, r], [r * 0.36, r * 0.94], [r * 0.66, r * 0.72], [r * 0.87, r * 0.42], [r * 0.96, r * 0.1]], true),
    // radio mast, ht high: a square steel column in red and white sections, cross-bars, two dishes near the top, three guy wires down to the ground
    mastVolcan: (ht = 24) => { const n = 6, g = Math.hypot(0.72, 0.4) * ht, a = Math.atan(0.4 / 0.72);
      return [...Array.from({ length: n }, (_, i) => [i % 2 ? 'trim' : 'red', 0.45, ht / n, 0.45, 0, (i + 0.5) * ht / n, 0]), ...Array.from({ length: 5 }, (_, i) => ['steel', 1.4, 0.1, 0.1, 0, ht * (0.3 + i * 0.15), 0]),
        ['trim', 1.3, 1.3, 0.3, 0.7, ht * 0.86, -0.3], ['trim', 1, 1, 0.3, -0.6, ht * 0.74, 0.3], ['lamp', 0.3, 0.3, 0.3, 0, ht + 0.15, 0],
        ['steel', 0.06, g, 0.06, 0.2 * ht, 0.36 * ht, 0, [0, 0, a]], ['steel', 0.06, g, 0.06, -0.1 * ht, 0.36 * ht, 0.173 * ht, [-a * 0.87, 0, -a * 0.5]], ['steel', 0.06, g, 0.06, -0.1 * ht, 0.36 * ht, -0.173 * ht, [a * 0.87, 0, -a * 0.5]]]; },
    // row of n solar panels on a steel frame, tilted toward +Z (set its back to the road, or turn it): dark blue glass, pale edge
    solaireVolcan: (n = 3) => Array.from({ length: n }, (_, i) => { const x = (i - (n - 1) / 2) * 2.3; return [['glass', 2.1, 0.08, 1.5, x, 1.25, 0, [0.6, 0, 0]], ['trim', 2.2, 0.05, 1.6, x, 1.21, 0.02, [0.6, 0, 0]], ['steel', 0.1, 1.9, 0.1, x - 0.8, 0.75, -0.4], ['steel', 0.1, 1, 0.1, x + 0.8, 0.3, 0.5]]; }).flat(),
    // seismic station at the end of a survey line: a white box with an orange band, its solar panel on a post, a whip aerial
    stationVolcan: () => [['trim', 1, 1.2, 0.8, 0, 0.6, 0], ['orange', 1.03, 0.3, 0.83, 0, 0.95, 0], ['steel', 0.1, 2.2, 0.1, 0.9, 1.1, 0.3], ['glass', 1.3, 0.07, 0.9, 0.9, 2.2, 0.3, [0.6, 0, 0]], ['steel', 0.06, 3.6, 0.06, -0.6, 1.8, -0.2], ['concrete', 1.6, 0.3, 1.4, 0, 0.05, 0]],
    // weather station: an 8 m mast with a cross-arm, a wind vane and cups, a white louvred screen on legs, a rain gauge
    meteoVolcan: () => [['steel', 0.14, 8, 0.14, 0, 4, 0], ['steel', 1.8, 0.08, 0.08, 0, 7.5, 0], ['orange', 0.7, 0.3, 0.05, 0.6, 8, 0], ['dark', 0.25, 0.25, 0.25, -0.9, 7.7, 0], ['dark', 0.25, 0.25, 0.25, 0.9, 7.7, 0],
      ['trim', 1, 1, 1, 2.2, 1.7, 0], ['roof', 1.3, 0.12, 1.3, 2.2, 2.26, 0], ...pair(sx => pair(sd => ['steel', 0.07, 1.2, 0.07, 2.2 + sx * 0.4, 0.6, sd * 0.4])).flat(), ['steel', 0.35, 0.9, 0.35, -1.8, 0.45, 0.4]],
    // drilling rig, ht high: a concrete pad, four steel legs leaning in to a crown block, bracing rings (the upper ones red), the drill string, a control cabin and a mud tank beside the floor
    derrickVolcan: (ht = 26) => { const b0 = 4, b1 = 0.9, a = Math.atan((b0 - b1) / ht), len = Math.hypot(ht, (b0 - b1) * 1.414);
      return [['concrete', 14, 0.9, 12, 0, 0.1, 0], ['steel', 9, 1.6, 9, 0, 1.3, 0], ...pair(sx => pair(sz => ['steel', 0.32, len, 0.32, sx * (b0 + b1) / 2, 2.1 + ht / 2, sz * (b0 + b1) / 2, [-sz * a, 0, sx * a]])).flat(),
        ...Array.from({ length: 6 }, (_, i) => { const y = 2.1 + (i + 0.6) * ht / 6.4, b = b0 + (b1 - b0) * (y - 2.1) / ht, m = i > 3 ? 'red' : 'steel'; return [...pair(sd => [m, b * 2, 0.16, 0.16, 0, y, sd * b]), ...pair(sd => [m, 0.16, 0.16, b * 2, sd * b, y, 0])]; }).flat(),
        ['dark', 2.6, 1.3, 2.6, 0, 2.1 + ht + 0.6, 0], ['lamp', 0.4, 0.4, 0.4, 0, 2.1 + ht + 1.5, 0], ['dark', 0.3, ht * 0.86, 0.3, 0, 2.1 + ht * 0.45, 0],
        ['orange', 3, 2.4, 2.4, 5.2, 3.3, -2.5], ['glass', 3.03, 0.7, 1.8, 5.2, 3.6, -2.5], ['white', 5, 2.2, 2.4, -4.2, 1.6, 4.2], ['steel', 5.6, 0.3, 0.3, -4.2, 2.9, 4.2], ...[0, 1, 2].map(k => ['dark', 9, 0.28, 0.28, 0, 0.9 + k * 0.3, -5.2 - (k % 2) * 0.3])]; },
    // tracked vehicle of the expedition, tint = its paint: two tracks, a hull, a glazed cab forward (+X), a white cargo box behind, a roof lamp
    chenilleVolcan: (tint = 'orange') => [...pair(sd => ['dark', 5, 0.95, 0.65, 0, 0.47, sd * 1.05]), [tint, 4.5, 0.9, 1.5, 0, 1.15, 0], [tint, 2.3, 1.5, 2.3, 1, 2.1, 0], ['glass', 2.34, 0.6, 2, 1, 2.4, 0], ['glass', 1.9, 0.6, 2.34, 1, 2.4, 0],
      ['trim', 1.9, 1.1, 2.3, -1.3, 1.95, 0], ['lamp', 0.5, 0.2, 0.3, 1, 2.95, 0]],
    // fuel drums standing in a group, n of them: blue and red, some lying on a pallet
    futsVolcan: (n = 8, seed = 0) => [['wood', 2.6, 0.18, 2, 0, 0.09, 0], ...Array.from({ length: n }, (_, i) => [i % 3 ? 'blue' : 'red', 0.6, 0.9, 0.6, (i % 4 - 1.5) * 0.66 + 0.06 * noise(i, seed), 0.63, ((i / 4 | 0) - 0.5) * 0.7, [0, noise(i, seed + 2), 0]])],
    // survey stake, ht high: an orange stake with its flag: one point of a survey line
    piquetVolcan: (ht = 1.7) => [['orange', 0.09, ht, 0.09, 0, ht / 2, 0], ['flag', 0.55, 0.32, 0.03, 0.3, ht - 0.2, 0]],
    // low trestle of the instrument cable (the cable is posed by line() of scenery-volcan.js, 0.9 m up); and the small steel pylon that takes it up a slope, ht high, its arm across the line
    treteauVolcan: () => [...pair(sd => ['steel', 0.08, 1.1, 0.08, 0, 0.4, sd * 0.3, [sd * 0.25, 0, 0]]), ['steel', 0.1, 0.08, 0.9, 0, 0.9, 0]],
    pyloneVolcan: (ht = 7) => [['steel', 0.26, ht + 1, 0.26, 0, ht / 2 - 0.5, 0], ['steel', 0.12, 0.12, 2.2, 0, ht - 0.3, 0], ['orange', 0.3, 0.6, 0.3, 0, ht * 0.5, 0]],
    // observatory hut on the rim: a platform on steel legs, a white cabin with a window band, a railing, an aerial (its dome is a domeVolcan posed on the platform)
    observatoireVolcan: () => [['concrete', 12, 0.5, 9, 0, 0.6, 0], ...pair(sx => pair(sd => ['steel', 0.4, 5, 0.4, sx * 5.4, -1.6, sd * 3.9])).flat(), ['white', 6, 3, 5.5, -2.4, 2.35, 0.6], ['dark', 4.6, 0.9, 0.12, -2.4, 2.7, -2.2], ['orange', 6.3, 0.4, 5.8, -2.4, 3.95, 0.6],
      ['steel', 12, 0.1, 0.1, 0, 1.9, -4.4], ...Array.from({ length: 7 }, (_, i) => ['steel', 0.1, 1.1, 0.1, -6 + i * 2, 1.4, -4.4]), ['steel', 0.1, 5, 0.1, -4.6, 6.4, 2.6]],
    // road or expedition sign, tint = the board's paint, w wide: a steel post and a board with a dark frame
    panneauVolcan: (tint = 'yellow', w = 1.3, ht = 2.8) => [['steel', 0.1, ht, 0.1, 0, ht / 2, 0], ['dark', w + 0.14, 1.04, 0.06, 0, ht - 0.4, 0.02], [tint, w, 0.9, 0.08, 0, ht - 0.4, 0]],
    // bales of hay wrapped in white, n in a row along X, some stacked
    balleVolcan: (n = 5, seed = 0) => Array.from({ length: n }, (_, i) => ['trim', 1.3, 1.25, 1.5, i * 1.5 - n * 0.75 + 0.1 * noise(i, seed), i % 4 === 3 ? 1.85 : 0.6, i % 4 === 3 ? 0 : 0.2 * noise(i, seed + 1), [0, 0.15 * (noise(i, seed + 2) - 0.5), 0]]),
    // field gate, w wide: two stone posts and a five-bar gate of grey wood
    barriereVolcan: (w = 4) => [...pair(sx => ['stone', 0.7, 2, 0.7, sx * (w / 2 + 0.35), 0.6, 0]), ...[0.4, 0.7, 1, 1.3].map(y => ['greywood', w, 0.1, 0.08, 0, y, 0]), ['greywood', w * 1.05, 0.1, 0.08, 0, 0.85, 0, [0, 0, 0.3]]],
    // graves of the churchyard: n white wooden crosses in two rows
    croixVolcan: (n = 10) => Array.from({ length: n }, (_, i) => { const x = ((i >> 1) - n / 4) * 2.2, z = (i & 1) * 3; return [['trim', 0.14, 1.1, 0.14, x, 0.55, z], ['trim', 0.7, 0.14, 0.14, x, 0.8, z]]; }).flat(),
    // flagpole, ht high, tint = the flag
    drapeauVolcan: (ht = 9, tint = 'red') => [['trim', 0.14, ht, 0.14, 0, ht / 2, 0], [tint, 1.8, 1.1, 0.04, 0.98, ht - 0.7, 0], ['trim', 1.8, 0.22, 0.05, 0.98, ht - 0.7, 0], ['trim', 0.22, 1.1, 0.05, 0.7, ht - 0.7, 0]],
    // slipway, L long going down toward +Z (the water) × w wide: a concrete ramp, two steel rails, a winch at its head
    caleVolcan: (L = 26, w = 8) => [['concrete', w, 0.6, L, 0, -L * 0.075, L / 2, [0.15, 0, 0]], ...pair(sx => ['steel', 0.16, 0.16, L, sx * 1.2, -L * 0.075 + 0.4, L / 2, [0.15, 0, 0]]), ['steel', 1.4, 1.1, 1.2, 0, 0.55, -1.2], ['dark', 0.9, 0.9, 1.4, 0, 0.75, -1.2]],
    // white picket fence round a garden, w × d, open toward the house (+Z side left out)
    jardinVolcan: (w = 10, d = 6) => [['trim', w, 0.75, 0.07, 0, 0.45, -d / 2], ...pair(sx => ['trim', 0.07, 0.75, d, sx * w / 2, 0.45, 0]), ...Array.from({ length: Math.round(w / 2) + 1 }, (_, i) => ['trim', 0.12, 1, 0.12, -w / 2 + i * w / Math.round(w / 2), 0.5, -d / 2])],
    // barn, w along the road × ht to the eaves × d deep, tint = its paint: a plain boarded body, a steep dark roof, a wide white-framed door on the front, no window
    grangeVolcan: (w = 14, ht = 5, d = 9, tint = 'red') => { const rise = d * 0.42, a = Math.atan(rise / (d / 2)), sl = Math.hypot(rise, d / 2);
      return [[tint, w, ht + 3, d, 0, (ht - 3) / 2, 0], ...pair(sd => ['roof', w + 1, 0.3, sl + 0.5, 0, ht + rise / 2, sd * d / 4, [sd * a, 0, 0]]), [tint, w - 0.1, rise * 0.5, d * 0.5, 0, ht + rise * 0.25, 0], [tint, w - 0.1, rise * 0.25, d * 0.22, 0, ht + rise * 0.62, 0],
        ['trim', 3.8, 3.6, 0.16, 0, 1.8, -d / 2 - 0.02], ['dark', 3.2, 3.3, 0.24, 0, 1.65, -d / 2 - 0.02], ...pair(sx => pair(sd => ['trim', 0.24, ht, 0.24, sx * w / 2, ht / 2, sd * d / 2])).flat()]; },
  });
})();
