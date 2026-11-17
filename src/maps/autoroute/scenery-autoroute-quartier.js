// "autoroute" blockout, zone 2: Le quartier des entrepots (PK 635 to 1225): the low district by the river, water in every street not driven. Six crossroads, each with one arm open:
// column 3 north, row -1 east, column 4 north, row -2 west, column 3 north, row -3 west to the foot of the slip road. Only this zone's named blocks; bar() and spot() are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).quartier = ({ bar, spot }) => {
  const RUST = 0x9a5a3a, BUS = 0xb8a050, RUBBLE = 0x7a756c, OLIVE = 0x5a6240, TREE = 0x5a8a40;
  bar(3, -1, 'N', 'BUS RENVERSE', BUS, 3.2); bar(3, -1, 'W', 'EPAVES EMPILEES', RUST, 3);
  bar(4, -1, 'E', 'QUAI EFFONDRE', RUBBLE, 3); bar(4, -1, 'S', 'ARBRE TOMBE', TREE, 4);
  bar(4, -2, 'N', 'IMMEUBLE EFFONDRE', RUBBLE, 9); bar(4, -2, 'E', 'BARGE ECHOUEE', RUST, 5);
  bar(3, -2, 'W', 'BARRICADE', OLIVE, 3); bar(3, -2, 'S', 'CAMION RENVERSE', RUST, 3.6);
  bar(3, -3, 'N', 'EPAVES EMPILEES', RUST, 3); bar(3, -3, 'E', 'CAMION CITERNE', RUST, 4);
  // the foot of the slip road: row -3 is closed under the motorway, the only way on is up
  spot('BARRAGE MILITAIRE', OLIVE, 232, -330, 8, 4, 22); spot('BUS RENVERSE', BUS, 252, -348, 22, 3.2, 8);
};
