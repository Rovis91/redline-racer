// Relief of "volcan": the height of the island at a point (metres, sea level 0), given the level of the road nearby. Read by scenery-volcan.js (the terrain).
// The layout is fixed (the bible's road): the ground follows the road's level, and this file gives it its forms: a shoreline of bays, headlands and lava deltas that ends in cliffs as high as the land behind,
// stacked flows that step, lava ridges, a cone cut by ravines around a caldera whose rim is broken into crags and saddles, a parasitic cone on the west flank.
// Pure functions; x east, z south. The randomness is a fixed hash (no call to the shared rnd).
(function () {
  const ss = (a, b, v) => { const k = Math.max(0, Math.min(1, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
  const hash = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  const noise = (x, z) => { const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
    return (hash(i, j) * (1 - a) + hash(i + 1, j) * a) * (1 - b) + (hash(i, j + 1) * (1 - a) + hash(i + 1, j + 1) * a) * b; };            // 0 to 1
  const fbm = (x, z) => noise(x, z) * 0.5 + noise(x * 2.1 + 7, z * 2.1 + 3) * 0.3 + noise(x * 4.3 + 1, z * 4.3 + 9) * 0.2;
  // the old shore road of the bible (x, z every 80 m): the land of the roadless west and north lies inside it
  const COAST = [0, 0, -82, -5, -162, -2, -242, 1, -322, 3, -401, 4, -481, 4, -561, 1, -641, -5, -720, -19, -796, -44, -863, -87, -912, -150, -943, -223, -948, -303, -922, -377, -879, -445, -848, -518, -863, -595, -911, -659, -958, -724, -989, -797, -997, -877, -981, -955, -941, -1024, -892, -1087, -851, -1156, -808, -1223, -739, -1262, -667, -1296, -609, -1351, -550, -1405, -479, -1441, -401, -1456, -321, -1452, -246, -1426, -178, -1383, -110, -1342, -32, -1328, 40, -1359, 93, -1419, 137, -1486, 192, -1544, 268, -1565, 343, -1541, 395, -1482, 403, -1404, 368, -1332, 304, -1286, 225, -1272, 153, -1241, 113, -1173, 110, -1094, 158, -1032, 233, -1008, 311, -1020, 376, -1066, 426, -1129, 475, -1192, 542, -1233, 620, -1221, 684, -1175, 739, -1116, 767, -1042, 751, -965, 696, -908, 635, -856, 603, -784, 631, -712, 694, -663, 747, -605, 747, -526, 700, -463, 630, -424, 556, -396, 492, -349, 470, -274, 509, -206, 557, -142, 559, -67, 497, -18, 421, 6, 343, 23, 263, 32, 183, 30, 104, 20, 26, 4];
  const NC = COAST.length / 2, cx = i => COAST[i * 2], cz = i => COAST[i * 2 + 1];
  const shore = (x, z) => { let m = 1e9, c = false; for (let i = 0, j = NC - 1; i < NC; j = i++) { const ax = cx(j), az = cz(j), bx = cx(i) - ax, bz = cz(i) - az, k = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
      m = Math.min(m, Math.hypot(x - ax - bx * k, z - az - bz * k)); if ((cz(i) > z) !== (az > z) && x < bx * (z - cz(i)) / bz + cx(i)) c = !c; } return c ? m : -m; };
  const CONE = { x: -113, z: -906, rim: 200, band: 8, foot: 345, floor: 105, top: 330 };   // the caldera: a level crest 16 m wide, 200 m in radius; outside, the flank comes down to the ground at foot; inside, the wall comes down to a floor of radius floor
  const SIDE = { x: -690, z: -930, top: 95, r: 150 };                                       // parasitic cone on the west flank
  // rim(a): height of the crest above the road level in the direction a, as a share of CONE.top: crags and saddles, and the collapsed sector of the west-north-west
  const rim = a => { const d = Math.atan2(Math.sin(a - 3.5), Math.cos(a - 3.5)); return 1 + 0.2 * (noise(4 + Math.cos(a) * 2.6, 4 + Math.sin(a) * 2.6) - 0.5) * 2 + 0.12 * (noise(9 + Math.cos(a) * 7, 9 + Math.sin(a) * 7) - 0.5) - 0.22 * ss(0.55, 0.1, Math.abs(d)); };
  // volcano(x, z, y): height of the cone above the ground level y
  const volcano = (x, z, y) => { const dx = x - CONE.x, dz = z - CONE.z, r = Math.hypot(dx, dz), a = Math.atan2(dz, dx), q = Math.hypot(x - SIDE.x, z - SIDE.z), side = Math.max(0, SIDE.top * (1 - ss(0, SIDE.r, q)) - 24 * (1 - ss(0, 40, q)));
    if (r > CONE.foot * 1.25) return side; const up = Math.max(0, CONE.top - y);
    const rav = Math.pow(Math.abs(Math.sin(a * 6.5 + 4 * noise(6 + Math.cos(a) * 2, 6 + Math.sin(a) * 2))), 0.7), foot = CONE.foot * (0.9 + 0.3 * rav);   // ravines: 0 in a bed, 1 on a spur: the spurs run further out
    const crest = r > CONE.rim - 60 && r < CONE.rim + 90 ? 1 + (rim(a) - 1) * ss(60, 0, Math.abs(r - CONE.rim - 10)) * ss(90, 40, r - CONE.rim) : 1;     // the crags stand on the crest only: the mouths of the galleries keep their cover
    return Math.max(side, up * crest * (r > CONE.rim ? 1 - ss(CONE.rim + CONE.band, foot, r) : 0.42 * ss(CONE.floor, 168, r) + 0.58 * ss(168, CONE.rim - CONE.band, r))); }; // inside: scree, then the cliff
  // height(x, z, y, d): y = the level of the road nearby; d = distance to the road, positive inside its loop
  const height = (x, z, y, d) => {
    const wild = 1 - ss(-640, -560, x) * ss(500, 420, x) * ss(-130, -50, z);                                                             // 0 along the harbour and the village shore, 1 elsewhere
    const sd = Math.max(shore(x, z), d) + 24 + wild * (16 + 120 * fbm(x / 170, z / 170) + 24 * (noise(x / 45, z / 45) - 0.5));          // land: inside the loop or the old shore, and a strip outside them, lobed: bays, headlands, deltas
    if (sd <= 0) return Math.max(-8, sd * 0.6);
    const far = ss(14, 70, Math.abs(d)), r = Math.hypot(x - CONE.x, z - CONE.z);
    let g = y + far * (9 * (fbm(x / 70, z / 70) - 0.5) + (Math.round((y + 12 * fbm(x / 110, z / 110)) / 14) * 14 - y - 6) * 0.45 * ss(40, 90, y));   // hummocks; above the fields, the steps of the stacked flows
    g += 7 * (1 - Math.abs(2 * noise(x / 38 + 3, z / 38 + 8) - 1)) * ss(26, 60, y) * far * (r < CONE.rim ? 0 : 1);                         // lava ridges
    return (g + volcano(x, z, y)) * ss(0, 14, sd);                                                                                      // the land ends in a cliff as high as the ground behind it
  };
  (typeof window !== 'undefined' ? window : globalThis).RELIEF_VOLCAN = { height, volcano, CONE, ss, noise, fbm };
})();
