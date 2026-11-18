// Scenery placement for "piliers" (Sky Pillars, V2: the complete static map). The relief is sculpted in the terrain (rock shoulders over the ravine, pillars, corniche walls, the mountain the tunnel goes through);
// the rock that is seen is placed on it: stacked towers over the terrain pillars, bedded cut faces along the banks, then the stone road works, the sea of clouds, the bridge deck,
// and the scenery of each zone (scenery-piliers-<zone>.js). Shapes: shapes-piliers-<family>.js; textures: textures-piliers.js. See docs/methods/NEW-MAP.md, phase 3, and docs/proposals/sky-pillars/AMBIANCE-V2.html.
(function () {
  const { near, edgePt, terrain, weld, inst } = PLACERS;
  const ZONES = ['foret', 'corniches', 'pont', 'plateaux', 'descente'], LAP = 4041.88, BRIDGE = [1813, 2063]; // LAP: plan length of the proposal, the unit of its chainages (PK); BRIDGE: the deck of the bible
  // the drivable shoulders A (south and west), B (north-west) and C (north-east) of the proposal's plan (construire.py), in metres [east, north]; everything else is the ravine, floor at 0
  const SHOULDERS = [[[40, 100], [380, 100], [640, 30], [790, 180], [910, 170], [1110, 50], [1300, 120], [1350, 340], [1210, 460], [1100, 380], [930, 310], [780, 320], [650, 400], [500, 430], [290, 330], [160, 430], [180, 580], [240, 640], [290, 790], [150, 840], [60, 720], [40, 440]],
    [[145, 610], [230, 850], [350, 890], [460, 820], [470, 640], [510, 570], [580, 590], [580, 780], [650, 940], [825, 960], [825, 880], [730, 840], [700, 650], [660, 480], [470, 460], [380, 540], [350, 710], [280, 700], [240, 590]],
    [[1025, 965], [1170, 970], [1290, 880], [1300, 670], [1280, 540], [1190, 490], [1170, 440], [1290, 390], [1290, 310], [1200, 310], [1080, 420], [1060, 550], [1170, 650], [1170, 800], [1110, 860], [1025, 875]]];
  // rock towers [summit altitude, footprint of the summit]: the plan's cores P1 to P5 and HERO, then the mountain over the tunnel (the plan's rock nose, widened into a spur of P4 so that the tunnel has a reason to exist).
  // Their walls fall 8 m per metre: a pillar 35 m from the axis makes the corniche wall by itself
  const TOWERS = [[310, [[200, 410], [260, 390], [310, 440], [290, 540], [220, 570], [195, 510]]], [345, [[225, 680], [250, 620], [310, 600], [355, 650], [350, 715], [290, 745]]],
    [370, [[520, 660], [500, 740], [520, 820], [565, 845], [590, 780], [575, 690]]], [305, [[1090, 690], [1120, 625], [1160, 690], [1150, 790], [1100, 820], [1070, 760]]],
    [280, [[1000, 210], [1040, 180], [1090, 230], [1100, 300], [1050, 330], [1010, 290]]], [410, [[790, 490], [840, 440], [880, 490], [870, 590], [830, 660], [780, 600]]],
    [300, [[1150, 686], [1320, 686], [1320, 612], [1150, 612]]]];
  const BANKS = [[150, 640, 1, 8], [960, 1190, -1, 10], [2860, 3680, 1, 26]]; // [pk from, pk to, side, height]: a bank or rock wall along the road (forest inner bank, corniche cut, buttress wall of the descent)
  const EDGES = [[640, 735, -1, 14], [760, 900, -1, 12], [2560, 2826, -1, 12], [2880, 3650, -1, 12]]; // [pk from, pk to, side, metres beyond the wall]: where the cliff edge comes close, so the void is seen from the car
  const clamp = v => Math.max(0, Math.min(1, v));
  // metres from (x, north) to polygon P, 0 inside
  const dist = (P, x, n) => { let d = 1e9, c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [ax, ay] = P[j], [bx, by] = P[i], dx = bx - ax, dy = by - ay;
    if ((by > n) !== (ay > n) && x < (ax - bx) * (n - by) / (ay - by) + bx) c = !c;
    const t = clamp(((x - ax) * dx + (n - ay) * dy) / (dx * dx + dy * dy)); d = Math.min(d, Math.hypot(x - ax - t * dx, n - ay - t * dy)); } return c ? 0 : d; };

  const nz = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random from two numbers: placement never calls the shared rnd

  Object.assign(SCENERY, {
    piliers(h) {
      const { THREE, S, N, T } = h, pk = i => i / N * LAP, idx = p => Math.round(p / LAP * N) % N, at = p => S[idx(p)], I = new Map(S.map((s, i) => [s, i])), PKV = new Map(); // PKV: chainage of the road point nearest to each terrain vertex
      // inside a shoulder the ground follows the road (terrain); outside it falls to the ravine floor, 5 m per metre. The road keeps 16 m of rock beyond its walls where it leaves the plan's polygons, except on the bridge.
      // Nothing is raised within 20 m of the walls: a rising face of the terrain starts at the last low vertex, one grid step earlier, and must stay behind the rock placed on it (cut faces 10 m from the wall, tower faces 6 m);
      // the tunnel corridor stays open under its mountain
      const relief = (x, z, y) => { const i = near(h, x, z), s = S[i], p = pk(i), d = Math.hypot(s.x - x, s.z - z), side = (s.x - x) * s.tz + (z - s.z) * s.tx > 0 ? 1 : -1, ramp = (a, b) => clamp(Math.min(p - a, b - p) / 60); PKV.set(Math.round(x) + ',' + Math.round(z), p);
        let drop = Math.min(...SHOULDERS.map(P => dist(P, x, -z)), p > BRIDGE[0] && p < BRIDGE[1] ? 1e9 : Math.max(0, d - s.w - 16)) * 5;
        for (const [a, b, sd, e] of EDGES) if (sd === side && p > a && p < b) drop = Math.max(drop, Math.max(0, d - s.w - e) * 6 * ramp(a, b));
        let top = y - Math.min(Math.max(0, y), drop);
        if (d > s.w + 20) { for (const [a, b, sd, H] of BANKS) if (sd === side && p > a && p < b) top += H * ramp(a, b) * clamp((d - s.w - 20) / (H / 2.5)) * clamp((118 - d) / 40);
          for (const [t, P] of TOWERS) top = Math.max(top, t - dist(P, x, -z) * 8); }
        return y - top; };
      // ground: moss and low plants; pale stone and moss on the high plateau; bare rock rubble along the ledges of zones 2 and 5; bedded sandstone wherever it is steep, salmon on the buttress of the descent
      const zone = (a, b) => (x, z) => { const p = PKV.get(Math.round(x) + ',' + Math.round(z)); return clamp(Math.min(p - a, b - p) / 80); }, ledge = [zone(700, 1760), zone(2800, 3690)];
      const g = terrain(h, { stepSec: 8, margin: 320, hollow: relief, mat: h.mat('solPiliers'),
        layerSet: [{ tex: ['solPiliers', '#7f8a66'], weight: zone(2181, 2826) }, { tex: ['gresPiliers', '#6f6e5c', 0.5, 0.6], weight: (x, z) => Math.max(ledge[0](x, z), ledge[1](x, z)), edgePt: [30, 70] },
          { tex: ['gresPiliers'], slope: [0.3, 0.55] }, { tex: ['gresPiliers', '#c9ad94'], slope: [0.3, 0.55], weight: zone(2826, 3700) }] });
      // on a steep face the texture follows the altitude instead of the plan: the beds stay horizontal and are not stretched down the cliffs
      { const G = g.mesh.geometry, P = G.attributes.position, Nn = G.attributes.normal, U = G.attributes.uv; for (let k = 0; k < P.count; k++) if (Nn.getY(k) < 0.72) U.setXY(k, (P.getX(k) + P.getZ(k)) * 0.07, P.getY(k) / 10); }
      const DS = { side: THREE.DoubleSide };
      // MAT: the shared materials of the map, one draw pass each for the whole map: every real piece of scenery goes into the group `kit`, merged per material at the end. Keys are also the zone names of the piliers assemblies
      const VC = { vertexColors: true, ...DS }; // the rock shapes carry a colour per face (shapes-piliers-roche.js)
      const MAT = { rock: h.mat('gresPiliers', VC, '#c9c1a6'), warm: h.mat('gresPiliers', VC, '#e6cfba', 0.7), far: h.mat('gresPiliers', VC, '#a9ac9c', 0.7, 0.3), cut: h.mat('gresPiliers', DS, '#9b9a7e', 1, 1, 1), cutWarm: h.mat('gresPiliers', DS, '#c2a48c', 0.7, 1, 1), rubble: h.mat('gresPiliers', DS, '#6f6e5c', 0.5, 0.6),
        stone: h.mat('pierrePiliers'), wall: h.mat('pierrePiliers', DS, 1), leaf: h.mat('feuillagePiliers', DS), pine: h.mat('feuillagePiliers', DS, '#3c554a'), farLeaf: h.mat('feuillagePiliers', DS, '#58755e'), deep: h.mat('feuillagePiliers', DS, '#35593f'), pale: h.mat('feuillagePiliers', DS, '#7fa860'), gold: h.mat('feuillagePiliers', DS, '#84894a'), bark: h.mat('ecorcePiliers'),
        rock0: h.mat('gresPiliers', VC, '#c9c1a6', 1, 1, 0, 3), rock1: h.mat('gresPiliers', VC, '#d2c4a0', 1, 1, 0, 1), rock2: h.mat('gresPiliers', VC, '#bcc0a6', 1, 0.6, 0, 2),
        steel: h.mat('acierPiliers', DS), rail: h.mat('lattice', { alphaTest: 0.5, ...DS }, '#24404c'), wood: h.mat('laquePiliers'), tile: h.mat('tuilePiliers', DS), water: h.mat('eauPiliers', { smooth: 1 }), fall: h.mat('eauPiliers', { smooth: 1, ...DS }, '#eef6f4'), dark: h.mat('tunnelPiliers', { c: 0x2a2c28 }) };
      const ROCKS = [MAT.rock0, MAT.rock1, MAT.rock2]; // three drawings and tints of the same sandstone, dealt among towers and needles
      const clouds = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), h.mat('nuagePiliers', { rep: [47, 47] })); clouds.rotation.x = -Math.PI / 2; clouds.position.set(650, 80, -500); h.scene.add(clouds); // the sea of clouds, 70 m under the lowest road
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide): the roadway is laid again at the real width, as on givre
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, ...DS }, ...h.TH.road), 32);
      // the bridge: a steel box girder 3 m deep under the roadway, an open steel railing; the towers, cables and anchor blocks are in zone 3
      const b0 = idx(BRIDGE[0]), b1 = idx(BRIDGE[1]), girder = s => s.w + 0.4;
      h.ribbon(b0, b1 - b0, s => -girder(s), -3, girder, -3, MAT.steel, 4); for (const sd of [-1, 1]) { h.ribbon(b0, b1 - b0, s => sd * girder(s), 0.2, s => sd * girder(s), -3, MAT.steel, 4); h.guardM(sd, b0, b1 - b0, s => sd * s.w, 1.2, s => sd * s.w, 0, MAT.rail); }
      // stone parapets everywhere else in the open (th.wallH 0: the engine draws no guardrail): the face the car touches, a coping 0.6 m wide, the outer face
      for (const sd of [-1, 1]) for (const [a, n] of [[T.t1, (b0 - T.t1 + N) % N], [b1, T.t0 - b1]]) { const out = s => sd * (s.w + 0.6);
        h.guardM(sd, a, n, s => sd * s.w, 0.9, s => sd * s.w, -7.1, MAT.wall); h.ribbon(a, n, s => sd * s.w, 0.9, out, 0.9, MAT.wall, 64); h.ribbon(a, n, out, 0.9, out, -7.1, MAT.wall); }
      // masonry retaining walls where the cliff edge comes close (EDGES): a bench of rubble out to the edge, then 8 m of dressed stone down the face; seen from the other side of the ravine
      const span = (a, b) => [idx(a), idx(b) - idx(a)], here = s => pk(I.get(s));
      for (const [a, b, sd, e] of EDGES) { const o = s => sd * (s.w + e + 3), r = s => clamp(Math.min(here(s) - a, b - here(s)) / 60) - 1; // r: sinks the wall into the ground where the edge fades out
        h.ribbon(...span(a, b), s => sd * (s.w + 0.6), 0.25, o, s => 0.25 + r(s) * 9, MAT.rubble, 8); h.ribbon(...span(a, b), o, s => 0.25 + r(s) * 9, o, s => -7.75 + r(s) * 9, MAT.wall); }
      // cut faces along the banks (BANKS): beds 5 m high, each set back from the one below, their line broken every 10 to 22 m; the terrain bank is behind them
      BANKS.forEach(([a, b, sd, H], q) => { const m = q === 2 ? MAT.cutWarm : MAT.cut, nb = Math.ceil(H / 5), up = s => H * clamp(Math.min(here(s) - a, b - here(s)) / 60);
        const off = k => s => sd * (s.w + 9.5 + k * 1.4 + 3.6 * nz((I.get(s) + k * 3) / (5 + 6 * nz(k, a)) | 0, k + a)), y = k => s => k ? up(s) * k / nb : -1;
        for (let k = 0; k < nb; k++) { h.ribbon(...span(a, b), off(k), y(k + 1), off(k), y(k), m); h.ribbon(...span(a, b), off(k), y(k + 1), k < nb - 1 ? off(k + 1) : s => off(k)(s) + sd * 16, y(k + 1), m); } });

      const kit = new THREE.Group(); h.scene.add(kit);
      // set(shape, east, north, { ry, y, s, a, skin }): a catalogue shape at a plan position, on the ground unless y is given, turned by ry, scaled by s, with the shape settings a; skin = MAT, or one material for a simple shape. Returns its group
      const set = (shape, x, n, { ry = 0, y, s = 1, a = [], skin = MAT } = {}) => { const grp = new THREE.Group(); grp.position.set(x, y ?? g.hAt(x, -n), -n); grp.rotation.y = ry; grp.scale.setScalar(s); kit.add(grp); h.pose(shape, skin, grp, [0, 0, 0], ...a); return grp; };
      // by(shape, pk, side, off, { lat, … }): the same at chainage pk, side -1 = left (outside of the loop) / 1 = right (central ravine), its centre `off` metres beyond the wall; local X points away from the road, Z along it
      const by = (shape, p, sd, off, o = {}) => { const s = at(p), [x, z] = edgePt(s, sd, s.w + off); return set(shape, x, -z, { ry: h.across(s) + (sd < 0 ? Math.PI : 0), ...o }); };
      // on(shape, sample, o): the same in the road frame at a sample (X across, positive to the right, Z toward the rear), at road level
      const on = (shape, s, o = {}) => set(shape, s.x, -s.z, { ry: h.across(s), y: s.y, ...o });
      // beam(a, b, t, material): a square bar t thick from point a to point b [x, y, z]: cables, hangers
      const beam = (a, b, t, m = MAT.steel) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), o = h.pose('boxMesh', m, kit, a.map((v, i) => (v + b[i]) / 2), t, t, l); o.lookAt(...b); return o; };
      // trees are instanced: one draw pass per shape for the whole map. tree = a big broadleaf (trunk and crown), pine = a flat-tiered pine, bush = a mound of undergrowth w wide
      const TR = new Map(), put = (shape, m, e) => { const k = shape + '|' + m; (TR.get(k) || TR.set(k, []).get(k)).push(e); }, same = (x, y, z, k, ry = nz(x, z) * 6) => [x, y, z, ry, k, k, k];
      // tree(x, z, ht, r, y): a broadleaf, one of three (wide crown, tall narrow crown, wide crown in pale green), a few of them in old gold; r = size of the crown; y = its foot when it does not stand on the terrain
      const tree = (x, z, ht = 20, r = 1, y = g.hAt(x, z) - 0.6) => { const k = ht / 22, v = nz(x * 0.37, z * 0.91), c = (0.8 + 0.45 * nz(x, z)) * k * r, m = nz(z, x * 3) > 0.93 ? 'gold' : v > 0.7 ? 'pale' : v < 0.2 ? 'deep' : 'leaf';
        put('troncPiliers', 'bark', same(x, y, z, k)); v > 0.35 && v < 0.6 ? put('houppierHautPiliers', m, same(x, y + ht * 0.95, z, c * 1.25)) : put('houppierPiliers', m, same(x, y + ht * 0.84, z, c)); };
      const pine = (x, z, ht = 14, y = g.hAt(x, z) - 0.4) => { const k = ht / 14; put('futPiliers', 'bark', same(x, y, z, k, 0)); put('pinPiliers', 'pine', same(x, y, z, k)); };
      const fir = (x, z, ht = 18, y = g.hAt(x, z) - 0.4) => { const k = ht / 18; put('futPiliers', 'bark', same(x, y, z, k * 0.5, 0)); put('sapinPiliers', nz(x, z + 5) > 0.5 ? 'pine' : 'deep', same(x, y, z, k)); };
      const bush = (x, z, w = 6, ht = 2.5, y = g.hAt(x, z) - 0.3) => put('taillisPiliers', nz(z, x) > 0.6 ? 'pale' : 'leaf', [x, y, z, nz(x, z) * 6, w, ht, w * (0.7 + 0.6 * nz(z, 3))]);
      const shrub = (x, z, k = 1, y = g.hAt(x, z) - 0.2, m = nz(x, z * 2) > 0.88 ? 'gold' : nz(x, z * 2) > 0.4 ? 'deep' : 'pale') => put('arbustePiliers', m, same(x, y, z, k));
      const rocks = (x, z, w, ht, seed, m = MAT.rock) => set('rocherPiliers', x, -z, { ry: seed, a: [w, ht, w * (0.7 + 0.6 * nz(seed, 2)), seed], skin: m });
      // wood(pk, side, off, w, d, kind): a wood filling a footprint w deep from `off` metres beyond the wall and d long, centred on chainage pk. kind 1: broadleaf with pines and firs and undergrowth at its feet; 0: undergrowth, shrubs and small trees.
      // Nothing is planted within 11 m of any stretch of road, nor where the ground has fallen into the ravine
      const wood = (p, sd, off, w, d, kind = 1) => { for (let a = -d / 2; a <= d / 2; a += kind ? 11 : 8) for (let o = off + 3; o < off + w; o += kind ? 12 : 7) {
        const s = at(p + a + 6 * (nz(a, o + p) - 0.5) + LAP), [x, z] = edgePt(s, sd, s.w + o + 5 * nz(o, a + p)), v = nz(a * 3 + p, o); if (g.hAt(x, z) < s.y - 12 || g.dAt(x, z) < 11) continue;
        if (!kind) v > 0.8 ? tree(x, z, 9 + 4 * v, 0.9) : v > 0.5 ? shrub(x, z, 1 + v) : bush(x, z, 5 + 5 * v, 2 + 2.5 * v);
        else { v > 0.32 ? tree(x, z, 15 + 9 * nz(o, a)) : v > 0.14 ? fir(x, z, 16 + 10 * v) : pine(x, z, 16 + 6 * v); if (o < off + 16) nz(a, o) > 0.5 ? bush(x + 4, z + 3, 6 + 4 * v, 3) : shrub(x + 4, z + 3, 1.2 + v); } } };
      // the towers: a stack of beds over each terrain pillar (the terrain is the core, 2.5 m inside), a wooded crown, pines on it. Along the road the stack is cut back to a face 6 m beyond the wall, leaning 12 cm per metre;
      // round the tunnel the faces that reach lower than 12.5 m above the roadway are removed, and the stone portals of zone 4 stand in the two openings, a rock panel behind each
      const clear = G => { const P = G.attributes.position, cut = new Uint8Array(P.count); for (let k = 0; k < P.count; k++) { const x = P.getX(k), y = P.getY(k), z = P.getZ(k), i = near(h, x, z), s = S[i], lat = (x - s.x) * -s.tz + (z - s.z) * s.tx, lon = (x - s.x) * s.tx + (z - s.z) * s.tz;
          const min = s.w + 6 + 0.12 * Math.max(0, y - s.y); if ((i - T.t0 + 14 + N) % N <= T.t1 - T.t0 + 28) { if (Math.abs(lat) < s.w + 9 && y < s.y + 12.5) cut[k] = 1; continue; } // round the tunnel: every face that reaches into the opening is removed
          if (y < s.y - 40 || Math.abs(lat) >= min || Math.abs(lon) > 30) continue;
          const l = (lat < 0 ? -1 : 1) * min; P.setX(k, s.x + s.tx * lon - s.tz * l); P.setZ(k, s.z + s.tz * lon + s.tx * l); }
        if (cut.some(v => v)) for (const name of ['position', 'uv', 'color']) { const a = G.attributes[name], keep = []; for (let k = 0; k < P.count; k += 3) if (!cut[k] && !cut[k + 1] && !cut[k + 2]) keep.push(...a.array.subarray(k * a.itemSize, (k + 3) * a.itemSize)); G.setAttribute(name, new THREE.Float32BufferAttribute(keep, a.itemSize)); }
        G.computeVertexNormals(); return G; };
      // needle(east, north, w, d, top, seed, far): a needle standing on the ravine floor with its crown and two pines; far = 1: in the pale tints of the distance, no pines
      const needle = (x, n, w, d, top, seed = 0, far = 0) => { set('aiguillePiliers', x, n, { y: 0, a: [w, d, top, seed], skin: far ? MAT.far : ROCKS[seed % 3] }); set('aiguilleCouronnePiliers', x, n, { y: 0, a: [w, d, top, seed], skin: far ? MAT.farLeaf : MAT.leaf });
        if (!far) for (let k = 0; k < 2; k++) pine(x + (nz(seed, k) - 0.5) * w * 0.5, -n + (nz(k, seed) - 0.5) * d * 0.5, 9 + 6 * nz(seed + k), top + 1); };
      // a white fall down a rock face, from (x, y, z) to (x1, y1, z1), w wide: still water, seen from far
      const fall = (a, b, w) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), q = h.pose('boxMesh', MAT.fall, kit, a.map((v, i) => (v + b[i]) / 2), w, 0.8, l); q.lookAt(...b); };
      TOWERS.forEach(([t, P], q) => { const rock = q === 4 ? MAT.warm : ROCKS[q % 3], G = clear(h.pose('stackPiliers', rock, kit, [0, 0, 0], P, 60, t, q, 0.125, 6, 0, 3.4, 0).geometry); h.pose('couronnePiliers', MAT.leaf, kit, [0, 0, 0], P, t + 0.5, q);
        const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cn = P.reduce((a, p) => a + p[1], 0) / P.length;
        // the summit: pines and broadleaf trees standing on the crown, denser toward the edge
        for (let k = 0; k < 28; k++) { const [x, n] = P[k % P.length], f = 0.15 + 0.78 * nz(k, q), X = cx + (x - cx) * f, Z = -(cn + (n - cn) * f); k % 3 ? pine(X, Z, 12 + 12 * nz(q, k), t + 2) : tree(X, Z, 9 + 6 * nz(k, q + 1), 1.1, t + 1); }
        // the shoulders of the stack: pines (one or two, taller on a wide shoulder), a shrub or a tuft on every step, away from the road
        for (const [x, y, z, w] of G.userData.ledges) { if (g.dAt(x, z) < 24 || y < 85) continue; const v = nz(x, z + y), k = Math.min(1.6, w / 3);
          if (v > 0.4) { pine(x, z, (6 + 7 * nz(y, x)) * k, y - 0.5); if (v > 0.7) pine(x + 2.5, z - 2, (5 + 5 * nz(x, y)) * k, y - 0.5); } else v > 0.15 ? shrub(x, z, 1 + 1.5 * v, y - 0.3) : bush(x, z, 4 + 3 * v, 1.6, y - 0.4); }
        // columns split off the tower: lower needles standing against its flanks
        if (q < 6) for (let k = 0; k < 6; k++) { const i = (k * 2 + q) % P.length, [x, n] = P[i], l = Math.hypot(x - cx, n - cn), o = 1 + (16 + 26 * nz(k, q + 3)) / l, X = cx + (x - cx) * o, Nn = cn + (n - cn) * o, w = 12 + 12 * nz(q, k + 5);
          if (g.dAt(X, -Nn) > 60) needle(X, Nn, w, w * (0.8 + 0.5 * nz(k, q)), t * (0.42 + 0.34 * nz(q + k, 2)), q * 7 + k); }
        // a fall on the three tallest, down the flank that looks at the ravine
        if (q === 0 || q === 2 || q === 5) { const [x, n] = P[q === 5 ? 3 : 1], l = Math.hypot(x - cx, n - cn), at2 = (o, y) => [cx + (x - cx) * (1 + o / l), y, -(cn + (n - cn) * (1 + o / l))]; fall(at2(7.5, t - 14), at2((t - 84) / 8 + 9, 84), 5); } });
      // the far field: the map is a forest of pillars in a sea of clouds. Instanced needles (four silhouettes, scaled) at three ranges from the centre of the lap: 120 between 0.75 and 1.2 km in the tints of the near rock,
      // 150 out to 1.9 km and 130 out to 2.8 km in the pale tints of the distance, larger as they get farther so they still read; none within 150 m of the road
      { const L = new Map(), add = (k, e) => (L.get(k) || L.set(k, []).get(k)).push(e);
        [[120, 750, 1200, 22, 34, 'rock'], [150, 1200, 1900, 30, 50, 'far'], [130, 1900, 2800, 44, 80, 'far']].forEach(([n, r0, r1, w0, dw, m], band) => { for (let k = 0; k < n; k++) {
          const a = (k + nz(k, band)) / n * 6.2832, R = r0 + (r1 - r0) * nz(k, band + 3), x = 650 + Math.cos(a) * R, z = -500 - Math.sin(a) * R, w = (w0 + dw * nz(k, band + 5)) / 40, top = (190 + 250 * nz(k, band + 7) ** 1.5) / 250, v = k % 4;
          if (g.dAt(x, z) < 150) continue; const e = [x, 0, z, nz(k, 9) * 6, w, top, w * (0.75 + 0.5 * nz(k, band + 11))]; add(v + '|' + (m === 'rock' ? 'rock' + k % 3 : 'far'), e); add(v + 'c|' + (m === 'rock' ? 'leaf' : 'farLeaf'), e); } });
        for (const [k, list] of L) { const [v, m] = k.split('|'); inst(h, h.geo(v.endsWith('c') ? 'aiguilleCouronnePiliers' : 'aiguillePiliers', 40, 40, 250, parseInt(v) + 60), MAT[m], list); } }
      for (const z of ZONES) PILIERS[z]({ h, g, S, N, T, at, idx, pk, nz, MAT, kit, set, by, on, beam, tree, pine, fir, bush, shrub, rocks, wood, needle, THREE });
      // the verges of the whole lap outside the woods, the bridge and the tunnel: every 7 m on each side, a shrub, a tuft, a boulder, a small pine or nothing, 3 to 12 m beyond the parapet, only on ground at road level
      for (let p = 640; p < 3700; p += 7) for (const sd of [-1, 1]) { if ((p > 1790 && p < 2090) || (p > 2370 && p < 2510)) continue;
        const s = at(p), [x, z] = edgePt(s, sd, s.w + 3 + 9 * nz(p, sd)), v = nz(p * 1.7, sd + 2), y = g.hAt(x, z), plateau = p > 2090 && p < 2826; if (Math.abs(y - s.y) > 3 || g.dAt(x, z) < s.w + 2.5) continue;
        if (v > 0.8) rocks(x, z, 2 + 3 * nz(p, 4), 1.2 + 2 * nz(p, 5), p, p > 2826 ? MAT.warm : MAT.rock); else if (v > 0.55) shrub(x, z, 0.8 + nz(p, 6)); else if (v > 0.38) bush(x, z, 3 + 3 * nz(p, 7), 1.2 + nz(p, 8));
        else if (v > 0.3) pine(x, z, 6 + 5 * nz(p, 9)); else if (plateau && v > 0.18) tree(x, z, 8 + 5 * nz(p, 10), 0.9); }
      // trees on top of the cut faces of the banks: a green line over the rock, as on the buttress of the references
      BANKS.forEach(([a, b, sd, H]) => { for (let p = a + 40; p < b - 40; p += 9 + 8 * nz(p, H)) { const s = at(p), [x, z] = edgePt(s, sd, s.w + 12 + 1.4 * Math.ceil(H / 5) + 9 + 14 * nz(p, 2)), v = nz(p, 3); if (g.hAt(x, z) < s.y + H * 0.6 || g.dAt(x, z) < 20) continue;
        v > 0.6 ? pine(x, z, 9 + 7 * v) : v > 0.3 ? fir(x, z, 10 + 10 * v) : v > 0.12 ? tree(x, z, 10 + 20 * v) : shrub(x, z, 2); } });
      weld(h, kit); // one mesh per material
      for (const [k, list] of TR) { const [shape, m] = k.split('|'); inst(h, h.geo(shape), MAT[m], list); }
    },
  });
})();
