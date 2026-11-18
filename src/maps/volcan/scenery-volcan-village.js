// "volcan", zone 2: Le Village (island side, -1, of the home straight and of the start: PK 6090 to the line, then PK 0 to 400, 12 to 20 m).
// The village faces its harbour: four rows of timber houses parallel to the quay, a lane between two rows, cross lanes climbing from the quay; the church in the middle with its churchyard, the flag of the school.
// Colours: green, yellow, blue, red, pink, never two alike side by side. by(), wall(), track() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).village = ({ by, beside, range, wall, track }) => {
  const C = ['green', 'yellow', 'blue', 'red', 'pink'], dims = i => [9 + i % 3, 4.2 + (i * 7 % 4) * 0.5, 7.5, C[(i * 2 + (i / 5 | 0)) % 5]];
  const A = 6090, B = 6578 + 400, CROSS = [6170, 6260, 6350, 6440, 6630, 6720, 6810, 6900], CH = 6535;                  // the rows run from A to B; a cross lane at each chainage of CROSS; the church at CH
  const free = (pk, r) => CROSS.every(c => Math.abs(pk - c) > 7) && !(r > 0 && r < 3 && Math.abs(pk - CH) < 22) && !(r > 1 && pk < 6230); // not on a lane, not on the churchyard, and only two rows under the hill at the west end
  [5, 23, 41, 59].forEach((off, r) => range(A + r * 5, B - r * 30, 13.5).forEach((pk, i) => { if (free(pk, r)) by('maisonVolcan', pk, -1, off, { turn: (i + r) % 5 === 1 ? 1.57 : 0, a: dims(i * 3 + r * 7 + 1) }); }));
  for (const off of [14, 32, 50]) track(range(A + 150, B - 70, 20).map(pk => beside(pk, -1, off)), 2);
  for (const c of CROSS) track([beside(c, -1, 0.5), beside(c, -1, 66)], 2);
  by('reverbereVolcan', range(A + 10, B, 36), -1, 1.2);
  // the church stands back from the quay in the middle of the village, its door and spire toward the harbour; the churchyard behind a low stone wall, its white crosses; the flag of the school further east
  by('egliseVolcan', CH, -1, 34, { s: 1.25 }); wall([beside(CH - 20, -1, 16), beside(CH - 20, -1, 52), beside(CH + 20, -1, 52), beside(CH + 20, -1, 16)], false, 'stone', 1);
  by('croixVolcan', CH + 13, -1, 40, { turn: 1.57, a: [10] }); by('croixVolcan', CH - 13, -1, 40, { turn: 1.57, a: [8] });
  by('drapeauVolcan', 6578 + 96, -1, 3, { a: [9, 'red'] }); by('panneauVolcan', 6578 + 60, -1, 1.6, { a: ['white', 2.2, 3.4] });
};
