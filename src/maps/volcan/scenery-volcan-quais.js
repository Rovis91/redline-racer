// "volcan", zone 6: Les Quais (PK 6100 to the line, 12 m), the coloured town along the home straight. set(), by() and slab() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).quais = ({ by, slab }) => {
  const C = ['red', 'yellow', 'blue', 'green', 'orange', 'violet', 'teal'];
  for (let pk = 6110; pk < 6578; pk += 20) { slab('paving', pk, 60, 1, 21, -1.05, 38); slab('paving', pk, 78, 1, 21, -1.05, -47); } // quay and town ground, paved
  // three rows of timber houses on the island side, every neighbour a different colour (a step of 3 in a palette of 7 from one house to the next, a shift from one row to the next); some stand gable to the road
  [[18, 6124, 13, 0], [40, 6142, 12, 2], [62, 6160, 11, 4]].forEach(([off, pk0, n, shift], r) => { for (let i = 0; i < n; i++) by('maisonVolcan', pk0 + i * 36, -1, off, { turn: (i + r) % 3 === 1 ? 1.57 : 0, a: [9 + (i * 7 + r) % 3, 4 + ((i + r) % 4) * 0.5, 8, C[(i * 3 + shift) % 7]] }); });
  by('crieeVolcan', 6378, 1, 42, { a: [60, 20] });                                               // the fish market on the quay, sea side
  by('sechoirVolcan', [6190, 6240], 1, 34, { a: [16, 8] });
  by('caissesVolcan', [6290, 6302, 6314, 6450], 1, 12, { a: [9], seed: 1 }); by('filetsVolcan', [6260, 6470], 1, 18); // crates, and nets laid out to dry
  by('bollardVolcan', [6170, 6220, 6270, 6320, 6370, 6420, 6470, 6520], 1, 58);                  // mooring posts along the quay edge
  [[6230, 'red'], [6278, 'yellow'], [6498, 'blue'], [6540, 'red']].forEach(([pk, c], i) => by('barqueVolcan', pk, 1, 84 + i * 3, { y: 0.2, turn: 0.4 + i * 0.9, a: [8, c, 'trim'] })); // open boats in the basin
  by('pontonVolcan', 6340, 1, 68, { y: 1.4, a: [44] });
  by('digueVolcan', 6480, 1, 62, { y: 5, a: [170] });                                            // the breakwater closes the basin
  [['trim', 0, [5, 3.6, 36, 12]], ['red', 14, [4.7, 4.3, 7, 12]], ['dark', 36, [4.6, 4.6, 0.8, 12]], ['lamp', 36.8, [2.4, 2.4, 3.4, 10]], ['red', 40.2, [2.9, 0.3, 2, 10]]].forEach(([m, y, a]) => by('cylVolcan', 6480, 1, 236, { y: 5 + y, m, a })); // the lighthouse at its end, white with a red band: the landmark of the last straight
};
