// "autoroute" blockout, zone 2: L'aire des machines oubliees (PK 700 to 1488, climb from +24 to +32 m, over the crossing X1 at PK 735). Only this zone's named blocks; helpers are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).machines = ({ put, shoulder, gantry, at }) => {
  const CONC = 0x8f8c82, RUST = 0xb5613a, SHED = 0xa89a78, TYRE = 0x2a2a2e, y = at(1150).y, yD = at(1380).y + 11;
  put('BRETELLE FERMEE', CONC, 900, -1, 1, 9, 2, 150, at(900).y - 2);              // a closed slip road along the left wall
  gantry(1000);
  shoulder(1080, 1220, 1, 44);                                                     // the breakdown area: a widened shoulder on the right, at road level
  put('ATELIER DE DEPANNAGE', SHED, 1170, 1, 16, 22, 9, 40, y); put('STATION SERVICE', 0xd8cfa8, 1105, 1, 14, 16, 5, 20, y);
  put('REMORQUEUSE', RUST, 1120, 1, 4, 3, 3.5, 9, y); put('EPAVES DEMONTEES', RUST, 1160, 1, 3, 6, 1.8, 18, y); put('PILE DE PNEUS', TYRE, 1200, 1, 4, 3, 2.5, 3, y);
  put("DALLE D'ECHANGEUR", CONC, 1380, -1, -79, 140, 3, 26, yD);                   // the high slab of the interchange crosses above the road, 11 m clear
  for (const sd of [-1, 1]) put('PILE', CONC, 1380, sd, 6, 5, yD + 4, 5, -4);
  put('BRETELLE FERMEE', CONC, 1300, -1, 1, 9, 2, 120, at(1300).y - 2);
};
