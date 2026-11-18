// "volcan", zone 1: Le Phare (PK 0 to 690, 12 to 40 m), boathouses and fish racks: the start leaves the quay eastwards. Island on the left (-1), quay and sea on the right (1). set(), by() and slab() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).phare = ({ by, slab }) => {
  for (let pk = 10; pk < 400; pk += 20) { slab('paving', pk, 60, 1, 21, -1.05, 38); slab('paving', pk, 34, 1, 21, -1.05, -25); } // the quay and the yard of the boathouses, paved
  by('naustVolcan', [70, 110, 150, 190, 230, 270, 310, 350], -1, 15, { a: [9, 3.6, 16, 'red'] }); // the landmark of the start: a row of red boathouses, gable to the road
  by('sechoirVolcan', [130, 200, 270], 1, 26, { a: [16, 8] });                                   // fish racks on the quay, taller than a house
  by('caissesVolcan', [100, 164, 236, 330], 1, 12, { a: [9], seed: 1 }); by('filetsVolcan', [380, 440], 1, 18);
  [[106, 'blue'], [286, 'red'], [486, 'yellow']].forEach(([pk, c], i) => by('bateauVolcan', pk, 1, 92, { y: 0, turn: 1.2 + i * 0.5, a: [16, c, 'trim'] })); // trawlers at anchor off the quay
  by('pontonVolcan', [200, 400], 1, 68, { y: 1.4, a: [36] });
  by('baliseVolcan', [106, 256, 406, 556], 1, 5);
  by('rocherVolcan', [560, 600, 640, 676], -1, 15, { m: 'rock', a: [18, 10, 20], seed: 1 });      // transition: the buildings stop at once, black rock begins
};
