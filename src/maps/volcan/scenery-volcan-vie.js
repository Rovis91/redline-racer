// "volcan", what lives (docs/methods/LIFE.md, docs/proposals/volcanic-island/LIFE-V3.md): the sea that slides and breaks, the lava lake and its light, the steam of the vents, smoke, gulls, the trawler,
// flags and instruments in the wind, the vehicles of the supply track, the cloud deck, the lamps of the south-west gallery, and the placed sounds. Called last (ZONES of scenery-volcan.js), before the merge:
// the other zone files place (REG keeps every placed piece by shape name), this one takes out of the kit what moves and builds the rest.
// One wind, a westerly: everything leans, drifts and slides toward +x. Everything animates on the tick's dt (pause freezes it). Nothing here stands on the roadway or collides.
(window.VOLCAN = window.VOLCAN || {}).vie = ({ h, g, at, MAT, LAKE, CONE, kit, sea, REG, LIFE, flows, gal }) => {
  const { THREE, S, N, scene } = h, { edgePt, near, inst } = PLACERS, V3 = THREE.Vector3, DS = THREE.DoubleSide, PI = Math.PI, TAU = PI * 2, LAP = 6578;
  const clamp = v => Math.max(0, Math.min(1, v)), ease = v => { v = clamp(v); return v * v * (3 - 2 * v); }, jit = a => (Math.random() - 0.5) * 2 * a;
  const nz = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); };                    // a fixed pseudo-random number per index (no call to the shared rnd)
  const soft = (label, o, ...a) => h.mat(label, { emis: 1, transparent: true, depthWrite: false, side: DS, ...o }, ...a);                // a self-lit translucent material
  const veil = (label, o, ...a) => new THREE.MeshBasicMaterial({ color: 0xffffff, alphaMap: h.tx(label, ...a), transparent: true, depthWrite: false, side: DS, ...o }); // a white veil whose opacity is a drawing (foam, cloud): white stays white at any distance
  const close = (car, x, z, r) => !car || (x - car.x) ** 2 + (z - car.z) ** 2 < r * r, all = n => REG[n] || [], wp = e => e.o.getWorldPosition(new V3());
  const beside = (i, sd, off) => { const s = S[(Math.round(i) % N + N) % N], [x, z] = edgePt(s, sd, s.w + off); return [x, s.y, z]; }; // the point off metres behind the wall at sample i, at road level
  const along = (i, sd, off) => { const i0 = Math.floor(i), f = i - i0, a = beside(i0, sd, off), b = beside(i0 + 1, sd, off); return a.map((v, k) => v + (b[k] - v) * f); };                     // the same, between two samples
  kit.updateMatrixWorld(true);
  const out = o => { scene.attach(o); o.traverse(m => { m.userData.dyn = 1; }); return o; };                                             // out of the kit, same place: it will not be merged

  // ---------- the sea: its texture slides with the wind, and a second, finer, translucent layer slides faster over it (the pattern shears as the car moves). 1 more draw pass

  // ---------- foam: one strip mesh for the whole map, rewritten each frame. A chain is a row of ribs; a rib = a point at the foot of the rock and the direction of the open sea: the foam reaches w metres out,
  // swells and falls back every 5.5 s (a wave runs along a shore; a ring round a stack breathes as one). Chains: a ring round each of the 18 stacks and skerries, both faces of the two breakwaters,
  // the foot of the quay wall and the shore wherever the sea lies on the right of the road within 300 m. 1 draw pass
  const RIBS = [], CHAINS = [], chain = (pts, w, a, ph = k => k * 0.5) => { const k0 = RIBS.length; pts.forEach(([x, z, dx, dz], k) => RIBS.push({ x, z, dx, dz, w, a, ph: ph(k) })); CHAINS.push([k0, pts.length]); return RIBS.slice(k0); };
  all('ilotVolcan').forEach((e, q) => { const { x, z } = e.o.position, r = e.a[0]; chain(Array.from({ length: 17 }, (_, k) => { const c = Math.cos(k / 16 * TAU), s = Math.sin(k / 16 * TAU); return [x + c * r, z + s * r, c, s]; }), 9 + r * 0.6, 0.95, () => q * 1.7); });
  const HEADS = [];                                                                                                                       // where the swell bursts: the sea face and the head of each breakwater
  for (const e of all('digueVolcan')) { const L = e.a[0], P = [], loc = (x, z, dx, dz) => { const p = e.o.localToWorld(new V3(x, 0, z)), d = e.o.localToWorld(new V3(x + dx, 0, z + dz)).sub(p); P.push([p.x, p.z, d.x, d.z]); };
    for (let z = 8; z < L; z += 12) loc(-8.5, z, -1, 0); loc(-6, L + 5, -0.7, 0.7); loc(6, L + 5, 0.7, 0.7); for (let z = L - 4; z > 8; z -= 12) loc(8.5, z, 1, 0); HEADS.push(...P.filter(p => p[0] > e.o.position.x - 5)); chain(P, 6, 0.9); }
  { let P = []; const flush = () => { if (P.length > 2) chain(P, 7, 0.85); P = []; };
    for (let i = 0; i < N; i += 6) { const s = S[i], pk = i / N * LAP; let hit = null;
      if (pk > 6402 || pk < 290) hit = edgePt(s, 1, 27.5);                                                                                // the foot of the quay wall
      else for (let off = 4; off < 300; off += 3) { const [x, z] = edgePt(s, 1, s.w + off), y = g.hAt(x, z); if (!(y > 0.15)) { hit = y === y ? [x, z] : null; break; } }
      const q = P[P.length - 1]; if (!hit || (q && Math.hypot(hit[0] - q[0], hit[1] - q[1]) > 45)) flush();
      if (hit) { const dx = hit[0] - s.x, dz = hit[1] - s.z, l = Math.hypot(dx, dz) || 1; P.push([hit[0], hit[1], dx / l, dz / l]); } } flush(); }
  const foamBuild = () => { const n = RIBS.length, P = new Float32Array(n * 6), U = new Float32Array(n * 4), I = [], G = new THREE.BufferGeometry(), B = THREE.BufferAttribute;
    for (const [k0, m] of CHAINS) { let u = 0; for (let j = 0; j < m; j++) { const k = k0 + j, r = RIBS[k]; if (j) u += Math.hypot(r.x - RIBS[k - 1].x, r.z - RIBS[k - 1].z) / 16; U.set([u, 0, u, 1], k * 4); if (j < m - 1) I.push(k * 2, k * 2 + 2, k * 2 + 1, k * 2 + 2, k * 2 + 3, k * 2 + 1); } }
    G.setAttribute('position', new B(P, 3)); G.setAttribute('uv', new B(U, 2)); G.setIndex(I);
    const mesh = new THREE.Mesh(G, veil('ecumeVolcan', { opacity: 0.92 })); mesh.frustumCulled = false; mesh.userData.dyn = 1; mesh.renderOrder = 2; scene.add(mesh);
    LIFE.push((dt, car, t) => { for (let k = 0; k < n; k++) { const r = RIBS[k], s = Math.sin(TAU * t / 5.5 - r.ph), w = r.w * (0.775 + 0.225 * s); P[k * 6] = r.x - r.dx; P[k * 6 + 1] = P[k * 6 + 4] = 0.12; P[k * 6 + 2] = r.z - r.dz; P[k * 6 + 3] = r.x + r.dx * w; P[k * 6 + 5] = r.z + r.dz * w; } G.attributes.position.needsUpdate = true; }); };

  // ---------- the lava lake, the one glowing thing of the map: its crust slides (the lake is the only user of the lava material), a second translucent layer slides against it, the three rafts drift round the pit,
  // a real light breathes on the road, the rails, the rig and the walls (h.emis: the engine rereads its colour each frame). 1 more draw pass
  flows(MAT.lava, 0.011, -0.007);
  { const d = new THREE.Mesh(new THREE.CircleGeometry(LAKE.r - 2, 18), flows(soft('laveVolcan', { opacity: 0.5, rep: [5, 5] }), -0.016, 0.009)); d.rotation.x = -PI / 2; d.position.set(LAKE.x, LAKE.y + 0.84, LAKE.z); d.userData.dyn = 1; scene.add(d);
    all('dalleVolcan').filter(e => Math.hypot(e.o.position.x - LAKE.x, e.o.position.z - LAKE.z) < LAKE.r).forEach((e, k) => { const o = out(e.o), R = Math.hypot(o.position.x - LAKE.x, o.position.z - LAKE.z); let a = Math.atan2(o.position.z - LAKE.z, o.position.x - LAKE.x);
      LIFE.push(dt => { a += dt * 0.025 * (k % 2 ? -1 : 1.4); o.position.x = LAKE.x + Math.cos(a) * R; o.position.z = LAKE.z + Math.sin(a) * R; o.rotation.y += dt * 0.07; }); });
    const l = h.emis(near(h, LAKE.x, LAKE.z), LAKE.x, LAKE.y + 5, LAKE.z, 0xff6a20, 120, 2), c0 = l.c.clone();
    LIFE.push((dt, car, t) => { const k = 1 + 0.16 * Math.sin(TAU * t / 7) + 0.05 * Math.sin(TAU * t / 2.3); l.c.copy(c0).multiplyScalar(k); }); }

  // ---------- steam, smoke and spray: the engine's soft particles (h.softPuffs), three clouds for the whole map (white steam, grey smoke, short white spray), fed only by the sources within 450 m of the car. 3 draw passes at most
  // src(x, y, z, cloud, puffs per second, rise m/s, spread m): a permanent source. The wind carries every puff toward +x
  const SRC = [], src = (x, y, z, kind, rate, vy, sp = 0.5) => SRC.push({ x, y, z, kind, rate, vy, sp, t: Math.random() }); let CL = null;
  const burst = (x, y, z, n, sp, vy) => { if (CL) for (let k = 0; k < n; k++) CL[2].emit(x + jit(sp), y + Math.random() * 2, z + jit(sp), 1.5 + jit(1), vy * (0.5 + Math.random() * 0.7), jit(1)); };
  LIFE.push((dt, car) => { if (!CL) CL = [h.softPuffs(520, [0.93, 0.95, 0.95], 0.5, 3.6, 0.3, 1.5), h.softPuffs(200, [0.66, 0.66, 0.69], 0.34, 4, 0.3, 0.55), h.softPuffs(160, [0.96, 0.98, 0.98], 0.65, 1.7, 1, 1.6)];
    for (const q of SRC) if (close(car, q.x, q.z, 450)) for (q.t += dt * q.rate; q.t > 1; q.t--) CL[q.kind].emit(q.x + jit(q.sp), q.y, q.z + jit(q.sp), 2.2 + jit(0.6), q.vy * (0.7 + Math.random() * 0.6), jit(0.5));
    for (const c of CL) c.step(dt); });
  // the vents (falaises, cratere): the faceted column that stood for the steam leaves the scene (still, it read as a pale rock); the plume is puffs, from the mound up
  for (const e of all('vapeurVolcan')) { const p = wp(e); e.o.removeFromParent(); src(p.x, p.y + 1.5, p.z, 0, 9, 3.6, 1); }
  src(LAKE.x - 12, LAKE.y + 2, LAKE.z + 8, 0, 2, 3.2, 4); src(LAKE.x + 10, LAKE.y + 2, LAKE.z - 12, 0, 2, 3.2, 4);                    // gas over the lake
  for (const e of all('posteVolcan')) { const p = wp(e); src(p.x, p.y + 6, p.z, 0, 3, 2, 0.6); }                                          // the pump house where the hot-water pipe ends

  // ---------- the moving batch: everything that moves and is made of plain boxes (birds, flags, boats, vehicles, instruments) is one instanced mesh of unit cubes, tinted per instance: 1 draw pass.
  // cube(colour) reserves one and returns its number; put(k, M) sets its matrix. mob(parts) = a rigid object made of boxes [colour, w, h, d, x, y, z]; move(o, M) places it
  const COLS = [], m4 = new THREE.Matrix4(), mG = new THREE.Matrix4(), mR = new THREE.Matrix4(), mW = new THREE.Matrix4(), sc = new V3(); let im = null;
  const cube = c => COLS.push(c) - 1, put = (k, M) => im.setMatrixAt(k, M);                                                              // (only called from the tick: the batch exists by then)
  const mob = parts => ({ k0: COLS.length, loc: parts.map(([c, w, ht, d, x, y, z]) => { cube(c); return new THREE.Matrix4().makeScale(w, ht, d).setPosition(x, y, z); }) }), move = (o, M) => o.loc.forEach((l, i) => put(o.k0 + i, m4.multiplyMatrices(M, l)));
  const pose = (x, y, z, ry = 0, s = 1) => mG.makeRotationY(ry).scale(sc.set(s, s, s)).setPosition(x, y, z), heading = (dx, dz) => Math.atan2(-dz, dx);    // heading: the turn that points a piece's +x along (dx, dz)
  const PAINT = { dark: 0x1e2226, orange: 0xf0641e, white: 0xf2eee4, trim: 0xf2eee4, glass: 0x1c2f52, steel: 0x6a7078, lamp: 0xffd070, red: 0xd2362b, blue: 0x2f7fc8, yellow: 0xf2c230 };

  // birds: a body with a yellow bill and two wings that beat about the body's axis. Gulls circle over the drying racks and the fish market of the harbour and of the west landing, all 11 m or more above the road
  const bird = (c, cw, e) => ({ b: mob([[c, e * 0.42, 0.3, 0.42, 0, 0, 0], [0xe8a020, 0.3, 0.14, 0.16, e * 0.27, 0, 0]]), w: [cube(cw), cube(cw)], e });
  const fly = (o, M, flap) => { move(o.b, M); for (const sd of [-1, 1]) put(o.w[sd > 0 ? 1 : 0], m4.copy(M).multiply(mR.makeRotationX(-sd * flap)).multiply(mW.makeScale(0.8, 0.1, o.e / 2).setPosition(-0.05, 0.1, sd * o.e / 4))); };
  { const GULLS = [], racks = (a, b) => all('sechoirVolcan').filter(e => e.pk >= a && e.pk <= b).map(wp), flock = (L, n, seed) => { if (!L.length) return; const c = L.reduce((m, p) => m.add(p), new V3()).multiplyScalar(1 / L.length);
      for (let k = 0; k < n; k++) { const R = 16 + 16 * nz(k, seed + 2); GULLS.push({ o: bird(0xf6f6f2, 0xd9dee2, 3.4), cx: c.x + 16 * (nz(k, seed) - 0.5), cy: c.y + 13 + 10 * nz(k, seed + 1), cz: c.z + 10 * (nz(k, seed + 4) - 0.5), R, w: (k % 2 ? 1 : -1) * 6.5 / R, ph: nz(k, seed + 3) * TAU }); } };
    flock(racks(6560, 6650), 7, 1); flock(all('crieeVolcan').map(wp), 3, 2); flock(racks(6780, 6840), 4, 3); flock(racks(6090, 6145), 3, 4); flock(racks(6280, 6335), 3, 5);
    LIFE.push((dt, car, t) => { for (const q of GULLS) { if (!close(car, q.cx, q.cz, 520)) continue; const a = t * q.w + q.ph, sg = Math.sign(q.w), A = ease(Math.sin(t * 0.45 + q.ph * 3) * 1.5);
        pose(q.cx + Math.cos(a) * q.R, q.cy + Math.sin(a * 0.7) * 1.5, q.cz + Math.sin(a) * q.R, heading(-Math.sin(a) * sg, Math.cos(a) * sg)).multiply(mR.makeRotationX(0.3 * sg)); fly(q.o, mG, 0.12 + A * 0.6 * Math.sin(TAU * 2.3 * t + q.ph)); } }); }

  // fulmars glide over the cliff top of the pass, 16 to 42 m to the right of the road and 6 to 15 m above it, the same way as the car: height and wind (falaises, samples 1500 to 1700; below the road they were hidden by the ground)
  { const F = Array.from({ length: 6 }, (_, k) => ({ o: bird(0x9aa0a6, 0xc9ced3, 4.2), k }));
    LIFE.push((dt, car, t) => { if (car && (car.idx < 1300 || car.idx > 1800)) return; for (const f of F) { const u = (t * 4.5 / 200 + f.k / 6 + nz(f.k, 7) * 0.1) % 1, i = 1500 + u * 200, [x, y, z] = along(i, 1, 16 + 26 * nz(f.k, 3)), s = S[Math.round(i)];
        pose(x, y + 6 + 9 * nz(f.k, 5) + Math.sin(t * 0.8 + f.k) * 1.5, z, heading(s.tx, s.tz), Math.max(ease(Math.min(u, 1 - u) / 0.08), 1e-4)); fly(f.o, mG, 0.1 + 0.06 * Math.sin(t * 2 + f.k)); } }); }

  // ---------- one wind in everything that hangs. Flags: the pole stays in the kit (drapeauVolcan); the cloth is a ribbon of five panels that flies toward +x, a wave running down it and growing toward the fly end
  // (one small mesh for all the flags, rewritten for those within 230 m of the car: 1 draw pass)
  { const K = 1.7, NS = 6, F = all('drapeauVolcan').map((e, q) => { const p = wp(e); return { x: p.x + 0.1, y: p.y + e.a[0] - 0.06, z: p.z, ph: q * 2.1, c: new THREE.Color(PAINT[e.a[1]] || PAINT.red) }; });
    const P = new Float32Array(F.length * NS * 6), C = new Float32Array(F.length * NS * 6), I = [], G = new THREE.BufferGeometry(); let first = 1;
    F.forEach((f, q) => { for (let j = 0; j < NS * 2; j++) f.c.toArray(C, (q * NS * 2 + j) * 3); for (let j = 0; j < NS - 1; j++) { const k = q * NS * 2 + j * 2; I.push(k, k + 2, k + 1, k + 2, k + 3, k + 1); } });
    G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setAttribute('color', new THREE.BufferAttribute(C, 3)); G.setIndex(I);
    const mesh = new THREE.Mesh(G, new THREE.MeshLambertMaterial({ vertexColors: true, side: DS })); mesh.frustumCulled = false; mesh.userData.dyn = 1; scene.add(mesh);
    LIFE.push((dt, car, t) => { let any = first; F.forEach((f, q) => { if (!first && !close(car, f.x, f.z, 230)) return; any = 1; for (let j = 0; j < NS; j++) { const p = TAU * 0.9 * t - 0.95 * j + f.ph, k = (q * NS + j) * 6, x = f.x + j * 0.4 * K, z = f.z + 0.11 * K * j * Math.sin(p), y = f.y - 0.02 * j * j;
          P[k] = P[k + 3] = x; P[k + 2] = P[k + 5] = z; P[k + 1] = y; P[k + 4] = y - 1.1 * K; } }); if (any) { G.attributes.position.needsUpdate = true; G.computeVertexNormals(); } first = 0; }); }
  // instruments: the cups of the two weather stations spin, a dish turns on top of the camp's mast, the travelling block rises and falls inside the derrick, the dome of the observatory on the rim turns (a dark slit shows it)
  { const spin = (p, y, parts, w, r = 260) => { const o = mob(parts); let first = 1; LIFE.push((dt, car, t) => { if (first || close(car, p.x, p.z, r)) move(o, pose(p.x, p.y + y, p.z, t * w)); first = 0; }); };
    for (const e of all('meteoVolcan')) spin(wp(e), 8.5, [[PAINT.dark, 3, 0.12, 0.12, 0, 0, 0], [PAINT.dark, 0.12, 0.12, 3, 0, 0, 0], ...[[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].map(([x, z]) => [PAINT.orange, 0.5, 0.5, 0.5, x, 0, z])], 5);
    for (const e of all('mastVolcan').filter(e => e.a[0] === 28)) spin(wp(e), 30, [[PAINT.white, 3.6, 2.4, 0.35, 0, 0.4, 1.3], [PAINT.steel, 0.3, 0.3, 1.3, 0, 0.4, 0.65], [PAINT.steel, 0.45, 1.6, 0.45, 0, -0.6, 0]], 0.8, 500);
    for (const e of all('derrickVolcan')) { const p = wp(e), o = mob([[PAINT.yellow, 1.9, 1.9, 1.9, 0, 0, 0], [PAINT.dark, 0.22, 4, 0.22, 0, 2.6, 0]]); LIFE.push((dt, car, t) => { if (close(car, p.x, p.z, 400)) move(o, pose(p.x, p.y + 2.1 + e.a[0] * (0.42 + 0.2 * Math.sin(TAU * t / 8)), p.z)); }); }
    for (const e of all('domeVolcan').filter(e => e.a[0] === 2.8)) { h.pose('boxMesh', MAT.dark, e.o, [0, 1.5, -2.1], 1, 2.4, 1.6); const o = out(e.o); o.scale.setScalar(1.4); LIFE.push(dt => { o.rotation.y += 0.1 * dt; }); } }
  // smoke: six houses of the two front rows of the village and two summer farms of the descent get a chimney, and a thin grey plume leaves it
  { const H = all('maisonVolcan'), front = H.filter(e => e.sd === -1 && e.off <= 23 && e.pk > 6090), pick = [...[3, 10, 17, 24, 31, 38].map(k => front[k]), ...H.filter(e => e.pk === 4900 || e.pk === 5250)].filter(Boolean);
    for (const e of pick) { const [w, ht] = e.a, p = e.o.localToWorld(new V3(w * 0.25, ht + 1.7, 0)), o = mob([[0x2a2d31, 0.9, 2.6, 0.9, 0, 0, 0]]); let first = 1; LIFE.push(() => { if (first) move(o, pose(p.x, p.y, p.z, e.o.rotation.y)); first = 0; }); src(p.x, p.y + 1.6, p.z, 1, 3, 1.5, 0.2); } }

  // ---------- boats, pure scenery: a trawler crosses the bay off the harbour, out and back on a long loop 250 to 390 m off the road (clear of the breakwater and of the skerries), its wake two strips of the foam mesh;
  // a second one works the open sea off the west shore, seen from the descent
  { const boat = (hull, k) => mob([[hull, 20, 2.4, 5.6, 0, 0.7, 0], [PAINT.white, 20.3, 0.5, 5.8, 0, 2.1, 0], [hull, 4, 1.6, 5, 9, 2.4, 0], [PAINT.white, 5, 3, 4.2, -5.5, 3.6, 0], [PAINT.glass, 5.1, 0.9, 3.8, -5.5, 4.2, 0], [PAINT.steel, 0.3, 7, 0.3, 3.5, 5.6, 0], [PAINT.steel, 0.25, 0.25, 4.5, 3.5, 7.6, 0]].map(([c, ...r]) => [c, ...r.map(v => v * k)]));
    const bay = u => { const [x, , z] = along(3100 + 396 * (0.5 - 0.5 * Math.cos(TAU * u)), 1, 320 + 70 * Math.sin(TAU * u)); return [x, z]; }, west = u => [-1300 + 160 * Math.cos(TAU * u), -500 + 160 * Math.sin(TAU * u)];
    const W = [-1, 1].map(sd => chain(Array.from({ length: 5 }, () => [0, 0, 0, 0]), 3, 0.9, () => 0));
    [[boat(PAINT.red, 1.3), bay, 270, 0.12, W], [boat(PAINT.blue, 1.3), west, 330, 0.5]].forEach(([o, path, T, ph, wake]) => LIFE.push((dt, car, t) => { const u = (t / T + ph) % 1, [x, z] = path(u), [x1, z1] = path(u + 0.002);
      pose(x, 0.15 + 0.2 * Math.sin(t * 1.4), z, heading(x1 - x, z1 - z)).multiply(mR.makeRotationX(0.05 * Math.sin(TAU * t / 4))); move(o, mG);
      if (wake) for (let j = 0; j < 5; j++) { const [ax, az] = path(u - 0.004 - j * 0.007), [bx, bz] = path(u - 0.002 - j * 0.007), l = Math.hypot(bx - ax, bz - az) || 1; wake.forEach((R, q) => { const r = R[j], sd = q ? 1 : -1; r.x = ax; r.z = az; r.dx = -(bz - az) / l * sd; r.dz = (bx - ax) / l * sd; r.w = 2.5 + 2.6 * j; }); } })); }
  // the swell bursts on the breakwaters: every few seconds a column of spray rises at a point of their sea face
  { let tb = 2; LIFE.push((dt, car) => { if ((tb -= dt) > 0 || !HEADS.length) return; tb = 2.5 + Math.random() * 3; const p = HEADS[Math.random() * HEADS.length | 0]; if (close(car, p[0], p[1], 600)) burst(p[0] + p[2] * 2, 1, p[1] + p[3] * 2, 26, 3, 7); }); }

  // ---------- the supply track of the expedition (falaises): on each of its three sections a tracked vehicle crawls at 5 m/s the same way as the road, an amber lamp pulsing on its roof (never a blink);
  // it shrinks out at the end of its section and comes back at the start. The two that stood parked on the track leave the kit
  { for (const e of all('chenilleVolcan').filter(e => e.sd === -1 && e.off === 9)) e.o.removeFromParent();
    const veh = tint => { const parts = SHAPES.chenilleVolcan(tint), o = mob(parts.map(([m, ...r]) => [PAINT[m] ?? 0x888888, ...r])); o.lamp = o.k0 + parts.findIndex(q => q[0] === 'lamp'); return o; }, col = new THREE.Color();
    const V = [[1600, 2020, 'orange', 0], [2460, 2740, 'white', 0.35], [3460, 3720, 'orange', 0.7]].map(([a, b, tint, ph]) => ({ a: a / LAP * N + 6, n: (b - a) / LAP * N - 12, T: (b - a) / 5, o: veh(tint), ph }));
    LIFE.push((dt, car, t) => { for (const v of V) { if (car && Math.abs(car.idx - v.a - v.n / 2) > 500) continue; const u = (t / v.T + v.ph) % 1, i = v.a + v.n * u, [x, , z] = along(i, -1, 9), s = S[Math.round(i)];
        pose(x, g.hAt(x, z) + 0.3, z, heading(s.tx, s.tz), Math.max(ease(Math.min(u, 1 - u) / 0.04), 1e-4)); move(v.o, mG); im.setColorAt(v.o.lamp, col.setHex(0xffa020).multiplyScalar(0.8 + 0.9 * (0.5 + 0.5 * Math.sin(TAU * t / 1.6)))); } im.instanceColor.needsUpdate = true; }); }

  // ---------- the sky: a deck of broken cloud 900 m up slides with the wind (its far patches dissolve in the haze), and a cap of cloud sits on the crest of the cone, turning and breathing. 3 draw passes
  { const m = veil('nuagesVolcan', { opacity: 0.72 }), o = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), m); m.alphaMap.repeat.set(11, 11); m.alphaMap.magFilter = THREE.LinearFilter; m.alphaMap.minFilter = THREE.LinearMipmapLinearFilter; flows({ map: m.alphaMap }, -0.0022, 0.0005); o.rotation.x = PI / 2; o.position.set(-100, 900, -800); o.renderOrder = -2; o.userData.dyn = 1; scene.add(o);
    let top = 0; for (let k = 0; k < 24; k++) top = Math.max(top, g.hAt(CONE.x + Math.cos(k / 24 * TAU) * CONE.rim, CONE.z + Math.sin(k / 24 * TAU) * CONE.rim) || 0);
    const CAP = [[235, 70, 0.5, -22, 0.012], [185, 55, 0.36, 8, -0.009]].map(([R, tube, op, dy, w], k) => { const c = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 5, 11), new THREE.MeshBasicMaterial({ color: 0xf2f6f6, transparent: true, opacity: op, depthWrite: false })); c.rotation.x = PI / 2; c.scale.z = 0.4; c.position.set(CONE.x + 20, top + dy, CONE.z); c.renderOrder = -1; c.userData.dyn = 1; scene.add(c); return [c, w, k]; });
    LIFE.push((dt, car, t) => { for (const [c, w, k] of CAP) { c.rotation.z += w * dt; const e = 1 + 0.06 * Math.sin(TAU * t / 11 + k * 2); c.scale.x = c.scale.y = e; } }); }

  // ---------- the sound of the place (SOUND.spots, SOUND.brief of src/audio/audio.js): the lava, the hiss of the nearest vents, the generators of the camp and of the rig, the pump house, placed and heard by distance and side;
  // the church bell every 20 s, the fog horn of the lighthouse every 30 s once the car is moving (not over the countdown)
  if (window.SOUND && SOUND.spots) { const V = (p, dy = 0) => ({ x: p.x, y: p.y + dy, z: p.z }), L = [{ p: { x: LAKE.x, y: LAKE.y, z: LAKE.z }, sound: 'lavaVolcan', r: 150, vol: 0.2 }];
    SRC.slice(0, 12).forEach((q, k) => { if ([0, 2, 5, 10, 11].includes(k)) L.push({ p: { x: q.x, y: q.y + 3, z: q.z }, sound: 'hissVolcan', r: 70, vol: 0.07 }); });
    for (const e of all('derrickVolcan')) L.push({ p: V(wp(e), 2), sound: 'turbine', r: 90, vol: 0.06 }); for (const e of all('posteVolcan')) L.push({ p: V(wp(e), 2), sound: 'turbine', r: 70, vol: 0.05 });
    { const [x, y, z] = beside(3840 / LAP * N, -1, 8); L.push({ p: { x, y, z }, sound: 'turbine', r: 80, vol: 0.05 }); }
    SOUND.spots('volcan', L);
    const church = all('egliseVolcan').map(wp)[0], [lx, ly, lz] = beside(6860 / LAP * N, 1, 176), light = { x: lx, y: ly + 30, z: lz }; let tb = 8, th = 14;
    LIFE.push((dt, car) => { if (!car) return; if ((tb -= dt) < 0) { tb = 20; if (church) SOUND.brief('bellVolcan', church, 0.7, 320); } if ((th -= dt) < 0) { th = 30; if (Math.hypot(car.vx || 0, car.vz || 0) > 12) SOUND.brief('horn', light, 0.9, 520); } }); }

  // ---------- light in the south-west gallery: the engine has one tunnel per map (the north gallery), so this one is declared indoor (tick.indoor: sun and sky fade, the eye adapts, the sound takes the vault)
  // and each lamp drawn on its vault (scenery-volcan-cratere.js) is a real engine light, the same as the fittings of the north gallery
  { const [g0, g1] = gal[1], IN = new Float32Array(N); for (let i = g0 - 8; i <= g1 + 8; i++) IN[i] = ease(Math.min(i - g0 + 8, g1 + 8 - i) / 14);
    for (let i = g0 + 6; i < g1; i += 12) h.emis(i, S[i].x, S[i].y + 7.2, S[i].z, 0xffc878, 21, 3, 1); LIFE.indoor = i => IN[i]; }

  // ---------- the batches themselves, once every rib and every cube is declared
  foamBuild();
  { im = inst(h, h.geo('blk'), h.mat('paint'), COLS.map(() => [0, -1e4, 0])); im.userData.dyn = 1; im.castShadow = false; im.frustumCulled = false; const col = new THREE.Color(); COLS.forEach((c, k) => im.setColorAt(k, col.setHex(c))); im.instanceColor.needsUpdate = true;
    LIFE.push(() => { im.instanceMatrix.needsUpdate = true; }); }
};
