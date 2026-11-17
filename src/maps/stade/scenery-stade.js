// Placement of the scenery for "stade": adds its function to SCENERY. The shared placers come from scenery.js. See docs/methods/SCENERY.md.
(function () {
  const { inst, near, pt, indexed, insts, GLOW, boxMesh, edgePt, marker, weld, terrain } = PLACERS;

  Object.assign(SCENERY, {
    // ---------- Grand Vacarme: a covered arena, attic. Packed-earth floor, stands all around, truss and floodlight catwalks, display cube at the centroid.
    // In the middle, the open area (M.place): one drives everywhere on it, between the stage and the exit-hairpin mound one cuts under the fire arch. The game draws no wall here (th.wallH = 0):
    // it is this scenery that lays the floor of the wide sections and the walls, wherever the simulation puts some (track edge outside the area, area edge outside the track) ----------
    stade(h) {
      const { THREE, S, N, W, M } = h, net = m => { m.map.anisotropy = 8; return m; }, PL = M.place, [CX, CZ] = PL.c;
      const AD = { emis: 1, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }; // added light: flames, lasers, beams
      const insideArea = (x, z, e = 0) => Math.hypot(x - CX, z - CZ) < PL.r + e, isOpen = s => s.w > W + 0.05 && !s.rc, pointAt = (s, d, y = 0) => [s.x - s.tz * d, s.y + y, s.z + s.tx * d];
      const high = s => s.rc ? s.rc - Math.sqrt(s.rc * s.rc - Math.min(s.w - s.pl, 0.98 * s.rc) ** 2) : 0; // height of the drivable wall at its top (sim.js: wall)
      // the ground follows the track (ramps = mounds, pit = crater); under the wide sections and the area it fades out: their floor is laid lower
      const g = terrain(h, { stepSec: 8, margin: 150, mat: h.mat('terreBeaten'), hollow: (x, z) => { const s = S[near(h, x, z)]; return (isOpen(s) && Math.hypot(s.x - x, s.z - z) < s.w + 3) || insideArea(x, z, 3) ? 1.5 - Math.min(0, s.y) : 0; } });
      // a sheet of quads in a single drawing pass. tile: texture laid flat every `tile` m; otherwise u across, v along
      const sheet = (mat, tile) => { const pos = [], uv = [], idx = []; return {
        quad(a, b, c, d, v0 = 0, v1 = 1) { const k = pos.length / 3; [a, b, c, d].forEach((p, j) => { pos.push(p[0], p[1], p[2]); if (tile) uv.push(p[0] / tile, p[2] / tile); else uv.push(j & 1, j < 2 ? v0 : v1); }); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); },
        ending() { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); q.setIndex(idx); q.computeVertexNormals(); const m = new THREE.Mesh(q, mat); h.scene.add(m); return m; } }; };
      // the ground: on either side of the track in the wide sections, the disc of the area, and the exit-hairpin mound that runs from the track to the stage wall
      const ground = sheet(h.mat('terreBeaten', { side: THREE.DoubleSide }), 10), iB = pt(h, 16);
      for (let i = 0; i < N; i++) { const a = S[i], b = S[(i + 1) % N];
        if (isOpen(a) || isOpen(b)) for (const sd of [-1, 1]) ground.quad(pointAt(a, sd * W), pointAt(a, sd * a.w), pointAt(b, sd * W), pointAt(b, sd * b.w));
        if (i > iB - 16 && i <= iB) ground.quad(pointAt(a, -W), pointAt(a, CZ - a.z), pointAt(b, -W), pointAt(b, CZ - b.z)); }
      for (let k = 0; k < 48; k++) { const f = j => [CX + Math.cos(j * Math.PI / 24) * PL.r, -0.03, CZ + Math.sin(j * Math.PI / 24) * PL.r], c = [CX, -0.03, CZ]; ground.quad(c, f(k), c, f(k + 1)); }
      ground.ending();
      // the walls: the theme's guardrail, at the edge of the track (at the top of the drivable walls) except in the area, and around the area where it overhangs the track; at the points where the two edges cross, only where sim.js puts a wall (behind the guardrail, neither track nor area)
      const intoWall = sheet(h.mat('guardrail', { side: THREE.DoubleSide }, h.TH.intoWall)), pan = (p, q, v) => intoWall.quad([p[0], p[1] + 1.2, p[2]], [p[0], p[1] - 0.6, p[2]], [q[0], q[1] + 1.2, q[2]], [q[0], q[1] - 0.6, q[2]], v, v + 0.25);
      for (let i = 0; i < N; i++) for (const sd of [-1, 1]) { const a = S[i], b = S[(i + 1) % N], p = pointAt(a, sd * a.w, high(a)), q = pointAt(b, sd * b.w, high(b)); const o = pointAt(a, sd * (a.w + 2.2)); if ((!insideArea(p[0], p[2], -0.4) || !insideArea(q[0], q[2], -0.4)) && !insideArea(o[0], o[2], -1.1)) pan(p, q, i / 4); }
      for (let k = 0; k < 96; k++) { const f = j => [CX + Math.cos(j * Math.PI / 48) * PL.r, 0, CZ + Math.sin(j * Math.PI / 48) * PL.r], p = f(k), q = f(k + 1), x = (p[0] + q[0]) / 2, z = (p[2] + q[2]) / 2, s = S[near(h, x, z)];
        const f2 = 1 + 2.2 / PL.r, ox = CX + (x - CX) * f2, oz = CZ + (z - CZ) * f2, s2 = S[near(h, ox, oz)]; if (Math.hypot(s.x - x, s.z - z) > s.w - 0.4 && Math.hypot(s2.x - ox, s2.z - oz) > s2.w - 1.1) pan(p, q, k / 4); }
      intoWall.ending();
      // the perimeter: two long sides, two rounded corners to the east, a semicircle to the west following the raised banked turn. Pieces [length, radius, u => x, z, outward normal]
      const X0 = -68, X1 = 308, Z0 = -34, Z1 = 354, RE = 90, RW = (Z1 - Z0) / 2, arc = (cx, cz, R, a0) => u => { const a = a0 + u / R; return [cx + Math.cos(a) * R, cz + Math.sin(a) * R, Math.cos(a), Math.sin(a)]; };
      const lapRun = [[X1 - X0, 0, u => [X0 + u, Z0, 0, -1]], [RE * Math.PI / 2, RE, arc(X1, Z0 + RE, RE, -Math.PI / 2)], [Z1 - Z0 - 2 * RE, 0, u => [X1 + RE, Z0 + RE + u, 1, 0]],
        [RE * Math.PI / 2, RE, arc(X1, Z1 - RE, RE, 0)], [X1 - X0, 0, u => [X1 - u, Z1, 0, 1]], [RW * Math.PI, RW, arc(X0, (Z0 + Z1) / 2, RW, Math.PI / 2)]];
      // one stand module every 14 m; in the arcs it widens to close the fan up to the back wall
      const grad = [];
      for (const [len, R, f] of lapRun) { const n = Math.round(len / 14), stepSec = len / n;
        for (let k = 0; k < n; k++) { const [x, z, nx, nz] = f((k + 0.5) * stepSec); grad.push([x, Math.min(g.hAt(x, z), 0) - 0.6, z, Math.atan2(nx, nz), stepSec / 14 * (R ? (R + 54) / R : 1) + 0.02, 1, 1]); } }
      const steelMat = h.mat('steelMat'), concretePart = h.mat('concretePart'), lampObj = h.mat('lampObj', GLOW);
      const crowd = net(h.mat('crowd', {}, '#3a3448', '#e8362a')), crowd2 = net(h.mat('crowd', {}, '#2e2a3c', '#ffc21a'));
      insts(h, 'bleacherArena', { concretePart, streamer: h.mat('bannerStade', GLOW, 0), banner2: h.mat('bannerStade', GLOW, 2), crowd, crowd2, stairs: h.mat('steps'), vipBox: h.mat('vipBoxes', GLOW), steelMat, lampObj }, grad);
      // the roof: an underside dotted with lamps, and a truss every 70 m from one long side to the other, with its floodlight catwalks
      const HT = 63, cx = (X0 - RW + X1 + RE) / 2, cz = (Z0 + Z1) / 2;
      const roofM = h.mat('roofArena', GLOW); boxMesh(h, roofM, X1 + RE - X0 + RW + 120, 1, Z1 - Z0 + 120, cx, HT + 0.5, cz);
      const skinF = { steelMat, lampObj, lattice: h.mat('latticeGantry', { alphaTest: 0.5, side: THREE.DoubleSide, rep: [(Z1 - Z0) / 6.2, 1] }, '#3a3e4a') };
      for (let x = -230; x <= 380; x += 70) h.pose('farmRoof', skinF, h.scene, [x, HT - 4.5, cz], Z1 - Z0 + 100);
      // the display cube above the area, and a giant screen at each end of the hall (two images alternating)
      h.pose('cubeScore', { screen: h.mat('boardStade', GLOW), steelMat, bandStrip: h.mat('paint', { emis: 1, c: 0xffc21a }) }, h.scene, [CX, HT - 30, CZ]);
      const screenG = h.mat('screenGiant', GLOW); screenG.map.repeat.set(1, 0.5);
      for (const x of [X1 + RE + 34, X0 - RW - 34]) boxMesh(h, screenG, 1, 18, 84, x, 50, cz);
      // the stage (it closes the east of the area), the mound wall and the fire arch between them: these are M.place's piers
      const chev = h.mat('bannerJump', { emis: 1, rep: [4, 1] });
      h.pose('sceneArena', { concretePart, screen: h.mat('bannerStade', GLOW, 4), bandStrip: h.mat('paint', { emis: 1, c: 0xffc21a }), chevrons: h.mat('bannerJump', { emis: 1, rep: [6, 1] }), steelMat,
        signboard: h.mat('written', GLOW, 192, 16, '#16161c', '#ff8a1a', 'ARCHE DE FEU', 12) }, h.scene, [CX, 0, CZ]);
      // the last 8 m of each jump ramp painted with chevrons (same signal on all relief maps; no gantry above, it blocked the view)
      for (const [p] of M.jumps) { const i = pt(h, p); h.ribbon((i - 4 + N) % N, 4, -W + 0.6, 0.05, W - 0.6, 0.05, chev, 3.5); }
      // the flames: two flamethrowers at the end of each ramp (their glow lights the mound), one row on the arch and one on the stage. [x, y, z, rotation, width, height]
      const lights = [];
      for (const [p] of M.jumps) { const i = pt(h, p), s = S[i]; h.emis(i, s.x, s.y + 4, s.z, 0xff7a20, 30, 0.45); for (const sd of [-1, 1]) lights.push([...pointAt(s, sd * (s.w - 0.8)), h.across(s), 2.4, 6]); }
      for (let k = 0; k < 6; k++) lights.push([CX - 20 + k * 5.4, 12, CZ, 0, 2, 4.5]);
      for (let k = 0; k < 5; k++) lights.push([CX + 14 + k * 10, 4.5, CZ, 0, 2.4, 5]);
      const gf = new THREE.PlaneGeometry(1, 1); gf.translate(0, 0.5, 0);
      const mf = new THREE.InstancedMesh(gf, h.mat('flame', AD), lights.length), o3 = new THREE.Object3D(); mf.frustumCulled = false; mf.userData.dyn = 1; h.scene.add(mf);
      // two laser fans under the cube, four chase beams sweeping the track, and camera flashes in the stands
      const lasers = [0x30ff70, 0xff30c0].map(c => h.pose('fanLaser', { arcRadius: h.mat('paint', { ...AD, c }) }, h.scene, [CX, HT - 38, CZ])[0]);
      const gc = new THREE.ConeGeometry(9, 56, 10, 1, true); gc.translate(0, -28, 0); const mc = h.mat('beam', AD);
      const cones = [[-60, 60], [80, 250], [220, 70], [330, 240]].map(([x, z]) => { const m = new THREE.Mesh(gc, mc); m.position.set(x, HT - 6, z); h.scene.add(m); return m; });
      const fl = []; for (let k = 0; k < 900; k++) { const p = grad[(h.rnd() * grad.length) | 0], t = h.rnd(), lx = (h.rnd() - 0.5) * 13 * p[4], lz = 2 + 26 * t, c = Math.cos(p[3]), s = Math.sin(p[3]); fl.push(p[0] + lx * c + lz * s, p[1] + 5.5 + 15 * t, p[2] - lx * s + lz * c); }
      const gfl = new THREE.BufferGeometry(); gfl.setAttribute('position', new THREE.Float32BufferAttribute(fl, 3));
      const flashes = new THREE.Points(gfl, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); flashes.frustumCulled = false; h.scene.add(flashes);
      // advertising boards behind the walls, and the floodlights lighting the track: white, so the earth keeps its color
      const ads = [['VOLT COLA', '#e8362a', '#f4f0e0'], ['KOP 170', '#16161c', '#ffc21a'], ['TONNERRE', '#f4f0e0', '#1c3fa8'], ['BRASERO', '#ffc21a', '#16161c']].map(([t, a, b]) => h.mat('written', GLOW, 64, 32, a, b, t, 11));
      [[9, -1], [13, 1], [16, 1], [22, 1], [24, -1], [1, 1]].forEach(([p, sd], k) => { const s = S[pt(h, p)]; h.pose('signAd', { mat: h.mat('iron'), poster: ads[k % ads.length] }, marker(h, s), [sd * (s.w + 7), 0, 0], sd * 0.5); });
      for (let i = 0; i < N; i += 45) h.emis(i, S[i].x, S[i].y + 20, S[i].z, 0xeef2ff, 55, 0.22);
      const rnd = h.rnd, ext = s => s.k > 0 ? -1 : 1, wrap = a => Math.atan2(Math.sin(a), Math.cos(a)); // ext: outside of a bend (sim.js: k > 0 = right)
      const skinV = { carBody: h.mat('paint', { c: 0xffffff }), pane: h.mat('paneDark'), lightRed: h.mat('lightRed'), lightWhite: h.mat('matGray'), chassis: h.mat('matGray'), wheelPart: h.mat('wheelPart'), tire: h.mat('tire') };
      const rusts = [0x8a4a2a, 0x5a6a7a, 0xa89a50, 0x6a2a2a, 0x3a5a3a, 0x9a9a9a];
      // first hairpin (points 4 to 8, flat, two tight corners): on the outside, a concrete bank loaded with a tire wall that sticks out 1.6 m past the guardrail, and on the tires, the crushed wrecks of previous nights
      { const i0 = pt(h, 4), n = (pt(h, 8) - i0 + N) % N, sd = ext(S[pt(h, 5)]), pn = [], carc = [];
        h.ribbon(i0, n, s => sd * s.w, high, s => sd * (s.w + 2.6), high, concretePart, 8); h.ribbon(i0, n, s => sd * (s.w + 2.6), high, s => sd * (s.w + 2.6), -2, concretePart, 8);
        for (let k = 0; k < n; k++) { const s = S[(i0 + k) % N], y = s.y + high(s);
          for (const r of [0.6, 1.6]) for (const l of [-0.5, 0.5]) { const [x, z] = edgePt(s, sd, s.w + r), nbr = r > 1 && k % 5 === 2 ? 6 : 9; for (let e = 0; e < nbr; e++) pn.push([x + s.tx * l, y + 0.15 + e * 0.31, z + s.tz * l, rnd() * 3]); }
          if (k % 14 === 7) { const [x, z] = edgePt(s, sd, s.w + 1.1); carc.push([x, y + 3, z, h.across(s) + Math.PI / 2 + (rnd() - 0.5) * 0.4, 1, 0.38, 1, rusts[carc.length % rusts.length]]); } }
        inst(h, new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10), h.mat('tire'), pn); insts(h, 'carParked', skinV, carc, { tintMat: 'carBody' }); }
      // second hairpin (points 17 to 21): the fans' banners hang from the roof over the outside of the bend, each on its own cable, and sway
      const banners = []; { const i0 = pt(h, 17), n = (pt(h, 21) - i0 + N) % N, sd = ext(S[pt(h, 19)]);
        for (let k = 0; k < 6; k++) { const s = S[(i0 + Math.round((k + 0.5) * n / 6)) % N], [x, z] = edgePt(s, sd, s.w + 6 + (k % 2) * 6), y = 30 + (k % 3) * 3;
          const m = boxMesh(h, h.mat('bannerSupporter', { emis: 1, c: 0xd0d0d0 }, k), 0.12, 16, 6, x, y, z); m.rotation.y = h.across(s); banners.push(m);
          boxMesh(h, steelMat, 0.1, HT - y - 8, 0.1, x, (HT + y + 8) / 2, z); } }
      // the pit (the ramp that has a pit): mud at the bottom and on its edges, crushed cars behind its guardrails, monster truck parked at the edge on the area side
      { const [p, , , F] = M.jumps.find(s => s[3]), i0 = pt(h, p), nf = Math.round(F / 2), mud = h.mat('mud', { gloss: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), br = [];
        h.ribbon((i0 + 1) % N, nf - 1, s => -s.w - 4, 0.04, s => s.w + 4, 0.04, mud, 6);
        for (let k = 0; k < 8; k++) { const s = S[(i0 + 2 + Math.round(k * (nf - 6) / 7)) % N], sd = k & 1 ? 1 : -1, [x, z] = edgePt(s, sd, s.w + 1.6 + (k % 3) * 0.6); br.push([x, s.y + 0.05 + (k % 4 === 0 ? 0.5 : 0), z, h.across(s) + Math.PI / 2 + (rnd() - 0.5) * 0.8, 1, 0.32, 1.05, rusts[k % rusts.length]]); }
        insts(h, 'carParked', skinV, br, { tintMat: 'carBody' });
        const s = S[i0], sd = Math.hypot(...edgePt(s, 1, 1).map((v, j) => v - [CX, CZ][j])) < Math.hypot(...edgePt(s, -1, 1).map((v, j) => v - [CX, CZ][j])) ? 1 : -1, [x, z] = edgePt(s, sd, s.w + 9);
        const mt = new THREE.Group(); mt.position.set(x, g.hAt(x, z), z); mt.rotation.y = h.across(s) + Math.PI / 2 + 0.5; h.scene.add(mt);
        h.pose('monsterTruck', { carBody: h.mat('paint', { c: 0x2ab84a }), flameSet: h.mat('paint', { c: 0xff8a1a }), pane: h.mat('paneDark'), chassis: h.mat('matGray'), steelMat, tire: h.mat('tire'), lampObj }, mt); }
      // sparks: at each takeoff, a shower falls from the truss above the followed car (only one shower at a time)
      const NE = 160, pe = new Float32Array(NE * 3), ve = new Float32Array(NE * 3), ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(pe, 3));
      const me = new THREE.PointsMaterial({ color: 0xffb040, size: 0.7, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }), spark = new THREE.Points(ge, me); spark.frustumCulled = false; spark.visible = false; h.scene.add(spark);
      // the wave: an arms-raised copy of the crowd in the lower ring, raised on the stands near the followed car and hidden under the floor elsewhere; it runs with it around the hall
      // shortcut: it follows the car the scenery receives (the player's), not the race leader; game.js would need to pass the leading car to the scenery
      const A1 = Math.atan2(15, 26), go = h.geo('boxMesh', 14, 0.6, 30); go.rotateX(-A1); go.translate(0, 12.7, 15);
      const fo = net(h.mat('crowd', {}, '#4a4458', '#f4f0e0')); fo.map.offset.y = 0.5;
      const ola = inst(h, go, fo, grad), ag = grad.map(p => Math.atan2(p[2] - cz, p[0] - cx)), o4 = new THREE.Object3D(), LOW = new THREE.Vector3(0, -1, 0), aim = new THREE.Vector3();
      // finish confetti: it falls spinning above the line, restarts from the roof as long as the finish board is there
      const NC = 700, pc = new Float32Array(NC * 3), cc = new Float32Array(NC * 3), gc2 = new THREE.BufferGeometry(), tints = [[1, 0.76, 0.1], [0.91, 0.21, 0.16], [0.11, 0.25, 0.66], [0.96, 0.94, 0.88]];
      for (let k = 0; k < NC; k++) { const c = tints[k % 4]; cc.set(c, k * 3); pc[k * 3 + 1] = -99; }
      gc2.setAttribute('position', new THREE.BufferAttribute(pc, 3)); gc2.setAttribute('color', new THREE.BufferAttribute(cc, 3));
      const conf = new THREE.Points(gc2, new THREE.PointsMaterial({ size: 0.45, vertexColors: true, fog: false })); conf.frustumCulled = false; conf.visible = false; h.scene.add(conf);
      const cone0 = cones.map(m => m.position.clone());
      let tE = 9, started = false, vol = 0, replays = 0, snuffed = 0, party = false;
      return (dt, now, car) => {
        if (car) {
          // clean takeoff (not a bump): the shower goes; landing from a real jump: the screen replays it
          if (car.air && car.airT > 0.2 && !started) { started = true; tE = 0;
            for (let k = 0; k < NE; k++) { pe[k * 3] = car.x + car.vx * 0.8 + (Math.random() - 0.5) * 14; pe[k * 3 + 1] = HT - 8 - Math.random() * 3; pe[k * 3 + 2] = car.z + car.vz * 0.8 + (Math.random() - 0.5) * 14;
              ve[k * 3] = (Math.random() - 0.5) * 3; ve[k * 3 + 1] = -Math.random() * 4; ve[k * 3 + 2] = (Math.random() - 0.5) * 3; } }
          if (car.air) vol = Math.max(vol, car.airT); else { if (vol > 0.6) replays = now + 4000; vol = 0; started = false; }
          const ac = Math.atan2(car.z - cz, car.x - cx);
          grad.forEach((p, k) => { const e = Math.max(0, 1 - Math.abs(wrap(ag[k] - ac + 0.12)) / 0.22); o4.position.set(p[0], p[1] + (e ? e * 1.6 - 1 : -60), p[2]); o4.rotation.set(0, p[3], 0); o4.scale.set(p[4], 1, 1); o4.updateMatrix(); ola.setMatrixAt(k, o4.matrix); });
          ola.instanceMatrix.needsUpdate = true;
        }
        if (tE < 4) { tE += dt; for (let k = 0; k < NE * 3; k++) { if (k % 3 === 1) ve[k] -= 9.81 * dt; pe[k] += ve[k] * dt; } ge.attributes.position.needsUpdate = true; me.opacity = Math.max(0, 1 - tE / 4); }
        spark.visible = tE < 4;
        // last lap: the hall goes dark, the four chase beams come to aim at the car; finish: confetti
        // shortcut: last lap = car.lap === 3 (session.js: every race against the BOTS is 3 laps); to revisit if the lap count becomes adjustable
        const lst = !!(car && car.lap === 3), arrive = lst && car.dist >= 3 * N;
        snuffed += ((lst && !arrive ? 1 : 0) - snuffed) * Math.min(1, dt * 1.5);
        roofM.color.setScalar(1 - 0.8 * snuffed); lampObj.color.setScalar(1 - 0.85 * snuffed); mc.color.setScalar(1 + 2 * snuffed);
        // the crowd moves: each ring passes at times to its arms-raised variant
        crowd.map.offset.y = Math.sin(now * 0.0023) + Math.sin(now * 0.0061) > 0.6 ? 0.5 : 0;
        crowd2.map.offset.y = Math.sin(now * 0.0019 + 2) + Math.sin(now * 0.0047) > 0.5 ? 0.5 : 0;
        screenG.map.offset.y = now < replays ? Math.floor(now / 200) % 2 * 0.5 : Math.floor(now / 2500) % 2 * 0.5; // after a jump, "QUEL SAUT !" flashes
        // the flames flicker, and each flamethrower spits a big blast every 3 s, in turn
        lights.forEach(([x, y, z, r, w, ht], k) => { const strike = (now * 0.001 + k * 0.37) % 3.2 < 0.45 ? 1.9 : 1, f = 0.75 + 0.25 * Math.sin(now * 0.021 + k * 1.7) * Math.sin(now * 0.013 + k);
          o3.position.set(x, y, z); o3.rotation.set(0, r, 0); o3.scale.set(w * (0.85 + 0.15 * f), ht * f * strike, 1); o3.updateMatrix(); mf.setMatrixAt(k, o3.matrix); });
        mf.instanceMatrix.needsUpdate = true;
        lasers.forEach((m, k) => m.rotation.set(Math.sin(now * 0.0007 + k * 2) * 0.5, now * 0.0004 * (k ? -1 : 1) + k * 1.57, 0));
        cones.forEach((m, k) => { if (snuffed > 0.5 && car) { const a = k * 1.571 + now * 0.0002; m.position.set(car.x + Math.cos(a) * 30, HT - 6, car.z + Math.sin(a) * 30); m.scale.set(0.5, 1.25, 0.5);
            m.quaternion.setFromUnitVectors(LOW, aim.set(car.x - m.position.x, car.y - m.position.y, car.z - m.position.z).normalize()); }
          else { m.position.copy(cone0[k]); m.scale.set(1, 1, 1); m.rotation.set(Math.sin(now * 0.0006 + k) * 0.45, 0, Math.cos(now * 0.0008 + k * 2) * 0.45); } });
        if (arrive && !party) { const s = S[0]; for (let k = 0; k < NC; k++) { pc[k * 3] = s.x + (Math.random() - 0.5) * 70; pc[k * 3 + 1] = 15 + Math.random() * (HT - 20); pc[k * 3 + 2] = s.z + (Math.random() - 0.5) * 40; } }
        party = arrive; conf.visible = party;
        if (party) { for (let k = 0; k < NC; k++) { const j = k * 3; pc[j] += Math.sin(now * 0.003 + k) * 1.5 * dt; pc[j + 1] -= (2 + k % 3) * dt; pc[j + 2] += Math.cos(now * 0.0027 + k * 1.3) * 1.5 * dt; if (pc[j + 1] < 0) pc[j + 1] = HT - 8; } gc2.attributes.position.needsUpdate = true; }
        gfl.setDrawRange(Math.floor(now / 70) * 7919 % 860, 40);
      };
    },
  });
})();
