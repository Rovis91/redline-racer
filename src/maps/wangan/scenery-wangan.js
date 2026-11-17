// Placement of the scenery for "wangan": adds its function to SCENERY. The shared placers come from scenery.js. See docs/methods/SCENERY.md.
(function () {
  const { inst, near, pt, indexed, insts, GLOW, boxMesh, edgePt, marker, weld, terrain } = PLACERS;

  Object.assign(SCENERY, {
    // ---------- Wan-9: the city to the north, the channel, the port island to the south. Seafront expressway, cable-stayed bridge, container quays,
    // trench and submerged tunnel under the channel, back into the city. Water exists only where the road passes over it (bridge) or under it (tunnel). ----------
    wangan(h) {
      const { THREE, S, N, W, rnd, T } = h; const puts = (label, skin, list, o = {}) => Object.entries(h.zones(label, skin, ...(o.a || []))).forEach(([zn, g]) => { const G = indexed(h, g), t = zn === o.tintMat, mt = t && Object.assign(skin[zn].clone(), { vertexColors: true }); for (const p of list) { const Gp = t ? G.clone() : G; if (t) { const c = new THREE.Color(p[7]), n = Gp.attributes.position.count, A = new Float32Array(n * 3); for (let i = 0; i < n; i++) A.set([c.r, c.g, c.b], i * 3); Gp.setAttribute('color', new THREE.BufferAttribute(A, 3)); } const m = new THREE.Mesh(Gp, t ? mt : skin[zn]); m.position.set(p[0], p[1], p[2]); m.rotation.y = p[3] || 0; m.scale.set(p[4] || 1, p[5] || p[4] || 1, p[6] || p[4] || 1); m.castShadow = m.receiveShadow = h.TH.sun[1] > 0.6; h.scene.add(m); } }); // like insts, but one mesh per instance: the merge cuts them into 500 m blocks, and those out of view are no longer drawn (a merged instance stays whole)
      const mm = new Map(), M = (n, o = {}, ...a) => { const m = h.mat(n, o, ...a), k = JSON.stringify([n, o, a]); if (n === 'metalPale') m.userData.mc = 1, m.userData.family = 'metalPale'; return o.emis ? m : mm.get(k) || mm.set(k, m).get(k); }; // non-luminous materials shared with equal settings: same image, fewer merged batches (the luminous ones stay apart: rhythm.js modulates them). h.mat is still called: its textures draw on rnd, the scenery must not move
      const CH0 = 62, CH1 = 520, ISLAND = [-880, 1650, 1045], PH = [1568, 958]; // channel between z = CH0 and CH1; the island runs from x = ISLAND[0] to ISLAND[1], up to z = ISLAND[2]; PH: the lighthouse, at the tip of the island, in the hairpin (points 11 to 16)
      const sea = (x, z) => (z > CH0 && z < CH1) || (z >= CH1 && (x < ISLAND[0] || x > ISLAND[1] || z > ISLAND[2]));
      const tun = i => h.zone(i, 0) === 1;
      const CG0 = [880, -60], MQ = 22, basin = (x, z) => z > MQ && z <= CH0 && x > 30 && x < 1040 && Math.abs(x - 620) > 80; // marina basin, dug between the start road and the channel (the big wheel keeps its earth, at x = 620): seen from the road, the boats are 20 m away, not hidden behind the channel quay
      // above the tunnel, the ground stays at quay level: the tube passes beneath; in the access trenches, it follows the road as it descends
      const g = terrain(h, { stepSec: 16, margin: 330, ground: s => tun(S.indexOf(s)) ? 0 : Math.min(s.y, 0), hollow: (x, z) => sea(x, z) || basin(x, z) ? 13 : 0, mat: M('noise', {}, '#1a1c22', ['#22252c', '#14161a', '#2a2622']) });
      { // a 16 m grid ground cannot follow the tube (channel bed, ramps): the triangles that enter the tube or pass over the carriageway of the trenches are removed; from outside, the hull is visible
        const ge = h.scene.children[h.scene.children.length - 1].geometry, P = ge.attributes.position.array, I = ge.index.array, zs = [];
        for (let i = T.t0 - 120; i < T.t1 + 120; i++) { const k = (i + N) % N; if (tun(k) || S[k].y < -0.3) zs.push([S[k], tun(k)]); }
        const inner = (x, y, z, m) => { let b = zs[0], bd = 1e18; for (const e of zs) { const d = (e[0].x - x) ** 2 + (e[0].z - z) ** 2; if (d < bd) { bd = d; b = e; } }
          const [s, t] = b, l = Math.abs((s.x - x) * s.tz - (s.z - z) * s.tx) /* cross offset */, dy = y - s.y; return bd < (W + 30) ** 2 && l < W + 1.6 + m && (y === null || dy > -0.3 && (!t || dy < 8.5)); };
        for (let k = 0; k < I.length; k += 3) {
          const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3;
          if (!inner((P[a] + P[b] + P[c]) / 3, null, (P[a + 2] + P[b + 2] + P[c + 2]) / 3, 30)) continue; // far from the trenches and the tube: nothing to test
          let outOf = true;
          for (let u = 0; u <= 6 && outOf; u++) for (let v = 0; u + v <= 6; v++) { const w = 6 - u - v, f = j => (P[a + j] * u + P[b + j] * v + P[c + j] * w) / 6; if (inner(f(0), f(1), f(2), 0)) { outOf = false; break; } }
          if (!outOf) I[k] = I[k + 1] = I[k + 2] = 0;
        }
        ge.index.needsUpdate = true;
      }
      const water = M('noise', { emis: 1, rep: [300, 300] }, '#071824', ['#0f3b4a', '#0a2836', '#3a2c18']);
      // four water planes: the channel, and the sea to the west, east and south of the island
      boxMesh(h, water, 16000, 1, CH1 - CH0, 0, -3.5, (CH0 + CH1) / 2); boxMesh(h, water, 16000, 1, 8000, 0, -3.5, ISLAND[2] + 4000);
      boxMesh(h, water, 8000, 1, ISLAND[2] - CH1, ISLAND[0] - 4000, -3.5, (CH1 + ISLAND[2]) / 2); boxMesh(h, water, 8000, 1, ISLAND[2] - CH1, ISLAND[1] + 4000, -3.5, (CH1 + ISLAND[2]) / 2);
      // the land continues to the north, beyond the shaped terrain
      const plain = M('plain');
      boxMesh(h, plain, 16000, 1, 8000, 0, -1, g.box[1] - 4000); boxMesh(h, plain, 8000, 1, CH0 - g.box[1], g.box[0] - 4000, -1, (CH0 + g.box[1]) / 2); boxMesh(h, plain, 8000, 1, CH0 - g.box[1], g.box[2] + 4000, -1, (CH0 + g.box[1]) / 2);
      // streetlights: one every 40 m, on both sides; their steady passing gives the speed without any softPuffs.
      // Not in the marina (points 0 to 3: low bollards along the quay) nor in the port (points 9 to 29: the port's floodlight masts, a wild race, not a motorway)
      const masts = [], heads = [], withoutLamp = i => i < pt(h, 3) || (i >= pt(h, 9) && i < pt(h, 29));
      for (let i = 0; i < N; i += 20) {
        if (h.zone(i, 0) === 1 || withoutLamp(i)) continue;
        const s = S[i], ry = h.across(s);
        for (const sd of [-1, 1]) { const [x, z] = edgePt(s, sd, W + 0.8), [tx, tz] = edgePt(s, sd, W - 0.7); masts.push([x, s.y + 5, z, ry]); heads.push([tx, s.y + 10, tz, ry]); }
        { const [lx, lz] = edgePt(s, (i / 20) & 1 ? 1 : -1, W - 0.7); h.emis(i, lx, s.y + 9.6, lz, 0xffa040, 31, 3.2); } // sodium: one orange patch per streetlight, on one side then the other
      }
      inst(h, h.geo('mastLamppost'), M('matGray'), masts);
      inst(h, h.geo('headLamppost'), M('sodium', GLOW), heads);
      // green retroreflective expressway signs: each announces what comes next (bridge, port, tunnel under the channel, center)
      const gray = M('gantryGray'), pan = t => M('signRoad', { emis: 1, retroRefl: 0.7 }, t);
      for (const [ip, a, b] of [[1, '湾岸線 ↑', '橋 BRIDGE 1km'], [3, '橋 BRIDGE', '港 PORT →'], [17, '港 PORT', '出口 EXIT'], [27, '海底トンネル', 'UNDERSEA 1.4km'], [29, '水深 -25m', '危険物 ✕ HAZMAT'], [39, '湾岸線 WAN-9', '都心 CENTER']])
        h.pose('gantryHighway', { structure: gray, signLeft: pan(a), signRight: pan(b) }, marker(h, S[pt(h, ip)]), [0, 0, 0], W);
      // cable-stayed bridge over the channel: two H-shaped pylons, cables running to the deck
      const whiteN = M('whiteBridge'), wires = [], beaconList = [];
      for (const [px, pz] of [[1407, 215], [1402, 430]]) {
        const i0 = near(h, px, pz), s = S[i0];
        h.pose('pylonBridge', { concretePart: whiteN }, marker(h, s), [0, 0, 0], W);
        for (const sd of [-1, 1]) {
          const [ax, az] = edgePt(s, sd, W + 3.5); beaconList.push(ax, s.y + 51, az);
          for (let j = 8; j <= 48; j += 8) for (const dir of [-1, 1]) { const q = S[(i0 + dir * j + N) % N], [bx, bz] = edgePt(q, sd, W + 1); wires.push(ax, s.y + 48 - j * 0.25, az, bx, q.y + 1.4, bz); }
        }
      }
      const fgm = new THREE.BufferGeometry(); fgm.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3)); h.scene.add(new THREE.LineSegments(fgm, new THREE.LineBasicMaterial({ color: 0xc9ced6 })));

      // ---------- the submerged tunnel: access trenches, tunnel portals, ventilation towers, buoys marking the tube across the channel ----------
      const concretePart = M('concretePart'), berm = [];
      for (let i = 0; i < N; i += 4) { // trench retaining walls: from the foot of the road to quay level, topped by a 30 m flat area
        const s = S[i]; if (tun(i) || s.y > -0.3 || s.y < -20) continue;
        for (const sd of [-1, 1]) { const [x, z] = edgePt(s, sd, W + 15.6), ht = 1.4 - s.y; berm.push([x, s.y - 1 + ht / 2, z, h.across(s), 1, ht, 1]); }
      }
      inst(h, h.geo('berm'), M('concreteGray'), berm);
      const headEl = { concretePart, cornice: gray, structure: gray, label: M('written', GLOW, 128, 22, '#0e5a38', '#f4f1e0', '湾岸海底トンネル  WAN-9 UNDERSEA TUNNEL', 9), lights: M('lightsLane', GLOW, 4),
        limit: M('matGray', { visible: false }), signPanel: M('matGray', { visible: false }), structure: M('matGray', { visible: false }) }; // the clearance gauge at the portal is rigid, at 26 m: in the access curve it fell into the wall; placed separately, lower
      for (const [i, rv] of [[T.t0, 0], [T.t1, Math.PI]]) { const r = marker(h, S[i]); r.rotation.y += rv; h.pose('headTunnel', headEl, r, [0, 0, 0], W); }
      for (const [i, rv] of [[T.t0 - 13, 0], [T.t1 + 13, Math.PI]]) { const r = marker(h, S[(i + N) % N]); r.rotation.y += rv; // the clearance gantry, over the road itself, 26 m before each portal
        h.pose('template', { limit: M('striping', GLOW), structure: gray, signPanel: M('written', GLOW, 16, 16, '#f4f0e0', '#c8102e', '4.3m', 7) }, r, [0, 0, 0], W); }
      const shutters = M('shutters'), quay = M('asphalt'), lightsRed = [];
      { const s = S[T.t0], [x, z] = edgePt(s, 1, W + 46), r = marker(h, s); r.position.set(x, g.hAt(x, z), z); h.pose('ventilationTower', { shutters, concretePart }, r, [0, 0, 18], 24); lightsRed.push(x, 46, z); }
      { const s = S[T.t1], [x, z] = edgePt(s, -1, W + 40), r = marker(h, s); r.position.set(x, g.hAt(x, z), z); h.pose('ventilationTower', { shutters, concretePart }, r, [0, 0, -18], 20); lightsRed.push(x, 42, z); }
      // in the middle of the channel, on the tube's axis: the ventilation tower's island, and two rows of yellow buoys forbidding mooring above the tunnel
      const iv = S[near(h, -615, 300)], island = new THREE.Group(); island.position.set(iv.x, 0, iv.z); island.rotation.y = h.across(iv) + Math.PI / 2; h.scene.add(island);
      h.pose('islandVentilation', { quay, defense: M('defense') }, island); h.pose('ventilationTower', { shutters, concretePart }, island, [0, 0, 0], 34); lightsRed.push(iv.x, 50, iv.z);
      const buoys = [], lightsBuoys = [];
      for (let i = T.t0; i < T.t1; i += 10) { const s = S[i]; if (!sea(s.x, s.z)) continue; for (const sd of [-1, 1]) { const [x, z] = edgePt(s, sd, 60); buoys.push([x, -3.2, z]); lightsBuoys.push(x, -0.6, z); } }
      inst(h, h.geo('buoy'), M('metalPale', { c: 0xffc81a }), buoys);
      const fb = new THREE.BufferGeometry(); fb.setAttribute('position', new THREE.Float32BufferAttribute(lightsBuoys, 3));
      const ptsBuoys = new THREE.Points(fb, new THREE.PointsMaterial({ color: 0xffc81a, size: 3, sizeAttenuation: false })); ptsBuoys.frustumCulled = false; h.scene.add(ptsBuoys);

      // ---------- the port island: quay, container yards in uneven blocks, machinery, lighting masts ----------
      // spots kept free (x, z, radius): under the gantries spanning the road (points 18 to 28; the one at j = 140 runs ±20 m)
      const i0E = pt(h, 18), nE = (pt(h, 28) - i0E + N) % N, jCranes = [], iPm = (i0E + 142) % N, boreHoles = [[S[iPm].x, S[iPm].z, 38]];
      for (let j = 420; j < nE - 40; j += 280) { jCranes.push(j); const q = S[(i0E + j) % N]; boreHoles.push([q.x, q.z, 24]); }
      const axis = S[near(h, -615, 560)].x, free = (x, z, m = 14) => g.dAt(x, z) > W + m && (z > 700 || Math.abs(x - axis) > 90) && Math.hypot(x - PH[0], z - PH[1]) > 30 && // nothing on the tunnel's axis: from the trench, the channel can be seen; nothing against the lighthouse
         g.hAt(x, z) > -1.5 && z > CH1 + 4 && z < ISLAND[2] - 12 && x > ISLAND[0] + 10 && x < ISLAND[1] - 10 && boreHoles.every(([tx, tz, r]) => Math.hypot(x - tx, z - tz) > r);
      // the port ground: concrete slabs, sunken rails, a yellow lane, storage bays, puddles (textures-wangan.js); west of the tunnel trench, the old quay platform
      boxMesh(h, M('groundPort'), ISLAND[1] + 500, 0.3, ISLAND[2] - CH1 - 2, (ISLAND[1] - 500) / 2, -0.2, (CH1 + 2 + ISLAND[2]) / 2);
      boxMesh(h, M('park'), 360, 0.3, 74, ISLAND[0] + 200, -0.2, CH1 + 37);
      const cols = [0xb8442c, 0x2c6ab8, 0xc9a02c, 0x3a8a5a, 0xd8d4cc, 0x7a3a6a, 0x1a4a5a], piers = cols.map(() => []), riders = [], gantries = [];
      // a block = rows of containers (along X) over several lanes (Z); each block has its dominant company, its filling, its gaps
      const blocks = [], blk = (x0, z0, C, R, fill) => { blocks.push([x0 - 1, z0 - 1, x0 + C * 12.8 + 1, z0 + R * 2.9 + 1]);
        const dom = rnd() * cols.length | 0;
        const H = [], hAt = (c, r) => (H[c] && H[c][r]) || 0;
        for (let c = 0; c < C; c++) { H[c] = []; for (let r = 0; r < R; r++) { const curb = Math.min(c, C - 1 - c, r, R - 1 - r) === 0 ? 1 : 0; H[c][r] = Math.max(1, Math.min(5, Math.round(fill - curb + (rnd() - 0.5) * 2.6))); } } // the block already arrives cut to the road: no hole
        for (let c = 0; c < C; c++) for (let r = 0; r < R; r++) {
          const x = x0 + c * 12.8 + 6, z = z0 + r * 2.9 + 1.25, n = H[c][r], vu = Math.min(hAt(c - 1, r), hAt(c + 1, r), hAt(c, r - 1), hAt(c, r + 1)); // below this level, the container is buried between its neighbours: we do not draw it
          const pier = [], k0 = Math.max(0, Math.min(vu, n - 1));
          for (let k = k0; k < n; k++) { const high = k === n - 1, col = rnd() < 0.55 ? dom : rnd() * cols.length | 0; pier.push([col, [x + (high ? (rnd() - 0.5) * 0.5 : 0), g.hAt(x, z) + 1.3 + k * 2.6, z, high ? (rnd() - 0.5) * 0.05 : 0, rnd() < 0.15 ? 0.5 : 1, 1, 1]]); }
          // hidden faces (8th value): 1 = underside (on the ground, or on a whole container), 2 = top (under a whole container that is not the last one, standing upright)
          pier.forEach(([col, p], j) => { p[7] = (k0 + j === 0 || j > 0 && pier[j - 1][1][4] === 1 ? 1 : 0) | (j < pier.length - 2 && pier[j + 1][1][4] === 1 ? 2 : 0); piers[col].push(p); });
        }
        if (rnd() < 0.5 && R <= 7 && free(x0 + C * 6.4, z0 + R * 1.45, 6)) gantries.push([x0 + (0.2 + rnd() * 0.6) * C * 12.8, g.hAt(x0, z0), z0 + R * 1.45, Math.PI / 2]);
      };
      // rows of blocks across the whole island, from the back of the quay gantries to the south edge; a block stops dead 4 m behind the low wall (its columns that a container would hit on the road are removed)
      const freeCol = (x0, z0, c, R) => { for (let r = 0; r < R; r++) for (const dx of [-6.4, 6.4]) for (const dz of [-1.45, 1.45]) if (!free(x0 + c * 12.8 + 6 + dx, z0 + r * 2.9 + 1.25 + dz, 4)) return false; return true; };
      for (let z0 = 580; z0 < ISLAND[2] - 34; z0 += 40 + (rnd() * 10 | 0)) for (let x0 = ISLAND[0] + 20 + rnd() * 30; x0 < ISLAND[1] - 40;) {
        const C0 = 4 + (rnd() * 7 | 0), R = 4 + (rnd() * 4 | 0), t = rnd(), L = C0 * 12.8;
        let c0 = 0; while (c0 < C0 && !freeCol(x0, z0, c0, R)) c0++; let c1 = c0; while (c1 < C0 && freeCol(x0, z0, c1, R)) c1++;
        const C = c1 - c0; if (C < 2) { x0 += L + 14; continue; } // block eaten by the road: the verge stays empty, filled lower down (machines, pallets)
        if (t < 0.15) { // empty zone: a few containers set askew, a rider waiting
          for (let k = rnd() * 4 | 0; k > 0; k--) { const x = x0 + rnd() * L, z = z0 + rnd() * 20; if (free(x, z)) piers[rnd() * cols.length | 0].push([x, g.hAt(x, z) + 1.3, z, rnd() * 3.14, 1, 1, 1, 1]); }
          const x = x0 + rnd() * L, z = z0 + 10; if (free(x, z, 18)) riders.push([x, g.hAt(x, z), z, rnd() < 0.5 ? 0 : 0.2]);
        } else blk(x0 + c0 * 12.8, z0, C, R, t < 0.4 ? 1.5 : t < 0.85 ? 3 : 4.2);
        const walkway = 14 + rnd() * 22, x = x0 + L + walkway / 2, z = z0 + 9; // the aisle that follows: a rider sometimes passes through it
        if (rnd() < 0.45 && free(x, z, 18)) riders.push([x, g.hAt(x, z), z, Math.PI / 2 + (rnd() - 0.5) * 0.2]);
        x0 += L + walkway;
      }
      const structure = M('metalPale', { c: 0xe0b020 }), cabin = M('metalPale', { c: 0xe8e8e4 }), pane = M('paneDark'), wheelPart = M('wheelPart'), tire = M('tire'), machinery = M('metalPale', { c: 0x8a8e96 });
      puts('straddleCarrier', { structure, cabin, pane, wheelPart }, riders);
      puts('cranePark', { structure: M('metalPale', { c: 0x2c6ab8 }), cabin, pane, wheelPart, machinery }, gantries, { a: [24] });
      // the quay: gantries over the moored ships, quay tractors waiting under the gantries
      const minium = M('minium'), lattice = M('lattice', { alphaTest: 0.5, side: THREE.DoubleSide }, '#c8442c');
      for (const cx of [-150, -40, 70, 620, 740, 930]) { h.pose('crane', { structure: minium, lattice, tieRod: gray, machinery: cabin, cabin, pane, wheelPart }, h.scene, [cx, 0, CH1]); beaconList.push(cx, 69, CH1 + 41); }
      const tractors = [];
      for (let k = 0; k < 16; k++) { const x = -260 + rnd() * 1250, z = CH1 + 8 + rnd() * 14; if (Math.abs(x - 280) > 180) tractors.push([x, 0, z, (rnd() < 0.5 ? 0 : Math.PI) + (rnd() - 0.5) * 0.3]); }
      // ---------- the port verges (points 9 to 29), between the low wall and the blocks: the port is working, the race passes at the midpoint. Parked trucks, forklifts, pallets, site barriers ----------
      { const outsideBlock = (x, z) => !blocks.some(b => x > b[0] && x < b[2] && z > b[1] && z < b[3]), carts = [], pallet = [[], []], barr = []; let hz = 11; const al = () => (hz = hz * 16807 % 2147483647) / 2147483647; // hasard propre
        const i09 = pt(h, 9), n9 = (pt(h, 29) - i09 + N) % N;
        for (let j = 4; j < n9; j += 5) { const s = S[(i09 + j) % N], ry = h.across(s) + Math.PI / 2;
          for (const sd of [-1, 1]) { const u = al(), [x, z] = edgePt(s, sd, W + 4 + al() * 14); if (!free(x, z, 3) || !outsideBlock(x, z)) continue;
            if (u < 0.1) { const [x2, z2] = edgePt(s, sd, W + 6); if (free(x2, z2, 5) && outsideBlock(x2 + s.tx * 10, z2 + s.tz * 10) && outsideBlock(x2 - s.tx * 10, z2 - s.tz * 10)) tractors.push([x2, 0, z2, ry + (sd > 0 ? 0 : Math.PI)]); } // a truck parked alongside, waiting
            else if (u < 0.2) carts.push([x, 0, z, al() * 6.3]);
            else if (u < 0.48) { const n = 1 + (al() * 4 | 0); for (let k = 0; k < n; k++) { const f = al() < 0.5 ? 1 : 0; pallet[f].push([x + (al() - 0.5) * 3, 0, z + (al() - 0.5) * 3, al() * 0.4, 1, f ? 1 : 1 + (al() * 6 | 0), 1]); } } // stacks of empty pallets (stretched upward) or wrapped
            else if (u < 0.56) for (let k = -1; k <= 1; k++) barr.push([x + s.tx * k * 2.7, 0, z + s.tz * k * 2.7, h.across(s)]); } }
        insts(h, 'trolley', { carBody: M('metalPale', { c: 0xe0a020 }), counterweight: M('matGray'), steelMat: M('steelMat'), wheelPart: M('wheelPart') }, carts);
        insts(h, 'pallets', { wood: M('boards', { c: 0xc8a878 }) }, pallet[0], { a: [1, false] }); insts(h, 'pallets', { wood: M('boards', { c: 0xc8a878 }), film: M('metalPale', { c: 0xc8d4dc }) }, pallet[1], { a: [1, true] });
        insts(h, 'barrierRail', { striping: M('striping', GLOW), blinker: M('blinker', GLOW) }, barr); }
      const chassis = M('matGray'), lampObj = M('lampObj', GLOW), lightRed = M('lightRed', GLOW), blinkMat = M('blinker', GLOW);
      puts('tractor', { chassis, tire, cabin: M('metalPale', { c: 0xe0b020 }), pane, radiator: M('radiator'), headlight: lampObj, lightOrange: blinkMat, wheelPart }, tractors);
      puts('trailerContainer', { chassis, carBody: M('tin', { c: 0x5a5e66 }), wheelPart, tire, fire: lightRed }, tractors.filter((p, k) => k % 3));
      // lighting masts: white light over the parks; those along the road light it
      const masts35 = [];
      for (let x = ISLAND[0] + 60; x < ISLAND[1] - 40; x += 130) for (const z of [CH1 + 30, 700, 818, 1000]) {
        const xx = x + (z % 3) * 20; if (!free(xx, z, 6)) continue; masts35.push([xx, g.hAt(xx, z), z]);
        if (g.dAt(xx, z) < 60) h.emis(near(h, xx, z), xx, 33, z, 0xe8f0ff, 70, 1.6);
      }
      // ---------- crossing the port (points 9 to 29): no container walls along the road, the park blocks stop dead behind the low wall;
      // two park gantries straddle the road (a third one rolls, lower down), low white floodlight masts (the hard white of the quays against the orange of the sodium)
      { const cranes = jCranes.map(j => { const s = S[(i0E + j) % N]; return [s.x, s.y, s.z, h.across(s)]; });
        puts('cranePark', { structure: M('metalPale', { c: 0xe0b020 }), cabin: M('metalPale', { c: 0xe8e8e4 }), pane: M('paneDark'), wheelPart: M('wheelPart'), machinery: M('metalPale', { c: 0x8a8e96 }) }, cranes, { a: [32] });
        const i09 = pt(h, 9), n9 = (pt(h, 29) - i09 + N) % N;
        for (let j = 18; j < n9; j += 36) { const i = (i09 + j) % N, s = S[i], sd = (j / 36) & 1 ? 1 : -1, [x, z] = edgePt(s, sd, W + 2.5); // one floodlight every 72 m, alternating sides
          masts35.push([x, g.hAt(x, z), z]); h.emis(i, x - s.tz * sd * -4, s.y + 20, z + s.tx * sd * -4, 0xe8f0ff, 48, 2.2); } }
      // a container without its hidden faces (BoxGeometry: faces ±x, ±y, ±z of 4 vertices; 2 = top, 3 = bottom): half the vertices of the map are containers
      const without = (g, f) => { const gv = [...Array(24).keys()].filter(i => !f.includes(i >> 2)); for (const n in g.attributes) { const a = g.attributes[n]; g.setAttribute(n, new THREE.Float32BufferAttribute(gv.flatMap(i => Array.from(a.array.slice(i * a.itemSize, (i + 1) * a.itemSize))), a.itemSize)); }
        g.setIndex(Array.from(g.index.array).filter((_, k) => !f.includes(Math.floor(k / 6))).map(i => gv.indexOf(i))); g.clearGroups(); return g; };
      { let mt = null; piers.forEach((l, i) => { const m = M('tin', { c: cols[i] }); mt = mt || Object.assign(m.clone(), { vertexColors: true, color: new THREE.Color(0xffffff) }); [[], [3], [2], [2, 3]].forEach((f, v) => { const lv = l.filter(p => (p[7] || 0) === v); if (!lv.length) return; const G = without(h.clothe(h.geo('container'), m), f), c = new THREE.Color(cols[i]), n = G.attributes.position.count, A = new Float32Array(n * 3); for (let k = 0; k < n; k++) A.set([c.r, c.g, c.b], k * 3); G.setAttribute('color', new THREE.BufferAttribute(A, 3)); for (const p of lv) { const o = new THREE.Mesh(G, mt); o.position.set(p[0], p[1], p[2]); o.rotation.y = p[3] || 0; o.scale.set(p[4] || 1, p[5] || p[4] || 1, p[6] || p[4] || 1); o.castShadow = o.receiveShadow = h.TH.sun[1] > 0.6; h.scene.add(o); } }); }); } // one mesh per container, which the merge cuts into slabs (those out of view are no longer drawn); a single material: the 7 sheet panels share the same texture (randomness seeded by their name), the tint goes into the vertices
      insts(h, 'mastLighting', { steelMat: M('steelMat'), lampObj }, masts35);

      // ---------- ships: two container ships at the quay, tugs, ships at anchor offshore, and two passing through the channel above the tunnel ----------
      let windowMat = null; // the portholes, shared between ships (drawn each time for rnd, see M): the fixed ships blend together
      const nav = (L, type, hull, chimney, bays) => ({ keel: minium, hull: M('metalPale', { c: hull }), whiteN: cabin, portholes: (m => windowMat || (windowMat = m))(M('towerWindows', { emis: 1, fog: false }, ['#ffe2a0', '#f4f1e0'])), chimney: M('metalPale', { c: chimney }),
        cargo: M('cargo'), chock: M('metalPale', { c: 0x8a3a2a }), craneEdge: structure, defense: M('defense'), pane });
      const bays = (L, f) => Array.from({ length: Math.floor((L - 50) / 24) }, () => Math.max(1, Math.min(6, Math.round(f + (rnd() - 0.5) * 3))));
      const famShip = { test: m => m.userData.mc }; // the painted plates of a passing ship (same texture, different tints): a single pass, the tint as vertex colour
      const lightsNav = [], ship = (L, type, hull, funnel, x, z, ry, f = 4, dyn) => { const p = new THREE.Group(); p.userData.dyn = dyn; p.position.set(x, -3, z); p.rotation.y = ry; h.scene.add(p); h.pose('ship', nav(L, type, hull, funnel), p, [0, 0, 0], L, type, type === 'bulk' ? [] : bays(L, f)); if (dyn) weld(h, p, famShip); return p; }; // only the passing ships move: the others are merged into the scenery
      for (const [L, x, hull, funnel, f] of [[250, -40, 0x1a2a4a, 0xc8442c, 4.5]]) { ship(L, 'containers', hull, funnel, x, CH1 - 16, 0, f); lightsNav.push(x + L / 2 - 6, 19, CH1 - 16, x - L / 2 + 14, 36, CH1 - 16); }
      // ---------- the coaster that moves on from lap to lap (3-lap cycle): at the quay on lap 1, it passes under the cable-stayed bridge on lap 2 (seen from the road, on the approach and on the bridge),
      // offshore on lap 3; back at the quay during the lap-3 tunnel, where no one sees it. Its position depends only on the laps of the car the view follows (tick.view, below):
      // nothing changes for the physics or for the ghost. It stays in the channel, under the bridge between two piers (z = 342: piers at 312 and 372) ----------
      const cabo = new THREE.Group(); cabo.userData.dyn = 1; h.scene.add(cabo); cabo.position.y = -3;
      h.pose('coaster', nav(170, 'containers', 0x2a3a2a, 0xe8e4dc), cabo, [0, 0, 0], 170, bays(170, 3).map(n => Math.min(4, n))); weld(h, cabo, famShip);
      { const lp = [79, 16, 0, -73, 25.5, 0, -85, 9, 0]; for (let x = -60; x <= 70; x += 6) lp.push(x, 8.2, -12.2, x, 8.2, 12.2); // masthead and stern lights, bridge ramps: the coaster is seen at night, from afar
        const fc = new THREE.BufferGeometry(); fc.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
        const pc = new THREE.Points(fc, new THREE.PointsMaterial({ color: 0xfff2d0, size: 2.5, sizeAttenuation: false, fog: false })); pc.frustumCulled = false; cabo.add(pc);
        const fv = new THREE.BufferGeometry(); fv.setAttribute('position', new THREE.Float32BufferAttribute([-82, 17, 12.5, -82, 17, -12.5], 3)); fv.setAttribute('color', new THREE.Float32BufferAttribute([1, 0.1, 0.1, 0.1, 1, 0.3], 3)); // port red, starboard green
        const pv = new THREE.Points(fv, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true, fog: false })); pv.frustumCulled = false; cabo.add(pv); }
      const PATH = [[690, CH1 - 16], [1050, 490], [1250, 420], [1405, 342], [1700, 330], [2300, 300], [2600, 290]], CL = [0];
      for (let k = 1; k < PATH.length; k++) CL.push(CL[k - 1] + Math.hypot(PATH[k][0] - PATH[k - 1][0], PATH[k][1] - PATH[k - 1][1]));
      const overPath = d => { d = Math.max(0, Math.min(CL[CL.length - 1], d)); let k = 1; while (k < CL.length - 1 && CL[k] < d) k++; const f = (d - CL[k - 1]) / (CL[k] - CL[k - 1]), a = PATH[k - 1], b = PATH[k]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
      const sP = CL[3], sL = CL[5], sF = CL[6], smooth = t => t * t * (3 - 2 * t), between = (u, a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
      const trackPath = u => { const f = ((u % 3) + 3) % 3; // u: car laps, along the lap (1.5 = mid lap 2) → distance travelled on the path
        if (f < 0.75 || f >= 2.85) return 0; // at the quay (lap 1, and back at the exit of the lap-3 tunnel)
        if (f < 1.1) return smooth(between(f, 0.75, 1.1)) * (sP - 100); // it casts off during the tunnel and the city: seen from afar, it glides
        if (f < 1.45) return sP - 100 + (f - 1.1) / 0.35 * 320; // passing under the bridge, at ship speed (9 m/s): the car approaches the bridge around 1.15 and crosses it around 1.25
        if (f < 2) return sP + 220 + smooth(between(f, 1.45, 2)) * (sL - sP - 220); // it gains open water while the car is in the port and the tunnel
        return sL + (f - 2) / 0.85 * (sF - sL); }; // offshore, it slowly moves away
      const lapCount = new WeakMap(), placeCabo = car => { // counts the laps of each car: in a race, dist accumulates; in solo, the session brings it back to 0 at each lap
        let e = lapCount.get(car); if (!e) lapCount.set(car, e = { n: 0, prev: car.dist }); if (car.dist < e.prev - N / 2) e.n++; e.prev = car.dist;
        const d = trackPath(Math.max(0, e.n + car.dist / N)), [x, z] = overPath(d), [x2, z2] = overPath(d + 30), [x1, z1] = overPath(d - 30);
        cabo.position.x = x; cabo.position.z = z; cabo.rotation.y = d > 0 ? Math.atan2(-(z2 - z1), x2 - x1) : 0; };
      const tug = (x, z, ry, dyn) => { const p = new THREE.Group(); p.userData.dyn = dyn; p.position.set(x, -3, z); p.rotation.y = ry; h.scene.add(p); h.pose('tug', nav(30, '', 0xc8302c, 0x1a1a20), p); if (dyn) weld(h, p, famShip); return p; };
      tug(330, CH1 - 22, 0.3); tug(360, CH1 - 40, -0.2); // away from the coaster's path (below)
      for (let k = 0; k < 7; k++) { // at anchor, south of the island: the bow faces the current, anchor lights
        const L = 160 + rnd() * 110, x = -900 + k * 420 + rnd() * 150, z = ISLAND[2] + 260 + rnd() * 900, ry = 0.6 + (rnd() - 0.5) * 0.3;
        ship(L, k % 3 ? 'bulk' : 'containers', [0x2a1a1a, 0x1a2a4a, 0x3a3a40][k % 3], [0xe8e4dc, 0xc8442c, 0x2c6ab8][k % 3], x, z, ry, 2.5);
        lightsNav.push(x + Math.cos(ry) * L / 2, 12, z - Math.sin(ry) * L / 2, x, 30, z);
      }
      // in the channel, on a loop: heading east in the north, turn around, heading west in the south; the tug follows the first
      const passers = [[ship(170, 'containers', 0x3a1a2a, 0xf4f0e0, 0, 0, 0, 3.5, 1), 0], [ship(150, 'bulk', 0x1a3a3a, 0xc8442c, 0, 0, 0, 4, 1), 0.25], [ship(190, 'containers', 0x1a2a4a, 0xe8b02c, 0, 0, 0, 4, 1), 0.5], [ship(140, 'ferry', 0xe8e8e4, 0x2c6ab8, 0, 0, 0, 4, 1), 0.75], [tug(0, 0, 0, 1), 0.04]];
      // opposite the entrance, at the quay on the city bank: a night ferry, fully lit, beside the tube (its hull would drop into the tunnel)
      ship(180, 'ferry', 0xe8e8e4, 0xc8302c, axis + 110, CH0 + 15, Math.PI);
      const BX0 = -1500, BX1 = 1000, BR = 110, BZ = 310, LB = 2 * (BX1 - BX0) + 2 * Math.PI * BR;
      const loopSec = (u, p) => { // u from 0 to 1 along the loop
        let d = (u % 1) * LB; const dr = BX1 - BX0, dc = Math.PI * BR;
        if (d < dr) { p.position.set(BX0 + d, -3, BZ + BR); p.rotation.y = 0; return; } d -= dr;
        if (d < dc) { const a = d / BR; p.position.set(BX1 + Math.sin(a) * BR, -3, BZ + Math.cos(a) * BR); p.rotation.y = a; return; } d -= dc;
        if (d < dr) { p.position.set(BX1 - d, -3, BZ - BR); p.rotation.y = Math.PI; return; } d -= dr;
        const a = d / BR; p.position.set(BX0 - Math.sin(a) * BR, -3, BZ - Math.cos(a) * BR); p.rotation.y = Math.PI + a;
      };
      const nf = new THREE.BufferGeometry(); nf.setAttribute('position', new THREE.Float32BufferAttribute(lightsNav, 3));
      const pnav = new THREE.Points(nf, new THREE.PointsMaterial({ color: 0xfff2d0, size: 2, sizeAttenuation: false, fog: false })); pnav.frustumCulled = false; h.scene.add(pnav);

      // ---------- the city, to the north: towers with lit windows lining the expressway, taller toward the inside ----------
      const lapRun = cols2 => M('towerWindows', GLOW, cols2);
      const tm = [lapRun(['#ffb85a', '#ffd27a']), lapRun(['#f4f1e0', '#9fd0ff']), lapRun(['#ffb85a', '#f4f1e0', '#ff7a5a'])], tl = tm.map(() => []);
      for (let gx = g.box[0] + 30; gx < g.box[2] - 30; gx += 58) for (let gz = g.box[1] + 30; gz < CH0 - 60; gz += 58) {
        const x = gx + rnd() * 16, z = gz + rnd() * 16, d = g.dAt(x, z);
        if (d < W + 26 || g.hAt(x, z) < -1.5 || Math.hypot(x - 860, z + 70) < 70) continue; // the crane worksite square (lower down)
        const hh = 26 + rnd() * 40 + Math.min(120, d * 0.35) * rnd(), w = 26 + rnd() * 16; tl[rnd() * 3 | 0].push([x, hh / 2 - 1, z, 0, w, hh, w]);
      }
      tl.forEach((l, i) => inst(h, h.geo('blk'), tm[i], l));
      // ---------- at ground level between the towers, now that the road runs there (points 36 to 3: tunnel return and straight): kerbed pavements, parked cars, pallets, trolleys, site barriers ----------
      { const i0 = pt(h, 36), n = (pt(h, 3) - i0 + N) % N, walk = M('sidewalk');
        for (const sd of [-1, 1]) { h.ribbon(i0, n, sd * (W + 0.6), 0.15, sd * (W + 5), 0.15, walk, 8); h.ribbon(i0, n, sd * (W + 5), 0.15, sd * (W + 5), -2, concretePart, 8); } // the pavement and its kerb, down to the ground
        const insideTower = (x, z, m) => tl.some(l => l.some(t => Math.abs(x - t[0]) < t[4] / 2 + m && Math.abs(z - t[2]) < t[6] / 2 + m)),
          avoid = [[-450, -245, 45], [-175, -95, 30], [CG0[0] - 20, CG0[1], 50]], // toll, hotel sign, crane worksite
          ok = (x, z, m) => z < -2 && g.hAt(x, z) > -1.5 && !insideTower(x, z, m) && avoid.every(([ex, ez, r]) => Math.hypot(x - ex, z - ez) > r);
        const autoList = [], carts = [], pallet = [], barr = [], tints = [0xe8e4dc, 0x1a1a20, 0x8a8e96, 0xc8302c, 0x2c4a8a, 0xd8d4cc, 0x3a3a40, 0x9a8a6a]; let hz = 23; const al = () => (hz = hz * 16807 % 2147483647) / 2147483647;
        for (let k = 0; k < n; k += 3) { const s = S[(i0 + k) % N], ry = h.across(s) + Math.PI / 2;
          for (const sd of [-1, 1]) { const u = al(), [x, z] = edgePt(s, sd, W + 7.2); if (!ok(x, z, 2.5)) continue;
            if (u < 0.5) autoList.push([x, g.hAt(x, z), z, ry + (al() < 0.5 ? 0 : Math.PI) + (al() - 0.5) * 0.06, 1, 1, 1, tints[al() * tints.length | 0]]); // parked along, in a line
            else if (u < 0.56) { const [x2, z2] = edgePt(s, sd, W + 11 + al() * 6); if (ok(x2, z2, 1.5)) { const nbr = 1 + (al() * 3 | 0); for (let q = 0; q < nbr; q++) pallet.push([x2 + (al() - 0.5) * 3, g.hAt(x2, z2), z2 + (al() - 0.5) * 3, al() * 0.5, 1, 1 + (al() * 5 | 0), 1]); } } // in front of the warehouses
            else if (u < 0.58) { const [x2, z2] = edgePt(s, sd, W + 12); if (ok(x2, z2, 3)) carts.push([x2, g.hAt(x2, z2), z2, al() * 6.3]); }
            else if (u < 0.62) for (let q = -1; q <= 1; q++) barr.push([x + s.tx * q * 2.7, g.hAt(x, z), z + s.tz * q * 2.7, h.across(s)]); } } // a hole in the pavement, blocked off
        puts('carParked', { carBody: M('paint', { c: 0xffffff }), pane: M('paneDark'), lightRed: M('lightRed'), lightWhite: M('matGray'), chassis: M('matGray'), wheelPart: M('wheelPart'), tire: M('tire') }, autoList, { tintMat: 'carBody' });
        insts(h, 'pallets', { wood: M('boards', { c: 0xc8a878 }) }, pallet, { a: [1, false] });
        insts(h, 'trolley', { carBody: M('metalPale', { c: 0xe0a020 }), counterweight: M('matGray'), steelMat: M('steelMat'), wheelPart: M('wheelPart') }, carts);
        insts(h, 'barrierRail', { striping: M('striping', GLOW), blinker: M('blinker', GLOW) }, barr);
        // street furniture: lit drink vending machines, bins, benches, turned toward the road; 6 m street lamps on the straight (city side), no motorway lamps
        const dis = [], binList = [], benches = [], rev = [], face = (s, sd) => Math.atan2(s.tz * sd, -s.tx * sd);
        for (let k = 6; k < n; k += 12) { const s = S[(i0 + k) % N];
          for (const sd of [-1, 1]) { const [x, z] = edgePt(s, sd, W + 3.6), u = al(); if (!ok(x, z, 1)) continue; const y = s.y + 0.15, r = face(s, sd);
            if (u < 0.35) for (let q = 0; q < 2 + (al() * 2 | 0); q++) dis.push([x + s.tx * q * 1.05, y, z + s.tz * q * 1.05, r]);
            else if (u < 0.6) binList.push([x, y, z, r]); else if (u < 0.85) benches.push([x, y, z, r + Math.PI]); } }
        for (let k = 0; k < n; k += 15) { const i = (i0 + k) % N, s = S[i]; for (const sd of [-1, 1]) { if (i >= pt(h, 36) || i < pt(h, 3) && sd > 0) continue; // the motorway lamps already light the return (points 36 to 40); the marina only has its bollards
          const [x, z] = edgePt(s, sd, W + 4.8); if (!ok(x, z, 0.5)) continue; rev.push([x, s.y + 0.15, z, Math.atan2(s.tx * sd, s.tz * sd)]); const [lx, lz] = edgePt(s, sd, W + 3.7); h.emis(i, lx, s.y + 6, lz, 0xffd8a0, 24, 1.6); } }
        insts(h, 'dispenser', { carBody: M('metalPale', { c: 0xe8e8ec }), facade: M('towerWindows', GLOW, ['#f4f8ff', '#ff4a5a', '#4ab0ff']) }, dis);
        insts(h, 'trashcan', { binOf: M('metalPale', { c: 0x2a6a3a }), bin2: M('metalPale', { c: 0x2a4a8a }) }, binList);
        insts(h, 'bench', { vert: M('boards', { c: 0x9a7a5a }), iron: M('matGray') }, benches);
        insts(h, 'streetlampStreet', { shaft: M('matGray'), lampObj: M('lampObj', GLOW) }, rev); }
      // the ground between the towers: streets (asphalt, pavements, pedestrian crossings) aligned to the tower grid; east of the tunnel trench, under the road (higher up), above the terrain
      { const x0 = g.box[0] + 67 + 58 * Math.ceil((-560 - g.box[0] - 67) / 58), z0 = g.box[1] + 9, nx = Math.floor((g.box[2] - x0) / 58); let nz = Math.ceil((-14 - z0) / 58); if (z0 + nz * 58 > 12) nz--;
        boxMesh(h, M('streetVille'), nx * 58, 0.3, nz * 58, x0 + nx * 29, -0.45, z0 + nz * 29);
        const rv = []; // street lamps at the crossroads, near the road
        for (let a = 0; a <= nx; a++) for (let b = 0; b <= nz; b++) for (const [dx, dz] of [[-9, -9], [9, 9]]) { const x = x0 + a * 58 + dx, z = z0 + b * 58 + dz, d = g.dAt(x, z);
          if (d < W + 4 || d > 150 || tl.some(l => l.some(t => Math.abs(x - t[0]) < t[4] / 2 + 1 && Math.abs(z - t[2]) < t[6] / 2 + 1))) continue; rv.push([x, -0.3, z, Math.atan2(-dz, dx)]); if (d < 60) h.emis(near(h, x, z), x, 6, z, 0xffd8a0, 26, 1.4); }
        insts(h, 'streetlampStreet', { shaft: M('matGray'), lampObj: M('lampObj', GLOW) }, rv); }
      // ---------- the east seafront, from the marina to the bridge (under the big climbing bend, points 3 to 5): seen from above, it was a large flat black area between the road and the lapCount.
      // Quay and lit promenade along the channel, palm trees, and behind, plots: terrace restaurants, low warehouses, car parks ----------
      { const X0 = 1040, X1 = 1720, ZQ = CH0 - 2; let hz = 31; const al = () => (hz = hz * 16807 % 2147483647) / 2147483647;
        const insideTower = (x, z, m) => tl.some(l => l.some(t => Math.abs(x - t[0]) < t[4] / 2 + m && Math.abs(z - t[2]) < t[6] / 2 + m));
        const terre = (x, z, m = 6) => g.dAt(x, z) > W + m && g.hAt(x, z) > -1.5 && z < ZQ - 1 && !insideTower(x, z, 2);
        boxMesh(h, M('slabsQuay'), X1 - X0, 0.3, ZQ + 230, (X0 + X1) / 2, -0.4, (ZQ - 230) / 2); // light slabs across the whole district (above the streets, under the rising road)
        boxMesh(h, concretePart, X1 - X0, 4, 3, (X0 + X1) / 2, -2, ZQ + 1.5); // the quay
        const palmT = [], palmP = [], benches = [], rev = [], bollards = [], lights = [], autoList = [], awnings = [], terr = [], people = [], brightF = [], brightC = [];
        for (let x = X0 + 8; x < X1; x += 16) { if (!terre(x, ZQ - 4, 3)) continue; bollards.push([x, -0.25, ZQ - 2]); lights.push(x, 0.8, ZQ - 2); // quay bollards, as at the marina
          if (x % 32 < 16 && terre(x, ZQ - 12)) { const ht = 9 + al() * 4; palmT.push([x, ht / 2 - 0.25, ZQ - 12, 0, 1, ht, 1]); palmP.push([x, ht - 0.25, ZQ - 12, al() * 6.3]); }
          if (x % 48 < 16 && terre(x, ZQ - 20)) { rev.push([x, -0.25, ZQ - 20, 0]); h.emis(near(h, x, ZQ - 20), x, 6, ZQ - 19, 0xffd8a0, 30, 1.6); }
          else if (terre(x, ZQ - 18)) benches.push([x, -0.25, ZQ - 18, Math.PI]); }
        const drumset = [[], []], warehouses = [], signboards = [], parks = [];
        for (let lz = ZQ - 64; lz > -230; lz -= 44) for (let lx = X0 + 4 + al() * 10; lx < X1 - 40; lx += 52) { // plots of 44 × 34 m, facade toward the channel (+z)
          if (![[0, 0], [44, 0], [0, 34], [44, 34], [22, 17]].every(([dx, dz]) => terre(lx + dx, lz + dz))) continue;
          const u = al(), cx = lx + 22, cz = lz + 17;
          if (u < 0.38) { // restaurant: hall with warm windows, striped awning, terrace and its garland, customers
            drumset[al() < 0.5 ? 0 : 1].push([cx, 3.5 - 0.25, cz - 4, 0, 22, 7, 12]); awnings.push([cx, -0.25, cz + 2, 0, 1, 1, 1, [0xc8304a, 0x2a6a4a, 0xe8a020][al() * 3 | 0]]);
            for (const dz of [4, 7.5]) terr.push([cx, -0.25, cz + dz, 0]);
            for (let k = 0; k < 6; k++) people.push([cx - 6 + al() * 12, -0.25, cz + 4 + al() * 6, al() * 6.3, 0.95 + al() * 0.1]);
            for (let x = cx - 11; x <= cx + 11; x += 1) { brightF.push(x, 4.2 - Math.abs(Math.sin((x - cx) / 5.5 * Math.PI)) * 0.6, cz + 9); brightC.push(...[[1, 0.85, 0.4], [1, 0.5, 0.3]][x & 1]); }
            h.emis(near(h, cx, cz), cx, 4, cz + 6, 0xffb860, 28, 1.8); }
          else if (u < 0.72) { // low warehouse: cladding, illuminated sign, lamp above the doors
            warehouses.push([cx, 4.5 - 0.25, cz - 2, 0, 40, 9, 26]); signboards.push([cx, 7.6, cz + 11.1]); h.emis(near(h, cx, cz), cx, 6, cz + 13, 0xe8f0ff, 22, 1.2); }
          else { parks.push([cx, cz]); for (const dz of [-8, 8]) for (let x = lx + 3; x < lx + 42; x += 3) if (al() < 0.65) autoList.push([x, -0.25, cz + dz, Math.PI / 2 + (al() < 0.5 ? 0 : Math.PI), 1, 1, 1, [0xe8e4dc, 0x1a1a20, 0x8a8e96, 0xc8302c, 0x2c4a8a, 0x3a3a40][al() * 6 | 0]]);
            rev.push([lx + 1, -0.25, cz, 0]); h.emis(near(h, lx, cz), lx + 2, 6, cz, 0xffd8a0, 26, 1.2); } }
        for (const [cx, cz] of parks) boxMesh(h, M('park'), 44, 0.3, 34, cx, -0.3, cz);
        drumset.forEach((l, i) => inst(h, h.geo('blk'), M('towerWindows', GLOW, i ? ['#ffd27a', '#ffb85a'] : ['#ffe8c0', '#ff9a5a']), l));
        inst(h, h.geo('blk'), M('warehouse'), warehouses);
        inst(h, h.geo('boxMesh', 14, 1.6, 0.3), M('written', GLOW, 96, 12, '#0e3a5a', '#f4f1e0', '湾岸倉庫  BAY WAREHOUSE', 9), signboards);
        inst(h, h.geo('trunkPalmtree'), M('trunkPalmtree'), palmT); insts(h, 'fronds', { frond: M('frond', { side: THREE.DoubleSide }) }, palmP);
        insts(h, 'store', { cloth: M('clothStriped', { side: THREE.DoubleSide }), iron: M('castiron') }, awnings, { tintMat: 'cloth' });
        insts(h, 'terrace', { platform: M('chalk'), iron: M('castiron'), cane: M('noise', {}, '#b8925a', ['#8a6a3a', '#d0b080']) }, terr);
        insts(h, 'partygoer', { payload: M('paneDark') }, people);
        insts(h, 'bench', { vert: M('boards', { c: 0x9a7a5a }), iron: M('matGray') }, benches);
        insts(h, 'bollardQuay', { shaft: M('matGray'), lampObj: M('lampObj', GLOW) }, bollards);
        insts(h, 'streetlampStreet', { shaft: M('matGray'), lampObj: M('lampObj', GLOW) }, rev);
        puts('carParked', { carBody: M('paint', { c: 0xffffff }), pane: M('paneDark'), lightRed: M('lightRed'), lightWhite: M('matGray'), chassis: M('matGray'), wheelPart: M('wheelPart'), tire: M('tire') }, autoList, { tintMat: 'carBody' });
        const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(lights.concat(brightF), 3)); fg.setAttribute('color', new THREE.Float32BufferAttribute(lights.map((v, k) => [1, 0.88, 0.66][k % 3]).concat(brightC), 3));
        const pf = new THREE.Points(fg, new THREE.PointsMaterial({ size: 2.5, sizeAttenuation: false, vertexColors: true })); pf.frustumCulled = false; h.scene.add(pf); }
      // in the distance, beyond the fog: the city behind, a headland across the bay, the industrial zone to the east, a large suspension bridge to the west
      const fars = [['#0a1020', ['#ffb85a', '#f4f1e0', '#ffd27a'], 90], ['#0c0e18', ['#9fd0ff', '#f4f1e0'], 60], ['#140c10', ['#ff9a5a', '#ffd27a'], 40]].map(([f, c, n]) => M('towerFar', { emis: 1, fog: false }, f, c, n)), ll = fars.map(() => []);
      const heapFn = (cx, cz, n, rx, rz, hmin, hmax, wmin) => { for (let i = 0; i < n; i++) { const hh = hmin + rnd() * rnd() * (hmax - hmin), w = wmin + rnd() * wmin; ll[i % 3].push([cx + (rnd() - 0.5) * rx, hh / 2 - 4, cz + (rnd() - 0.5) * rz, 0, w, hh, w]); } };
      for (let i = 0; i < 60; i++) { const a = 3.3 + rnd() * 2.8, r = 1900 + rnd() * 900, hh = 120 + rnd() * rnd() * 420, w = 60 + rnd() * 110; ll[0].push([500 + Math.cos(a) * r * 1.4, hh / 2 - 1, -100 + Math.sin(a) * r, 0, w, hh, w]); }
      heapFn(600, 3600, 70, 4200, 500, 30, 180, 40); heapFn(-1600, 3000, 30, 1200, 600, 20, 90, 40); heapFn(3900, 800, 40, 500, 2600, 20, 120, 50); heapFn(-3300, -300, 40, 600, 2200, 30, 200, 50);
      ll.forEach((l, i) => inst(h, h.geo('blk'), fars[i], l));
      const farAway = [], cFar = [], fire = (x, y, z, c) => { farAway.push(x, y, z); cFar.push(...c); };
      for (let i = 0; i < 700; i++) { const x = -1600 + rnd() * 5000, z = 3300 + rnd() * rnd() * 900; fire(x, -2, z, rnd() < 0.7 ? [1, 0.72, 0.4] : [0.9, 0.95, 1]); } // the opposite headland: a ribbon of lights
      for (let i = 0; i < 18; i++) { const x = 3600 + rnd() * 600, z = -1000 + rnd() * 2600, hh = 40 + rnd() * 80; fire(x, hh, z, [1, 0.1, 0.15]); ll[1].push([x, hh / 2, z, 0, 6, hh, 6]); } // factory chimneys with red lights
      for (let i = 0; i < 4; i++) fire(3500 + i * 60, 60 + i * 5, 300 + i * 220, [1, 0.6, 0.1]); // flare stacks
      for (let k = 0; k <= 80; k++) { const t = k / 80, x = -2600 + t * 1500, z = 1700 + t * 1900, cat = Math.abs(t - 0.5) < 0.25 ? 1 - ((t - 0.5) / 0.25) ** 2 : ((Math.abs(t - 0.5) - 0.25) / 0.25) ** 2 * 0.6; fire(x, 40, z, [1, 0.85, 0.5]); if (k % 2 === 0) fire(x, 40 + 130 * (1 - cat), z, [0.9, 0.95, 1]); } // suspension bridge: deck and main cable
      for (const t of [0.25, 0.75]) ll[1].push([-2600 + t * 1500, 85, 1700 + t * 1900, 0.67, 8, 180, 8]);
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(farAway, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(cFar, 3));
      const pFar = new THREE.Points(lg, new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, fog: false })); pFar.frustumCulled = false; h.scene.add(pFar);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(beaconList.concat(lightsRed), 3));
      const bp = new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xff2030, size: 2, sizeAttenuation: false, fog: false })); bp.frustumCulled = false; h.scene.add(bp);

      // ---------- Ferris wheel on the seafront: A-frame support, rotor (double rim, spokes, hub) carrying the lights, gondolas that stay plumb ----------
      const HR = 78, RR = 70, wheelG = new THREE.Group(); wheelG.userData.dyn = 1; wheelG.position.set(620, g.hAt(620, 40) + HR, 40); wheelG.rotation.y = 0.5; h.scene.add(wheelG);
      const steelR = M('metalPale', { c: 0xe8ecf4 });
      h.pose('wheelSupport', { steelMat: steelR, plinth: M('warehouse') }, wheelG, [0, 0, 0], HR);
      const rotor = new THREE.Group(); wheelG.add(rotor); h.pose('wheelRotor', { rimPart: steelR, arcRadius: steelR, hub: M('matGray') }, rotor, [0, 0, 0], RR);
      const rp = [], rc = [];
      for (const z of [-4.2, 4.2]) for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283; rp.push(Math.cos(a) * RR, Math.sin(a) * RR, z); rc.push(...[[1, 0.3, 0.6], [0.3, 0.9, 1], [1, 0.9, 0.3]][i % 3]); if (i % 6 === 0) for (let r = 10; r < RR; r += 12) { rp.push(Math.cos(a) * r, Math.sin(a) * r, z); rc.push(1, 1, 1); } }
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3));
      const wheel2 = new THREE.Points(rg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, fog: false })); wheel2.frustumCulled = false; rotor.add(wheel2);
      // the foot of the wheel: paved esplanade, ticket booths, a turning carousel, a queue, garlands; the wheel rises from the ground kept between the two basins of the marina
      const carousel = new THREE.Group(); carousel.userData.dyn = 1; carousel.position.set(672, 0.05, 46); h.scene.add(carousel);
      { boxMesh(h, M('slabsQuay'), 150, 0.3, 46, 620, -0.1, 37);
        h.pose('carouselRide', { plinth: M('boards', { c: 0xd8b07a }), mat: M('metalPale', { c: 0xe8c040 }), roofM: M('metalPale', { c: 0xc8304a }), barLine: M('metalPale', { c: 0xe8c040 }), horse: M('metalPale', { c: 0xf4f0ea }) }, carousel);
        const lm = [], lc = []; for (let k = 0; k < 40; k++) { const a = k / 40 * 6.283; lm.push(Math.cos(a) * 8, 6.4, Math.sin(a) * 8); lc.push(...[[1, 0.85, 0.3], [1, 0.3, 0.6], [0.3, 0.9, 1]][k % 3]); }
        const mg2 = new THREE.BufferGeometry(); mg2.setAttribute('position', new THREE.Float32BufferAttribute(lm, 3)); mg2.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
        const pm2 = new THREE.Points(mg2, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true })); pm2.frustumCulled = false; carousel.add(pm2);
        const gu = [[562, 20], [574, 20], [666, 22], [678, 22]].map(([x, z]) => [x, 0.05, z, Math.PI]);
        insts(h, 'ticketDesk', { hut: M('metalPale', { c: 0xf4ece0 }), pane: M('towerWindows', GLOW, ['#ffe2a0']), awning: M('striping', GLOW), signboard: M('written', GLOW, 64, 14, '#c8304a', '#ffffff', 'TICKETS', 9) }, gu);
        const file = []; for (let k = 0; k < 14; k++) file.push([560 + (k % 7) * 2.2 + (k > 6 ? 108 : 0), 0.05, 15.5 + (rnd() - 0.5), rnd() * 6.3, 0.95 + rnd() * 0.1]);
        insts(h, 'partygoer', { payload: M('paneDark') }, file);
        const gl = [], gc = []; for (let x = 548; x <= 692; x += 2) { gl.push(x, 4 - Math.abs(Math.sin((x - 548) / 12 * Math.PI)) * 1.2, 15); gc.push(...[[1, 0.85, 0.3], [1, 0.4, 0.7]][(x / 2) & 1]); } // scalloped garland along the esplanade
        const gg2 = new THREE.BufferGeometry(); gg2.setAttribute('position', new THREE.Float32BufferAttribute(gl, 3)); gg2.setAttribute('color', new THREE.Float32BufferAttribute(gc, 3));
        const pg2 = new THREE.Points(gg2, new THREE.PointsMaterial({ size: 2.5, sizeAttenuation: false, vertexColors: true })); pg2.frustumCulled = false; h.scene.add(pg2);
        for (const x of [560, 620, 680]) h.emis(near(h, x, 0), x, 5, 24, x === 620 ? 0xff6ab0 : 0xffd890, 30, 1.8); }
      const NN = 24, gondolas = new THREE.InstancedMesh(h.geo('gondola'), M('gondola', GLOW, '#e8e8e8'), NN), dn = new THREE.Object3D(); gondolas.frustumCulled = false; wheelG.add(gondolas);
      for (let k = 0; k < NN; k++) gondolas.setColorAt(k, new THREE.Color([0xff4a8a, 0x4ac8ff, 0xffd84a, 0x6aff8a][k % 4]));

      // ---------- the red and white lighthouse at the tip of the island, at the water's edge: the hairpin (points 11 to 16) goes round it; its beam turns, short and discreet ----------
      const whiteP = M('metalPale', { c: 0xf2f0ea }), redP = M('metalPale', { c: 0xc8202a }), yPH = g.hAt(PH[0], PH[1]);
      h.pose('headlight', { concretePart, redTone: redP, whiteN: whiteP, steelMat: gray, lampObj: M('lampObj', GLOW) }, h.scene, [PH[0], yPH, PH[1]]);
      const lightHeadlight = new THREE.Group(); lightHeadlight.userData.dyn = 1; lightHeadlight.position.set(PH[0], yPH + 27.8, PH[1]); h.scene.add(lightHeadlight);
      const mBeam = h.addMat(h.tx('gradient', '#fff2c0', true), { opacity: 0.18 });
      for (const sd of [-1, 1]) { const b = new THREE.Mesh(h.geo('beam'), mBeam); b.rotation.z = sd * Math.PI / 2; b.scale.set(0.1, 0.15, 1); lightHeadlight.add(b); } // two opposed beams of 135 m, one vertical plane each: crossed, they covered the screen when passing over the hairpin (bench: worst frames at 60 ms)
      h.emis(near(h, PH[0], PH[1]), PH[0], yPH + 6, PH[1], 0xfff2d0, 40, 1.2); // the foot of the lit lighthouse: visible from the hairpin

      // ---------- the marina, along the start straight (points 0 to 3, at water level): promenade, quay with low lit bollards (no lamp posts),
      // main pontoon along the quay and comb pontoons, sailing boats and motor boats in place, and a yacht at the quay at the end of the basin, where the party is in full swing ----------
      const party = []; // yacht garland groups, which tick makes blink in turn
      { const edges = [[30, 540], [700, 1040]], whiteB = M('metalPale', { c: 0xf2f0ea }), windowMat = M('towerWindows', GLOW, ['#ffd27a', '#f4f1e0']), boards = M('boards', { c: 0xb89a70 });
        for (const [x0, x1] of edges) { boxMesh(h, water, x1 - x0, 1, CH0 - MQ, (x0 + x1) / 2, -3.5, (MQ + CH0) / 2); boxMesh(h, concretePart, x1 - x0, 4, 3, (x0 + x1) / 2, -2, MQ); // the basin water and its quay
          boxMesh(h, M('slabsQuay'), x1 - x0, 0.3, MQ - W - 6.5, (x0 + x1) / 2, -0.1, (MQ - 1.5 + W + 5) / 2); } // the promenade, from the road to the quay
        const bollards = [], lights = [], pontoons = [], sailboats = [], motorboats = [];
        for (const [x0, x1] of edges) {
          for (let x = x0 + 6; x < x1; x += 15) { bollards.push([x, 0, MQ - 2]); lights.push(x, 1.05, MQ - 2); if ((x - x0) % 30 < 15) h.emis(near(h, x, 0), x, 3, MQ + 4, 0xffe0a8, 36, 2.2); } // quay bollards; one in three lit (up to the road)
          pontoons.push([(x0 + x1) / 2, -3.55, MQ + 3.5, 0, x1 - x0 - 4, 1, 1]); // the main pontoon, along the quay
          for (let fx = x0 + 8; fx < x1 - 6; fx += 24) { if (fx > 410 && fx < 540) continue; // the yacht's square
            pontoons.push([fx, -3.55, MQ + 30, Math.PI / 2, 50, 1, 1]); bollards.push([fx, -2.98, MQ + 54]); lights.push(fx, -1.93, MQ + 54); // a comb pontoon, the same bollard at its end
            if (fx + 24 >= x1 - 6) continue;
            // the berths: along each pontoon, on both sides of the water lane (16 m in the middle), from the quay to the end; one in four free, at random
            for (const [cx, direction] of [[fx + 3.4, 1], [fx + 20.6, -1]]) for (let bz = MQ + 8; bz < MQ + 52;) { const L = 8 + rnd() * 8; if (bz + L > MQ + 54) break;
              if (rnd() > 0.26) { const v = rnd() < 0.55; (v ? sailboats : motorboats).push([cx + direction * (L * 0.16 - 2.4), -3.45, bz + L / 2, (rnd() < 0.7 ? -1 : 1) * Math.PI / 2 + (rnd() - 0.5) * 0.04, L, L, L]); }
              bz += L + 1.5; } } }
        insts(h, 'bollardQuay', { shaft: M('matGray'), lampObj: M('lampObj', GLOW) }, bollards);
        insts(h, 'pontoon', { boards, floater: M('matGray') }, pontoons, { a: [1] }); // 1 m pontoon stretched to its length (the planks follow)
        const skinB = { hull: whiteB, bridge: boards, portholes: windowMat, mat: M('steelMat'), rubStrip: M('metalPale', { c: 0x1a2a4a }), deckhouse: M('metalPale', { c: 0xe8e4dc }), veil: M('metalPale', { c: 0x2a4a7a }), whiteN: whiteB };
        puts('sailboat', skinB, sailboats); puts('motorboat', { ...skinB, hull: M('metalPale', { c: 0xe8e4dc }) }, motorboats);
        // the party yacht: at the quay at the end of the west main pontoon, parallel to the quay; partygoers on the aft deck and on the flybridge, garlands flashing, pink and cyan light
        const YX = 470, YZ = MQ + 14, yacht = new THREE.Group(); yacht.position.set(YX, -2.7, YZ); yacht.rotation.y = Math.PI; h.scene.add(yacht);
        h.pose('yacht', { hull: whiteB, bridge: boards, whiteN: whiteB, portholes: M('towerWindows', GLOW, ['#ffb0e0', '#ffe8c0', '#a0e8ff']) }, yacht);
        const people = []; for (let k = 0; k < 34; k++) { const fly = k > 20, x = fly ? -12 + rnd() * 16 : -20 + rnd() * 10, z = (rnd() - 0.5) * (fly ? 5.6 : 6.8); people.push([x, fly ? 7.48 : 2.38, z, rnd() * 6.3, 0.9 + rnd() * 0.2]); }
        { const mC = M('paneDark'), d = new THREE.Object3D(), mF = new THREE.InstancedMesh(h.zones('partygoer', { payload: mC }).payload, mC, people.length); mF.frustumCulled = false; // in the yacht's frame
          people.forEach((p, k) => { d.position.set(p[0], p[1], p[2]); d.rotation.set(0, p[3], 0); d.scale.setScalar(p[4]); d.updateMatrix(); mF.setMatrixAt(k, d.matrix); }); yacht.add(mF); }
        for (const [cols2, y, x0, x1, zz] of [[[1, 0.2, 0.7], 3.3, -21, -1, 4], [[0.2, 0.9, 1], 8.4, -14, 8, 3.5], [[1, 0.85, 0.2], 3.3, -21, -1, -4], [[1, 0.2, 0.7], 8.4, -14, 8, -3.5]]) { // garlands along the railings
          const lp = []; for (let x = x0; x <= x1; x += 0.8) lp.push(x, y + Math.sin(x * 0.7) * 0.15, zz);
          const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
          const pg = new THREE.Points(gg, new THREE.PointsMaterial({ color: new THREE.Color(...cols2), size: 3, sizeAttenuation: false })); pg.frustumCulled = false; yacht.add(pg); party.push(pg); }
        yacht.userData.dyn = 1;
        h.emis(near(h, YX, 0), YX - 6, 8, YZ, 0xff3ab0, 40, 3.2); h.emis(near(h, YX + 20, 0), YX + 12, 11, YZ, 0x3ad0ff, 36, 2.4);
        const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(lights, 3));
        const pm = new THREE.Points(mg, new THREE.PointsMaterial({ color: 0xffe8c0, size: 2, sizeAttenuation: false })); pm.frustumCulled = false; h.scene.add(pm); }

      // ---------- opposite the marina, city side: a lit construction crane ----------
      const CG = CG0, craneC = new THREE.Group(); craneC.userData.dyn = 1; craneC.position.set(CG[0], g.hAt(CG[0], CG[1]), CG[1]); h.scene.add(craneC);
      const yellow = M('metalPale', { c: 0xe8b020 });
      h.pose('towerCrane', { concretePart, lattice: M('lattice', { alphaTest: 0.5, side: THREE.DoubleSide }, '#e8b020'), steelMat: yellow, cabin, pane }, craneC);
      boxMesh(h, concretePart, 30, 34, 30, CG[0] - 34, g.hAt(CG[0], CG[1]) + 17, CG[1] - 10); // the tower under construction: a concrete core, no facade yet
      { const lp = [], lc = []; // lamp garland along the mast and the jib (white), red lamps at the tip and end of the jib
        for (let y = 3; y < 60; y += 2.5) lp.push(1, y, 1), lc.push(1, 0.95, 0.85);
        for (let x = -16; x <= 50; x += 2) lp.push(x, 62, 0), lc.push(1, 0.95, 0.85);
        for (const p of [[0, 69, 0], [50, 62.5, 0], [-17, 62.5, 0]]) lp.push(...p), lc.push(1, 0.1, 0.15);
        const lg2 = new THREE.BufferGeometry(); lg2.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg2.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
        const pg = new THREE.Points(lg2, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, fog: false })); pg.frustumCulled = false; craneC.add(pg); }

      // ---------- the moving gantry of the straddle: one of the park gantries rolls over the road, back and forth (see the straddle, above) ----------
      const gantryM = new THREE.Group(); gantryM.userData.dyn = 1; h.scene.add(gantryM);
      h.pose('cranePark', { structure: M('metalPale', { c: 0xe0b020 }), cabin, pane, wheelPart, machinery }, gantryM, [0, 0, 0], 36);
      { const s = S[iPm], [x, z] = edgePt(s, 1, 18); h.emis(iPm, x, s.y + 22, z, 0xffc040, 40, 1.4); } // beacon and gantry lighting

      // ---------- the abandoned toll (points 30 to 31): platform on a slab on each side of the viaduct, booths switched off but with sodium-lit glass, canopy across the full width ----------
      { const s = S[near(h, -450, -245)], r = marker(h, s), slab = M('asphalt'), L = 2 * W + 44, sentryBox = { concretePart, nose: M('striping', GLOW), cabin: whiteP, pane: M('sodium', GLOW) }; // the six sentry boxes share their materials: one draw pass per material, not per sentry box
        h.pose('awningToll', { roofM: M('concreteGray'), lampObj: M('sodium', GLOW), steelMat: gray, signboard: M('written', GLOW, 128, 16, '#3a2a10', '#ffb040', '料金所  TOLL  閉鎖 CLOSED', 11) }, r, [0, 0, 0], L);
        for (const sd of [-1, 1]) { h.pose('boxMesh', slab, r, [sd * (W + 11.5), -0.6, 0], 21, 1, 36); // the slab of the closed lanes, at carriageway level
          for (const sz of [-12, 12]) h.pose('boxMesh', concretePart, r, [sd * (W + 11.5), -s.y / 2 - 1, sz], 3, s.y, 3); // ses piles
          for (const e of [5, 11, 17]) h.pose('sentryBox', sentryBox, r, [sd * (W + e), 0, 0]); }
        h.emis(near(h, -450, -245), s.x, s.y + 7, s.z, 0xffa040, 36, 2.6); }

      // ---------- the love hotel sign (point 32): the city's first pink light, on a mast at the viaduct edge, in front of the hotel ----------
      { const i = near(h, -175, -95), s = S[i], [x, z] = edgePt(s, -1, W + 9), r = marker(h, s); r.position.set(x, s.y - 2, z);
        h.pose('signboardHotel', { steelMat: gray, signboard: M('written', GLOW, 128, 52, '#2a0418', '#ff4ab0', 'HOTEL ♥ LOVE', 30), heart: M('lampObj', { emis: 1, c: 0xff3a8a }), vacant: M('written', GLOW, 64, 14, '#08200e', '#5aff8a', '空室 VACANT', 10) }, r);
        const [hx, hz] = edgePt(s, -1, W + 40); boxMesh(h, lapRun(['#ff4ab0', '#ffb0d8', '#b05aff']), 26, 30, 22, hx, g.hAt(hx, hz) + 14, hz);
        h.emis(i, x, s.y + 14, z, 0xff4ab0, 30, 1.8); }

      // ---------- trucks: a cab-forward tractor and a trailer (container, tank or reel flatbed), following the traffic of sim.js ----------
      const nt = h.M.traffic, dc = new THREE.Object3D(), types = ['trailerContainer', 'trailerTank', 'trailerPlatform'];
      const fleet = (label, skin, n) => Object.entries(h.zones(label, skin)).map(([zn, geo]) => { const m = new THREE.InstancedMesh(geo, skin[zn], Math.max(1, n)); m.count = n; m.frustumCulled = false; m.userData.dyn = 1; h.scene.add(m); return m; });
      const cabinC = M('metalPale'), bodyC = M('tin');
      const tractorsC = fleet('tractor', { chassis, tire, cabin: cabinC, pane, radiator: M('radiator'), headlight: lampObj, lightOrange: blinkMat, wheelPart }, nt);
      const trailers = types.map((label, t) => fleet(label, { chassis, wheelPart, tire, fire: lightRed, carBody: bodyC, vat: M('stainless'), platform: M('boards'), coil: M('coil'), strap: M('strap') }, Math.ceil((nt - t) / 3)));
      const tintsCab = [0x2c6ab8, 0xe8e4dc, 0xc8302c, 0x1f8f5a, 0xd8a02c, 0x5a5e66, 0xe86a1a, 0x2a2a34, 0x7a9ac8].map(c => new THREE.Color(c));
      for (let i = 0; i < nt; i++) {
        for (const m of tractorsC) if (m.material === cabinC) m.setColorAt(i, tintsCab[i % tintsCab.length]);
        if (i % 3 === 0) for (const m of trailers[0]) if (m.material === bodyC) m.setColorAt(i / 3, new THREE.Color(cols[(i * 5) % cols.length]));
      }
      const viewed = [...tractorsC, ...trailers.flat()];
      for (const m of viewed) if (m.instanceColor) m.instanceColor.needsUpdate = true;
      const tick = (dt, now) => {
        party.forEach((p, k) => { p.visible = ((now / 469 | 0) + k) % 3 !== 0; }); // the yacht garlands to the tempo (128 bpm)
        lightHeadlight.rotation.y = now * 0.0009; craneC.rotation.y = Math.sin(now * 0.00007) * 0.8; // one lighthouse turn every 7 s; the crane slowly pivots
        { const u = iPm + N + Math.sin(now * 0.00025) * 10, j = Math.floor(u), f = u - j, a = S[j % N], b = S[(j + 1) % N]; // ±20 m along the road, one round trip in 25 s
          gantryM.position.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f); gantryM.rotation.y = h.across(a); }
        carousel.rotation.y = now * 0.0006; rotor.rotation.z = now * 0.00012; bp.visible = (now / 700 & 1) === 1; ptsBuoys.visible = (now / 1100 & 3) === 0;
        for (let k = 0; k < NN; k++) { const a = k / NN * 6.2832 + rotor.rotation.z; dn.position.set(Math.cos(a) * RR, Math.sin(a) * RR - 2.2, 0); dn.updateMatrix(); gondolas.setMatrixAt(k, dn.matrix); } // the gondola hangs below the rim, always plumb
        gondolas.instanceMatrix.needsUpdate = true;
        for (const [p, ph] of passers) loopSec(now * 0.007 / LB + ph, p); // 7 m/s
        const vis = h.time() >= 0; for (const m of viewed) m.visible = vis; if (!vis) return; // no trucks in race mode
        traffic(T, h.time()).forEach((k, i) => {
          dc.position.set(k.x, k.y, k.z); dc.rotation.set(0, -k.th, 0); dc.updateMatrix();
          for (const m of tractorsC) m.setMatrixAt(i, dc.matrix);
          for (const m of trailers[i % 3]) m.setMatrixAt(i / 3 | 0, dc.matrix);
        });
        for (const m of viewed) m.instanceMatrix.needsUpdate = true;
      };
      tick.view = placeCabo; return tick;
    },
  });
})();
