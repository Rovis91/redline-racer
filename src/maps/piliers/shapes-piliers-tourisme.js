// Shapes specific to "piliers", family "tourist park" (round 4): completes the shapes.js catalogue. Metres, origin on the ground, Y up. Assemblies (lists of boxes [zone, w, h, d, x, y of the centre, z, rotation]) except the roof;
// zones are names of the map's shared materials (MAT in scenery-piliers.js). A building looks toward -X (its front, the road when it is placed beside it) and its length runs along Z; bases go 3 m into the ground, for a slope.
// The tiled roofs are separate (toitTemplePiliers), posed by the helpers of scenery-piliers-tourisme.js. See docs/proposals/sky-pillars/AMBIANCE-V2.html, "The tourist layer": Hunan mountain architecture, not Japanese.
(function () {
  const pair = f => [-1, 1].map(f), row = (n, f) => Array.from({ length: n }, (_, k) => f(n > 1 ? k / (n - 1) * 2 - 1 : 0, k));
  Object.assign(SHAPES, {
    // a tiled hip roof w × d (long axis X), ht high, origin at the level of the eaves: concave slopes, the four corners turned up by `lift`, a ridge when w > d (a pyramid when square)
    toitTemplePiliers: (w = 12, d = 8, ht = 3, lift = 1) => { const a = w / 2, b = d / 2, r = Math.max(0, a - b), bx = r + (a - r) * 0.5, bz = b * 0.5, ym = ht * 0.42, Tr = [];
      const A = [[a, lift, b], [0, 0, b * 0.96], [-a, lift, b], [-a * 0.97, 0, 0], [-a, lift, -b], [0, 0, -b * 0.96], [a, lift, -b], [a * 0.97, 0, 0]];
      const B = [[bx, ym, bz], [0, ym, bz], [-bx, ym, bz], [-bx, ym, 0], [-bx, ym, -bz], [0, ym, -bz], [bx, ym, -bz], [bx, ym, 0]], top = p => [Math.max(-r, Math.min(r, p[0])), ht, 0];
      for (let k = 0; k < 8; k++) { const p = A[k], q = A[(k + 1) % 8], q2 = B[(k + 1) % 8], p2 = B[k]; Tr.push(p, q, q2, p, q2, p2, p2, q2, top(q2), p2, top(q2), top(p2)); }
      const P = [], UV = []; for (const p of Tr) { P.push(...p); UV.push((p[0] + p[2]) / 2, p[1] / 2 + Math.hypot(p[0], p[2]) / 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); return g; },
    // a hall without its roof, L long and D deep: a stone base 0.8 m high with a step (base = 1), plaster or lacquer walls, a recessed front with a dark door and two lattice windows behind a row of red columns, a ring of beams
    hallePiliers: (L = 20, D = 10, ht = 5, base = 1, wall = 'white') => { const y = base ? 0.8 : 0, n = Math.max(2, Math.round(L / 3.6) + 1);
      return [...(base ? [['stone', D + 2.4, 4, L + 2.4, 0, -1.2, 0], ['stone', 1.4, 0.4, L * 0.45, -D / 2 - 1.9, 0.2, 0]] : []),
        [wall, 0.4, ht, L - 1, D / 2 - 0.6, y + ht / 2, 0], ...pair(sd => [wall, D - 1.2, ht, 0.4, 0, y + ht / 2, sd * (L / 2 - 0.5)]), [wall, 0.4, ht, L - 1, -D / 2 + 1.9, y + ht / 2, 0],
        ['dark', 0.2, ht * 0.72, Math.min(3, L * 0.22), -D / 2 + 1.7, y + ht * 0.36, 0], ...pair(sd => ['red', 0.15, ht * 0.42, L * 0.2, -D / 2 + 1.72, y + ht * 0.55, sd * L * 0.3]),
        ...row(n, t => ['red', 0.55, ht, 0.55, -D / 2 + 0.4, y + ht / 2, t * (L / 2 - 0.4)]),
        ...pair(sd => [['red', D + 0.4, 0.6, 0.5, 0, y + ht + 0.3, sd * (L / 2 - 0.3)], ['red', 0.5, 0.6, L + 0.2, sd * (D / 2 - 0.3), y + ht + 0.3, 0]]).flat()]; },
    // a pagoda without its roofs: n storeys sh high on a stone base, each 12 % narrower than the one below, white with red corner posts, a dark opening on each face, a balcony; a brass finial. The roof of storey k sits at 1 + (k + 1) sh
    pagodePiliers: (w = 7, n = 7, sh = 3.4) => { const o = [['stone', w + 3, 4, w + 3, 0, -1, 0]]; let top = 1;
      for (let k = 0; k < n; k++) { const a = w * 0.88 ** k, y = 1 + k * sh; o.push(['white', a, sh, a, 0, y + sh / 2, 0], ...pair(sx => pair(sz => ['red', 0.4, sh, 0.4, sx * a / 2, y + sh / 2, sz * a / 2])).flat(),
        ['dark', a + 0.1, sh * 0.45, a * 0.28, 0, y + sh * 0.4, 0], ['dark', a * 0.28, sh * 0.45, a + 0.1, 0, y + sh * 0.4, 0]); if (k) o.push(['red', a + 1.5, 0.2, a + 1.5, 0, y + 0.1, 0]); top = y + sh; }
      return [...o, ['brass', 0.5, sh * 1.3, 0.5, 0, top + sh * 0.9, 0], ['brass', 1.3, 0.35, 1.3, 0, top + sh * 0.75, 0], ['brass', 0.9, 0.3, 0.9, 0, top + sh * 1.1, 0]]; },
    // the park gate in the road frame (X across, origin on the axis): a paifang of four red columns on stone plinths, the two inner ones `span` apart (outside the parapets), beams ht above the roadway,
    // a dark name board with brass characters, a lower bay each side. Its three roofs are posed by the scenery
    paifangPiliers: (span = 21, ht = 9) => [...pair(sd => [['stone', 1.8, 2.2, 1.8, sd * span / 2, 0.6, 0], ['red', 1, ht + 2.6, 1, sd * span / 2, (ht + 2.6) / 2, 0], ['stone', 1.5, 1.8, 1.5, sd * (span / 2 + 5.5), 0.5, 0], ['red', 0.8, ht - 0.6, 0.8, sd * (span / 2 + 5.5), (ht - 0.6) / 2, 0],
      ['red', 5.5, 0.9, 0.7, sd * (span / 2 + 2.75), ht - 2.2, 0], ['wood', 5.5, 0.5, 0.5, sd * (span / 2 + 2.75), ht - 3.4, 0]]).flat(),
      ['red', span + 1, 1.1, 0.8, 0, ht + 0.1, 0], ['wood', span + 1, 0.7, 0.6, 0, ht + 2.2, 0], ['dark', 6.4, 1.5, 0.5, 0, ht + 1.25, 0], ['brass', 4.6, 0.8, 0.62, 0, ht + 1.25, 0], ...row(5, t => ['brass', 0.5, 0.5, 0.9, t * span * 0.36, ht + 0.1, 0])],
    // a village house without its roof: dark planks below, plaster above, corner posts, a door, windows, a lantern by the door; on a stone plinth, or on `stilts` metres of posts with a balcony (the stilt house of the valley)
    maisonPiliers: (L = 9, D = 6, ht = 3.4, stilts = 0) => { const y = stilts ? stilts + 0.15 : 0.7;
      return [...(stilts ? [...pair(sx => row(3, t => ['plank', 0.4, stilts + 3, 0.4, sx * (D / 2 - 0.2), (stilts - 3) / 2, t * (L / 2 - 0.2)])).flat(), ['plank', D + 1.8, 0.3, L + 0.4, -0.7, stilts, 0], ['plank', 0.12, 0.9, L + 0.4, -D / 2 - 1.5, stilts + 0.6, 0], ...pair(sz => ['plank', 0.3, stilts + 3, 0.3, -D / 2 - 1.4, (stilts - 3) / 2, sz * L / 2])]
        : [['stone', D + 0.6, 3.7, L + 0.6, 0, -1.15, 0]]),
        ['plank', D, ht * 0.55, L, 0, y + ht * 0.275, 0], ['white', D - 0.1, ht * 0.45, L - 0.1, 0, y + ht * 0.775, 0], ...pair(sx => pair(sz => ['wood', 0.35, ht, 0.35, sx * D / 2, y + ht / 2, sz * L / 2])).flat(),
        ['dark', 0.15, 2.1, 1.2, -D / 2 - 0.03, y + 1.05, L * 0.22], ['dark', 0.15, 0.9, 1.4, -D / 2 - 0.03, y + ht * 0.74, -L * 0.2], ...pair(sz => ['dark', 1.3, 0.9, 0.15, 0, y + ht * 0.74, sz * (L / 2 + 0.03)]), ['lamp', 0.4, 0.55, 0.4, -D / 2 - 0.5, y + ht - 0.5, L * 0.22]]; },
    // the terrace of a tea house, L long: a plank deck, a rail toward the road, three tables with stools under square parasols
    terrassePiliers: (L = 13) => [['plank', 6, 3.5, L, 0, -1.25, 0], ['plank', 0.12, 0.9, L, -2.9, 0.95, 0], ...row(3, (t, k) => { const z = t * L * 0.33; return [['plank', 1.2, 0.1, 1.2, 0, 1.25, z], ['plank', 0.15, 0.75, 0.15, 0, 0.87, z],
      ...pair(sd => ['plank', 0.4, 0.45, 0.4, 0, 0.72, z + sd * 1.1]), ['dark', 0.1, 2.6, 0.1, 0.9, 1.8, z], [k % 2 ? 'cloth' : 'cloth2', 2.8, 0.15, 2.8, 0.9, 3.15, z]]; }).flat()],
    // a market stall 3.4 m wide, open toward -X: a plank counter with goods, four posts, a sloping cloth awning (v: ochre or blue) with its valance, two lanterns
    etalPiliers: (v = 0) => { const c = v % 2 ? 'cloth2' : 'cloth'; return [['plank', 0.9, 1, 3.2, -0.5, 0.5, 0], ...pair(sx => pair(sz => ['plank', 0.15, sx > 0 ? 3.2 : 2.7, 0.15, sx * 1.1, sx > 0 ? 1.6 : 1.35, sz * 1.7])).flat(), [c, 3.4, 0.12, 4, -0.2, 2.95, 0, [0, 0, 0.2]], [c, 0.1, 0.5, 4, -1.85, 2.4, 0],
      ['plank', 0.3, 2, 3.4, 1.1, 1, 0], ['lamp', 0.5, 0.35, 0.5, -0.5, 1.2, -1], ['brass', 0.5, 0.3, 0.6, -0.5, 1.15, 0], ['white', 0.5, 0.4, 0.5, -0.5, 1.2, 1], ...pair(sz => ['lamp', 0.4, 0.5, 0.4, -1.5, 2.1, sz * 1.5])]; },
    // a lantern post 3.6 m high: a dark post, an arm toward -X, a red lantern between two brass caps, a tassel
    lanternePiliers: () => [['dark', 0.22, 3.6, 0.22, 0, 1.8, 0], ['dark', 1.3, 0.14, 0.14, -0.55, 3.5, 0], ['lamp', 0.6, 0.75, 0.6, -1, 2.95, 0], ['brass', 0.66, 0.1, 0.66, -1, 3.36, 0], ['brass', 0.44, 0.1, 0.44, -1, 2.55, 0], ['brass', 0.1, 0.4, 0.1, -1, 2.3, 0]],
    // a guardian lion of stone on its plinth, looking toward -X, 2.9 m high
    lionPiliers: () => [['stone', 1.9, 1, 1.2, 0, 0.5, 0], ['stone', 1.3, 0.9, 0.9, 0.15, 1.45, 0], ['stone', 0.6, 1.3, 0.8, -0.4, 1.65, 0], ['stone', 0.8, 0.8, 0.9, -0.5, 2.5, 0], ['stone', 0.5, 0.5, 1.1, -0.15, 2.35, 0]],
    // a park sign on two posts, its board facing ±X
    panneauPiliers: () => [...pair(sz => ['plank', 0.18, 2.8, 0.18, 0, 1.4, sz * 1.1]), ['sign', 0.12, 1.2, 2.4, 0, 2.2, 0]],
    // a bench: two stone feet, a plank seat and back (its back toward +X)
    bancPiliers: () => [...pair(sz => ['stone', 0.5, 0.45, 0.3, 0, 0.22, sz * 0.8]), ['plank', 0.6, 0.1, 2.2, 0, 0.5, 0], ['plank', 0.08, 0.5, 2.2, 0.28, 0.85, 0]],
    // a parked tour coach, 12 m long along Z (v = 1: green with a cream band), and a minivan
    autocarPiliers: (v = 0) => [[v ? 'coachB' : 'coach', 2.55, 2.5, 12, 0, 1.75, 0], [v ? 'coach' : 'coachB', 2.6, 0.5, 12.02, 0, 1.1, 0], ['pane', 2.6, 0.9, 10.6, 0, 2.4, -0.2], ['pane', 2.3, 1.3, 0.1, 0, 2.2, -6.01], ['coach', 1.6, 0.3, 3, 0, 3.15, 1], ...[-3.8, 3.2, 4.4].map(z => ['tire', 2.62, 1, 1, 0, 0.5, z])],
    minibusPiliers: () => [['coach', 2, 1.6, 5.2, 0, 1.25, 0], ['coachB', 2.04, 0.3, 5.22, 0, 0.95, 0], ['pane', 2.05, 0.6, 4.2, 0, 1.65, -0.2], ['pane', 1.8, 0.7, 0.1, 0, 1.6, -2.61], ...pair(sz => ['tire', 2.06, 0.7, 0.7, 0, 0.35, sz * 1.6])],
    // a still figure 1.7 m high: dark legs, a coloured top (v: one of three), a head, a sun hat on one in two
    touristePiliers: (v = 0) => [['pane', 0.4, 0.8, 0.28, 0, 0.4, 0], ['shirt' + v % 3, 0.5, 0.65, 0.3, 0, 1.12, 0], ['skin', 0.26, 0.28, 0.26, 0, 1.58, 0], ...(v & 1 ? [['cloth', 0.5, 0.08, 0.5, 0, 1.75, 0]] : [])],
    // a cable-car station without its roof, +X = the way the cables leave: a stone base, the plaster machine room at the back, two side walls, a steel portal over the open mouth, the bull wheel, a paved platform, a glass ticket box
    gareTelePiliers: () => [['stone', 18, 5, 14, 0, -1, 0], ['white', 6, 7, 12, -5, 5, 0], ...pair(sd => [['white', 10, 6, 0.5, 3, 4.5, sd * 5.7], ['steel', 0.6, 7, 0.6, 7.6, 5, sd * 5.5]]).flat(), ['steel', 0.6, 0.8, 12, 7.6, 8.2, 0], ['dark', 0.3, 5, 10.4, -1.9, 4.5, 0],
      ['steel', 5, 0.4, 5, 3, 7.2, 0, [0, 0.785, 0]], ['steel', 5, 0.4, 5, 3, 7.2, 0], ['steel', 0.6, 1.4, 0.6, 3, 7.9, 0], ['pave', 10, 0.3, 11, 3, 1.6, 0], ['glass', 3, 2.6, 3, 5, 3, -3], ['brass', 0.3, 1.2, 5, 8, 7, 0]],
    // a line pylon ht high, X along the cables, which pass 4 m each side of it: a stone footing, two steel legs with struts, a crossarm, the two sheave trains
    pyloneTelePiliers: (ht = 20) => [['stone', 5, 3, 5, 0, -0.5, 0], ...pair(sd => ['steel', 1.2, ht, 1.2, 0, ht / 2, sd * 1.5]), ...Array.from({ length: Math.floor(ht / 6) }, (_, k) => ['steel', 0.5, 0.5, 3, 0, 4 + k * 6, 0]), ['steel', 1.6, 1.2, 10, 0, ht, 0], ...pair(sd => ['steel', 5, 0.7, 0.6, 0, ht + 0.3, sd * 4])],
    // a cabin hanging from the cable (origin on the cable): the grip, the hanger, a red body with a band of glass
    cabineTelePiliers: () => [['steel', 1.2, 0.3, 0.4, 0, 0, 0], ['steel', 0.2, 3.2, 0.2, 0, -1.6, 0], ['cabin', 2.8, 0.25, 2.4, 0, -3.15, 0], ['pane', 2.65, 1.1, 2.25, 0, -3.8, 0], ['cabin', 2.6, 1.1, 2.2, 0, -4.9, 0]],
    // the glass lift on a cliff face, ht high (the cliff is on the -X side and leans back 12.5 cm per metre): a stone plinth under a steel canopy, three shafts of steel and pale glass 7 m apart with a car in each at a different height,
    // ring beams every 12 m, struts back to the rock every 24 m, an upper hall and a glazed gangway `gang` metres long to the summit
    ascenseurPiliers: (ht = 150, gang = 18) => { const o = [['stone', 8, 4, 26, 3, -1.4, 0], ['steel', 7, 0.5, 26, 3, 5.2, 0], ...pair(sd => ['steel', 0.5, 5, 0.5, 6, 2.7, sd * 12.5])];
      for (let j = -1; j <= 1; j++) { const z = j * 7, yc = ht * (0.3 + 0.22 * (j + 1)); o.push(...pair(sx => pair(sz => ['steel', 0.7, ht, 0.7, 3 + sx * 2, ht / 2, z + sz * 2.4])).flat(), ['ice', 3.6, ht - 6, 4.4, 3, ht / 2 + 3, z], ['coach', 3.2, 3.4, 3.8, 3, yc, z], ['pane', 3.3, 1.5, 3.9, 3, yc + 0.3, z]);
        for (let y = 12; y < ht; y += 12) o.push(['steel', 4.6, 0.5, 5.4, 3, y, z]); for (let y = 24; y < ht - 8; y += 24) o.push(['steel', y * 0.125 + 1.5, 0.5, 0.5, 0.25 - y * 0.0625, y, z]); }
      return [...o, ['steel', 8, 0.8, 24, 3, ht + 0.4, 0], ['glass', 7, 3.2, 22, 3, ht + 2.4, 0], ['steel', 9, 0.5, 25, 3, ht + 4.2, 0], ['steel', gang, 0.5, 4, 1 - gang / 2, ht + 0.2, 0], ...pair(sd => ['glass', gang, 1.3, 0.1, 1 - gang / 2, ht + 1.1, sd * 2])]; },
    // a viewing platform cantilevered over the void, w wide and reaching d metres out (origin on the cliff edge, +X out): a plank or glass deck on steel beams, two struts back to the rock, a lattice railing with a top rail, a paved landing
    plateformePiliers: (w = 12, d = 10, glass = 0) => { const an = Math.atan2(0.6, 0.9), l = Math.hypot(0.9 * d, 0.6 * d);
      return [[glass ? 'glass' : 'plank', d, 0.25, w, d / 2, 0.1, 0], ...[-1, 0, 1].map(k => ['steel', d + 1, 0.5, 0.4, d / 2 - 0.5, -0.3, k * w / 2]), ['steel', 0.4, 0.5, w, d, -0.3, 0], ...pair(sd => ['steel', l, 0.5, 0.5, 0.45 * d, -0.3 - 0.3 * d, sd * w / 2, [0, 0, an]]),
        ['rail', 0.08, 1.2, w, d, 0.8, 0], ['steel', 0.18, 0.14, w, d, 1.45, 0], ...pair(sd => [['rail', d, 1.2, 0.08, d / 2, 0.8, sd * w / 2], ['steel', d, 0.14, 0.18, d / 2, 1.45, sd * w / 2]]).flat(), ['pave', 4, 2.3, w + 2, -2, -1, 0]]; },
    // a steel bracket under a walkway bolted to a face (origin under the rail, +X toward the rock): a beam and a strut
    consolePiliers: () => [['steel', 6.5, 0.4, 0.4, 3.2, -0.3, 0], ['steel', 4.8, 0.3, 0.3, 1.75, -1.9, 0, [0, 0, -0.74]]],
    // a stone stairway w wide rising `rise` metres toward +X over `run` metres: full-height steps, a low stone string each side
    escalierPiliers: (rise = 8, run = 11, w = 3) => { const n = Math.ceil(rise / 0.6), an = Math.atan2(rise, run);
      return [...Array.from({ length: n }, (_, k) => ['stone', run / n + 0.05, (k + 1) * rise / n + 2, w, (k + 0.5) * run / n, (k + 1) * rise / n / 2 - 1, 0]), ...pair(sd => ['stone', Math.hypot(rise, run), 0.7, 0.35, run / 2, rise / 2 + 0.5, sd * w / 2, [0, 0, an]])]; },
    // a wayside shrine without its roof: a stone base, a red cell open toward -X with a brass figure, an incense burner in front
    oratoirePiliers: () => [['stone', 4.4, 4, 4.4, 0, -1, 0], ['red', 2.6, 2.4, 2.6, 0, 2.2, 0], ['dark', 0.2, 1.6, 1.3, -1.3, 2, 0], ['brass', 0.3, 0.7, 0.5, -1.36, 1.6, 0], ['dark', 0.9, 0.8, 0.9, -3.4, 0.4, 0], ['brass', 1.1, 0.15, 1.1, -3.4, 0.85, 0]],
    // the incense burner of a temple court: a dark bronze tripod bowl with a brass rim under a small canopy
    encensoirPiliers: () => [['stone', 3, 0.6, 3, 0, 0.3, 0], ['dark', 1.8, 1, 1.8, 0, 1.5, 0], ['brass', 2, 0.15, 2, 0, 2.05, 0], ...pair(sx => pair(sz => [['dark', 0.25, 0.5, 0.25, sx * 0.7, 0.85, sz * 0.7], ['dark', 0.15, 2.2, 0.15, sx * 0.85, 3.1, sz * 0.85]])).flat(2), ['dark', 2.6, 0.25, 2.6, 0, 4.3, 0], ['brass', 0.4, 0.6, 0.4, 0, 4.7, 0]],
    // a timber lookout tower without its roof: four posts, a deck half-way and one at ht with lattice rails, cross braces, two flights of stairs
    tourGuetPiliers: (ht = 14) => { const a = 2.4, br = Math.hypot(2 * a, ht / 2), an = Math.atan2(ht / 2, 2 * a);
      return [...pair(sx => pair(sz => ['plank', 0.45, ht + 6.2, 0.45, sx * a, (ht + 0.2) / 2, sz * a])).flat(),
        ...[ht / 2, ht].flatMap(y => [['plank', 2 * a + 1.6, 0.25, 2 * a + 1.6, 0, y, 0], ...pair(sd => [['rail', 2 * a + 1.6, 1.1, 0.08, 0, y + 0.7, sd * (a + 0.8)], ['rail', 0.08, 1.1, 2 * a + 1.6, sd * (a + 0.8), y + 0.7, 0]]).flat()]),
        ...[0, 1].flatMap(k => pair(sd => ['plank', br, 0.22, 0.22, 0, ht / 4 + k * ht / 2, sd * a, [0, 0, (k ? -1 : 1) * sd * an]])), ...[0, 1].map(k => ['plank', br, 0.2, 1.1, 0, ht / 4 + k * ht / 2, (k ? 1 : -1) * 0.6, [0, 0, k ? -an : an]])]; },
  });
})();
