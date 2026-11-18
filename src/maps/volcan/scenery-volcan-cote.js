// "volcan", zone 7: La Côte (PK 5860 to 6390, 30 to 12 m): out of the last hairpin and along the shore to the head of the quay, eastwards. Sea on the right (1, south).
// The west landing of the village: a boathouse, boats on its apron, the racks where that catch dries, nets; the pump house where the hot-water pipe ends; the farm of the shore on the island side before the first houses.
// by(), line(), wall(), track(), flock(), drape() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).cote = ({ set, by, range, beside, line, drape, wall, track, flock }) => {
  const along = (a, b, sd, off) => [...range(a, b, 14), b].map(pk => beside(pk, sd, off));
  line(range(5980, 6230, 15), 1, 2.4, 'supportVolcan', [], [['steel', 0.55, 0, 1.5]]); by('posteVolcan', 6244, 1, 7, { a: [6, 3.4, 5, 5] });
  by('naustVolcan', 6010, 1, 13, { a: [8, 3.4, 12, 'blue'] }); by('barqueVolcan', [6032, 6046, 6062], 1, 9, { turn: 1.3, dy: 0.3, a: [8, 'red', 'trim'] });
  by('sechoirVolcan', [6094, 6118, 6142], 1, 8, { a: [18, 8] }); by('filetsVolcan', [6170, 6190], 1, 9); by('caissesVolcan', 6208, 1, 6, { a: [9] });
  by('sechoirVolcan', [6284, 6308, 6332], 1, 8, { a: [18, 8] }); by('barqueVolcan', [6356, 6372], 1, 8, { turn: 1.3, dy: 0.3, a: [8, 'yellow', 'trim'] });
  // the farm of the shore: a pink house and its red barn behind the roadside wall, the hay field and its bales, the flock in the next field
  wall(along(5900, 6037, -1, 5)); wall(along(6043, 6082, -1, 5)); wall(along(5900, 6082, -1, 40)); for (const pk of [5900, 5970, 6082]) wall([beside(pk, -1, 5), beside(pk, -1, 40)]);
  by('barriereVolcan', 6040, -1, 5); track([beside(6040, -1, 0.5), beside(6040, -1, 14)], 1.8);
  by('maisonVolcan', 6024, -1, 18, { a: [11, 5.2, 8, 'pink'] }); by('grangeVolcan', 6062, -1, 22, { turn: Math.PI / 2, a: [15, 5, 9, 'red'] }); by('torfVolcan', 6000, -1, 20, { a: [9, 6, 'pink'] }); by('drapeauVolcan', 6034, -1, 9, { a: [7, 'red'] });
  drape('hay', range(5908, 5964, 16).map(pk => [...beside(pk, -1, 24), 14]), 0.3); by('balleVolcan', 5935, -1, 13, { a: [7, 3] }); flock(...beside(5990, -1, 30), 8, 8, 21);
  by('panneauVolcan', 6084, 1, 1.6, { a: ['white', 2.4, 3] }); by('panneauVolcan', 5990, -1, 1.6, { a: ['yellow', 1.3] });   // the name of the village; slow down
  [[-560, 190, 8, 12], [-420, 220, 11, 20], [-300, 170, 6, 9], [620, 150, 10, 18]].forEach(([x, z, r, ht], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [r, ht, i] })); // skerries off the south shore
};
