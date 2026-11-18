// "volcan", zone 1: Le Phare (PK 0 to 690, 12 to 40 m), boathouses and fish racks: the start leaves the quay eastwards. Island on the left (-1), quay and sea on the right (1). set(), by(), slab(), line(), drape() and scatter() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).phare = ({ by, slab, range, scatter }) => {
  for (let pk = 10; pk < 400; pk += 20) { slab('paving', pk, 60, 1, 21, -1.05, 38); slab('paving', pk, 34, 1, 21, -1.05, -25); } // the quay and the yard of the boathouses, paved
  by('naustVolcan', [64, 98, 132, 166, 200, 234, 268, 302, 336, 370], -1, 9, { a: [10, 4.2, 16, 'red'] }); // the landmark of the start: a row of red boathouses, gable to the road, close to it
  by('sechoirVolcan', [120, 190, 260, 330], 1, 11, { a: [18, 9] });                                // fish racks on the quay, taller than a house, at the roadside
  by('sechoirVolcan', [155, 225, 295], 1, 30, { a: [16, 8] });
  by('caissesVolcan', [86, 150, 216, 290, 356], 1, 3.5, { a: [9], seed: 1 }); by('filetsVolcan', [380, 440], 1, 9);
  by('barqueVolcan', [56, 240, 410], 1, 7, { dy: 0.5, turn: 0.35, a: [8, 'yellow', 'trim'] });    // boats hauled out on the quay
  by('reverbereVolcan', range(24, 520, 44), 1, 1.4);
  [[106, 'blue'], [286, 'red'], [486, 'yellow']].forEach(([pk, c], i) => by('bateauVolcan', pk, 1, 84, { y: 0, turn: 1.2 + i * 0.5, a: [22, c, 'trim'] })); // trawlers at anchor off the quay
  by('pontonVolcan', [200, 400], 1, 68, { y: 1.4, a: [36] });
  by('baliseVolcan', [106, 256, 406, 556], 1, 5);
  by('torfVolcan', [450, 500], -1, 11, { a: [9, 6, 'red'] });                                      // the last sheds of the station, under turf
  by('rocherVolcan', [560, 600, 640, 676], -1, 15, { m: 'rock', a: [18, 10, 20], seed: 1 });      // transition: the buildings stop at once, black rock begins
  scatter(530, 690, 'moss', 16);
};
