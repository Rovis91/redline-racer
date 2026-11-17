// "volcan" blockout, zone 5: Les Lacets (PK 4890 to 6100, 112 to 12 m): three hairpins down the south-west flank to the quay. Only the named blocks of this zone; put(), abs(), over(), row() and lot() are described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).lacets = ({ put, row }) => {
  const OCHRE = 0xd8a85a, CREAM = 0xe8d9ac, CORAL = 0xd88d72, BLACK = 0x2c2e30, WHITE = 0xf4efe2, GREEN = 0x4f6a50, LEAF = 0x5f8a4a, TILE = 0xb75d43;
  row('MAISON', CREAM, [5040, 5330, 5740], -1, 10, 12, 8, 14); row('', OCHRE, [5080, 5290, 5990], -1, 10, 12, 7, 14); row('', CORAL, [5620, 5700, 6040], -1, 10, 11, 8, 12); // hillside houses above the harbour, between the legs
  row('', TILE, [5040, 5330, 5740, 5080, 5290, 5990], -1, 24, 8, 4, 8);                                       // their outbuildings, further up the bank
  row('BANANERAIE', LEAF, [5120, 5520, 5800], -1, 12, 30, 5, 44);                                             // banana groves as single volumes on the inner side
  row('TERRASSE', BLACK, [4960, 5230, 5560, 5940], 1, 12, 3, 3, 40); row('', BLACK, [4960, 5230, 5560, 5940], 1, 30, 3, 5, 40); // black stone terraces on the outer side
  row('JARDIN', GREEN, [4966, 5236, 5566, 5946], 1, 17, 11, 1.2, 30);
  put('CHAPELLE', WHITE, 5450, 1, 26, 8, 9, 12); put('CLOCHER', WHITE, 5462, 1, 28, 4, 18, 4);                // white chapel outside the second hairpin: the braking landmark of the descent
  row('PALMIER', [GREEN, 'cone'], [5160, 5175, 5850, 5865], 1, 6, 6, 10, 6);                                  // a pair of palms marks the first and the last hairpin
  row('MURET', CREAM, [5160, 5470, 5860], 1, 1, 1.5, 1.2, 50);
};
