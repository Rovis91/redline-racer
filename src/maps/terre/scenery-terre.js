// Placement of the scenery for "terre": adds its function to SCENERY. The shared placers come from scenery.js. See docs/methods/SCENERY.md.
(function () {
  const { inst, near, pt, indexed, insts, GLOW, boxMesh, edgePt, marker, weld, terrain } = PLACERS;

  Object.assign(SCENERY, {
    // ---------- Spéciale des Ocres: an end-of-day rally special. Garrigue, umbrella pines, olives and cypresses, roadside banks, vines and lavender, ochre buttes;
    // start service park, spectators on banks all along, banners, parked cars, the ford, the hamlet and its patch of tarmac, isolated farmhouses, a hilltop village and its chapel ----------
    terre(h) {
      const { THREE, S, N, W, rnd } = h, [[g0, g1], [b0, b1]] = h.M.surf.zones, between = (i, a, n) => (i - a + 2 * N) % N <= n, m = i => S[(i + 2 * N) % N];
      const iG = (pt(h, g0) + pt(h, g1)) >> 1, iB = pt(h, b0), nB = (pt(h, b1) - iB + N) % N;
      // flatPart(i): where the ground stays level with the road (ford, hamlet with its mill and pasture, start service park); elsewhere the verges rise into banks
      const flatPart = i => between(i, iG - 30, 60) || between(i, iB - 60, nB + 80) || between(i, -50, 130), park = i => between(i, -50, 130);
      const sub = S.filter((_, i) => i % 4 === 0), nearby = (x, z) => { let b = 0, bd = 1e18; for (let k = 0; k < sub.length; k++) { const d = (sub[k].x - x) ** 2 + (sub[k].z - z) ** 2; if (d < bd) { bd = d; b = k; } } return [Math.sqrt(bd), b * 4]; };
      const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      // the hilltop village: on a flat-topped mound, at the point of the footprint farthest from the road
      let vx = 0, vz = 0, vd = 0, bx = [1e9, 1e9, -1e9, -1e9]; for (const s of S) bx = [Math.min(bx[0], s.x), Math.min(bx[1], s.z), Math.max(bx[2], s.x), Math.max(bx[3], s.z)];
      for (let x = bx[0]; x <= bx[2]; x += 20) for (let z = bx[1]; z <= bx[3]; z += 20) { const d = nearby(x, z)[0]; if (d > vd) { vd = d; vx = x; vz = z; } }
      // roadside relief: earth banks at the edge of the road (up to 3.5 m, in places only), hills beyond, the village mound
      const relief = (x, z) => { const [d, i] = nearby(x, z), w = S[i].w; if (d < w + 3) return 0; // w: the half-width where one drives (sim.js: s.w, wider at the start and at the hairpin)
        const n1 = Math.max(0, Math.sin(x * 0.031 + 1) * Math.cos(z * 0.027) + 0.5 * Math.sin(x * 0.07 + z * 0.05)), n2 = 0.5 + 0.5 * Math.sin(x * 0.011 + 2) * Math.cos(z * 0.009 + 1);
        return (flatPart(i) ? 0 : 3.5 * n1 * ss(w + 3, w + 16, d)) + 16 * n2 * ss(50, 220, d) + 18 * (1 - ss(38, 110, Math.hypot(x - vx, z - vz))) * ss(30, 70, d); };
      const g = terrain(h, { stepSec: 8, margin: 420, isFar: 45, waterfall: -0.1, mat: h.mat('terreOchre'), hollow: (x, z) => -relief(x, z) });
      const occ = [], empty = (x, z, r) => occ.every(o => (o[0] - x) ** 2 + (o[1] - z) ** 2 > (o[2] + r) ** 2), takes = (x, z, r) => empty(x, z, r) && (occ.push([x, z, r]), true); // what is already placed: nothing overlaps
      const ground = (x, z, dy = 0) => g.hAt(x, z) + dy, chance = () => [g.box[0] + rnd() * (g.box[2] - g.box[0]), g.box[1] + rnd() * (g.box[3] - g.box[1])];
      // the ford: the stream crosses the road at the low point of the trackPath. Over the whole wet area of the map (sim.js: surf.zones, where the car skids), dark mud and water-filled ruts, blended into dry earth at both ends;
      // in the middle, over the full wet area (54 m), brown-green, glossy water (reflections of sun and headlights), with a line of foam at the entry and exit; on either side, the stream bed, its pebbles and reeds
      const iG0 = pt(h, g0), nG = (pt(h, g1) - iG0 + N) % N, glassMat = { transparent: true, depthWrite: false, side: THREE.DoubleSide };
      const water = h.mat('waterGue', { ...glassMat, opacity: 0.92, rep: [4, 1] }), waterR = h.mat('waterGue', { ...glassMat, opacity: 0.92, rep: [18, 1] }), foam = h.mat('foam', { ...glassMat, rep: [6, 1] });
      h.ribbon((iG0 - 9 + N) % N, nG + 18, s => -s.w, 0.025, s => s.w, 0.025, h.mat('mudGue', glassMat), 2 * (nG + 18)).renderOrder = -3; // v from 0 to 1 along the full length: the texture fades out at both ends
      h.ribbon(iG0, nG, s => -s.w - 0.5, 0.07, s => s.w + 0.5, 0.07, water, 8).renderOrder = -2; // the sheet covers the full wet area: where game.js makes the burst start. negative renderOrder: the (transparent) water is drawn before the spray; otherwise it covered it
      for (const i of [iG0 - 1, iG0 + nG - 1]) h.ribbon((i + N) % N, 2, s => -s.w - 0.5, 0.08, s => s.w + 0.5, 0.08, foam, 4).renderOrder = -1;
      h.pose('boxMesh', waterR, marker(h, S[iG]), [0, -0.2, 0], 90, 0.3, 12); // the bed, 12 m wide, under the road sheet
      const readQ = (sd, off, a) => { const s = S[iG], [x, z] = edgePt(s, sd, off); return [x + s.tx * a, z + s.tz * a]; }, pebbles = [], reeds = [];
      for (let k = 0; k < 70; k++) { const sd = k & 1 ? 1 : -1, [x, z] = readQ(sd, S[iG].w + 1.5 + rnd() * 34, (rnd() < 0.5 ? -1 : 1) * (5.5 + rnd() * 2)), l = 0.5 + rnd() * 0.8; pebbles.push([x, ground(x, z, -0.25 * l), z, rnd() * 6, l, l * 0.6, l]); }
      for (let k = 0; k < 140; k++) { const sd = k & 1 ? 1 : -1, [x, z] = readQ(sd, S[iG].w + 3 + rnd() * 32, (rnd() < 0.5 ? -1 : 1) * (6.5 + rnd() * 3)), e = 1.1 + rnd() * 1; reeds.push([x, ground(x, z, 0.6 * e), z, rnd() * 6, 1, e, 1]); }
      for (let k = 0; k < 16; k++) { const sd = k & 1 ? 1 : -1, [x, z] = readQ(sd, S[iG].w + 0.4, -7 + k * 0.9); pebbles.push([x, S[iG].y, z, rnd() * 6, 0.5, 0.45, 0.5]); } // pebbles on the line of the edge bank, which breaks off above the bed
      inst(h, h.geo('knoll'), h.mat('stone', { c: 0xe8e0d0 }), pebbles); inst(h, h.geo('boxMesh', 0.12, 1.2, 0.12), h.mat('foliage', { c: 0x5a7a30 }), reeds).castShadow = false;
      // track edges, aligned with the limit where one drives (s.w, where sim.js stops the car): a bank of packed earth that rises to the height of the low wall and hides the guardrail, drops back into the garrigue;
      // in the hamlet, a dry-stone low wall; on the stream bed, nothing (the pebbles). At the wide sections (start, hairpin), the beaten earth extends up to the bank
      const HT = h.TH.wallH + 0.08, embankM = h.mat('embankCircuit', { side: THREE.DoubleSide }), lowwallM = h.mat('stone', { side: THREE.DoubleSide }), type = i => between(i, iG - 4, 8) ? 0 : between(i, iB, nB) ? 2 : 1;
      for (let i0 = 0; i0 < N;) { const ty = type(i0); let n = 1; while (i0 + n < N && type(i0 + n) === ty) n++;
        for (const sg of [-1, 1]) if (ty === 1) { h.ribbon(i0, n, s => sg * (s.w - 0.45), 0.02, s => sg * s.w, HT, embankM, 6); h.ribbon(i0, n, s => sg * s.w, HT, s => sg * (s.w + 1.4), -0.5, embankM, 6); }
          else if (ty === 2) { h.ribbon(i0, n, s => sg * (s.w - 0.1), 0, s => sg * s.w, HT, lowwallM, 4); h.ribbon(i0, n, s => sg * s.w, HT, s => sg * (s.w + 0.55), HT, lowwallM, 4); h.ribbon(i0, n, s => sg * (s.w + 0.55), HT, s => sg * (s.w + 0.55), -0.5, lowwallM, 4); }
        i0 += n; }
      const wd = h.mat('terreCircuit', { transparent: true, side: THREE.DoubleSide });
      for (let i0 = 0; i0 < N;) { if (S[i0].w < W + 0.3) { i0++; continue; } let n = 1; while (i0 + n < N && S[i0 + n].w >= W + 0.3) n++;
        for (const sg of [-1, 1]) h.ribbon((i0 - 1 + N) % N, n + 1, sg * (W - 1.6), 0.012, s => sg * s.w, 0.012, wd, 6).renderOrder = -3; // (before the particles, like the ford water)
        i0 += n; }
      // the hamlet: the earth gives way to a stretch of tarmac between stone farmhouses
      const skinM = { intoWall: h.mat('stone'), roofM: h.mat('tilesCanal'), shutter: h.mat('paint', { c: 0x6a8ab8 }) }, farm = [], cypress = [], pines = [], shafts = [], oliveTrees = [], bushes = [];
      const cyp = (x, z) => { const e = 0.6 + rnd() * 0.5; cypress.push([x, ground(x, z, 7.3 * e), z, rnd() * 6, 0.38 * e, e, 0.38 * e]); };
      h.ribbon(iB, nB, -W + 0.2, 0.05, W - 0.2, 0.05, h.mat('roadway', {}, '#4c4c52', '#58585e', '#e8e4d8', '#4c4c52', '#4c4c52', '#4c4c52', false), 32);
      for (let k = 0; k < 9; k++) { const s = m(iB + 4 + Math.round(k * (nB - 8) / 8)), sd = k & 1 ? 1 : -1, [x, z] = edgePt(s, sd, W + 7 + (k % 3) * 2); farm.push([x, s.y - 0.5, z, h.across(s)]); occ.push([x, z, 9]);
        if (k % 3 === 0) cyp(...edgePt(s, sd, W + 17)); }
      for (let i = iB - 40; i < iB + nB + 60; i += 14) { const [x, z] = edgePt(m(i), -1, W + 2.2); shafts.push([x, ground(x, z, 3.6), z, 0, 0.5, 1.4, 0.5]); } // telephone poles along the hamlet
      // the start service park, to the right of the start straight: two rows of marquees, a van behind each, a race car under every other one
      const TINT = [0xe8482a, 0xf4f0e0, 0x2a62c8, 0xf4c020, 0x3a7a3a, 0xf08a2a], barnums = [], vans = [], autoList = [], auto = (x, z, a, c) => autoList.push([x, ground(x, z), z, a, 1, 1, 1, c]);
      for (let k = 0; k < 14; k++) { const tier = k & 1, s = m(-44 + (k >> 1) * 16 + tier * 8), a = h.across(s), [x, z] = edgePt(s, 1, s.w + 8 + tier * 17), [fx, fz] = edgePt(s, 1, s.w + 15 + tier * 17);
        barnums.push([x, s.y - 0.45, z, a - Math.PI / 2, 1, 1, 1, TINT[k % 6]]); vans.push([fx, s.y - 0.5, fz, a + Math.PI / 2 + (rnd() - 0.5) * 0.5, 1, 1, 1, TINT[(k + 1) % 6]]); occ.push([x, z, 6], [fx, fz, 4]);
        if (k % 2 === 0) autoList.push([x, s.y - 0.45, z, a + Math.PI / 2, 1, 1, 1, TINT[(k + 2) % 6]]); }
      // the spectators: a bank on the outside of each bend, another now and then along the straights, opposite the park and at the crest landings; straw bales at the foot, cars parked behind
      const embank = [], bales = [], pan = [], crest = h.M.jumps.map(([p]) => pt(h, p));
      const group = (i, sd, nbr) => { for (let k = 0; k < nbr; k++) { const t = m(i + Math.round((k - (nbr - 1) / 2) * 8)), [x, z] = edgePt(t, sd, t.w + 6.5); embank.push([x, Math.max(t.y, ground(x, z)) - 0.4, z, h.across(t) + Math.PI / 2, 1, 1, 1, i]); occ.push([x, z, 8]); }
        for (let dk = -nbr * 4 - 1; dk <= nbr * 4 + 1; dk += 2) { const t = m(i + dk), [x, z] = edgePt(t, sd, t.w + 1.9); bales.push([x, t.y - 0.1, z, h.across(t)]); }
        for (let dk = -nbr * 4; dk <= nbr * 4; dk += 4) { const t = m(i + dk), [x, z] = edgePt(t, -sd, t.w + 0.45); pan.push([x, t.y + 1.45, z, h.across(t) + Math.PI / 2]); } // banners opposite, above the low wall
        for (let k = 0; k < nbr + 1; k++) { const t = m(i - nbr * 4 + k * 7), [x, z] = edgePt(t, sd, t.w + 15 + rnd() * 5); if (takes(x, z, 3.5)) auto(x, z, h.across(t) + (rnd() - 0.5), TINT[(i + k) % 6]); } };
      const taken = i => embank.some(t => between(i, t[7] - 34, 68)), free = i => !between(i, iG - 22, 44) && !between(i, iB - 14, nB + 64) && !park(i); // neither at the ford, nor at the hamlet and its pasture, nor at the park
      for (const i of [-30, 0, 30, 60]) group(i, -1, 3); // the earth grandstand facing the park
      for (const i of crest) for (const sd of [-1, 1]) group(i + 22, sd, 2);
      for (let i = 0; i < N; i++) { const s = S[i], k = Math.abs(s.k); if (k >= 0.012 && k >= Math.abs(m(i + 1).k) && k >= Math.abs(m(i - 1).k) && free(i) && !taken(i)) group(i, s.k > 0 ? -1 : 1, k > 0.022 ? 3 : 2); } // the outside: to the left of a right-hand bend
      for (let i = 0, sd = 1; i < N; i += 20) if (free(i) && !taken(i)) group(i, sd = -sd, 1);
      for (let i = -48; i < 80; i += 4) for (const sd of [-1, 1]) { const t = m(i), [x, z] = edgePt(t, sd, t.w + 0.45); pan.push([x, t.y + 1.45, z, h.across(t) + Math.PI / 2]); }
      for (const i of crest) for (let dk = -44; dk < -4; dk += 4) for (const sd of [-1, 1]) { const t = m(i + dk), [x, z] = edgePt(t, sd, t.w + 0.45); pan.push([x, t.y + 1.45, z, h.across(t) + Math.PI / 2]); }
      const crowd = h.mat('crowd', {}, '#8a5a34', '#e8482a'); crowd.map.anisotropy = 8;
      insts(h, 'embankPublic', { embank: h.mat('terreOchre'), ribbonFn: h.mat('bannerRallye', {}, 0), crowd }, embank);
      const pan1 = pan.filter((p, k) => !pan.slice(0, k).some(q => (p[0] - q[0]) ** 2 + (p[2] - q[2]) ** 2 < 7.5 * 7.5)); // groups and rows sometimes place a banner at the same spot: only one per place, otherwise two textures fight
      inst(h, h.geo('boxMesh', 7.6, 0.9, 0.1), h.mat('bannerRallye', { side: THREE.DoubleSide }, 2), pan1).castShadow = false; // 7.6 m every 8 m: a gap of one day, no overlap in bends
      // crest gantries, 30 m before the end, in the special's colors: the crest reads from the relief, the gantry and the crowd, without ground marking
      insts(h, 'gantryJump', { steelMat: h.mat('steelMat'), streamer: h.mat('bannerRallye', { side: THREE.DoubleSide, rep: [2, 1] }, 4) }, crest.map(i => { const s = m(i - 15); return [s.x, s.y, s.z, h.across(s)]; }), { a: [W] });
      // pts 18-22: the television helicopter, hovering at 26 m above the right edge of the track, nose toward it; it sways, the rotor turns (animated below)
      const sH = m(pt(h, 20)), [hx, hz] = edgePt(sH, 1, 5), heli = new THREE.Group(), rotor = new THREE.Group(), hy = sH.y + 26; heli.userData.dyn = 1; h.scene.add(heli); // dyn: it moves, outside the fixed scenery merge (game.js)
      heli.position.set(hx, hy, hz); heli.rotation.y = h.across(sH) + Math.PI; rotor.position.y = 1.65; heli.add(rotor);
      const skinH = { carBody: h.mat('paint', { c: 0xe8482a }), pane: h.mat('paneDark'), chassis: h.mat('matGray'), rotorBlade: h.mat('matGray') };
      h.pose('chopper', skinH, heli); h.pose('rotorHeli', skinH, rotor);
      // pts 62-68: at the hamlet entrance, a ruined windmill on the most open side; at the exit, a flock of sheep in its pasture and the shepherd, in front of the fence, waving at the cars
      const sideOf = s => g.dAt(...edgePt(s, 1, 40)) > g.dAt(...edgePt(s, -1, 40)) ? 1 : -1, face = (s, sd) => h.across(s) + (sd > 0 ? Math.PI : 0); // facing: the +X axis of a shape turned toward the road
      const sM = m(pt(h, 62) + 4), dM = sideOf(sM), [mx, mz] = edgePt(sM, dM, W + 26), wood = h.mat('boards'), stone = h.mat('stone'); occ.push([mx, mz, 9]);
      inst(h, h.geo('millTower'), h.mat('stone', { side: THREE.DoubleSide, c: 0xb89a78 }), [[mx, ground(mx, mz, -0.4), mz, 0, 1.4]]); // darker stone than the farmhouses: it stands out against the sky
      insts(h, 'millRuin', { wood, stone }, [[mx, ground(mx, mz, -0.4), mz, face(sM, dM), 1.4]]); // at scale 1.4: a 12.6 m tower
      const sP = m(pt(h, 68) + 8), dP = sideOf(sP), along = (s, sd, off, a) => { const [x, z] = edgePt(s, sd, off); return [x + s.tx * a, z + s.tz * a]; }, P0 = W + 6, PL = 21, PA = 28; // the pasture: from P0 to P0 + PL across, PA along the road
      const fencePts = [], flock = [], seg = 7, aTr = h.across(sP), aLg = aTr + Math.PI / 2;
      for (let a = -PA / 2 + seg / 2; a < PA / 2; a += seg) for (const off of [P0, P0 + PL]) { const [x, z] = along(sP, dP, off, a); fencePts.push([x, ground(x, z), z, aLg]); }
      for (let o = seg / 2; o < PL; o += seg) for (const a of [-PA / 2, PA / 2]) { const [x, z] = along(sP, dP, P0 + o, a); fencePts.push([x, ground(x, z), z, aTr]); }
      for (let k = 0; k < 18; k++) { const [x, z] = along(sP, dP, P0 + 2 + rnd() * (PL - 4), (rnd() - 0.5) * (PA - 4)); flock.push([x, ground(x, z), z, rnd() * 6, 0.9 + rnd() * 0.25]); }
      { const [x, z] = along(sP, dP, P0 + PL / 2, 0); occ.push([x, z, 18]); }
      insts(h, 'fence', { wood }, fencePts, { a: [seg] }); insts(h, 'sheep', { wool: h.mat('paint', { c: 0xe4dccb }), headEl: h.mat('paint', { c: 0x2e2620 }) }, flock);
      const [qx, qz] = along(sP, dP, P0 - 1.4, -6), shepherd = new THREE.Group(), armPart = new THREE.Group(); shepherd.userData.dyn = 1; h.scene.add(shepherd);
      shepherd.position.set(qx, ground(qx, qz), qz); shepherd.rotation.y = face(sP, dP); shepherd.scale.setScalar(1.15); armPart.position.set(0, 1.5, -0.3); shepherd.add(armPart);
      const skinB = { clothes: h.mat('paint', { c: 0x3a6ab0 }), skin: h.mat('paint', { c: 0xc89870 }), hat: h.mat('paint', { c: 0x2e2a24 }), wood };
      h.pose('shepherd', skinB, shepherd); h.pose('armShepherd', skinB, armPart);
      // in the countryside: isolated farmhouses with their cypresses, a chapel at the roadside, the village on its mound around its own mound
      const coping = [];
      for (let k = 0, nbr = 0; k < 900 && nbr < 9; k++) { const [x, z] = chance(), d = g.dAt(x, z); if (d < 26 || d > 70 || flatPart(nearby(x, z)[1]) || !takes(x, z, 13)) continue;
        const a = rnd() * 6; if (nbr++ === 0) coping.push([x, ground(x, z, -0.8), z, a]); else farm.push([x, ground(x, z, -1), z, a]); for (const da of [0.6, 1.1, 3.6]) cyp(x + Math.cos(a + da) * 9, z + Math.sin(a + da) * 9); }
      occ.push([vx, vz, 46]); coping.push([vx, ground(vx, vz, -0.3), vz, 0.4, 1.4]);
      for (let k = 0; k < 22; k++) { const a = k * 2.4, r = 13 + k * 1.15, x = vx + Math.cos(a) * r, z = vz + Math.sin(a) * r; farm.push([x, ground(x, z, -1.2), z, a + (k & 1) * 1.57, 0.9 + rnd() * 0.3]); if (k % 4 === 0) cyp(x + 6, z + 5); }
      insts(h, 'farm', skinM, farm); insts(h, 'chapel', skinM, coping);
      // vines and lavender: plots in rows on the slopes
      const fields = [[], []];
      for (let k = 0, nbr = 0; k < 1500 && nbr < 22; k++) { const [x, z] = chance(), d = g.dAt(x, z); if (d < 36 || d > 170 || !takes(x, z, 24)) continue;
        const a = rnd() * 3.14, t = nbr++ & 1, ca = Math.cos(a), sa = Math.sin(a);
        for (let r = -4; r <= 4; r++) for (let q = -2; q <= 2; q++) { const px = x + ca * q * 7 - sa * r * 3.4, pz = z + sa * q * 7 + ca * r * 3.4; fields[t].push([px, ground(px, pz, 0.25), pz, -a]); } }
      inst(h, h.geo('boxMesh', 7.1, 1.1, 1.1), h.mat('foliage', { c: 0xc8e070 }), fields[0]).castShadow = false; inst(h, h.geo('boxMesh', 7.1, 0.8, 1.5), h.mat('lavender'), fields[1]).castShadow = false;
      // spectator and service cars: one draw pass per part, the tinted body per instance
      const skinV = { carBody: h.mat('lacquer'), pane: h.mat('paneDark'), lightRed: h.mat('lightRed', GLOW), lightWhite: h.mat('lampObj', GLOW), chassis: h.mat('matGray'), wheelPart: h.mat('wheelPart'), tire: h.mat('tire') };
      insts(h, 'carParked', skinV, autoList, { tintMat: 'carBody' }); insts(h, 'van', skinV, vans, { tintMat: 'carBody' });
      insts(h, 'marquee', { pole: h.mat('steelMat'), cloth: h.mat('paint') }, barnums, { tintMat: 'cloth' });
      inst(h, h.geo('bale'), h.mat('straw'), bales.concat(Array.from({ length: 70 }, () => { const [x, z] = chance(), d = g.dAt(x, z); return d > 14 && d < 110 && empty(x, z, 2) ? [x, ground(x, z, -0.1), z, rnd() * 6] : null; }).filter(Boolean)));
      // umbrella pines at the roadside and in groves on the slopes, olives lower down, garrigue bushes everywhere (the same crown, very small, at ground level)
      const pine = (x, z) => { const e = 0.8 + rnd() * 0.7, r = 2.8 + rnd() * 2.2, y = ground(x, z); shafts.push([x, y + 2.6 * e, z, 0, e]); pines.push([x, y + 5.2 * e + 0.25 * r, z, rnd() * 6, r]); };
      const oliveTree = (x, z) => { const e = 0.35 + rnd() * 0.2, r = 1.8 + rnd() * 1.4, y = ground(x, z); shafts.push([x, y + 2.6 * e, z, rnd(), e * 1.6, e, e * 1.6]); oliveTrees.push([x, y + 5.2 * e + 0.5 * r, z, rnd() * 6, r, r * 1.7, r]); };
      for (let i = 0; i < N; i += 4) for (const sd of [-1, 1]) { const [x, z] = edgePt(S[i], sd, S[i].w + 8 + rnd() * 18), q = rnd(); if (q < 0.62 && !flatPart(i) && empty(x, z, 3) && g.dAt(x, z) > W + 6) (q < 0.4 ? pine : q < 0.52 ? oliveTree : cyp)(x, z); }
      for (let k = 0; k < 6500; k++) { const [x, z] = chance(), d = g.dAt(x, z), b = Math.sin(x * 0.021) + Math.cos(z * 0.026) + rnd();
        if (d > 26 && b > 0.9 && empty(x, z, 4)) (rnd() < 0.8 ? pine : oliveTree)(x, z);
        else if (d > W + 3 && d < 190 && d > m(nearby(x, z)[1]).w + 2 && empty(x, z, 1)) { const r = 0.7 + rnd() * 1.3; bushes.push([x, ground(x, z, 0.2), z, rnd() * 6, r]); } }
      inst(h, h.geo('pineParasol'), h.mat('foliage'), pines); inst(h, h.geo('pineParasol'), h.mat('foliage'), bushes).castShadow = false; inst(h, h.geo('pineParasol'), h.mat('foliage', { c: 0xa8c0a0 }), oliveTrees); // bushes, rows and banners cast no shadow: render time for nothing
      inst(h, h.geo('trunk'), h.mat('trunk'), shafts); inst(h, h.geo('cedar'), h.mat('cedar', { c: 0x9ad08a }), cypress);
      // the ochres: fallen boulders at the roadside, nearby buttes, and a crown of cliffs on the horizon, in the dust haze
      const knolls = [], cx = (g.box[0] + g.box[2]) / 2, cz = (g.box[1] + g.box[3]) / 2;
      for (let k = 0; k < 2000 && knolls.length < 110; k++) { const [x, z] = chance(), d = g.dAt(x, z), l = 1.2 + rnd() * 2.6; if (d > m(nearby(x, z)[1]).w + 4 && d < 60 && empty(x, z, l)) knolls.push([x, ground(x, z, -0.4), z, rnd() * 6, l, l * (0.6 + rnd() * 0.5), l * (0.7 + rnd() * 0.6)]); } // boulders, not slabs
      for (let k = 0, nbr = 0; k < 600 && nbr < 20; k++) { const [x, z] = chance(), d = g.dAt(x, z), l = 30 + rnd() * 40; if (d > l + 40 && d < 280 && takes(x, z, l + 40)) { nbr++; knolls.push([x, ground(x, z, -6), z, rnd() * 6, l, 22 + rnd() * 26, l * (0.7 + rnd() * 0.6)]); } }
      for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283 + rnd() * 0.2, r = 1000 + rnd() * 450, l = 170 + rnd() * 190; knolls.push([cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r, rnd() * 6, l, 110 + rnd() * 110, l * (0.7 + rnd() * 0.6)]); }
      inst(h, h.geo('knoll'), h.mat('cliffOchre'), knolls);
      // the stream runs, the crowd raises its arms at times, the helicopter sways under its rotor, the shepherd waves his arm
      return (dt, now) => { rotor.rotation.y = now * 0.025; heli.position.y = hy + Math.sin(now * 0.0011) * 0.6; heli.rotation.z = Math.sin(now * 0.0007) * 0.05; armPart.rotation.x = -2.6 + Math.sin(now * 0.008) * 0.45; water.map.offset.y -= dt * 0.25; waterR.map.offset.x += dt * 0.08; crowd.map.offset.y = Math.sin(now * 0.0023) + Math.sin(now * 0.0061) > 0.6 ? 0.5 : 0; };
    },
  });
})();
