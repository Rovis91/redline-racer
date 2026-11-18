// "volcan", zone 5: Les Lacets (PK 4890 to 6100, 112 to 12 m): three hairpins down the south-west flank to the quay. set(), by() and slab() are described in scenery-volcan.js; the shapes in shapes-volcan-<family>.js.
(window.VOLCAN = window.VOLCAN || {}).lacets = ({ by }) => {
  [[5040, 'yellow', 0], [5290, 'blue', 1.57], [5620, 'green', 0], [5740, 'orange', 1.57], [5990, 'violet', 0], [6040, 'teal', 1.57], [5120, 'red', 0]].forEach(([pk, c, turn], i) => by('maisonVolcan', pk, -1, 18, { turn, a: [8 + (i & 1) * 2, 3.8 + (i % 3) * 0.5, 7, c] })); // a few cabins between the legs, each its own colour
  by('egliseVolcan', 5450, 1, 36);                                                               // white timber church and its spire outside the second hairpin: the braking mark of the descent
  by('sechoirVolcan', 5230, -1, 34, { a: [14, 7] }); by('sechoirVolcan', 5800, -1, 30, { a: [14, 7] });
  by('cairnVolcan', [5150, 5470, 5855], 1, 4, { a: [2.6], seed: 1 });                            // a cairn at each hairpin
  [[4960, 30, 10], [5380, 40, 12], [5690, 34, 8], [5920, 44, 11]].forEach(([pk, off, w], i) => by('rocherVolcan', pk, -1, off, { m: 'rock', a: [w, w * 0.5, w, i + 9] }));
};
