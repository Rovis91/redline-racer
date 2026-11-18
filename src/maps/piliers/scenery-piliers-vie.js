// "piliers", what lives (docs/methods/LIFE.md, docs/proposals/sky-pillars/LIFE-V3.md): the cloud layers and their shadows, the mist sheets and the banks drifting among the pillars, the falls, the cable car,
// the prayer flags, the lift cabins, birds, smoke and spray, and the placed sounds. Called last (ZONES of scenery-piliers.js): the other zone files declare (FALLS, FLAGS, CABINS, SITES), this one builds.
// One wind, to the west (-x). Everything animates on the tick's dt (pause freezes it). Nothing here stands on the roadway or collides. Costs: see "Draw passes" at each block.
(window.PILIERS = window.PILIERS || {}).vie = ({ h, g, S, N, at, idx, nz, LIFE, flows, FALLS, FLAGS, CABINS, SITES, STEPS, THREE }) => {
  const { edgePt, inst } = PLACERS, V3 = THREE.Vector3, DS = THREE.DoubleSide, TAU = Math.PI * 2, clamp = v => Math.max(0, Math.min(1, v)), ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const soft = (label, o, ...a) => h.mat(label, { emis: 1, transparent: true, depthWrite: false, smooth: 1, side: DS, ...o }, ...a); // a self-lit translucent material, linear filtering: mist, veils of water

  // ---------- the sea of clouds and the mist: horizontal layers that slide west at different speeds (parallax from the car). From below: cloud shadows on the sea (y 84), a second thinner cloud layer (88),
  // three mist sheets (100, 120, 140) that whiten the feet of the pillars in steps. All stay 10 m or more under the lowest road (150): never on the roadway. 5 draw passes
  const layer = (y, m, ro, size = 9000) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m); o.rotation.x = -Math.PI / 2; o.position.set(650, y, -500); o.renderOrder = ro; h.scene.add(o); };
  const sheetMat = (v, c, op, rep) => soft('brumePiliers', { c, opacity: op, rep: [rep, rep * 1.7], side: THREE.FrontSide }, v); // patches stretched along the wind
  layer(84, flows(sheetMat(0, 0x6f93a6, 0.55, 9), 0.0011, 0.0003), 1, 12000); layer(88, flows(sheetMat(1, 0xffffff, 0.8, 31), 0.0042, 0), 2, 12000);
  [[100, 0.7, 0.004], [120, 0.6, 0.0065], [140, 0.5, 0.009]].forEach(([y, op, u], k) => layer(y, flows(sheetMat(k & 1, 0xffffff, op, 30 - k * 4), u, k * 0.0006), 3 + k));

  // the cloud decks: the sheets above are flat, the road climbs from 150 to 225, so from the high stretches the valley (shoulders, slopes, floor) showed through them. Two decks that follow the road at 6 and 16 m under it
  // (a lower envelope of the road's altitude, rising 0.02 m per metre away from it): from the corniches, the bridge and the descent nothing is seen below the road but white and the pillars standing out of it. They fade out toward the edge of the map
  { const R = 2300, n = 46, step = 2 * R / n, base = (x, z) => { let m = 1e9; for (let i = 0; i < N; i += 3) m = Math.min(m, S[i].y + 0.02 * Math.hypot(S[i].x - x, S[i].z - z)); return m; };
    const grid = []; for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const x = 650 - R + i * step, z = -500 - R + j * step; grid.push([x, base(x, z), z, clamp((R - 100 - Math.max(Math.abs(x - 650), Math.abs(z + 500))) / 500)]); }
    [[6, 0.92, 0.0035, 22], [16, 0.7, 0.006, 17]].forEach(([dy, op, u, rep], k) => { const G = new THREE.BufferGeometry(), P = [], U = [], C = [], I = [];
      grid.forEach(([x, y, z, a], q) => { P.push(x, y - dy, z); U.push((q % (n + 1)) / n * rep, Math.floor(q / (n + 1)) / n * rep * 1.7); C.push(1, 1, 1, a); });
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i; I.push(a, a + n + 1, a + 1, a + 1, a + n + 1, a + n + 2); }
      G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); G.setAttribute('color', new THREE.Float32BufferAttribute(C, 4)); G.setIndex(I);
      const o = new THREE.Mesh(G, flows(soft('brumePiliers', { c: 0xffffff, opacity: op, vertexColors: true, side: THREE.FrontSide }, k), u, 0)); o.renderOrder = 5 + k; o.frustumCulled = false; h.scene.add(o); }); }

  // ---------- banks of mist among the pillars: long soft quads that turn to the car (round the vertical), form, drift west and dissolve. They cross the pillars between a third and two thirds of their height:
  // the ranks. None within 150 m of a road, and those within 300 m stay under it (mist in the ravine): a bank is never between the car and its next bend. One geometry rewritten each frame: 1 draw pass
  const BANKS = [], bank = (x, y, z, w, ht, op = 0.6, span = 260, v = 3, ph = nz(x, z), o = {}) => BANKS.push({ x, y, z, w, ht, op, span, v, ph, rise: 0, grow: 0, from: 0.5, far: 1, c: 1, ...o });
  // puff(point, n, w, colour, { … }): a small plume at a point, n quads of the same batch one after the other: each is born at the point, rises, drifts west, grows and fades (smoke of a chimney, spray where water breaks)
  const puff = ([x, y, z], n, w, c, op, span, v, rise, grow = 1.5) => { for (let k = 0; k < n; k++) bank(x, y, z, w, w, op, span, v, (k + nz(x + k, z)) / n, { rise, grow, from: 0, far: 0, c }); };
  for (let k = 0; k < 90; k++) { const a = (k + nz(k, 41)) / 90 * TAU, R = 80 + 1250 * nz(k, 43), x = 650 + Math.cos(a) * R, z = -500 - Math.sin(a) * R, d = g.dAt(x, z), ht = 55 + 60 * nz(k, 47), low = S[PLACERS.near(h, x, z)].y - 8 - ht / 2;
    if (d < 150 || (d < 300 && low < 150)) continue; bank(x, d < 300 ? Math.max(150, low - 30 * nz(k, 45)) : 160 + 140 * nz(k, 45), z, (220 + 260 * nz(k, 49)) * (d < 300 ? 0.6 : 1), ht, 0.6 + 0.3 * nz(k, 51)); }
  const banksBuild = () => { const G = new THREE.BufferGeometry(); let P, C, mesh; // (called at the end: the falls add their own banks)
    { const m = BANKS.length, U = new Float32Array(m * 8), I = []; P = new Float32Array(m * 12); C = new Float32Array(m * 16).fill(1); for (let k = 0; k < m; k++) { U.set([0, 0, 1, 0, 1, 1, 0, 1], k * 8); I.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3); }
      G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setAttribute('uv', new THREE.BufferAttribute(U, 2)); G.setAttribute('color', new THREE.BufferAttribute(C, 4)); G.setIndex(I);
      mesh = new THREE.Mesh(G, soft('bancBrumePiliers', { c: 0xf2f7f8, vertexColors: true })); mesh.frustumCulled = false; mesh.userData.dyn = 1; mesh.renderOrder = 8; h.scene.add(mesh); }
    LIFE.push((dt, car, t) => { const cx = car ? car.x : 300, cz = car ? car.z : -180; BANKS.forEach((b, k) => { const u = (t * b.v / b.span + b.ph) % 1, x = b.x + b.span * (b.from - u), dx = x - cx, dz = b.z - cz, l = Math.hypot(dx, dz) || 1, e = 1 + b.grow * u, rx = -dz / l * b.w / 2 * e, rz = dx / l * b.w / 2 * e;
        // a far bank thins as the car comes within 400 m and is gone at 150: it stays a far thing, a quad never cuts through the view; a plume is small and beside the road: it only fades beyond 300 m
        const a = b.op * ease(Math.min(u * (b.far ? 1 : 3), 1 - u) / 0.2) * (b.far ? ease((l - 150) / 250) : ease((320 - l) / 60)), yc = b.y + b.rise * u, y0 = yc - b.ht / 2 * e, y1 = yc + b.ht / 2 * e;
        P.set([x - rx, y0, b.z - rz, x + rx, y0, b.z + rz, x + rx, y1, b.z + rz, x - rx, y1, b.z - rz], k * 12); for (let j = 0; j < 4; j++) { const q = k * 16 + j * 4; C[q] = C[q + 1] = C[q + 2] = b.c; C[q + 3] = a; } });
      G.attributes.position.needsUpdate = G.attributes.color.needsUpdate = true; }); };

  // ---------- the falls (FALLS: the three tower falls, the plateau fall; then the cascade of the buttress): quads from upstream to downstream, the texture slides down them. Two layers for all the falls of the map:
  // an opaque pale body, and a translucent veil 0.4 m in front of it that runs faster. 2 draw passes. tile = metres of fall per texture repeat: the speed in m/s follows it (long for the far falls, short for the near cascade)
  const quads = () => { const P = [], U = [], I = []; return { add(a, b, w, ax, tile, lift = 0, out = [0, 0, 0], vb = 0) { const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), k = P.length / 3, hw = w / 2;
      for (const [p, v] of [[a, vb + l / tile], [b, vb]]) for (const sd of [-1, 1]) { P.push(p[0] + ax[0] * hw * sd + out[0] * lift, p[1] + out[1] * lift, p[2] + ax[2] * hw * sd + out[2] * lift); U.push(sd < 0 ? 0 : 1, v); } I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); return vb + l / tile; },
    mesh(m, ro = 0) { const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); G.setIndex(I); G.computeVertexNormals(); const o = new THREE.Mesh(G, m); o.renderOrder = ro; o.frustumCulled = false; h.scene.add(o); return o; } }; };
  const body = quads(), veil = quads(), SPRAYS = []; // SPRAYS: where water breaks: [x, y, z, strength]
  const water = (a, b, w, tile, out, ax) => { body.add(a, b, w, ax, tile, 0, out); veil.add(a, b, w * 0.62, ax, tile * 0.8, 0.4, out); };
  // a fall follows its path (the rock profile, see fallPath in scenery-piliers.js) in short segments; the texture runs on from one to the next, from the foot up, so that no seam shows. It leaves the lip, drops clear of the face and ends in its boil
  for (const [, b, w, hero, path] of FALLS) { const out = (() => { const dx = path[1][0] - path[0][0], dz = path[1][2] - path[0][2], l = Math.hypot(dx, dz) || 1; return [dx / l, 0, dz / l]; })(); let vb = 0, vv = 0, vh = 0;
    for (let k = path.length - 2; k >= 0; k--) { const p = path[k], q = path[k + 1], ax = [-out[2], 0, out[0]]; // lateral axis fixed (the path is on one ray)
      vb = body.add(p, q, w, ax, 32, 0, out, vb); vv = veil.add(p, q, w * 0.62, ax, 25.6, 0.4, out, vv); if (hero) vh = veil.add(p, q, w * 0.3, ax, 20, 0.8, out, vh); }
    // the boil where the fall enters the clouds (its foot is 3 m over the highest mist sheet): spray beside the road's reach, and two banks that form and drift away
    SPRAYS.push([b[0], b[1] + 1, b[2], 1.4]); bank(b[0] + out[0] * 6, b[1] + 3, b[2] + out[2] * 6, hero ? 90 : 60, hero ? 46 : 34, 0.85, 40, 2.2); bank(b[0] - 14, b[1] + 8, b[2], hero ? 70 : 46, hero ? 32 : 24, 0.7, 60, 3.2); }
  // the cascade of the buttress (descent, PK 3290, 8 m from the wall): down the beds of the cut face (STEPS), a drop at each face, a run on each bed, into the culvert at its foot
  { const [, , sd, nb, off, y] = STEPS[2], s = at(3290), tx = [s.tx, 0, s.tz], [rx, rz] = edgePt(s, sd, 1), out = [s.x - rx, 0, s.z - rz], ol = Math.hypot(out[0], out[2]); out[0] /= ol; out[2] /= ol; // out: toward the road
    const pt = (o, yy) => { const [x, z] = edgePt(s, sd, o); return [x, s.y + yy, z]; };
    for (let k = nb - 1; k >= 0; k--) { const o0 = off(k)(s), o1 = k < nb - 1 ? off(k + 1)(s) : o0 + 12, top = y(k + 1)(s), foot = Math.max(y(k)(s), 0.3);
      water(pt(o1, top + 0.12), pt(o0 - 0.5, top + 0.12), 4.6, 6, [0, 1, 0], tx); water(pt(o0 - 0.5, top + 0.12), pt(o0 - 0.5, foot), 4.6, 6, out, tx); SPRAYS.push([...pt(o0 - 1, foot + 0.4), k ? 0.5 : 1]); }
    SITES.cascade = pt(off(0)(s) - 1, 1.5); }
  for (const [a, , , hero] of FALLS) if (!hero && a[1] < 240) { SPRAYS.push([a[0], a[1] + 0.5, a[2], 1]); SITES.lip = a; } // the lip of the plateau fall
  body.mesh(flows(h.mat('chutePiliers', { emis: 1, c: 0xf0f6f6, smooth: 1, side: DS }, 0), 0, 0.7)); veil.mesh(flows(soft('chutePiliers', { opacity: 0.85 }, 1), 0, 1.15), 7);

  // ---------- smoke and spray, as plumes of the mist batch (the engine's soft particles, h.softPuffs and h.steam, draw nothing at present: see the report): grey smoke at the three tea houses and the incense burner
  // of the ledge temple (the village chimneys are under the canopy, above the frame of the racing camera: none there); white spray where the cascade breaks on each bed and at the lip of the plateau fall. They lean west
  for (const p of [11, 12, 13].map(k => SITES.smoke[k]).filter(Boolean)) puff(p, 4, 3.2, 0.42, 0.8, 7, 1.3, 9, 2); if (SITES.incense) puff(SITES.incense, 3, 1.6, 0.5, 0.7, 3, 0.7, 7, 1.5);
  for (const [x, y, z, k] of SPRAYS) puff([x, y + 1, z], 3, 4.5 * (0.6 + 0.4 * k), 1, 0.7, 5, 2.4, 2.5 * k, 1.2);
  banksBuild();

  // ---------- the moving batch: everything that moves and is made of plain boxes (flags, cabins, lift cabins, bullwheel, birds) is one instanced mesh of unit cubes, tinted per instance: 1 draw pass.
  // cube(colour) reserves one and returns its number; put(k, M) sets its matrix. mob(parts) = a rigid object made of boxes [colour, w, h, d, x, y, z]; move(o, M) places it
  const COLS = [], m4 = new THREE.Matrix4(), mG = new THREE.Matrix4(); let im = null;
  const cube = c => COLS.push(c) - 1, put = (k, M) => im.setMatrixAt(k, M); // (only called from the tick: the batch exists by then)
  const mob = parts => ({ k0: COLS.length, loc: parts.map(([c, w, ht, d, x, y, z]) => { cube(c); return new THREE.Matrix4().makeScale(w, ht, d).setPosition(x, y, z); }) }), move = (o, M) => o.loc.forEach((l, i) => put(o.k0 + i, m4.multiplyMatrices(M, l)));
  const pose = (x, y, z, ry = 0, s = 1) => mG.makeRotationY(ry).scale(new V3(s, s, s)).setPosition(x, y, z);

  // prayer flags: one cube per flag, hung from its string by its top edge; it leans downwind and swings, a wave runs along the string. Only the strings within 240 m of the car are rewritten
  { const TINT = [0x2f6fd0, 0xf4f0e6, 0xd8352a, 0x2f9a4a, 0xf0c030], STR = FLAGS.map(([P, n], q) => { const a = P(0), b = P(n), len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), m = Math.max(4, Math.round(len / 1.15)), L = Math.min(0.9, len / m * 0.8), F = [];
      for (let j = 0; j < m; j++) { const u = (j + 0.5) / m * n, p = P(u), p0 = P(u - 0.2), p1 = P(u + 0.2), ax = new V3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize(), nh = new V3(-ax.z, 0, ax.x).normalize(); if (nh.x > 0) nh.negate(); F.push({ k: cube(TINT[(j + q) % 5]), p: new V3(...p), ax, nh, lean: 0.25 + 0.45 * -nh.x }); }
      return { F, L, x: (a[0] + b[0]) / 2, z: (a[2] + b[2]) / 2, ph: q * 1.3 }; }), dn = new V3(), zz = new V3(), H = 0.8; let first = 1;
    LIFE.push((dt, car, t) => { for (const s of STR) { if (!first && !(car && (s.x - car.x) ** 2 + (s.z - car.z) ** 2 < 57600)) continue;
        s.F.forEach((f, j) => { const th = f.lean + 0.3 * Math.sin(TAU * 0.65 * t - 0.9 * j + s.ph) + 0.1 * Math.sin(TAU * 1.7 * t + j * 2.1), c = Math.cos(th), sn = Math.sin(th); dn.set(f.nh.x * sn, -c, f.nh.z * sn); zz.crossVectors(f.ax, dn);
          m4.set(f.ax.x * s.L, dn.x * H, zz.x * 0.05, f.p.x + dn.x * H / 2, f.ax.y * s.L, dn.y * H, zz.y * 0.05, f.p.y + dn.y * H / 2, f.ax.z * s.L, dn.z * H, zz.z * 0.05, f.p.z + dn.z * H / 2, 0, 0, 0, 1); put(f.k, m4); }); } first = 0; }); }

  // the cable car: eight cabins slide along the two ropes (straight from the plateau station to HERO), up on one, down on the other, 100 s for the span (about 5 m/s); they shrink into the stations at the two ends
  { const K = 2.2, CAB = () => mob([[0x24404c, 1.2, 0.3, 0.4, 0, 0, 0], [0x24404c, 0.2, 3.2, 0.2, 0, -1.6, 0], [0xd8452a, 2.8, 0.25, 2.4, 0, -3.15, 0], [0x22323a, 2.65, 1.1, 2.25, 0, -3.8, 0], [0xd8452a, 2.6, 1.1, 2.2, 0, -4.9, 0]].map(([c, ...r]) => [c, ...r.map(v => v * K)]));
    const L = CABINS.map(([a, b, t0, sd, ry]) => ({ a, b, t0, sd, ry, o: CAB() }));
    LIFE.push((dt, car, t) => { for (const c of L) { const u = (((c.t0 + c.sd * 0.01 * t) % 1) + 1) % 1, e = ease((u - 0.035) / 0.03) * ease((0.99 - u) / 0.02); move(c.o, pose(c.a[0] + (c.b[0] - c.a[0]) * u, c.a[1] + (c.b[1] - c.a[1]) * u, c.a[2] + (c.b[2] - c.a[2]) * u, c.ry, Math.max(e, 1e-4))); } }); }
  // the bullwheel over the roof of the plateau station, upright in the plane of the ropes (so the road, which crosses under them, sees it face on): four red spokes and a brass hub on a steel post, 0.4 turn per second
  if (SITES.station) { const [x, y, z, ry] = SITES.station, o = mob([[0xb0382c, 7, 0.5, 0.5, 0, 0, 0], [0xb0382c, 0.5, 7, 0.5, 0, 0, 0], [0xe0b040, 1.4, 1.4, 0.9, 0, 0, 0]]), post = mob([[0x24404c, 0.7, 5, 0.7, 0, -2.5, 0.8]]), rz = new THREE.Matrix4();
    LIFE.push((dt, car, t) => { move(o, pose(x, y + 17.5, z, ry).multiply(rz.makeRotationZ(t * 0.4 * TAU))); if (t < 1) move(post, pose(x, y + 17.5, z, ry)); }); }
  // the glass lift: a cabin on each of the three shafts, a third of the 90 s cycle apart: one of them is nearly always in the low part the road sees. The glass of a shaft is a plain pale column: the cabin is a cream collar round it, wider than the shaft, so it is seen
  if (SITES.lift) { const [M, ht] = SITES.lift, L = [-1, 0, 1].map(j => [j, mob([[0xf0ead8, 4.3, 3.6, 5, 0, 0, 0], [0x22323a, 4.4, 1.5, 5.1, 0, 0.3, 0]])]), ry = Math.atan2(-M.elements[2], M.elements[0]), p = new V3();
    LIFE.push((dt, car, t) => { for (const [j, o] of L) { p.set(3, 4 + (ht - 12) * (0.5 - 0.5 * Math.cos(TAU * t / 90 + j * TAU / 3 + 0.35)), j * 7).applyMatrix4(M); move(o, pose(p.x, p.y, p.z, ry)); } }); }

  // birds, all pure scenery. bird(colour, span) = a body and a wing bar. Circling: raptors over the void beside the corniches and the descent, egrets beside the bridge deck, below it.
  // Taking off: egrets standing on the parapet in the woods fly up toward the west when the car is 110 m away, and are back for the next lap. None at a braking point
  { const bird = (c, e) => mob([[c, 1.6 * e / 4, 0.3, 0.5, 0, 0, 0], [c, 0.8, 0.12, e, -0.1, 0.1, 0]]), W = (i, sd, o, dy, R, c, e, w = 0.25) => { const s = S[i], [x, z] = edgePt(s, sd, s.w + o); return [bird(c, e), x, s.y + dy, z, R, w, i * 0.7]; };
    const CIRC = [W(400, -1, 38, 12, 26, 0x2a2620, 5.5), W(560, 1, 40, 18, 30, 0x2a2620, 5.5, -0.2), W(740, 1, 38, 14, 24, 0x2a2620, 5.5), W(1500, -1, 40, 12, 28, 0x2a2620, 5.5, -0.22), W(1700, -1, 38, 10, 24, 0x2a2620, 5.5),
      W(940, -1, 55, -9, 26, 0xf0f0e8, 3.4, 0.3), W(960, -1, 70, -14, 20, 0xf0f0e8, 3.4, -0.33), W(1000, 1, 60, -10, 24, 0xf0f0e8, 3.4, 0.28)];
    const rz = new THREE.Matrix4(); LIFE.push((dt, car, t) => { for (const [o, cx, cy, cz, R, w, ph] of CIRC) { const a = t * w + ph; pose(cx + Math.cos(a) * R, cy + Math.sin(a * 0.7) * 1.5, cz + Math.sin(a) * R, Math.atan2(-Math.cos(a) * Math.sign(w), -Math.sin(a) * Math.sign(w)) + Math.PI / 2).multiply(rz.makeRotationX(0.25 * Math.sign(w))); move(o, mG); } });
    const FLOCKS = [[120, -1], [200, -1], [300, -1], [1900, -1], [1950, 1]].map(([i0, sd]) => ({ i0, en: 0, t: 0, set: 0, p: [0, 1, 2, 3].map(k => { const s = S[i0 + k * 2], [x, z] = edgePt(s, sd, s.w + 0.3); return { o: bird(0xf0f0e8, 2.2), x, y: s.y + 1.1, z, ry: k * 1.9, vx: -5 - k * 0.8, vy: 2.6 + (k % 3) * 0.7, vz: (k - 1.5) * 1.6 }; }) }));
    LIFE.push((dt, car, t) => { for (const v of FLOCKS) { const e = car ? (v.i0 - car.idx + N) % N : 999; if (!v.en && e < 55 && e > 0) { v.en = 1; v.t = 0; } else if (v.en && e > 300 && e < N - 300) v.en = v.set = 0;
        if (v.en) { if (v.t >= 7) continue; v.t += dt; } else { if (v.set) continue; v.set = 1; } // at rest: placed once, then left alone
        for (const q of v.p) { const f = v.en ? v.t : 0; pose(q.x + q.vx * f, q.y + q.vy * f + 0.25 * f * f, q.z + q.vz * f, v.en ? Math.atan2(-q.vz, q.vx) : q.ry, v.en && f > 6 ? Math.max(1e-4, 7 - f) : 1); if (v.en) mG.multiply(rz.makeRotationX(0.7 * Math.sin(f * 19 + q.ry))); move(q.o, mG); } } }); }

  // the batch itself, once every cube is declared
  { im = inst(h, h.geo('blk'), h.mat('paint'), COLS.map(() => [0, -1e4, 0])); im.userData.dyn = 1; im.castShadow = false; const col = new THREE.Color(); COLS.forEach((c, k) => im.setColorAt(k, col.setHex(c))); im.instanceColor.needsUpdate = true;
    LIFE.push(() => { im.instanceMatrix.needsUpdate = true; }); }

  // ---------- the sound of the place (SOUND.spots, SOUND.brief of src/audio/audio.js): the falls, the station and the lift machinery, placed and heard by distance and side; bells struck at the temples and the shrine
  if (window.SOUND && SOUND.spots) { const V = p => ({ x: p[0], y: p[1], z: p[2] }), L = [], hero = FALLS.find(f => f[3]), tower = FALLS.find(f => !f[3] && f[0][1] > 240);
    if (hero) L.push({ p: V(hero[1]), sound: 'waterfall', r: 500, vol: 0.2 }); if (tower) L.push({ p: V([tower[1][0], 180, tower[1][2]]), sound: 'waterfall', r: 250, vol: 0.08 });
    if (SITES.lip) L.push({ p: V(SITES.lip), sound: 'waterfall', r: 140, vol: 0.18 }); if (SITES.cascade) L.push({ p: V(SITES.cascade), sound: 'waterfall', r: 90, vol: 0.25 });
    if (SITES.station) L.push({ p: V(SITES.station), sound: 'turbine', r: 60, vol: 0.08 }); if (SITES.lift) L.push({ p: V(new V3(3, 2, 0).applyMatrix4(SITES.lift[0]).toArray()), sound: 'turbine', r: 40, vol: 0.05 });
    { const s = S[2005], [x, z] = edgePt(s, 1, s.w + 16); L.push({ p: { x, y: s.y, z }, sound: 'turbine', r: 60, vol: 0.05 }); } // the coaches idling in the park
    SOUND.spots('piliers', L);
    // a bell every 14 to 22 s at the nearest of the three places when it is within 250 m; chimes under the eaves of the ledge temple
    const BELLS = [S[235], S[1310], { x: 1050, y: 283, z: -262 }].map(s => ({ x: s.x, y: s.y, z: s.z })); let tb = 6, tc = 3;
    LIFE.push((dt, car) => { if (!car) return; if ((tb -= dt) < 0) { tb = 14 + Math.random() * 8; const b = BELLS.reduce((m, q) => Math.hypot(q.x - car.x, q.z - car.z) < Math.hypot(m.x - car.x, m.z - car.z) ? q : m); SOUND.brief('bellPiliers', b, 0.6, 250); }
      if ((tc -= dt) < 0) { tc = 2.5 + Math.random() * 4; SOUND.brief('chimePiliers', BELLS[1], 0.5, 140); } }); }
};
