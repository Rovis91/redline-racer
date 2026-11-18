// "volcan", zone 5: Le Cratère (PK 3480 to 4270, 158 to 140 to 112 m): the north gallery, the chicane across the floor of the caldera, the south-west gallery. This is what the expedition came for.
// The rock, the trench of the galleries, their lid and headwalls are the terrain (scenery-volcan.js). The north gallery is the engine tunnel (M.tun); the south-west one is built here.
// On the floor the road bends round the drilling rig (on its right, west); the lava lake lies further west, the cable climbs the south wall to the observatory on the rim, straight ahead.
// set(), by(), slab(), strip(), line(), scatter() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).cratere = ({ h, set, by, slab, strip, gal, range, line, scatter, track, MAT, LAKE }) => {
  const pkOf = i => i / h.N * 6230, [g0, g1] = gal[1];
  // portal(i): a mouth at sample i, a plain concrete frame against the basalt headwall of the terrain (lid() of scenery-volcan.js): two piers and a deep lintel
  const portal = i => { for (const sd of [-1, 1]) slab('concrete', pkOf(i), 2.5, 9.5, 3, 0, sd * (h.S[i].w + 1.25)); slab('concrete', pkOf(i), h.S[i].w * 2 + 5, 3.2, 3, 6.3); };
  gal.flat().forEach(portal);
  // south-west gallery, the same section as the engine tunnel of the north one (walls 5.5 m, vault 2.5 m): basalt walls and vault, a lamp every 24 m
  for (const sd of [-1, 1]) strip(g0, g1, s => [[sd * s.w, s.y - 0.3], [sd * s.w, s.y + 5.5]], MAT.gallery);
  strip(g0, g1, s => Array.from({ length: 11 }, (_, j) => [-s.w * Math.cos(Math.PI * j / 10), s.y + 5.5 + 2.5 * Math.sin(Math.PI * j / 10)]), MAT.vault);
  for (let i = g0 + 6; i < g1; i += 12) slab('lamp', pkOf(i), 1.6, 0.25, 0.5, 7.6);
  // basalt organ pipes on both banks of the approach to each mouth, against the headwall; a height sign before each
  gal.flat().forEach((i, k) => { for (const sd of [-1, 1]) by('orguesVolcan', pkOf(i) + (k % 2 ? 14 : -14), sd, 4, { a: [22, 10] }); });
  const a0 = pkOf(gal[0][1]) + 20, a1 = pkOf(g0) - 20;                                             // the open floor, between the two inner mouths
  // the drilling rig inside the chicane: the reason the road bends; its generator container, pipe store, a vehicle, the crew shelter
  const mid = (a0 + a1) / 2; by('derrickVolcan', mid, 1, 24, { a: [26] }); by('conteneurVolcan', mid - 26, 1, 12, { a: [6, 'orange'] }); by('conteneurVolcan', mid + 30, 1, 14, { a: [6, 'white'] });
  by('chenilleVolcan', mid + 20, 1, 8, { turn: 0.4 }); by('futsVolcan', mid - 16, 1, 9, { a: [8] }); by('domeVolcan', mid - 36, 1, 16, { m: 'yellow', a: [3.4] }); by('panneauVolcan', a0 + 6, 1, 1.6, { a: ['orange', 1.8] });
  // the lava lake, level in its pit outside the second bend: rafts of crust; a cordon of stakes round it and gas sensors on its bank
  set('cylVolcan', LAKE.x, LAKE.z, { y: LAKE.y - 1.4, m: 'lava', a: [LAKE.r - 1, LAKE.r - 1, 2.2, 18] });
  [[8, 12], [-10, -12], [-4, 6]].forEach(([dx, dz], i) => set('dalleVolcan', LAKE.x + dx, LAKE.z + dz, { y: LAKE.y + 0.85, m: 'crust', a: [5 + i * 2, 0.5, i, 8] }));
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = LAKE.r + 15; set(i % 4 ? 'piquetVolcan' : 'capteurVolcan', LAKE.x + Math.cos(a) * r, LAKE.z + Math.sin(a) * r, { ry: -a }); }
  // steam vents on the floor south of the lake and west of the rig, each on its mound of scoria, each watched by a sensor; the cable of the instruments runs to them on trestles
  const VENTS = [[-52, -836, 20], [-18, -850, 15], [-64, -808, 17], [-70, -972, 14], [-196, -930, 18], [-204, -890, 13]];
  VENTS.forEach(([x, z, ht], i) => { set('vapeurVolcan', x, z, { m: 'steam', a: [ht, 1.3, i] }); set('rocherVolcan', x, z, { m: 'scoria', a: [6, 2, 6, i] }); set('capteurVolcan', x + 5, z + 3, {}); });
  set('coneVolcan', 22, -952, { m: 'scoria', a: [12, 16, 2] });                                   // a spatter cone behind the vents
  // the cable: from the camp it comes out of the north gallery, follows the road to the junction box at the rig, then climbs the south wall on small pylons to the observatory hut on the rim, a white dome on a platform
  line(range(a0 + 4, mid - 40, 9), 1, 2, 'treteauVolcan', [], [['dark', 0.12, 0, 0.98]]);
  line([[-72, -842], [-88, -806], [-106, -772], [-126, -742], [-149, -713]], 0, 0, 'pyloneVolcan', [7], [['dark', 0.1, 0, 6.7]]);
  set('observatoireVolcan', -149, -706, { ry: 3.14 }); set('domeVolcan', -146, -706, { dy: 0.9, m: 'trim', a: [2.8] });
  // blocks fallen from the walls lie at the foot of the scree, largest near the wall
  [[-196, -1000, 9], [-60, -1010, 7], [-30, -990, 10], [-206, -850, 8], [-40, -822, 9], [-90, -812, 6], [-214, -940, 7]].forEach(([x, z, w], i) => set('rocherVolcan', x, z, { m: 'rock', a: [w, w * 0.7, w, i + 3] }));
  scatter(a0, a1, 'crust', 22);
};
