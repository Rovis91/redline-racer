// Shapes specific to "volcan", family "racks, cairns, fences, huts and roadside posts": completes the shapes.js catalogue. Metres, origin at the foot, Y up.
// Assemblies (boxes [zone, w, h, d, x, y, z, rotation]); X along the road, front toward -Z (the road). Zones are keys of the map's shared materials (MAT in scenery-volcan.js): greywood, stone, net, moss, wood, trim, dark, yellow, steel, concrete, lamp and the paints.
// See docs/proposals/volcanic-island/AMBIANCE-V2.html, zones 1, 2 and 5: tall A-frame fish racks, cairns as track markers, a fence round a farm. No tree, no planting.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  Object.assign(SHAPES, {
    // rack for drying fish, L along the road, ht to the ridge: A-frames every 3.5 m, a ridge pole, three rails a side, rows of fish hanging as pale strips under the rails
    sechoirVolcan: (L = 14, ht = 7) => { const half = ht * 0.42, a = Math.atan(half / ht), sl = Math.hypot(half, ht), n = Math.round(L / 3.5), B = [['greywood', L + 1, 0.22, 0.22, 0, ht, 0]];
      for (let i = 0; i <= n; i++) for (const sd of [-1, 1]) B.push(['greywood', 0.22, sl + 1, 0.22, -L / 2 + i * L / n, ht / 2 - 0.4, sd * half / 2, [sd * a, 0, 0]]);
      for (const sd of [-1, 1]) for (let k = 1; k <= 3; k++) { const y = ht * (0.25 + k * 0.2), z = sd * half * (1 - y / ht); B.push(['greywood', L, 0.14, 0.14, 0, y, z], ['net', L - 1, 0.9, 0.12, 0, y - 0.6, z]); }
      return B; },
    // cairn, ht high: a pile of black stones narrowing upward, each a little turned: the marker of the old track
    cairnVolcan: (ht = 2.4, seed = 0) => Array.from({ length: 5 }, (_, i) => { const w = ht * (0.62 - i * 0.1); return ['stone', w, ht / 5 + 0.05, w * (0.8 + 0.3 * noise(i, seed)), 0.08 * (noise(i, seed + 3) - 0.5), ht / 10 + i * ht / 5, 0, [0, noise(i, seed + 5) * 1.5, 0]]; }),
    // snow pole at the road edge, ht high: a yellow stake with a white band and a dark cap, the edge marker of northern roads
    jalonVolcan: (ht = 2.1) => [['yellow', 0.13, ht, 0.13, 0, ht / 2, 0], ['trim', 0.15, 0.22, 0.15, 0, ht - 0.4, 0], ['dark', 0.15, 0.12, 0.15, 0, ht, 0]],
    // wooden pole of the power line, ht high: the cross-arm lies across the line (along Z), an insulator at each end (the wires are posed by line() of scenery-volcan.js)
    poteauVolcan: (ht = 10) => [['wood', 0.32, ht + 1, 0.32, 0, ht / 2 - 0.5, 0], ['wood', 0.2, 0.2, 3, 0, ht - 0.8, 0], ...[-1, 1].map(sd => ['trim', 0.14, 0.3, 0.14, 0, ht - 0.55, sd * 1.3])],
    // saddle of the hot-water pipe: a concrete block and its steel cradle, the pipe rests 1.5 m up
    supportVolcan: () => [['concrete', 0.5, 2.1, 1.2, 0, 0.05, 0], ['steel', 1.2, 0.15, 1.2, 0, 1.05, 0]],
    // turf-roofed hut, w along the road x d deep: low stone walls, a roof of two moss slopes down to head height, painted timber gable ends, a door and a small window on the front, a stone chimney
    torfVolcan: (w = 9, d = 6, tint = 'red') => { const wall = 1.5, rise = 2.6, a = Math.atan(rise / (d / 2 + 0.8)), sl = Math.hypot(rise, d / 2 + 0.8);
      return [['stone', w, wall + 3, d, 0, wall / 2 - 1.5, 0], ...[-1, 1].map(sd => ['moss', w + 0.8, 0.6, sl + 0.6, 0, wall + rise / 2 - 0.35, sd * (d / 4 + 0.4), [sd * a, 0, 0]]),
        ...[-1, 1].map(sx => [[tint, 0.3, rise * 0.5, d * 0.55, sx * (w / 2 - 0.15), wall + rise * 0.25, 0], [tint, 0.3, rise * 0.3, d * 0.25, sx * (w / 2 - 0.15), wall + rise * 0.62, 0]]).flat(),
        ['wood', 1, 1.7, 0.2, -w * 0.2, 0.85, -d / 2 - 0.05], ['trim', 0.9, 0.7, 0.2, w * 0.22, 1, -d / 2 - 0.05], ['stone', 0.7, 1.4, 0.7, w * 0.3, wall + rise + 0.2, 0]]; },
    // sheep: a white fleece, a dark head, four legs; static
    moutonVolcan: () => [['trim', 1, 0.6, 0.55, 0, 0.7, 0], ['dark', 0.32, 0.32, 0.3, 0.62, 0.85, 0], ...[-1, 1].map(sx => [-1, 1].map(sd => ['dark', 0.1, 0.45, 0.1, sx * 0.35, 0.2, sd * 0.18])).flat()],
    // street lamp of the quay, 6 m: a steel post, an arm toward the road (-Z), the lamp head (a lit face, no light cast)
    reverbereVolcan: () => [['steel', 0.16, 6, 0.16, 0, 3, 0], ['steel', 0.12, 0.12, 1.6, 0, 6, -0.7], ['lamp', 0.35, 0.15, 0.6, 0, 5.9, -1.3]],
    // sheep fence, L long: posts every 2.5 m and two rails of grey wood
    clotureVolcan: (L = 30) => [...Array.from({ length: Math.round(L / 2.5) + 1 }, (_, i) => ['greywood', 0.14, 1.9, 0.14, -L / 2 + i * L / Math.round(L / 2.5), 0.35, 0]), ['greywood', L, 0.1, 0.08, 0, 1.1, 0], ['greywood', L, 0.1, 0.08, 0, 0.6, 0]],
  });
})();
