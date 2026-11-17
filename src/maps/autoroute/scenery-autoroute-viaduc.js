// "autoroute" blockout, zone 3: Le viaduc des toits-jardins (PK 1488 to 2297, high point at +32 m, one long right-hand curve over the basin). Only this zone's named blocks; helpers are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).viaduc = ({ put, spot, gantry }) => {
  const GARDEN = 0x6fa860, ROOF = 0x8fb070, RUIN = 0x9aa6a0, SKY = 0x7f8f98;
  spot('TOUR-JARDIN', GARDEN, 440, -30, 36, 95, 36); spot('TOUR-JARDIN', GARDEN, 500, 40, 36, 80, 36);             // the twin landmark, inside the curve, far from the ribbon
  for (const [pk, off] of [[1560, 50], [1760, 70], [1960, 45], [2160, 60]]) put('TOIT VEGETALISE', ROOF, pk, -1, off, 40, 28, 40, -4); // emerged roofs outside the curve, tops below the deck
  for (const pk of [1660, 1900, 2100]) put('ILOT BATI', RUIN, pk, 1, 90, 40, 22, 50, -4);                           // the inside of the curve stays open: low, far
  [[1620, 110], [1820, 85], [2020, 120], [2220, 95]].forEach(([pk, top]) => put('SKYLINE NOYEE', SKY, pk, -1, 200, 60, top + 4, 60, -4));
  gantry(1900);
};
