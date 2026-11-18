// "volcan", zone 6: Les Quais (PK 6100 to the line, 12 m), the coloured town along the home straight. set(), by(), slab(), line(), drape() and scatter() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).quais = ({ by, slab, range }) => {
  const C = ['red', 'yellow', 'blue', 'green', 'orange', 'violet', 'teal'];
  for (let pk = 6110; pk < 6578; pk += 20) { slab('paving', pk, 60, 1, 21, -1.05, 38); slab('paving', pk, 78, 1, 21, -1.05, -47); } // quay and town ground, paved
  // three rows of timber houses on the island side, the first at the roadside, every neighbour a different colour (a step of 3 in a palette of 7 from one house to the next, a shift from one row to the next); some stand gable to the road
  [[10, 6118, 16, 0], [31, 6130, 14, 2], [54, 6142, 13, 4]].forEach(([off, pk0, n, shift], r) => { for (let i = 0; i < n; i++) by('maisonVolcan', pk0 + i * (r ? 32 : 28), -1, off, { turn: (i + r) % 3 === 1 ? 1.57 : 0, a: [10 + (i * 7 + r) % 3, 4.6 + ((i + r) % 4) * 0.6 + r, 8.5, C[(i * 3 + shift) % 7]] }); });
  by('crieeVolcan', 6378, 1, 34, { a: [60, 20] });                                               // the fish market on the quay, sea side
  by('naustVolcan', [6126, 6146], 1, 24, { a: [9, 3.8, 14, 'yellow'] }); by('naustVolcan', [6488, 6508, 6528], 1, 22, { a: [9, 3.8, 14, 'blue'] }); // the sheds of the quay
  by('sechoirVolcan', [6190, 6240, 6290], 1, 11, { a: [18, 9] });
  by('caissesVolcan', [6176, 6262, 6302, 6340, 6414, 6450], 1, 3.5, { a: [9], seed: 1 }); by('filetsVolcan', [6260, 6470], 1, 12); // crates, and nets laid out to dry
  by('barqueVolcan', [6160, 6330, 6436], 1, 7, { dy: 0.5, turn: 0.35, a: [8, 'red', 'trim'] });   // boats hauled out on the quay
  by('reverbereVolcan', range(6116, 6570, 44), 1, 1.4);
  by('bollardVolcan', [6170, 6220, 6270, 6320, 6370, 6420, 6470, 6520], 1, 58);                  // mooring posts along the quay edge
  [[6230, 'red'], [6278, 'yellow'], [6498, 'blue'], [6540, 'red']].forEach(([pk, c], i) => by('barqueVolcan', pk, 1, 78 + i * 3, { y: 0.2, turn: 0.4 + i * 0.9, a: [9, c, 'trim'] })); // open boats in the basin
  [[6190, 'blue'], [6420, 'yellow']].forEach(([pk, c], i) => by('bateauVolcan', pk, 1, 96, { y: 0, turn: 1.3 + i, a: [22, c, 'trim'] })); // two trawlers at their moorings
  by('pontonVolcan', 6340, 1, 68, { y: 1.4, a: [44] });
  by('digueVolcan', 6480, 1, 62, { y: 5, a: [170] });                                            // the breakwater closes the basin
  [['trim', 0, [5, 3.6, 36, 12]], ['red', 14, [4.7, 4.3, 7, 12]], ['dark', 36, [4.6, 4.6, 0.8, 12]], ['lamp', 36.8, [2.4, 2.4, 3.4, 10]], ['red', 40.2, [2.9, 0.3, 2, 10]]].forEach(([m, y, a]) => by('cylVolcan', 6480, 1, 236, { y: 5 + y, m, a })); // the lighthouse at its end, white with a red band: the landmark of the last straight
};
