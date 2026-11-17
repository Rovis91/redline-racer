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
        layerSet: [{ tex: ['solPiliers', '#7f8a66'], weight: zone(2181, 2826) }, { tex: ['gresPiliers', '#7e7d68', 0.3, 0.6], weight: (x, z) => Math.max(ledge[0](x, z), ledge[1](x, z)), edgePt: [30, 70] },
          { tex: ['gresPiliers'], slope: [0.3, 0.55] }, { tex: ['gresPiliers', '#c9ad94'], slope: [0.3, 0.55], weight: zone(2826, 3700) }] });
      // on a steep face the texture follows the altitude instead of the plan: the beds stay horizontal and are not stretched down the cliffs
      { const G = g.mesh.geometry, P = G.attributes.position, Nn = G.attributes.normal, U = G.attributes.uv; for (let k = 0; k < P.count; k++) if (Nn.getY(k) < 0.72) U.setXY(k, (P.getX(k) + P.getZ(k)) * 0.07, P.getY(k) / 10); }
      const DS = { side: THREE.DoubleSide };
      // MAT: the shared materials of the map, one draw pass each for the whole map: every real piece of scenery goes into the group `kit`, merged per material at the end. Keys are also the zone names of the piliers assemblies
      const MAT = { rock: h.mat('gresPiliers', DS), warm: h.mat('gresPiliers', DS, '#c9ad94'), far: h.mat('gresPiliers', DS, '#7d9296', 0.6, 0.3), cut: h.mat('gresPiliers', DS, '#9b9a7e', 1, 1, 1), cutWarm: h.mat('gresPiliers', DS, '#c9ad94', 0.7, 1, 1), rubble: h.mat('gresPiliers', DS, '#7e7d68', 0.3, 0.6),
        stone: h.mat('pierrePiliers'), wall: h.mat('pierrePiliers', DS, 1), leaf: h.mat('feuillagePiliers', DS), pine: h.mat('feuillagePiliers', DS, '#3c554a'), farLeaf: h.mat('feuillagePiliers', DS, '#5f8474'), bark: h.mat('ecorcePiliers'),
        steel: h.mat('acierPiliers', DS), rail: h.mat('lattice', { alphaTest: 0.5, ...DS }, '#24404c'), wood: h.mat('laquePiliers'), tile: h.mat('tuilePiliers', DS), water: h.mat('eauPiliers', { smooth: 1 }), fall: h.mat('eauPiliers', { smooth: 1, ...DS }, '#eef6f4'), dark: h.mat('tunnelPiliers', { c: 0x2a2c28 }) };
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
      // cut faces along the banks (BANKS): beds 5 m high, each set back from the one below, their line broken every 16 m; the terrain bank is behind them
      BANKS.forEach(([a, b, sd, H], q) => { const m = q === 2 ? MAT.cutWarm : MAT.cut, nb = Math.ceil(H / 5), up = s => H * clamp(Math.min(here(s) - a, b - here(s)) / 60);
        const off = k => s => sd * (s.w + 10.5 + k * 1.4 + 2 * nz(I.get(s) >> 3, k + a)), y = k => s => k ? up(s) * k / nb : -1;
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
      const TR = { troncPiliers: [], houppierPiliers: [], futPiliers: [], pinPiliers: [], taillisPiliers: [] };
      const tree = (x, z, ht = 20, r = 1) => { const y = g.hAt(x, z) - 0.6, k = ht / 22, c = (0.8 + 0.45 * nz(x, z)) * k * r; TR.troncPiliers.push([x, y, z, nz(z, x) * 6, k, k, k]); TR.houppierPiliers.push([x, y + ht * 0.84, z, nz(x, 7) * 6, c, c, c]); };
      const pine = (x, z, ht = 14, y = g.hAt(x, z) - 0.4) => { const k = ht / 14; TR.futPiliers.push([x, y, z, 0, k, k, k]); TR.pinPiliers.push([x, y, z, nz(x, z) * 6, k, k, k]); };
      const bush = (x, z, w = 6, ht = 2.5) => TR.taillisPiliers.push([x, g.hAt(x, z) - 0.3, z, nz(x, z) * 6, w, ht, w * (0.7 + 0.6 * nz(z, 3))]);
      // wood(pk, side, off, w, d, kind): a wood filling a footprint w deep from `off` metres beyond the wall and d long, centred on chainage pk. kind 1: broadleaf with a few pines and undergrowth at its feet; 0: undergrowth and small trees.
      // Nothing is planted within 11 m of any stretch of road, nor where the ground has fallen into the ravine
      const wood = (p, sd, off, w, d, kind = 1) => { for (let a = -d / 2; a <= d / 2; a += kind ? 11 : 8) for (let o = off + 3; o < off + w; o += kind ? 12 : 7) {
        const s = at(p + a + 6 * (nz(a, o + p) - 0.5) + LAP), [x, z] = edgePt(s, sd, s.w + o + 5 * nz(o, a + p)), v = nz(a * 3 + p, o); if (g.hAt(x, z) < s.y - 12 || g.dAt(x, z) < 11) continue;
        if (!kind) v > 0.8 ? tree(x, z, 9 + 4 * v, 0.9) : bush(x, z, 5 + 5 * v, 2 + 2.5 * v); else { v > 0.22 ? tree(x, z, 15 + 9 * nz(o, a)) : pine(x, z, 16 + 6 * v); if (o < off + 16) bush(x + 4, z + 3, 6 + 4 * v, 3); } } };
      // the towers: a stack of beds over each terrain pillar (the terrain is the core, 2.5 m inside), a wooded crown, pines on it. Along the road the stack is cut back to a face 6 m beyond the wall, leaning 12 cm per metre;
      // round the tunnel the faces that reach lower than 12.5 m above the roadway are removed, and the stone portals of zone 4 stand in the two openings, a rock panel behind each
      const clear = G => { const P = G.attributes.position, cut = new Uint8Array(P.count); for (let k = 0; k < P.count; k++) { const x = P.getX(k), y = P.getY(k), z = P.getZ(k), i = near(h, x, z), s = S[i], lat = (x - s.x) * -s.tz + (z - s.z) * s.tx, lon = (x - s.x) * s.tx + (z - s.z) * s.tz;
          const min = s.w + 6 + 0.12 * Math.max(0, y - s.y); if ((i - T.t0 + 14 + N) % N <= T.t1 - T.t0 + 28) { if (Math.abs(lat) < s.w + 9 && y < s.y + 12.5) cut[k] = 1; continue; } // round the tunnel: every face that reaches into the opening is removed
          if (y < s.y - 40 || Math.abs(lat) >= min || Math.abs(lon) > 30) continue;
          const l = (lat < 0 ? -1 : 1) * min; P.setX(k, s.x + s.tx * lon - s.tz * l); P.setZ(k, s.z + s.tz * lon + s.tx * l); }
        if (cut.some(v => v)) for (const a of [P, G.attributes.uv]) { const keep = []; for (let k = 0; k < P.count; k += 3) if (!cut[k] && !cut[k + 1] && !cut[k + 2]) keep.push(...a.array.subarray(k * a.itemSize, (k + 3) * a.itemSize)); G.setAttribute(a === P ? 'position' : 'uv', new THREE.Float32BufferAttribute(keep, a.itemSize)); }
        G.computeVertexNormals(); return G; };
      TOWERS.forEach(([t, P], q) => { clear(h.pose('stackPiliers', q === 4 ? MAT.warm : MAT.rock, kit, [0, 0, 0], P, 60, t, q, 0.125, 6, 0, 3.4, 0).geometry); h.pose('couronnePiliers', MAT.leaf, kit, [0, 0, 0], P, t + 0.5, q);
        const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cn = P.reduce((a, p) => a + p[1], 0) / P.length; for (let k = 0; k < 7; k++) { const [x, n] = P[k % P.length], f = 0.25 + 0.5 * nz(k, q); pine(cx + (x - cx) * f, -(cn + (n - cn) * f), 12 + 8 * nz(q, k), t + 2); } });
      // needle(east, north, w, d, top, seed, far): a needle standing on the ravine floor with its crown; far = 1: in the pale tints of the distance
      const needle = (x, n, w, d, top, seed = 0, far = 0) => { set('aiguillePiliers', x, n, { y: 0, a: [w, d, top, seed], skin: far ? MAT.far : MAT.rock }); set('aiguilleCouronnePiliers', x, n, { y: 0, a: [w, d, top, seed], skin: far ? MAT.farLeaf : MAT.leaf }); };
      // the horizon: the terrain stops 320 m from the road; beyond it a ring of far needles and massifs stands in the sea of clouds, 950 to 1 600 m from the centre of the lap
      for (let k = 0; k < 18; k++) { const a = k / 18 * 6.2832 + nz(k, 1) * 0.25, R = 950 + 650 * nz(k, 2), w = 70 + 110 * nz(k, 3); const x = 650 + Math.cos(a) * R, n = 500 + Math.sin(a) * R, top = 230 + 200 * nz(k, 5);
        needle(x, n, w, w * (0.7 + 0.6 * nz(k, 4)), top, 20 + k, 1); needle(x + w * 0.75, n + w * (nz(k, 6) - 0.5), w * 0.5, w * 0.6, top * (0.55 + 0.3 * nz(k, 7)), 40 + k, 1); } // each massif: a main needle and a lower one against it
      for (const z of ZONES) PILIERS[z]({ h, g, S, N, T, at, idx, pk, nz, MAT, kit, set, by, on, beam, tree, pine, bush, wood, needle, THREE });
      weld(h, kit); // one mesh per material
      for (const [shape, m] of [['troncPiliers', MAT.bark], ['houppierPiliers', MAT.leaf], ['futPiliers', MAT.bark], ['pinPiliers', MAT.pine], ['taillisPiliers', MAT.leaf]]) if (TR[shape].length) inst(h, h.geo(shape), m, TR[shape]);
    },
  });
})();
