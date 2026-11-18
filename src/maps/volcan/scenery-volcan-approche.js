// "volcan", zone 4b: L'Approche (PK 1500 to 3740): from the last farm to the base camp, the stretch the author found empty. The sheep thin out and stop; the supply track of the expedition takes over,
// marked with cairns and poles; instrument stations with their solar panels and cables laid on the ground towards the camp, two supply caches under nets, a parked tracked vehicle, survey flags, patches of old snow, lava blocks, steam vents.
// set(), by(), span(), drape(), track(), flock() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js. Island on the left (-1).
(window.VOLCAN = window.VOLCAN || {}).approche = ({ g, set, by, span, beside, range, drape, track, flock, frac, clear }) => {
  // the last farm lets go of its flock: the fence ends, the pens give way to a few strays, then none
  by('clotureVolcan', [1520, 1548], -1, 5, { a: [24] }); flock(...beside(1545, -1, 24), 5, 11, 31); flock(...beside(1610, -1, 30), 3, 14, 32); flock(...beside(1700, -1, 38), 2, 12, 33); flock(...beside(1830, -1, 44), 1, 3, 34);
  // lay(m, points, t): a cable or a pipe lying on the ground through plan points [x, z], in pieces of 6 m that follow the relief
  const lay = (m, pts, t, lift = 0.12) => { for (let n = 1; n < pts.length; n++) { const [ax, az] = pts[n - 1], [bx, bz] = pts[n], k = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 6));
    for (let e = 0; e < k; e++) { const x0 = ax + (bx - ax) * e / k, z0 = az + (bz - az) * e / k, x1 = ax + (bx - ax) * (e + 1) / k, z1 = az + (bz - az) * (e + 1) / k; span(m, [x0, g.hAt(x0, z0) + lift, z0], [x1, g.hAt(x1, z1) + lift, z1], t); } } };
  const alongRoad = (a, b, off, step = 12) => [...range(a, b, step), b].map(pk => beside(pk, -1, off));
  // the supply track, continuous from the first stakes to the camp (the three stretches of falaises.js are already laid): cairns every 58 m, taller poles between, then the cable and the pipe run beside it
  track(alongRoad(2020, 2460, 9, 22), 2.2); track(alongRoad(2740, 3460, 9, 22), 2.2);
  by('cairnVolcan', range(1620, 3730, 58), -1, 7.5, { a: [1.6], seed: 1 }); by('jalonVolcan', range(1649, 3730, 58), -1, 11, { a: [3.4] });
  lay('dark', alongRoad(2160, 3740, 3.5), 0.1); lay('steel', alongRoad(2900, 3740, 5), 0.32, 0.3);                  // the instrument cable towards the camp; the hot-water pipe of the camp
  // instrument stations: a seismometer under its cover, solar panels, a sensor and survey flags, the cable laid back to the road
  [[1860, 18], [2010, 34], [2270, 26], [2530, 20], [2680, 38], [2840, 24], [3010, 30], [3240, 22], [3410, 36], [3600, 28]].forEach(([pk, off], i) => {
    by('stationVolcan', pk, -1, off, { s: 1.7, turn: frac(i) * 0.6 - 0.3 }); by('solaireVolcan', pk, -1, off + 3.5, { a: [2 + i % 3], turn: 0.2 }); by('capteurVolcan', pk + 4, -1, off - 2);
    for (let k = 0; k < 4; k++) by('piquetVolcan', pk - 8 + k * 5, -1, off + 8 + (k & 1) * 3, { s: 1.5 });
    lay('dark', [beside(pk, -1, off - 1), beside(pk - 6, -1, off * 0.55), beside(pk - 10, -1, 4)], 0.09); });
  // two supply caches: crates under nets, fuel drums, a tracked vehicle beside them; a third vehicle parked on its own at the foot of the ridge
  [[2520, 15, 'white'], [3380, 17, 'orange']].forEach(([pk, off, c], i) => { by('bacheVolcan', pk, -1, off, { a: [3, i] }); by('bacheVolcan', pk + 7, -1, off + 6, { a: [2, i + 2], turn: 0.4 }); by('futsVolcan', [pk - 12, pk - 8], -1, off - 1, { a: [8], seed: i + 3 }); by('chenilleVolcan', pk + 18, -1, off - 2, { turn: 1.2 + i, a: [c] }); by('panneauVolcan', pk - 22, -1, 2, { a: ['orange', 1.4] }); });
  by('chenilleVolcan', 3050, -1, 24, { turn: 0.7, a: ['orange'] }); by('chenilleVolcan', 1980, -1, 30, { turn: -0.5, a: ['white'] });
  // steam vents with their sensors, more of them than before; blocks of black lava; patches of old snow in the hollows of the north face
  [[1900, 40, 11], [2580, 30, 13], [3560, 34, 10], [3180, 26, 12]].forEach(([pk, off, ht], i) => { by('vapeurVolcan', pk, -1, off, { m: 'steam', a: [ht, 1.1, i + 7] }); by('rocherVolcan', pk, -1, off, { m: 'scoria', a: [5, 1.5, 5, i + 9] }); by('capteurVolcan', pk + 5, -1, off - 4); });
  for (let i = 0; i < 70; i++) { const pk = 1580 + i * 31 + frac(i) * 20, sd = i % 5 ? -1 : 1, w = 0.8 + frac(i, 1) * 2.4; if (clear(pk)) by('rocherVolcan', pk, sd, 3 + frac(i, 2) * (sd < 0 ? 55 : 8), { m: i % 3 ? 'crust' : 'rock', a: [w, w * 0.7, w * 1.1, i] }); }
  [[2760, 62, 26], [3010, 70, 30], [3290, 58, 24], [3520, 66, 28]].forEach(([pk, off, w]) => { const [x, z] = beside(pk, -1, off), [x2, z2] = beside(pk + 36, -1, off + 14); drape('snow', [[x, z, w * 0.5], [(x + x2) / 2, (z + z2) / 2, w], [x2, z2, w * 0.4]], 0.5); });
};
