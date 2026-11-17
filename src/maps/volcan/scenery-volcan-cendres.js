// "volcan" blockout, zone 5: Les Cendres (PK 4700 to 6220, 177 to 40 m). Only this zone's named blocks; put() and abs() are described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).cendres = ({ put, abs }) => {
  const ASH = 0x65635d, RUST = 0xa05f50, OLIVE = 0x677658, CREAM = 0xe8d9ac, BLACK = 0x2c2e30;
  for (let pk = 4800; pk < 6200; pk += 140) { put('TERRASSE', BLACK, pk, 1, 18, 3, 3, 40); put('', BLACK, pk, 1, 40, 3, 5, 40); } // stepped black stone walls up the ash slope
  [[421, -494], [445, -809]].forEach(([x, z]) => [[0, 0, CREAM], [26, 10, RUST], [-8, 30, CREAM]].forEach(([a, b, c], i) => abs(i ? 'MAISON' : 'HAMEAU', c, x + a, z + b, 12, 8, 14))); // the two hamlets of the plan, away from the apexes
  for (const pk of [4950, 5470, 5980]) put('PARCELLE', OLIVE, pk, 1, 24, 14, 1.5, 36);    // small cultivated plots between two terraces
  for (const pk of [5200, 5750]) put('SOUTENEMENT', ASH, pk, -1, 10, 5, 1, 40);           // retaining walls under the ledge, outside the bends
  for (const pk of [5000, 5650]) put('ARBUSTES', OLIVE, pk, -1, 5, 6, 3, 10);
};
