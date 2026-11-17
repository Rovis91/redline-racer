// Scenery placement for "lune" (Lunar Outpost V3, blockout): terrain with its craters and the arena, roadway, guardrails, then the named blocks of each zone (scenery-lune-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
(function () {
  const { near, block, edgePt, terrain } = PLACERS;
  const ZONES = ['base', 'occidental', 'cretes', 'arene', 'bassin'], LAP = 3981; // LAP: plan length of the layout, the unit of its chainages (PK)
  // the two craters the road enters: [x east, z = -north, floor radius, rim radius, outer foot radius, floor altitude, rim altitude, altitude outside, height of the rock face at the foot of the wall]. EAST is the arena: its floor is M.place, and the rock face stands where the physics stops the car
  const EAST = [470, -200, 262, 450, 560, -30, 70, 20, 16], SOUTH = [283, 383, 89, 222, 282, -28, 25, 20, 0];
  // the craters the road only passes: [x, z, radius, floor altitude]: western crater, satellite impact, the two fresh impacts of the chicane
  const BESIDE = [[-555, -101, 272, -32], [-232, 232, 146, -10], [-885, -10, 30, 15], [-838, -130, 30, 20]];
  const ROCK = 0x747988, DARK = 0x3d4452, PALE = 0xc4c8d2;

  Object.assign(SCENERY, {
    lune(h) {
      const { THREE, S, N, T, M } = h, ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, PL = M.place, DS = { side: THREE.DoubleSide };
      const iLip = near(h, ...M.pts[M.jumps[0][0]].slice(0, 2)), nArena = (T.t0 - iLip + N) % N, nTun = (T.t1 - T.t0 + N) % N, nOut = (iLip - T.t1 + N) % N; // the lap in three: road (tunnel exit to lip), arena (lip to tunnel), tunnel
      // an entered crater has its own profile (floor, wall, rim, outer slope), whatever the road does; where the outer slope of the arena meets the south basin, the lower one wins: the rampart ends in a cliff over the basin, and the tunnel goes under it
      const bowl = ([cx, cz, rf, rr, ro, yf, yr, yo, cl], x, z, y) => { const r = Math.hypot(x - cx, z - cz), f = ss((r - rr) / (ro - rr)); return r > ro ? null : r < rf ? yf : r < rr ? yf + cl * ss((r - rf) / 14) + (yr - yf - cl) * ss((r - rf - 14) / (rr - rf - 14)) : y + (yr - (yr - yo) * f - y) * (1 - f); };
      const shape = (x, z, y) => {
        if (Math.hypot(x - PL.c[0], z - PL.c[1]) < PL.r + 2) return y - (EAST[5] + 0.08 + T.dent(x, z)); // the arena floor: flat, with its small craters (M.dents: the same bowls as the physics); it covers the engine's roadway, no road is shown down there
        const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), k = (i - iLip + N) % N;
        const tE = bowl(EAST, x, z, y), tS = bowl(SOUTH, x, z, y); let t = tE == null ? tS ?? y : tS == null || Math.hypot(x - EAST[0], z - EAST[1]) < EAST[3] ? tE : Math.min(tE, tS); // outside a crater its profile says nothing (null); inside the rim of the great crater its wall wins: no gap toward the basin
        if (k < nArena) { if (d < s.w + 3) t = s.y < EAST[5] + 0.5 ? s.y + 0.08 : Math.max(t, s.y + 0.15); } // lip to tunnel: under the flight the road runs down the crater wall, hidden under the ground; at floor level it cuts the trench that leads to the tunnel mouth
        else if (k >= nArena + nTun) t += (y - t) * (1 - ss((d - s.w - 6) / 40));                      // elsewhere the road stays laid: its own level up to 6 m from the wall, the crater profile 40 m further; over the tunnel, the rampart
        let c = 0; for (const [cx, cz, r, f] of BESIDE) c = Math.max(c, (t - f) * (1 - ss((Math.hypot(x - cx, z - cz) / r - 0.4) / 0.7)));
        return y - t + Math.min(c, Math.max(0, d - 16) * 0.8);                                         // passed craters: a carve that starts 16 m off the axis and falls at most 0.8 m per metre
      };
      const g = terrain(h, { stepSec: 8, margin: 480, hollow: shape, mat: h.mat('paint', { c: ROCK }) });
      // the game draws the roadway at a constant ±W all round the lap: here it is hidden (no road down the crater wall nor across the arena) and laid again at the real width (±s.w, M.wide), from the tunnel exit to the lip
      { const road = h.scene.children.find(o => o.material && o.material.userData && o.material.userData.mo === 1 && o.material.userData.mo0 == null); if (road) road.visible = false; }
      h.ribbon(T.t1, nOut, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { ...DS, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      // th.guardM = 0: the guardrails are placed here, on the same stretch only: none under the flight, none across the arena
      for (const sd of [-1, 1]) h.guardM(sd, T.t1, nOut, s => sd * s.w, h.TH.wallH, s => sd * s.w, -2, h.mat('guardrail', DS, h.TH.intoWall));
      // rings laid on the ground, one mesh per colour: the strata of a crater wall, the pale crest of a rim, the dark bottom of a small crater. ring(x, z, radii from inside to outside, colour, [angle, half-width] left open)
      const BANDS = new Map(), ring = (cx, cz, R, col, gap) => { const B = BANDS.get(col) || BANDS.set(col, { p: [], ix: [] }).get(col), n = Math.max(24, Math.round(R[R.length - 1] * 0.5));
        for (let a = 0; a < n; a++) { const a0 = a / n * 2 * Math.PI, a1 = (a + 1) / n * 2 * Math.PI; if (gap && Math.abs(Math.atan2(Math.sin(a0 - gap[0]), Math.cos(a0 - gap[0]))) < gap[1]) continue;
          for (let j = 0; j < R.length - 1; j++) { const b = B.p.length / 3; for (const [an, r] of [[a0, R[j]], [a1, R[j]], [a0, R[j + 1]], [a1, R[j + 1]]]) { const x = cx + r * Math.cos(an), z = cz + r * Math.sin(an); B.p.push(x, g.hAt(x, z) + 0.7, z); } B.ix.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } } };
      const steps = (a, b, st) => { const R = []; for (let r = a; r < b; r += st) R.push(r); R.push(b); return R; };
      { const out = Math.atan2(S[T.t0].z - EAST[1], S[T.t0].x - EAST[0]); ring(EAST[0], EAST[1], steps(EAST[2] + 2, EAST[2] + 15, 4), DARK, [out, 0.11]); } // the great crater: the rock face round its floor, dark, open at the trench of the way out,
      for (const [a, b] of [[305, 320], [345, 362], [385, 402], [420, 434]]) ring(EAST[0], EAST[1], steps(a, b, 8), DARK);                                  // four strata on its wall,
      ring(EAST[0], EAST[1], steps(444, 462, 9), PALE, [Math.atan2(S[iLip].z - EAST[1], S[iLip].x - EAST[0]), 0.07]);                                         // its pale crest (open where the road reaches the lip),
      for (const [x, z, r] of M.dents) { ring(x, z, steps(0, r * 0.8, 5), DARK); ring(x, z, steps(r, r + Math.max(3, r * 0.14), 4), PALE); }                    // and each small crater of the floor: dark bottom, pale rim
      for (const [a, b] of [[150, 165], [200, 214]]) ring(BESIDE[0][0], BESIDE[0][1], steps(a, b, 8), DARK);                                                  // the western crater: two strata, away from the road
      for (const [x, z] of BESIDE.slice(2)) ring(x, z, steps(0, 20, 5), DARK);                                                                                 // the two fresh impacts of the chicane
      for (const [col, B] of BANDS) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); geo.setIndex(B.ix); geo.computeVertexNormals(); h.scene.add(new THREE.Mesh(geo, h.mat('paint', { c: col, ...DS }))); }
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left / 1 = right, its near face `off` metres from the wall; w across the road, d along it.
      // Set on the lowest ground under it (ht is kept above its centre), or with its base at altitude y when given
      const at = pk => S[Math.round(pk / LAP * N) % N];
      const set = (label, c, s, x, z, w, ht, d, y) => { const y1 = g.hAt(x, z), y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2))); return block(h, label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, h.across(s)); };
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = at(pk); return set(label, c, s, ...edgePt(s, sd, s.w + off + w / 2), w, ht, d, y); };
      // over(label, colour, pk, w, ht, d, up): a slab across the road, its underside `up` metres above the roadway (a roof)
      const over = (label, c, pk, w, ht, d, up) => { const s = at(pk); return set(label, c, s, s.x, s.z, w, ht, d, s.y + up); };
      // far(label, colour, x, z, w, ht, d, y): a block at map coordinates (x east, z = -north), for what belongs to the horizon and not to a chainage; on the ground, or at altitude y
      const far = (label, c, x, z, w, ht, d, y) => block(h, label, c, w, ht, d, x, y ?? g.hAt(x, z) - 2, z);
      for (const z of ZONES) LUNE[z]({ h, g, put, over, far, S, N, at, LAP });
    },
  });
})();
