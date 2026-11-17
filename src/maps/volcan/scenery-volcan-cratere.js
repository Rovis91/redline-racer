// "volcan" blockout, zone 4: Le Cratère (PK 3780 to 4890, 200 to 112 m): cutting, north gallery, crater floor, south gallery. Only the named blocks of this zone; put(), abs(), over(), row() and lot() are described in scenery-volcan.js.
// The rock is the volcano of the terrain. The north gallery (PK 4000 to 4200) is the engine tunnel (M.tun); the south gallery (PK 4520 to 4780) is made of blocks under the cone (one engine tunnel per map): no darkness, no echo.
// On the floor the road runs south with the lava lake on its left (east) and the cooled crust on its right (west).
(window.VOLCAN = window.VOLCAN || {}).cratere = ({ g, put, abs, over, at, row, lot, LAKE }) => {
  const GROUND = 0x6a5d52, ROCK = 0x555a60, NIGHT = 0x23292d, BASALT = 0x34373d, LAVA = 0xf0641e, GLOW = 0xffb347, CRUST = 0x1c1c1e, SCORIA = 0x9b5348, STEAM = 0xadadb0, CONCRETE = 0xb8b5a6, STEEL = 0x555a60;
  [['GALERIE NORD', 3996], ['CRATERE', 4206], ['GALERIE SUD', 4516], ['SORTIE SUD', 4784]].forEach(([label, pk]) => over(label, ROCK, pk, at(pk).w * 2 + 30, 6, 4, 9));
  for (const sd of [-1, 1]) row(sd < 0 ? 'TRANCHEE' : '', ROCK, [3880, 3920, 3960], sd, 3, 8, 10, 36);        // the cutting that leads down to the north mouth
  // south gallery: side walls, roof, and above it the rock that fills the trench of the terrain up to the slope on either side
  for (let pk = 4526; pk < 4780; pk += 20) { const s = at(pk), top = Math.max(...[-1, 1].map(sd => g.hAt(s.x - s.tz * sd * 32, s.z + s.tx * sd * 32)));
    over('', NIGHT, pk, s.w * 2 + 23, 6, 21, 9); for (const sd of [-1, 1]) over('', BASALT, pk, 10, 9, 21, 0, sd * (s.w + 6.5)); over('', GROUND, pk, 66, Math.max(1, top - s.y - 15), 22, 15); }
  abs('LAC DE LAVE', [LAVA, 'cyl'], LAKE.x, LAKE.z, LAKE.r * 2 - 8, 1.5, LAKE.r * 2 - 8);                      // the lava lake lies level in its pit, east of the road, which runs down along its shore
  lot('', [GLOW, 'cyl'], [[LAKE.x + 18, LAKE.z + 5], [LAKE.x - 27, LAKE.z - 30]], 30, 1.9, 30); lot('CROUTE', [CRUST, 'cyl'], [[LAKE.x - 12, LAKE.z + 42], [LAKE.x + 36, LAKE.z - 32], [LAKE.x - 44, LAKE.z + 2], [LAKE.x + 26, LAKE.z + 36]], 22, 2.2, 22); // brighter upwellings and rafts of crust on the lake
  row('', BASALT, [4240, 4270, 4300, 4330, 4360], -1, 3, 4, 1.5, 8);                                // the rock shore between the road and the lake (unnamed: too close to the roadway for a plate)
  abs('CONE DE SCORIES', [SCORIA, 'cone'], -20, -850, 34, 26, 34);                                            // spatter cone south of the lake
  abs('LAVE FIGEE', CRUST, -222, -960, 60, 3, 90); abs('', CRUST, -210, -840, 50, 3, 60);                     // cooled black crust on the west half
  lot('BLOC', BASALT, [[-190, -900], [-240, -870], [-205, -1000], [-250, -930], [-185, -820]], 9, 7, 9);       // bombs thrown out by the vent
  lot('FUMEROLLE', [STEAM, 'cyl'], [[-230, -905], [-70, -790], [-180, -1020]], 5, 26, 5);                      // faint, off the racing line
  abs('GRADIN', GROUND, -306, -906, 22, 2, 30);                                                               // names the bench of the west wall: the level of an older lake
  put('POSTE DE MESURE', CONCRETE, 4300, 1, 26, 8, 5, 10); put('ANTENNE', [STEEL, 'cyl'], 4312, 1, 28, 1, 16, 1); row('', STEEL, [4240, 4360, 4440], 1, 6, 1.5, 2, 1.5); // the hut of the observers: why the service road comes in here
};
