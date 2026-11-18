// "autoroute", zone 5: Le metro (PK 1877 to 2553): a straight double-track tunnel under row 2 (18 m between walls, floor at -8.5 m), the lane passes from one track to the other around the trains.
// At the station (PK 2177) a train stands at the platform: the lane climbs a heap of rubble onto the north platform (-7.3 m), runs along it, turns into the passenger corridor (PK 2314)
// and goes up the stairs to column -3 (PK 2389), then north to the boulevard. The tunnel itself goes on west past the corridor, tracks and platform, closed by a derailed train.
// Only what this zone adds, by the names of the blockout (real() in scenery-autoroute.js turns each into its scenery); helpers are described in scenery-autoroute.js. Labels are short: a board must fit under the 9 m ceiling.
(window.AUTOROUTE = window.AUTOROUTE || {}).metro = ({ put, spot, bar, slab, set, ext, at, MAT }) => {
  // what makes it a metro: two tracks the whole length, 4.55 m either side of the tunnel's axis (the lane drives over them, the trains stand on them), lamps on the tunnel walls,
  // and in the station a row of ceiling lights over the platform and its enamel name plates
  for (const z of [214.75, 216.15, 223.85, 225.25]) slab('steel', -180, -8.5, z, 660, 0.14, 0.12);
  for (let x = 70, k = 0; x > -200; x -= 24, k++) slab('lamp', x, -4, k & 1 ? 211.15 : 228.85, 1.6, 0.3, 0.15);
  for (let x = -226; x > -500; x -= 16) slab('lamp', x, -0.6, 206, 5, 0.12, 0.5);
  for (const x of [-262, -300, -380, -440]) slab('plaque', x, -4.6, 199.35, 8, 2, 0.15);
  const TRAIN = 0x9aa4a0, RUBBLE = 0x7a756c, CONC = 0x8f8c82, RUST = 0x9a5a3a, OLIVE = 0x5a6240, Y = -8.5;
  // trains: each on its track (N = 215.45, SO = 224.55), straight, on the side the lane leaves free; its flank is the wall of the lane
  const N = 215.45, SO = 224.55; spot('RAME', TRAIN, at(1974).x, N, 54, 3.6, 3, Y, 1); spot('RAME', TRAIN, at(2053).x, SO, 54, 3.6, 3, Y, 1); spot('RAME', TRAIN, at(2132).x, N, 36, 3.6, 3, Y, 1); put('EBOULIS', RUBBLE, 2166, 1, 0.2, 5, 3.5, 18, Y);
  put('GRAVATS', RUBBLE, 2197, -1, 0.2, 6, 2.5, 12, Y);                                            // the heap the lane climbs to the platform
  spot('QUAI', CONC, -373, 206.5, 254, 1.1, 15, Y, 1);                                             // the north platform: the lane runs on it, and it goes on west
  spot('RAME', TRAIN, -292, N, 54, 3.6, 3, Y, 1);                                                   // the train stopped at the platform
  // the tunnel beyond the corridor, 170 m more: track bed, walls, ceiling; a train derailed across the platform closes it, another stands further on
  slab('ballast', -413, Y - 0.5, 221.5, 194, 0.5, 15);
  ext(MAT.mur, -336, -510, [[199, -3.5], [199, Y]], 0); ext(MAT.mur, -316, -510, [[229, -3.5], [229, Y]], 0); slab('dark', -510, Y, 214, 0.5, 9.5, 31); // (the back wall starts west of the corridor mouth)
  for (const z of [198, 186, 174]) slab('lamp', -330, -7.3 + Math.max(0, 190 - z) * 0.14 + 4.2, z, 3, 0.12, 0.5);                 // the lights of the corridor and of the foot of the stairs
  spot('RAME', TRAIN, -364, 211, 40, 3.6, 3, Y + 1.2, 1, 0.35); set('portillonsAutoroute', -350, 203.5, { y: -7.3, ry: 0.35, a: [8] }); // (the turnstiles, pushed aside west of the corridor mouth) spot('RAME', TRAIN, -440, 224, 70, 3.6, 3, Y);
  for (const x of [-262, -286, -310]) slab('steel', x, -7.3, 200.2, 4, 0.5, 0.9);                    // benches against the back wall of the platform
  spot('SORTIE METRO', CONC, -330, 152, 18, 1, 44, 8.5);                                           // the canopy over the stairwell
  bar(-3, 1, 'E', 'EPAVES EMPILEES', RUST, 3); bar(-3, 1, 'W', 'BARRICADE', OLIVE, 3);             // column -3: the side streets up to the boulevard
};
