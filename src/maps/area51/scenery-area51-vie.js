// "area51", life and atmosphere (V3): everything that moves, lights or sounds. Runs after the six zones and before the merge of the kit: it takes out of the kit the pieces it animates
// (REG, filled by the placers of scenery-area51.js, lists every placed piece by shape name) and returns the map's tick. Specification: docs/proposals/area51/LIFE-V3.md; method: docs/methods/LIFE.md.
// Rules kept here: one clock T that only advances with dt (pause freezes everything); nothing flips like a switch (lights are discs that grow and shrink on ramps, or turn);
// nothing moves at the hairpin (the telemetry dish stays still) nor in the fire-alley chicane; the wind blows from the west (the signal's side) to the east; no mover collides.
// Light: the hall and the underground are declared indoor (tick.indoor, read by game.js like its own tunnels: sun and sky fade, the eye adapts, the sound takes the vault),
// and every lamp drawn there is a real engine light (h.emis; the engine computes the 20 nearest along the track).
(window.AREA51 = window.AREA51 || {}).vie = ({ h, g, S, N, MAT, kit, near, idx, smp, pk, t0, t1, rooms, room, THREE, k, edgePt, REG, weld, avion }) => {
  const scene = h.scene, TICK = [], PI = Math.PI, ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, hAt = (x, z) => g.hAt(x * k, z * k);
  kit.updateMatrixWorld(true);
  const out = o => { scene.attach(o); o.userData.dyn = 1; return o; }; // out of the kit, same place: it will not be merged
  // lift(grp, pick, at): the meshes of a placed piece that pass `pick`, moved to a pivot of their own at the local point `at` (the rest of the piece stays in the kit)
  const lift = (grp, pick, at = [0, 0, 0]) => { const p = new THREE.Group(); p.userData.dyn = 1; p.position.set(...at).applyMatrix4(grp.matrixWorld); p.quaternion.copy(grp.quaternion); p.scale.copy(grp.scale); scene.add(p);
    for (const m of grp.children.filter(pick)) { p.add(m); m.position.set(-at[0], -at[1], -at[2]); } return p; };
  // beat: the shared flash clock, 0..1, lit 0.3 s per period on 90 ms ramps
  const beat = (t, per, ph = 0) => { const u = (((t / per + ph) % 1) + 1) % 1 * per; return ss(u / 0.09) * (1 - ss((u - 0.3) / 0.09)); };
  // soft light discs (additive, bright at the centre, nothing at the rim: the halo of scenery-area51-pistes.js). how: 0 flat on the ground, 1 upright facing east-west, 2 upright facing north-south
  const DISC = new THREE.CircleGeometry(1, 12), duv = DISC.attributes.uv, GL = {}; for (let i = 0; i < duv.count; i++) duv.setXY(i, 0.5, Math.min(1, Math.hypot(duv.getX(i) - 0.5, duv.getY(i) - 0.5) * 2));
  const glowM = (hex, o) => o ? h.addMat(h.tx('gradient', hex, 1), o) : GL[hex] = GL[hex] || h.addMat(h.tx('gradient', hex, 1));
  const disc = (m, r, x, y, z, how, parent = kit) => { const d = new THREE.Mesh(DISC, m); if (how === 0) d.rotation.x = -PI / 2; else if (how === 1) d.rotation.y = PI / 2; d.scale.setScalar(r); d.position.set(x, y, z); parent.add(d); return d; };
  const star = (m, r, x, y, z, parent = kit) => [disc(m, r, x, y, z, 1, parent), disc(m, r, x, y, z, 2, parent)]; // two crossed upright discs: a point of light seen from any side
  const top = grp => new THREE.Box3().setFromObject(grp).max.y, lampM = c => h.mat('lampObj', { emis: 1, c });
  const soft = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t; };
  let T = 0; TICK.push(dt => { T += dt; });

  // ---------- indoors: hall H1 (its two gable doors) and B1 (its two portals). Level 1 = an engine tunnel; the hall keeps some dusk through its 40 m doors ----------
  const iH0 = idx(1860, 880), iH1 = idx(1560, 880), IN = new Float32Array(N);
  for (const [a, b, lv] of [[iH0, iH1, 0.65], [t0 - 6, t1 + 6, 1]]) for (let i = a - 6; i <= b + 6; i++) IN[i] = Math.max(IN[i], lv * ss(Math.min(i - a + 6, b + 6 - i) / 14));
  // real lamps where lamps are drawn. Hall: under the strip lights, along the lane. B1: one ceiling fitting in three (24 m), at the height of the room it is in
  for (let i = iH0 + 4; i < iH1; i += 8) h.emis(i, S[i].x, S[i].y + 17, S[i].z, 0xfff4e0, 56, 1.5); // a working hangar: strong, even, white light from the strip runs
  for (let i = t0 - 2; i <= t1 + 2; i += 12) { const c = Math.min(room(i)[4], 12); h.emis(i, S[i].x, S[i].y + c - 1.5, S[i].z, 0xd8e6ff, 32, 2.2); } // every lamp at the same height over the road, the same range and strength: the level does not jump from one room to the next
  for (const i of [t0 - 10, t1 + 10]) h.emis(i, S[i].x, S[i].y + 9, S[i].z, 0xffb85a, 30, 1.8); // a sodium lamp over each portal: the mouth is lit before the dark
  // hall floor: a pale streak under each run of strip lights, as on a polished floor (no wet pass: the map lays its own roadway). Just above the lane, which crosses them
  { const pg = new THREE.PlaneGeometry(288, 2.6, 1, 2), u = pg.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, 0.5, Math.abs(u.getY(i) - 0.5) * 2); pg.rotateX(-PI / 2);
    const m = glowM('#fff2d0', { opacity: 0.3 }); for (const z of [-40, -14, 14, 40]) { const q = new THREE.Mesh(pg, m); q.position.set(1710 * k, 1.58, (880 + z) * k); kit.add(q); } }

  // ---------- the reactor pool (Z2-01 to Z2-04): its own sliding surface, a second layer sliding the other way, caustics on the vault and the far wall, two blue lights that breathe, the polar crane creeping ----------
  { const FL = [], flows = (t, u, v) => { FL.push([t, u, v]); return t; }, onde = (base, rep) => { const t = soft(h.tx('ondeArea51', base)); t.repeat.set(rep, rep); return t; };
    const pool = out(REG.pool[0]), iP = idx(1210, 1262), sp = S[iP], yW = pool.position.y + 0.4;
    pool.material = new THREE.MeshBasicMaterial({ map: flows(onde('#2f8fe0', 5), 0.012, 0.007) });
    const lay = (w, d, x, y, z, rx, rep, op, u, v) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), h.addMat(flows(onde('#000', rep), u, v), { opacity: op })); m.rotation.x = rx; m.position.set(x * k, y, z * k); m.userData.dyn = 1; scene.add(m); return m; };
    const L2 = lay(84, 84, 1210, yW + 0.06, 1262, -PI / 2, 3, 0.55, -0.016, 0.01);                     // on the water, the other way
    const C1 = lay(124, 96, 1216, sp.y + 25.6, 1250, PI / 2, 3, 0.2, 0.01, -0.006), C2 = lay(124, 96, 1216, sp.y + 25.5, 1250, PI / 2, 2, 0.16, -0.007, 0.009); // under the vault
    const C3 = lay(118, 30, 1222, sp.y + 12, 1198.7, 0, 3, 0.2, 0.008, 0.012);                          // on the wall across the pool
    const l1 = h.emis(iP, 1210 * k, yW + 4, 1262 * k, 0x4fb8ff, 80, 3), l2 = h.emis(iP, (1210 * k + sp.x) / 2, sp.y + 1, (1262 * k + sp.z) / 2, 0x4fb8ff, 46, 2.5), c1 = l1.c.clone(), c2 = l2.c.clone();
    const crane = out(REG.pontPolaireArea51[0]), z0 = crane.position.z; weld(h, crane);
    TICK.push(dt => { for (const [t, u, v] of FL) { t.offset.x = (t.offset.x + u * dt) % 1; t.offset.y = (t.offset.y + v * dt) % 1; }
      const b = 0.85 + 0.15 * Math.sin(T * 1.047); l1.c.copy(c1).multiplyScalar(b); l2.c.copy(c2).multiplyScalar(b); L2.material.opacity = 0.55 * b; C1.material.opacity = 0.2 * b; C2.material.opacity = 0.16 * b; C3.material.opacity = 0.2 * b; // 6 s breath
      crane.position.z = z0 + 10 * Math.sin(T * 0.157); }); }                                          // 20 m and back in 40 s
  // the lock (Z2-07): an amber beacon turning between the two bulkheads, its light sweeping the walls (steady turn, no flash: the lock is in a bend)
  { const i = (rooms[0][0] + rooms[0][1]) >> 1, s = S[i], b = new THREE.Group(); b.position.set(s.x, s.y + 9.9, s.z); b.userData.dyn = 1; scene.add(b); h.pose('boxMesh', lampM(0xff9a20), b, [0, 0, 0], 2.8, 0.7, 0.7); h.pose('boxMesh', MAT.gray, b, [0, 0.6, 0], 0.6, 0.6, 0.6);
    const l = h.emis(i, s.x, s.y + 8, s.z, 0xff8a20, 30, 2), c0 = l.c.clone(); TICK.push(dt => { b.rotation.y += dt * 4.2; l.c.copy(c0).multiplyScalar(0.75 + 0.25 * Math.sin(b.rotation.y * 2)); }); }
  { const i = idx(1210, 1324), s = S[i], [x, z] = edgePt(s, 1, -17); h.emis(i, x, s.y + 9, z, 0xbfe0ff, 22, 1.8); } // the control-room glazing lights the gallery below it
  h.steam(1285 * k, hAt(1285, 1440) + 14, 1440 * k);                                                    // the cooler on the mesa (Z2-10)

  // ---------- everything that listens turns together (Z3-01 to Z3-04): the dishes on one shared drive, slewing, then locking on the bearing of the signal ----------
  const LOCK = -0.475, RATE = 0.045, SEQ = [[0.32, 10, 0], [LOCK, 15, 1], [-0.8, 8, 0], [LOCK, 15, 1], [0.1, 8, 0]]; // LOCK: the glow as seen from D1 (west-north-west). [azimuth, hold in s, locked]
  const drive = { az: 0.32, v: 0, k: 0, hold: 2, locked: 0 };
  { const fam = { test: m => m === MAT.white || m === MAT.gray || m === MAT.steel, mat: Object.assign(MAT.white.clone(), { vertexColors: true }) }; fam.mat.color.setRGB(1, 1, 1); // one pass for the white, grey and steel of a head
    const tipM = glowM('#ff2030', {}), heads = REG.dishHead.filter(d => d.getWorldPosition(new THREE.Vector3()).x > 400 * k).map(out); // not the telemetry dish of the hairpin: a braking point
    const all = { test: () => true, mat: fam.mat }; // a 12 m calibration dish is one pass: its lattice ribs, a pixel wide from the road, are merged as plain metal
    for (const d of heads) { weld(h, d, d.scale.x > 0.2 ? fam : all); if (d.scale.x > 0.2) star(tipM, 5, 0, 38.2, 0, d); }
    TICK.push(dt => { const [aim, , lk] = SEQ[drive.k], e = aim - drive.az;
      if (Math.abs(e) < 0.002 && Math.abs(drive.v) < 0.004) { drive.v = 0; drive.locked = lk; if ((drive.hold -= dt) < 0) { drive.k = (drive.k + 1) % SEQ.length; drive.hold = SEQ[drive.k][1]; drive.locked = 0; } }
      else { const want = Math.sign(e) * Math.min(RATE, Math.sqrt(2 * 0.006 * Math.abs(e))); drive.v += Math.max(-0.012 * dt, Math.min(0.012 * dt, want - drive.v)); drive.az += drive.v * dt; }
      for (const d of heads) d.rotation.set(0, drive.az, 0.7 + 0.12 * (drive.az - LOCK));              // XYZ: the tilt first, then the azimuth about the mount
      tipM.opacity += ((drive.locked ? 1 : 0.2 + 0.8 * beat(T, 1.6)) - tipM.opacity) * Math.min(1, dt * 12); }); } // locked: the tip lights burn steady
  // the two airfield radars scan (Z5-04): the lattice scanner on its mast, one turn in 10 s
  { const sc = REG.radarArea51.map(r => lift(r, m => m.material === MAT.lattice)); TICK.push(dt => { for (const p of sc) p.rotation.y += dt * 0.63; }); }
  // (Z5-05, the tower's white and green beacon, was dropped: an additive light does not show against the bright horizon the tower stands on)
  // the windsock (Z5-08): streams east, swings a little, droops in the lulls. Near a braking board: small and slow
  { const w = REG.mancheArea51[0], p = lift(w, m => m.material === MAT.amber || m.material === MAT.white, [0, 7.7, 0]); p.rotation.order = 'YXZ';
    TICK.push(() => { const gust = 0.5 + 0.5 * Math.sin(T * 0.45) * Math.sin(T * 0.13 + 1); p.rotation.y = PI / 2 + 0.14 * Math.sin(T * 0.9) * (0.4 + 0.6 * gust); p.rotation.x = 0.22 * (1 - gust); }); }

  // ---------- the signal (Z4-01): the glow beyond the range beats, a quick rise, a second one, a long fade, never the same twice; it surges while the dishes are locked on it ----------
  { const gl = REG.glow[0], e = x => x < 0 ? 0 : ss(x / 0.7) * Math.exp(-Math.max(0, x - 0.7) / 2.4); let surge = 0;
    TICK.push(dt => { surge += ((drive.locked ? 1 : 0) - surge) * Math.min(1, dt * 0.6); const u = T % 14, p = (e(u) + 0.8 * e(u - 1.5)) * (0.75 + 0.25 * Math.sin(T * 0.23)) * (1 + 0.5 * surge);
      gl.material.opacity = Math.min(1, 0.5 + 0.4 * p); gl.scale.set(420 * (1 + 0.05 * p), 300 * (1 + 0.05 * p), 1); }); }

  // ---------- the base is switched on (G-06, Z1-03, Z5-06): obstruction beacons on one flash clock, light under the masts, the approach lights running toward the threshold ----------
  { const B = [[1300 * k, hAt(1300, 1350) + 61.8, 1350 * k, 5]], add = (n, r = 2.6, dx = 0, dz = 0) => { for (const o of REG[n] || []) B.push([o.position.x + dx, top(o) + 0.3, o.position.z + dz, r]); };
    add('tourArea51', 3.6, 3, 3); add('mastRelaisArea51'); add('glideArea51', 2); add('radarArea51', 2.2); add('miradorArea51', 2); add('chevalementArea51', 3); add('pyloneArea51', 2.6); add('waterTower', 3);
    const im = new THREE.InstancedMesh(DISC, glowM('#ff2030'), B.length * 2), o = new THREE.Object3D(); im.userData.dyn = 1; scene.add(im);
    TICK.push(() => { B.forEach(([x, y, z, r], i) => { const s = r * (0.3 + 0.7 * beat(T, 1.6, i * 0.37)); for (const f of [0, 1]) { o.position.set(x, y, z); o.rotation.set(0, f * PI / 2, 0); o.scale.setScalar(s); o.updateMatrix(); im.setMatrixAt(i * 2 + f, o.matrix); } }); im.instanceMatrix.needsUpdate = true; }); }
  { const amber = glowM('#ffb85a'), pool = glowM('#ffb85a', { opacity: 0.45 }); // the light masts: a real light under each, its pool on the ground (it shows on the dark apron), a glare at the lamp head
    for (const m of REG.mastLighting || []) { const s = m.scale.x, { x, y, z } = m.position; h.emis(near(h, x, z), x, y + 30 * s, z, 0xffb85a, 56 * s, 1.3); disc(pool, 30 * s, x, y + 0.12, z, 0); star(amber, 5 * s, x, y + 34.6 * s, z); } }
  { const bars = (REG.rampeArea51 || []).filter(b => b.position.x < 1072 * k).map(b => [b, b.position.z > 250 * k ? 0 : 1, top(b) - 0.3]), xs = [0, 1].map(r => [...new Set(bars.filter(b => b[1] === r).map(b => Math.round(b[0].position.x)))].sort((a, b) => a - b));
    const im = new THREE.InstancedMesh(DISC, glowM('#fff2d0'), bars.length), o = new THREE.Object3D(); im.userData.dyn = 1; scene.add(im); o.rotation.y = PI / 2; // facing the car that comes down the approach
    TICK.push(() => { bars.forEach(([b, r, y], i) => { const n = xs[r].indexOf(Math.round(b.position.x)), u = (((T / 1.5 - n / 7) % 1) + 1) % 1, p = ss(u / 0.08) * (1 - ss((u - 0.1) / 0.3)), w = r ? 7 : 4; // the rabbit: a swell running bar to bar toward the threshold every 1.5 s; no bar ever goes dark
        o.position.set(b.position.x, y, b.position.z); o.scale.set(w * (0.55 + 0.45 * p), 1.5 * (0.55 + 0.45 * p), 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.instanceMatrix.needsUpdate = true; }); }

  // ---------- you are being watched (Z4-04): a patrol pickup on the depot lane. (Z4-03, the searchlight, was dropped: a pale additive beam does not show against the blue-hour sky and the pale ground) ----------
  const d0 = pk(440, 380), d1 = d0 + 7 * 42, iD0 = idx(440, 380), pick = new THREE.Group(), pickP = { x: 0, y: 0, z: 0 };
  { pick.userData.dyn = 1; pick.rotation.order = 'YZX'; scene.add(pick); const P = (m, w, ht, d, x, y) => h.pose('boxMesh', m, pick, [x, y, 0], w, ht, d);
    P(MAT.white, 5, 0.8, 1.9, 0, 0.95); P(MAT.white, 1.9, 0.8, 1.8, 0.5, 1.75); P(MAT.glass, 2, 0.6, 1.84, 0.5, 1.75); P(MAT.dark, 0.7, 0.7, 2, 1.6, 0.4); P(MAT.dark, 0.7, 0.7, 2, -1.6, 0.4); P(lampM(0xffa030), 0.3, 0.2, 1.3, 0.5, 2.25); weld(h, pick);
    const fl = star(glowM('#ffa030', {}), 1, 0.5, 2.4, 0, pick); let p = d1 + 8;
    TICK.push((dt, car) => { const far = car.idx < iD0 - 260 || car.idx > iD0 + 260; if (p <= d0 - 2 && far) p = d1 + 8; else if (p > d0 - 2 && (!far || p < d1 + 8)) p -= 8 * dt; // drives up the lane while the car is about; parked at the top, it goes back down unseen
      const s = smp(p), q = smp(p - 4), at = u => { const [x, z] = edgePt(u, -1, u.w + 9); return [x, g.hAt(x, z), z]; }, [x, y, z] = at(s), b = at(q);
      pick.position.set(x, y + 0.15, z); pick.rotation.y = Math.atan2(-(b[2] - z), b[0] - x); pick.rotation.z = Math.atan2(b[1] - y, Math.hypot(b[0] - x, b[2] - z)); pickP.x = x; pickP.y = y; pickP.z = z;
      const f = 0.9 * (0.35 + 0.65 * beat(T, 0.9)); for (const d of fl) d.scale.setScalar(f); }); }
  // the apron (Z1-01): a tug drags an arrowhead along the parking line while the grid waits; it goes back while the car is under the mesa
  const tug = new THREE.Group(), tugP = { x: 1868 * k, y: 0, z: 727 * k };
  { tug.position.set(1868 * k, -0.2, 727 * k); tug.rotation.y = PI; tug.userData.dyn = 1; scene.add(tug); h.pose('tractor', MAT, tug, [0, 0, 0]); h.pose('boxMesh', MAT.gray, tug, [-1.4, 0.7, 0], 5, 0.16, 0.16);
    const a = new THREE.Group(); a.position.x = -16.5; a.rotation.y = PI / 2; a.scale.setScalar(1.2); tug.add(a); h.pose('f117Area51', MAT, a, [0, 0, 0]); h.pose('f117NappeArea51', MAT.stealth, a, [0, 0, 0]); weld(h, tug);
    const fl = star(glowM('#ffa030', {}), 1, 5, 4.9, 0, tug); // its amber light: it swells and thins, it never goes out (the chicane is not far)
    TICK.push((dt, car) => { const f = 1.8 * (0.55 + 0.45 * beat(T, 1.3)); for (const d of fl) d.scale.setScalar(f); if (car.idx > 200 && car.idx < 800) tug.position.x = 1868 * k; else tug.position.x = Math.max(1765 * k, tug.position.x - 2 * dt); tugP.x = tug.position.x; }); }

  // ---------- the takeoff on runway B (Z5-01 to Z5-03): once per lap, alongside the runway A sprint. The hangar's needle every lap, afterburner lit; it rolls 170 m off the car (it was 280), kicks up dust, and climbs across the sky ahead ----------
  const iA = idx(1409, 379), TRIG = iA - 170, END = idx(1975, 400) + 120, X0 = 1320, JZ = 300, jetP = { x: X0 * k, y: 0, z: JZ * k }, jet = { t: -1, type: 0, thr: 0 };
  { const J = [out(REG.sr71Area51.find(a => Math.abs(a.position.z - 120 * k) < 1)), out(avion('f117', X0, 120, { y: -0.2, s: 2.2, ry: PI / 2 }))];
    for (const j of J) { weld(h, j); j.rotation.order = 'YXZ'; j.scale.multiplyScalar(1.7); }
    const ab = new THREE.Group(), cg = new THREE.CylinderGeometry(0.2, 1.25, 16, 8), cg2 = new THREE.CylinderGeometry(0.1, 0.6, 10, 8); cg.rotateX(-PI / 2); cg.translate(0, 0, -8); cg2.rotateX(-PI / 2); cg2.translate(0, 0, -5); ab.position.z = -10.9 * 1.0; J[0].add(ab);
    for (const sd of [-1, 1]) for (const [g2, c2] of [[cg, 0xff9a40], [cg2, 0xfff0c8]]) { const c = new THREE.Mesh(g2, lampM(c2)); c.position.set(sd * 4.6, 2.8, 0); ab.add(c); } // an orange flame with a white core, 16 m long
    const glare = new THREE.Mesh(DISC, glowM('#ff9a40', {})); glare.userData.dyn = 1; scene.add(glare); h.beams.push(glare);
    const SPOOL = 3, dustM = glowM('#d8bc94', { opacity: 0.5 }), PUFF = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(DISC, dustM); m.userData.dyn = 1; m.visible = false; scene.add(m); return { m, a: 9 }; }); let nP = 0, tP = 0; // dust: a ring of soft discs the nozzles blow up the runway, each swelling, rising and thinning over 4 s
    TICK.push((dt, car) => { const i = car.idx, lap = Math.floor((car.dist || 0) / N);
      if (jet.t < 0) { jet.type = 0; if (i >= TRIG && i < END) jet.t = i < TRIG + 40 ? 0 : (i - TRIG) * 2 / 46; } // a car set down past the trigger (replay, capture) finds the aircraft where it would be
      else { jet.t += dt; if (i >= 200 && i <= t1) jet.t = -1; }                                        // back to the hold while the car is in the hall or under the mesa
      const ty = jet.type, A = ty ? 5 : 4.8, VR = ty ? 68 : 78, tau = jet.t - SPOOL, tR = VR / A, u = tau - tR, j = J[ty]; J[1 - ty].visible = false;
      let x = X0, y = -0.2, z = JZ, pitch = 0, bank = 0, yaw = 0, thr = jet.t < 0 ? 0 : 0.35 * ss(jet.t / SPOOL), fire = 0;
      if (tau > 0) { thr = 0.35 + 0.65 * ss(tau / (tR + 8)); fire = ss(tau / 1.2) * (1 - ss((u - 6) / 12)); // the roar and the flame grow through the whole roll and the climb
        if (u < 0) x += A / 2 * tau * tau; else { const v = VR + 2 * u, w = Math.max(0, u - 0.6), q = Math.max(0, u - 5), lat = q < 8 ? 0.8 * q * q : 51.2 + 12.8 * (q - 8);
          x += A / 2 * tR * tR + VR * u + u * u; pitch = 0.32 * ss((u + 0.8) / 3); y += 0.3 * (VR * w + w * w) * ss(w / 1.5); bank = 0.2 * ss(q / 4); yaw = Math.atan2(Math.min(q, 8) * 1.6, v); z -= lat; } }
      j.visible = x < 6500; j.position.set(x * k, y, z * k); j.rotation.set(-pitch, PI / 2 + yaw, -bank); jetP.x = x * k; jetP.y = y; jetP.z = z * k; jet.thr = thr;
      ab.visible = glare.visible = !ty && fire > 0.02; ab.scale.z = fire * (0.9 + 0.1 * Math.sin(T * 9)); // the flames lengthen with the throttle and die out in the climb
      if (glare.visible) { glare.position.set((x - 24 * Math.cos(yaw)) * k, y + 5.6 + 22 * Math.sin(pitch), (z + 24 * Math.sin(yaw)) * k); glare.scale.setScalar(26 * fire); }
      tP -= dt; if (tau > 0 && y < 4 && thr > 0.4 && tP < 0) { tP = 0.07; const q = PUFF[nP++ % PUFF.length]; q.a = 0; q.x = x - 14 - Math.random() * 6; q.z = z + (Math.random() - 0.5) * 14; q.s = 5 + Math.random() * 4; } // dust on the runway while it rolls
      for (const q of PUFF) { if (q.a < 4) { q.a += dt; const f = q.a / 4; q.m.visible = true; q.m.position.set(q.x * k, 1 + 9 * f, q.z * k); q.m.scale.setScalar(q.s * (1 + 3.5 * f)); dustM.opacity = 0.5; q.m.scale.y *= 0.55; } else q.m.visible = false; } }); }

  // ---------- the visitors (Z4-08): all eight are there on every lap, pale against the blue hour; two of them wave ----------
  { const V = (REG.alienArea51 || []).map(out), W = []; for (const v of V) weld(h, v);
    for (const n of [1, 3]) if (V[n]) { const a = new THREE.Group(); a.position.copy(V[n].position); a.quaternion.copy(V[n].quaternion); a.scale.copy(V[n].scale); a.userData.dyn = 1; scene.add(a); h.pose('alienArea51', MAT, a, [0, 0, 0], 1.4, 0); weld(h, a); a.visible = false; W.push([V[n], a]); }
    TICK.push(() => {
      for (const [v, a] of W) { const n = V.indexOf(v), up = Math.sin(T * 6.28) > 0; v.visible = up; a.visible = !up; } }); }

  // ---------- the sound of the place (SOUND.spots, SOUND.brief of audio.js): sources heard by distance and side; the beds per zone are AMB and AMBZ ----------
  if (window.SOUND && SOUND.spots) { const P = (x, y, z) => ({ x: x * k, y, z: z * k }), tower = P(1480, 30, 800);
    const sJet = { p: jetP, sound: 'jetArea51', r: 1500, vol: 0 }, sServo = { p: P(560, hAt(560, 1010) + 20, 1010), sound: 'servoArea51', r: 280, vol: 0.2 }, sPick = { p: pickP, sound: 'dieselArea51', r: 90, vol: 0.6 };
    SOUND.spots('area51', [sJet, sServo, sPick, { p: tugP, sound: 'dieselArea51', r: 130, vol: 0.5 }, { p: P(1210, S[idx(1210, 1262)].y - 4, 1262), sound: 'turbine', r: 120, vol: 0.8, int: 1 }, { p: P(1535, hAt(1535, 1150) + 4, 1150), sound: 'transformer', r: 130, vol: 0.8 }]);
    let tChime = 20, tClang = 12;
    TICK.push((dt, car) => { sJet.vol = jet.t < 0 ? 0 : 0.95 * jet.thr * jet.thr; sServo.vol = 0.2 + 0.8 * Math.abs(drive.v) / RATE; const i = car.idx;
      if ((i > iD0 + 100 || i < iH0) && (tChime -= dt) < 0) { tChime = 40 + Math.random() * 30; SOUND.brief('chimeArea51', tower, 1, 1200); }               // Z5-09: the tower's chime over the airfield
      if (i > t0 && i < t1 && (tClang -= dt) < 0) { tClang = 20 + Math.random() * 20; const s = S[(i + 30) % N]; SOUND.brief('clangArea51', { x: s.x, y: s.y + 6, z: s.z }, 1, 160); } }); } // Z2-09: metal struck somewhere down the gallery

  const tick = (dt, now, car) => { if (car) for (const f of TICK) f(dt, car); };
  tick.indoor = i => IN[i];
  return tick;
};
