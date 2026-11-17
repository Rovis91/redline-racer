// "piliers" blockout, zone 2: Corniches des deux tours (PK 735 to 1710, +182 to +215 m, 16 m wide). Only this zone's named blocks; put() and mass() are described in scenery-piliers.js.
(window.PILIERS = window.PILIERS || {}).corniches = ({ put, mass }) => {
  const ROCK = 0xb6aa8f, CUT = 0x687c65, STONE = 0xe9e1cc, PINE = 0x3c554a;
  mass('PILIER P3 +370', ROCK, 545, 752, 60, 160, 370);
  for (const p of [800, 880]) put('PAROI P2', ROCK, p, 1, 3, 30, 35, 60);            // the road turns round P2, wall on the inside
  for (const p of [1250, 1330, 1410, 1490, 1570]) put('PAROI P3', ROCK, p, 1, 3, 25, 40, 60); // then wraps P3: the central squeeze against the wall
  for (const p of [980, 1080, 1170]) put('DEBLAI', CUT, p, -1, 3, 12, 10, 60);        // rock cuts
  for (const p of [960, 1300, 1450, 1600]) put('GARDE-CORPS', STONE, p, -1, 1, 1.5, 1.5, 70); // outer edge, open stretches only
  for (const p of [1040, 1380, 1530]) put('PIN', PINE, p, -1, 6, 5, 14, 5);           // rare pines, off the critical angles
};
