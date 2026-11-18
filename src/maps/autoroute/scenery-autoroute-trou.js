// "autoroute", zone 4: La rue effondree (PK 1750 to 1877, row 2 heading west): at the foot of the fallen span every way is closed but row 2, and row 2 ends on a ledge (PK 1817):
// the street has fallen into the metro, the car drops 11 m in free fall (the flight physics of the jumps) and lands on the tracks, in a shaft open to the sky.
// Only what this zone adds, by the names of the blockout (real() in scenery-autoroute.js turns each into its scenery); put() and spot() are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).trou = ({ put, spot }) => {
  const RUBBLE = 0x7a756c, CONC = 0x8f8c82;
  spot('IMMEUBLE EFFONDRE', RUBBLE, 230, 222, 16, 9, 26); spot('TRAVEE EFFONDREE', CONC, 216, 240, 44, 6, 8);  // east and south of the crossroads (2, 2)
  for (const sd of [-1, 1]) put('DALLE CASSEE', CONC, 1809, sd, 1, 5, 1.2, 10, 2.7);                                 // the broken slab on both sides of the ledge
  for (const sd of [-1, 1]) { put('EBOULIS', RUBBLE, 1869, sd, 0.2, 2.6, 3.2, 44, -8.5); put('DALLE CASSEE', CONC, 1850 + 20 * sd, sd, 0.2, 2.6, 2, 9, -8.5); } // the street that fell in, heaped against both walls of the landing (the two tracks run under the lane here)
  spot('RUE BARREE', RUBBLE, 82, 220, 10, 7, 22, 2);                                                           // the street beyond the hole, buried: no way on at street level
};
