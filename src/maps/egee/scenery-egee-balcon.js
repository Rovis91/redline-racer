// "egee" blockout, zone 4: Balcon (PK 2800 to 3500, 171 to 123 m, 12-14 m wide). Only this zone's named blocks; put() is described in scenery-egee.js.
(window.EGEE = window.EGEE || {}).balcon = ({ put }) => {
  const WHITE = 0xf6eedb, ROCK = 0x7d6e60, CAPE = 0xc19a6e, GREEN = 0x4f6a50;
  put('MOULIN', WHITE, 2900, -1, 40, 9, 16, 9);                                   // hero landmark on the high point, off the road
  for (const pk of [3100, 3360]) put('HAUTES ROCHES', ROCK, pk, -1, 6, 25, 20, 70); // island side: high rocks; the sea side stays empty
  for (const pk of [3000, 3280]) put('CAP', CAPE, pk, 1, 25, 50, 40, 60);           // capes below the road: silhouettes over the water, under the horizon line
  for (const pk of [3200, 3440]) put('CYPRES', GREEN, pk, -1, 8, 4, 12, 4);
};
