// "autoroute" blockout, zone 3: La bretelle et le pont (PK 978 to 1814): the slip road climbs in a 180 degree left curve to +13 m (PK 1214), the motorway bridge runs south over the start straight (PK 1491),
// then curves right and comes back down to the street. Half-width 8 m. Only this zone's named blocks; helpers are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).bretelle = ({ put, shoulder, gantry, at }) => {
  const BRICK = 0x8a5a48, STONE = 0xa89a80, GLASS = 0x7f9a98, GREEN = 0x4f7a3c, RUST = 0x9a5a3a, CONC = 0x8f8c82;
  gantry(990, 'ENTREE AUTOROUTE');
  put('STATION SERVICE', 0xd8cfa8, 1095, -1, 22, 30, 6, 30); put('VEGETATION', GREEN, 1095, 1, 6, 14, 8, 60);                    // inside and outside of the loop
  put('TOUR DE BUREAUX', GLASS, 1170, 1, 25, 30, 60, 30);                                                                         // the landmark seen from the whole climb
  // the bridge between the buildings: tops 10 to 20 m above the deck; none over the start straight
  for (const pk of [1250, 1330, 1410, 1570]) { put('IMMEUBLE', BRICK, pk, -1, 12, 24, 30, 50); put('IMMEUBLE', STONE, pk + 30, 1, 12, 24, 26, 50); }
  gantry(1300, 'PORTIQUE');
  shoulder(1340, 1420, 1, 6); put('CAMION ABANDONNE', RUST, 1365, 1, 1.5, 3, 3.6, 12, at(1365).y); put('EPAVES', RUST, 1400, 1, 1.5, 3, 1.7, 10, at(1400).y);
  put('BRETELLE EFFONDREE', CONC, 1560, 1, 0.5, 8, 2, 50, at(1560).y - 2);                                                         // the other exit, broken off
  put('IMMEUBLE', STONE, 1660, -1, 14, 26, 28, 40); put('VEGETATION', GREEN, 1760, 1, 5, 10, 8, 50);                               // outside of the descent curve; the embankment
};
