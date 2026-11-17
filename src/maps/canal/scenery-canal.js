// Placement of the "canal" scenery: adds its function to SCENERY. The shared placers come from scenery.js. See docs/methods/SCENERY.md.
(function () {
  const { inst, near, pt, indexed, insts, GLOW, boxMesh, edgePt, marker, weld, terrain } = PLACERS;

  Object.assign(SCENERY, {
    // ---------- Canal 6: the concrete channel has become a large American-style oval. Ring of giant grandstands full of people, fences, pit stands at the start,
    // timing tower, leaderboard screens, full car parks and motorhomes outside, airship; floodlights on the track to the west ----------
    canal(h) {
      const { THREE, S, N, W, rnd, T } = h;
      const net = m => { m.map.anisotropy = 8; return m; }; // textures vues en rasant (gazon, gradins, grillage) : filtrage anisotrope, sinon elles bavent
      const g = terrain(h, { stepSec: 16, margin: 340, mat: net(h.mat('lawn')) });
      // arrow murals: on a 5 m wall on the outside of the bends, chevrons painted in the direction of the turn
      const mural = flip => h.mat('mural', { emis: 1, side: THREE.DoubleSide }, flip);
      const dummy = new THREE.Object3D(), wallMeshes = [0, 1].map(f => new THREE.InstancedMesh(h.geo('wallMural'), mural(f), 400)), cnt = [0, 0], beaconA = [], beaconB = [], apex = [];
      for (let i = 0; i < N; i++) {
        const s = S[i], k = s.k; if (Math.abs(k) < 0.0045) continue;
        const f = k > 0 ? 0 : 1, sd = k > 0 ? -1 : 1; // the outside is on the left of a right-hand bend
        if (i % 8 === 0 && cnt[f] < 400) { const [x, z] = edgePt(s, sd, s.w + 1.6); dummy.position.set(x, s.y + 2.5, z); dummy.lookAt(s.x, s.y + 2.5, s.z); dummy.updateMatrix(); wallMeshes[f].setMatrixAt(cnt[f]++, dummy.matrix); }
        if (i % 4 === 0) { const [x, z] = edgePt(s, sd, s.w + 0.5); (i % 8 ? beaconA : beaconB).push([x, s.y + 4.4, z]); } // tall markers, one in two white, the other pink
        if (Math.abs(k) > Math.abs(S[(i + N - 1) % N].k) && Math.abs(k) >= Math.abs(S[(i + 1) % N].k) && Math.abs(k) > 0.008) apex.push([i, sd]);
      }
      wallMeshes.forEach((m, f) => { m.count = cnt[f]; m.frustumCulled = false; h.scene.add(m); });
      inst(h, h.geo('beacon'), h.mat('paint', { emis: 1, c: 0xf4f0e0 }), beaconA); inst(h, h.geo('beacon'), h.mat('paint', { emis: 1, c: 0xe83f8c }), beaconB);
      // meeting sponsor panels (invented): a 24 m mast at the outside apex of each bend
      const ads = [['SOLAR COLA', '#c8102e', '#f4f0e0'], ['DUSK RADIO', '#3d2a5c', '#ffc04a'], ['PALM TIRES', '#1848c8', '#f4f0e0'], ['RANCHO', '#f4f0e0', '#1a1420'], ['NITRO TACO', '#2aa39a', '#f4f0e0'], ['CANAL 6', '#1a1420', '#ff7a3d']].map(([t, a, b]) => h.mat('written', GLOW, 64, 32, a, b, t, 11));
      const iron = h.mat('iron'), steelMat = h.mat('steelMat'), concretePart = h.mat('concretePart'), lampObj = h.mat('lampObj', GLOW);
      apex.forEach(([i, sd], k) => h.pose('signAd', { mat: iron, poster: ads[k % ads.length] }, marker(h, S[i]), [sd * (S[i].w + 9), 0, 0], sd * 0.5));
      // protective fence above the low walls, on both sides, all the way round; posts every 6 samples
      const cO = N - (T.t1 - T.t0), grid = net(h.mat('grating', { transparent: true, depthWrite: false, alphaTest: 0.02, side: THREE.DoubleSide })); // blended, not cut: from afar, the mipmaps turn it into a steady veil instead of a flickering moire
      for (const sd of [-1, 1]) h.ribbon(T.t1, cO, s => sd * (s.w + 0.1), h.TH.wallH + 4.2, s => sd * (s.w + 0.1), h.TH.wallH - 0.1, grid, 4);
      const pot = []; for (let i = 0; i < N; i += 6) for (const sd of [-1, 1]) { const [x, z] = edgePt(S[i], sd, S[i].w + 0.2); pot.push([x, S[i].y + h.TH.wallH + 2.1, z, 0, 1, 0.86, 1]); }
      inst(h, h.geo('poleGrate'), steelMat, pot);

      // --- the grandstands follow the track on the outside, with no gap: a 14 m module every 7 samples. It widens on the outside of the bends
      // to close the fan, and loses depth (75%, 50%) where another stretch of track passes behind; one in four carries a mast ---
      const stands = [[], []], STEP = 7, DEPTH = 53, olaI = []; // olaI: each module with, last, its track sample (for the ola)
      const foot = i => { const s = S[i % N]; return [...edgePt(s, -1, s.w + 12), s.tz, -s.tx]; }; // facade and back direction (left side = outside of the oval)
      for (let i = 0, k = 0; i < N; i += STEP, k++) {
        const [x, z, ox, oz] = foot(i), sc = [1, 0.75, 0.5].find(c => [0, 0.35, 0.7, 1].every(f => g.dAt(x + f * DEPTH * c * ox, z + f * DEPTH * c * oz) > W + 9));
        if (!sc || ![-7, 7].every(u => g.dAt(x + u * oz, z - u * ox) > W + 9)) continue;
        const [x2, z2, ox2, oz2] = foot(i + STEP), wide = Math.max(1, Math.hypot(x2 + 40 * sc * ox2 - x - 40 * sc * ox, z2 + 40 * sc * oz2 - z - 40 * sc * oz) / 14 + 0.05);
        const y = Math.min(g.hAt(x, z), g.hAt(x + 20 * sc * ox, z + 20 * sc * oz)) - 0.6, mat = k % 4 === 0 ? 1 : 0;
        stands[mat].push([x, y, z, Math.atan2(ox, oz), wide, sc, sc]); olaI.push([...stands[mat][stands[mat].length - 1], i]);
        if (mat) { const s = S[i], [lx, lz] = edgePt(s, -1, W + 2); h.emis(i, lx, s.y + 20, lz, 0xfff0d8, 50, 0.5); } // the mast lights the track; to the west, a supplement
      }
      const crowd = net(h.mat('crowd', {}, '#4a4250', '#e83f8c')), crowd2 = net(h.mat('crowd', {}, '#3e3848', '#2aa39a'));
      const skinT = { concretePart, streamer: h.mat('streamer', {}, 0), banner2: h.mat('streamer', {}, 2), crowd, crowd2, stairs: h.mat('steps'), vipBox: h.mat('vipBoxes', GLOW), steelMat, roofM: h.mat('tinRoof'), lampObj, flagCube: h.mat('checker', { emis: 1, net: 1, side: THREE.DoubleSide }, '#f4f0e0') };
      stands.forEach((l, m) => insts(h, 'stand', skinT, l, { a: [m] }));
      const screens = [[240, 70], [1250, 110], [1600, 140]];

      // the crowd (arms raised, ola): src/render/crowd.js, shared with the stadium
      // shortcut: the ola follows the car the scenery receives (the player's), not the race leader's
      const crowdRig = PLACERS.crowd(h, { ola: { mods: olaI, wd: 14, profData: 27.8, slope: Math.atan2(14, 24), y: 10, z: 14, gap: (k, car) => Math.max(0, 1 - Math.abs((olaI[k][7] - car.idx + N * 1.5) % N - N / 2 - 14) / 28) }, // wave centered on 14 samples (28 m) in front of the car
        tiers: [{ mat: crowd, f1: 0.0021, f2: 0.0057, ph: 0, cutoff: 0.7 }, { mat: crowd2, f1: 0.0017, f2: 0.0049, ph: 2, cutoff: 0.5 }],
        placards: { double: [['ALLEZ !', '#f4f0e0', '#e83f8c'], ['VAS-Y !', '#ffc04a', '#1a1420'], ['BRAVO !', '#2aa39a', '#f4f0e0']], headEl: [['N°1', '#ffc04a', '#1a1420'], ['EN TÊTE !', '#e83f8c', '#f4f0e0']], impact: [['AÏE !', '#f4f0e0', '#1a1420'], ['OUCH', '#1a1420', '#ffc04a']] } });

      // --- the car park behind the grandstands: thousands of cars, motorhomes at the end of the bends ---
      const autoList = [], cc = [], TINT = [0xf4f0e0, 0x1a1a1e, 0xc8102e, 0x9aa0a8, 0x1848c8, 0x5a5e66, 0xd8d0c0, 0x2a5a3a, 0xffc04a];
      const batches = [[-260, 1780, -240, -178], [-260, 1780, 398, 460], [1960, 2100, -200, 420], [-580, -440, -200, 420]], slabs = [];
      batches.forEach(([x0, x1, z0, z1], n) => {
        slabs.push([(x0 + x1) / 2, g.hAt((x0 + x1) / 2, (z0 + z1) / 2) - 0.3, (z0 + z1) / 2, 0, x1 - x0, 1, z1 - z0]);
        for (let z = z0 + 6; z < z1 - 4; z += 8.5) for (let x = x0 + 2; x < x1 - 2; x += 2.5) {
          const r = rnd(); if (r > 0.86) continue;
          if (n > 1 && r < 0.05) { cc.push([x + 3, g.hAt(x, z), z, (z | 0) % 2 ? 0 : Math.PI, 1, 1, 1, TINT[(r * 977 | 0) % TINT.length]]); x += 6; continue; }
          autoList.push([x, g.hAt(x, z) + 0.65, z + ((z | 0) % 2 ? 2.4 : -2.4), 1.5708, 1, 1, 1, TINT[(r * 977 | 0) % TINT.length]]);
        }
      });
      // and in the grass in the middle, the campers: two rows of motorhomes along the inner fence, in groups, then clusters further off
      const poly = S.filter((s, i) => i % 8 === 0), inner = (x, z) => { let c = false; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const p = poly[a], q = poly[b]; if ((p.z > z) !== (q.z > z) && x < (q.x - p.x) * (z - p.z) / (q.z - p.z) + p.x) c = !c; } return c; };
      const free = (x, z) => [[20, 60, 140], ...screens.map(([a, b]) => [a, b, 30])].every(([cx, cz, r]) => Math.hypot(x - cx, z - cz) > r);
      for (let i = 100; i < N - 130; i += 4) for (const off of [W + 19, W + 28]) {
        const s = S[i], [x, z] = edgePt(s, 1, off); if ((i >> 2) % 8 === 0) continue; // a gap every 8 motorhomes
        if (inner(x, z) && g.dAt(x, z) > off - 1.5 && free(x, z)) cc.push([x, g.hAt(x, z), z, Math.atan2(-s.tz, s.tx), 1, 1, 1, TINT[(i * 7 + off | 0) % TINT.length]]);
      }
      for (let n = 0; n < 70; n++) {
        const x0 = -150 + rnd() * 1900, z0 = -60 + rnd() * 340, a = rnd() * 3.14;
        for (let m = 0; m < 6; m++) { const x = x0 + Math.cos(a) * m * 4, z = z0 - Math.sin(a) * m * 4; if (inner(x, z) && g.dAt(x, z) > W + 45 && free(x, z)) cc.push([x, g.hAt(x, z), z, a + 1.5708, 1, 1, 1, TINT[(n + m) % TINT.length]]); }
      }
      const lacquer = h.mat('lacquer'), ga = h.clothe(h.geo('auto'), lacquer), retain = [...Array(24).keys()].filter(i => i < 12 || i > 15); // without the underside (set on the ground, never seen): the car park cars are half the triangles of the map
      for (const n in ga.attributes) { const a = ga.attributes[n]; ga.setAttribute(n, new THREE.Float32BufferAttribute(retain.flatMap(i => Array.from(a.array.slice(i * a.itemSize, (i + 1) * a.itemSize))), a.itemSize)); }
      ga.setIndex(Array.from(ga.index.array).filter((_, k) => k < 18 || k > 23).map(i => i > 15 ? i - 4 : i)); ga.clearGroups();
      const ma = inst(h, ga, lacquer, autoList); autoList.forEach((p, i) => ma.setColorAt(i, new THREE.Color(p[7]))); ma.instanceColor.needsUpdate = true;
      [inst(h, h.geo('blk'), h.mat('parking'), slabs), ma, ...insts(h, 'campingCar', { carBody: h.mat('campingCar'), bandStrip: h.mat('paint', { c: 0xffffff }), pane: h.mat('paneDark'), tire: h.mat('tire') }, cc, { tintMat: 'bandStrip' })]
        .forEach(m => { m.castShadow = false; }); // far behind the grandstands: their shadow would not show

      // --- the pit stands, on the inside of the start: pit lane, team garages ---
      const bayIdx = [], E = [0xe83f8c, 0x1848c8, 0xffc04a, 0x2aa39a, 0xc8102e, 0xf4f0e0, 0xff7a3d, 0x3d2a5c];
      h.ribbon(N - 110, 200, W + 0.3, 0.04, W + 19, 0.04, h.mat('asphalt', { side: THREE.DoubleSide }), 8);
      for (let j = 0, i = N - 106; j < 32; j++, i = (i + 6) % N) {
        const s = S[i], [x, z] = edgePt(s, 1, W + 21); bayIdx.push([x, s.y, z, Math.atan2(-s.tz, s.tx), 1, 1, 1, E[j % E.length]]); // local Z toward the inside of the oval
      }
      insts(h, 'garage', { concretePart: h.mat('stucco'), door: h.mat('garageOpen', GLOW), signboard: h.mat('paint', { emis: 1, c: 0xffffff }), roofM: h.mat('matGray') }, bayIdx, { tintMat: 'signboard' });
      for (let i = N - 100; i < N + 90; i += 40) { const s = S[i % N], [x, z] = edgePt(s, 1, W + 10); h.emis(i % N, x, s.y + 14, z, 0xfff4e0, 32, 0.45); } // the pit lane is lit, but no more: the wet roadway reflects every lamp
      // timing tower and position pylon, behind the garages
      const label = h.mat('written', GLOW, 128, 32, '#1a1420', '#ff7a3d', 'CANAL 6', 26), score = h.mat('pylonTimer', GLOW);
      h.pose('timerTower', { concretePart, vipBox: h.mat('vipBoxes', GLOW), label }, h.scene, [-30, g.hAt(-30, 90), 90]);
      h.pose('pylonScore', { steelMat, screen: score }, h.scene, [60, g.hAt(60, 75), 75]);
      // giant leaderboard screens in the middle grass, facing the two straights
      const screen = h.mat('ranking', GLOW);
      for (const [x, z] of [[240, 70], [1250, 110], [1600, 140]]) if (g.dAt(x, z) > W + 22) h.pose('screenGiant', { steelMat, concretePart, screen }, h.scene, [x, g.hAt(x, z), z]);
      // sponsor gantries over the track
      for (const [i, t] of [[520, 'SOLAR COLA 500'], [1560, 'PALM TIRES · DUSK RADIO']]) h.pose('gantryAd', { screen: h.mat('screenAd', GLOW, '#ffc04a', t), concretePart: steelMat }, marker(h, S[i]), [0, 0, 0], W);
      // floodlight masts on the inside: they light the roadway
      const masts = [];
      for (let i = 30; i < N; i += 55) { const s = S[i], [x, z] = edgePt(s, 1, s.w + 9); if (g.dAt(x, z) < s.w + 7) continue; masts.push([x, g.hAt(x, z), z, 0]); const [lx, lz] = edgePt(s, 1, W - 2); h.emis(i, lx, s.y + 16, lz, 0xfff0d8, 45, 0.6); }
      insts(h, 'mastLighting', { steelMat, lampObj }, masts);
      // a few palm trees between the track and the grandstands
      const trunks = [], fronds = [];
      for (let i = 10; i < N; i += 37) { const s = S[i], [x, z] = edgePt(s, -1, s.w + 8); if (g.dAt(x, z) < s.w + 6) continue; const y = g.hAt(x, z), ht = 13 + rnd() * 5; trunks.push([x, y + ht / 2, z, 0, 1, ht, 1]); fronds.push([x, y + ht, z, rnd() * 6]); }
      inst(h, h.geo('trunkPalmtree'), h.mat('trunkPalmtree'), trunks); insts(h, 'fronds', { frond: h.mat('frond', { side: THREE.DoubleSide }) }, fronds);

      // --- the canal mud (pts 3-4): where the road widens (M.wide), everything beyond the asphalt is mud (M.surf.wide: the physics rolls it like earth) ---
      const b0 = pt(h, 3) - 40, b1 = pt(h, 4) + 40, mud = h.mat('noise', { side: THREE.DoubleSide, gloss: 0.3 }, '#4a3b2a', ['#3a2c1e', '#5e4a32', '#2a2016', '#6a5a44']);
      for (const sd of [-1, 1]) h.ribbon((b0 + N) % N, b1 - b0, s => sd * (W - 0.05), 0.02, s => sd * s.w, 0.02, mud, 6);
      // --- the return lock (pt 16): the M.jumps ramp rises between two side walls and ends cleanly under the operating footbridge; the last 8 metres in chevrons (the signal of the relief maps) ---
      { const i = pt(h, h.M.jumps[0][0]), s = S[i];
        h.pose('lock', { concretePart, wood: h.mat('boards'), steelMat, redTone: h.mat('paint', { c: 0xc8102e }) }, marker(h, s), [0, 0, 0], s.w);
        h.ribbon((i - 4 + N) % N, 4, -W + 0.6, 0.05, W - 0.6, 0.05, h.mat('bannerJump', { emis: 1, rep: [4, 1] }), 3.5); h.emis(i, s.x, s.y + 11, s.z, 0xffd8a0, 36, 0.5); }

      // --- the outbound leg (pts 1-6), in front of the north stand: the meeting parade between the fence and the terraces. A float every 120 m, and in between,
      // the band in ranks of four (red uniforms) led by a line of baton twirlers (blue and pink); everyone walks in the direction of the race ---
      const floats = [], fanfare = [], majorettes = [], wire = (i, off) => { const s = S[(Math.round(i) + N) % N], [x, z] = edgePt(s, -1, s.w + off); return [x, s.y + h.TH.wallH, z, Math.atan2(-s.tz, s.tx)]; }; // on the walkway, at the level of the top of the low wall: on the ground, the low wall hid them
      { const a0 = pt(h, 1) - 20, cnt = pt(h, 6) - a0, slab = h.mat('concretePart', { side: THREE.DoubleSide }); // the parade walkway: a concrete terrace from the low wall to the facade of the terraces
        h.ribbon(a0, cnt, s => -(s.w + 0.3), h.TH.wallH, s => -(s.w + 11.6), h.TH.wallH, slab, 8); h.ribbon(a0, cnt, s => -(s.w + 11.6), h.TH.wallH, s => -(s.w + 11.6), -3, slab, 8); }
      const TINTC = [0xe83f8c, 0xffc04a, 0x2aa39a, 0x1848c8, 0xff7a3d];
      for (let i = pt(h, 1), k = 0; i < pt(h, 6) - 40; i += 60, k++) {
        floats.push([...wire(i, 5.2), 1, 1, 1, TINTC[k % TINTC.length]]);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) fanfare.push([...wire(i + 9 + r * 0.7, 3.4 + c * 1.1), 1, 1, 1, 0xc8102e]);
        for (let c = 0; c < 6; c++) majorettes.push([...wire(i + 13, 3 + c * 0.9), 1, 1, 1, c % 2 ? 0xe83f8c : 0x1848c8]);
      }
      const whiteN = h.mat('paint', { c: 0xf4f0e0 }), checker = h.mat('checker', { emis: 1, net: 1, side: THREE.DoubleSide }, '#f4f0e0');
      const skinF = { whiteN, skin: h.mat('paint', { c: 0xc8926a }), holdTime: h.mat('paint', { c: 0xffffff }), gold: h.mat('paint', { c: 0xe0b040 }) };
      insts(h, 'extra', skinF, fanfare, { a: [0], tintMat: 'holdTime' }); insts(h, 'extra', skinF, majorettes, { a: [1], tintMat: 'holdTime' });
      insts(h, 'charMeeting', { carBody: h.mat('lacquer', { c: 0xf4f0e0 }), pane: h.mat('paneDark'), whiteN, deco: h.mat('paint', { c: 0xffffff }), flagCube: checker, tire: h.mat('tire') }, floats, { tintMat: 'deco' });

      // --- the return leg (pts 13-18), in front of the south stand: a hedge of chequered flags on both sides, and far to the west, in the sunset ahead,
      // the meeting's hot-air balloons (outside the fog: coloured silhouettes against the orange sky) ---
      const masts2 = []; for (let i = pt(h, 13), k = 0; i < pt(h, 18); i += 14, k++) { const s = S[i], sd = k % 2 ? 1 : -1, [x, z] = edgePt(s, sd, s.w + 3); masts2.push([x, g.hAt(x, z), z, Math.atan2(-s.tz, s.tx) + Math.PI]); }
      insts(h, 'matChecker', { steelMat, flagCube: checker }, masts2);
      const balloons = [], gondolas = [], TINTB = [0xe83f8c, 0xffc04a, 0x2aa39a, 0x1848c8, 0xc8102e, 0xf4f0e0, 0x3d2a5c];
      for (let k = 0; k < 16; k++) { const x = -330 - rnd() * 380, z = 280 + rnd() * 420, y = 60 + rnd() * 140, r = 18 + rnd() * 8; // within 2 350 m of the track: beyond that, behind the sky
        balloons.push([x, y, z, rnd() * 6, r, r, r, TINTB[k % TINTB.length]]); gondolas.push([x, y - r * 1.15 - 3, z, 0, 1.8, 1.4, 1.8]); }
      const mb = inst(h, h.geo('balloon'), h.mat('paint', { c: 0xffffff, fog: false }), balloons); balloons.forEach((p, i) => mb.setColorAt(i, new THREE.Color(p[7]))); mb.instanceColor.needsUpdate = true;
      inst(h, h.geo('boxMesh', 1, 1, 1), h.mat('boards', { fog: false }), gondolas);
      // the meeting's airship, slowly circling above the oval
      const dmgP = new THREE.Group(); dmgP.userData.dyn = 1; h.scene.add(dmgP); // dyn: it flies, outside the merge of the fixed scenery (game.js)
      h.pose('envelope', h.mat('lacquer', { c: 0xe8e4dc }), dmgP);
      h.pose('airship', { gondola: h.mat('matGray'), tailFin: h.mat('paint', { c: 0xe83f8c }), screen: h.mat('written', GLOW, 128, 26, '#1a1420', '#ffc04a', 'SOLAR COLA', 20) }, dmgP);
      // the downtown towers to the west, backlit against the sun
      const lapCount = h.mat('towerFar', { emis: 1, fog: false }, '#2a1c3a', ['#ffc04a'], 40);
      for (let i = 0; i < 34; i++) { const hh = 120 + rnd() * rnd() * 380, w = 50 + rnd() * 70; boxMesh(h, lapCount, w, hh, w, -2300 + rnd() * 900, hh / 2, -500 + rnd() * 1300); }
      // the crowd moves: each tier of the stands occasionally switches to its arms-raised variant; the airship makes a circuit in about twenty minutes
      return (dt, now, car) => {
        crowdRig(dt, now, car);
        const t = now * 0.00006; dmgP.position.set(760 + Math.cos(t) * 520, 125, 110 + Math.sin(t) * 260); dmgP.rotation.y = -t - Math.PI / 2;
      };
    },
  });
})();
