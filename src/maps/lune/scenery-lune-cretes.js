// "lune" blockout, zone 3: La crête (PK 1340 to 3000, 63 to 70 m, 18 m wide): a winding ridge that goes round the great eastern crater by the north, six bends between rocky flanks (PK 1340 to 2600),
// a tight right-hand hairpin at its top (PK 2680), then a 180 m run-up to the rim, raised 3 m at its end (M.jumps): the lip. The run-up, the centre of the crater and the tunnel are on one line.
// Only this zone's named blocks; put() and far() are described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).cretes = ({ put, far, at }) => {
  const ROCK = 0x3a4450, PALE = 0xbdc6c5, ORANGE = 0xda8a41, EARTH = 0x4f8fd0;
  // a tall flank on the outside of each bend, 30 m back, a low crest on the inside: nothing hides the next change of direction
  for (let pk = 1420, k = 0; pk < 2600; pk += 150, k++) { const out = at(pk).k > 0 ? -1 : 1; put('FLANC ROCHEUX', ROCK, pk, out, 30, 30, 14 + k % 3 * 5, 60); put('CRÊTE', PALE, pk + 40, -out, 45, 20, 6, 40); }
  put('ANTENNE LIAISON', ORANGE, 2700, -1, 20, 4, 30, 4); put('BLOCS', ROCK, 2650, -1, 12, 16, 7, 20); put('BLOCS', ROCK, 2750, -1, 12, 16, 6, 20); // the hairpin: the antenna on its outside, the landmark of the turn; nothing after it: the run-up is empty, the crater fills the view
  for (const x of [-250, 350]) far('DORSALE', ROCK, x, -1300, 400, 60, 100);                // far relief silhouettes on the northern horizon, beyond the loop
  far('TERRE', EARTH, -310, 2230, 220, 220, 220, 480);                                      // the Earth, dead ahead of the jump, above the far rim: one box in the sky, 3 km beyond the lip
};
