// Scenery placement for "paris": adds its function to SCENERY. The shared placers come from scenery.js. See docs/methods/SCENERY.md.
(function () {
  const { inst, near, pt, indexed, insts, GLOW, boxMesh, edgePt, marker, weld, terrain } = PLACERS;

  Object.assign(SCENERY, {
    // ---------- First metro: the roadway width is the same everywhere (sim.js), but the street changes size: a grand boulevard with service roads
    // and a double row of trees, avenue, street, the lane of the butte's low houses built against the pavement, open quay on the Seine, square. ----------
    paris(h) {
      const { THREE, S, N, W, rnd, M } = h, quay = (x, z) => z > 250 && x > -170 && x < 1060; // the river side of the quays
      const PL = M.place, C = PL.c, RT = PL.r + 6, outsidePlace = (x, z) => (x - C[0]) ** 2 + (z - C[1]) ** 2 > (PL.r + 1) ** 2; // the square: centre, foot of the façades
      const IY = 1.5, WY = -8, shore = x => x > 180 && x < 820 ? 280 : 248; // the Seine's level; its bank: at the level of the expressway on the bank, set back from the tunnel that passes beneath it (it runs to z 272 at point 29)
      const g = terrain(h, { stepSec: 16, margin: 320, mat: h.mat('noise', {}, '#6e6a66', ['#7a7672', '#625e5a']), hollow: (x, z) => quay(x, z) ? Math.max(0, Math.min(9, (z - shore(x)) * 0.6)) : 0 });
      const water = h.mat('noise', { emis: 1, rep: [40, 20] }, '#1e3a3a', ['#2a4a48', '#c08a7a', '#16302e']); // the Seine, taking the sky's pink
      boxMesh(h, water, 1710, 1, 710, 595, WY - 0.5, 635); for (const [x0, x1] of [[-260, 180], [820, 1060]]) boxMesh(h, water, x1 - x0, 1, 18, (x0 + x1) / 2, WY - 0.5, 255);
      let rngSeed = 1; const al = () => (rngSeed = rngSeed * 16807 % 2147483647) / 2147483647; // randomness specific to the new placements: does not shift rnd
      // a strip along the track whose edges follow the local width: fa(s), fb(s) = offsets from the axis; flat, the texture is laid flat (one tile every `tile` m)
      // ya, yb = heights, numbers or functions (s, k) of the sample and of the row in the strip
      const ribbonFn = (i0, cnt, fa, ya, fb, yb, m) => {
        const t = m.userData.tile || 4, pos = [], uv = [], idx = [], Y = (v, s, k) => typeof v === 'function' ? v(s, k) : v;
        for (let k = 0; k <= cnt; k++) {
          const s = S[(i0 + k) % N], a = fa(s), b = fb(s), y1 = Y(ya, s, k), y2 = Y(yb, s, k), A = [s.x - s.tz * a, s.y + y1, s.z + s.tx * a], B = [s.x - s.tz * b, s.y + y2, s.z + s.tx * b];
          pos.push(...A, ...B); uv.push(...(ya === yb ? [A[0] / t, A[2] / t, B[0] / t, B[2] / t] : [k * 2 / t, y1 / t, k * 2 / t, y2 / t]));
          if (k < cnt) idx.push(2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 1, 2 * k + 3, 2 * k + 2);
        }
        return sheet(pos, uv, idx, m);
      };
      const sheet = (pos, uv, idx, m) => { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals();
        const me = new THREE.Mesh(ge, m); me.receiveShadow = true; h.scene.add(me); return me; };
      // horizontal crown centred on (cx, cz), from radius r0 to r1, at altitude y, in n sectors; retain(x, z) = false to skip a sector
      const crown = (cx, cz, r0, r1, y, n, m, retain = () => true) => {
        const t = m.userData.tile || 4, pos = [], uv = [], idx = [];
        for (let k = 0; k < n; k++) { const a0 = k / n * 6.2832, a1 = (k + 1) / n * 6.2832, am = (a0 + a1) / 2, rm = (r0 + r1) / 2;
          if (!retain(cx + Math.cos(am) * rm, cz + Math.sin(am) * rm, a0, a1)) continue;
          const v = pos.length / 3; for (const [r, a] of [[r0, a0], [r1, a0], [r1, a1], [r0, a1]]) { const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; pos.push(x, y, z); uv.push(x / t, z / t); }
          idx.push(v, v + 2, v + 1, v, v + 3, v + 2); }
        return sheet(pos, uv, idx, m);
      };
      const nearest = (x, z) => { let b = S[0], bd = 1e18; for (const s of S) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = s; } } return [Math.sqrt(bd), b]; }; // nearest sample and its distance
      // street types: setback = distance from the pavement to the façade, H = building height, trees = rows (distance to the edge), depot = parking
      const TYPES = { boulevard: { setback: 21, H: [26, 30], trees: [5.5, 15], depot: 2 }, avenue: { setback: 11, H: [22, 26], trees: [6], depot: 1 }, street: { setback: 3.2, H: [18, 22], trees: [], depot: 0 },
        alley: { setback: 1, H: [9, 15], trees: [], depot: 0 }, quay: { setback: 6.5, H: [20, 24], trees: [], depot: 1 }, riverbank: { setback: 16, H: [26, 30], trees: [], depot: 0 }, place: { setback: 6, H: [26, 28], trees: [], depot: 0 } };
      const type = new Array(N).fill('street'), streets = M.th.streets.map(([p, t]) => [pt(h, p), t]).sort((a, b) => a[0] - b[0]);
      streets.forEach(([i0, t], k) => { const i1 = k + 1 < streets.length ? streets[k + 1][0] : N; for (let i = i0; i < i1; i++) type[i] = t; });
      for (let i = 0; i < streets[0][0]; i++) type[i] = streets[streets.length - 1][1];
      const trunks = [], crownList = [], masts = [], lant = [], autoList = [[], [], [], []], shops = [], rings = [];
      // the butte's descent (points 19 to 23): façades in other tints, the butte's staircase on the right at point 20 (one building fewer), the bakery on the left at point 21
      const iD0 = pt(h, 19), iD1 = pt(h, 23), iE = pt(h, 20) >> 3 << 3, iB = pt(h, 21) >> 3 << 3, sdE = 1, sdB = -1;
      // granite-kerbed pavements, and an asphalt parking strip, per stretch of the same type outside the tunnel; they follow the roadway width (the square widens)
      const slab = h.mat('slabs', { side: THREE.DoubleSide }), curb = h.mat('stone', { side: THREE.DoubleSide }), asphalt = h.mat('noise', { side: THREE.DoubleSide }, '#45454c', ['#4f4f56', '#3c3c42']);
      for (let i = 0; i < N;) {
        let j = i; const tun = h.zone(i, 1) > 0.5; while (j < N && type[j] === type[i] && (h.zone(j, 1) > 0.5) === tun) j++;
        const t = TYPES[type[i]], gb = t.depot ? 3.2 : 0;
        if (!tun && type[i] === 'riverbank') { // quayside road (the Seine still on the left here): on the left a stone edging and the wall that dives into the water;
          // on the right a narrow pavement, the high quay wall (street 1.5 m above), its parapet; the wall rises for 50 m as you go down from the street, it is whole at the tunnel exit
          const full = h.zone(i - 1, 1) > 0.5, hq = (s, k) => 0.22 + Math.max(0, 1.28 - s.y) * (full ? 1 : Math.min(1, k / 25)), hp = (s, k) => hq(s, k) + 1;
          ribbonFn(i, j - i, s => s.w, 0.22, s => s.w + 1.2, 0.22, slab); ribbonFn(i, j - i, s => s.w, 0.22, s => s.w, -0.6, curb);
          ribbonFn(i, j - i, s => s.w + 1.2, 0.22, s => s.w + 1.2, hq, curb); ribbonFn(i, j - i, s => s.w + 1.2, hq, s => s.w + 18, hq, slab); ribbonFn(i, j - i, s => s.w + 1.4, hq, s => s.w + 1.4, hp, curb);
          ribbonFn(i, j - i, s => -s.w, 0.22, s => -s.w - 0.8, 0.22, curb); ribbonFn(i, j - i, s => -s.w, 0.22, s => -s.w, -0.6, curb); ribbonFn(i, j - i, s => -s.w - 0.8, 0.22, s => -s.w - 0.8, s => WY - s.y - 0.6, curb);
          for (let k = i; k < j; k++) { const s = S[k]; if (k % 6 === 0) { const [x, z] = edgePt(s, -1, s.w + 0.8); rings.push([x, s.y - 1.1, z, h.across(s) + Math.PI]); }
            if (k % 10 === 5) { const [x, z] = edgePt(s, 1, s.w + 9), y0 = s.y + hq(s, k - i); trunks.push([x, y0 + 2.6, z]); crownList.push([x, y0 + 7.6, z, al() * 6, 1, 0.9, 1]); } }
        } else if (!tun && type[i] !== 'place') for (const sd of [-1, 1]) {
          const within = s => !outsidePlace(...edgePt(s, sd, s.w + gb)); // within the square's circle: no pavement, one drives on it
          ribbonFn(i, j - i, s => sd * (s.w + gb), 0.22, s => within(s) ? sd * (s.w + gb) : sd * (s.w + t.setback + 0.5), 0.22, slab); ribbonFn(i, j - i, s => sd * (s.w + gb), 0.22, s => sd * (s.w + gb), s => within(s) ? 0.22 : -0.6, curb);
          if (gb) ribbonFn(i, j - i, s => sd * s.w, 0.01, s => sd * (s.w + gb), 0.01, asphalt);
        }
        i = j;
      }
      // ---- the square: a large paved circle where one drives everywhere, the Arc de Triomphe in the middle: you go around it in a slide or drive under it
      const wide = S.map((s, i) => i).filter(i => S[i].w > W + 0.05), cobbles = h.mat('cobbles', { side: THREE.DoubleSide });
      ribbonFn(wide[0], wide[wide.length - 1] - wide[0], s => -s.w, 0.02, s => s.w, 0.02, cobbles);
      // the square's choice: the circuit's roadway (bitumen, sim.js: dry) makes the long way round; cutting through the arch, between the piers, is shorter but on the cobbles (surf.wide).
      // The game's roadway (same texture, same markings, in phase with its 32 m dashes) is relaid over the cobbles, from the arrival avenue to the departure one: no visible join
      { const within = S.map((s, i) => i).filter(i => S[i].w > W + 0.05 || (S[i].x - C[0]) ** 2 + (S[i].z - C[1]) ** 2 < (RT + 20) ** 2), a = within[0] - ((within[0] - h.T.t1 + 16 * N) % 16);
        const y = s => Math.max(0.07, 0.07 - s.y); // at least 5 cm above the cobbles, which are flat (0.02) whereas the road dips to -0.13 m toward the exit: the grazing crossing of the two planes made the join slide with the camera
        h.ribbon(a, within[within.length - 1] - a + 16, -W, y, W, y, h.mat('roadway', { side: THREE.DoubleSide, gloss: 0.08 }, ...M.th.road), 32); }
      // the square's ground in 2 m squares: cobbles everywhere in the circle one drives on, narrow pavement at the foot of the façades, except where the avenues leave
      { const nearby = S.filter(s => (s.x - C[0]) ** 2 + (s.z - C[1]) ** 2 < 260 ** 2), isFar = (x, z) => { let m = 1e9; for (const s of nearby) m = Math.min(m, Math.hypot(s.x - x, s.z - z) - s.w); return m; }; // distance to the roadway's edge
        const rolling = [[], [], []], foot = [[], [], []];
        for (let r = PL.island[0]; r < RT + 6; r += 2) { // (the central island has its own paving)
          const n = Math.max(6, Math.ceil(6.2832 * r / 2)); for (let k = 0; k < n; k++) {
          const a0 = k / n * 6.2832, a1 = (k + 1) / n * 6.2832, P = [[r, a0], [r + 2, a0], [r + 2, a1], [r, a1]].map(([rr, a]) => [C[0] + Math.cos(a) * rr, C[1] + Math.sin(a) * rr]), e = r < PL.r - 2 ? 0 : Math.min(...P.map(q => isFar(...q)));
          const L = r < PL.r || e < 0.3 ? rolling : foot; P.forEach(([x, z]) => { L[0].push(x, 0, z); L[1].push(x / 4, z / 4); }); const v = L[0].length / 3 - 4; L[2].push(v, v + 2, v + 1, v, v + 3, v + 2); } }
        rolling[0].forEach((v, i) => { if (i % 3 === 1) rolling[0][i] = 0.02; }); foot[0].forEach((v, i) => { if (i % 3 === 1) foot[0][i] = 0.22; });
        sheet(...rolling, cobbles); sheet(...foot, slab); }
      // the arch in the middle, a large arch on the axis of the crossing; its piers are obstacles (sim.js). Its stone is lit up, golden, as at dawn: it can be seen from the end of the avenues,
      // it is the square's landmark (grey like the façades, it got lost)
      const golden = m => { m.emissive.setHex(0xffb860); m.emissiveMap = m.map; m.emissiveIntensity = 0.5; return m; };
      h.pose('arcParis', { stone: golden(h.mat('stone')), relief: golden(h.mat('basRelief')) }, h.scene, [C[0], 0.02, C[1]]).forEach(m => m.rotation.y = PL.a);
      // ---- the arch's central island (sim.js: place.island): pale granite paving, a twelve-pointed star in pink cobbles, a hundred granite bollards linked by chains,
      // open on the axis of the great arch; under the arch, the slab and the flame; ten candelabra. The ring of roadway around it stays bare: that is where one slides.
      { const [RI, OUV] = PL.island, A0 = Math.PI / 2 - PL.a, cs = Math.cos(PL.a), sn = Math.sin(PL.a), P2 = (r, a) => [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r];
        const closes = a => Math.abs(RI * (Math.cos(a) * cs - Math.sin(a) * sn)) > OUV; // outside the opening (same calculation as sim.js)
        crown(C[0], C[1], 0, RI, 0.02, 72, h.mat('granite', { side: THREE.DoubleSide }));
        const et = [[], [], []]; for (let k = 0; k < 12; k++) { const a = A0 + k * Math.PI / 6; for (const [r, b] of [[28, a - Math.PI / 12], [28, a + Math.PI / 12], [46, a]]) { const [x, z] = P2(r, b); et[0].push(x, 0.04, z); et[1].push(x / 4, z / 4); } et[2].push(3 * k, 3 * k + 1, 3 * k + 2); }
        sheet(...et, h.mat('cobbles', { c: 0xf0b0a0, side: THREE.DoubleSide }));
        const bollards = [], chains = [], n = 100, stepSec = 6.2832 / n;
        for (let k = 0; k < n; k++) { const a = A0 + (k + 0.5) * stepSec; if (!closes(a)) continue; const [x, z] = P2(RI, a); bollards.push([x, 0.02, z, -a]);
          if (closes(a + stepSec)) { const [mx, mz] = P2(RI * Math.cos(stepSec / 2), a + stepSec / 2); chains.push([mx, 0.62, mz, Math.PI / 2 - a - stepSec / 2, 2 * RI * Math.sin(stepSec / 2), 0.07, 0.07]); } }
        insts(h, 'bollard', { stone: h.mat('stone') }, bollards); inst(h, h.geo('blk'), h.mat('castiron'), chains);
        h.pose('flame', { bronze: h.mat('paint', { c: 0x4a3c22 }), fire: h.mat('paint', { emis: 1, c: 0xffa030 }) }, h.scene, [C[0], 0.02, C[1]]).forEach(m => m.rotation.y = PL.a);
        const iP = wide[wide.length >> 1]; h.emis(iP, C[0], 2.5, C[1], 0xff8a30, 34, 2); // the flame lights the underside of the vault
        for (const sd of [-1, 1]) for (let k = 1; k <= 5; k++) { const [x, z] = P2(RI - 2.5, A0 + sd * k * Math.PI / 6); masts.push([x, 3.5, z]); lant.push([x, 7.1, z]); if (k % 2 === 0) h.emis(iP, x, 6.6, z, 0xffd05a, 15, 1.6); } }
      // ---- the square's pavement, between the wall and the façades: plane trees, benches, Morris columns, metro entrances, a kiosk; nothing where the avenues leave
      const kqPlace = [], benches = [], morris = [], subways = [];
      { let n = 0; const stepSec = 9 / (PL.r + 2.2);
        for (let a = stepSec / 2; a < 6.2832; a += stepSec) { const x = C[0] + Math.cos(a) * (PL.r + 2.2), z = C[1] + Math.sin(a) * (PL.r + 2.2), [d, s] = nearest(x, z); if (d < s.w + 1.5) continue; // (on an avenue's roadway)
          const P2 = (r, b = a) => [C[0] + Math.cos(b) * r, 0.22, C[1] + Math.sin(b) * r, -b - Math.PI / 2], k = n++; // placed on the pavement, facing the arch
          if (k % 27 === 13) subways.push(P2(PL.r + 3)); else if (k % 20 === 8) morris.push(P2(PL.r + 2.2)); else if (k === 45) kqPlace.push(P2(PL.r + 3.6)); else { trunks.push([x, 2.82, z]); crownList.push([x, 7.82, z, k * 1.7, 1, 0.9, 1]); }
          if (k % 5 === 2) benches.push(P2(PL.r + 4.8, a + stepSec / 2)); } }
      const fm = ['#d9c9a8', '#cfc0a0', '#e0d4b8', '#e8cfa0', '#c8b4a8', '#d8c8a0'].map(p => h.mat('facadeParisFine', {}, p)), batches = fm.map(() => []); // the last three: the butte's descent
      const fb = ['#e8dcc0', '#d8c8b0'].map(p => h.mat('facadeParisFine', {}, p, 1)), low = fb.map(() => []); // the butte's low houses
      for (let i = 0; i < N; i += 2) {
        const s = S[i], t = TYPES[type[i]], ry = h.across(s), tun = h.zone(i, 14) > 0;
        for (const sd of [-1, 1]) {
          const [qx, qz] = edgePt(s, sd, W + 12), river = quay(qx, qz) || quay(qx, qz + 14);
          if (i % 8 === 0 && !tun && !river) { // a building every 16 m, set back from the street; not on the trench, nor on the river side, nor where another street passes
            const [x, z] = edgePt(s, sd, s.w + t.setback + 7.5), alley = type[i] === 'alley';
            if (g.dAt(x, z) > s.w + t.setback + 6.5 && (x - C[0]) ** 2 + (z - C[1]) ** 2 > (RT + 14) ** 2) { const H = t.H[0] + rnd() * (t.H[1] - t.H[0]), k3 = rnd() * 3 | 0, desc = i >= iD0 && i <= iD1;
              (i === iE && sd === sdE ? [] : alley ? low[k3 % 2] : batches[k3 + (desc ? 3 : 0)]).push([x, g.hAt(x, z) + H / 2 - 3, z, ry, 17, H + (desc ? k3 * 4 : 6), 14]); // (same draw as before: the rest of the scenery does not move; in the descent, heights that vary)
              if (type[i] !== 'riverbank' && al() < (i < h.T.sp[0] ? 0.3 : i < h.T.sp[1] ? 0.6 : 0.25) && !(i === iB && sd === sdB) && !(i === iE && sd === sdE)) { const [fx, fz] = edgePt(s, sd, s.w + t.setback - 1.05); shops.push([fx, s.y + 0.22, fz, ry - sd * 1.5708, t.setback]); } } // a ground-floor shop: a few everywhere, more in sector 2
          }
          if (i % 10 === 0 && !tun && type[i] !== 'riverbank') for (const off of river ? [2.4] : t.trees) { const [x, z] = edgePt(s, sd, s.w + off); if (g.dAt(x, z) > s.w + off - 1.5 && (x - C[0]) ** 2 + (z - C[1]) ** 2 > (RT + 4) ** 2) { trunks.push([x, s.y + 2.6, z]); crownList.push([x, s.y + 7.6, z, rnd() * 6, 1, 0.9, 1]); } } // plane trees: in rows along the main axes, along the river on the quay
          if (t.depot && !tun && !river && s.w < W + 0.3 && i > 30 && i < N - 34 && i % 4 === 0 && rnd() < (t.depot > 1 ? 0.8 : 0.55)) { const [x, z] = edgePt(s, sd, s.w + 1.7); if (outsidePlace(x, z)) autoList[rnd() * 4 | 0].push([x, s.y, z, ry + 1.5708]); } // voitures en stationnement
        }
        if (i % 10 === 0 && h.zone(i, 6) === 0) { const sd = (i / 10) & 1 ? 1 : -1, [x, z] = edgePt(s, sd, s.w + (t.depot ? 3.6 : 0.6)); if (outsidePlace(x, z)) { masts.push([x, s.y + 3.4, z]); lant.push([x, s.y + 7, z]); h.emis(i, x, s.y + 6.5, z, 0xffd05a, 15, 1.6); } } // street lamps, lit until dawn
      }
      // the ring of buildings closing the square, façades turned toward the arch; an avenue leaves where the track passes
      for (let a = 0; a < 6.2832; a += 17.5 / RT) { const x = C[0] + Math.cos(a) * (RT + 7), z = C[1] + Math.sin(a) * (RT + 7), [d, s] = nearest(x, z);
        if (d > s.w + 10) { const H = 26 + al() * 3; batches[al() * 3 | 0].push([x, g.hAt(x, z) + H / 2 - 3, z, Math.atan2(-Math.sin(a), Math.cos(a)), 14, H + 6, 17.4]); } }
      for (let k = 0; k < 420; k++) { // and the city behind: rooftops as far as the eye can see
        const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z);
        if (d > 52 && !quay(x, z - 30) && (x - C[0]) ** 2 + (z - C[1]) ** 2 > (RT + 22) ** 2) { const H = 18 + rnd() * 8; batches[k % 3].push([x, g.hAt(x, z) + H / 2 - 3, z, (rnd() * 4 | 0) * 1.5708 + rnd() * 0.3, 16 + rnd() * 14, H + 6, 14 + rnd() * 10]); }
      }
      // the Île de la Cité, on the left at the tunnel exit: stone quays, the cathedral (apse turned toward the arrival, south flank and its rose window facing the road, towers at the end),
      // a planted square behind the apse, buildings at the western tip
      const IX = 30, IZ = 318;
      h.pose('island', { quay: h.mat('stone'), ground: slab }, h.scene, [IX, 0, IZ], 380, 96, WY - 1, IY);
      h.pose('cathedral', { intoWall: h.mat('wallGothic'), stone: h.mat('stone', {}, '#e0d4bc'), lead: h.mat('lead'), pink: h.mat('pink'), dark: h.mat('matGray') }, h.scene, [IX + 10, IY, IZ]);
      for (let x = 120; x <= 200; x += 16) for (let z = IZ - 30; z <= IZ + 30; z += 15) { trunks.push([x, IY + 2.6, z]); crownList.push([x, IY + 7.6, z, al() * 6, 1, 0.9, 1]); }
      for (let x = -150; x <= 110; x += 18) for (const z of [IZ - 43, IZ + 43]) { trunks.push([x, IY + 2.6, z]); crownList.push([x, IY + 7.6, z, al() * 6, 1, 0.9, 1]); }
      for (const x of [-140, -112]) for (const z of [IZ - 26, IZ + 26]) { const H = 20 + al() * 4; batches[al() * 3 | 0].push([x, IY + H / 2 - 3, z, 0, 26, H + 6, 22]); }
      // the opposite bank: stone quay, plane trees, three rows of buildings facing the river
      for (const [x0, x1, z0] of [[300, 1450, 400], [-260, 300, 425]]) {
        h.pose('shore', { quay: h.mat('stone'), ground: slab }, h.scene, [(x0 + x1) / 2, 0, (z0 + 990) / 2], x1 - x0, 990 - z0, WY - 1, IY);
        for (let x = x0 + 10; x < x1 - 8; x += 17.5) { for (let r = 0; r < 3; r++) if (!r || al() < 0.8) { const H = 20 + al() * 6; batches[al() * 3 | 0].push([x + (r ? al() * 4 - 2 : 0), IY + H / 2 - 3, z0 + 16 + r * 24, 0, 17, H + 6, 14]); }
          if ((x - x0) % 35 < 17.5) { trunks.push([x, IY + 2.6, z0 + 5]); crownList.push([x, IY + 7.6, z0 + 5, al() * 6, 1, 0.9, 1]); } }
      }
      const cube = h.geo('blk');
      batches.forEach((l, i) => inst(h, cube, fm[i], l)); low.forEach((l, i) => inst(h, cube, fb[i], l));
      // the attics: stone cornice, zinc mansard with dormers, brick chimney stacks (the top of the façades shows no more windows)
      const cornice = [], attic = [], stumps = [];
      for (const [x, y, z, ry, sx, sy, sz] of [...batches.flat(), ...low.flat()]) {
        const top = y + sy / 2, c = Math.cos(ry), sn = Math.sin(ry); cornice.push([x, top + 0.15, z, ry, sx + 0.5, 0.3, sz + 0.5]); attic.push([x, top + 1.6, z, ry, sx - 1.6, 3.2, sz - 1.6]);
        for (const [ox, oz] of [[sx * 0.3, sz * 0.2], [-sx * 0.3, -sz * 0.2]]) stumps.push([x + c * ox + sn * oz, top + 4.1, z - sn * ox + c * oz, ry]);
      }
      // one geometry each: the stone sets its texture's density to the box
      inst(h, h.geo('blk'), h.mat('stone'), cornice); inst(h, h.geo('blk'), h.mat('zinc'), attic); inst(h, h.geo('chimney'), h.mat('brick'), stumps);
      inst(h, h.geo('blk'), h.mat('matGray'), attic.map(([x, y, z, ry, sx, sy, sz]) => [x, y + sy / 2 + 0.05, z, ry, sx - 1.4, 0.1, sz - 1.4])); // the terrasson, flat, above the mansard
      inst(h, h.geo('streetlamp'), h.mat('castiron'), masts); inst(h, h.geo('lanternStreet'), h.mat('lantern', GLOW), lant);
      inst(h, h.geo('trunk'), h.mat('trunk'), trunks); inst(h, h.geo('canopy'), h.mat('foliage'), crownList);
      const parked = autoList.flatMap((l, i) => l.map(p => [...p, 1, 1, 1, [0x2a3a5a, 0x8a8a90, 0x5a1a1a, 0xd8d4c8][i]]));
      insts(h, 'carParked', { carBody: h.mat('lacquer'), pane: h.mat('paneDark'), chassis: h.mat('matGray'), wheelPart: h.mat('wheelPart'), tire: h.mat('tire'), lightRed: h.mat('lightRed', GLOW), lightWhite: h.mat('lampObj', GLOW) }, parked, { tintMat: 'carBody' });
      // the shops: sign fascia (invented names); striped awning on the cafés, bakeries, cheese shops, florists; terrace in front of the cafés
      // where the pavement allows; green cross as a flag on the pharmacy; two newspaper kiosks on the avenue
      const GENRES = [['cafe', 'CAFE DE LA BUTTE', '#1e3a2a', '#e8c860'], ['bakery', 'AU FOURNIL DORE', '#5a2a1a', '#f0d890'], ['bookshop', 'LIBRAIRIE LA PAGE BLANCHE', '#1a2a4a', '#e8e0c8'],
        ['cafe', 'LE CHAT QUI GUETTE', '#6a1a1a', '#f0d070'], ['pharmacy', 'PHARMACIE DES LILAS', '#e8ece8', '#1a7a4a'], ['florist', 'LES JARDINS DE ROSE', '#2a4a3a', '#f4f0e0'],
        ['cheeseShop', 'CREMERIE FROMAGERIE', '#e0d4a8', '#4a3a1a'], ['mode', 'MAISON VERLAINE', '#1a1a1e', '#d8d0c0'], ['butcher', 'BOUCHERIE DU MARCHE', '#7a1a1a', '#f4f0e0'],
        ['cafe', 'BAR DES AMANDIERS', '#2a2a4a', '#f0c860'], ['bookshop', 'LE TEMPS RETROUVE', '#5a1a2a', '#f0d890'], ['mode', 'ATELIER CORALIE', '#4a5a5a', '#f4f0e0']];
      const byGenre = GENRES.map(() => []), awnings = [], terraces = [], crossSign = [], STORE = { cafe: 0xb02a2a, bakery: 0x2a5a8a, cheeseShop: 0x3a6a3a, florist: 0x2a6a4a };
      shops.forEach(([x, y, z, ry, setback], k) => { const gi = (k * 7 + (al() * 2 | 0)) % GENRES.length, [genre] = GENRES[gi]; byGenre[gi].push([x, y, z, ry]);
        if (STORE[genre]) awnings.push([x, y, z, ry, 1, 1, 1, STORE[genre]]); if (genre === 'cafe' && setback >= 3) terraces.push([x, y, z, ry]); if (genre === 'pharmacy') crossSign.push([x, y, z, ry]); });
      const geoShopfront = h.geo('shopfront'); byGenre.forEach((l, gi) => l.length && inst(h, geoShopfront, h.mat('shopfront', {}, ...GENRES[gi]), l));
      insts(h, 'store', { cloth: h.mat('clothStriped', { side: THREE.DoubleSide }), iron: h.mat('castiron') }, awnings, { tintMat: 'cloth' });
      insts(h, 'terrace', { platform: h.mat('chalk'), iron: h.mat('castiron'), cane: h.mat('noise', {}, '#b8925a', ['#8a6a3a', '#d0b080']) }, terraces);
      insts(h, 'crossPharmacy', { iron: h.mat('castiron'), crossSign: h.mat('paint', { emis: 1, c: 0x2aff7a }) }, crossSign);
      const kq = [...kqPlace]; for (const [i, sd] of [[h.T.sp[1] - 60, -1], [h.T.sp[1] - 24, 1]]) { const s = S[i], [x, z] = edgePt(s, sd, s.w + 4.6); kq.push([x, s.y + 0.22, z, h.across(s) - sd * 1.5708]); } // between the parked cars and the row of trees
      insts(h, 'bench', { vert: h.mat('paint', { c: 0x1e4a36 }), iron: h.mat('castiron') }, benches);
      insts(h, 'columnMorris', { payload: h.mat('posters'), roofM: h.mat('paint', { c: 0x1e4a36 }), iron: h.mat('castiron') }, morris);
      insts(h, 'mouthMetro', { iron: h.mat('paint', { c: 0x1e4a36 }), hole: h.mat('paint', { c: 0x121216 }), signPanel: h.mat('written', GLOW, 64, 22, '#a01818', '#f4e8c0', 'METRO', 14), lampObj: h.mat('lantern', GLOW) }, subways);
      insts(h, 'kiosk', { payload: h.mat('kiosk'), roofM: h.mat('paint', { c: 0x1e4a36 }), counterTop: h.mat('castiron') }, kq);
      // quayside roads: mooring rings, barges along the quay; the stone bridge over the tunnel entrance crosses the Seine
      insts(h, 'annulus', { iron: h.mat('castiron') }, rings);
      const pen = [1432, 1480, 1848, 1898].map(i => { const s = S[i], [x, z] = edgePt(s, -1, s.w + 3.5); return [x, WY, z, h.across(s) + 1.5708, 1, 1, 1, [0x2a2a30, 0x2a4a6a, 0x5a2020, 0x2a4a32][i % 4]]; }); // alongside the quay wall
      insts(h, 'barge', { hull: h.mat('steelMat'), rubStrip: h.mat('paint', { c: 0xe8e0d0 }), bridge: h.mat('noise', {}, '#7a5a3a', ['#6a4a2a', '#8a6a4a']), roof: h.mat('roof'), roofM: h.mat('matGray'),
        greens: h.mat('foliage') }, pen, { tintMat: 'hull' });
      { const s = S[h.T.t0], gp = marker(h, s); h.pose('bridge', { stone: h.mat('stone'), deck: h.mat('cobbles'), iron: h.mat('castiron'), lampObj: h.mat('lantern', GLOW) }, gp, [0, 0, 0], 170, WY - s.y);
        // the tunnel head under the bridge: a pierced stone wall, relieving arch with voussoirs, tunnel plaque (like the portals of the quayside roads)
        h.pose('headTunnelParis', { stone: h.mat('stone'), keystone: h.mat('stone', {}, '#a89878'), plate: h.mat('written', {}, 128, 16, '#1d2f6f', '#f4f0e0', 'SOUTERRAIN DES QUAIS', 13) }, gp, [0, 0, 0], WY - s.y); }
      // the white dome at the top of the butte
      const chalk = h.mat('chalk'), yb = g.hAt(935, -598);
      h.pose('basilica', { chalk }, h.scene, [935, yb, -598]);
      h.pose('dome', chalk, h.scene, [935, yb + 24, -596], 13, 8, 5).scale.y = 1.5;
      for (const sx of [-15, 15]) h.pose('dome', chalk, h.scene, [935 + sx, yb + 24, -588], 5, 6, 4).scale.y = 1.5;
      // ---- the butte's landmarks (descent, points 19 to 23)
      // the butte's staircase climbing between two buildings, a lamp post at the bottom and one at the top
      { const s = S[iE], ox = -s.tz * sdE, oz = s.tx * sdE, [x, z] = edgePt(s, sdE, s.w + 3.7), rv = [], ln = [];
        h.pose('stairsKnoll', { stairStep: h.mat('stone', {}, '#b8b0a0'), lowwall: h.mat('stone'), iron: h.mat('castiron') }, h.scene, [x, s.y + 0.22, z]).forEach(m => m.rotation.y = Math.atan2(-ox, -oz));
        for (const [k, dy] of [[-0.6, 0], [8.4, 3.74]]) { const px = x + ox * k + s.tx * 2.3, pz = z + oz * k + s.tz * 2.3; rv.push([px, s.y + 0.22 + dy + 3.2, pz]); ln.push([px, s.y + 0.22 + dy + 6.8, pz]); h.emis(iE, px, s.y + dy + 6.5, pz, 0xffd05a, 15, 1.6); }
        inst(h, h.geo('streetlamp'), h.mat('castiron'), rv); inst(h, h.geo('lanternStreet'), h.mat('lantern', GLOW), ln); }
      // the bakery raising its shutter as one arrives: frontage, awning, the light of the bakehouse
      const curtain = (() => { const s = S[iB], [fx, fz] = edgePt(s, sdB, s.w + TYPES.street.setback - 1.05), ry = h.across(s) - sdB * 1.5708, P = [fx, s.y + 0.22, fz, ry], sn = Math.sin(ry), cs = Math.cos(ry);
        inst(h, h.geo('shopfront'), h.mat('shopfront', {}, ...GENRES[1]), [P]); insts(h, 'store', { cloth: h.mat('clothStriped', { side: THREE.DoubleSide }), iron: h.mat('castiron') }, [[...P, 1, 1, 1, 0x2a5a8a]], { tintMat: 'cloth' });
        const tin = h.mat('tin'), r = new THREE.Mesh(h.clothe(h.geo('curtain'), tin), tin); r.position.set(fx + sn * 0.55, s.y + 0.22 + 3.5, fz + cs * 0.55); r.rotation.y = ry; h.scene.add(r);
        h.emis(iB, fx + sn * 1.5, s.y + 2.5, fz + cs * 1.5, 0xffc070, 10, 1.4); return r; })();
      // the newspaper delivery boy on a bicycle coming down the butte on the right pavement
      const bike = new THREE.Group(); h.scene.add(bike); let uV = iD0;
      h.pose('courier', { tire: h.mat('tire'), rackFrame: h.mat('paint', { c: 0x1a4a8a }), holdTime: h.mat('paint', { c: 0x3a3a44 }), skin: h.mat('paint', { c: 0xd8a888 }), newspapers: h.mat('paint', { c: 0xe8e0c8 }) }, bike, [0, 0, 0]);
      // ---- the quay: pigeons perched on the roadway that fly off as one arrives, before the underpass (points 26-27) and at its exit (30-31)
      const flights = [pt(h, 26) + 55, h.T.t1 + 30, h.T.t1 + 75].map(i0 => ({ i0, en: 0, t: 0, p: Array.from({ length: 12 }, () => { const s = S[i0 + (al() * 8 | 0)], d = al() * 10 - 5;
        return { x: s.x - s.tz * d, y: s.y, z: s.z + s.tx * d, r: al() * 6.28, vx: al() * 6 - 3, vy: 3 + al() * 3, vz: al() * 6 - 3 }; }) }));
      const pigeons = insts(h, 'pigeon', { feather: h.mat('paint', { c: 0x7a7c84 }), headEl: h.mat('paint', { c: 0x4a5058 }) }, flights.flatMap(v => v.p.map(q => [q.x, q.y, q.z, q.r])));
      const dp = new THREE.Object3D(), putPigeon = (k, x, y, z, r, e) => { dp.position.set(x, y, z); dp.rotation.set(0, r, 0); dp.scale.setScalar(e); dp.updateMatrix(); for (const m of pigeons) m.setMatrixAt(k, dp.matrix); };
      // ---- the delivery truck parked double-parked at the underpass exit (sim.js obstacle: T.cam), on one side at the odd towers, on the other at the even towers; hazard lights
      const cam = h.T.cam, sCam = S[cam.i], gc = new THREE.Group(), distress = h.mat('paint', { emis: 1, c: 0xffa020 }); h.scene.add(gc); gc.position.y = sCam.y; gc.rotation.y = Math.atan2(-sCam.tz, sCam.tx);
      h.pose('truckDelivery', { carBody: h.mat('written', {}, 128, 64, '#e8ecf0', '#1d2f6f', 'LES HALLES', 20), chassis: h.mat('matGray'), cabin: h.mat('lacquer', { c: 0xe8e4dc }), pane: h.mat('paneDark'), tire: h.mat('tire'),
        orange: distress, redTone: h.mat('lightRed', GLOW) }, gc, [0, 0, 0]);
      return (dt, now, car) => {
        if (!car) return;
        const [cx, cz] = edgePt(sCam, Math.floor(car.dist / N) & 1 ? 1 : -1, cam.d); gc.position.x = cx; gc.position.z = cz; // same rule as lorry() in sim.js, for the followed car
        distress.color.setHex(now % 800 < 400 ? 0xffa020 : 0x3a2008);
        const a = (iB - car.idx + N) % N; curtain.scale.y = a < 80 ? Math.max(0.06, a / 80) : a > N - 200 ? 0.06 : 1; // it rises on approach, stays raised after the pass
        uV += dt * 3; if (uV > iD1) uV = iD0; const s = S[uV | 0], [vx, vz] = edgePt(s, 1, s.w + 1.6); bike.position.set(vx, s.y + 0.22, vz); bike.rotation.y = Math.atan2(-s.tz, s.tx);
        let k = 0, moves = 0; for (const v of flights) { const e = (v.i0 - car.idx + N) % N;
          if (!v.en && e < 22 && e > 0) { v.en = 1; v.t = 0; } else if (v.en && e > 300 && e < N - 300) { v.en = 0; v.p.forEach((q, j) => putPigeon(k + j, q.x, q.y, q.z, q.r, 1)); moves = 1; } // reset for the next lap
          if (v.en && v.t < 5) { v.t += dt; const t = v.t; v.p.forEach((q, j) => putPigeon(k + j, q.x + q.vx * t, q.y + q.vy * t + 0.3 * t * t, q.z + q.vz * t, Math.atan2(-q.vz, q.vx), t < 4.5 ? 1 : 0)); moves = 1; }
          k += v.p.length; }
        if (moves) for (const m of pigeons) m.instanceMatrix.needsUpdate = true;
      };
    },
  });
})();
