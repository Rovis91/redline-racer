// "volcan" blockout, zone 4: Le Cratère (PK 3780 to 4890, 200 to 112 m): cutting, north gallery, crater floor, south gallery. Only the named blocks of this zone; put(), abs() and over() are described in scenery-volcan.js.
// The rock is the volcano of the terrain. The north gallery (PK 4000 to 4200) is the engine tunnel (M.tun); the south gallery (PK 4520 to 4780) is made of blocks under the cone (one engine tunnel per map): no darkness, no echo.
(window.VOLCAN = window.VOLCAN || {}).cratere = ({ g, put, abs, over, at }) => {
  const GROUND = 0x6a5d52, ROCK = 0x555a60, NIGHT = 0x23292d, BASALT = 0x34373d, LAVA = 0xf0641e, CRUST = 0x1c1c1e, SCORIA = 0x9b5348, STEAM = 0xadadb0, CONCRETE = 0xb8b5a6;
  [['GALERIE NORD', 3996], ['CRATERE', 4206], ['GALERIE SUD', 4516], ['SORTIE SUD', 4784]].forEach(([label, pk]) => over(label, ROCK, pk, at(pk).w * 2 + 30, 6, 4, 9));
  // south gallery: side walls, roof, and above it the rock that fills the trench of the terrain up to the slope on either side
  for (let pk = 4526; pk < 4780; pk += 20) { const s = at(pk), top = Math.max(...[-1, 1].map(sd => g.hAt(s.x - s.tz * sd * 32, s.z + s.tx * sd * 32)));
    over('', NIGHT, pk, s.w * 2 + 23, 6, 21, 9); for (const sd of [-1, 1]) over('', BASALT, pk, 10, 9, 21, 0, sd * (s.w + 6.5)); over('', GROUND, pk, 66, Math.max(1, top - s.y - 15), 22, 15); }
  abs('LAC DE LAVE', LAVA, -30, -905, 120, 1, 150);                                    // the lava lake fills the east half of the floor; the road runs along its shore
  abs('LAVE FIGEE', CRUST, -222, -960, 60, 3, 90); abs('LAVE FIGEE', CRUST, -210, -840, 50, 3, 60); // cooled black crust on the west half
  abs('CONE DE SCORIES', SCORIA, -15, -985, 30, 22, 30);                               // spatter cone on the lake shore
  abs('FUMEROLLE', STEAM, -230, -905, 5, 26, 5); abs('FUMEROLLE', STEAM, -70, -790, 5, 20, 5); abs('FUMEROLLE', STEAM, -180, -1020, 5, 18, 5); // faint, off the racing line
  put('POSTE DE MESURE', CONCRETE, 4300, 1, 12, 8, 5, 10);                             // the hut of the observers: why the service road comes in here
};
