// "autoroute", life and atmosphere (V3): everything that moves, lights or sounds. Runs after the six zones and before the merge of the kit, and returns the map's tick.
// Specification: docs/proposals/sunken-highway/LIFE-V3.md; method: docs/methods/LIFE.md. What is set in the map's entry (src/data/maps.js): soft shadows, eye, haze, leaves, the wet lane; in src/audio/audio.js: the beds and events.
// Rules kept here: one clock t that only advances with dt (pause freezes everything); one wind, from the west (the sun) to the east (the river), in gusts of 6 to 12 s; nothing flips like a switch (lights dip and recover on ramps);
// nothing that moves stands where a car drives, and nothing here collides: what is added stands above the lane, on a wreck, behind a wall or flat on the ground. No call to the shared randomness (h.rnd).
(window.AUTOROUTE = window.AUTOROUTE || {}).vie = ({ h, I, MAT, kit, HH, water, cityY, TREES, LAMPS, REEDS }) => {
  const { THREE, S, N, T, scene } = h, { inst, insts, near } = PLACERS, TICK = [], PI = Math.PI, ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, DS = { side: THREE.DoubleSide };
  let t = 0, gust = 0.5; TICK.push(dt => { t += dt; gust = 0.55 + 0.45 * Math.sin(t * 0.71) * Math.sin(t * 0.23 + 1); }); // gust: 0.1 (lull) to 1, shared by everything the wind moves
  const dyn = o => { o.userData.dyn = 1; o.frustumCulled = false; o.castShadow = false; scene.add(o); return o; }, wet = i => T.surf[((i % N) + N) % N].aq > 0.099;
  const glow = (hex, o) => h.addMat(h.tx('gradient', hex, 1), o); // additive, bright where the drawing's v is 0, nothing where it is 1

  // ---------- the water (Z2-01, Z2-02, Z2-07): the plane drifts east on the wind (one layer, slow: no ripple), the car leaves a wake of foam on it, a fish rises now and then beside the lane ----------
  { const n = 44, g = new THREE.CircleGeometry(1, 10), u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, 0.5, Math.min(1, Math.hypot(u.getX(i) - 0.5, u.getY(i) - 0.5) * 2)); g.rotateX(-PI / 2);
    const im = dyn(new THREE.InstancedMesh(g, glow('#c8d8c8', { opacity: 0.55 }), n)), P = Array.from({ length: n }, () => ({ a: 1 })), o = new THREE.Object3D(), c = new THREE.Color(); im.renderOrder = 3; let k = 0, acc = 0;
    for (let i = 0; i < n; i++) { o.scale.setScalar(1e-4); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.setScalar(0)); }
    TICK.push((dt, car) => { const sp = Math.hypot(car.vx, car.vz), hx = Math.cos(car.th), hz = Math.sin(car.th);
      if (wet(car.idx) && !car.air && sp > 4) for (acc += dt; acc > 0.06; acc -= 0.06) for (const sd of [-1, 1]) { const p = P[k++ % n]; p.a = 0; p.x = car.x - hx * 1.6 - hz * sd * 0.8; p.z = car.z - hz * 1.6 + hx * sd * 0.8; p.vx = -hz * sd * 1.5 + hx * sp * 0.12; p.vz = hx * sd * 1.5 + hz * sp * 0.12; p.r = -car.th; p.k = Math.min(1, sp / 18); }
      P.forEach((p, i) => { if (p.a >= 1) return; p.a += dt / 1.5; p.x += p.vx * dt; p.z += p.vz * dt; const a = Math.min(1, p.a), e = 0.5 + 1.9 * a; o.position.set(p.x, 0.05, p.z); o.rotation.set(0, p.r, 0); o.scale.set(a < 1 ? e * 1.7 : 1e-4, 1, a < 1 ? e : 1e-4); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
        im.setColorAt(i, c.setScalar(p.k * (1 - a) * (1 - a) * Math.min(1, a * 10))); }); im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }); }
  { const g = new THREE.RingGeometry(0.72, 1, 20, 2), u = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < u.count; i++) u.setXY(i, 0.5, Math.min(1, Math.abs(Math.hypot(p.getX(i), p.getY(i)) - 0.86) / 0.14)); g.rotateX(-PI / 2);
    const R = [0, 1, 2].map(() => { const m = dyn(new THREE.Mesh(g, glow('#b8d0c0', { opacity: 0 }))); m.renderOrder = 3; m.visible = false; return { m, a: 1 }; }); let wait = 1;
    TICK.push((dt, car) => { if ((wait -= dt) < 0) { wait = 1.2 + Math.random() * 2.5; const r = R.find(q => q.a >= 1), i = (car.idx + 12 + (Math.random() * 22 | 0)) % N, s = S[i], d = (Math.random() < 0.5 ? -1 : 1) * (7.5 + Math.random() * 2.5);
        if (r && wet(i) && wet(i + 6) && wet(i - 6)) { r.a = 0; r.m.position.set(s.x - s.tz * d, 0.05, s.z + s.tx * d); } }
      for (const r of R) { if (r.a >= 1) { r.m.visible = false; continue; } r.a += dt / 1.6; r.m.visible = true; r.m.scale.setScalar(0.25 + 1.9 * r.a); r.m.material.opacity = 0.6 * (1 - r.a) * Math.min(1, r.a * 8); } }); }

  // ---------- birds say nobody is here (Z1-01, Z2-06, Z3-02, Z4-05): they sit where no car goes (barrier tops, wreck roofs, a gantry beam, the slabs of the ledge), lift when the car comes within D samples of i0,
  // fly off on the wind and are set back down once the car is far (the pigeons of scenery-paris.js, the egrets of scenery-chapada.js). B = [{ x, y, z, r, vx, vy, vz, e }] ----------
  const o3 = new THREE.Object3D(), FLOCKS = [], lay = (ms, k, x, y, z, r, e, sy = 1) => { o3.position.set(x, y, z); o3.rotation.set(0, r, 0); o3.scale.set(e, e * sy, e); o3.updateMatrix(); for (const m of ms) m.setMatrixAt(k, o3.matrix); };
  const place = v => { const tt = v.en ? v.t : 0, up = tt > 0 && tt < v.T, sep = v.fly !== v.rest; v.B.forEach((q, k) => { const x = q.x + q.vx * tt, y = q.y + q.vy * tt + v.g * tt * tt, z = q.z + q.vz * tt, r = tt ? Math.atan2(-q.vz, q.vx) : q.r;
      if (sep) { lay(v.rest, k, q.x, q.y, q.z, q.r, tt === 0 ? q.e : 1e-4); lay(v.fly, k, x, y, z, r, up ? q.e : 1e-4); } else lay(v.rest, k, x, y, z, r, tt < v.T ? q.e : 1e-4);
      lay(v.wings, k, x, y + v.wy * q.e, z, r, up ? q.e : 1e-4, Math.sin(tt * v.flap + k * 1.7)); }); for (const m of v.all) m.instanceMatrix.needsUpdate = true; };
  const flock = (B, i0, o) => { const l = B.map(q => [q.x, q.y, q.z, q.r, q.e]), v = { B, i0, D: 30, T: 5, g: 0.3, flap: 16, wy: 0.2, en: 0, t: 0, ...o }; v.rest = o.rest(l); v.fly = o.fly ? o.fly(l) : v.rest; v.wings = o.wings(l); v.all = [...new Set([...v.rest, ...v.fly, ...v.wings])];
    for (const m of v.all) { m.userData.dyn = 1; m.castShadow = false; m.frustumCulled = false; } FLOCKS.push(v); place(v); };
  TICK.push((dt, car) => { for (const v of FLOCKS) { const e = (v.i0 - car.idx + N) % N, seen = e < 200 || e > N - 90; for (const m of v.all) m.visible = seen; // (a flock far from the car is not drawn: one pass per batch saved)
      if (!v.en && e < v.D && e > 0) { v.en = 1; v.t = 0; } else if (v.en && e > 300 && e < N - 300) { v.en = 0; place(v); } if (v.en && v.t < v.T) { v.t += dt; place(v); } } });
  { const grey = h.mat('paint', { c: 0x3c3c44 }), head = h.mat('paint', { c: 0x26262c }), wing = h.mat('paint', { c: 0x4a4a54, ...DS }), pale = h.mat('paint', { c: 0xd8d6cc }), paleW = h.mat('paint', { emis: 1, c: 0xe6e2d6, ...DS }), white = h.mat('paint', { c: 0xf2efe6 }), leg = h.mat('paint', { c: 0x2a2a26 }), whiteW = h.mat('paint', { emis: 1, c: 0xf4f0e4, ...DS });
    const DOVE = { rest: l => insts(h, 'pigeon', { feather: grey, headEl: head }, l), wings: l => [inst(h, h.geo('wingsV', 0.42, 0.8, 0.5), wing, l)] };
    const WHITE = { rest: l => insts(h, 'pigeon', { feather: pale, headEl: pale }, l), wings: l => [inst(h, h.geo('wingsV', 0.42, 0.8, 0.5), paleW, l)] }; // white doves where the background is dark (facades, the cave); the dark ones on the gantry, against the sky
    const EGRET = { rest: l => insts(h, 'flamingo', { paw: leg, feather: white, beak: leg }, l), fly: l => insts(h, 'egretFlight', { paw: leg, feather: whiteW, beak: leg }, l), wings: l => [inst(h, h.geo('wingsBird', 1.3, 1, 0.4), whiteW, l)], T: 7, g: 0.05, flap: 4, wy: 0.1, D: 16 };
    // bird(x, y, z, k, [vx, vz], up, e): one bird, its flight drawn from its place (k): the given heading, spread a little, plus the wind (+x)
    const bird = (x, y, z, k, [vx, vz], up = 3.5, e = 2.4) => ({ x, y, z, r: HH(k, 1) * 6.28, vx: vx + 2.5 + (HH(k, 2) - 0.5) * 5, vy: up + HH(k, 3) * 2.5, vz: vz + (HH(k, 4) - 0.5) * 5, e });
    // the checkpoint: doves on the two staggered lines of concrete barriers (each across half the road) and on the watchtower's roof
    for (const [xs, zs, n0] of [[[-226, -222], [-12.6, -4], 0], [[-162, -158], [4, 12.6], 20]]) flock([0, 1].flatMap(b => [0, 1, 2, 3, 4].map(k => bird(xs[b] + (HH(k + n0, b) - 0.5) * 0.2, cityY(xs[b]) + 0.92, zs[b] - 3.8 + k * 1.9 + HH(k, b + 5) * 0.6, k + n0 + b * 7, [11, zs[b] < 0 ? -3 : 3], 2.2))), near(h, xs[0], 0), WHITE);
    // the flooded district: egrets standing on the roof of the bus and of the lorry, the far side of each from the lane
    for (const [x, z, y, ry, len, n0] of [[384, -115, 2.72, PI / 2 + 0.15, 9, 40], [388.6, -225, 5.25, PI / 2 - 0.12, 8.5, 60]]) { const i0 = near(h, x, z), s = S[i0], sd = Math.sign((x - s.x) * -s.tz + (z - s.z) * s.tx); // sd: which side of the lane the wreck stands
      flock([0, 1, 2, 3, 4].map(k => { const u = (k - 2) / 2.5 * len / 2 + (HH(k, n0) - 0.5), w = (HH(k, n0 + 1) - 0.5) * 1.2; return bird(x + Math.sin(ry) * u + Math.cos(ry) * w, y, z + Math.cos(ry) * u - Math.sin(ry) * w, k + n0, [s.tx * 11 - s.tz * sd * 2, s.tz * 11 + s.tx * sd * 2], 0.8, 1.2 + 0.2 * HH(k, n0 + 2)); }), i0, EGRET); }
    // the motorway: a flock on the upper beam of the first sign gantry, which leans forward over the lane; they leave east, over the city
    { const i0 = near(h, 228, -150), s = S[i0]; flock(Array.from({ length: 16 }, (_, k) => bird(s.x - 8.6 + k * 1.15 + HH(k, 80) * 0.4, s.y + 8.62, s.z + 1.38, k + 80, [5, 7], 2.5, 2.6)), i0, { ...DOVE, D: 34 }); }
    // the hole: doves on the broken slabs either side of the lane and on the lip, bursting up out of the shaft as the car goes over
    { const i0 = I.bord; flock([[163, 2.9, 210.2], [164.5, 3.1, 210.8], [161, 2.9, 229.6], [162.6, 3.1, 229.2], [156.5, 2.5, 211], [157.5, 2.5, 229], [154.6, 2.5, 213.5], [154.8, 2.5, 226.4]].map(([x, y, z], k) => bird(x, y, z, k + 120, [-9, z < 220 ? -2 : 2], 5, 2.6)), i0, { ...WHITE, D: 34, g: 0.5 }); } }

  // ---------- light in the air ----------
  // shaft(A, L, len, hu, hv, hex, op): a bar of light from the point A along the unit direction L, hu x hv metres in half-section; additive, and nothing at both ends (vertex colours), so it never shows an edge
  const shaft = (A, L, len, hu, hv, hex, op) => { const V = THREE.Vector3, Lv = new V(...L).normalize(), u = new V(Lv.z, 0, -Lv.x); if (u.length() < 1e-3) u.set(1, 0, 0); u.normalize(); const v = new V().crossVectors(Lv, u), P = [], C = [], ix = [];
    // (not a box, which reads as a pale solid: sheets along the light, five standing and two lying, each fading to nothing along its edges: seen from any side it is streaks of lit air)
    const sheet = (o, w) => { const n = P.length / 3; [[0, 0], [0.14, 1], [0.7, 0.75], [1, 0]].forEach(([f, a], r) => { for (const [e, k] of [[-1, 0], [-0.4, a], [0.4, a], [1, 0]]) { const p = new V(...A).addScaledVector(Lv, f * len).add(o).addScaledVector(w, e); P.push(p.x, p.y, p.z); C.push(k, k, k); }
      if (r) for (let k = 0; k < 3; k++) { const a0 = n + (r - 1) * 4 + k, b0 = n + r * 4 + k; ix.push(a0, a0 + 1, b0 + 1, a0, b0 + 1, b0); } }); };
    for (const e of [-0.8, -0.4, 0, 0.4, 0.8]) sheet(u.clone().multiplyScalar(e * hu), v.clone().multiplyScalar(hv)); for (const e of [-0.45, 0.45]) sheet(v.clone().multiplyScalar(e * hv), u.clone().multiplyScalar(hu));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(ix);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: hex, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.userData.dyn = 1; m.renderOrder = 4; scene.add(m); return m; };
  // puffs(n, colour, opacity, life, size): a cloud of the engine's soft discs (h.softPuffs), stepped by the tick; rnd(a): -a/2 .. a/2
  const puffs = (n, col, op, life, size) => { let f = null; TICK.push(dt => f && f.step(dt)); return { emit: (...a) => (f = f || h.softPuffs(n, col, op, life, 0.5, size)).emit(...a) }; }, // (made at its first puff: the engine's particles do not exist yet while the scenery is built)
    rnd = a => (Math.random() - 0.5) * a;
  const box = (m, w, ht, d, x, y, z, parent = kit) => h.pose('boxMesh', m, parent, [x, y, z], w, ht, d), hinge = (x, y, z, ry = 0) => { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; p.userData.dyn = 1; scene.add(p); return p; };
  const discG = ry => { const g = new THREE.CircleGeometry(1, 14), u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, 0.5, Math.min(1, Math.hypot(u.getX(i) - 0.5, u.getY(i) - 0.5) * 2)); if (ry) g.rotateY(ry); else g.rotateX(-PI / 2); return g; }; // a soft disc: flat on the ground, or upright turned by ry

  // ---------- the hole breathes (Z4-01 to Z4-06): the low sun comes in over what is left of the street (x = 96) and falls east across the cave in one wide bar and a thin one, dust turning in it, a warm pool where it lands;
  // a broken main pours out of the south bank into a runnel at its foot; cables hang from the broken edge ahead and swing in the draught ----------
  { const L = [0.867, -0.379, -0.325], A = [104, 2.6, 227.5], LEN = 28.5; shaft(A, L, LEN, 2.6, 1.5, 0xffd9a0, 0.16); shaft([100, 2.6, 215.5], L, LEN, 1.1, 0.8, 0xffd9a0, 0.12);
    h.emis(I.bord + 10, 128.5, -5.6, 218.3, 0xffd8a0, 14, 1.5);
    const dust = puffs(70, [1, 0.9, 0.7], 0.22, 4.5, 0.05); let acc = 0;
    TICK.push((dt, car) => { if (car.idx < I.bord - 70 || car.idx > T.t0 + 10) return; for (acc += dt; acc > 0.1; acc -= 0.1) { const f = 0.2 + 0.75 * Math.random(); dust.emit(A[0] + L[0] * LEN * f + rnd(3), A[1] + L[1] * LEN * f + rnd(2), A[2] + L[2] * LEN * f + rnd(4), 0.3, 0.1, 0); } });
    // the main: a stub of pipe in the bank, the sheet falling 5.7 m in an arc (its drawing slides down), spray at its foot, and the runnel along the foot of the bank toward the tube
    const X = 116, Y = S[near(h, 116, 220)].y, fw = q => Math.min(10, q.w - 0.3), fallM = h.mat('waterDrop', { emis: 1, c: 0xd8e8e2, ...DS, transparent: true, opacity: 0.9, depthWrite: false, smooth: 1 }, 6), runM = h.mat('waterDrop', { emis: 1, c: 0x9ab4a8, ...DS, transparent: true, opacity: 0.4, depthWrite: false, smooth: 1, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }, 6);
    box(MAT.rust, 1.3, 1.3, 2.2, X, -2.2, 230.4); box(MAT.dark, 1, 1, 0.1, X, -2.2, 229.28);
    { const P = [], U = [], ix = [], n = 8; for (let k = 0; k <= n; k++) { const f = k / n, z = 229.3 - 2 * Math.sqrt(f), y = -2.3 + (Y + 0.1 + 2.3) * f, w = 1 + 0.5 * f; P.push(X - w, y, z, X + w, y, z); U.push(0, f * 1.3, 1, f * 1.3); if (k) { const a = k * 2 - 2; ix.push(a, a + 1, a + 3, a, a + 3, a + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(ix); const m = new THREE.Mesh(g, fallM); m.userData.dyn = 1; m.renderOrder = 3; scene.add(m); }
    const i0 = near(h, X, 220); h.ribbon(i0, 9, q => -(fw(q) - 0.2), 0.07, q => -(fw(q) - 2.4), 0.07, runM, 6).userData.dyn = 1;
    const spray = puffs(50, [0.9, 0.94, 0.9], 0.4, 0.9, 0.1); let ac2 = 0;
    TICK.push((dt, car) => { fallM.map.offset.y = (fallM.map.offset.y - 0.9 * dt + 1) % 1; runM.map.offset.y = (runM.map.offset.y + 0.25 * dt) % 1; if (car.idx < I.bord - 70 || car.idx > T.t0 + 10) return; for (ac2 += dt; ac2 > 0.05; ac2 -= 0.05) spray.emit(X + rnd(2.4), Y + 0.3, 227.3 + rnd(0.8), rnd(2), 0.8 + Math.random() * 1.6, -0.6 + rnd(1.5)); });
    // (the cables: two lines still strung across the street above the hole, seen against the sky from the street and in the fall; from each hang cut ends that swing)
    const C = [[128, 9.5, [[213, 4.5], [218.5, 3], [226, 5.5]]], [107, 8.5, [[211.5, 5], [222, 3.5], [227.5, 6]]]].flatMap(([x, y, l]) => { box(MAT.dark, 0.14, 0.14, 23, x, y, 220); return l.map(([z, len], k) => { const p = hinge(x, y, z); box(MAT.dark, 0.18, len, 0.18, 0, -len / 2, 0, p); if (k & 1) box(MAT.dark, 0.5, 0.6, 0.4, 0, -len, 0, p); return p; }); });
    TICK.push(() => C.forEach((p, k) => { p.rotation.z = (0.04 + 0.1 * gust) * Math.sin(t * (1.1 + 0.13 * k) + k * 2.1); p.rotation.x = 0.03 * Math.sin(t * 0.8 + k); })); }

  // ---------- the metro (Z5-01, Z5-02, Z5-06): every lamp drawn is a real light. Tube: green-white emergency lamps, one in five sags to a third and recovers (never off); station: the live strip lights, one in two stuttering;
  // two grates in the crown of the tube let the day down: a pale panel behind its bars, a bar of light to the floor, a warm pool ----------
  { const DIP = []; LAMPS.forEach(([i, x, y, z, kind], n) => { const l = h.emis(i, x, y, z, kind === 1 ? 0xfff0d0 : kind === 2 ? 0xd8f0e0 : 0xa8ffc0, kind ? 17 : 13, kind ? 2.6 : 2.4); if (kind ? n & 1 : n % 5 === 2) DIP.push([l, l.c.clone(), n * 1.7, kind]); });
    TICK.push(() => { for (const [l, c, ph, kind] of DIP) { const u = Math.sin(t * (kind ? 1.7 : 0.9) + ph) * Math.sin(t * 0.37 + ph * 2.3), d = ss((u - 0.3) / 0.3); l.c.copy(c).multiplyScalar(1 - 0.66 * d * (0.82 + 0.18 * Math.sin(t * 11 + ph))); } });
    const sky = h.mat('lampObj', { emis: 1, c: 0xffe9c0, ...DS }), pool = glow('#ffe2b0', { opacity: 0.5 }), dg = discG();
    for (const i of [T.t0 + 98, T.t0 + 222]) { const s = S[i], g = new THREE.Group(); g.position.set(s.x, s.y, s.z); g.rotation.y = Math.atan2(s.tx, s.tz); kit.add(g);
      box(sky, 2.2, 0.06, 6, 0, 5.08, 0, g); for (let k = -2; k <= 2; k++) box(MAT.dark, 2.3, 0.1, 0.14, 0, 5.02, k * 1.2, g); box(MAT.dark, 0.14, 0.1, 6.1, 0, 5.02, 0, g);
      shaft([s.x, s.y + 5, s.z], [0.12, -1, 0.05], 5, 2.6, 0.9, 0xffe6b8, 0.3); const d = new THREE.Mesh(dg, pool); d.position.set(s.x, s.y + 0.12, s.z); d.rotation.y = g.rotation.y; d.scale.set(1.9, 1, 3.6); d.userData.dyn = 1; d.renderOrder = 3; scene.add(d);
      h.emis(i, s.x, s.y + 2.6, s.z, 0xffe0b0, 12, 2.8); } }

  // ---------- one wind (Z1-02, Z1-04, Z2-04, Z3-06): the rows of trees of the boulevard rock, the reeds lean, a torn flag streams from the watchtower, the tent's door and the lorry's cover flap. All east, all on the same gusts ----------
  { const o = new THREE.Object3D(); for (const k of ['leaf', 'gold']) { const L = TREES[k].filter(p => Math.abs(p[2]) < 19 && p[0] > -320 && p[0] < 330), im = inst(h, h.geo('canopy'), MAT[k], L); TREES[k].splice(0, TREES[k].length, ...TREES[k].filter(p => !L.includes(p))); im.userData.dyn = 1;
      TICK.push(() => { L.forEach((p, i) => { const a = (0.012 + 0.03 * gust) * Math.sin(t * 0.9 + p[0] * 0.05 + p[2]) + 0.02 * gust; o.position.set(p[0] + a * 9, p[1], p[2]); o.rotation.set(0, p[3] || 0, -a); o.scale.set(p[4] || 1, p[5] || p[4] || 1, p[6] || p[4] || 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.instanceMatrix.needsUpdate = true; }); } }
  { kit.updateMatrixWorld(true); const R = REEDS.map(r => { scene.attach(r); r.userData.dyn = 1; PLACERS.weld(h, r); r.rotation.order = 'YXZ'; return r; });
    TICK.push((dt, car) => R.forEach((r, k) => { if (!(r.visible = Math.abs(r.position.x - car.x) + Math.abs(r.position.z - car.z) < 170)) return; r.rotation.z = (0.02 + 0.05 * gust) * Math.sin(t * 1.1 + k * 1.9) + 0.03 * gust; })); }
  { // cloth(m, w, ht, n, parent): a strip of n panels, each hinged on the one before, the first on `parent` (its local X runs along the cloth); wave(J, amp, sp): the swing runs down the strip
    const cloth = (m, w, ht, n, parent) => { let p = parent; const J = []; for (let k = 0; k < n; k++) { const j = new THREE.Group(); j.position.x = k ? w / n : 0; p.add(j); box(m, w / n, ht * (1 - 0.12 * k), 0.06, w / n / 2, 0, 0, j); J.push(j); p = j; } return J; };
    const wave = (J, amp, sp, ph = 0) => J.forEach((j, k) => { j.rotation.y = (k ? 1 : 0.5) * amp * (0.4 + 0.6 * gust) * Math.sin(t * sp - k * 1.1 + ph); });
    const y0 = cityY(-190); box(MAT.steel, 0.12, 3.4, 0.12, -188.6, y0 + 7.8, -13.6); const F = cloth(MAT.canvas, 3.2, 1.7, 4, hinge(-188.6, y0 + 8.6, -13.6));                // the watchtower's flag, on a mast at its east corner
    const D = cloth(MAT.canvas, 2, 1.9, 2, hinge(-191.9, cityY(-192) + 1.15, 11.4, -PI / 2));                                                                                   // the tent's door, at its east end
    const s = S[near(h, 231.4, -122)], hp = hinge(232.2, s.y + 4.3, -116.6, 0.3); hp.rotation.z = 0.5; const Tp = cloth(MAT.olive, 3.6, 2.4, 3, hp);                            // the lorry's cover, torn loose at the back of its roof
    TICK.push((dt, car) => { const a = F[0].parent.visible = D[0].parent.visible = car.idx < 120 || car.idx > N - 60, b = hp.visible = Math.abs(car.idx - 700) < 110; if (a) { wave(F, 0.5, 5); wave(D, 0.35, 3.1, 1); } if (b) wave(Tp, 0.3, 3.6, 2); }); }

  // ---------- still switched on (Z1-03): a traffic light on its span wire over the crossroads at x = -110, its amber lamp swelling and thinning once a second (ramps of 150 ms, never dark), a real light under it ----------
  { const x = -110, y = cityY(x) + 6.6; box(MAT.dark, 0.08, 0.08, 34, x, y + 1.5, 0); box(MAT.dark, 0.08, 1, 0.08, x, y + 1, 0); box(MAT.dark, 0.7, 1.9, 0.7, x, y - 0.4, 0);
    const lamp = dyn(new THREE.Mesh(discG(-PI / 2), glow('#ffb040', {}))); lamp.position.set(x - 0.4, y - 0.4, 0); const l = h.emis(near(h, x, 0), x, y - 1.6, 0, 0xffb040, 16, 2.4), c0 = l.c.clone();
    TICK.push(() => { const u = t % 1.1, b = 0.3 + 0.7 * ss(u / 0.15) * (1 - ss((u - 0.5) / 0.15)); lamp.scale.setScalar(0.9 * b + 0.25); l.c.copy(c0).multiplyScalar(b); }); }

  // ---------- dust (Z3-05): a thin pale plume off the broken end of the fallen span, leaning east ----------
  { const s = S[I.travee], f = puffs(40, [0.84, 0.8, 0.7], 0.3, 3, 0.3); let acc = 0; TICK.push((dt, car) => { if (Math.abs(car.idx - I.travee) > 150) return; for (acc += dt; acc > 0.15; acc -= 0.15) f.emit(s.x + 8 + rnd(3), s.y - 0.5, s.z + rnd(3), 1.6 + 1.5 * gust, 0.5 + Math.random() * 0.6, rnd(0.6)); }); }

  // ---------- sound placed in the place (Z4-07): the broken main, heard by distance and side; beds, acoustics and events are AMB, AMBZ, ACOUSTICS and ambEvent of src/audio/audio.js ----------
  if (window.SOUND && SOUND.spots) SOUND.spots('autoroute', [{ p: { x: 116, y: -5, z: 228 }, sound: 'waterfall', r: 80, vol: 0.7 }]);

  return (dt, now, car) => { if (!car) return; dt = Math.min(dt, 0.1); for (const f of TICK) f(dt, car); };
};
