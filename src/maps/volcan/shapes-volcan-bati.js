// Shapes specific to "volcan", family "buildings": completes the shapes.js catalogue. Metres, origin on the ground at the centre of the building, Y up.
// Assemblies (boxes [zone, w, h, d, x, y, z, rotation]); X along the road, front toward -Z (the road), +Z away from it. Bodies go 3 m into the ground so that they sit on a slope.
// Zones are keys of the map's shared materials (MAT in scenery-volcan.js): the paints red, yellow, blue, green, orange, violet, teal, white; trim, roof, dark, stone, concrete, paving, steel, wood, lamp.
// See docs/proposals/volcanic-island/AMBIANCE-V2.html, zones 1, 5 and 6: small gabled timber houses, one strong colour each, white trims, dark roofs. Not stucco, not tiles, not pastel.
(function () {
  const pair = f => [-1, 1].map(f);
  // gable roof over a w × d body whose eaves are at ht, ridge along X: two dark slopes, the two gable ends in the wall paint, white barge boards
  const roof = (w, ht, d, tint, rise = d * 0.36, over = 0.5) => { const a = Math.atan(rise / (d / 2)), sl = Math.hypot(rise, d / 2);
    return [...pair(sd => ['roof', w + over * 2, 0.3, sl + over, 0, ht + rise / 2, sd * d / 4, [sd * a, 0, 0]]), [tint, w - 0.1, rise * 0.5, d * 0.5, 0, ht + rise * 0.25, 0], [tint, w - 0.1, rise * 0.25, d * 0.22, 0, ht + rise * 0.62, 0],
      ...pair(sx => pair(sd => ['trim', 0.2, 0.25, sl + over, sx * (w / 2 + over), ht + rise / 2 + 0.1, sd * d / 4, [sd * a, 0, 0]])).flat()]; };
  // window on the front (-Z) of a body d deep, at (x, y): a white frame, the dark pane; door: a white frame, a wooden leaf
  const win = (x, y, d, w = 1, ht = 1.2) => [['trim', w + 0.4, ht + 0.4, 0.16, x, y, -d / 2 - 0.02], ['dark', w, ht, 0.24, x, y, -d / 2 - 0.02]];
  const door = (x, d, w = 1.1, ht = 2.1) => [['trim', w + 0.4, ht + 0.2, 0.16, x, ht / 2 + 0.1, -d / 2 - 0.02], ['wood', w, ht, 0.24, x, ht / 2, -d / 2 - 0.02]];
  Object.assign(SHAPES, {
    // timber house, w along the road × ht to the eaves × d deep, tint = its paint: stone foot, white corner boards, steep dark gable roof, a door and framed windows on the front, a window on both ends
    maisonVolcan: (w = 10, ht = 5, d = 8, tint = 'red') => { const nw = Math.max(2, Math.round(w / 3.4)), up = ht > 4.6;
      return [[tint, w, ht + 3, d, 0, (ht - 3) / 2, 0], ['stone', w + 0.2, 3.6, d + 0.2, 0, -1.3, 0], ...roof(w, ht, d, tint),
        ...pair(sx => pair(sd => ['trim', 0.22, ht, 0.22, sx * w / 2, ht / 2, sd * d / 2])).flat(), ...door(-w / 2 + 1.7, d),
        ...Array.from({ length: nw }, (_, i) => -w / 2 + (i + 0.5) * w / nw).flatMap(x => [...(Math.abs(x + w / 2 - 1.7) < 1.4 ? [] : win(x, 1.6, d)), ...(up ? win(x, ht - 1.3, d) : [])]),
        ...pair(sx => ['dark', 0.2, 1.2, 1, sx * (w / 2 + 0.05), up ? ht - 1.3 : 1.6, 0])]; },
    // boathouse, w wide × ht × d deep, its gable toward the road and its wide door on the far side (+Z, the water): one paint, white trims, dark roof, a small door and a loft hatch on the road gable
    naustVolcan: (w = 9, ht = 3.6, d = 16, tint = 'red') => { const rise = w * 0.4, a = Math.atan(rise / (w / 2)), sl = Math.hypot(rise, w / 2);
      return [[tint, w, ht + 3, d, 0, (ht - 3) / 2, 0], ...pair(sd => ['roof', sl + 0.5, 0.3, d + 1, sd * w / 4, ht + rise / 2, 0, [0, 0, -sd * a]]), [tint, w * 0.5, rise * 0.5, d - 0.1, 0, ht + rise * 0.25, 0], [tint, w * 0.22, rise * 0.25, d - 0.1, 0, ht + rise * 0.62, 0],
        ...pair(sx => pair(sd => ['trim', 0.22, ht, 0.22, sx * w / 2, ht / 2, sd * d / 2])).flat(), ...door(-w / 4, d), ['trim', 1.4, 1.2, 0.16, 0, ht + rise * 0.3, -d / 2 - 0.02], ['dark', 1, 0.8, 0.24, 0, ht + rise * 0.3, -d / 2 - 0.02], ['dark', w * 0.62, ht * 0.8, 0.24, 0, ht * 0.4, d / 2 + 0.02]]; },
    // timber church: white nave 8 × 15 m, its ridge along Z, a square tower over the door (toward -Z) carrying a pointed dark spire, tall dark windows along the sides
    egliseVolcan: () => { const a = Math.atan(3.4 / 4), sl = Math.hypot(3.4, 4), sp = [[3.6, 3], [2.8, 3], [2, 3], [1.2, 3], [0.5, 3]];
      return [['white', 8, 9.5, 15, 0, 1.75, 1.5], ['stone', 8.2, 3.6, 15.2, 0, -1.3, 1.5], ...pair(sd => ['roof', sl + 0.5, 0.3, 16, sd * 2, 6.5 + 1.7, 1.5, [0, 0, -sd * a]]), ['white', 4, 1.7, 14.9, 0, 7.3, 1.5], ['white', 1.8, 0.9, 14.9, 0, 8.6, 1.5],
        ...pair(sd => [-3, 1.5, 6].map(z => ['dark', 0.2, 2.6, 0.9, sd * 4.05, 3.6, z])).flat(), ['white', 4.2, 16, 4.2, 0, 5, -6.6], ...door(0, 17.4, 1.5, 2.6), ...pair(sd => ['dark', 0.2, 1.8, 1.1, sd * 2.15, 10.6, -6.6]), ['dark', 1.1, 1.8, 0.2, 0, 10.6, -8.75],
        ['roof', 5, 0.4, 5, 0, 13.2, -6.6], ...sp.map(([w, ht], i) => ['roof', w, ht + 0.1, w, 0, 13.4 + i * 3 + 1.5, -6.6]), ['steel', 0.12, 2.2, 0.12, 0, 29.4, -6.6], ['steel', 0.9, 0.12, 0.12, 0, 29.8, -6.6]]; },
    // fish market, L along the road × w deep: a long dark roof on concrete posts over a slab, a low boarded wall at the back, open toward the road
    crieeVolcan: (L = 60, w = 20, ht = 4.2) => [['concrete', L, 0.9, w, 0, -0.1, 0], ...roof(L, ht, w, 'white', w * 0.2, 1.2), ['white', L, ht - 1, 0.5, 0, (ht - 1) / 2, w / 2 - 0.3],
      ...Array.from({ length: Math.round(L / 7.5) + 1 }, (_, i) => -L / 2 + 0.4 + i * (L - 0.8) / Math.round(L / 7.5)).flatMap(x => pair(sd => ['concrete', 0.5, ht, 0.5, x, ht / 2, sd * (w / 2 - 0.5) * (sd > 0 ? 0.6 : 1)])),
      ...[-0.3, 0, 0.3].map(k => ['wood', 6, 0.9, 2, k * L, 0.8, 1])],
    // observers' post, w × ht × d: a plain concrete block with a flat overhanging roof, a dark window band toward the road, a steel mast with two aerials on the roof
    posteVolcan: (w = 12, ht = 5, d = 9, mast = 14) => [['concrete', w, ht + 3, d, 0, (ht - 3) / 2, 0], ['concrete', w + 1.6, 0.5, d + 1.6, 0, ht + 0.25, 0], ['dark', w * 0.7, 1.2, 0.2, 0, ht * 0.62, -d / 2 - 0.05], ['dark', 1.2, 2.2, 0.2, w * 0.36, 1.1, d / 2 + 0.05],
      ['steel', 0.3, mast, 0.3, w * 0.3, ht + mast / 2, d * 0.2], ['steel', 2.4, 0.15, 0.15, w * 0.3, ht + mast - 1, d * 0.2], ['steel', 1.6, 0.15, 0.15, w * 0.3, ht + mast - 2.6, d * 0.2], ['red', 0.5, 0.5, 0.5, w * 0.3, ht + mast + 0.2, d * 0.2]],
    // belvedere of the pass, L along the road × w deep: a paved deck flush with the roadside, a steel railing on its three outer sides, three benches facing the sea (+Z)
    belvedereVolcan: (L = 44, w = 24) => [['paving', L, 3, w, 0, -1.2, 0], ['steel', L, 0.12, 0.12, 0, 1.4, w / 2 - 0.3], ['steel', L, 0.1, 0.1, 0, 0.9, w / 2 - 0.3], ...pair(sx => ['steel', 0.12, 0.12, w, sx * (L / 2 - 0.3), 1.4, 0]),
      ...Array.from({ length: Math.round(L / 3) + 1 }, (_, i) => ['steel', 0.14, 1.1, 0.14, -L / 2 + 0.3 + i * (L - 0.6) / Math.round(L / 3), 0.85, w / 2 - 0.3]), ...Array.from({ length: 9 }, (_, i) => pair(sx => ['steel', 0.14, 1.1, 0.14, sx * (L / 2 - 0.3), 0.85, -w / 2 + 0.3 + i * (w - 0.6) / 8])).flat(),
      ...[-1, 0, 1].flatMap(k => [['wood', 3, 0.15, 0.7, k * L * 0.3, 0.75, w / 2 - 3], ['concrete', 0.3, 0.5, 0.6, k * L * 0.3 - 1.2, 0.5, w / 2 - 3], ['concrete', 0.3, 0.5, 0.6, k * L * 0.3 + 1.2, 0.5, w / 2 - 3]])],
    // measuring instrument on a post, beside the road in the crater
    capteurVolcan: () => [['steel', 0.15, 2.4, 0.15, 0, 1.2, 0], ['trim', 0.7, 0.7, 0.5, 0, 2.5, 0], ['dark', 0.9, 0.08, 0.7, 0, 3, 0, [0.5, 0, 0]]],
  });
})();
