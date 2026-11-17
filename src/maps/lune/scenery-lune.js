// Scenery placement for "lune" (Lunar Outpost V3, blockout): terrain with its craters and the arena, roadway, then the named blocks of each zone (scenery-lune-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
(function () {
  const { near, block, edgePt, terrain } = PLACERS;
  const ZONES = ['base', 'occidental', 'cretes', 'arene', 'bassin'], LAP = 4258; // LAP: plan length of the layout, the unit of its chainages (PK)
  // the two craters the road enters: [x east, z = -north, floor radius, rim radius, outer foot radius, floor altitude, rim altitude, altitude outside]
  const EAST = [470, -200, 270, 450, 560, -30, 60, 20], SOUTH = [283, 383, 89, 222, 282, -28, 25, 20];
  // the craters the road only passes: [x, z, radius, floor altitude]: western crater, satellite impact, the two fresh impacts of the chicane
  const BESIDE = [[-555, -101, 272, -32], [-232, 232, 146, -10], [-880, -35, 30, 16], [-838, -130, 30, 20]];

  Object.assign(SCENERY, {
    lune(h) {
      const { THREE, S, N, T } = h, ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, nT = (T.t1 - T.t0 + N) % N;
      // an entered crater has its own profile (floor, wall, rim, outer slope), whatever the road does; where two overlap, the lower one wins: the rampart between the arena and the south basin
      const bowl = ([cx, cz, rf, rr, ro, yf, yr, yo], x, z, y) => { const r = Math.hypot(x - cx, z - cz); return r > ro ? y : r < rf ? yf : r < rr ? yf + (yr - yf) * ss((r - rf) / (rr - rf)) : y + (yr - (yr - yo) * ss((r - rr) / (ro - rr)) - y) * (1 - ss((r - rr) / (ro - rr))); };
      const shape = (x, z, y) => {
        const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), tun = (i - T.t0 + N) % N < nT;
        if (!tun && s.w > 11 && d < s.w + 1) return y - (s.y - 0.05 + T.dent(x, z)); // the arena: the wide ribbon is the ground itself, with its small craters (M.dents: the same bowls as the physics)
        let t = Math.min(bowl(EAST, x, z, y), bowl(SOUTH, x, z, y));
        if (!tun) t += (y - t) * (1 - ss((d - s.w - 6) / 40));                        // the road stays laid: its own level up to 6 m from the wall, the crater profile 40 m further; over the tunnel, the rampart
        let c = 0; for (const [cx, cz, r, f] of BESIDE) c = Math.max(c, (t - f) * (1 - ss((Math.hypot(x - cx, z - cz) / r - 0.4) / 0.7)));
        return y - t + Math.min(c, Math.max(0, d - 16) * 0.8);                         // passed craters: a carve that starts 16 m off the axis and falls at most 0.8 m per metre
      };
      const g = terrain(h, { stepSec: 8, margin: 300, hollow: shape, mat: h.mat('paint', { c: 0x747988 }) });
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide): the roadway is laid again at the real width, as on givre, but not over the arena (22 m at most: a road to follow across it)
      h.ribbon(T.t1, N, s => -Math.min(s.w, 11), 0, s => Math.min(s.w, 11), 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left / 1 = right, its near face `off` metres from the wall; w across the road, d along it.
      // Set on the lowest ground under it (ht is kept above its centre), or at altitude y when given
      const at = pk => S[Math.round(pk / LAP * N) % N];
      const set = (label, c, s, x, z, w, ht, d, y) => { const y1 = g.hAt(x, z), y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2))); return block(h, label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, h.across(s)); };
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = at(pk); return set(label, c, s, ...edgePt(s, sd, s.w + off + w / 2), w, ht, d, y); };
      // lat(label, colour, pk, offset, w, ht, d): the same, its centre `offset` metres from the axis (< 0: left), for what stands inside the arena
      const lat = (label, c, pk, o, w, ht, d) => { const s = at(pk); return set(label, c, s, ...edgePt(s, Math.sign(o), Math.abs(o)), w, ht, d); };
      // far(label, colour, x, z, w, ht, d, y): a block at map coordinates (x east, z = -north), for what belongs to the horizon and not to a chainage; on the ground, or at altitude y
      const far = (label, c, x, z, w, ht, d, y) => block(h, label, c, w, ht, d, x, y ?? g.hAt(x, z) - 2, z);
      for (const z of ZONES) LUNE[z]({ h, g, put, lat, far, S, N, at });
    },
  });
})();
