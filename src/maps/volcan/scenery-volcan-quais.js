// "volcan" blockout, zone 6: Les Quais (PK 6100 to the line, 12 m). Only the named blocks of this zone; put() is described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).quais = ({ put }) => {
  const OCHRE = 0xd8a85a, CREAM = 0xe8d9ac, CORAL = 0xd88d72, TILE = 0xb75d43, BASALT = 0x34373d, WHITE = 0xf4efe2;
  [[6158, OCHRE], [6248, CREAM], [6338, CORAL], [6428, CREAM], [6518, OCHRE]].forEach(([pk, c]) => put('MAISON', c, pk, -1, 14, 14, 9, 22)); // island side, set back from the racing axis
  put('CRIEE', TILE, 6378, 1, 30, 22, 5, 60); put('ATELIER NAUTIQUE', CREAM, 6200, 1, 30, 20, 5, 40);                                         // low sheds on the quay, sea side
  for (const pk of [6278, 6498]) put('BARQUE', CORAL, pk, 1, 80, 5, 3, 12, 0);                                                                 // at water level, off the quay
  put('DIGUE', BASALT, 6480, 1, 60, 170, 5, 10, 0); put('PHARE', WHITE, 6480, 1, 230, 10, 40, 10, 0);                                          // lighthouse at the end of the breakwater: the landmark of the last straight
};
