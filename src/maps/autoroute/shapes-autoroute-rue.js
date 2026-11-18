// Shapes specific to "autoroute", family "street, army, metro": completes the shapes.js catalogue. Metres, origin on the ground at the centre, Y up; a piece along a street has its length on Z.
// Assemblies (lists of boxes [zone, w, h, d, x, y, z, rotation]); zones are the names of the map's shared materials (MAT in scenery-autoroute.js):
// concrete, dark, steel, rust, olive, canvas, bark, leaf, ivy, reed, glass, pane, sign, tile, rubble, lamp.
// See docs/proposals/sunken-highway/AMBIANCE-V2.html: the army checkpoint (staggered concrete barriers, watchtower, tent), street trees grown huge, a metro left as it was.
(function () {
  const H = (v, k) => { const x = Math.sin(v * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  Object.assign(SHAPES, {
    // concrete road barrier, 3.6 m long, 0.9 m high: wide foot, narrow top
    barriereAutoroute: () => [['concrete', 0.8, 0.35, 3.6, 0, 0.17, 0], ['concrete', 0.4, 0.6, 3.6, 0, 0.62, 0]],
    // watchtower, 9 m: four legs, braces, a cabin with a slit of windows, a flat roof, a ladder
    miradorAutoroute: () => [...[-1, 1].flatMap(a => [-1, 1].map(b => ['steel', 0.25, 6, 0.25, a * 1.3, 3, b * 1.3])), ['steel', 3, 0.15, 0.15, 0, 3, 1.3, [0, 0, 0.7]], ['steel', 0.15, 0.15, 3, 1.3, 3, 0, [0.7, 0, 0]],
      ['steel', 3.4, 0.25, 3.4, 0, 6, 0], ['olive', 3, 2, 3, 0, 7.1, 0], ['pane', 3.06, 0.6, 3.06, 0, 7.4, 0], ['olive', 3.8, 0.25, 3.8, 0, 8.3, 0], ['steel', 0.5, 6, 0.1, 0, 3, -1.5]],
    // guard post: a concrete booth with windows and a lifted barrier arm (toward +X, across the lane it controlled)
    gueriteAutoroute: () => [['concrete', 3, 2.6, 3, 0, 1.3, 0], ['pane', 3.06, 0.8, 2.2, 0, 1.7, 0], ['dark', 3.6, 0.25, 3.6, 0, 2.75, 0], ['steel', 0.3, 1.2, 0.3, 2.2, 0.6, 0], ['rust', 6, 0.15, 0.15, 4.6, 2.6, 0, [0, 0, 0.55]]],
    // army tent, 6 × 3 × 8 m: two canvas slopes on a ridge, closed ends, sagging
    tenteAutoroute: () => [...[-1, 1].map(s => ['canvas', 3.6, 0.15, 8, s * 1.45, 1.75, 0, [0, 0, -s * 0.85]]), ['canvas', 5.2, 1.4, 0.15, 0, 0.7, -4], ['canvas', 5.2, 1.4, 0.15, 0, 0.7, 4], ['canvas', 2.6, 1.3, 0.15, 0, 2, 4], ['canvas', 2.6, 1.3, 0.15, 0, 2, -4]],
    // wall of sandbags l m long, 1.2 m high, laid in three uneven courses
    sacsAutoroute: (l = 8) => [['canvas', 1.1, 0.45, l, 0, 0.22, 0], ['canvas', 0.9, 0.4, l - 0.6, 0.05, 0.62, 0.2], ['canvas', 0.75, 0.38, l - 1.4, -0.03, 1, -0.1]],
    // street lamp, 10 m, its arm over the road toward +X; lean = how far it has tilted (rad)
    lampadaireAutoroute: (lean = 0) => [['steel', 0.28, 10, 0.28, Math.sin(lean) * 5, 5, 0, [0, 0, -lean]], ['steel', 3, 0.18, 0.18, Math.sin(lean) * 10 + 1.4, 9.9, 0, [0, 0, -lean]], ['dark', 1, 0.2, 0.5, Math.sin(lean) * 10 + 2.6, 9.75, 0, [0, 0, -lean]]],
    // sign gantry across a road of half-width W, 7 m clear: two posts, a lattice beam, one panel (zone sign: 8 × 2 m)
    portiqueAutoroute: (W = 8) => [...[-1, 1].map(s => ['steel', 0.6, 8.6, 0.6, s * (W + 1), 4.3, 0]), ['steel', 2 * W + 2.6, 0.3, 0.3, 0, 7.2, 0], ['steel', 2 * W + 2.6, 0.3, 0.3, 0, 8.5, 0],
      ...Array.from({ length: 6 }, (_, i) => ['steel', 0.2, 1.3, 0.2, (i - 2.5) * (2 * W / 6), 7.85, 0, [0, 0, i & 1 ? 0.5 : -0.5]]), ['sign', 8, 2.2, 0.2, -W * 0.25, 8, -0.35]],
    // tree fallen across a street, l m long along X: root plate, trunk lying, the crown crushed on the ground at the far end
    arbreTombeAutoroute: (l = 20) => [['bark', 3.5, 3.5, 0.8, -l / 2 + 0.5, 1.6, 0, [0, 1.57, 0.2]], ['bark', l * 0.7, 1, 1, -l * 0.12, 1, 0, [0, 0, 0.04]], ['leaf', l * 0.4, 3.6, 6, l * 0.3, 1.8, 0, [0, 0.3, 0]], ['leaf', l * 0.25, 2.6, 4.5, l * 0.12, 1.5, 1.5, [0.2, -0.4, 0]], ['bark', 3, 0.4, 0.4, l * 0.2, 2.4, -1.8, [0, 0.5, 0.5]]],
    // bank of reeds w × d, 2.4 m: a few masses of uneven height, one willow shoot
    roseauxAutoroute: (w = 12, d = 60, v = 0) => [...Array.from({ length: 5 }, (_, i) => ['reed', w * (0.5 + 0.4 * H(v, i)), 1.4 + 1.2 * H(v, i + 9), d * 0.24, (H(v, i + 20) - 0.5) * w * 0.3, 0.7 + 0.5 * H(v, i + 9), (i - 2) * d * 0.2])],
    // collapsed scaffolding w × ht × d: standards and ledgers fallen every way, torn netting
    echafaudageAutoroute: (w = 20, ht = 5, d = 8, v = 0) => [...Array.from({ length: 14 }, (_, i) => ['steel', 0.15, 0.15, 5 + 4 * H(v, i), (H(v, i + 30) - 0.5) * w * 0.8, ht * 0.2 + ht * 0.6 * H(v, i + 60), (H(v, i + 90) - 0.5) * d * 0.6, [(H(v, i + 120) - 0.5) * 2, H(v, i + 150) * 3, (H(v, i + 180) - 0.5) * 2]]),
      ['canvas', w * 0.5, 0.1, d * 0.7, -w * 0.15, ht * 0.4, 0, [0.4, 0.3, 0.5]], ['dark', w * 0.3, 0.12, 2.4, w * 0.25, ht * 0.25, 0, [0.2, 0.9, -0.3]]],
    // slab of a broken deck or roadway w × d, 0.6 m thick, fallen at angle a about X, with its bars
    dalleAutoroute: (w = 6, d = 10, a = 0.3) => [['concrete', w, 0.6, d, 0, Math.sin(Math.abs(a)) * d / 2 + 0.3, 0, [a, 0, 0]], ['dark', w - 0.4, 0.12, d - 0.4, 0, Math.sin(Math.abs(a)) * d / 2 + 0.66, 0, [a, 0, 0]], ...[-1, 0, 1].map(k => ['rust', 0.1, 0.1, 2, k * w * 0.3, 0.6, -d / 2 - 0.6, [a + 0.4, 0, 0]])],
    // metro station entrance: a steel and glass canopy on four posts over the stairwell (w × d), its sign on a mast
    ediculeAutoroute: (w = 16, d = 40, ht = 5) => [...[-1, 1].flatMap(a => [-1, 0, 1].map(b => ['steel', 0.4, ht, 0.4, a * (w / 2 - 0.4), ht / 2, b * (d / 2 - 0.4)])), ['steel', w, 0.4, d, 0, ht + 0.2, 0], ['pane', w - 1.2, 0.15, d - 1.2, 0, ht + 0.5, 0],
      ...[-1, 1].map(a => ['concrete', 0.5, 1.1, d, a * (w / 2 - 0.25), 0.55, 0]), ['steel', 0.3, 7, 0.3, w / 2 + 1, 3.5, -d / 2], ['lamp', 2.4, 1.2, 0.3, w / 2 + 1, 7, -d / 2]],
    // row of turnstiles across w m and a ticket booth beside it
    portillonsAutoroute: (w = 10) => [...Array.from({ length: Math.floor(w / 1.4) }, (_, i) => ['steel', 0.35, 1.1, 1.4, -w / 2 + 0.7 + i * 1.4, 0.55, 0]), ['concrete', 2.6, 2.6, 2.6, w / 2 + 1.8, 1.3, 0], ['pane', 2.66, 0.9, 1.8, w / 2 + 1.8, 1.7, 0]],
  });
})();
