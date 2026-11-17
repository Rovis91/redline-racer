// "autoroute" blockout, zone 4: La rue detruite (PK 1814 to 2084, heading west): a wrecked street, one chicane, then no way through: the road dives into the metro (cutting from PK 1934, tunnel at PK 2084).
// Only this zone's named blocks; put() is described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).impasse = ({ put }) => {
  const BRICK = 0x8a5a48, STONE = 0xa89a80, RUST = 0x9a5a3a, RUBBLE = 0x7a756c, CONC = 0x8f8c82, TREE = 0x5a8a40;
  for (const pk of [1840, 1900, 1960, 2020]) { put('IMMEUBLE EVENTRE', BRICK, pk, -1, 10, 22, 20, 46); put('IMMEUBLE EVENTRE', STONE, pk + 20, 1, 10, 22, 16, 46); }
  put('DECOMBRES', RUBBLE, 1958, -1, 0.5, 9, 4, 12); put('EPAVE', RUST, 1850, 1, 1.5, 2.5, 1.6, 5); put('EPAVE', RUST, 1880, -1, 1.5, 2.5, 1.6, 5); put('ARBRE', TREE, 1905, 1, 3, 6, 14, 6);
  for (const sd of [-1, 1]) put('BOUCHE DE METRO', CONC, 1990, sd, 0.5, 3, 4, 14);                 // the top of the cutting
  put('EBOULIS', RUBBLE, 2100, -1, -26, 40, 14, 26, 1.5);                                          // the street is buried above the tunnel mouth: the only way on is down
};
