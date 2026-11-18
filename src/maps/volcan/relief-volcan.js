// Relief of "volcan": the height of the island at any point (metres, sea level 0), with no reference to the road. Read by scenery-volcan.js (the terrain) and by the layout generator, which lays the road on it.
// An island of stacked basalt flows: a low south shore, a highland that rises northwards to tall sea cliffs, lava lobes that end in scarps, a cone cut by ravines around a caldera whose rim is broken (high crags, one collapsed sector).
// Pure functions of (x, z): x east, z south. The randomness is a fixed hash (no call to the shared rnd).
(function () {
  const ss = (a, b, v) => { const k = Math.max(0, Math.min(1, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
  const hash = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  const noise = (x, z) => { const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
    return (hash(i, j) * (1 - a) + hash(i + 1, j) * a) * (1 - b) + (hash(i, j + 1) * (1 - a) + hash(i + 1, j + 1) * a) * b; };            // 0 to 1
  const fbm = (x, z) => noise(x, z) * 0.5 + noise(x * 2.1 + 7, z * 2.1 + 3) * 0.3 + noise(x * 4.3 + 1, z * 4.3 + 9) * 0.2;
  // the shoreline, drawn by hand (x, z), clockwise from the south-west: bays, headlands and the deltas where a flow reached the sea
  const COAST = [-720, 60, -560, 48, -420, 70, -330, 40, -300, 22, 262, 20, 330, 44, 420, 30, 500, 60, 590, 20, 640, -60, 700, -130, 790, -170, 860, -260, 830, -360, 880, -450, 960, -520, 940, -640, 850, -700, 870, -820, 930, -900, 900, -1020, 820, -1080, 800, -1200, 720, -1290,
    700, -1400, 620, -1480, 560, -1600, 450, -1660, 330, -1690, 200, -1650, 90, -1680, -40, -1620, -180, -1640, -330, -1560, -470, -1570, -600, -1470, -760, -1420, -860, -1280, -1000, -1220, -1040, -1080, -940, -980, -990, -840, -1060, -720, -980, -600, -880, -520, -900, -380, -820, -280, -840, -150, -760, -60];
  const NC = COAST.length / 2, cx = i => COAST[i * 2], cz = i => COAST[i * 2 + 1];
  // signed distance to the shoreline: positive on land
  const shore = (x, z) => { let m = 1e9, c = false; for (let i = 0, j = NC - 1; i < NC; j = i++) { const ax = cx(j), az = cz(j), bx = cx(i) - ax, bz = cz(i) - az, k = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
      m = Math.min(m, Math.hypot(x - ax - bx * k, z - az - bz * k)); if ((cz(i) > z) !== (az > z) && x < bx * (z - cz(i)) / bz + cx(i)) c = !c; } return c ? m : -m; };
  const CONE = { x: -113, z: -906, rim: 200, floor: 105, floorY: 140 };                 // the caldera: rim radius, radius and altitude of its floor
  const QUAY = [[-300, -2, 262, 26, 3.2]];                                               // the made ground of the harbour: [x0, z0, x1, z1, altitude]
  // lava lobes: a flow [x, z, …] from the cone to its front, w wide, t thick: a tongue with a steep front and steep sides
  const LOBES = [{ path: [-113, -906, 250, -800, 400, -690, 440, -640], w: 110, t: 36 }, { path: [-113, -906, -420, -1250, -700, -1330], w: 130, t: 26 }, { path: [-113, -906, -480, -700, -800, -640], w: 120, t: 22 }];
  const lobe = (x, z) => { let s = 0; for (const { path, w, t } of LOBES) { let m = 1e9; const n = path.length / 2 - 1; for (let i = 0; i < n; i++) { const ax = path[i * 2], az = path[i * 2 + 1], bx = path[i * 2 + 2] - ax, bz = path[i * 2 + 3] - az, k = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
        m = Math.min(m, Math.hypot(x - ax - bx * k, z - az - bz * k)); } s = Math.max(s, t * ss(w * (0.75 + 0.5 * noise(x / 60, z / 60)), w * 0.45, m)); } return s; };
  // rim(a): altitude of the crest of the caldera in the direction a: crags and saddles, and the collapsed sector of the west-north-west
  const rim = a => { const d = Math.atan2(Math.sin(a - 3.5), Math.cos(a - 3.5)); return 300 + 58 * (noise(4 + Math.cos(a) * 2.6, 4 + Math.sin(a) * 2.6) - 0.5) * 2 + 34 * (noise(9 + Math.cos(a) * 7, 9 + Math.sin(a) * 7) - 0.5) - 75 * ss(0.55, 0.1, Math.abs(d)); };
  const height = (x, z) => {
    for (const [x0, z0, x1, z1, y] of QUAY) if (x > x0 && x < x1 && z > z0 && z < z1) return y;
    const wild = 1 - ss(-460, -360, x) * ss(700, 600, x) * ss(-220, -40, z);                                                               // 0 along the harbour and the village shore, 1 elsewhere
    const sd = shore(x, z) + ((fbm(x / 150, z / 150) - 0.5) * 80 + (noise(x / 45, z / 45) - 0.5) * 22) * wild; // lobed and broken shoreline; the harbour shore stays as drawn
    if (sd <= 0) return Math.max(-8, sd * 0.6);
    const dx = x - CONE.x, dz = z - CONE.z, r = Math.hypot(dx, dz), a = Math.atan2(dz, dx), top = rim(a);
    const plain = 5 + 20 * ss(0, 420, sd) + 9 * (fbm(x / 70, z / 70) - 0.5) * ss(30, 160, sd);                                          // hummocky lava plain behind the shore
    let high = 135 * Math.max(0, Math.min(1, (-z - 120) / 1460)) * ss(-760, -360, x);                                                    // the highland: rises northwards, east of the caldera
    high += 18 * (fbm(x / 110, z / 110) - 0.5) * ss(10, 60, high); high = high * 0.5 + Math.round(high / 14) * 14 * 0.5;              // stepped: the edges of the stacked flows
    const rav = Math.pow(Math.abs(Math.sin(a * 6.5 + 4 * noise(6 + Math.cos(a) * 2, 6 + Math.sin(a) * 2))), 0.7);                        // ravines radiating down the cone: 0 in a bed, 1 on a spur
    const lam = 165 * (0.88 + 0.12 * rav);
    let cone;
    if (r >= CONE.rim + 6) cone = (top - plain) * Math.exp(-(r - CONE.rim - 6) / lam);
    else if (r >= CONE.rim - 6) cone = top - plain;                                                                                     // the crest: a level band, never an edge on the grid
    else cone = CONE.floorY - plain + (top - CONE.floorY) * (0.42 * ss(CONE.floor, 168, r) + 0.58 * ss(168, CONE.rim - 6, r))            // inside: scree, then the cliff
      + 3 * (fbm(x / 30, z / 30) - 0.5) * ss(CONE.floor, 60, r);
    const hi = r < CONE.rim ? 0 : high, land = plain + Math.max(cone, hi) + 0.25 * Math.min(cone, hi) + (r > CONE.rim + 40 ? lobe(x, z) : 0); // inside the caldera the highland does not count
    const q = Math.hypot(x + 690, z + 930), side = 85 * (1 - ss(0, 150, q)) - 22 * (1 - ss(0, 38, q));                                    // the parasitic cone of the west flank and its own small crater
    const crag = 7 * (1 - Math.abs(2 * noise(x / 38 + 3, z / 38 + 8) - 1)) * ss(26, 60, land) * (r < CONE.rim ? 0 : 1);                           // lava ridges: the ground is never a smooth lawn above the fields
    return (land + crag + Math.max(0, side)) * ss(0, 14, sd);                                                                                  // the land ends in a cliff as high as the ground behind it
  };
  (typeof window !== 'undefined' ? window : globalThis).RELIEF_VOLCAN = { height, shore, CONE, ss, noise, fbm };
})();
