// Scenery placement for "autoroute" (Sunken Highway, layout 5, blockout): a city on a street grid of 110 m, of which the route is what is left open.
// This file: ground, water, the straight edges of the streets (kerbs, motorway parapets, metro walls) inside which the track winds, motorway deck and piers, metro shell, and the placers.
// The city itself is scenery-autoroute-ville.js; the named blocks of each zone are scenery-autoroute-<zone>.js. See docs/methods/NEW-MAP.md, phase 2.
(function () {
  const { near, block, edgePt, terrain, inst } = PLACERS;
  const ZONES = ['ville', 'boulevard', 'quartier', 'pont', 'trou', 'metro'], LAP = 2583, G = 110; // LAP: plan length, the unit of the chainages (PK); G: grid pitch, node (i, j) is at (i * G, j * G), j grows to the south
  // PK of the layout's joints: end of the boulevard, foot of the slip road, merge onto the motorway, foot of the collapsed span, ledge of the hole, heap of rubble up to the platform, mouth of the corridor, top of the stairs
  const PK = { bd: 613, rampe: 1233, fusion: 1354, sol: 1773, bord: 1848, gravats: 2208, couloir: 2344, rue: 2419 };
  // the city slopes down to the river in the east: dry at 2.5 m west of the motorway, 0.7 m beyond column 3, where the water (0) stands in the streets
  const cityY = x => { const t = Math.min(1, Math.max(0, (x - 180) / 140)); return 2.5 - 1.8 * t * t * (3 - 2 * t); };
  // half-widths from a street's axis to its facades: the boulevard is row 0, the motorway runs above column 2 (its slip road on the east side)
  const colL = i => i === 2 ? 20 : 11, colR = i => i === 2 ? 38 : 11, row = j => j === 0 ? 17 : 11;

  Object.assign(SCENERY, {
    autoroute(h) {
      const { THREE, S, N, T } = h, IX = new Map(S.map((s, i) => [s, i])), pkS = s => IX.get(s) / N * LAP, idx = pk => Math.round(pk / LAP * N) % N, at = pk => S[idx(pk)];
      const DS = { side: THREE.DoubleSide }, conc = h.mat('paint', { c: 0x8f8c82, ...DS }), asphalt = h.mat('paint', { c: 0x3e4146, ...DS }), pavement = h.mat('paint', { c: 0x77746c, ...DS });
      const nT = T.t1 - T.t0, metro = new Set(S.slice(T.t0, T.t1 + 1)), el = s => { const p = pkS(s); return p > PK.rampe && p < PK.sol && s.y > cityY(s.x) + 0.6; };
      // street(s): the straight street the sample is on, as [axis, half-width, centre]: 'x' = the street runs along x (its edges are lines of constant z), 'z' along z; null elsewhere.
      // Boulevard kerbs at z = ±13; motorway parapets at x = 220 ± 16; metro walls at z = 220 ± 9, and from the heap of rubble z = 214 ± 15 (the tracks and the north platform)
      const street = s => { const p = pkS(s); return p < PK.bd - 2 || p > LAP - 34 ? ['x', 13, 0] : p > PK.fusion - 60 && p < PK.sol - 12 ? ['z', 16, 220] : p > PK.bord + 2 && p < PK.couloir - 14 ? p < PK.gravats ? ['x', 9, 220] : ['x', 15, 214] : null; };
      // edge(s, side): distance from the axis to the visible edge of the street on that side. The physics walls follow the track at ±s.w; the street keeps straight edges,
      // and what lies between wall and edge is filled by the traffic jam. Elsewhere (street corners, slip road, corridor, stairs) the edge is 1 m outside the wall
      const edge = (s, sd) => { const st = street(s); if (!st || (st[0] === 'z' && pkS(s) < PK.fusion && sd < 0)) return s.w + 1; // before the merge the slip road has its own east edge
        const [ax, hw, c] = st, o = ax === 'x' ? (hw - sd * (s.z - c) * Math.sign(s.tx)) / Math.abs(s.tx) : (hw + sd * (s.x - c) * Math.sign(s.tz)) / Math.abs(s.tz); return Math.max(s.w + 0.5, o); };
      const H = s => pkS(s) < PK.couloir - 14 ? 9 : 4.5; // metro: height under the ceiling, tunnel and station then passenger corridor
      // ground: the road lies on it, except on the motorway (the city stays under it) and in the metro (the city passes over it); the hole and the stairwell are open to the sky
      const ground = s => metro.has(s) || el(s) ? cityY(s.x) : s.y;
      // relief(x, z, y) = metres to remove: in the low district the streets not driven sink under the water, and the river bed lies beyond column 5; over the metro the ground is raised (negative) above the ceiling
      const relief = (x, z, y) => { const s = S[near(h, x, z)], d = Math.hypot(s.x - x, s.z - z) - s.w;
        if (metro.has(s)) return d < edge(s, 1) + edge(s, -1) ? Math.min(0, y - (s.y + H(s) + 1)) : 0;
        return x > 570 ? 3 : x > 285 ? Math.min(0.9, Math.max(0, d - 6) * 0.5) : 0; };
      const g = terrain(h, { stepSec: 10, margin: 400, ground, hollow: relief, mat: h.mat('paint', { c: 0x45484a }) });
      const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 2000), h.mat('paint', { c: 0x2a8f8a })); water.rotation.x = -Math.PI / 2; water.position.set(725, 0, 0); h.scene.add(water); // east of x = 275 only: the hole and the stairwell go below 0
      // one flat asphalt over the engine's textured roadway (no markings, patches or cracks: this is a street, not a track), in the open and in the metro
      { const o = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }; h.ribbon(T.t1, N - nT, s => -s.w, 0, s => s.w, 0, h.mat('paint', { c: 0x3e4146, ...DS, ...o }), 8); h.ribbon(T.t0, nT, s => -s.w, 0, s => s.w, 0, h.mat('paint', { c: 0x33383a, ...DS, ...o }), 8); }
      // open air: asphalt from the walls to the edges, then a pavement 4 m wide where the road is a street
      for (const sd of [-1, 1]) { h.ribbon(T.t1, N - nT, s => sd * s.w, 0, s => sd * edge(s, sd), 0, asphalt, 8);
        for (const [a, b] of [[0, PK.rampe], [PK.sol + 14, PK.bord - 2], [PK.rue + 4, LAP]]) h.ribbon(idx(a), idx(b - 1) - idx(a), s => sd * edge(s, sd), 0.25, s => sd * (edge(s, sd) + 4), 0.25, pavement, 8); }
      // motorway: a 2 m deck from edge to edge, a 1 m parapet, a pier every 40 m except where a street passes under
      const i0 = S.findIndex(el), n = S.length - [...S].reverse().findIndex(el) - i0, laid = S.filter(s => !el(s) && !metro.has(s)), piers = [];
      h.ribbon(i0, n, s => -edge(s, -1), -2, s => edge(s, 1), -2, conc, 8); for (const sd of [-1, 1]) h.ribbon(i0, n, s => sd * edge(s, sd), 1, s => sd * edge(s, sd), -2, conc, 8);
      for (let i = i0 + 10; i < i0 + n; i += 20) { const s = S[i], l = edge(s, -1), r = edge(s, 1), [x, z] = edgePt(s, 1, (r - l) / 2), y0 = g.hAt(x, z) - 1, w = l + r - 4;
        if (s.y - 2 - y0 > 1 && !laid.some(t => Math.abs((t.x - x) * s.tx + (t.z - z) * s.tz) < t.w + 3 && Math.abs((t.x - x) * -s.tz + (t.z - z) * s.tx) < w / 2 + t.w)) piers.push([x, (s.y - 2 + y0) / 2, z, h.across(s), w / 5, s.y - 2 - y0, 0.6]); }
      inst(h, h.geo('pierViaduct'), conc, piers);
      // metro (th.tun.without 'walls': the engine only lays the floor and the lights): track bed, walls and ceiling from edge to edge
      const dark = h.mat('paint', { c: 0x4a5a52, ...DS }), bed = h.mat('paint', { c: 0x33383a, ...DS }), up = s => cityY(s.x) + 0.4 - s.y;
      h.ribbon(T.t0, nT, s => -edge(s, -1), H, s => edge(s, 1), H, dark, 8);
      for (const sd of [-1, 1]) { h.ribbon(T.t0, nT, s => sd * s.w, 0, s => sd * edge(s, sd), 0, bed, 8); h.ribbon(T.t0, nT, s => sd * edge(s, sd), 0, s => sd * edge(s, sd), H, dark, 8);
        // the two shafts open to the sky, walled up to the street: the hole the car falls into (from the ledge to the tunnel) and the stairwell
        const iB = idx(PK.bord + 4); h.ribbon(iB, T.t0 - iB, s => sd * edge(s, sd), 0, s => sd * edge(s, sd), up, dark, 8); h.ribbon(T.t1, idx(PK.rue) - T.t1, s => sd * (s.w + 1), 0, s => sd * (s.w + 1), up, conc, 8); }
      // self-check: the motorway crosses the boulevard and the streets run close to each other; a block set from one stretch can land on another. (ux, uz): the block's local X
      const onRoad = (label, x, z, ux, uz, w, d, y0, top) => { if (S.some(t => Math.abs((t.x - x) * ux + (t.z - z) * uz) < w / 2 + t.w && Math.abs((t.x - x) * -uz + (t.z - z) * ux) < d / 2 + t.w && y0 < t.y + 5 && top > t.y - 2.5)) console.warn('autoroute: block on the road', label, Math.round(x), Math.round(z)); };
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left / 1 = right, its near face `off` metres from the wall; w across the road, d along it.
      // Set on the lowest ground under it (ht is kept above its centre), or base at altitude y when given (the road's altitude: on the motorway or in the metro)
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = at(pk), [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z);
        const y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2))), top = ht + (y ?? y1);
        onRoad(label, x, z, -s.tz, s.tx, w, d, y0, top); return block(h, label, c, w, top - y0, d, x, y0, z, h.across(s)); };
      // spot(label, colour, x, z, wx, ht, dz, y, under): a block at map coordinates, wx along x and dz along z, on the ground or base at altitude y; under = 1: the road runs on top of it (no self-check)
      const spot = (label, c, x, z, wx, ht, dz, y, under) => { const y0 = y ?? g.hAt(x, z) - 0.5; if (!under) onRoad(label, x, z, 1, 0, wx, dz, y0, y0 + ht); return block(h, label, c, wx, ht, dz, x, y0, z); };
      // bar(i, j, arm, label, colour, ht): what blocks the arm ('N', 'S', 'E', 'W') of the crossroads (i, j) that the route does not take: across the whole street, at its mouth
      const bar = (i, j, arm, label, c, ht, dp = 8) => { const sg = arm === 'N' || arm === 'W' ? -1 : 1;
        return arm === 'N' || arm === 'S' ? spot(label, c, i * G + (colR(i) - colL(i)) / 2, j * G + sg * (row(j) + 3 + dp / 2), colL(i) + colR(i), ht, dp) : spot(label, c, i * G + sg * ((sg > 0 ? colR(i) : colL(i)) + 3 + dp / 2), j * G, dp, ht, 2 * row(j)); };
      // gantry(pk, label): a sign gantry across the road, 7 m clear
      const gantry = (pk, label) => { const s = at(pk); for (const sd of [-1, 1]) { const [x, z] = edgePt(s, sd, s.w + 1); h.pose('boxMesh', conc, h.scene, [x, s.y + 3.5, z], 0.8, 7, 0.8); }
        return block(h, label, 0x2f6a5a, 2 * s.w + 4, 1.6, 1, s.x, s.y + 7, s.z, h.across(s)); };
      for (const z of ZONES) AUTOROUTE[z]({ h, g, put, spot, bar, gantry, at, street, metro, cityY, G, colL, colR, row });
    },
  });
})();
