// "lune" blockout, zone 3: S des crêtes (PK 1400 to 2300, 44 to 68 m, dip 42 m near PK 1550, summit 69 m at PK 2200, 18 m wide). The northern impact (Ø 283 m) is terrain, on the left. Only this zone's named blocks; put() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).cretes = ({ put, far, at }) => {
  const ROCK = 0x3a4450, PALE = 0xbdc6c5, ORANGE = 0xda8a41, EARTH = 0x4f8fd0;
  // two rocky flanks of different scales, the tall one always on the outside of the bend and 30 m back: no rock hides the next change of direction
  for (let pk = 1440; pk < 2280; pk += 120) { const out = at(pk).k > 0 ? -1 : 1; put('FLANC ROCHEUX', ROCK, pk, out, 30, 30, 14 + pk % 3 * 6, 60); put('CRÊTE', PALE, pk + 60, -out, 45, 20, 6, 40); }
  put('ANTENNE LIAISON', ORANGE, 1900, -1, 60, 3, 18, 3);
  for (const x of [-500, 150, 800]) far('DORSALE', ROCK, x, -900, 500, 70, 120);                                // far relief silhouettes on the northern horizon, beyond the loop
  far('TERRE', EARTH, 2750, -950, 200, 200, 200, 550);                                                            // the Earth, revealed above the ridge line at the exit of the S: one box in the sky, 2.5 km east-north-east of the summit
};
