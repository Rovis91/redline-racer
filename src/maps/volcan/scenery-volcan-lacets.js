// "volcan" blockout, zone 5: Les Lacets (PK 4890 to 6100, 112 to 12 m): three hairpins down the south-west flank to the quay. Only the named blocks of this zone; put() is described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).lacets = ({ put }) => {
  const OCHRE = 0xd8a85a, CREAM = 0xe8d9ac, CORAL = 0xd88d72, BLACK = 0x2c2e30;
  [[5040, CREAM], [5290, OCHRE], [5620, CORAL], [5740, CREAM], [5990, OCHRE]].forEach(([pk, c]) => put('MAISON', c, pk, -1, 10, 12, 8, 14)); // hillside houses above the harbour, between the legs
  for (const pk of [4960, 5230, 5560, 5940]) put('TERRASSE', BLACK, pk, 1, 12, 3, 3, 40);  // black stone terraces on the outer side
};
