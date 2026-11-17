// "autoroute" blockout, zone 5: La reconquete verte (PK 4015 to 5228, climb from +1 m back to the terrace at +24 m, laid on its embankment). Only this zone's named blocks; put() is described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).reconquete = ({ put }) => {
  const CANOPY = 0x4f8a3c, FOREST = 0x3f6f38, TREE = 0x6fa040, HIDDEN = 0x8a9a78;
  for (let pk = 4080, k = 0; pk <= 4800; pk += 90, k++) put('CANOPEE', CANOPY, pk, k % 2 ? 1 : -1, 8, 36, 16, 50);  // tree masses behind the walls, alternating: the next bend stays readable
  for (const pk of [4500, 4770]) put('ARBRE GEANT', TREE, pk, 1, 14, 12, 30, 12);
  put('IMMEUBLE ENVAHI', HIDDEN, 4300, 1, 55, 26, 40, 40); put('IMMEUBLE ENVAHI', HIDDEN, 4680, -1, 60, 26, 36, 40); put('IMMEUBLE ENVAHI', HIDDEN, 5010, 1, 60, 26, 34, 40);
  for (const pk of [4890, 5000, 5110]) { put('FORET URBAINE', FOREST, pk, -1, 14, 50, 18, 40); put('FORET URBAINE', FOREST, pk + 50, 1, 14, 50, 18, 40); } // the terrace: forest on both sides up to the start line
};
