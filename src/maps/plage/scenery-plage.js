// Placement of the "beach" scenery: adds its function to SCENERY. The shared placers come from scenery.js. See docs/methods/SCENERY.md.
(function () {
  const { inst, near, pt, indexed, insts, GLOW, boxMesh, edgePt, marker, weld, terrain } = PLACERS;

  Object.assign(SCENERY, {
    // ---------- Playa 307 (Riviera Maya, noon, Feria del Carmen day): rework ----------
    // A seaside town crossed by a road: hotel beach and its sand square, a single-deck pier, street, feria square, market hall, route 307, open cenote (lake),
    // rock shelter then hall (the engine's tunnel, bare: th.tun.without), lagoon dike. The north (z < 0) is the sea.
    // The fixed scenery first, then "life": what moves is registered in LIFE and the tick returned at the end advances it. Texture rule: no wavy band over the large surfaces (noise grain and accidents placed by the scenery).
    plage(h) {
      const { THREE, S, N, W, T, rnd } = h, D = THREE.DoubleSide, P = i => pt(h, i), IX = new Map(S.map((s, i) => [s, i])), n0 = h.scene.children.length;
      const off = (i, o) => { const s = S[(i % N + N) % N]; return [s.x - s.tz * o, s.z + s.tx * o]; }; // point at o metres from the axis (positive = to the right) at sample i
      const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      const grain = (backdrop, g, o = {}) => h.mat('noise', o, backdrop, g);
      // sheet: a horizontal polygon [[x, z], …] at height y (holes = polygons removed); the texture repeats every t metres
      const sheet = (pts, y, m, t = 12, boreHoles = []) => {
        const V = a => a.map(([x, z]) => new THREE.Vector2(x, z)), c = V(pts), ho = boreHoles.map(V), allRes = [...c, ...ho.flat()], pos = [], uv = [], nor = [], idx = [];
        for (const v of allRes) { pos.push(v.x, y, v.y); uv.push(v.x / t, v.y / t); nor.push(0, 1, 0); }
        for (const [a, b, d] of THREE.ShapeUtils.triangulateShape(c, ho)) { const A = allRes[a], B = allRes[b], C = allRes[d]; (B.y - A.y) * (C.x - A.x) - (B.x - A.x) * (C.y - A.y) > 0 ? idx.push(a, b, d) : idx.push(a, d, b); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
        const me = new THREE.Mesh(g, m); me.receiveShadow = true; h.scene.add(me); return me;
      };
      // wall: a vertical face along a line [[x, z], …], from y0 to y1 (numbers or functions of the point's rank)
      const intoWall = (pts, y0, y1, m, t = 8) => {
        const pos = [], uv = [], idx = [], f = (y, k) => typeof y === 'function' ? y(k) : y; let l = 0;
        pts.forEach(([x, z], k) => { if (k) l += Math.hypot(x - pts[k - 1][0], z - pts[k - 1][1]); pos.push(x, f(y0, k), z, x, f(y1, k), z); uv.push(l / t, f(y0, k) / t, l / t, f(y1, k) / t); if (k) { const a = k * 2 - 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
        const me = new THREE.Mesh(g, m); me.receiveShadow = true; h.scene.add(me); return me;
      };
      // ribbon along the track in pieces: only where retain(i) is true
      const ribbonFn = (i0, n, oa, ya, ob, yb, m, retain, v = 8) => { const out = []; for (let k = 0, a = -1; k <= n; k++) { const ok = k < n && (!retain || retain((i0 + k) % N)); if (ok && a < 0) a = k; if (!ok && a >= 0) { out.push(h.ribbon((i0 + a) % N, k - a, oa, ya, ob, yb, m, v)); a = -1; } } return out; };
      const OFF = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, col2 = c => h.mat('paint', { c, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
      const line = (i0, i1, o, stepSec = 2) => { const l = []; for (let i = i0; i <= i1; i += stepSec) l.push(off(i, typeof o === 'function' ? o(S[i % N], i) : o)); return l; };

      // materials of the large masses (non-directional grain)
      const mSand = grain('#cdbb8e', ['#c2ae80', '#d8c89e', '#b8a476']), mCircuit = grain('#a8946c', ['#9c8860', '#b4a078', '#8e7c58'], OFF), mGround = grain('#bdb48e', ['#a9a078', '#cfc8a6', '#8f9462']);
      const mSlab = h.mat('pavingQuinta'), mRock = grain('#ddd2b2', ['#c8bc98', '#ece2c6', '#b4a884'], { side: D }), mRockS = grain('#8e8a78', ['#7c7868', '#a09c88', '#5e6654'], { side: D });
      const mSascab = grain('#d2c8ae', ['#c4baa0', '#ddd4bc'], OFF), mRiprap = grain('#a8a294', ['#8e887a', '#c0baac', '#787266'], { side: D }), mWood = h.mat('boards', { side: D }), mBoards = h.mat('boardsQuay');
      const mSeaB = grain('#9fe3d2', ['#b4ecde', '#8ad8c8'], { smooth: 1 }), mSea = grain('#4fcbc3', ['#62d4cc', '#42bfb8'], { smooth: 1 }), mSeaL = grain('#146a8c', ['#1a7496', '#105e80'], { smooth: 1 });
      const mLagoon = grain('#5d9480', ['#689e8a', '#528874', '#7a9a6a'], { smooth: 1 }), mCenote = grain('#2fb3d0', ['#49c4dc', '#27a6c4'], { smooth: 1, transparent: true, opacity: 0.5, depthWrite: false });
      const mBg = h.mat('paint', { c: 0x0b3f63 }), mHigh = grain('#d8d2b8', ['#c4c0a4', '#e6e2cc']);

      mRockS.emissive = new THREE.Color(0x1c2224);
      // ---------- track landmarks (cenote v9, author's drawing): a small covered cave. Entrance gallery, S-shaped plank walkway over the water
      // (against the left wall, then a bridge between two basins), beach in line with the walkway, exit gallery at exitAt. The shapes come out of a fixed chance, in blocks ----------
      const tT = T.t0, t1 = T.t1, i25 = P(25), WATER = -7, YT = 7.5;   // WATER: water level, 1 m below the walkway; YT: top of the rock mound covering the hall
      let iz = i25; while (S[iz].y > -0.2) iz++;      // landmarks of the sascab and of the mangrove path (unchanged)
      let ix = t1; while (S[ix].y < -0.2) ix++;
      let jz = i25; while (S[jz].y > 0.05) jz++; let jx = t1; while (S[jx].y < 0) jx++;   // the hollow: everything that rolls below ground level
      const iA = P(27) + 7, iB = P(33) - 3, i29 = P(29), i31 = P(31);                    // the hall: from iA to iB; before and after, the galleries
      const hz = (a, b = 0) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };                                  // hasard fixe
      const blk = (i, j, l = 4) => hz(Math.floor((i + hz(j, 9) * l) / l), j);                                                                        // … constant per blocks of l ranks (steps, broken strata)
      const smoothNoise = (i, j, l = 12) => { const u = i / l, k = Math.floor(u), f = u - k; return hz(k, j) + (hz(k + 1, j) - hz(k, j)) * f * f * (3 - 2 * f); }; // … continu (grandes formes)
      const E0 = i => 0.3 + ss(tT - 4, tT, i) * (1 - ss(t1, t1 + 4, i));   // foot of the walls: flush with the open-air drivable limit, just behind the guard rail under the rock
      const basinG = i => { const b = 16 * ss(i29 + 2, i29 + 10, i) * (1 - ss(i31 - 2, i31 + 5, i)) * (0.8 + 0.4 * smoothNoise(i, 57, 5)); return b > 0.05 ? b : 0; };   // the secondary basin, to the left of the bridge
      // the right wall of the hall: from the mouth of the entrance gallery to that of the exit gallery on the north side, a rounded broken line then cut in blocks (the beach is in its last pocket)
      const SHORE = (() => { let c = [off(iA, S[iA].w + E0(iA)), [286, 446], [281, 432], [268, 422], [252, 424], [236, 416], [216, 411], [202, 414], [196, 421], off(iB, S[iB].w + E0(iB))];
        for (let q = 0; q < 3; q++) c = [c[0], ...c.slice(0, -1).flatMap((p, k) => { const n = c[k + 1]; return [[p[0] * 0.75 + n[0] * 0.25, p[1] * 0.75 + n[1] * 0.25], [p[0] * 0.25 + n[0] * 0.75, p[1] * 0.25 + n[1] * 0.75]]; }), c[c.length - 1]];
        return c.map((p, k) => { const a = c[Math.max(0, k - 1)], b = c[Math.min(c.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, f = Math.min(1, k / 4, (c.length - 1 - k) / 4) * 2.6 * (smoothNoise(k, 62, 5) - 0.5 + 0.5 * (blk(k, 63, 3) - 0.5)); return [p[0] + (b[1] - a[1]) / l * f, p[1] - (b[0] - a[0]) / l * f]; }); })();
      // the right edge of the hollow, in the direction of travel: cutting and entrance gallery, hall wall, gallery and exit cutting; DR = direction towards the road or the water
      const NR = SHORE.length, kR = iA - jz, RIGHT = [...Array.from({ length: kR }, (_, k) => off(jz + k, S[jz + k].w + E0(jz + k))), ...SHORE, ...Array.from({ length: jx - iB }, (_, k) => off(iB + 1 + k, S[iB + 1 + k].w + E0(iB + 1 + k)))];
      const DR = RIGHT.map((p, k) => { const a = RIGHT[Math.max(0, k - 1)], b = RIGHT[Math.min(RIGHT.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l]; });
      const LEFT_SIDE = i => off(i, -(S[i].w + E0(i) + basinG(i))), HALL = [...Array.from({ length: iB - iA + 1 }, (_, k) => LEFT_SIDE(iA + k)), ...SHORE.slice().reverse()];   // foot of the hall walls
      const HOLLOW = [...Array.from({ length: jx - jz + 1 }, (_, k) => off(jz + k, -(S[jz + k].w + E0(jz + k) + 2.5 + basinG(jz + k)))), ...RIGHT.map((p, k) => [p[0] - DR[k][0] * 2.5, p[1] - DR[k][1] * 2.5]).reverse()];   // a single polygon removed from the ground (embankment and mound cover it)
      // ---------- grounds and waters (polygons without overlap) ----------
      const LAG = [[60, 105], [120, 150], [135, 260], [110, 340], [60, 385], [34, 378], [-12, 376], [-34, 392], [-60, 424], [-120, 440], [-900, 460]]; // lagoon shore on the land side, north to south
      sheet([[-900, -46], [1500, -46], [1500, -12], [540, -12], [540, 100], [60, 100], [60, 105], [-900, 105]], -0.06, mSand);
      sheet([[540, -12], [760, -12], [760, 360], [540, 360]], -0.06, mSlab, 8);
      sheet([[60, 100], [540, 100], [540, 360], [1500, 360], [1500, 1500], [-900, 1500], ...LAG.slice().reverse()], -0.06, mGround, 12, [HOLLOW]);
      sheet([[760, -12], [1500, -12], [1500, 360], [760, 360]], -0.06, mGround);
      sheet([[-900, 105], [60, 105], ...LAG.slice(1)], -1, mLagoon, 16);
      intoWall([[-900, 105], ...LAG], -1.6, -0.02, mRiprap);
      { const B = [[-44, '#9fe3d2'], [-60, '#7fdacc'], [-85, '#62d0c6'], [-120, '#4cc2c0'], [-165, '#3aaeb8'], [-220, '#2c98ac'], [-290, '#2084a0'], [-380, '#187494'], [-2500, '#146a8c']]; // the sea as a gradient: nine bands of neighbouring tints, no line between turquoise and blue
        // one single white material and the tint of each band as a vertex colour: 1 drawing pass instead of 8 (the bands' grain() calls remain: their textures pull in rnd)
        const mSea8 = grain('#ffffff', ['#f2f2f2'], { smooth: 1 }), cs = [], ps = [], us = [], ns = [], ix = [], C8 = new THREE.Color(); mSea8.vertexColors = true;
        for (let k = 0; k < B.length - 1; k++) { grain(B[k][1], [B[k + 1][1]], { smooth: 1 }); C8.set(B[k][1]);
          for (const [x, z] of [[-2500, B[k + 1][0]], [2500, B[k + 1][0]], [2500, B[k][0]], [-2500, B[k][0]]]) { ps.push(x, -0.3, z); us.push(x / 16, z / 16); ns.push(0, 1, 0); cs.push(C8.r, C8.g, C8.b); }
          ix.push(4 * k, 4 * k + 2, 4 * k + 1, 4 * k, 4 * k + 3, 4 * k + 2); }
        const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.Float32BufferAttribute(ps, 3)); gm.setAttribute('uv', new THREE.Float32BufferAttribute(us, 2)); gm.setAttribute('normal', new THREE.Float32BufferAttribute(ns, 3)); gm.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); gm.setIndex(ix);
        const sea8 = new THREE.Mesh(gm, mSea8); sea8.receiveShadow = true; h.scene.add(sea8); }
      sheet([[-900, -44], [-2500, -44], [-2500, 1500], [-900, 1500]], -0.3, mSeaL, 16); sheet([[1500, -44], [2500, -44], [2500, 1500], [1500, 1500]], -0.08, mGround, 12);

      // ---------- coverings laid on the roadway (the 307 and the dike's asphalt is the engine's) ----------
      const tr = (a, b, m0 = 0, m1 = 0) => { const i0 = (P(a) - m0 + N) % N; return [i0, (P(b) + m1 - i0 + N) % N]; };
      h.ribbon(...tr(43, 3, -6, 4), -W, 0.02, W, 0.02, mCircuit, 12);                                   // hard beach sand
      h.ribbon(...tr(11, 20, 4, 18), s => -s.w, 0.02, s => s.w, 0.02, h.mat('pavingQuinta', { ...OFF, rep: [3, 1] }), 8); // town paving
      h.ribbon(i25 + 10, tT - i25 - 10, s => -s.w, 0.02, s => s.w, 0.02, mSascab, 12); h.ribbon(t1, ix - t1 + 14, s => -s.w, 0.02, s => s.w, 0.02, mSascab, 12); // cenote sascab
      // asphalt of the 307 and the dike (X-1, X-10): worn grey with grain, yellow edge line, broken centre line; laid by the scenery, without the shiny puddles of the engine's roadway
      { const mBit = grain('#6e7378', ['#666b70', '#787d82', '#5e6368', '#747a80'], OFF), yellow = col2(0xe8b84a), whiteN = col2(0xe8e0c8);
        for (const [i0, n] of [[P(20) + 15, i25 + 10 - P(20) - 15], [P(42) - 4, (P(43) + 10 - P(42) + N) % N]]) { h.ribbon(i0, n, s => -s.w, 0.025, s => s.w, 0.025, mBit, 12);
          for (const sg of [-1, 1]) h.ribbon(i0, n, s => sg * (s.w - 0.75), 0.04, s => sg * (s.w - 0.5), 0.04, yellow, 8); ribbonFn(i0, n, -0.12, 0.04, 0.12, 0.04, whiteN, i => i % 9 < 3, 8); } }
      // the mangrove path (the author's return): a light earth roadway edged with pile planks, at water level, instead of asphalt
      { const i0 = ix + 14, n = P(42) - 4 - i0, mTerre = grain('#c2b48e', ['#b4a680', '#cec29e', '#a89a74'], OFF); h.ribbon(i0, n, s => -s.w, 0.025, s => s.w, 0.025, mTerre, 12);
        for (const sg of [-1, 1]) { h.ribbon(i0, n, s => sg * (s.w + 0.05), 0.4, s => sg * (s.w + 0.05), -0.5, mWood, 6); h.ribbon(i0, n, s => sg * (s.w + 0.05), 0.4, s => sg * (s.w + 0.5), 0.4, mWood, 6); h.ribbon(i0, n, s => sg * (s.w + 0.5), 0.4, s => sg * (s.w + 0.5), -1.2, mWood, 6); } }
      // embankment of the 307's crest (the road passes above the flat ground)
      for (const sg of [-1, 1]) ribbonFn(P(22), P(25) + 20 - P(22), s => sg * (s.w + 0.4), -0.03, s => sg * (s.w + 0.6 + 2.6 * Math.max(0, s.y)), s => -s.y - 0.07, mGround, i => S[i].y > 0.08, 12);

      // ---------- pier: a single deck, 2.5 m above the water; wooden handrails at each end ----------
      const EDGE = line(P(4) + 1, P(10) - 1, s => -(s.w + 0.45), 3);   // the outer edge of the two lanes is the deck's edge: a single kerb
      sheet(EDGE, 2.46, mBoards, 8); intoWall([...EDGE, EDGE[0]], 1.9, 2.46, mWood);
      for (const [a, b] of [[2, 4], [10, 12]]) { const [i0, n] = tr(a, b); for (const sg of [-1, 1]) ribbonFn(i0, n, s => sg * s.w, 0, s => sg * s.w, s => -s.y - 0.1, mWood, i => S[i].y > 0.05 && S[i].z > -32); }
      h.ribbon(...tr(3, 11, 6, 6), s => -s.w, 0.02, s => s.w, 0.02, h.mat('boardsQuay', OFF), 8);

      // ---------- lagoon dike: rock riprap on both sides ----------
      { const [i0, n] = tr(36, 42, -8, -4), mHf = grain('#a6b47a', ['#b4be88', '#98a86c', '#8fb09a'], { smooth: 1 }); for (const sg of [-1, 1]) { h.ribbon(i0, n, s => sg * (s.w + 2.6), s => -s.y - 0.985, s => sg * (s.w + 11), s => -s.y - 0.985, mHf, 10); h.ribbon(i0, n, s => sg * s.w, -0.02, s => sg * (s.w + 0.6), -0.05, mRiprap, 6); h.ribbon(i0, n, s => sg * (s.w + 0.6), -0.05, s => sg * (s.w + 3), -1.4, mRiprap, 6); } }
      // =====================================================================================================================
      // What gets placed: placement tools, materials per assembly zone
      // =====================================================================================================================
      const PL = h.M.place, PX = PL.c[0], PZ = PL.c[1], dPlace = (x, z) => Math.hypot(x - PX, z - PZ) - PL.r;
      const gap = (x, z) => { let b = dPlace(x, z); for (let i = 0; i < N; i += 2) { const s = S[i], d = Math.hypot(s.x - x, s.z - z) - s.w; if (d < b) b = d; } return b; }; // distance to what rolls
      const within = (p, x, z) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };
      const face = (s, sd) => Math.atan2(-sd * s.tz, sd * s.tx); // Y rotation: the local -Z of an object placed on side sd faces the road, its local X runs along it
      const col = (c, o = {}) => h.mat('paint', { c, ...o }), tinted = (m, l) => { if (l.length) { l.forEach((p, i) => m.setColorAt(i, new THREE.Color(p[7]))); m.instanceColor.needsUpdate = true; } return m; };
      const PINK = 0xe8468c, TEAL = 0x1fb5a8, YELLOW = 0xf2c230, PARTY = [PINK, TEAL, YELLOW];
      const trunk = grain('#7a6a58', ['#5a4a3a', '#94846e']), frond = grain('#3f7a22', ['#5a9a2a', '#2f6a1e'], { side: D }), mThatch = h.mat('thatch', { side: D }), mStucco = h.mat('stuccoPale');
      const MZ = { wood: mWood, thatch: mThatch, stucco: mStucco, intoWall: mStucco, acro: col(0xf4ecd8), shadows: col(0x5e4a3c), awning: h.mat('toldo', { side: D }, '#25406b', '#f4ecd8'), signboard: col(0x25406b), shutter: col(0x2f7f8f), slab: col(0xe6dcc4), lowwall: col(0xefe6d0),
        water: col(0x35c4d4), iron: col(0x2a2a2e), foot: col(0xf2f2f2), cabA: col(PINK), cabB: col(TEAL), cabC: col(YELLOW), whiteN: col(0xf6f2e8), roofR: col(0xc8452e), crossSign: col(0x3a2a20), vat: col(0xf2ece0), redTone: col(0xd8362a), blackM: col(0x1e1e22), carBody: col(0xffffff),
        pane: col(0x2a3a4a), lampObj: col(0xfff2c0, { emis: 1 }), concretePart: col(0xb0aca0), trunk, frond, nut: col(0xe8b828), hull: col(0xf6f6f0), bandStrip: col(0xffffff), cloth: col(0xffffff), rootCol: col(0xb8b2a2), feather: col(0xf0836a), paw: col(0xe78a8c), beak: col(0x2a2a2a),
        netting: col(0xf6f6f0), pole: col(0x8a6a48), cabin: col(0xc9cfcf), roofM: col(0xf2f0ea), flagCube: col(PINK), engine: col(0x2a2a2e), seat: col(0x2a2a2e), rackFrame: col(0x2a2a2e), wheelPart: col(0x1e1e22), plate: col(0xf6f2e8), hammock: col(0xf6f2e8), straw: col(0xd8b96a), pillar: col(0x8a6a48), stone: mRock,
        goods: h.mat('toldoMulti'), leafKey: grain('#ffffff', ['#e4e4e4', '#cacaca']), counterTop: mWood, pare: col(0xc8c8c8),
        plainText: h.mat('written', {}, 128, 32, '#f2ece0', '#1f8f9f', 'PLAYA 307', 24) };
      const SKIN = new Proxy(MZ, { get: (o, k) => o[k] || (o[k] = col(0xff00ff)) }); // a zone with no material shows up magenta: seen at once
      const pose = (label, x, y, z, r = 0, ...a) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = r; h.scene.add(g); h.pose(label, SKIN, g, [0, 0, 0], ...a); return g; };
      // garland: a vertical strip of `high` m under a line of points [[x, y, z], …] (banners, bulbs); the texture repeats every `stepSec` m
      const garland = (pts, high, m, stepSec) => {
        const pos = [], uv = [], idx = []; let l = 0;
        pts.forEach(([x, y, z], k) => { if (k) l += Math.hypot(x - pts[k - 1][0], z - pts[k - 1][2]); pos.push(x, y, z, x, y - high, z); uv.push(l / stepSec, 1, l / stepSec, 0); if (k) { const a = k * 2 - 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
        const me = new THREE.Mesh(g, m); h.scene.add(me); return me;
      };
      const mBanner = h.mat('streamer', { emis: 1, transparent: true, alphaTest: 0.5, side: D }), mBulb = h.mat('bulbs', { emis: 1, transparent: true, alphaTest: 0.5, side: D, fog: false });
      const L = { poles: [], cocos: [], boxwood: [], crownList: [], trunks: [], lamp: [], polesE: [], palapas: [], stalls: [], benches: [], mangroves: [], flamingos: [], boats: [], cubes: [], pennants: [], pickups: [], motorbikes: [], deckchairs: [], pools: [] };
      // life: LIFE = the functions (dt, car) of the tick; what moves carries userData.dyn (outside the engine's merge, outside the final re-cut). The lists below are filled by the fixed scenery and animated further down
      const LIFE = [], PEOPLE = [], PINE = [], PIER = [], D0 = new THREE.Object3D(), dyn = o => { o.userData.dyn = 1; o.frustumCulled = false; return o; }; D0.rotation.order = 'YXZ';
      let VAULT = null, WELL = [];
      const coco = (x, z, y = -0.05, t = 1) => L.cocos.push([x, y, z, rnd() * 6.28, t * (0.85 + rnd() * 0.35)]);
      const GREENS = [0x66763f, 0x58703a, 0x7a8048, 0x4e6a34, 0x8c8a4e];
      const bush = (x, z, w, ht, y = -0.2, c = GREENS[rnd() * 5 | 0]) => L.boxwood.push([x, y, z, rnd() * 6.28, w, ht, w * (0.8 + rnd() * 0.4), c]);
      const ARB = [[], []], tree = (x, z, ht, w, c = GREENS[rnd() * 4 | 0], y = 0) => ARB[c === 0xe2532a || rnd() < 0.45 ? 0 : 1].push([x, y - 0.2, z, rnd() * 6.28, w / 11, ht / 14, w / 11, c]); // ceiba (flat parasol crown) or selva tree (tiered crowns)
      const cube = (x, y, z, r, w, ht, d, c) => L.cubes.push([x, y, z, r, w, ht, d, c]); const MANGROVE = [], mangroveFn = (x, z, w) => { L.mangroves.push([x, -1, z, rnd() * 6.28, w / 2]); MANGROVE.push([x, 1.1 + w * 0.2, z, rnd() * 6.28, w * 0.8, 1.6 + rnd() * 1.8, w * 0.8, [0x2f5a34, 0x3c7a3a, 0x356a38, 0x44803c][rnd() * 4 | 0]]); };
      const each = ([i0, n], stepSec, f) => { for (let k = 0; k <= n; k += stepSec) f(S[(i0 + k) % N], (i0 + k) % N, k); };
      // row of buildings along one side: f(s, i) places and returns the length occupied (0 = nothing, we advance 4 m); the step follows the length of the offset line on the bends
      const placeRow = (i0, n, sd, o, f) => { for (let k = 0; k < n;) { const i = (i0 + k) % N, s = S[i], l = f(s, i) || 4; k += Math.max(2, Math.ceil(l / 2 / Math.max(0.4, 1 - sd * s.k * (s.w + o)))); } };

      // ---------- the town: the Quinta's façades flush with the roadway, a second row higher behind (D-5) ----------
      const FAC = [0xd8715f, 0xe8b84a, 0x3c8dad, 0xe2744f, 0xefe3c8, 0xe8b84a, 0xd8715f, 0xe07a9c, 0x35a79a], VM = [[8, 4.6], [10, 7.4], [12, 7.4], [10, 4.8]], MA = VM.map(() => []), HM = []; let kf = 0;   // HM: [x, z, height, side] of each façade, to hang the banners on
      const house = (s, i, sd, o = 2.6, low = 0) => { const v = low ? (rnd() < 0.5 ? 0 : 3) : rnd() * 4 | 0, [Lg, H] = VM[v], [x, z] = off(i, sd * (s.w + o + 4.5)), c = FAC[kf++ % FAC.length]; MA[v].push([x, s.y - 0.05, z, face(s, sd), 1, 1, 1, c]); HM.push([x, z, H, sd]);
        if (!low && rnd() < 0.7 && !(sd < 0 && i < P(12) + 30)) { const [x2, z2] = off(i, sd * (s.w + o + 16)); cube(x2, (H + 3) / 2, z2, face(s, sd), Lg + 2, H + 3 + rnd() * 2, 10, FAC[(kf + 3) % FAC.length]); } return Lg; };
      const i11 = P(11), i12 = P(12), i17 = P(17), i18 = P(18), i20 = P(20), i21 = P(21);
      placeRow(i11 + 2, i18 - 3 - i11 - 2, -1, 7, (s, i) => house(s, i, -1));          // outer side (sea then east): from the foot of the pier to the hall, without a gap
      placeRow(i11 + 3, i17 - 4 - i11 - 3, 1, 7, (s, i) => house(s, i, 1));          // inner side: up to the square
      placeRow(i20 + 9, i21 + 16 - i20 - 9, -1, 10, (s, i) => house(s, i, -1, 4 + rnd() * 2, 1) + 1.5); placeRow(i20 + 8, 14, 1, 10, (s, i) => house(s, i, 1, 4, 1) + 1); placeRow(i20 + 38, i21 + 12 - i20 - 38, 1, 10, (s, i) => house(s, i, 1, 4 + rnd() * 2, 1) + 1.5); // exit from the town: low houses on both sides, without a gap, on either side of the convenience store
      placeRow(i18 + 1, i20 - i18 - 2, -1, 16, (s, i) => house(s, i, -1, 10.4)); placeRow(i18 + 4, i20 - i18 - 6, 1, 16, (s, i) => house(s, i, 1, 10.4)); // on each side of the hall, behind its shores
      VM.forEach(([Lg, H], v) => insts(h, 'houseQuinta', SKIN, MA[v], { a: [Lg, H], tintMat: 'intoWall' }));
      const hFac = (i, sd) => { const [x, z] = off(i, sd * (S[i].w + 7)); let b = 1e9, hb = 4.6; for (const [mx, mz, H, d] of HM) { const e = Math.hypot(mx - x, mz - z); if (d === sd && e < b) { b = e; hb = H; } } return b < 14 ? hb : 4.6; };   // height of the nearest façade on this side
      each([i12, i18 - i12], 5, (s, i) => { const n = Math.round((s.w + 2.4) * 2 / 0.5), ya = Math.min(hFac(i, -1), hFac(i, 1)) + 0.5; for (let k = 0; k < n; k++) { const [x, z] = off(i, -(s.w + 2.4) + (k + 0.5) * 0.5); L.pennants.push([x, s.y + ya - 0.5 * Math.sin(k / n * Math.PI), z, face(s, 1) + 1.5708, 1, 1, 1, [PINK, YELLOW, TEAL, 0x7a4bd6, 0xff6a2b][k % 5]]); } }); // papel picado across the street

      // ---------- the feria square (right of the road, between the street and the hall): stalls at the edge, chapel, kiosk, stage, big wheel, carousel ----------
      placeRow(i17 - 2, i18 - 2 - i17 + 2, 1, 3, (s, i) => { const [x, z] = off(i, s.w + 2.6); L.stalls.push([x, s.y - 0.05, z, face(s, 1), 1, 1, 1, PARTY[i % 3]]); return 4.2; });
      { const s = S[i17 + 1], [x, z] = off(i17 + 1, s.w + 13); pose('chapel', x, -0.05, z, face(s, 1)); } // at the edge of the street, where it is seen on arrival
      pose('kiosk', 590, -0.05, 250, -Math.PI / 2); pose('scene', 578, -0.05, 276, -Math.PI / 2);
      pose('bigWheel', 628, -0.05, 244, Math.PI / 2).scale.setScalar(1.6); pose('carousel', 612, -0.05, 278); // the big wheel (38 m) rises above the roofs: visible from the street. Fixed, no animation: up close, the wheel and the carousel are out of the racing camera's view
      inst(h, h.geo('roof4'), col(0xc8452e, { side: D }), [[590, 4.7, 250, 0, 5.8, 2.6, 5.8]]); inst(h, h.geo('roofPalapa'), h.mat('toldo', { side: D }, '#e8468c', '#f4ecd8'), [[612, 5.4, 278, 0, 5.6, 2.2, 5.6]]);
      for (let k = 0; k < 14; k++) { const x = 560 + (k % 7) * 13 + rnd() * 3, z = 212 + (k / 7 | 0) * 66 + rnd() * 4; tree(x, z, 9 + rnd() * 3, 7 + rnd() * 2, 0x3f7a32); }
      for (const l of ARB) for (let k = l.length - 1; k >= 0; k--) { const [x, , z] = l[k]; if (Math.hypot(x - 612, z - 278) < 10 || Math.hypot(x - 628, z - 244) < 13 || (x > 568 && x < 605 && z > 262 && z < 290)) l.splice(k, 1); } // no tree in the carousel, the wheel, the stage or its audience
      for (let k = 0; k < 10; k++) L.stalls.push([596 + k * 4.4, -0.05, 258, 0, 1, 1, 1, PARTY[k % 3]]);

      // ---------- the hall (D-5): wide low palm-thatched roof with two pitches on wooden posts, open on all four sides, light holes in the roof; close-set stalls on both sides ----------
      { const n = i20 - i18, e = s => s.w + 9, hp = (s, o) => 9 - 4.4 * (o - 0.6) / (e(s) - 0.6);
        for (const sg of [-1, 1]) ribbonFn(i18, n, s => sg * 0.6, 9, s => sg * e(s), 4.6, mThatch, i => (i - i18) % 13 > 0, 6).forEach(m => { m.castShadow = true; });
        h.ribbon(i18, n, -0.7, 9.1, 0.7, 9.1, mWood, 6).castShadow = true;
        each([i18, n], 4, (s, i) => { for (const sg of [-1, 1]) { for (const o of [s.w + 0.9, e(s) - 0.6]) { const [x, z] = off(i, sg * o); L.poles.push([x, s.y, z, 0, 2.2, hp(s, o), 2.2]); } const [x, z] = off(i, sg * (s.w + 3.4)); if (i % 8 < 4 || true) L.stalls.push([x, s.y - 0.05, z, face(s, sg), 1, 1, 1, [0xd8b96a, PINK, 0xf6f2e8, TEAL, YELLOW][(i / 4 | 0) % 5]]); } }); }

      // ---------- the beach: malecón (promenade with a low wall following the track), planted coconut palms, resort frontage (D-3, DA-7) ----------
      const plageT = tr(44, 3, -6, -2), mLowwall = col(0xefe6d0), mProm = grain('#e6dcc4', ['#d8ceb4', '#f0e8d4']);
      { const [i0, n] = plageT; h.ribbon(i0, n, s => s.w + 0.5, 0.55, s => s.w + 0.5, -0.1, mLowwall, 6); h.ribbon(i0, n, s => s.w + 0.5, 0.55, s => s.w + 0.95, 0.55, mLowwall, 6); h.ribbon(i0, n, s => s.w + 0.95, 0.55, s => s.w + 0.95, 0.1, mLowwall, 6); h.ribbon(i0, n, s => s.w + 0.95, 0.12, s => s.w + 7.5, 0.12, mProm, 8); }
      each(plageT, 6, (s, i) => { const [x, z] = off(i, s.w + 4.4); coco(x, z, 0.1); });
      const RES = [[26, 2], [32, 3], [36, 2], [14, 2]], RL = RES.map(() => []), CR = [0xefe3c8, 0xe8b84a, 0xf6eedc, 0x7fcfc6, 0xe59a7a]; let kr = 0;
      placeRow(plageT[0], plageT[1], 1, 18, (s, i) => { const v = s.k > 0.009 ? 3 : kr % 3, [Lg] = RES[v], [x, z] = off(i, s.w + 17.1 + (kr % 2) * 0.6); RL[v].push([x, 0, z, face(s, 1), 1, 1, 1, CR[kr++ % CR.length]]); return v === 3 ? 11 : Lg - 2; }); // continuous frontage, no gap; small pavilions on the tight bends
      // the four groups of the sand square (C-7): these are the piers of M.place, where sim.js hits them
      { const ca = Math.cos(PL.a), sa = Math.sin(PL.a), tor = [], vol = [];
        for (const [px, pz, , , label] of PL.piers) { const x = PX + px * ca + pz * sa, z = PZ - px * sa + pz * ca; if (label === 'torre') tor.push([x, -0.05, z, PL.a]); else if (label === 'lancha') L.boats.push([x, -0.05, z, PL.a, 1, 1, 1, PARTY[L.boats.length % 3]]); else if (label === 'netting') vol.push([x, -0.05, z, PL.a + Math.PI / 2]); else coco(x, z); }
        insts(h, 'towerLifeguard', SKIN, tor); insts(h, 'volley', SKIN, vol); }
      // sea wrack: wet sand, foam, clumps of sargassum
      sheet([[-900, -44], [900, -44], [900, -40], [-900, -40]], -0.05, grain('#9c8a6a', ['#8e7c5e', '#a89878'], OFF), 8); // the foam fringe is the surf, animated with life
      for (let k = 0; k < 150; k++) { const x = -300 + rnd() * 1100; cube(x, -0.02, -38.5 + rnd() * 1.6, rnd() * 0.3, 1.5 + rnd() * 5, 0.08, 0.5 + rnd() * 0.8, 0x3a2e22); }

      // ---------- the pier (D-4): continuous guard rail, piles, central walkway, round palapa bar at the centre of the hairpin ----------
      { const edgePt = EDGE, // the guard rail stops before the ramps: the lanes enter and leave at the foot of the deck
          stepSec = 3, gray = col(0x7c8a6a), pierBuf = [];
        intoWall(edgePt, 3.38, 3.5, mWood); intoWall(edgePt, 2.92, 3.02, mWood);
        for (let k = 0; k < edgePt.length - 1; k++) { const [x0, z0] = edgePt[k], [x1, z1] = edgePt[k + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / stepSec)); for (let j = 0; j < n; j++) { const x = x0 + (x1 - x0) * j / n, z = z0 + (z1 - z0) * j / n; L.poles.push([x, 2.46, z, 0, 1, 1.06, 1]); if (j % 2 === 0) pierBuf.push([x, -2.5, z, 0, 3.4, 5, 3.4]); } }
        for (let z = -36; z > -160; z -= 9) for (const x of [505, 515, 525]) pierBuf.push([x, -2.5, z, 0, 3.4, 5, 3.4]);
        inst(h, h.geo('poleWood'), gray, pierBuf); PIER.push(...pierBuf);
        for (let z = -44; z >= -116; z -= 12) { L.lamp.push([515, 2.46, z, 0]); if (z % 24) L.benches.push([513.6, 2.46, z - 6, Math.PI / 2], [516.4, 2.46, z - 6, -Math.PI / 2]); }
        garland([...Array.from({ length: 13 }, (_, k) => [515, 7.3 - (k % 2) * 0.6, -44 - k * 6])], 0.6, mBanner, 6);
        inst(h, h.geo('roofPalapa'), mThatch, [[515, 5.6, -138, 0, 6.2, 3.6, 6.2], [515, 5.4, -52, 0, 3.4, 2.2, 3.4]]).castShadow = true;
        for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; L.poles.push([515 + Math.cos(a) * 5, 2.46, -138 + Math.sin(a) * 5, 0, 1.6, 3.3, 1.6]); } cube(515, 3.0, -138, 0, 4, 1.1, 4, 0x8a6a48);
        { const [i0, n] = tr(3, 11, -12, -12); for (const sg of [1]) { h.ribbon(i0, n, s => sg * (s.w + 0.12), 0.5, s => sg * (s.w + 0.12), 0, mWood, 6); h.ribbon(i0, n, s => sg * (s.w + 0.12), 0.5, s => sg * (s.w + 0.45), 0.5, mWood, 6); h.ribbon(i0, n, s => sg * (s.w + 0.45), 0.5, s => sg * (s.w + 0.45), 0, mWood, 6); } } /* wooden wheel stops along the edge of each lane: the drivable limit is visible */
        cube(515, 3.5, -52, 0, 3, 2.1, 3, 0x35a79a); for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.poles.push([515 + sx * 2.4, 2.46, -52 + sz * 2.4, 0, 1.2, 3.1, 1.2]); }

      // ---------- the lagoon dike (D-9): mangrove clumps at the rock riprap's edge, open windows, flamingos; mangrove wall in the distance ----------
      { const dmgP = tr(36, 42, -10, -6);
        each(dmgP, 2, (s, i, k) => { for (const sg of [-1, 1]) { if ((k + (sg > 0 ? 13 : 0)) % 26 > 17) continue; for (let j = 0; j < 3; j++) { const [x, z] = off(i, sg * (s.w + 3.4 + rnd() * 11)), w = 2.6 + rnd() * 2.6; mangroveFn(x, z, w); } } });
        for (const [i, sg] of [[P(37) + 6, -1], [P(38), 1], [P(38) + 14, -1], [P(39) + 8, 1], [P(40), -1], [P(40) + 14, 1]]) for (let k = 0; k < 16; k++) { const [x, z] = off(i + (rnd() * 16 | 0), sg * (S[i].w + 14 + rnd() * 14)); L.flamingos.push([x, -1.2, z, rnd() * 0.6 + (sg > 0 ? 0 : 3.14)]); }
        for (let k = 0; k < 60; k++) { const z = 90 + k * 6.4; bush(-190 - rnd() * 40, z, 18 + rnd() * 10, 9 + rnd() * 5, -1, 0x2f5a34); if (k % 5 === 2) coco(-176, z, -0.5, 1.6); }
        for (let k = 0; k < 16; k++) { const i = dmgP[0] + 10 + k * 11, sg = k % 2 ? 1 : -1, [cx, cz] = off(i, sg * (S[i % N].w + 38 + rnd() * 55)); if (!within([[-900, 105], [60, 105], ...LAG.slice(1)], cx, cz)) continue; for (let j = 0; j < 6; j++) { const x = cx + rnd() * 12 - 6, z = cz + rnd() * 12 - 6, w = 3 + rnd() * 3; mangroveFn(x, z, w); } } // mangrove islets in the water
        each(dmgP, 9, (s, i, k) => { const sg = (k / 9 | 0) % 2 ? 1 : -1, [x, z] = off(i, sg * (s.w + 1.6)); coco(x, z, -0.1, 0.9); });
        { const kay = []; for (let k = 0; k < 6; k++) { const i = dmgP[0] + 14 + k * 26, s = S[i % N], [x, z] = off(i, (k % 2 ? 1 : -1) * (s.w + 2.2)); kay.push([x, -0.6, z, face(s, 1) + 1.87, 1, 1, 1, k % 2 ? 0xf2c230 : 0xff7a2a]); } insts(h, 'kayak', SKIN, kay, { tintMat: 'hull' }); }
        { const i = P(39), s = S[i], [x, z] = off(i, -(s.w + 34)), [mx, mz] = off(i, -(s.w + 17)); pose('obsTower', x, -1, z, face(s, -1)); cube(mx, -0.35, mz, face(s, -1) + 1.5708, 34, 0.2, 1.6, 0xc9b58e); } // observation tower and its pontoon
        for (let k = 0; k < 4; k++) { const i = P(37) + 10 + k * 34, s = S[i % N], sg = k % 2 ? -1 : 1, [x, z] = off(i, sg * (s.w + 30 + k * 4)); cube(x, 1.4, z, face(s, sg), 5.5, 2.8, 4.5, [0x35a79a, 0xe8b84a, 0xe07a9c, 0xefe3c8][k]); L.palapas.push([x, z, 4.6, 2.9]); for (const [a, b] of [[-2.2, -1.8], [2.2, -1.8], [-2.2, 1.8], [2.2, 1.8]]) L.poles.push([x + a, -1.5, z + b, 0, 1.4, 1.6, 1.4]); L.boats.push([x + 5, -0.95, z + 2, k, 1, 1, 1, PARTY[k % 3]]); } // fishermen's huts on stilts and their boats
        for (const [x, z, r] of [[150, 190, 1.2], [158, 245, 1.5708], [150, 300, 1.9]]) { RL[0].push([x, 0, z, r, 1, 1, 1, CR[(x + z) % 5]]); for (let j = 0; j < 4; j++) coco(x - 14 + rnd() * 4, z - 18 + j * 12, 0); } // the hotels on the other bank of the inlet
        LAG.forEach(([x, z], k) => { if (k < LAG.length - 1) { const [x1, z1] = LAG[k + 1], n = Math.hypot(x1 - x, z1 - z) / 9 | 0; for (let j = 0; j < Math.min(n, 30); j++) { const bx = x + (x1 - x) * j / n + rnd() * 4, bz = z + (z1 - z) * j / n + rnd() * 4, r = 7 + rnd() * 5, ht = 5 + rnd() * 4; if (gap(bx, bz) > r + 1) bush(bx, bz, r, ht, -0.8, [0x2f5a34, 0x3c7a3a][j % 2]); } } }); }   // never on the roadway: at the cave exit, the road runs along the shore and these clumps of 7 to 12 m radius covered it

      // ---------- the 307 road (D-6): low selva wall at the verge's edge, tall trees behind, power poles on one side only ----------
      { const gr = [i21 + 8, (iz - i21 - 8 + N) % N];
        each(gr, 1, (s, i, k) => { for (const sg of [-1, 1]) { const yr = Math.max(0, s.y), o = 4 + rnd() * 9, yg = yr * Math.max(0, 1 - (o - 0.4) / (0.2 + 2.6 * yr)), [x, z] = off(i, sg * (s.w + o)); if (gap(x, z) > 2.5) bush(x, z, 3 + rnd() * 3, 4 + rnd() * 4 + yr - yg, Math.min(0, s.y) + yg - 0.2); }   /* on the 307's crest, the clumps are set on the embankment and rise above the roadway: a plant wall at the road edge, not bushes below it */
          if (k % 7 === 3) for (const sg of [-1, 1]) { const [x, z] = off(i, sg * (s.w + 26 + rnd() * 50)); if (gap(x, z) > 18 && !within(HOLLOW, x, z)) tree(x, z, 13 + rnd() * 6, 9 + rnd() * 4, k % 28 === 3 ? 0xe2532a : undefined); }
          if (k % 22 === 6) { const [x, z] = off(i, s.w + 2.4 + Math.max(0, s.y) * 2.6); L.polesE.push([x, 0, z, face(s, 1)]); } }); }
      // the forest closes in and shuts over the road before the cenote (T-7): tall trees at the roadside from the crest, then at the edge of the cutting; trees around the hole in the lake's ceiling
      for (let i = P(24) - 14; i < tT - 2; i += 2) { const s = S[i], sg = i % 4 ? 1 : -1, [x, z] = off(i, sg * (s.w + 3.2 + Math.max(0, s.y) * 2.6 + rnd() * 3)); tree(x, z, 18 + rnd() * 5, 14, 0x3a5e2a); }
      // the inside of the loop and the distance: selva, garden palms; nothing on the water, in the hollow, in the town or on the beach
      const TOWN = [[540, -30], [760, -30], [760, 360], [540, 360]], LAGP = [[-900, 105], [60, 105], ...LAG.slice(1)];
      for (let k = 0; k < 900; k++) { const x = -150 + rnd() * 1200, z = 110 + rnd() * 760; if (within(LAGP, x, z) || within(HOLLOW, x, z) || within(TOWN, x, z) || gap(x, z) < 16) continue; if (z < 200 && x < 520) { if (rnd() < 0.5) coco(x, z); continue; } rnd() < 0.12 ? tree(x, z, 12 + rnd() * 6, 9 + rnd() * 4) : bush(x, z, 5 + rnd() * 6, 4 + rnd() * 5); }
      for (let k = 0; k < 150; k++) { const a = rnd() * 3.14, r = 650 + rnd() * 700; bush(320 + Math.cos(a) * r, 380 + Math.sin(a) * r, 22 + rnd() * 18, 9 + rnd() * 7, -1); }

      // ---------- the common landmarks, at the centre of the loop (D-1) ----------
      pose('waterTower', 300, -0.05, 168, Math.PI); pose('antenna', 440, -0.05, 300);

      // ---------- the continuous line (T-2): a line of poles and banners to the right of the road all round the loop; bulb garland in the cave ----------
      { const pts = [], amp = [], o = s => s.w + 1.4; let lastIdx = -99;
        for (let i = 0; i <= N; i += 5) { const j = i % N, s = S[j], [x, z] = off(j, o(s)), hollow = j > jz - 4 && j < jx + 4;
          if (hollow) { if (pts.length > 1) garland(pts.splice(0), 0.6, mBanner, 6); continue; }   // no banners in the cenote nor in the cave: rock, wood and roots only
          pts.push([x, s.y + 5.3 - (i % 10 ? 0.5 : 0), z]); if (i % 10 === 0) L.poles.push([x, s.y - 0.3, z, 0, 1.3, 5.6, 1.3]); }
        if (pts.length > 1) garland(pts, 0.6, mBanner, 6); }

      // =====================================================================================================================
      // Transitions (T-3 to T-10) and details (X-)
      // =====================================================================================================================
      // wooden arch across the road, with its text on both faces
      const arch = (i, plainText, backdrop, fg = '#fff4e0') => { const s = S[i % N], m = h.mat('written', {}, 256, 28, backdrop, fg, plainText, 18), b = boxMesh(h, m, s.w * 2 + 2.4, 1.7, 0.3, s.x, s.y + 7, s.z); b.rotation.y = h.across(s); b.castShadow = true;
        for (const sg of [-1, 1]) { const [x, z] = off(i, sg * (s.w + 0.9)); L.poles.push([x, s.y - 0.2, z, 0, 3.4, 8, 3.4]); } };
      // hand-painted panel on two stakes, at the right edge
      const signPanel = (i, plainText, backdrop, fg = '#fff4e0', o = 1.3) => { const s = S[i % N], [x, z] = off(i, s.w + o), m = h.mat('written', {}, Math.max(96, plainText.length * 11), 24, backdrop, fg, plainText, 16), b = boxMesh(h, m, Math.max(3, plainText.length * 0.36), 1.2, 0.1, x, s.y + 2.6, z); b.rotation.y = h.across(s);
        for (const e of [-1, 1]) L.poles.push([x - s.tz * 0 + Math.cos(h.across(s)) * e * 1.2, s.y - 0.2, z - Math.sin(h.across(s)) * e * 1.2, 0, 1.5, 3.4, 1.5]); };
      arch(i11 + 3, 'BIENVENIDOS  ·  FERIA DEL CARMEN', '#e8468c');                                   // T-4: at the foot of the pier ramp
      arch(i25 + 6, 'CENOTE  PLAYA 307', '#1f8f9f');                                                  // T-7: the cenote ticket booth, where the asphalt stops
      arch(P(42) + 4, 'ZONA HOTELERA  ·  PLAYA 307', '#25406b');                                      // T-10
      h.ribbon(i20 + 14, 1, -W, 0.04, W, 0.04, h.mat('topes', OFF), 2);                                // T-6: the stop where the paving ends
      signPanel(i21 + 2, 'CARRETERA 307', '#1f6a3a'); signPanel(P(23) + 6, 'CENOTE 300 m', '#1f8f9f'); signPanel(P(24) + 14, 'CENOTE 100 m  ·  COCO FRIO', '#e8468c');
      signPanel(P(36) + 6, 'CUIDADO COCODRILOS', '#f2c230', '#3a2a20', 1.6);
      // T-7: ticket booth under a palapa (where the road returns to ground level), coconut stall; no car park nor pickups: placed at ground level under the crest, they disappeared into the clumps
      { const s = S[jz - 2];
        const [gx, gz] = off(jz - 2, s.w + 6); cube(gx, 1.2, gz, face(s, 1), 3.2, 2.4, 3.2, 0x35a79a); L.palapas.push([gx, gz, 3.2, 2.9]); const [ex, ez] = off(P(24) + 18, s.w + 3.4); L.stalls.push([ex, S[P(24) + 18].y - 0.05, ez, face(S[P(24) + 18], 1), 1, 1, 1, YELLOW]); }
      // T-9: cave exit in half shade (rock arches remaining above the cutting), roots and tall trees
      for (const i of [t1 + 6, t1 + 16, ix + 2]) for (const sg of [-1, 1]) { const [x, z] = off(i, sg * (S[i].w + 7)); tree(x, z, 15, 11, 0x3f7a32); }
      // T-10: hotel zone on the last 120 m of the dike
      { const i = P(42) + 8, j = P(42) + 26; for (const [k, sd, v] of [[i, -1, 0], [j, -1, 2], [i + 2, 1, 1]]) { const s = S[k % N], [x, z] = off(k, sd * (s.w + 15)); RL[v].push([x, 0, z, face(s, sd), 1, 1, 1, CR[(k + v) % CR.length]]); } each([P(42), 40], 5, (s, k) => { for (const sg of [-1, 1]) { const [x, z] = off(k, sg * (s.w + 3)); coco(x, z, 0); } }); }
      // T-3: at the foot of the pier ramp, the ferry kiosk and three lanchas hauled up on the sand
      { const i = P(3) - 6, s = S[i]; for (let k = 0; k < 3; k++) { const [x, z] = off(i - 4 + k * 4, -(s.w + 5)); L.boats.push([x, -0.05, z, face(s, -1), 1, 1, 1, PARTY[k]]); } const [x, z] = off(i + 8, -(s.w + 4)); cube(x, 1.3, z, face(s, -1), 3, 2.6, 3, 0xe8b84a); L.palapas.push([x, z, 3, 3.1]); }
      // the dike's hump bridge: wooden handrail, and the turquoise water of the cenote's resurgence mixing with the lagoon (D-9, D-11)
      { const i41 = P(41), n = 26, s = S[i41]; for (const sg of [-1, 1]) { h.ribbon(i41 - n, n + 6, sg * (s.w + 0.2), 1.0, sg * (s.w + 0.2), 0.86, mWood, 6); h.ribbon(i41 - n, n + 6, sg * (s.w + 0.2), 0.5, sg * (s.w + 0.2), 0.4, mWood, 6); for (let k = -n; k <= 6; k += 3) { const [x, z] = off(i41 + k, sg * (S[i41 + k].w + 0.2)); L.poles.push([x, S[i41 + k].y - 1.5, z, 0, 1.3, 2.6, 1.3]); } }
        sheet([off(i41 - 20, -70), off(i41 - 10, -3.2 - s.w), off(i41 + 2, -3.2 - s.w), off(i41 + 14, -70)], -0.985, grain('#5fc4c0', ['#74d0ca', '#4fb8b4'], { smooth: 1 }), 12); sheet([off(i41 - 14, 60), off(i41 - 8, 3.2 + s.w), off(i41, 3.2 + s.w), off(i41 + 8, 60)], -0.985, grain('#5fc4c0', ['#74d0ca', '#4fb8b4'], { smooth: 1 }), 12); }

      // ---------- cenote v9 (author's drawing): a covered cave. Limestone walls in broken strata, faceted rock vault pierced by four round light wells,
      // plank walkway with a handrail on piles, clear water over a pale bottom strewn with rocks, a large rock in the middle, a sand beach and three coconut palms at the end of the walkway, lanterns on poles.
      // Rule: nothing visible inside the drivable limit below 6.5 m; walls, water and handrail start flush with this limit. Daylight comes from the real sun through the wells (cast shadows of the vault).
      { const C3 = new THREE.Color(), C4 = new THREE.Color(), PALC = [0xe2d3ae, 0xcbb585, 0xb39768, 0xd9c79c, 0xa88c62, 0xc9b890], PALG = [0xd8d2b8, 0xc4baa0, 0xb4ae98, 0xa8b09a], GROUND = 0xb4ad86;
        const mRocV = grain('#f2eee2', ['#dcd6c4', '#fffaf0', '#c2bcaa'], { side: D }); mRocV.vertexColors = true;
        const under = i => i >= tT && i <= t1, hall = i => i >= iA && i <= iB, K = 1.05;   // K: the cave rock, darker than that of the trenches
        const tintMat = (j, n, k = 1) => C3.set(PALC[(j + (blk(n, 77, 9) * 3 | 0)) % 6]).lerp(C4.set(PALG[(j + (blk(n, 78, 7) * 2 | 0)) % 4]), 0.4).multiplyScalar((0.82 + 0.3 * blk(n, j + 30, 2)) * k).getHex();
        const p3 = (i, o, y) => { const [x, z] = off(i, o); return [x, y, z]; };
        // skin: a surface stretched between successive cutouts (cutout = list of points [x, y, z, tint of the facet that follows]); flat facets
        const skin = (xSections, m = mRocV) => { const pos = [], uv = [], kbdEl = [], idx = []; let l = 0;
          for (let k = 0; k + 1 < xSections.length; k++) { const A = xSections[k], B = xSections[k + 1], d = Math.hypot(B[0][0] - A[0][0], B[0][2] - A[0][2]); let v = 0;
            for (let j = 0; j + 1 < A.length; j++) { const dv = Math.hypot(A[j + 1][0] - A[j][0], A[j + 1][1] - A[j][1], A[j + 1][2] - A[j][2]), q = pos.length / 3; C3.set(A[j][3] ?? 0xffffff);
              for (const [p, u, w] of [[A[j], l, v], [A[j + 1], l, v + dv], [B[j], l + d, v], [B[j + 1], l + d, v + dv]]) { pos.push(p[0], p[1], p[2]); uv.push(u / 8, w / 8); kbdEl.push(C3.r, C3.g, C3.b); }
              idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); v += dv; }
            l += d; }
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(kbdEl, 3)); g.setIndex(idx); g.computeVertexNormals();
          const me = new THREE.Mesh(g, m); me.castShadow = me.receiveShadow = true; h.scene.add(me); return me; };
        // section of a wall: foot p, direction d (towards the road or the water), n = rank (chance), yr = level of the road or water, yb = bottom, yw = top; six strata set back from the foot, then a slope of rc metres down to the ground
        const cutout = (p, d, n, yr, yb, yw, rc, k) => { const at = (a, y, c) => [p[0] + d[0] * a, y, p[1] + d[1] * a, c], o = [], F = [0.2, 0.38, 0.55, 0.72, 0.88, 1]; let a = 0, y = yb;
          for (let j = 0; j < 6; j++) { const y1 = j < 5 ? yr + (yw - yr) * (F[j] + 0.12 * (blk(n, j + 60, 3 + j) - 0.5)) : yw; o.push(at(a, y, tintMat(j, n, k)), at(a, y1, tintMat(j + 3, n, k * 0.7))); y = y1; if (j < 5) a = -(0.15 + 2.4 * blk(n, j, 3 + j % 3) ** 1.5); }
          o[o.length - 1][3] = GROUND; o.push(at(-rc * 0.4, yw + 0.3, 0x9aa070), at(-rc, -0.3, GROUND)); return o; };
        const rim = i => 0.4 + 1.2 * smoothNoise(i, 35, 9) * ss(jz, jz + 10, i) * (1 - ss(jx - 10, jx, i));                                 // edge of the trenches above ground
        const wallFace = (i, sg) => { const s = S[i], e = s.w + E0(i) + (sg < 0 ? basinG(i) : 0); return cutout(off(i, sg * e), [sg * s.tz, -sg * s.tx], i + (sg > 0 ? 500 : 0), hall(i) ? WATER : s.y, hall(i) ? -12 : s.y - 1.5, under(i) ? Math.max(s.y + 7.4, hall(i) ? 3.2 : 0) : rim(i), under(i) ? 4 : 7, under(i) ? K : 1); };
        const G = [], iD = k => k < kR ? jz + k : k >= kR + NR ? iB + 1 + k - kR - NR : -1, DD = RIGHT.map((p, k) => iD(k) >= 0 ? wallFace(iD(k), 1) : cutout(p, DR[k], 2000 + k, WATER, -12, 3.2, 4, K));
        for (let i = jz - 2; i <= jx + 2; i++) G.push(wallFace(i, -1));
        skin(G); skin(DD);
        // vault of the two galleries: a rock arch from one wall to the other (never below 7 m), its top (a rock spine covered with earth), and a rock face at each end
        const arch = i => { const s = S[i], e = s.w + E0(i); return [[-(e + 3.5), 6.7], [-e, 7], [-0.55 * e, 7.8], [-0.15 * e, 8.2], [0.25 * e, 8.1], [0.6 * e, 7.7], [e, 7], [e + 3.5, 6.7]].map(([o, y], j) => [...p3(i, o, s.y + y + (j > 1 && j < 6 ? 0.5 * blk(i, 20 + j, 3) : 0)), tintMat(j, i, K * 0.9)]); };
        const spine = i => { const s = S[i], e = s.w + E0(i), y = s.y + 10.2; return [[-(e + 11), -0.3], [-(e + 3.5), y - 1.6], [-0.5 * e, y], [0.5 * e, y], [e + 3.5, y - 1.6], [e + 11, -0.3]].map(([o, v], j) => [...p3(i, o, v + (j > 0 && j < 5 ? 0.5 * blk(i, 40 + j, 4) : 0)), j % 2 ? GROUND : 0x9aa070]); };
        const front = i => skin([arch(i), arch(i).map((p, j) => [p[0], S[i].y + (j % 7 ? 10.4 : 8.8), p[2], tintMat(j + 2, i, 0.9)])]);
        for (const [a, b] of [[tT, iA + 2], [iB - 2, t1]]) { const r = Array.from({ length: b - a + 1 }, (_, k) => a + k); skin(r.map(arch)); skin(r.map(spine)); front(a); front(b); }
        // check: no rock point in the drivable volume (between the two limits, below 6.5 m)
        { const vu = (c, i) => { if (i < 0) return; const s = S[i]; for (const p of c) { const o = (p[0] - s.x) * -s.tz + (p[2] - s.z) * s.tx; if (Math.abs(o) < s.w - 0.01 && p[1] > s.y - 1 && p[1] < s.y + 6.5) return console.error('plage : roche dans la route à', i, o.toFixed(1), (p[1] - s.y).toFixed(1)); } };
          G.forEach((c, k) => vu(c, jz - 2 + k)); DD.forEach((c, k) => vu(c, iD(k))); for (let i = tT; i <= t1; i++) if (i <= iA + 2 || i >= iB - 2) vu(arch(i), i); }
        // rock floor of the trenches and galleries, from the roadway to the foot of the walls (and under their setbacks); a rock quay closes each gallery on the hall side
        for (const [a, b] of [[jz, iA - 1], [iB + 1, jx]]) for (const sg of [-1, 1]) h.ribbon(a, b - a, s => sg * (s.w - 0.15), 0.015, s => sg * (s.w + 4.2), 0.015, mRock, 6);
        for (const i of [iA - 1, iB + 1]) intoWall([off(i, -(S[i].w + 4.5)), off(i, S[i].w + 4.5)], -12, S[i].y, mRockS);

        // the hall vault: a field of facets, low along the walls (8 m above the walkway), high in the middle (over 12 m); the light wells are left open in it
        const PU = [[259.7, 453, 6.5], [203, 428.5, 8], [224.5, 477.5, 4], [233.7, 445, 5.5]]; WELL = PU;   // well [x, z, radius]: above the large rock (in line with the exit of the gallery), of the beach (the sun falls 5 m further north), of the secondary basin, of the second rock (to the right of the last straight)
        const dWall = (x, z) => { let b = 1e9; for (const p of HALL) b = Math.min(b, Math.hypot(p[0] - x, p[1] - z)); return b; }, ceilingFn = (x, z) => 2 + 4.6 * ss(2, 20, within(HALL, x, z) ? dWall(x, z) : 0);
        { const xs = HALL.map(p => p[0]), zs = HALL.map(p => p[1]), x0 = Math.min(...xs) - 6, z0 = Math.min(...zs) - 6, nx = Math.ceil((Math.max(...xs) + 6 - x0) / 4), nz = Math.ceil((Math.max(...zs) + 6 - z0) / 4), pos = [], uv = [], kbdEl = [];
          const V = (a, b) => { const x = x0 + a * 4 + 2.4 * (hz(a, b + 7) - 0.5), z = z0 + b * 4 + 2.4 * (hz(a + 3, b) - 0.5); return [x, ceilingFn(x, z) + 1.1 * hz(a * 3 + 1, b * 5 + 2), z]; };
          for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const q = [V(a, b), V(a + 1, b), V(a, b + 1), V(a + 1, b + 1)], cx = (q[0][0] + q[3][0]) / 2, cz = (q[0][2] + q[3][2]) / 2;
            if (PU.some(([x, z, r]) => Math.hypot(cx - x, cz - z) < r + 2.2) || !(within(HALL, cx, cz) || dWall(cx, cz) < 7)) continue;
            [[0, 1, 2], [1, 3, 2]].forEach((t, f) => { C3.set(tintMat(a + f * 2, b * 7 + a, K * 0.85)); for (const k of t) { pos.push(...q[k]); uv.push(q[k][0] / 8, q[k][2] / 8); kbdEl.push(C3.r, C3.g, C3.b); } }); }
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(kbdEl, 3)); g.computeVertexNormals();
          const me = new THREE.Mesh(g, mRocV); me.castShadow = me.receiveShadow = true; h.scene.add(me); VAULT = g; }
        // each well: a collar of rock from the ceiling down to above the mound (its low lip passes under the neighbouring facets), lianas hanging from the lip, bushes at the edge, on top
        const GREENL = [0x6aa832, 0x4f8a2a, 0x86b83a, 0x3f7a22];
        PU.forEach(([x, z, r], n) => { const yl = ceilingFn(x, z) - 0.4, cols = [];
          for (let k = 0; k <= 14; k++) { const a = (k % 14) / 14 * 6.2832, c = Math.cos(a), sn = Math.sin(a), rr = r + 0.9 * (hz(k % 14, n + 80) - 0.5), P2 = (d, y, t) => [x + c * (rr + d), y, z + sn * (rr + d), t]; cols.push([P2(6, yl + 3.6, tintMat(k, n, K * 0.75)), P2(0, yl, tintMat(k + 1, n, K)), P2(0.4, YT + 0.5, GROUND), P2(2.5, YT - 0.2, GROUND)]);
            if (k < 14) { bush(x + c * (rr + 1.6), z + sn * (rr + 1.6), 1.6 + rnd() * 1.4, 1.8 + rnd() * 1.6, YT - 0.3, GREENL[k % 4]);
              for (let j = 0; j < 2; j++) { const lx = x + c * (rr - 0.25) + (rnd() - 0.5), lz = z + sn * (rr - 0.25) + (rnd() - 0.5), low = gap(lx, lz) < 1.2 ? 0.7 : WATER + 1.5, l = Math.min(yl + 0.6 - low, 1.5 + rnd() * rnd() * 7), e = 0.22 + rnd() * 0.16; cube(lx, yl + 0.6 - l / 2, lz, rnd() * 3, e, l, e, GREENL[(k + j) % 4]); } } }
          skin(cols); });
        // the rock and earth mound above the hall: a flat top pierced by the wells, a slope down to the ground, the forest on top
        { const xs = HALL.map(p => p[0]), zs = HALL.map(p => p[1]), mx = (Math.min(...xs) + Math.max(...xs)) / 2, mz = (Math.min(...zs) + Math.max(...zs)) / 2, ax = (Math.max(...xs) - Math.min(...xs)) / 2, az = (Math.max(...zs) - Math.min(...zs)) / 2;
          const f = Math.max(...HALL.map(p => Math.hypot((p[0] - mx) / ax, (p[1] - mz) / az))) * 1.06, E = (k, d = 0) => { const a = k / 32 * 6.2832, j = 1 + 0.06 * (hz(k % 32, 91) - 0.5); return [mx + Math.cos(a) * (ax * f * j + 5 + d), mz + Math.sin(a) * (az * f * j + 5 + d)]; };
          sheet(Array.from({ length: 32 }, (_, k) => E(k)), YT, mGround, 12, PU.map(([x, z, r]) => Array.from({ length: 14 }, (_, k) => [x + Math.cos(k / 14 * 6.2832) * (r + 0.6), z + Math.sin(k / 14 * 6.2832) * (r + 0.6)])));
          skin(Array.from({ length: 33 }, (_, k) => { const a = E(k), b = E(k, 6), c = E(k, 14); return [[a[0], YT, a[1], GROUND], [b[0], YT * 0.55, b[1], 0x9aa070], [c[0], -0.3, c[1], GROUND]]; }));
          for (let k = 0; k < 70; k++) { const a = rnd() * 6.2832, u = Math.sqrt(rnd()), x = mx + Math.cos(a) * (ax * f + 12) * u, z = mz + Math.sin(a) * (az * f + 12) * u, d = Math.hypot((x - mx) / (ax * f + 5), (z - mz) / (az * f + 5));
            if (PU.some(([px, pz, r]) => Math.hypot(x - px, z - pz) < r + 12)) continue; tree(x, z, 12 + rnd() * 5, 9 + rnd() * 3, 0x3a5e2a, d < 1 ? YT : YT * Math.max(0, 1 - (d - 1) * 6)); } }

        // the water: a clear transparent sheet over a pale bottom (the rocks placed on it are visible); the vault keeps it in shade, it does not reflect the sky
        const BASIN = [...Array.from({ length: iB - iA + 3 }, (_, k) => off(iA - 1 + k, -(S[iA - 1 + k].w + E0(iA) + basinG(iA - 1 + k) + 3))), ...SHORE.map((p, k) => [p[0] - DR[kR + k][0] * 3, p[1] - DR[kR + k][1] * 3]).reverse()];
        const backdrop = (poly, y, c) => { const me = sheet(poly, y, mRocV, 6), n = me.geometry.attributes.position.count, kbdEl = new Float32Array(n * 3); C3.set(c); for (let k = 0; k < n; k++) kbdEl.set([C3.r, C3.g, C3.b], k * 3); me.geometry.setAttribute('color', new THREE.Float32BufferAttribute(kbdEl, 3)); return me; };
        sheet(BASIN, -9.3, col(0x4fc8c0, { emis: 1 }), 10);   /* the bottom reflects the daylight: a light turquoise that carries its light, against which the rocks stand out */ sheet(BASIN, WATER, grain('#2fc0c8', ['#3ccdd2', '#27b2bc'], { smooth: 1, transparent: true, opacity: 0.55, depthWrite: false }), 10);

        // the beach: in the back pocket, in line with the last straight of the walkway; sand 70 cm above the water, which slopes gently down under the water
        const kS = SHORE.findIndex(p => p[0] < 229), iF = P(32) - 4, [fx, fz] = off(iF, S[iF].w + 5);
        const FRONT = [...Array.from({ length: iB - 2 - iF + 1 }, (_, k) => off(iB - 2 - k, S[iB - 2 - k].w + 5)), [fx + 1, fz - 9], [fx - 3, fz - 19], SHORE[kS]], PLG = [...SHORE.slice(kS + 1), ...FRONT];
        const dFront = (x, z) => { let b = 1e9; for (const p of FRONT) b = Math.min(b, Math.hypot(p[0] - x, p[1] - z)); return b; }, ySable = (x, z) => -6.3 + 2.4 * ss(1, 16, dFront(x, z));   // the sand rises towards the back wall: seen face-on from the walkway
        { const me = sheet(PLG, 0, mSand, 10), at = me.geometry.attributes.position; for (let k = 0; k < at.count; k++) at.setY(k, ySable(at.getX(k), at.getZ(k))); me.geometry.computeVertexNormals(); }
        { const sg = (() => { const [a, b] = FRONT, l = Math.hypot(b[0] - a[0], b[1] - a[1]), m = [(a[0] + b[0]) / 2 + (b[1] - a[1]) / l, (a[1] + b[1]) / 2 - (b[0] - a[0]) / l]; return within(PLG, m[0], m[1]) ? -1 : 1; })();   // the water's side
          skin(FRONT.map((p, k) => { const a = FRONT[Math.max(0, k - 1)], b = FRONT[Math.min(FRONT.length - 1, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = sg * (b[1] - a[1]) / l, nz = -sg * (b[0] - a[0]) / l; return [[p[0], -6.3, p[1], 0xcdbb8e], [p[0] + nx * 2, -6.75, p[1] + nz * 2, 0xc8b88c], [p[0] + nx * 5, -7.9, p[1] + nz * 5, 0xbfb48a]]; })).castShadow = false; }
        for (const [x, z, t] of [[205, 420.5, 0.7], [211, 417, 0.55], [200.5, 425.5, 0.55]]) coco(x, z, ySable(x, z) - 0.1, t);
        for (const [x, z, r] of [[207, 423.5, 0.6], [203.5, 421.5, 2.2], [209.5, 420.5, 4]]) PEOPLE.push([x, ySable(x, z), z, r, 0, 0]);   // two or three bathers on the cenote beach (CN-6)

        // rocks: the large central rock and two smaller ones, light blocks set on the bottom (some break the surface or emerge), others at the foot of the beach
        const ROCK = [], RT = [0xe6dcc0, 0xd2c29c, 0xbca67a, 0xc8c0a8], crag = (x, y, z, sc) => ROCK.push([x, y, z, rnd() * 6.28, sc * (0.8 + rnd() * 0.5), sc * (0.7 + rnd() * 0.6), sc * (0.8 + rnd() * 0.5), RT[rnd() * 4 | 0]]);
        for (const [x, z, k] of [[262, 449, 1.15], [236, 441, 0.9], [277, 440, 0.45]]) [[-9, 5.2], [-7.4, 4.4], [-5.8, 3.4], [-4.9, 2.2]].forEach(([y, sc], j) => ROCK.push([x + (hz(j, x) - 0.5) * 2.4 * k, WATER + (y - WATER) * k - (1 - k) * 1.2, z + (hz(j, z) - 0.5) * 2.4 * k, hz(j, x + z) * 6, sc * k, sc * k * 0.8, sc * k * (0.8 + 0.3 * hz(j, 3)), RT[j % 4]]));
        { const xs = HALL.map(p => p[0]), zs = HALL.map(p => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), dx = Math.max(...xs) - x0, dz = Math.max(...zs) - z0;
          for (let k = 0; k < 420; k++) { const x = x0 + rnd() * dx, z = z0 + rnd() * dz; if (!within(HALL, x, z) || within(PLG, x, z) || gap(x, z) < 1.5) continue; const sc = 0.7 + rnd() * rnd() * 2.2; crag(x, -9.1 + sc * 0.5 + rnd() * 0.9, z, sc); } }
        for (let k = 0; k < FRONT.length; k += 2) crag(FRONT[k][0] + (rnd() - 0.5) * 3, -7.3 + rnd() * 0.5, FRONT[k][1] + (rnd() - 0.5) * 3, 0.6 + rnd() * 0.9);
        tinted(inst(h, h.geo('boulder'), SKIN.leafKey, ROCK), ROCK);

        // stalactites: thick rock cones (no needles: they shimmered), set into the vault, never lower than 6.6 m above the walkway; ordinary rock material, lit like the rest
        { const stall = [], xs = HALL.map(p => p[0]), zs = HALL.map(p => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), dx = Math.max(...xs) - x0, dz = Math.max(...zs) - z0;
          for (let k = 0; k < 230; k++) { const x = x0 + rnd() * dx, z = z0 + rnd() * dz; if (!within(HALL, x, z) || dWall(x, z) < 1.5 || PU.some(([px, pz, r]) => Math.hypot(x - px, z - pz) < r + 3)) continue;
            const y = ceilingFn(x, z) + 1.2, l = Math.min(2.2 + rnd() * rnd() * 5.5, gap(x, z) < 1.5 ? y - 0.7 : 99), e = 0.45 + l * 0.17 + rnd() * 0.3; stall.push([x, y, z, rnd() * 6, e, l, e, tintMat(k, k * 3, K * (0.7 + 0.2 * rnd()))]); }
          tinted(inst(h, new THREE.ConeGeometry(1, 1, 5).rotateX(Math.PI).translate(0, -0.5, 0), grain('#f2eee2', ['#dcd6c4', '#fffaf0', '#c2bcaa']), stall), stall); }

        // the walkway: planks over the whole covered crossing, edges and piles above the water, handrails on both sides, lanterns on posts (objects: an amber glass, with no halo)
        { const mPl = h.mat('boardsQuay', { side: D, c: 0xd6b48a, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), a = tT + 1, n = t1 - tT - 2, POT = [], glassMat = [];
          h.ribbon(a, n, s => -(s.w + 0.9), 0.035, s => s.w + 0.9, 0.035, mPl, 8);
          for (const sg of [-1, 1]) { h.ribbon(iA - 1, iB - iA + 2, s => sg * (s.w + 0.9), 0.035, s => sg * (s.w + 0.9), -0.55, mWood, 6);
            for (const y of [1.05, 0.58]) h.ribbon(a, n, s => sg * (s.w + 0.5), y, s => sg * (s.w + 0.5), y - 0.16, mWood, 6);
            for (let i = a; i <= a + n; i += 2) { const s = S[i], [x, z] = off(i, sg * (s.w + 0.5)); POT.push([x, s.y - 0.1, z, 0, 1.5, 1.2, 1.5]); if (hall(i) && i % 6 === 0) { const [px, pz] = off(i, sg * (s.w + 0.6)); POT.push([px, WATER - 2, pz, 0, 2.6, s.y - WATER + 2, 2.6]); } } }
          for (let i = tT + 5; i < t1 - 3; i += 9) for (const sg of hall(i) ? [-1] : [-1, 1]) { const s = S[i], [x, z] = off(i, sg * (s.w + 0.5)); POT.push([x, s.y - 0.1, z, 0, 1.9, 3.7, 1.9]); glassMat.push([x, s.y + 3.9, z, face(s, sg), 0.5, 0.62, 0.5]); cube(x, s.y + 4.3, z, face(s, sg), 0.78, 0.14, 0.78, 0x2a2622); cube(x, s.y + 3.56, z, face(s, sg), 0.6, 0.1, 0.6, 0x2a2622); h.emis(i, x - sg * s.tz * -0.8, s.y + 3.6, z + sg * s.tx * -0.8, 0xffb45a, 20, 1.25); }
          inst(h, h.geo('boxMesh', 1, 1, 1), col(0xffc266, { emis: 1 }), glassMat).castShadow = false; POT.forEach(p => L.poles.push(p)); }

        // rays: a very faint column of daylight under each well, in the true direction of the sun; no halo nor patch on the ground (the patch is the real sun's)
        { const SD = new THREE.Vector3(...h.TH.orb.dir).normalize(), mR = h.addMat(h.tx('gradient', '#fff0c4', 1), { opacity: 0.06, polygonOffset: false }), Lr = (YT - WATER) / SD.y;   /* three nested columns: the edge of the ray blends instead of cutting out */
          for (const [x, z, r] of PU) for (const f of [0.85, 0.6, 0.35]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * f, r * f * 1.12, Lr, 14, 1, true), mR); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), SD.clone().negate()); m.position.set(x, YT, z).addScaledVector(SD, -Lr / 2); m.scale.y = -1; h.scene.add(m); } }

        // the forest above the trenches and galleries
        for (let i = jz + 4; i < jx - 2; i += 3) if (!hall(i)) for (const sg of [-1, 1]) { const s = S[i], [x, z] = off(i, sg * (s.w + 6 + rnd() * 5)); tree(x, z, 13 + rnd() * 6, 10 + rnd() * 3, 0x3a5e2a, under(i) ? s.y + 8 : 0.3); }
      }

      // (the open cenote of the first version is removed: cenote v3 without a lake)
      // seafront of the town, seen from the pier's return lane: beach pavilions with palm-thatched roofs facing the sea hide the backs of the houses
      for (let x = 556; x <= 705; x += 29) { RL[3].push([x, 0, -27, 0, 1, 1, 1, CR[(x / 29 | 0) % CR.length]]); coco(x + 14, -31); coco(x + 15, -22); }
      // at the foot of the pier ramps (before and after): stalls, coconut palms, boats; nothing empty between the beach, the pier and the town
      for (const [a, b] of [[P(3) - 2, P(4) - 4], [P(10) + 4, i11 + 2]]) for (let i = a; i < b; i += 5) for (const sg of [-1, 1]) { const s = S[i], [x, z] = off(i, sg * (s.w + 3.2)), [cx, cz] = off(i + 2, sg * (s.w + 7)); if (z < -40) continue; L.stalls.push([x, -0.05, z, face(s, sg), 1, 1, 1, PARTY[(i + (sg > 0)) % 3]]); coco(cx, cz); }
      // T-6: the convenience store at the hall exit (the author's request: an OXXO), red and yellow band
      { const i = i20 + 28, s = S[i], [x, z] = off(i, s.w + 9), [fx, fz] = off(i, s.w + 4.42), r = face(s, 1); cube(x, 2.2, z, r, 15, 4.4, 9, 0xf4f0e8); cube(fx, 3.75, fz, r, 15.1, 1.3, 0.3, 0xd8271c); cube(fx, 2.95, fz, r, 15.1, 0.25, 0.32, 0xf2c230); cube(fx, 1.4, fz, r, 9, 2.2, 0.2, 0x2a3a4a);
        const [tx, tz] = off(i, s.w + 4.0), b = boxMesh(h, h.mat('written', { emis: 1 }, 96, 28, '#d8271c', '#ffe14a', 'XOXO', 24), 6.5, 1.25, 0.12, tx, 3.75, tz); b.rotation.y = r; } // invented sign (not the real brand), flat on the façade
      // ---------- the hall (X-9): hammock fringes on both gables, piñatas under the ridge, goods on the stalls ----------
      for (const i of [i18, i20]) { const s = S[i], n = Math.round((s.w + 8) / 1.5); for (let k = -n; k <= n; k++) { if (Math.abs(k * 1.5) < s.w - 1) continue; const [x, z] = off(i, k * 1.5); cube(x, s.y + 3.7, z, face(s, 1) + 1.5708, 0.12, 1.9, 1.3, [0xf6f2e8, PINK, TEAL, YELLOW, 0xff6a2b][(k + 40) % 5]); } }
      { const pine = []; for (let i = i18 + 6; i < i20; i += 7) { const s = S[i]; pine.push([s.x, s.y + 7.6, s.z, rnd() * 6, 1.3, 1.3, 1.3, PARTY[(i / 7 | 0) % 3]]); } PINE.push(...pine);
        each([i18, i20 - i18], 4, (s, i) => { for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) { const [x, z] = off(i + k - 1, sg * (s.w + 3.3)); cube(x, s.y + 1.05 + (k % 2) * 0.08, z, rnd() * 3, 0.7, 0.3 + (k % 2) * 0.25, 0.7, [0xd8b96a, 0x2c4fa3, 0xd8362a, 0xd8b96a, 0xf2c230][(i + k) % 5]); } }); }

      // ---------- the beach (X-6): palapas and deckchairs on the hotels' terraces, rope-tied posts on the sea side, procession boats offshore, ferry, Cozumel ----------
      each(plageT, 7, (s, i) => { if (s.k > 0.011) return; const [x, z] = off(i, s.w + 9.4); L.palapas.push([x, z, 2.3, 2.3]); for (const e of [-1.6, 1.6]) L.deckchairs.push([x + e, 0.12, z + 0.4, face(s, 1) + 1.5708, 1, 1, 1, PARTY[i % 3]]); });
      each(tr(43, 3, -4, -2), 4, (s, i) => { const [x, z] = off(i, -(s.w + 0.7)); if (dPlace(x, z) > 2 && z > -40) L.poles.push([x, -0.3, z, 0, 1.1, 1.7, 1.1]); });
      // the roadway limit shows: yellow rope between the posts on the sea side, and rope on posts around the sand square where it overhangs the track
      { const [i0, n] = tr(43, 3, -4, -2), o = s => -(s.w + 0.7), mRope = col(YELLOW, { side: D }); ribbonFn(i0, n, o, 1.15, o, 0.9, mRope, i => { const [x, z] = off(i, o(S[i])); return dPlace(x, z) > 2 && z > -40; }, 6);
        const dB = (x, z) => { let b = 1e9; for (let i = 0; i < N; i += 2) { const s = S[i], d = Math.hypot(s.x - x, s.z - z) - s.w; if (d < b) b = d; } return b; }, arc = [];
        for (let a = 0; a <= 360; a += 3) { const x = PX + Math.cos(a / 57.3) * (PL.r + 0.5), z = PZ + Math.sin(a / 57.3) * (PL.r + 0.5); if (dB(x, z) > 1.5) { arc.push([x, 1.15, z]); if (a % 6 === 0) L.poles.push([x, -0.3, z, 0, 1.1, 1.7, 1.1]); } else { if (arc.length > 1) garland(arc.slice(), 0.25, mRope, 2); arc.length = 0; } }
        if (arc.length > 1) garland(arc, 0.25, mRope, 2); }
      for (let k = 0; k < 7; k++) L.boats.push([250 + k * 22, -0.45, -96 - (k % 2) * 7, Math.PI, 1, 1, 1, PARTY[k % 3]]);
      pose('ferry', 80, -0.3, -380, 0.2); cube(300, 6, -1700, 0, 1900, 14, 80, 0x4e7a70);
      // parked vehicles (static): mototaxis in the street, the 307's pickup
      for (const [i, sd] of [[i12 + 10, 1], [P(15), -1], [P(16) + 6, 1], [i17 + 4, -1]]) { const s = S[i], [x, z] = off(i, sd * (s.w - 1.4)); L.motorbikes.push([x, s.y, z, face(s, sd) + 1.5708, 1, 1, 1, PARTY[i % 3]]); }
      // midday cumulus over the land
      { const nu = []; for (let k = 0; k < 30; k++) { const a = rnd() * 3.14, r = 1300 + rnd() * 700; nu.push([300 + Math.cos(a) * r, 240 + rnd() * 220, 300 + Math.sin(a) * r, rnd() * 6, 100 + rnd() * 120, 34 + rnd() * 30, 70 + rnd() * 70]); } inst(h, h.geo('bush'), col(0xf8fbff, { emis: 1, fog: false }), nu).castShadow = false; }
      // ---------- busier beach: on the sea side, palapas with deckchairs, lanchas hauled up dry and coconut palms between the rope and the water; at the pier exit, huts, palapas, boats and coconut palms on both sides up to the town ----------
      each(plageT, 3, (s, i, k) => { const [x, z] = off(i, -(s.w + 3 + rnd() * 7)); if (z < -34 || gap(x, z) < 2.5) return;
        if (k % 12 === 9) L.boats.push([x, -0.05, z, rnd() * 6.28, 1, 1, 1, PARTY[k % 3]]); else if (k % 6 === 3) coco(x, z); else { L.palapas.push([x, z, 2.1, 2.3]); for (const e of [-1.5, 1.5]) L.deckchairs.push([x + e, 0.12, z + 0.4, face(s, -1) + 1.5708, 1, 1, 1, PARTY[(i + k) % 3]]); } });
      for (let i = P(3) - 2; i < P(4) + 8; i += 3) for (const d of [10 + rnd() * 5, 20 + rnd() * 7, 31 + rnd() * 8, 43 + rnd() * 10]) { const s = S[i], [x, z] = off(i, s.w + d), r = rnd(); if (z < -36 || gap(x, z) < 3 || within(TOWN, x, z)) continue;
        if (r < 0.3) coco(x, z); else if (r < 0.45) L.boats.push([x, -0.05, z, rnd() * 6.28, 1, 1, 1, PARTY[i % 3]]); else if (r < 0.75) { cube(x, 1.3, z, face(s, 1), 3.4, 2.6, 3, [0x35a79a, 0xe8b84a, 0xe07a9c, 0xefe3c8][i % 4]); L.palapas.push([x, z, 3.2, 3.1]); } else { L.palapas.push([x, z, 2.1, 2.3]); for (const e of [-1.5, 1.5]) L.deckchairs.push([x + e, 0.12, z + 0.4, face(s, 1) + 1.5708, 1, 1, 1, PARTY[i % 3]]); } }
      let POOL = null; for (let i = P(10) + 2; i < i11 + 10 && !POOL; i += 2) for (const sg of [1, -1]) { const s = S[i], [x, z] = off(i, sg * (s.w + 24)); if (!POOL && z > -24 && gap(x, z) > 17 && !within(TOWN, x, z)) POOL = [x, z, face(s, sg), i, sg]; }
      if (POOL) { const [x, z, a, i, sg] = POOL, ca = Math.cos(a), sa = Math.sin(a), loc = (u, v) => [x + u * ca + v * sa, z - u * sa + v * ca]; L.pools.push([x, 0, z, a, 1.7, 1, 1.7]);   // resort pool: basin, deckchairs and palapas around it, coconut palms, the hotel behind
        for (let k = -3; k <= 3; k++) for (const v of [-9, 9]) { const [tx, tz] = loc(k * 3.6, v); if (gap(tx, tz) < 2.5) continue; L.deckchairs.push([tx, 0.12, tz, a + (v > 0 ? 0 : Math.PI), 1, 1, 1, PARTY[(k + 3) % 3]]); if (k % 2 === 0) L.palapas.push([...loc(k * 3.6 + 1.8, v + Math.sign(v) * 1.2), 2.1, 2.3]); }
        for (const [u, v] of [[-15, -8], [-15, 8], [15, -8], [15, 8], [-16, 0], [16, 0]]) { const [cx, cz] = loc(u, v); if (gap(cx, cz) > 2.5) coco(cx, cz); }
        { const [hx, hz2] = off(i, sg * (S[i].w + 47)); if (gap(hx, hz2) > 14 && !within(TOWN, hx, hz2)) RL[1].push([hx, 0, hz2, a, 1, 1, 1, CR[2]]); } }
      const farP = (x, z) => !POOL || Math.hypot(x - POOL[0], z - POOL[1]) > 19;
      for (let i = P(10); i < i11 + 12; i += 3) for (const sg of [-1, 1]) for (const d of [9 + rnd() * 6, 19 + rnd() * 10]) { const s = S[i], [x, z] = off(i, sg * (s.w + d)), r = rnd(); if (z < -36 || gap(x, z) < 3 || within(TOWN, x, z) || !farP(x, z)) continue;
        if (r < 0.3) coco(x, z); else if (r < 0.48) L.boats.push([x, -0.05, z, rnd() * 6.28, 1, 1, 1, PARTY[i % 3]]); else if (r < 0.72) { cube(x, 1.3, z, face(s, sg), 3.4, 2.6, 3, [0x35a79a, 0xe8b84a, 0xe07a9c, 0xefe3c8][i % 4]); L.palapas.push([x, z, 3.2, 3.1]); } else { L.palapas.push([x, z, 2.1, 2.3]); for (const e of [-1.5, 1.5]) L.deckchairs.push([x + e, 0.12, z + 0.4, face(s, sg) + 1.5708, 1, 1, 1, PARTY[i % 3]]); } }
      inst(h, h.geo('roofPalapa'), mThatch, L.palapas.map(([x, z, r, y]) => [x, y, z, 0, r, r * 0.6, r])).castShadow = true; L.palapas.forEach(([x, z, r, y]) => L.poles.push([x, -0.2, z, 0, 1.3, y + 0.3, 1.3]));
      insts(h, 'deckchair', SKIN, L.deckchairs, { tintMat: 'cloth' }); insts(h, 'pickup', SKIN, L.pickups, { tintMat: 'carBody' }); insts(h, 'mototaxi', SKIN, L.motorbikes, { tintMat: 'carBody' });
      RES.forEach(([Lg, Nv], v) => insts(h, 'resort', SKIN, RL[v], { a: [Lg, Nv], tintMat: 'stucco' })); insts(h, 'pool', SKIN, L.pools);
      // =====================================================================================================================
      // Life: water, light, mechanics, living things, reactions to the raceCase. Numbers in parentheses: those of the proposal.
      // A single wind, the sea breeze, from north to south (+z). Everything advances on dt: the pause freezes everything. Randomness: hz (fixed) or Math.random, never rnd (the validated scenery does not move).
      // Nothing is hittable, nothing is set on what rolls (gap).
      // =====================================================================================================================
      let TV = 0; LIFE.push(dt => { TV += dt; });   // the life clock, in seconds
      const met = (ms, k, x, y, z, ry = 0, e = 1, ey = e, rx = 0, rz = 0, ez = e) => { D0.position.set(x, y, z); D0.rotation.set(rx, ry, rz); D0.scale.set(e, ey, ez); D0.updateMatrix(); for (const m of ms) m.setMatrixAt(k, D0.matrix); };
      const cache = (ms, k) => met(ms, k, 0, -99, 0, 0, 1e-4), upd = ms => { for (const m of ms) m.instanceMatrix.needsUpdate = true; };
      const vivid = (label, list, o, skin = SKIN) => insts(h, label, skin, list, o).map(dyn);   // a batch that moves: outside the merge, outside the re-cut
      const AX = new THREE.Vector3(1, 0, 0), DV = new THREE.Vector3(), tense = (m, k, ax, ay, az, bx, by, bz) => { DV.set(bx - ax, by - ay, bz - az); const l = DV.length() || 1; D0.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); D0.quaternion.setFromUnitVectors(AX, DV.divideScalar(l)); D0.scale.set(l, 1, 1); D0.updateMatrix(); m.setMatrixAt(k, D0.matrix); }; // a wire stretched from a to b (1 m box along X)
      const cap = (dx, dz) => Math.atan2(-dz, dx);   // Y rotation that turns +X towards (dx, dz)
      const FLOWS = [], flows = (m, u, v) => { FLOWS.push([m.map, u, v]); return m; };   // a texture that slides (repeats per second), like the chapada water
      LIFE.push(dt => { for (const [t, u, v] of FLOWS) { t.offset.x = (t.offset.x + u * dt) % 1; t.offset.y = (t.offset.y + v * dt) % 1; } });
      const wave = (g, m, x, y, z) => { const o = dyn(new THREE.Mesh(g, m)); o.position.set(x, y, z); h.scene.add(o); return o; };
      // grains: a point cloud. spawns(k) returns [x, y, z, vx, vy, vz, life]. o = { imgSize, c, op, add, g (gravity), map, hue (tints per point), fade (the grain lights up then fades out, additively), toStack ([from, to]: the grain passes from one tint to the other as it ages), continuous }.
      // Without `continuous`, the grains wait for a burst.
      const grains = (n, spawns, o = {}) => {
        const Pp = new Float32Array(n * 3).fill(-999), Vt = new Float32Array(n * 3), A = new Float32Array(n).fill(1e9), Vi = new Float32Array(n).fill(1), C = o.hue || o.fade || o.toStack ? new Float32Array(n * 3) : null, VA = o.toStack && o.toStack.map(c => new THREE.Color(c)), geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(Pp, 3)); if (C) { if (o.hue) for (let k = 0; k < n; k++) C.set(o.hue[k % o.hue.length], k * 3); geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); }
        const pts = dyn(new THREE.Points(geo, new THREE.PointsMaterial({ size: o.imgSize || 0.2, color: o.c ?? 0xffffff, map: o.map || null, vertexColors: !!C, transparent: true, opacity: o.op ?? 1, depthWrite: false, blending: o.add || o.fade ? THREE.AdditiveBlending : THREE.NormalBlending }))); pts.renderOrder = 5; h.scene.add(pts);
        const launcher = k => { const r = spawns(k); Pp.set([r[0], r[1], r[2]], k * 3); Vt.set([r[3], r[4], r[5]], k * 3); Vi[k] = r[6]; A[k] = 0; };
        if (o.continuous) for (let k = 0; k < n; k++) { launcher(k); A[k] = hz(k, 71) * Vi[k]; for (let j = 0; j < 3; j++) Pp[k * 3 + j] += Vt[k * 3 + j] * A[k]; }
        LIFE.push(dt => { for (let k = 0; k < n; k++) { if (A[k] > Vi[k]) { if (!o.continuous) { Pp[k * 3 + 1] = -999; continue; } launcher(k); } A[k] += dt; if (o.g) Vt[k * 3 + 1] -= o.g * dt; for (let j = 0; j < 3; j++) Pp[k * 3 + j] += Vt[k * 3 + j] * dt;
            if (o.fade) C[k * 3] = C[k * 3 + 1] = C[k * 3 + 2] = o.fade * Math.sin(Math.PI * Math.sqrt(Math.min(1, A[k] / Vi[k])));
            if (VA) { const u = Math.min(1, A[k] / Vi[k]) ** 1.5; C[k * 3] = VA[0].r + (VA[1].r - VA[0].r) * u; C[k * 3 + 1] = VA[0].g + (VA[1].g - VA[0].g) * u; C[k * 3 + 2] = VA[0].b + (VA[1].b - VA[0].b) * u; } }
          geo.attributes.position.needsUpdate = true; if (o.fade || VA) geo.attributes.color.needsUpdate = true; });
        return { salve: () => { for (let k = 0; k < n; k++) launcher(k); } };
      };
      const rand = (a = 1) => (Math.random() - 0.5) * a, hazeTx = h.tx('haze');
      // smoke: grey puffs rising ht metres, which the wind lays towards the south; as they age they take the `toStack` tint (the sky's for a distant plume: it blends into it)
      const smokePuff = (x, y, z, ht, imgSize, n = 14, op = 0.4, toStack = [0x8c8c88, 0xe6e6e2]) => grains(n, () => { const vy = ht / (5 + ht * 0.14); return [x + rand(imgSize * 0.3), y, z + rand(imgSize * 0.3), rand(0.3), vy, 0.5 + ht * 0.03, ht / vy]; }, { imgSize, map: hazeTx, op, toStack, continuous: 1 });
      const nearby = (car, i0, a = 24) => { if (!car) return false; const e = (i0 - car.idx + N) % N; return e > 0 && e < a; }, isFar = (car, i0) => { if (!car) return true; const e = (i0 - car.idx + N) % N; return e > 300 && e < N - 300; };

      // ---------- l'eau ----------
      { // the sea (PL-1, MU-1): foam rollers coming from offshore and dying on the sand line, surf, foam at the foot of the edge piles
        const plan = (lx, lz, nx = 1, nz = 1) => new THREE.PlaneGeometry(lx, lz, nx, nz).rotateX(Math.PI / 2), mEc = (label, k) => { const m = h.mat(label, { emis: 1, transparent: true, depthWrite: false, side: D, rep: [72, 1] }); m.map.offset.x = k * 0.37; return m; };
        const swellRolls = [0, 1, 2, 3].map(k => wave(plan(1800, 1), mEc('foamWide', k), 300, -0.04, -100)), backwash = wave(plan(1800, 1), mEc('foamSea', 5), 300, -0.03, -44);
        LIFE.push(() => { swellRolls.forEach((o, k) => { const p = (TV / 15 + k / 4) % 1; o.position.z = -130 + 85 * p; o.scale.z = 4 + 7 * p; o.material.opacity = Math.min(1, p * 5, (1 - p) * 5); });
          const r = Math.sin(TV * 0.85); backwash.position.z = -44.4 + 2.1 * r; backwash.scale.z = 3.4 + 0.9 * r; });
        const pl = PIER.filter(p => p[2] < -46 && ![505, 515, 525].includes(p[0]))   /* only the edge piles: under the deck nobody sees them */, ec = dyn(inst(h, h.geo('disc'), h.mat('paint', { c: 0xffffff, emis: 1, transparent: true, opacity: 0.5, depthWrite: false }), pl.map(p => [p[0], -0.1, p[2], 0, 1]))); ec.castShadow = ec.receiveShadow = false;
        LIFE.push(() => { pl.forEach((p, k) => met([ec], k, p[0], -0.1, p[2], 0, 0.8 + 0.55 * (0.5 + 0.5 * Math.sin(TV * 1.3 + k * 1.7)))); ec.instanceMatrix.needsUpdate = true; });
      }

      // ---------- light ----------
      // water reflections on the hall vault (CN-2): two layers of light meshes, additive, on the vault geometry
      if (VAULT) for (const [rep, u, v, op] of [[0.5, 0.008, 0.014, 0.13], [0.31, -0.011, 0.006, 0.1]]) { const m = flows(h.addMat(h.tx('caustic'), { opacity: op }), u, v); m.map.repeat.set(rep, rep); h.scene.add(new THREE.Mesh(VAULT, m)); }
      { const water = WELL.map(([x, z, r]) => h.emis(near(h, x, z), x, WATER + 3, z, 0x7fe8dc, 14 + r, 1.6)), c0 = water.map(l => l.c.clone());   // the light the water sends back under each well: a breathing turquoise lamp
        LIFE.push(() => water.forEach((l, k) => l.c.copy(c0[k]).multiplyScalar(0.75 + 0.25 * Math.sin(TV * 1.3 + k * 1.7)))); }

      // ---------- mechanical movement ----------
      { // kites above the sand square (PL-4): moored to the lanchas and the lifeguard tower (the square's piers), they pull southwards; line, diamond, tail rippling
        const ca = Math.cos(PL.a), sa = Math.sin(PL.a), A = PL.piers.filter(p => p[4] === 'lancha' || p[4] === 'torre').map(([px, pz, , , label]) => [PX + px * ca + pz * sa, label === 'torre' ? 4.3 : 1.2, PZ - px * sa + pz * ca]), n = A.length, NQ = 9;
        const CV = [PINK, YELLOW, TEAL, 0xff6a2b, 0x7a4bd6, 0xf6f2e8], whiteN = col(0xffffff, { side: D, emis: 1 }), lc = A.map((a, k) => [0, -99, 0, 0, 1, 1, 1, CV[k % 6]]), lq = A.flatMap((a, k) => Array.from({ length: NQ }, (_, j) => [0, -99, 0, 0, 1, 1, 1, CV[(k + j) % 6]]));
        const cloth = dyn(tinted(inst(h, h.geo('boxMesh', 3, 3, 0.05), whiteN, lc), lc)), queue = dyn(tinted(inst(h, h.geo('boxMesh', 0.4, 0.4, 0.04), whiteN, lq), lq)), wire = dyn(inst(h, h.geo('boxMesh', 1, 0.04, 0.04), col(0xf6f2e8), lc));
        LIFE.push(() => { A.forEach(([ax, ay, az], k) => { const H = 20 + (k * 5) % 10, x = ax + 2.6 * Math.sin(TV * 0.45 + k * 1.3), y = ay + H + 1.3 * Math.sin(TV * 0.8 + k), z = az + 1.6 * H + 1.6 * Math.sin(TV * 0.6 + k * 2);
            met([cloth], k, x, y, z, 0, 1, 1, -0.5, 0.785 + 0.12 * Math.sin(TV * 1.1 + k)); tense(wire, k, ax, ay, az, x, y - 1.3, z + 0.6);
            for (let j = 0; j < NQ; j++) met([queue], k * NQ + j, x + 0.1 * (j + 1) * Math.sin(TV * 3.2 - j * 0.9 + k), y - 1.8 - j * 0.6, z + 0.9 + j * 0.33, 0, 1, 1, -0.5, TV * 2 + j); });
          upd([cloth, queue, wire]); });
      }
      { // under the hall (HA-5): a low piñata bursts into confetti as the car passes
        const iP = i18 + 21, sP = S[iP]; PINE.push([sP.x, sP.y + 5.4, sP.z, 0, 1.7, 1.7, 1.7, PINK]); const kP = PINE.length - 1, pine = dyn(tinted(inst(h, h.geo('buoy'), col(0xffffff), PINE), PINE));
        const conf = grains(220, () => [sP.x + rand(1.5), sP.y + 5.4 + rand(1.2), sP.z + rand(1.5), rand(7), 1 + Math.random() * 4, rand(7), 2.2], { imgSize: 0.16, hue: [[0.91, 0.27, 0.55], [0.12, 0.71, 0.66], [0.95, 0.76, 0.19], [1, 1, 1]], g: 7 });
        let bursts = 0;
        LIFE.push((dt, car) => { if (!bursts && nearby(car, iP, 9)) { bursts = 1; conf.salve(); cache([pine], kP); pine.instanceMatrix.needsUpdate = true; } else if (bursts && isFar(car, iP)) { bursts = 0; const p = PINE[kP]; met([pine], kP, p[0], p[1], p[2], p[3], p[4]); pine.instanceMatrix.needsUpdate = true; } });
      }
      for (let i = i12 + 2; i < i17 - 2; i += 10) { const s = S[i], y = Math.min(hFac(i, -1), hFac(i, 1)) + 0.9, o = s.w + 2.4, [x0, z0] = off(i, -o), [x1, z1] = off(i, o); h.emis(i, s.x, s.y + y - 1.2, s.z, 0xffd08a, 16, 0.4); garland([[x0, s.y + y, z0], [(x0 * 3 + x1) / 4, s.y + y - 0.7, (z0 * 3 + z1) / 4], [s.x, s.y + y - 0.95, s.z], [(x0 + x1 * 3) / 4, s.y + y - 0.7, (z0 + z1 * 3) / 4], [x1, s.y + y, z1]], 0.4, mBulb, 3); } // bulb garlands across the street (RU-1)
      // smoke (RU-3, R7-2): street grills at the kerb, brush fires in the distance
      const EMBERS = []; for (const [i, sd] of [[440, -1], [468, 1], [494, -1]]) { const s = S[i], [x, z] = off(i, sd * (s.w + 0.7)); cube(x, s.y + 0.5, z, face(s, sd), 1, 1, 0.6, 0x3a3a3e); smokePuff(x, s.y + 1.2, z, 8, 3, 14, 0.6, [0x6a6a68, 0xdcdcd8]); EMBERS.push(h.emis(i, x, s.y + 1.2, z, 0xff7a20, 9, 0.7)); }
      { const c0 = EMBERS.map(l => l.c.clone()); LIFE.push(() => EMBERS.forEach((l, k) => l.c.copy(c0[k]).multiplyScalar(0.7 + 0.3 * Math.abs(Math.sin(TV * 9 + k * 2) * Math.sin(TV * 5.3 + k))))); }   // the grills' embers light the pavement and flicker
      smokePuff(150, 8, 455, 80, 32, 34, 0.55, [0x6e6e6c, 0xc4e0ee]);   // in line with the crest's straight, behind the cenote mound

      // ---------- living things ----------
      // Birds: one perched batch and one flying batch, at the same ranks. A bird circles (R), or waits, perched or hidden, to take off with its group (ENV).
      const BIRDS = [], ENV = [], BLACK = 0x1e2024, GRAY_DARK = 0x2a3038;
      const rounded = (n, cx, cy, cz, R, w, e, c, drumset, dy = 0) => { for (let k = 0; k < n; k++) BIRDS.push({ cx, cy: cy + (hz(k, cx) - 0.5) * 6, cz, R: R * (0.75 + 0.5 * hz(k, cz)), w: w * (0.85 + 0.3 * hz(k, 8)), ph: k / n * 6.2832 + hz(k, 9), e, c, drumset, dy }); };
      const group = (mapList, dec, distant, o = {}) => { const ks = mapList.map(b => BIRDS.push(b) - 1); ENV.push({ ks, dec, isFar: distant, T: 5, del: 0.05, drumset: 14, en: 0, t: 9, ...o }); };
      rounded(6, 500, 17, 452, 12, 0.5, 2.6, 0x18181a, 0, 2);   // turkey vultures circling low in the 307's corridor, between the two rows of trees (R7-1)
      // gulls perched on the sand square, to the left of the track: they take off southwards, across the track, as the car approaches (PL-9)
      group(Array.from({ length: 16 }, (_, k) => ({ pose: 1, x: 270 + (hz(k, 21) - 0.5) * 18, y: -0.05, z: 50 + (hz(k, 22) - 0.5) * 11, r: hz(k, 23) * 6.28, e: 2, c: 0xf4f4f0, vx: (hz(k, 24) - 0.5) * 8, vy: 3 + hz(k, 25) * 3, vz: 5 + hz(k, 26) * 4 })),
        car => !!car && Math.hypot(car.x - 270, car.z - 50) < 62, car => !car || Math.hypot(car.x - 270, car.z - 50) > 190);
      // cave swallows taking off from the cutting, in front of the gallery mouth, on approach (CE-2); in daylight: in the mouth's shadow they could not be seen
      { const s = S[tT - 8]; group(Array.from({ length: 16 }, (_, k) => ({ x: s.x - s.tz * (hz(k, 41) - 0.5) * 8, y: s.y + 1.5 + hz(k, 42) * 3, z: s.z + s.tx * (hz(k, 41) - 0.5) * 8, e: 1.4, c: GRAY_DARK, vx: -s.tx * 9 + (hz(k, 43) - 0.5) * 5, vy: 3 + hz(k, 44) * 3, vz: -s.tz * 9 + (hz(k, 43) - 0.5) * 5 })), car => nearby(car, tT - 8, 22), car => isFar(car, tT), { T: 3.2, del: 0.06 }); }
      const PLU = { plumage: col(0xffffff, { side: D, emis: 1, transparent: true })   /* flat: lit from below, a white bird came out brown; transparent: rhythm.js does not make it flap */, beak: col(0x2a2a2a, { side: D }) }, lo = BIRDS.map(o => [o.x || 0, -99, o.z || 0, 0, o.e, o.e, o.e, o.c]), oP = vivid('birdPerched', lo, { tintMat: 'plumage' }, PLU), oV = vivid('bird', lo, { tintMat: 'plumage' }, PLU);
      [...oP, ...oV].forEach(m => { m.castShadow = false; });   // a gull's shadow (2 m) fits in one pixel: 4 fewer passes in the moving shadow map
      BIRDS.forEach((o, k) => { cache(oV, k); o.pose ? met(oP, k, o.x, o.y, o.z, o.r, o.e) : cache(oP, k); });
      LIFE.push((dt, car) => {
        BIRDS.forEach((o, k) => {
          if (o.R) { const a = o.ph + TV * o.w, sg = Math.sign(o.w); met(oV, k, o.cx + Math.cos(a) * o.R, o.cy + o.dy * Math.sin(TV * 0.4 + o.ph), o.cz + Math.sin(a) * o.R, cap(-sg * Math.sin(a), sg * Math.cos(a)), o.e, o.e * (o.drumset ? Math.cos(TV * o.drumset + k * 1.7) * 0.85 + 0.15 : 0.75 + 0.2 * Math.sin(TV * 1.3 + k))); }
        });
        for (const g of ENV) {
          if (!g.en && g.t >= g.T && g.dec(car)) { g.en = 1; g.t = 0; } else if (g.en && g.t >= g.T && g.isFar(car)) { g.en = 0; for (const k of g.ks) { const o = BIRDS[k]; if (o.pose) met(oP, k, o.x, o.y, o.z, o.r, o.e); } }
          if (g.en && g.t < g.T) { g.t += dt; g.ks.forEach((k, j) => { const o = BIRDS[k], t = g.t - j * g.del; if (t <= 0) return; const y = o.y + o.vy * t, vu = g.t < g.T - 0.05;
              cache(oP, k); vu ? met(oV, k, o.x + o.vx * t, y, o.z + o.vz * t, cap(o.vx, o.vz), o.e, o.e * (Math.cos(TV * g.drumset + k) * 0.85 + 0.15)) : cache(oV, k); }); }
        }
        upd(oP); upd(oV);
      });
      { // flamingos (LA-1): two batches at the same ranks (standing, in flight). The group of point 38 takes off on approach, crosses the dike above the road and lands again on the other side
        const FL = L.flamingos, PV = { feather: col(0xf0836a, { side: D }), paw: col(0xe78a8c, { side: D }), beak: col(0x2a2a2a, { side: D }) }, fA = vivid('flamingo', FL, { a: [0] }), fV = vivid('flamingoFlight', FL, {}, PV);
        const here = FL.map(p => [p[0], p[2], p[3]]), but = (k0, i0) => Array.from({ length: 16 }, (_, j) => { const i = i0 + (hz(j, 51) * 16 | 0); return [...off(i, -(S[i].w + 15 + hz(j, 52) * 12)), 3.14 + hz(j, 53) * 0.6]; });
        const G = [{ k0: 16, i0: P(38), dec: car => nearby(car, P(38), 30) }].map(g => ({ ...g, de: here.slice(g.k0, g.k0 + 16), a: but(g.k0, g.i0), en: 0, t: 9, T: 4.6 }));
        const rests = k => { const p = here[k]; met(fA, k, p[0], -1.2, p[1], p[2]); cache(fV, k); }; FL.forEach((p, k) => rests(k));
        LIFE.push((dt, car) => { let ch = 0;
          for (const g of G) {
            if (!g.en && g.dec(car)) { g.en = 1; g.t = 0; } else if (g.en && g.t >= g.T && isFar(car, g.i0)) { g.en = 0; ch = 1; for (let j = 0; j < 16; j++) { here[g.k0 + j] = g.de[j]; rests(g.k0 + j); } }
            if (g.en && g.t < g.T) { g.t += dt; ch = 1; for (let j = 0; j < 16; j++) { const k = g.k0 + j, u = ss(0, 3.6, g.t - j * 0.06), d = g.de[j], a = g.a[j];
                if (u <= 0) continue; if (u >= 1) { if (here[k] !== a) { here[k] = a; rests(k); } continue; } here[k] = null; cache(fA, k);
                met(fV, k, d[0] + (a[0] - d[0]) * u, 0.3 + 6.2 * Math.sin(Math.PI * u), d[1] + (a[1] - d[1]) * u, cap(a[0] - d[0], a[1] - d[1]), 1, Math.cos(TV * 9 + k) * 0.85 + 0.15); } }
          }
          if (ch) { upd(fA); upd(fV); }
        });
      }
      { // people (RU-4, HA-3, PL-10, CN-6): two batches at the same ranks (arms by the sides, arms raised). PEOPLE = [x, y, z, rotation, mode, sample, tint, scale];
        // mode 0: calm, an arm raised from time to time; 1: crowd, waves to the car arriving at its sample
        const CLOTHES = [PINK, TEAL, YELLOW, 0xf6f2e8, 0xff6a2b, 0x2c4fa3, 0xd8362a, 0x7a4bd6], people = (x, y, z, r, mode = 0, i = 0, e = 1) => { if (gap(x, z) > 0.3) PEOPLE.push([x, y, z, r, mode, i, undefined, e]); };
        const ETR = [[420, -1], [430, -1], [450, -1], [460, -1], [470, -1], [480, -1], [503, -1], [425, 1], [435, 1], [445, 1], [455, 1], [475, 1], [485, 1], [495, 1]];   // street stalls [sample, side]: out of the continuous line's posts (on the right, every 10) and the grills
        for (const [i, sd] of ETR) { const s = S[i], [x, z] = off(i, sd * (s.w + 1.05)); L.stalls.push([x, s.y - 0.05, z, face(s, sd), 0.85, 0.85, 0.85, [PINK, TEAL, YELLOW, 0xf6f2e8, 0xff6a2b][(i + (sd > 0 ? 2 : 0)) % 5]]); }   // at 85%: their canvas passes under the edge of the awnings
        for (let i = 418; i < 506; i += 4) for (const sd of [-1, 1]) { if (hz(i, sd + 70) < 0.3 || (sd > 0 && i % 10 === 0) || ETR.some(([e, c]) => c === sd && Math.abs(e - i) < 3)) continue; const s = S[i], [x, z] = off(i, sd * (s.w + 0.4 + hz(i, sd + 71) * 0.5)); people(x, s.y, z, face(s, sd) + 1.5708, 1, i, 1.15); }   // the street: at the kerb edge, between the stalls
        each([i18, i20 - i18], 2, (s, i) => { if ((i - i18) % 4 === 0) return; for (const sg of [-1, 1]) { if (hz(i, sg + 72) < 0.5) continue; const [x, z] = off(i, sg * (s.w + 1.3 + hz(i, sg + 73) * 0.9)); people(x, s.y, z, face(s, sg) + (hz(i, sg + 74) < 0.5 ? 1.5708 : -1.5708), hz(i, sg + 75) < 0.5 ? 1 : 0, i, 1.15); } });   // the hall: sellers and customers between the roadway and the stalls, out of the post rows
        each(plageT, 5, (s, i, k) => { const [x, z] = off(i, s.w + [2.4, 3.2, 5.6, 6.4][(k / 5 | 0) % 4]); people(x, 0.12, z, face(s, 1) + 1.5708, (k / 5 | 0) % 2, i); });                                                                               // the beach's malecón
        const lg = PEOPLE.map((p, k) => [p[0], p[1], p[2], p[3], p[7] || 1, p[7] || 1, p[7] || 1, p[6] || CLOTHES[(k * 5 + (k >> 3)) % 8]]), PG = { low: col(0x2a3a5a), clothes: col(0xffffff), skin: col(0xc68a5a) }, gA = vivid('folk', lg, { a: [0], tintMat: 'clothes' }, PG), gB = vivid('folk', lg, { a: [1], tintMat: 'clothes' }, PG), curState = new Int8Array(PEOPLE.length).fill(-1);
        LIFE.push((dt, car) => { let ch = 0; PEOPLE.forEach((p, k) => { const e = car ? (p[5] - car.idx + N) % N : 99, lifts = p[4] === 1 && (e < 26 || e > N - 5) ? (TV * 3 + k * 0.37) % 1 < 0.75 : p[4] === 0 && Math.sin(TV * 0.8 + k * 1.9) > 0.93;
            if (curState[k] === +lifts) return; curState[k] = +lifts; ch = 1; const s = p[7] || 1; met(lifts ? gB : gA, k, p[0], p[1], p[2], p[3], s); cache(lifts ? gA : gB, k); }); if (ch) { upd(gA); upd(gB); } });
        // the malecón bicycle seller (PL-10): he walks along the promenade, there and back
        const [v0, vn] = plageT, bike = vivid('bike', [[0, -99, 0]]), cyc = vivid('folk', [[0, -99, 0, 0, 1, 1, 1, 0xf6f2e8]], { a: [0], tintMat: 'clothes' }, PG);
        LIFE.push(() => { const T2 = vn / 2, w = (TV % (2 * T2)), u = w < T2 ? w * 2 : (2 * T2 - w) * 2, j = (v0 + Math.floor(u)) % N, f = u - Math.floor(u), a = S[j], b = S[(j + 1) % N], d = w < T2 ? 1 : -1, o = a.w + 7, x = a.x + (b.x - a.x) * f - a.tz * o, z = a.z + (b.z - a.z) * f + a.tx * o, r = cap(d * a.tx, d * a.tz);
          met(bike, 0, x, 0.12, z, r); met(cyc, 0, x, 0.5, z, r); upd(bike); upd(cyc); });
      }

      // ---------- reactions to the race ----------
      { // feria confetti when the car reaches the line (PL-13): it drives under it
        const s0 = S[0], conf = grains(420, () => { const o = rand(2 * s0.w); return [s0.x - s0.tz * o + rand(3), s0.y + 6.5 + Math.random() * 2.5, s0.z + s0.tx * o + rand(3), rand(1.5), -1.6 - Math.random() * 1.2, 0.8 + rand(1.5), 4.5]; }, { imgSize: 0.15, hue: [[0.91, 0.27, 0.55], [0.12, 0.71, 0.66], [0.95, 0.76, 0.19], [1, 1, 1]] });
        let before = false; LIFE.push((dt, car) => { const va = nearby(car, N, 26); if (va && !before) conf.salve(); before = va; });
      }
      // ---------- batches: one drawing pass per shape ----------
      inst(h, h.geo('poleWood'), mWood, L.poles); insts(h, 'coconutPalm', SKIN, L.cocos, { a: [0] }); tinted(inst(h, h.geo('bush'), grain('#ffffff', ['#e8e8e8', '#d8d8d8']), L.boxwood), L.boxwood);
      tinted(inst(h, h.geo('canopy'), grain('#ffffff', ['#e4e4e4', '#cacaca']), MANGROVE), MANGROVE);
      insts(h, 'ceiba', SKIN, ARB[0], { tintMat: 'leafKey' }); insts(h, 'treeSelva', SKIN, ARB[1], { tintMat: 'leafKey' });
      insts(h, 'lamppost', SKIN, L.lamp); insts(h, 'poleElec', SKIN, L.polesE); insts(h, 'bench', SKIN, L.benches); insts(h, 'stallPlaya', SKIN, L.stalls, { tintMat: 'cloth' }); insts(h, 'mangroveTree', SKIN, L.mangroves);
      insts(h, 'boat', SKIN, L.boats, { tintMat: 'bandStrip' }); tinted(inst(h, h.geo('boxMesh', 1, 1, 1), mStucco, L.cubes), L.cubes); tinted(inst(h, h.geo('pennant'), h.mat('papelPicado', { side: D, alphaTest: 0.5 }), L.pennants), L.pennants).castShadow = true;
      for (const o of h.scene.children.slice(n0)) if (o.isInstancedMesh && o.count > 120 && !o.userData.dyn) {
        const cells = new Map(), M4 = new THREE.Matrix4(), C = new THREE.Color();
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); const k = Math.floor(M4.elements[12] / 350) + ':' + Math.floor(M4.elements[14] / 350); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(i); }
        if (cells.size < 2) continue;
        for (const l of cells.values()) { const m = new THREE.InstancedMesh(o.geometry, o.material, l.length); l.forEach((i, j) => { o.getMatrixAt(i, M4); m.setMatrixAt(j, M4); if (o.instanceColor) { o.getColorAt(i, C); m.setColorAt(j, C); } }); m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; h.scene.add(m); }
        h.scene.remove(o);
      }
      for (const o of h.scene.children.slice(n0)) if (o.isInstancedMesh && o.count && !o.userData.dyn) { o.computeBoundingSphere(); o.frustumCulled = true; }
      const tick = (dt, now, car) => { dt = Math.min(dt, 0.1); for (const f of LIFE) f(dt, car); }; tick(0); return tick;
    },
  });
})();
