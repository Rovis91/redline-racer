// "area51" blockout, zone 1: Pistes d'essai (runway A sprint, flat, 24 m wide; F1 = the right turn onto the east connector, then down to the apron). Only this zone's named blocks; put(), at() and mute() are described in scenery-area51.js.
// Bands from north to south, as on a real base: dry lake, runway B, runway A, taxiway (305 m from the runway axis), apron, then the hangar row of zone 2.
(window.AREA51 = window.AREA51 || {}).pistes = ({ put, at, mute, pk }) => {
  const TARMAC = 0x3a424a, WHITE = 0xe8e2d7, AMBER = 0xf5aa75, CONCRETE = 0xa39c84, WIRE = 0x708071, GLASS = 0x333f52, PLAYA = 0xe8d9b7, RED = 0xb5483c, STEEL = 0x52616e;
  at('LAC ASSECHE', PLAYA, 1825, -40, 1850, 0.6, 400, -0.5);                                 // the playa: the pale flat the runways are built on the edge of
  at('PISTE A', TARMAC, 1700, 342.5, 1200, 1.3, 51, -1.5); at('PISTE A', TARMAC, 1700, 417.5, 1200, 1.3, 51, -1.5); // two flush slabs either side of the race ribbon
  at('PISTE B', TARMAC, 1800, 220, 1100, 1.2, 30, -0.7);                                    // the parallel runway, 160 m to the left: for the plane, never for the race
  at('AVION', WHITE, 2040, 220, 165, 12, 16, 3); at('AILES', WHITE, 2050, 220, 20, 3, 130, 7); at('DERIVE', WHITE, 1968, 220, 22, 20, 3, 15);
  at('CLOTURE', WIRE, 1700, 290, 1100, 3, 1);                                               // safety barrier between the two runways
  at('TAXIWAY', TARMAC, 1700, 685, 1200, 1.3, 23, 0.3); at('TARMAC', TARMAC, 1845, 767, 890, 1.4, 105, 0.2); // the apron carries the race lane in front of the hangar doors
  at('TOUR DE CONTROLE', CONCRETE, 1500, 705, 14, 34, 14); at('VIGIE', GLASS, 1500, 705, 22, 7, 22, 35);   // mid-field, on the hangar line: it sees both thresholds and the apron
  at('CASERNE POMPIERS', RED, 1400, 775, 44, 9, 26);                                         // on the apron edge, a straight run from the taxiway
  for (let x = 1500, i = 0; x < 2290; x += 152, i++) { const m = at('MAT ECLAIRAGE', STEEL, x, 712, 2, 26, 2); if (i) mute(m); } // apron light masts, on its runway side
  [[2440, 820], [2490, 820], [2440, 875], [2490, 875]].forEach(([x, z], i) => { const c = at('CUVE CARBURANT', WHITE, x, z, 26, 10, 26); if (i) mute(c); }); // fuel farm: at the end of the apron, off the hangar line
  at('MERLON', CONCRETE, 2465, 780, 120, 4, 6);
  ['F1 300', 'F1 200', 'F1 100'].forEach((l, i) => { for (const sd of [-1, 1]) put(l, AMBER, pk(2170, 380) - 300 + i * 100, sd, 3, 4, 5, 0.5); }); // braking zone F1: announcing panels, off the roadway
  at('RADAR', WHITE, 2450, 440, 14, 22, 14);                                                // straight ahead at the braking point, outside the bend
};
