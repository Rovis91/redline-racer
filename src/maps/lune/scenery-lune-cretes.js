// "lune" blockout, zone 3: Montée de la crête (PK 1350 to 1720, 63 to 66 m, 18 m wide): the straight run-up along the ridge to the lip, on the rim of the great eastern crater. Only this zone's named blocks; put() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).cretes = ({ put, far }) => {
  const ROCK = 0x3a4450, PALE = 0xbdc6c5, ORANGE = 0xda8a41, EARTH = 0x4f8fd0;
  for (const [pk, sd] of [[1380, -1], [1470, 1], [1560, -1], [1640, 1]]) { put('FLANC ROCHEUX', ROCK, pk, sd, 30, 30, 14 + pk % 3 * 5, 60); put('CRÊTE', PALE, pk + 40, -sd, 40, 20, 6, 40); } // two flanks of different scales, 30 m back
  put('ANTENNE LIAISON', ORANGE, 1430, -1, 60, 3, 18, 3);
  for (const sd of [-1, 1]) put('PLONGEOIR', ORANGE, 1712, sd, 2, 6, 14, 6);                // the lip: an orange post on each side, the last thing before the void
  for (const x of [-450, 20]) far('DORSALE', ROCK, x, -720, 400, 60, 100);                  // far relief silhouettes on the northern horizon, beyond the loop
  far('TERRE', EARTH, 2990, 245, 220, 220, 220, 480);                                       // the Earth, dead ahead of the jump: one box in the sky, 3 km beyond the lip
};
