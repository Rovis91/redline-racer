// "volcan" blockout, zone 1: Le Phare (PK 0 to 690, 12 to 40 m), the last sector of the bible run as the first: the start leaves the harbour eastwards. Only the named blocks of this zone; put() is described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).phare = ({ put }) => {
  const CONCRETE = 0xb8b5a6, CORAL = 0xd88d72, CREAM = 0xe8d9ac, RED = 0xb75d43;
  for (const pk of [206, 346]) put('HANGAR', CONCRETE, pk, -1, 14, 18, 8, 50);         // low harbour sheds, island side
  for (const pk of [106, 286, 486]) put('BATEAU', CORAL, pk, 1, 85, 6, 4, 16, 0);      // boats at anchor
  for (const pk of [106, 256, 406, 556]) put('BALISE', RED, pk, 1, 8, 2, 6, 2);        // wind flags and beacons along the shore
  put('MURET', CREAM, 606, 1, 1, 2, 1.2, 120);
};
