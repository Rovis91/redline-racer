// "autoroute" blockout, zone 1: Le boulevard (PK 0 to 613, row 0, heading east): 26 m between the kerbs, eight lanes of abandoned traffic (generated in scenery-autoroute-ville.js),
// seven crossroads, under the motorway at column 2. Only this zone's named blocks: what closes each side street; bar() is described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).boulevard = ({ bar }) => {
  const RUST = 0x9a5a3a, BUS = 0xb8a050, RUBBLE = 0x7a756c, OLIVE = 0x5a6240, TREE = 0x5a8a40;
  bar(-3, 0, 'N', 'BARRAGE MILITAIRE', OLIVE, 4); bar(-3, 0, 'W', 'IMMEUBLE EFFONDRE', RUBBLE, 9);
  bar(-2, 0, 'N', 'BUS RENVERSE', BUS, 3.2); bar(-2, 0, 'S', 'EPAVES EMPILEES', RUST, 3);
  bar(-1, 0, 'N', 'ARBRE TOMBE', TREE, 4); bar(-1, 0, 'S', 'BARRICADE', OLIVE, 3);
  bar(0, 0, 'N', 'CAMION CITERNE', RUST, 4); bar(0, 0, 'S', 'RUE AFFAISSEE', RUBBLE, 2);
  bar(1, 0, 'N', 'EPAVES EMPILEES', RUST, 3); bar(1, 0, 'S', 'BUS RENVERSE', BUS, 3.2);
  bar(2, 0, 'N', 'CONVOI MILITAIRE', OLIVE, 3.5); bar(2, 0, 'S', 'ECHAFAUDAGE EFFONDRE', RUBBLE, 5);   // the street under the motorway
  bar(3, 0, 'E', 'IMMEUBLE EFFONDRE', RUBBLE, 10); bar(3, 0, 'S', 'BARGE ECHOUEE', RUST, 5);          // the boulevard is buried ahead: the route turns north into the flooded district
};
