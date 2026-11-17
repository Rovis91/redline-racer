// Placement of the "chapada" scenery: adds its function to SCENERY. The shared placers come from scenery.js. See docs/methods/SCENERY.md.
(function () {
  const { inst, near, pt, indexed, insts, GLOW, boxMesh, edgePt, marker, weld, terrain } = PLACERS;

  Object.assign(SCENERY, {
    // ---------- Manuscrit 512 (Bahia, present day, 9 a.m.): the lost city, in a jungle valley whose road makes the lapRun. ----------
    // Downstream is to the west (low), upstream to the east: the cliff of the plateau closes the valley and the great falls drop from it (the source). The river passes under the liana bridge,
    // descends in steps inside the loop, runs along the town square, spreads at the ford and leaves to the west into the haze. Clockwise: the right is the inside.
    // One ground, one roadway, one haze, one forest from end to end (T-0): a zone is only distinguished by what is added to the forest (cloth, stone, water, rock).
    // Against "the wave" (D-9): no ridge following the terrain mesh, no large surface with horizontal bands, no large bare facet of ground.
    chapada(h) {
      const { THREE, S, N, W, rnd, T } = h, DS = { side: THREE.DoubleSide }, P = k => pt(h, k), IX = new Map(S.map((s, i) => [s, i]));
      const cache = new Map(), mat = (n, o = {}) => { const k = n + JSON.stringify(o); return cache.get(k) || cache.set(k, h.mat(n, o)).get(k); }; // one material per setting: the engine merges the fixed scenery per material
      const between = (i, a, b) => ((i - a + N) % N) <= ((b - a + N) % N), ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      let rngSeed = 512; const rand = () => (rngSeed = (rngSeed * 1664525 + 1013904223) >>> 0) / 4294967296; // the randomness of life: it does not draw from rnd, so the fixed scenery stays the same down to the pebble
      const LIFE = [], HAZE = h.mat('haze', { emis: 1 }).map; // LIFE: what the tick animates, (dt, car, t); t = game time (frozen in pause). The map's wind blows to the west (-x): vapour, smoke, flames, leaves
      // puffs that rise and fade (falls vapour, spray, morning mist, smoke): a point cloud with per-point transparency, in normal blending.
      // No additive blending: the fog, added by each point, burned the cloud into a pale blot, and outside the fog it only showed against a dark background. spawns() = [x, y, z] of a birth; f = opacity at its peak
      const puffs = (n, spawns, { vitality = 9, vx = -1.2, vy = 5.2, imgSize = 14, f = 0.3, c = [1, 1, 1] } = {}) => { const PP = new Float32Array(n * 3), CC = new Float32Array(n * 4), A = new Float32Array(n), gv = new THREE.BufferGeometry();
        gv.setAttribute('position', new THREE.BufferAttribute(PP, 3)); gv.setAttribute('color', new THREE.BufferAttribute(CC, 4));
        const o = new THREE.Points(gv, new THREE.PointsMaterial({ size: imgSize, map: HAZE, vertexColors: true, transparent: true, depthWrite: false })); o.frustumCulled = false; o.userData.dyn = 1; o.renderOrder = 5; h.scene.add(o);
        o.onBeforeRender = (r, sc, cam) => { o.material.size = Math.abs(cam.fov) === 90 && cam.aspect === 1 ? imgSize * 0.05 : imgSize; }; // in the car's reflection cube (32 pixels a side), three keeps the size in screen pixels: a puff covered a whole face there and whitened the windows
        const ne = k => { const p = spawns(); PP[k * 3] = p[0]; PP[k * 3 + 1] = p[1]; PP[k * 3 + 2] = p[2]; A[k] = 0; };
        for (let k = 0; k < n; k++) { ne(k); A[k] = rand(); PP[k * 3] += A[k] * vitality * vx; PP[k * 3 + 1] += A[k] * vitality * vy; CC.set(c, k * 4); }
        LIFE.push(dt => { dt = Math.min(dt, 0.1); for (let k = 0; k < n; k++) { A[k] += dt / vitality; if (A[k] > 1) ne(k); PP[k * 3] += vx * dt; PP[k * 3 + 1] += vy * dt; CC[k * 4 + 3] = f * Math.sin(Math.PI * Math.sqrt(A[k])); }
          gv.attributes.position.needsUpdate = gv.attributes.color.needsUpdate = true; }); return o; };
      // an animal or an object set apart: a group outside the merge of the fixed scenery (it moves); fixed = 1: it does not move, the merge takes it
      const mobile = (label, skin, x, y, z, ry = 0, k = 1, fixed = 0, ...a) => { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; p.scale.setScalar(k); if (!fixed) p.userData.dyn = 1; h.scene.add(p); h.pose(label, skin, p, [0, 0, 0], ...a); return p; };
      const toStack = (x, z, q) => Math.atan2(z - q.z, q.x - x); // the angle that turns the +X of a shape, placed at (x, z), toward sample q
      // a take-off triggered on approach (the model: the pigeons of scenery-paris.js): the animals at rest leave when the car is within D samples of i0, then are set back down when it is isFar.
      // ms = batches of the animals at rest; vol = batches of their flying shape; wings = batches of the wings, which flap (scale in height); same = 1: no flying shape, the animal at rest jumps as it is (monkeys).
      // animal = { x, y, z, r, vx, vy, vz, e: [scale] }; g = gravity (positive: they always rise further; negative: they fall back). All these batches carry dyn: without it, the merge of the fixed scenery freezes a copy of each animal
      const d3 = new THREE.Object3D(), TAKEOFFS = [], placeTakeoff = (v, b) => { v.beasts.forEach((q, k) => { const t = b === 1 ? v.t : 0, vol = t > 0 && t < v.T - 0.25, f = v.drumset ? 0.15 + 0.85 * Math.sin(t * v.drumset + k * 1.7) : 1;
          const met = (ms, vu, sy) => { d3.scale.set(vu ? q.e[0] : 1e-4, vu ? q.e[1] * sy : 1e-4, vu ? q.e[2] : 1e-4); d3.updateMatrix(); for (const m of ms) m.setMatrixAt(k, d3.matrix); };
          if (!v.same) { d3.position.set(q.x, q.y, q.z); d3.rotation.set(0, q.r, 0); met(v.ms, t === 0, 1); }
          d3.position.set(q.x + q.vx * t, q.y + q.vy * t + v.g * t * t, q.z + q.vz * t); d3.rotation.set(0, t || !v.same ? Math.atan2(-q.vz, q.vx) : q.r, 0);
          if (v.same) met(v.ms, t < v.T - 0.25, 1); else { met(v.vol, vol, 1); met(v.wings, vol, f); } });
        { const t = b === 1 ? v.t : 0, vol = t > 0 && t < v.T - 0.25; for (const m of v.vol) m.visible = vol; for (const m of v.wings) m.visible = vol; for (const m of v.ms) { m.visible = v.same ? t < v.T - 0.25 : t === 0; m.frustumCulled = t === 0; } } // what is scaled down to 1e-4 everywhere is no longer drawn (one pass per batch, shadows included); the first frame draws everything (game.js: hotList); at rest, the animals are seen by their bounding sphere (the whole batch is in the same place), in flight not
        for (const m of v.allRes) m.instanceMatrix.needsUpdate = true; };
      const takeoff = (ms, beasts, i0, o = {}) => { const v = { ms: [].concat(ms), vol: [], wings: [], beasts, i0, D: 22, T: 5, g: 0.3, drumset: 0, same: 0, en: 0, t: 0, ...o }; v.allRes = [...v.ms, ...v.vol, ...v.wings]; for (const m of v.allRes) m.userData.dyn = 1; TAKEOFFS.push(v); placeTakeoff(v, 2); };
      LIFE.push((dt, car) => { if (car) for (const v of TAKEOFFS) { const e = (v.i0 - car.idx + N) % N;
        if (!v.en && e < v.D && e > 0) { v.en = 1; v.t = 0; } else if (v.en && e > 300 && e < N - 300) { v.en = 0; placeTakeoff(v, 2); }
        if (v.en && v.t < v.T) { v.t += dt; placeTakeoff(v, 1); } } });
      const FLOWS = [], flows = (m, u, v) => { FLOWS.push([m.map, u, v]); return m; }; // flowing water: [texture, speed in u, speed in v] (repeats per second), advanced by the tick returned at the end
      const falls = (boreHoles, op, v, c = 0xc4d8d4) => flows(h.mat('waterDrop', { emis: 1, c, side: THREE.DoubleSide, transparent: true, opacity: op, depthWrite: false, smooth: 1 }, boreHoles), 0, v); // falling water: the texture slides downward
      // a water sheet: a curved band that follows the waterfall. secs, from top to bottom: [x of the middle, y, z, width]; u across, v = the height (one repeat every 16 m); direction: toward which side (z) it bulges, toward whom it faces
      // All the sheets of one material are merged into a single geometry at the end (one drawing pass per material, not one per sheet): SHEET accumulates them, in world coordinates
      const SHEET = new Map(), heap = m => SHEET.get(m) || SHEET.set(m, { P: [], U: [], I: [] }).get(m), V3 = new THREE.Vector3();
      const sheet = (secs, m, rep, dz = 0, parent = null, direction = -1, vK = 16) => { const b = heap(m), base = b.P.length / 3, NX = 6; if (parent) parent.updateMatrixWorld(); /* vK: metres of fall per repeat of the texture */
        secs.forEach(([x, y, z, w], i) => { for (let j = 0; j <= NX; j++) { const u = j / NX; V3.set(x + (u - 0.5) * w, y, z + dz + direction * 0.5 * Math.sin(u * Math.PI)); if (parent) V3.applyMatrix4(parent.matrixWorld); b.P.push(V3.x, V3.y, V3.z); b.U.push(u * rep, y / vK); }
          if (i) for (let j = 0; j < NX; j++) { const a = base + (i - 1) * (NX + 1) + j, c = a + NX + 1; b.I.push(a, c, a + 1, a + 1, c, c + 1); } }); };
      // a flat water plate (basin, foam): w across, d in the direction the texture slides, in the parent frame
      const flatPart = (m, parent, [x, y, z], w, d) => { const b = heap(m), base = b.P.length / 3; parent.updateMatrixWorld();
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { V3.set(x + sx * w / 2, y, z + sz * d / 2).applyMatrix4(parent.matrixWorld); b.P.push(V3.x, V3.y, V3.z); b.U.push((sx + 1) * w / 16, (sz + 1) * d / 16); }
        b.I.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); };
      const e1 = falls(5, 1, 0.55), e2 = falls(11, 0.8, 0.9), ec = flows(h.mat('foamBasin', { emis: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false }), 0, 0.35), // both layers of every fall, the foam of every basin
        e3 = falls(18, 0.88, 1.25, 0xffffff), foamV = flows(h.mat('foamBasin', { emis: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.7, depthWrite: false, rep: [1.4, 1.4] }), 0.04, 0.95), // the perforated veil at the foot of the fall; the lively foam of the rollers (its own texture: it moves faster than the current)
        glitter = (ru, rv, u, v) => flows(h.mat('sparkles', { emis: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, rep: [ru, rv] }), u, v); // sun glitter on the water: two crossing layers that sparkle
      const t0 = T.t0, t1 = T.t1, inTunnel = i => between(i, t0, t1), overBridge = i => between(i, P(32) - 4, P(33) + 4), MAR = 14.9;
      // the tropical marsh (Z2): the flooded plain between the camp and the chicane, on either side of the roadway; roadZ = the axis of the roadway, marsh(x, z) = 0 outside, 1 inside
      const roadZ = x => x < 200 ? 0 : x < 360 ? -30 * (x - 200) / 160 : x < 500 ? -30 + 50 * (x - 360) / 140 : 20, marsh = (x, z) => ss(135, 175, x) * ss(560, 520, x) * ss(-70, -40, z - roadZ(x)) * ss(125, 95, z - roadZ(x));
      const iR0 = P(49) + 2, iR1 = P(52) - 18, inRiver = i => between(i, iR0, iR1); // the foot of the descent: the river flows over the roadway (you drive through the river)
      const ford = s => inRiver(IX.get(s)) || s.y < (marsh(s.x, s.z) > 0.5 ? MAR + 0.02 : 14.32); // the water crossings (marsh, ford): where the roadway dips below the water level
      // ---------- the river: one line, one level per reach (the steps are cascades), one half-width ----------
      const LVL = x => x > 870 ? 33 : x > 420 ? 31.4 : x > 150 ? 19.4 : x > 60 ? 16.2 : 14.25, // between x = 428 and 205 it runs over the road and takes its slope
        WID = x => 8 + 16 * ss(1012, 1030, x) + 16 * ss(20, -40, x) + 7 * ss(930, 960, x) * ss(1012, 1000, x); // wider in the bridge gorge, at the falls' pool, at the ford
      const RIVER = []; { const upstream = [[1040, 238], [1032, 200], [1012, 172], [996, 165], [850, 200], [700, 260], [600, 320], [470, 400], [452, 460], [438, 500]], downstream = [[190, 490], [172, 440], [160, 400], [120, 350], [40, 335], [-60, 268], [-180, 225], [-400, 170]];
        const A = [...upstream.map(([x, z]) => [x, z]), ...Array.from({ length: Math.floor((iR1 - iR0) / 2) + 1 }, (_, k) => { const q = S[iR0 + k * 2]; return [q.x, q.z, q.y + 0.15, q.w + 1.5]; }), ...downstream.map(([x, z]) => [x, z])]; // [x, z, level if it follows the road]
        for (let k = 0; k < A.length - 1; k++) { const [ax, az, ay, aw] = A[k], [bx, bz] = A[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4)); for (let j = 0; j < n; j++) { const x = ax + (bx - ax) * j / n;
          RIVER.push({ x, z: az + (bz - az) * j / n, y: ay !== undefined ? ay : LVL(x), w: ay !== undefined ? aw : WID(x), r: ay !== undefined }); } } } // on the road (r), a narrow bed between two rock banks: not a flooded forest
      const riverDist = (x, z) => { let b = RIVER[0], bd = 1e18; for (const p of RIVER) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; b = p; } } return { d: Math.sqrt(bd), p: b }; };
      const BASIN = [583, -55]; /* a sacred basin to the left of the straight that follows the kapok (the area was bare) */ const CIRQUE = [1036, 215]; // the pool at the foot of the falls, in a cirque of the cliff, south-east of the bridge: the falls drop facing whoever crosses, to the left of the temple
      // ---------- the relief: the road gives the slopes; we cut the bed into them, raise the spur of the cave (above the tunnel) and the plateau cliff (to the east) ----------
      const hollow = (x, z, y) => { let c = 0;
        const r = riverDist(x, z), readQ = r.p.y - 1.2; if (y > readQ) c += (y - readQ) * (1 - ss(r.p.w, r.p.w + 5 + (y - readQ) * (x > 930 ? 0.4 : 0.8), r.d)); // the bridge gorge: steep walls
        if (x > 660 && z > 230) { let bd = 1e18, bi = t0; for (let i = t0; i <= t1; i++) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; bi = i; } } // the spur: cut square at the plane of the two portals
          if (bi > t0 + 3 && bi < t1 - 3) { const d = Math.sqrt(bd); c -= Math.min(44, Math.max(0, d - S[bi].w - 1) * 6) * (1 - ss(80, 140, d)); } }
        { const x0 = 1012 + 1.7 * Math.max(0, 152 - z); if (x > x0) c -= Math.min(70, (x - x0) * 3) * ss(30, 38, Math.hypot(x - CIRQUE[0], z - CIRQUE[1])); } // north of the cirque the cliff recedes at an angle: from the bridge entrance the falls are in view, to the left // the plateau cliff, 70 m from the bridge: the falls are seen up close
        c += 2.4 * (1 - ss(8, 15, Math.hypot(x - BASIN[0], z - BASIN[1]))); /* the sacred basin */
        const m = marsh(x, z); if (m > 0 && y > MAR - 1) c += (y - MAR + 1) * m; // the marsh: a flat bottom, one metre under water
        return c; };
      const groundBridge = i => between(i, P(32) + 6, P(33) - 6);
      const g = terrain(h, { stepSec: 6, margin: 230, isFar: 100, waterfall: -0.2, hollow, ground: s => groundBridge(IX.get(s)) ? 34 : inRiver(IX.get(s)) ? s.y - 1.6 : s.y, /* under the river the ground is lower than the road: it does not rise above the foot of the sills */ mat: mat('litterMoss'),
        layerSet: [{ tex: ['rockMoss'], slope: [0.35, 0.6], rep: 0.7 }, { tex: ['siltPebbles'], weight: (x, z) => { const r = riverDist(x, z); return 1 - ss(r.p.w, r.p.w + 9, r.d); } }] });
      // ---------- the roadway: the paved lane of the engine (±W), extended by the scenery to the drivable edge; low stone kerb and embankment under the undergrowth (O-1, O-3) ----------
      { const cO = N - (t1 - t0), slabs = mat('slabsEdge', DS), edgeM = mat('stonePale', DS), /* a row of pale stones: the edge of the road reads all the way to the back of the image */ embankM = mat('litterMoss', DS), e = s => overBridge(IX.get(s)) || ford(s) ? 0 : 1; // no kerb or embankment on the bridge and in the water
        for (const sd of [-1, 1]) { h.ribbon(t1, cO, sd * W, 0, s => sd * s.w, 0, slabs, 16);
          h.ribbon(t1, cO, s => sd * s.w, 0, s => sd * (s.w + 0.25 * e(s)), s => 0.3 * e(s), edgeM, 8); h.ribbon(t1, cO, s => sd * (s.w + 0.25 * e(s)), s => 0.3 * e(s), s => sd * (s.w + 0.85 * e(s)), s => 0.3 * e(s), edgeM, 8);
          h.ribbon(t1, cO, s => sd * (s.w + 0.85 * e(s)), s => 0.3 * e(s), s => sd * (s.w + 6 * e(s)), s => -1.1 * e(s), embankM, 8); } }
      // the wet trail at the exit of each flooded crossing: the roadway (scenery strips included) is dark for 120 m, less and less; the engine only wets its central strip, for 20 m (th.wetVisible)
      { const exitAt = i => { while (ford(S[i % N])) i++; return i; }, veil = h.mat('paint', { c: 0x0a140e, transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide, vertexColors: true }); // the 30 ribbons (3 sites, 10 opacity bands, decreasing) as one mesh: each band's opacity is the alpha of its vertices
        const P3 = [], I3 = [], C3 = [], N3 = []; for (const i0 of [exitAt(P(3) - 6), exitAt(iR1 - 4), exitAt(P(64) - 4)]) for (let k = 0; k < 10; k++) { const m = h.ribbon(i0 + k * 6, 6, s => -s.w, 0.045, s => s.w, 0.045, veil, 8), g = m.geometry, o = P3.length / 3; h.scene.remove(m);
          P3.push(...g.attributes.position.array); N3.push(...g.attributes.normal.array); for (const j of g.index.array) I3.push(j + o); for (let j = 0; j < g.attributes.position.count; j++) C3.push(1, 1, 1, 0.56 * (1 - k / 10)); }
        const G3 = new THREE.BufferGeometry(); G3.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); G3.setAttribute('normal', new THREE.Float32BufferAttribute(N3, 3)); G3.setAttribute('color', new THREE.Float32BufferAttribute(C3, 4)); G3.setIndex(I3);
        const M3 = new THREE.Mesh(G3, veil); M3.receiveShadow = true; M3.userData.dyn = 1; h.scene.add(M3); }
      // ---------- the water: a single ribbon following the river, flat per reach, tilted at the steps ----------
      { const pos = [], uv = [], idx = [];
        RIVER.forEach((p, j) => { const q = RIVER[Math.min(RIVER.length - 1, j + 1)], o = RIVER[Math.max(0, j - 1)], dx = q.x - o.x, dz = q.z - o.z, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, w = p.w + 2;
          pos.push(p.x + nx * w, p.y, p.z + nz * w, p.x - nx * w, p.y, p.z - nz * w); uv.push(0, j * 0.4, w / 5, j * 0.4); if (j) { const a = j * 2 - 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
        // two materials: at the ford the water is clear, the paving of the roadway shows beneath (the crossing must read)
        const clair = j => RIVER[j].r ? 2 : RIVER[j].x > -135 && RIVER[j].x < 10 ? 1 : 0, triIdx = [[], [], []]; for (let j = 1; j < RIVER.length; j++) { const a = j * 2 - 2; triIdx[clair(j)].push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } // 2: on the descent road, a fast and almost opaque water (we drive in the river, not on green slabs)
        for (const [k, op, spd] of [[0, 0.86, 1], [1, 0.5, 1], [2, 0.9, 2.2]]) { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(triIdx[k]); ge.computeVertexNormals();
          const water = new THREE.Mesh(ge, flows(mat('waterJade', { ...DS, transparent: true, opacity: op, gloss: 0.5, c: k === 2 ? 0xb8d8cc : 0xffffff }), 0, -0.5 * spd)); water.receiveShadow = true; water.userData.dyn = 1; h.scene.add(water);
          // the current: a second layer, faster and lighter, 4 cm above (two layers moving at different speeds: water, not a conveyor belt)
          if (k === 1) for (const [dy, ru, rv, su, sv] of [[0.07, 5, 5, 0.05, -0.4], [0.09, 3.7, 6.1, -0.07, -0.25]]) { const gp = ge.clone(); gp.translate(0, dy, 0); const p = new THREE.Mesh(gp, glitter(ru, rv, su, sv)); p.userData.dyn = 1; h.scene.add(p); } // the ford glints in the sun
          if (!k) continue; const g2 = ge.clone(); g2.translate(0, 0.04, 0); const e2 = new THREE.Mesh(g2, flows(h.mat('waterJade', { ...DS, transparent: true, opacity: op * 0.5, depthWrite: false, rep: [1.7, 0.6], c: 0xd8f0e0 }), 0.03, -0.85 * spd)); e2.userData.dyn = 1; h.scene.add(e2); } }
      h.pose('boxMesh', flows(mat('waterMarsh', { transparent: true, opacity: 0.85, c: 0x6a7a70 }), 0.012, 0.008), h.scene, [345, MAR - 0.05, 25], 440, 0.1, 250).userData.dyn = 1; // the marsh water: a flat sheet, the ground comes out around it; it barely drifts
      h.pose('boxMesh', flows(h.mat('waterMarsh', { transparent: true, opacity: 0.35, depthWrite: false, c: 0x9ab0a0, rep: [0.7, 0.7] }), -0.009, 0.014), h.scene, [345, MAR, 25], 440, 0.02, 250).userData.dyn = 1; // a second sheet drifting across: the patches of sky slide
      // ---------- the descent of the river: rock banks on either side of the bed, a wake of foam behind each marker, white water falling at each step and boiling at the foot ----------
      { const shores = [], sill = [], boil = [];
        for (let i = iR0 - 6; i < iR1 + 8; i += 2) for (const sd of [-1, 1]) { const s = S[i], t = 1.3 + rnd() * 1.5, [x, z] = edgePt(s, sd, s.w + 1.9 + rnd() * 1.2); shores.push([x, s.y + 0.2 + rnd() * 0.4, z, rnd() * 6, t * 1.3, t, t * 1.2]);
          if (rnd() < 0.5) { const [x2, z2] = edgePt(s, sd, s.w + 6 + rnd() * 3); shores.push([x2, s.y + 1 + rnd(), z2, rnd() * 6, 3 + rnd() * 2, 2.4 + rnd() * 2, 3 + rnd() * 2]); } }
        for (let i = iR0; i < iR1; i += 3) for (const sd of [-1, 1]) { const s = S[i + 2], [x, z] = edgePt(s, sd, s.w - 0.3); sill.push([x, s.y + 0.2, z, h.across(s), 1.5, 0.02, 4.2]); }
        for (const p of [50, 51]) { const i = P(p) + 1, s = S[i], w = s.w + 2;
          { const a = S[i - 1], b = S[i + 1]; boil.push([a.x, a.y + 0.12, a.z, h.across(a), 2 * w, 0.3, 1.8], [b.x, b.y + 0.5, b.z, h.across(b), 2 * w, 0.9, 2.6]); } const [x, z] = edgePt(S[i + 4], 0, 0); // the white water on the lip, the roller at the foot
          boil.push([x, S[i + 4].y + 0.24, z, h.across(S[i + 4]), 2 * w, 0.02, 11]);
          for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const [rx, rz] = edgePt(S[i - 1], sd, s.w + 1.6 + k * 1.6); shores.push([rx, S[i - 1].y + 0.3, rz, rnd() * 6, 1.8 + rnd(), 1.4 + rnd(), 1.8 + rnd()]); } }
        { const s = S[P(49) + 6], [x, z] = edgePt(s, 0, 0); boil.push([x, s.y + 0.24, z, h.across(s), 2 * s.w + 3, 0.02, 14]); } // where you land after the jump
        inst(h, h.geo('boulder'), mat('rockMoss'), shores); for (const l of [[ec, sill], [foamV, boil]]) { const m = inst(h, h.geo('blk'), ...l); m.userData.dyn = 1; m.frustumCulled = true; } // motionless (only the texture slides): out of frame, no longer drawn
        { const feet = [S[P(49) + 6], S[P(50) + 4], S[P(51) + 4]]; puffs(110, () => { const q = feet[rand() * 3 | 0], [x, z] = edgePt(q, rand() < 0.5 ? -1 : 1, rand() * q.w); return [x, q.y + 0.3, z]; }, { vitality: 2.8, vy: 2.3, imgSize: 8.5, f: 0.46 }); } // a cloud of spray at the foot of each step and at the landing of the jump
        { const wood = mat('barkJungle', { c: 0xd8b890 }), br = Array.from({ length: 9 }, (_, k) => ({ g: mobile('trunkLayer', { wood }, 0, 0, 0, 0, 0.95, 0, 8), u: iR0 + (iR1 - iR0) * k / 9, sd: k & 1 ? 1 : -1, r: rand() * 6 })); // branches come down the current, along the banks (outside the trajectory): purely visual, nothing to hit
          LIFE.push((dt, car, t) => { for (const b of br) { b.u += dt * 4.5; if (b.u > iR1) b.u = iR0; const i = b.u | 0, f = b.u - i, q = S[i], q1 = S[i + 1], [x, z] = edgePt(q, b.sd, q.w - 2.6), [x1, z1] = edgePt(q1, b.sd, q1.w - 2.6); // between two samples: it slides, it no longer jumps in 2 m steps
            b.g.position.set(x + (x1 - x) * f, q.y + (q1.y - q.y) * f + 0.05, z + (z1 - z) * f); b.g.rotation.y = Math.atan2(-q.tz, q.tx) + 0.4 * Math.sin(t * 0.7 + b.r); b.g.visible = b.u > iR0 + 1 && b.u < iR1 - 1; } }); }
        // the river leaves the road on the right: a big trunk lying across its exit, along the roadway, so one does not follow it (the road runs straight toward the arch)
        { const s = S[P(52) - 8], sd = [-1, 1].sort((a, b) => Math.hypot(...edgePt(s, a, 20).map((v, k) => v - [190, 490][k])) - Math.hypot(...edgePt(s, b, 20).map((v, k) => v - [190, 490][k])))[0], [x, z] = edgePt(s, sd, s.w + 2.2), ax = new THREE.Vector3(s.tx, 0.03, s.tz).normalize(), wood = mat('barkJungle');
          const pos = (g, d, y) => { const o = new THREE.Mesh(g, wood); o.position.set(x + s.tx * d, s.y + y, z + s.tz * d); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ax); h.scene.add(o); };
          pos(new THREE.CylinderGeometry(1.3, 1.7, 46, 7), 0, 1.3); pos(new THREE.CylinderGeometry(3.6, 3.2, 1.2, 7), -23.5, 1.8);
          } }
      // ---------- the forest, in three thicknesses (D-4): the wall (a row of tall trees on each side, crowns touching above the road, continuous undergrowth at the foot),
      // the forest (up to 90 m), the curtain (masses without detail that the haze reduces to silhouettes). Deliberate clearings: the camp, the city square, the cirque of the falls, the river ----------
      const roots = [], summits = [[], [], []], shafts = [], bushes = [[], []], ferns = [], palmtrees = [], curtain = [], leavesG = [], heliconias = [], vines = [];
      const PALE = [[62, -30, 30], [84, 474, 30], [CIRQUE[0], CIRQUE[1], 40], [BASIN[0], BASIN[1], 15], [626, 22, 13], [512, 410, 9], [95, 372, 29], [918, -104, 7]]; // camp, square, cirque, kapok, idol, building, head
      // lines of sight: nothing grows between the road and the marker planted on the axis of a braking point (kapok, colossal head, ruined gate, great idol) [x1, z1, x2, z2, radius]
      const VIEWS = [[598, 20, 626, 22, 12], [884, -110, 922, -104, 12], [728, -61, 642, -58, 20], [556, 410, 510, 410, 12], [996, 92, 996, 238, 24], [996, 238, 996, 298, 27], [124, 510, 66, 512, 13], [95, 440, 88, 374, 19]]; // the second hairpin opens onto the valley below; the forecourt of the cave-temple is clear (the great falls); the stepped temple at the end of its straight // … and along the bridge: the view runs toward the falls and downstream
      const segD = (x, z, [ax, az, bx, bz]) => { const ux = bx - ax, uz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz))); return Math.hypot(x - ax - ux * t, z - az - uz * t); };
      const free = (x, z) => { const r = riverDist(x, z); return r.d > r.p.w + (r.p.r ? 7 : 3) && PALE.every(([cx, cz, cr]) => (x - cx) ** 2 + (z - cz) ** 2 > cr * cr) && VIEWS.every(v => segD(x, z, v) > v[4]); };
      // a canopy tree: straight trunk, broad crown in rounded masses (k = size, 1 = 14 m of trunk; vx, vz = direction the crown leans; n = number of masses)
      const tree = (x, z, k, vx = 0, vz = 0, n = 3) => { if (marsh(x, z) > 0.6) roots.push([x, MAR - 0.5, z, rnd() * 6, 0.9 + k * 0.5]); // in the marsh, the trees stand with their feet in the water, on stilt roots
        const y = g.hAt(x, z) - 0.5, H = 14 * k, a = rnd() * 6.28, c = (dx, dy, dz, r, ap) => summits[rnd() * 3 | 0].push([x + dx, y + H + dy, z + dz, rnd() * 6, r / 3.4, r * ap / 3.4, r / 3.4]);
        shafts.push([x, y + H / 2, z, rnd() * 6, 3 * k, H / 5.2, 3 * k]); c(vx * 3, 2 * k, vz * 3, 8.5 * k, 0.62);
        if (n > 1) c(Math.cos(a) * 6 * k, -k, Math.sin(a) * 6 * k, 5.5 * k, 0.7); if (n > 2) c(-Math.cos(a) * 5 * k + vx * 4, 0, -Math.sin(a) * 5 * k + vz * 4, 5 * k, 0.7); };
      for (let i = 0; i < N; i += 3) { if (inTunnel(i) || overBridge(i)) continue; const s = S[i];
        for (const sd of [-1, 1]) { const off = s.w + 3.5 + rnd() * 4, k = 0.85 + rnd() * 0.45, [x, z] = edgePt(s, sd, off), v = rnd() < 0.75 ? 1 : -0.6; // gaps and spreading crowns: the sun falls in patches on the road
          if (rnd() > (marsh(x, z) > 0.5 ? 0.5 : 0.12) && g.dAt(x, z) > off - 1.5 && free(x, z)) tree(x, z, k, s.tz * sd * v, -s.tx * sd * v); } }
      for (let k = 0; k < 6500; k++) { const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z), u = rnd(), t = 0.8 + rnd() * 0.7;
        if (d < 15 || d > 90 || !free(x, z) || (marsh(x, z) > 0.5 && u > 0.45)) continue; // open forest in the marsh: the water can be seen
        if (d < 40 && u < 0.1) palmtrees.push([x, g.hAt(x, z) - 0.3, z, rnd() * 6, 0.8 + rnd() * 0.5]); else tree(x, z, t * (d < 32 ? 1 : 1.2), 0, 0, d < 32 ? 2 : 1); }
      for (let k = 0; k < 1900; k++) { const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z), t = 3 + rnd() * 1.6;
        if (d > 85 && d < 215 && free(x, z)) curtain.push([x, g.hAt(x, z) + 9 + rnd() * 6, z, rnd() * 6, t, t * 0.75, t]); }
      // the undergrowth: a continuous strip at the foot of the wall of trees, two rows; it hides the ground and the trunks behind
      for (let i = 0; i < N; i += 2) { if (inTunnel(i) || overBridge(i) || ford(S[i])) continue; const s = S[i];
        for (const sd of [-1, 1]) for (const tier of [0, 1]) { if (tier && (i & 2)) continue; const off = s.w + 2.6 + tier * 3.4 + rnd() * 2.4, [x, z] = edgePt(s, sd, off), u = rnd(), t = 0.4 + rnd() * 0.35 + tier * 0.3, y = tier ? g.hAt(x, z) : s.y - 0.5;
          if (g.dAt(x, z) < off - 1.5 || !free(x, z)) continue;
          if (u < 0.16) ferns.push([x, y, z, rnd() * 6, 0.6 + rnd() * 0.5]); else if (u < 0.46) (u < 0.2 ? heliconias : leavesG).push([x, y, z, rnd() * 6, 0.9 + rnd() * 0.7]); else bushes[u < 0.55 ? 0 : 1].push([x, y + 1.9 * t, z, rnd() * 6, t, t * 0.72, t]); } }
      const leaves = ['leafShade', 'leafCanopy', 'leafSun'].map(n => mat(n)), bark = mat('barkJungle'), frond = mat('palmJungle', DS);
      bushes.forEach((l, k) => inst(h, h.geo('summit'), leaves[k + 1], l));
      // the marsh: stilt roots under the trees, giant water lilies (Victoria regia) and their flowers near the roadway
      insts(h, 'rootsStilts', { wood: bark }, roots);
      { const lily = [], fl = []; for (let k = 0; k < 420; k++) { const x = 150 + rnd() * 400, z = roadZ(x) - 60 + rnd() * 180, t = 1.3 + rnd() * 1.5; if (marsh(x, z) > 0.85 && g.dAt(x, z) > 8.5 && g.dAt(x, z) < 40) { lily.push([x, MAR + 0.02, z, rnd() * 6, t, 1, t]); if (rnd() < 0.3) fl.push([x + t * 0.5, MAR + 0.2, z, rnd() * 6, 0.45, 0.4, 0.45]); } }
        inst(h, h.geo('waterLily'), mat('paint', { c: 0xa6d24a }), lily).castShadow = false; inst(h, h.geo('blk'), mat('paint', { c: 0xf0a8c8 }), fl); }
      // a flock of white egrets resting in the marsh water, on either side of the flooded crossing: they take off on approach and fly off to the side (before the chicane's braking)
      { const skinA = { paw: mat('paint', { c: 0x8a4a56 }), feather: mat('paint', { c: 0xf0a2b4 }), beak: mat('paint', { c: 0x2a2226 }) }, i0 = P(2) + 8; // flamingos
        const whiteN = mat('paint', { emis: 1, c: 0xe88ea4, ...DS }); /* pure pink, not lit: in bright white the light washed them out, and lit, the wings seen from below were black */
        for (const headEl of [0, 1]) { const bs = []; for (let k = 0; k < 12; k++) { const q = S[i0 + 2 + (rand() * 24 | 0)], sd = (k + headEl) & 1 ? 1 : -1, [x, z] = edgePt(q, sd, q.w + 2.5 + rand() * 6), v = 2 + rand() * 2.5, av = 10 + rand() * 7;
            bs.push({ x, y: MAR - 0.2, z, r: rand() * 6.28, vx: -q.tz * sd * v + q.tx * av, vy: 0.7 + rand() * 0.9, vz: q.tx * sd * v + q.tz * av, e: [1.5, 1.5, 1.5] }); }
          const l = bs.map(q => [q.x, q.y, q.z, q.r, 1.5]); // standing: the beach flamingo; in flight: body horizontal, neck and legs outstretched, two long wings
          takeoff(insts(h, 'flamingo', skinA, l, { a: [headEl] }), bs, i0, { vol: insts(h, 'egretFlight', { ...skinA, feather: whiteN }, l), wings: [inst(h, h.geo('wingsBird', 1.5, 1.1, 0.4), whiteN, l)], D: 28, T: 7, g: 0.05, drumset: 3.4 }); } }
      insts(h, 'fernArbo', { stipe: bark, fernFrond: frond }, ferns); insts(h, 'jucara', { stipe: bark, frond }, palmtrees);
      inst(h, h.geo('summitFar'), mat('leafFar'), curtain).castShadow = false;
      const leafG = mat('leafSun', DS), redTone = mat('paint', { c: 0xd8362a });
      insts(h, 'bigLeaf', { leafKey: leafG }, leavesG); insts(h, 'bigLeaf', { leafKey: leafG, flower: redTone }, heliconias, { a: [1, 1] });

      // ---------- the thick haze of the river and the cirque: low sheets, more than 22 m from the roadway, never up in the air against the sky (D-6) ----------
      { const sheets = [], G = new THREE.PlaneGeometry(1, 1); G.rotateX(-Math.PI / 2);
        for (let j = 0; j < RIVER.length; j += 5) { const p = RIVER[j], x = p.x + (rnd() - 0.5) * 20, z = p.z + (rnd() - 0.5) * 20; if (g.dAt(x, z) > 45) sheets.push([x, p.y + 1.5 + rnd() * 4, z, rnd() * 6, 30 + rnd() * 30, 1, 22 + rnd() * 20]); }
        for (let k = 0; k < 5; k++) sheets.push([CIRQUE[0] + 4 + (rnd() - 0.5) * 26, 35 + rnd() * 7, CIRQUE[1] + 16 + (rnd() - 0.5) * 16, rnd() * 6, 26 + rnd() * 14, 1, 22 + rnd() * 10]); // the cloud at the foot of the falls only
        const b = inst(h, G, mat('haze', { emis: 1, c: 0x343c24, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, ...DS }), sheets); b.castShadow = b.receiveShadow = false; }

      puffs(130, () => { for (let k = 0; k < 30; k++) { const x = 150 + rand() * 320, dz = -60 + rand() * 180, z = roadZ(x) + dz; if (marsh(x, z) > 0.85 && Math.abs(dz) > 12) return [x, MAR + 0.6, z]; } return [300, MAR + 0.6, 60]; },
        { vitality: 12, vy: 0.5, imgSize: 36, f: 0.46, c: [0.93, 0.97, 0.86] }); // the morning haze rises off the marsh, far from the roadway, and drifts west

      // ---------- materials and tools for placing the markers ----------
      const stone = mat('stoneCity'), shadows = mat('stoneShade'), paleM = mat('stonePale'), gold = mat('paint', { emis: 1, c: 0xe8b83a }), blackM = mat('paint', { c: 0x14120e }), flame = mat('paint', { emis: 1, c: 0xffb040, fog: false }),
        wood = mat('barkJungle', { c: 0xc8a878 }), cloth = mat('clothTent', DS), bamboo = mat('bamboo'), board = mat('boardsBridge'), lampObj = mat('paint', { emis: 1, c: 0xffd890 }), iron = mat('paint', { c: 0x2a2a26 }),
        CITY_PAL = { stone, shadows, clair: paleM, gold, blackM, relief: shadows, plinth: mat('plinthBlack'), inscription: mat('inscription512') };
      // an object placed at (x, z), rotated by ry (its +Z then points toward (sin ry, cos ry)); y = the default ground
      const pose = (label, skin, x, z, ry = 0, y = g.hAt(x, z), ...a) => { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; h.scene.add(p); h.pose(label, skin, p, [0, 0, 0], ...a); return p; };
      // a living flame (campfire, portal braziers; never the torches, which mark the braking points): two tongues whose height changes, bent by the wind; l = its light fixture, which breathes with it
      const heartFire = mat('paint', { emis: 1, c: 0xffe890, fog: false });
      const flameVivid = (x, y, z, k = 1, l = null, lw = 1) => { const p = new THREE.Group(); p.position.set(x, y, z); p.userData.dyn = 1; h.scene.add(p); const tongues = [[0.62, 0.7, 0.68, 0], [0.42, 0.6, 1.28, 0.03], [0.22, 0.55, 1.78, 0.08]].map(([w, ht, y, dx]) => h.pose('boxMesh', flame, p, [dx * k, y * k, 0], w * k * lw, ht * k, w * k * lw)); /* three tongues, narrower and narrower: a point, not a block */
        h.pose('boxMesh', heartFire, p, [0, 0.22 * k, 0], 0.7 * k * lw, 0.44 * k, 0.7 * k * lw); /* the yellow core */
        const ph = rand() * 9, c0 = l && l.c ? l.c.clone() : null; LIFE.push((dt, car, t) => { const f = 1 + 0.1 * Math.sin(t * 4.1 + ph) + 0.05 * Math.sin(t * 7.3 + ph * 2); p.scale.set(1 + 0.06 * Math.sin(t * 3.3 + ph), f, 1 + 0.05 * Math.sin(t * 2.7 + ph * 3)); p.rotation.z = 0.14 + 0.05 * Math.sin(t * 1.9 + ph);
          tongues.forEach((m, j) => { const u = 0.5 + 0.5 * Math.sin(t * (3.1 + 1.3 * j) + ph * (j + 1)); m.scale.set(0.92 + 0.16 * u, 0.85 + (0.3 + 0.1 * j) * u, 0.92 + 0.16 * u); }); /* slow: the flame undulates (period 0.9 to 2 s, ±15% height), it does not bounce; each tongue has its own rhythm */ if (c0) l.c.copy(c0).multiplyScalar(0.9 + 0.6 * (f - 1)); }); };
      // at the roadside, facing it: sample i, side sd, at off m from the axis
      const atEdge = (label, skin, i, sd, off, ...a) => { const s = S[(i + N) % N], [x, z] = edgePt(s, sd, off); return pose(label, skin, x, z, Math.atan2(s.x - x, s.z - z), s.y - 0.35, ...a); };
      // the expedition's torches: they mark the braking points in place of signs (O-5): two at 100 m, one at 50 m; and the sites
      const torches = [], torch = (i, sd, off = 1.1) => { const s = S[(i + N) % N], [x, z] = edgePt(s, sd, s.w + off); torches.push([x, s.y - 0.3, z, rnd() * 6]); h.emis((i + N) % N, x, s.y + 2.6, z, 0xffa040, 13, 1.6); };
      for (const k of [16, 22, 44, 47]) { const i = P(k), sd = S[i].k > 0 ? -1 : 1; for (const d of [-7, 0, 7]) torch(i + d, sd, 1.4); } // three flames outside each tight bend: the two hairpins, the two square corners
      for (const k of [4, 14, 20, 42, 52]) { const i = P(k) - (k === 42 ? 12 : 0); torch(i - 52, -1); torch(i - 52, 1); torch(i - 26, S[i].k > 0 ? -1 : 1); }

      // ---------- the fauna: pure scenery, nothing is hit, nothing moves on the axis of a braking point ----------
      const MONKEYS = [], blackDS = mat('paint', { c: 0x1a1816, ...DS });
      // a bird in flight: one body and two wings on a pivot (they flap, or glide in a V)
      const bird = (skin, k = 1, l = 1) => { const p = mobile('birdFlight', skin, 0, 0, 0, 0, k, 0, l), wings = [-1, 1].map(sd => { const a = new THREE.Group(); a.position.set(0.05, 0.08, sd * 0.12); a.scale.z = sd; p.add(a); h.pose('wingBird', skin, a); return a; }); p.rotation.order = 'YXZ'; return { p, wings }; };
      { const worth = { feather: blackDS, beak: mat('paint', { c: 0xb0a890, ...DS }), queue: blackDS }; // vultures (urubus) circle over the gorge, right of the bridge (downstream); two more are perched on top of the stepped temple
        const flights = [[962, 78, 172, 26, 0], [968, 85, 150, 34, 2.1], [950, 72, 198, 20, 4.2]].map(([x, y, z, r, ph]) => ({ o: bird(worth, 2.8, 0.7), x, y, z, r, ph }));
        LIFE.push((dt, car, t) => { for (const v of flights) { const a = t * 6.5 / v.r + v.ph; v.o.p.position.set(v.x + v.r * Math.cos(a), v.y + 1.5 * Math.sin(a * 0.6), v.z + v.r * Math.sin(a)); v.o.p.rotation.set(0.3, -a - Math.PI / 2, 0); v.o.wings.forEach((w, k) => { w.rotation.x = (k ? -1 : 1) * (0.22 + 0.05 * Math.sin(t * 0.9 + v.ph)); }); } });
      }
      { const ara = { feather: mat('paint', { c: 0xe0241a, ...DS }), beak: mat('paint', { c: 0xf0e8d0, ...DS }), queue: mat('paint', { c: 0x2a5ad0, ...DS }) }, two = [bird(ara, 2.3, 1.5), bird(ara, 2.3, 1.5)]; // two red macaws come up the road at the chicane's exit, low under the canopy, and pass over the car
        const i0 = P(8) + 2, iA = P(10) + 40, iB = P(8) + 6, T = 7.5; let en = 0, tt = 99;
        LIFE.push((dt, car) => { if (!car) return; const e = (i0 - car.idx + N) % N; if (!en && e < 12 && e > 0) { en = 1; tt = 0; } else if (en && e > 300 && e < N - 300) en = 0; tt += dt;
          two.forEach(({ p, wings }, k) => { const u = (tt - k * 0.3) / T; p.visible = u > 0 && u < 1; if (!p.visible) return; const q = S[Math.round(iA + (iB - iA) * u)], [x, z] = edgePt(q, 1, 4 - 9 * u + k * 2.5); p.position.set(x, q.y + 7.5 - k * 1.3, z); p.rotation.set(0, Math.atan2(q.tz, -q.tx), 0);
            wings.forEach((w, j) => { w.rotation.x = (j ? -1 : 1) * 0.6 * Math.sin(tt * 9 + k); }); }); }); }

      // ---------- Z1, the base camp (O-10): tents, map table, crates, tarpaulined 4x4, radio mast, in the clearing on the left; the expedition is here ----------
      { const P1 = { cloth, wood, paper: mat('paint', { c: 0xe8dcc0 }), lampObj, iron, carBody: mat('paint', { c: 0x5a6a3a }), pane: blackM, tire: iron };
        for (const [x, z, r] of [[24, -19, 0.2], [44, -27, -0.1], [72, -26, 0.15], [94, -19, -0.3]]) pose('tent', P1, x, z, r).scale.setScalar(1.5);
        pose('tableMaps', P1, 58, -17, 0.3); pose('bodies', P1, 38, -13, 0.5); pose('bodies', P1, 82, -14, 2.2); pose('fourFour', P1, 106, -15, 1.25); pose('matRadio', P1, 62, -44);
        pose('fireCamp', { stone, wood, flame }, 50, -11); flameVivid(50, g.hAt(50, -11) + 0.3, -11, 1.5, h.emis(25, 50, 16, -11, 0xffa040, 14, 1.8), 1.9); puffs(30, () => [50 + (rand() - 0.5) * 0.8, g.hAt(50, -11) + 2.4, -11 + (rand() - 0.5) * 0.8], { vitality: 6, vy: 2.4, imgSize: 4.2, f: 0.44, c: [0.62, 0.62, 0.6] }); /* the fire is alive, its glow breathes, it smokes */ pose('scaffold', { bamboo, board }, 8, -22, 1.57, undefined, 4, 3); pose('tableMaps', P1, 84, -22, -0.4); pose('bodies', P1, 16, -12, 2.6); pose('bodies', P1, 66, -11, 0.2); pose('fourFour', P1, 122, -18, 1.9);
        { const lant = [20, 36, 52, 68, 84, 100].map(x => { const p = new THREE.Group(); p.position.set(x, 19.6, -10.5); p.userData.dyn = 1; h.scene.add(p); h.pose('boxMesh', lampObj, p, [0, -0.4 - Math.abs(x - 60) * 0.004, 0], 0.3, 0.4, 0.3); return p; }); let whoosh = 0; // the lanterns hang from their wire: they sway, more strongly as cars pass
          LIFE.push((dt, car, t) => { if (car && car.x > -10 && car.x < 130 && Math.abs(car.z + 10.5) < 22 && Math.hypot(car.vx, car.vz) > 15) whoosh = 1; whoosh = Math.max(0, whoosh - dt * 0.35); lant.forEach((p, k) => { p.rotation.x = (0.2 + 0.5 * whoosh) * Math.sin(t * 2.6 + k * 1.3); }); });
          for (const x of [36, 68, 100]) h.emis(x >> 1, x, 18.6, -10.5, 0xffd890, 11, 1.2); // three lanterns out of six really light
} h.pose('boxMesh', iron, h.scene, [60, 19.6, -10.5], 84, 0.05, 0.05); for (const x of [18, 102]) h.pose('boxMesh', wood, h.scene, [x, 17.4, -10.5], 0.16, 4.6, 0.16); // a string of lanterns along the road
        pose('bodies', P1, -30, -12, 1); pose('boat', P1, -82, 236, 0.9, 14.12).scale.setScalar(1.5); /* the boat floats at the edge of the ford (it was resting on the bottom, under the water) */ pose('bodies', P1, -108, 120, 2); // T-8: the expedition's tracks from the ford
        for (const [x, z] of [[58, -17], [30, -18], [90, -18]]) h.emis(30, x, 17.5, z, 0xffd890, 16, 1.4); torch(8, -1, 2); torch(60, -1, 2); torch(-40, -1); torch(-40, 1); }

      // ---------- Z2, the kapok (O-11): in the axis of the chicane's braking, the road goes around it; rope ladder and observation platform ----------
      { const [x, z] = [626, 22], y = g.hAt(x, z) - 0.6; pose('kapok', { wood: bark, board, racingLine: bamboo }, x, z, 2.2, y);
        for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, r = k ? 11 : 0, t = (k ? 11 : 15) / 3.4; summits[k % 3].push([x + Math.cos(a) * r, y + 43 + (k ? rnd() * 4 - 3 : 3), z + Math.sin(a) * r, rnd() * 6, t, t * 0.6, t]); } }

      // ---------- Z3, the hairpins: the colossal head and its followers (smaller heads half buried, statues, obelisks, wall sections) in the axis of the first hairpin, a ruined gate in the axis of the second ----------
      {
        pose('headColossal', CITY_PAL, 922, -104, -Math.PI / 2 + 0.25).scale.setScalar(1.8); h.emis(P(14), 912, g.hAt(912, -104) + 5, -104, 0xffa040, 26, 2.2);
        { const t2 = pose('headColossal', CITY_PAL, 916, -122, -Math.PI / 2 - 0.5, g.hAt(916, -122) - 1.2); t2.scale.setScalar(0.85); t2.rotation.z = 0.2; pose('headColossal', CITY_PAL, 913, -83, -Math.PI / 2 + 0.9, g.hAt(913, -83) - 0.8).scale.setScalar(0.7);
          for (const [x, z, t] of [[909, -116, 1.6], [910, -93, 1.4], [926, -90, 1.8]]) pose('statueStanding', CITY_PAL, x, z, -Math.PI / 2, undefined, t); pose('obelisk', CITY_PAL, 930, -116, 0.3, undefined, 12); pose('obelisk', CITY_PAL, 931, -95, 0.1, undefined, 9);
          h.pose('boxMesh', stone, h.scene, [934, g.hAt(934, -105) + 2.2, -105], 2, 5, 26); h.pose('boxMesh', mat('curbMoss'), h.scene, [934, g.hAt(934, -105) + 4.9, -105], 2.6, 0.5, 26.6); torch(P(15), -1, 2.5); } torch(P(16), -1, 2.5);
        const pr = pose('arc', CITY_PAL, 690, -52, Math.PI / 2 - 0.2, undefined, 3, 0.9, 2.2, 7, 4); for (const sd of [-1, 1]) h.pose('boxMesh', stone, pr, [sd * 3.6, 2.2, 0], 1.6, 4.4, 2.4); h.pose('boxMesh', paleM, pr, [0, 8.4, 0], 9.4, 0.8, 2.8);
        pose('statueStanding', CITY_PAL, 694, -60, Math.PI / 2, undefined, 1.2); pose('statueStanding', CITY_PAL, 692, -44, Math.PI / 2, undefined, 1.2); }

      // ---------- Z4, the liana bridge (O-12) and the great falls (O-13) ----------
      { const a = P(32) - 4, b = P(33) + 4, n = b - a, KI = new Map(); for (let k = 0; k <= n; k++) KI.set(S[a + k], k / n);
        const yc = s => 1.5 + 8.8 * (2 * KI.get(s) - 1) ** 2, vine = mat('barkJungle', { ...DS, c: 0xa8b070 }), susp = [], poles = [];
        h.ribbon(a, n, -W - 0.3, 0.06, W + 0.3, 0.06, mat('boardsBridge', DS), 4); // the deck: planks in place of the roadway
        for (const sd of [-1, 1]) { const x = sd * (W + 0.7);
          h.ribbon(a, n, x, s => yc(s) + 0.22, x, s => yc(s) - 0.22, vine, 3); h.ribbon(a, n, x - 0.22, yc, x + 0.22, yc, vine, 3); // the two load-bearing cables of braided lianas, in catenary
          h.ribbon(a, n, x, 1.3, x, 1.12, vine, 3); h.ribbon(a, n, sd * (W + 0.3), 0.3, sd * (W + 0.3), -0.25, board, 4); // handrail, deck edge
          for (let k = 1; k < n; k++) { const s = S[a + k], [px, pz] = edgePt(s, sd, W + 0.7), hh = yc(s); susp.push([px, s.y + hh / 2, pz, 0, 0.09, hh, 0.09]); if (k % 3 === 0) poles.push([px, s.y + 0.65, pz, 0, 0.14, 1.3, 0.14]); }
          for (const i of [a, b]) { atEdge('obelisk', CITY_PAL, i, sd, W + 1.9, 10.6); if (i === a || sd < 0) { const q = S[i], [x, z] = edgePt(q, sd, W + 1.9); MONKEYS.push([x, q.y + 11.05, z, toStack(x, z, S[i - 24]), 3]); } } } // a monkey seated on top of three of the obelisks (fixed: one arrives in a narrow gorge)
        inst(h, h.geo('blk'), vine, susp); inst(h, h.geo('blk'), board, poles);
        for (const [i, rv] of [[a + 2, 0], [b - 2, Math.PI]]) { const r = marker(h, S[i]); h.pose('boxMesh', shadows, r, [0, -9.2, rv ? -4.5 : 4.5], 2 * W + 6, 18, 9); } // the stone abutments, in the gorge wall
        // the falls: a narrow, striated white ribbon in a dark notch of the cliff, which breaks into cloud at two-thirds; no column or translucent block
        const ch = (op) => mat('dropWire', { emis: 1, c: 0xb4ccc8, transparent: op < 1, opacity: op, depthWrite: op === 1 }), cx = CIRQUE[0] + 3, cz = CIRQUE[1] + 28; // right in front of the cirque's south wall (it rises to 30 m from the centre)
        h.pose('boxMesh', mat('rockMoss', { c: 0x4a4a44 }), h.scene, [cx, 72, cz + 3], 60, 80, 3);
        // water streaks of uneven widths and lengths, broken by mossy rock steps; at the bottom the water breaks up (translucent streaks): water lit by daylight, not a glowing paving
        // PROTOTYPE: the water flows. Curved sheets in place of boxes: the blade peels off the lip, falls spreading out on the step,
        // bounces and spreads out to the basin. Each sheet is doubled by a second, more holed and faster one, 40 cm in front (the principle of the two moving layers of water in the three.js examples, Water2,
        // without its two scene renders); at the foot, a crown of foam that spreads out. The motion: the texture slides (Texture.offset, in the tick returned at the end), no geometry moves.
        {
          const high = [[cx - 1, 111, cz + 2.6, 7], [cx - 1, 109.6, cz + 1.2, 7.6], [cx - 0.8, 106, cz + 0.4, 8.4], [cx - 0.5, 96, cz + 0.1, 9.4], [cx, 80, cz, 10.6], [cx + 0.4, 66, cz, 11.6], [cx + 0.6, 60, cz + 0.2, 12.4]],
            low = [[cx + 0.6, 61, cz - 0.2, 10], [cx + 0.8, 59.4, cz - 2, 12], [cx + 1, 54, cz - 3, 14], [cx + 1, 44, cz - 3.4, 16], [cx + 1, 33.2, cz - 3.6, 18.5]],
            netting = [[cx + 9.4, 104, cz + 1.4, 1.6], [cx + 9.6, 90, cz + 0.6, 2.2], [cx + 9.8, 72, cz + 0.4, 2.8], [cx + 10, 61, cz + 0.4, 3.2]], netting2 = [[cx - 9, 86, cz + 1.4, 1.4], [cx - 9.2, 74, cz + 0.8, 2], [cx - 9.4, 61, cz + 0.6, 2.4]];
          for (const l of [high, low]) for (const q of l) q[3] *= 3; for (const q of netting) q[0] += 14; for (const q of netting2) q[0] -= 14; /* the great falls of the map: lots of water, three times the width of the prototype */
          sheet(high, e1, 3); sheet(high, e2, 2.4, -0.4); sheet(low, e1, 4.2); sheet(low, e2, 3.3, -0.5);
          sheet(low.map(([x, y, z, w], k) => [x - 1.5 * k, y, z - 1 - 0.5 * k, w * (1.1 + 0.07 * k)]), e3, 5, -1.5); sheet([[cx - 1, 114, cz + 2.4, 23], [cx - 1, 111.4, cz + 2, 23.6], [cx - 1, 107, cz + 0.1, 25.5]], foamV, 6, -0.8); /* halfway up the falls break up: a holed veil, faster, which the wind pushes west; the lip boils */ sheet(netting, e2, 0.2); sheet(netting2, e2, 0.2);
          // the falls take the whole cirque wall: two other faces, to the south-east and east (the left wall seen from the bridge), each with its rock face behind
          for (const th of [Math.PI / 4, Math.PI / 2, Math.PI * 0.72]) { const G = new THREE.Group(); G.position.set(CIRQUE[0] + 30 * Math.sin(th), 0, CIRQUE[1] + 30 * Math.cos(th)); G.rotation.y = th; h.scene.add(G); const w = 27;
            h.pose('boxMesh', mat('rockMoss', { c: 0x4a4a44 }), G, [0, 72, 4.5], w + 8, 82, 3);
            const pan = [[0, 112, 3, w * 0.8], [0, 110.5, 1.4, w * 0.84], [0, 104, 0.4, w * 0.88], [0, 84, 0, w * 0.94], [0, 60, -0.6, w], [0, 33.2, -2.6, w * 1.1]]; sheet(pan, e1, 3, 0, G); sheet(pan, e2, 2.4, -0.45, G); }
          // the vapour at the foot: round, soft puffs rising from the basin, growing and fading (a single point cloud, additive: each puff fades by darkening its colour)
          // the vapour: many small warm puffs (backlit) rising from the basin, a plume overtopping the cliff, and spray the wind pushes across the bridge deck
          { const nc = () => { const a = rand() * Math.PI * 0.9 - 0.1, r = 12 + rand() * 16; return [CIRQUE[0] + r * Math.sin(a), 33 + rand() * 6, CIRQUE[1] + r * Math.cos(a)]; };
            puffs(220, nc, { vitality: 12, vy: 5.6, imgSize: 15, f: 0.36, c: [1, 0.97, 0.88] }); puffs(70, () => [cx - 16 + rand() * 34, 55 + rand() * 9, cz - 3 - rand() * 4], { vitality: 5, vy: 1.6, vx: -2.6, imgSize: 14, f: 0.42 }); /* and at the step, halfway up, where the falls break up */
            puffs(170, () => [1001 + rand() * 24, 62.5 + rand() * 8, 160 + rand() * 58], { vitality: 4, vx: -7.5, vy: 0.7, imgSize: 10, f: 0.4 }); /* not beyond z 218: the end of the bridge and the cave entrance stay clear */ }
          { const P = [], U = [], I = [], NA = 14; for (let j = 0; j <= NA; j++) { const a = Math.PI * j / NA, c = Math.cos(a), sn = Math.sin(a); P.push(cx + 1 + c * 24, 33.12, cz - 3.2 - sn * 2, cx + 1 + c * 34, 33.12, cz - 3.2 - sn * 26); U.push(j / NA * 5, 0, j / NA * 5, -1.6);
              if (j) { const a0 = (j - 1) * 2; I.push(a0, a0 + 1, a0 + 2, a0 + 2, a0 + 1, a0 + 3); } }
            const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); ge.setIndex(I); ge.computeVertexNormals();
            const o = new THREE.Mesh(ge, ec); o.userData.dyn = 1; h.scene.add(o); const o2 = new THREE.Mesh(ge.clone().translate(0, 0.06, 0), foamV); o2.userData.dyn = 1; h.scene.add(o2); } /* a second crown, faster: the basin boils */ }
        inst(h, h.geo('boulder'), mat('rockMoss'), [[cx - 7, 88, cz + 1, 0.4, 3.2, 2.2, 2], [cx + 3, 74, cz + 0.8, 1.9, 3.6, 2, 2], [cx - 2, 58, cz + 0.4, 2.7, 4.4, 2.4, 2.4], [cx + 7, 96, cz + 1, 0.9, 2.6, 1.8, 2], [cx - 6, 36, cz - 3, 1, 4, 2.4, 3], [cx + 5, 35.5, cz - 4, 2.2, 3.4, 2, 3]]); }

      // ---------- Z5, the cave-temple (O-14): a façade cut into the cliff around each portal, braziers lit ----------
      for (const [i, rv, H] of [[t0, 0, 9], [t1, Math.PI, 8]]) { const r = marker(h, S[i]); r.rotation.y += rv; h.pose('facadeTemple', CITY_PAL, r, [0, -0.3, 0.6], S[i].w, H);
        { const rr = [], w = S[i].w, V = new THREE.Vector3(); r.updateMatrixWorld(); const pose = (x, y, z, t) => { V.set(x, y, z).applyMatrix4(r.matrixWorld); rr.push([V.x, V.y, V.z, rnd() * 6, t * 1.3, t, t * 1.2]); };
          for (const sd of [-1, 1]) for (let k = 0; k < 16; k++) { const u = rnd(), d = w + 10 + u * 34; /* the rubble spreads 5 m apart: the entrance was too narrow */ pose(sd * d, rnd() * rnd() * (40 - u * 22), 1 + rnd() * 5 + (1 - u) * 3, 6 + rnd() * 6); }
          for (let k = 0; k < 9; k++) pose((rnd() - 0.5) * 2 * (w + 5), H + 10 + rnd() * 22, 0.5 + rnd() * 2.5, 5 + rnd() * 5);
          inst(h, h.geo('boulder'), mat('rockMoss'), rr); }
        for (const sd of [-1, 1]) { const b = new THREE.Group(); b.position.set(sd * (S[i].w + 3.4), 0, 14); b.scale.setScalar(1.7); /* 17 m in front of the portal: at 5 m, the rubble hid them */ r.add(b); h.pose('torch', { wood: iron, iron, flame }, b, [0, 0, 0]); }
        r.updateMatrixWorld(); for (const sd of [-1, 1]) { const q = r.localToWorld(new THREE.Vector3(sd * (S[i].w + 3.4), 5, 14)); flameVivid(q.x, q.y - 0.55, q.z, 1.7, h.emis(i, q.x, q.y, q.z, 0xffa040, 22, 2.2)); } } // the portal braziers flicker, and their glow with them
      { const cs = Array.from({ length: 110 }, () => { const q = S[t0 - 5 + (rand() * 17 | 0)], [x, z] = edgePt(q, rand() < 0.5 ? -1 : 1, rand() * 5), v = 6 + rand() * 5, k = 0.45 + rand() * 0.35; return { x, y: q.y + 2.4 + rand() * 4.6, z, r: 0, vx: -q.tx * v + (rand() - 0.5) * 3, vy: -0.4 + rand() * 1.1, vz: -q.tz * v + (rand() - 0.5) * 3, e: [k, k, k] }; });
        takeoff([], cs, t0 + 4, { wings: [inst(h, h.geo('wingsV', 0.85), mat('paint', { emis: 1, c: 0x120c0a, ...DS }), cs.map(q => [q.x, q.y, q.z]))], D: 45, T: 5, g: 0.1, drumset: 24 }); } // a swarm of bats leaves the cave as one enters: low by the vault, toward daylight

      const RUNNERS = []; // monkeys that flee on approach: [sample, x, y, z, side]
      // wall torches in the cave, the same as on the road, leaning out from the wall, alternating sides every 20 m: they are the light sources (one fixture each)
      for (let i = t0 + 9, k = 0; i < t1 - 5; i += 10, k++) { const q = S[i], sd = k & 1 ? 1 : -1, [x, z] = edgePt(q, sd, q.w - 0.1), o = new THREE.Group(), p = new THREE.Group(); o.position.set(x, q.y + 1.2, z); o.rotation.y = Math.atan2(q.x - x, q.z - z); p.rotation.x = 0.3; p.scale.setScalar(1.6); o.add(p); h.scene.add(o); // foot set in the wall at 1.2 m, flame 5 m high and 1.3 m from the wall: nothing within the cars' clearance
        h.pose('torch', { wood, iron, flame }, p, [0, 0, 0]); const [lx, lz] = edgePt(q, sd, q.w - 1.6); h.emis(i, lx, q.y + 5, lz, 0xffa040, 20, 2.3, 1); }
      // ---------- Z6, the descent of the idols (O-15, T-6): standing statues closer and closer together up to the arch; the great seated idol in the axis of the right angle ----------
      { const st = []; let sd = 1; for (const d of [22, 42, 62, 84, 124, 164, 244, 324, 404, 484, 564]) { const i = P(52) - (d >> 1), s = S[i], [x, z] = edgePt(s, sd, s.w + 1.6); if (free(x, z)) st.push([x, s.y - 0.4, z, Math.atan2(s.x - x, s.z - z), 1.5 + (d < 100 ? 0.3 : 0)]); sd = -sd; }
        const yB = g.hAt(BASIN[0], BASIN[1]) + 1.5; for (const [dx, dz, a, t] of [[-17, 0, 0.5, 2.6], [-9, -15, 0.3, 1.5], [-9, 15, 0.7, 1.5]]) st.push([BASIN[0] + dx, g.hAt(BASIN[0] + dx, BASIN[1] + dz) - 0.3, BASIN[1] + dz, Math.PI * a, t]); // the guardians of the basin
        { const rr = []; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283 + rnd() * 0.3, t = 1.4 + rnd() * 1.6; rr.push([BASIN[0] + 13.5 * Math.cos(a), g.hAt(BASIN[0] + 13.5 * Math.cos(a), BASIN[1] + 13.5 * Math.sin(a)) + 0.2, BASIN[1] + 13.5 * Math.sin(a), rnd() * 6, t * 1.3, t, t * 1.2]); } inst(h, h.geo('boulder'), mat('rockMoss'), rr);
          h.pose('boxMesh', flows(h.mat('waterJade', { ...DS, transparent: true, opacity: 0.86, gloss: 0.5 }), 0.015, 0.03), h.scene, [BASIN[0], yB, BASIN[1]], 30, 0.1, 30).userData.dyn = 1;
        }
        insts(h, 'statueStanding', CITY_PAL, st);
        pose('idolSeated', CITY_PAL, 508, 410, Math.PI / 2).scale.setScalar(1.6); for (const dz of [-6, 6]) { const p = pose('torch', { wood: iron, iron, flame }, 518, 410 + dz); p.scale.setScalar(1.6); h.emis(P(43), 518, g.hAt(518, 410) + 4.5, 410 + dz, 0xffa040, 20, 2); }
      } // the idol is lit by its two torches (two fixtures): no added halo

      // ---------- Z7, the lost city (O-16): the triple arch, the paved square at the river's edge, the statue pointing north on its black plinth, four obelisks, the great building; the expedition has put its scaffolding up there ----------
      { const ia = P(52), ra = marker(h, S[ia]); h.pose('arcTriple', CITY_PAL, ra, [0, -0.5, 0], 7.5); h.pose('scaffold', { bamboo, board }, ra, [15.5, -0.3, 4.2], 8, 3);
        h.pose('boxMesh', mat('slabsEdge', { c: 0x9a9c84 }), h.scene, [82, 16.62, 468], 96, 0.5, 132); // the square: a flat paving, under the roadway (1.2 m slabs, moss in the joints)
        { const wallMeshes = [], mosses = [], heap = []; // the ruins of the town around the square: low wall sections outlining houses, moss on them, fallen blocks
          for (const [x, z, l, r, hh] of [[44, 452, 14, 0, 2.6], [37, 459, 14, 1.57, 1.8], [51, 462, 9, 1.57, 3.2], [40, 490, 12, 0, 2.2], [34, 498, 16, 1.57, 3], [46, 528, 18, 0, 2.4], [122, 452, 12, 0, 3], [128, 462, 16, 1.57, 2], [118, 476, 10, 0, 1.6], [132, 494, 12, 1.57, 2.8], [108, 536, 20, 0, 2.6], [60, 536, 10, 0, 1.8], [140, 520, 10, 1.57, 3.4], [56, 404, 12, 1.57, 2.4]]) {
            wallMeshes.push([x, 16.85 + hh / 2, z, r, l, hh, 1.3]); mosses.push([x, 16.9 + hh, z, r, l + 0.3, 0.25, 1.6]); if (rnd() < 0.7) heap.push([x + Math.cos(r) * (l / 2 + 1.5), 17.3, z - Math.sin(r) * (l / 2 + 1.5), rnd() * 6, 1.2, 0.9, 1.1]); }
          for (let k = 0; k < 16; k++) { const x = 40 + rnd() * 90, z = 440 + rnd() * 96; if (g.dAt(x, z) > 14) heap.push([x, 17.2, z, rnd() * 6, 0.8 + rnd(), 0.7, 0.8 + rnd()]); }
          inst(h, h.geo('blk'), stone, wallMeshes); inst(h, h.geo('blk'), mat('curbMoss'), mosses); inst(h, h.geo('boulder'), stone, heap); }
        pose('statueNorth', CITY_PAL, 68, 512, Math.PI, 16.85).scale.setScalar(1.7);
        for (const x of [72, 98]) for (let k = 0; k < 4; k++) { const hh = 4 + ((k * 7 + x) % 5); if (g.dAt(x + (k % 2) * 1.5, 430 - k * 8) > 10.8) h.pose('boxMesh', paleM, h.scene, [x + (k % 2) * 1.5, 16.85 + hh / 2, 430 - k * 8], 1.5, hh, 0.9); } /* not on the roadway (half-width 10 m): three stelae stood there */ // two rows of stelae lead to the temple for (const [x, z] of [[124, 540], [36, 540], [36, 436], [126, 436]]) pose('obelisk', CITY_PAL, x, z, 0, 16.85, 12);
        pose('templeSteps', CITY_PAL, 86, 366, 0, 16.6).scale.setScalar(1.8); pose('scaffold', { bamboo, board }, 112, 392, 0.1, 16.85, 6, 2); for (const sd of [-1, 1]) pose('headColossal', CITY_PAL, 86 + sd * 9, 394, 0, 16.6).scale.setScalar(0.5);
        for (const [x, z] of [[84, 505], [84, 519], [92, 396], [80, 396]]) { const p = pose('torch', { wood: iron, iron, flame }, x, z, 0, 16.85); p.scale.setScalar(1.5); h.emis(P(55), x, 21, z, 0xffa040, 18, 1.8); }
        tree(128, 388, 1.3); tree(44, 396, 1.1); tree(34, 500, 1.2); // the trees grew into the walls
        for (const [x, z, r, t] of [[150, 536, 0.3, 1.2], [20, 470, 1.6, 1], [130, 470, -1.2, 1]]) pose('statueStanding', CITY_PAL, x, z, r, undefined, t); }

      // ---------- Z8, the ford (O-17): slabs flush with the surface outside the trajectory, pebbles, a half-submerged statue upstream; river steps: rocks and foam ----------
      { const rocks = [], foam = [], slabsG = [];
        for (let j = 1; j < RIVER.length; j++) if (RIVER[j].y < RIVER[j - 1].y - 1 && !RIVER[j].r && !RIVER[j - 1].r) for (let k = 0; k < 9; k++) { const p = RIVER[j - 1], q = RIVER[j], f = (k / 8 - 0.5) * 2 * p.w, nx = -(q.z - p.z) / 4, nz = (q.x - p.x) / 4; // a step: a bar of rocks, white water between them
          rocks.push([p.x + nx * f, p.y - 0.4, p.z + nz * f, rnd() * 6, 1.6 + rnd() * 1.4, 1.2 + rnd(), 1.6 + rnd() * 1.4]); foam.push([q.x + nx * f * 0.9, (p.y + q.y) / 2 + 0.3, q.z + nz * f * 0.9, Math.atan2(nx, nz), 2.2, 0.3 + (p.y - q.y) * 0.5, 3.4]); }
        for (let k = 0; k < 46; k++) { const x = -112 + rnd() * 104, z = 232 + rnd() * 76, r = riverDist(x, z); if (r.d < r.p.w && g.dAt(x, z) > 13.5) (rnd() < 0.6 ? slabsG : rocks).push([x, 14.05, z, rnd() * 6, 2 + rnd() * 2.5, 0.6, 1.4 + rnd() * 2]); }
        inst(h, h.geo('boulder'), mat('rockMoss'), rocks); inst(h, h.geo('blk'), falls(8, 0.95, 0.7, 0xe8f4f0), foam); inst(h, h.geo('blk'), mat('curbMoss'), slabsG);
        { const ux = -0.9, uz = -0.43, ry = Math.atan2(ux, uz), sl = slabsG.map(([x, , z, , w]) => [x + ux * (w / 2 + 2.2), 14.3, z + uz * (w / 2 + 2.2), ry, 1.4, 0.02, 4.4]); for (const d of [-1, 1]) sl.push([-12 + ux * 3 - uz * d * 0.9, 14.3, 306 + uz * 3 + ux * d * 0.9, ry + d * 0.3, 1.3, 0.02, 5.5]);
          inst(h, h.geo('blk'), ec, sl).userData.dyn = 1; } // a wake of foam behind each slab and behind the statue: one sees that the river is crossing
        { const cp = [0, 1, 2, 3].map(k => { const q = S[P(63) + 10 + k * 3], [x, z] = edgePt(q, 1, q.w + 2.5 + (k & 1) * 2); return [x, 14.25 - 0.2, z, toStack(x, z, q) + (k & 1 ? 0.5 : -0.4), k === 3 ? 1.3 : 2.1]; }); insts(h, 'capivara', { fur: mat('paint', { c: 0xa87a44 }), face: mat('paint', { c: 0x5a3e24 }) }, cp); } // a family of capybaras in the shallow water, at the upstream bank of the ford
        const st = pose('statueStanding', CITY_PAL, -12, 306, -2.2, 12.2, 2.2); st.rotation.z = 0.16; }
      inst(h, h.geo('trunk'), bark, shafts); summits.forEach((l, k) => inst(h, h.geo('summit'), leaves[k], l)); // all the trees, those of the city and the kapok's crown included
      insts(h, 'torch', { wood, iron, flame }, torches);
      // ---------- Z5, inside: rock ribs along the cave walls, so it is not a corridor ----------
      { const sides = []; for (let i = t0 + 6, k = 0; i < t1 - 4; i += 5, k++) { const s = S[i], sd = k & 1 ? 1 : -1, [x, z] = edgePt(s, sd, s.w + 1.2); sides.push([x, s.y + 2.6 + rnd() * 2, z, rnd() * 6, 1.3 + rnd() * 0.6, 4 + rnd() * 3, 1.3 + rnd() * 0.6]); } // they stick out of the wall by less than 0.8 m
        inst(h, h.geo('boulder'), mat('rockMoss', { c: 0x8a8478 }), sides); }
      // ---------- the jump of the descent (C-6): the collapsed steps of a city staircase, on either side of the ramp ----------
      { const deg = []; for (let k = 0; k < 7; k++) for (const sd of [-1, 1]) { const s = S[P(49) - 18 + k * 3], [x, z] = edgePt(s, sd, s.w + 2.2); deg.push([x, s.y - 0.6 + k * 0.12, z, h.across(s) + (rnd() - 0.5) * 0.3, 2.6, 1.2 + k * 0.25, 5.2]); }
        inst(h, h.geo('blk'), stone, deg); for (const sd of [-1, 1]) atEdge('obelisk', CITY_PAL, P(49) + 2, sd, S[P(49)].w + 2.4, 8); }
      // the monkeys (macacos-prego): seated on the bridge's obelisks (fixed); on the two obelisks of the jump, they leap toward the trees when the car arrives
      { const skinS = { fur: mat('paint', { c: 0x9a6230 }), face: mat('paint', { c: 0xf0dcae }) }, iS = P(49); insts(h, 'monkey', skinS, MONKEYS);
        for (const sd of [-1, 1]) { const q = S[iS + 2], [x, z] = edgePt(q, sd, S[iS].w + 2.4); RUNNERS.push([iS + 2, x, q.y - 0.35 + 8.85, z, sd]); }
        for (const [batch, i0] of [[RUNNERS.filter(f => f[0] < iS - 10), iS - 28], [RUNNERS.filter(f => f[0] >= iS - 10), iS - 4]]) { if (!batch.length) continue;
          const bs = batch.map(([i, x, y, z, sd]) => { const q = S[i], v = 4 + rand() * 2; return { x, y, z, r: toStack(x, z, S[i - 16]), vx: -q.tz * sd * v, vy: 6.5 + rand() * 2, vz: q.tx * sd * v, e: [3, 3, 3] }; });
          takeoff(insts(h, 'monkey', skinS, bs.map(q => [q.x, q.y, q.z, q.r, 3])), bs, i0, { D: 26, T: 1.7, g: -4, same: 1 }); } }
      for (const [m, b] of SHEET) { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(b.P, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(b.U, 2)); ge.setIndex(b.I); ge.computeVertexNormals();
        const o = new THREE.Mesh(ge, m); o.userData.dyn = 1; o.frustumCulled = false; o.renderOrder = m === e1 ? 1 : m === e2 ? 2 : 3; h.scene.add(o); } // the back sheet first, then the front one, then veils and foam
      let tv = 0; return (dt, now, car) => { tv += dt; for (const f of LIFE) f(dt, car, tv); for (const [t, u, v] of FLOWS) { t.offset.x = (t.offset.x + u * dt) % 1; t.offset.y = (t.offset.y + v * dt) % 1; } }; // the water flows: only textures slide
    },
  });
})();
