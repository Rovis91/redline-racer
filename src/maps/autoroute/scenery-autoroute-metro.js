// "autoroute" blockout, zone 5: Le metro (PK 1877 to 2553): a straight double-track tunnel under row 2 (18 m between walls, floor at -8.5 m), the lane passes from one track to the other around the trains.
// At the station (PK 2177) a train stands at the platform: the lane climbs a heap of rubble onto the north platform (-7.3 m), runs along it, turns into the passenger corridor (PK 2314)
// and goes up the stairs to column -3 (PK 2389), then north to the boulevard. The tunnel itself goes on west past the corridor, tracks and platform, closed by a derailed train.
// Only this zone's named blocks; helpers are described in scenery-autoroute.js. Labels are short: a board must fit under the 9 m ceiling.
(window.AUTOROUTE = window.AUTOROUTE || {}).metro = ({ h, put, spot, bar }) => {
  const TRAIN = 0x9aa4a0, RUBBLE = 0x7a756c, CONC = 0x8f8c82, RUST = 0x9a5a3a, OLIVE = 0x5a6240, Y = -8.5;
  put('RAME', TRAIN, 1974, 1, 1, 3, 3.6, 46, Y); put('RAME', TRAIN, 2053, -1, 1, 3, 3.6, 46, Y); put('EBOULIS', RUBBLE, 2141, 1, 0.5, 5, 3.5, 30, Y);
  put('GRAVATS', RUBBLE, 2197, -1, 0.5, 6, 2.5, 12, Y);                                            // the heap the lane climbs to the platform
  spot('QUAI', CONC, -373, 206.5, 254, 1.1, 15, Y, 1);                                             // the north platform: the lane runs on it, and it goes on west
  spot('RAME', TRAIN, -292, 221, 64, 3.6, 3, Y);                                                   // the train stopped at the platform
  // the tunnel beyond the corridor, 170 m more: track bed, walls, ceiling; a train derailed across the platform closes it, another stands further on
  const dark = h.mat('paint', { c: 0x4a5a52 }), bed = h.mat('paint', { c: 0x33383a });
  h.pose('boxMesh', bed, h.scene, [-420, Y - 0.25, 221.5], 180, 0.5, 15); h.pose('boxMesh', dark, h.scene, [-420, 0.75, 214], 180, 0.5, 31);
  for (const z of [198.75, 229.25]) h.pose('boxMesh', dark, h.scene, [-420, -4, z], 180, 9.5, 0.5); h.pose('boxMesh', bed, h.scene, [-510, -4, 214], 0.5, 9.5, 31);
  PLACERS.block(h, 'RAME', TRAIN, 40, 3.6, 3, -364, Y, 211, 0.35); spot('RAME', TRAIN, -440, 224, 70, 3.6, 3, Y);
  spot('SORTIE METRO', CONC, -330, 152, 18, 1, 44, 8.5);                                           // the canopy over the stairwell
  bar(-3, 1, 'E', 'EPAVES EMPILEES', RUST, 3); bar(-3, 1, 'W', 'BARRICADE', OLIVE, 3);             // column -3: the side streets up to the boulevard
};
