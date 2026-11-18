// "volcan", zone 4: Le Cratère (PK 3780 to 4890, 200 to 112 m): cutting, north gallery, crater floor, south gallery. set(), by(), slab() and gate() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
// The rock is the volcano of the terrain. The north gallery (PK 4000 to 4200) is the engine tunnel (M.tun); the south gallery (PK 4520 to 4780) is built here under the cone (one engine tunnel per map): no darkness, no echo.
// On the floor the road runs south with the lava lake on its left (east) and the cooled crust on its right (west).
(window.VOLCAN = window.VOLCAN || {}).cratere = ({ g, at, set, by, slab, gate, LAKE }) => {
  for (const sd of [-1, 1]) by('orguesVolcan', [3880, 3920, 3960], sd, 3, { a: [38, 12] });      // the cutting that leads down to the north mouth, lined with basalt organ pipes
  gate(3998, 1); gate(4202, -1); gate(4518, 1); gate(4782, -1);                                  // the four mouths, cut in the rock
  // south gallery: vault and side walls of rough rock, a lamp every 20 m, and above the vault the rock that fills the trench of the terrain up to the slope on either side
  for (let pk = 4526; pk < 4780; pk += 20) { const s = at(pk), top = Math.max(...[-1, 1].map(sd => g.hAt(s.x - s.tz * sd * 32, s.z + s.tx * sd * 32)));
    slab('gallery', pk, s.w * 2 + 23, 6, 21, 8.6); for (const sd of [-1, 1]) slab('gallery', pk, 10, 9, 21, 0, sd * (s.w + 6.5)); slab('cliff', pk, 66, Math.max(1, top - s.y - 14.6), 22, 14.6); slab('lamp', pk, 1.6, 0.25, 0.5, 8.3); }
  set('cylVolcan', LAKE.x, LAKE.z, { y: LAKE.y - 1, m: 'lava', a: [LAKE.r - 2, LAKE.r - 2, 2.2, 20] }); // the lava lake lies level in its pit, east of the road, which runs down along its shore
  [[10, 44], [38, -30], [22, 6]].forEach(([dx, dz], i) => set('dalleVolcan', LAKE.x + dx, LAKE.z + dz, { y: LAKE.y + 1.25, m: 'crust', a: [7 + i * 2, 0.5, i, 8] })); // rafts of crust on the lake
  by('rocherVolcan', [4240, 4285, 4330, 4375], -1, 4, { m: 'rock', a: [4, 1.2, 6], seed: 1 }); // the rock shore between the road and the lake
  set('coneVolcan', -20, -850, { m: 'scoria', a: [17, 26, 2] });                                 // spatter cone south of the lake
  set('dalleVolcan', -222, -960, { m: 'crust', a: [40, 2, 6, 11] }); set('dalleVolcan', -212, -840, { m: 'crust', a: [28, 2, 7, 10] }); // cooled black crust on the west half
  [[-190, -900], [-240, -870], [-205, -1000], [-250, -930], [-185, -820]].forEach(([x, z], i) => set('rocherVolcan', x, z, { m: 'rock', a: [9, 7, 9, i + 3] })); // bombs thrown out by the vent
  [[-230, -905], [-70, -790], [-180, -1020]].forEach(([x, z], i) => { set('vapeurVolcan', x, z, { m: 'steam', a: [24 - i * 3] }); set('rocherVolcan', x, z, { m: 'scoria', a: [6, 2, 6, i] }); }); // fumaroles, off the racing line
  by('posteVolcan', 4300, 1, 30, { a: [8, 4, 6, 12] }); by('capteurVolcan', [4240, 4360, 4440], 1, 6); // the hut of the observers: why the service road comes in here
};
