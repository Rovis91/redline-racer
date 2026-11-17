// "volcan" blockout, zone 1: Les Quais (PK 0 to 970, 12 to 27 m). Only this zone's named blocks; put() is described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).quais = ({ put }) => {
  const OCHRE = 0xd8a85a, CREAM = 0xe8d9ac, CORAL = 0xd88d72, TILE = 0xb75d43, BASALT = 0x34373d, WHITE = 0xf4efe2;
  [[60, OCHRE], [150, CREAM], [240, CORAL], [330, CREAM], [420, OCHRE]].forEach(([pk, c]) => put('MAISON', c, pk, 1, 14, 14, 9, 22)); // island side, set back from the racing axis
  put('CRIEE', TILE, 200, -1, 30, 22, 5, 60); put('ATELIER NAUTIQUE', CREAM, 420, -1, 30, 20, 5, 40);                                   // low sheds on the quay, sea side
  for (const pk of [80, 300, 520]) put('BARQUE', CORAL, pk, -1, 80, 5, 3, 12, 0);                                                        // at water level, off the quay
  put('DIGUE', BASALT, 560, -1, 60, 170, 5, 10, 0); put('PHARE', WHITE, 560, -1, 230, 10, 40, 10, 0);                                      // lighthouse at the end of the breakwater: landmark of the start and of the return
  put('FALAISE', BASALT, 880, 1, 5, 30, 26, 110);                                                                                        // transition: the fronts stop, black rock takes over
};
