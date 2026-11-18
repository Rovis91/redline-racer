// Scenery placement for "volcan" (Volcanic Island, fourth edition: a fishing village below, a scientific expedition on the volcano, and what links them): island, sea, far islands, the shared materials and placers, then each zone (scenery-volcan-<zone>.js).
// See docs/methods/NEW-MAP.md and docs/proposals/volcanic-island/AMBIANCE-V2.html. The island is relief-volcan.js (a height field of its own); shapes: shapes-volcan-<family>.js; textures: textures-volcan.js.
(function () {
  const { near, edgePt, terrain, weld } = PLACERS;
  const ZONES = ['port', 'village', 'fermes', 'falaises', 'cratere', 'descente', 'cote'], LAP = 6230; // LAP: plan length of the layout, the unit of its chainages (PK)
  const GAL = [[139, 149], [159, 171]];                                                   // the two galleries through the caldera wall, [point in, point out] of the layout: north (the engine tunnel, M.tun) and south-west (built by scenery-volcan-cratere.js: the engine has one tunnel per map)
  const TRENCH = 20, LID = 32;                                                            // a height field cannot overhang: along a gallery the ground is trenched TRENCH m each side of the axis, and a lid LID m each side, in the ground's own material, restores the slope over it
  const CUT = [11, 1.3], FILL = [10, 1.1];                                                // the road on the island: a rock cut rises from 11 m off the axis by 1.3 m per metre; an embankment falls from 10 m by 1.1 m per metre
  const LAKE = { x: -178, z: -915, r: 26, y: 136 };                                       // lava lake: a level pit west of the road on the caldera floor, a few metres below it

  Object.assign(SCENERY, {
    volcan(h) {
      const { THREE, S, N } = h, P = h.M.pts;
      // the loop runs anticlockwise: the island is on the left (side -1), the sea on the right (side 1)
      // The ground is the island of relief-volcan.js; the road is cut into it or carried on an embankment (CUT, FILL), the galleries are trenched (closed again by lid()), the lake has its pit.
      const { height: HT, ss, fbm, CONE } = RELIEF_VOLCAN, gal = GAL.map(l => l.map(k => near(h, P[k][0], P[k][1]))), inGal = i => gal.some(([a, b]) => i >= a && i <= b);
      const relief = (x, z, y) => { const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), H = HT(x, z), k = ss(LAKE.r + 14, LAKE.r, Math.hypot(x - LAKE.x, z - LAKE.z)); // k: 1 in the pit, 0 from 14 m outside it
        const t = inGal(i) ? (d < TRENCH ? Math.min(H, s.y - 0.5) : H) : Math.max(Math.min(H, y + Math.max(0, d - CUT[0]) * CUT[1]), y - Math.max(0, d - FILL[0]) * FILL[1]);
        return y - (t + (LAKE.y - t) * k); };
      // ground, in layers over bare ash and lava gravel: grass on the low ground away from the cone (the farmland, the village, the shore); grey-green moss on the gentle slopes of the highland and of the cone's foot; rock where it is steep; snow, white, on the highest crags of the rim only
      const rc = (x, z) => Math.hypot(x - CONE.x, z - CONE.z), LAYERS = [
        { tex: ['mousseVolcan', '#41633a'], weight: (x, z, y, p) => (1 - ss(0.12, 0.26, p)) * (1 - ss(44, 70, y)) * ss(2.5, 6, y) * ss(470, 600, rc(x, z) + 260 * (fbm(x / 90, z / 90) - 0.5)), noise: 0.1 },
        { tex: ['mousseVolcan'], weight: (x, z, y, p) => (1 - ss(0.16, 0.34, p)) * (1 - ss(215, 260, y)) * ss(40, 66, y) * ss(215, 300, rc(x, z)), noise: 0.12 },
        { tex: ['rocheVolcan', '#3a3c42', 0.4], slope: [0.26, 0.46] }, // weak marks: on a steep face the terrain stretches them into streaks
        { tex: ['neigeVolcan'], weight: (x, z, y, p) => ss(296, 318, y) * (1 - ss(0.5, 0.75, p)), noise: 0.03 }];
      const g = terrain(h, { stepSec: 8, margin: 440, hollow: relief, mat: h.mat('solVolcan'), layerSet: LAYERS });
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), h.mat('merVolcan', { rep: [250, 250] })); sea.rotation.x = -Math.PI / 2; sea.position.set(-100, 0, -800); h.scene.add(sea);
      // MAT: the shared materials of the map, one draw pass each for the whole map: every piece of scenery goes into the group `kit`, merged per material at the end. Keys are the zone names of the volcan assemblies.
      const DS = { side: THREE.DoubleSide }, tint = c => h.mat('metalPale', { c }), paint = c => h.mat('bardageVolcan', {}, c), flat = c => h.mat('paint', { c }), MAT = {
        rock: h.mat('rocheVolcan', {}, '#2e3034'), cliff: h.mat('basalteVolcan', {}, '#4a4d54'), crust: h.mat('rocheVolcan', {}, '#1c1c1e', 0.5), scoria: h.mat('scorieVolcan'), stone: h.mat('pierreVolcan'),
        snow: h.mat('neigeVolcan'), far: h.mat('rocheVolcan', {}, '#5d6f80', 0.4), farSnow: h.mat('neigeVolcan', {}, '#dfe8ee'), gravel: h.mat('solVolcan', {}, '#8a8378'), sand: h.mat('solVolcan', {}, '#26262a'), hay: h.mat('mousseVolcan', {}, '#9ab842'),
        red: paint('#d2362b'), yellow: paint('#f2c230'), blue: paint('#2f7fc8'), green: paint('#3fa45a'), pink: paint('#ee6fa0'), orange: paint('#f0641e'), teal: paint('#2a9c9c'), white: paint('#f2eee4'),
        trim: tint(0xf2eee4), roof: h.mat('toitVolcan', DS), dark: h.mat('betonVolcan', {}, '#1e2226'), concrete: h.mat('betonVolcan'), paving: h.mat('betonVolcan', {}, '#77756e'), steel: tint(0x6a7078), glass: flat(0x1c2f52), fish: flat(0xd8cfae), flag: flat(0xf0641e),
        moss: h.mat('mousseVolcan'), wood: h.mat('boisVolcan'), greywood: h.mat('boisVolcan', {}, '#9a968c'), net: h.mat('boisVolcan', {}, '#c9b58a'), gallery: h.mat('tunMurVolcan', { c: 0x8a8a8a, ...DS }), vault: h.mat('tunVouteVolcan', { c: 0x8a8a8a, ...DS }), lava: h.mat('laveVolcan', { emis: 1 }), lamp: h.mat('lampObj', { emis: 1 }),
        steam: h.mat('paint', { c: 0xe6ecec, transparent: true, opacity: 0.55, depthWrite: false, ...DS }) };
      const kit = new THREE.Group(); h.scene.add(kit);
      const at = pk => S[Math.round(pk / LAP * N) % N], grp = (x, y, z, ry, s = 1) => { const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); kit.add(o); return o; };
      const skin = m => m ? MAT[m] : MAT; // an assembly takes the whole table; a simple shape takes one material, named by `m`
      // set(shape, x, z, { a, m, ry, y, dy, s }): a catalogue shape at a plan position (x east, z south), on the ground unless the altitude y is given, raised by dy, turned by ry, scaled by s; a = the shape's settings
      const set = (shape, x, z, { a = [], m, ry = 0, y, dy = 0, s = 1 } = {}) => { const o = grp(x, (y ?? g.hAt(x, z)) + dy, z, ry, s); h.pose(shape, skin(m), o, [0, 0, 0], ...a); return o; };
      // by(shape, pk, side, off, { a, m, turn, y, dy, s, road }): a shape beside the road at chainage pk (m), side -1 = left (island) / 1 = right (sea), its origin `off` metres behind the wall, its front (-Z) toward the road.
      // On the ground there (road level on the ledge), or at the altitude y, or at road level with `road`. pk may be a list: one shape at each, the index appended to the settings a when `seed` is set.
      // Sea side: keep within 9 m of the wall (the ledge), or on the quay or the DECK; beyond, the piece hangs on the cliff: a piece that ends up under the roadway is reported in the console.
      const by = (shape, pk, sd, off, o = {}) => { if (Array.isArray(pk)) return pk.map((p, i) => by(shape, p, sd, off, { ...o, a: [...(o.a || []), ...(o.seed ? [i] : [])] }));
        const { a = [], m, turn = 0, y, dy = 0, s = 1, road } = o, sm = at(pk), [x, z] = edgePt(sm, sd, sm.w + off), y1 = road ? sm.y : y ?? g.hAt(x, z);
        if (y == null && y1 < sm.y - 4 && off < 60) console.warn('volcan: piece under the roadway', shape, 'PK ' + pk, 'side ' + sd, Math.round(y1 - sm.y) + ' m');
        const q = grp(x, y1 + dy, z, h.across(sm) + sd * Math.PI / 2 + turn, s); h.pose(shape, skin(m), q, [0, 0, 0], ...a); return q; };
      // slab(material, pk, w, ht, d, y, off): a box set from the roadway: w across the road, d along it, its underside y metres above the road, its centre `off` metres to the right of the axis
      const slab = (m, pk, w, ht, d, y, off = 0) => { const sm = at(pk); return h.pose('boxMesh', MAT[m], grp(sm.x, sm.y, sm.z, h.across(sm)), [off, y + ht / 2, 0], w, ht, d); };
      // sheet(rows, material, ground): a surface through rows of points [x, y, z] (each row left to right, rows going forward: seen from above); with `ground`, the terrain's material and its layer weights. UVs in tiles of 8 m
      const sheet = (rows, m, ground) => { const n = rows[0].length, PO = [], UV = [], I = [], B = THREE.BufferAttribute, dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        rows.forEach((row, r) => row.forEach((p, k) => { PO.push(...p); UV.push(...(ground ? [p[0] / 10, p[2] / 10] : [k ? UV[UV.length - 2] + dist(p, row[k - 1]) / 8 : 0, r ? UV[UV.length - n * 2 + 1] + dist(p, rows[r - 1][k]) / 8 : 0]));
          if (r && k) { const a = (r - 1) * n + k - 1; I.push(a, a + 1, a + n, a + 1, a + n + 1, a + n); } }));
        const q = new THREE.BufferGeometry(); q.setAttribute('position', new B(new Float32Array(PO), 3)); q.setAttribute('uv', new B(new Float32Array(UV), 2)); q.setIndex(I); q.computeVertexNormals();
        if (ground) { const NO = q.attributes.normal.array, C = new Float32Array(PO.length / 3 * 4); // the same weights as terrain() of src/render/scenery.js
          for (let k = 0; k < PO.length / 3; k++) { const x = PO[k * 3], y = PO[k * 3 + 1], z = PO[k * 3 + 2], p = 1 - NO[k * 3 + 1], hs = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453 % 1;
            LAYERS.forEach((c, i) => { C[k * 4 + i] = Math.max(0, Math.min(1, (c.slope ? ss(c.slope[0], c.slope[1], p) : 1) * (c.weight ? c.weight(x, z, y, p) : 1) + (c.noise || 0) * hs)); }); }
          q.setAttribute('layer', new B(C, 4)); }
        const o = new THREE.Mesh(q, ground ? g.mesh.material : m); o.receiveShadow = true; h.scene.add(o); return o; };
      // strip(i0, i1, section, material, ground): a sheet along the road from sample i0 to i1, one row every 8 m; section(s) = [[o, y], …]: o metres to the right of the axis, y altitude
      const strip = (i0, i1, section, m, ground) => { const rows = []; for (let i = i0; ; i = Math.min(i + 4, i1)) { const s = S[i]; rows.push(section(s).map(([o, y]) => { const [x, z] = edgePt(s, 1, o); return [x, y, z]; })); if (i === i1) break; } return sheet(rows, m, ground); };
      // lid(i0, i1): the slope of the volcano restored over the trench of a gallery, its edges on the ground LID m each side; and at each mouth a headwall of basalt down to the road, open on the roadway (8.5 m each side, 9.5 m high)
      const rise = (s, o) => { const [x, z] = edgePt(s, 1, o); return [x, z, HT(x, z)]; };
      const top = (s, o) => { const [xa, za, a] = rise(s, -LID), [xb, zb, b] = rise(s, LID), t = (o + LID) / (2 * LID); return rise(s, o)[2] + (g.hAt(xa, za) - a) * (1 - t) + (g.hAt(xb, zb) - b) * t + 0.15; };
      const lid = (i0, i1) => { const O = [-LID, -TRENCH, -8.5, 0, 8.5, TRENCH, LID]; strip(i0, i1, s => O.map(o => [o, top(s, o)]), null, true);
        for (const [i, way] of [[i0, 1], [i1, -1]]) { const s = S[i], wall = (os, low) => { const rows = [os.map(o => { const [x, z] = edgePt(s, 1, o); return [x, top(s, o), z]; }), os.map(o => { const [x, z] = edgePt(s, 1, o); return [x, low, z]; })]; sheet(way > 0 ? rows.reverse() : rows, MAT.cliff); };
          wall([-LID, -TRENCH, -8.5], s.y - 3); wall([8.5, TRENCH, LID], s.y - 3); wall([-8.5, 0, 8.5], s.y + 9.5); } };
      gal.forEach(([a, b]) => lid(a, b));
      // frac(i, s): a fixed pseudo-random number per index (no call to the shared rnd); beside(pk, sd, off): the plan point off metres behind the wall; range(a, b, step): chainages
      const frac = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }, beside = (pk, sd, off) => edgePt(at(pk), sd, at(pk).w + off), range = (a, b, step) => Array.from({ length: Math.ceil((b - a) / step) }, (_, i) => a + i * step);
      const clear = pk => !inGal(Math.round(pk / LAP * N) % N); // not in a gallery
      // span(material, a, b, t): a bar t thick from point a to point b ([x, y, z]): wire, pipe
      const span = (m, a, b, t = 0.08, ht = t) => { const o = grp((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 0); o.lookAt(b[0], b[1], b[2]); h.pose('boxMesh', MAT[m], o, [0, 0, 0], t, ht, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); };
      // line(pks, sd, off, shape, a, bars): one post at each stop and the bars from head to head; a stop is a chainage (the post beside the road, side sd, off m behind the wall) or a plan point [x, z] (the line leaves the road and cuts across country).
      // bars = [[material, thickness, dz across the line, dy], …]: power line, pipe on its saddles, cable on its trestles
      const line = (pks, sd, off, shape, a, bars) => { let prev; pks.forEach((pk, n) => { const pt = p => Array.isArray(p) ? p : beside(p, sd, off), [ax, az] = pt(pks[Math.max(n - 1, 0)]), [bx, bz] = pt(pks[Math.min(n + 1, pks.length - 1)]);
        const q = Array.isArray(pk) ? set(shape, pk[0], pk[1], { a, ry: -Math.atan2(bz - az, bx - ax) }) : by(shape, pk, sd, off, { a }); q.updateMatrixWorld(true); const head = bars.map(([, , dz, dy]) => q.localToWorld(new THREE.Vector3(0, dy, dz)).toArray());
        if (prev) bars.forEach(([m, t], k) => span(m, prev[k], head[k], t)); prev = head; }); };
      // drape(material, path, lift): a tongue laid on the ground along path = [[x, z, half-width], …], a row every 14 m at most: its edges sunk in the ground, its middle raised by lift, both ends closed: snow field, glacier, old lava flow
      const drape = (m, path, lift = 1.5) => { const P2 = []; path.forEach((p, i) => { if (i) { const q = path[i - 1], n = Math.ceil(Math.hypot(p[0] - q[0], p[1] - q[1]) / 14); for (let k = 1; k < n; k++) P2.push(q.map((v, j) => v + (p[j] - v) * k / n)); } P2.push(p); });
        return sheet(P2.map(([x, z, w], i) => { const [ax, az] = P2[Math.max(0, i - 1)], [bx, bz] = P2[Math.min(P2.length - 1, i + 1)], l = Math.hypot(bx - ax, bz - az), end = i === 0 || i === P2.length - 1 ? 0 : 1;
          return [-1, -0.5, 0, 0.5, 1].map(t => { const px = x - (bz - az) / l * w * t, pz = z + (bx - ax) / l * w * t; return [px, g.hAt(px, pz) + (1 - t * t) * lift * end * (0.8 + 0.4 * frac(i, t)) - 0.4, pz]; }); }), MAT[m]); };
      // scatter(a, b, m, step): the verge between two chainages: a hummock of material m every `step` m, 2 to 14 m from the wall, and a black boulder at every other one on the opposite side; never in rows
      const scatter = (a, b, m = 'moss', step = 20) => { for (let pk = a, i = Math.round(a); pk < b; pk += step, i++) if (clear(pk) && clear(pk + 9)) { const sd = frac(i) < 0.5 ? -1 : 1;
        by('dalleVolcan', pk, sd, 2.5 + frac(i, 1) * (sd > 0 ? 6 : 12), { m, a: [1.6 + frac(i, 2) * 2.2, 0.4 + frac(i, 3) * 0.7, i % 9, 7] });
        if (i % 2) by('rocherVolcan', pk + 9, -sd, 3.5 + frac(i, 4) * (sd > 0 ? 12 : 5), { m: 'rock', a: [3 + frac(i, 5) * 4, 1.8 + frac(i, 6) * 3, 3 + frac(i, 7) * 4, i % 11] }); } };
      // wall(points, closed, m, ht): a dry-stone wall on the ground through plan points, in pieces of 7 m at most that follow the relief: the boundary of a pasture, a churchyard, a fold
      const wall = (pts, closed, m = 'stone', ht = 1.3, t = 0.8) => { for (let n = 0; n < pts.length - (closed ? 0 : 1); n++) { const [ax, az] = pts[n], [bx, bz] = pts[(n + 1) % pts.length], k = Math.ceil(Math.hypot(bx - ax, bz - az) / 7);
        for (let e = 0; e < k; e++) { const x0 = ax + (bx - ax) * e / k, z0 = az + (bz - az) * e / k, x1 = ax + (bx - ax) * (e + 1) / k, z1 = az + (bz - az) * (e + 1) / k; span(m, [x0, g.hAt(x0, z0) + ht / 2 - 0.3, z0], [x1, g.hAt(x1, z1) + ht / 2 - 0.3, z1], t, ht + 0.6); } } };
      // track(points, w): a gravel track 2 w wide laid on the ground through plan points: the way from the road to a farm, a lane of the village, the supply track of the expedition
      const track = (pts, w = 1.8, m = 'gravel') => drape(m, pts.map(([x, z]) => [x, z, w]), 0.25);
      // flock(x, z, n, R, seed): n sheep standing within R metres of a point, each turned its own way
      const flock = (x, z, n, R, seed = 0) => { for (let e = 0; e < n; e++) { const a = frac(e, seed) * 6.283, r = R * Math.sqrt(frac(e, seed + 5)); set('moutonVolcan', x + Math.cos(a) * r, z + Math.sin(a) * r, { ry: frac(e, seed + 9) * 6.283 }); } };
      // far islands on the horizon, dark with a snow cap (the terrain stops 440 m from the road; beyond it there is only the sea)
      for (const [x, z, R, H, ry, seed] of [[-3700, -2800, 900, 300, 0.5, 1], [3000, 500, 650, 200, 1.3, 4], [-2800, 2000, 500, 160, -0.4, 7], [1500, -3900, 750, 250, 0.1, 9]]) {
        set('ileVolcan', x, z, { y: 0, ry, m: 'far', a: [R, H, seed] }); set('ileVolcan', x, z, { y: H * 0.56, ry, m: 'farSnow', a: [R * 0.5, H * 0.46, seed] }); }
      for (const z of ZONES) VOLCAN[z]({ h, g, at, set, by, slab, strip, span, gal, frac, beside, range, line, drape, scatter, wall, track, flock, clear, MAT, LAKE, CONE, HT });
      weld(h, kit); // one mesh per material
    },
  });
})();
