// Scenery placement for "area51" (Area 51 / Signal Unknown, blockout): terrain, roadway, then the named blocks of each zone (scenery-area51-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
// Coordinates are plan metres (x = east, z = south), the frame of the proposal's technical plan, so a block can be read off a plan directly.
// Site logic, as on a real flight-test base: dry lake to the north, runway on its edge, then going south taxiway, apron, hangar row, service road, and the alluvial fan rising to the range;
// what must be shielded sits in the relief (B1 inside the mesa, the big dish in a bowl), what must see far sits on it (radar on the ridge).
(function () {
  const { near, block, edgePt, terrain } = PLACERS;
  const ZONES = ['pistes', 'hangar', 'bunker', 'antennes', 'collines'], LAP = 6323; // LAP: plan length of the layout, the unit of the chainages (PK)
  // relief the road does not make, [x, z, radius x, radius z, height]: B1's mesa, the radar ridge, the two shoulders of the road cut, hills south and east of the base
  const HILLS = [[1160, 1235, 430, 190, 55], [210, 540, 170, 300, 40], [330, 250, 120, 90, 30], [470, 395, 80, 60, 22], [1900, 1250, 250, 170, 35], [2390, 1340, 180, 160, 40], [2700, 900, 200, 400, 40]];
  const BOWL = [560, 1010, 250, 100, 24]; // the rim round D1: centre, radius of the crest, half-width, height
  const B1 = [[1472, 1125], [850, 1220]]; // B1's two portals: between them the road runs under blocks, and the hill keeps 40 m off the axis instead of 22
  const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  Object.assign(SCENERY, {
    area51(h) {
      const { THREE, S, N, T } = h, k = h.M.sc, idx = (x, z) => near(h, x * k, z * k), [t0, t1] = B1.map(p => idx(...p));
      // the range closes the basin to the south (z > 1380) and west (x < 100); hills rise from 22 m off the axis (full height 45 m further): the road stays in the open
      const rise = (x, z) => { const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), X = x / k, Z = z / k; let y = 130 * ss((Z - 1380) / 300) + 110 * ss((100 - X) / 300);
        for (const [cx, cz, rx, rz, ht] of HILLS) y += ht * ss(1 - Math.hypot((X - cx) / rx, (Z - cz) / rz));
        y += BOWL[4] * ss(1 - Math.abs(Math.hypot(X - BOWL[0], Z - BOWL[1]) - BOWL[2]) / BOWL[3]); return y * ss((d - (i >= t0 && i <= t1 ? 40 : 22)) / 45); };
      const g = terrain(h, { stepSec: 10, margin: 400, hollow: (x, z) => -rise(x, z), mat: h.mat('paint', { c: 0xd69a72 }) });
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide): the roadway is laid again at the real width, as on givre
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      const smp = pk => S[Math.round(pk / LAP * N) % N], pk = (x, z) => idx(x, z) / N * LAP; // pk(x, z): chainage of the road point nearest to a plan position
      const low = (x, z, w, d) => Math.min(g.hAt(x, z), ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2)));
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left / 1 = right, its near face `off` metres from the wall; w across the road, d along it.
      // Set on the lowest ground under it (ht is kept above its centre), or with its base at altitude y when given
      const put = (label, c, p, sd, off, w, ht, d, y) => { const s = smp(p), [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z), y0 = y ?? low(x, z, w, d);
        return block(h, label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, h.across(s)); };
      // at(label, colour, x, z, wx, ht, dz, y): a block at a plan position, wx east-west and dz north-south, kept square to the plan; its board is turned by quarter turns toward the car arriving on the nearest road
      const at = (label, c, x, z, wx, ht, dz, y) => { x *= k; z *= k; const q = Math.round(h.across(S[near(h, x, z)]) / (Math.PI / 2)), [w, d] = q & 1 ? [dz, wx] : [wx, dz], y1 = g.hAt(x, z), y0 = y ?? low(x, z, wx, dz);
        return block(h, label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, q * Math.PI / 2); };
      // box(label, colour, s, lat, w, ht, d, y): a block at road sample s, its centre `lat` metres right of the axis (0: over the road), its base y metres above the roadway: what a hall or a tunnel is made of
      const box = (label, c, s, lat, w, ht, d, y) => block(h, label, c, w, ht, d, ...edgePt(s, 1, lat).flatMap((v, i) => i ? [s.y + y, v] : [v]), h.across(s));
      const mute = b => { b.remove(b.children[b.children.length - 1]); return b; }; // a repeated piece of a larger thing: no board of its own
      for (const z of ZONES) AREA51[z]({ h, g, S, put, at, box, mute, smp, pk, idx });
    },
  });
})();
