// "volcan", zone 6: Les Quais (PK 6100 to the line, 12 m), the home straight. set(), by(), slab() and gate() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).quais = ({ by }) => {
  [[6158, 'ochre'], [6248, 'cream'], [6338, 'coral'], [6428, 'cream'], [6518, 'ochre']].forEach(([pk, c], i) => by('maisonVolcan', pk, -1, 20, { a: [20, 7.5 + (i & 1), 10, c] })); // the front row, island side, set back from the racing axis
  [[6200, 'cream'], [6300, 'ochre'], [6400, 'cream'], [6480, 'coral']].forEach(([pk, c]) => by('maisonVolcan', pk, -1, 50, { a: [14, 7, 9, c] })); // a second row behind
  by('crieeVolcan', 6378, 1, 42, { a: [60, 20] }); by('hangarVolcan', 6200, 1, 40, { a: [40, 5, 18] }); // the fish market and the boat workshop on the quay, sea side
  by('caissesVolcan', [6290, 6302, 6314, 6450], 1, 12, { a: [9], seed: 1 }); by('filetsVolcan', [6260, 6470], 1, 18); // crates, and nets laid out to dry
  by('bollardVolcan', [6170, 6220, 6270, 6320, 6370, 6420, 6470, 6520], 1, 58);                  // mooring posts along the quay edge
  [[6230, 'coral', 'white'], [6278, 'white', 'blue'], [6498, 'blue', 'white'], [6540, 'coral', 'white']].forEach(([pk, c, b], i) => by('barqueVolcan', pk, 1, 84 + i * 3, { y: 0.2, turn: 0.4 + i * 0.9, a: [8, c, b] })); // open boats in the basin
  by('pontonVolcan', 6340, 1, 68, { y: 1.4, a: [44] });
  by('digueVolcan', 6480, 1, 62, { y: 5, a: [170] });                                            // the breakwater closes the basin
  [['white', 0, [5, 3.6, 36, 12]], ['red', 14, [4.7, 4.3, 7, 12]], ['dark', 36, [4.6, 4.6, 0.8, 12]], ['lamp', 36.8, [2.4, 2.4, 3.4, 10]], ['red', 40.2, [2.9, 0.3, 2, 10]]].forEach(([m, y, a]) => by('cylVolcan', 6480, 1, 236, { y: 5 + y, m, a })); // the lighthouse at its end, white with a red band: the landmark of the last straight
};
