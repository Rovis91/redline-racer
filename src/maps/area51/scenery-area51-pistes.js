// "area51" blockout, zone 5: Pistes d'essai (from the main gate: controlled crossing of the west runway end, parallel taxiway, west connector, runway A sprint at 24 m wide, angled exit, tight right onto the apron).
// Only this zone's named blocks; the helpers are described in scenery-area51.js.
// Bands from north to south, as on a real base: dry lake, closed runway B, runway A, parallel taxiway (305 m from the runway axis), apron, then the hangar row. The race uses the airfield the way a landing aircraft does:
// taxiway, 90° connector, runway, angled exit back to the taxiway, apron. Nothing tall stands inside the runway strip (150 m either side of the axis): radars and aerials are beyond it.
(window.AREA51 = window.AREA51 || {}).pistes = ({ put, at, apex, mute, pk }) => {
  const TARMAC = 0x3a424a, WHITE = 0xe8e2d7, AMBER = 0xf5aa75, CONCRETE = 0xa39c84, GLASS = 0x333f52, PLAYA = 0xe8d9b7, RED = 0xb5483c, STEEL = 0x52616e, YELLOW = 0xf2c84a;
  at('LAC ASSECHE', PLAYA, 1825, -40, 1850, 0.6, 400, -0.5);                                 // the playa: the pale flat the runways are built on the edge of, and the emergency landing ground
  at('PISTE A', TARMAC, 1700, 342.5, 1200, 1.3, 51, -1.5); at('PISTE A', TARMAC, 1700, 417.5, 1200, 1.3, 51, -1.5); mute(at('PISTE A', TARMAC, 1700, 380, 1200, 1.3, 26, -1.55)); // runway A, 126 m wide, flush under the race ribbon
  [1140, 1200, 1260].forEach((x, i) => { const c = at('SEUIL DECALE', YELLOW, x, 380, 20, 0.2, 100, -0.25); if (i) mute(c); }); // displaced threshold: the west end, where the road crosses, is not landed on
  [980, 920, 860, 800].forEach((x, i) => { const c = at("RAMPE D'APPROCHE", YELLOW, x, 380, 2, 1.5, 30); if (i) mute(c); }); // approach light bars in the runway axis, west of the crossing
  for (const [x, z] of [[1040, 300], [1040, 465]]) put('BARRIERE', RED, pk(x, z), 1, 2, 2, 3, 2); // the crossing is controlled: a barrier arm before and after the runway axis
  at('PISTE B', TARMAC, 1800, 220, 1100, 1.2, 30, -0.7);                                    // the old parallel runway, too close to A to be used with it: closed
  for (const x of [1300, 2300]) at('PISTE FERMEE', YELLOW, x, 220, 30, 0.4, 30, 0.45);
  at('AIRE DE STATIONNEMENT', TARMAC, 2040, 130, 90, 0.8, 80, -0.3); at('AVION', WHITE, 2040, 130, 60, 7, 8, 3); at('AILES', WHITE, 2045, 130, 10, 2, 54, 5); at('DERIVE', WHITE, 2014, 130, 10, 11, 2, 10); // the plane, on a hardstand at the lake edge, clear of both strips
  at('TAXIWAY', TARMAC, 1700, 685, 1200, 1.3, 23, -0.6); at('TARMAC', TARMAC, 1845, 767, 890, 1.4, 105, 0.4); // the apron carries the start line, in front of the hangar doors
  at('TOUR DE CONTROLE', CONCRETE, 1480, 800, 14, 34, 14); at('VIGIE', GLASS, 1480, 800, 22, 7, 22, 37);   // mid-field, on the hangar line: it sees both thresholds and the apron
  at('CASERNE POMPIERS', RED, 1400, 775, 44, 9, 26);                                         // on the apron edge, a straight run to the taxiway
  for (let x = 1500, i = 0; x < 2290; x += 152, i++) { const m = at('MAT ECLAIRAGE', STEEL, x, 712, 2, 26, 2); if (i) mute(m); } // apron light masts, on its runway side
  [[2440, 820], [2490, 820], [2440, 875], [2490, 875]].forEach(([x, z], i) => { const c = at('CUVE CARBURANT', WHITE, x, z, 26, 10, 26); if (i) mute(c); }); // fuel farm: at the end of the apron, off the hangar line
  at('MERLON', CONCRETE, 2465, 780, 120, 4, 6); at('PORTE DE SERVICE EST', CONCRETE, 2570, 760, 20, 5, 6); // tankers come in by their own gate: they never cross the flight line
  at('RADAR APPROCHE', WHITE, 2050, 570, 8, 10, 8); mute(at('RADAR APPROCHE', WHITE, 1450, 570, 8, 10, 8)); at('GLIDE', AMBER, 1380, 545, 4, 12, 4); // 190 m off the axis, one per landing direction
  // what the road goes round on the airfield: the localizer aerial at the taxiway end, the windsock at the angled exit, the blast fence of the fuel-truck stand at the last right
  apex('ANTENNE LOCALIZER', AMBER, pk(1065, 625), 20, 4, 3, 8); apex('MANCHE A AIR', AMBER, pk(1960, 392), 2, 8, 2, 8); apex('PARE-SOUFFLE', CONCRETE, pk(2285, 715), 3, 4, 30, 6);
  ['F1 300', 'F1 200', 'F1 100'].forEach((l, i) => { for (const sd of [-1, 1]) put(l, AMBER, pk(2250, 660) - 300 + i * 100, sd, 3, 4, 5, 0.5); }); // braking zone F1, down the exit: announcing panels, off the roadway
};
