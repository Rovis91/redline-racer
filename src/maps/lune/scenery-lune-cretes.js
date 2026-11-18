// "lune", zone 3: La crête (PK 1340 to 3080, 63 to 70 m, 18 m wide): a winding ridge that goes round the great eastern crater by the north, six bends between rocky flanks (PK 1340 to 2600),
// a tight right-hand hairpin at its top (PK 2700), then a 220 m run-up to the rim, raised 3 m at its end (M.jumps): the lip. The run-up, the centre of the crater and the tunnel are on one line.
// by(), add() and stand() are described in scenery-lune.js; shapes in shapes-lune-relief.js and shapes-lune-base.js.
(window.LUNE = window.LUNE || {}).cretes = ({ by, add, stand, at, MAT }) => {
  // a tall flank on the outside of each bend, 30 m back, a low pale crest on the inside: nothing hides the next change of direction
  for (let pk = 1420, k = 0; pk < 2600; pk += 150, k++) { const out = at(pk).k > 0 ? -1 : 1; add(by(pk, out, 30, [30, 60]), 'flancLune', [30, 14 + k % 3 * 5, 60, k], [0, 0, 0], MAT.rock); add(by(pk + 40, -out, 45, [20, 40]), 'rocherLune', [20, 6, 40, k + 20], [0, 0, 0], MAT.pale); }
  add(by(2740, -1, 20, [4, 4]), 'antenneLune', [30]);                                          // the hairpin: the link antenna on its outside, the landmark of the turn
  for (const pk of [2680, 2800]) add(by(pk, -1, 12, [16, 20]), 'rocherLune', [16, 7, 20, pk], [0, 0, 0], MAT.rock); // nothing after it: the run-up is empty, the crater fills the view
  add(stand(-310, 2230, Math.atan2(918, -2859), 480), 'terreLune', [110], [0, 0, 0], MAT.earth); // the Earth, dead ahead of the jump, above the far rim: a small lit disc, 3 km beyond the lip
};
