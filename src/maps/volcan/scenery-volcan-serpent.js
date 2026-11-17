// "volcan" blockout, zone 2: Le Serpent (PK 970 to 2020, 27 to 97 m). Only this zone's named blocks; put() is described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).serpent = ({ put }) => {
  const BASALT = 0x34373d, SLATE = 0x555a60, FOAM = 0xd9e9e7;
  for (const pk of [1060, 1260, 1460, 1660, 1860]) put('PAROI DE BASALTE', BASALT, pk, 1, 5, 30, 32, 120); // island side: the rock wall; the sea side stays open
  for (const pk of [1160, 1560]) put('ORGUES', SLATE, pk, 1, 4, 12, 44, 40);                                // basalt columns standing out of the wall
  for (const pk of [1100, 1400, 1700, 1950]) put('MUR PORTEUR', SLATE, pk, -1, 10, 6, 1, 60);               // retaining wall on the cliff under the ledge, sea side: the road is carried, not floating
  for (const pk of [1300, 1800]) put('ECUME', FOAM, pk, -1, 70, 40, 1, 60, 0);                              // foam at the foot of the cliff
  put('EPERON', BASALT, 2000, 1, 5, 40, 40, 60);                                                            // transition: the spurs come forward, the galleries are needed
};
