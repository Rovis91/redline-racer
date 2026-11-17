// "area51" blockout, zone 5: Pistes d'essai (from the main gate: round the west overrun, parallel taxiway, west connector, runway A sprint at 24 m wide, 45° high-speed exit, tight right onto the apron). Only this zone's named blocks; the helpers are described in scenery-area51.js.
// Bands from north to south, as on a real base: dry lake, runway B, runway A, parallel taxiway (305 m from the runway axis), apron, then the hangar row. The race uses the airfield the way an aircraft does:
// taxiway, 90° connector at the threshold end, runway, angled exit back to the taxiway, apron.
(window.AREA51 = window.AREA51 || {}).pistes = ({ put, at, mute, pk }) => {
  const TARMAC = 0x3a424a, WHITE = 0xe8e2d7, AMBER = 0xf5aa75, CONCRETE = 0xa39c84, WIRE = 0x708071, GLASS = 0x333f52, PLAYA = 0xe8d9b7, RED = 0xb5483c, STEEL = 0x52616e;
  at('LAC ASSECHE', PLAYA, 1825, -40, 1850, 0.6, 400, -0.5);                                 // the playa: the pale flat the runways are built on the edge of
  at('PISTE A', TARMAC, 1700, 342.5, 1200, 1.3, 51, -1.5); at('PISTE A', TARMAC, 1700, 417.5, 1200, 1.3, 51, -1.5); mute(at('PISTE A', TARMAC, 1700, 380, 1200, 1.3, 26, -1.55)); // runway A, 126 m wide, flush under the race ribbon
  at('PISTE B', TARMAC, 1800, 220, 1100, 1.2, 30, -0.7);                                    // the parallel runway, 160 m further onto the lake: for the plane, never for the race
  at('AVION', WHITE, 2040, 220, 165, 12, 16, 3); at('AILES', WHITE, 2050, 220, 20, 3, 130, 7); at('DERIVE', WHITE, 1968, 220, 22, 20, 3, 15);
  at('CLOTURE', WIRE, 1700, 290, 1100, 3, 1);                                               // safety barrier between the two runways
  at('TAXIWAY', TARMAC, 1700, 685, 1200, 1.3, 23, -0.6); at('TARMAC', TARMAC, 1845, 767, 890, 1.4, 105, 0.4); // the apron carries the start line, in front of the hangar doors
  at('TOUR DE CONTROLE', CONCRETE, 1480, 800, 14, 34, 14); at('VIGIE', GLASS, 1480, 800, 22, 7, 22, 37);   // mid-field, on the hangar line: it sees both thresholds and the apron
  at('CASERNE POMPIERS', RED, 1400, 775, 44, 9, 26);                                         // on the apron edge, a straight run to the taxiway
  for (let x = 1500, i = 0; x < 2290; x += 152, i++) { const m = at('MAT ECLAIRAGE', STEEL, x, 712, 2, 26, 2); if (i) mute(m); } // apron light masts, on its runway side
  [[2440, 820], [2490, 820], [2440, 875], [2490, 875]].forEach(([x, z], i) => { const c = at('CUVE CARBURANT', WHITE, x, z, 26, 10, 26); if (i) mute(c); }); // fuel farm: at the end of the apron, off the hangar line
  at('MERLON', CONCRETE, 2465, 780, 120, 4, 6);
  ['F1 300', 'F1 200', 'F1 100'].forEach((l, i) => { for (const sd of [-1, 1]) put(l, AMBER, pk(2250, 660) - 300 + i * 100, sd, 3, 4, 5, 0.5); }); // braking zone F1, down the high-speed exit: announcing panels, off the roadway
  at('RADAR APPROCHE', WHITE, 2400, 300, 14, 22, 14);                                       // at the east threshold
};
