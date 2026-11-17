// "autoroute" blockout, zone 1: La rue desaffectee (PK 0 to 565, heading east): the start straight, three chicanes between the rubble, dry then flooded (PK 170 to 330) then dry, under the motorway bridge at PK 416.
// Only this zone's named blocks; put() is described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).rue = ({ put }) => {
  const BRICK = 0x8a5a48, STONE = 0xa89a80, GREEN = 0x4f7a3c, TREE = 0x5a8a40, RUST = 0x9a5a3a, BUS = 0xb8a050, RUBBLE = 0x7a756c;
  // two fronts of buildings 10 m behind the walls (pavement, wrecks, trees and water in between); none under the bridge
  for (let pk = 20, k = 0; pk <= 550; pk += 55, k++) if (pk < 385 || pk > 450) for (const sd of [-1, 1]) put('IMMEUBLE', (k + (sd > 0)) % 2 ? BRICK : STONE, pk, sd, 10, 22, 18 + 4 * ((k + sd + 3) % 3), 48);
  // each chicane has its reason: what blocks the old line, right behind the wall
  put('DECOMBRES', RUBBLE, 165, 1, 0.5, 9, 3.5, 26); put('EPAVE', RUST, 140, 1, 1, 2.5, 1.6, 5);                                  // PK 100-148: the road shifts left
  put('BUS RENVERSE', BUS, 285, -1, 0.5, 3.5, 3.2, 12); put('EPAVES ENCASTREES', RUST, 305, -1, 0.5, 8, 2, 10);                    // PK 208-264: it shifts right, in the water
  put('IMMEUBLE EFFONDRE', RUBBLE, 525, 1, 0.5, 9, 6, 30);                                                                        // PK 458-506: left again, after the bridge
  for (const [pk, sd] of [[60, -1], [230, 1], [360, -1], [480, -1]]) put('ARBRE', TREE, pk, sd, 3, 6, 15, 6);                      // trees grown through the pavement
  for (const [pk, sd] of [[95, -1], [330, 1], [470, 1]]) put('VEGETATION', GREEN, pk, sd, 7, 3, 9, 30);                            // ivy and bushes against the facades
  for (const [pk, sd] of [[45, 1], [200, -1], [250, 1], [380, 1]]) put('EPAVE', RUST, pk, sd, 1.5, 2.5, 1.6, 5);
};
