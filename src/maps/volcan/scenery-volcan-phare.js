// "volcan" blockout, zone 6: Le Phare (PK 6220 to 6906, 40 to 12 m). Only this zone's named blocks; put() is described in scenery-volcan.js.
// No second harbour: the lighthouse and breakwater are those of zone 1 (scenery-volcan-quais.js), seen again from the last curve.
(window.VOLCAN = window.VOLCAN || {}).phare = ({ put }) => {
  const CONCRETE = 0xb8b5a6, CORAL = 0xd88d72, CREAM = 0xe8d9ac, RED = 0xb75d43;
  for (const pk of [6560, 6700]) put('HANGAR', CONCRETE, pk, 1, 14, 18, 8, 50);          // low harbour sheds, island side
  for (const pk of [6420, 6620, 6800]) put('BATEAU', CORAL, pk, -1, 85, 6, 4, 16, 0);    // boats at anchor
  for (const pk of [6350, 6500, 6650, 6800]) put('BALISE', RED, pk, -1, 8, 2, 6, 2);     // wind flags and beacons along the return
  put('MURET', CREAM, 6300, -1, 1, 2, 1.2, 120);
};
