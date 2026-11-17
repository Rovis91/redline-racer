// "volcan" blockout, zone 1: Le Phare (PK 0 to 690, 12 to 40 m), the last sector of the bible run as the first: the start leaves the harbour eastwards. Only the named blocks of this zone; put(), abs(), over(), row() and lot() are described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).phare = ({ put, row }) => {
  const CONCRETE = 0xb8b5a6, CORAL = 0xd88d72, CREAM = 0xe8d9ac, RED = 0xb75d43, WOOD = 0x8a6a48, STEEL = 0x555a60, GREEN = 0x4f6a50, BASALT = 0x34373d, OCHRE = 0xd8a85a;
  row('MAISON', OCHRE, [40, 100], -1, 14, 14, 9, 22); put('CAFE DU PORT', CORAL, 150, -1, 10, 10, 6, 16);  // the last fronts of the harbour, island side
  row('HANGAR', CONCRETE, [220, 300, 380], -1, 14, 18, 8, 50);                                               // low harbour sheds
  put('GRUE', STEEL, 180, 1, 34, 4, 24, 4); put('', STEEL, 180, 1, 30, 26, 2, 3, 34);                         // harbour crane: mast and jib over the quay edge
  row('CAISSES', WOOD, [120, 132, 144, 236, 248], 1, 12, 4, 3, 5); row('', WOOD, [126, 242], 1, 17, 4, 5, 5); // crates stacked on the quay
  row('BATEAU', CORAL, [106, 286, 486], 1, 85, 6, 4, 16, 0); row('MAT', [CREAM, 'cyl'], [106, 286, 486], 1, 87.5, 1, 14, 1, 0); // boats at anchor, each with its mast
  row('PONTON', WOOD, [200, 400], 1, 72, 40, 1.5, 5, 0);
  row('BALISE', [RED, 'cyl'], [106, 256, 406, 556], 1, 4, 2, 6, 2);                                           // wind flags and beacons along the shore
  row('PALMIER', [GREEN, 'cone'], [330, 390, 450, 510, 570], -1, 5, 6, 10, 6);                                // sparse planting, island side
  put('MURET', CREAM, 606, 1, 1, 2, 1.2, 120);
  row('ROCHER', BASALT, [600, 640, 676], -1, 8, 14, 9, 18);                                                   // transition: the sheds stop, black rock begins
};
