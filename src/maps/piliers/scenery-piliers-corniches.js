// "piliers" blockout, zone 2: Corniches des deux tours (PK 735 to 1710, +182 to +215 m, 16 m wide). Only this zone's named blocks; put(), mass() and summit() are described in scenery-piliers.js.
// Relief (scenery-piliers.js): the road turns round P2 (wall on the right, cliff edge 12 m from the left wall), runs through a 10 m rock cut, then wraps P3 (wall on the left, the ravine notch on the right).
(window.PILIERS = window.PILIERS || {}).corniches = ({ put, summit }) => {
  const PINE = 0x3c554a;
  summit('PILIER P3 +370', 545, 752, 370);
  for (const p of [1040, 1380, 1530]) put('PIN', PINE, p, 1, 6, 5, 14, 5); // rare pines on the open side, off the critical angles
};
