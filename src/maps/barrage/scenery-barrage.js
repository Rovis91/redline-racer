// Placement of the "barrage" scenery: adds its function to SCENERY. The shared placers come from scenery.js. See docs/methods/SCENERY.md.
(function () {
  const { inst, near, pt, indexed, insts, GLOW, boxMesh, edgePt, marker, weld, terrain } = PLACERS;

  Object.assign(SCENERY, {
    // ---------- Barrage 74: Soviet mountain hydroelectric plant, early May 1974, low reservoir, bottom outlets open, veiled morning ----------
    // The site: Saïano-Chouchenskaïa at 1/2.5. x toward the east, z toward the south, the river flows toward the south.
    // A 95 m gravity-arch dam wall (foot at 10 m, crest at 105 m) in an arc of 600 m radius (center at x = 0, z = 550, bulging toward the lake to the north) closes a V-shaped valley.
    // Levels: reservoir 85 m (full: 97 m, tree line on the lake side), basin 10 m, east-bank terrace 14 to 16 m (plant, substation, housing estate), river 10 → 6 m.
    // The terrain is a function of the site (`site`); near the road it joins it. The road: estate street, valley, bridge at the foot of the wall, ramp of the west slope,
    // tunnel through the spur of the west abutment, crest, east-slope shoulder (two hairpins), back to the housing estate.
    barrage(h) {
      const { THREE, S, N, W, rnd } = h, PP = h.M.pts.map((_, k) => pt(h, k)), P = k => PP[k], T0 = h.T.t0, T1 = h.T.t1, GLOWI = { emis: 1 }, DS = { side: THREE.DoubleSide }, IX = new Map(S.map((s, i) => [s, i]));
      const LET = new Set(), mc = new Map(), mat = (n, o = {}, ...a) => { const k = n + JSON.stringify(o) + JSON.stringify(a); if (!mc.has(k)) { mc.set(k, h.mat(n, o, ...a)); if (n === 'letters') LET.add(mc.get(k)); } return mc.get(k); }; // one material per setting: the game then merges the pieces that share it
      const batches = new Map(), ribbonFn = (...a) => { const m = h.ribbon(...a); (batches.get(m.material) || batches.set(m.material, []).get(m.material)).push(m); return m; }; // ribbons grouped by material at the end (merged)
      const backdrop = () => { for (const [m, L] of batches) { if (L.length < 2) continue; const P3 = [], N3 = [], UV = [], I = []; for (const o of L) { const g = o.geometry, b = P3.length / 3; P3.push(...g.attributes.position.array); N3.push(...g.attributes.normal.array); UV.push(...g.attributes.uv.array); I.push(...Array.from(g.index.array, i => i + b)); h.scene.remove(o); g.dispose(); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); const o = new THREE.Mesh(g, m); o.receiveShadow = true; h.scene.add(o); } };
      // ---------- life: everything that moves goes through the tick, on dt (pause freezes everything). TICK = functions (dt, car, t); a single wind, from the lake downstream (toward +z) ----------
      // MOB = objects made of painted cubes in local coordinates, drawn as one moving batch (userData.dyn): train, flags, gondolas. The tick only rewrites the objects whose matrix changed (o.dirty)
      const TICK = [], MOB = [], mob = () => { const o = { c: [], M: new THREE.Matrix4(), dirty: 1 }; MOB.push(o); return o; }, mb = (o, x, y, z, r, a, b, c, col) => (o.c.push([x, y, z, r, a, b, c, col]), o);
      const mobA = (o, x, y, z, ry) => { o.M.makeRotationY(ry).setPosition(x, y, z); o.dirty = 1; };
      const flows = (m, v, u = 0) => { TICK.push(dt => { const o = m.map.offset; o.y = (o.y - v * dt) % 1; o.x = (o.x + u * dt) % 1; }); return m; }; // flowing water: the texture advances along v (each mat() setting has its own texture)
      // plumes (spray, smoke, dust): game particles (h.softPuffs), created on the first tick; [x, y, z, colour, opacity, life s, size, per second, rise speed, spread]
      const PAN = [], puffFn = (...p) => { const q = { p, f: null, t: 0 }; PAN.push(q); return q; }, jit = a => (Math.random() - 0.5) * 2 * a;
      TICK.push(dt => { for (const q of PAN) { const [x, y, z, col, op, vitality, tl, via, vy, et, vz = 2.2] = q.p; if (!q.f) q.f = h.softPuffs(Math.ceil(via * vitality) + 4, col, op, vitality, 0.25, tl);
        if (!q.off) for (q.t += dt * via; q.t > 1; q.t--) q.f.emit(x + jit(et), y, z + jit(et), jit(0.6), vy * (0.7 + Math.random() * 0.6), vz + jit(0.8)); q.f.step(dt); } }); // the wind pushes everything toward +z
      // a flag: a thin cube hung from its pole at (x, y, z), which streams in the wind (toward +z) and flaps; r0 and amp: rest and swing of a banner held at the top
      const FLAGS = [], flagCube = (x, y, z, L, H, col = 0xb5241c, r0 = -Math.PI / 2, amp = 0.32) => { FLAGS.push([mb(mob(), L / 2, 0, 0, 0, L, H, 0.06, col), x, y, z, r0, amp, (x * 12.9898 + z * 78.233) % 6.28]); };
      TICK.push((dt, car, t) => { for (const [o, x, y, z, r0, amp, ph] of FLAGS) mobA(o, x, y, z, r0 + amp * Math.sin(t * 5 + ph) + amp * 0.4 * Math.sin(t * 11.3 + ph * 2)); });
      const bollard = (i0, f) => { let armed = 1; TICK.push((dt, car) => { if (!car) return; const e = (car.idx - i0 + N) % N; if (e < 60) { if (armed) { armed = 0; f(car); } } else armed = 1; }); }; // f once per car pass at sample i0
      const K = { startLine: 0, exitVille: 9, flatPart: 21, hangar0: 27, hangar1: 33, bridge0: 40, bridge1: 42, rampSec: 44, ravine: 52, traverse: 55, tunnel: 63, crest: 68, abutment: 75, hairpinHigh: 83, belvedere: 89, descent: 92, entryVille: 100, streetSouth: 112, ending: 116 }; // indices of the named checkpoints (captures/gen-pts.js K)
      const within = (i, a, b) => ((i - P(a) + N) % N) <= ((P(b) - P(a) + N) % N); // sample i between points a and b
      const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }, mix = (a, b, t) => a + (b - a) * t;
      const pl = (T, v) => { if (v <= T[0][0]) return T[0][1]; for (let k = 1; k < T.length; k++) if (v <= T[k][0]) return mix(T[k - 1][1], T[k][1], (v - T[k - 1][0]) / (T[k][0] - T[k - 1][0])); return T[T.length - 1][1]; }; // table [[abscissa, value], …] read as a polyline
      const SUB = []; for (let i = 0; i < N; i += 3) SUB.push(i);
      // nearest sample, by 50 m cells: each cell keeps, on its first query, only the samples that can be the nearest to one of its points
      // (within the minimum distance to the center plus two half-diagonals), in the order of SUB: same result as scanning all of SUB, ties included
      const CELL_SIZE = 50, DG = CELL_SIZE * Math.SQRT1_2, CAND = new Map();
      const nearest = (x, z) => { const cx = Math.floor(x / CELL_SIZE), cz = Math.floor(z / CELL_SIZE), k = cx * 65536 + cz; let L = CAND.get(k);
        if (!L) { const mx = (cx + 0.5) * CELL_SIZE, mz = (cz + 0.5) * CELL_SIZE, D = SUB.map(i => Math.hypot(S[i].x - mx, S[i].z - mz)), m = Math.min(...D); L = SUB.filter((_, j) => D[j] <= m + 2 * DG + 1e-6); CAND.set(k, L); }
        let b = 0, bd = 1e18; for (const i of L) { const s = S[i], d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = i; } } return { i: b, s: S[b], d: Math.sqrt(bd) }; };
      const mixSlice = (a, b, f) => { const l = (b - a + N) % N; f((a + N) % N, l); }; // ribbon from sample a to b
      const blk = (m, x0, x1, z0, z1, y0, y1) => boxMesh(h, m, x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      const buildMesh = (P3, UV, I, m) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); const o = new THREE.Mesh(g, m); o.receiveShadow = true; h.scene.add(o); return o; };
      // water strip along a line [[x, z, half-width, altitude], …]
      const bandStrip = (L, m, tu = 16) => { const P3 = [], UV = [], I = []; let v = 0;
        L.forEach(([x, z, w, y], k) => { const a = L[Math.max(0, k - 1)], b = L[Math.min(L.length - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l;
          if (k) v += Math.hypot(x - L[k - 1][0], z - L[k - 1][1]); P3.push(x - nx * w, y, z - nz * w, x + nx * w, y, z + nz * w); UV.push(-w / tu, v / tu, w / tu, v / tu); if (k) { const c = k * 2 - 2; I.push(c, c + 1, c + 2, c + 1, c + 3, c + 2); } });
        return buildMesh(P3, UV, I, m); };

      // ---------- the site ----------
      const CZ = 550, RA = 600, YC = 105, LAKE = 85, FULL = 97; // center and radius of the crest arc; levels
      const AMAX = Math.asin(262 / RA); // half-opening of the wall (it is set into the rock at x = ±262)
      const arc = (a, r) => [Math.sin(a) * r, CZ - Math.cos(a) * r]; // point de l'arc : angle a (0 = plein nord), rayon r
      const downstream = (x, z) => z - (CZ - Math.sqrt(RA * RA - Math.min(Math.abs(x), 300) ** 2)); // distance downstream from the crest axis (negative on the lake side)
      // edges of the valley floor (west bank, east bank), altitude of the terrace, slopes of the sides: tables in z
      const XW = [[80, -152], [200, -172], [288, -195], [1100, -195], [1250, -330], [1500, -760]], XE = [[30, 150], [70, 188], [230, 196], [366, 272], [480, 325], [595, 375], [700, 440], [800, 500], [1150, 500], [1280, 250], [1420, -150], [1500, -330]];
      const SW = [[80, 0.73], [290, 0.57], [480, 0.42], [600, 0.37], [900, 0.36], [1400, 0.42]]; // slope of the west side
      const SE = [[30, 0.75], [124, 0.5], [216, 0.34], [300, 0.43], [366, 0.42], [700, 0.36], [1400, 0.42]]; // slope of the foot of the east side
      const R1 = [[216, 400], [280, 26], [620, 14], [720, 400]]; // height of the steep foot under the east-side shoulder (400: no shoulder)
      const X2 = [[44, 365], [124, 402], [180, 437], [244, 482], [300, 540], [400, 612], [620, 565], [720, 525], [1150, 540], [1400, 0]]; // beyond: the east side resumes its steep slope
      const terrace = z => 14 + 2 * smooth(318, 930, z);
      const sideOf = (x, z) => 300 + 70 * Math.sin(x / 310 + 1) * Math.sin(z / 270) + 40 * Math.sin((x + z) / 130); // altitude of the nearby ridges
      const buttress = (x, z) => 90 * Math.exp(-(((x + 335) / 130) ** 2) - ((z - 150) / 170) ** 2) * (downstream(x, z) > 0 ? smooth(pl(XW, z) - 5, pl(XW, z) - 60, x) : 1); // the rocky buttress of the west abutment: the mountain the tunnel pierces (nothing on the valley floor)
      const site = (x, z) => {
        const dv = downstream(x, z), f = terrace(z); let y;
        // downstream: flat floor between the two banks, west side with a single slope, east side with its shoulder
        const xw = pl(XW, z), xe = pl(XE, z); let ya = f, u = 0;
        if (x < xw) { u = xw - x; ya = f + u * pl(SW, z); }
        else if (x > xe) { u = x - xe; const s1 = pl(SE, z), r1 = pl(R1, z), x2 = pl(X2, z), ua = r1 / s1; ya = f + Math.min(u * s1, r1) + Math.max(0, Math.min(x, x2) - (xe + ua)) * 0.18 + Math.max(0, x - x2) * 0.3; }
        // upstream: the drowned valley, floor at 25 m, widening and turning to the north-east
        const zu = Math.min(0, z), cu = 0.3 * Math.max(0, -zu - 250), uu = Math.abs(x - cu) - (105 + Math.min(-zu, 700) * 0.3), yu = 25 + Math.max(0, uu) * 0.5;
        if (dv < 0) u = Math.max(0, uu);
        y = mix(yu, ya, smooth(-30, 50, dv));
        y += Math.min(1, Math.max(0, u - 40) / 120) * 8 * Math.sin(z / 55 + Math.sin(x / 80) * 1.3); // ribs and gullies of the slopes
        y += buttress(x, z);
        const c = sideOf(x, z); if (y > 180) y = 180 + (c - 180) * (1 - Math.exp(-(y - 180) / (c - 180))); // the ridges: the slope eases toward the top
        return y;
      };
      // the river: from the dissipation basin (10 m) to the map exit (6 m); the plant's tailrace canal joins it under the bridge
      const RIVER = [[-115, 200, 35, 10], [-112, 300, 38, 9.8], [-100, 400, 42, 9.4], [-110, 520, 40, 9], [-110, 700, 40, 8.2], [-112, 900, 42, 7.4], [-130, 1100, 45, 6.6], [-300, 1290, 45, 6], [-760, 1560, 50, 5.4]];
      const LEAK = [[60, 108, 24, 10], [58, 200, 20, 10], [40, 300, 18, 9.9], [-18, 372, 18, 9.6], [-96, 414, 20, 9.4]];
      const dLine = L => (x, z) => { let b = 1e9, yb = 0; for (let k = 0; k < L.length - 1; k++) { const [ax, az, aw, ay] = L[k], [bx, bz, bw, by] = L[k + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))), d = Math.hypot(x - ax - dx * t, z - az - dz * t) - mix(aw, bw, t); if (d < b) { b = d; yb = mix(ay, by, t); } } return [b, yb]; };
      const dRiver = dLine(RIVER), dLeak = dLine(LEAK), waterDownstream = (x, z) => { const a = dRiver(x, z), b = dLeak(x, z); return a[0] < b[0] ? a : b; }; // [distance to the bank (negative in the water), water altitude]
      const LOW = [-150, -80, 30, 200]; // the dissipation basin: x0, x1, z0, z1
      const dBasin = (x, z) => Math.max(LOW[0] - x, x - LOW[1], LOW[2] - z, z - LOW[3]);
      const riverDist = (x, z) => Math.min(waterDownstream(x, z)[0], dBasin(x, z));
      // what the road does not model: the bridge (over the water), the crest (over the wall), the tunnel (through the spur)
      const bridgeI = new Set(), wallI = new Set();
      for (let i = P(K.bridge0 - 1); i !== P(K.bridge1); i = (i + 1) % N) if (S[i].x > -152 && S[i].x < -72) bridgeI.add(i);
      for (let i = P(K.crest); i !== P(K.abutment); i = (i + 1) % N) if (Math.abs(S[i].x) < 256 && downstream(S[i].x, S[i].z) < 30) wallI.add(i);
      const tunI = i => i >= T0 + 5 && i <= T1 - 5;
      const QA = P(95) - 4, QB = P(97) + 4, sqr = (p, x, z, m) => p.i > QA && p.i < QB && (z - p.s.z) * p.s.tx - (x - p.s.x) * p.s.tz < -(p.s.w + 6) && p.d < p.s.w + m; // the quarry of the descent, mountain side (left), between points 95 and 97
      const hollow = (x, z, y) => {
        const p = nearest(x, z), s = p.s, w = s.w, d = p.d, hs = site(x, z), dv = downstream(x, z), flatPart = dv > 40 && x > pl(XW, z) - 25 && x < pl(XE, z) + 25; let b;
        if (tunI(p.i)) b = d < w + 16 ? s.y - 0.8 : Math.min(Math.max(hs, mix(s.y + 13, -99, smooth(w + 50, w + 130, d))), s.y + 13 + Math.min(p.i - T0, T1 - p.i) * 2 + (d - w - 16) * 1.1); // the mountain starts at the top of the bunker head and rises at 45°: no sheer cliff above the portal // under the tunnel the ground stays under the roadway (the rock slab covers it); around it, the spur rises above the vault
        else if (bridgeI.has(p.i) || wallI.has(p.i)) b = d < w + 6 ? Math.min(hs, s.y - 0.9) : hs;
        else { const kc = Math.min(1, buttress(x, z) / 30), isFar = mix(flatPart || dv < -20 ? hs : y, hs, smooth(mix(70, 20, kc), mix(170, 55, kc), d)); const vk = x > 100 && x < 492 && z > 690 && z < 1150 ? 18 : 0; b = mix(s.y - 0.6, isFar, smooth(w + 5 + vk, w + 30 + vk * 1.6, d)); if (d < w + 30 + vk) b = Math.min(b, s.y - 0.6 + Math.max(0, d - w - 5 - vk) * 0.8); } // near the road: its level, then an embankment joining the site; never ground higher than the roadway at its edge
        { const k = Math.min(smooth(T0 - 34, T0 - 2, p.i), 1 - smooth(T1 - 2, T1 + 10, p.i)); if (k > 0 && d > w + 5 && !wallI.has(p.i)) b = Math.max(b, s.y - 0.6 + Math.min(Math.max(14 * (1 - smooth(w + 50, w + 130, d)), hs - s.y) * k, (d - w - 5) * 1.1)); } // the spur of the west abutment: the rock rises on either side of the road before the portal (a notch), and stays above the vault until the exit
        if (sqr(p, x, z, 66)) b = Math.min(b, s.y - 0.5); // the quarry floor: flat, at road level
        if (x > -24 && x < 144 && z > 16 && z < 110) b = Math.min(b, 12); // under the turbine hall: never ground above the hall floor (14)
        // the downstream water digs in: bed under the water, bank at 1 in 2
        const free = d > w + 6 || bridgeI.has(p.i) || wallI.has(p.i);
        if (free && dv > 60) { const [rv, wy] = waterDownstream(x, z), db = dBasin(x, z), r = Math.min(rv, db), yw = db < rv ? 10 : wy; if (r < 14) b = Math.min(b, yw - 2.5 + Math.max(0, r + 4) * 0.5); }
        return y - b;
      };
      const g = terrain(h, { stepSec: 12, margin: 720, ground: s => { const i = IX.get(s); return bridgeI.has(i) || wallI.has(i) ? site(s.x, s.z) : s.y; }, hollow, mat: mat('groundGES'), layerSet: [
        { tex: ['rockGES'], slope: [0.1, 0.17], rep: 0.8, noise: 0.04 }, // rock outcrops on slopes steeper than 30°
        { tex: ['noise', '#b4ab96', ['#c4bba6', '#a09884']], weight: (x, z, y) => Math.max(downstream(x, z) < 0 ? 1 - smooth(FULL - 1.5, FULL + 1, y) : 0, downstream(x, z) > 60 ? 1 - smooth(3, 12, riverDist(x, z)) : 0) }, // the bare shore of the low reservoir (under 97 m), the bank pebbles
        { tex: ['noise', '#6e6a58', ['#7c7864', '#5e5a4a']], edgePt: [5, 13] }] }); // l'accotement de gravier
      const hAt = g.hAt, dAt = g.dAt;

      // ---------- water: the reservoir (85 m), the basin and the river ----------
      const water = mat('waterGES', { c: 0xb8cccc }, '#4f7f8c', 40), waterRiver = mat('waterGES', { c: 0xa8bcbc }, '#4f7f8c', 40), foam = mat('foamGES');
      { const P3 = [], UV = [], I = [], n = 24, a0 = AMAX + 0.28; // the reservoir: a sector starting from the upstream face; the slopes cut it up
        for (let k = 0; k <= n; k++) { const a = -a0 + 2 * a0 * k / n, A = arc(a, RA + 10.5), B = arc(a, RA + 1900); P3.push(A[0], LAKE, A[1], B[0], LAKE, B[1]); UV.push(A[0] / 16, A[1] / 16, B[0] / 16, B[1] / 16); if (k) { const c = k * 2 - 2; I.push(c, c + 2, c + 1, c + 1, c + 2, c + 3); } }
        buildMesh(P3, UV, I, water).material.side = THREE.DoubleSide; }
      bandStrip(RIVER, waterRiver, 12); bandStrip(LEAK, waterRiver, 12); flows(waterRiver, 0.45); flows(water, 0.012, 0.008); flows(foam, 0.05, 0.02); // V-52, V-85: the river and the canal run downstream, the reservoir laps, the basin foam drifts
      blk(foam, LOW[0], LOW[1], LOW[2], LOW[3], 8, 10.1);

      // ---------- the wall: gravity-arch, downstream face sloped (0.72 m per metre), upstream face vertical; 18 m blocks in relief, windows of the inspection galleries ----------
      const conc = mat('concreteGES'), concS = mat('concreteGES', {}, '#6d726d'), concC = mat('concreteGES', {}, '#b8b4a4'), face = mat('faceGES'), blackM = mat('paint', { c: 0x1c1e20 }), orange = mat('tinOrange'), gray = mat('matGray');
      // arc prism: profile [[offset downstream, altitude], …] rotated around the center of the arc, from angle a0 to a1
      const arcPrism = (profData, a0, a1, m, tu = 18, tv = 24, n = 44) => { const P3 = [], UV = [], I = []; let v = 0;
        for (let k = 0; k < profData.length - 1; k++) { const [oa, ya] = profData[k], [ob, yb] = profData[k + 1], l = Math.hypot(ob - oa, yb - ya), b0 = P3.length / 3;
          for (let j = 0; j <= n; j++) { const an = a0 + (a1 - a0) * j / n, A = arc(an, RA - oa), B = arc(an, RA - ob), su = an * RA / tu; P3.push(A[0], ya, A[1], B[0], yb, B[1]); UV.push(su, v / tv, su, (v + l) / tv); if (j) { const c = b0 + j * 2 - 2; I.push(c, c + 1, c + 2, c + 1, c + 3, c + 2); } }
          v += l; }
        const o = buildMesh(P3, UV, I, m); o.material.side = THREE.DoubleSide; o.castShadow = true; return o; };
      const YF = YC - 1.4, oF = y => 11 + (YF - y) * 0.72, AM = AMAX + 0.05; // oF: downstream offset of the downstream face at altitude y
      const pF = (x, y, e = 0) => { const r = RA - oF(y) - e; return [x, y, CZ - Math.sqrt(r * r - x * x)]; }; // point on the downstream face at abscissa x and altitude y, offset by e metres
      arcPrism([[oF(0), 0], [11, YF]], -AM, AM, face); arcPrism([[11, YF], [-11, YF], [-11, 20]], -AM, AM, conc, 8, 8);
      arcPrism([[-11.06, FULL], [-11.06, LAKE - 2]], -AM, AM, concS, 8, 8); // lake side: the dark band left by the water between the full reservoir and the day level
      { const P3 = [], UV = [], I = [], quad = (A, B, C, D) => { const b = P3.length / 3; P3.push(...A, ...B, ...C, ...D); UV.push(0, 0, 1, 0, 0, 8, 1, 8); I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); };
        for (let x = -243; x <= 243; x += 18) { const a = [pF(x - 1, 2, 1.2), pF(x + 1, 2, 1.2), pF(x - 1, YF, 1.2), pF(x + 1, YF, 1.2)], f = [pF(x - 1, 2), pF(x + 1, 2), pF(x - 1, YF), pF(x + 1, YF)];
          quad(a[0], a[1], a[2], a[3]); quad(f[0], a[0], f[2], a[2]); quad(a[1], f[1], a[3], f[3]); } // a protruding block joint: one face and two cheeks
        buildMesh(P3, UV, I, mat('concreteGES', DS, '#7d817a')).castShadow = true;
        const Q3 = [], QV = [], QI = []; for (let x = -234; x < 240; x += 18) for (const y of [34, 58, 82]) if (rnd() < 0.4) { const x0 = x + 4 + rnd() * 6, b = Q3.length / 3; Q3.push(...pF(x0, y, 0.2), ...pF(x0 + 2, y, 0.2), ...pF(x0, y + 2.4, 0.2), ...pF(x0 + 2, y + 2.4, 0.2)); QV.push(0, 0, 1, 0, 0, 1, 1, 1); QI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
        buildMesh(Q3, QV, QI, mat('paint', { c: 0x1e2022, side: THREE.DoubleSide })); }

      // ---------- the bottom outlets and the basin: four sluices in the west half, 12 m above the water; each jet is an arc-shaped volume that falls back into the basin ----------
      { const XS = [-136, -115, -94], whiteN = mat('foamGES', { c: 0xffffff, emissive: 0x9aa8ac }), haze = mat('hazeGES', { emis: 1, transparent: true, depthWrite: false, side: THREE.DoubleSide }), P3 = [], UV = [], I = [], haz = [];
        for (const x of XS) { const [, , z0] = pF(x, 22); blk(blackM, x - 3.4, x + 3.4, z0 - 5, z0 + 0.8, 19, 25); blk(orange, x - 3.8, x + 3.8, z0 - 3.4, z0 - 2.6 + 3.2, 25.4, 28.6); blk(concS, x - 4.6, x + 4.6, z0 - 2, z0 + 3, 16.5, 18.8); // the outlet, its gate raised, its lip
          const n = 12, m = 8, b0 = P3.length / 3; // the jet: a tube with an elliptical section, leaving horizontally and falling 12 m in 52 m
          for (let k = 0; k <= n; k++) { const t = k / n, zc = z0 + 1 + t * 52, yc = 22 - 12.5 * t * t, a = Math.atan2(-25 * t, 52), rx = 2.6 + 3.6 * t, ry = 2.2 + 3 * t;
            for (let j = 0; j <= m; j++) { const u = j / m * Math.PI * 2, cy = Math.cos(u) * ry, cx = Math.sin(u) * rx; P3.push(x + cx, yc + cy * Math.cos(a), zc - cy * Math.sin(a)); UV.push(j / m * 2, t * 5); if (k < n && j < m) { const c = b0 + k * (m + 1) + j; I.push(c, c + 1, c + m + 1, c + 1, c + m + 2, c + m + 1); } } }
          haz.push([x, 15, z0 + 60, rnd() * 3, 30, 15, 30], [x + 10, 13.5, z0 + 78, rnd() * 3, 26, 11, 26]); puffFn(x, 13, z0 + 56, [0.93, 0.96, 0.97], 0.2, 6, 4, 6, 4, 4); }
        buildMesh(P3, UV, I, whiteN); flows(whiteN, 1.5); // V-50, V-51: the foam of the jets streams in the direction of the fall; a spray plume rises from each landing point
        haz.push([-115, 13, 170, 0, 60, 9, 40]);
 inst(h, h.geo('haze'), haze, haz).renderOrder = 3; }
      blk(conc, LOW[0] - 4, LOW[0], 36, LOW[3] + 4, 2, 15); blk(conc, LOW[1], LOW[1] + 4, 24, LOW[3] + 4, 2, 15); blk(concS, LOW[0], LOW[1], LOW[3], LOW[3] + 4, 2, 10.6); // the basin side walls and the outlet sill

      // ---------- the turbine hall, at the foot of the east half of the wall: the road crosses it from east to west (hall of 160 × 64 m) weaving between three staggered units, two units at standstill, control desks on the window side, two overhead cranes ----------
      const HX0 = -20, HX1 = 140, HZ0 = 42, HZ1 = 106, YH = 14, HT = 26, insideHangar = i => { const s = S[(i + N) % N]; return s.x > HX0 - 2 && s.x < HX1 + 2 && s.z > HZ0 && s.z < HZ1; };
      let iH0 = -1, iH1 = -1; for (let i = P(K.hangar0 - 2); i !== P(K.hangar1 + 3); i = (i + 1) % N) if (insideHangar(i)) { if (iH0 < 0) iH0 = i; iH1 = i; }
      { const glassMat = mat('baysHangar', { c: 0xd8dcd8 }), vert = mat('vatGroup'), greenS = mat('paint', { c: 0x4a8478 }), redTone = mat('paint', { c: 0xb5483c });
        blk(conc, HX0, HX1, 20, HZ0 + 1.2, YH - 12, YH + HT); // the back wall, against the foot of the dam
        blk(conc, HX0, HX1, HZ1 - 1, HZ1, YH - 12, YH + 4); blk(glassMat, HX0 + 1, HX1 - 1, HZ1 - 0.8, HZ1 - 0.2, YH + 4, YH + HT - 3); blk(conc, HX0, HX1, HZ1 - 1, HZ1, YH + HT - 3, YH + HT); // the south facade: sill wall, large windows, fascia
        blk(concS, HX0 - 1, HX1 + 1, 20, HZ1 + 1.5, YH + HT, YH + HT + 1.2); // the roof
        for (const x of [15, 60, 105]) blk(mat('paneDark'), x - 9, x + 9, HZ0 + 12, HZ1 - 12, YH + HT + 1.2, YH + HT + 2.2); // lanterneaux

        // the gable ends, pierced for the road: the door follows the roadway that crosses them
        for (const xw of [HX0, HX1]) { let bi = iH0, bd = 1e9; for (let i = iH0 - 12; i <= iH1 + 12; i++) { const d = Math.abs(S[i].x - xw); if (d < bd) { bd = d; bi = i; } } const s = S[bi], o = (s.w + 2.2) / Math.max(0.5, Math.abs(s.tx));
          blk(conc, xw - 1.3, xw + 1.3, 20, s.z - o, YH - 12, YH + HT); blk(conc, xw - 1.3, xw + 1.3, s.z + o, HZ1, YH - 12, YH + HT); blk(conc, xw - 1.3, xw + 1.3, s.z - o, s.z + o, YH + 10, YH + HT);
          blk(mat('stripeOrange'), xw - 1.45, xw + 1.45, s.z - o, s.z + o, YH + 10, YH + 11); } // the striped lintel of the doors
        blk(mat('groundHangar'), HX0, HX1, HZ0, HZ1, YH - 2, YH - 0.2); // a solid slab underneath: no gap between the slabs that follow the road
        // the floor: two slabs on either side of the roadway, following it (nothing is placed on the road)
        mixSlice(iH0 - 2, iH1 + 2, (i, l) => { ribbonFn(i, l, s => -(s.w + 0.1), 0.03, s => -Math.max(s.w + 0.2, s.z - HZ0 - 1), 0.03, mat('groundHangar'), 6); ribbonFn(i, l, s => s.w + 0.1, 0.03, s => Math.max(s.w + 0.2, HZ1 - 1 - s.z), 0.03, mat('groundHangar'), 6); });
        { const gc = mat('guardrail', DS, ['#e8761e', '#1e1e1c', '#e8761e', '#c86a1a']); for (const sd of [-1, 1]) mixSlice(iH0 - 2, iH1 + 2, (i, l) => h.guardM(sd, i, l, s => sd * (s.w + 0.4), 1, s => sd * (s.w + 0.4), 0, gc, 4)); } // the walkway, lined with orange railings
        // the three units on the wall side: sea-green vat, striped collar, hood, red exciter, plate
        const G3 = [[105, YH, 65], [60, YH, 84], [15, YH, 65]]; // the road passes south of the first, north of the second, south of the third, 4 m from the vats
        inst(h, h.geo('alternator'), vert, G3); inst(h, h.geo('hood'), greenS, G3.map(([x, y, z]) => [x, y + 5, z]));
        { const rotating = G3.map(([x, y, z]) => { const g = new THREE.Group(); g.position.set(x, y, z); g.userData.dyn = 1; h.scene.add(g); h.pose('necklace', mat('stripeOrange'), g, [0, 0, 0]); h.pose('exciter', redTone, g, [0, 6.8, 0]); // V-15: the striped collar and the exciter rotate (outside the merge); the two units at standstill do not move
            for (const a of [0, 2.1, 4.2]) h.pose('boxMesh', mat('paint', { c: 0xe8e4d8 }), g, [Math.cos(a) * 1.62, 8, Math.sin(a) * 1.62], 0.5, 1.6, 0.5).rotation.y = -a; weld(h, g); return g; }); // three light plates on the exciter: without them its rotation would not show
          TICK.push(dt => { for (const g of rotating) g.rotation.y += dt * 2.6; }); }
        inst(h, h.geo('boxMesh', 4, 1.4, 0.1), mat('letters', {}, 'ГА', '#5fa89a', '#e8e4d8'), G3.flatMap(([x, y, z]) => [[x + 5.05, y + 3, z, Math.PI / 2], [x - 5.05, y + 3, z, Math.PI / 2]]));
        inst(h, h.geo('lid'), mat('paint', { c: 0x8a9a6a }), [[82, YH + 0.06, 52], [38, YH + 0.06, 52], [128, YH + 0.06, 52], [-8, YH + 0.06, 52]]); // two units at standstill: lids flush with the ground
        { const arm = []; for (let x = HX0 + 8; x < HX1 - 6; x += 8) arm.push([x, YH + 1.2, HZ1 - 3, 0, 2.6, 2.4, 1.2]); inst(h, h.geo('blk'), mat('paint', { c: 0x9aa89a }), arm); } // the desks and cabinets, on the window side
        { const col = []; for (let x = HX0 + 2; x <= HX1 - 2; x += 15.4) for (const z of [HZ0 + 2.2, HZ1 - 2]) col.push([x, YH + HT / 2, z, 0, 1.6, HT, 1.4]); inst(h, h.geo('blk'), concS, col); }
        for (const z of [HZ0 + 3, HZ1 - 3]) blk(orange, HX0 + 1, HX1 - 1, z - 0.6, z + 0.6, YH + 19.5, YH + 20.5); // the overhead crane rails
        insts(h, 'overheadCrane', { steelMat: orange, trolley: orange, cabin: mat('paint', { c: 0xe8e4d8 }), cable: gray, hook: gray }, [[38, YH + 21.5, (HZ0 + HZ1) / 2, Math.PI / 2], [128, YH + 21.5, (HZ0 + HZ1) / 2, Math.PI / 2]], { a: [HZ1 - HZ0 - 6] });
        { const l = []; for (let x = HX0 + 12; x < HX1; x += 22) { for (const z of [HZ0 + 14, HZ1 - 14]) l.push([x, YH + HT - 0.4, z, 0, 6, 0.3, 1]); const i = near(h, x, 74); h.emis(i, x, YH + 21, 74, 0xfff0d8, 50, 0.8); } inst(h, h.geo('blk'), mat('lampObj', GLOWI), l); }
        { const m = new THREE.Mesh(h.geo('boxMesh', 44, 6, 0.4), mat('letters', {}, 'ГЭС-74', '#8d918a', '#b5483c')); m.position.set((HX0 + HX1) / 2, YH + HT + 5.4, HZ1 - 1); h.scene.add(m); for (const x of [-18, 0, 18]) blk(gray, (HX0 + HX1) / 2 + x - 0.3, (HX0 + HX1) / 2 + x + 0.3, HZ1 - 2.6, HZ1 - 1.4, YH + HT + 1, YH + HT + 3); } // the letters on the roof
        const tm = mat('paint', { c: 0x4a5a5a }); for (const x of [15, 60, 105]) { const y0 = 84, y1 = YH + HT - 2, A = pF(x, y0, -3.4), B = pF(x, y1, -3.4), l = Math.hypot(A[1] - B[1], A[2] - B[2]), m = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, l, 10), tm);
          m.position.set(x, (y0 + y1) / 2, (A[2] + B[2]) / 2); m.rotation.x = -Math.atan2(B[2] - A[2], A[1] - B[1]); m.castShadow = true; h.scene.add(m); for (let y = y1 + 8; y < y0; y += 12) { const q = pF(x, y); blk(concS, x - 4, x + 4, q[2] - 0.5, q[2] + 3.6, y - 1, y); } } } // the penstocks, in line with the units

      // ---------- lake side: the intake tower hung on the upstream face, its walkway; the floating boom of buoys, far from the wall ----------
      { const [tx, tz] = arc(Math.asin(70 / RA), RA + 21), glassT = mat('baysHangar', { c: 0xb4bcc0 }); blk(conc, tx - 8, tx + 8, tz - 8, tz + 8, 30, 116); blk(glassT, tx - 8.3, tx + 8.3, tz - 8.3, tz + 8.3, 107, 114); blk(concS, tx - 9, tx + 9, tz - 9, tz + 9, 116, 117.4); blk(concS, tx - 2, tx + 2, tz + 8, tz + 14, 103.4, 104.6);
        const b = []; for (let a = -0.36; a < 0.36; a += 0.014) { const [x, z] = arc(a, RA + 120 + Math.sin(a * 22) * 6); b.push([x, LAKE + 0.2, z, 0, 1.4, 0.8, 1.4]); } inst(h, h.geo('blk'), orange, b); }

      // ---------- the road: continuous guardrail away from structures (like touge) and its reflectors; concrete parapet on the bridge and on the lake side of the crest; openwork railing on the drop side; pavements in the housing estate ----------
      const parapetM = mat('parapet', DS), guardM = mat('guardrail', DS, h.TH.intoWall);
      const parapet = (a, b, sd) => mixSlice(a, b, (i, l) => { const o = s => sd * (s.w + 0.3), o2 = s => sd * (s.w + 0.9); ribbonFn(i, l, o, 1.15, o, -2, parapetM, 3); ribbonFn(i, l, o2, 1.15, o2, -2, parapetM, 3); ribbonFn(i, l, o, 1.15, o2, 1.15, parapetM, 3); });
      const guardrail = (a, b, sd) => mixSlice(a, b, (i, l) => h.guardM(sd, i, l, s => sd * (s.w + 0.4), 1.05, s => sd * (s.w + 0.4), 0.25, guardM, 4)); // h.guardM: the game's guardrail, which wears down on impacts (neither grouped nor fixed)
      const iP0 = Math.min(...bridgeI) - 12, iP1 = Math.max(...bridgeI) + 12, iM0 = T1 - 2, iM1 = Math.max(...wallI) + 10, iV0 = P(K.entryVille) - 6, iV1 = P(K.exitVille) + 6; // bridge, wall, estate (from iV0 to iV1 along the line)
      const inVille = i => ((i - iV0 + N) % N) <= ((iV1 - iV0 + N) % N), overBridge = i => i >= iP0 && i <= iP1, overWall = i => i >= iM0 && i <= iM1, inTunnel = i => i >= T0 - 2 && i <= T1 + 2;
      for (const sd of [-1, 1]) { parapet(iP0, iP1, sd); guardrail(iP1, T0 + 2, sd); guardrail(iM1, iV0, sd); guardrail(iV1, iH0 - 3, sd); guardrail(iH1 + 3, iP0, sd); }
      parapet(iM0, iM1, -1); // the crest on the lake side
      { const gc = mat('railing', { alphaTest: 0.5, side: THREE.DoubleSide }); mixSlice(iM0, iM1, (i, l) => { const o = s => s.w + 0.3, o2 = s => s.w + 0.9; ribbonFn(i, l, o, 0.4, o, -2, parapetM, 3); ribbonFn(i, l, o2, 0.4, o2, -2, parapetM, 3); ribbonFn(i, l, o, 0.4, o2, 0.4, parapetM, 3); ribbonFn(i, l, s => s.w + 0.6, 1.25, s => s.w + 0.6, 0.4, gc, 2); }); } // drop side: a kerb and a barred railing, the valley is visible
      mixSlice(iV0, iV1, (i, l) => { for (const sd of [-1, 1]) { ribbonFn(i, l, s => sd * (s.w + 0.2), 0.2, s => sd * (s.w + 3.6), 0.2, concC, 4); ribbonFn(i, l, s => sd * (s.w + 0.2), 0.2, s => sd * (s.w + 0.2), -0.5, concC, 4); } }); // pavements of the estate
      { const ca = []; for (let i = 0; i < N; i += 6) { if (inVille(i) || overBridge(i) || inTunnel(i) || (i > iH0 - 4 && i < iH1 + 4)) continue; const cr = overWall(i); for (const sd of [-1, 1]) { const [x, z] = edgePt(S[i], sd, S[i].w + (cr ? 0.28 : 0.3)); ca.push([x, S[i].y + (cr ? (sd < 0 ? 0.9 : 0.3) : 1.05), z]); } } // V-05: on the crest too, along the parapets: they reflect the headlights in the fog
        inst(h, h.geo('reflector'), h.mat('reflector', { emis: 1, retroRefl: 2.5 }), ca); }

      // ---------- the bridge at the foot of the wall: deck and concrete piers, lampposts ----------
      mixSlice(iP0 + 6, iP1 - 6, (i, l) => { ribbonFn(i, l, s => -(s.w + 1.2), -0.15, s => s.w + 1.2, -0.15, concS, 8); ribbonFn(i, l, s => -(s.w + 1.2), -2.4, s => s.w + 1.2, -2.4, concS, 8); for (const sd of [-1, 1]) ribbonFn(i, l, s => sd * (s.w + 1.2), -0.15, s => sd * (s.w + 1.2), -2.4, concS, 8); });
      for (let i = iP0 + 18; i < iP1 - 12; i += 22) { const s = S[i], m = h.pose('boxMesh', concS, h.scene, [s.x, (s.y - 2.4 + 2) / 2, s.z], 2 * W + 1, s.y - 2.4 - 2, 2.6); m.rotation.y = h.across(s); }
      for (const i of [iP0 + 14, iP0 + 22, iP0 + 30, iP0 + 38]) { const s = S[i], [x, z] = edgePt(s, 1, s.w + 4); puffFn(x, s.y + 1.4, z, [0.93, 0.96, 0.97], 0.14, 3, 1.6, 3, 0.8, 2.5, 6.5); } // V-53: spray clouds cross the bridge, from upstream to downstream
      const lamps = [], clair = []; // lampposts, placed after the estate (none in a wall); forest clearings [x, z, radius]
      // sodium lampposts: the bridge, the crest, the estate street and its surroundings
      { const lp = lamps; const put1 = (i, sd, o = 1.6) => { const s = S[(i + N) % N], [x, z] = edgePt(s, sd, s.w + o); lp.push([x, s.y, z, h.across(s) + (sd > 0 ? Math.PI : 0)]); };
        for (let i = iP0 + 4, k = 0; i < iP1; i += 14, k++) put1(i, k & 1 ? 1 : -1, 1.2);
        for (let i = iM0 + 6, k = 0; i < iM1 + 30; i += 14, k++) put1(i, k & 1 ? 1 : -1, 1.2);
        for (let i = iV0 - 60, k = 0; ((i - iV0 + 60 + N) % N) < ((iV1 + 80 - iV0 + 60 + N) % N); i = (i + 14) % N, k++) put1(i, k & 1 ? 1 : -1, 3.9);
        }

      // ---------- the tunnel of the west abutment: the rock slab under the spur (its two bunker heads are lower) ----------
      const bedrock = mat('rockGES', { ...DS, rep: [2, 1] });
      { const P3 = [], UV = [], I = [], LAT = []; for (let o = -44; o <= 44; o += 4) LAT.push(o); let rg = 0; // the rock above the tunnel: a fine mesh (4 m) starting from the top of each bunker head, rising at 45° and joining the relief; its edges fall onto the ground
        for (let i = T0; i <= T1; i += 2, rg++) { const s = S[i], ax = Math.min(i - T0, T1 - i) * 2; LAT.forEach((o, k) => { const [x, z] = edgePt(s, 1, o), d = Math.abs(o), edgeM = k === 0 || k === LAT.length - 1 || i === T0 || i >= T1 - 1;
            const y = Math.min(Math.max(site(x, z), s.y + 13), s.y + 13 + ax + Math.max(0, d - s.w - 16) * 1.1) + (edgeM ? 0 : 1.6 * Math.sin(x * 0.9 + z * 0.37) * Math.sin(z * 0.7 - x * 0.21)); P3.push(x, y, z); UV.push((x + y) / 10, (z + y) / 10);
            if (rg && k) { const c = rg * LAT.length + k; I.push(c - LAT.length - 1, c - 1, c - LAT.length, c - LAT.length, c - 1, c); } }); }
        const m = buildMesh(P3, UV, I, mat('rockGES', DS)); m.castShadow = true; }


      // ---------- the crest: two gantry cranes over the road, the control tower on the viewpoint of the east abutment ----------
      insts(h, 'gantryGate', { steelMat: mat('tinOrange', {}, '#e8a01e'), wheelPart: gray, winch: mat('paint', { c: 0x6d726d }), cabin: mat('paint', { c: 0xe8e4d8 }), pane: mat('paneDark') }, [-65, 120].map(x => { const s = S[near(h, x, CZ - Math.sqrt(RA * RA - x * x))]; return [s.x, s.y, s.z, h.across(s)]; }), { a: [W] });
      { const s = S[P(K.abutment) + 6], [x, z] = edgePt(s, -1, s.w + 14); h.pose('controlTower', { concretePart: conc, pane: mat('paneDark'), steelMat: gray }, h.scene, [x, hAt(x, z) - 1.5, z]); }

      // ---------- the substation, on the terrace between the plant and the estate: transformers, gantries, circuit breakers, fence, control building ----------
      const YP = terrace(510) + 0.05, insul = mat('paint', { c: 0xd8e0c8 }), latticeM = mat('latticeGantry', { alphaTest: 0.5, side: THREE.DoubleSide }, '#a8aea6'), railBars = [];
      blk(mat('noise', {}, '#8a8a82', ['#9a9a90', '#76766e', '#a8a49a']), 196, 302, 420, 612, YP - 3, YP);
      insts(h, 'transformer', { plinth: concS, vat: mat('paint', { c: 0x7a8a80 }), vane: mat('paint', { c: 0x4a5a50 }), insul, plate: mat('danger') }, [214, 249, 284].map(x => [x, YP, 434, 0, 1.3]));
      { const gantry = [], brkr = [];
        for (const z of [470, 520, 570]) for (const x of [214, 249, 284]) { gantry.push([x, YP, z, 0]); for (const dx of [-7, 0, 7]) if (x < 280) railBars.push(x + dx, YP + 17.8, z, x + dx + 35, YP + 17.8, z); }
        for (const z of [495, 545]) for (const x of [214, 249, 284]) { brkr.push([x, YP, z, Math.PI / 2]); for (const dx of [-7, 0, 7]) railBars.push(x + dx, YP + 17.8, z - 25, x + dx, YP + 6.6, z); }
        insts(h, 'gantryBooth', { lattice: latticeM, insul }, gantry); insts(h, 'circuitBreaker', { chassis: gray, insul }, brkr);
        const c = [], add = (x0, z0, x1, z1) => { const l = Math.hypot(x1 - x0, z1 - z0); c.push([(x0 + x1) / 2, YP + 1.3, (z0 + z1) / 2, -Math.atan2(z1 - z0, x1 - x0), l, 2.6, 0.1]); };
        add(197, 421, 197, 611); add(197, 611, 301, 611); add(301, 611, 301, 421); add(197, 421, 301, 421); inst(h, h.geo('blk'), mat('concretePO2', DS), c);
        blk(mat('signK', {}, '#b8b4a4'), 272, 298, 588, 606, YP, YP + 8); blk(concS, 271, 299, 587, 607, YP + 8, YP + 8.6);
        for (const [x, z] of [[201, 426], [297, 426], [201, 606]]) { blk(gray, x - 0.2, x + 0.2, z - 0.2, z + 0.2, YP, YP + 18); blk(mat('lampObj', GLOWI), x - 0.9, x + 0.9, z - 0.3, z + 0.3, YP + 18, YP + 18.8); } } // three floodlight masts, lit
      // ---------- the workers' housing estate, crossed by the road: grey five-storey slabs lined up along the streets (one row on each side, set on a paved ground), a second row behind, nine-storey towers,
      //            ground-floor signboards, courtyards with their play areas, kiosks, cars along the pavements, the heating pipes on gantries ----------
      const YV = 16, paintedBlocks = [], bl = (x, y, z, r, a, b, c, col) => paintedBlocks.push([x, y, z, r, a, b, c, col]); // small painted volumes, placed together at the end (a single drawing pass)
      const cite = (x, z) => x > 100 && x < 492 && z > 690 && z < 1150, booth = (x, z) => x > 188 && x < 310 && z > 412 && z < 620, powerPlant = (x, z) => x > -165 && x < 205 && z > 0 && z < 250;
      // the footprint of each building: [x, z, rotation, half-length, half-depth]; nothing is placed on a taken footprint, nor too close to the roadway
      // GB: each footprint stored in the 32 m cells it touches, insideShell margin included (m ≤ 7: a footprint covers at most hl + hp + 14 m around its center); insideShell only reads the cell of the point
      const GB = new Map(), shell = (...L) => { for (const e of L) { shells.push(e); const [x, z, , hl, hp] = e, R = hl + hp + 14; for (let a = Math.floor((x - R) / 32); a <= Math.floor((x + R) / 32); a++) for (let c = Math.floor((z - R) / 32); c <= Math.floor((z + R) / 32); c++) { const k = a * 65536 + c; (GB.get(k) || GB.set(k, []).get(k)).push(e); } } };
      const shells = [], insideShell = (px, pz, m = 4) => (GB.get(Math.floor(px / 32) * 65536 + Math.floor(pz / 32)) || []).some(([x, z, r, hl, hp]) => { const dx = px - x, dz = pz - z, c = Math.cos(r), s = Math.sin(r), u = dx * c - dz * s, v = dx * s + dz * c; return Math.abs(u) < hl + m && Math.abs(v) < hp + m; });
      const place = (x, z, r, hl, hp, margin = 5.5) => { const c = Math.cos(r), s = Math.sin(r); for (const u of [-1, -0.5, 0, 0.5, 1]) for (const v of [-1, 0, 1]) { const px = x + c * u * hl + s * v * hp, pz = z - s * u * hl + c * v * hp, p = nearest(px, pz);
        if (p.d < p.s.w + margin || insideShell(px, pz) || riverDist(px, pz) < 10 || px < pl(XW, pz) + 8 || px > pl(XE, pz) - 8) return false; } shell([x, z, r, hl, hp]); return true; };
      // what is fixed comes first: the boiler house and its chimney, the water tower, the garages, the allotment gardens
      let fountain, kiosk, flowerbed, plane, school, garden, boxes; const groves = []; // the estate objects, reused to fill the gaps; birches of the groves (placed with the forest)
      { shell([392, 1052, 0, 14, 12], [118, 1066, 0, 6, 6], [240, 1128, 0, 32, 5]);
        blk(mat('brick'), 380, 404, 1042, 1062, YV - 2, YV + 9); blk(concS, 379, 405, 1041, 1063, YV + 9, YV + 9.6); blk(mat('brick'), 406, 410, 1050, 1054, YV - 2, YV + 40); blk(concS, 405.6, 410.4, 1049.6, 1054.4, YV + 40, YV + 41); puffFn(408, YV + 42, 1052, [0.6, 0.6, 0.63], 0.34, 10, 5, 5, 3.4, 0.7); // V-32: the boiler house smoke
        h.pose('waterTower', { iron: gray, vat: mat('paint', { c: 0x7a8a86 }) }, h.scene, [118, YV, 1066]);
        { const bayIdx = []; for (let k = 0; k < 14; k++) bayIdx.push([212 + k * 4.2, YV + 1.3, 1128, 0, 4, 2.8, 6]); inst(h, h.geo('blk'), mat('tinOrange', {}, '#6e7a7a'), bayIdx); }
        }
      // the street ground: a forecourt of slabs on each side of the roadway, from the pavement to the foot of the buildings
      { const slab = mat('noise', DS, '#7a7c7c', ['#868888', '#6c6e6e', '#8e8c86']); mixSlice(iV0, iV1, (i, l) => { for (const sd of [-1, 1]) ribbonFn(i, l, s => sd * (s.w + 3.6), 0.06, s => sd * (s.w + 20), 0.06, slab, 6); }); }
      const tier1 = [], tier2 = [], lapCount = [];
      { // a spot = a footprint taken at the edge of the street, near sample i0 (preferred side sd0), drawn in its frame: u along the street, v toward the roadway
        const spot = (i0, sd0, hl, hp, f, off = 6.4, DI = [0, 8, -8, 16, -16, 24, -24, 32, -32]) => { for (const di of DI) for (const sd of [sd0, -sd0]) { const s = S[(i0 + di + N) % N], [x, z] = edgePt(s, sd, s.w + off + hp), r = h.across(s) + Math.PI / 2 + (sd > 0 ? Math.PI : 0); if (!place(x, z, r, hl, hp)) continue;
          const c = Math.cos(r), sn = Math.sin(r), Y = Math.max(s.y, hAt(x, z)) + 0.05, B = (u, y, v, a, b, d, col, dr = 0) => bl(x + c * u + sn * v, Y + y, z - sn * u + c * v, r + dr, a, b, d, col);
          const motorFam = (t, backdrop, u, y, v, w, ht) => { const m = new THREE.Mesh(h.geo('boxMesh', w, ht, 0.2), mat('letters', {}, t, backdrop, '#f0e8d0')); m.position.set(x + c * u + sn * v, Y + y, z - sn * u + c * v); m.rotation.y = r; h.scene.add(m); };
          f(B, motorFam, { x, z, r, Y, c, sn }); return true; } };
        const iF = k => (iV0 + k + N) % N; // k samples after the entrance to the estate
        // the cinema: portico of six white columns, pediment, red sign, posters
        spot(iF(40), 1, 13, 8, (B, motorFam) => { B(0, 0.03, 0, 30, 0.06, 18, 0x8e8c86); B(0, 4.5, -1.5, 26, 9, 12, 0xd8d0b8); B(0, 9.3, -1.5, 27, 0.6, 13, 0x6d726d); for (let k = 0; k < 6; k++) B(-10 + k * 4, 4, 5.6, 0.9, 8, 0.9, 0xf0ece0);
          B(0, 8.7, 5.4, 24, 1.4, 2.4, 0xf0ece0); B(0, 0.25, 7, 24, 0.5, 2.6, 0x9a9890); motorFam('КИНО', '#b5241c', 0, 10.6, 5.4, 10, 2.4); [0xc8281e, 0x2a6aa8, 0xd0a020].forEach((col, k) => B(-6 + k * 6, 3.4, 4.56, 3, 4, 0.12, col)); });
        // the market: two rows of stalls under coloured awnings, crates, entrance portico
        spot(iF(100), -1, 11, 7, (B, motorFam) => { B(0, 0.03, 0, 24, 0.06, 15, 0x9a8f78); for (let k = 0; k < 10; k++) { const u = -8 + (k % 5) * 4, v = k < 5 ? -3 : 2.4, col = [0xc8281e, 0xe8e4d8, 0x2a6aa8, 0xd0a020, 0x3a8a4a][(k + (k > 4)) % 5];
            B(u, 0.5, v, 3, 1, 1.4, 0x7a5a3a); B(u, 2.7, v, 3.6, 0.14, 2.6, col); for (const du of [-1.6, 1.6]) B(u + du, 1.35, v - 1.1, 0.12, 2.7, 0.12, 0x55585a); B(u - 0.7, 1.15, v, 1, 0.3, 0.9, [0xd86a1e, 0x4a8a3a, 0xc8281e][k % 3]); B(u + 0.7, 1.15, v, 1, 0.3, 0.9, [0xe8c83a, 0xc8281e, 0x8a5a3a][k % 3]); }
          for (const du of [-4.4, 4.4]) B(du, 2, 6.6, 0.3, 4, 0.3, 0x55585a); motorFam('РЫНОК', '#3a6a5a', 0, 4.6, 6.6, 9.4, 1.6); });
        // the plane on its pylon: a swept-wing fighter, in profile toward the street
        plane = (B) => { B(0, 0.4, 0, 14, 0.8, 9, 0x8d918a); B(-1, 3.4, 0, 1.2, 5.4, 1.6, 0xb8bbb4); B(0, 7, 0, 11, 1.4, 1.4, 0xc8ccd0); B(5.7, 7, 0, 0.4, 1.2, 1.2, 0xb5241c); B(2.2, 7.9, 0, 1.8, 0.6, 0.8, 0x3a5a7a);
          for (const e of [-1, 1]) { B(-0.8, 6.9, e * 3.2, 2.4, 0.16, 5.6, 0xc8ccd0, e * 0.5); B(-4.9, 8.6, e * 1.5, 1.2, 0.12, 2.8, 0xc8ccd0, e * 0.4); } B(-4.6, 8.5, 0, 2.2, 2.4, 0.16, 0xc8ccd0); B(-4.9, 9.3, 0, 1.2, 0.8, 0.2, 0xb5241c);
          for (const e of [-1, 1]) B(e * 5.5, 0.95, 4, 2.4, 0.3, 0.8, 0xc8281e); };
        // the park's big wheel: 22 m, coloured gondolas, sentry box
        spot(iF(220), -1, 12, 5, (B, motorFam, o) => { const g = new THREE.Group(); g.position.set(o.x, o.Y, o.z); g.rotation.y = o.r; h.scene.add(g); const yellow = mat('paint', { c: 0xd8b820 }), iron = mat('paint', { c: 0x3a5a7a });
          const ro = new THREE.Group(); ro.position.set(0, 12.6, 0); ro.userData.dyn = 1; g.add(ro); ro.add(new THREE.Mesh(new THREE.TorusGeometry(10, 0.22, 5, 28), yellow)); for (let k = 0; k < 6; k++) h.pose('boxMesh', yellow, ro, [0, 0, 0], 20, 0.16, 0.16).rotation.z = k * Math.PI / 6; weld(h, ro); // V-31: the wheel turns (one turn in 40 s), the gondolas stay upright
          for (const e of [-1, 1]) for (const f of [-1, 1]) { const p = h.pose('boxMesh', iron, g, [e * 2.4, 6.3, f * 1.1], 0.4, 13.6, 0.4); p.rotation.z = e * 0.37; } h.pose('boxMesh', iron, g, [0, 12.6, 0], 1, 1, 2.6);
          { const gon = Array.from({ length: 12 }, (_, k) => mb(mob(), 0, 0, 0, 0, 1.5, 1.5, 1.3, [0xc8281e, 0x2a6aa8, 0xe8e4d8, 0x3a8a4a][k % 4])); let A = 0;
            TICK.push(dt => { A += dt * Math.PI / 20; ro.rotation.z = A; gon.forEach((q, k) => { const a = k * Math.PI / 6 + 0.26 + A, u = Math.cos(a) * 10; mobA(q, o.x + o.c * u, o.Y + 12.6 + Math.sin(a) * 10 - 0.9, o.z - o.sn * u, o.r); }); }); }
          B(8, 1.3, 3.4, 2.4, 2.6, 2.4, 0xd8d0b8); B(8, 2.75, 3.4, 3, 0.3, 3, 0xc8281e); B(0, 0.03, 0, 26, 0.06, 11, 0x8a8468); });
        // the statue on its square: red granite plinth, bronze with arm raised, flower beds, three flags
        spot(iF(280), -1, 18, 15, (B, motorFam, o) => { const br = 0xc4c8c4; B(0, 0.03, 0, 38, 0.06, 31, 0xa8a49a); B(0, 0.25, -3, 16, 0.5, 14, 0x8d918a); B(0, 0.7, -3, 11, 0.5, 10, 0x8d918a); B(0, 3.6, -3, 5.4, 5.4, 4.6, 0x7a3a34); B(0, 6.5, -3, 6, 0.5, 5.2, 0x5a2a26); motorFam('ЛЕНИН', '#7a3a34', 0, 4, -0.62, 4.4, 1.3);
          for (const e of [-1, 1]) B(e * 0.6, 8.6, -3, 0.9, 3.8, 1.1, br); B(0, 12, -3, 2.6, 3.6, 1.7, br); B(0, 11, -3.2, 3, 3.2, 1.3, br); B(0, 14.5, -3, 1.2, 1.3, 1.2, br); B(-1.5, 11.6, -3, 0.6, 2.6, 0.7, br); B(1.6, 13.2, -1.6, 0.6, 0.6, 3.4, br); // legs, bust, coat panel, head, left arm along the body, right arm stretched toward the street
          for (const e of [-1, 1]) { B(e * 12, 0.3, 6, 8, 0.6, 3, 0xb5241c); B(e * 12, 0.3, -9, 8, 0.6, 3, 0xb5241c); B(e * 9, 0.45, 12, 2.4, 0.1, 0.5, 0x6a4a2a); B(e * 9, 0.22, 12, 2.2, 0.44, 0.12, 0x55585a); }
          for (let k = -2; k <= 2; k++) { B(k * 4, 6, -12.5, 0.2, 12, 0.2, 0x8a8e88); flagCube(o.x + o.c * k * 4 - o.sn * 12.5, o.Y + 10.9, o.z - o.sn * k * 4 - o.c * 12.5, 2.6, 1.7); } }, 8);
        // the courtyard rink: white band with blue piping, two goals
        spot(iF(385), -1, 14, 8, (B) => { B(0, 0.05, 0, 27, 0.1, 15, 0xdce4e8); for (const e of [-1, 1]) { B(0, 0.6, e * 7.5, 27, 1.2, 0.2, 0xf0f0ec); B(0, 1.25, e * 7.5, 27, 0.14, 0.24, 0x2a6aa8); B(e * 13.5, 0.6, 0, 0.2, 1.2, 15, 0xf0f0ec); B(e * 13.5, 1.25, 0, 0.24, 0.14, 15, 0x2a6aa8);
            B(e * 11, 0.6, 0, 0.1, 1.2, 1.8, 0xc8281e); B(e * 11.5, 1.2, 0, 1, 0.08, 1.8, 0xc8281e); B(e * 12.6, 4, 7.9, 0.2, 8, 0.2, 0x55585a); } B(0, 0.11, 0, 0.3, 0.02, 15, 0xc8281e); });
        // the exit's petrol station: white canopy with red band, three pumps, booth, tanker truck
        spot(iF(450), 1, 9, 6, (B, motorFam) => { B(0, 0.03, 0, 20, 0.06, 13, 0x6c6e6e); B(0, 4.6, 1, 15, 0.5, 7, 0xf0f0ec); B(0, 4.6, 4.52, 15, 0.52, 0.06, 0xc8281e); for (const e of [-1, 1]) B(e * 6, 2.2, 1, 0.5, 4.4, 0.5, 0xb8bbb4);
          for (let k = -1; k <= 1; k++) { B(k * 3, 0.9, 1, 0.8, 1.8, 0.6, k ? 0xc8281e : 0xd8b820); B(k * 3, 0.15, 1, 1.6, 0.3, 1.2, 0x8d918a); } B(0, 1.6, -3.6, 7, 3.2, 3, 0xd8d0b8); B(0, 3.35, -3.6, 7.6, 0.3, 3.6, 0x6d726d); motorFam('БЕНЗИН', '#2a4a6a', 0, 5.5, 4.4, 8, 1.3);
          B(-5.5, 1.9, 4.4, 5, 1.8, 2, 0xd86a1e); B(-1.9, 1.5, 4.4, 2, 2, 2.2, 0x3a6a9a); B(-4.4, 0.55, 4.4, 7.4, 0.7, 2.2, 0x1e2020); });
        // the inside of the street bends, left as lawn by the slabs: fountain, plane, bandstand, star flowerbed, taking turns
        fountain = B => { for (const dr of [0, Math.PI / 4]) { B(0, 0.4, 0, 9, 0.8, 9, 0xb8bbb4, dr); B(0, 0.76, 0, 7.8, 0.1, 7.8, 0x6aa8c0, dr); } B(0, 1.6, 0, 1.1, 2.4, 1.1, 0x8d918a); B(0, 3.3, 0, 2.4, 0.3, 2.4, 0x8d918a); B(0, 4.4, 0, 0.5, 2, 0.5, 0xe8f4f8); for (const e of [-1, 1]) { B(e * 6.6, 0.45, 0, 0.5, 0.1, 2.2, 0x6a4a2a); B(0, 0.45, e * 6.6, 2.2, 0.1, 0.5, 0x6a4a2a); } };
        kiosk = B => { for (const dr of [0, Math.PI / 4]) { B(0, 0.4, 0, 7, 0.8, 7, 0xe8e4d8, dr); B(0, 4.2, 0, 7.8, 0.3, 7.8, 0x3a6a5a, dr); B(0, 4.7, 0, 4.6, 0.7, 4.6, 0x3a6a5a, dr); } B(0, 5.6, 0, 1.4, 1.2, 1.4, 0x3a6a5a); for (const e of [-1, 1]) for (const f of [-1, 1]) B(e * 3, 2.5, f * 3, 0.25, 3.4, 0.25, 0xf0f0ec); for (const e of [-1, 1]) B(e * 3, 1.3, 0, 0.12, 0.9, 6, 0xf0f0ec); };
        flowerbed = B => { for (let k = 0; k < 3; k++) B(0, 0.25, 0, 12, 0.5, 2.6, 0xb5241c, k * Math.PI / 3); B(0, 0.4, 0, 3, 0.8, 3, 0xd8b820, 0.4); B(0, 4.5, 0, 0.3, 9, 0.3, 0x8a8e88); B(1.4, 7.9, 0, 2.6, 1.8, 0.06, 0xb5241c); };
        { const L = [fountain, plane, kiosk, flowerbed]; let n = 0, lst = -99; for (let q = 4; q < ((iV1 - iV0 + N) % N) - 4; q++) { const i = iF(q), k = Math.abs(S[i].k); if (k < 0.008 || q - lst < 36 || k < Math.abs(S[iF(q + 1)].k)) continue; const ok = spot(i, S[i].k > 0 ? 1 : -1, 5, 5, L[n % 4], 6.5, [0, 6, -6, 12, -12, 18, -18]); if (ok) { n++; lst = q; } } } }
      { // first row: along each street, facade toward the roadway, 6 m from the pavement
        for (let i = iV0 + 4, n = 0; n < ((iV1 - iV0 + N) % N) - 8; i = (i + 4) % N, n += 4) { const s = S[i]; for (const sd of [-1, 1]) for (const hl of [30, 15]) { const [x, z] = edgePt(s, sd, s.w + 3.6 + 2.2 + 6), r = h.across(s) + Math.PI / 2 + (sd > 0 ? Math.PI : 0);
          if (place(x, z, r, hl, 6)) { tier1.push([x, s.y - 0.4, z, r, hl, sd, i]); break; } } }
        // second row and towers: on a grid, behind the first row
        tier1.slice().forEach(([x, y, z, r, hl], q) => { for (const d of [36, 72]) { const x2 = x - Math.sin(r) * d, z2 = z - Math.cos(r) * d, lapRun = d > 40 && q % 4 === 0; if (cite(x2, z2) && place(x2, z2, r, lapRun ? 15 : hl, 6, 14)) (lapRun ? lapCount : tier2).push([x2, Math.max(YV, hAt(x2, z2)) - 0.4, z2, r, lapRun ? 15 : hl]); else break; } });
        // in the courtyards, between the rows: the school (three storeys in an H, sports field), the kindergartens (two storeys, coloured verandas), garage boxes
        { school = (x, z, Y) => { const B = (u, y, v, a, b, c, col) => bl(x + u, Y + y, z + v, 0, a, b, c, col); B(0, 5, 0, 40, 10, 10, 0xc8b8a0); B(0, 10.2, 0, 41, 0.4, 11, 0x6d726d); for (const e of [-1, 1]) { B(e * 17, 5, 9, 10, 10, 10, 0xc8b8a0); B(e * 17, 10.2, 9, 11, 0.4, 11, 0x6d726d); } for (let k = -4; k <= 4; k++) for (const f of [2.4, 5.6, 8.4]) B(k * 4, f, 5.06, 2.6, 1.6, 0.1, 0x3a4a54); B(0, 2, 5.6, 6, 4, 1.2, 0xe8e4d8); B(0, 4.4, 5.6, 7, 0.5, 2, 0xb5241c);
              B(0, 0.04, 26, 36, 0.08, 20, 0x9a6a4a); B(0, 0.06, 26, 28, 0.08, 12, 0x4a7a3a); for (const e of [-1, 1]) { B(e * 13, 1.2, 26, 0.2, 2.4, 6, 0xf0f0ec); B(e * 13, 2.4, 26, 1.6, 0.2, 6, 0xf0f0ec); } },
            garden = (x, z, Y) => { const B = (u, y, v, a, b, c, col) => bl(x + u, Y + y, z + v, 0, a, b, c, col); B(0, 3.4, 0, 26, 6.8, 9, 0xe0d8c0); B(0, 7, 0, 27, 0.4, 10, 0x8a5a4a); [0xd8b820, 0x2a6aa8, 0xc8281e, 0x3a8a4a].forEach((col, k) => { B(-9 + k * 6, 1.5, 6, 4.6, 3, 3, col); B(-9 + k * 6, 3.1, 6, 5, 0.3, 3.4, 0xf0f0ec); }); for (let k = -3; k <= 3; k++) B(k * 3.6, 4.8, 4.56, 2.2, 1.6, 0.1, 0x3a4a54); B(0, 0.5, 11, 28, 1, 0.2, 0x3a8a4a); },
            boxes = (x, z, Y) => { for (let k = -6; k <= 6; k++) for (const e of [-1, 1]) bl(x + k * 3.6, Y + 1.3, z + e * 4.5, 0, 3.4, 2.6, 6, k & 1 ? 0x6e7a7a : 0x7a6a5a); bl(x, Y + 0.03, z, 0, 50, 0.06, 4, 0x55585a); };
          const L = [[school, 22, 22], [garden, 14, 8], [boxes, 25, 8], [garden, 14, 8]]; let n = 0; for (let z = 716; z < 1130 && n < 7; z += 26) for (let x = 126; x < 480 && n < 7; x += 26) { const [f, hl, hp] = L[n % 4]; if (place(x, z, 0, hl, hp, 26)) { f(x, z, hAt(x, z) + 0.05); n++; } } }
        const pk = [mat('signK', {}, '#9c9c96'), mat('signK', {}, '#8c9092'), mat('signK', {}, '#a8a498')], allRes = [...tier1, ...tier2]; { const lk = mat('signKbright').map; for (const m of pk) { m.emissiveMap = lk; m.emissive.setHex(0xffffff); m.emissiveIntensity = 0.9; } TICK.push((dt, car) => { if (!car) return; const k = Math.max(0.25, 0.9 - 0.3 * Math.max(0, (car.lap || 1) - 1)); for (const m of pk) m.emissiveIntensity += (k - m.emissiveIntensity) * Math.min(1, dt); }); } // V-39: they switch off from one lap to the next, the day is dawning // one window in three is lit
        for (const hl of [30, 15]) pk.forEach((m, j) => { const l = allRes.filter((b, q) => b[4] === hl && q % 3 === j).map(b => b.slice(0, 4)); if (l.length) insts(h, 'barLine', { facade: m, roofM: concS, awning: concS }, l, { a: [hl * 2] }); });
        insts(h, 'barLine', { facade: pk[1], roofM: concS, awning: concS }, lapCount.map(b => b.slice(0, 4)), { a: [30, 27] });
        inst(h, h.geo('blk'), concS, [...allRes, ...lapCount].map(b => [b[0], b[1] - 1.6, b[2], b[3], b[4] * 2 + 1, 3.4, 13])); // the bases: no building shows its underside
        // the ground-floor signboards of every other building in the first row, facing the street
        const WORDS = ['ПРОДУКТЫ', 'ХЛЕБ', 'АПТЕКА', 'ПОЧТА', 'КНИГИ', 'МОЛОКО', 'ОБУВЬ', 'ГАСТРОНОМ'], BGS = ['#3a5a7a', '#7a3a34', '#3a6a5a'];
        tier1.forEach((b, q) => { if (q % 2) return; const [x, y, z, r] = b, m = new THREE.Mesh(h.geo('boxMesh', 18, 1.5, 0.2), mat('letters', {}, WORDS[(q >> 1) % WORDS.length], BGS[(q >> 1) % WORDS.length % 3], '#f0e8d0')); m.position.set(x + Math.sin(r) * 6.15, y + 3.9, z + Math.cos(r) * 6.15); m.rotation.y = r; h.scene.add(m); });
        // the only mural: the gable of the building nearest the start line, on the right, turned toward the arriving cars
        { const s0 = S[30], outTarget = edgePt(s0, 1, s0.w + 12); let b = null, bd = 1e9; for (const q of tier1) { const d = Math.hypot(q[0] - outTarget[0], q[2] - outTarget[1]); if (q[5] > 0 && d < bd) { bd = d; b = q; } }
          if (b) { const [x, y, z, r, hl] = b, ax = Math.cos(r), az = -Math.sin(r), e = az > 0 ? 1 : -1, m = new THREE.Mesh(h.geo('boxMesh', 11.4, 14.2, 0.2), mat('muralBarrage')); m.position.set(x + ax * e * (hl + 0.15), y + 7.7, z + az * e * (hl + 0.15)); m.rotation.y = r + Math.PI / 2 + (e > 0 ? 0 : Math.PI); h.scene.add(m); } }
        // cars parked on the forecourt, along the pavement; blue newspaper kiosks at the corners
        const vo = []; let nm = 0; for (let i = iV0 + 6, n = 0; n < ((iV1 - iV0 + N) % N) - 12; i = (i + 7) % N, n += 7) { const u = rnd(), s = S[i], sd = (rnd(), -1), [x, z] = edgePt(s, sd, s.w + 4.8), y = s.y + 0.07, r = h.across(s); if (u < 0.3 || insideShell(x, z, 0.4) || Math.abs(hAt(x, z) - s.y + 0.6) > 0.7) continue;
          if (u >= 0.6) { vo.push([x, y, z, r + Math.PI / 2, 1.2, 1.2, 1.2, [0xb5483c, 0x3d6e8a, 0xe8e4d8, 0x8a9488, 0xc8b47a, 0x4a4d50][vo.length % 6]]); continue; }
          const t = nm++ % 4; // the pavement furniture: bench and bin, red honour board, poster column, phone box
          if (t === 0) { bl(x, y + 0.45, z, r + Math.PI / 2, 2.2, 0.1, 0.5, 0x6a4a2a); bl(x, y + 0.85, z, r + Math.PI / 2, 2.2, 0.5, 0.08, 0x6a4a2a); bl(x, y + 0.22, z, r + Math.PI / 2, 2, 0.44, 0.12, 0x55585a); bl(x + s.tx * 1.8, y + 0.4, z + s.tz * 1.8, r, 0.5, 0.8, 0.5, 0x3a5a3a); }
          else if (t === 1) { bl(x, y + 2, z, r + Math.PI / 2, 5, 2.2, 0.16, 0xb5241c); bl(x, y + 3.25, z, r + Math.PI / 2, 5.3, 0.3, 0.3, 0xd0a020); for (const e of [-2.2, 2.2]) bl(x + s.tx * e, y + 0.5, z + s.tz * e, r, 0.2, 1, 0.2, 0x55585a); for (let k = -1; k <= 1; k++) bl(x + s.tx * k * 1.5, y + 2, z + s.tz * k * 1.5, r + Math.PI / 2, 1, 1.3, 0.2, 0xe8e0c8); }
          else if (t === 2) { bl(x, y + 1.6, z, r + 0.4, 1.2, 3.2, 1.2, 0xc8b47a); bl(x, y + 3.3, z, r + 0.4, 1.5, 0.3, 1.5, 0x4a5a50); bl(x, y + 1.8, z, r + 0.4, 1.24, 1.2, 1.24, [0xc8281e, 0x2a6aa8, 0xe8e4d8][nm % 3]); }
          else { bl(x, y + 1.25, z, r, 1, 2.5, 1, 0xc8281e); bl(x, y + 1.5, z, r, 1.04, 1.2, 1.04, 0xd8e4e8); bl(x, y + 2.6, z, r, 1.1, 0.2, 1.1, 0xf0f0ec); } }
        insts(h, 'sedan', { carBody: mat('paint'), pane: mat('paneDark'), tire: gray }, vo, { tintMat: 'carBody' });
        for (const k of [K.startLine + 2, K.startLine + 5, K.entryVille + 3, K.entryVille + 8, K.streetSouth]) { const s = S[P(k)], [x, z] = edgePt(s, -1, s.w + 4.6), r = h.across(s), y = s.y + 0.06; if (insideShell(x, z, 0.5)) continue; bl(x, y + 1.3, z, r, 2.4, 2.6, 2.4, 0x3a6a9a); bl(x, y + 2.75, z, r, 3, 0.3, 3, 0x2a4a6a); bl(x, y + 1.6, z, r, 2.46, 0.9, 1.6, 0xd8e4e8); } }
      // the play areas, in the courtyards behind the first row, wherever there is room
      const lot = (x, z, Y) => {
        bl(x - 8, Y + 0.08, z - 6, 0, 4, 0.16, 4, 0xd8c890); for (const [dx, dz, a, c] of [[0, -2, 4.2, 0.2], [0, 2, 4.2, 0.2], [-2, 0, 0.2, 4.2], [2, 0, 0.2, 4.2]]) bl(x - 8 + dx, Y + 0.2, z - 6 + dz, 0, a, 0.4, c, 0xd0a020); // the sandpit
        for (const dx of [-1.7, 1.7]) bl(x + dx, Y + 1.4, z - 7, 0, 0.16, 2.8, 0.16, 0x2a6aa8); bl(x, Y + 2.8, z - 7, 0, 3.6, 0.16, 0.16, 0x2a6aa8); for (const dx of [-0.7, 0.7]) { bl(x + dx, Y + 0.6, z - 7, 0, 0.5, 0.06, 0.22, 0xc8281e); bl(x + dx, Y + 1.7, z - 7, 0, 0.04, 2.2, 0.04, 0x2a2c2a); } // the swing
        bl(x + 8, Y + 1.1, z - 6, 0, 1.2, 2.2, 1.2, 0xc8281e); for (let k = 0; k < 4; k++) bl(x + 8, Y + 1.9 - k * 0.5, z - 4.9 + k * 0.9, 0, 0.8, 0.1, 1, 0xd8d8d0); // the slide
        bl(x + 6, Y + 2.6, z + 6, 0, 1.2, 3.6, 1.2, 0xe8e4d8); bl(x + 6, Y + 3, z + 6, 0, 1.26, 0.6, 1.26, 0xc8281e); bl(x + 6, Y + 5, z + 6, 0, 0.7, 1.2, 0.7, 0xc8281e); for (const [dx, dz] of [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]]) bl(x + 6 + dx, Y + 0.6, z + 6 + dz, 0, 0.3, 1.2, 0.3, 0x2a6aa8); // the rocket
        bl(x - 6, Y + 0.45, z + 6, 0.4, 2.6, 0.14, 2.6, 0x3a8a4a); bl(x - 6, Y + 0.5, z + 6, 0, 0.2, 1, 0.2, 0xd0a020); // the roundabout
        for (const dz of [-11, 11]) { bl(x, Y + 0.45, z + dz, 0, 1.9, 0.1, 0.5, 0x6a4a2a); bl(x, Y + 0.22, z + dz, 0, 1.7, 0.44, 0.12, 0x55585a); } // deux bancs
        for (const dx of [-1.5, 1.5]) bl(x + 13 + dx, Y + 1.1, z + 2, 0, 0.12, 2.2, 0.12, 0x55585a); bl(x + 13, Y + 2.2, z + 2, 0, 3.1, 0.12, 0.12, 0x55585a); // the carpet-beating frame
        for (const dz of [-3.5, 3.5]) bl(x - 14, Y + 1.2, z + dz, 0, 0.12, 2.4, 0.12, 0x55585a); bl(x - 14, Y + 2.3, z, 0, 0.04, 0.04, 7, 0x2a2c2a); [0xf0f0e8, 0x9ab8d8, 0xf0f0e8, 0xc86a5a].forEach((c, k) => bl(x - 14, Y + 1.6, z - 2.4 + k * 1.6, 0, 0.05, 1.3, 1.3, c)); // the laundry
        bl(x, Y + 0.03, z, 0, 34, 0.06, 26, 0x8a8468); }; // the packed-earth ground of the area
      { let n = 0; for (let z = 720; z < 1130 && n < 7; z += 36) for (let x = 130; x < 480 && n < 7; x += 58) if (place(x, z, 0, 17, 13, 16)) { lot(x, z, hAt(x, z) + 0.05); n++; } }
      { const loc = f => (x, z, Y, r) => { const c = Math.cos(r), sn = Math.sin(r); f((u, y, v, a, b, d, col, dr = 0) => bl(x + c * u + sn * v, Y + y, z - sn * u + c * v, r + dr, a, b, d, col)); };
        const grove = (x, z, Y) => { for (let k = 0; k < 8; k++) { const a = rnd() * 6.28, d = 2 + rnd() * 8, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d; groves.push([bx, hAt(bx, bz) - 0.3, bz, rnd() * 6, 0.8 + rnd() * 0.5]); } bl(x, Y + 0.45, z, 0.5, 2.2, 0.1, 0.5, 0x6a4a2a); bl(x, Y + 0.22, z, 0.5, 2, 0.44, 0.12, 0x55585a); };
        const L = [[lot, 17, 13, 0, 8], [grove, 9, 9, 0, 99], [loc(fountain), 7, 7, 1, 2], [garden, 14, 8, 0, 3], [grove, 9, 9, 0, 99], [loc(kiosk), 6, 6, 1, 2], [boxes, 25, 8, 0, 4], [grove, 9, 9, 0, 99], [loc(flowerbed), 7, 7, 1, 3], [school, 22, 22, 0, 1], [grove, 9, 9, 0, 99]]; let n = 0; // last number: how many times at most
        for (let q = -10; q < ((iV1 - iV0 + N) % N) + 10; q += 7) for (const sd of [-1, 1]) for (const off of [16, 36, 56, 76]) { const s = S[(iV0 + q + N) % N], [x, z] = edgePt(s, sd, s.w + off), Y = hAt(x, z) + 0.05; if (Math.abs(Y - s.y) > 14 || booth(x, z) || !(x > 60 && z > 660)) continue;
          for (let k = 0; k < L.length; k++) { const e = L[(n + k) % L.length], [f, hl, hp, rotating] = e, r = rotating ? h.across(s) + Math.PI / 2 + (sd > 0 ? Math.PI : 0) : 0; if (e[4] > 0 && place(x, z, r, hl, hp, 5)) { f(x, z, Y, r); e[4]--; n += k + 1; break; } } } }
      // the above-ground heating pipes, insulated with sheet metal, spanning the streets on gantries
      { // two twin tubes sheathed in sheet metal, set on blocks along the right-hand pavement for the whole crossing; an expansion loop every 70 m; they rise onto gantries only to cross the roadway, in two places
        const H = [], V = [], studs = [], O = 4.7, Y = [0.75, 1.4], stepSec = 3, span = ((iV1 - 8 - iV0 - 8 + N) % N), crossing = [P(5) + 4, P(K.entryVille) + 46].map(i => (i + N) % N);
        const seg = (a, b, y) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); H.push([(a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, -Math.atan2(dz, dx), l + 0.15, 1, 1]); }, ascent = (q, y0, y1) => V.push([q[0], (y0 + y1) / 2, q[1], 0, 1, y1 - y0, 1]);
        for (let n = 0; n < span; n += stepSec) { const i = (iV0 + 8 + n) % N, j = (i + stepSec) % N, a = edgePt(S[i], 1, S[i].w + O), b = edgePt(S[j], 1, S[j].w + O), ya = S[i].y, lyre = n % 36 === 18;
          if (lyre) Y.forEach((y, k) => { const ht = 3.4 + k * 0.65; ascent(a, ya + y, ya + ht); ascent(b, ya + y, ya + ht); seg(a, b, ya + ht); });
          else for (const y of Y) seg(a, b, ya + y);
          if (n % 6 === 0) studs.push([a[0], ya + 0.3, a[1], h.across(S[i]), 0.9, 0.9, 0.5]);
          if (crossing.some(t => Math.abs(t - i) < stepSec / 2 + 0.6)) { const g = edgePt(S[i], -1, S[i].w + O); Y.forEach((y, k) => { const ht = 7 + k * 0.65; ascent(a, ya + y, ya + ht); seg(a, g, ya + ht); ascent(g, ya - 0.5, ya + ht); }); studs.push([g[0], ya + 0.3, g[1], h.across(S[i]), 1.6, 0.9, 1.2]); } }
        const tin = mat('tinOrange', {}, '#b6bab4'); inst(h, h.geo('tubeGES'), tin, H); inst(h, h.geo('tubeGESv'), tin, V); inst(h, h.geo('blk'), concS, studs); }
      bl(206, YV + 1.3, 1118, 0, 3.4, 1.5, 1.6, 0xe8b820); bl(206, YV + 0.4, 1118, 0, 2.4, 0.5, 1.5, 0x2a2c2a); // the kvass tank, yellow
      { const s = S[P(K.streetSouth) - 4], gr = marker(h, s); h.pose('shelterBus', { concretePart: concC, mosaic: concS, bench: mat('paint', { c: 0x6d726d }) }, gr, [-(s.w + 5.2), 0, 0]).forEach(m => m.rotation.y = Math.PI / 2); }

      // ---------- the tunnel portals: two bunker heads, solid concrete with batter, vault-shaped opening (the tunnel's), loopholes, armored doors open, rock above ----------
      { const TU = h.TH.tun, HV = TU.h || 7.5, FL = TU.vault || 3.2, concB = mat('concreteGES', {}, '#7d817a'), armored = mat('tinOrange', {}, '#4a5a48');
        for (const [i, direction] of [[T0, 0], [T1, Math.PI]]) { const s = S[i], gr = new THREE.Group(); gr.position.set(s.x, s.y, s.z); gr.rotation.y = h.across(s) + direction; h.scene.add(gr); // the portal face looks toward -Z
          const intoWall = new THREE.Shape([[-W - 13, -3], [W + 13, -3], [W + 8.5, 13.4], [-W - 8.5, 13.4]].map(([x, y]) => new THREE.Vector2(x, y))), hole = new THREE.Path();
          const WO = W - 0.35, HO = HV - 0.3; hole.moveTo(-WO, -3); hole.lineTo(-WO, HO - FL); for (let k = 1; k <= 12; k++) { const a = Math.PI * (1 - k / 12); hole.lineTo(Math.cos(a) * WO, HO - FL + Math.sin(a) * FL); } hole.lineTo(WO, -3); intoWall.holes.push(hole); // a bit narrower and lower than the shell: it hides the engine's portal without ever lying in its plane
          const ge = new THREE.ExtrudeGeometry(intoWall, { depth: 7, bevelEnabled: false, curveSegments: 1 }); ge.translate(0, 0, -7.25); { const uv = ge.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) / 8, uv.getY(k) / 8); }
          const m = new THREE.Mesh(ge, concB); m.castShadow = m.receiveShadow = true; gr.add(m);
          h.pose('boxMesh', concS, gr, [0, 14.2, -4], 2 * W + 19, 1.6, 9); // the cover slab, overhanging
          for (const x of [-7, 0, 7]) h.pose('boxMesh', blackM, gr, [x, 10.6, -7.3], 3, 0.6, 0.5); // three loopholes above the vault
          for (const sd of [-1, 1]) { const p = h.pose('boxMesh', armored, gr, [sd * (W + 5.4), 4.4, -11.2], 0.9, 9.4, 9); p.rotation.y = sd * 0.5; h.pose('boxMesh', mat('stripeOrange'), gr, [sd * (W + 3.4), 4.4, -15.1], 1, 9.4, 0.3).rotation.y = sd * 0.5; // the armored leaves, open, and their striped edges
            h.pose('boxMesh', mat('lampObj', GLOWI), gr, [sd * (W + 2), 6.2, -7.45], 0.5, 0.9, 0.4); }
          h.pose('boxMesh', mat('letters', {}, direction ? 'Т-2' : 'Т-1', '#7d817a', '#2a2c2a'), gr, [-W - 5.2, 9, -7.3], 5, 1.5, 0.1);
        } }

      // ---------- the dam garrison, between the valley road and the river: diamond-patterned concrete fence, green gate with stars, barracks, parade ground, trucks, watchtowers, radar and two anti-aircraft missile launchers ----------
      const BX0 = -36, BX1 = 12, BZ0 = 118, BZ1 = 282, base = (x, z) => x > BX0 - 6 && x < BX1 + 6 && z > BZ0 - 6 && z < BZ1 + 6; // on the quay, on the left leaving the hall: the road passes to the west (x = -50)
      const worksite = (x, z) => x > -36 && x < 114 && z > 436 && z < 646; // the former garrison ground, in the valley
      { const YB = terrace(200) + 0.05, po2 = mat('concretePO2', DS), khaki = 0x4a5a3a, olive = mat('paint', { c: khaki }), pkB = mat('signK', {}, '#a8ac98'), ZP = 200; // ZP: the gate, facing the road
        const kbdEl = [], add = (x0, z0, x1, z1) => { const l = Math.hypot(x1 - x0, z1 - z0); kbdEl.push([(x0 + x1) / 2, YB + 1.25, (z0 + z1) / 2, -Math.atan2(z1 - z0, x1 - x0), l, 2.5, 0.25]); };
        add(BX0, BZ0, BX1, BZ0); add(BX0, BZ1, BX1, BZ1); add(BX1, BZ0, BX1, BZ1); inst(h, h.geo('blk'), po2, kbdEl); // solid wall to the north, south and on the canal side
        { const po = [], wires = []; for (let z = BZ0; z <= BZ1; z += 4) if (Math.abs(z - ZP) > 7.5) po.push([BX0, YB + 1.3, z, 0, 0.24, 2.6, 0.24]); inst(h, h.geo('blk'), concS, po); // road side: concrete posts and four rows of barbed wire, you can see inside
          for (const [z0, z1] of [[BZ0, ZP - 8], [ZP + 8, BZ1]]) for (const y of [0.6, 1.2, 1.8, 2.4]) wires.push(BX0, YB + y, z0, BX0, YB + y, z1);
          const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3)); h.scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2e3230 }))); }
        inst(h, h.geo('boxMesh', 0.3, 3, 6.6), mat('doorStar'), [[BX0, YB + 1.5, ZP - 3.5], [BX0, YB + 1.5, ZP + 3.5]]); // the two green leaves with a red star
        for (const dz of [-7.4, 7.4]) blk(concS, BX0 - 0.6, BX0 + 0.6, ZP + dz - 0.6, ZP + dz + 0.6, YB - 1, YB + 3.8);
        blk(pkB, BX0 + 2, BX0 + 8, ZP + 9, ZP + 15, YB - 2, YB + 3.4); blk(concS, BX0 + 1.5, BX0 + 8.5, ZP + 8.5, ZP + 15.5, YB + 3.4, YB + 3.8); // the guard post
        blk(mat('noise', {}, '#55585a', ['#606366', '#4a4d50']), -18, 10, 176, 250, YB - 2, YB + 0.02); // the parade ground
        for (const z of [126, 274]) { blk(pkB, -30, 8, z - 6, z + 6, YB - 2, YB + 7); blk(concS, -30.6, 8.6, z - 6.6, z + 6.6, YB + 7, YB + 7.5); } // deux casernements
        blk(pkB, -8, 10, 140, 158, YB - 2, YB + 10); blk(concS, -8.6, 10.6, 139.4, 158.6, YB + 10, YB + 10.5); // the headquarters, and its mast with the red flag
        blk(gray, -12.2, -11.8, 148.8, 149.2, YB, YB + 14); flagCube(-12, YB + 12.5, 149.2, 4.4, 2.6); // V-13
        { const g = new THREE.Group(); g.position.set(-10, YB + 7.5, 274); g.userData.dyn = 1; h.scene.add(g); const P1 = (m, p, w, ht, d) => h.pose('boxMesh', m, g, p, w, ht, d); // V-11: the rake-type watch antenna, turning fast (one turn in 4 s), visible as soon as you leave the hall
          P1(olive, [0, 2, 0], 0.5, 4, 0.5); P1(olive, [0, 4.4, 0], 11, 0.3, 0.3); P1(olive, [0, 6.6, 0], 11, 0.3, 0.3); for (let k = -5; k <= 5; k += 1.25) P1(mat('paint', { c: 0xc8ccc0 }), [k, 5.5, 0], 0.16, 3.4, 0.16); P1(olive, [0, 5.5, -0.9], 11.6, 3.8, 0.1);
          blk(olive, -11.4, -8.6, 272.6, 275.4, YB + 7.5, YB + 8.7); weld(h, g); TICK.push(dt => { g.rotation.y += dt * 1.05; }); }
        { const tr = []; for (let k = 0; k < 7; k++) { const z = 183 + k * 5.4; tr.push([4.5, YB + 1.7, z, 0, 5.4, 2.2, 2.6, 0x5a6844], [-0.1, YB + 1.5, z, 0, 2.4, 2.4, 2.5, khaki], [3, YB + 0.5, z, 0, 7.4, 1, 2.7, 0x1e2020]); } // seven tarpaulin-covered trucks, noses toward the road: tarpaulin, cab, chassis
          for (const z of [229, 240]) tr.push([-6, YB + 1.2, z, 0, 7, 1.5, 3.1, khaki], [-5.4, YB + 2.3, z, 0, 2.6, 0.8, 1.8, khaki], [-9.2, YB + 2.4, z, 0, 4.6, 0.25, 0.25, 0x2a2e26]); // two armored vehicles, turret and gun
          const m = inst(h, h.geo('blk'), mat('paint'), tr), c = new THREE.Color(); tr.forEach((q, k) => m.setColorAt(k, c.setHex(q[7]))); m.instanceColor.needsUpdate = true; }
        for (const [x, z] of [[BX0 + 4, BZ0 + 4], [BX0 + 4, BZ1 - 4], [BX1 - 4, BZ1 - 4]]) { for (const dx of [-1.4, 1.4]) for (const dz of [-1.4, 1.4]) blk(gray, x + dx - 0.15, x + dx + 0.15, z + dz - 0.15, z + dz + 0.15, YB, YB + 9); blk(olive, x - 2, x + 2, z - 2, z + 2, YB + 9, YB + 11.4); blk(concS, x - 2.6, x + 2.6, z - 2.6, z + 2.6, YB + 11.4, YB + 11.8); blk(mat('lampObj', GLOWI), x - 0.5, x + 0.5, z - 0.5, z + 0.5, YB + 11.8, YB + 12.4); } // three watchtowers, searchlight on
        // the anti-aircraft defense, in the front row facing the road: a radar on its knoll, two launchers and their missiles pointed to the north-west
        { const tre = mat('latticeGantry', { alphaTest: 0.5, side: THREE.DoubleSide }, '#5a6652'), whiteM = mat('paint', { c: 0xd8dcd4 });
          blk(olive, -31, -23, 254, 262, YB, YB + 3); blk(tre, -28, -26, 257, 259, YB + 3, YB + 12); { const d = new THREE.Mesh(new THREE.SphereGeometry(11, 14, 5, 0, Math.PI * 2, 0, 0.75), mat('paint', { c: 0xc8ccc0, side: THREE.DoubleSide })); d.rotation.order = 'YXZ'; d.rotation.set(Math.PI - 1, -1.2, 0); d.castShadow = true; const gp = new THREE.Group(); gp.position.set(-27, YB + 16, 258); gp.userData.dyn = 1; gp.add(d); h.scene.add(gp); TICK.push(dt => { gp.rotation.y += dt * 0.42; }); /* V-12: the dish sweeps slowly (one turn in 15 s: it is outside the bridge bend) */ h.pose('boxMesh', olive, h.scene, [-27, YB + 12.6, 258], 2.4, 1.2, 2.4); }
          for (const z of [177, 186, 214, 223]) { const k = new THREE.Group(); k.position.set(-27, YB, z); k.scale.setScalar(1.3); h.scene.add(k); const rk = new THREE.Group(); rk.position.set(0.8, 3.1, 0); rk.rotation.z = -0.62; k.add(rk); // rocket launcher on a truck, cab toward the road, sixteen rockets on their rails
            h.pose('boxMesh', blackM, k, [0, 0.55, 0], 7, 0.9, 2.4); h.pose('boxMesh', olive, k, [-2.5, 1.7, 0], 2, 1.6, 2.4); h.pose('boxMesh', olive, k, [-3.8, 1.3, 0], 1, 0.9, 2.3); h.pose('boxMesh', olive, k, [1.2, 1.5, 0], 3.6, 1, 2.3); h.pose('boxMesh', olive, k, [2, 2.4, 0], 0.3, 1.6, 1.8);
            h.pose('boxMesh', olive, rk, [0, 0, 0], 5.8, 0.2, 2.4).castShadow = true; for (let q = 0; q < 8; q++) for (const e of [-1, 1]) h.pose('boxMesh', whiteM, rk, [0.2, e * 0.26, -0.98 + q * 0.28], 5, 0.2, 0.16); }
          for (const [x, z] of [[-27, 165], [-27, 236]]) { const bu = new THREE.Mesh(new THREE.CylinderGeometry(5, 6.5, 1.2, 10), mat('noise', {}, '#5e6a4c', ['#6c7858', '#505c40'])); bu.position.set(x, YB + 0.6, z); h.scene.add(bu); blk(olive, x - 2.4, x + 2.4, z - 2.4, z + 2.4, YB + 1.2, YB + 2.6); const r = new THREE.Group(); r.position.set(x, YB + 2.6, z); r.rotation.order = 'YXZ'; r.rotation.set(-0.8, 2.3, 0); h.scene.add(r);
            h.pose('boxMesh', olive, r, [0, 0, 1.5], 0.6, 0.5, 9); const mi = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 10.5, 8), whiteM); mi.rotation.x = Math.PI / 2; mi.position.set(0, 0.7, 1.8); mi.castShadow = true; r.add(mi);
            const og = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.6, 8), mat('paint', { c: 0x4a5a3a })); og.rotation.x = -Math.PI / 2; og.position.set(0, 0.7, -4.2); r.add(og); h.pose('boxMesh', olive, r, [0, 0.7, 5.6], 2.2, 0.08, 1.6); h.pose('boxMesh', olive, r, [0, 0.7, 5.6], 0.08, 2.2, 1.6); } // butte, rampe, missile, ogive, empennage
          blk(gray, 5.8, 6.2, 261.8, 262.2, YB, YB + 28); blk(mat('lightRed', GLOWI), 5.6, 6.4, 261.6, 262.4, YB + 28, YB + 28.8); } } // the radio mast and its light

      // ---------- the estate construction site, on the former garrison ground: a nine-storey building raised up to the fifth floor, the frame above, two tower cranes on their track, stacks of panels, site huts ----------
      { const YC2 = terrace(540) + 0.05, ox = 68, iron = mat('paint', { c: 0x2a2c2e }), rust = 0x8a4634;
        insts(h, 'barLine', { facade: mat('signK', {}, '#a8a498'), roofM: concS, awning: concS }, [[ox, YC2 - 0.4, 530, Math.PI / 2]], { a: [60, 15] }); blk(concS, ox - 6.6, ox + 6.6, 499.4, 560.6, YC2 - 2, YC2 + 0.2);
        { const os = [[ox, YC2 + 18.6, 530, 0, 12.4, 0.35, 60.4], [ox, YC2 + 21.9, 520, 0, 12.4, 0.35, 40.4], [ox - 5.9, YC2 + 16.9, 516, 0, 0.3, 3, 30], [ox + 5.9, YC2 + 16.9, 512, 0, 0.3, 3, 22]]; // the frame of the sixth and seventh floors: slabs, posts, first panels placed
          for (let z = 502; z <= 558; z += 8) for (const dx of [-5.6, 0, 5.6]) { os.push([ox + dx, YC2 + 17, z, 0, 0.5, 3.2, 0.5]); if (z < 540) os.push([ox + dx, YC2 + 20.3, z, 0, 0.5, 3.2, 0.5]); if (z < 524) os.push([ox + dx, YC2 + 23.4, z, 0, 0.4, 2.6, 0.4]); }
          inst(h, h.geo('blk'), concC, os); }
        blk(mat('noise', {}, '#6e6a60', ['#7c786c', '#5e5a50']), 87, 95, 482, 578, YC2 - 1, YC2 + 0.12); for (const x of [88.6, 93.4]) blk(iron, x - 0.1, x + 0.1, 483, 577, YC2 + 0.12, YC2 + 0.3); // the crane track
        { const skinG = { steelMat: mat('paint', { c: rust }), lattice: mat('latticeGantry', { alphaTest: 0.5, side: THREE.DoubleSide }, '#8a4634'), ballast: mat('paint', { c: 0x6d726d }), cabin: mat('paint', { c: 0xe8e0c8 }), pane: mat('paneDark'), cable: iron };
          [[500, 2.7], [562, 3.5]].forEach(([z, r0], k) => { const g = new THREE.Group(); g.position.set(91, YC2 + 0.3, z); g.rotation.y = r0; g.userData.dyn = 1; h.scene.add(g); h.pose('craneKB', skinG, g, [0, 0, 0]); TICK.push((dt, car, t) => { g.rotation.y = r0 + 0.6 * Math.sin(t * 0.13 + k * 2); }); }); } // V-40: the two cranes slowly pivot (outside the merge)
        for (const [x, z, r] of [[98, 470, 0], [50, 520, 1.57], [52, 548, 1.57], [96, 592, 0.3]]) { for (let k = 0; k < 7; k++) bl(x, YC2 + 0.2 + k * 0.34, z, r, 6, 0.26, 3, 0xb0b2aa); for (let k = 0; k < 5; k++) bl(x + Math.cos(r) * 7, YC2 + 0.9, z - Math.sin(r) * 7 + (k - 2) * 0.5, r + 1.57 - 0.25, 0.3, 3, 6, 0xa8aaa2); } // stacks of slabs and panels standing on their trestles
        for (const z of [606, 616]) { bl(92, YC2 + 1.5, z, 0, 8, 2.6, 3, 0x4a6a5a); bl(92, YC2 + 2.95, z, 0, 8.4, 0.3, 3.4, 0x3a3e3c); } // deux baraques de chantier
        { const c = new THREE.Mesh(new THREE.ConeGeometry(6, 4.4, 9), mat('noise', {}, '#c8b888', ['#d6c696', '#b6a678'])); c.position.set(78, YC2 + 2, 590); h.scene.add(c); } // the sand heap
        { const m = new THREE.Mesh(h.geo('boxMesh', 0.15, 1.8, 11), mat('letters', {}, 'СТРОЙКА · СМУ-4', '#e8e0c8', '#b5241c')); m.position.set(108.6, YC2 + 4.4, 522); h.scene.add(m); for (const dz of [-5, 5]) blk(gray, 108.4, 108.8, 522 + dz - 0.2, 522 + dz + 0.2, YC2, YC2 + 5.2); } }

      // the 500 kV lines: south at the foot of the east side, across the river then up the west side, via the east-side shoulder
      { const LINES = [[[249, 570], [360, 690], [515, 800], [535, 980], [525, 1160]], [[214, 470], [96, 392], [-190, 585], [-312, 640], [-470, 700], [-640, 760]], [[284, 470], [332, 522], [470, 470], [625, 500], [790, 545]]], pylonMesh = [], wires = [];
        const dense = L => { const o = [L[0]]; for (let k = 1; k < L.length; k++) { const a = L[k - 1], b = L[k], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 170); for (let j = 1; j <= n; j++) o.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); } return o; };
        for (const L0 of LINES) { const L = dense(L0), tops = [[-7, 0, 7].map(u => [L[0][0] + u, YP + 17.8, L[0][1]]).concat([[L[0][0] - 10, YP + 20, L[0][1]], [L[0][0] + 10, YP + 20, L[0][1]]])];
          L.forEach(([x, z], k) => { if (!k) return; const a = L[k - 1], b = L[Math.min(L.length - 1, k + 1)], ang = Math.atan2(b[0] - a[0], b[1] - a[1]), y = hAt(x, z) - 0.6, c = Math.cos(ang), s = Math.sin(ang);
            if (dAt(x, z) < W + 14 || riverDist(x, z) < 4 || insideShell(x, z, 6)) return; const e = y > 24 ? 1.5 : 1; pylonMesh.push([x, y, z, ang, e]); tops.push([-12, 0, 12].map(u => [x + c * u * e, y + 29 * e, z - s * u * e]).concat([[x + c * -14 * e, y + 42 * e, z - s * -14 * e], [x + c * 14 * e, y + 42 * e, z - s * 14 * e]])); }); // e: pylon one and a half times taller on the slopes
          for (let k = 0; k < tops.length - 1; k++) for (let f = 0; f < 5; f++) { const A = tops[k][f], B = tops[k + 1][f], fl = Math.hypot(B[0] - A[0], B[2] - A[2]) * (f < 3 ? 0.03 : 0.02);
            for (let j = 0; j < 12; j++) { const u = j / 12, v = (j + 1) / 12, p = t => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - fl * 4 * t * (1 - t), A[2] + (B[2] - A[2]) * t]; wires.push(...p(u), ...p(v)); } } }
        insts(h, 'pylonGES', { lattice: mat('latticeGantry', { alphaTest: 0.5, side: THREE.DoubleSide }, '#5a5e5c'), insul, fire: mat('lightRed', GLOWI) }, pylonMesh);
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute([...wires, ...railBars], 3)); const ls = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2e3230 })); ls.userData.cables = 1; h.scene.add(ls); }

      // ---------- May 1st in the estate: red banners on the street lampposts, a banner across the road at the entrance and the exit, the slogan in letters on a roof, the bus at its stop, the site stele ----------
      {
        for (const [i, txt] of [[P(K.exitVille) - 4, '1 МАЯ'], [P(K.entryVille) + 14, 'МИР · ТРУД · МАЙ']]) { const s = S[(i + N) % N], gr = marker(h, s); for (const sd of [-1, 1]) h.pose('boxMesh', gray, gr, [sd * (s.w + 2), 4.5, 0], 0.3, 9, 0.3); const n = 16, bg = new THREE.PlaneGeometry(2 * s.w + 4, 2.2, n, 1), bm = new THREE.Mesh(bg, mat('letters', DS, txt, '#b5241c', '#f0e8d0')); bm.position.set(0, 7.6, 0); bm.userData.dyn = 1; gr.add(bm); // V-30: the banner ripples (held at both ends)
          const pa = bg.attributes.position, ph = i * 0.7; TICK.push((dt, car, t) => { for (let k = 0; k <= n; k++) { const z = 0.45 * Math.sin(Math.PI * k / n) * Math.sin(t * 3.1 + k * 0.55 + ph); pa.setZ(k, z); pa.setZ(k + n + 1, z * 1.25); } pa.needsUpdate = true; }); }
        { let b = null, bd = 1e9; for (const q of tier1) { const d = Math.hypot(q[0] - 300, q[2] - 795); if (q[4] === 30 && d < bd) { bd = d; b = q; } } if (b) { const [x, y, z, r] = b, m = new THREE.Mesh(h.geo('boxMesh', 40, 5, 0.4), mat('letters', {}, 'СЛАВА ТРУДУ', '#8d918a', '#b5483c')); m.position.set(x + Math.sin(r) * 5.6, y + 15 + 0.6 + 2.5, z + Math.cos(r) * 5.6); m.rotation.y = r; h.scene.add(m); } } // on the roof of the building on the nearest street, facing the roadway
        { const s = S[P(K.streetSouth) + 8], [x, z] = edgePt(s, -1, s.w + 5.4), b = [[x, s.y + 1.7, z, h.across(s) + Math.PI / 2, 10.5, 2.4, 2.5, 0xe8e0c8], [x, s.y + 1.0, z, h.across(s) + Math.PI / 2, 10.6, 0.6, 2.56, 0xb5241c], [x, s.y + 0.35, z, h.across(s) + Math.PI / 2, 8, 0.7, 2.3, 0x1e2020]]; // the cream bus with a red band
          const m = inst(h, h.geo('blk'), mat('paint'), b), c = new THREE.Color(); b.forEach((p, k) => m.setColorAt(k, c.setHex(p[7]))); m.instanceColor.needsUpdate = true; }
        { const s = S[P(K.flatPart + 1)], [x, z] = edgePt(s, 1, s.w + 24), y = hAt(x, z), g2 = new THREE.Group(); g2.position.set(x, y, z); g2.rotation.y = h.across(s) + Math.PI * 0.75; h.scene.add(g2); // the site stele at the edge of the valley road
          h.pose('boxMesh', concS, g2, [0, 0.5, 0], 8, 1.4, 3.4); const st = h.pose('boxMesh', conc, g2, [0, 6.5, 0], 3.2, 11, 1.4); h.pose('boxMesh', mat('letters', {}, 'ГЭС 1974', '#8d918a', '#b5483c'), g2, [0, 3, 0.75], 7, 1.8, 0.1); } }

      const iG0 = iV1 + 4, iG1 = P(K.hangar0) - 34; // the valley double track: from the station to the ГЭС stop
      // ---------- the valley industrial zone, between the estate and the plant: concrete fence along the road, sheds, garages, stacks of panels and pipes, trucks, tower crane, the plant's control post, the tram terminus ----------
      { const iZ0 = iV1 + 6, iZ1 = iH0 - 22, po2 = mat('concretePO2', DS), tramA = P(K.flatPart) + 4, tramB = P(K.hangar0) - 34, sideOf = (i, sd) => !(sd > 0 && i > iG0 - 8 && i < iG1 + 8); // free side (the tram takes the east edge at the end)
        // the diamond-patterned concrete fence, on both sides, cut in front of the garrison gate
        for (const sd of [-1]) { let beg = -1; for (let i = iZ0; i <= iZ1 + 1; i++) { const s = S[i], [x, z] = edgePt(s, sd, s.w + 4.4), ok = i <= iZ1 && sideOf(i, sd) && !(sd < 0 && Math.abs(z - 540) < 12) && !booth(x + (sd > 0 ? 6 : 0), z); if (ok && beg < 0) beg = i; if (!ok && beg >= 0) { if (i - beg > 3) mixSlice(beg, i, (j, l) => ribbonFn(j, l, q => sd * (q.w + 4.4), 2.3, q => sd * (q.w + 4.4), -0.4, po2, 4)); beg = -1; } } }
        // ---------- V-21 to V-27: the double track "estate – plant", on the right of the road, from the station (iG0) to the ГЭС stop (iG1). Track 1 (freight) 10 m from the edge, track 2 (electric motor unit, under catenary) 13.6 m.
        //            It never crosses the roadway; the two trains are pure scenery (moving batch), restarted by two lap markers so that they are found again on each pass ----------
        { const iron = mat('paint', { c: 0x2a2c2e }), VO = [10, 13.6], gravel = mat('noise', {}, '#6e6a60', ['#7c786c', '#5e5a50']), trackLane = mat('laneGES');
          mixSlice(iG0, iG1, (i, l) => { for (const c of VO) { ribbonFn(i, l, s => s.w + c - 1.8, 0.08, s => s.w + c + 1.8, 0.08, trackLane, 2); for (const e of [-0.76, 0.76]) ribbonFn(i, l, s => s.w + c + e - 0.09, 0.24, s => s.w + c + e + 0.09, 0.24, iron, 4); }
            ribbonFn(i, l, s => s.w + 7.5, -0.7, s => s.w + 8.2, 0.08, gravel, 6); ribbonFn(i, l, s => s.w + 15.4, 0.08, s => s.w + 16.1, -0.7, gravel, 6); }); // the two ballast embankments
          for (const i of [iG0, iG1]) for (const c of VO) { const s = S[i], [x, z] = edgePt(s, 1, s.w + c), r = h.across(s); bl(x, s.y + 0.9, z, r, 2.6, 1.3, 0.6, 0xb5241c); bl(x, s.y + 0.9, z, r, 2.7, 0.4, 0.64, 0xf2f0e8); } // the buffer stops
          // the catenary of track 2: posts on the outside, bracket, wire
          { const wire = []; let prev = null; for (let i = iG0 + 3; i < iG1; i += 13) { const s = S[i], [x, z] = edgePt(s, 1, s.w + 16.6), r = h.across(s); bl(x, s.y + 3.6, z, r, 0.25, 7.2, 0.25, 0x55585a); bl(x - Math.cos(r) * 1.5, s.y + 6.8, z + Math.sin(r) * 1.5, r, 3.2, 0.12, 0.12, 0x55585a);
              const [fx, fz] = edgePt(s, 1, s.w + 13.6); if (prev) wire.push(prev[0], prev[1], prev[2], fx, s.y + 6.6, fz); prev = [fx, s.y + 6.6, fz]; }
            const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3)); h.scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2e3230 }))); }
          // the station, at the south end: a 64 m platform along track 2, its canopy, the ochre and white building with a central pavilion and clock, the footbridge over the tracks
          { const a = iG0 + 3, b = iG0 + 35, sm = S[(a + b) >> 1], r = h.across(sm) + Math.PI / 2, ux = sm.tx, uz = sm.tz, nx = -sm.tz, nz = sm.tx, Y = sm.y; // (ux, uz) along the track, (nx, nz) toward the right of the road
            const iM = (a + b) >> 1, G = (u, y, v, lu, ly, lv, col) => { const q = S[Math.round(iM + u / 2)]; bl(q.x - q.tz * (q.w + v), Y + y, q.z + q.tx * (q.w + v), h.across(q) + Math.PI / 2, lu, ly, lv, col); }; // u along the track (2 m per sample), v from the edge of the roadway: each piece follows the curve
            mixSlice(a, b, (i, l) => { ribbonFn(i, l, s => s.w + 15.5, 1, s => s.w + 20, 1, concC, 4); ribbonFn(i, l, s => s.w + 15.5, 0, s => s.w + 15.5, 1, concC, 4); }); // the quay
            for (let u = -28; u <= 28; u += 8) { G(u, 3, 18.6, 0.3, 4, 0.3, 0x55585a); G(u, 5.1, 17.6, 8.6, 0.3, 4.6, 0x7a3a30); } // the canopy, in bays following the platform
            for (const u of [-22, 0, 22]) { const q = S[Math.round(iM + u / 2)]; h.emis(IX.get(q), q.x - q.tz * (q.w + 17.6), Y + 4.6, q.z + q.tx * (q.w + 17.6), 0xffe2a8, 22, 0.9); } // three lamps under the canopy: real light fittings
            shell([sm.x + nx * (sm.w + 27), sm.z + nz * (sm.w + 27), r, 18, 8]);
            G(0, 3.5, 26.5, 32, 7, 10, 0xd8b070); G(0, 7.2, 26.5, 33, 0.5, 11, 0x6d726d); G(0, 5.2, 26, 11, 10.4, 12.4, 0xe0bc7c); G(0, 10.7, 26, 12, 0.6, 13.4, 0x6d726d); G(0, 12.2, 26, 3.4, 2.6, 3.4, 0xe0bc7c); G(0, 13.8, 26, 4, 0.5, 4, 0x7a3a30); // corps, toit, pavillon central, lanternon
            for (const e of [-1, 1]) { G(0, 12.2, 26 + e * 1.74, 2, 2, 0.1, 0xf2f0e8); G(0, 12.2, 26 + e * 1.8, 0.14, 0.9, 0.06, 0x1e2020); } // the clock, on the track side and the courtyard side
            for (let u = -14; u <= 14; u += 4) if (Math.abs(u) > 5) for (const e of [-1, 1]) G(u, 3.6, 26.5 + e * 5.05, 1.6, 3, 0.1, 0x2a3a4a); // the windows
            for (const e of [-4.2, 4.2]) G(e, 4, 19.7, 0.7, 8, 0.7, 0xf2f0e8); G(0, 2, 19.75, 3, 4, 0.2, 0x4a3424); // white pilasters and door, on the platform side
            { const m = new THREE.Mesh(h.geo('boxMesh', 11, 1.6, 0.2), mat('letters', {}, 'ВОКЗАЛ', '#e0bc7c', '#7a3a30')); m.position.set(sm.x + nx * (sm.w + 19.7), Y + 8.6, sm.z + nz * (sm.w + 19.7)); m.rotation.y = r; h.scene.add(m); }
            for (const e of [-1, 1]) G(22, 3.4, 11.8 + e * 5.6, 2.2, 6.8, 2.2, 0x8d918a); G(22, 7, 11.8, 2.4, 0.4, 13.4, 0x6d726d); for (const e of [-1, 1]) G(22 + e * 1.15, 7.8, 11.8, 0.1, 1.2, 13.4, 0x55585a); // the footbridge: two stair piers, the deck, its railings
            for (const u of [-20, -8, 10]) { G(u, 1.45, 19, 1.8, 0.1, 0.5, 0x6a4a2a); G(u, 1.22, 19, 1.6, 0.44, 0.12, 0x55585a); } } // trois bancs
          // the "ГЭС" stop, at the north end: a short platform and its shelter
          { const a = iG1 - 26, b = iG1 - 4; mixSlice(a, b, (i, l) => { ribbonFn(i, l, s => s.w + 15.5, 1, s => s.w + 18, 1, concC, 4); ribbonFn(i, l, s => s.w + 15.5, 0, s => s.w + 15.5, 1, concC, 4); });
            const s = S[iG1 - 15], [x, z] = edgePt(s, 1, s.w + 17.4), r = h.across(s) + Math.PI / 2; bl(x, s.y + 3.6, z, r, 9, 0.3, 2.4, 0x6d726d); for (const e of [-4, 4]) bl(x + s.tx * e, s.y + 2.3, z + s.tz * e, r, 0.25, 2.6, 0.25, 0x55585a);
            const m = new THREE.Mesh(h.geo('boxMesh', 4, 1.1, 0.12), mat('letters', {}, 'ГЭС', '#f2f0e8', '#2a2c2a')); m.position.set(x, s.y + 4.4, z); m.rotation.y = r; h.scene.add(m); }
          // the path of each track: points, altitude, cumulative abscissa
          const CH = VO.map(c => { const P2 = [], D = [0]; for (let i = iG0; i <= iG1; i++) { const s = S[i], [x, z] = edgePt(s, 1, s.w + c); P2.push([x, s.y + 0.2, z]); if (P2.length > 1) { const q = P2[P2.length - 2]; D.push(D[D.length - 1] + Math.hypot(x - q[0], z - q[2])); } } return { P: P2, D, L: D[D.length - 1] }; });
          const overLane = (ch, d) => { const n = ch.P.length - 1; d = Math.max(0, Math.min(ch.L - 0.01, d)); let k = Math.min(n - 1, d / ch.L * n | 0); while (k > 0 && ch.D[k] > d) k--; while (k < n - 1 && ch.D[k + 1] < d) k++;
            const a = ch.P[k], b = ch.P[k + 1], t = (d - ch.D[k]) / (ch.D[k + 1] - ch.D[k] || 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, Math.atan2(-(b[2] - a[2]), b[0] - a[0])]; };
          // the rolling stock, in local cubes (x along the body, the front toward +x): dimensions of the train at its original standstill
          const V = (L, f) => { const o = mob(), T = (dx, dy, lx, ly, lz, col, r = 0, dz = 0) => mb(o, dx, dy, dz, r, lx, ly, lz, col); T(0, 0.6, L - 0.6, 0.6, 2.4, 0x1e2020); for (const e of [-1, 1]) T(e * (L / 2 - 2.6), 0.3, 3, 0.5, 2, 0x161818); f(T); return { o, L }; };
          const loco = () => V(17.6, T => { T(0, 2.4, 17, 2.8, 2.9, 0x2f5a3c); T(0, 3.95, 9, 0.5, 2.5, 0x274a32); for (const e of [-1, 1]) { T(e * 6.4, 4.2, 4, 1.5, 2.9, 0x2f5a3c); T(e * 6.4, 4.35, 4.04, 0.7, 2.94, 0x2a3a4a); T(e * 8.56, 1.4, 0.3, 0.9, 2.7, 0xb5241c); T(e * 8.52, 3.4, 0.14, 0.5, 0.5, 0xfff4c0); for (const g of [-0.9, 0.9]) T(e * 8.56, 2.1, 0.14, 0.34, 0.34, 0xfff4c0, 0, g); }
            T(0, 1.5, 17.04, 0.4, 2.94, 0xd8b820); T(0, 2.9, 1.2, 1.2, 2.96, 0xb5241c); });
          const tank = () => V(12.6, T => { T(0, 2.5, 11, 2.6, 2.6, 0x3a3e40); T(0, 4, 1.4, 0.6, 1.4, 0x3a3e40); T(0, 2.5, 11.04, 0.5, 2.64, 0xe8e4d8); });
          const dumpTruck = () => V(12.6, T => { T(0, 2, 12, 2.2, 2.8, 0x7a3a2c); T(0, 3.25, 11.4, 0.5, 2.3, 0xb4aa98); });
          const covered = () => V(12.6, T => { T(0, 2.6, 12, 3.4, 2.8, 0x6a4a34); T(0, 4.4, 12.2, 0.3, 3, 0x6d726d); T(0, 2.4, 2.4, 2.6, 2.84, 0x4a3424); });
          const flatPart = () => V(12.6, T => { T(0, 1.05, 12.2, 0.3, 2.8, 0x5a4a3a); for (const r of [0, Math.PI / 4]) T(0, 2.1, 3.7, 1.7, 3.7, 0xc8562a, r); T(0, 2.3, 1.3, 2.3, 1.3, 0x8a8e88); for (const e of [-3.4, 3.4]) T(e, 1.5, 0.3, 0.7, 2.8, 0x6a4a2a); }); // a turbine wheel, on its chocks
          const powerCar = pantograph => V(13.4, T => { T(0, 1.9, 13, 2.4, 2.5, 0xb5483c); T(0, 2.5, 13.1, 0.9, 2.56, 0xe8e0c8); T(0, 2.6, 11, 0.5, 2.6, 0x2a3a4a); T(0, 3.3, 12, 0.3, 2.3, 0x6d726d); if (pantograph) T(1, 4.8, 0.1, 2.8, 1.6, 0x2a2c2e); for (const e of [-1, 1]) T(e * 6.56, 1.3, 0.12, 0.4, 0.4, 0xfff4c0); });
          // a train: its vehicles, its track; d = abscissa of its middle, target = where it is going; it accelerates, rolls at v and brakes to stop at its outTarget. The first vehicle always leads: at the start the train turns around (nobody sees it then)
          const trainSet = (ch, vs, v, d0) => { const Lr = vs.reduce((a, q) => a + q.L + 0.8, 0), R = { ch, vs, v, Lr, d: d0 < 0 ? ch.L + d0 - Lr / 2 : d0 + Lr / 2, outTarget: 0, vc: 0, direction: d0 < 0 ? -1 : 1, x: 0, y: 0, z: 0, south: Lr / 2 + 6, north: ch.L - Lr / 2 - 6 }; R.outTarget = R.d;
            R.va = c => { R.outTarget = c; if (Math.abs(c - R.d) > 1) R.direction = Math.sign(c - R.d); R.pose = 0; };
            R.stepSec = dt => { const e = R.outTarget - R.d, vt = Math.sign(e) * Math.min(R.v, Math.sqrt(2 * 0.9 * Math.abs(e))); R.vc += Math.max(-1.6 * dt, Math.min(1.6 * dt, vt - R.vc)); if (Math.abs(e) < 0.05 && Math.abs(R.vc) < 0.3) R.vc = 0; R.d += R.vc * dt;
              if (R.vc || !R.pose) { R.pose = 1; let c = Lr / 2; for (const q of vs) { c -= q.L / 2 + 0.4; const [x, y, z, ry] = overLane(ch, R.d + R.direction * c); mobA(q.o, x, y, z, ry + (R.direction < 0 ? Math.PI : 0)); if (q === vs[0]) { R.x = x; R.y = y; R.z = z; } c -= q.L / 2 + 0.4; } } };
            return R; };
          const RA = trainSet(CH[1], [powerCar(1), powerCar(0)], 16.7, 30), RB = trainSet(CH[0], [loco(), flatPart(), covered(), tank(), dumpTruck(), tank(), covered()], 11, -8); // A at the platform in the station, B at the ГЭС stop
          const smokes = puffFn(0, 0, 0, [0.3, 0.3, 0.32], 0.3, 4, 2.4, 6, 3, 0.3); // the locomotive's exhaust, when it rolls
          const headlight = Rm => { const l = h.emis(iG0, 0, -99, 0, 0xfff0c0, 34, 1.2); return () => { const dT = Rm.d + Rm.direction * (Rm.Lr / 2 + 3), [x, y, z] = overLane(Rm.ch, dT); l.x = x; l.y = y + 3; l.z = z; l.i = iG0 + Math.round(Math.max(0, Math.min(1, dT / Rm.ch.L)) * (iG1 - iG0)); }; }, phA = headlight(RA), phB = headlight(RB); // the headlights: an engine light placed 3 m in front of the head of each train, lighting the track, the ballast and the road
          TICK.push(dt => { RA.stepSec(dt); RB.stepSec(dt); phA(); phB(); smokes.p[0] = RB.x; smokes.p[1] = RB.y + 4.6; smokes.p[2] = RB.z; smokes.off = !RB.vc; });
          bollard(60, () => { RA.va(RA.north); RB.va(RB.d > RB.ch.L / 2 ? RB.south : RB.north); }); // leaving the start line: A heads toward the plant (overtaken in the valley), B reverses direction (it is crossed on one lap, overtaken on the next)
          bollard(1300, () => RA.va(RA.south)); // during the climb, where it is not seen: A returns to the station for the next lap
          h.trains = [RA, RB]; } // for the sound (moving sources)
        // an object every 40 m on each side, behind the fence: they are made to rotate
        const hangar = (x, y, z, r, c) => { bl(x, y + 4, z, r, 34, 8, 13, c); bl(x, y + 8.3, z, r, 35, 0.7, 14, 0x4a4e50); bl(x + Math.sin(r) * 6.6, y + 2.6, z + Math.cos(r) * 6.6, r, 6, 5.2, 0.3, 0x3a3c3e); bl(x + Math.sin(r) * 6.6, y + 6.4, z + Math.cos(r) * 6.6, r, 30, 1.2, 0.2, 0x9aa4a8); };
        const garages = (x, y, z, r) => { for (let k = -3; k <= 3; k++) bl(x + Math.cos(r) * k * 4.3, y + 1.4, z - Math.sin(r) * k * 4.3, r, 4, 2.8, 6, k & 1 ? 0x6e7a7a : 0x7a6a5a); };
        const piers = (x, y, z, r) => { for (let k = 0; k < 6; k++) bl(x, y + 0.2 + k * 0.34, z, r, 6, 0.26, 3, 0xb0b2aa); for (let k = 0; k < 4; k++) bl(x + Math.cos(r) * 9 + Math.sin(r) * (k - 1.5) * 1.3, y + 0.6, z - Math.sin(r) * 9 + Math.cos(r) * (k - 1.5) * 1.3, r, 8, 1.1, 1.1, 0x8a8e88); };
        const truckList = (x, y, z, r) => { for (let k = -1; k <= 1; k++) { const cx = x + Math.cos(r) * k * 4.4, cz = z - Math.sin(r) * k * 4.4; bl(cx - Math.sin(r) * 1.4, y + 1.9, cz - Math.cos(r) * 1.4, r, 2.5, 2.4, 5.2, k ? 0x7a8a8e : 0x5a6844); bl(cx + Math.sin(r) * 2.6, y + 1.6, cz + Math.cos(r) * 2.6, r, 2.4, 2.2, 2.2, k ? 0xd86a1e : 0x4a5a3a); bl(cx, y + 0.5, cz, r, 2.5, 0.9, 7.6, 0x1e2020); } };
        const tanks = (x, y, z, r) => { for (let k = -1; k <= 1; k++) { bl(x + Math.cos(r) * k * 8, y + 5, z - Math.sin(r) * k * 8, r + 0.4, 5.4, 10, 5.4, 0xa8aeaa); bl(x + Math.cos(r) * k * 8, y + 10.2, z - Math.sin(r) * k * 8, r + 0.4, 4.4, 0.5, 4.4, 0x7d817a); } };
        const TYPES = [[hangar, 17, 7, 0x7a8a90], [piers, 9, 3], [truckList, 7, 5], [garages, 15, 3.5], [hangar, 17, 7, 0x8a8478], [tanks, 12, 4], [piers, 9, 3]]; let nt = 0;
        for (let i = iZ0 + 6; i < iH0 - 75; i += 20) for (const sd of [-1, 1]) { if (!sideOf(i, sd)) continue; const s = S[i + (sd > 0 ? 10 : 0)], [f, hl, hp, c] = TYPES[nt % TYPES.length], [x, z] = edgePt(s, sd, s.w + (sd > 0 ? 14 : 6.5) + hp), r = h.across(s) + Math.PI / 2 + (sd > 0 ? Math.PI : 0);
          if (!base(x, z) && !worksite(x, z) && !booth(x, z) && place(x, z, r, hl, hp, 5.5)) { f(x, hAt(x, z) + 0.05, z, r, c); nt++; } }
        for (let i = iZ0 + 2; i < iH0 - 20; i += 9) for (const sd of [-1, 1]) for (const off of [30, 52, 74]) { const s = S[i], [f, hl, hp, c] = TYPES[nt % TYPES.length], [x, z] = edgePt(s, sd, s.w + off), r = h.across(s) + Math.PI / 2 + (sd > 0 ? Math.PI : 0), y = hAt(x, z);
          if (Math.abs(y - s.y) < 6 && !base(x, z) && !worksite(x, z) && !booth(x, z) && place(x, z, r, hl, hp, 8)) { f(x, y + 0.05, z, r, c); nt++; } }
        // on the left, over the fence: the site's concrete plant (tower, three silos, rising belt) then a yellow gantry crane over its panel yard
        { const s = S[iZ0 + 70], [x, z] = edgePt(s, -1, s.w + 20), r = h.across(s) + Math.PI / 2, Y = hAt(x, z), T = (du, dy, dv, a, b, c, col) => bl(x + s.tx * du - s.tz * dv, Y + dy, z + s.tz * du + s.tx * dv, r, a, b, c, col);
          if (!worksite(x, z) && !base(x, z) && place(x, z, r, 16, 8)) { T(0, 11, 0, 8, 22, 8, 0xa8aaa4); T(0, 20, 0, 8.1, 2, 8.1, 0xb5241c); T(0, 23, 0, 9, 2, 9, 0x6d726d); for (let k = 0; k < 3; k++) { T(-8 - k * 5, 8, 2, 4.4, 16, 4.4, 0xc8ccc4); T(-8 - k * 5, 16.4, 2, 3, 0.8, 3, 0x6d726d); } for (let k = 0; k < 6; k++) T(6 + k * 3, 2 + k * 3, -1, 3.4, 0.8, 1.6, 0x55585a); T(22, 1.5, -1, 5, 3, 5, 0x8a8e88); } }
        { const s = S[iZ0 + 150], [x, z] = edgePt(s, -1, s.w + 22), r = h.across(s) + Math.PI / 2, Y = hAt(x, z), T = (du, dy, dv, a, b, c, col) => bl(x + s.tx * du - s.tz * dv, Y + dy, z + s.tz * du + s.tx * dv, r, a, b, c, col);
          if (!worksite(x, z) && !base(x, z) && place(x, z, r, 14, 12)) { for (const e of [-1, 1]) { for (const f of [-1, 1]) T(f * 3, 7, e * 11, 0.7, 14, 0.7, 0xd8a020); T(0, 0.5, e * 11, 9, 1, 1.2, 0xd8a020); } T(0, 14.6, 0, 2.6, 1.8, 26, 0xd8a020); T(0, 12.8, 4, 3, 1.8, 3, 0x3a3e3c); T(0, 9, 4, 0.2, 6, 0.2, 0x2a2c2e); for (let k = 0; k < 4; k++) for (let n = 0; n < 5; n++) T(-8 + k * 5.4, 0.2 + n * 0.34, -3, 4.6, 0.26, 3, 0xb0b2aa); } }
        // the approach to the plant: an avenue of red flags on the left over the last 150 metres
        for (let i = iH0 - 76; i < iH0 - 6; i += 7) { const s = S[i], [x, z] = edgePt(s, -1, s.w + 3.4), y = Math.max(s.y, hAt(x, z)), r = h.across(s); bl(x, y + 4.5, z, r, 0.18, 9, 0.18, 0x8a8e88); flagCube(x, y + 8, z, 2.2, 1.4); } // V-41: they flap in the wind
        // the plant's control post, across the road: two piers, a lintel with the sign, the booth, the barrier raised
        { const s = S[P(K.exitVille + 6)], r = h.across(s), o = s.w + 2.2; for (const sd of [-1, 1]) { const [x, z] = edgePt(s, sd, o); bl(x, s.y + 4.2, z, r, 2.4, 8.4, 2.4, 0x8d918a); bl(x, s.y + 0.6, z, r, 2.8, 1.2, 2.8, 0x6d726d); }
          bl(s.x, s.y + 9.2, s.z, r, 2 * o + 4, 1.8, 2.6, 0x8d918a); const m = new THREE.Mesh(h.geo('boxMesh', 2 * o - 2, 1.5, 0.15), mat('letters', {}, 'ГЭС-74 · ПРОПУСК', '#8d918a', '#b5483c')); m.position.set(s.x - s.tx * 1.4, s.y + 9.2, s.z - s.tz * 1.4); m.rotation.y = r + Math.PI; h.scene.add(m);
          const [gx, gz] = edgePt(s, 1, o + 4); bl(gx, s.y + 1.6, gz, r, 3, 3.2, 3, 0xb8b4a4); bl(gx, s.y + 3.4, gz, r, 3.6, 0.3, 3.6, 0x6d726d); bl(gx - Math.cos(r) * 1.55, s.y + 2, gz + Math.sin(r) * 1.55, r, 0.1, 1.2, 1.8, 0x2a3a4a); // the booth and its window
          const [bx, bz] = edgePt(s, 1, o - 1.6); bl(bx, s.y + 3.4, bz, r, 0.25, 6.2, 0.25, 0xc8281e); bl(bx, s.y + 1.4, bz, r, 0.3, 0.9, 0.3, 0xf2f0e8); bl(bx, s.y + 4.4, bz, r, 0.3, 0.9, 0.3, 0xf2f0e8); } // the barrier, raised
        }

      // ---------- the climb and the descent: logs, microwave relay, pioneer camp on the shoulder, tank on its plinth at the entrance to the estate, viewpoint, haystacks and palisades ----------
      { // the ramp's logging site: a clearing of stumps on the flattest side, four log stacks, the log truck, the sign
        const i = P(K.rampSec + 3), s = S[i], ec = sd => Math.abs(hAt(...edgePt(s, sd, s.w + 26)) - s.y), sd = ec(-1) < ec(1) ? -1 : 1, r = h.across(s) + Math.PI / 2, [cx, cz] = edgePt(s, sd, s.w + 26); clair.push([cx, cz, 34]);
        for (let j = 0; j < 4; j++) { const q = S[i + (j % 2 ? 13 : -13)], [x, z] = edgePt(q, sd, q.w + (j < 2 ? 8 : 17)), y = hAt(x, z); for (let n = 0; n < 3; n++) bl(x, y + 0.6 + n * 1.2, z, r + (j % 2 ? 0.12 : -0.12), 11, 1.2, 3.6 - n * 1.1, 0x7a5a3a); }
        { const q = S[i + 2], [x, z] = edgePt(q, sd, q.w + 4.6), y = q.y; bl(x, y + 0.6, z, r, 11, 0.8, 2.4, 0x1e2020); bl(x + q.tx * 4.3, y + 2, z + q.tz * 4.3, r, 2.3, 2.3, 2.4, 0x3a6a9a); bl(x - q.tx * 1.3, y + 1.9, z - q.tz * 1.3, r, 8.4, 1.6, 2.2, 0x7a5a3a); }
        { const q = S[i + 6], [ax, az] = edgePt(q, sd, q.w + 11), g = new THREE.Group(), axis = new THREE.Vector3(q.tx, 0, q.tz); g.position.set(ax, hAt(ax, az) - 0.4, az); g.userData.dyn = 1; h.scene.add(g); let ta = -1; // V-58: a larch being felled in the clearing; it falls far from the road when you leave the bridge, it is on the ground before the bend
          h.pose('cedar', mat('conifer', {}, '#5e7a44'), g, [0, 13.2, 0]).scale.setScalar(1.2); h.pose('trunk', h.mat('trunk'), g, [0, 3.1, 0]).scale.setScalar(1.2);
          bollard(i - 50, () => { ta = 0; }); bollard(i + 300, () => { ta = -1; g.quaternion.identity(); }); TICK.push(dt => { if (ta >= 0 && ta < 3) { ta += dt; g.quaternion.setFromAxisAngle(axis, sd * Math.min(1.5, 1.5 * (ta / 2.4) ** 2.6)); } }); h.tree = () => ta; }
        { const q = S[i - 14], [x, z] = edgePt(q, sd, q.w + 4.6), m = new THREE.Mesh(h.geo('boxMesh', 7, 1.5, 0.15), mat('letters', {}, 'ЛЕСПРОМХОЗ', '#3a5a3a', '#f0e8d0')); m.position.set(x, q.y + 3.4, z); m.rotation.y = h.across(q) + Math.PI; h.scene.add(m); for (const e of [-3, 3]) bl(x + Math.cos(h.across(q)) * e, q.y + 1.7, z - Math.sin(h.across(q)) * e, h.across(q), 0.2, 3.4, 0.2, 0x3a3e3c); } }
      { // the ravine hairpin: a large red sign on the line of the approach, outside the bend, the forest cleared around
        let ia = P(K.ravine); for (let i = P(K.rampSec + 4); i < P(K.traverse); i++) if (Math.abs(S[i].k) > Math.abs(S[ia].k)) ia = i;
        const s = S[ia], e = S[ia - 45], [x, z] = edgePt(s, s.k > 0 ? -1 : 1, s.w + 15), y = Math.max(hAt(x, z), s.y), ry = Math.atan2(e.x - x, e.z - z), m = new THREE.Mesh(h.geo('boxMesh', 26, 5, 0.3), mat('letters', {}, 'СЛАВА ТРУДУ!', '#b5241c', '#f0e8d0')); clair.push([x, z, 20]);
        m.position.set(x, y + 6.5, z); m.rotation.y = ry; h.scene.add(m); for (const u of [-10, 10]) bl(x + Math.cos(ry) * u, y + 2, z - Math.sin(ry) * u, ry, 0.5, 4, 0.5, 0x6d726d); }
      { const x = -520, z = 330, y = hAt(x, z) - 1, tre = mat('latticeGantry', { alphaTest: 0.5, side: THREE.DoubleSide }, '#b5483c'); blk(tre, x - 2.5, x + 2.5, z - 2.5, z + 2.5, y, y + 22); blk(mat('latticeGantry', { alphaTest: 0.5, side: THREE.DoubleSide }, '#e8e4d8'), x - 1.8, x + 1.8, z - 1.8, z + 1.8, y + 22, y + 44); blk(tre, x - 1.1, x + 1.1, z - 1.1, z + 1.1, y + 44, y + 62);
        blk(mat('lightRed', GLOWI), x - 0.6, x + 0.6, z - 0.6, z + 0.6, y + 62, y + 63.2); } // the relay: red and white lattice, light
      { // the pioneer camp, on the ledge between the two switchbacks: entrance gantry, huts on plinths, flag mast, play field
        const cx = 396, cz = 362, y0 = hAt(cx, cz), cab = [[], []], rc = 0.3, c = Math.cos(rc), sn = Math.sin(rc);
        for (let k = 0; k < 8; k++) { const u = (k % 4 - 1.5) * 12.5, v = k < 4 ? -8 : 8, x = cx + u * c + v * sn, z = cz - u * sn + v * c; if (dAt(x, z) < W + 10) continue; cab[k & 1].push([x, hAt(x, z) + 0.1, z, rc]); }
        cab.forEach((l, j) => insts(h, 'hutPio', { intoWall: mat('paint', { c: [0x6f9a8e, 0xc8b070][j] }), roofM: mat('paint', { c: 0x7a3a30 }), plinth: concS, pane: mat('paneDark') }, l));
        { const s = S[P(86)], [x, z] = edgePt(s, -1, s.w + 6.5), y = hAt(x, z), g2 = new THREE.Group(); g2.position.set(x, y, z); g2.rotation.y = h.across(s) + Math.PI / 2 - 0.35; h.scene.add(g2); // the entrance gantry, facing those coming down
          for (const sd of [-1, 1]) h.pose('boxMesh', mat('paint', { c: 0xe8e4d8 }), g2, [sd * 7.4, 3, 0], 0.6, 6, 0.6); h.pose('boxMesh', mat('letters', {}, 'ПИОНЕРСКИЙ ЛАГЕРЬ', '#3a6a9a', '#f0e8d0'), g2, [0, 6, 0], 16, 1.8, 0.2); h.pose('boxMesh', mat('paint', { c: 0xb5241c }), g2, [0, 7.4, 0], 2.2, 1.4, 0.1); }
        bl(cx, y0 + 5, cz + 6, 0, 0.2, 10, 0.2, 0x8a8e88); flagCube(cx, y0 + 9, cz + 6, 3, 1.8); puffFn(cx - 12, y0 + 4.5, cz - 6, [0.78, 0.78, 0.8], 0.28, 7, 2.2, 4, 2.6, 0.5); } // V-75: the flag flies, a cooking smoke rises
      { // the tank on its plinth, a memorial at the entrance to the estate
        const s = S[P(K.entryVille) - 14], [x, z] = edgePt(s, 1, s.w + 12), y = hAt(x, z), r = h.across(s) + 0.5; bl(x, y + 1.2, z, r, 9, 2.6, 5.4, 0x8d918a); bl(x, y + 0.2, z, r, 12, 0.6, 8, 0x6d726d); bl(x, y + 3.2, z, r, 6.4, 1.3, 3.2, 0x4a5a3a); bl(x - Math.cos(r) * 0.5, y + 4.3, z + Math.sin(r) * 0.5, r, 2.6, 1, 2.2, 0x4a5a3a); bl(x + Math.cos(r) * 2.8, y + 4.4, z - Math.sin(r) * 2.8, r, 4.4, 0.26, 0.26, 0x3a4a2e); bl(x, y + 2.7, z, r, 6.8, 0.7, 3.5, 0x2a2e26); }
      { // the hairpin viewpoint: slab, railing, two cars, an orientation table
        const s = S[P(K.belvedere) + 2], [x, z] = edgePt(s, 1, s.w + 9), y = s.y, r = h.across(s); bl(x, y - 1.4, z, r, 14, 3, 12, 0x8d918a); bl(x + Math.cos(r) * 6.8, y + 0.6, z - Math.sin(r) * 6.8, r, 0.2, 1.1, 12, 0xe8761e); bl(x, y + 0.6, z, r, 1.4, 1, 1.4, 0x6d726d); }
      { // the site's aggregate quarry, mountain side: a gravel floor, a three-bench working face, the crusher and its belt, two heaps, two dump trucks
        const rockQ = mat('noise', DS, '#b4aa98', ['#c6bca8', '#9c9280', '#8a8070', '#d2c8b4']), gravel = mat('noise', {}, '#c2baa8', ['#d0c8b6', '#aea694', '#dcd4c2']), kq = s => { const i = IX.get(s); return Math.min(smooth(QA, QA + 12, i), 1 - smooth(QB - 12, QB, i)); };
        mixSlice(QA, QB, (i, l) => { ribbonFn(i, l, s => -(s.w + 5), 0.04, s => -(s.w + 27), 0.04, gravel, 6);
          for (let k = 0; k < 3; k++) { const o0 = 26 + 12 * k, o1 = o0 + (k < 2 ? 12 : 14); ribbonFn(i, l, s => -(s.w + o0), s => 8 * k * kq(s) - 1, s => -(s.w + o0 + 1.5), s => 8 * (k + 1) * kq(s), rockQ, 8); ribbonFn(i, l, s => -(s.w + o0 + 1.5), s => 8 * (k + 1) * kq(s), s => -(s.w + o1), s => 8 * (k + 1) * kq(s), gravel, 6); }
          ribbonFn(i, l, s => -(s.w + 64), s => 24 * kq(s), s => -(s.w + 74), -3, rockQ, 8); });
        const sm = S[(QA + QB) >> 1], gr = marker(h, sm), X = -(sm.w + 15), tin = mat('tinOrange', {}, '#a8623a'), iron = mat('paint', { c: 0x3a3e3c }), P1 = (m, p, w, ht, d) => { const o = h.pose('boxMesh', m, gr, p, w, ht, d); o.castShadow = true; return o; };
        for (const dx of [-2.6, 2.6]) for (const dz of [-2.2, 2.2]) P1(iron, [X + dx, 2.6, dz], 0.5, 5.2, 0.5); // the crusher on stilts: body, hopper, belt sloping toward the heap
        { const [px, pz] = edgePt(sm, -1, sm.w + 15); puffFn(px, sm.y + 14, pz, [0.8, 0.75, 0.64], 0.26, 8, 10, 4, 2.2, 1.5); } // V-77: a dust cloud above the crusher, slow and high (bend zone)
        P1(tin, [X, 8.2, 0], 6.4, 6, 5.4); P1(tin, [X, 12.2, 0], 8.6, 2, 7.4); P1(iron, [X, 5.6, -11], 1.5, 0.5, 19).rotation.x = -0.36; 
        for (const [z, r, ht] of [[-24, 7.5, 6.5], [22, 6, 5]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(r, ht, 9), gravel); c.position.set(X + 1, ht / 2 - 0.2, z); c.castShadow = true; gr.add(c); }
        for (const [x, z, ry] of [[X + 7, 10, 0.25], [X + 5, 34, -0.5]]) { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; gr.add(b); // deux camions-bennes : cabine orange, benne grise
          h.pose('boxMesh', mat('paint', { c: 0xd8621e }), b, [0, 2.1, -2.7], 2.5, 2.3, 2.1); h.pose('boxMesh', mat('paint', { c: 0x7a7e7a }), b, [0, 2.5, 1.3], 2.7, 1.7, 4.8).castShadow = true; h.pose('boxMesh', iron, b, [0, 0.8, 0], 2.5, 1, 7.4); }
        { h.pose('boxMesh', mat('letters', {}, 'КАРЬЕР № 2', '#8d918a', '#2a2c2a'), gr, [-(sm.w + 5.5), 3.2, 30], 0.12, 1.5, 7); for (const dz of [-3, 3]) h.pose('boxMesh', iron, gr, [-(sm.w + 5.5), 1.6, 30 + dz], 0.2, 3.2, 0.2); } }

      { const m = inst(h, h.geo('blk'), mat('paint'), paintedBlocks), c = new THREE.Color(); paintedBlocks.forEach((p, k) => m.setColorAt(k, c.setHex(p[7]))); m.instanceColor.needsUpdate = true; }
      { const L = lamps.filter(([x, , z]) => !insideShell(x, z, 1.2)); insts(h, 'lamppostGES', { shaft: gray, lampObj: mat('lampObj', GLOWI) }, L); for (const [x, y, z, r] of L.filter(([x, , z]) => cite(x, z))) { FLAGS.push([mb(mob(), 0.55, 0, 0, 0, 0.9, 2.6, 0.06, 0xb5241c), x, y + 6.2, z, r, 0.16, (x * 12.9898 + z * 78.233) % 6.28]); } } // V-30: they stir in the wind // the red May 1st banners, on the estate's lampposts

      // ---------- the forest: touge trees (conical crown on a bare trunk), by day; light larches and dark cembra pines on the slopes, birches on the valley floor ----------
      { const palePine = [], vtx = [], shafts = [], buoyIdx = [];
        const free = (x, z, m) => dAt(x, z) > W + m && !sqr(nearest(x, z), x, z, 78) && riverDist(x, z) > 6 && !cite(x, z) && !booth(x, z) && !powerPlant(x, z) && !base(x, z) && !worksite(x, z) && !insideShell(x, z, 7) && !clair.some(([cx, cz, r]) => (x - cx) ** 2 + (z - cz) ** 2 < r * r);
        const tree = (x, z, k) => { const y = hAt(x, z) - 0.4, dv = downstream(x, z); if (dv < 30 && y < FULL + 1.5) return; if (dv > -30 && dv < 95 && Math.abs(x) < 262 && y < YC + 3) return; if (y > 250 && rnd() < (y - 250) / 90) return; // nothing below the full reservoir level, nothing on the wall, the forest thins toward the ridges
          const isFar = dAt(x, z) > 90; (rnd() < 0.62 ? palePine : vtx).push([x, y + (isFar ? 8.2 : 11) * k, z, rnd() * 6, k]); if (!isFar) shafts.push([x, y + 2.6 * k, z, 0, k]); };
        // the dense row along the road, where it runs through forest; open on the valley side in the gaps of the upper crossing, on the east descent and facing the wall
        const forest = i => (i > iP1 + 20 && i < T0 - 8) || (i > iM1 + 30 && i < iV0 - 25), valley = i => i < T0 ? (within(i, K.ravine + 2, K.tunnel) ? 1 : -1) : (within(i, K.hairpinHigh, K.belvedere) ? -1 : 1); // the valley side
        const isOpen = (i, sd) => sd === valley(i) && (within(i, K.abutment, K.entryVille) || [K.traverse + 2, K.traverse + 4, K.traverse + 6].some(k => Math.abs(i - P(k)) < 26));
        for (let i = 0; i < N; i += 3) { if (!forest(i)) continue; for (const sd of [-1, 1]) { if (isOpen(i, sd)) continue; const [x, z] = edgePt(S[i], sd, S[i].w + 5 + rnd() * 7); if (dAt(x, z) > W + 4 && free(x, z, 4)) tree(x, z, 0.8 + rnd() * 0.6); } }
        for (let k = 0; k < 15000; k++) { const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]); if (!free(x, z, 9)) continue; const dv = downstream(x, z), flatPart = dv > 40 && x > pl(XW, z) - 8 && x < pl(XE, z) + 8;
          if (flatPart) { if (rnd() < 0.3 && riverDist(x, z) > 14 && !insideShell(x, z, 6)) buoyIdx.push([x, hAt(x, z) - 0.3, z, rnd() * 6, 0.8 + rnd() * 0.5]); continue; }
          const p = nearest(x, z); if (p.d < 60 && isOpen(p.i, valley(p.i)) && (z - p.s.z) * p.s.tx - (x - p.s.x) * p.s.tz > 0 === valley(p.i) > 0) continue; // the gaps stay open in depth
          tree(x, z, 0.9 + rnd() * 0.8); }
        // birches in an avenue along the street and the valley road, and around the buildings
        for (let i = iV0 - 40; ((i - iV0 + 40 + N) % N) < ((P(K.flatPart + 2) - iV0 + 40 + N) % N); i = (i + 9) % N) for (const sd of [-1, 1]) { if (inVille(i) && ((i / 9 | 0) + (sd > 0)) % 2) continue; if (sd > 0 && !inVille(i) && i > iG0 - 8 && i < iG1 + 8) continue; /* no birches between the road and the track: the trains can be seen */ const [x, z] = edgePt(S[i], sd, S[i].w + (inVille(i) ? 1.9 : 6.5)); if (dAt(x, z) > W + 1.2 && riverDist(x, z) > 6 && !insideShell(x, z, 4) && !booth(x, z) && !base(x, z) && !worksite(x, z)) buoyIdx.push([x, hAt(x, z) - 0.3, z, rnd() * 6, 0.9 + rnd() * 0.4]); }
        { const mc = Object.assign(mat('conifer', {}, '#5e7a44').clone(), { vertexColors: true }), FAR = 150, CELL = 250, T = [...palePine.map(q => [q, 1]), ...vtx.map(q => [q, 0])]; // beyond 150 m from the track: a 4-sided cone with no base (10 vertices instead of 23); tint per tree in a vertex colour, in 250 m tiles (the engine no longer splits instances below 100 000 vertices: without tiles, everything would be drawn everywhere)
        for (const [G0, sel] of [[h.geo('cedar'), d => d <= FAR], [new THREE.ConeGeometry(3.6, 15, 4, 1, true), d => d > FAR]]) { const cell = new Map(); for (const t of T) if (sel(dAt(t[0][0], t[0][2]))) { const k = Math.floor(t[0][0] / CELL) + ':' + Math.floor(t[0][2] / CELL); (cell.get(k) || cell.set(k, []).get(k)).push(t); }
          const A = G0.attributes, n = A.position.count, ix = G0.index.array;
          for (const L of cell.values()) { const P3 = new Float32Array(n * L.length * 3), N3 = new Float32Array(n * L.length * 3), UV = new Float32Array(n * L.length * 2), C3 = new Float32Array(n * L.length * 3), I = new Uint32Array(ix.length * L.length);
            L.forEach(([[x, y, z, r, k], kbdEl], e) => { const cs = Math.cos(r), sn = Math.sin(r), col = kbdEl ? [1, 1, 1] : [0.54, 0.57, 0.69]; for (let v = 0; v < n; v++) { const px = A.position.getX(v) * k, py = A.position.getY(v) * k, pz = A.position.getZ(v) * k, nx = A.normal.getX(v), nz = A.normal.getZ(v), o = (e * n + v) * 3;
                P3[o] = x + cs * px + sn * pz; P3[o + 1] = y + py; P3[o + 2] = z - sn * px + cs * pz; N3[o] = cs * nx + sn * nz; N3[o + 1] = A.normal.getY(v); N3[o + 2] = -sn * nx + cs * nz; C3.set(col, o); UV[(e * n + v) * 2] = A.uv.getX(v); UV[(e * n + v) * 2 + 1] = A.uv.getY(v); }
              for (let q = 0; q < ix.length; q++) I[e * ix.length + q] = ix[q] + e * n; });
            const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N3, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setAttribute('color', new THREE.BufferAttribute(C3, 3)); g.setIndex(new THREE.BufferAttribute(I, 1));
            const m = new THREE.Mesh(g, mc); m.castShadow = m.receiveShadow = h.TH.sun[1] > 0.6; h.scene.add(m); } } }
        inst(h, h.geo('trunk'), h.mat('trunk'), shafts);
        buoyIdx.push(...groves); const guardB = buoyIdx.map(([x, , z]) => { const p = nearest(x, z); return !(p.i > iG0 - 10 && p.i < iG1 + 10 && (z - p.s.z) * p.s.tx - (x - p.s.x) * p.s.tz > 0 && p.d < p.s.w + 18); }); // no birches in the track corridor (the random draw stays the same: the removal happens afterward)
        inst(h, h.geo('shaftBirch'), mat('barkB'), buoyIdx.filter((_, k) => guardB[k])); { const hp = buoyIdx.map(([x, y, z, r, s]) => [x, y, z, r, s * (0.8 + rnd() * 0.5)]); const lo = new THREE.OctahedronGeometry(2.6, 0).translate(0, 8, 0), nearby = q => dAt(q[0], q[2]) <= 150; // beyond 150 m from the track: an octahedron (24 vertices instead of 60)
          for (const [f, m3] of [[k => k % 3, mat('leavesB')], [k => k % 3 === 0, mat('leavesB', { c: 0xa8b890 })]]) { const L = hp.filter((_, k) => f(k) && guardB[k]); inst(h, h.geo('canopyB'), m3, L.filter(nearby)); inst(h, lo, m3, L.filter(q => !nearby(q))); } } }
      { const s = S[P(K.hairpinHigh)], [x, z] = edgePt(s, -1, s.w + 16); inst(h, h.geo('boulderGES'), mat('rockGES'), [[x, hAt(x, z) + 2, z, 0.7, 7, 5, 6], [x + 6, hAt(x + 6, z + 5) + 1, z + 5, 2, 3.5, 2.5, 3]]); } // the rock of the high hairpin, a braking marker
      // bank riprap
      { const crag = []; for (let k = 0; k < 2200; k++) { const x = -420 + rnd() * 560, z = 190 + rnd() * 1150, rv = riverDist(x, z); if (rv < -2 || rv > 6 || dAt(x, z) < W + 4) continue; crag.push([x, hAt(x, z), z, rnd() * 6, 1.2 + rnd() * 2.2, 0.7 + rnd() * 1.2, 1.2 + rnd() * 2.2]); } inst(h, h.geo('boulderGES'), mat('rockGES'), crag); }

      // ---------- the distance: three ranges of peaks outside the fog, paler and paler, snow on the last two (nothing beyond 2 350 m from the road: the sky is at 2 500 m) ----------
      { const P3 = [], C3 = [], I = [], n = 180, cx = 0, cz = 450, hz = v => { const s = Math.sin(v * 127.1) * 43758.5453; return s - Math.floor(s); };
        for (const [R, crag, h0, h1, snowSurf, gr, veil] of [[1380, 0x5f7470, 190, 360, 1e9, 9, 0.3], [1520, 0x8296a0, 330, 620, 520, 6, 0.45], [1660, 0xa6b6c0, 480, 860, 560, 4, 0.6]]) { const br = new THREE.Color(h.TH.fog), cr = new THREE.Color(crag).lerp(br, veil), cn = new THREE.Color(0xeef2f4).lerp(br, veil * 0.6), b0 = P3.length / 3;
          for (let k = 0; k <= n; k++) { const a = k / n * Math.PI * 2, kk = k % n, t = 0.5 + 0.3 * Math.sin(a * gr + R) + 0.2 * Math.sin(a * gr * 2.7 + R * 2) + 0.12 * Math.sin(a * gr * 6.1 + R * 3) + 0.06 * (hz(kk + R) - 0.5), y = h0 + (h1 - h0) * Math.max(0, Math.min(1, t)), x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, ym = Math.min(y, snowSurf + 30 * Math.sin(a * 31 + R));
            P3.push(x, -80, z, x, ym, z, x, ym, z, x, y, z); for (const c of [cr, cr, cn, cn]) C3.push(c.r, c.g, c.b); if (k < n) { const b = b0 + k * 4; I.push(b, b + 1, b + 4, b + 1, b + 5, b + 4, b + 2, b + 3, b + 6, b + 3, b + 7, b + 6); } } }
        const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g2.setAttribute('color', new THREE.Float32BufferAttribute(C3, 3)); g2.setIndex(I); const whiteTx = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); whiteTx.needsUpdate = true; // a texture: rhythm.js then leaves this large horizon plane calm (without it, the peaks pulsed with the music)
        h.scene.add(new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ map: whiteTx, vertexColors: true, fog: false, side: THREE.DoubleSide }))); }

      // ---------- life, continued: silhouettes, take-offs, gliding birds, helicopter, cable crane, crest mist sheets, gantry lights, tunnel fans, site welding, quarry strip ----------
      { // V-14, V-27, V-35, V-48: still silhouettes (the "passant" shape of touge), one tint per person
        const people = [], G = (i, sd, off, n, cols, dy = 0.2) => { for (let k = 0; k < n; k++) { const s = S[(i + N) % N], o = s.w + off + ((k * 7) % 3) * 0.5, [x, z] = edgePt(s, sd, o), u = (k - n / 2) * 1.2 + Math.sin(k * 3.1) * 0.4; people.push([x + s.tx * u, s.y + dy, z + s.tz * u, k * 2.4, 1.05, 1.05, 1.05, cols[k % cols.length]]); } };
        const CIV = [0x3a4a6a, 0x6a3a34, 0x4a4a52, 0x7a6a4a, 0x2e3a34, 0x8a8478];
        G(2628, 1, 2, 6, CIV); G(2688, -1, 2.2, 7, CIV); G(2862, -1, 2.4, 6, CIV); G(30, 1, 2, 5, CIV); G(72, -1, 2, 5, CIV); // in front of the cinema, at the market, at the bus stop, two groups of spectators at the start
        G(iG0 + 14, 1, 17, 8, CIV, 1); // the travellers on the station platform
        insts(h, 'passerby', { shadows: mat('paint') }, people, { tintMat: 'shadows' }); }
      { // V-36, V-45, V-72: birds at rest that take off on approach (model: the Paris pigeons), set down again for the next lap
        const flights = [], takeoff = (i0, sd, o0, o1, n, y, col) => flights.push({ i0, en: 0, t: 0, p: Array.from({ length: n }, (_, k) => { const s = S[i0 + (k * 5) % 11], [x, z] = edgePt(s, sd, s.w + o0 + (o1 - o0) * ((k * 0.618) % 1));
          return { x, y: s.y + y, z, r: k * 1.7, vx: Math.sin(k * 2.4) * 2.5 + s.tx * 5 - s.tz * sd * 4, vy: 3 + (k % 3), vz: Math.cos(k * 2.4) * 2.5 + s.tz * 5 + s.tx * sd * 4, col }; }) });
        takeoff(2868, -1, 4.5, 11, 12, 0.25, 0x7a7c84); takeoff(1706, -1, 0.6, 0.6, 9, 1.17, 0x26282c); // pigeons on the statue square, cormorants on the lake-side parapet, crows at the edge of the track
        const allRes = flights.flatMap(v => v.p), pigeons = insts(h, 'pigeon', { feather: mat('paint'), headEl: mat('paint', { c: 0x3a3e44 }) }, allRes.map(q => [q.x, q.y, q.z, q.r, 1.3, 1.3, 1.3, q.col]), { tintMat: 'feather' }); for (const m of pigeons) m.userData.dyn = 1;
        const dp = new THREE.Object3D(), putPigeon = (k, x, y, z, r, e) => { dp.position.set(x, y, z); dp.rotation.set(0, r, 0); dp.scale.setScalar(e * 1.3); dp.updateMatrix(); for (const m of pigeons) m.setMatrixAt(k, dp.matrix); };
        TICK.push((dt, car) => { if (!car) return; let k = 0, moves = 0; for (const v of flights) { const e = (v.i0 - car.idx + N) % N;
            if (!v.en && e < 24 && e > 0) { v.en = 1; v.t = 0; } else if (v.en && e > 300 && e < N - 300) { v.en = 0; v.p.forEach((q, j) => putPigeon(k + j, q.x, q.y, q.z, q.r, 1)); moves = 1; }
            if (v.en && v.t < 5) { v.t += dt; const t = v.t; v.p.forEach((q, j) => putPigeon(k + j, q.x + q.vx * t, q.y + q.vy * t + 0.3 * t * t, q.z + q.vz * t, Math.atan2(-q.vz, q.vx), t < 4.5 ? 1 : 0)); moves = 1; }
            k += v.p.length; }
          if (moves) for (const m of pigeons) m.instanceMatrix.needsUpdate = true; }); }
      { // V-55, V-61, V-80: circling birds (cubes of the moving batch): gulls above the basin foam, a bird of prey in each gap of the crossing and above the descent
        const BIRDS = [], bird = (cx, cy, cz, R, w, ph, e, col) => BIRDS.push([mb(mb(mob(), 0, 0, 0, 0, 1.8, 0.35, 0.6, col), -0.2, 0.1, 0, 0, 0.9, 0.14, e, col), cx, cy, cz, R, w, ph]);
        for (const i of [1235, 1298, 1360, 2020]) { const s = S[i + 55], [x, z] = edgePt(s, 1, s.w + 30); bird(x, s.y + 20, z, 24, 0.3, i, 6, 0x3a342c); } // 110 m ahead of the gap, on the axis of the race camera
        TICK.push((dt, car, t) => { for (const [o, cx, cy, cz, R, w, ph] of BIRDS) { const a = t * w + ph; mobA(o, cx + Math.cos(a) * R, cy + Math.sin(a * 0.7) * 1.5, cz + Math.sin(a) * R, Math.atan2(-Math.cos(a), -Math.sin(a))); } }); }
      { // V-82: a military helicopter circles the valley (ground shape), rotor turning
        const heli = new THREE.Group(), rotor = new THREE.Group(), skinH = { carBody: mat('paint', { c: 0x4a5a3a }), pane: mat('paneDark'), chassis: gray, rotorBlade: gray }; heli.userData.dyn = 1; heli.scale.setScalar(2); rotor.position.y = 1.65; heli.add(rotor); h.scene.add(heli);
        h.pose('chopper', skinH, heli); h.pose('rotorHeli', skinH, rotor); weld(h, rotor); heli.remove(rotor); weld(h, heli); heli.add(rotor); // one pass per material, rotor set apart (it turns)
        TICK.push((dt, car, t) => { const a = t * 0.085; heli.position.set(40 + Math.cos(a) * 170, 96 + Math.sin(a * 2) * 6, 500 + Math.sin(a) * 340); heli.rotation.y = Math.atan2(-Math.cos(a) * 340, -Math.sin(a) * 170); rotor.rotation.y += dt * 25; }); h.chopperP = heli.position; }
      { // V-64: the site's cable crane, stretched from one side to the other; its bucket goes back and forth above the valley
        const A = [-430, hAt(-430, 470) + 22, 470], B = [470, hAt(470, 470) + 22, 470], lg = new THREE.BufferGeometry(), pts = []; for (let k = 0; k < 16; k++) for (const u of [k / 16, (k + 1) / 16]) pts.push(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u - 60 * u * (1 - u), A[2]);
        lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const ls = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2e3230 })); ls.userData.cables = 1; h.scene.add(ls);
        for (const P3 of [A, B]) blk(mat('latticeGantry', { alphaTest: 0.5, side: THREE.DoubleSide }, '#8a4634'), P3[0] - 1.5, P3[0] + 1.5, P3[2] - 1.5, P3[2] + 1.5, P3[1] - 24, P3[1]);
        const tipper = mb(mb(mob(), 0, -3.2, 0, 0, 3.4, 2.4, 2.6, 0xd8a020), 0, -1, 0, 0, 0.2, 2.4, 0.2, 0x2a2c2e); TICK.push((dt, car, t) => { const u = 0.5 + 0.42 * Math.sin(t * 0.06); mobA(tipper, A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u - 60 * u * (1 - u), A[2], 0); }); }
      { // V-06: sheets of mist cross the crest, from the lake into the drop
        const NB = 9, im = inst(h, h.geo('haze'), mat('hazeGES', { emis: 1, transparent: true, depthWrite: false, side: THREE.DoubleSide }), Array.from({ length: NB }, () => [0, -99, 0])), d = new THREE.Object3D(); im.userData.dyn = 1; im.renderOrder = 3; im.castShadow = im.receiveShadow = false;
        TICK.push((dt, car, t) => { for (let k = 0; k < NB; k++) { const x = -232 + k * 58, u = ((t * 3.5 + k * 23) % 80) - 40; const f = Math.max(0.02, Math.min(1, (40 - Math.abs(u)) / 14)); d.position.set(x, YC + 3, CZ - Math.sqrt(RA * RA - x * x) + u); d.scale.set(28 * f, 8 * f, 28 * f); d.rotation.set(0, k, 0); d.updateMatrix(); im.setMatrixAt(k, d.matrix); } im.instanceMatrix.needsUpdate = true; }); }
      { // V-07: an orange light turning at the top of each crest gantry; V-68: two pairs of fans under the tunnel vault
        const lapRun = [], orangeL = mat('lampObj', { emis: 1, c: 0xff9a20 });
        for (const x of [-65, 120]) { const s = S[near(h, x, CZ - Math.sqrt(RA * RA - x * x))], g = new THREE.Group(); g.position.set(s.x, s.y + 21.6, s.z); g.userData.dyn = 1; h.scene.add(g); h.pose('boxMesh', orangeL, g, [0, 0, 0], 2.8, 0.7, 0.7); h.pose('boxMesh', gray, g, [0, -0.5, 0], 0.6, 0.6, 0.6); lapRun.push([g, 'y', 2.2]); const l = h.emis(IX.get(s), s.x, s.y + 14, s.z, 0xff8a20, 30, 1), c0 = l.c.clone(); TICK.push((dt, car, t) => { l.c.copy(c0).multiplyScalar(0.6 + 0.4 * Math.sin(t * 2.2)); }); } // the light really illuminates the gantry and the roadway below it
        for (const i of [T0 + 24, T0 + 64]) for (const o of [-3.4, 3.4]) { const s = S[i], [x, z] = edgePt(s, 1, o), g = new THREE.Group(), ro = new THREE.Group(); g.position.set(x, s.y + 6.3, z); g.rotation.y = Math.atan2(-s.tz, s.tx); g.userData.dyn = 1; g.add(ro); h.scene.add(g);
          const c = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 2.2, 10, 1, true), mat('paint', { c: 0x6d726d, side: THREE.DoubleSide })); c.rotation.z = Math.PI / 2; g.add(c); h.pose('boxMesh', blackM, ro, [0, 0, 0], 0.12, 1.1, 0.24); h.pose('boxMesh', blackM, ro, [0, 0, 0], 0.12, 0.24, 1.1); weld(h, ro); lapRun.push([ro, 'x', 14]); }
        TICK.push(dt => { for (const [g, ax, w] of lapRun) g.rotation[ax] += dt * w; }); }
      // ---------- the sound of the place (SOUND.spots, SOUND.brief from audio.js): sources placed in the scenery, heard by distance and side; events tied to the car passing ----------
      if (window.SOUND && SOUND.spots) { const Vp = (x, y, z) => ({ x, y, z }), [RA, RB] = h.trains, cutout = S[P(K.rampSec + 3)], camp = Vp(396, hAt(396, 362), 362), sqr = S[(QA + QB) >> 1], tunM = S[(T0 + T1) >> 1];
        const waterfall = { p: Vp(-115, 12, 110), sound: 'waterfall', r: 760, vol: 0.22 }, trA = { p: RA, sound: 'train', r: 170, vol: 0 }, trB = { p: RB, sound: 'train', r: 190, vol: 0 }, saw = { p: Vp(cutout.x, cutout.y, cutout.z), sound: 'chainsaw', r: 280, vol: 0.25 };
        SOUND.spots('barrage', [waterfall, trA, trB, saw, // V-18 to V-20: the fall, heard from the platform, the bridge, the crest (below) and the viewpoint; V-24: the rumble of the trains; V-59: the chainsaw
          ...[[105, 14, 65], [60, 14, 84], [15, 14, 65]].map(([x, y, z]) => ({ p: Vp(x, y + 3, z), sound: 'turbine', r: 75, vol: 0.1, int: 1 })), // V-16, V-17: one hum per unit running, passing from one ear to the other in the slalom
          { p: Vp(249, 18, 516), sound: 'transformer', r: 220, vol: 0.07 }, // V-42: the substation transformers
          { p: Vp(sqr.x, sqr.y + 8, sqr.z), sound: 'crusher', r: 160, vol: 0.22 }, // V-78
          { p: h.chopperP, sound: 'chopper', r: 320, vol: 0.28 }, // V-82
          ...[P(K.rampSec + 6), P(K.traverse + 3), P(K.traverse + 6), P(K.abutment + 6), P(K.belvedere + 4)].map(i => ({ p: Vp(S[i].x, S[i].y, S[i].z), sound: 'forest', r: 260, vol: 0.14 })), // V-62: the wind in the larches, on the climb and the descent
          { p: Vp(tunM.x, tunM.y + 5, tunM.z), sound: 'whoosh', r: 170, vol: 0.2, int: 1 }, // V-69: the tunnel ventilation
          ...[40, 2760].map(i => { const [x, z] = edgePt(S[i], i < 100 ? 1 : -1, S[i].w + 4); return { p: Vp(x, S[i].y + 7, z), sound: 'loudspeaker', r: 90, vol: 0.25 }; })]); // V-33: the street loudspeakers
        const pos = car => Vp(car.x, car.y || 0, car.z); let iAhead = -1, tBird = 3, honk = 0, crack = 0;
        TICK.push((dt, car) => { if (!car) return; const i = car.idx, v = Math.hypot(car.vx, car.vz);
          waterfall.occ = i > iH0 && i < iH1 ? 0.75 : 0; trA.vol = RA.vc ? 0.28 : 0; trB.vol = RB.vc ? 0.32 : 0; saw.vol = h.tree() < 1 || h.tree() > 6 ? 0.25 : 0; // in the hall, the fall is behind the walls; the trains at standstill fall silent; the saw stops when the tree falls
          if (h.tree() > 1.5 && !crack) { crack = 1; SOUND.brief('crackle', saw.p, 1, 260); } if (h.tree() < 0) crack = 0; // V-59
          { const d = Math.hypot(RB.x - car.x, RB.z - car.z); if (RB.vc && d < 150 && !honk) { honk = 1; SOUND.brief('honk', RB, 1, 320); } if (d > 260) honk = 0; } // V-24: the locomotive horn, once per meeting
          if (i !== iAhead) { iAhead = i;
            if (i > iP0 + 6 && i < iP1 - 6 && i % 11 === 0) SOUND.brief('joint', pos(car), 0.7 * Math.min(1, v / 45), 50); // V-54: the deck joints
            if (i > iM0 + 6 && i < iM1 && (i - iM0 - 6) % 14 === 0) { const sd = ((i - iM0 - 6) / 14) & 1 ? 1 : -1, s = S[i], [x, z] = edgePt(s, sd, s.w + 1.2); SOUND.brief('whoosh', Vp(x, s.y + 2, z), Math.min(1, v / 55), 40); } } // V-70: each crest lamppost hisses as you pass
          if ((i > P(K.rampSec) && i < T0 - 20) || (i > P(K.abutment) + 40 && i < P(K.descent))) { if ((tBird -= dt) < 0) { tBird = 2 + Math.random() * 4; const s = S[(i + 20) % N], [x, z] = edgePt(s, Math.random() < 0.5 ? 1 : -1, s.w + 12); SOUND.brief('bird', Vp(x, s.y + 8, z), 1, 200); } } // V-62: the morning birds, in the forest
          if (i > 280 && i < 345 && Math.random() < dt * 0.5) SOUND.brief('hammer', Vp(68, 30, 530), 1.5, 220); }); // V-43: the site
        bollard(P(K.crest) + 12, () => SOUND.brief('horn', Vp(70, YC, -70), 0.7, 900)); // V-71: the foghorn, on entering the crest
        bollard(2150, () => SOUND.brief('clarion', camp, 1, 300)); // V-76: the camp bugle
        for (const i of [388, 2462]) bollard(i, car => SOUND.brief('sizzle', pos(car), 0.8, 60)); // V-84: under the 500 kV lines
        for (const i of [1235, 1298, 1700]) bollard(i, () => SOUND.brief('honk', Vp(170, 15, 400), 1, 1300)); } // V-28: a train horn rises from the valley
      // the moving batch: all the cubes of the MOB objects in a single drawing pass, outside the merge of the scenery (userData.dyn)
      { const L = MOB.flatMap(o => o.c.map(c => [o, c])), im = inst(h, h.geo('blk'), mat('paint'), L.map(([, c]) => c)), col = new THREE.Color(), d = new THREE.Object3D(), m4 = new THREE.Matrix4(); im.userData.dyn = 1;
        const loc = L.map(([, c]) => { d.position.set(c[0], c[1], c[2]); d.rotation.set(0, c[3] || 0, 0); d.scale.set(c[4], c[5], c[6]); d.updateMatrix(); return d.matrix.clone(); });
        L.forEach(([, c], k) => im.setColorAt(k, col.setHex(c[7]))); if (im.instanceColor) im.instanceColor.needsUpdate = true;
        TICK.push(() => { let b = 0; L.forEach(([o], k) => { if (o.dirty) { im.setMatrixAt(k, m4.multiplyMatrices(o.M, loc[k])); b = 1; } }); if (b) { im.instanceMatrix.needsUpdate = true; for (const o of MOB) o.dirty = 0; } }); }

      const VIEW = []; // what depends on the followed car, set for each view before its rendering (tick.view)
      { // V-03: in the fog bank of the crest, an orange halo on each lamppost, visible at 170 m: the chain of lamps draws the road. Additive, outside the fog, drawn after the bank's veil (renderOrder 51)
        const LP = lamps.filter(([x, y, z]) => y > YC - 6 && z < 120).map(([x, y, z, r]) => [x + Math.cos(r) * 2.1, y + 8.8, z - Math.sin(r) * 2.1]), g = new THREE.BufferGeometry(), C = new Float32Array(LP.length * 3), a = P(K.crest), b = P(74);
        g.setAttribute('position', new THREE.Float32BufferAttribute(LP.flat(), 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
        for (const [x, y, z] of LP) h.emis(near(h, x, z), x, y - 0.6, z, 0xffa040, 30, 0.65); // the real light: one engine light per lamp, lighting the roadway and the parapets; the halo is only its glow in the air
        const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: h.tx('hazeGES'), size: 8, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); pts.frustumCulled = false; pts.renderOrder = 51; pts.userData.dyn = 1; h.scene.add(pts);
        VIEW.push(car => { const i = car.idx, d = i < a ? a - i : i > b ? i - b : 0, k = Math.max(0, 1 - d / 90); pts.visible = k > 0.01; if (!pts.visible) return;
          LP.forEach(([x, , z], j) => { const f = k * Math.max(0, 1 - Math.hypot(x - car.x, z - car.z) / 170); C[j * 3] = 0.75 * f; C[j * 3 + 1] = 0.42 * f; C[j * 3 + 2] = 0.12 * f; }); g.attributes.color.needsUpdate = true; }); }

      backdrop();
      // atlas of the painted panels (material "letters", a 256 × 64 texture per text): all the pieces share one material, so one drawing pass; the uv of each box are mapped to its cell (the engine merges them afterward)
      { const M = [...LET].filter(m => m.map), CW = 4, CH = Math.ceil(M.length / CW), AW = 1024, AH = 64 * 2 ** Math.ceil(Math.log2(CH)), cv = document.createElement('canvas'), cx = cv.getContext('2d'), idx = new Map(M.map((m, i) => [m, i])); cv.width = AW; cv.height = AH;
        M.forEach((m, i) => cx.drawImage(m.map.image, (i % CW) * 256, (i / CW | 0) * 64)); // the cells are packed from the top; flipY: v = 1 at the top of the image
        const t = new THREE.CanvasTexture(cv); t.magFilter = M[0].map.magFilter; t.minFilter = M[0].map.minFilter; t.anisotropy = M[0].map.anisotropy; t.wrapS = t.wrapT = THREE.RepeatWrapping; const am = M[0].clone(); am.map = t; const vu = new Set();
        h.scene.traverse(o => { if (!o.isMesh || !idx.has(o.material)) return; let g = o.geometry; if (vu.has(g)) g = o.geometry = g.clone(); vu.add(g); const i = idx.get(o.material), u0 = (i % CW) * 256 / AW, v0 = (AH - 64 - (i / CW | 0) * 64) / AH, uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * 256 / AW, v0 + uv.getY(k) * 64 / AH); o.material = am; });
        for (const m of M) m.map.dispose(); }
      let tv = 0; const tick = (dt, now, car) => { dt = Math.min(dt, 0.1); tv += dt; for (const f of TICK) f(dt, car, tv); }; tick.view = car => { for (const f of VIEW) f(car); }; return tick;
    },
  });
})();
