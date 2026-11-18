// Scenery placement for "volcan" (Volcanic Island V2, subarctic, layout "through the crater"): island, volcano, sea, far islands, the shared materials, then each zone (scenery-volcan-<zone>.js).
// See docs/methods/NEW-MAP.md, phase 3, and docs/proposals/volcanic-island/AMBIANCE-V2.html. Shapes: shapes-volcan-<family>.js; textures: textures-volcan.js.
(function () {
  const { near, edgePt, terrain, weld } = PLACERS;
  const ZONES = ['phare', 'cendres', 'couronne', 'cratere', 'lacets', 'quais'], LAP = 6578; // LAP: plan length of the layout, the unit of its chainages (PK)
  // The volcano: a closed crater whose rim is a level band 16 m wide, 200 m in radius, high (top) on the east and west and low at two GAPS where the road goes in and out in an open cutting; no tunnel.
  // Outside, the flank comes down to the ground at `foot`; inside, the wall comes down to a floor `floor` in radius. Every profile is smooth: a crest sampled on the grid of the terrain must not be an edge.
  const CONE = { x: -113, z: -906, rim: 200, band: 8, foot: 345, floor: 120, top: 330 };
  const GAPS = [[-1.77, 184], [2.017, 152]];                                              // [direction from the centre (rad, atan2(z, x)), height of the rim there]: north gap (road at 170 m) and south-west gap (road at 138 m)
  const CUT = [11, 1.3];                                                                  // cutting: inside the volcano the ground may not rise before 11 m off the axis, then by 1.3 m per metre
  const LAKE = { x: -62, z: -930, r: 34, y: 153 };                                        // lava lake: a level pit east of the road on the crater floor, a few metres below it
  const LEDGE = 16, DECK = [3080, 3240, 46];                                              // sea side: the ground is level LEDGE m from the axis (9 m behind the wall), then falls; DECK [PK a, PK b, m] widens it for the belvedere of the pass
  const SIDE = { x: -690, z: -930, top: 95, r: 150 };                                     // parasitic cone on the west flank
  // shoreline: the coast road of the bible (x, z every 80 m), which this layout only follows on the south and east sides
  const COAST = [0, 0, -82, -5, -162, -2, -242, 1, -322, 3, -401, 4, -481, 4, -561, 1, -641, -5, -720, -19, -796, -44, -863, -87, -912, -150, -943, -223, -948, -303, -922, -377, -879, -445, -848, -518, -863, -595, -911, -659, -958, -724, -989, -797, -997, -877, -981, -955, -941, -1024, -892, -1087, -851, -1156, -808, -1223, -739, -1262, -667, -1296, -609, -1351, -550, -1405, -479, -1441, -401, -1456, -321, -1452, -246, -1426, -178, -1383, -110, -1342, -32, -1328, 40, -1359, 93, -1419, 137, -1486, 192, -1544, 268, -1565, 343, -1541, 395, -1482, 403, -1404, 368, -1332, 304, -1286, 225, -1272, 153, -1241, 113, -1173, 110, -1094, 158, -1032, 233, -1008, 311, -1020, 376, -1066, 426, -1129, 475, -1192, 542, -1233, 620, -1221, 684, -1175, 739, -1116, 767, -1042, 751, -965, 696, -908, 635, -856, 603, -784, 631, -712, 694, -663, 747, -605, 747, -526, 700, -463, 630, -424, 556, -396, 492, -349, 470, -274, 509, -206, 557, -142, 559, -67, 497, -18, 421, 6, 343, 23, 263, 32, 183, 30, 104, 20, 26, 4];
  const ss = (a, b, v) => { const k = Math.max(0, Math.min(1, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
  const rimAt = a => Math.min(...GAPS.map(([g, ht]) => { const d = Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))); return ht + (CONE.top - ht) * ss(0.22, 1, d); }));
  // height of the volcano above the ground y at (x, z)
  const volcano = (x, z, y) => { const dx = x - CONE.x, dz = z - CONE.z, r = Math.hypot(dx, dz), q = Math.hypot(x - SIDE.x, z - SIDE.z), side = SIDE.top * (1 - ss(0, SIDE.r, q));
    if (r > CONE.foot) return side; const up = Math.max(0, rimAt(Math.atan2(dz, dx)) - y);
    return Math.max(side, up * (r > CONE.rim ? 1 - ss(CONE.rim + CONE.band, CONE.foot, r) : ss(CONE.floor, CONE.rim - CONE.band, r))); };

  Object.assign(SCENERY, {
    volcan(h) {
      const { THREE, S, N } = h, P = h.M.pts;
      // the loop runs anticlockwise: the island is on the left (side -1), the sea on the right (side 1)
      const inPoly = (x, z, n, px, pz) => { let c = false; for (let i = 0, j = n - 1; i < n; j = i++) if ((pz(i) > z) !== (pz(j) > z) && x < (px(j) - px(i)) * (z - pz(i)) / (pz(j) - pz(i)) + px(i)) c = !c; return c; };
      const cx = i => COAST[i * 2], cz = i => COAST[i * 2 + 1], NC = COAST.length / 2;
      const toCoast = (x, z) => { let m = 1e9; for (let i = 0, j = NC - 1; i < NC; j = i++) { const ax = cx(j), az = cz(j), bx = cx(i) - ax, bz = cz(i) - az, k = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz))); m = Math.min(m, Math.hypot(x - ax - bx * k, z - az - bz * k)); } return m; };
      // land = inside the loop or inside the shoreline. Off the land the ground falls to a seabed at -8 m, 2 m per metre, from a LEDGE along the road (a 70 m quay along the harbour, PK 6100 to 700; the DECK of the belvedere).
      // On land the ground is the volcano, cut along the road by the cutting (CUT) and by the pit of the lake.
      const relief = (x, z, y) => { const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), pk = i / N * LAP;
        if (!inPoly(x, z, P.length, k => P[k][0], k => P[k][1]) && !inPoly(x, z, NC, cx, cz)) return Math.min(y + 8, Math.max(0, pk > 6100 || pk < 700 ? d - 70 : pk > DECK[0] && pk < DECK[1] ? d - DECK[2] : Math.min(d - LEDGE, toCoast(x, z))) * 2);
        const k = ss(LAKE.r + 14, LAKE.r, Math.hypot(x - LAKE.x, z - LAKE.z)); // 1 in the pit, 0 from 14 m outside it
        return k * (y - LAKE.y) - (1 - k) * Math.min(volcano(x, z, y), Math.max(0, d - CUT[0]) * CUT[1]); };
      // ground, in layers over bare ash and lava gravel: moss on the low and gentle slopes; red-brown scoria on the flanks of the volcano and on its floor; rock where it is steep; snow on the heights
      const g = terrain(h, { stepSec: 8, margin: 440, hollow: relief, mat: h.mat('solVolcan'), layerSet: [
        { tex: ['mousseVolcan'], weight: (x, z, y, p) => (1 - ss(0.14, 0.3, p)) * (1 - ss(150, 215, y)) * ss(8, 14, y), noise: 0.12 },
        { tex: ['scorieVolcan'], weight: (x, z) => 0.9 * ss(CONE.foot + 40, CONE.foot - 80, Math.hypot(x - CONE.x, z - CONE.z)), noise: 0.15 },
        { tex: ['rocheVolcan', '#3a3c42', 0.4], slope: [0.34, 0.56] }, // weak marks: on a steep face the terrain stretches them into streaks
        { tex: ['neigeVolcan'], weight: (x, z, y, p) => ss(232, 262, y) * (1 - ss(0.5, 0.75, p)), noise: 0.1 }] });
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), h.mat('merVolcan', { rep: [250, 250] })); sea.rotation.x = -Math.PI / 2; sea.position.set(-100, 0, -800); h.scene.add(sea);
      // MAT: the shared materials of the map, one draw pass each for the whole map: every piece of scenery goes into the group `kit`, merged per material at the end. Keys are the zone names of the volcan assemblies.
      const DS = { side: THREE.DoubleSide }, tint = c => h.mat('metalPale', { c }), paint = c => h.mat('bardageVolcan', {}, c), MAT = {
        rock: h.mat('rocheVolcan', {}, '#2e3034'), cliff: h.mat('basalteVolcan', {}, '#4a4d54'), crust: h.mat('rocheVolcan', {}, '#1c1c1e', 0.5), scoria: h.mat('scorieVolcan'), stone: h.mat('pierreVolcan'),
        snow: h.mat('neigeVolcan'), ice: h.mat('neigeVolcan', {}, '#cfe4ee'), far: h.mat('rocheVolcan', {}, '#5d6f80', 0.4), farSnow: h.mat('neigeVolcan', {}, '#dfe8ee'),
        red: paint('#c8362b'), yellow: paint('#e2b02a'), blue: paint('#2f6f9a'), green: paint('#3f8a5a'), orange: paint('#e07a2a'), violet: paint('#7a4e9a'), teal: paint('#2a8c8c'), white: paint('#f2eee4'),
        trim: tint(0xf2eee4), roof: h.mat('toitVolcan', DS), dark: h.mat('betonVolcan', {}, '#1e2226'), concrete: h.mat('betonVolcan'), paving: h.mat('betonVolcan', {}, '#77756e'), steel: tint(0x6a7078),
        wood: h.mat('boisVolcan'), greywood: h.mat('boisVolcan', {}, '#9a968c'), net: h.mat('boisVolcan', {}, '#c9b58a'), lava: h.mat('laveVolcan', { emis: 1 }), lamp: h.mat('lampObj', { emis: 1 }),
        steam: h.mat('paint', { c: 0xe6ecec, transparent: true, opacity: 0.38, depthWrite: false, ...DS }) };
      const kit = new THREE.Group(); h.scene.add(kit);
      const at = pk => S[Math.round(pk / LAP * N) % N], grp = (x, y, z, ry, s = 1) => { const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); kit.add(o); return o; };
      const skin = m => m ? MAT[m] : MAT; // an assembly takes the whole table; a simple shape takes one material, named by `m`
      // set(shape, x, z, { a, m, ry, y, dy, s }): a catalogue shape at a plan position (x east, z south), on the ground unless the altitude y is given, raised by dy, turned by ry, scaled by s; a = the shape's settings
      const set = (shape, x, z, { a = [], m, ry = 0, y, dy = 0, s = 1 } = {}) => { const o = grp(x, (y ?? g.hAt(x, z)) + dy, z, ry, s); h.pose(shape, skin(m), o, [0, 0, 0], ...a); return o; };
      // by(shape, pk, side, off, { a, m, turn, y, dy, s, road }): a shape beside the road at chainage pk (m), side -1 = left (island) / 1 = right (sea), its origin `off` metres behind the wall, its front (-Z) toward the road.
      // On the ground there (road level on the ledge), or at the altitude y, or at road level with `road`. pk may be a list: one shape at each, the index appended to the settings a when `seed` is set.
      // Sea side: keep within 9 m of the wall (the ledge), or on the quay or the DECK; beyond, the piece hangs on the cliff: a piece that ends up under the roadway is reported in the console.
      const by = (shape, pk, sd, off, o = {}) => { if (Array.isArray(pk)) return pk.map((p, i) => by(shape, p, sd, off, { ...o, a: [...(o.a || []), ...(o.seed ? [i] : [])] }));
        const { a = [], m, turn = 0, y, dy = 0, s = 1, road } = o, sm = at(pk), [x, z] = edgePt(sm, sd, sm.w + off), y1 = road ? sm.y : y ?? Math.max(g.hAt(x, z), sm.w + off <= LEDGE ? sm.y - 0.2 : -1e9);
        if (y == null && y1 < sm.y - 4 && off < 60) console.warn('volcan: piece under the roadway', shape, 'PK ' + pk, 'side ' + sd, Math.round(y1 - sm.y) + ' m');
        const q = grp(x, y1 + dy, z, h.across(sm) + sd * Math.PI / 2 + turn, s); h.pose(shape, skin(m), q, [0, 0, 0], ...a); return q; };
      // slab(material, pk, w, ht, d, y, off): a box set from the roadway: w across the road, d along it, its underside y metres above the road, its centre `off` metres to the right of the axis
      const slab = (m, pk, w, ht, d, y, off = 0) => { const sm = at(pk); return h.pose('boxMesh', MAT[m], grp(sm.x, sm.y, sm.z, h.across(sm)), [off, y + ht / 2, 0], w, ht, d); };
      // far islands on the horizon, dark with a snow cap (the terrain stops 440 m from the road; beyond it there is only the sea)
      for (const [x, z, R, H, ry, seed] of [[-3700, -2800, 900, 300, 0.5, 1], [3000, 500, 650, 200, 1.3, 4], [-2800, 2000, 500, 160, -0.4, 7], [1500, -3900, 750, 250, 0.1, 9]]) {
        set('ileVolcan', x, z, { y: 0, ry, m: 'far', a: [R, H, seed] }); set('ileVolcan', x, z, { y: H * 0.56, ry, m: 'farSnow', a: [R * 0.5, H * 0.46, seed] }); }
      for (const z of ZONES) VOLCAN[z]({ h, g, at, set, by, slab, MAT, LAKE, CONE });
      weld(h, kit); // one mesh per material
    },
  });
})();
