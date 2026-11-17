// Scenery placement for "area51" (Area 51 / Signal Unknown, blockout of the V5 bible): terrain, roadway, then the named blocks of each zone (scenery-area51-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
// Coordinates are the metres of the bible's technical plan (x = east, z = south, the SVG's own units), so a block can be read off the plan directly.
(function () {
  const { near, block, edgePt, terrain } = PLACERS;
  const ZONES = ['pistes', 'hangar', 'bunker', 'antennes', 'collines'], LAP = 5113; // LAP: plan length of the proposal, the unit of its chainages (PK)
  // relief the road does not make, [x, z, radius x, radius z, height]: B1's hill, the antenna terrace, the three plan hills (south-west, south, south-east), the north-west mesa
  const HILLS = [[1265, 1045, 180, 170, 26], [270, 930, 230, 260, 30], [340, 1330, 260, 170, 45], [1640, 1310, 150, 180, 40], [2390, 1340, 180, 160, 40], [380, 170, 180, 110, 38]];
  const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  Object.assign(SCENERY, {
    area51(h) {
      const { THREE, S, N, T } = h, k = h.M.sc;
      // hills rise from 22 m off the axis (full height at 67 m): the road stays in the open, B1's gallery is left to its blocks; the mountain band of the plan's north edge rises north of z = 190
      const rise = (x, z) => { const s = S[near(h, x, z)], d = Math.hypot(s.x - x, s.z - z); let y = 110 * ss((190 - z / k) / 300);
        for (const [cx, cz, rx, rz, ht] of HILLS) y += ht * ss(1 - Math.hypot((x / k - cx) / rx, (z / k - cz) / rz)); return y * ss((d - 22) / 45); };
      const g = terrain(h, { stepSec: 10, margin: 400, hollow: (x, z) => -rise(x, z), mat: h.mat('paint', { c: 0xd69a72 }) });
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide): the roadway is laid again at the real width, as on givre
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      const smp = pk => S[Math.round(pk / LAP * N) % N], low = (x, z, w, d) => Math.min(g.hAt(x, z), ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2)));
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left / 1 = right, its near face `off` metres from the wall; w across the road, d along it.
      // Set on the lowest ground under it (ht is kept above its centre), or with its base at altitude y when given
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = smp(pk), [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z), y0 = y ?? low(x, z, w, d);
        return block(h, label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, h.across(s)); };
      // at(label, colour, x, z, wx, ht, dz, y): a block at a plan position, wx east-west and dz north-south, kept square to the plan; its board is turned by quarter turns toward the car arriving on the nearest road
      const at = (label, c, x, z, wx, ht, dz, y) => { x *= k; z *= k; const q = Math.round(h.across(S[near(h, x, z)]) / (Math.PI / 2)), [w, d] = q & 1 ? [dz, wx] : [wx, dz], y1 = g.hAt(x, z), y0 = y ?? low(x, z, wx, dz);
        return block(h, label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, q * Math.PI / 2); };
      for (const z of ZONES) AREA51[z]({ h, g, put, at, smp });
    },
  });
})();
