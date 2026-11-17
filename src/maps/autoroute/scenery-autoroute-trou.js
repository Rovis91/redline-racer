// "autoroute" blockout, zone 4: La rue effondree (PK 1773 to 1908, row 2 heading west): at the foot of the fallen span every way is closed but row 2, and row 2 ends on a ledge (PK 1848):
// the street has fallen into the metro, the car drops 11 m in free fall (the flight physics of the jumps) and lands on the tracks, in a shaft open to the sky.
// Only this zone's named blocks; put() and spot() are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).trou = ({ put, spot }) => {
  const RUBBLE = 0x7a756c, CONC = 0x8f8c82, TRAIN = 0x9aa4a0;
  spot('IMMEUBLE EFFONDRE', RUBBLE, 238, 222, 8, 9, 26); spot('TRAVEE EFFONDREE', CONC, 222, 240, 40, 6, 8);   // east and south of the crossroads (2, 2)
  for (const sd of [-1, 1]) put('DALLE CASSEE', CONC, 1840, sd, 1, 5, 1.2, 10);                                 // the broken slab on both sides of the ledge
  for (const sd of [-1, 1]) put('RAME', TRAIN, 1900, sd, 0.2, 2.6, 3.6, 44, -8.5);                             // the trains the street fell on, either side of the landing
  spot('RUE BARREE', RUBBLE, 82, 220, 10, 7, 22, 2);                                                           // the street beyond the hole, buried: no way on at street level
};
