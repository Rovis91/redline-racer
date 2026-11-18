// "volcan", zone 6: La Descente (PK 4270 to 5780, 112 to 9 m): out of the gallery, a traverse of the cone's flank through a rock cut, then three hairpins (PK 4560, 4960, 5290) down to the west shore and the leg south along it.
// The old road of the village's summer pastures, reused by the expedition: high up, bare lava, old flows, instruments and the hot-water pipe; lower, three summer farms, each a turf house with its stone fold at the roadside, their sheep loose on the hill round the fold.
// set(), by(), line(), drape(), scatter(), wall(), track(), flock() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js. Island on the left (-1), sea on the right (1).
(window.VOLCAN = window.VOLCAN || {}).descente = ({ set, by, beside, range, line, drape, scatter, wall, track, flock }) => {
  scatter(4280, 4960, 'rock', 22); scatter(4960, 5300, 'moss', 26);
  for (const pk of range(4290, 5300, 30)) for (const sd of [-1, 1]) by('jalonVolcan', pk, sd, 0.7);
  // the hot-water pipe of the village: from the warm ground of the caldera, out of the gallery and down the road on its saddles, on the sea side
  line(range(4284, 5770, 15), 1, 2.4, 'supportVolcan', [], [['steel', 0.55, 0, 1.5]]);
  // the rock cut through the spur (PK 4380 to 4540): black columns on both banks
  by('orguesVolcan', [4396, 4436, 4476, 4516], -1, 5, { a: [34, 13] }); by('orguesVolcan', [4410, 4456, 4500], 1, 6, { a: [30, 9] });
  [[4350, 16, 3], [4640, 14, 2.5], [4850, 15, 3], [5060, 18, 2.5]].forEach(([pk, off, w], i) => by('rocherVolcan', pk, -1, off, { m: 'rock', a: [w, w * 0.6, w, i + 9] })); // blocks come down the ravines of the cone to the roadside
  // a seismic station on its survey line outside each hairpin: the instruments ring the cone
  const survey = (pk, sd) => { for (let off = 6; off < 90; off += 11) if (Math.abs(off - 14) > 5) by('piquetVolcan', pk, sd, off); by('stationVolcan', pk, sd, 13); };
  survey(4330, 1); survey(4590, 1); survey(4975, 1); survey(5300, 1);
  by('panneauVolcan', 4300, 1, 1.6, { a: ['yellow', 1.3] }); by('panneauVolcan', 5340, 1, 1.6, { a: ['yellow', 1.3] });
  // the relay of the expedition on the parasitic cone of the west flank, seen from the whole descent
  set('mastVolcan', -690, -930, { a: [30] });
  // shieling(pk, sd, tint, n): a summer farm at the roadside: the turf house facing the road and its turf store, the round stone fold and its pen, the track; the flock grazes loose round the fold
  const ring = (x, z, r, n = 12) => Array.from({ length: n }, (_, i) => [x + Math.cos(i / n * 6.283) * r, z + Math.sin(i / n * 6.283) * r]);
  const shieling = (pk, sd, tint, n) => { by('maisonVolcan', pk, sd, 15, { a: [9, 3.6, 6.5, tint] }); by('torfVolcan', pk + 17, sd, 19, { turn: 1.57, a: [7, 5, tint] }); track([beside(pk + 8, sd, 0.5), beside(pk + 8, sd, 10)], 1.6);
    const [fx, fz] = beside(pk - 30, sd, 20); wall(ring(fx, fz, 10), true); const [qx, qz] = beside(pk - 46, sd, 16); wall(ring(qx, qz, 4.5, 8), true);
    flock(fx, fz, 5, 7, n); flock(...beside(pk - 70, sd, 22), 9, 18, n + 3); flock(...beside(pk + 50, sd, 20), 7, 14, n + 5); };
  shieling(4790, 1, 'red', 11); shieling(5130, -1, 'blue', 14); shieling(5500, -1, 'yellow', 17); shieling(5215, 1, 'green', 19); shieling(5650, -1, 'pink', 23);
  // the shore meadow on the sea side of the last leg: the sheep of the village graze it behind a wall along the road
  wall([...range(5380, 5700, 14), 5700].map(pk => beside(pk, 1, 9))); flock(...beside(5440, 1, 24), 10, 16, 31); flock(...beside(5620, 1, 22), 9, 15, 33);
  // skerries and stacks off the west shore
  [[-960, -420, 12, 34], [-1010, -250, 9, 22], [-930, -140, 14, 40], [-900, -20, 7, 14], [-1090, -560, 16, 50]].forEach(([x, z, r, ht], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [r, ht, i + 3] }));
};
