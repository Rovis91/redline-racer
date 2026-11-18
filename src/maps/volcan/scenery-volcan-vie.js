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
  kit.updateMatrixWorld(true);
  const out = o => { scene.attach(o); o.traverse(m => { m.userData.dyn = 1; }); return o; };                                             // out of the kit, same place: it will not be merged

  // ---------- the sea: its texture slides with the wind, and a second, finer, translucent layer slides faster over it (the pattern shears as the car moves). 1 more draw pass
  flows(sea.material, -0.004, 0.0012);
  { const m = new THREE.Mesh(sea.geometry, flows(h.mat('merVolcan', { rep: [170, 170], transparent: true, opacity: 0.35, depthWrite: false }), -0.0075, -0.002)); m.rotation.x = -PI / 2; m.position.set(-100, 0.05, -800); m.renderOrder = 1; m.userData.dyn = 1; scene.add(m); }

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
  // a real light breathes on the road, the rig and the walls (h.emis: the engine rereads its colour each frame), and a column of warm air glows over the pit. 2 more draw passes
  flows(MAT.lava, 0.011, -0.007);
  { const d = new THREE.Mesh(new THREE.CircleGeometry(LAKE.r - 2, 18), flows(soft('laveVolcan', { opacity: 0.5, rep: [5, 5] }), -0.016, 0.009)); d.rotation.x = -PI / 2; d.position.set(LAKE.x, LAKE.y + 0.84, LAKE.z); d.userData.dyn = 1; scene.add(d);
    all('dalleVolcan').filter(e => Math.hypot(e.o.position.x - LAKE.x, e.o.position.z - LAKE.z) < LAKE.r).forEach((e, k) => { const o = out(e.o), R = Math.hypot(o.position.x - LAKE.x, o.position.z - LAKE.z); let a = Math.atan2(o.position.z - LAKE.z, o.position.x - LAKE.x);
      LIFE.push(dt => { a += dt * 0.025 * (k % 2 ? -1 : 1.4); o.position.x = LAKE.x + Math.cos(a) * R; o.position.z = LAKE.z + Math.sin(a) * R; o.rotation.y += dt * 0.07; }); });
    const l = h.emis(near(h, LAKE.x, LAKE.z), LAKE.x, LAKE.y + 5, LAKE.z, 0xff6a20, 120, 1.6), c0 = l.c.clone();
    const col = new THREE.Mesh(new THREE.CylinderGeometry(LAKE.r * 1.25, LAKE.r - 2, 22, 18, 1, true), h.addMat(h.tx('gradient', '#ff7a28', 1), { opacity: 0.3, polygonOffset: false })); col.position.set(LAKE.x, LAKE.y + 11.9, LAKE.z); col.userData.dyn = 1; scene.add(col);
    LIFE.push((dt, car, t) => { const k = 1 + 0.16 * Math.sin(TAU * t / 7) + 0.05 * Math.sin(TAU * t / 2.3); l.c.copy(c0).multiplyScalar(k); col.material.opacity = 0.3 * k; }); }

  // ---------- steam, smoke and spray: the engine's soft particles (h.softPuffs), three clouds for the whole map (white steam, grey smoke, short white spray), fed only by the sources within 450 m of the car. 3 draw passes at most
  // src(x, y, z, cloud, puffs per second, rise m/s, spread m): a permanent source. The wind carries every puff toward +x
  const SRC = [], src = (x, y, z, kind, rate, vy, sp = 0.5) => SRC.push({ x, y, z, kind, rate, vy, sp, t: Math.random() }); let CL = null;
  const burst = (x, y, z, n, sp, vy) => { if (CL) for (let k = 0; k < n; k++) CL[2].emit(x + jit(sp), y + Math.random() * 2, z + jit(sp), 1.5 + jit(1), vy * (0.5 + Math.random() * 0.7), jit(1)); };
  LIFE.push((dt, car) => { if (!CL) CL = [h.softPuffs(520, [0.93, 0.95, 0.95], 0.5, 3.6, 0.3, 1.5), h.softPuffs(200, [0.5, 0.5, 0.53], 0.45, 4, 0.3, 0.8), h.softPuffs(160, [0.96, 0.98, 0.98], 0.65, 1.7, 1, 1.6)];
    for (const q of SRC) if (close(car, q.x, q.z, 450)) for (q.t += dt * q.rate; q.t > 1; q.t--) CL[q.kind].emit(q.x + jit(q.sp), q.y, q.z + jit(q.sp), 2.2 + jit(0.6), q.vy * (0.7 + Math.random() * 0.6), jit(0.5));
    for (const c of CL) c.step(dt); });
  // the vents (falaises, cratere): each column leaves the kit, leans downwind, turns slowly on itself and breathes in height and girth; puffs leave its crown
  all('vapeurVolcan').forEach((e, k) => { const o = out(e.o), ht = e.a[0]; o.rotation.order = 'ZYX'; o.rotation.z = -0.1; src(o.position.x + ht * 0.1, o.position.y + ht * 0.9, o.position.z, 0, 4, 2.4, 1.3);
    LIFE.push((dt, car, t) => { o.rotation.y += 0.15 * dt; o.scale.y = 1 + 0.1 * Math.sin(TAU * t / 6 + k * 1.3); o.scale.x = o.scale.z = 1 + 0.08 * Math.sin(TAU * t / 4.1 + k); }); });
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

  // ---------- light in the south-west gallery: the engine has one tunnel per map (the north gallery), so this one is declared indoor (tick.indoor: sun and sky fade, the eye adapts, the sound takes the vault)
  // and each lamp drawn on its vault (scenery-volcan-cratere.js) is a real engine light, the same as the fittings of the north gallery
  { const [g0, g1] = gal[1], IN = new Float32Array(N); for (let i = g0 - 8; i <= g1 + 8; i++) IN[i] = ease(Math.min(i - g0 + 8, g1 + 8 - i) / 14);
    for (let i = g0 + 6; i < g1; i += 12) h.emis(i, S[i].x, S[i].y + 7.2, S[i].z, 0xffc878, 21, 3, 1); LIFE.indoor = i => IN[i]; }

  // ---------- the batches themselves, once every rib and every cube is declared
  foamBuild();
  { im = inst(h, h.geo('blk'), h.mat('paint'), COLS.map(() => [0, -1e4, 0])); im.userData.dyn = 1; im.castShadow = false; im.frustumCulled = false; const col = new THREE.Color(); COLS.forEach((c, k) => im.setColorAt(k, col.setHex(c))); im.instanceColor.needsUpdate = true;
    LIFE.push(() => { im.instanceMatrix.needsUpdate = true; }); }
};
