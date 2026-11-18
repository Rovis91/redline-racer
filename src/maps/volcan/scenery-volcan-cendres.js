// "volcan", zone 2: Les Cendres (PK 690 to 2210, 40 to 177 m), the moss slope, climbed. set(), by() and slab() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).cendres = ({ set, by }) => {
  for (let pk = 760, i = 0; pk < 2180; pk += 150, i++) by('cairnVolcan', pk, -1, 5, { a: [2.6, i] });  // the cairns of the old track, one every 150 m on the island side
  [[820, 26, 9], [900, 60, 14], [1090, 34, 7], [1220, 80, 16], [1390, 22, 8], [1530, 54, 12], [1700, 30, 9], [1840, 70, 15], [2010, 40, 10]].forEach(([pk, off, w], i) => by('rocherVolcan', pk, -1, off, { m: 'rock', a: [w, w * 0.55, w * 1.1, i] })); // isolated black boulders, never in rows
  for (const [x, z, ry] of [[421, -494, 0.3], [445, -809, -0.5]]) {                              // the two farms of the plan, away from the apexes: a few small coloured cabins and a sheep fence
    [[0, 0, 'red', 0], [22, 14, 'yellow', 1.5], [-20, 20, 'blue', 0.4], [10, -24, 'green', -0.3]].forEach(([dx, dz, c, r], i) => set('maisonVolcan', x + dx, z + dz, { ry: ry + r, a: [8 + (i & 1) * 2, 3.6 + (i % 3) * 0.5, 7, c] }));
    [[0, 40, 0], [30, -6, 1.57], [-36, -4, 1.57]].forEach(([dx, dz, r]) => set('clotureVolcan', x + dx, z + dz, { ry: ry + r, a: [36] })); }
  [[1560, 46, 16], [1720, 70, 22], [1880, 40, 18], [2040, 64, 24], [2150, 36, 16]].forEach(([pk, off, r], i) => by('dalleVolcan', pk, -1, off, { m: 'snow', a: [r, 0.5, i, 10] })); // snow lying in the hollows from 120 m up
};
