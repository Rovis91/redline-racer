// "volcan", zone 1: Le Phare (PK 0 to 690, 12 to 40 m), the working end of the harbour: the start leaves the quay eastwards. Island on the left (-1), quay and sea on the right (1). set(), by(), slab() and gate() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).phare = ({ by }) => {
  by('maisonVolcan', 40, -1, 20, { a: [16, 7, 10, 'ochre'] }); by('maisonVolcan', 100, -1, 20, { a: [14, 6, 10, 'cream'] }); by('maisonVolcan', 150, -1, 17, { a: [14, 4.5, 9, 'coral'] }); // the last fronts and the café, set back from the racing axis
  by('hangarVolcan', [220, 300, 380], -1, 24, { a: [46, 7, 18] });                              // three low sheds, doors open on the dark
  by('grueVolcan', 180, 1, 38);                                                                  // the landmark of the start: the crane, its jib over the quay edge
  by('caissesVolcan', [120, 132, 144, 236, 248], 1, 14, { a: [9], seed: 1 }); by('filetsVolcan', 300, 1, 20);
  [[106, 'blue'], [286, 'coral'], [486, 'white']].forEach(([pk, c], i) => by('bateauVolcan', pk, 1, 92, { y: 0, turn: 1.2 + i * 0.5, a: [16, c, c === 'white' ? 'red' : 'white'] })); // boats at anchor off the quay
  by('pontonVolcan', [200, 400], 1, 68, { y: 1.4, a: [36] });
  by('baliseVolcan', [106, 256, 406, 556], 1, 5);
  by('palmierVolcan', [330, 390, 450, 510, 570], -1, 7, { a: [9], seed: 1 });                    // a few palms, spaced: never a row of trees
  by('muretVolcan', [565, 595, 625, 655], 1, 1.6, { a: [29] });
  by('rocherVolcan', [600, 640, 676], -1, 15, { m: 'rock', a: [18, 10, 20], seed: 1 });          // transition: the sheds stop, black rock begins
};
