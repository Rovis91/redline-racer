// "volcan", zone 5: Les Lacets (PK 4890 to 6100, 112 to 12 m): three hairpins down the south-west flank to the quay. set(), by(), slab() and gate() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).lacets = ({ by }) => {
  [[5040, 'cream'], [5330, 'cream'], [5740, 'cream'], [5080, 'ochre'], [5290, 'ochre'], [5990, 'ochre'], [5620, 'coral'], [5700, 'coral'], [6040, 'coral']].forEach(([pk, c], i) => {
    by('maisonVolcan', pk, -1, 16, { a: [12, 5 + (i % 3), 9, c] }); if (i < 6) by('maisonVolcan', pk + 6, -1, 30, { a: [8, 3.5, 7, 'white'] }); }); // hillside houses above the harbour, between the legs, and their outbuildings
  by('bananeraieVolcan', [5120, 5520, 5800], -1, 30, { a: [44, 30], seed: 1 });                  // banana groves as dense low blocks on the inner side: the only saturated green of the map
  by('chapelleVolcan', 5450, 1, 34);                                                             // white chapel and bell tower outside the second hairpin: the braking mark of the descent
  by('palmierVolcan', [5160, 5175, 5850, 5865], 1, 7, { a: [10], seed: 1 });                     // a pair of palms marks the first and the last hairpin
};
