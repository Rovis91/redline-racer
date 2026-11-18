// "volcan", zone 5: Les Lacets (PK 4890 to 6100, 112 to 12 m): three hairpins down the south-west flank to the quay. set(), by(), slab(), line(), drape() and scatter() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).lacets = ({ set, by, beside, frac, range, line, drape, scatter }) => {
  scatter(4890, 6100, 'moss', 18);
  [[4940, 'red', 0], [5040, 'yellow', 0], [5120, 'red', 0], [5210, 'teal', 1.57], [5290, 'blue', 1.57], [5560, 'orange', 0], [5620, 'green', 0], [5690, 'violet', 1.57], [5740, 'orange', 1.57], [5940, 'yellow', 0], [5990, 'violet', 0], [6040, 'teal', 1.57], [6080, 'blue', 0]]
    .forEach(([pk, c, turn], i) => by('maisonVolcan', pk, -1, 12, { turn, a: [9 + (i & 1) * 2, 4 + (i % 3) * 0.5, 7.5, c] })); // cabins between the legs, each its own colour, close to the road
  by('egliseVolcan', 5450, 1, 30, { s: 1.25 });                                                  // white timber church and its spire outside the second hairpin: the braking mark of the descent
  by('sechoirVolcan', [5230, 5800], -1, 18, { a: [16, 8] }); by('sechoirVolcan', [4990, 5660], 1, 6, { a: [12, 7] });
  by('torfVolcan', [5350, 5880], -1, 12, { a: [9, 6, 'red'] }); by('clotureVolcan', [5310, 5390, 5840, 5920], -1, 5, { a: [36] });
  for (let i = 0; i < 14; i++) { const [x, z] = beside((i < 7 ? 5300 : 5830) + (i % 7) * 12 + frac(i, 2) * 8, -1, 8 + frac(i, 5) * 14); set('moutonVolcan', x, z, { ry: frac(i, 7) * 6.28 }); }
  by('cairnVolcan', [5150, 5470, 5855], 1, 4, { a: [3.2], seed: 1 });                            // a cairn at each hairpin
  [[4960, 30, 10], [5380, 40, 12], [5690, 34, 8], [5920, 44, 11]].forEach(([pk, off, w], i) => by('rocherVolcan', pk, -1, off, { m: 'rock', a: [w, w * 0.5, w, i + 9] }));
  // the hot-water pipe of the town: from the mouth of the gallery down to the quay on its saddles, on the sea side of the road
  line(range(4716, 6096, 15), 1, 3, 'supportVolcan', [], [['steel', 0.55, 0, 1.5]]);
  for (const pk of [4800, 5080, 5600]) drape('crust', [[110, 15], [70, 13], [36, 12], [10, 7]].map(([off, w], j) => [...beside(pk + j * 10, -1, off), w]), 2.5); // old flows across the slope
};
