// "volcan", zone 1: Le Port (PK 0 to 490, 4 to 8 m): the start straight along the quay, heading east; harbour basin on the right (1), the west quarter of the village on the left (-1).
// The only flat, sheltered ground of the island: the catch is landed here, and so are the supplies of the expedition. set(), by(), slab(), line(), track() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).port = ({ by, slab, range, beside, track }) => {
  const C = ['green', 'yellow', 'blue', 'red', 'pink'], dims = i => [9 + i % 3, 4.2 + (i * 7 % 4) * 0.5, 7.5, C[(i * 2 + (i / 5 | 0)) % 5]];
  for (let pk = 10; pk < 480; pk += 20) { slab('paving', pk, 20.6, 1, 20.4, -1.05, 16.2); slab('stone', pk, 1.4, 7, 20.4, -7, 26.6); } // the quay: paved, 20 m wide, a wall of basalt blocks down into the water
  // the depot of the expedition at the west end of the quay, where its supplies are landed and the tracked vehicles load: containers, fuel, a vehicle, its sign
  by('conteneurVolcan', 30, 1, 14, { a: [6, 'orange'] }); by('conteneurVolcan', 37, 1, 14, { a: [6, 'white'] }); by('conteneurVolcan', 33.5, 1, 14, { dy: 2.75, a: [6, 'orange'] });
  by('futsVolcan', [47, 51], 1, 13, { a: [8], seed: 1 }); by('chenilleVolcan', 60, 1, 8, { turn: 0.3 }); by('panneauVolcan', 22, 1, 2, { a: ['orange', 1.8] });
  // the working quay, from west to east: boathouses with their doors on the water, nets laid out by the net shed, the slipway and its winch, the racks where the cod landed here dries, the fish market
  by('naustVolcan', [84, 98, 112], 1, 11, { a: [9, 3.8, 14, 'red'] });
  by('filetsVolcan', [132, 148], 1, 9); by('caissesVolcan', [128, 160, 204, 296, 372, 452], 1, 3.5, { a: [9], seed: 1 });
  by('caleVolcan', 180, 1, 21.4, { road: true, a: [30, 8] }); by('barqueVolcan', 180, 1, 31, { road: true, dy: -0.9, turn: 1.57, a: [8, 'yellow', 'trim'] });
  by('sechoirVolcan', [218, 242, 266], 1, 8, { a: [18, 8] }); by('sechoirVolcan', [230, 254], 1, 16, { a: [16, 7] });
  by('crieeVolcan', 336, 1, 11, { a: [44, 14] });
  by('filetsVolcan', [292, 384], 1, 8); by('sechoirVolcan', [398, 420], 1, 8, { a: [16, 7] }); by('barqueVolcan', [306, 372], 1, 6, { dy: 0.5, turn: 0.3, a: [8, 'red', 'trim'] });
  by('bollardVolcan', range(20, 470, 25), 1, 19.2); by('reverbereVolcan', range(30, 480, 40), 1, 1.2);
  // boats at the quay and in the basin; a pontoon; the breakwater and its lighthouse close the basin to the east, a shorter mole to the west
  [[100, 'blue'], [292, 'red'], [404, 'green']].forEach(([pk, c]) => by('bateauVolcan', pk, 1, 25.8, { y: 0, a: [16, c, 'trim'] }));
  [[140, 'yellow'], [212, 'red'], [252, 'blue'], [356, 'yellow'], [444, 'pink']].forEach(([pk, c]) => by('barqueVolcan', pk, 1, 23.6, { y: 0.2, a: [8, c, 'trim'] }));
  by('pontonVolcan', 424, 1, 20.6, { road: true, dy: -1.1, a: [34] }); by('barqueVolcan', [418, 430], 1, 38, { y: 0.2, turn: 1.57, a: [8, 'blue', 'trim'] });
  by('digueVolcan', 470, 1, 20, { road: true, a: [150] }); by('digueVolcan', 6, 1, 20, { road: true, a: [80] });
  [['trim', 0, [5, 3.6, 30, 12]], ['red', 12, [4.6, 4.2, 6, 12]], ['dark', 30, [4.4, 4.4, 0.8, 12]], ['lamp', 30.8, [2.2, 2.2, 3, 10]], ['red', 33.8, [2.7, 0.3, 2, 10]]].forEach(([m, y, a]) => by('cylVolcan', 470, 1, 176, { road: true, dy: y, m, a })); // the lighthouse, white with a red band: the landmark of the straight
  by('sechoirVolcan', 446, 1, 9, { a: [14, 7] });                                                 // a last rack on the windy corner by the breakwater
  // the west quarter of the village faces the harbour: three rows of timber houses parallel to the quay, a lane between the rows; every neighbour a different colour, some gable to the road
  [[5, 20, 470], [23, 26, 392], [41, 32, 386]].forEach(([off, a, b], r) => range(a, b, 13.5).forEach((pk, i) => by('maisonVolcan', pk, -1, off, { turn: (i + r) % 4 === 1 ? 1.57 : 0, a: dims(i * 3 + r * 7 + 1) })));
  for (const off of [14, 32]) track(range(16, 396, 20).map(pk => beside(pk, -1, off)), 2);
};
