// "volcan" blockout, zone 6: Les Quais (PK 6100 to the line, 12 m). Only the named blocks of this zone; put(), abs(), over(), row() and lot() are described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).quais = ({ put, row }) => {
  const OCHRE = 0xd8a85a, CREAM = 0xe8d9ac, CORAL = 0xd88d72, TILE = 0xb75d43, BASALT = 0x34373d, WHITE = 0xf4efe2, WOOD = 0x8a6a48, SAND = 0xc9b58a, STEEL = 0x555a60;
  row('MAISON', OCHRE, [6158, 6518], -1, 14, 14, 9, 22); row('', CREAM, [6248, 6428], -1, 14, 14, 10, 22); put('', CORAL, 6338, -1, 14, 14, 8, 22); // the front row, island side, set back from the racing axis
  row('', CREAM, [6200, 6400], -1, 44, 12, 8, 18); row('', OCHRE, [6300, 6480], -1, 44, 12, 9, 18);           // a second row behind
  put('CRIEE', TILE, 6378, 1, 30, 22, 5, 60); put('ATELIER NAUTIQUE', CREAM, 6200, 1, 30, 20, 5, 40);         // low sheds on the quay, sea side
  row('CAISSES', WOOD, [6290, 6302, 6314, 6450], 1, 10, 4, 3, 5); row('FILETS', SAND, [6260, 6470], 1, 14, 8, 0.6, 12); // crates, and nets laid out to dry
  row('BORNE', [STEEL, 'cyl'], [6170, 6220, 6270, 6320, 6370, 6420, 6470, 6520], 1, 52, 1.2, 1.6, 1.2);       // mooring posts along the quay edge
  row('BARQUE', CORAL, [6230, 6278, 6498, 6540], 1, 80, 5, 3, 12, 0); row('PONTON', WOOD, [6340], 1, 72, 44, 1.5, 5, 0); // at water level, off the quay
  put('DIGUE', BASALT, 6480, 1, 60, 170, 5, 10, 0);                                                           // the breakwater closes the basin
  put('PHARE', [WHITE, 'cyl'], 6480, 1, 230, 10, 40, 10, 0); put('', [TILE, 'cyl'], 6480, 1, 229.5, 11, 7, 11, 18); // lighthouse at its end, white with a red band: the landmark of the last straight
};
