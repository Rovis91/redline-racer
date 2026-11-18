// "autoroute", zone 1: Le boulevard (PK 0 to 601, row 0, heading east): 26 m between the kerbs, open from kerb to kerb except at three places, each of another kind:
// the military checkpoint (x = -250 to -120: a double bend between lines of concrete barriers), the collapsed facade on the north side (x = 0), the pile-up on the south side before the motorway bridge (x = 150).
// The barriers, the rubble and the cars are generated in scenery-autoroute-ville.js; here the named blocks: what gives each place its name, and what closes each side street.
(window.AUTOROUTE = window.AUTOROUTE || {}).boulevard = ({ h, spot, bar, cityY }) => {
  const RUST = 0x9a5a3a, BUS = 0xb8a050, RUBBLE = 0x7a756c, OLIVE = 0x5a6240, TREE = 0x5a8a40, Y = cityY(0);
  // the checkpoint: the lane passes north of the truck, then south of the guard post
  spot('CAMION MILITAIRE', OLIVE, -214, 8, 9, 3.4, 3); spot('GUERITE', OLIVE, -160, -8, 4, 3, 4); spot('MIRADOR', OLIVE, -188, -15.5, 3, 9, 3); spot('TENTE MILITAIRE', OLIVE, -160, -15.5, 8, 3, 4);
  spot('EBOULEMENT', RUBBLE, 0, -9.5, 34, 5, 7);                                                          // the facade fallen from the north side
  spot('BUS RENVERSE', BUS, 150, 7, 11, 3.2, 3, Y, 1, 0.4);                                      // the pile-up: the bus lies askew in the south lanes
  bar(-3, 0, 'N', 'BARRAGE MILITAIRE', OLIVE, 4); bar(-3, 0, 'W', 'IMMEUBLE EFFONDRE', RUBBLE, 9);
  bar(-2, 0, 'N', 'BARRAGE MILITAIRE', OLIVE, 4); bar(-2, 0, 'S', 'BARRAGE MILITAIRE', OLIVE, 4);       // the checkpoint closes its two side streets
  bar(-1, 0, 'N', 'ARBRE TOMBE', TREE, 4); bar(-1, 0, 'S', 'BARRICADE', OLIVE, 3);
  bar(0, 0, 'N', 'IMMEUBLE EFFONDRE', RUBBLE, 9); bar(0, 0, 'S', 'RUE AFFAISSEE', RUBBLE, 2);
  bar(1, 0, 'N', 'EPAVES EMPILEES', RUST, 3); bar(1, 0, 'S', 'CAMION CITERNE', RUST, 4);
  bar(2, 0, 'N', 'CONVOI MILITAIRE', OLIVE, 3.5); bar(2, 0, 'S', 'ECHAFAUDAGE EFFONDRE', RUBBLE, 5);   // the street under the motorway
  bar(3, 0, 'E', 'IMMEUBLE EFFONDRE', RUBBLE, 10); bar(3, 0, 'S', 'BARGE ECHOUEE', RUST, 5);          // the boulevard is buried ahead: the route turns north into the flooded district
};
