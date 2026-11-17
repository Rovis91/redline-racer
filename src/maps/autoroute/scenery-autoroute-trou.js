// "autoroute" blockout, zone 4: La rue effondree (PK 1760 to 1908, row 2 heading west): at the foot of the fallen span every way is closed but row 2, and row 2 has fallen into the metro:
// the roadway slopes 11 m down into the hole and lands on the tracks. Only this zone's named blocks; put() and spot() are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).trou = ({ put, spot }) => {
  const RUBBLE = 0x7a756c, CONC = 0x8f8c82, RUST = 0x9a5a3a;
  spot('IMMEUBLE EFFONDRE', RUBBLE, 238, 222, 8, 9, 26); spot('TRAVEE EFFONDREE', CONC, 222, 240, 40, 6, 8);   // east and south of the crossroads (2, 2)
  for (const sd of [-1, 1]) put('DALLE EFFONDREE', CONC, 1850, sd, 1, 5, 1.2, 30);                              // the broken slabs on both rims of the hole
  put('EPAVE TOMBEE', RUST, 1880, -1, 0.5, 2.2, 1.6, 5);
  spot('RUE BARREE', RUBBLE, 62, 220, 10, 7, 22, 2);                                                           // the street above the tunnel mouth, buried
};
