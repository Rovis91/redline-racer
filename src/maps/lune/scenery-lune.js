// Scenery placement for "lune" (Lunar Outpost V2, blockout): terrain with its five craters, roadway, then the named blocks of each zone (scenery-lune-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
(function () {
  const { near, block, edgePt, terrain } = PLACERS;
  const ZONES = ['base', 'occidental', 'cretes', 'oriental', 'bassin'], LAP = 4950; // LAP: plan length of the proposal, the unit of its chainages (PK)
  // the five impacts of geometry.json: [x east, z = -north, radius, floor altitude]. The loop runs clockwise around the first three (crater on the right).
  const CRATERS = [[-555, -101, 272, -32], [414, -161, 343, -75], [283, 383, 222, -28], [-101, -363, 141, -12], [-232, 232, 146, -10]];

  Object.assign(SCENERY, {
    lune(h) {
      const { THREE, S, N, T } = h, ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
      // a crater: flat floor up to 0.4 r, then a bowl up to 1.1 r (the road runs between 0.9 and 1.25 r). The carve starts 16 m off the axis and falls at most 0.8 m per metre: the road stays on a ledge of the rim
      const carve = (x, z, y) => { let d = 0; for (const [cx, cz, r, f] of CRATERS) d = Math.max(d, (y - f) * (1 - ss((Math.hypot(x - cx, z - cz) / r - 0.4) / 0.7)));
        if (!d) return 0; const s = S[near(h, x, z)]; return Math.min(d, Math.max(0, Math.hypot(s.x - x, s.z - z) - 16) * 0.8); };
      const g = terrain(h, { stepSec: 10, margin: 420, hollow: carve, mat: h.mat('paint', { c: 0x747988 }) });
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide): the roadway is laid again at the real width, as on givre
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left (outside of the loop) / 1 = right (craters), its near face `off` metres from the wall;
      // w across the road, d along it. Set on the lowest ground under it (ht is kept above its centre), or at altitude y when given (the Earth)
      const at = pk => S[Math.round(pk / LAP * N) % N];
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = at(pk), [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z);
        const y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2)));
        return block(h, label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, h.across(s)); };
      // far(label, colour, x, z, w, ht, d, y): a block at map coordinates (x east, z = -north), for what belongs to the horizon and not to a chainage; on the ground, or at altitude y
      const far = (label, c, x, z, w, ht, d, y) => block(h, label, c, w, ht, d, x, y ?? g.hAt(x, z) - 2, z);
      for (const z of ZONES) LUNE[z]({ h, g, put, far, S, N, at });
    },
  });
})();
