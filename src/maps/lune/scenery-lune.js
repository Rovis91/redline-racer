// Scenery placement for "lune" (Lunar Outpost): terrain with its craters and the arena, roadway, guardrails, the shared materials, the horizon, then each zone (scenery-lune-<zone>.js), then the life of the map (scenery-lune-vie.js).
// Shapes: shapes-lune-*.js; textures: textures-lune.js; mood and references: docs/proposals/lunar-outpost/AMBIANCE-V2.html. See docs/methods/NEW-MAP.md, phase 3.
(function () {
  const { near, edgePt, terrain, weld } = PLACERS;
  const ZONES = ['base', 'occidental', 'cretes', 'arene', 'bassin', 'guidage'], LAP = 5288; // LAP: plan length of the layout, the unit of its chainages (PK)
  // A crater in section: a flat floor, an inner wall that curves up ever steeper to a sharp crest, an outer slope that falls steeply from the crest and flattens out (both concave, power P).
  // The two craters the road enters: [x east, z = -north, floor radius, rim radius, outer foot radius, floor altitude, rim altitude]. EAST is the arena: inside M.place its ground is M.bowls, the same curve
  const P = 2.5, EAST = [470, -200, 200, 360, 520, -30, 70, 0, 0.13, 322], SOUTH = [283, 383, 60, 222, 300, -28, 25, 0.035, 0.22, 100]; // the two rims are 30 m apart: each crater is a full circle
  // the craters the road only passes: [x, z, radius, floor altitude]: western crater, satellite impact, the two fresh impacts of the chicane
  const BESIDE = [[-555, -101, 272, -32], [-232, 232, 146, -10], [-885, -10, 30, 15], [-838, -130, 30, 20]];

  Object.assign(SCENERY, {
    lune(h) {
      const { THREE, S, N, T, M, W } = h, ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, PL = M.place, DS = { side: THREE.DoubleSide };
      const iLip = near(h, ...M.pts[M.jumps[0][0]].slice(0, 2)), nArena = (T.t0 - iLip + N) % N, nTun = (T.t1 - T.t0 + N) % N, nOut = (iLip - T.t1 + N) % N; // the lap in three: road (tunnel exit to lip), arena (lip to tunnel), tunnel
      // the profile of an entered crater at (x, z); beyond its outer foot, y: the ground the road gives there, which the outer slope joins
      // wob(angle, seed): a fixed irregular wave round a centre, -1 to 1: what breaks a rim (its height, or its radius where nothing is driven)
      const wob = (a, s) => 0.5 * Math.sin(a * 3 + s) + 0.3 * Math.sin(a * 7 + s * 2.1) + 0.2 * Math.sin(a * 13 + s * 3.7), hash = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); };
      // [.., jr, jh, r0]: the radius wanders by jr (south basin: nobody drives its wall) and the crest by jh of its height, from radius r0 outward (the arena is exact up to M.place.r: the physics is a circle)
      const bowl = ([cx, cz, rf, rr, ro, yf, yr, jr = 0, jh = 0, r0 = 0], x, z, y) => { const a = Math.atan2(z - cz, x - cx), r = Math.hypot(x - cx, z - cz) / (1 + jr * wob(a, cx)), top = yr + (yr - yf) * jh * wob(a, cz) * ss((r - r0) / 40);
        return r > ro ? y : r < rf ? yf : r < rr ? yf + (top - yf) * ((r - rf) / (rr - rf)) ** P : y + (top - y) * (1 - (r - rr) / (ro - rr)) ** P; };
      const inside = ([cx, cz, , rr], x, z) => Math.hypot(x - cx, z - cz) < rr;
      const OVER = new Set(); // the terrain vertices raised over the tunnel
      // small craters nobody drives into, on the plains, the outer slopes and the walls above the arena: 150 draws over the map, kept when they are clear of the arena, of the road and of each other. [x, z, radius, depth]
      const EXTRA = []; for (let i = 0; i < 150; i++) { const x = -1250 + 2350 * hash(i, 1), z = -1300 + 2200 * hash(i, 2), r = 7 + 26 * hash(i, 3) ** 2, s = S[near(h, x, z)];
        if (Math.hypot(x - EAST[0], z - EAST[1]) > PL.r + r + 6 && Math.hypot(s.x - x, s.z - z) > s.w + r * 0.6 + 14 && !EXTRA.some(e => Math.hypot(e[0] - x, e[1] - z) < (e[2] + r) * 0.7)) EXTRA.push([x, z, r, r * 0.24]); }
      let natLast; const NAT = [], LAYERS = [{ tex: ['regolitheLune', '#5c616f'], weight: (x, z) => ss((Math.sin(x * 0.013 + 1.3) * Math.sin(z * 0.017 + 0.4) + 0.5 * Math.sin(x * 0.031 - z * 0.027) - 0.2) / 0.5) },   // darker blotches 100 to 300 m across
        { tex: ['regolitheLune', '#979dab'], weight: (x, z) => 0.8 * ss((Math.sin(x * 0.021 - 2.1) * Math.sin(z * 0.011 + 1.7) + 0.4 * Math.sin(x * 0.043 + z * 0.037) - 0.45) / 0.4) }, // paler dust in smaller patches
        { tex: ['rocheLune', '#636a78'], slope: [0.3, 0.55] }];
      const shape = (x, z, y) => { natLast = null;
        const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), k = (i - iLip + N) % N, rE = Math.hypot(x - EAST[0], z - EAST[1]), tun = k >= nArena && k < nArena + nTun;
        if (k < nArena && d < s.w + 1) return y - (s.y + 0.08 + T.dent(x, z));             // from the lip to the tunnel the ground is what the car drives on: the ribbon (which comes down from the lip under the flight) plus the bowl and its small craters; it covers the engine's roadway
        const floor = rE < PL.r ? EAST[5] + 0.08 + T.dent(x, z) : null;                    // the arena: M.bowls and M.dents, as in the physics
        const tE = bowl(EAST, x, z, y), tS = bowl(SOUTH, x, z, y);
        let t = floor ?? (inside(EAST, x, z) ? tE : inside(SOUTH, x, z) ? tS : Math.max(tE, tS)); // inside a rim, that crater alone; outside both, the higher of the two outer slopes: a valley between the two crests
        if (tun) { natLast = t; if (d < W + 9 && t < s.y + 10.5) { t = s.y + 10.5; OVER.add(Math.fround(x) + "," + Math.fround(z)); } return y - t; } // over the tunnel the ground is kept above the vault from one mouth to the other: a berm where the bowl is still low
        if (floor != null) return y - t;
        if (k >= nArena + nTun) t += (y - t) * (1 - ss((d - s.w - 6) / 40));               // elsewhere the road stays laid: its own level up to 6 m from the wall, the crater profile 40 m further
        let c = 0; for (const [cx, cz, r, f] of BESIDE) { const q = Math.hypot(x - cx, z - cz) / (r * (1 + 0.07 * wob(Math.atan2(z - cz, x - cx), cx))); if (q < 1) c = Math.max(c, (t - f) * (1 - q ** P)); }
        for (const [cx, cz, r, dp] of EXTRA) { const q = Math.hypot(x - cx, z - cz) / (r * (1 + 0.14 * wob(Math.atan2(z - cz, x - cx), cz))); if (q < 1) c = Math.max(c, dp * (1 - q ** P)); }
        return y - t + Math.min(c, Math.max(0, d - 16) * 0.8);                             // passed craters: the same concave bowl, carved from 16 m off the axis, at most 0.8 m per metre
      };
      // ground: regolith in three tones (the base, darker blotches, paler patches: no two hundred metres alike), bare stratified rock where it is steep (crater walls, cuttings)
      const g = terrain(h, { stepSec: 8, margin: 480, hollow: (x, z, y) => { const c = shape(x, z, y); NAT.push(natLast ?? y - c); return c; }, mat: h.mat('regolitheLune'), layerSet: LAYERS }); // NAT: the ground of each vertex before the berm of the tunnel
      // The grid of the terrain is 8 m: too coarse for the ground the car drives on off the ribbon (the small craters, 20 m across for the smallest, were drawn up to 2 m away from the physics: the car sank into the ground or floated)
      // and for the two mouths of the tunnel (stair-stepped berm, holes in front of the tube). Its cells are drawn again on a 2 m grid wherever the arena is not flat and round each mouth.
      // fineH: the ground there. In the arena, exactly what the physics reads (M.bowls, M.dents); over the tunnel, 2 samples in from each mouth, the berm of the covered way: flat above the hull (W + 3), then a talus
      { const [bx0, bz0, bx1] = g.box, cnx = Math.ceil((bx1 - bx0) / 8) + 1, hC = g.hAt, geo = g.mesh.geometry, FLAT = EAST[5] + 0.08;
        const natAt = (x, z) => { const fx = (x - bx0) / 8, fz = (z - bz0) / 8, ix = fx | 0, iz = fz | 0, a = fx - ix, b = fz - iz, k = iz * cnx + ix; return (NAT[k] * (1 - a) + NAT[k + 1] * a) * (1 - b) + (NAT[k + cnx] * (1 - a) + NAT[k + cnx + 1] * a) * b; };
        const fineH = (x, z) => { const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), k = (i - iLip + N) % N, kk = k - nArena;
          const t = Math.hypot(x - EAST[0], z - EAST[1]) < PL.r ? (k < nArena && d < s.w + 1 ? s.y : EAST[5]) + 0.08 + T.dent(x, z) : natAt(x, z);
          return kk >= 2 && kk <= nTun - 2 ? Math.max(t, s.y + 10.6 - Math.max(0, d - W - 3) * 2.1) : Math.abs(kk - nTun) < 6 && d < W + 1 ? Math.min(t, s.y - 0.5) : t; }; // (at the exit the basin stands over the roadway: kept under it across the mouth)
        const nearS = (x, z, i0, i1, r) => { for (let i = i0; i <= i1; i += 2) { const s = S[(i + N) % N]; if (Math.hypot(s.x - x, s.z - z) < r) return true; } return false; };
        const FC = new Set(), fin = (ix, iz) => FC.has(iz * cnx + ix); // the cells drawn fine: round the exit of the tunnel; in the arena, round its entry and wherever one of 9 points of the cell is off the flat floor
        for (let c = 0; c < geo.index.count / 6; c++) { const ix = c % (cnx - 1), iz = c / (cnx - 1) | 0, x = bx0 + ix * 8, z = bz0 + iz * 8;
          if (nearS(x + 4, z + 4, T.t1 - 45, T.t1 + 6, 34) || ![0, 8].some(a => [0, 8].some(b => Math.hypot(x + a - EAST[0], z + b - EAST[1]) > PL.r + 10))
            && (nearS(x + 4, z + 4, T.t0 - 6, T.t0 + 2, 30) || [0, 4, 8].some(a => [0, 4, 8].some(b => Math.abs(fineH(x + a, z + b) - FLAT) > 1e-3)))) FC.add(iz * cnx + ix); }
        geo.setIndex([...geo.index.array].filter((v, f) => { const c = f / 6 | 0; return !fin(c % (cnx - 1), c / (cnx - 1) | 0); }));
        // a vertex on the edge of the fine area keeps the height of the coarse grid (no crack); a 2 m face inside the tube at a mouth is left out (from 1 sample in at the entry: the floor of the tunnel is there, the headwall boucheLune stands over the cut)
        const V = new Map(), P = [], UV = [], IX = [], vert = (gx, gz) => { const key = gz * 1e5 + gx; let v = V.get(key); if (v == null) { const x = bx0 + gx * 2, z = bz0 + gz * 2, cx = gx >> 2, cz = gz >> 2;
          const inner = fin(cx, cz) && (gx & 3 || fin(cx - 1, cz)) && (gz & 3 || fin(cx, cz - 1)) && (gx & 3 || gz & 3 || fin(cx - 1, cz - 1));
          V.set(key, v = P.length / 3); P.push(x, inner ? fineH(x, z) : hC(x, z), z); UV.push(x / 10, z / 10); } return v; };
        for (const c of FC) { const ix = c % cnx, iz = c / cnx | 0; for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { const gx = ix * 4 + a, gz = iz * 4 + b, x = bx0 + gx * 2 + 1, z = bz0 + gz * 2 + 1, i = near(h, x, z), kk = (i - iLip + N) % N - nArena, m = Math.min(kk, nTun - kk);
          if (kk >= 1 && kk <= nTun && m < 4 && Math.hypot(S[i].x - x, S[i].z - z) < W + 1) continue; // (up to the last sample at the exit: the basin stands 2 m over the floor of the tube there)
          const p = vert(gx, gz), q = vert(gx + 1, gz), r = vert(gx, gz + 1), u = vert(gx + 1, gz + 1); IX.push(p, r, q, q, r, u); } }
        const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); fg.setIndex(IX); fg.computeVertexNormals();
        const C = new Float32Array(P.length / 3 * 4), nr = fg.attributes.normal.array; // the same three layers as the terrain (scenery.js, terrain: a slope or a weight per layer)
        for (let k = 0; k < P.length / 3; k++) LAYERS.forEach((c, j) => { C[k * 4 + j] = Math.max(0, Math.min(1, c.slope ? ss((1 - nr[k * 3 + 1] - c.slope[0]) / (c.slope[1] - c.slope[0])) : c.weight(P[k * 3], P[k * 3 + 2]))); });
        fg.setAttribute('layer', new THREE.BufferAttribute(C, 4)); const fm = new THREE.Mesh(fg, g.mesh.material); fm.receiveShadow = true; h.scene.add(fm);
        g.hAt = (x, z) => fin((x - bx0) / 8 | 0, (z - bz0) / 8 | 0) ? fineH(x, z) : hC(x, z); } // what stands or lies on the ground (rings, pieces) reads the fine ground where it is drawn
      // a height field cannot open a tube: the faces that would cross the tunnel (one corner on the berm, their centre over the roadway) are taken out; the engine's hull closes the slot from above
      { const geo = g.mesh.geometry, p = geo.attributes.position, ix = geo.index.array, keep = [], over = i => OVER.has(p.getX(i) + "," + p.getZ(i));
        for (let f = 0; f < ix.length; f += 3) { const [a, b, c] = [ix[f], ix[f + 1], ix[f + 2]], cx = (p.getX(a) + p.getX(b) + p.getX(c)) / 3, cz = (p.getZ(a) + p.getZ(b) + p.getZ(c)) / 3, q = S[near(h, cx, cz)];
          if (!((over(a) || over(b) || over(c)) && Math.hypot(q.x - cx, q.z - cz) < W + 4)) keep.push(a, b, c); }
        geo.setIndex(keep); }
      // the game draws the roadway at a constant ±W all round the lap: here it is hidden (no road down the crater wall nor across the arena) and laid again at the real width (±s.w, M.wide), from the tunnel exit to the lip
      { const road = h.scene.children.find(o => o.material && o.material.userData && o.material.userData.mo === 1 && o.material.userData.mo0 == null); if (road) road.visible = false; }
      h.ribbon(T.t1, nOut, s => -s.w, 0, s => s.w, 0, h.mat('pisteLune', { ...DS, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), 32);
      // the floor of the tunnel is the engine's (its material is lit by the tunnel): found by its shape, a ribbon of the tunnel's length at road level, it takes the same track drawing
      { const y0 = S[T.t0].y, fl = h.scene.children.find(o => o.isMesh && o.material && o.material.isMeshBasicMaterial && o.geometry.attributes.position.count === (nTun + 1) * 2 && [0, 1].every(k => Math.abs(o.geometry.attributes.position.getY(k) - y0) < 0.01)); if (fl) fl.material.map = h.tx('pisteLune'); }
      // th.guardM = 0: no guardrail on the Moon; the edge of the road is the berms of scenery-lune-guidage.js (inner face on the collision line, ±s.w)
      // the sky is the engine's sphere (radius 2500, it follows the camera): it takes the Moon's sky, stars down to the horizon (the shared sky drawing keeps them above 28°, out of the racing camera's view)
      { const sky = h.scene.children.find(o => o.isMesh && o.geometry.type === 'SphereGeometry' && o.geometry.parameters.radius === 2500); if (sky) { const t = h.tx('cielLune'); t.minFilter = THREE.NearestFilter; sky.material.map = t; } }
      // MAT: the shared materials of the map, one draw pass each for the whole map; its keys are the zone names of the lune shapes (shapes-lune-*.js). Every piece of scenery goes into the group `kit`, merged per material at the end
      const MAT = { shell: h.mat('coqueLune', {}, '#e8e2d0'), hall: h.mat('coqueLune', {}, '#9aa0ac'), dark: h.mat('concreteDark'), steel: h.mat('steelMat'), lattice: h.mat('lattice', { alphaTest: 0.5, ...DS }, '#c8c4b8'),
        amber: h.mat('metalPale', { c: 0xd78a40 }), glow: h.mat('paint', { emis: 1, c: 0xffa040 }), hublot: h.mat('hublotLune', { emis: 1 }, '#ffe9b8'), ceil: h.mat('hublotLune', { emis: 1 }, '#cfe8ff'), solar: h.mat('solaireLune'),
        glass: h.mat('paneDark'), dish: h.mat('metalPale', { c: 0xe8e2d0, ...DS }), rock: h.mat('rocheLune', {}, '#5d6472'), pale: h.mat('rocheLune', {}, '#a9afba', 0.6), far: h.mat('rocheLune', {}, '#3a404c', 0.4),
        strata: h.mat('rocheLune', { ...DS, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, '#3d4452', 0.5), crest: h.mat('regolitheLune', { ...DS, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, '#c4c8d2'), plain: h.mat('regolitheLune', {}, '#565b68'), earth: h.mat('terreLune', { emis: 1, fog: false }), cyan: h.mat('paint', { emis: 1, c: 0x6fd8ff }) };
      MAT.tire = MAT.dark;
      const kit = new THREE.Group(); h.scene.add(kit);
      // rings laid on the ground, one mesh per material: the strata of a crater wall, the pale crest of a rim, the dark bottom of a small crater. ring(x, z, radii from inside to outside, material, [[angle, half-width], …] left open)
      const BANDS = new Map(), ring = (cx, cz, R, m, gaps = [], jit = 0, lift = 0.7) => { const B = BANDS.get(m) || BANDS.set(m, { p: [], uv: [], ix: [] }).get(m), n = Math.max(24, Math.round(R[R.length - 1] * 0.5));
        for (let a = 0; a < n; a++) { const a0 = a / n * 2 * Math.PI, a1 = (a + 1) / n * 2 * Math.PI; if (gaps.some(([ga, gw]) => Math.abs(Math.atan2(Math.sin(a0 - ga), Math.cos(a0 - ga))) < gw)) continue;
          for (let j = 0; j < R.length - 1; j++) { const b = B.p.length / 3; for (const [an, r0] of [[a0, R[j]], [a1, R[j]], [a0, R[j + 1]], [a1, R[j + 1]]]) { const r = r0 * (1 + jit * wob(an, cx + cz)), x = cx + r * Math.cos(an), z = cz + r * Math.sin(an); B.p.push(x, g.hAt(x, z) + lift, z); B.uv.push(an * R[R.length - 1] / 8, r / 8); } B.ix.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } } };
      const steps = (a, b, st) => { const R = []; for (let r = a; r < b; r += st) R.push(r); R.push(b); return R; };
      const aLip = Math.atan2(S[iLip].z - EAST[1], S[iLip].x - EAST[0]), aOut = Math.atan2(S[T.t0].z - EAST[1], S[T.t0].x - EAST[0]);
      for (const [a, b] of [[225, 235], [260, 272], [295, 308], [325, 337]]) ring(EAST[0], EAST[1], steps(a, b, 6), MAT.strata, [[aLip, 0.1], [aOut, 0.1]]);              // the great crater: four strata on its wall (open under the flight and over the tunnel),
      ring(EAST[0], EAST[1], steps(354, 366, 6), MAT.crest, [[aLip, 0.08]]);                                                                                    // its pale crest (open where the road reaches the lip),
      for (const [x, z, r] of M.dents) { ring(x, z, steps(0, r * 0.8, 2.5), MAT.strata, [], 0.1, 0.12); ring(x, z, steps(r, r + Math.max(3, r * 0.14), 4), MAT.crest, [], 0.07, 0.12); } // (12 cm over the fine ground: the car drives on them)   // and each small crater of the floor: dark bottom, pale rim, neither quite round
      // ray(x, z, from, to, angle, width): a streak of pale ejecta thrown out of a crater, tapering outward
      const ray = (cx, cz, r0, r1, a, w) => { const B = BANDS.get(MAT.crest) || BANDS.set(MAT.crest, { p: [], uv: [], ix: [] }).get(MAT.crest), n = Math.max(2, Math.round((r1 - r0) / 8));
        for (let k = 0; k < n; k++) { const b = B.p.length / 3; for (const [f, sd] of [[k / n, -1], [k / n, 1], [(k + 1) / n, -1], [(k + 1) / n, 1]]) { const r = r0 + (r1 - r0) * f, hw = w * (1 - f * 0.8) / 2, x = cx + r * Math.cos(a) - sd * hw * Math.sin(a), z = cz + r * Math.sin(a) + sd * hw * Math.cos(a); B.p.push(x, g.hAt(x, z) + 0.5, z); B.uv.push(r / 8, sd * hw / 8); } B.ix.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } };
      const far2 = (x, z) => { const s = S[near(h, x, z)]; return Math.hypot(s.x - x, s.z - z) > s.w + 3; }; // clear of the roadway
      EXTRA.forEach(([x, z, r], i) => { ring(x, z, steps(0, r * 0.75, 5), MAT.strata, [], 0.14); ring(x, z, steps(r, r + Math.max(2, r * 0.16), 3), MAT.crest, [], 0.12);
        if (i % 3 === 0) for (let k = 0; k < 7; k++) { const a = k * 0.9 + hash(i, k) * 0.6, r1 = r * (2 + 2.5 * hash(i, k + 9)); if (far2(x + r1 * Math.cos(a), z + r1 * Math.sin(a)) && Math.hypot(x + r1 * Math.cos(a) - EAST[0], z + r1 * Math.sin(a) - EAST[1]) > PL.r) ray(x, z, r * 1.15, r1, a, r * 0.3); } }); // one in three is fresh: rays
      for (const [x, z, r] of BESIDE.slice(2)) for (let k = 0; k < 9; k++) { const a = k * 0.7 + hash(x, k) * 0.5, r1 = r * (2.2 + 2.5 * hash(z, k)); if (far2(x + r1 * Math.cos(a), z + r1 * Math.sin(a))) ray(x, z, r * 1.2, r1, a, 9); }  // the two fresh impacts of the chicane throw long rays
      // craterlets on the floor of the arena, too small to feel: a dark dot and a pale lip, flat on the ground, some of them biting the rim of a larger crater
      for (let i = 0; i < 70; i++) { const a = i * 2.39996 + 1, rr = 196 * Math.sqrt((i + 0.5) / 70), x = EAST[0] + rr * Math.cos(a), z = EAST[1] + rr * Math.sin(a), r = 2.5 + 4 * hash(i, 5), dn = M.dents.find(e => Math.hypot(e[0] - x, e[1] - z) < e[2] * 0.85);
        if (!dn && Math.hypot(S[T.t0].x - x, S[T.t0].z - z) > 30) { ring(x, z, steps(0, r * 0.7, 3), MAT.strata, [], 0.15, 0.12); ring(x, z, steps(r * 0.8, r + 1, 1), MAT.crest, [], 0.15, 0.1); } }
      ring(SOUTH[0], SOUTH[1], steps(217, 227, 5), MAT.crest, [[Math.atan2(S[T.t1].z - SOUTH[1], S[T.t1].x - SOUTH[0]), 0.12], [2.75, 0.3]], 0.035);                   // the pale crest of the south basin (open over the tunnel and where the ramp leaves it, to the west)
      for (const [a, b] of [[150, 165], [200, 214]]) ring(BESIDE[0][0], BESIDE[0][1], steps(a, b, 8), MAT.strata);                                            // the western crater: two strata, away from the road
      for (const [x, z] of BESIDE.slice(2)) { ring(x, z, steps(0, 20, 5), MAT.strata, [], 0.12); ring(x, z, steps(31, 36, 5), MAT.crest, [], 0.1); }                              // the two fresh impacts of the chicane: dark bowl, bright rim
      for (const [m, B] of BANDS) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2)); geo.setIndex(B.ix); geo.computeVertexNormals(); kit.add(new THREE.Mesh(geo, m)); }
      // placement. stand(x, z, ry, y): an empty group at map coordinates (x east, z = -north), on the ground unless y is given. add(group, shape, settings, position, skin): poses a catalogue shape in it (skin: MAT, or one material for a simple shape)
      const at = pk => S[Math.round(pk / LAP * N) % N], low = (x, z, w, d) => Math.min(g.hAt(x, z), ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2)));
      const stand = (x, z, ry = 0, y) => { const grp = new THREE.Group(); grp.position.set(x, y ?? g.hAt(x, z), z); grp.rotation.y = ry; kit.add(grp); return grp; };
      const REG = {}, add = (grp, shape, a = [], pos = [0, 0, 0], skin = MAT) => { (REG[shape] = REG[shape] || []).push({ grp, meshes: h.pose(shape, skin, grp, pos, ...a), pos, a }); return grp; }; // REG: every placed shape by name, for the life of the map (scenery-lune-vie.js)
      // by(pk, side, off, [w, d], ry): a group beside the road at chainage pk, side -1 = left / 1 = right, the near face of its w × d footprint `off` metres from the wall, on the lowest ground under that footprint (mid: on the ground at its centre, for what has its own plinth);
      // turned so that the local -X (the front of a building) faces the road and the local Z runs along it. side 0: on the axis, at road level (a frame, a hall bay)
      const by = (pk, sd, off = 0, [w, d] = [0, 0], ry = 0, mid = false) => { const s = at(pk); if (!sd) return stand(s.x, s.z, h.across(s) + ry, s.y);
        const [x, z] = edgePt(s, sd, s.w + off + w / 2); return stand(x, z, h.across(s) + (sd > 0 ? 0 : Math.PI) + ry, mid ? g.hAt(x, z) : low(x, z, w, d)); };
      // the horizon. The terrain stops 480 m from the road: a dark plain runs on from there, lower than the floor of the deepest crater, and four far massifs close the view
      { const p = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), MAT.plain); p.rotation.x = -Math.PI / 2; p.position.set(0, -46, 0); p.geometry.attributes.uv.array.forEach((v, i, A) => A[i] = v * 1500); kit.add(p); }
      for (const [x, z, ry, L, H, sd] of [[-100, -1900, 0, 3400, 250, 1], [1650, -300, 1.5708, 3000, 210, 2], [100, 1500, 0, 3200, 190, 3], [-1850, -250, 1.5708, 3000, 230, 4]]) add(stand(x, z, ry, -40), 'criteLune', [L, H, 420, sd], [0, 0, 0], MAT.far);
      // sit(sample, ry): a group on the axis at a road sample, at road level (chainages drift past the jump, whose fall adds length: what must meet the tunnel is placed on its own samples)
      const sit = (s, ry = 0, lat = 0) => { const [x, z] = edgePt(s, 1, lat); return stand(x, z, h.across(s) + ry, lat ? g.hAt(x, z) : s.y); };
      // boulders all round the lap, in three sizes, 12 to 75 m from the wall, more of them near the craters' walls; none from the lip to the tunnel exit (nothing solid where the car lands) nor round the start hall
      for (let i = 80; i < N - 90; i += 12) { if ((i - iLip + N) % N < nArena + nTun + 10 || (iLip - i + N) % N < 60) continue;
        for (const sd of [-1, 1]) { if (hash(i, sd) < 0.42) continue; const s = S[i], w = [3, 6, 12][hash(i, sd + 3) * 3 | 0], [x, z] = edgePt(s, sd, s.w + 12 + 63 * hash(i, sd + 5) ** 2 + w / 2);
          if (Math.hypot(S[near(h, x, z)].x - x, S[near(h, x, z)].z - z) > 11 + w / 2) add(stand(x, z, hash(i, sd + 7) * 6.28), 'rocherLune', [w, w * (0.5 + 0.4 * hash(i, sd + 8)), w * (0.8 + 0.6 * hash(i, sd + 9)), i + sd], [0, 0, 0], hash(i, sd + 11) < 0.25 ? MAT.pale : MAT.rock); } }
      for (let k = 0; k < 40; k++) { const a = k * 0.157 * 2.02 + hash(k, 3) * 0.1, r = PL.r + 10 + 26 * hash(k, 4), x = EAST[0] + r * Math.cos(a), z = EAST[1] + r * Math.sin(a), w = 4 + 10 * hash(k, 6); // and a broken ring of them on the wall of the arena, just above where the car can climb
        if (Math.abs(Math.atan2(Math.sin(a - aLip), Math.cos(a - aLip))) > 0.2 && Math.abs(Math.atan2(Math.sin(a - aOut), Math.cos(a - aOut))) > 0.15) add(stand(x, z, a), 'rocherLune', [w, w * 0.6, w * 1.2, k], [0, 0, 0], k % 4 ? MAT.rock : MAT.pale); }
      for (const z of ZONES) LUNE[z]({ h, g, S, N, at, LAP, MAT, kit, stand, add, by, sit, tunnel: [S[T.t0], S[T.t1]], lip: S[(iLip - 30 + N) % N], THREE, M, T, EAST, iLip, nArena, edgePt });
      const tick = LUNE.vie({ h, g, S, N, T, LAP, MAT, kit, add, by, REG, iLip, EAST, PL, THREE, edgePt, weld }); // what moves, lights and sounds: it takes its movers out of the kit before the merge
      weld(h, kit); // one mesh per material
      return tick;
    },
  });
})();
