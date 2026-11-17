// "autoroute" blockout, zone 2: Le quartier (PK 565 to 978): five street corners of 22 m radius, left, left, right, right, left; flooded from PK 600 to 800, dry up to the foot of the slip road.
// Only this zone's named blocks; put() is described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).quartier = ({ put }) => {
  const BRICK = 0x8a5a48, STONE = 0xa89a80, GREEN = 0x4f7a3c, TREE = 0x5a8a40, RUST = 0x9a5a3a, RUBBLE = 0x7a756c;
  // each corner (PK of its middle, side of its outside): the building that closes the street ahead, and the block inside the turn
  [[582, 1], [687, 1], [772, -1], [867, -1], [932, 1]].forEach(([pk, out], k) => { put("IMMEUBLE D'ANGLE", k % 2 ? STONE : BRICK, pk, out, 6, 26, 24, 44); put('ILOT', k % 2 ? BRICK : STONE, pk, -out, 8, 16, 16, 16); });
  // the straights between the corners
  for (const [pk, sd] of [[635, -1], [635, 1], [730, 1], [820, -1], [820, 1]]) put('IMMEUBLE', STONE, pk, sd, 8, 20, 20, 30);
  put('EPAVE', RUST, 610, 1, 1, 2.5, 1.6, 5); put('CAMION ABANDONNE', RUST, 730, -1, 1, 3, 3.5, 9); put('EPAVE', RUST, 890, 1, 1.5, 2.5, 1.6, 5);
  put('DECOMBRES', RUBBLE, 818, 1, 0.5, 8, 3, 10);
  for (const [pk, sd] of [[650, 1], [745, 1], [905, -1]]) put('ARBRE', TREE, pk, sd, 3, 6, 14, 6);
  put('VEGETATION', GREEN, 960, 1, 4, 10, 6, 30);                                                 // the foot of the slip road, overgrown
};
