// "volcan", zone 4: Les Falaises (PK 1560 to 4020, 127 to 232 to 178 m): the upper S-bends, the horseshoe round the basalt needle, the pass, then west along the north cliffs to the base camp at the mouth of the north gallery.
// The ground of the expedition starts where farming stops: survey lines cross the road and lead to instruments, the supply track runs beside the road, and the camp stands on the last level ground before the caldera wall.
// set(), by(), line(), drape(), scatter(), track() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js. Island on the left (-1), sea on the right (1).
(window.VOLCAN = window.VOLCAN || {}).falaises = ({ set, by, beside, range, line, drape, scatter, track, clear }) => {
  scatter(1560, 3700, 'moss', 26);                                                                // the lava field at the roadside: moss hummocks and black blocks
  for (const pk of range(1570, 4010, 30)) if (clear(pk)) for (const sd of [-1, 1]) by('jalonVolcan', pk, sd, 0.7); // snow poles: the road is kept open for the expedition all year
  line(range(1560, 3740, 46), -1, 2.5, 'poteauVolcan', [10], [['dark', 0.07, -1.3, 9.45], ['dark', 0.07, 1.3, 9.45]]); // the power line, up to the transformer of the camp
  // survey(pk): a survey line across the road: orange stakes every 9 m on the island side, out to 100 m, and a seismic station on it 11 m from the road
  const survey = pk => { for (let off = 20; off < 100; off += 9) by('piquetVolcan', pk, -1, off, { s: 1.6 }); by('piquetVolcan', pk, 1, 4, { s: 1.6 }); by('stationVolcan', pk, -1, 11, { s: 1.7 }); };
  [1700, 2050, 2420, 2760, 3080, 3420].forEach(survey);
  by('meteoVolcan', 2250, -1, 12); by('panneauVolcan', 1600, 1, 1.6, { a: ['orange', 1.8] });     // the weather station; "expedition ground"
  // the supply track of the tracked vehicles runs beside the road on the island side, marked by stakes: two vehicles on it, one with its load of crates; a relay hut of the radio link; warm ground steaming, each vent with its sensor
  for (const [a, b] of [[1600, 2020], [2460, 2740], [3460, 3720]]) { track(range(a, b, 22).map(pk => beside(pk, -1, 9)), 2.2); by('piquetVolcan', range(a + 10, b, 44), -1, 5.5, { s: 1.5 }); }
  by('chenilleVolcan', 1850, -1, 9, { turn: 1.57 }); by('caissesVolcan', 1841, -1, 9, { a: [6] }); by('chenilleVolcan', 2600, -1, 9, { turn: -1.57, a: ['white'] });
  by('conteneurVolcan', 2150, -1, 12, { a: [4, 'orange'] }); by('mastVolcan', 2162, -1, 13, { a: [14] }); by('solaireVolcan', 2138, -1, 12, { a: [2] });
  [[2330, 22, 15], [2347, 36, 11], [2363, 18, 9], [2900, 24, 13], [2918, 34, 10], [3300, 20, 12]].forEach(([pk, off, ht], i) => { by('vapeurVolcan', pk, -1, off, { m: 'steam', a: [ht, 1.2, i] }); by('rocherVolcan', pk, -1, off, { m: 'scoria', a: [5, 1.6, 5, i] }); by('capteurVolcan', pk + 4, -1, off - 4); });
  // the needle: a volcanic plug 100 m high inside the horseshoe; scree at its foot
  set('aiguilleVolcan', 276, -1428, { m: 'rock', a: [105, 24] }); [[236, -1400], [312, -1410], [300, -1466], [246, -1462], [276, -1380]].forEach(([x, z], i) => set('rocherVolcan', x, z, { m: 'rock', a: [14, 8 + i * 2, 14, i] }));
  // the pass (232 m): the relay mast of the expedition on the cliff top, the radio link to the mainland; stacks and skerries in the sea below
  by('mastVolcan', 3160, 1, 10, { a: [30] }); by('conteneurVolcan', 3140, 1, 8, { a: [4, 'white'] }); by('solaireVolcan', 3184, 1, 8, { turn: 3.14, a: [3] });
  [[620, -1450, 20, 60], [520, -1720, 16, 44], [120, -1790, 22, 70], [1060, -300, 18, 52], [1110, -640, 14, 40], [1150, -1010, 22, 66], [1040, -1290, 16, 48], [-420, -1700, 14, 40]].forEach(([x, z, r, ht], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [r, ht, i + 4] }));
  // the base camp, on the island side of the road before the gallery (PK 3740 to 3990): a levelled gravel pad; laboratory and store containers along the road, sleeping domes behind them, the mast, the solar field, fuel, vehicles
  const K = 3740; drape('gravel', range(K, K + 240, 26).map(pk => [...beside(pk, -1, 31), 31]), 0.3);
  by('panneauVolcan', K - 6, -1, 1.6, { a: ['orange', 1.8] }); by('drapeauVolcan', K + 16, -1, 6, { a: [9, 'orange'] }); by('conteneurVolcan', K + 30, -1, 30, { a: [3, 'white'] });
  ['orange', 'white', 'orange', 'white'].forEach((c, i) => by('conteneurVolcan', K + 40 + i * 9, -1, 6, { a: [6, c] })); by('conteneurVolcan', K + 49, -1, 6, { dy: 2.75, a: [6, 'white'] });
  by('chenilleVolcan', [K + 86, K + 95], -1, 6, { turn: 1.57 }); by('futsVolcan', [K + 106, K + 112], -1, 5, { a: [8], seed: 1 });
  ['yellow', 'orange', 'yellow', 'orange', 'yellow'].forEach((c, i) => by('domeVolcan', K + 128 + i * 11, -1, 8 + (i % 2) * 5, { m: c, a: [3.6] }));
  ['orange', 'yellow', 'orange', 'yellow'].forEach((c, i) => by('domeVolcan', K + 134 + i * 12, -1, 26, { m: c, a: [4.4] }));
  by('mastVolcan', K + 78, -1, 34, { a: [28] }); ['white', 'orange', 'white'].forEach((c, i) => by('conteneurVolcan', K + 44 + i * 9, -1, 22, { a: [6, c] }));
  for (const off of [40, 46, 52]) by('solaireVolcan', [K + 124, K + 136, K + 148, K + 160], -1, off, { a: [4] });
  by('caissesVolcan', [K + 120, K + 186], -1, 4, { a: [9], seed: 1 }); by('meteoVolcan', K + 198, -1, 22);
  // the instrument cable leaves the camp for the caldera on low trestles along the road, into the gallery
  line(range(K + 100, 4022, 9), 1, 2, 'treteauVolcan', [], [['dark', 0.12, 0, 0.98]]);
};
