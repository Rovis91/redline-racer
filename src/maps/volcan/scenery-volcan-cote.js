// "volcan", zone 7: La Côte (PK 5780 to 6230, 9 to 4 m): the shore road back to the harbour, eastwards, flat out. Sea on the right (1, south), the last farm on the left (-1).
// The old coast track to the west landing: boats are still hauled up on the shingle there, and the fish of that landing dries on the bank above it. Also here: the far stacks of the east and south coasts.
// set(), by(), line(), wall(), track(), flock(), drape() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js. Plan: x east, z south.
(window.VOLCAN = window.VOLCAN || {}).cote = ({ set, by, range, beside, line, drape, wall, track, flock }) => {
  const along = (a, b, sd, off) => [...range(a, b, 14), b].map(pk => beside(pk, sd, off));
  // the pipe ends at the pump house of the village; the west landing: a boathouse, boats on the shingle, two racks of fish, nets
  line(range(5770, 6150, 15), 1, 2.4, 'supportVolcan', [], [['steel', 0.55, 0, 1.5]]); by('posteVolcan', 6164, 1, 7, { a: [6, 3.4, 5, 5] });
  drape('sand', range(5800, 6140, 30).map(pk => [...beside(pk, 1, 24), 14]), 0.2);
  by('naustVolcan', 5860, 1, 13, { a: [8, 3.4, 12, 'blue'] }); by('barqueVolcan', [5882, 5896, 5912], 1, 9, { turn: 1.3, dy: 0.3, a: [8, 'red', 'trim'] });
  by('sechoirVolcan', [5944, 5968, 5992], 1, 8, { a: [18, 8] }); by('filetsVolcan', [6020, 6040], 1, 9); by('caissesVolcan', 6058, 1, 6, { a: [9] });
  // the farm of the shore: a pink house and its red barn behind the roadside wall, the hay field and its bales, the flock in the next field
  wall(along(5800, 6007, -1, 5)); wall(along(6013, 6150, -1, 5)); wall(along(5800, 6150, -1, 62)); for (const pk of [5800, 5890, 5960, 6060, 6150]) wall([beside(pk, -1, 5), beside(pk, -1, 62)]);
  by('barriereVolcan', 6010, -1, 5); track([beside(6010, -1, 0.5), beside(6010, -1, 14)], 1.8);
  by('maisonVolcan', 5996, -1, 18, { a: [11, 5.2, 8, 'pink'] }); by('grangeVolcan', 6030, -1, 22, { turn: Math.PI / 2, a: [15, 5, 9, 'red'] }); by('torfVolcan', 5976, -1, 20, { a: [9, 6, 'pink'] }); by('drapeauVolcan', 6004, -1, 9, { a: [7, 'red'] });
  drape('hay', range(5808, 5884, 16).map(pk => [...beside(pk, -1, 32), 22]), 0.3); by('balleVolcan', 5845, -1, 13, { a: [7, 3] }); by('balleVolcan', 5870, -1, 28, { turn: 1.2, a: [5, 5] });
  flock(...beside(5925, -1, 26), 11, 16, 21); flock(...beside(6105, -1, 26), 10, 17, 23);
  by('panneauVolcan', 6120, 1, 1.6, { a: ['white', 2.4, 3] }); by('panneauVolcan', 6140, -1, 1.6, { a: ['yellow', 1.3] });   // the name of the village; slow down
  // skerries off the south shore; the stacks of the east coast, on the right all the way up the farmland and the highland
  [[-560, 170, 8, 12], [-420, 200, 11, 20], [-300, 150, 6, 9], [560, 170, 10, 18]].forEach(([x, z, r, ht], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [r, ht, i] }));
  [[1010, -300, 16, 48], [1080, -640, 13, 38], [1010, -1000, 20, 62], [900, -1330, 15, 46], [760, -1560, 12, 40]].forEach(([x, z, r, ht], i) => set('ilotVolcan', x, z, { y: 0, m: 'rock', a: [r, ht, i + 4] }));
};
