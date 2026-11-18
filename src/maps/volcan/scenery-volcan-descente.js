// "volcan", zone 6: La Descente (PK 4670 to 5980, 129 to 23 m): out of the gallery, then three hairpins (PK 5063, 5422, 5821) down the south-west flank to the shore.
// The old road of the village's summer pastures, reused by the expedition: high up, bare lava, instruments and the hot-water pipe; lower, the summer farms, each a small timber house with its turf store and its round stone fold at the roadside, their sheep loose on the hill round the fold.
// set(), by(), line(), scatter(), wall(), track(), flock() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js. Island on the left (-1), sea on the right (1).
(window.VOLCAN = window.VOLCAN || {}).descente = ({ set, by, beside, range, line, scatter, wall, track, flock }) => {
  scatter(4680, 5100, 'rock', 22); scatter(5100, 5450, 'moss', 26);
  for (const pk of range(4690, 5450, 30)) for (const sd of [-1, 1]) by('jalonVolcan', pk, sd, 0.7);
  // the hot-water pipe of the village: from the warm ground of the caldera, out of the gallery and down the road on its saddles, on the sea side
  line(range(4684, 5980, 15), 1, 2.4, 'supportVolcan', [], [['steel', 0.55, 0, 1.5]]);
  // the instrument cable comes down from the caldera on wooden poles, on the island side, to the village
  line(range(4700, 5970, 46), -1, 2.5, 'poteauVolcan', [8], [['dark', 0.09, 0, 7.5]]);
  // a seismic station on its survey line outside each hairpin: the instruments ring the cone
  const survey = (pk, sd) => { for (let off = 20; off < 90; off += 9) by('piquetVolcan', pk, sd, off, { s: 1.6 }); by('stationVolcan', pk, sd, 11, { s: 1.7 }); };
  survey(4760, -1); survey(5063, 1); survey(5422, 1); survey(5821, 1);
  by('panneauVolcan', 4700, 1, 1.6, { a: ['yellow', 1.3] }); by('panneauVolcan', 5460, 1, 1.6, { a: ['yellow', 1.3] });
  set('mastVolcan', -690, -930, { a: [30] });                                                     // the relay of the expedition on the parasitic cone of the west flank, seen from the whole descent
  // shieling(pk, sd, tint, n): a summer farm at the roadside: the house facing the road and its turf store, the round stone fold and its pen, the track; the flock grazes loose round the fold
  const ring = (x, z, r, n = 12) => Array.from({ length: n }, (_, i) => [x + Math.cos(i / n * 6.283) * r, z + Math.sin(i / n * 6.283) * r]);
  const shieling = (pk, sd, tint, n) => { by('maisonVolcan', pk, sd, 15, { a: [9, 3.6, 6.5, tint] }); by('torfVolcan', pk + 17, sd, 19, { turn: 1.57, a: [7, 5, tint] }); track([beside(pk + 8, sd, 0.5), beside(pk + 8, sd, 10)], 1.6);
    const [fx, fz] = beside(pk - 30, sd, 20); wall(ring(fx, fz, 10), true); const [qx, qz] = beside(pk - 46, sd, 16); wall(ring(qx, qz, 4.5, 8), true);
    flock(fx, fz, 5, 7, n); flock(...beside(pk - 70, sd, 22), 9, 14, n + 3); flock(...beside(pk + 50, sd, 20), 7, 12, n + 5); };
  shieling(4900, 1, 'red', 11); shieling(5250, -1, 'blue', 14); shieling(5330, 1, 'pink', 19); shieling(5620, -1, 'green', 17); shieling(5720, 1, 'blue', 23); shieling(5080, -1, 'yellow', 27); shieling(5480, -1, 'red', 31);
  [[4720, 16, 3], [4990, 14, 2.5], [5180, 15, 3], [5500, 18, 2.5]].forEach(([pk, off, w], i) => by('rocherVolcan', pk, -1, off, { m: 'rock', a: [w, w * 0.6, w, i + 9] })); // blocks come down the ravines of the cone to the roadside
  [[-1060, -700, 15, 42], [-1090, -1180, 17, 51], [-800, -1560, 19, 60], [-1000, -420, 12, 34], [-960, -200, 9, 22], [-840, 60, 7, 14]].forEach(([x, z, r, ht], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [r, ht, i + 3] })); // skerries and stacks off the west shore
};
