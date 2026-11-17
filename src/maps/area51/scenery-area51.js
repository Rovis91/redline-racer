// Scenery placement for "area51" (Area 51 / Signal Unknown, blockout): terrain, roadway, guardrails, then the named blocks of each zone (scenery-area51-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
// Coordinates are plan metres (x = east, z = south), the frame of the proposal's technical plan, so a block can be read off a plan directly.
// Site logic, as on a real flight-test base: dry lake to the north, the two runways on its edge, then going south taxiway, apron, hangar row, service road, and the alluvial fan rising to the range;
// what must be shielded sits in the relief (B1 under the mesa, the big dish in a bowl), what must see far sits on it (telemetry on the ridge).
(function () {
  const { near, block, edgePt, terrain } = PLACERS;
  const ZONES = ['hangar', 'bunker', 'antennes', 'collines', 'pistes'], LAP = 6784; // LAP: plan length of the layout, the unit of the chainages (PK)
  // relief the road does not make, [x, z, radius x, radius z, height]: B1's mesa, the radar ridge, the two shoulders of the road cut, hills south and east of the base
  const HILLS = [[1160, 1262, 430, 230, 55], [210, 540, 170, 300, 40], [330, 250, 120, 90, 30], [470, 395, 80, 60, 22], [1900, 1250, 250, 170, 35], [2390, 1340, 180, 160, 40], [2700, 900, 200, 400, 40]];
  const BOWL = [560, 1010, 250, 100, 24]; // the rim round D1: centre, radius of the crest, half-width, height
  // B1 is underground: between its two portals the road runs up to 18 m below the mesa foot. The ground keeps its natural level over it (terrain's `ground` option) and is only cut out where the rooms are
  const B1 = [[1472, 1125], [850, 1220]];
  // the rooms along B1, [from, to, free width left, free width right (0: the room goes on past the reactor), free height]: security lock, reactor hall, labs cavern, silo chamber; elsewhere a 24 × 10 m gallery
  const ROOMS = [[[1360, 1226], [1325, 1228], 20, 20, 12], [[1292, 1240], [1146, 1218], 26, 0, 26], [[1085, 1178], [965, 1180], 32, 32, 20], [[940, 1190], [900, 1212], 14, 40, 30]];
  const FLATS = [[850, 2760, -520, 832, 0]]; // graded ground, [x0, x1, z0, z1, altitude]: the lake bed, both runways, the taxiways and the apron are one flat. Slabs lie on it without the fan showing through
  const PIT = [1210, 1262, 46, 7]; // the reactor pool of B1: centre, radius, depth below the hall floor (the road runs a gallery above it)
  const RUNWAY = [[1340, 400], [1975, 400]]; // the stretch where the road is runway A itself: no guardrail there
  const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  Object.assign(SCENERY, {
    area51(h) {
      const { THREE, S, N, T } = h, k = h.M.sc, idx = (x, z) => near(h, x * k, z * k), [t0, t1] = B1.map(p => idx(...p));
      const rooms = ROOMS.map(([a, b, L, R, clear]) => [idx(...a), idx(...b), L, R || 130, clear, !!R]), room = i => rooms.find(r => i >= r[0] && i <= r[1]) || [0, 0, 12, 12, 10, true];
      const over = new Map(); for (let i = t0; i <= t1; i++) over.set(S[i], S[t0].y + (S[t1].y - S[t0].y) * (i - t0) / (t1 - t0)); // natural ground over B1: a straight line between the two portals
      // the range closes the basin to the south (z > 1380) and west (x < 100)
      const hills = (X, Z) => { let y = 130 * ss((Z - 1380) / 300) + 110 * ss((100 - X) / 300); for (const [cx, cz, rx, rz, ht] of HILLS) y += ht * ss(1 - Math.hypot((X - cx) / rx, (Z - cz) / rz));
        return y + BOWL[4] * ss(1 - Math.abs(Math.hypot(X - BOWL[0], Z - BOWL[1]) - BOWL[2]) / BOWL[3]); };
      const hollow = (x, z, y) => { const i = near(h, x, z), s = S[i], X = x / k, Z = z / k;
        if (i >= t0 && i <= t1) { const lat = (x - s.x) * -s.tz + (z - s.z) * s.tx, [, , L, R] = room(i); // over B1: the mesa at full height, cut down to the floor only inside the rooms (12 m of margin: the walls hide the cut)
          return lat > -L - 12 && lat < R + 12 ? y - (s.y - 2) + PIT[3] * ss((PIT[2] + 4 - Math.hypot(X - PIT[0], Z - PIT[1])) / 8) : -hills(X, Z); }
        let f = 0, a = 0; for (const [x0, x1, z0, z1, alt] of FLATS) { const w = ss((X - x0) / 30) * ss((x1 - X) / 30) * ss((Z - z0) / 30) * ss((z1 - Z) / 30); if (w > f) { f = w; a = alt - 0.6; } }
        return f * (y - a) - (1 - f) * hills(X, Z) * ss((Math.hypot(s.x - x, s.z - z) - 22) / 45); }; // in the open, hills rise from 22 m off the axis (full height 45 m further)
      const g = terrain(h, { stepSec: 10, margin: 400, ground: s => over.get(s) ?? s.y, hollow, mat: h.mat('paint', { c: 0xd69a72 }) });
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide): the roadway is laid again at the real width, as on givre
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      // guardrails (th.wallH 0: the engine draws none): everywhere but on the runway, where the road has no edge
      const [r0, r1] = RUNWAY.map(p => idx(...p)), rail = h.mat('guardrail', { side: THREE.DoubleSide }, h.TH.intoWall); for (const sd of [-1, 1]) h.guardM(sd, r1, N - (r1 - r0), s => sd * s.w, 1.1, s => sd * s.w, -2, rail);
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
      // apex(label, colour, pk, w, ht, d, off = 6): a block on the inside of the bend at chainage pk: the thing the road goes round
      const apex = (label, c, p, w, ht, d, off = 6) => put(label, c, p, smp(p).k > 0 ? 1 : -1, off, w, ht, d);
      const mute = b => { b.remove(b.children[b.children.length - 1]); return b; }; // a repeated piece of a larger thing: no board of its own
      for (const z of ZONES) AREA51[z]({ h, g, S, put, at, box, apex, mute, smp, pk, idx, t0, t1, rooms, room });
    },
  });
})();
