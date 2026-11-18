// "volcan", zone 4: Le Cratère (PK 3780 to 4890, 200 to 112 m): the road goes through the wall of the crater in two basalt galleries and crosses its floor; the rim stays whole. set(), by(), slab(), line(), drape() and scatter() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
// The rock, the trench of the galleries, their lid and headwalls are the terrain (scenery-volcan.js). The north gallery is the engine tunnel (M.tun); the south-west one is built here.
// On the floor the road runs south with the lava lake on its left (east) and the cooled crust on its right (west).
(window.VOLCAN = window.VOLCAN || {}).cratere = ({ h, set, by, slab, strip, gal, beside, drape, scatter, MAT, LAKE }) => {
  const pkOf = i => i / h.N * 6578, [g0, g1] = gal[1];
  // portal(i): a mouth at sample i, a plain concrete frame against the basalt headwall of the terrain (lid() of scenery-volcan.js): two piers and a deep lintel
  const portal = i => { for (const sd of [-1, 1]) slab('concrete', pkOf(i), 2.5, 9.5, 3, 0, sd * (h.S[i].w + 1.25)); slab('concrete', pkOf(i), h.S[i].w * 2 + 5, 3.2, 3, 6.3); };
  gal.flat().forEach(portal);
  // south-west gallery, the same section as the engine tunnel of the north one (walls 5.5 m, vault 2.5 m): basalt walls and vault, a lamp every 24 m
  for (const sd of [-1, 1]) strip(g0, g1, s => [[sd * s.w, s.y - 0.3], [sd * s.w, s.y + 5.5]], MAT.gallery);
  strip(g0, g1, s => Array.from({ length: 11 }, (_, j) => [-s.w * Math.cos(Math.PI * j / 10), s.y + 5.5 + 2.5 * Math.sin(Math.PI * j / 10)]), MAT.vault);
  for (let i = g0 + 6; i < g1; i += 12) slab('lamp', pkOf(i), 1.6, 0.25, 0.5, 7.6);
  // basalt organ pipes on both banks of the approach to each mouth, against the headwall
  gal.flat().forEach((i, k) => { for (const sd of [-1, 1]) by('orguesVolcan', pkOf(i) + (k % 2 ? 14 : -14), sd, 4, { a: [22, 10] }); });
  scatter(3780, 4890, 'crust', 18);
  drape('snow', [[-34, 16, 6], [-10, 26, 11], [14, 22, 9], [36, 14, 4]].map(([d, off, w]) => [...beside(3900 + d, 1, off), w]), 1);
  set('cylVolcan', LAKE.x, LAKE.z, { y: LAKE.y - 1.4, m: 'lava', a: [LAKE.r - 1, LAKE.r - 1, 2.2, 18] }); // the lava lake lies level in its pit, east of the road
  [[8, 16], [-10, -16]].forEach(([dx, dz], i) => set('dalleVolcan', LAKE.x + dx, LAKE.z + dz, { y: LAKE.y + 0.85, m: 'crust', a: [6 + i * 2, 0.5, i, 8] })); // rafts of crust on the lake
  set('coneVolcan', -30, -850, { m: 'scoria', a: [12, 18, 2] });                                 // spatter cone south of the lake
  drape('crust', [[-205, -985, 16], [-196, -940, 26], [-190, -895, 22], [-196, -850, 14]], 2.2); // cooled black crust on the west half, a flow frozen along the road
  drape('crust', [[-160, -1010, 9], [-150, -975, 13], [-148, -945, 8]], 1.6);
  [[-170, -900], [-204, -884], [-176, -968], [-160, -826], [-150, -930], [-95, -990], [-92, -872]].forEach(([x, z], i) => set('rocherVolcan', x, z, { m: 'rock', a: [5 + i % 3 * 2, 4 + i % 2 * 2, 6, i + 3] })); // bombs thrown out by the vent
  // fumaroles on both sides of the road, 15 to 60 m from it: a plume on a small slag mound
  [[-210, -905, 24], [-72, -828, 20], [-162, -990, 18], [-150, -880, 14], [-96, -1000, 16], [-178, -838, 22], [-84, -905, 12]].forEach(([x, z, ht], i) => { set('vapeurVolcan', x, z, { m: 'steam', a: [ht, 1.3, i] }); set('rocherVolcan', x, z, { m: 'scoria', a: [6, 2, 6, i] }); });
  by('posteVolcan', 4330, 1, 15, { a: [8, 4, 6, 12] }); by('capteurVolcan', [4270, 4300, 4390, 4420, 4450], 1, 4); // the hut of the observers: why the service road comes in here
  by('torfVolcan', 4395, 1, 16, { a: [8, 6, 'yellow'] });
};
