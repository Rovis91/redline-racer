// "volcan", zone 1: Le Port (PK 6390 to the line, then PK 0 to 300, 12 m): the quay of the home straight and of the start, on the sea side (1); the village faces it (scenery-volcan-village.js).
// The only flat, sheltered ground of the island: the catch is landed here, and so are the supplies of the expedition. The quay stands 12 m over the water on its wall of basalt blocks: the boats lie below it.
// set(), by(), slab(), line() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js. Chainages beyond the lap length wrap round the line.
(window.VOLCAN = window.VOLCAN || {}).port = ({ by, slab, range }) => {
  const Q = 6390, q = l => l.map(v => v + Q);
  for (let pk = Q + 10; pk < Q + 480; pk += 20) { slab('paving', pk, 20.6, 1, 20.4, -1.05, 16.2); slab('stone', pk, 1.4, 16, 20.4, -16, 26.6); } // the quay: paved, 20 m wide, a wall of basalt blocks down into the water
  // the depot of the expedition at the west end of the quay, where its supplies are landed and the tracked vehicles load: containers, fuel, a vehicle, its sign
  by('conteneurVolcan', Q + 30, 1, 14, { a: [6, 'orange'] }); by('conteneurVolcan', Q + 37, 1, 14, { a: [6, 'white'] }); by('conteneurVolcan', Q + 33.5, 1, 14, { dy: 2.75, a: [6, 'orange'] });
  by('futsVolcan', q([47, 51]), 1, 13, { a: [8], seed: 1 }); by('chenilleVolcan', Q + 60, 1, 8, { turn: 0.3 }); by('panneauVolcan', Q + 22, 1, 2, { a: ['orange', 1.8] });
  // the working quay, from west to east: boathouses used as net stores, nets laid out, the racks where the cod landed here dries, the fish market, crates
  by('naustVolcan', q([84, 98, 112]), 1, 11, { a: [9, 3.8, 14, 'red'] });
  by('filetsVolcan', q([132, 148, 292, 384]), 1, 9); by('caissesVolcan', q([128, 160, 204, 296, 372, 452]), 1, 3.5, { a: [9], seed: 1 });
  by('sechoirVolcan', q([180, 204, 228, 252]), 1, 8, { a: [18, 8] }); by('sechoirVolcan', q([192, 216, 240]), 1, 16, { a: [16, 7] });
  by('crieeVolcan', Q + 336, 1, 11, { a: [44, 14] }); by('sechoirVolcan', q([398, 420, 446]), 1, 8, { a: [16, 7] }); by('barqueVolcan', q([272, 306, 372]), 1, 6, { dy: 0.5, turn: 0.3, a: [8, 'red', 'trim'] });
  by('bollardVolcan', range(Q + 20, Q + 470, 25), 1, 19.2); by('reverbereVolcan', range(Q + 30, Q + 480, 40), 1, 1.2);
  // boats under the quay and in the basin; the breakwater and its lighthouse close the basin to the east, a shorter mole to the west
  [[100, 'blue'], [292, 'red'], [404, 'green']].forEach(([pk, c]) => by('bateauVolcan', Q + pk, 1, 28, { y: 0, a: [18, c, 'trim'] }));
  [[140, 'yellow'], [212, 'red'], [252, 'blue'], [356, 'yellow'], [444, 'pink']].forEach(([pk, c]) => by('barqueVolcan', Q + pk, 1, 25, { y: 0.2, a: [8, c, 'trim'] }));
  [[60, 'red', 70], [230, 'yellow', 86], [380, 'blue', 74]].forEach(([pk, c, off], i) => by('bateauVolcan', Q + pk, 1, off, { y: 0, turn: 0.6 + i, a: [22, c, 'trim'] }));
  by('digueVolcan', Q + 470, 1, 20, { road: true, a: [150] }); by('digueVolcan', Q + 6, 1, 20, { road: true, a: [80] });
  [['trim', 0, [5, 3.6, 30, 12]], ['red', 12, [4.6, 4.2, 6, 12]], ['dark', 30, [4.4, 4.4, 0.8, 12]], ['lamp', 30.8, [2.2, 2.2, 3, 10]], ['red', 33.8, [2.7, 0.3, 2, 10]]].forEach(([m, y, a]) => by('cylVolcan', Q + 470, 1, 176, { road: true, dy: y, m, a })); // the lighthouse, white with a red band: the landmark of the straight
};
