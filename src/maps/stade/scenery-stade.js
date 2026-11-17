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
      for (const sd of [-1, 1]) { const mat = h.mat('guardrail', { side: THREE.DoubleSide }, h.TH.intoWall), ok = i => { const a = S[i], b = S[(i + 1) % N], p = pointAt(a, sd * a.w), q = pointAt(b, sd * b.w), o = pointAt(a, sd * (a.w + 2.2)); return (!insideArea(p[0], p[2], -0.4) || !insideArea(q[0], q[2], -0.4)) && !insideArea(o[0], o[2], -1.1); };
        for (let i = 0; i < N; i++) if (ok(i)) { let n = 0; while (i + n < N && ok(i + n)) n++; h.guardM(sd, i, n, s => sd * s.w, s => high(s) + 1.2, s => sd * s.w, s => high(s) - 0.6, mat); i += n; } } // the guardrail sections on the roadway: those wear down on impacts (h.guardM); the perimeter of the area, lower down, stays fixed
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
      // the video cube: hung from the roof above the central area, its four faces turned toward the four sides of the hall broadcast the live race to the crowd.
      // The track runs between the area and the stands: the player sees the face that looks at their stand. Faces of 40 × 17 m, bottom at 7 m (out of the way of the shortcut, nobody passes underneath) (the previous display cube,
      // 24 × 13 m, bottom at 26 m, did not take up 1% of the image from the race camera); offset 30 m south of the fire arch so its flames don't touch it.
      // A TV camera follows the car and changes shot every 4 s (helicopter, dolly, face, stand with telephoto lens), rendered at 320 × 136,
      // one frame in four, up to 400 m; the screens are hidden during its shot (they can't read themselves). A giant screen at each end of the hall (two images alternating)
      const RTV = new THREE.WebGLRenderTarget(320, 136), tv = new THREE.PerspectiveCamera(30, 40 / 17, 1, 400), vividTone = new THREE.MeshBasicMaterial({ map: RTV.texture, fog: false });
      const screenTex = h.mat('boardStade', GLOW), KX = CX - 5, KZ = CZ - 30, KY = 17, cube = h.pose('cubeScore', { screen: screenTex, steelMat, bandStrip: h.mat('paint', { emis: 1, c: 0xffc21a }) }, h.scene, [KX, KY, KZ]);
      cube.forEach(m => m.scale.set(40 / 24, 17 / 13, 40 / 24)); const giants = cube.filter(m => m.material === screenTex); giants.forEach(m => { m.material = vividTone; m.userData.dyn = 1; m.userData.screenTV = 1; });
      for (const a of [-1, 1]) for (const b of [-1, 1]) boxMesh(h, steelMat, 0.3, HT - KY - 30, 0.3, KX + a * 15, (HT + KY + 30) / 2, KZ + b * 15); // the suspension cables, from the top of the cube to the roof
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
      const iArch = lights.length; // the six flames of the arch: they flare up when you pass under
      for (let k = 0; k < 6; k++) lights.push([CX - 20 + k * 5.4, 12, CZ, 0, 2, 4.5]);
      for (let k = 0; k < 5; k++) lights.push([CX + 14 + k * 10, 4.5, CZ, 0, 2.4, 5]);
      const gf = new THREE.PlaneGeometry(1, 1); gf.translate(0, 0.5, 0);
      const mf = new THREE.InstancedMesh(gf, h.mat('flame', AD), lights.length), o3 = new THREE.Object3D(); mf.frustumCulled = false; mf.userData.dyn = 1; h.scene.add(mf);
      // two laser fans under the cube, four chase beams sweeping the track, and camera flashes in the stands
      const lasers = [0x30ff70, 0xff30c0].map(c => h.pose('fanLaser', { arcRadius: h.mat('paint', { ...AD, c }) }, h.scene, [KX, KY - 11, KZ])[0]); // under the video cube
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
      // the central area is a playground: clusters of standing barrels, to knock over (h.breakable: each barrel goes alone, visual only, the car is not slowed).
      // Off the track's roadway, off the stage and the wall of the mound, and on both sides of the arch, where anyone cutting the corner passes
      { const bar = [], cols = [0xe8362a, 0x1c3fa8, 0xffc21a, 0xf4f0e0, 0x16161c], free = (x, z) => { const s = S[near(h, x, z)]; return Math.hypot(s.x - x, s.z - z) > s.w + 2.5 && insideArea(x, z, -4) && !(Math.abs(z - CZ) < 5 && (x > CX + 8 || x < CX - 21)); };
        const centers = [[CX - 6, CZ - 14], [CX - 6, CZ + 14], ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => [CX + Math.cos(k * 0.785 + 0.4) * 36, CZ + Math.sin(k * 0.785 + 0.4) * 36])];
        for (const [cx0, cz0] of centers) if (free(cx0, cz0)) for (let k = 0; k < 7; k++) { const a = k * 1.047, r = k ? 1.05 : 0, x = cx0 + Math.cos(a) * r, z = cz0 + Math.sin(a) * r; if (free(x, z)) bar.push([x, 0.55, z, rnd() * 3, 1, 1, 1, cols[(k + bar.length) % 5]]); }
        const mb = inst(h, new THREE.CylinderGeometry(0.45, 0.45, 1.1, 10), h.mat('paint', { c: 0xffffff }), bar); bar.forEach((p, k) => mb.setColorAt(k, new THREE.Color(p[7]))); if (bar.length) mb.instanceColor.needsUpdate = true;
        bar.forEach((p, k) => h.breakable([[mb, k]], p[0], 0, p[2], 0.45, 1.1, [0.85, 0.3, 0.2])); }
      // sparks: at each takeoff, a shower falls from the truss above the followed car (only one shower at a time)
      const NE = 160, pe = new Float32Array(NE * 3), ve = new Float32Array(NE * 3), ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(pe, 3));
      const me = new THREE.PointsMaterial({ color: 0xffb040, size: 0.7, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }), spark = new THREE.Points(ge, me); spark.frustumCulled = false; spark.visible = false; h.scene.add(spark);
      // the wave: an arms-raised copy of the crowd in the lower ring, raised on the stands near the followed car and hidden under the floor elsewhere; it runs with it around the hall
      // shortcut: it follows the car the scenery receives (the player's), not the race leader; game.js would need to pass the leading car to the scenery
      // (crowd and ola code: src/render/crowd.js, shared with canal)
      const ag = grad.map(p => Math.atan2(p[2] - cz, p[0] - cx)), crowdRig = PLACERS.crowd(h, { ola: { mods: grad, wd: 14, profData: 30, slope: Math.atan2(15, 26), y: 11.5, z: 15, gap: (k, car) => Math.max(0, 1 - Math.abs(wrap(ag[k] - Math.atan2(car.z - cz, car.x - cx) + 0.12)) / 0.22) },
        tiers: [{ mat: crowd, f1: 0.0023, f2: 0.0061, ph: 0, cutoff: 0.6 }, { mat: crowd2, f1: 0.0019, f2: 0.0047, ph: 2, cutoff: 0.5 }],
        placards: { double: [['ALLEZ !', '#f4f0e0', '#e8362a'], ['VAS-Y !', '#ffc21a', '#16161c'], ['BRAVO !', '#1c3fa8', '#f4f0e0']], headEl: [['N°1', '#ffc21a', '#16161c'], ['EN TÊTE !', '#e8362a', '#f4f0e0']], // crowd signs when overtaking, taking the lead, bumping; jumps or passes under the arch (raised here)
          impact: [['AÏE !', '#f4f0e0', '#16161c'], ['OUCH', '#16161c', '#ffc21a']], jump: [['QUEL SAUT !', '#16161c', '#ffc21a'], ['10/10', '#f4f0e0', '#1c3fa8']], fire: [['OLÉ !', '#ff8a1a', '#16161c'], ['RACCOURCI !', '#16161c', '#ff8a1a']] } }), LOW = new THREE.Vector3(0, -1, 0), aim = new THREE.Vector3();
      // finish confetti: it falls spinning above the line, restarts from the roof as long as the finish board is there
      const NC = 700, pc = new Float32Array(NC * 3), cc = new Float32Array(NC * 3), gc2 = new THREE.BufferGeometry(), tints = [[1, 0.76, 0.1], [0.91, 0.21, 0.16], [0.11, 0.25, 0.66], [0.96, 0.94, 0.88]];
      for (let k = 0; k < NC; k++) { const c = tints[k % 4]; cc.set(c, k * 3); pc[k * 3 + 1] = -99; }
      gc2.setAttribute('position', new THREE.BufferAttribute(pc, 3)); gc2.setAttribute('color', new THREE.BufferAttribute(cc, 3));
      const conf = new THREE.Points(gc2, new THREE.PointsMaterial({ size: 0.45, vertexColors: true, fog: false })); conf.frustumCulled = false; conf.visible = false; h.scene.add(conf);
      const cone0 = cones.map(m => m.position.clone());
      let feuT = 0, zA = null, followed = null, nTV = 0, tNow = 0;
      let tE = 9, started = false, vol = 0, replays = 0, snuffed = 0, party = false;
      const tick = (dt, now, car) => { followed = car; tNow = now;
        if (car) {
          // clean takeoff (not a bump): the shower goes; landing from a real jump: the screen replays it
          if (car.air && car.airT > 0.2 && !started) { started = true; tE = 0;
            for (let k = 0; k < NE; k++) { pe[k * 3] = car.x + car.vx * 0.8 + (Math.random() - 0.5) * 14; pe[k * 3 + 1] = HT - 8 - Math.random() * 3; pe[k * 3 + 2] = car.z + car.vz * 0.8 + (Math.random() - 0.5) * 14;
              ve[k * 3] = (Math.random() - 0.5) * 3; ve[k * 3 + 1] = -Math.random() * 4; ve[k * 3 + 2] = (Math.random() - 0.5) * 3; } }
          if (car.air) vol = Math.max(vol, car.airT); else { if (vol > 0.6) { replays = now + 4000; crowdRig.lifts(car, 'jump', 30); } vol = 0; started = false; }
          // the fire arch: passing under it (the shortcut through the area) makes it spit its six flames and the hall stand up
          const zR = car.z - CZ; if (zA !== null && Math.sign(zR) !== Math.sign(zA) && car.x > CX - 23 && car.x < CX + 10 && car.y < 8) { feuT = now + 1600; crowdRig.lifts(car, 'fire', 30); } zA = zR;
        }
        if (tE < 4) { tE += dt; for (let k = 0; k < NE * 3; k++) { if (k % 3 === 1) ve[k] -= 9.81 * dt; pe[k] += ve[k] * dt; } ge.attributes.position.needsUpdate = true; me.opacity = Math.max(0, 1 - tE / 4); }
        spark.visible = tE < 4;
        // last lap: the hall goes dark, the four chase beams come to aim at the car; finish: confetti
        const nT = h.lapCount(), lst = !!(car && nT && car.lap === nT), arrive = lst && car.dist >= nT * N; // h.lapCount() : 0 hors course
        snuffed += ((lst && !arrive ? 1 : 0) - snuffed) * Math.min(1, dt * 1.5);
        roofM.color.setScalar(1 - 0.8 * snuffed); lampObj.color.setScalar(1 - 0.85 * snuffed); mc.color.setScalar(1 + 2 * snuffed);
        crowdRig(dt, now, car); // the crowd moves: arms raised at times, and the ola
        screenG.map.offset.y = now < replays ? Math.floor(now / 200) % 2 * 0.5 : Math.floor(now / 2500) % 2 * 0.5; // after a jump, "QUEL SAUT !" flashes
        // the flames flicker, and each flamethrower spits a big blast every 3 s, in turn
        lights.forEach(([x, y, z, r, w, ht], k) => { const strike = now < feuT && k >= iArch && k < iArch + 6 ? 2.6 + 0.6 * Math.sin(now * 0.03 + k) : (now * 0.001 + k * 0.37) % 3.2 < 0.45 ? 1.9 : 1, f = 0.75 + 0.25 * Math.sin(now * 0.021 + k * 1.7) * Math.sin(now * 0.013 + k);
          o3.position.set(x, y, z); o3.rotation.set(0, r, 0); o3.scale.set(w * (0.85 + 0.15 * f), ht * f * strike, 1); o3.updateMatrix(); mf.setMatrixAt(k, o3.matrix); });
        mf.instanceMatrix.needsUpdate = true;
        lasers.forEach((m, k) => m.rotation.set(Math.sin(now * 0.0007 + k * 2) * 0.5, now * 0.0004 * (k ? -1 : 1) + k * 1.57, 0));
        cones.forEach((m, k) => { if (snuffed > 0.5 && car) { const a = k * 1.571 + now * 0.0002; m.position.set(car.x + Math.cos(a) * 30, HT - 6, car.z + Math.sin(a) * 30); m.scale.set(0.5, 1.25, 0.5);
            m.quaternion.setFromUnitVectors(LOW, aim.set(car.x - m.position.x, car.y - m.position.y, car.z - m.position.z).normalize()); }
          else { m.position.copy(cone0[k]); m.scale.set(1, 1, 1); m.rotation.set(Math.sin(now * 0.0006 + k) * 0.45, 0, Math.cos(now * 0.0008 + k * 2) * 0.45); } });
        if (arrive && !party) { const s = S[0]; for (let k = 0; k < NC; k++) { pc[k * 3] = s.x + (Math.random() - 0.5) * 70; pc[k * 3 + 1] = 15 + Math.random() * (HT - 20); pc[k * 3 + 2] = s.z + (Math.random() - 0.5) * 40; } }
        party = arrive; conf.visible = party;
        if (party) { for (let k = 0; k < NC; k++) { const j = k * 3; pc[j] += Math.sin(now * 0.003 + k) * 1.5 * dt; pc[j + 1] -= (2 + k % 3) * dt; pc[j + 2] += Math.cos(now * 0.0027 + k * 1.3) * 1.5 * dt; if (pc[j + 1] < 0) pc[j + 1] = HT - 8; } gc2.attributes.position.needsUpdate = true; }
        gfl.setDrawRange(Math.floor(now / 70) * 7919 % (crowdRig.upright() ? 700 : 860), crowdRig.upright() ? 200 : 40); // the hall on its feet: a burst of flashes
      };
      tick.liveFeed = R => { // called by game.js before rendering the first view
        const c = followed; if (!c || nTV++ % 4) return;
        const fx = Math.cos(c.th), fz = Math.sin(c.th), plan = Math.floor(tNow / 4000) % 4; tv.fov = 30;
        if (plan === 0) tv.position.set(c.x - fx * 26, c.y + 18, c.z - fz * 26); // helicopter, behind and above
        else if (plan === 1) tv.position.set(c.x - fz * 13, c.y + 2.5, c.z + fx * 13); // dolly, at wheel height
        else if (plan === 2) tv.position.set(c.x + fx * 20, c.y + 1.6, c.z + fz * 20); // head-on, it comes at us
        else { const p = grad.reduce((a, b) => ((b[0] - c.x) ** 2 + (b[2] - c.z) ** 2 < (a[0] - c.x) ** 2 + (a[2] - c.z) ** 2 ? b : a)); tv.position.set(p[0], p[1] + 14, p[2]); tv.fov = 14; } // the nearest stand, with a telephoto lens
        tv.updateProjectionMatrix(); tv.lookAt(c.x + c.vx * 0.15, c.y + 0.8, c.z + c.vz * 0.15); tv.updateMatrixWorld();
        giants.forEach(m => { m.visible = false; }); R.setRenderTarget(RTV); R.render(h.scene, tv); giants.forEach(m => { m.visible = true; }); };
      return tick;
    },
  });
})();
