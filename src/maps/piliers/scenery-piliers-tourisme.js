// "piliers", the tourist layer of the whole lap (round 4): the park gate and its coach park, the village, shrines, cliff walkways, cantilevered platforms and their needles, the cable car, the glass lift, the two temples.
// One visitor network: every platform, stair and walkway leads to the next stop. Shapes: shapes-piliers-tourisme.js; the helpers of scenery-piliers.js are described there. See docs/proposals/sky-pillars/AMBIANCE-V2.html, "The tourist layer".
// Side -1 = left (outside of the loop), 1 = right. Nothing here stands on the roadway: the gate spans it, its columns outside the parapets.
(window.PILIERS = window.PILIERS || {}).tourisme = ({ h, g, at, idx, nz, MAT, kit, beam, needle, clearing, LAP, TOWERS, THREE }) => {
  const { edgePt } = PLACERS, HP = Math.PI / 2, A = p => at(((p % LAP) + LAP) % LAP), away = (s, sd) => h.across(s) + (sd < 0 ? Math.PI : 0), fwd = s => Math.atan2(-s.tz, s.tx);
  // grp(east, north, ry, y): an empty group of the kit. site(pk, side, off, { fwd, y }): the same `off` metres beyond the wall at chainage pk, local X away from the road (fwd: X along the way the cars go, so a front looks at the driver);
  // on the ground, or y above the roadway. put(G, shape, [x, y, z], settings, ry, skin): a catalogue shape in the frame of G
  const grp = (x, n, ry, y = g.hAt(x, -n)) => { const G = new THREE.Group(); G.position.set(x, y, -n); G.rotation.y = ry; kit.add(G); return G; };
  const site = (p, sd, off, o = {}) => { const s = A(p), [x, z] = edgePt(s, sd, s.w + off); return grp(x, -z, o.fwd ? fwd(s) : away(s, sd), o.y === undefined ? g.hAt(x, z) : s.y + o.y); };
  const put = (G, shape, p = [0, 0, 0], a = [], ry = 0, skin = MAT) => { const q = new THREE.Group(); q.position.set(...p); q.rotation.y = ry; G.add(q); h.pose(shape, skin, q, [0, 0, 0], ...a); return q; };
  const world = (G, p) => { G.updateWorldMatrix(true, false); return new THREE.Vector3(...p).applyMatrix4(G.matrixWorld).toArray(); }, clear = (G, p, r) => { const c = world(G, p); clearing(c[0], c[2], r); };
  const box = (G, m, p, w, ht, d, ry = 0) => put(G, 'boxMesh', p, [w, ht, d], ry, m);
  // roof: a tiled roof over a building whose length L runs along local Z (roofX: along X)
  const roofX = (G, p, L, D, ht, lift, ry = 0) => put(G, 'toitTemplePiliers', p, [L, D, ht, lift], ry, MAT.tile), roof = (G, p, L, D, ht, lift, ry = 0) => roofX(G, p, L, D, ht, lift, ry + HP);
  // hall: a hall and its roof, `tiers` roofs one above the other (each upper one over a low red storey); pagoda, house: the same for a pagoda and a village house. Each clears the trees round itself
  const hall = (G, [x, y, z], L, D, ht, tiers = 1, wall = 'white', ry = 0) => { put(G, 'hallePiliers', [x, y, z], [L, D, ht, 1, wall], ry); let yy = y + 0.8 + ht + 0.6, l = L + 4, d = D + 4, rh = d * 0.22 + 1.2; roof(G, [x, yy, z], l, d, rh, 1.3, ry);
    for (let t = 1; t < tiers; t++) { const l2 = l - d / 2 - 1.5, d2 = d / 2 - 0.5, h2 = ht * 0.45; put(G, 'hallePiliers', [x, yy + rh * 0.3, z], [l2, d2, h2, 0, 'red'], ry); yy += rh * 0.3 + h2 + 0.6; l = l2 + 3.6; d = d2 + 3.6; rh = d * 0.22 + 1.2; roof(G, [x, yy, z], l, d, rh, 1.3, ry); }
    clear(G, [x, y, z], Math.max(L, D) * 0.6 + 4); };
  const pagoda = (G, [x, y, z], w, n, sh) => { put(G, 'pagodePiliers', [x, y, z], [w, n, sh]); for (let k = 0; k < n; k++) { const a = w * 0.88 ** k + 3.6; roof(G, [x, y + 1 + (k + 1) * sh, z], a, a, k === n - 1 ? sh * 0.9 : sh * 0.42, sh * 0.28); } clear(G, [x, y, z], w + 5); return y + 1 + n * sh; };
  const house = (G, [x, y, z], L, D, ht, stilts = 0, ry = 0) => { put(G, 'maisonPiliers', [x, y, z], [L, D, ht, stilts], ry); roof(G, [x, y + (stilts ? stilts + 0.15 : 0.7) + ht, z], L + 2.4, D + 2.8, D * 0.4, 0.6, ry); clear(G, [x, y, z], Math.max(L, D) * 0.6 + 3); };
  const people = (G, list, y = 0) => list.forEach(([x, z], k) => put(G, 'touristePiliers', [x, y, z], [k + (x * 7 + z * 3 | 0) & 7], k * 1.7 + x).scale.setScalar(1.15));
  // band(a, b, w, ht, material): a flat bar from point a to point b; flags(a, b, sag): a string of prayer flags hanging between two points; footbridge(a, b, sag): a hanging plank footbridge with its two hand cables
  const band = (a, b, w, ht, m) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), o = h.pose('boxMesh', m, kit, a.map((v, i) => (v + b[i]) / 2), w, ht, l); o.lookAt(...b); return o; };
  const hang = (a, b, sag, n) => k => { const t = k / n; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]; };
  const flags = (a, b, sag = 1.5, n = 6) => { const P = hang(a, b, sag, n); for (let k = 0; k < n; k++) band(P(k), P(k + 1), 0.05, 0.9, MAT.flag); };
  const footbridge = (a, b, sag = 2.5, n = 10) => { const P = hang(a, b, sag, n), l = Math.hypot(b[0] - a[0], b[2] - a[2]), nx = -(b[2] - a[2]) / l, nz2 = (b[0] - a[0]) / l, sd = (p, s, d) => [p[0] + nx * s, p[1] + d, p[2] + nz2 * s];
    for (let k = 0; k < n; k++) { band(P(k), P(k + 1), 2.6, 0.25, MAT.plank); for (const s of [-1.3, 1.3]) { beam(sd(P(k), s, 1.3), sd(P(k + 1), s, 1.3), 0.18); beam(sd(P(k), s, 0), sd(P(k), s, 1.3), 0.12); } } };
  const lantern = (p, sd, off = 2) => { const G = site(p, sd, off, { y: 0 }); put(G, 'lanternePiliers'); clear(G, [0, 0, 0], 1.2); }, sign = (p, sd) => { const G = site(p, sd, 2.6, { fwd: 1, y: 0 }); put(G, 'panneauPiliers'); clear(G, [0, 0, 0], 2); };
  for (const [p, sd] of [[132, 1], [282, -1], [742, -1], [1278, 1], [1474, -1], [2118, -1], [2542, 1], [2884, -1], [3664, -1]]) sign(p, sd);

  // --- the park gate, PK 3 940 to 120: the paifang over the road just after the line, the ticket hall and the coach park on the inside, stalls along the outside
  { const s = A(96), G = grp(s.x, -s.z, h.across(s), s.y), sp = 2 * s.w + 5, ht = 9.5; put(G, 'paifangPiliers', [0, 0, 0], [sp, ht]); roofX(G, [0, ht + 2.6, 0], sp + 4, 3.8, 2.4, 1.3);
    for (const sd of [-1, 1]) { roofX(G, [sd * (sp / 2 + 2.9), ht - 1.7, 0], 8.5, 3.2, 1.8, 1); clear(G, [sd * (sp / 2 + 4), 0, 0], 6); put(site(86, sd, 2.6, { fwd: 1, y: 0 }), 'lionPiliers').scale.setScalar(1.5);
      const pole = site(70, sd, 9); box(pole, MAT.plank, [0, 4.5, 0], 0.3, 9, 0.3); flags(world(G, [sd * sp / 2, ht + 1, 0]), world(pole, [0, 9, 0]), 1.2); clear(pole, [0, 0, 0], 3); } }
  { const G = site(30, 1, 24); hall(G, [0, 0, 0], 28, 9, 4.6, 2, 'red'); box(G, MAT.pave, [-12.5, -0.9, 0], 14, 2.2, 36); for (const z of [-15, -5, 5, 15]) { put(G, 'lanternePiliers', [-18, 0.2, z]); clear(G, [-12, 0, z], 9); }
    people(G, [[-7, -6], [-7.6, -4.8], [-9, 2], [-8, 7.5], [-14, 9], [-15, -10], [-10.5, -11]], 0.2); put(G, 'bancPiliers', [-16, 0.2, 0], [], Math.PI); put(G, 'minibusPiliers', [-13, 0.2, 13], [], 0.15); }
  { const G = site(3992, 1, 16.5); box(G, MAT.pave, [0, -0.9, 0], 26, 2.2, 78); for (let z = -36; z <= 36; z += 12) clear(G, [0, 0, z], 16);
    [-26, -13, 0, 13].forEach((z, k) => put(G, 'autocarPiliers', [3, 0.2, z], [k & 1], 0.55)); [-32, 26, 33].forEach(z => put(G, 'minibusPiliers', [-8, 0.2, z], [], 0.1)); put(G, 'autocarPiliers', [-8, 0.2, -6], [1], 0);
    people(G, [[-3, -20], [-3.6, -19], [-2, -8], [-11, 8], [-10.4, 9.2], [-4, 20], [-11.5, -16]], 0.2); for (const z of [-30, 0, 30]) put(G, 'lanternePiliers', [-12.2, 0.2, z]); }
  for (let k = 0; k < 6; k++) { const G = site(3996 + k * 13, -1, 7); put(G, 'etalPiliers', [0, 0, 0], [k]); clear(G, [0, 0, 0], 4.5); people(G, [[-2.2, 0.6 - k % 2], ...(k % 2 ? [[-2.6, -1.2]] : [])]); }
  for (let p = 3950; p < 4042 + 110; p += 26) for (const sd of [-1, 1]) lantern(p, sd);

  // --- the village, PK 300 to 520, on the outside in the woods: a front row of plank houses (one in three on stilts), a back row of taller ones, lantern posts along the lane, three strings of flags over the road, the tea house after it
  for (let k = 0; k < 7; k++) house(site(306 + k * 31, -1, 11 + 3 * nz(k, 1)), [0, 0, 0], 8 + 4 * nz(k, 2), 6 + 2 * nz(k, 3), 3.2 + (k % 2), k % 3 === 1 ? 2.6 : 0);
  for (let k = 0; k < 4; k++) house(site(322 + k * 52, -1, 31 + 4 * nz(k, 5)), [0, 0, 0], 11, 7.5, 5.6, 0);
  for (let p = 296; p < 540; p += 26) for (const sd of [-1, 1]) lantern(p, sd);
  for (const p of [352, 414, 476]) { const P = [-1, 1].map(sd => { const G = site(p, sd, 2.2, { y: 0 }); box(G, MAT.plank, [0, 4.5, 0], 0.3, 9, 0.3); return world(G, [0, 9, 0]); }); flags(P[0], P[1], 1.4, 8); }
  for (const p of [330, 392, 455, 500]) people(site(p, -1, 5, { y: 0 }), [[0, 0], [0.7, 1.1], [-1, -6]], 0.1);
  { const G = site(548, -1, 15); house(G, [0, 0, 0], 13, 8, 3.8); put(G, 'terrassePiliers', [-7.6, 0.3, 0], [13]); people(G, [[-7, 2.2], [-8, -4.4], [-6.5, -3.2]], 0.85); clear(G, [-8, 0, 0], 9); for (const z of [-7, 7]) put(G, 'lanternePiliers', [-11.5, 0, z]); }
  // the shrine of the forest: a stone stairway up the cut bank on the inside (8 m), a paved landing, the shrine on top of the bank, flags to two poles
  { const G = site(470, 1, 2, { y: 0 }), y = 8.1; put(G, 'escalierPiliers', [0, 0, 0], [y, 11, 2.2]); box(G, MAT.pave, [15, y - 0.4, 0], 8, 1, 6); put(G, 'oratoirePiliers', [16.5, y, 0]).scale.setScalar(1.4); roof(G, [16.5, y + 4.8, 0], 7.8, 7.8, 2.8, 1.2); clear(G, [15, 0, 0], 9);
    for (const sd of [-1, 1]) { put(G, 'lanternePiliers', [11.6, y, sd * 2.6]); box(G, MAT.plank, [14, y + 4, sd * 7], 0.25, 8, 0.25); flags(world(G, [16.5, y + 7.4, 0]), world(G, [14, y + 8, sd * 7]), 0.6, 4); } people(G, [[12.2, 1], [12.6, -0.8]], y + 0.1); }
  // the first open view (PK 700): a timber lookout tower on the outside, where the trees stop
  { const G = site(704, -1, 8); put(G, 'tourGuetPiliers', [0, 0, 0], [12]); roof(G, [0, 15.2, 0], 7.6, 7.6, 2.4, 1); clear(G, [0, 0, 0], 7); people(G, [[1, 1], [-1.2, 0.4]], 12.2); people(G, [[-4, 2], [-4.6, 3]]); }

  // --- platforms cantilevered over the void where the cliff edge comes close (the EDGES of scenery-piliers.js, e metres beyond the left parapet), with a paved way from the footpath, a bench, lanterns;
  // islet: a needle standing in the void `out` metres beyond the platform, a pavilion (or a shrine) on its top, a hanging footbridge between the two
  const platform = (p, e, glass = 0, w = 18, d = 14) => { const G = site(p, -1, e + 3, { y: 0.25 }); put(G, 'plateformePiliers', [0, 0, 0], [w, d, glass]); box(G, MAT.pave, [-(e + 2.4) / 2 - 0.2, -1, 0], e + 2.4, 2.3, 3.6);
    put(G, 'bancPiliers', [-2.2, 0.15, w / 2 - 1.6]); for (const sd of [-1, 1]) put(G, 'lanternePiliers', [-0.6, 0.1, sd * (w / 2 + 0.6)], [], Math.PI); people(G, [[d - 1.2, 2], [d - 1.4, 3.1], [d - 2.6, -3.4], [3, -1], [d - 1.2, -6], [6, 5]], 0.25); clear(G, [-e / 2, 0, 0], e / 2 + 3);
    for (const x of [0.6, d * 0.6]) for (const sd of [-1, 1]) box(G, MAT.red, [x, 2.5, sd * (w / 2 - 0.6)], 0.5, 4.6, 0.5); roof(G, [d * 0.3 + 0.3, 4.8, 0], w + 3, d * 0.6 + 3.4, 3, 1.3); return G; }; // a red-columned tiled shelter over its landward half: the roof that marks it from the road
  const islet = (PG, p, e, seed, shrine = 0, out = 28, d = 14) => { const s = A(p), [x, z] = edgePt(s, -1, s.w + e + 3 + d + out), y = s.y + 6, G = grp(x, -z, away(s, -1), y); needle(x, -z, 22, 22, y, seed); clearing(x, z, 13);
    if (shrine) { put(G, 'oratoirePiliers', [0, 0.6, 0]); roof(G, [0, 4, 0], 5.6, 5.6, 2, 0.9); } else { put(G, 'pavillonPiliers', [0, 0.6, 0]); put(G, 'toitPiliers', [0, 5.2, 0], [], 0, MAT.tile); }
    footbridge(world(PG, [d, 0.2, 0]), world(G, [-6, 0.9, 0])); people(G, [[-4.6, 1]], 0.7); flags(world(G, [0, 7.5, 0]), world(PG, [d, 3.5, 5]), 3, 10); };
  islet(platform(832, 12, 1), 832, 12, 21); islet(platform(2702, 12), 2702, 12, 22, 1); islet(platform(3084, 12, 1), 3084, 12, 24); platform(3200, 12); islet(platform(3424, 12), 3424, 12, 23);
  // the promenade of the cliff edge between them: a paved way on the bench and a lattice railing along the edge, open at each platform; rest shelters with a bench on it
  for (const [a, b] of [[2622, 2690], [2714, 2764], [2942, 3072], [3096, 3188], [3212, 3412], [3436, 3588]]) { const i = idx(a), n = idx(b) - i; h.ribbon(i, n, s => -(s.w + 14.6), 0.25, s => -(s.w + 14.6), 1.5, MAT.rail, 1.2); h.ribbon(i, n, s => -(s.w + 14.5), 1.5, s => -(s.w + 14.75), 1.5, MAT.steel, 4); }
  h.ribbon(idx(2622), idx(2764) - idx(2622), s => -(s.w + 6), 0.32, s => -(s.w + 9), 0.32, MAT.pave, 4); h.ribbon(idx(2942), idx(3588) - idx(2942), s => -(s.w + 6), 0.32, s => -(s.w + 9), 0.32, MAT.pave, 4);
  for (const p of [2960, 3300, 3540]) { const G = site(p, -1, 8, { y: 0.25 }); put(G, 'pavillonPiliers', [0, 0.2, 0]); put(G, 'toitPiliers', [0, 4.8, 0], [], 0, MAT.tile); clear(G, [0, 0, 0], 7); put(G, 'bancPiliers', [0, 1.4, 0]); people(G, [[-1.5, 1], [1, -1.6], [-5, 6]], 1.4); }

  // --- walkways bolted to the rock. cliffWalk: round tower q at altitude Y, through the corners `ring` of its footprint: a deck 6 m wide on the face (its inner half is in the rock), a railing, an edge beam, a strut under each joint
  const cliffWalk = (q, ring, Y, glass) => { const [t, P] = TOWERS[q], cx = P.reduce((a, p) => a + p[0], 0) / P.length, cn = P.reduce((a, p) => a + p[1], 0) / P.length, D = (t - Y) * 0.125 + 1.5, L = [];
    for (let k = 0; k < ring.length - 1; k++) for (let j = 0; j < 4; j++) { const a = P[ring[k]], b = P[ring[k + 1]]; L.push([a[0] + (b[0] - a[0]) * j / 4, a[1] + (b[1] - a[1]) * j / 4]); } L.push(P[ring[ring.length - 1]]);
    const at2 = ([x, n], o, y) => { const l = Math.hypot(x - cx, n - cn); return [cx + (x - cx) * (1 + (D + o) / l), Y + y, -(cn + (n - cn) * (1 + (D + o) / l))]; };
    for (let k = 0; k < L.length - 1; k++) { const a = L[k], b = L[k + 1]; band(at2(a, 0, 0), at2(b, 0, 0), 6, 0.3, glass ? MAT.glass : MAT.plank); band(at2(a, 3, 0.75), at2(b, 3, 0.75), 0.1, 1.3, glass ? MAT.glass : MAT.rail);
      band(at2(a, 3, 1.4), at2(b, 3, 1.4), 0.2, 0.15, MAT.steel); band(at2(a, 3, -0.35), at2(b, 3, -0.35), 0.4, 0.5, MAT.steel); beam(at2(a, 3, -0.4), at2(a, -1.5, -5), 0.35); }
    return k => at2(L[k], 1, 0.2); };
  cliffWalk(1, [1, 0, 5, 4], 196, 1); // the glass walkway on P2, 12 to 16 m above the corniche road
  cliffWalk(2, [0, 5, 4, 3], 226, 0); // the plank walkway on P3, 12 to 16 m above the road
  // the glass lift up the east face of P3, from the corniche road to the summit: three shafts standing 4 to 8 m beyond the left parapet, in front of the foot of the rock; a pavilion and flags at the end of its gangway
  { const [t] = TOWERS[2], s = A(1570), G = site(1570, -1, 9, { y: 0 }), ht = t + 1.5 - s.y, gang = 22; G.rotation.y += Math.PI; put(G, 'ascenseurPiliers', [0, 0, 0], [ht, gang]); clear(G, [3, 0, 0], 15); people(G, [[3, 13.6], [3.6, 14.6], [2.4, -13.8]], 0.6);
    const c = world(G, [-gang - 5, 0, 0]), S2 = grp(c[0], -c[2], G.rotation.y, t + 1.5); put(S2, 'pavillonPiliers', [0, 0.6, 0]); put(S2, 'toitPiliers', [0, 5.2, 0], [], 0, MAT.tile); clear(S2, [0, 0, 0], 9); for (const sd of [-1, 1]) flags(world(S2, [0, 8, 0]), world(G, [3, ht + 4.5, sd * 11]), 2, 8); }
  // along a cut face (the BANKS of scenery-piliers.js): a plank deck following the road at Y above it, from o1 to o2 metres beyond the wall (the bed it lies on is behind), a lattice rail, brackets every 12 m
  const bankWalk = (a, b, sd, Y, o1, o2) => { const i = idx(a), n = idx(b) - i, f = o => s => sd * (s.w + o); h.ribbon(i, n, f(o1), Y, f(o2), Y, MAT.plank, 4); h.ribbon(i, n, f(o1), Y - 0.5, f(o1), Y, MAT.steel, 4); h.ribbon(i, n, f(o1), Y, f(o1), Y + 1.2, MAT.rail, 1.2);
    for (let p = a + 6; p < b; p += 12) put(site(p, sd, o1, { y: Y }), 'consolePiliers'); };
  bankWalk(1022, 1128, -1, 5.2, 7.5, 14.6); bankWalk(2930, 3610, 1, 13.2, 11.5, 18);
  // their stairs: up from the footpath at each end, and from the walkway of the cut to a shrine on top of it
  for (const [p, sd, o, rise, run, back] of [[1013, -1, 8.8, 5.2, 9, 0], [1128, -1, 8.8, 5.2, 9, 1], [2908, 1, 13, 13.2, 22, 0], [3610, 1, 13, 13.2, 22, 1]]) put(site(p + (back ? run : 0), sd, o, { fwd: 1, y: 0 }), 'escalierPiliers', [0, 0, 0], [rise, run, 2.6], back ? Math.PI : 0);
  { const G = site(1075, -1, 9, { y: 5.2 }); put(G, 'escalierPiliers', [0, 0, 0], [5, 6, 2.6]); put(G, 'oratoirePiliers', [11, 5, 0]); roof(G, [11, 8.4, 0], 5.6, 5.6, 2, 0.9); clear(G, [10, 0, 0], 7); people(G, [[-0.4, 2]], 0.2); }
  for (const p of [3010, 3200, 3390, 3540]) people(site(p, 1, 13.5, { y: 13.3 }), [[0, 0], [0.5, 1.2]]);

  // --- the corniche: a rest pavilion on the open side after the cut, the tea house on the wide ledge, a lookout tower before the bridge
  { const G = site(1215, 1, 13); put(G, 'pavillonPiliers', [0, 0.6, 0]); put(G, 'toitPiliers', [0, 5.2, 0], [], 0, MAT.tile); clear(G, [0, 0, 0], 9); put(G, 'bancPiliers', [-6, 0.1, 3]); people(G, [[-5, -1], [1, 0.5]], 0.5); }
  { const G = site(1335, 1, 16); house(G, [0, 0, 0], 13, 8, 3.8); put(G, 'terrassePiliers', [-7.6, 0.3, 0], [13]); people(G, [[-7, 2.2], [-8, -4.4], [-6.5, -3.2]], 0.85); clear(G, [-8, 0, 0], 9); for (const z of [-7, 7]) put(G, 'lanternePiliers', [-11.5, 0, z]);
    for (const sd of [-1, 1]) { box(G, MAT.plank, [-11, 3.5, sd * 9], 0.25, 7, 0.25); flags(world(G, [0, 7.6, 0]), world(G, [-11, 7, sd * 9]), 0.8, 5); } }
  { const G = site(1640, 1, 12); put(G, 'tourGuetPiliers', [0, 0, 0], [15]); roof(G, [0, 18.2, 0], 7.6, 7.6, 2.4, 1); clear(G, [0, 0, 0], 8); people(G, [[1, 1], [-1.2, 0.4]], 15.2); put(G, 'bancPiliers', [-5, 0, 3]); }
  for (const p of [1772, 2098]) for (const sd of [-1, 1]) lantern(p, sd, 9.5); // lanterns at the two ends of the bridge, behind its anchor blocks

  // --- the cable car: from its station on the plateau at the east end of the bridge (PK 2 150, outside), the two ropes cross above the road and climb over the ravine to the summit of HERO, on two pylons standing on needles; cabins hang still
  { const s = A(2150), [x, z] = edgePt(s, -1, s.w + 26), y0 = g.hAt(x, z), HERO = TOWERS[5][0], B = [x, y0 + 8.6, z], E = [835, HERO + 11.6, -622], dx = E[0] - B[0], dz = E[2] - B[2], l = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx), nx = -dz / l * 4, nzz = dx / l * 4;
    const P = t => B.map((v, i) => v + (E[i] - v) * t), G0 = grp(x, -z, ry, y0), G1 = grp(E[0], -E[2], ry + Math.PI, HERO + 3);
    for (const G of [G0, G1]) { put(G, 'gareTelePiliers'); roofX(G, [0, 9.2, 0], 21, 17, 3.8, 1.3); } clearing(x, z, 16); clearing(E[0], E[2], 16); people(G0, [[9, 3], [9.5, 4.2], [10, -5], [3, 2]], 1.8);
    [0.33, 0.68].forEach((t, k) => { const c = P(t), top = c[1] - 21; needle(c[0], -c[2], 26, 26, top, 31 + k); clearing(c[0], c[2], 14); put(grp(c[0], -c[2], ry, top), 'pyloneTelePiliers', [0, 1, 0], [20]); });
    for (const sd of [-1, 1]) { const o = t => { const c = P(t); return [c[0] + sd * nx, c[1], c[2] + sd * nzz]; }; [0, 0.33, 0.68].forEach((t, k) => beam(o(t), o([0.33, 0.68, 1][k]), 0.45));
      for (const t of sd < 0 ? [0.2, 0.44, 0.58, 0.86] : [0.27, 0.5, 0.76, 0.93]) { const c = o(t); put(grp(c[0], -c[2], ry, c[1]), 'cabineTelePiliers').scale.setScalar(2.2); } } }

  // --- the summit temple, on the flat top of P5: a hall with two roofs and a seven-storey pagoda, broadside to the plateau road, which runs straight at them out of the tunnel; flags from the pagoda to four masts.
  // (HERO, the highest summit, is never in the racing camera: it only carries the upper station.)
  { const G = grp(1050, 262, -2.03, TOWERS[4][0] + 3); hall(G, [0, 0, -12], 30, 13, 6.5, 2, 'red'); const top = pagoda(G, [2, 0, 26], 11, 7, 5.5); clear(G, [0, 0, -12], 26); clear(G, [2, 0, 26], 18);
    for (const [fx, fz] of [[-12, 12], [16, 12], [-10, 40], [14, 40]]) { box(G, MAT.plank, [fx, 5, fz], 0.5, 10, 0.5); flags(world(G, [2, top, 26]), world(G, [fx, 10, fz]), 3, 8); } }

  // --- the ledge temple, PK 2 580 to 2 720, on the inside after the tunnel, at the end of the old service road: a stone terrace 2.2 m above the road and its stairway, lions, a gate hall, a red wall with a tiled coping,
  // a first court with the incense burner between two side halls, the main hall with two roofs, the pagoda at the back with flags to the four corners
  { const G = site(2645, 1, 10, { y: 0 }), y = 2.2, W = 21, X0 = 7, X1 = 64; box(G, MAT.stone, [(X0 + X1) / 2, y - 8, 0], X1 - X0, 16, 2 * W + 3); box(G, MAT.pave, [(X0 + X1) / 2, y, 0], X1 - X0 - 1, 0.2, 2 * W + 2);
    put(G, 'escalierPiliers', [1.2, 0, 0], [y, 5.8, 9]); for (let x = 10; x <= 60; x += 10) clear(G, [x, 0, 0], 30);
    for (const sd of [-1, 1]) { put(G, 'lionPiliers', [0.4, 0, sd * 6.3]).scale.setScalar(1.5); put(G, 'lanternePiliers', [8.6, y, sd * 5.4]);
      for (const [x, z, w, d] of [[X0 + 2, sd * (W + 7.5) / 2, 0.6, W - 7.5], [(X0 + X1) / 2 + 1, sd * W, X1 - X0 - 2, 0.6]]) { box(G, MAT.red, [x, y + 1.6, z], w, 3.2, d); box(G, MAT.tile, [x, y + 3.35, z], w + 0.7, 0.35, d + 0.7); }
      hall(G, [26, y, sd * 13.5], 13, 6.5, 3.6, 1, 'white', -sd * HP); }
    box(G, MAT.red, [X1 - 1, y + 1.6, 0], 0.6, 3.2, 2 * W); box(G, MAT.tile, [X1 - 1, y + 3.35, 0], 1.3, 0.35, 2 * W + 0.7);
    hall(G, [X0 + 4.5, y, 0], 13, 5.5, 4.2, 1, 'red'); put(G, 'encensoirPiliers', [22, y + 0.1, 0]); hall(G, [39, y, 0], 24, 11, 5.6, 2, 'red'); const top = pagoda(G, [55.5, y, 0], 7.5, 7, 3.6);
    for (const [fx, fz] of [[X0 + 2, W], [X0 + 2, -W], [X1 - 1, W], [X1 - 1, -W]]) flags(world(G, [55.5, top - 1, 0]), world(G, [fx, y + 3.6, fz]), 3, 9);
    people(G, [[16, 3], [16.8, 4.1], [20, -3], [24, 1.5], [30, -2], [30.8, -3], [18, -8], [4, 2.5], [2.5, -1]], y + 0.1); people(G, [[-3, 4], [-3.4, 5.2], [-4, -7]], 0.2); }
  for (let p = 2560; p < 2740; p += 24) lantern(p, 1);
  for (let k = 0; k < 3; k++) { const G = site(2590 + k * 12, 1, 6.5); put(G, 'etalPiliers', [0, 0, 0], [k]); clear(G, [0, 0, 0], 4.5); people(G, [[-2.2, 0.6 - k % 2]]); } // souvenir stalls before the temple stairs

  // --- the descent: the tea house at the foot of the buttress, where the ledge widens before the woods of the line
  { const G = site(3692, -1, 15); house(G, [0, 0, 0], 13, 8, 3.8); put(G, 'terrassePiliers', [-7.6, 0.3, 0], [13]); people(G, [[-7, 2.2], [-8, -4.4], [-6.5, -3.2]], 0.85); clear(G, [-8, 0, 0], 9); for (const z of [-7, 7]) put(G, 'lanternePiliers', [-11.5, 0, z]); }
};
