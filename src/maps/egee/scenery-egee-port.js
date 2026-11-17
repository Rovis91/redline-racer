// "egee" blockout, zone 1: Port (PK 0 to 650, 8 to 20 m, 16 m wide). Only this zone's named blocks; put() is described in scenery-egee.js.
(window.EGEE = window.EGEE || {}).port = ({ put }) => {
  const WHITE = 0xfff6e6, SAND = 0xd6ad73, WOOD = 0x8a6a48, CORAL = 0xed7956, ROCK = 0xb97049;
  for (const pk of [30, 110, 190, 270]) put('FRONT DE MER', WHITE, pk, -1, 6, 18, 9, 64);   // town side: a continuous built front, set back behind a pavement
  for (const pk of [370, 450]) put('ENTREPOT', SAND, pk, -1, 8, 26, 10, 50);
  for (const pk of [60, 150, 240]) put('PONTON', WOOD, pk, 1, 16, 50, 1.5, 6, 0);            // sea side, at water level
  for (const pk of [105, 195, 285]) put('BATEAU', CORAL, pk, 1, 34, 5, 4, 14, 0);
  put('DIGUE', SAND, 340, 1, 18, 140, 3, 8, 0); put('PHARE', WHITE, 340, 1, 158, 6, 28, 6, 0); // the breakwater closes the basin; the lighthouse at its end is the far landmark of the quay curve
  put('FALAISE', ROCK, 590, -1, 6, 30, 24, 90);                                                // transition: the built front stops, the walls turn to rock
};
