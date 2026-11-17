// "volcan" blockout, zone 2: Les Cendres (PK 690 to 2210, 40 to 177 m), climbed. Only the named blocks of this zone; put(), abs(), over(), row() and lot() are described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).cendres = ({ put, abs, row, lot }) => {
  const ASH = 0x65635d, RUST = 0xa05f50, OLIVE = 0x677658, CREAM = 0xe8d9ac, BLACK = 0x2c2e30, WHITE = 0xf4efe2, GREEN = 0x4f6a50, BASALT = 0x34373d;
  const steps = []; for (let pk = 720; pk < 2120; pk += 140) steps.push(pk);
  row('TERRASSE', BLACK, steps, -1, 26, 3, 3, 40); row('', BLACK, steps, -1, 48, 3, 5, 40); row('', BLACK, steps, -1, 72, 3, 7, 40); // three steps of black stone walls up the ash slope
  row('VIGNE', OLIVE, steps.map(pk => pk + 4), -1, 31, 14, 1.2, 32);                                          // vines on the first step
  row('PARCELLE', GREEN, [926, 1436, 1956], -1, 24, 14, 1.5, 36);                                             // small cultivated plots between two terraces
  for (const [x, z] of [[421, -494], [445, -809]]) {                                                          // the two hamlets of the plan, away from the apexes
    lot('HAMEAU', CREAM, [[x, z], [x - 8, z + 30], [x + 44, z - 14]], 12, 8, 14); lot('', RUST, [[x + 26, z + 10], [x + 18, z - 26], [x - 30, z + 4]], 12, 7, 12);
    abs('CHAPELLE', WHITE, x + 4, z - 52, 8, 10, 12); abs('', WHITE, x + 4, z - 60, 4, 18, 4); abs('CITERNE', [ASH, 'cyl'], x - 34, z - 24, 8, 5, 8);
    lot('', [GREEN, 'cone'], [[x + 50, z + 20], [x - 26, z + 40], [x + 24, z + 44]], 6, 9, 6); }
  row('ARBUSTES', [OLIVE, 'cone'], [800, 1000, 1256, 1500, 1906, 2100], 1, 2, 5, 4, 5);
  row('EBOULIS', BASALT, [860, 1300, 1640, 2040], -1, 4, 7, 4, 9); row('', BASALT, [868, 1310, 1650, 2050], -1, 9, 5, 3, 6); // fallen rock at the foot of the slope, off the roadway
  row('MURET', CREAM, [1040, 1580, 2160], 1, 1, 1.5, 1.2, 60);
};
