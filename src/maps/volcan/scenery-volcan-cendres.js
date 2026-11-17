// "volcan" blockout, zone 2: Les Cendres (PK 690 to 2210, 40 to 177 m), climbed. Only the named blocks of this zone; put() and abs() are described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).cendres = ({ put, abs }) => {
  const ASH = 0x65635d, RUST = 0xa05f50, OLIVE = 0x677658, CREAM = 0xe8d9ac, BLACK = 0x2c2e30;
  for (let pk = 720; pk < 2120; pk += 140) { put('TERRASSE', BLACK, pk, -1, 26, 3, 3, 40); put('', BLACK, pk, -1, 48, 3, 5, 40); } // stepped black stone walls up the ash slope
  [[421, -494], [445, -809]].forEach(([x, z]) => [[0, 0, CREAM], [26, 10, RUST], [-8, 30, CREAM]].forEach(([a, b, c], i) => abs(i ? 'MAISON' : 'HAMEAU', c, x + a, z + b, 12, 8, 14))); // the two hamlets of the plan, away from the apexes
  for (const pk of [926, 1436, 1956]) put('PARCELLE', OLIVE, pk, -1, 24, 14, 1.5, 36); // small cultivated plots between two terraces
  for (const pk of [1156, 1706]) put('SOUTENEMENT', ASH, pk, 1, 10, 5, 1, 40);         // retaining walls under the ledge, outside the bends
  for (const pk of [1256, 1906]) put('ARBUSTES', OLIVE, pk, 1, 5, 6, 3, 10);
};
