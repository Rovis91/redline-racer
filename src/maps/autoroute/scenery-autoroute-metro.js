// "autoroute" blockout, zone 5: Le metro (PK 1908 to 2583): a straight double-track tunnel under row 2 (18 m between walls, floor at -8.5 m), the lane passes from one track to the other around the trains.
// At the station (PK 2208) the tracks are blocked by a train and the tunnel has caved in beyond: the lane climbs a heap of rubble onto the north platform (-7.3 m), runs along it,
// turns into the passenger corridor (PK 2344) and goes up the stairs to column -3 (PK 2419), then north to the boulevard.
// Only this zone's named blocks; helpers are described in scenery-autoroute.js. Labels are short: a board must fit under the 9 m ceiling.
(window.AUTOROUTE = window.AUTOROUTE || {}).metro = ({ put, spot, bar }) => {
  const TRAIN = 0x9aa4a0, RUBBLE = 0x7a756c, CONC = 0x8f8c82, RUST = 0x9a5a3a, OLIVE = 0x5a6240, Y = -8.5;
  put('RAME', TRAIN, 2005, 1, 1, 3, 3.6, 46, Y); put('RAME', TRAIN, 2084, -1, 1, 3, 3.6, 46, Y); put('EBOULIS', RUBBLE, 2172, 1, 0.5, 5, 3.5, 30, Y);
  put('GRAVATS', RUBBLE, 2228, -1, 0.5, 6, 2.5, 12, Y);                                            // the heap the lane climbs to the platform
  spot('QUAI', CONC, -288, 206.5, 84, 1.1, 15, Y, 1);                                              // the north platform: the lane runs on it
  spot('RAME', TRAIN, -292, 221, 64, 3.6, 3, Y);                                                   // the train stopped at the platform
  spot('TUNNEL EFFONDRE', RUBBLE, -338, 221.5, 8, 9, 15, Y);                                       // the tracks go no further
  spot('SORTIE METRO', CONC, -330, 152, 18, 1, 44, 8.5);                                           // the canopy over the stairwell
  bar(-3, 1, 'E', 'EPAVES EMPILEES', RUST, 3); bar(-3, 1, 'W', 'BARRICADE', OLIVE, 3);             // column -3: the side streets up to the boulevard
};
