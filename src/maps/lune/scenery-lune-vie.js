// "lune", life and atmosphere (V3): everything that moves, lights or sounds. Runs after the five zones and before the merge of the kit: it takes out of the kit the pieces it animates
// (REG, filled by add() of scenery-lune.js: every placed shape by name, with its group, its meshes, its position in the group and its settings) and returns the map's tick. Specification: docs/proposals/lunar-outpost/LIFE-V3.md; method: docs/methods/LIFE.md.
// Rules kept here: there is no air. Nothing drifts, flutters or hangs: whatever is thrown up flies on a parabola and falls back (grain()). Nothing is heard through the air: every sound is the cabin, the radio, or the ground (SOUND.brief, SOUND.spots).
// One clock CLK that only advances with dt (pause freezes everything); no light flips like a switch (points of light swell and thin on ramps); nothing moves or blinks at the two hairpins (the relay, the ridge antenna);
// no mover collides. Light: the start hall is declared indoor (tick.indoor, read by game.js like its own tunnel), and every lamp drawn in the hall and the tunnel is a real engine light (h.emis).
// The wheels' own dust is the engine's (th.dustBallistic, game.js); the wind roar and the engine in flight are cut by th.vacuum (audio.js).
(window.LUNE = window.LUNE || {}).vie = ({ h, g, S, N, T, LAP, MAT, kit, add, by, REG, iLip, EAST, PL, THREE, edgePt, weld }) => {
  const LANDER = [593, -1, 60], METEOR = [525, 82]; // the lander's pad: [chainage, side, metres from the wall]; the meteor's point: [sample, metres left of the axis]: on the plain on the outside of the long right-hander, dead ahead of the car 250 m before (the floor of the western crater, 80 m below the road on the right, cannot be seen from it)
  const scene = h.scene, TICK = [], PI = Math.PI, ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, smp = pk => Math.round(pk / LAP * N) % N, fwd = (i, a) => ((i - a) % N + N) % N, jit = a => (Math.random() - 0.5) * a;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), wp = (grp, x, y, z) => grp.localToWorld(V3(x, y, z)), bump = (u, up, hold, down) => ss(u / up) * (1 - ss((u - up - hold) / down)); // bump: 0 → 1 → 0 on two ramps
  kit.updateMatrixWorld(true);
  const out = o => { scene.attach(o); o.userData.dyn = 1; return o; }; // out of the kit, same place: it will not be merged
  let CLK = 0, prev = 0, cur = 0, airT = 0; TICK.push((dt, car) => { CLK += dt; prev = cur; cur = car.idx; airT = car.air ? airT + dt : 0; });
  const cross = i => fwd(cur, prev) < 40 && fwd(i, prev) < fwd(cur, prev) + (cur === prev ? 0 : 1) && fwd(i, prev) > 0; // the car went past sample i during this frame
  // an event of the lap: its clock e.t is -1 while it waits, starts when the car enters [trig, end) on a lap that ok(lap) accepts, and stops once the car has left. A car set down inside the window (replay, capture) finds the event where it would be
  const event = (trig, end, ok = () => true) => { const e = { t: -1, lap: -9, f: {} };
    TICK.push((dt, car) => { const d = fwd(car.idx, trig), inside = d < fwd(end, trig), lap = Math.floor((car.dist || 0) / N);
      if (e.t < 0) { if (inside && e.lap !== lap && ok(lap)) { e.t = d < 20 ? 0 : d * 2 / 55; e.lap = lap; e.f = {}; } } else if (inside) e.t += dt; else e.t = -1; }); return e; };
  const once = (e, k) => !e.f[k] && (e.f[k] = 1);
  const snd = (label, p, vol, r) => { if (window.SOUND && SOUND.brief) SOUND.brief(label, p, vol, r); };

  // ---------- grains (the scenery's own: the lander's ring, the vents, the meteor, the crawler's trail): opaque cubes of any size on parabolas, one bounce, then still; one draw pass ----------
  const CN = 260, cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), h.mat('paint', { emis: 1, c: 0xffffff }), CN), CP = Array.from({ length: CN }, () => ({ l: 0 })), o3 = new THREE.Object3D(), col = new THREE.Color(); let ci = 0;
  cubes.userData.dyn = 1; cubes.frustumCulled = false; scene.add(cubes); for (let i = 0; i < CN; i++) cubes.setColorAt(i, col.set(0xffffff));
  const grain = (x, y, z, vx, vy, vz, s, c, gd, grav = 3, l = 7) => { const i = ci++ % CN; Object.assign(CP[i], { x, y: Math.max(y, gd + s / 2 + 0.05), z, vx, vy, vz, s, gd: gd + s / 2, grav, l, b: 0 }); cubes.setColorAt(i, col.set(c).multiplyScalar(0.8 + Math.random() * 0.3)); cubes.instanceColor.needsUpdate = true; };
  TICK.push(dt => { CP.forEach((p, i) => { if (p.l > 0) { p.l -= dt;
        if (p.b < 2) { p.vy -= p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < p.gd) { p.y = p.gd; if (p.b++) p.vx = p.vz = 0; else { p.vy = Math.min(2, -0.3 * p.vy); p.vx *= 0.4; p.vz *= 0.4; } } } }
      o3.position.set(p.x || 0, p.l > 0 ? p.y : -1e4, p.z || 0); o3.scale.setScalar(p.l > 0 ? p.s * Math.min(1, p.l) : 0.001); o3.updateMatrix(); cubes.setMatrixAt(i, o3.matrix); }); cubes.instanceMatrix.needsUpdate = true; });

  // ---------- points of light: additive discs turned to the car, bright at the centre, nothing at the rim; one draw pass for all of them. light(p, radius, colour, f(clock) → 0..1, stretch x, y) ----------
  const DISC = new THREE.CircleGeometry(1, 12), duv = DISC.attributes.uv, LP = []; for (let i = 0; i < duv.count; i++) duv.setXY(i, 0.5, Math.min(1, Math.hypot(duv.getX(i) - 0.5, duv.getY(i) - 0.5) * 2));
  const light = (p, r, c, f = () => 1, sx = 1, sy = 1) => { const l = { p, r, c, f, sx, sy }; LP.push(l); return l; };
  const AMBER = 0xffa040, pulse = t => 0.45 + 0.55 * ss(0.5 + 0.5 * Math.sin(t * 2.618)); // the masts' slow pulse, 2.4 s: it swells and thins, it never goes out

  // ---------- the start hall is indoors (Z1-01, Z1-02): sun and sky fade, the eye adapts, the sound takes the vault and its bed; four cold ceiling lights, one per bay ----------
  const iH0 = smp(LAP - 52), iH1 = smp(112), nH = fwd(iH1, iH0), IN = new Float32Array(N);
  for (let d = -6; d <= nH + 6; d++) IN[(iH0 + d + N) % N] = 0.75 * ss(Math.min(d + 6, nH + 6 - d) / 14);
  for (const pk of [LAP - 30, 10, 50, 90]) { const i = smp(pk), s = S[i]; h.emis(i, s.x, s.y + 12.5, s.z, 0xcfe8ff, 36, 2.4); }
  // the tunnel (Z5-02, Z5-03): four amber pools on the axis, the engine's own lamps being switched off; the third one sags for a third of a second every 12 s
  { const L = [25, 65, 105, 145].map(d => { const i = (T.t0 + d) % N, s = S[i]; return h.emis(i, s.x, s.y + 6.5, s.z, 0xdf8c40, 26, 1.5); }), c0 = L[2].c.clone();
    TICK.push(() => { L[2].c.copy(c0).multiplyScalar(1 - 0.5 * bump(CLK % 12, 0.15, 0.05, 0.15)); }); }
  // hazard beacons (Z1-03, Z4-04, Z6-06): an amber bar turning under the lintel of each door of the hall and over the arena mouth of the tunnel, its light sweeping the walls. A steady turn, no flash
  { const B = [[iH0, 13.2, 0], [iH1, 13.2, 0], [T.t0, 10.4, 1.2]].map(([i, y, dz]) => { const s = S[i], b = new THREE.Group(), [x, z] = [s.x - s.tx * dz, s.z - s.tz * dz]; b.position.set(x, s.y + y, z); b.userData.dyn = 1; scene.add(b);
      h.pose('boxMesh', MAT.glow, b, [0, 0, 0], 2.6, 0.6, 0.6); h.pose('boxMesh', MAT.dark, b, [0, 0.55, 0], 0.7, 0.5, 0.7); const l = h.emis(i, x, s.y + y - 1.5, z, 0xff8a20, 24, 1.5); return [b, l, l.c.clone()]; });
    TICK.push(dt => { for (const [b, l, c0] of B) { b.rotation.y += dt * 4.19; l.c.copy(c0).multiplyScalar(0.7 + 0.3 * Math.sin(b.rotation.y * 2)); } }); }

  // ---------- masts and antennas (G-12, Z1-07, Z1-08, Z3-03, Z4-05, Z6-03): tips pulse together, cross-arms turn, the tower's radar scans. The hairpin antenna and the relay stay still ----------
  const iHair = smp(2740), PING = [];
  for (const { grp, meshes, pos, a } of REG.antenneLune || []) { const ht = a[0] ?? 46, tip = wp(grp, pos[0], pos[1] + ht + 1.6, pos[2]), i = PLACERS.near(h, tip.x, tip.z), still = Math.abs(i - iHair) < 30;
    light(tip, ht > 25 ? 2.6 : 2, AMBER, still ? () => 0.7 : pulse);
    const off = Math.hypot(S[i].x - tip.x, S[i].z - tip.z);
    if (!still && off < 150 && fwd(i, T.t0) > fwd(T.t1, T.t0)) PING.push([i, tip]);                                                        // the radio picks up its transponder as the car passes abeam (G-04)
    if (!still && off > 20) { const arm = out(meshes.find(m => m.material === MAT.steel)), w = 0.6 + 0.3 * ((i * 7) % 5) / 5; TICK.push(dt => { arm.rotation.y += w * dt; }); } } // the cross-arm turns, one turn in 8 to 10 s (not the two masts of the lip: only their tips pulse, a pair of eyes)
  for (const { grp, pos } of REG.tourLune || []) { const top = wp(grp, pos[0], pos[1] + 46.7, pos[2]), r = new THREE.Group(), d = new THREE.Group(); light(top, 2.6, AMBER, pulse);
    r.position.copy(wp(grp, pos[0], pos[1] + 43.6, pos[2])); r.userData.dyn = 1; scene.add(r); d.rotation.z = 1.2; d.position.x = 0.8; r.add(d); h.pose('soucoupeLune', MAT.dish, d, [0, 0, 0], 3.4, 1); h.pose('boxMesh', MAT.steel, r, [0, 0, 0], 0.5, 1.6, 0.5);
    TICK.push(dt => { r.rotation.y += 1.05 * dt; }); }                                                  // one turn in 6 s
  PING.push([smp(1086) - 16, wp((REG.relaisLune || [{ grp: kit }])[0].grp, 0, 6, 0)]);                  // the relay: on the approach, not at the apex
  TICK.push(() => { for (const [i, p] of PING) if (cross(i)) { snd('pingLune', p, 0.8, 400); if (Math.abs(i - (iLip - 30)) < 6) setTimeout(() => snd('pingLune', p, 0.8, 400), 100); } }); // (the two lip masts answer one after the other)

  // ---------- the jump (Z3-01, J-01 to J-04): the guide lights run toward the lip, the radio counts down in beeps, the altimeter beeps faster as the floor comes up, the landing thumps; the mouth beacons breathe in turn ----------
  for (let k = 0; k < 8; k++) for (const sd of [-1, 1]) { const s = S[iLip - 74 + k * 10], [x, z] = edgePt(s, sd, s.w + 1.5), grp = new THREE.Group(); grp.position.set(x, s.y, z); kit.add(grp); h.pose('baliseLune', MAT, grp, [0, 0, 0], 3.5); // a pair of guide lights every 20 m of the run-up
    light(V3(x, s.y + 4, z), 2.4, AMBER, t => { const u = (((t * 1.5 - k * 0.125) % 1) + 1) % 1 / 1.5; return 0.3 + 0.7 * bump(u, 0.09, 0.05, 0.3); }); } // the chase: a swell running post to post toward the lip, 1.5 times a second; no light ever goes dark
  { const B = (REG.baliseLune || []).filter(b => (b.a[0] ?? 9) === 6); B.forEach(({ grp }, n) => light(wp(grp, 0, 6.5, 0), 3, AMBER, t => 0.3 + 0.7 * ss(0.5 + 0.5 * Math.sin(t * 4.488 + n * PI)))); } // the two beacons of the mouth, in anti-phase, 1.4 s: the target from the top of the flight
  { const floor = (x, z) => Math.hypot(x - EAST[0], z - EAST[1]) < PL.r ? EAST[5] + 0.08 + T.dent(x, z) : null; let tb = 0, was = 0; // shortcut: the altimeter reads the arena floor only (the one long fall of the map), a hop elsewhere stays silent
    TICK.push((dt, car) => { for (const [d, s] of [[90, 'bipLune'], [60, 'bipLune'], [30, 'bipLune'], [0, 'goLune']]) if (cross(iLip - d)) snd(s, car, 0.7, 50); // three beeps and a long one at the lip
      const f = car.air ? floor(car.x, car.z) : null;
      if (f != null && airT > 0.25 && car.y - f > 1.5 && (tb -= dt) < 0) { tb = 0.1 + 0.5 * Math.min(1, (car.y - f) / 80); snd('bipLune', car, 0.6, 50); }
      if (!car.air) { if (was > 0.6) snd('thumpLune', car, 0.9, 50); tb = 0; } was = airT; }); }
  // pressure doors (Z1-04, Z4-06, Z5-05): a two-note chime at each door of the hall and each mouth of the tunnel, a hiss of air at the mouths
  TICK.push((dt, car) => { for (const i of [iH0, iH1, T.t0, T.t1]) if (cross(i)) { snd('chimeLune', car, 0.6, 50); if (i === T.t0 || i === T.t1) snd('hissLune', car, 0.7, 50); } });

  // ---------- the lander (Z1-05, Z1-06): on even laps a descent stage comes down on its flame onto the far pad, on odd laps it lifts off; a ring of grains flies out at touchdown and at lift-off ----------
  const PAD = by(LANDER[0], LANDER[1], LANDER[2], [40, 40]); add(PAD, 'padLune'); PAD.scale.setScalar(1.5); PAD.updateMatrixWorld(true);
  const padP = wp(PAD, 0, 0.6, 0), ship = new THREE.Group(), shipP = { x: padP.x, y: padP.y, z: padP.z }, sRumble = { p: shipP, sound: 'rumbleLune', r: 900, vol: 0 };
  { ship.userData.dyn = 1; ship.position.copy(padP); ship.scale.setScalar(3); scene.add(ship); h.pose('landerLune', MAT, ship, [0, 0, 0]); weld(h, ship);
    const cg = new THREE.CylinderGeometry(1.3, 0.15, 7, 6); cg.translate(0, -3.5, 0); const flame = new THREE.Mesh(cg, MAT.glow); flame.position.y = 1.4; ship.add(flame);
    const flare = light(shipP, 9, 0xffc070, () => 0), ev = event(60, 520), H = 170, TD = 10; let thr = 0;
    TICK.push((dt, car) => { const lap = Math.floor((car.dist || 0) / N), t = ev.t; let y = 0, want = 0, show = true;
      if (t < 0) { const next = car.idx < 60 ? lap : lap + 1; show = !!(next & 1); }                    // waiting: on its pad before a lift-off, out of sight before a descent
      else if (ev.lap & 1) { want = t < 14 ? 1 : 0; y = t < 1.6 ? 0 : 5.5 * (t - 1.6) ** 2; show = y < 900; // lift-off: 1.6 s of thrust on the pad, then it climbs ever faster and shrinks straight up
        if (t < 2.6 && thr > 0.5) ring(dt); if (t > 1.6 && once(ev, 'up')) snd('thumpLune', padP, 1, 1200); }
      else { const u = Math.min(1, (t + 3) / TD); y = H * (1 - u) * (0.35 + 0.65 * (1 - u)); want = u < 1 ? 1 : 0;           // descent: it is already 3 s down when the car comes out of the hall; it slows all the way to the pad
        if (u > 0.78 && u < 1) ring(dt); if (u >= 1 && once(ev, 'down')) snd('thumpLune', padP, 1, 1200); }
      thr += (want - thr) * Math.min(1, dt * (want ? 5 : 2.5)); ship.visible = show; ship.position.y = shipP.y = padP.y + y;
      flame.scale.set(0.6 + 0.4 * thr, thr * (0.85 + 0.15 * Math.sin(CLK * 31)), 0.6 + 0.4 * thr); flame.visible = thr > 0.03; flare.f = () => show ? thr * (0.85 + 0.15 * Math.sin(CLK * 23)) : 0; sRumble.vol = show ? 0.8 * thr * thr : 0; });
    let acc = 0; function ring(dt) { for (acc += dt * 40; acc > 1; acc--) { const a = Math.random() * 6.283, v = 14 + Math.random() * 14; grain(padP.x + Math.cos(a) * 6, padP.y + 0.4, padP.z + Math.sin(a) * 6, Math.cos(a) * v, 1.5 + Math.random() * 5, Math.sin(a) * v, 2.5 + Math.random() * 2.5, 0xc4c8d2, padP.y - 0.9, 3, 7); } } }

  // ---------- the cargo crawler (Z1-10): a slab-sided carrier creeps toward the car along the service lane on the left of the base, a steady amber light on its cab, a few grains falling off its wheels ----------
  { const cr = new THREE.Group(), P = (m, w, ht, d, x, y, z) => h.pose('boxMesh', m, cr, [x, y, z], w, ht, d), LANE = 26.5; cr.userData.dyn = 1; scene.add(cr);
    P(MAT.shell, 3.4, 2.6, 8.5, 0, 2.5, -1); P(MAT.amber, 3.5, 0.4, 8.6, 0, 1.4, -1); P(MAT.shell, 3, 1.8, 2.6, 0, 2.3, 4.6); P(MAT.glass, 3.1, 0.9, 1.4, 0, 2.7, 5.3); P(MAT.glow, 2.2, 0.3, 0.4, 0, 3.4, 4.6);
    for (const sx of [-1, 1]) for (const z of [-4, -1, 2, 5]) P(MAT.tire, 0.8, 1.5, 1.5, sx * 1.75, 0.75, z); weld(h, cr);
    const cp = V3(0, 0, 0), lp = V3(0, 0, 0), pos = (u, v) => { const i = Math.floor(u), f = u - i, a = S[i], b = S[i + 1], [ax, az] = edgePt(a, -1, a.w + LANE), [bx, bz] = edgePt(b, -1, b.w + LANE), x = ax + (bx - ax) * f, z = az + (bz - az) * f; return v.set(x, g.hAt(x, z), z); };
    light(lp, 1.8, AMBER); let u = 222, tg = 0;
    TICK.push((dt, car) => { if (car.idx > 400 && car.idx < N - 120) u = 222; else u = Math.max(120, u - 3 * dt);  // 6 m/s down the lane while the car is about; it goes back to the top of the lane while the car is away
      pos(u, cp); const q = pos(u - 2, V3(0, 0, 0)); cr.position.copy(cp); cr.rotation.y = Math.atan2(q.x - cp.x, q.z - cp.z); lp.set(cp.x, cp.y + 4.2, cp.z);
      if (u > 120 && (tg -= dt) < 0) { tg = 0.25; grain(cp.x + jit(3), cp.y + 0.5, cp.z + jit(3), jit(2), 1 + Math.random() * 2, jit(2), 0.5, 0x8d909c, cp.y, 3, 4); } }); }

  // ---------- the maintenance rover (Z6-02): as the car comes up the last rise, the rover parked by the garage pulls away along the road and stops 60 m on; it is back in its place when the car has gone ----------
  { const R = (REG.roverLune || [])[0]; if (R) { const rv = out(R.grp), i0 = PLACERS.near(h, rv.position.x, rv.position.z), s0 = S[i0], off = Math.hypot(rv.position.x - s0.x, rv.position.z - s0.z), ev = event(i0 - 85, i0 + 200), v = V3(0, 0, 0); weld(h, rv); let tg = 0;
      const pos = d => { const u = i0 + d / 2, i = Math.floor(u), f = u - i, a = S[i % N], b = S[(i + 1) % N], [ax, az] = edgePt(a, -1, off), [bx, bz] = edgePt(b, -1, off), x = ax + (bx - ax) * f, z = az + (bz - az) * f; return v.set(x, g.hAt(x, z), z); };
      TICK.push(dt => { const t = Math.max(0, ev.t), d = 60 * ss(t / 14) ; pos(d); rv.position.copy(v); const s = S[(i0 + Math.round(d / 2)) % N]; rv.rotation.y = Math.atan2(s.tx, s.tz); // 60 m in 14 s, eased at both ends
        if (t > 0.5 && t < 13 && (tg -= dt) < 0) { tg = 0.15; grain(v.x + jit(2), v.y + 0.4, v.z + jit(2), jit(2), 1 + Math.random() * 2, jit(2), 0.4, 0x8d909c, v.y, 3, 3); } }); } }

  // ---------- sun glints (G-10, Z1-12, Z6-04): a white four-point star flashes on each solar field and on the tower cab as the car goes through the angle where the sun comes back off it ----------
  { const G = [...(REG.champSolaireLune || []).map(({ grp }) => wp(grp, 0, 3.5, 0)), ...(REG.tourLune || []).map(({ grp, pos }) => wp(grp, pos[0] - 5.3, pos[1] + 38.5, pos[2]))].map(p => { const i = PLACERS.near(h, p.x, p.z), s = S[(i - 18 + N) % N], d = V3(s.x - p.x, s.y + 3 - p.y, s.z - p.z).normalize();
      const st = { p, d, a: 0 }; light(p, 5, 0xffffff, () => st.a, 1, 0.12); light(p, 5, 0xffffff, () => st.a, 0.12, 1); return st; }), v = V3(0, 0, 0);
    TICK.push((dt, car) => { for (const st of G) { const c = v.set(car.x - st.p.x, car.y + 3 - st.p.y, car.z - st.p.z).normalize().dot(st.d), want = ss((c - 0.975) / 0.02); st.a += (want - st.a) * Math.min(1, dt / (want > st.a ? 0.08 : 0.3)); } }); } // rise 0.08 s, fall 0.3 s

  // ---------- vented gas (Z1-13, Z6-05): as the car comes up, a fan of white grains shoots out of the dome's lock, and out of the maintenance tank; they fly straight and fall, no cloud ----------
  { const dome = (REG.domeLune || [])[0], tank = (REG.citerneLune || []).find(c => PLACERS.near(h, c.grp.position.x, c.grp.position.z) > N / 2), V = [];
    if (dome) V.push([wp(dome.grp, -44.6, 5, 4), wp(dome.grp, -44.6, 5, 5).sub(wp(dome.grp, -44.6, 5, 4))]); if (tank) V.push([wp(tank.grp, 0, 7.2, 0), wp(tank.grp, -1, 0, 0).sub(wp(tank.grp, 0, 0, 0))]);
    for (const [p, d] of V) { const i = PLACERS.near(h, p.x, p.z), ev = event(i - 45, i + 60), gd = g.hAt(p.x + d.x * 8, p.z + d.z * 8); let acc = 0;
      TICK.push(dt => { if (ev.t > 0.2 && ev.t < 1.7) for (acc += dt * 30; acc > 1; acc--) { const a = Math.atan2(d.z, d.x) + jit(0.5), sp = 7 + Math.random() * 4; grain(p.x, p.y, p.z, Math.cos(a) * sp, 1 + Math.random() * 3, Math.sin(a) * sp, 0.5, 0xf2f4f8, gd, 3, 4); } }); } }

  // ---------- a meteor (Z2-01, Z2-02): one lap in three, a flash on the floor of the western crater, a fountain of sunlit chips thrown 30 m up (pale: dark ones do not show against the black sky), a flat ring of grains; the ground carries the blow half a second later ----------
  { const s = S[METEOR[0]], [x, z] = edgePt(s, -1, METEOR[1]), p = V3(x, g.hAt(x, z), z), fp = V3(x, p.y + 3, z), ev = event(METEOR[0] - 125, METEOR[0] + 40, lap => lap % 3 === 1), fl = light(fp, 60, 0xffffff, () => 0);
    TICK.push(() => { const t = ev.t; fl.f = () => t < 0 ? 0 : bump(t - 0.4, 0.05, 0.03, 0.35); if (t > 0.45 && once(ev, 'hit')) {
        for (let k = 0; k < 44; k++) { const a = Math.random() * 6.283, v = 1 + Math.random() * 5; grain(x, p.y + 1, z, Math.cos(a) * v, 12 + Math.random() * 12, Math.sin(a) * v, 4 + Math.random() * 4, k % 3 ? 0xc4c8d2 : 0x6a7080, p.y, 6, 9); }
        for (let k = 0; k < 28; k++) { const a = k / 28 * 6.283, v = 14 + Math.random() * 6; grain(x, p.y + 0.5, z, Math.cos(a) * v, 1.5 + Math.random(), Math.sin(a) * v, 3, 0xc4c8d2, p.y, 3, 8); } }
      if (t > 0.95 && once(ev, 'thump')) snd('thumpLune', p, 0.8, 1500); }); }

  // ---------- the draw pass of the points of light, and the sound sources (SOUND.spots: the lander's engine felt through the ground; SOUND.brief needs the map's spots declared) ----------
  { const lm = new THREE.InstancedMesh(DISC, h.addMat(h.tx('gradient', '#ffffff', 1)), LP.length); lm.userData.dyn = 1; lm.frustumCulled = false; scene.add(lm); LP.forEach((l, i) => lm.setColorAt(i, col.set(l.c)));
    TICK.push((dt, car) => { LP.forEach((l, i) => { const s = l.r * l.f(CLK), dx = car.x - l.p.x, dz = car.z - l.p.z, d = Math.hypot(dx, dz) || 1; // 1.5 m toward the car: in front of the lamp that carries it
        o3.position.set(l.p.x + dx / d * 1.5, l.p.y, l.p.z + dz / d * 1.5); o3.rotation.set(0, Math.atan2(dx, dz), 0); o3.scale.set(Math.max(0.001, s * l.sx), Math.max(0.001, s * l.sy), 1); o3.updateMatrix(); lm.setMatrixAt(i, o3.matrix); }); o3.rotation.set(0, 0, 0); lm.instanceMatrix.needsUpdate = true; }); }
  if (window.SOUND && SOUND.spots) SOUND.spots('lune', [sRumble]);

  const tick = (dt, now, car) => { if (car) for (const f of TICK) f(dt, car); };
  tick.indoor = i => IN[i];
  return tick;
};
