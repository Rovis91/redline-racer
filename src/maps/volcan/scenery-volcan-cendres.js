// "volcan", zone 2: Les Cendres (PK 690 to 2210, 40 to 177 m), the moss slope, climbed. set(), by(), slab(), line(), drape() and scatter() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).cendres = ({ set, by, beside, frac, drape, scatter }) => {
  scatter(690, 2210);                                                                             // the lava field at the roadside: moss hummocks and black boulders, both sides
  for (let pk = 760, i = 0; pk < 2180; pk += 150, i++) by('cairnVolcan', pk, -1, 7, { a: [3.2, i] }); // the cairns of the old track, one every 150 m on the island side
  [[820, 26, 9], [900, 60, 14], [1090, 34, 7], [1220, 80, 16], [1390, 22, 8], [1530, 54, 12], [1700, 30, 9], [1840, 70, 15], [2010, 40, 10]].forEach(([pk, off, w], i) => by('rocherVolcan', pk, -1, off, { m: 'rock', a: [w, w * 0.55, w * 1.1, i] })); // isolated black boulders, never in rows
  // old lava flows come down the slope to the road: black tongues through the moss, from 150 m up to the verge
  for (const [pk, k] of [[790, 0], [1150, 1], [1500, 0], [1960, 1]]) drape('crust', [[150, 18], [100, 15], [60, 16], [30, 11], [9, 7]].map(([off, w], j) => [...beside(pk + j * (k ? -9 : 12), -1, off), w]), 3);
  for (const [x, z, ry] of [[421, -494, 0.3], [445, -809, -0.5]]) {                              // the two farms of the plan, away from the apexes: a few small coloured cabins and a sheep fence
    [[0, 0, 'red', 0], [22, 14, 'yellow', 1.5], [-20, 20, 'blue', 0.4], [10, -24, 'green', -0.3]].forEach(([dx, dz, c, r], i) => set('maisonVolcan', x + dx, z + dz, { ry: ry + r, a: [8 + (i & 1) * 2, 3.6 + (i % 3) * 0.5, 7, c] }));
    [[0, 40, 0], [30, -6, 1.57], [-36, -4, 1.57]].forEach(([dx, dz, r]) => set('clotureVolcan', x + dx, z + dz, { ry: ry + r, a: [36] })); }
  // crofts at the roadside: a turf hut, a fence along the road and a few sheep behind it
  [[980, 'red'], [1330, 'yellow'], [1660, 'blue'], [2090, 'red']].forEach(([pk, c], n) => { by('torfVolcan', pk, -1, 13, { a: [10, 6.5, c] }); by('clotureVolcan', [pk - 46, pk + 46], -1, 5, { a: [40] });
    for (let i = 0; i < 9; i++) { const [x, z] = beside(pk - 60 + i * 13 + frac(i, n) * 8, -1, 8 + frac(i, n + 4) * 16); set('moutonVolcan', x, z, { ry: frac(i, n + 9) * 6.28 }); } });
  by('vapeurVolcan', [1745, 2140], -1, 26, { m: 'steam', a: [18, 1.4], seed: 1 }); by('vapeurVolcan', [1752, 2148], -1, 31, { m: 'steam', a: [11, 1], seed: 1 }); // warm ground: two vents steam on the upper slope
  for (const [pk, n] of [[1560, 0], [1720, 1], [1880, 2], [2040, 3], [2150, 4]]) drape('snow', [[-34, 16, 5], [-12, 24, 9], [10, 20, 8], [30, 13, 4]].map(([d, off, w]) => [...beside(pk + d, -1, off + n * 3), w]), 0.9); // snow lying in the hollows from 120 m up
  [[1020, -300, 18, 52], [1075, -640, 14, 40], [1120, -1010, 22, 66], [990, -1290, 16, 48]].forEach(([x, z, r, ht], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [r, ht, i + 4] })); // sea stacks off the east coast, on the right all the way up
  [[930, -470, 9], [1010, -830, 12], [960, -1130, 8]].forEach(([x, z, w], i) => set('rocherVolcan', x, z, { y: -1, m: 'ice', a: [w * 2, w * 0.7, w * 1.4, i + 30] }));
};
