// "volcan", zone 4: Les Falaises (PK 1900 to 3480, 85 to 158 m): the climb across the highland (x = 371, northwards), the hairpin on the cliff top at the north tip, back south and round the basalt needle, then west to the base camp at the mouth of the north gallery.
// The ground of the expedition starts where farming stops: survey lines cross the road and lead to instruments, the supply track cuts the loop of the tip, and the camp stands on the last level ground before the caldera wall.
// set(), by(), line(), drape(), scatter(), track() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js. Plan: x east, z south. Island on the left (-1), sea on the right (1).
(window.VOLCAN = window.VOLCAN || {}).falaises = ({ set, by, beside, range, line, drape, scatter, track, clear }) => {
  scatter(1900, 3180, 'moss', 26);                                                                // the lava field at the roadside: moss hummocks and black blocks
  for (const pk of range(1910, 3470, 30)) if (clear(pk)) for (const sd of [-1, 1]) by('jalonVolcan', pk, sd, 0.7); // snow poles: the road is kept open for the expedition all year
  line([...range(1900, 3190, 46), beside(3236, 1, 30)], -1, 4, 'poteauVolcan', [10], [['dark', 0.07, -1.3, 9.45], ['dark', 0.07, 1.3, 9.45]]); // the power line, up to the transformer of the camp
  // survey(pk, sd): a survey line across the road: orange stakes every 12 m on both sides, out to 100 m, and a seismic station on it 22 m from the road on side sd
  const survey = (pk, sd) => { for (const s of [-1, 1]) for (let off = 8; off < 100; off += 12) if (s !== sd || Math.abs(off - 20) > 5) by('piquetVolcan', pk, s, off); by('stationVolcan', pk, sd, 13); };
  survey(2040, -1); survey(2330, 1); survey(2580, -1); survey(3060, 1);
  by('meteoVolcan', 2450, 1, 12); by('panneauVolcan', 1960, 1, 1.6, { a: ['orange', 1.8] });      // the weather station on the open plateau; "expedition ground"
  // the supply track of the tracked vehicles cuts the loop of the tip, from the northward leg to the road round the needle: two ruts of gravel, a vehicle on its way up
  track([[360, -1392], [336, -1386], [311, -1380]], 2.2); by('piquetVolcan', [2512, 2524], -1, 3); set('chenilleVolcan', 338, -1387, { ry: 0.2 });
  by('orguesVolcan', [2130, 2410, 2650, 2905], -1, 15, { a: [28, 7] }); by('orguesVolcan', [2250, 2530, 3010], 1, 17, { a: [24, 6] }); // the edges of the stacked flows show as low black scarps beside the road
  // the tip: the relay mast of the expedition on the cliff top outside the hairpin, the radio link to the mainland; stacks and skerries in the sea below
  by('mastVolcan', 2762, 1, 12, { a: [30] }); by('conteneurVolcan', 2740, 1, 9, { a: [4, 'white'] }); by('solaireVolcan', 2786, 1, 8, { turn: 3.14, a: [3] });
  [[250, -1790, 16, 60], [420, -1770, 12, 44], [140, -1750, 9, 30], [560, -1700, 14, 52], [610, -1640, 8, 24]].forEach(([x, z, r, ht], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [r, ht, i + 9] }));
  // the needle: a volcanic plug 100 m high that the road wraps; scree at its foot
  set('aiguilleVolcan', 189, -1427, { m: 'rock', a: [100, 24] }); [[160, -1400], [222, -1408], [214, -1460], [158, -1452], [190, -1386]].forEach(([x, z], i) => set('rocherVolcan', x, z, { m: 'rock', a: [14, 8 + i * 2, 14, i] }));
  // the base camp, on the sea side of the road before the gallery (PK 3215 to 3430): a levelled gravel pad; laboratory and store containers along the road, sleeping domes behind them, the mast, the solar field, fuel, vehicles
  drape('gravel', range(3206, 3440, 26).map(pk => [...beside(pk, 1, 31), 31]), 0.3);
  by('panneauVolcan', 3200, 1, 1.6, { a: ['orange', 1.8] }); by('drapeauVolcan', 3222, 1, 6, { a: [9, 'orange'] }); by('conteneurVolcan', 3236, 1, 30, { a: [3, 'white'] });
  ['orange', 'white', 'orange', 'white'].forEach((c, i) => by('conteneurVolcan', 3246 + i * 9, 1, 6, { a: [6, c] })); by('conteneurVolcan', 3255, 1, 6, { dy: 2.75, a: [6, 'white'] });
  by('chenilleVolcan', [3292, 3301], 1, 6, { turn: 1.57 }); by('futsVolcan', [3312, 3318], 1, 5, { a: [8], seed: 1 });
  ['yellow', 'orange', 'yellow', 'orange', 'yellow'].forEach((c, i) => by('domeVolcan', 3334 + i * 11, 1, 8 + (i % 2) * 5, { m: c, a: [3.6] }));
  ['orange', 'yellow', 'orange', 'yellow'].forEach((c, i) => by('domeVolcan', 3340 + i * 12, 1, 26, { m: c, a: [4.4] }));
  by('mastVolcan', 3284, 1, 34, { a: [28] }); ['white', 'orange', 'white'].forEach((c, i) => by('conteneurVolcan', 3250 + i * 9, 1, 22, { a: [6, c] }));
  for (const off of [40, 46, 52]) by('solaireVolcan', [3330, 3342, 3354, 3366], 1, off, { turn: 3.14, a: [4] });
  by('caissesVolcan', [3326, 3392], 1, 4, { a: [9], seed: 1 }); by('meteoVolcan', 3404, 1, 22);
  // the instrument cable leaves the camp for the caldera on low trestles along the road, into the gallery
  line(range(3300, 3478, 9), -1, 2, 'treteauVolcan', [], [['dark', 0.12, 0, 0.98]]);
};
