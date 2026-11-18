// Shapes specific to "area51", families "underground shell" and "reactor and plant": completes the shapes.js catalogue. Metres, Y up. Assemblies; zones are the shared materials of the map (MAT in scenery-area51.js).
// Pieces placed along the road (galerie, railTram, portail, portique) use the road frame: X across (positive to the right), Z along, origin on the axis at road level. The others have their origin on the ground at their centre.
// f = +1 or -1 where a piece has a face turned toward the road: the side of local X that looks at it.
// See docs/proposals/area51/AMBIANCE-V2.html, zone 2: raw board-marked concrete, thick door frames, hazard bands, regular cold ceiling lights, the blue of the pool as the one colour event.
// The mood is a buried government lab (the Black Mesa of Half-Life as a place, not a copy). Not a cave, not a white science-fiction corridor, no glowing barrels.
(function () {
  const pair = f => [-1, 1].map(f), oct = (z, w, ht, x, y, zz) => [0, 0.7854].map(a => [z, w, ht, w, x, y, zz, [0, a, 0]]); // oct: two crossed boxes, an octagon in plan
  Object.assign(SHAPES, {
    // one section of B1, len long: free width L to the left and R to the right of the axis, `clear` under the ceiling, `cap` m of rock above it up to the surface, a lid in the colour of the ground;
    // wallR = 0 where the room goes on to the right (reactor hall). Side walls with an amber line at 1.4 m, a paved floor flush under the roadway (not in the hall: its floor is the pool), a ceiling light, two pipe runs on the left wall, chamfered corners in the 24 m gallery.
    // e = a few centimetres by which this section is set out and up from its neighbours: sections overlap in the bends, and two faces in the same plane would flicker
    galerieArea51: (L = 12, R = 12, clear = 10, cap = 4, wallR = 1, len = 16.5, e = 0, k = 0, base = 16) => { const W = L + R, cx = (R - L) / 2, wl = sd => Math.max(2, base * (1 - sd * k * ((sd < 0 ? L : R) + 3))) + 0.3, // k = curvature of the road (positive: bends right): each wall has the length of its own arc, so in a bend the panels meet end to end instead of fanning over each other
        wall = sd => [['concrete', 6, clear + 3, wl(sd), sd * ((sd < 0 ? L : R) + 3 + e), (clear + 3) / 2 - 2, 0], ['amber', 0.3, 0.5, wl(sd), sd * ((sd < 0 ? L : R) - 0.1 + e), 1.4, 0]];
      return [...wall(-1), ...(wallR ? [...wall(1), ['floor', W + 6, 0.5, len, cx, -0.5 + e, 0]] : []), ['dark', W + 12, 1.2, len, cx, clear + 0.6 + e, 0], ['rock', W + 30, cap, len, cx, clear + 1.8 + cap / 2 + e, 0], ['sol', W + 32, 1, len + 0.5, cx, clear + 2.3 + cap + 2 * e, 0],
        ...(W <= 24 ? pair(sd => ['concrete', 4, 4, wl(sd), sd * (L - 0.4 + e), clear - 0.4, 0, [0, 0, 0.7854]]) : []),
        ['neon', 1.4, 0.25, base * 0.44, cx / 2, clear - 0.15, 0], ['gray', 0.8, 0.8, wl(-1), -L + 0.9 - e, clear - 2.4, 0], ['amber', 0.5, 0.5, wl(-1), -L + 0.8 - e, clear - 3.5, 0]]; },
    // airlock bulkhead across a room (L, R, clear as for galerieArea51), the road passing through an opening 2 × W wide and 8.5 m high: a 3 m concrete wall, a hazard frame, the two steel leaves slid aside
    // with their radiation panels, red lights on the lintel. Two of them in a row make a lock
    sasArea51: (L = 20, R = 20, clear = 12, W = 11.3) => [...pair(sd => { const half = sd < 0 ? L : R, pw = half - W + 6; return [['concrete', pw, clear + 3, 3, sd * (W + pw / 2), (clear + 3) / 2 - 2, 0], ['danger', 1.2, 8.5, 3.4, sd * (W + 0.6), 4.25, 0],
        ['gray', W * 0.8, 8.5, 1, sd * (W + 1.4 + W * 0.4), 4.25, -2.1], ['steel', W * 0.8, 0.5, 1.2, sd * (W + 1.4 + W * 0.4), 4.25, -2.1], ['trefle', 3.6, 3.6, 0.2, sd * (W + 1.4 + W * 0.4), 6.4, -2.72], ['fire', 0.7, 0.7, 0.7, sd * (W - 1), 9.9, -1.9]]; }).flat(),
      ['concrete', 2 * W, clear - 6.5, 3, 0, 8.5 + (clear - 6.5) / 2, 0], ['danger', 2 * W + 2.4, 1.1, 3.4, 0, 9.05, 0]],
    // goods siding at a right angle to the road, len long toward f (origin at its road end): narrow-gauge rails on sleepers, a flat wagon with two crates, a buffer stop
    voieArea51: (len = 12, f = 1) => [...pair(sd => ['steel', len, 0.2, 0.15, f * len / 2, 0.25, sd * 0.5]), ...Array.from({ length: Math.round(len / 1.3) }, (_, i) => ['dark', 0.3, 0.14, 1.7, f * (0.65 + i * 1.3), 0.08, 0]),
      ['danger', 0.6, 1.1, 1.8, f * len, 0.55, 0], ['gray', 3.4, 0.4, 1.5, f * len * 0.5, 0.75, 0], ['amber', 1.3, 1.2, 1.2, f * (len * 0.5 - 0.8), 1.55, 0], ['white', 1.1, 0.9, 1.1, f * (len * 0.5 + 0.8), 1.4, 0]],
    // tunnel portal, W = half-width of the opening (10 m high): a concrete headwall 2 × (W + 20) wide and 20 m high that retains the banked ground and hides the end of the shell, a coping, a hazard band under the lintel, a lit sign on each face
    portailArea51: (W = 12.2) => [...pair(sd => ['concrete', 20, 20, 5, sd * (W + 10), 9, 0]), ['concrete', 2 * W, 9, 5, 0, 14.5, 0], ['dark', 2 * W + 41, 0.8, 6, 0, 19.4, 0], ['danger', 2 * W, 1, 5.2, 0, 10.4, 0], ...pair(sd => ['neon', 7, 1.2, 0.3, 0, 14, sd * 2.7])],
    // monitoring arch over the road, W = half-width: amber frame, two columns of sensors
    portiqueArea51: (W = 11.6) => [...pair(sd => [['amber', 0.8, 9, 0.8, sd * W, 4.5, 0], ['neon', 0.3, 5, 0.3, sd * (W - 0.5), 4.5, 0.6]]).flat(), ['amber', 2 * W + 0.8, 1.2, 1.2, 0, 9, 0]],
    // labs building: w × ht × d, white, two lit bands of windows toward f, plant on the roof
    laboArea51: (f = 1, w = 14, ht = 12, d = 70) => [['concrete', w + 0.4, 1, d + 0.4, 0, 0.5, 0], ['white', w, ht - 1, d, 0, 1 + (ht - 1) / 2, 0], ...[4, 8.4].map(y => ['verriere', 0.3, 1.6, d - 6, f * (w / 2 + 0.1), y, 0]), ['gray', 4, 1.6, 8, 0, ht + 0.8, d / 4]],
    // armoured door in a wall: the leaf w wide and ht high, a hazard frame, a red light; flat against the wall, facing f
    porteBlindeeArea51: (f = 1, w = 20, ht = 10) => [['gray', 1, ht, w, 0, ht / 2, 0], ...pair(sd => ['danger', 1.4, ht + 1, 1.2, f * 0.3, (ht + 1) / 2, sd * (w / 2 + 0.6)]), ['danger', 1.4, 1.2, w + 2.4, f * 0.3, ht + 0.6, 0], ['fire', 0.6, 0.6, 0.6, f * 0.8, ht + 1.6, 0]],
    // test chamber: concrete cell with a window lit by the blue of the pool toward f
    chambreTestArea51: (f = 1) => [['concrete', 12, 9, 22, 0, 4.5, 0], ['pool', 0.3, 2.4, 14, f * 6.1, 4.6, 0], ['gray', 0.4, 4, 2.4, f * 6.1, 2, -9]],
    // research reactor in its pool (origin at the bottom of the pool, 7 m below the hall floor): octagonal concrete shield, steel vessel, head, an amber service ring, a beacon
    reacteurArea51: () => [...oct('concrete', 30, 10, 0, 5, 0), ...oct('steel', 18, 16, 0, 18, 0), ...oct('amber', 22, 0.6, 0, 20, 0), ...oct('gray', 12, 5, 0, 28.5, 0), ['fire', 1, 1, 1, 0, 31.5, 0]],
    // polar crane spanning the hall, L long (origin under the middle of the girders): two amber girders, end trucks, the trolley and its hook
    pontPolaireArea51: (L = 104) => [...pair(sd => ['amber', L, 2.6, 1.2, 0, 1.3, sd * 2.6]), ...pair(sd => ['gray', 3, 3, 8, sd * L / 2, 1.5, 0]), ['gray', 6, 2, 6.4, L * 0.12, 3.4, 0], ['steel', 0.3, 9, 0.3, L * 0.12, -4.5, 0], ['amber', 2, 1.4, 2, L * 0.12, -9.5, 0]],
    // control room on a gallery of the wall, len long, its lit windows toward f
    salleControleArea51: (f = 1, len = 44) => [['concrete', 6, 7, len, 0, 3.5, 0], ['verriere', 0.3, 2.4, len - 4, f * 3.1, 4, 0], ['gray', 6.6, 0.5, len + 0.6, 0, 7.2, 0], ...[-len / 3, 0, len / 3].map(z => ['gray', 1, 7, 1, f * 2, -3.5, z])],
    // footbridge, L long along X: amber deck, lattice rails
    passerelleArea51: (L = 70) => [['amber', L, 0.3, 3, 0, 0, 0], ...pair(sd => ['lattice', L, 1.2, 0.15, 0, 0.75, sd * 1.5])],
    // waste casks: three amber drums on a concrete pad
    futsArea51: () => [['concrete', 6, 0.4, 14, 0, 0.2, 0], ...[-4.5, 0, 4.5].flatMap(z => oct('amber', 2.8, 4.2, 0, 2.5, z))],
    // headframe over the silo shaft: lattice tower, sheave on top, a winch cabin
    chevalementArea51: () => [['lattice', 6, 16, 6, 0, 8, 0], ...pair(sx => pair(sz => ['steel', 0.5, 16, 0.5, sx * 3, 8, sz * 3])).flat(), ['gray', 7, 1, 7, 0, 16.5, 0], ...[0, 0.7854].map(a => ['gray', 3, 3, 0.6, 0, 18.5, 0, [0, 0, a]]), ['tin', 5, 4, 6, 6, 2, 0]],
    // low dry cooler of a research reactor (30 × 14 × 16): louvred body on a concrete base, three fan stacks
    aeroArea51: () => [['concrete', 30, 3, 16, 0, 1.5, 0], ['gray', 29, 8, 15, 0, 7, 0], ...[-9, 0, 9].flatMap(x => oct('steel', 6.5, 3, x, 12.5, 0))],
    // high-voltage pylon, 30 m: lattice shaft in two stages, three cross-arms
    pyloneArea51: () => [['lattice', 3.6, 20, 3.6, 0, 10, 0], ['lattice', 2.2, 10, 2.2, 0, 25, 0], ...[[21, 14], [25.5, 11], [29.6, 7]].map(([y, w]) => ['steel', w, 0.5, 0.5, 0, y, 0])],
    // transformer on its plinth, w × d: tank, cooling fins, three bushings
    transfoArea51: (w = 20, d = 14) => [['concrete', w, 1, d, 0, 0.5, 0], ['gray', w * 0.5, 4, d * 0.6, 0, 3, 0], ...pair(sd => ['steel', w * 0.16, 3, d * 0.56, sd * w * 0.36, 2.6, 0]), ...[-1, 0, 1].map(k => ['white', 0.7, 2, 0.7, k * w * 0.14, 6, 0])],
    // ventilation shaft head: concrete cube, louvred cap
    puitsArea51: () => [['concrete', 8, 8, 8, 0, 4, 0], ['gray', 9, 2, 9, 0, 9, 0]],
    // filter house beside the stack
    filtresArea51: () => [['concrete', 20, 8, 12, 0, 4, 0], ['gray', 6, 3, 6, -5, 9.5, 0], ['gray', 3, 3, 3, 9, 3.5, 0, [0, 0, 0.6]]],
  });
})();
