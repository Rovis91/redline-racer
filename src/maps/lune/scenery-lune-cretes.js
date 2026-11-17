// "lune" blockout, zone 3: La crête (PK 1340 to 2920, 63 to 70 m, 18 m wide): the long ridge that goes round the great eastern crater by the north (PK 1340 to 2500), a tight right-hand hairpin at its top (PK 2500 to 2670),
// then a 260 m straight run-up to the rim, raised 3 m at its end (M.jumps): the lip. The run-up, the centre of the crater and the tunnel are on one line. Only this zone's named blocks; put() and far() are described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).cretes = ({ put, far }) => {
  const ROCK = 0x3a4450, PALE = 0xbdc6c5, ORANGE = 0xda8a41, EARTH = 0x4f8fd0;
  for (let pk = 1400, k = 0; pk < 2450; pk += 170, k++) { const sd = k % 2 ? 1 : -1; put('FLANC ROCHEUX', ROCK, pk, sd, 30, 30, 14 + k % 3 * 5, 60); put('CRÊTE', PALE, pk + 60, -sd, 40, 20, 6, 40); } // two flanks of different scales, alternating, 30 m back
  put('ANTENNE LIAISON', ORANGE, 2580, -1, 20, 4, 30, 4); put('BLOCS', ROCK, 2520, -1, 12, 16, 7, 20); put('BLOCS', ROCK, 2640, -1, 12, 16, 6, 20); // the hairpin: the antenna on its outside, the landmark of the turn; nothing after it: the last 260 m are empty, the crater fills the view
  for (const x of [-250, 350]) far('DORSALE', ROCK, x, -1300, 400, 60, 100);                // far relief silhouettes on the northern horizon, beyond the loop
  far('TERRE', EARTH, -310, 2230, 220, 220, 220, 480);                                      // the Earth, dead ahead of the jump, above the far rim: one box in the sky, 3 km beyond the lip
};
