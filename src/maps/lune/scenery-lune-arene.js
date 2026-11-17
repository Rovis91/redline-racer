// "lune" blockout, zone 4: Grand cratère oriental (PK 1720 to 2850): the jump from the rim (66 m) to the floor (-30 m), the arena (300 m wide between its rails, PK 1880 to 2440, small craters = M.dents),
// the funnel to the airlock and the exit tunnel under the rampart (PK 2650 to 2850, M.tun). The crater (Ø 900 m) is terrain. Only this zone's named blocks; put(), lat() and far() are described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).arene = ({ put, lat, far }) => {
  const DARK = 0x273443, SLATE = 0x526d82, IVORY = 0xe4e3d9, ORANGE = 0xff9a3c;
  // guidance to the only way out: two rows of orange beacons that close in on the road from the middle of the arena to the airlock
  for (let pk = 2200; pk <= 2600; pk += 50) for (const sd of [-1, 1]) lat('BALISE', ORANGE, pk, sd * (16 + (2620 - pk) * 0.2), 2, 9, 2);
  for (const sd of [-1, 1]) { put('SAS ENTRÉE', ORANGE, 2640, sd, 2, 6, 13, 6); put('SAS SORTIE', ORANGE, 2862, sd, 2, 6, 13, 6); } // fixed airlocks: an orange post each side of both portals
  put('PHARE DU SAS', ORANGE, 2690, -1, 16, 5, 50, 5);                                                                           // the mast above the portal: seen from the landing, across the whole floor
  for (const [x, z] of [[850, -200], [690, -520], [690, 120], [250, -520]]) far('STRATES', DARK, x, z, 110, 9, 40);             // dark strata on the crater wall
  far('STATION SCIENTIFIQUE', IVORY, 925, -200, 30, 11, 20); far('COUPOLE', SLATE, 925, -235, 12, 20, 12);                      // the study station, on the eastern rim, off the loop
};
