// Scenery placement for "volcan" (Volcanic Island V2, layout "through the crater"): island, volcano, sea, far islands, the shared materials, then each zone (scenery-volcan-<zone>.js).
// See docs/methods/NEW-MAP.md, phase 3, and docs/proposals/volcanic-island/AMBIANCE-V2.html. Shapes: shapes-volcan-<family>.js; textures: textures-volcan.js.
(function () {
  const { near, edgePt, terrain, weld } = PLACERS;
  const ZONES = ['phare', 'cendres', 'couronne', 'cratere', 'lacets', 'quais'], LAP = 6578; // LAP: plan length of the layout, the unit of its chainages (PK)
  // The volcano, a stratovolcano with a closed summit crater (read from the plan of the bible for its place and its 500 m foot; the road through it is the choice of the author):
  // outer cone 1.23 m per metre down from a rim 230 m in radius at 360 m; inside, a cliff from the rim to a bench (the level of an older lava lake) 60 m over the floor, then the floor, 170 m in radius.
  const CONE = { x: -113, z: -906, rim: 230, top: 360, slope: 1.23, floor: 170 };
  const inner = r => r < CONE.floor ? 0 : r < 185 ? (r - CONE.floor) * 4 : r < 205 ? 60 : 60 + (r - 205) * 6;
  const LAKE = { x: -25, z: -960, r: 70, y: 152 };                                        // lava lake: a level pit in the north-east of the floor, 3 to 14 m below the road that runs down along it (PK 4235 to 4375)
  const LEDGE = 16, DECK = [3080, 3240, 46];                                              // sea side: the ground is level LEDGE m from the axis (9 m behind the wall), then falls; DECK [PK a, PK b, m] widens it for the belvedere of the pass
  const SIDE = { x: -690, z: -930, top: 95, slope: 0.8, pit: 28 };                        // parasitic cone on the west flank, with its own small crater
  const VOLCANO = [4000, 4780], SOUTH = 4520;                                             // PK of the road under the cone and in the crater; from SOUTH on the gallery is built by scenery-volcan-cratere.js instead of the engine tunnel
  // shoreline: the coast road of the bible (x, z every 80 m), which this layout only follows on the south and east sides
  const COAST = [0, 0, -82, -5, -162, -2, -242, 1, -322, 3, -401, 4, -481, 4, -561, 1, -641, -5, -720, -19, -796, -44, -863, -87, -912, -150, -943, -223, -948, -303, -922, -377, -879, -445, -848, -518, -863, -595, -911, -659, -958, -724, -989, -797, -997, -877, -981, -955, -941, -1024, -892, -1087, -851, -1156, -808, -1223, -739, -1262, -667, -1296, -609, -1351, -550, -1405, -479, -1441, -401, -1456, -321, -1452, -246, -1426, -178, -1383, -110, -1342, -32, -1328, 40, -1359, 93, -1419, 137, -1486, 192, -1544, 268, -1565, 343, -1541, 395, -1482, 403, -1404, 368, -1332, 304, -1286, 225, -1272, 153, -1241, 113, -1173, 110, -1094, 158, -1032, 233, -1008, 311, -1020, 376, -1066, 426, -1129, 475, -1192, 542, -1233, 620, -1221, 684, -1175, 739, -1116, 767, -1042, 751, -965, 696, -908, 635, -856, 603, -784, 631, -712, 694, -663, 747, -605, 747, -526, 700, -463, 630, -424, 556, -396, 492, -349, 470, -274, 509, -206, 557, -142, 559, -67, 497, -18, 421, 6, 343, 23, 263, 32, 183, 30, 104, 20, 26, 4];
  const ss = (a, b, v) => { const k = Math.max(0, Math.min(1, (v - a) / (b - a))); return k * k * (3 - 2 * k); };

  Object.assign(SCENERY, {
    volcan(h) {
      const { THREE, S, N } = h, P = h.M.pts;
      // the loop runs anticlockwise: the island is on the left (side -1), the sea on the right (side 1)
      const inPoly = (x, z, n, px, pz) => { let c = false; for (let i = 0, j = n - 1; i < n; j = i++) if ((pz(i) > z) !== (pz(j) > z) && x < (px(j) - px(i)) * (z - pz(i)) / (pz(j) - pz(i)) + px(i)) c = !c; return c; };
      const cx = i => COAST[i * 2], cz = i => COAST[i * 2 + 1], NC = COAST.length / 2;
      const toCoast = (x, z) => { let m = 1e9; for (let i = 0, j = NC - 1; i < NC; j = i++) { const ax = cx(j), az = cz(j), bx = cx(i) - ax, bz = cz(i) - az, k = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz))); m = Math.min(m, Math.hypot(x - ax - bx * k, z - az - bz * k)); } return m; };
      // land = inside the loop or inside the shoreline. Off the land the ground falls to a seabed at -8 m, 2 m per metre, from a LEDGE along the road (a 70 m quay along the harbour, PK 6100 to 700; the DECK of the belvedere).
      // On land the volcano stands where it is higher than the ground. Along the road an apron keeps it off the roadway: 140 m of gentle slope, or 10 m then a steep bank at the foot of the cone (the horseshoe of La Couronne runs 120 m from the rim).
      // Under the cone and in the crater (VOLCANO) the ground is the volcano itself, cut only where it is less than 12 m over the roadway (the mouths), and trenched 52 m wide along the south gallery, whose rock fills the cut up to the slope.
      const relief = (x, z, y) => { const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), pk = i / N * LAP;
        if (!inPoly(x, z, P.length, k => P[k][0], k => P[k][1]) && !inPoly(x, z, NC, cx, cz)) return Math.min(y + 8, Math.max(0, pk > 6100 || pk < 700 ? d - 70 : pk > DECK[0] && pk < DECK[1] ? d - DECK[2] : Math.min(d - LEDGE, toCoast(x, z))) * 2);
        const r = Math.hypot(x - CONE.x, z - CONE.z), q = Math.hypot(x - SIDE.x, z - SIDE.z);
        const c = Math.max(Math.min(CONE.top - Math.max(0, r - CONE.rim) * CONE.slope - y, inner(r)), SIDE.top - Math.max(q, SIDE.pit * 2 - q) * SIDE.slope);
        if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r) return y - LAKE.y;
        if (pk > VOLCANO[0] && pk < VOLCANO[1]) return (pk > SOUTH ? d < 26 : d < 14 && c < 12) ? 0 : -Math.max(0, c);
        const e = d - 22, apron = r < 345 ? (e < 10 ? e * 0.15 : 1.5 + (e - 10) * 3) : e < 118 ? e * 0.15 : 17.7 + (e - 118) * 2.5;
        return -Math.max(0, Math.min(c, apron)); };
      // ground, in layers over old ash: dry olive grass on the low gentle slopes; red-brown scoria on the volcano, its crater floor and the parasitic cone; basalt where it is steep (cliffs, crater walls, cuttings); paving on the harbour flat
      const g = terrain(h, { stepSec: 10, margin: 440, hollow: relief, mat: h.mat('solVolcan'), layerSet: [
        { tex: ['solVolcan', '#6c6a54'], weight: (x, z, y, p) => 0.8 * (1 - ss(0.12, 0.3, p)) * (1 - ss(90, 170, y)) * ss(8, 14, y) },
        { tex: ['scorieVolcan'], weight: (x, z) => Math.max(ss(380, 250, Math.hypot(x - CONE.x, z - CONE.z)) * 0.85, ss(130, 70, Math.hypot(x - SIDE.x, z - SIDE.z))), noise: 0.15 },
        { tex: ['basalteVolcan', '#45474d'], slope: [0.3, 0.5] },
        { tex: ['betonVolcan', '#7e7c74'], weight: (x, z, y, p) => ss(-70, -40, z) * ss(15.5, 13.5, y) * ss(8, 10.5, y) * (1 - ss(0.1, 0.25, p)) }] }); // the harbour: quay and village ground paved in grey concrete and basalt setts
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), h.mat('merVolcan', { rep: [250, 250] })); sea.rotation.x = -Math.PI / 2; sea.position.set(-100, 0, -800); h.scene.add(sea);
      // MAT: the shared materials of the map, one draw pass each for the whole map: every piece of scenery goes into the group `kit`, merged per material at the end. Keys are the zone names of the volcan assemblies.
      const DS = { side: THREE.DoubleSide }, tint = c => h.mat('metalPale', { c }), plaster = c => h.mat('crepiVolcan', {}, c), MAT = {
        rock: h.mat('basalteVolcan', {}, '#34373d'), cliff: h.mat('basalteVolcan', {}, '#565a60'), crust: h.mat('basalteVolcan', {}, '#1c1c1e', 0.5), scoria: h.mat('scorieVolcan'), stone: h.mat('pierreVolcan'), gallery: h.mat('galerieVolcan', DS),
        far: h.mat('basalteVolcan', {}, '#5d6f80', 0.4), cream: plaster('#e8d9ac'), ochre: plaster('#d8a85a'), coral: plaster('#d88d72'), white: plaster('#f4efe2'), tile: h.mat('tuileVolcan', DS), dark: h.mat('betonVolcan', {}, '#23292d'),
        concrete: h.mat('betonVolcan'), steel: tint(0x6a7078), red: tint(0xb5483c), blue: tint(0x2f6f9a), wood: h.mat('boisVolcan'), trunk: h.mat('boisVolcan', {}, '#6a5a40'), net: plaster('#c9b58a'), soil: h.mat('solVolcan', {}, '#4a4038'),
        leaf: h.mat('feuilleVolcan', DS), vine: h.mat('feuilleVolcan', DS, '#677658'), olive: h.mat('feuilleVolcan', DS, '#5a6a48'), lava: h.mat('laveVolcan', { emis: 1 }), lamp: h.mat('lampObj', { emis: 1 }),
        steam: h.mat('paint', { c: 0xe6ecec, transparent: true, opacity: 0.38, depthWrite: false, ...DS }) };
      const kit = new THREE.Group(); h.scene.add(kit);
      const at = pk => S[Math.round(pk / LAP * N) % N], grp = (x, y, z, ry, s = 1) => { const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); kit.add(o); return o; };
      const skin = m => m ? MAT[m] : MAT; // an assembly takes the whole table; a simple shape takes one material, named by `m`
      // set(shape, x, z, { a, m, ry, y, dy, s }): a catalogue shape at a plan position (x east, z south), on the ground unless the altitude y is given, raised by dy, turned by ry, scaled by s; a = the shape's settings
      const set = (shape, x, z, { a = [], m, ry = 0, y, dy = 0, s = 1 } = {}) => { const o = grp(x, (y ?? g.hAt(x, z)) + dy, z, ry, s); h.pose(shape, skin(m), o, [0, 0, 0], ...a); return o; };
      // by(shape, pk, side, off, { a, m, turn, y, dy, s, road }): a shape beside the road at chainage pk (m), side -1 = left (island) / 1 = right (sea), its origin `off` metres behind the wall, its front (-Z) toward the road.
      // On the ground there (road level on the ledge), or at the altitude y, or at road level with `road`. pk may be a list: one shape at each, the index appended to the settings a (a seed).
      // Sea side: keep within 9 m of the wall (the ledge), or on the quay or the DECK; beyond, the piece hangs on the cliff: a piece that ends up under the roadway is reported in the console.
      const by = (shape, pk, sd, off, o = {}) => { if (Array.isArray(pk)) return pk.map((p, i) => by(shape, p, sd, off, { ...o, a: [...(o.a || []), ...(o.seed ? [i] : [])] }));
        const { a = [], m, turn = 0, y, dy = 0, s = 1, road } = o, sm = at(pk), [x, z] = edgePt(sm, sd, sm.w + off), y1 = road ? sm.y : y ?? Math.max(g.hAt(x, z), sm.w + off <= LEDGE ? sm.y - 0.2 : -1e9);
        if (y == null && y1 < sm.y - 4 && off < 60) console.warn('volcan: piece under the roadway', shape, 'PK ' + pk, 'side ' + sd, Math.round(y1 - sm.y) + ' m');
        const q = grp(x, y1 + dy, z, h.across(sm) + sd * Math.PI / 2 + turn, s); h.pose(shape, skin(m), q, [0, 0, 0], ...a); return q; };
      // slab(material, pk, w, ht, d, y, off): a box set from the roadway: w across the road, d along it, its underside y metres above the road, its centre `off` metres to the right of the axis (0: across the road)
      const slab = (m, pk, w, ht, d, y, off = 0) => { const sm = at(pk); return h.pose('boxMesh', MAT[m], grp(sm.x, sm.y, sm.z, h.across(sm)), [off, y + ht / 2, 0], w, ht, d); };
      // gate(pk, facing): a gallery mouth across the road at chainage pk, its face toward the oncoming cars (facing 1: the way in) or toward the cars leaving (facing -1: the way out)
      const gate = (pk, facing = 1) => { const sm = at(pk); h.pose('portailVolcan', MAT, grp(sm.x, sm.y, sm.z, h.across(sm) + (facing > 0 ? Math.PI : 0)), [0, 0, 0]); };
      // far islands on the horizon (the terrain stops 440 m from the road; beyond it there is only the sea)
      for (const [x, z, L, H, D, ry, seed] of [[-3600, -2700, 1700, 280, 500, 0.5, 1], [2900, 600, 1200, 190, 380, 1.3, 4], [-2700, 1900, 900, 150, 300, -0.4, 7], [1500, -3800, 1400, 230, 420, 0.1, 9]]) set('creteVolcan', x, z, { y: 0, ry, m: 'far', a: [L, H, D, seed] });
      for (const z of ZONES) VOLCAN[z]({ h, g, at, set, by, slab, gate, MAT, LAKE, CONE });
      weld(h, kit); // one mesh per material
    },
  });
})();
