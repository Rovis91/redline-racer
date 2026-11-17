// "autoroute" blockout, zone 5: Le metro (PK 1908 to 2579): a straight double-track tunnel under row 2 (18 m between walls, floor at -8.5 m), the lane passes from one track to the other around the trains;
// at the station the tunnel has caved in, the way out is the passengers': across the platform (PK 2308), along the corridor and up the stairs to column -3 (PK 2417), then north to the boulevard.
// Only this zone's named blocks; helpers are described in scenery-autoroute.js. Labels are short: a board must fit under the 9 m ceiling.
(window.AUTOROUTE = window.AUTOROUTE || {}).metro = ({ put, spot, bar }) => {
  const TRAIN = 0x9aa4a0, RUBBLE = 0x7a756c, CONC = 0x8f8c82, RUST = 0x9a5a3a, OLIVE = 0x5a6240, Y = -8.5;
  put('RAME', TRAIN, 1995, 1, 1, 3, 3.6, 50, Y); put('RAME', TRAIN, 2081, -1, 1, 3, 3.6, 46, Y); put('EBOULIS', RUBBLE, 2167, 1, 0.5, 5, 3.5, 30, Y);
  for (const z of [212.5, 227.5]) spot('QUAI', CONC, -276, z, 68, 1.2, 3, Y);                      // the two platforms of the station
  spot('TUNNEL EFFONDRE', RUBBLE, -341, 221, 8, 9, 18, Y);                                         // the tracks go no further
  spot('SORTIE METRO', CONC, -330, 150, 18, 1, 40, 8.5);                                             // the canopy over the stairwell
  bar(-3, 1, 'E', 'EPAVES EMPILEES', RUST, 3); bar(-3, 1, 'W', 'BARRICADE', OLIVE, 3);             // column -3: the side streets up to the boulevard
};
