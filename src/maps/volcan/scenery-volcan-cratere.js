// "volcan", zone 4: Le Cratère (PK 3780 to 4890, 200 to 112 m): the road goes through the broken crown in two open cuttings and crosses the crater floor; no tunnel. set(), by() and slab() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
// The rock and the cuttings are the terrain (scenery-volcan.js). On the floor the road runs south with the lava lake on its left (east) and the cooled crust on its right (west).
(window.VOLCAN = window.VOLCAN || {}).cratere = ({ set, by, LAKE }) => {
  for (const sd of [-1, 1]) { by('orguesVolcan', [3990, 4030, 4070], sd, 5, { a: [38, 11] }); by('orguesVolcan', [4660, 4700, 4740], sd, 5, { a: [38, 10] }); } // basalt organ pipes at the foot of the banks, where each cutting is deepest
  set('cylVolcan', LAKE.x, LAKE.z, { y: LAKE.y - 1.4, m: 'lava', a: [LAKE.r - 1, LAKE.r - 1, 2.2, 18] }); // the lava lake lies level in its pit, east of the road
  [[8, 16], [-10, -16]].forEach(([dx, dz], i) => set('dalleVolcan', LAKE.x + dx, LAKE.z + dz, { y: LAKE.y + 0.85, m: 'crust', a: [6 + i * 2, 0.5, i, 8] })); // rafts of crust on the lake
  set('coneVolcan', -30, -850, { m: 'scoria', a: [12, 18, 2] });                                 // spatter cone south of the lake
  set('dalleVolcan', -192, -930, { m: 'crust', a: [24, 1.5, 6, 11] }); set('dalleVolcan', -186, -862, { m: 'crust', a: [16, 1.5, 7, 10] }); // cooled black crust on the west half
  [[-170, -900], [-204, -884], [-176, -968], [-160, -826]].forEach(([x, z], i) => set('rocherVolcan', x, z, { m: 'rock', a: [7, 5, 7, i + 3] })); // bombs thrown out by the vent
  [[-210, -905], [-72, -828], [-162, -990]].forEach(([x, z], i) => { set('vapeurVolcan', x, z, { m: 'steam', a: [24 - i * 3] }); set('rocherVolcan', x, z, { m: 'scoria', a: [6, 2, 6, i] }); }); // fumaroles, off the racing line
  by('posteVolcan', 4330, 1, 28, { a: [8, 4, 6, 12] }); by('capteurVolcan', [4270, 4390, 4450], 1, 6); // the hut of the observers: why the service road comes in here
};
