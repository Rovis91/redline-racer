// "volcan" blockout, zone 4: Le Cratère (PK 3780 to 4890, 200 to 112 m): north gallery, open crater, south gallery. Only the named blocks of this zone; put(), abs() and over() are described in scenery-volcan.js.
// The rock is the cone of the terrain. The north gallery is the engine tunnel (M.tun); the south gallery is made of blocks under the cone (one engine tunnel per map): no darkness, no echo.
(window.VOLCAN = window.VOLCAN || {}).cratere = ({ put, abs, over, at }) => {
  const ROCK = 0x555a60, NIGHT = 0x23292d, BASALT = 0x34373d, COAL = 0x22272a, SCORIA = 0x9b5348, STEAM = 0xadadb0, CONCRETE = 0xb8b5a6;
  [['GALERIE NORD', 3832], ['CRATERE', 4206], ['GALERIE SUD', 4514], ['SORTIE SUD', 4896]].forEach(([label, pk]) => over(label, ROCK, pk, at(pk).w * 2 + 30, 6, 4, 9));
  for (let pk = 4516; pk < 4900; pk += 20) { const w = at(pk).w; over('', NIGHT, pk, w * 2 + 23, 6, 21, 9); for (const sd of [-1, 1]) over('', BASALT, pk, 10, 9, 21, 0, sd * (w + 6.5)); } // south gallery: roof and side walls
  abs('CHEMINEE', COAL, -50, -905, 26, 40, 26);                                        // the old vent, beside the road across the crater floor
  abs('FUMEROLLE', STEAM, -205, -955, 5, 26, 5); abs('FUMEROLLE', STEAM, -45, -825, 5, 20, 5); // faint, off the racing line
  abs('SCORIES', SCORIA, -200, -880, 30, 8, 30);
  put('POSTE DE MESURE', CONCRETE, 4300, 1, 12, 8, 5, 10);                             // the hut of the observers: why the service road comes in here
};
