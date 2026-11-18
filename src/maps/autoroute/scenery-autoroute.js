// Scenery placement for "autoroute" (Sunken Highway, layout 6, V2 scenery): a city on a street grid of 110 m, of which the route is what is left open.
// This file: ground, water, the straight edges of the streets (kerbs, motorway parapets, metro walls) inside which the track winds, motorway deck and piers, metro shell, the far city,
// the shared materials (MAT) and the placers. The city itself is scenery-autoroute-ville.js; what each zone adds is scenery-autoroute-<zone>.js; shapes and textures are shapes-autoroute-*.js and textures-autoroute.js.
// The zone files still say WHAT stands WHERE with the names of the blockout (put, spot, bar: 'BUS RENVERSE', 'BARRAGE MILITAIRE'…); real() turns each name into its real scenery, inside the block's footprint.
// See docs/methods/NEW-MAP.md, phase 3, and docs/proposals/sunken-highway/AMBIANCE-V2.html.
(function () {
  const { near, block, edgePt, terrain, inst, weld } = PLACERS;
  // FLOOD: the stretches where the lane lies under 10 cm of water, each from one plan point to another; the `surf` zones of the map (src/data/maps.js) put the wet grip at the same points
  const FLOOD = [[[330, -41], [330, -69]], [[440, -151], [440, -179]], [[399, -220], [371, -220]], [[-4, 223], [-110, 217]]];
  const ZONES = ['ville', 'boulevard', 'quartier', 'pont', 'trou', 'metro'], LAP = 2553, G = 110; // LAP: plan length, the unit of the chainages (PK); G: grid pitch, node (i, j) is at (i * G, j * G), j grows to the south
  // PK of the layout's joints: end of the boulevard, foot of the slip road, merge onto the motorway, foot of the collapsed span, ledge of the hole, heap of rubble up to the platform, mouth of the corridor, top of the stairs
  const PK = { bd: 601, rampe: 1221, fusion: 1329, sol: 1750, bord: 1818, gravats: 2178, couloir: 2314, rue: 2389 };
  // the city slopes down to the river in the east: dry at 2.5 m west of the motorway, 0.7 m beyond column 3, where the water (0) stands in the streets
  const cityY = x => { const t = Math.min(1, Math.max(0, (x - 180) / 140)); return 2.5 - 1.8 * t * t * (3 - 2 * t); };
  // half-widths from a street's axis to its facades: the boulevard is row 0, the motorway runs above column 2 (its slip road on the east side)
  const colL = i => i === 2 ? 20 : 11, colR = i => i === 2 ? 38 : 11, row = j => j === 0 ? 17 : 11;
  const HH = (v, k) => { const x = Math.sin(v * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }; // 0..1, fixed by v and k: variety without touching the shared randomness

  Object.assign(SCENERY, {
    autoroute(h) {
      const { THREE, S, N, T } = h, IX = new Map(S.map((s, i) => [s, i])), pkS = s => IX.get(s) / N * LAP, idx = pk => Math.round(pk / LAP * N) % N, at = pk => S[idx(pk)];
      // MAT: the shared materials of the map, one draw pass each: every real piece goes into the group `kit`, merged per material at the end. Keys are the zone names of the autoroute shapes
      const DS = { side: THREE.DoubleSide }, FLOODED = { ...DS, transparent: true, opacity: 0.42, depthWrite: false, rep: [2, 1], c: 0x8aa89a, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 }, body = c => h.mat('carrosserieAutoroute', { c }), MAT = {
        asphalt: h.mat('asphalteAutoroute', DS), deck: h.mat('asphalteAutoroute', DS, '#55585c'), pave: h.mat('trottoirAutoroute', DS), grass: h.mat('herbeAutoroute'), water: h.mat('eauAutoroute', { rep: [112, 250] }),
        brick: h.mat('briqueAutoroute'), brick2: h.mat('briqueAutoroute', {}, '#6e4a40', 1), brick3: h.mat('briqueAutoroute', {}, '#9a6a4a', 2), stone: h.mat('bureauAutoroute'), stone2: h.mat('bureauAutoroute', {}, '#8f8c82', 1), stone3: h.mat('bureauAutoroute', {}, '#b0a078', 2),
        glass: h.mat('verreAutoroute'), glass2: h.mat('verreAutoroute', {}, 1), tin: h.mat('toleAutoroute'), tin2: h.mat('toleAutoroute', {}, '#7a6a58', 1), shop: h.mat('vitrineAutoroute'), shop2: h.mat('vitrineAutoroute', {}, '#5a5048', 1), hole: h.mat('interieurAutoroute'),
        tunnel: h.mat('tunnelAutoroute', { ...DS, c: 0xb4b4ac }), mur: h.mat('tunMurAutoroute', { ...DS, c: 0xb0b0a6 }), rib: h.mat('tunVouteAutoroute', { ...DS, emis: 1, c: 0x7c7c76 }),
        flood: h.mat('eauAutoroute', FLOODED), // (the offset: the lane's asphalt is itself laid with one, and would show through at a distance)
        moss: h.mat('mousseAutoroute', { ...DS, alphaTest: 0.5, c: 0xa09a84, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }), ballast: h.mat('ballastAutoroute', DS), plaque: h.mat('plaqueAutoroute', { emis: 1 }, 'HOTEL DE VILLE'), stripe: body(0x2f7a70), far: h.mat('bureauAutoroute', { c: 0xd0b0a0 }, '#8a8078'),
        concrete: h.mat('concretePart', DS), dark: h.mat('concreteDark', DS), vault: h.mat('tunVouteAutoroute', { ...DS, emis: 1, c: 0xa4a49c }), yellow: body(0xb8a050), steel: h.mat('matGray'), rubble: h.mat('gravatsAutoroute', { c: 0xa8a298 }), tile: h.mat('carrelageAutoroute', { ...DS, c: 0xa0a69c }),
        ivy: h.mat('lierreAutoroute'), reed: h.mat('lierreAutoroute', {}, '#7a9a50'), leaf: h.mat('feuillageAutoroute'), gold: h.mat('feuillageAutoroute', {}, '#b89a40'), bark: h.mat('trunk'),
        body: h.mat('carrosserieAutoroute'), rust: body(0x8a4a2a), olive: body(0x5a6240), canvas: body(0x7a7450), pane: h.mat('paneDark'), lamp: h.mat('lampObj', { emis: 1 }), sign: h.mat('panneauAutoroute', {}, 'CENTRE VILLE') };
      MAT.tyre = MAT.dark; const BODIES = [MAT.rust, body(0xb8b4a8), body(0x5a7a78), body(0x7a3a34), body(0xb8a050)], kit = new THREE.Group(); h.scene.add(kit);
      const nT = T.t1 - T.t0, metro = new Set(S.slice(T.t0, T.t1 + 1)), el = s => { const p = pkS(s); return p > PK.rampe && p < PK.sol && s.y > cityY(s.x) + 0.6; };
      // street(s): the straight street the sample is on, as [axis, half-width, centre]: 'x' = the street runs along x (its edges are lines of constant z), 'z' along z; null elsewhere.
      // Boulevard kerbs at z = ±13; motorway parapets at x = 220 ± 16; metro walls at z = 220 ± 9, and from the heap of rubble z = 214 ± 15 (the tracks and the north platform)
      const street = s => { const p = pkS(s); return p < PK.bd - 2 || p > LAP - 34 ? ['x', 13, 0] : p > PK.fusion - 60 && p < PK.sol - 12 ? ['z', 16, 220] : p > PK.bord + 2 && p < PK.couloir - 14 ? p < PK.gravats ? ['x', 9, 220] : ['x', 15, 214] : null; };
      // edge(s, side): distance from the axis to the visible edge of the street on that side. The physics walls follow the track at ±s.w; the street keeps straight edges,
      // and what lies between wall and edge is filled by real things (barriers, rubble, wrecks). Elsewhere (street corners, slip road, corridor, stairs) the edge is 1 m outside the wall
      const edge = (s, sd) => { const st = street(s); if (!st || (st[0] === 'z' && pkS(s) < PK.fusion && sd < 0)) return s.w + 1; // before the merge the slip road has its own east edge
        const [ax, hw, c] = st, o = ax === 'x' ? (hw - sd * (s.z - c) * Math.sign(s.tx)) / Math.abs(s.tx) : (hw + sd * (s.x - c) * Math.sign(s.tz)) / Math.abs(s.tz); return Math.min(40, Math.max(s.w + 0.5, o)); };
      const H = s => pkS(s) < PK.couloir - 14 ? 9 : 4.5; // metro: height under the ceiling, tunnel and station then passenger corridor
      // ground: the road lies on it, except on the motorway (the city stays under it) and in the metro (the city passes over it); the hole and the stairwell are open to the sky
      const ground = s => metro.has(s) || el(s) ? cityY(s.x) : s.y;
      // relief(x, z, y) = metres to remove: in the low district the streets not driven sink under the water, and the river bed lies beyond column 5; the metro is dug out
      const relief = (x, z, y) => { const s = S[near(h, x, z)], lat = (x - s.x) * -s.tz + (z - s.z) * s.tx, d = Math.hypot(s.x - x, s.z - z) - s.w, p = pkS(s);
        // the metro, the hole before it (from 16 m before the ledge: the slope of the ground lies under the street, not across the fall) and the stairwell are dug out 12 m wider than their walls (the terrain has a vertex every 10 m: its slope must lie outside the walls);
        // the street above the tunnel is put back as a lid (below): no sheet of ground crosses the lane at either mouth
        if (x > -524 && x < -193 && z > 185 && z < 243) return Math.max(0, y + 11); // the station hall and the tunnel beyond it, whatever the nearest piece of lane
        if (metro.has(s) || (p > PK.bord - 16 && p < PK.rue)) return Math.abs(lat) < edge(s, lat > 0 ? 1 : -1) + 12 ? Math.max(0, y - (p > PK.bord - 16 && p < PK.gravats ? -11 : s.y - 2.5)) : 0;
        return x > 570 ? 3 : x > 285 + 18 * Math.sin(z * 0.045) + 8 * Math.sin(z * 0.13 + 1) ? Math.min(0.9, Math.max(0, d - 6) * 0.5) : 0; }; // (the waterline wanders: no straight shore across the streets)
      // the ground of the whole city is street asphalt; grass where the park was (the block north of the boulevard between columns -2 and -1)
      const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, park = (x, z) => ss((x + 215) / 8) * ss((-115 - x) / 8) * ss((z + 99) / 8) * ss((-11 - z) / 8);
      const g = terrain(h, { stepSec: 10, margin: 400, ground, hollow: relief, mat: h.mat('asphalteAutoroute'), layerSet: [{ tex: ['herbeAutoroute'], weight: park }] });
      const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 2000), MAT.water); water.rotation.x = -Math.PI / 2; water.position.set(725, 0, 0); h.scene.add(water); // east of x = 275 only: the hole and the stairwell go below 0
      // the street put back over the metro: three lids at street level, over the tunnel, over the station and the tunnel beyond it, over the passenger corridor
      for (const [x, z, wx, dz] of [[-57, 220, 296, 46], [-358.5, 214, 335, 62], [-330, 181, 42, 30]]) h.pose('boxMesh', MAT.asphalt, kit, [x, 1.81, z], wx, 0.5, dz);
      // and the pavements either side of the two open shafts, between their walls and the facades
      for (const sd of [-1, 1]) { h.pose('boxMesh', MAT.pave, kit, [123, 2.0, 220 + sd * 10.6], 64, 0.5, 3.2); h.pose('boxMesh', MAT.pave, kit, [-330 + sd * 9.6, 2.0, 157], 5.2, 0.5, 80); }
      // the far city: the terrain stops 400 m from the road. A ground slab under the horizon, then a ring of towers in the haze, lower across the river
      // (in four pieces around the metro, its shaft and its stairwell, which lie lower than the slab: in one piece it was a black ceiling 6 m above the tracks, and the car fell through it)
      for (const [x0, x1, z0, z1] of [[-2600, -540, -2600, 2600], [180, 2600, -2600, 2600], [-540, 180, -2600, 100], [-540, 180, 255, 2600]]) h.pose('boxMesh', MAT.dark, kit, [(x0 + x1) / 2, -2.2, (z0 + z1) / 2], x1 - x0, 1, z1 - z0);
      for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2, r = 860 + 420 * HH(i, 1), x = Math.cos(a) * r * 1.25, z = Math.sin(a) * r, e = x > 700, w = 50 + 60 * HH(i, 2), ht = e ? 25 + 40 * HH(i, 3) : 70 + 150 * HH(i, 3) * HH(i, 4);
        h.pose('boxMesh', MAT.far, kit, [x, ht / 2 - 2, z], w, ht, 50 + 40 * HH(i, 5)); }
      // one street asphalt over the engine's textured roadway (no markings: this is a street, not a track), in the open and in the metro
      { const o = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }; h.ribbon(T.t1, N - nT, s => -s.w, 0, s => s.w, 0, h.mat('asphalteAutoroute', { ...DS, ...o, rep: [3, 1] }), 4); const iG = idx(PK.gravats); h.ribbon(T.t0, iG - T.t0, s => -s.w, 0, s => s.w, 0, h.mat('ballastAutoroute', { ...DS, ...o, rep: [1.5, 1] }), 4); h.ribbon(iG, T.t1 - iG, s => -s.w, 0, s => s.w, 0, h.mat('trottoirAutoroute', { ...DS, ...o, rep: [1.5, 1], c: 0xb0b0a8 }), 4); } // in the metro: the track bed, then the paving of the platform, the corridor and the stairs
      // open air: asphalt from the walls to the edges, then a kerb and a pavement 4 m wide where the road is a street
      const street0 = [[0, PK.rampe], [PK.sol + 14, PK.bord - 2], [PK.rue + 4, LAP]];
      for (const sd of [-1, 1]) { h.ribbon(T.t1, N - nT, s => sd * s.w, 0, s => sd * edge(s, sd), 0, MAT.asphalt, 4);
        for (const [a, b] of street0) { const i = idx(a), c = idx(b - 1) - i; h.ribbon(i, c, s => sd * edge(s, sd), 0.25, s => sd * (edge(s, sd) + 4), 0.25, h.mat('trottoirAutoroute', { ...DS, rep: [0.5, 1] }), 4); h.ribbon(i, c, s => sd * edge(s, sd), 0, s => sd * edge(s, sd), 0.25, MAT.concrete, 8); } }
      // motorway: a 2 m deck from edge to edge, a 1 m parapet, a pier every 40 m except where a street passes under
      const i0 = S.findIndex(el), n = S.length - [...S].reverse().findIndex(el) - i0, laid = S.filter(s => !el(s) && !metro.has(s)), piers = [];
      h.ribbon(i0, n, s => -edge(s, -1), -2, s => edge(s, 1), -2, MAT.concrete, 8); for (const sd of [-1, 1]) { h.ribbon(i0, n, s => sd * edge(s, sd), 1, s => sd * edge(s, sd), -2, MAT.concrete, 8); h.ribbon(i0, n, s => sd * (edge(s, sd) - 0.5), 1, s => sd * edge(s, sd), 1, MAT.concrete, 8); }
      for (let i = i0 + 10; i < i0 + n; i += 20) { const s = S[i], l = edge(s, -1), r = edge(s, 1), [x, z] = edgePt(s, 1, (r - l) / 2), y0 = g.hAt(x, z) - 1, w = l + r - 4;
        if (s.y - 2 - y0 > 1 && !laid.some(t => Math.abs((t.x - x) * s.tx + (t.z - z) * s.tz) < t.w + 3 && Math.abs((t.x - x) * -s.tz + (t.z - z) * s.tx) < w / 2 + t.w)) piers.push([x, (s.y - 2 + y0) / 2, z, h.across(s), w / 5, s.y - 2 - y0, 0.6]); }
      inst(h, h.geo('pierViaduct'), MAT.concrete, piers);
      // no plant grows on the motorway: moss only, as a texture laid on the deck along both parapets and both sides of the reservation, and on top of the parapets (X = the line's x on the map: the deck is straight along z)
      { const a = idx(PK.fusion - 40), c = idx(PK.sol - 14) - a, X = x => s => (s.x - x) / s.tz;
        for (const [x0, x1, y] of [[204.5, 208, 0.03], [232, 235.5, 0.03], [216.2, 219, 0.03], [221, 223.8, 0.03], [204, 204.5, 1.02], [235.5, 236, 1.02]]) h.ribbon(a, c, X(x0), y, X(x1), y, MAT.moss, 8); }
      // metro (th.tun.without 'walls': the engine only lays the floor and the lights): track bed, tiled walls and concrete ceiling from edge to edge
      const up = s => cityY(s.x) + 0.4 - s.y, pit = s => -8.5 - s.y; // pit: beside the platform the track bed lies 1.2 m lower than the lane
      // the metro is straight along x: its vault and what closes it are cross-sections drawn from one x to another, in the map's frame.
      // mesh: a piece of the kit from its points; ext(m, x0, x1, P, tile): the section P = [[z, y], …] from x0 to x1, the texture every `tile` metres across it, or once over the whole section (tile = 0);
      // gable(m, x, P, Q): the wall across the tunnel at x, between two sections of as many points (Q a number: up to that altitude); arc: a vault springing 5 m above the track bed
      const mesh = (m, pos, uv, ix) => { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); q.setIndex(ix); q.computeVertexNormals(); kit.add(new THREE.Mesh(q, m)); };
      const quads = (n, ix = []) => { for (let a = 0; a < 2 * n - 2; a += 2) ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); return ix; }, dist = (P, i) => i ? Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]) : 0;
      const ext = (m, x0, x1, P, tile = 8) => { const pos = [], uv = [], tot = P.reduce((a, _, i) => a + dist(P, i), 0); let d = 0; P.forEach((p, i) => { d += dist(P, i); const u = tile ? d / tile : d / tot; pos.push(x0, p[1], p[0], x1, p[1], p[0]); uv.push(u, 0, u, Math.abs(x1 - x0) / 8); }); mesh(m, pos, uv, quads(P.length)); };
      const gable = (m, x, P, Q) => { const pos = [], uv = []; P.forEach((p, i) => { const q = Q.length ? Q[i] : [p[0], Q]; pos.push(x, p[1], p[0], x, q[1], q[0]); uv.push(p[0] / 8, p[1] / 8, q[0] / 8, q[1] / 8); }); mesh(m, pos, uv, quads(P.length)); };
      const arc = (zc, hw, rise = 4) => Array.from({ length: 13 }, (_, i) => [zc - hw * Math.cos(i * Math.PI / 12), -3.5 + rise * Math.sin(i * Math.PI / 12)]);
      // a vaulted ceiling over the running tunnel (18 m) and over the station and the tunnel beyond it (30 m), 9 m at the crown, a rib every 12 m; the passenger corridor keeps a flat ceiling. Walls and vault in close tones
      { const xM = S[T.t0].x, TUN = arc(220, 9), STA = arc(214, 15), iK = S.findIndex((s, i) => i > idx(PK.couloir - 14) && s.z < 199);
        ext(MAT.vault, xM, -205, TUN); ext(MAT.vault, -205, -510, STA); gable(MAT.tunnel, xM, TUN, 2.05); gable(MAT.rib, -205, STA, 1.5);
        for (let x = 84; x > -505; x -= 12) { const [zc, hw] = x > -205 ? [220, 9] : [214, 15], A = arc(zc, hw), B = arc(zc, hw - 0.35, 3.65); ext(MAT.rib, x - 0.45, x + 0.45, B); gable(MAT.rib, x - 0.45, A, B); gable(MAT.rib, x + 0.45, A, B); }
        h.ribbon(iK, T.t1 - iK, s => -edge(s, -1), H, s => edge(s, 1), H, MAT.vault, 8); }
      for (const sd of [-1, 1]) { { const iA = idx(PK.couloir - 14), nA = (sd < 0 ? iA : T.t1) - T.t0; h.ribbon(T.t0, nA, s => sd * s.w, sd < 0 ? pit : 0, s => sd * edge(s, sd), sd < 0 ? pit : 0, MAT.ballast, 4); if (sd < 0) h.ribbon(T.t0, nA, s => -s.w, 0, s => -s.w, pit, MAT.concrete, 8); }
        { const iG = idx(PK.gravats); h.ribbon(T.t0, iG - T.t0, s => sd * edge(s, sd), 0, s => sd * edge(s, sd), H, MAT.tunnel, 4); const iA = idx(PK.couloir - 14), iC = idx(PK.couloir - 5); // on the left of the turn into the corridor there is no wall: the station and its tunnel go on west (built in the metro zone file), the lane does not
          for (const [a, b] of sd < 0 ? [[iG, iA], [iC, T.t1]] : [[iG, T.t1]]) h.ribbon(a, b - a, s => sd * edge(s, sd), s => Math.min(H(s), 5), s => sd * edge(s, sd), sd < 0 && a === iG ? pit : 0, MAT.mur, 8); } // dark concrete in the running tunnel, tiles in the station and the corridor (tunMurAutoroute reads from the top of the wall to its foot; the wall stops where the vault springs)
        // the two shafts open to the sky, walled up to the street: the hole the car falls into (from the ledge to the tunnel) and the stairwell
        const iB = idx(PK.bord + 4); h.ribbon(iB, T.t0 - iB, s => sd * edge(s, sd), 0, s => sd * edge(s, sd), up, MAT.tunnel, 4); h.ribbon(iB, T.t0 - iB, s => sd * s.w, 0, s => sd * edge(s, sd), 0, MAT.ballast, 4); h.ribbon(T.t1, idx(PK.rue) - T.t1, s => sd * (s.w + 1), 0, s => sd * (s.w + 1), up, MAT.tile, 8); }
      // set(shape, x, z, { ry, y, a, skin, rz }): a catalogue shape at a plan position, on the ground unless y is given, turned by ry (rz: laid on its side), with the shape settings a. Returns its group
      const set = (shape, x, z, { ry = 0, y, a = [], skin = MAT, rz = 0 } = {}) => { const grp = new THREE.Group(); grp.position.set(x, y ?? g.hAt(x, z), z); grp.rotation.set(0, ry, rz); kit.add(grp); h.pose(shape, skin, grp, [0, 0, 0], ...a); return grp; };
      // tree(x, z, y, ht, r, v): a big tree, ht tall with a crown of radius r: a trunk and three faceted masses (instanced: catalogue shapes trunk and canopy), gold for one in three
      const TREES = { bark: [], leaf: [], gold: [], ivy: [] }, bush = (x, z, y, w, ht, d, v = 0) => TREES.ivy.push([x, y + ht * 0.3, z, HH(v, 6) * 6, w / 6.2, ht / 4.6, d / 6.2]), tree = (x, z, y, ht, r, v) => { const L = TREES[v % 3 ? 'leaf' : 'gold'], k = r / 3.4; TREES.bark.push([x, y + ht * 0.3, z, HH(v, 1) * 3, 1.8, ht * 0.6 / 5.2, 1.8]);
        L.push([x, y + ht * 0.72, z, HH(v, 2) * 6, k, k * 0.8, k], [x + r * 0.5, y + ht * 0.88, z - r * 0.3, HH(v, 3) * 6, k * 0.7], [x - r * 0.6, y + ht * 0.62, z + r * 0.4, HH(v, 4) * 6, k * 0.65]); };
      const slab = (m, x, y, z, wx, ht, dz) => h.pose('boxMesh', MAT[m], kit, [x, y + ht / 2, z], wx, ht, dz); // a plain box of a shared material, base at y
      // real(label, w, ht, d, x, y, z, ry): the real scenery of a blockout block, inside its footprint (w on its local X, d on its local Z, base at y). False when the name is unknown
      const real = (label, w, ht, d, x, y, z, ry = 0) => { const v = Math.round(x * 7 + z * 13), long = w >= d, L = Math.max(w, d), l = Math.min(w, d), ryL = ry + (long ? Math.PI / 2 : 0), is = r => r.test(label);
        const off = (t, u = 0) => { const dx = long ? t : u, dz = long ? u : t, c = Math.cos(ry), s = Math.sin(ry); return [x + dx * c + dz * s, z - dx * s + dz * c]; }; // a point t along the block's long side, u across it
        const along = (shape, t, o = {}, u = 0) => set(shape, ...off(t, u), { y, ry: ryL, ...o }), veh = (k, i) => ({ a: [k], skin: { ...MAT, body: BODIES[Math.abs(v + i) % BODIES.length] } });
        const cars = stack => { const m = Math.max(2, Math.floor(L / 4.8)); for (let i = 0; i < m; i++) { const t = -L / 2 + (i + 0.5) * L / m, k = Math.floor(HH(v, i) * 4); along('voitureAutoroute', t, { ...veh(k, i), ry: ryL + (HH(v, i + 9) - 0.5) * 1.6 }, (HH(v, i + 5) - 0.5) * Math.max(0, l - 4));
          if (stack && i % 3 === 1) along('voitureAutoroute', t + 1.5, { ...veh(0, i + 3), y: y + 1.5, ry: ryL + 1.1, rz: 0.35 }); } };
        const barriers = (u = 0) => { for (let t = -L / 2 + 1.9; t < L / 2; t += 3.9) along('barriereAutoroute', t, { ry: ryL + (HH(v, t) - 0.5) * 0.2 }, u); };
        if (is(/IMMEUBLE EFFONDRE/)) set('ruineAutoroute', x, z, { y, ry, a: [w, Math.max(14, ht * 1.7), d, v & 1 ? 'brick' : 'stone', v] });
        else if (is(/EBOULEMENT|EBOULIS|GRAVATS|QUAI EFFONDRE|RUE BARREE/)) set('eboulisAutoroute', x, z, { y, ry, a: [w, Math.max(2, ht), d, v] });
        else if (is(/RUE AFFAISSEE/)) { set('eboulisAutoroute', x, z, { y: y - 0.6, ry, a: [w, 1.6, d, v] }); for (const t of [-0.3, 0.1, 0.34]) along('dalleAutoroute', t * L, { a: [L * 0.22, l * 0.9, (HH(v, t) - 0.5) * 0.7] }); }
        else if (is(/BARRAGE MILITAIRE/)) { barriers(-l * 0.3); along('camionAutoroute', -L * 0.12, { a: [2], ry: ryL + 0.15 }, l * 0.15); along('sacsAutoroute', L * 0.28, { a: [Math.min(10, L * 0.3)] }, l * 0.1); }
        else if (is(/CONVOI MILITAIRE/)) { along('camionAutoroute', -L * 0.32, { a: [2] }); along('blindeAutoroute', -L * 0.05, { ry: ryL + 0.3 }); along('camionAutoroute', L * 0.24, { a: [2], ry: ryL - 0.1 }); barriers(-l * 0.4); }
        else if (is(/CAMION MILITAIRE/)) along('camionAutoroute', 0, { a: [2] });
        else if (is(/GUERITE/)) set('gueriteAutoroute', x, z, { y, ry });
        else if (is(/MIRADOR/)) set('miradorAutoroute', x, z, { y, ry });
        else if (is(/TENTE/)) along('tenteAutoroute', 0);
        else if (is(/BUS RENVERSE/)) { along('busAutoroute', 0, { ...veh(0, 4), y: y + 1.28, rz: Math.PI / 2 }); if (L > 16) cars(0); }
        else if (is(/BUS/)) along('busAutoroute', 0, veh(0, 4));
        else if (is(/BARRICADE/)) { cars(0); barriers(-l * 0.35); }
        else if (is(/EPAVES|CARAMBOLAGE|TAXIS/)) cars(is(/EMPILEES/));
        else if (is(/CAMION CITERNE/)) along('camionAutoroute', 0, { ...veh(1, 1), ry: ryL + 0.12 });
        else if (is(/CAMION RENVERSE/)) along('camionAutoroute', 0, { ...veh(0, 2), y: y + 1.25, rz: Math.PI / 2 });
        else if (is(/CAMION/)) along('camionAutoroute', 0, veh(0, 2));
        else if (is(/ARBRE TOMBE/)) set('arbreTombeAutoroute', x, z, { y, ry: ry + (long ? 0 : Math.PI / 2), a: [L * 0.9] });
        else if (is(/ARBRE/)) tree(x, z, y, ht + 3, 5.5, v);
        else if (is(/BARGE/)) along('bargeAutoroute', 0, { y: -1.2, ry: ryL + 0.25, skin: { ...MAT, body: MAT.rust } });
        else if (is(/ECHAFAUDAGE/)) { set('echafaudageAutoroute', x, z, { y, ry, a: [w, ht + 2, d, v] }); set('eboulisAutoroute', x, z, { y, ry, a: [w * 0.6, 1.5, d, v] }); }
        else if (is(/TRAVEE EFFONDREE|DALLE CASSEE/)) { set('dalleAutoroute', x, z, { y, ry, a: [w, d, 0.3] }); if (w > 12) set('eboulisAutoroute', x, z, { y, ry, a: [w, 2, d, v] }); }
        else if (is(/ENTREE AUTOROUTE|PORTIQUE/)) set('portiqueAutoroute', x, z, { y, ry, a: [(w - 4) / 2], skin: { ...MAT, sign: h.mat('panneauAutoroute', {}, 'AUTOROUTE  SUD') } });
        else if (is(/AUTOROUTE/)) { slab('concrete', x, y, z, w, 2, d); for (const s of [-1, 1]) slab('concrete', x + s * (w / 2 - 0.25), y + 2, z, 0.5, 1, d); slab('concrete', x, y + 2, z, 2, 1.1, d); // a length of the motorway the route does not take: deck, parapets, reservation, piers, a broken end
          for (let t = -d / 2 + 20; t < d / 2; t += 40) for (const s of [-1, 1]) { const y0 = g.hAt(x, z + t) - 1; slab('concrete', x + s * (w / 2 - 5), y0, z + t, 3.5, y - y0, 3); } // (two columns per bent: a full-width pier reads as a wall across the street under it)
          if (z > 0) set('dalleAutoroute', x, z - d / 2 - 5, { y: y - 3, ry: Math.PI, a: [w * 0.8, 12, 0.5] }); }
        else if (is(/RAME/)) along('rameAutoroute', 0, { a: [Math.max(1, Math.round(L / 18))], skin: { ...MAT, body: BODIES[1] } });
        else if (is(/QUAI/)) { slab('concrete', x, y, z, w, ht, d); slab('yellow', x, y + ht - 0.04, z + d / 2 - 0.5, w, 0.06, 0.4); for (let t = -w / 2 + 6; t < w / 2; t += 12) if (Math.abs(x + t + 326) > 16) slab('tile', x + t, y + ht, z - d / 2 + 1, 0.8, 7.7, 0.8); } // (none in front of the corridor mouth) // the platform, its edge strip toward the tracks, a row of columns at the back
        else if (is(/SORTIE METRO/)) set('ediculeAutoroute', x, z, { y: cityY(x) + 0.25, ry, a: [w, d, 4.6] }); // (on the street: the ground under it is the stairwell)
        else if (is(/ANCIEN PARC/)) { for (let i = 0; i < 16; i++) { const tx = x + ((i % 4) - 1.5) * w / 4 + (HH(i, 1) - 0.5) * 12, tz = z + (Math.floor(i / 4) - 1.5) * d / 4 + (HH(i, 2) - 0.5) * 12; tree(tx, tz, g.hAt(tx, tz), 15 + 9 * HH(i, 3), 6 + 3 * HH(i, 4), i); }
          for (let i = 0; i < 10; i++) bush(x + (HH(i, 5) - 0.5) * w, z + (HH(i, 6) - 0.5) * d, y + 0.5, 6 + 5 * HH(i, 7), 2.8, 6 + 5 * HH(i, 8), i); }
        else if (is(/ROSELIERE/)) set('roseauxAutoroute', x, z, { y: -0.6, ry: ry + (long ? Math.PI / 2 : 0), a: [l, L, v] });
        else if (is(/TERRE-PLEIN/)) slab('concrete', x, y, z, w, ht, d);
        else return false; return true; };
      // blk: every block of the blockout arrives here; a name real() does not know stays a labelled box and is reported
      const blk = (label, c, w, ht, d, x, y, z, ry) => real(label, w, ht, d, x, y, z, ry) || (console.warn('autoroute: still a block', label), block(h, label, c, w, ht, d, x, y, z, ry));
      // self-check: the motorway crosses the boulevard and the streets run close to each other; a block set from one stretch can land on another. (ux, uz): the block's local X
      const onRoad = (label, x, z, ux, uz, w, d, y0, top) => { if (S.some(t => Math.abs((t.x - x) * ux + (t.z - z) * uz) < w / 2 + t.w && Math.abs((t.x - x) * -uz + (t.z - z) * ux) < d / 2 + t.w && y0 < t.y + 5 && top > t.y - 2.5)) console.warn('autoroute: block on the road', label, Math.round(x), Math.round(z)); };
      // put(label, colour, pk, side, off, w, ht, d, y): at chainage pk (m), side -1 = left / 1 = right, its near face `off` metres from the wall; w across the road, d along it.
      // Set on the lowest ground under it, or base at altitude y when given (the road's altitude: on the motorway or in the metro)
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = at(pk), [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z);
        const y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2))), top = ht + (y ?? y1);
        onRoad(label, x, z, -s.tz, s.tx, w, d, y0, top); return blk(label, c, w, top - y0, d, x, y0, z, h.across(s)); };
      // spot(label, colour, x, z, wx, ht, dz, y, under, ry): at map coordinates, wx along x and dz along z, on the ground or base at altitude y; under = 1: the road runs on top of it (no self-check); ry turns it
      const spot = (label, c, x, z, wx, ht, dz, y, under, ry = 0) => { const y0 = y ?? g.hAt(x, z) - 0.5; if (!under) onRoad(label, x, z, 1, 0, wx, dz, y0, y0 + ht); return blk(label, c, wx, ht, dz, x, y0, z, ry); };
      // (it starts half a metre behind the kerb line of the street driven: where the collision wall is, so that nothing open lies behind an invisible wall)
      // bar(i, j, arm, label, colour, ht): what blocks the arm ('N', 'S', 'E', 'W') of the crossroads (i, j) that the route does not take: across the whole street, at its mouth
      // (its local Z points away from the crossroads, down the closed street: a fallen building keeps its standing walls at the back)
      const bar = (i, j, arm, label, c, ht, dp = 8) => { const ns = arm === 'N' || arm === 'S', sg = arm === 'N' || arm === 'W' ? -1 : 1, wide = ns ? colL(i) + colR(i) : 2 * row(j);
        const x = ns ? i * G + (colR(i) - colL(i)) / 2 : i * G + sg * ((sg > 0 ? colR(i) : colL(i)) - 3.5 + dp / 2), z = ns ? j * G + sg * (row(j) - 3.5 + dp / 2) : j * G, y0 = (g.hAt(x, z) < cityY(x) - 2 ? cityY(x) - 0.5 : g.hAt(x, z)) - 0.5; // (street level where the ground has been dug for the metro)
        onRoad(label, x, z, 1, 0, ns ? wide : dp, ns ? dp : wide, y0, y0 + ht); return blk(label, c, wide, ht, dp, x, y0, z, ns ? (sg < 0 ? Math.PI : 0) : sg * Math.PI / 2); };
      // gantry(pk, label): a sign gantry across the road, 7 m clear
      const gantry = (pk, label) => { const s = at(pk); return real(label, 2 * s.w + 4, 9, 1, s.x, s.y, s.z, h.across(s)); };
      const over = { ...DS, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, rep: [1.5, 1] }; // laid over the lane's own asphalt or paving
      // flooded stretches: the sheet of water lies 10 cm over the lane, from kerb to kerb in the streets and from wall to wall in the metro, and sinks under the road at both ends (no step of water across the lane)
      for (const [a, b] of FLOOD) { const i0 = near(h, ...a) - 8, n = near(h, ...b) + 8 - i0, m = metro.has(S[i0]), lvl = s => -0.04 + 0.14 * Math.min(1, (IX.get(s) - i0) / 6, (i0 + n - IX.get(s)) / 6);
        h.ribbon(i0, n, s => -(m ? edge(s, -1) : s.w + 1), lvl, s => m ? edge(s, 1) : s.w + 1, lvl, m ? h.mat('eauAutoroute', { ...FLOODED, c: 0x35504a, opacity: 0.5 }) : MAT.flood, 8).renderOrder = 2; } // (darker in the metro: its lamps light the sheet from close by)
      // the foot of the fallen span: the lane crosses an open crossroads there. A line of concrete barriers stands on each of its walls, from the end of the reservation and of the queue to the kerbs of row 2;
      // the lane keeps the concrete of the fallen deck down to the street, and the ground behind the barriers is the rubble of the span
      { const i0 = idx(PK.sol - 90), iB = S.findIndex(s => pkS(s) > PK.sol - 60 && s.z > 191), i1 = idx(PK.sol + 14), rub = h.mat('gravatsAutoroute', { ...DS, c: 0x8f8a80, rep: [2, 1] });
        h.ribbon(i0, i1 - i0, s => -s.w, 0, s => s.w, 0, h.mat('dalleSolAutoroute', over), 8);
        for (const sd of [-1, 1]) { h.ribbon(iB, i1 - iB, s => sd * s.w, 0.04, s => sd * (s.w + (sd < 0 ? 16 : 5)), 0.04, rub, 8);
          for (let i = iB; i < i1; i += 2) { const s = S[i], [x, z] = edgePt(s, sd, s.w + 0.5); set('barriereAutoroute', x, z, { y: s.y, ry: h.across(s) + (HH(i, sd) - 0.5) * 0.12 }); } } }
      // the way up to the platform: the end of the platform has collapsed onto the tracks. The lane climbs its tipped slab; north of the lane the platform still stands at its height, broken off along the lane;
      // rubble lies against both edges of the slab. Everywhere else the platform keeps its straight edge over the tracks
      { const iG = idx(PK.gravats), iR = S.findIndex((s, i) => i > iG && s.y > -7.32), top = s => -7.3 - s.y;
        h.ribbon(iG, iR - iG, s => -s.w, 0, s => s.w, 0, h.mat('dalleSolAutoroute', { ...over, c: 0xb4b4aa }), 8);
        h.ribbon(iG, iR - iG, s => s.w, top, s => edge(s, 1), top, h.mat('trottoirAutoroute', { ...DS, rep: [1.5, 1], c: 0xb0b0a8 }), 4); h.ribbon(iG, iR - iG, s => s.w, 0, s => s.w, top, MAT.concrete, 8);
        for (let i = iG + 1; i < iR; i += 2) { const s = S[i], up = top(s), dn = s.y + 8.5;
          if (up > 0.25 && edge(s, 1) - s.w > 1.5) { const [x, z] = edgePt(s, 1, s.w + 1.2); set('eboulisAutoroute', x, z, { y: s.y - 0.1, ry: HH(i, 1) * 3, a: [2.2, up + 0.5, 2.6, i] }); }
          if (dn > 0.25) { const [x, z] = edgePt(s, -1, s.w + 1.4); set('eboulisAutoroute', x, z, { y: -8.5, ry: HH(i, 2) * 3, a: [2.6, dn + 0.4, 3, i + 7] }); } } }
      for (const z of ZONES) AUTOROUTE[z]({ h, g, put, spot, bar, gantry, ext, at, street, edge, metro, cityY, G, colL, colR, row, MAT, BODIES, kit, set, slab, real, tree, bush, HH, idx, pkS, PK });
      inst(h, h.geo('trunk'), MAT.bark, TREES.bark); inst(h, h.geo('canopy'), MAT.leaf, TREES.leaf); inst(h, h.geo('canopy'), MAT.gold, TREES.gold); inst(h, h.geo('canopy'), MAT.ivy, TREES.ivy);
      weld(h, kit); // one mesh per material
    },
  });
})();
