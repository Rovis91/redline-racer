// Scenery placement for "volcan" (Volcanic Island V2, blockout, layout "through the crater"): island, cone, crater, sea, then the named blocks of each zone (scenery-volcan-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
(function () {
  const { near, block, edgePt, terrain } = PLACERS;
  const ZONES = ['phare', 'cendres', 'couronne', 'cratere', 'lacets', 'quais'], LAP = 6578; // LAP: plan length of the layout, the unit of its chainages (PK)
  // The volcano, a stratovolcano with a closed summit crater (read from the plan of the bible for its place and its 500 m foot; the road through it is the choice of the author):
  // outer cone 1.23 m per metre down from a rim 230 m in radius at 360 m; inside, a cliff from the rim to a bench (the level of an older lava lake) 60 m over the floor, then the floor, 170 m in radius.
  const CONE = { x: -113, z: -906, rim: 230, top: 360, slope: 1.23, floor: 170 };
  const inner = r => r < CONE.floor ? 0 : r < 185 ? (r - CONE.floor) * 4 : r < 205 ? 60 : 60 + (r - 205) * 6;
  const SIDE = { x: -690, z: -930, top: 95, slope: 0.8, pit: 28 };                        // parasitic cone on the west flank, with its own small crater
  const VOLCANO = [4000, 4780], SOUTH = 4520;                                             // PK of the road under the cone and in the crater; from SOUTH on the gallery is made of blocks (scenery-volcan-cratere.js)
  // shoreline: the coast road of the bible (x, z every 80 m), which this layout only follows on the south and east sides
  const COAST = [0, 0, -82, -5, -162, -2, -242, 1, -322, 3, -401, 4, -481, 4, -561, 1, -641, -5, -720, -19, -796, -44, -863, -87, -912, -150, -943, -223, -948, -303, -922, -377, -879, -445, -848, -518, -863, -595, -911, -659, -958, -724, -989, -797, -997, -877, -981, -955, -941, -1024, -892, -1087, -851, -1156, -808, -1223, -739, -1262, -667, -1296, -609, -1351, -550, -1405, -479, -1441, -401, -1456, -321, -1452, -246, -1426, -178, -1383, -110, -1342, -32, -1328, 40, -1359, 93, -1419, 137, -1486, 192, -1544, 268, -1565, 343, -1541, 395, -1482, 403, -1404, 368, -1332, 304, -1286, 225, -1272, 153, -1241, 113, -1173, 110, -1094, 158, -1032, 233, -1008, 311, -1020, 376, -1066, 426, -1129, 475, -1192, 542, -1233, 620, -1221, 684, -1175, 739, -1116, 767, -1042, 751, -965, 696, -908, 635, -856, 603, -784, 631, -712, 694, -663, 747, -605, 747, -526, 700, -463, 630, -424, 556, -396, 492, -349, 470, -274, 509, -206, 557, -142, 559, -67, 497, -18, 421, 6, 343, 23, 263, 32, 183, 30, 104, 20, 26, 4];

  Object.assign(SCENERY, {
    volcan(h) {
      const { THREE, S, N } = h, P = h.M.pts;
      // the loop runs anticlockwise: the island is on the left (side -1), the sea on the right (side 1)
      const inPoly = (x, z, n, px, pz) => { let c = false; for (let i = 0, j = n - 1; i < n; j = i++) if ((pz(i) > z) !== (pz(j) > z) && x < (px(j) - px(i)) * (z - pz(i)) / (pz(j) - pz(i)) + px(i)) c = !c; return c; };
      const cx = i => COAST[i * 2], cz = i => COAST[i * 2 + 1], NC = COAST.length / 2;
      const toCoast = (x, z) => { let m = 1e9; for (let i = 0, j = NC - 1; i < NC; j = i++) { const ax = cx(j), az = cz(j), bx = cx(i) - ax, bz = cz(i) - az, k = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz))); m = Math.min(m, Math.hypot(x - ax - bx * k, z - az - bz * k)); } return m; };
      // land = inside the loop or inside the shoreline. Off the land the ground falls to a seabed at -8 m, 2 m per metre, from a 16 m ledge along the road (a 70 m quay along the harbour, PK 6100 to 700).
      // On land the volcano stands where it is higher than the ground. Along the road an apron keeps it off the roadway: 140 m of gentle slope, or 10 m then a steep bank at the foot of the cone (the horseshoe of La Couronne runs 120 m from the rim).
      // Under the cone and in the crater (VOLCANO) the ground is the volcano itself, cut only where it is less than 12 m over the roadway (the mouths), and trenched 52 m wide along the south gallery, whose blocks fill the cut up to the slope.
      const relief = (x, z, y) => { const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), pk = i / N * LAP;
        if (!inPoly(x, z, P.length, k => P[k][0], k => P[k][1]) && !inPoly(x, z, NC, cx, cz)) return Math.min(y + 8, Math.max(0, pk > 6100 || pk < 700 ? d - 70 : Math.min(d - 16, toCoast(x, z))) * 2);
        const r = Math.hypot(x - CONE.x, z - CONE.z), q = Math.hypot(x - SIDE.x, z - SIDE.z);
        const c = Math.max(Math.min(CONE.top - Math.max(0, r - CONE.rim) * CONE.slope - y, inner(r)), SIDE.top - Math.max(q, SIDE.pit * 2 - q) * SIDE.slope);
        if (pk > VOLCANO[0] && pk < VOLCANO[1]) return (pk > SOUTH ? d < 26 : d < 14 && c < 12) ? 0 : -Math.max(0, c);
        const e = d - 22, apron = r < 345 ? (e < 10 ? e * 0.15 : 1.5 + (e - 10) * 3) : e < 118 ? e * 0.15 : 17.7 + (e - 118) * 2.5;
        return -Math.max(0, Math.min(c, apron)); };
      const g = terrain(h, { stepSec: 10, margin: 320, hollow: relief, mat: h.mat('paint', { c: 0x6a5d52 }) });
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000), h.mat('paint', { c: 0x194b72 })); sea.rotation.x = -Math.PI / 2; sea.position.set(-100, 0, -800); h.scene.add(sea);
      const at = pk => S[Math.round(pk / LAP * N) % N], B = (label, ...a) => { const b = block(h, label, ...a); if (!label) b.remove(b.children[b.children.length - 1]); return b; }; // '' = no label plate
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left (island) / 1 = right (sea), its near face `off` metres from the wall;
      // w across the road, d along it. Set on the lowest ground under it (ht is kept above its centre), or at altitude y when given (water level: 0)
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = at(pk), [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z);
        const y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + (b * s.tx - a * s.tz) / 2, z + (b * s.tz + a * s.tx) / 2)));
        return B(label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, h.across(s)); };
      // abs(label, colour, x, z, w, ht, d): a block at a spot of the plan, set on the lowest ground under it
      const abs = (label, c, x, z, w, ht, d) => { const y1 = g.hAt(x, z), y0 = Math.min(y1, ...[[w, d], [-w, d], [w, -d], [-w, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2))); return B(label, c, w, ht + y1 - y0, d, x, y0, z); };
      // over(label, colour, pk, w, ht, d, y, off): a block set from the roadway, not from the ground: its underside y metres above the road, its centre `off` metres to the right of the axis (0: a slab across the road)
      const over = (label, c, pk, w, ht, d, y, off = 0) => { const s = at(pk), [x, z] = edgePt(s, 1, off); return B(label, c, w, ht, d, x, s.y + y, z, h.across(s)); };
      for (const z of ZONES) VOLCAN[z]({ h, g, put, abs, over, at });
    },
  });
})();
